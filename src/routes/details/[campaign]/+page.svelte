<script>
    import { t } from "$lib/i18n.js";
    import { isLoggedIn } from "$lib/user.js";
    import { fade, slide } from "svelte/transition";

    let { data } = $props();

    const icons = {
        cellular: "📱",
        internet: "🌐",
        fuel: "⛽",
        carInsurance: "🚗",
        electricity: "⚡",
        coupons: "🎟️",
    };

    const images = {
        cellular: "/assets/cellular.jpg",
        internet: "/assets/internet.jpg",
        fuel: "/assets/fuel.jpg",
        carInsurance: "/assets/car_insurance.png",
        electricity: "/assets/electricity.jpg",
        coupons: "/assets/coupons.jpg",
    };

    const joinLinks = {
        cellular: "https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header",
        fuel: "https://forms.gle/2Y9SdUfqkJd5mPaS7",
    };

    // קישור משני לטופס סולר (יוצג רק אם קיים)
    const joinLinksDiesel = {
        fuel: "https://docs.google.com/forms/d/e/1FAIpQLScz6iFzBwX7oGYXdh98Y9aah_RgWXINtbsJ5u05wWYE8anVUA/viewform?usp=publish-editor",
    };

    const whatsappLink = "https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI";

    const stats = {
        cellular: { rating: 5.0, savings: 25, annualSavings: 300, reviews: 47 },
        fuel: { rating: 4.9, savings: 15, annualSavings: 180, reviews: 21, savingsText: "10-70 ש\"ח", annualSavingsText: "כ-420 ש\"ח בשנה" },
        internet: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        carInsurance: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        electricity: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        coupons: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
    };

    // תוכן ייחודי לכל קמפיין - שורת ספקים, חיפוש (קליטה/תחנות), טבלת מסלולים, כתוביות CTA, התנהגות שלבים
    const pageConfig = {
        cellular: {
            providersLine: "מסלולים בחברת רמי לוי, אקס פון, וויקום",
            findSection: {
                title: "בדוק את הרשתות המומלצות בשכונה/ עבודה שלך",
                href: "https://tiber.co.il/Home/Antenna",
                image: "/assets/coverage-banner.png",
                imageAlt: "בדיקת קליטה סלולרית",
                ariaLabel: "לבדיקת קליטה ב-tiber.co.il",
                label: "לבדיקת קליטה ↗",
            },
            plansTable: {
                title: "בחירת מסלול",
                headers: [
                    "שם חברה",
                    "שם התוכנית",
                    "רשת בדור",
                    'דקות/<br />סמסים',
                    "חבילת גלישה ג'יגה",
                    "עלות ממוצעת לקו לשנה",
                    "עלות סים",
                    "עלות משלוח",
                    "רובץ על רשת",
                ],
                rows: [
                    {
                        title: "תוכנית א'", company: "רמי לוי",
                        cells: [
                            { label: "שם חברה", value: "רמי לוי" },
                            { label: "שם התוכנית", value: "תוכנית א'" },
                            { label: "רשת בדור", value: "4/5" },
                            { label: "דקות/סמסים", value: "2500" },
                            { label: "חבילת גלישה ג'יגה", value: "150" },
                            { label: "עלות ממוצעת לקו לשנה", value: "14.9" },
                            { label: "עלות סים", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "עלות משלוח", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "רובץ על רשת", image: { src: "/images/פלאפון.jfif", alt: "פלאפון" } },
                        ],
                    },
                    {
                        title: "תוכנית ב' (עד 8 קווים)", company: "רמי לוי",
                        cells: [
                            { label: "שם חברה", value: "רמי לוי" },
                            { label: "שם התוכנית", value: "תוכנית ב' (עד 8 קווים)" },
                            { label: "רשת בדור", value: "4/5" },
                            { label: "דקות/סמסים", value: "5000" },
                            { label: "חבילת גלישה ג'יגה", value: "300" },
                            { label: "עלות ממוצעת לקו לשנה", html: '16.4 <span class="plan-note">(עלות קו ל-2 מכשירים 15 ש"ח כל אחד)</span>' },
                            { label: "עלות סים", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "עלות משלוח", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "רובץ על רשת", image: { src: "/images/פלאפון.jfif", alt: "פלאפון" } },
                        ],
                    },
                    {
                        title: "תוכנית ג'", company: "wecom",
                        cells: [
                            { label: "שם חברה", value: "wecom" },
                            { label: "שם התוכנית", value: "תוכנית ג'" },
                            { label: "רשת בדור", value: ' 4 (דור 5 בתוספת 7.9 ש"ח)' },
                            { label: "דקות/סמסים", value: "5000" },
                            { label: "חבילת גלישה ג'יגה", value: "ללא הגבלה" },
                            { label: "עלות ממוצעת לקו לשנה", value: "מחיר קבוע 19.9" },
                            { label: "עלות סים", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "עלות משלוח", html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                            { label: "רובץ על רשת", image: { src: "/images/סלקום.jfif", alt: "סלקום" } },
                        ],
                    },
                    {
                        title: "תוכנית ד'", company: "Xphone",
                        cells: [
                            { label: "שם חברה", value: "Xphone" },
                            { label: "שם התוכנית", value: "תוכנית ד'" },
                            { label: "רשת בדור", value: "4/5" },
                            { label: "דקות/סמסים", value: "5000" },
                            { label: "חבילת גלישה ג'יגה", value: "500" },
                            { label: "עלות ממוצעת לקו לשנה", value: "18.9" },
                            { label: "עלות סים", value: '4.9 ש"ח' },
                            { label: "עלות משלוח", value: '14.9 ש"ח' },
                            { label: "רובץ על רשת", image: { src: "/images/סלקום.jfif", alt: "סלקום" } },
                        ],
                    },
                ],
            },
            joinCtaSubtitle: "לקו הסלולר הזול במדינה - חברות רמי לוי / אקס פון / וויקום",
        },
        fuel: {
            stepsOverride: [
                { icon: "📍", title: "בודקים תחנות בסביבה", desc: "אם יש בסביבת הבית / עבודה מהתחנות הנ\"ל עוברים לשלב הבא ⬅️" },
                { icon: "🤝", title: "ממלאים פרטים בטופס הבנזין / סולר", desc: "אנחנו דואגים שנציג יחזור אליכם בהקדם, לתת לכם יחס אישי." },
                { icon: "💸", title: "מתחילים לחסוך", desc: "מצרפים חברים ומשפחה ומגדילים יותר את הכח שלנו." },
            ],
            benefits: {
                title: "היתרונות שלך",
                items: [
                    { icon: "💸", text: "הנחה קבועה בכל הארץ - החל מהליטר הראשון (בתחנות הדלק סונול, דור אלון, טן ותפוז)" },
                    { icon: "🗺️", text: "פריסה של כ-700 תחנות דלק ברחבי הארץ - ככה שתמיד יהיה לכם איפה לתדלק ובהנחה" },
                    { icon: "✨", text: "חווית תדלוק נוחה ופשוטה - נכנסת, תדלקת 😊" },
                    { icon: "📋", text: "חשבונית אחת מרוכזת - ניהול פשוט ונוח, בקרה על תדלוק רכבי המשפחה/העסק" },
                    { icon: "✅", text: "ללא דמי שימוש או התחייבות" },
                    { icon: "🛠️", text: "ללא דמי התקנה" },
                    { icon: "📅", text: "מועד חיוב קבוע בהוראת קבע בנקאית" },
                ],
            },
            faqOverride: [
                { q: "האם יש דמי התקנה או תשלום חודשי כלשהו?", a: "לא. לחברי יוצאים לחירות אין דמי התקנה או תשלום חודשי כלשהו." },
                { q: "האם אני מחוייב לתדלק רק בתחנות הדלק הללו?", a: "לא. ניתן לתדלק בכל תחנה אך ההנחה קיימת רק בתחנות הללו." },
                { q: "האם תיתכן תחנת דלק עם הנחה גדולה משלנו?", a: "כן, לעיתים ישנן תחנות עם מבצעים מיוחדים, במקרה כזה יש לתדלק ללא השימוש בדלקן כדי להנות מההנחה הטובה ביותר באותה השעה." },
                { q: "מה קורה כשאני מוכר את רכבי?", a: "ניתן לשלוף בקלות את ההתקן ולהשליכו לאשפה,<br>או לבטלו מיידית אצלנו בחיוג לשירות<br>בטל׳ 04-659-2444." },
            ],
            findSection: {
                title: "מצא את התחנות הקרובות אליך",
                image: "/images/gas-stations.png",
                imageAlt: "תחנות דלק",
                stationNames: ["סונול", "דור אלון", "טן", "תפוז"],
            },
            plansTable: {
                title: "פירוט ההנחה בדלק (בנזין 95 או 98)",
                headers: [
                    "רשת תחנות",
                    "הנחה לליטר בנזין",
                    "בסיס ההנחה",
                    "מס׳ תחנות זמינות",
                    "לוגו",
                ],
                rows: [
                    {
                        title: "סונול",
                        cells: [
                            { label: "רשת תחנות", value: "סונול" },
                            { label: "הנחה לליטר בנזין", value: "31 אגורות" },
                            { label: "בסיס ההנחה", value: "מהמחיר היציג של סונול" },
                            { label: "מס׳ תחנות זמינות", value: "245" },
                            { label: "לוגו", image: { src: "/images/sonol.png", alt: "סונול" } },
                        ],
                    },
                    {
                        title: "דור אלון",
                        cells: [
                            { label: "רשת תחנות", value: "דור אלון" },
                            { label: "הנחה לליטר בנזין", value: "31 אגורות" },
                            { label: "בסיס ההנחה", value: "מהמחיר היציג של סונול" },
                            { label: "מס׳ תחנות זמינות", value: "220" },
                            { label: "לוגו", image: { src: "/images/dor-alon.png", alt: "דור אלון" } },
                        ],
                    },
                    {
                        title: "טן",
                        cells: [
                            { label: "רשת תחנות", value: "טן" },
                            { label: "הנחה לליטר בנזין", value: "32 אגורות" },
                            { label: "בסיס ההנחה", value: "מהמחיר היציג של סונול" },
                            { label: "מס׳ תחנות זמינות", value: "77" },
                            { label: "לוגו", image: { src: "/images/ten.jfif", alt: "טן" } },
                        ],
                    },
                    {
                        title: "תפוז",
                        cells: [
                            { label: "רשת תחנות", value: "תפוז" },
                            { label: "הנחה לליטר בנזין", value: "32 אגורות" },
                            { label: "בסיס ההנחה", value: "מהמחיר היציג של סונול" },
                            { label: "מס׳ תחנות זמינות", value: "13" },
                            { label: "לוגו", image: { src: "/images/tapuz.png", alt: "תפוז" } },
                        ],
                    },
                ],
            },
            joinCtaSubtitle: "הנחה בדלק <span class=\"cta-small\">(95 או 98)</span>",
            plansTableNote: "שים לב: דלק, הינו מוצר במחיר מפוקח, לכן אין כפל מבצעים. אם המשתמש בוחר למלא בתדלוק עצמי הוא אינו זכאי להנחה על ההנחה.",
            plansTableDiesel: {
                title: "פירוט ההנחה בסולר",
                subtitle: "מחיר ההנחה משתנה בכל חודש ומתפרסם בקבוצת הוואטסאפ",
                headers: [
                    "רשת תחנות",
                    'הנחה לליטר סולר<br /><span class="header-sub">(הנחה לדוגמא)</span>',
                    "בסיס ההנחה",
                    "לוגו",
                ],
                rows: [
                    {
                        title: "כל הרשתות",
                        cells: [
                            { label: "רשת תחנות", html: 'סונול / דור אלון / טן' },
                            { label: "הנחה לליטר סולר", value: "3.76" },
                            { label: "בסיס ההנחה", value: "מהמחיר היציג של סונול" },
                            { label: "לוגו", html: '<span class="multi-logos"><img src="/images/sonol.png" alt="סונול" class="plans-table-logo" /><img src="/images/dor-alon.png" alt="דור אלון" class="plans-table-logo" /><img src="/images/ten.jfif" alt="טן" class="plans-table-logo" /></span>' },
                        ],
                    },
                ],
            },
            plansTableDieselNote: "אין כפל מבצעים. המשתמש מקבל את ההנחה מהמחיר היציג של סונול ללא קשר לאופן המילוי - שירות עצמי או מלא.",
        },
    };

    let satisfactionLevel = $state(0);
    let improvements = $state("");
    let additionalComments = $state("");
    let submitted = $state(false);
    let openFaq = $state(-1);
    let joinCtaEl = $state(null);
    let joinCtaClicked = $state(false);
    let plansTableHighlight = $state(false);
    let shareToast = $state(false);

    let campaign = $derived(data.campaign);
    let campaignTitle = $derived($t.purchases[campaign].title);
    let campaignDesc = $derived($t.purchases[campaign].desc);
    let campaignIcon = $derived(icons[campaign] ?? "📋");
    let campaignImage = $derived(images[campaign]);
    let campaignStats = $derived({ ...stats[campaign], members: data.activeMembers });
    let joinLink = $derived(joinLinks[campaign]);
    let joinLinkDiesel = $derived(joinLinksDiesel[campaign]);
    let pageData = $derived(pageConfig[campaign] ?? null);

    const levels = [
        { value: 1, label: "😞" },
        { value: 2, label: "😐" },
        { value: 3, label: "🙂" },
        { value: 4, label: "😊" },
        { value: 5, label: "🤩" },
    ];

    function handleSubmit() {
        if (satisfactionLevel === 0) return;
        console.log("Survey submitted:", {
            campaign,
            satisfactionLevel,
            improvements,
            additionalComments,
        });
        submitted = true;
    }

    function mockLogin() {
        $isLoggedIn = true;
    }

    function toggleFaq(i) {
        openFaq = openFaq === i ? -1 : i;
    }

    function smoothScrollTo(targetY, duration) {
        return new Promise((resolve) => {
            const startY = window.scrollY;
            const distance = targetY - startY;
            const startTime = Date.now();
            function tick() {
                const t = Math.min((Date.now() - startTime) / duration, 1);
                const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                window.scrollTo(0, startY + distance * eased);
                if (t < 1) setTimeout(tick, 16);
                else resolve();
            }
            tick();
        });
    }

    function getHeaderHeight() {
        return document.querySelector('.main-header')?.getBoundingClientRect().height ?? 0;
    }

    function centerInVisibleViewport(rect) {
        const headerHeight = getHeaderHeight();
        const visibleHeight = window.innerHeight - headerHeight;
        const elementCenter = rect.top + window.scrollY + rect.height / 2;
        return elementCenter - headerHeight - visibleHeight / 2;
    }

    async function handlePlansTableClick(e) {
        e.preventDefault();
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            const section = document.getElementById('plans-table');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const targetY = rect.top + window.scrollY - getHeaderHeight() - 12;
            await smoothScrollTo(targetY, 1500);
            const firstRow = section.querySelector('tbody tr');
            if (firstRow) {
                firstRow.classList.add('plan-row-highlight');
                await new Promise((r) => setTimeout(r, 1400));
                firstRow.classList.remove('plan-row-highlight');
            }
            return;
        }
        const target = document.getElementById('plans-table');
        if (!target) return;
        const targetY = centerInVisibleViewport(target.getBoundingClientRect());
        await smoothScrollTo(targetY, 1800);
        plansTableHighlight = true;
        await new Promise((r) => setTimeout(r, 1400));
        plansTableHighlight = false;
    }

    async function handleScrollToFormClick(e) {
        e.preventDefault();
        if (!joinLink) return;
        if (joinCtaEl) {
            const targetY = centerInVisibleViewport(joinCtaEl.getBoundingClientRect());
            await smoothScrollTo(targetY, 1600);
            joinCtaClicked = true;
            await new Promise((r) => setTimeout(r, 500));
            joinCtaClicked = false;
        }
        window.open(joinLink, "_blank", "noopener");
    }

    async function handleShareClick(e) {
        e.preventDefault();
        const url = `${window.location.origin}/`;
        const shareData = {
            title: 'רכישות קבוצתיות יוצאים לחירות',
            text: 'הצטרפו לקבוצת הרכישות שלנו והוזילו את ההוצאות החודשיות',
            url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
        } catch (err) {
            if (err && err.name === 'AbortError') return;
        }
        try {
            await navigator.clipboard.writeText(url);
        } catch {}
        shareToast = true;
        await new Promise((r) => setTimeout(r, 2200));
        shareToast = false;
    }

    async function handleStep1Click(e) {
        if (!joinLink) return;
        e.preventDefault();
        if (joinCtaEl) {
            const targetY = centerInVisibleViewport(joinCtaEl.getBoundingClientRect());
            await smoothScrollTo(targetY, 1600);
            joinCtaClicked = true;
            await new Promise((r) => setTimeout(r, 500));
            joinCtaClicked = false;
        }
        window.open(joinLink, "_blank", "noopener");
    }
