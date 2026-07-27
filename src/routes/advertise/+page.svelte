<script>
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { evaluateDiscount, discountAmount, DEFAULT_DISCOUNT_CODES } from "$lib/discountCodes.js";
    // הקוד עצמו לא מוצג בשום מקום בדף - מי שמזין אותו בשדה ההנחה עדיין מקבל פטור.
    import { FREE_PROMO, FREE_PROMO_DISCOUNT } from "$lib/freePromo.js";
    import { adPlans } from "$lib/adPlans.js";

    // דף הפרסום והמחשבון - הועתק מאתר "קהילה בשכונה" והותאם לקבוצות רכישה:
    // אתר אחד, בלי בחירת עיר/שכונה - מחיר אחיד לכל סוג פרסום.

    let { data } = $props();

    const PAY_WA_NUMBER = "972508750632";
    const CONTACT_EMAIL = "freedomhasbegun@gmail.com";

    // ---- פרסומת אחת בלבד באתר — אותה מודעה בשני המסכים (כרטיסי מידע) ----
    const packages = [
        {
            name: "בדסקטופ - הטור הימני",
            icon: "🖥️",
            location: "עמודה קבועה בצד ימין של האתר, בכל העמודים",
            features: ["חשיפה גבוהה בכל עמוד", "כרטיס עם תמונה וטקסט בריחוף", "דף נחיתה אישי באתר"],
        },
        {
            name: "בנייד - 5 שניות אחרי לחיצה על פריט",
            icon: "📱",
            location: "אותה פרסומת, במסך מלא",
            features: ["מסך מלא למשך 5 שניות", "מוצגת בדיוק כשהגולש ממוקד", "קישור ישיר לעסק שלך"],
        },
    ];

    // ---- טבלת המחירים - מסלול אחד לפרסומת האחת (דסקטופ + נייד),
    // לפי תקופה, בתשלום מראש. המקור: $lib/adPlans.js, משותף לכל אתרי הרשת. ----
    const ROW_META = {
        7:   { icon: "⚡",  details: "טעימה קצרה - מתאים למבצע או אירוע נקודתי" },
        30:  { icon: "📅",  details: "החודש הקלאסי - דסקטופ ונייד יחד" },
        90:  { icon: "🗓️", details: "שלושה חודשים - נוכחות רציפה לאורך עונה" },
        180: { icon: "🌗",  details: "חצי שנה - הכי משתלם לעסק שרוצה קביעות" },
        365: { icon: "🏆",  details: "שנה מלאה - המחיר הנמוך ביותר ליום פרסום" },
    };
    const rows = adPlans.map((plan, i) => ({
        num: i + 1,
        days: plan.days,
        type: plan.title,
        price: plan.price,
        icon: ROW_META[/** @type {keyof typeof ROW_META} */ (plan.days)]?.icon ?? "📢",
        details: ROW_META[/** @type {keyof typeof ROW_META} */ (plan.days)]?.details ?? "",
    }));

    // ---- מדריך מובנה: הבהוב מספר השלב ואצבע מכוונת ----
    let tutorialStep = $state(/** @type {'pick-row' | 'done'} */ ("pick-row"));
    /** @type {number | null} */
    let highlightedRow = $state(null);
    /** @type {number | null} */
    let confirmingRow = $state(null);
    /** @type {HTMLDivElement | null} */
    let calculatorEl = $state(null);
    let flashTotal = $state(false);

    /** @param {number} n */
    function fmt(n) {
        return n.toLocaleString("en-US");
    }

    // ---- מצב המחשבון: מסלול אחד נבחר (או כלום) ----
    /** @type {number | null} */
    let selectedNum = $state(null);

    /** @param {number} num */
    function selectRow(num) {
        highlightedRow = num;
        if (selectedNum === num) {
            selectedNum = null; // לחיצה על המסלול הפעיל = ביטול
            return;
        }
        selectedNum = num;
        if (tutorialStep !== "done") tutorialStep = "done";

        // אישור ויזואלי: וי קופץ, ואז גלילה איטית אל המחשבון והבהוב הסכום
        confirmingRow = num;
        setTimeout(() => {
            confirmingRow = null;
            slowScrollTo(calculatorEl, 2000);
            setTimeout(() => {
                flashTotal = true;
                setTimeout(() => (flashTotal = false), 1500);
            }, 2000);
        }, 700);
    }

    // גלילה איטית מותאמת - ה-smooth של הדפדפן קצר מדי לזרימה הזו
    /**
     * @param {HTMLElement | null} el
     * @param {number} duration
     */
    function slowScrollTo(el, duration) {
        if (!el || !browser) return;
        const startY = window.scrollY;
        const header = document.querySelector("header");
        const headerOffset = header ? header.offsetHeight + 16 : 16;
        const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        const distance = targetY - startY;
        if (Math.abs(distance) < 4) return;
        const startTime = performance.now();
        /** @param {number} t */
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        /** @param {number} now */
        function step(now) {
            const elapsed = now - startTime;
            const t = Math.min(1, elapsed / duration);
            window.scrollTo(0, startY + distance * ease(t));
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    let selectedRow = $derived(rows.find((r) => r.num === selectedNum) ?? null);
    // נשמר כמערך כדי לא לשנות את חוזה הסיכום/המייל (selectedItems)
    let selectedItems = $derived(selectedRow ? [{ ...selectedRow, eTotal: selectedRow.price }] : []);

    let totalPayment = $derived(selectedRow?.price ?? 0);
    let hasSelection = $derived(!!selectedRow);

    // ---- קוד הנחה (כולל קוד מבצע ההשקה) ----
    const discountCodes = [
        ...DEFAULT_DISCOUNT_CODES,
        ...(FREE_PROMO ? [FREE_PROMO_DISCOUNT] : []),
    ];
    let discountInput = $state("");
    let discountEval = $derived(evaluateDiscount(discountInput, discountCodes));
    let discountValue = $derived(
        discountEval.applied && discountEval.matched ? discountAmount(totalPayment, discountEval.matched) : 0,
    );
    let effectiveTotal = $derived(Math.max(0, totalPayment - discountValue));
    let isFreeExempt = $derived(discountEval.applied && discountEval.matched?.kind === "free");
    let discountLabelText = $derived(discountEval.matched?.label ?? "");

    // שחרור הגישה ל-builder ומעבר אליו - לפטור מלא (העלאת פרסום ללא תשלום)
    function uploadFree() {
        if (!browser) return;
        try {
            localStorage.setItem("ad_paid", "1");
            localStorage.setItem("ad_paid_at", new Date().toISOString());
        } catch { /* ignore */ }
        goto("/advertise/builder");
    }

    // ---- אישור הזמנה במייל / וואטסאפ ----
    let userEmail = $state(data?.user?.email ?? "");
    let userPhone = $state("");
    let emailSending = $state(false);
    let emailSent = $state(false);
    let emailError = $state("");

    async function sendOrderEmail() {
        if (!userEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
            emailError = "נא להזין כתובת אימייל תקינה";
            return;
        }
        emailError = "";
        emailSending = true;
        try {
            const res = await fetch("/api/send-order-email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: userEmail,
                    selectedItems,
                    totalPayment: effectiveTotal,
                    discountLabel: discountValue > 0 ? discountLabelText : "",
                    discountValue,
                }),
            });
            const out = await res.json();
            if (out.success) {
                emailSent = true;
            } else {
                emailError = out.message || "שגיאה בשליחה - נסו שוב";
            }
        } catch {
            emailError = "שגיאת רשת - נסו שוב";
        } finally {
            emailSending = false;
        }
    }

    let whatsappHref = $derived.by(() => {
        const types = selectedItems.map((r) => r.type).join(", ");
        let msg = `שלום, אני מעוניין לפרסם באתר קבוצות הרכישה: ${types}. סה"כ ₪${fmt(effectiveTotal)}.`;
        if (discountValue > 0) msg += `\nהנחה (${discountLabelText}): -₪${fmt(discountValue)}`;
        if (userPhone.trim()) msg += `\nהטלפון שלי: ${userPhone.trim()}`;
        return `https://wa.me/${PAY_WA_NUMBER}?text=${encodeURIComponent(msg)}`;
    });

    // ---- תקופת הפרסום: יום עריכה חינם + חודש מלא ----
    let confirmedPeriod = $state(false);
    let today = new Date();
    /**
     * @param {Date} d
     * @param {number} n
     */
    function addDays(d, n) {
        const r = new Date(d);
        r.setDate(r.getDate() + n);
        return r;
    }
    // אורך התקופה = הימים של המסלול שנבחר (הפרסום מתחיל אחרי יום העריכה)
    let periodDays = $derived(selectedRow?.days ?? 0);
    let periodLabel = $derived(selectedRow?.type.replace(/^פרסום ל/, "") ?? "");
    let expirationDate = $derived(addDays(today, periodDays));
    /** @param {Date} d */
    function fmtDate(d) {
        return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    /** @param {Date} d */
    function fmtMonthName(d) {
        return d.toLocaleDateString("he-IL", { month: "long", year: "numeric" });
    }
    /** @param {Date} anchor */
    function buildCalendar(anchor) {
        const firstOfMonth = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const startDow = firstOfMonth.getDay();
        const start = new Date(firstOfMonth);
        start.setDate(1 - startDow);
        const cells = [];
        for (let i = 0; i < 42; i++) {
            const c = new Date(start);
            c.setDate(start.getDate() + i);
            cells.push(c);
        }
        return cells;
    }
    /**
     * @param {Date} a
     * @param {Date} b
     */
    function sameDay(a, b) {
        return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    }

    const dows = ["א", "ב", "ג", "ד", "ה", "ו", "ש"];
</script>

<svelte:head>
    <title>פרסום באתר | רכישות קבוצתיות יוצאים לחירות</title>
</svelte:head>

<div class="advertise-page" dir="rtl">

    <!-- כותרת -->
    <div class="ap-hero">
        <div class="ap-hero-icon">📢</div>
        <h1 class="ap-hero-title">פרסם באתר קבוצות הרכישה</h1>
        <p class="ap-hero-sub">
            היחשף לקהל של אלפי חברי קבוצות הרכישה - קהל צרכני, ממוקד ומעורב
        </p>
    </div>

    <!-- איפה הפרסומת (האחת) מופיעה -->
    <h2 class="ap-section-title">איפה הפרסומת מופיעה</h2>
    <div class="ap-packages">
        {#each packages as pkg}
            <div class="ap-package">
                <div class="ap-package-icon">{pkg.icon}</div>
                <h3 class="ap-package-name">{pkg.name}</h3>
                <p class="ap-package-loc">{pkg.location}</p>
                <ul class="ap-package-features">
                    {#each pkg.features as feature}
                        <li><span class="ap-check">✓</span> {feature}</li>
                    {/each}
                </ul>
            </div>
        {/each}
    </div>

    <!-- מחירון -->
    <h2 class="ap-section-title big">מחירון</h2>

    <p class="ap-price-intro">
        פרסומת אחת באתר — בדסקטופ בטור הימני ובנייד אחרי לחיצה על פריט. בוחרים תקופה, ומשלמים מראש.
    </p>

    <div class="ap-steps-row">
        <p class="ap-step-label">
            <span class="ap-step-num">1</span>
            לבחור ולשלם מראש
            {#if tutorialStep === "pick-row"}
                <span class="tutorial-finger" aria-hidden="true">👇</span>
            {/if}
        </p>
        <p class="ap-step-label">
            <a href="/advertise/terms" class="ap-terms-link">📜 תנאי הפרסום</a>
            — לקריאה לפני התשלום
        </p>
    </div>

    <!-- כרטיסי מחיר (מובייל) + טבלה (מחשב) - כאן ממומש כרשימת כרטיסים רספונסיבית -->
    <div class="ap-rows">
        {#each rows as row}
            {@const chosen = selectedNum === row.num}
            {@const highlighted = !chosen && highlightedRow === row.num}
            <div
                role="button"
                tabindex="0"
                onclick={() => selectRow(row.num)}
                onkeydown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        selectRow(row.num);
                    }
                }}
                class="ap-row"
                class:plan-chosen={chosen}
                class:highlighted
                class:selected={chosen && confirmingRow !== row.num}
            >
                {#if confirmingRow === row.num}
                    <span class="confirm-check-pop" aria-hidden="true"><span>✓</span></span>
                {/if}

                <div class="ap-row-head">
                    <div class="ap-row-title">
                        <span class="ap-row-num">#{row.num}</span>
                        <span class="ap-row-icon">{row.icon}</span>
                        <span class="ap-row-name">{row.type}</span>
                    </div>

                    <span class="ap-row-pick" class:on={chosen}>{chosen ? "✓ נבחר" : "בחר"}</span>
                </div>

                <div class="ap-row-prices">
                    <div class="ap-price-block">
                        <span class="ap-price-half">₪{fmt(row.price)}</span>
                        <span class="ap-price-label">ל-{row.days} ימי פרסום, מראש</span>
                    </div>
                </div>

                <p class="ap-row-details">{row.details}</p>
            </div>
        {/each}
    </div>

    <!-- ===== מחשבון וסיכום ===== -->
    {#if hasSelection}
        <div bind:this={calculatorEl} class="ap-calc">
            <div class="ap-calc-head">
                <span class="ap-calc-emoji">🧮</span>
                <h2 class="ap-calc-title">מחשבון וסיכום</h2>
                <span class="ap-calc-badge">המסלול שנבחר</span>
            </div>

            <!-- פירוט המסלול שנבחר -->
            <div class="ap-calc-list">
                <div class="ap-calc-list-head">
                    <p>המסלול שנבחר</p>
                </div>
                <ul>
                    {#each selectedItems as item}
                        <li>
                            <div class="ap-item-right">
                                <button
                                    type="button"
                                    onclick={() => (selectedNum = null)}
                                    class="ap-item-remove"
                                    aria-label="הסר"
                                >✕</button>
                                <span class="ap-item-name half">{item.type}</span>
                            </div>
                            <div class="ap-item-left">
                                <span class="ap-item-plan half">{item.days} ימים</span>
                                <span class="ap-item-duration">תשלום מראש</span>
                                <span class="ap-item-price half">₪{fmt(item.eTotal)}</span>
                            </div>
                        </li>
                    {/each}
                </ul>
            </div>

            <!-- סה"כ + אישור הזמנה -->
            <div class="ap-total-box">
                <div class="ap-total-side">
                    <div class="ap-total-math">
                        {#each selectedItems as item}
                            <p>
                                <span class="t-half">{item.type}:</span>
                                <span class="gray">{item.days} ימים, דסקטופ ונייד</span>
                                <span class="gray">=</span>
                                <span class="bold t-half">₪{fmt(item.eTotal)}</span>
                            </p>
                        {/each}
                    </div>
                    <div class="ap-total-amount-row">
                        {#if discountValue > 0}
                            <span class="ap-total-strike">₪{fmt(totalPayment)}</span>
                        {/if}
                        <p class="ap-total-amount" class:green={discountValue > 0} class:total-flash={flashTotal}>
                            ₪{fmt(effectiveTotal)}
                        </p>
                        {#if isFreeExempt}
                            <span class="ap-total-tag">🎉 {discountLabelText || "פטור מלא מתשלום"}</span>
                        {:else if discountValue > 0}
                            <span class="ap-total-tag">{discountLabelText} · חסכת ₪{fmt(discountValue)}</span>
                        {:else}
                            <span class="ap-total-note">ניתן לפרוס לתשלומים</span>
                        {/if}
                    </div>
                </div>

                <!-- שלב 3: אישור הזמנה -->
                {#if emailSent}
                    <div class="ap-email-success">
                        <div class="big-emoji">✅</div>
                        <p class="s-title">המייל נשלח בהצלחה!</p>
                        <p class="s-sub">שלחנו אישור הזמנה לכתובת <span>{userEmail}</span></p>
                        <p class="s-note">ניצור איתך קשר בהקדם לתיאום הסופי</p>
                    </div>
                {:else}
                    <div class="ap-email-box">
                        <p class="ap-email-label">
                            <span class="ap-step-num">3</span>
                            📧 קבל אישור הזמנה - מייל / וואטסאפ
                        </p>
                        <div class="ap-email-grid">
                            <input type="tel" bind:value={userPhone} placeholder="050-1234567" dir="ltr" class="ap-input" />
                            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" class="ap-btn wa">
                                💬 שלח בוואטסאפ
                            </a>
                        </div>
                        <div class="ap-email-grid">
                            <input
                                type="email"
                                bind:value={userEmail}
                                placeholder="your@email.com"
                                dir="ltr"
                                class="ap-input"
                                onkeydown={(e) => {
                                    if (e.key === "Enter") sendOrderEmail();
                                }}
                            />
                            <button type="button" onclick={sendOrderEmail} disabled={emailSending} class="ap-btn amber" class:disabled={emailSending}>
                                {emailSending ? "שולח..." : `✉️ שלח תיעוד - ₪${fmt(effectiveTotal)}`}
                            </button>
                        </div>
                        {#if emailError}
                            <p class="ap-email-error">{emailError}</p>
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <div class="ap-empty-calc">
            <p>🧮 בחר את תקופת הפרסום כדי לראות את <strong>סיכום המחיר!</strong></p>
        </div>
    {/if}

    <!-- ===== שלב 4: תקופת הפרסום ותאריך התפוגה ===== -->
    {#if hasSelection}
        <div class="ap-period">
            <h2 class="ap-period-title">
                <span class="ap-step-num">4</span>
                📅 תקופת הפרסום ותאריך התפוגה
            </h2>

            <div class="ap-period-gift">
                <p class="g-title">🎁 יום העריכה - חינם על חשבון המערכת</p>
                <ul>
                    <li>היום, <strong>{fmtDate(today)}</strong>, הוא יום העריכה החינמית - לא נספר בתקופת הפרסום.</li>
                    <li>הפרסומת תרוץ <strong>{periodDays} ימים מלאים</strong> - עד <strong>{fmtDate(expirationDate)} כולל</strong>.</li>
                    <li>תקופת העריכה החינמית נגמרת היום ב-<strong>23:59</strong>. כדאי לסיים את העריכה לפני זה!</li>
                </ul>
            </div>

            <!-- לוח שנה דו-חודשי עם סימונים -->
            <div class="ap-calendars">
                {#each [today, expirationDate] as anchor}
                    {@const cells = buildCalendar(anchor)}
                    <div class="ap-calendar">
                        <p class="cal-month">{fmtMonthName(anchor)}</p>
                        <div class="cal-dows">
                            {#each dows as d}
                                <div>{d}</div>
                            {/each}
                        </div>
                        <div class="cal-grid">
                            {#each cells as cell}
                                {@const inMonth = cell.getMonth() === anchor.getMonth()}
                                {@const isToday = sameDay(cell, today)}
                                {@const isExpiry = sameDay(cell, expirationDate)}
                                <div class="cal-cell" class:out={!inMonth} class:today={isToday} class:expiry={isExpiry && !isToday}>
                                    {cell.getDate()}
                                </div>
                            {/each}
                        </div>
                    </div>
                {/each}
            </div>

            <div class="ap-cal-legend">
                <span><span class="dot amber"></span> היום - יום עריכה חינם</span>
                <span><span class="dot red"></span> תאריך תפוגת הפרסומת</span>
            </div>

            <label class="ap-period-confirm">
                <input type="checkbox" bind:checked={confirmedPeriod} />
                <div>
                    <p class="c-main">הבנתי את אורך התקופה ({periodLabel}) ואת תאריך התפוגה</p>
                    <p class="c-sub">
                        היום ({fmtDate(today)}) הוא יום עריכה חינם, והפרסום ירוץ עד
                        <span>{fmtDate(expirationDate)} כולל</span>.
                    </p>
                </div>
            </label>
        </div>
    {/if}

    <!-- ===== שלב 5: תשלום מאובטח ===== -->
    <div class="ap-payment" class:locked={hasSelection && !confirmedPeriod}>
        <h2 class="ap-period-title center">
            <span class="ap-step-num">5</span>
            🔒 תשלום מאובטח
        </h2>
        {#if hasSelection && !confirmedPeriod}
            <p class="ap-payment-lock-note">⬆️ סמן/י תחילה את התיבה למעלה (שלב 4) כדי לפתוח את התשלום</p>
        {/if}
        <p class="ap-payment-sub">התשלום מתבצע בצורה מאובטחת - פרטי האשראי שלך לא מגיעים אלינו</p>

        <!-- קוד הנחה -->
        <div class="ap-discount">
            <label for="discount-code">🎟️ קוד הנחה</label>
            <p class="d-have">יש לך קוד הנחה? הזן אותו כאן</p>
            <input id="discount-code" type="text" bind:value={discountInput} placeholder="הקלד קוד הנחה..." dir="rtl" class="ap-input full" />
            {#if discountInput.trim()}
                {#if discountEval.applied && discountEval.matched}
                    <p class="d-msg ok">
                        {#if isFreeExempt}
                            ✅ הקוד התקבל: {discountEval.matched.label} - הפרסום ללא עלות!
                        {:else}
                            ✅ ההנחה הופעלה: {discountEval.matched.label} ({discountEval.matched.percent}%) · חסכת ₪{fmt(discountValue)}
                        {/if}
                    </p>
                {:else if discountEval.reason === "inactive"}
                    <p class="d-msg off">הקוד אינו פעיל כרגע</p>
                {:else}
                    <p class="d-msg unknown">הקוד שהוזן אינו מזוהה.</p>
                {/if}
            {/if}
        </div>

        {#if isFreeExempt}
            <!-- פטור מלא - העלאת הפרסום ללא עלות -->
            <div class="ap-free-box">
                <div class="big-emoji">🎉</div>
                <h3>{discountLabelText || "פטור מלא מתשלום"}</h3>
                <p>הקוד התקבל - אפשר להעלות את הפרסום ללא כל עלות.</p>
                <button type="button" onclick={uploadFree} class="ap-btn green big">
                    🎨 להעלות את הפרסום בחינם
                </button>
            </div>
        {:else}
            <div class="ap-pay-methods">
                {#each ["Visa", "Mastercard", "American Express", "Bit", "PayPal"] as method}
                    <div class="ap-pay-chip">{method}</div>
                {/each}
            </div>

            <div class="ap-pay-box">
                <div class="big-emoji">💳</div>
                <h3>סליקה מאובטחת</h3>
                <p class="p-sub">תשלום בכרטיס אשראי, ביט או PayPal</p>

                <p class="ap-pay-soon">
                    <span>🚧</span>
                    <span>
                        הסליקה באתר עדיין לא מחוברת - לסיום ההזמנה ולתשלום, צור קשר בוואטסאפ:
                        <a
                            href="https://wa.me/{PAY_WA_NUMBER}?text={encodeURIComponent(`שלום, ברצוני לשלם על פרסום באתר קבוצות הרכישה - ₪${fmt(effectiveTotal)}`)}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >050-875-0632 💬</a>
                    </span>
                </p>

                <div class="ap-pay-actions">
                    <a
                        href="https://wa.me/{PAY_WA_NUMBER}?text={encodeURIComponent(`שלום, ברצוני לשלם על פרסום באתר קבוצות הרכישה - ₪${fmt(effectiveTotal)}${selectedItems.length > 0 ? ` (${selectedItems.map((r) => r.type).join(', ')})` : ''}`)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="ap-btn purple"
                    >💬 לתשלום ותיאום בוואטסאפ</a>
                    <a href="/advertise/builder" class="ap-btn green">🎨 לעיצוב הפרסומת - בלי תשלום מראש</a>
                </div>

                <div class="ap-after-pay">
                    <p class="a-title">🎨 קודם מעצבים - התשלום בשלב השליחה</p>
                    <ul>
                        <li>נכנסים ל<a href="/advertise/builder">בונה הפרסומות</a> ומעצבים את המודעה שלכם צעד-צעד - פתוח לכולם.</li>
                        <li>בשלב השליחה בוחרים את תקופת הפרסום ומתאמים את התשלום.</li>
                        <li>הטיוטה <strong>נשמרת אוטומטית</strong> בדפדפן - אפשר לצאת ולחזור מתי שרוצים.</li>
                    </ul>
                </div>
            </div>
        {/if}

        <div class="ap-badges">
            {#each [
                { icon: "🔒", label: "SSL מאובטח" },
                { icon: "✅", label: "PCI DSS תקן" },
                { icon: "🏦", label: "בנק ישראל מורשה" },
                { icon: "↩️", label: "החזר כספי תוך 14 יום" },
            ] as badge}
                <div class="ap-badge"><span>{badge.icon}</span><span>{badge.label}</span></div>
            {/each}
        </div>
    </div>

    <!-- יצירת קשר -->
    <div class="ap-contact">
        <h2>ליצירת קשר אנושי</h2>
        <div class="ap-contact-btns">
            <a href="mailto:{CONTACT_EMAIL}" class="ap-btn amber">✉️ שלחו לנו מייל</a>
            <a href="https://wa.me/{PAY_WA_NUMBER}" target="_blank" rel="noopener noreferrer" class="ap-btn wa">💬 וואטסאפ</a>
        </div>
        <p class="ap-contact-mail">{CONTACT_EMAIL}</p>
    </div>
</div>

<style>
    .advertise-page {
        max-width: 56rem;
        margin: 0 auto;
        padding: 1rem 1rem 3rem;
    }

    /* ---- כותרת ---- */
    .ap-hero {
        text-align: center;
        margin-bottom: 3rem;
    }
    .ap-hero-icon {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    .ap-hero-title {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 0 0 1rem;
        background: linear-gradient(to right, #fbbf24, #fde047, #fbbf24);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .ap-hero-sub {
        color: #d1d5db;
        font-size: 1.15rem;
        max-width: 42rem;
        margin: 0 auto;
        line-height: 1.6;
    }

    /* ---- כותרות סקציה ---- */
    .ap-section-title {
        font-size: 1.4rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 1rem;
        text-align: center;
    }
    .ap-section-title.big {
        font-size: 2rem;
        margin: 2.5rem 0 1.5rem;
    }

    /* ---- חבילות ---- */
    .ap-packages {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        margin-bottom: 2rem;
    }
    @media (max-width: 768px) {
        .ap-packages {
            grid-template-columns: 1fr;
        }
    }
    .ap-package {
        border-radius: 1rem;
        border: 1px solid rgba(251, 191, 36, 0.3);
        background: rgba(251, 191, 36, 0.05);
        padding: 1.25rem;
    }
    .ap-package-icon {
        font-size: 1.75rem;
        margin-bottom: 0.5rem;
    }
    .ap-package-name {
        font-size: 1.1rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 0.4rem;
    }
    .ap-package-loc {
        font-size: 0.85rem;
        color: #9ca3af;
        margin: 0 0 0.9rem;
    }
    .ap-package-features {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
    }
    .ap-package-features li {
        font-size: 0.88rem;
        color: #d1d5db;
        display: flex;
        align-items: flex-start;
        gap: 0.4rem;
        line-height: 1.4;
    }
    .ap-check {
        color: #4ade80;
        flex-shrink: 0;
    }

    /* ---- שלבים ---- */
    .ap-steps-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        padding: 0 0.25rem;
        flex-wrap: wrap;
    }
    .ap-step-label {
        color: #e5e7eb;
        font-size: 1rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin: 0;
    }
    .ap-step-num {
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 50%;
        color: #000;
        font-size: 0.9rem;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: radial-gradient(circle, #fde047 0%, #f59e0b 60%, #d97706 100%);
        opacity: 0.85;
    }
    .tutorial-finger {
        display: inline-block;
        font-size: 1.15rem;
        animation: gentleHover 2.6s ease-in-out infinite;
        filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.45));
    }
    @keyframes gentleHover {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.03); }
    }

    /* ---- שורות המחירון ---- */
    .ap-rows {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .ap-row {
        position: relative;
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem 1.1rem;
        cursor: pointer;
        transition: all 0.2s;
    }
    .ap-row:hover {
        border-color: rgba(255, 255, 255, 0.25);
    }
    .ap-row.highlighted {
        border-color: #fbbf24;
        background: rgba(245, 158, 11, 0.15);
        box-shadow: 0 10px 20px rgba(245, 158, 11, 0.2);
        transform: scale(1.01);
    }
    .ap-row.plan-chosen {
        border-color: rgba(245, 158, 11, 0.5);
        background: rgba(245, 158, 11, 0.1);
    }
    .ap-row.selected {
        outline: 2px solid #fbbf24;
        outline-offset: 0;
    }

    .confirm-check-pop {
        position: absolute;
        inset: 0;
        z-index: 30;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
    }
    .confirm-check-pop > span {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 50%;
        background: #fbbf24;
        color: #000;
        font-weight: 900;
        font-size: 1.85rem;
        box-shadow: 0 0 30px rgba(245, 158, 11, 0.9);
        animation: confirmCheckPop 0.7s ease-out forwards;
    }
    @keyframes confirmCheckPop {
        0% { opacity: 0; transform: scale(0); }
        35% { opacity: 1; transform: scale(1.35); }
        60% { opacity: 1; transform: scale(1); }
        85% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1.05); }
    }

    .ap-row-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        flex-wrap: wrap;
    }
    .ap-row-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }
    .ap-row-num {
        font-size: 0.75rem;
        font-weight: 900;
        color: #9ca3af;
        flex-shrink: 0;
    }
    .ap-row-icon {
        font-size: 1.15rem;
    }
    .ap-row-name {
        font-weight: 900;
        color: #fff;
        font-size: 1.05rem;
    }

    /* תג הבחירה בשורת המסלול (במקום מתג חצי-שנה/חודש שהיה כאן) */
    .ap-row-pick {
        flex-shrink: 0;
        border-radius: 999px;
        padding: 0.3rem 0.85rem;
        font-size: 0.75rem;
        font-weight: 900;
        white-space: nowrap;
        border: 1.5px solid rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.12);
        color: #e5e7eb;
        transition: all 0.2s;
    }
    .ap-row-pick.on {
        background: #f59e0b;
        border-color: #f59e0b;
        color: #000;
    }
    .ap-price-intro {
        text-align: center;
        color: #d1d5db;
        font-size: 0.95rem;
        font-weight: 600;
        margin: 0 0 1rem;
    }
    .ap-terms-link {
        color: #fbbf24;
        font-weight: 900;
        text-decoration: underline;
    }

    .ap-row-prices {
        display: flex;
        gap: 1.25rem;
        flex-wrap: wrap;
        margin-top: 0.25rem;
    }
    .ap-price-block {
        display: flex;
        align-items: baseline;
        gap: 0.3rem;
    }
    .ap-price-label {
        color: #d1d5db;
        font-size: 0.85rem;
        font-weight: 600;
    }
    .ap-price-half {
        font-weight: 900;
        color: #fbbf24;
        font-size: 0.95rem;
    }
    .ap-row-details {
        font-size: 0.85rem;
        color: #d1d5db;
        margin: 0.4rem 0 0;
        font-weight: 500;
    }

    /* ---- מחשבון ---- */
    .ap-calc {
        margin-bottom: 3rem;
        border-radius: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(135deg, #111827, #030712);
        padding: 1.5rem;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        scroll-margin-top: 1rem;
        animation: slideDown 0.3s ease-out;
    }
    .ap-calc-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
    }
    .ap-calc-emoji {
        font-size: 1.85rem;
    }
    .ap-calc-title {
        font-size: 1.4rem;
        font-weight: 900;
        color: #fff;
        margin: 0;
    }
    .ap-calc-badge {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #d1d5db;
        font-size: 0.75rem;
        font-weight: 900;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
    }

    .ap-calc-list {
        background: rgba(0, 0, 0, 0.4);
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }
    .ap-calc-list-head {
        padding: 0.5rem 1rem;
        background: rgba(255, 255, 255, 0.05);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    .ap-calc-list-head p {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin: 0;
    }
    .ap-calc-list ul {
        list-style: none;
        margin: 0;
        padding: 0;
    }
    .ap-calc-list li {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        gap: 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .ap-calc-list li:last-child {
        border-bottom: none;
    }
    .ap-item-right {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
    }
    .ap-item-remove {
        background: none;
        border: none;
        color: #4b5563;
        cursor: pointer;
        font-size: 0.75rem;
        flex-shrink: 0;
        transition: color 0.2s;
        padding: 0.15rem;
    }
    .ap-item-remove:hover {
        color: #f87171;
    }
    .ap-item-name {
        font-weight: 700;
        font-size: 0.9rem;
    }
    .ap-item-name.half { color: #fde68a; }
    .ap-item-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-shrink: 0;
    }
    .ap-item-plan {
        font-size: 0.7rem;
        font-weight: 900;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
    }
    .ap-item-plan.half {
        background: rgba(245, 158, 11, 0.2);
        color: #fbbf24;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .ap-item-duration {
        color: #4b5563;
        font-size: 0.75rem;
        white-space: nowrap;
    }
    .ap-item-price {
        font-weight: 900;
        font-size: 0.9rem;
    }
    .ap-item-price.half { color: #fbbf24; }

    /* ---- סה"כ + מייל ---- */
    .ap-total-box {
        border-radius: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.05);
        overflow: hidden;
        display: grid;
        grid-template-columns: 1fr 1fr;
    }
    @media (max-width: 768px) {
        .ap-total-box {
            grid-template-columns: 1fr;
        }
    }
    .ap-total-side {
        padding: 1.25rem 1.5rem;
        text-align: right;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 0.75rem;
        border-left: 1px solid rgba(255, 255, 255, 0.15);
    }
    @media (max-width: 768px) {
        .ap-total-side {
            border-left: none;
            border-bottom: 1px solid rgba(255, 255, 255, 0.15);
        }
    }
    .ap-total-math p {
        color: #f3f4f6;
        font-size: 1rem;
        font-weight: 700;
        line-height: 1.5;
        margin: 0 0 0.35rem;
    }
    .ap-total-math .t-half { color: #fcd34d; }
    .ap-total-math .gray { color: #9ca3af; font-weight: 500; margin: 0 0.1rem; }
    .ap-total-math .bold { font-weight: 900; }
    .ap-total-amount-row {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex-wrap: wrap;
        gap: 0.75rem;
    }
    .ap-total-strike {
        font-size: 1.5rem;
        font-weight: 900;
        color: #6b7280;
        text-decoration: line-through;
    }
    .ap-total-amount {
        font-size: 3.2rem;
        font-weight: 900;
        color: #fff;
        margin: 0;
        display: inline-block;
    }
    .ap-total-amount.green {
        color: #4ade80;
    }
    :global(.total-flash) {
        animation: totalFlashAnim 0.75s ease-in-out 2;
    }
    @keyframes totalFlashAnim {
        0%, 100% { transform: scale(1); text-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        50% { transform: scale(1.06); color: #fbbf24; text-shadow: 0 0 24px rgba(251, 191, 36, 0.65); }
    }
    .ap-total-tag {
        color: #86efac;
        font-size: 0.8rem;
        font-weight: 900;
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.3);
        border-radius: 999px;
        padding: 0.25rem 0.75rem;
    }
    .ap-total-note {
        color: #9ca3af;
        font-size: 0.8rem;
        font-weight: 700;
    }

    .ap-email-box {
        padding: 1.25rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        animation: slideDown 0.25s ease-out;
    }
    .ap-email-label {
        color: #d1d5db;
        font-size: 0.9rem;
        font-weight: 700;
        margin: 0 0 0.75rem;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .ap-email-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    @media (max-width: 480px) {
        .ap-email-grid {
            grid-template-columns: 1fr;
        }
    }
    .ap-input {
        border-radius: 0.75rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        padding: 0.75rem 1rem;
        color: #fff;
        font-size: 0.9rem;
        outline: none;
        transition: all 0.2s;
        font-family: inherit;
        box-sizing: border-box;
        width: 100%;
    }
    .ap-input::placeholder {
        color: #4b5563;
    }
    .ap-input:focus {
        border-color: rgba(245, 158, 11, 0.6);
        background: rgba(120, 53, 15, 0.1);
    }
    .ap-input.full {
        text-align: right;
    }
    .ap-email-error {
        color: #f87171;
        font-size: 0.75rem;
        margin: 0.5rem 0 0;
        text-align: center;
        font-weight: 700;
    }
    .ap-email-success {
        background: rgba(20, 83, 45, 0.15);
        padding: 1.25rem;
        text-align: center;
        animation: slideDown 0.3s ease-out;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .ap-email-success .s-title {
        color: #86efac;
        font-weight: 900;
        font-size: 1rem;
        margin: 0 0 0.25rem;
    }
    .ap-email-success .s-sub {
        color: #9ca3af;
        font-size: 0.85rem;
        margin: 0;
    }
    .ap-email-success .s-sub span {
        color: #4ade80;
        font-weight: 700;
    }
    .ap-email-success .s-note {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0.5rem 0 0;
    }
    .big-emoji {
        font-size: 1.85rem;
        margin-bottom: 0.75rem;
        text-align: center;
    }

    /* ---- כפתורים ---- */
    .ap-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border-radius: 0.75rem;
        padding: 0.75rem 1.25rem;
        font-weight: 900;
        font-size: 0.9rem;
        border: none;
        cursor: pointer;
        text-decoration: none;
        transition: all 0.2s;
        font-family: inherit;
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    }
    .ap-btn:hover {
        transform: scale(1.05);
    }
    .ap-btn.wa {
        background: #16a34a;
        color: #fff;
    }
    .ap-btn.wa:hover {
        background: #22c55e;
    }
    .ap-btn.amber {
        background: #f59e0b;
        color: #000;
    }
    .ap-btn.amber:hover {
        background: #fbbf24;
    }
    .ap-btn.amber.disabled {
        background: #374151;
        color: #9ca3af;
        cursor: not-allowed;
    }
    .ap-btn.green {
        background: #16a34a;
        color: #fff;
    }
    .ap-btn.green:hover {
        background: #22c55e;
    }
    .ap-btn.green.big {
        padding: 0.9rem 1.75rem;
        font-size: 1rem;
    }
    .ap-btn.purple {
        background: #9333ea;
        color: #fff;
    }
    .ap-btn.purple:hover {
        background: #a855f7;
    }

    /* ---- מחשבון ריק ---- */
    .ap-empty-calc {
        margin-bottom: 3rem;
        border-radius: 1rem;
        border: 2px dashed rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.02);
        padding: 1.25rem;
        text-align: center;
    }
    .ap-empty-calc p {
        color: #6b7280;
        font-size: 0.9rem;
        margin: 0;
    }
    .ap-empty-calc strong {
        color: #fff;
    }

    /* ---- תקופת הפרסום ---- */
    .ap-period {
        margin-top: 2rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, rgba(88, 28, 135, 0.2), rgba(49, 46, 129, 0.15));
        border: 2px solid rgba(168, 85, 247, 0.4);
        padding: 1.5rem;
    }
    .ap-period-title {
        font-size: 1.3rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 1rem;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    .ap-period-gift {
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem 1.25rem;
        margin-bottom: 1.25rem;
    }
    .ap-period-gift .g-title {
        color: #fcd34d;
        font-weight: 900;
        font-size: 0.95rem;
        margin: 0 0 0.5rem;
    }
    .ap-period-gift ul {
        color: #e5e7eb;
        font-size: 0.85rem;
        line-height: 1.6;
        margin: 0;
        padding-right: 1.5rem;
    }
    .ap-period-gift strong {
        color: #fde68a;
    }

    .ap-calendars {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
        margin-bottom: 1.25rem;
    }
    @media (max-width: 768px) {
        .ap-calendars {
            grid-template-columns: 1fr;
        }
    }
    .ap-calendar {
        border-radius: 0.75rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.75rem;
    }
    .cal-month {
        text-align: center;
        color: #fcd34d;
        font-weight: 900;
        font-size: 0.9rem;
        margin: 0 0 0.5rem;
    }
    .cal-dows {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        font-size: 0.65rem;
        color: #6b7280;
        margin-bottom: 0.25rem;
        text-align: center;
        font-weight: 700;
    }
    .cal-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
    }
    .cal-cell {
        aspect-ratio: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.75rem;
        font-weight: 700;
        border-radius: 4px;
        color: #d1d5db;
    }
    .cal-cell.out {
        color: #374151;
    }
    .cal-cell.today {
        background: #f59e0b;
        color: #000;
        box-shadow: 0 0 0 2px #fcd34d;
    }
    .cal-cell.expiry {
        background: #ef4444;
        color: #fff;
        box-shadow: 0 0 0 2px #fca5a5;
    }
    .ap-cal-legend {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 1rem;
        font-size: 0.75rem;
        color: #9ca3af;
        margin-bottom: 1.25rem;
    }
    .ap-cal-legend > span {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
    }
    .dot {
        width: 0.75rem;
        height: 0.75rem;
        border-radius: 4px;
        display: inline-block;
    }
    .dot.amber { background: #f59e0b; }
    .dot.red { background: #ef4444; }

    .ap-period-confirm {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem;
        transition: all 0.2s;
    }
    .ap-period-confirm:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(245, 158, 11, 0.4);
    }
    .ap-period-confirm input {
        margin-top: 0.15rem;
        width: 1.25rem;
        height: 1.25rem;
        accent-color: #f59e0b;
        cursor: pointer;
        flex-shrink: 0;
    }
    .ap-period-confirm .c-main {
        color: #fff;
        font-weight: 700;
        font-size: 0.95rem;
        margin: 0 0 0.25rem;
    }
    .ap-period-confirm .c-sub {
        color: #9ca3af;
        font-size: 0.8rem;
        line-height: 1.5;
        margin: 0;
    }
    .ap-period-confirm .c-sub span {
        color: #fcd34d;
        font-weight: 700;
    }

    /* ---- תשלום ---- */
    .ap-payment {
        margin-top: 2rem;
        border-radius: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1.5rem;
        transition: opacity 0.3s;
    }
    .ap-payment.locked {
        opacity: 0.5;
        pointer-events: none;
    }
    .ap-payment-lock-note {
        color: #fcd34d;
        font-size: 0.85rem;
        font-weight: 700;
        text-align: center;
        margin: 0 0 0.75rem;
    }
    .ap-payment-sub {
        color: #9ca3af;
        font-size: 0.85rem;
        text-align: center;
        margin: 0 0 1.5rem;
    }
    .ap-period-title.center {
        margin-bottom: 0.5rem;
    }

    .ap-discount {
        margin-bottom: 1.5rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(245, 158, 11, 0.3);
        background: rgba(245, 158, 11, 0.05);
        padding: 1rem 1.25rem;
    }
    .ap-discount label {
        display: block;
        color: #fde68a;
        font-weight: 900;
        font-size: 0.95rem;
        margin-bottom: 0.4rem;
        text-align: right;
    }
    .ap-discount .d-have {
        color: #9ca3af;
        font-size: 0.75rem;
        margin: 0 0 0.6rem;
        text-align: right;
    }
    .d-msg {
        margin: 0.6rem 0 0;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
        font-weight: 700;
        text-align: right;
    }
    .d-msg.ok {
        background: rgba(34, 197, 94, 0.1);
        border: 1px solid rgba(34, 197, 94, 0.3);
        color: #86efac;
    }
    .d-msg.off {
        background: rgba(107, 114, 128, 0.1);
        border: 1px solid rgba(107, 114, 128, 0.3);
        color: #d1d5db;
    }
    .d-msg.unknown {
        color: #6b7280;
        font-size: 0.75rem;
        padding: 0;
    }

    .ap-free-box {
        border-radius: 0.75rem;
        border: 2px solid rgba(34, 197, 94, 0.5);
        background: rgba(20, 83, 45, 0.15);
        padding: 1.5rem;
        text-align: center;
    }
    .ap-free-box h3 {
        color: #86efac;
        font-weight: 900;
        font-size: 1.15rem;
        margin: 0 0 0.25rem;
    }
    .ap-free-box p {
        color: #d1d5db;
        font-size: 0.9rem;
        margin: 0 0 1.25rem;
    }

    .ap-pay-methods {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
        margin-bottom: 1.5rem;
    }
    .ap-pay-chip {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        padding: 0.5rem 1rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: #d1d5db;
    }

    .ap-pay-box {
        border-radius: 0.75rem;
        border: 2px dashed rgba(59, 130, 246, 0.4);
        background: rgba(30, 58, 138, 0.1);
        padding: 1.5rem;
        text-align: center;
    }
    .ap-pay-box h3 {
        color: #fff;
        font-weight: 900;
        margin: 0 0 0.25rem;
    }
    .ap-pay-box .p-sub {
        color: #9ca3af;
        font-size: 0.85rem;
        margin: 0 0 1rem;
    }
    .ap-pay-soon {
        margin: 0 0 1rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(249, 115, 22, 0.4);
        background: rgba(249, 115, 22, 0.1);
        padding: 0.75rem 1rem;
        color: #fed7aa;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.5;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
    }
    @media (min-width: 640px) {
        .ap-pay-soon {
            flex-direction: row;
        }
    }
    .ap-pay-soon a {
        color: #fff;
        font-weight: 900;
        text-decoration: underline;
        text-underline-offset: 2px;
        white-space: nowrap;
    }
    .ap-pay-soon a:hover {
        color: #ffedd5;
    }
    .ap-pay-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        justify-content: center;
    }
    @media (min-width: 640px) {
        .ap-pay-actions {
            flex-direction: row;
        }
    }
    .ap-after-pay {
        margin-top: 0.75rem;
        border-radius: 0.75rem;
        border: 1px solid rgba(34, 197, 94, 0.4);
        background: rgba(34, 197, 94, 0.1);
        padding: 0.75rem 1rem;
        text-align: right;
    }
    .ap-after-pay .a-title {
        color: #86efac;
        font-weight: 900;
        font-size: 0.9rem;
        margin: 0 0 0.4rem;
    }
    .ap-after-pay ul {
        color: #e5e7eb;
        font-size: 0.8rem;
        line-height: 1.6;
        margin: 0;
        padding-right: 1.5rem;
    }
    .ap-after-pay a {
        color: #fcd34d;
        font-weight: 700;
        text-decoration: underline;
    }
    .ap-after-pay a:hover {
        color: #fde68a;
    }
    .ap-after-pay strong {
        color: #86efac;
    }

    .ap-badges {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        margin-top: 1.25rem;
    }
    .ap-badge {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #9ca3af;
    }

    /* ---- יצירת קשר ---- */
    .ap-contact {
        margin-top: 1.5rem;
        border-radius: 1rem;
        background: linear-gradient(135deg, rgba(120, 53, 15, 0.3), rgba(113, 63, 18, 0.2));
        border: 2px solid rgba(245, 158, 11, 0.4);
        padding: 1.25rem 1.5rem;
        text-align: center;
    }
    .ap-contact h2 {
        font-size: 1.15rem;
        font-weight: 900;
        color: #fbbf24;
        margin: 0 0 0.75rem;
    }
    .ap-contact-btns {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        justify-content: center;
    }
    @media (min-width: 640px) {
        .ap-contact-btns {
            flex-direction: row;
        }
    }
    .ap-contact-mail {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0.75rem 0 0;
    }

    @keyframes slideDown {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
</style>
