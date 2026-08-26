<script>
    import { enhance } from "$app/forms";
    import { adPlans } from "$lib/adPlans.js";
    import { adImgFit, parseAdImageFit } from "$lib/adImageFit.js";
    import { AD_SLOT_COUNT, adSlotColor } from "$lib/adSlots.js";
    import AdCardPreview from "$lib/components/AdCardPreview.svelte";

    // מסך אישור פרסומות לאדמין - ממתינות / מאושרות / נדחות.
    let { data, form } = $props();

    /** @type {'pending' | 'approved' | 'rejected'} */
    let tab = $state("pending");

    // תקופות שאפשר לקצוב לפרסומת שכבר באתר (נספרות מיום האישור)
    const DURATION_OPTIONS = [7, 14, 30, 60, 90, 180, 365];
    // 12 המקומות הממוספרים בטור הפרסומות - בורר "מקום" בכרטיסי המאושרות
    const SLOT_NUMBERS = Array.from({ length: AD_SLOT_COUNT }, (_, i) => i + 1);

    let pending = $derived(data.ads.filter((/** @type {any} */ a) => a.status === "pending"));
    // המאושרות לפי מספר המקום בטור (מהשרת) - כדי שהחצים יזיזו בדיוק את
    // מה שהגולש רואה. המספר קבוע לפרסומת, גם דרך השהיה ופקיעה.
    let approved = $derived(
        data.ads
            .filter((/** @type {any} */ a) => a.status === "approved")
            .sort((/** @type {any} */ a, /** @type {any} */ b) => {
                const ao = a.slot ?? Number.MAX_SAFE_INTEGER;
                const bo = b.slot ?? Number.MAX_SAFE_INTEGER;
                if (ao !== bo) return ao - bo;
                return Date.parse(b.submittedAt || 0) - Date.parse(a.submittedAt || 0);
            }),
    );
    let rejected = $derived(data.ads.filter((/** @type {any} */ a) => a.status === "rejected"));
    let shown = $derived(tab === "pending" ? pending : tab === "approved" ? approved : rejected);

    /** @param {string} iso */
    function fmtDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    // מי תופסת כל מקום בטור - גם מושהית שומרת את המקום שלה
    let slotOccupants = $derived(
        new Map(
            approved
                .filter((/** @type {any} */ a) => typeof a.slot === "number")
                .map((/** @type {any} */ a) => [a.slot, { id: a.id, title: a.title }]),
        ),
    );
    /** @param {string} t */
    function shortTitle(t) {
        return t.length > 22 ? t.slice(0, 21) + "…" : t;
    }
    /** תווית אפשרות בבורר המקום - מקום תפוס מסומן עם שם הפרסומת שיושבת בו
     * @param {number} n @param {string} selfId */
    function slotOptionLabel(n, selfId) {
        const occ = slotOccupants.get(n);
        if (!occ) return `${n}`;
        if (occ.id === selfId) return `${n} — המקום הנוכחי`;
        return `${n} ⚠ תפוס: ${shortTitle(occ.title)}`;
    }
    // אזהרה חיה ליד הבורר ברגע שנבחר מקום תפוס (לפי מזהה הפרסומת)
    /** @type {Record<string, string>} */
    let slotWarning = $state({});
    /** @param {Event} e @param {any} self */
    function onSlotPick(e, self) {
        const n = Number(/** @type {HTMLSelectElement} */ (e.currentTarget).value);
        const occ = slotOccupants.get(n);
        slotWarning = {
            ...slotWarning,
            [self.id]:
                occ && occ.id !== self.id
                    ? `מקום ${n} תפוס ע"י "${shortTitle(occ.title)}" — לחיצה על "העבר" תחליף ביניהן`
                    : "",
        };
    }
    /** אישור אחרון לפני העברה למקום תפוס - אישור = החלפה, ביטול = כלום לא זז
     * @param {MouseEvent} e @param {any} self */
    function confirmSlotMove(e, self) {
        const formEl = /** @type {HTMLButtonElement} */ (e.currentTarget).form;
        const sel = formEl?.elements.namedItem("slot");
        const n = Number(/** @type {HTMLSelectElement | null} */ (sel)?.value);
        const occ = slotOccupants.get(n);
        if (!occ || occ.id === self.id) return;
        const ok = confirm(
            `⚠ מקום ${n} כבר תפוס על ידי "${occ.title}".\n\n` +
                `אישור — החלפה: "${self.title}" תעבור למקום ${n}, ו"${occ.title}" תעבור למקום ${self.slot ?? "-"}.\n` +
                `ביטול — ההעברה מתבטלת ושתי הפרסומות נשארות במקומן.`,
        );
        if (!ok) e.preventDefault();
    }

    // תצוגה מקדימה של הכרטיס כפי שהוא באמת מוצג בטור הפרסומות באתר:
    // ריחוף על כותרת פרסומת מאושרת (דסקטופ) או הקשה עליה (נייד/דסקטופ)
    /** @type {{ ad: any, x: number, y: number } | null} */
    let hoverPreview = $state(null);
    /** @type {any} */
    let modalPreviewAd = $state(null);
    const PREVIEW_W = 144, PREVIEW_H = 490; // מידות הכרטיס האמיתי בטור (144px + יחס 144/450)
    /** @param {MouseEvent} e @param {any} ad */
    function openHoverPreview(e, ad) {
        // מסך מגע - אין ריחוף אמיתי; ההקשה פותחת את המודאל במקום
        if (window.matchMedia("(hover: none)").matches) return;
        const r = /** @type {HTMLElement} */ (e.currentTarget).getBoundingClientRect();
        // הכרטיס צף משמאל לכותרת, מוצמד לגבולות המסך (fixed) - כדי
        // ששום מכל גלילה לא יחתוך אותו
        const y = Math.max(8, Math.min(window.innerHeight - PREVIEW_H - 8, r.top + r.height / 2 - PREVIEW_H / 2));
        const x = Math.max(8, r.left - PREVIEW_W - 16);
        hoverPreview = { ad, x, y };
    }