</script>

<svelte:head>
    <title>{campaignTitle} | {$t.title}</title>
</svelte:head>

<div class="details-page" in:fade={{ duration: 300 }}>
    <!-- Hero + Stats unified banner -->
    <section class="hero-card">
        <div class="hero">
            <div class="hero-image">
                <img src={campaignImage} alt={campaignTitle} />
            </div>
            <div class="hero-content">
                <h1>{campaignTitle}</h1>
                <p class="hero-desc">{@html campaignDesc}</p>
                {#if pageData?.providersLine}
                    <p class="hero-desc hero-desc-providers">{pageData.providersLine}</p>
                {/if}
            </div>
        </div>

        {#if campaignStats.members > 0}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">{campaignStats.members}</div>
                    <div class="stat-label">{$t.details.statsMembers}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">{campaignStats.rating.toFixed(1)}/5</div>
                    <div class="stat-label">{$t.details.statsRating}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">{campaignStats.savingsText ?? `${campaignStats.savings} ${$t.currency}`}</div>
                    <div class="stat-label">{$t.details.statsSavings}</div>
                    {#if campaignStats.annualSavingsText}
                        <div class="stat-sub">{campaignStats.annualSavingsText}</div>
                    {:else if campaignStats.annualSavings > 0}
                        <div class="stat-sub">{campaignStats.annualSavings} {$t.currency} בשנה</div>
                    {/if}
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">{campaignStats.reviews}</div>
                    <div class="stat-label">{$t.details.statsReviews}</div>
                </div>
            </div>
        {/if}
    </section>

    {#if pageData?.benefits}
        <section class="section benefits-section">
            <h2>{pageData.benefits.title}</h2>
            <ul class="benefits-list">
                {#each pageData.benefits.items as benefit}
                    <li class="benefit-item">
                        <span class="benefit-icon" aria-hidden="true">{benefit.icon}</span>
                        <span class="benefit-text">{benefit.text}</span>
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    <!-- How it works -->
    <section class="section steps-section">
        <h2>{$t.details.howItWorks}</h2>
        <div class="steps">
            {#each (pageData?.stepsOverride ?? $t.details.steps) as step, i}
                {@const isPlansTableStep = i === 0 && !!pageData?.plansTable}
                {@const isScrollToFormStep = i === 1 && !!pageData && joinLink}
                {@const isShareStep = i === 2 && !!pageData}
                {@const isFormStep = i === 0 && joinLink && !isPlansTableStep}
                {@const stepHref = isPlansTableStep ? '#plans-table' : isScrollToFormStep ? '#join-cta' : isShareStep ? '/' : isFormStep ? joinLink : i === 2 ? whatsappLink : null}
                {#if stepHref}
                    <a
                        class="step step-link"
                        href={stepHref}
                        target={isFormStep || isPlansTableStep || isScrollToFormStep || isShareStep ? null : "_blank"}
                        rel={isFormStep || isPlansTableStep || isScrollToFormStep || isShareStep ? null : "noopener"}
                        onclick={isPlansTableStep ? handlePlansTableClick : isScrollToFormStep ? handleScrollToFormClick : isShareStep ? handleShareClick : isFormStep ? handleStep1Click : null}
                    >
                        <div class="step-num">{i + 1}</div>
                        <div class="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                    </a>
                {:else}
                    <div class="step">
                        <div class="step-num">{i + 1}</div>
                        <div class="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                    </div>
                {/if}
            {/each}
        </div>
    </section>

    {#snippet faqContent()}
        <h2>{$t.details.faqTitle}</h2>
        <div class="faq-list">
            {#each (pageData?.faqOverride ?? $t.details.faq) as item, i}
                <div class="faq-item" class:open={openFaq === i}>
                    <button class="faq-q" onclick={() => toggleFaq(i)}>
                        <span>{item.q}</span>
                        <span class="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {#if openFaq === i}
                        <div class="faq-a" transition:slide={{ duration: 200 }}>
                            {@html item.a}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/snippet}

    {#if pageData?.findSection}
        <section class="section info-section">
            <div class="info-pane coverage-section">
                <h2>{pageData.findSection.title}</h2>
                {#if pageData.findSection.href}
                    <a
                        href={pageData.findSection.href}
                        target="_blank"
                        rel="noopener"
                        class="coverage-banner"
                        aria-label={pageData.findSection.ariaLabel}
                    >
                        <img src={pageData.findSection.image} alt={pageData.findSection.imageAlt} />
                        <span class="coverage-banner-label">{pageData.findSection.label}</span>
                    </a>
                {:else}
                    <div class="coverage-banner coverage-banner-static">
                        <img src={pageData.findSection.image} alt={pageData.findSection.imageAlt} />
                        {#if pageData.findSection.stationNames}
                            <span class="coverage-banner-label">{pageData.findSection.stationNames.join(' · ')}</span>
                        {:else if pageData.findSection.label}
                            <span class="coverage-banner-label">{pageData.findSection.label}</span>
                        {/if}
                    </div>
                {/if}
            </div>
            <div class="info-pane">
                {@render faqContent()}
            </div>
        </section>
    {:else}
        <section class="section">
            {@render faqContent()}
        </section>
    {/if}

    {#if pageData?.plansTable}
        <section id="plans-table" class="section plans-table-section">
            <h2>{pageData.plansTable.title}</h2>
            {#if pageData.plansTable.subtitle}
                <p class="plans-table-subtitle">{pageData.plansTable.subtitle}</p>
            {/if}
            <div class="plans-table-scroll" class:highlight={plansTableHighlight}>
                <table class="plans-table">
                    <thead>
                        <tr>
                            {#each pageData.plansTable.headers as header}
                                <th>{@html header}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each pageData.plansTable.rows as row}
                            <tr data-title={row.title} data-company={row.company}>
                                {#each row.cells as cell}
                                    <td data-label={cell.label}>
                                        {#if cell.image}
                                            <img src={cell.image.src} alt={cell.image.alt} class="plans-table-logo" />
                                        {:else if cell.html}
                                            {@html cell.html}
                                        {:else}
                                            {cell.value}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if pageData.plansTableNote}
                <p class="plans-table-note" role="note">
                    <span class="plans-table-note-icon" aria-hidden="true">⚠️</span>
                    {pageData.plansTableNote}
                </p>
            {/if}
        </section>
    {/if}

    {#if joinLink}
        <div id="join-cta" class="join-cta-wrap">
            <span class="join-cta-hand">👈</span>
            <a
                href={joinLink}
                target="_blank"
                rel="noopener"
                class="join-cta-banner"
                class:clicked={joinCtaClicked}
                bind:this={joinCtaEl}
                aria-label={$t.details.joinCta}
            >
                <div class="join-cta-content">
                    <h3>{@html pageData?.joinCtaSubtitle ?? campaignDesc}</h3>
                    <p>טופס הצטרפות</p>
                </div>
            </a>
            <span class="join-cta-hand">👉</span>
        </div>
    {/if}

    {#if pageData?.plansTableDiesel}
        <section class="section plans-table-section">
            <h2>{pageData.plansTableDiesel.title}</h2>
            {#if pageData.plansTableDiesel.subtitle}
                <p class="plans-table-subtitle">{pageData.plansTableDiesel.subtitle}</p>
            {/if}
            <div class="plans-table-scroll">
                <table class="plans-table">
                    <thead>
                        <tr>
                            {#each pageData.plansTableDiesel.headers as header}
                                <th>{@html header}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each pageData.plansTableDiesel.rows as row}
                            <tr data-title={row.title} data-company={row.company}>
                                {#each row.cells as cell}
                                    <td data-label={cell.label}>
                                        {#if cell.image}
                                            <img src={cell.image.src} alt={cell.image.alt} class="plans-table-logo" />
                                        {:else if cell.html}
                                            {@html cell.html}
                                        {:else}
                                            {cell.value}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if pageData.plansTableDieselNote}
                <p class="plans-table-note" role="note">
                    <span class="plans-table-note-icon" aria-hidden="true">⚠️</span>
                    {pageData.plansTableDieselNote}
                </p>
            {/if}
        </section>
    {/if}

    {#if joinLinkDiesel}
        <div class="join-cta-wrap">
            <span class="join-cta-hand">👈</span>
            <a
                href={joinLinkDiesel}
                target="_blank"
                rel="noopener"
                class="join-cta-banner"
                aria-label="טופס הצטרפות להנחה בסולר"
            >
                <div class="join-cta-content">
                    <h3>הנחה בסולר</h3>
                    <p>טופס הצטרפות</p>
                </div>
            </a>
            <span class="join-cta-hand">👉</span>
        </div>
    {/if}

    <!-- Survey -->
    <section class="section survey-section-wrap">
        <h2>דרגו וכיתבו את החוויה שלכם</h2>

        {#if !$isLoggedIn}
            <div class="restricted-box">
                <div class="restriction-icon">🔒</div>
                <p>הפיצר יהיה זמין בהמשך</p>
            </div>
        {:else if submitted}
            <div class="thank-you" in:fade={{ duration: 400 }}>
                <div class="success-icon">✨</div>
                <h3>{$t.satisfaction.thankYou}</h3>
                <p>המשוב שלך עוזר לנו לצמוח ולהשתפר.</p>
            </div>
        {:else}
            <div class="survey-form">
                <div class="form-row">
                    <p class="question">{$t.satisfaction.q1Campaign}</p>
                    <div class="rating-container">
                        {#each levels as level}
                            <button
                                class="rating-btn {satisfactionLevel === level.value ? 'active' : ''}"
                                onclick={() => (satisfactionLevel = level.value)}
                                type="button"
                                aria-label={`${level.value}`}
                            >
                                <span class="emoji">{level.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="form-row">
                    <label for="improvements" class="question">
                        {$t.satisfaction.question2}
                    </label>
                    <textarea
                        id="improvements"
                        bind:value={improvements}
                        placeholder="כתוב כאן..."
                    ></textarea>
                </div>

                <div class="form-row">
                    <label for="comments" class="question">
                        {$t.satisfaction.question3}
                    </label>
                    <textarea
                        id="comments"
                        bind:value={additionalComments}
                        placeholder="הערות נוספות..."
                    ></textarea>
                </div>

                <button
                    class="primary-btn submit-btn"
                    onclick={handleSubmit}
                    disabled={satisfactionLevel === 0}
                >
                    {$t.satisfaction.submit}
                </button>
            </div>
        {/if}
    </section>

    {#if shareToast}
        <div class="share-toast" role="status" aria-live="polite">
            ✅ הקישור הועתק - אפשר להדביק בכל מקום
        </div>
    {/if}

    <a href="/" class="bottom-back">{$t.details.backToHome}</a>
</div>

<style>
    .details-page {
        max-width: 1100px;
        margin: 0 auto 4rem;
        padding: 0 1.5rem;
        color: white;
    }

    .bottom-back {
        display: inline-block;
        margin-top: 2rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    .bottom-back:hover {
        color: #facc15;
    }

    /* Unified hero + stats banner */
    .hero-card {
        background: linear-gradient(135deg, rgba(35, 45, 75, 0.88), rgba(45, 35, 65, 0.88));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(250, 204, 21, 0.18);
        border-radius: 24px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    /* Hero */
    .hero {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1.8rem;
        align-items: center;
        padding: 1.5rem 1.8rem;
    }

    .hero-image {
        position: relative;
        width: 220px;
        height: 220px;
        border-radius: 20px;
        overflow: hidden;
        border: 2px solid rgba(250, 204, 21, 0.4);
    }

    .hero-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .hero-icon-badge {
        position: absolute;
        bottom: 12px;
        left: 12px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #facc15, #fb923c);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .hero-content {
        text-align: right;
    }

    .hero-badge {
        display: inline-block;
        padding: 0.4rem 1rem;
        background: rgba(250, 204, 21, 0.1);
        border: 1px solid rgba(250, 204, 21, 0.4);
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #facc15;
        margin-bottom: 1rem;
    }

    .hero-content h1 {
        font-size: 2.1rem;
        font-weight: 800;
        margin: 0 0 0.6rem;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.2;
    }

    .hero-desc {
        font-size: 1.05rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        margin: 0 0 1rem;
    }

    .hero-cta {
        display: inline-block;
        padding: 0.7rem 1.6rem;
        font-size: 1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .hero-cta:hover {
        transform: translateY(-4px) scale(1.04);
        box-shadow: 0 12px 24px rgba(250, 204, 21, 0.35);
    }

    /* Stats - integrated as bottom strip of the hero-card */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
    }

    .stat-card {
        position: relative;
        padding: 1.1rem 1rem;
        background: transparent;
        border: none;
        text-align: center;
        transition: background 0.25s ease;
    }

    .stat-card + .stat-card::before {
        content: "";
        position: absolute;
        inset-inline-start: 0;
        top: 22%;
        bottom: 22%;
        width: 2px;
        background: rgba(255, 255, 255, 0.14);
        border-radius: 2px;
    }

    .stat-card:hover {
        background: rgba(250, 204, 21, 0.06);
    }

    .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.4rem;
    }

    .stat-value {
        font-size: 1.7rem;
        font-weight: 800;
        color: #facc15;
        margin-bottom: 0.2rem;
    }

    .stat-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .stat-sub {
        margin-top: 0.4rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: #4ade80;
    }

    /* Sections */
    .section {
        padding: 2.5rem;
        background: linear-gradient(135deg, rgba(35, 45, 75, 0.88), rgba(45, 35, 65, 0.88));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(250, 204, 21, 0.18);
        border-radius: 24px;
        margin-bottom: 2rem;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    }

    .section h2 {
        font-size: 1.8rem;
        font-weight: 800;
        color: #facc15;
        text-align: center;
        margin: 0 0 2rem;
    }

    /* Benefits list */
    .benefits-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
    }

    .benefit-item {
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 1rem 1.1rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        transition: background 0.2s, border-color 0.2s, transform 0.2s;
    }

    .benefit-item:hover {
        background: rgba(250, 204, 21, 0.08);
        border-color: rgba(250, 204, 21, 0.35);
        transform: translateY(-2px);
    }

    .benefit-icon {
        font-size: 1.6rem;
        line-height: 1;
        flex-shrink: 0;
    }

    .benefit-text {
        font-size: 1rem;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.92);
        margin: 0;
    }

    /* בדסקטופ - אם מספר היתרונות אי-זוגי, מרכזים את האחרון במקום שיישאר לבד בעמודה */
    @media (min-width: 641px) {
        .benefit-item:last-child:nth-child(odd) {
            grid-column: 1 / -1;
            max-width: calc(50% - 0.5rem);
            margin-inline: auto;
        }
    }

    @media (max-width: 640px) {
        .benefits-list {
            grid-template-columns: 1fr;
            gap: 0.55rem;
        }
        .benefit-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0.55rem 0.7rem;
            gap: 0.25rem;
        }
        .benefit-icon {
            font-size: 1.4rem;
        }
        .benefit-text {
            font-size: 0.92rem;
            line-height: 1.35;
        }
    }

    /* Join CTA banner (form link) */
    .join-cta-wrap {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0 0 1.5rem;
    }


    .join-cta-hand {
        font-size: 2.1rem;
        flex-shrink: 0;
        line-height: 1;
        animation: join-cta-hand-point 2.6s ease-in-out infinite;
    }

    .join-cta-hand:first-child {
        animation-name: join-cta-hand-point-reverse;
    }

    @keyframes join-cta-hand-point {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-4px); }
    }

    @keyframes join-cta-hand-point-reverse {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(4px); }
    }

    .share-toast {
        position: fixed;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 17, 40, 0.96);
        color: #facc15;
        padding: 0.85rem 1.3rem;
        border-radius: 14px;
        border: 2px solid rgba(250, 204, 21, 0.6);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 22px rgba(250, 204, 21, 0.35);
        font-weight: 700;
        font-size: 0.95rem;
        z-index: 9999;
        animation: share-toast-in 0.25s ease-out;
    }

    @keyframes share-toast-in {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    .plans-table-section {
        margin-bottom: 1.5rem;
    }

    .plans-table-section h2 {
        text-align: center;
        color: #facc15;
        margin-bottom: 1rem;
    }

    .plans-table-subtitle {
        text-align: center;
        color: #ffffff;
        font-weight: 400;
        font-size: 1rem;
        margin: -0.5rem 0 1rem;
    }

    .plans-table-below {
        text-align: center;
        color: #ffffff;
        font-weight: 500;
        font-size: 1rem;
        margin: 0.85rem 0 0;
    }

    :global(.plans-table th .header-sub) {
        display: inline-block;
        font-size: 0.78em;
        font-weight: 500;
        opacity: 0.85;
    }

    :global(.plans-table td .multi-logos) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    :global(.plans-table td .multi-logos .plans-table-logo) {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        overflow: hidden;
    }

    @media (max-width: 768px) {
        :global(.plans-table td .multi-logos) {
            gap: 0.3rem;
        }
        :global(.plans-table td .multi-logos .plans-table-logo) {
            width: 26px;
            height: 26px;
        }
    }

    .plans-table-note {
        margin: 1rem 0 0;
        padding: 0.85rem 1.1rem;
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.55);
        border-radius: 12px;
        color: #fecaca;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.5;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        box-shadow: 0 6px 18px rgba(220, 38, 38, 0.18);
    }

    .plans-table-note-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    @media (max-width: 640px) {
        .plans-table-note {
            font-size: 0.88rem;
            padding: 0.75rem 0.9rem;
            text-align: right;
        }
    }

    .plans-table-scroll {
        overflow-x: auto;
        border-radius: 16px;
        border: 2px solid rgba(250, 204, 21, 0.6);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
        background: rgba(10, 17, 40, 0.6);
        transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
    }

    .plans-table-scroll.highlight {
        animation: plans-table-glow 1.4s ease;
    }

    @keyframes plans-table-glow {
        0% {
            border-color: rgba(250, 204, 21, 0.6);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
            transform: scale(1);
        }
        25% {
            border-color: #facc15;
            box-shadow: 0 0 28px 4px rgba(250, 204, 21, 0.9), 0 10px 30px rgba(0, 0, 0, 0.45);
            transform: scale(1.012);
        }
        60% {
            border-color: #facc15;
            box-shadow: 0 0 22px 2px rgba(250, 204, 21, 0.6), 0 10px 26px rgba(0, 0, 0, 0.4);
            transform: scale(1.006);
        }
        100% {
            border-color: rgba(250, 204, 21, 0.6);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
            transform: scale(1);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .plans-table-scroll.highlight { animation: none; }
    }

    .plans-table {
        width: 100%;
        border-collapse: collapse;
        text-align: center;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.02rem;
        table-layout: fixed;
    }

    .plans-table thead th {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(251, 146, 60, 0.14));
        color: #facc15;
        font-weight: 800;
        padding: 0.85rem 0.5rem;
        border-bottom: 3px solid rgba(250, 204, 21, 0.7);
        white-space: normal;
        line-height: 1.25;
        font-size: 0.95rem;
        overflow-wrap: break-word;
    }

    .plans-table tbody td {
        padding: 0.8rem 0.5rem;
        border-bottom: 2px solid rgba(255, 255, 255, 0.12);
        overflow-wrap: break-word;
    }

    .plan-note {
        display: block;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.72);
        margin-top: 3px;
        line-height: 1.25;
    }

    .plans-table-logo {
        display: block;
        margin: 0 auto;
        max-width: 64px;
        max-height: 36px;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 4px;
    }

    .no-cost-icon {
        display: inline-block;
        font-size: 1.15em;
        line-height: 1;
        margin-bottom: 2px;
    }

    @media (max-width: 768px) {
        .plans-table-logo {
            max-width: 46px;
            max-height: 28px;
        }
    }

    .plans-table tbody tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.03);
    }

    .plans-table tbody tr:hover {
        background: rgba(250, 204, 21, 0.08);
    }

    .plans-table tbody tr:last-child td {
        border-bottom: none;
    }

    @media (max-width: 768px) {
        .plans-table-scroll {
            overflow-x: visible;
            border: none;
            background: transparent;
            box-shadow: none;
            border-radius: 0;
        }

        .plans-table {
            display: block;
            table-layout: auto;
            font-size: 0.9rem;
        }

        .plans-table thead {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }

        .plans-table tbody {
            display: block;
        }

        .plans-table tbody tr {
            display: block;
            position: relative;
            margin-bottom: 1rem;
            padding: 0;
            background: rgba(10, 17, 40, 0.6);
            border: 2px solid rgba(250, 204, 21, 0.6);
            border-radius: 14px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .plans-table tbody tr.plan-row-highlight {
            animation: plan-row-glow 1.4s ease;
        }

        @keyframes plan-row-glow {
            0%, 100% {
                border-color: rgba(250, 204, 21, 0.6);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
                transform: scale(1);
            }
            30% {
                border-color: #facc15;
                box-shadow: 0 0 24px 4px rgba(250, 204, 21, 0.9), 0 6px 16px rgba(0, 0, 0, 0.3);
                transform: scale(1.02);
            }
        }

        .plans-table tbody tr[data-title]::before {
            content: attr(data-title);
            display: block;
            background: linear-gradient(135deg, rgba(250, 204, 21, 0.22), rgba(251, 146, 60, 0.16));
            color: #facc15;
            font-weight: 800;
            font-size: 0.92rem;
            text-align: right;
            padding: 0.55rem 0.8rem 0.55rem 5rem;
            border-bottom: 2px solid rgba(250, 204, 21, 0.6);
            line-height: 1.2;
        }

        .plans-table tbody tr[data-company]::after {
            content: attr(data-company);
            position: absolute;
            top: 0.55rem;
            left: 0.8rem;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 700;
            font-size: 0.9rem;
            line-height: 1.2;
        }

        .plans-table tbody td[data-label="שם התוכנית"],
        .plans-table tbody td[data-label="שם חברה"],
        .plans-table tbody td[data-label="רשת תחנות"] {
            display: none;
        }

        .plans-table tbody td[data-label="לוגו"] {
            position: absolute;
            top: 60%;
            left: 0.5rem;
            transform: translateY(-50%);
            display: block;
            padding: 0;
            margin: 0;
            background: transparent;
            border: none;
            z-index: 2;
        }

        /* תאי לוגו עם multi-logos (סולר) - יוצאים מ-absolute ונמצאים inline במרכז */
        :global(.plans-table tbody td[data-label="לוגו"]:has(.multi-logos)) {
            position: static;
            top: auto;
            left: auto;
            text-align: center;
            padding: 0.5rem 0.6rem;
            background: rgba(255, 255, 255, 0.03);
        }

        .plans-table tbody td[data-label="לוגו"]::before {
            display: none;
        }

        .plans-table tbody td[data-label="לוגו"] img.plans-table-logo {
            max-height: 22px;
            max-width: 32px;
            width: auto;
            margin: 0;
        }

        .plans-table tbody tr > td:first-of-type {
            padding-top: 0.7rem;
        }

        .plans-table tbody td {
            margin: 0 0.4rem;
        }

        .plans-table tbody td br {
            display: none;
        }

        .plans-table tbody td .no-cost-icon {
            margin: 0 0 0 4px;
        }

        .plans-table tbody tr:nth-child(even) {
            background: rgba(10, 17, 40, 0.6);
        }

        .plans-table tbody tr:hover {
            background: rgba(10, 17, 40, 0.6);
        }

        .plans-table tbody tr:last-child {
            margin-bottom: 0;
        }

        .plans-table tbody tr:last-child td {
            border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .plans-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            padding: 0.55rem 0.5rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
            text-align: left;
            font-size: 0.9rem;
            white-space: nowrap;
        }

        .plans-table tbody tr td:last-child {
            border-bottom: none;
        }

        .plans-table tbody td::before {
            content: attr(data-label);
            color: #facc15;
            font-weight: 700;
            font-size: 0.75rem;
            text-align: right;
            flex: 0 0 auto;
            white-space: nowrap;
        }

        .plans-table tbody td > * {
            text-align: left;
        }

        .plan-note {
            font-size: 0.72rem;
            text-align: left;
        }

        .plans-table-logo {
            margin: 0;
            max-width: 56px;
            max-height: 32px;
        }
    }

    .join-cta-banner {
        flex: 1;
        display: block;
        padding: 1.4rem 1.8rem;
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.12), rgba(251, 146, 60, 0.10));
        border: 4px solid #facc15;
        border-radius: 20px;
        text-decoration: none;
        color: white;
        text-align: center;
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3), 0 0 22px rgba(250, 204, 21, 0.45);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .join-cta-banner:hover {
        transform: translateY(-2px);
        border-color: #fde047;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.38), 0 0 32px rgba(250, 204, 21, 0.65);
    }

    .join-cta-banner.clicked {
        animation: cta-press 0.5s ease;
    }

    @keyframes cta-press {
        0%   { transform: translateY(0) scale(1); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3); border-color: rgba(250, 204, 21, 0.45); }
        45%  { transform: translateY(3px) scale(0.97); box-shadow: 0 4px 10px rgba(250, 204, 21, 0.55); border-color: rgba(250, 204, 21, 1); background: linear-gradient(135deg, rgba(250, 204, 21, 0.28), rgba(251, 146, 60, 0.22)); }
        100% { transform: translateY(0) scale(1); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3); border-color: rgba(250, 204, 21, 0.45); }
    }

    .join-cta-content h3 {
        margin: 0 0 0.4rem;
        font-size: 1.45rem;
        color: #facc15;
    }

    :global(.join-cta-content h3 .cta-small) {
        font-size: 0.78em;
        font-weight: 700;
    }

    .join-cta-content p {
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.4;
    }

    /* Coverage + FAQ unified banner (cellular) */
    .info-section {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
    }

    .info-section::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 12%;
        bottom: 12%;
        width: 2px;
        background: rgba(255, 255, 255, 0.14);
        border-radius: 2px;
        transform: translateX(-50%);
    }

    .info-pane {
        min-width: 0;
    }

    /* Coverage banner */
    .coverage-section {
        text-align: center;
    }

    .coverage-banner {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 320px;
        border-radius: 14px;
        overflow: hidden;
        text-decoration: none;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
        border: 2px solid rgba(250, 204, 21, 0.4);
        transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        cursor: pointer;
    }

    .coverage-banner img {
        display: block;
        width: 100%;
        height: auto;
    }

    .coverage-banner-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0.55rem 0.8rem;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.35));
        color: #facc15;
        font-weight: 800;
        font-size: 0.95rem;
        text-align: center;
    }

    .coverage-banner:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    }

    .coverage-banner:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    /* כשהבאנר אינו קישור - אין hover/cursor */
    .coverage-banner-static {
        cursor: default;
    }

    .coverage-banner-static:hover {
        transform: none;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
    }

    /* Steps */
    .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
    }

    .step {
        position: relative;
        padding: 2rem 1.2rem 1.5rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        text-align: center;
    }

    .step-link {
        display: block;
        text-decoration: none;
        color: inherit;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .step-link:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(250, 204, 21, 0.45);
    }

    .step-num {
        position: absolute;
        top: -16px;
        right: 50%;
        transform: translateX(50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .step-icon {
        font-size: 2.2rem;
        margin-bottom: 0.6rem;
    }

    .step h3 {
        font-size: 1.1rem;
        margin: 0 0 0.4rem;
        color: white;
    }

    .step p {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        line-height: 1.5;
    }

    /* Benefits */
    .benefits {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .benefit {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem 1.4rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        text-align: right;
    }

    .benefit-icon {
        font-size: 1.8rem;
        flex-shrink: 0;
    }

    .benefit-text {
        font-size: 1.05rem;
        font-weight: 500;
    }

    /* Reviews */
    .reviews {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
    }

    .review {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        text-align: right;
    }

    .review-stars {
        font-size: 0.95rem;
        margin-bottom: 0.6rem;
        letter-spacing: 2px;
    }

    .review-text {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0 0 0.8rem;
        font-style: italic;
    }

    .review-author {
        font-size: 0.9rem;
        color: #facc15;
        font-weight: 600;
    }

    /* FAQ */
    .faq-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .faq-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        overflow: hidden;
    }

    .faq-item.open {
        border-color: rgba(250, 204, 21, 0.4);
    }

    .faq-q {
        width: 100%;
        padding: 0.7rem 1.4rem;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: right;
        font-family: inherit;
    }

    .faq-arrow {
        font-size: 1.4rem;
        color: #facc15;
    }

    .faq-a {
        padding: 0 1.4rem 1.2rem;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
        text-align: right;
    }

    /* Survey */
    .survey-section-wrap {
        text-align: center;
    }

    .restricted-box,
    .thank-you {
        padding: 2rem;
    }

    .restriction-icon,
    .success-icon {
        font-size: 3.5rem;
        margin-bottom: 0.8rem;
    }

    .thank-you h3 {
        font-size: 1.8rem;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 0.5rem;
    }

    .survey-form {
        max-width: 700px;
        margin: 0 auto;
    }

    .form-row {
        margin-bottom: 2rem;
        text-align: right;
    }

    .question {
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: block;
        color: rgba(255, 255, 255, 0.9);
    }

    .rating-container {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.5rem;
        direction: ltr;
    }

    .rating-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .rating-btn .emoji {
        font-size: 1.8rem;
        transition: transform 0.3s ease;
    }

    .rating-btn:hover {
        background: rgba(250, 204, 21, 0.1);
        border-color: #facc15;
    }

    .rating-btn:hover .emoji {
        transform: scale(1.2);
    }

    .rating-btn.active {
        background: #facc15;
        border-color: #facc15;
        box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
    }

    textarea {
        width: 100%;
        min-height: 90px;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
    }

    textarea:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.4);
    }

    .primary-btn {
        padding: 1rem 2.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: inherit;
    }

    .primary-btn:hover:not(:disabled) {
        transform: translateY(-4px) scale(1.04);
        box-shadow: 0 10px 22px rgba(250, 204, 21, 0.35);
    }

    .submit-btn {
        margin-top: 1rem;
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    /* Responsive */
    @media (max-width: 900px) {
        .hero {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 1.8rem;
        }

        .hero-image {
            width: 100%;
            max-width: 280px;
            height: 240px;
            margin: 0 auto;
        }

        .hero-content {
            text-align: center;
        }

        .hero-content h1 {
            margin-bottom: 0.3rem;
        }

        .hero-desc {
            font-size: 1.1rem;
            line-height: 1.15;
            margin: 0 0 0.25rem;
        }

        .hero-desc-providers {
            font-size: 1.05rem;
            line-height: 1.15;
            margin-bottom: 0;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .stat-card {
            padding: 0.55rem 0.4rem;
        }

        .stat-icon {
            font-size: 1.35rem;
            margin-bottom: 0.15rem;
            line-height: 1;
        }

        .stat-value {
            font-size: 1.15rem;
            margin-bottom: 0.05rem;
            line-height: 1.1;
        }

        .stat-label {
            font-size: 0.72rem;
            line-height: 1.15;
        }

        .stat-sub {
            margin-top: 0.15rem;
            font-size: 0.68rem;
            line-height: 1.15;
        }

        .stat-card + .stat-card::before {
            top: 15%;
            bottom: 15%;
        }

        .reviews {
            grid-template-columns: 1fr;
        }

        .section.steps-section {
            background: transparent;
            border: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            padding: 0.5rem 0;
            margin-inline: -1.5rem;
            border-radius: 0;
        }

        .section.steps-section h2 {
            padding: 0 1rem;
        }

        .steps {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.4rem;
            padding: 0 0.4rem;
        }

        .step {
            padding: 1.4rem 0.5rem 0.9rem;
            border-radius: 12px;
        }

        .step-num {
            top: -14px;
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
        }

        .step-icon {
            font-size: 1.9rem;
            margin-bottom: 0.45rem;
        }

        .step h3 {
            font-size: 1rem;
            margin: 0 0 0.3rem;
            line-height: 1.2;
        }

        .step p {
            font-size: 0.85rem;
            line-height: 1.3;
        }

        .info-section {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .join-cta-wrap {
            gap: 0.5rem;
        }

        .join-cta-hand {
            font-size: 1.35rem;
        }

        .join-cta-banner {
            padding: 1.4rem 1rem;
        }

        .join-cta-content h3 {
            font-size: 1.2rem;
        }

        .join-cta-content p {
            font-size: 0.95rem;
        }

        .info-section::before {
            left: 12%;
            right: 12%;
            top: 50%;
            bottom: auto;
            width: auto;
            height: 2px;
            transform: translateY(-50%);
        }

        .benefits {
            grid-template-columns: 1fr;
        }

        .section {
            padding: 1.8rem 1.2rem;
        }

        .hero-content h1 {
            font-size: 1.7rem;
        }

        .section h2 {
            font-size: 1.4rem;
        }

        .rating-btn {
            width: 52px;
            height: 52px;
        }

        .rating-btn .emoji {
            font-size: 1.4rem;
        }

        .rating-container {
            gap: 0.5rem;
        }
    }
</style>