</script>

<svelte:head>
    <title>אישור פרסומות | ניהול</title>
</svelte:head>

<div class="ads-admin" dir="rtl">
    <h1>📢 אישור פרסומות</h1>

    {#if data.backendUnavailable}
        <div class="admin-alert error">שרת התוכן אינו זמין כרגע - נסו לרענן בעוד רגע.</div>
    {/if}
    {#if form?.message}
        <div class="admin-alert ok">{form.message}</div>
    {/if}
    {#if form?.error}
        <div class="admin-alert error">{form.error}</div>
    {/if}

    <div class="tabs">
        <button type="button" class="tab-btn" class:active={tab === "pending"} onclick={() => (tab = "pending")}>
            ⏳ ממתינות ({pending.length})
        </button>
        <button type="button" class="tab-btn" class:active={tab === "approved"} onclick={() => (tab = "approved")}>
            ✅ מאושרות ({approved.length})
        </button>
        <button type="button" class="tab-btn" class:active={tab === "rejected"} onclick={() => (tab = "rejected")}>
            ❌ נדחו ({rejected.length})
        </button>
    </div>

    {#if shown.length === 0}
        <p class="empty">אין פרסומות בקטגוריה הזו.</p>
    {/if}

    <div class="promo-list">
        {#each shown as ad, adIndex (ad.id)}
            <div class="promo-card">
                <div class="ad-card-img">
                    {#if ad.mainImage}
                        <!-- אותו מיקום/זום שהמפרסם קבע - המנהל מאשר את מה שבאמת יוצג -->
                        <img src={ad.mainImage} alt={ad.title} use:adImgFit={parseAdImageFit(ad.mainImageFit)} />
                    {:else}
                        <div class="no-img">אין תמונה</div>
                    {/if}
                </div>
                <div class="ad-card-body">
                    <div class="ad-card-head">
                        {#if ad.status === "approved"}
                            <!-- ריחוף = הכרטיס האמיתי צף ליד הכותרת (דסקטופ);
                                 הקשה = מודאל עם הכרטיס (נייד ודסקטופ) -->
                            <button
                                type="button"
                                class="ad-title-btn"
                                onmouseenter={(e) => openHoverPreview(e, ad)}
                                onmouseleave={() => (hoverPreview = null)}
                                onclick={() => { hoverPreview = null; modalPreviewAd = ad; }}
                                title="תצוגה מקדימה של הפרסומת כפי שהיא מוצגת באתר"
                            >{ad.title}</button>
                        {:else}
                            <h2>{ad.title}</h2>
                        {/if}
                        <span class="status-pill {ad.status}">
                            {ad.status === "pending" ? "ממתינה" : ad.status === "approved" ? "מאושרת" : "נדחתה"}
                        </span>
                        {#if ad.replacesTitle}
                            <!-- עדכון שמפרסם שלח על פרסומת שכבר רצה. בלי החיווי
                                 הזה זה נראה כמו בקשה לפרסומת שנייה, והאישור היה
                                 מפתיע: הישנה יורדת ברגע שהעדכון מאושר. -->
                            <span class="status-pill approved">✏️ עדכון ל"{ad.replacesTitle}"</span>
                        {/if}
                        {#if ad.status === "approved" && ad.paused}
                            <span class="status-pill pending">⏸ מושהית — {ad.pausedDaysLeft ?? 0} ימים שמורים</span>
                        {/if}
                        {#if ad.payment === "code"}
                            <span class="status-pill approved">💳 קוד תנועה — כמו שולם</span>
                        {:else if ad.codeRequested}
                            <!-- הקוד הוא בקשה בלבד. חייב לומר במפורש שלא שולם,
                                 אחרת מאשרים פרסומת בהנחה שנכנס כסף. -->
                            <span class="status-pill pending">🎟️ ביקש חינם עם קוד — לא שולם</span>
                        {:else}
                            <span class="status-pill pending">⌛ תשלום לתיאום</span>
                        {/if}
                    </div>
                    <p class="ad-sub">{ad.subtitle}</p>
                    {#if ad.hoverText}<p class="ad-hover">ריחוף: {ad.hoverText}</p>{/if}
                    <p class="ad-meta">
                        {#if ad.submittedBy?.email}👤 {ad.submittedBy.email} · {/if}
                        📅 נשלחה: {fmtDate(ad.submittedAt)}
                        {#if ad.status === "approved" && ad.expiresAt} · ⏳ תוקף עד: {fmtDate(ad.expiresAt)}{/if}
                    </p>
                    {#if ad.landing?.phone || ad.landing?.website}
                        <p class="ad-meta">
                            {#if ad.landing.phone}📞 {ad.landing.phone}{/if}
                            {#if ad.landing.website}
                                · 🌐 <a href={ad.landing.website} target="_blank" rel="noopener noreferrer">{ad.landing.website}</a>
                            {/if}
                        </p>
                    {/if}
                    {#if ad.mine && ad.status !== "rejected"}
                        <!-- קיצור דרך למי שהפרסומת שלו: אותו מסלול בדיוק כמו
                             "ערוך" ב"הפרסומות שלי" באזור האישי. -->
                        <p class="ad-meta">
                            <a class="ad-edit-link" href="/advertise/builder?edit={ad.id}">
                                ✏️ ערוך את תוכן הפרסומת
                            </a>
                        </p>
                    {/if}
                    {#if ad.replacesTitle && ad.status === "pending"}
                        <p class="ad-meta">
                            אישור העדכון יוריד את "{ad.replacesTitle}" ויכניס את זו
                            במקומה — באותו מקום בטור ועם אותו תאריך סיום.
                        </p>
                    {/if}
                    {#if ad.rejectionReason}
                        <p class="ad-reject-reason">סיבת דחייה: {ad.rejectionReason}</p>
                    {/if}

                    {#if ad.status === "approved" && tab === "approved"}
                        <!-- מקום מעל 12 (גלישה) מתווסף לבורר כדי שלא ייעלם -->
                        {@const slotOptions = ad.slot && !SLOT_NUMBERS.includes(ad.slot)
                            ? [...SLOT_NUMBERS, ad.slot].sort((/** @type {number} */ a, /** @type {number} */ b) => a - b)
                            : SLOT_NUMBERS}
                        <!-- מספר המקום הקבוע של הפרסומת בטור + החלפת מקום.
                             המספר נשאר לה גם דרך השהיה ופקיעה. -->
                        <div class="slot-row">
                            <!-- הצבע זהה לזה שהמקום מקבל בטור הפרסומות
                                 (adSlots.js), כדי לזהות את המשפחה בלי לספור -->
                            <span
                                class="slot-badge"
                                style="background: {adSlotColor(ad.slot).bg}; border-color: {adSlotColor(ad.slot).border}; color: {adSlotColor(ad.slot).text}"
                            >{ad.slot ?? "-"}</span>
                            <span class="slot-label">מקום {ad.slot ?? "-"} מתוך {AD_SLOT_COUNT} בטור הפרסומות</span>
                            <form method="POST" action="?/move" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="hidden" name="dir" value="up" />
                                <button type="submit" class="a-btn ghost" disabled={adIndex === 0} title="העלה מקום אחד">▲ למעלה</button>
                            </form>
                            <form method="POST" action="?/move" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="hidden" name="dir" value="down" />
                                <button type="submit" class="a-btn ghost" disabled={adIndex === approved.length - 1} title="הורד מקום אחד">▼ למטה</button>
                            </form>
                            <!-- העברה ישירה למקום מספרי; מקום תפוס - השתיים מתחלפות -->
                            <form method="POST" action="?/setSlot" use:enhance class="slot-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <select name="slot" class="duration-select" onchange={(e) => onSlotPick(e, ad)}>
                                    {#each slotOptions as n (n)}
                                        <!-- הרקע לבן (ברירת המחדל של הבורר במערכת), והמספר
                                             בצבע המשפחה של אותו מקום - 1/5/9/13 באותו גוון.
                                             מקום שתפוס ע"י פרסומת אחרת - אדום, עם שמה -->
                                        {@const occ = slotOccupants.get(n)}
                                        {@const takenByOther = !!occ && occ.id !== ad.id}
                                        <option
                                            value={n}
                                            selected={n === ad.slot}
                                            style="background:{takenByOther ? '#fee2e2' : '#fff'};color:{takenByOther ? '#991b1b' : adSlotColor(n).btn};font-weight:800"
                                        >{slotOptionLabel(n, ad.id)}</option>
                                    {/each}
                                </select>
                                <button type="submit" class="a-btn ghost" onclick={(e) => confirmSlotMove(e, ad)} title="העבר למקום שנבחר; מקום תפוס - תתבקש לאשר החלפה בין השתיים">⇄ העבר</button>
                                {#if slotWarning[ad.id]}
                                    <span class="slot-warning">⚠ {slotWarning[ad.id]}</span>
                                {/if}
                            </form>
                        </div>
                    {/if}

                    <div class="ad-actions">
                        {#if ad.status === "approved"}
                            <a href="/ads/{ad.id}" target="_blank" class="a-btn ghost">פתח את דף הנחיתה ↗</a>
                            <!-- קציבת תקופה: נספרת מיום האישור, ולכן קציבה קצרה
                                 מהזמן שכבר רץ מורידה את הפרסומת מיד -->
                            <form method="POST" action="?/setDuration" use:enhance class="approve-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <label class="duration-label">
                                    תקופה:
                                    <select name="days" class="duration-select">
                                        {#each DURATION_OPTIONS as d (d)}
                                            <option value={d} selected={d === ad.durationDays}>{d} ימים</option>
                                        {/each}
                                    </select>
                                </label>
                                <button type="submit" class="a-btn ghost" title="התקופה נספרת מיום האישור">⏱ קצוב</button>
                            </form>
                            {#if ad.paused}
                                <form method="POST" action="?/resume" use:enhance>
                                    <input type="hidden" name="id" value={ad.id} />
                                    <button type="submit" class="a-btn approve" title="הימים השמורים נספרים מהיום">▶ המשך</button>
                                </form>
                            {:else}
                                <!-- השהיה: יורדת מהאתר, הימים שנותרו נשמרים לה -->
                                <form method="POST" action="?/pause" use:enhance>
                                    <input type="hidden" name="id" value={ad.id} />
                                    <button
                                        type="submit"
                                        class="a-btn ghost"
                                        onclick={(e) => {
                                            if (!confirm("להשהות את הפרסומת? היא תרד מהאתר והימים שנותרו יישמרו לה.")) e.preventDefault();
                                        }}
                                    >
                                        ⏸ השהה
                                    </button>
                                </form>
                            {/if}
                            <!-- הורדה מהאתר בלי מחיקה: הפרסומת חוזרת לממתינות -->
                            <form method="POST" action="?/unapprove" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <button
                                    type="submit"
                                    class="a-btn ghost"
                                    onclick={(e) => {
                                        if (!confirm("להוריד את הפרסומת מהאתר ולהחזיר אותה לממתינות?")) e.preventDefault();
                                    }}
                                >
                                    ⏸ הורד מהאתר
                                </button>
                            </form>
                        {/if}
                        {#if ad.status !== "approved"}
                            <form method="POST" action="?/approve" use:enhance class="approve-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <label class="duration-label">
                                    שולם עבור:
                                    <!-- ברירת המחדל = התקופה שהמפרסם בחר בשליחה -->
                                    <select name="durationDays" class="duration-select">
                                        {#each adPlans as plan (plan.days)}
                                            <option value={plan.days} selected={ad.requestedDurationDays === plan.days}>
                                                {plan.label} — {plan.price} ₪
                                            </option>
                                        {/each}
                                    </select>
                                </label>
                                <button type="submit" class="a-btn approve">✅ אשר ופרסם</button>
                            </form>
                        {/if}
                        {#if ad.status !== "rejected"}
                            <form method="POST" action="?/reject" use:enhance class="reject-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="text" name="reason" placeholder="סיבת דחייה (לא חובה)" class="reject-input" />
                                <button type="submit" class="a-btn reject">❌ דחה</button>
                            </form>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- תצוגה מקדימה צפה בריחוף על כותרת פרסומת מאושרת (דסקטופ בלבד) -->
    {#if hoverPreview}
        <div class="hover-preview" style="left:{hoverPreview.x}px; top:{hoverPreview.y}px">
            <AdCardPreview ad={hoverPreview.ad} />
        </div>
    {/if}

    <!-- מודאל תצוגה מקדימה בהקשה על הכותרת (נייד ודסקטופ) -->
    {#if modalPreviewAd}
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div class="preview-backdrop" role="presentation" onclick={() => (modalPreviewAd = null)}>
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <div
                class="preview-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="תצוגה מקדימה של הפרסומת"
                tabindex="-1"
                onclick={(e) => e.stopPropagation()}
            >
                <AdCardPreview ad={modalPreviewAd} />
                <div class="preview-actions">
                    <a href="/ads/{modalPreviewAd.id}" target="_blank" rel="noopener" class="a-btn ghost">פתח דף נחיתה</a>
                    <button type="button" class="a-btn ghost" onclick={() => (modalPreviewAd = null)}>✕ סגור</button>
                </div>
            </div>
        </div>
    {/if}
</div>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") { modalPreviewAd = null; hoverPreview = null; } }} />

<style>
    .ads-admin {
        max-width: 56rem;
        margin: 0 auto;
        padding: 1rem 1rem 3rem;
    }
    .ads-admin h1 {
        font-size: 1.75rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 1.25rem;
        text-align: center;
    }

    .admin-alert {
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 1rem;
        text-align: center;
    }
    .admin-alert.ok {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.35);
        color: #86efac;
    }
    .admin-alert.error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    .ad-edit-link {
        color: #fcd34d;
        font-weight: 800;
        text-decoration: none;
    }
    .ad-edit-link:hover { text-decoration: underline; }
    .tab-btn {
        padding: 0.5rem 1.1rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }
    .tab-btn:hover { color: #fff; }
    .tab-btn.active {
        background: #f59e0b;
        border-color: #f59e0b;
        color: #000;
    }

    .empty {
        text-align: center;
        color: #6b7280;
        padding: 2rem 0;
    }

    .promo-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .promo-card {
        display: flex;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1rem;
    }
    @media (max-width: 640px) {
        .promo-card { flex-direction: column; }
    }
    .ad-card-img {
        width: 120px;
        flex-shrink: 0;
        border-radius: 0.6rem;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.3);
        /* עוגן לתמונה הממוקמת אבסולוטית ע"י adImgFit + גובה שלא יקרוס */
        position: relative;
        min-height: 160px;
    }
    @media (max-width: 640px) {
        .ad-card-img { width: 100%; height: 180px; max-height: 180px; }
    }
    .ad-card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
    .no-img {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 100px;
        color: #6b7280;
        font-size: 0.75rem;
    }
    .ad-card-body {
        flex: 1;
        min-width: 0;
    }
    .ad-card-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
        flex-wrap: wrap;
    }
    .ad-card-head h2 {
        font-size: 1.1rem;
        font-weight: 900;
        color: #fff;
        margin: 0;
    }
    /* כותרת פרסומת מאושרת - כפתור שנראה כמו הכותרת, עם רמז קו-תחתון
       מנוקד שיש כאן תצוגה מקדימה */
    .ad-title-btn {
        font-size: 1.1rem;
        font-weight: 900;
        color: #fff;
        margin: 0;
        padding: 0;
        background: none;
        border: none;
        font-family: inherit;
        cursor: pointer;
        text-align: right;
        text-decoration: underline dotted rgba(255, 255, 255, 0.35);
        text-underline-offset: 4px;
    }
    .ad-title-btn:hover { color: #fcd34d; }
    .status-pill {
        font-size: 0.7rem;
        font-weight: 900;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
    }
    .status-pill.pending {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #fcd34d;
    }
    .status-pill.approved {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.4);
        color: #86efac;
    }
    .status-pill.rejected {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
    }
    .ad-sub {
        color: #d1d5db;
        font-size: 0.9rem;
        margin: 0 0 0.35rem;
    }
    .ad-hover {
        color: #9ca3af;
        font-size: 0.8rem;
        margin: 0 0 0.35rem;
    }
    .ad-meta {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0 0 0.25rem;
    }
    .ad-meta a { color: #93c5fd; }
    .ad-reject-reason {
        color: #fca5a5;
        font-size: 0.8rem;
        font-weight: 700;
        margin: 0.25rem 0;
    }

    .ad-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }
    /* שורת המקום בטור + חצי החלפת מקום */
    .slot-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .slot-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 0.5rem;
        /* הצבעים עצמם מוזרקים inline לפי מספר המקום (adSlotColor);
           כאן רק נשארת נפילה-לברירת-מחדל למקרה שאין מספר */
        background: rgba(148, 163, 184, 0.15);
        border: 1px solid rgba(148, 163, 184, 0.4);
        color: #cbd5e1;
        font-weight: 900;
        font-size: 0.8rem;
    }
    .slot-label {
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.75;
        margin-inline-end: auto;
    }
    .a-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
    .a-btn {
        padding: 0.45rem 1rem;
        border-radius: 0.6rem;
        border: none;
        font-weight: 800;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
    }
    .a-btn.approve { background: #16a34a; color: #fff; }
    .a-btn.approve:hover { background: #22c55e; }
    .a-btn.reject { background: rgba(239, 68, 68, 0.85); color: #fff; }
    .a-btn.reject:hover { background: #ef4444; }
    .a-btn.ghost {
        background: rgba(255, 255, 255, 0.08);
        color: #d1d5db;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .a-btn.ghost:hover { color: #fff; }
    .approve-form,
    .reject-form,
    .slot-form {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        flex-wrap: wrap;
    }
    .duration-label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #9ca3af;
        font-weight: 700;
    }
    .duration-select {
        padding: 0.4rem 0.5rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
    }
    .reject-input {
        padding: 0.4rem 0.7rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #fff;
        font-size: 0.75rem;
        outline: none;
        font-family: inherit;
        width: 170px;
    }
    .reject-input:focus { border-color: rgba(239, 68, 68, 0.5); }

    /* אזהרת מקום תפוס ליד בורר המקום */
    .slot-warning {
        font-size: 0.7rem;
        font-weight: 700;
        color: #fcd34d;
        line-height: 1.3;
        max-width: 180px;
    }

    /* התצוגה המקדימה הצפה בריחוף - מחוץ לכל מכל גלילה (fixed) */
    .hover-preview {
        position: fixed;
        z-index: 40;
        pointer-events: none;
        filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.5));
    }
    /* במסכים צרים אין ריחוף אמיתי - המודאל מחליף אותה */
    @media (max-width: 768px) {
        .hover-preview { display: none; }
    }

    /* מודאל התצוגה המקדימה */
    .preview-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow-y: auto;
    }
    .preview-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        margin: auto 0;
    }
    .preview-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
</style>
