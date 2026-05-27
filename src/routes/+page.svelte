<script>
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { lang, t } from "$lib/i18n.js";

    let { data } = $props();

    // הגדר כאן את מספר החברים הנוכחי בקבוצה
    let targetCount = 859;
    // המונה מאותחל לערך הסופי כך שיוצג גם בלי JS; אנימציית הספירה רצה בגלילה
    const count = tweened(targetCount, {
        duration: 2500,
        easing: cubicOut,
    });

    // מוני חיסכון (שנתי וחודשי) - הנתונים נטענים בצד השרת מגיליון Google
    let targetSavings = $state(data.annualSavings);
    let monthlySavings = $state(data.monthlySavings);
    // התween מאותחל לערך האמיתי כך שהמספר מוצג מיד (גם ב-SSR וגם בלי JS)
    const savings = tweened(data.annualSavings, {
        duration: 2000,
        easing: cubicOut,
    });

    // Intersection Observer להתחלת ספירת חברים בגלילה
    let membersCounterRef = $state();
    let membersCounterVisible = false;

    // אנימציית הבלטה לכותרות בגלילה
    let cellularPop = $state(false);
    let fuelPop = $state(false);
    /** @param {HTMLElement} node @param {() => void} onSeen */
    function popOnView(node, onSeen) {
        const check = () => {
            const r = node.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top < vh * 0.85 && r.bottom > vh * 0.15) {
                onSeen();
                window.removeEventListener("scroll", check);
                window.removeEventListener("resize", check);
            }
        };
        window.addEventListener("scroll", check, { passive: true });
        window.addEventListener("resize", check);
        check();
        return {
            destroy: () => {
                window.removeEventListener("scroll", check);
                window.removeEventListener("resize", check);
            },
        };
    }

    /** @param {IntersectionObserverEntry[]} entries */
    const handleIntersection = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !membersCounterVisible) {
                membersCounterVisible = true;
                count.set(0, { duration: 0 });
                count.set(targetCount);
            }
        });
    };

    onMount(() => {
        // אפקט ספירה למונה החיסכון: איפוס מיידי ל-0 ואז ספירה לערך האמיתי
        savings.set(0, { duration: 0 });
        savings.set(targetSavings);

        // הגדרת Intersection Observer לחברים
        const observer = new IntersectionObserver(handleIntersection, {
            threshold: 0.5,
        });

        if (membersCounterRef) {
            observer.observe(membersCounterRef);
        }

    });
</script>

<div class="top-content">
    <!-- Main Heading - H1 for accessibility -->
    <h1 class="main-page-title">
        {$t.homepage.title || "קבוצת רכישות חוסכונית"}
    </h1>

    <div class="video-container-large">
        <iframe
            src="https://www.youtube-nocookie.com/embed/pl7kV6-aTEw?rel=0"
            title="סרטון הדרכה על קבוצות רכישות חוסכוניות"
            frameborder="0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
        ></iframe>
    </div>

    <!-- Annual Savings Counter -->
    <div class="savings-counter-final" role="region" aria-label="חיסכון שנתי">
        <div class="counter-merge-wrapper fade-scale-in">
            <div class="count-label-text">
                {$t.homepage.annualSavings}
            </div>
            <div class="count-big-number savings-number" aria-live="polite">
                {Math.floor($savings).toLocaleString(
                    $lang === "he"
                        ? "he-IL"
                        : $lang === "ru"
                          ? "ru-RU"
                          : "en-US",
                )}
                {$t.currency}
            </div>
        </div>
    </div>

    <div class="feature-box">
        <h2 class="features-title">{$t.homepage.featuresTitle}</h2>
        <ul class="feature-list">
            {#each $t.homepage.features as feature}
                <li>
                    <span class="check" aria-hidden="true">{feature.icon}</span>
                    {feature.text}
                </li>
            {/each}
        </ul>
    </div>

</div>

<div class="centered-ad-wrapper">
    <p class="ad-text-top">{@html $t.sidebar.whatsapp}</p>
    <div class="banner-container-with-hands">
        <span class="side-hand">👈</span>
        <a
            href="https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI"
            target="_blank"
            class="centered-ad-banner"
            aria-label="הצטרף לקבוצת הוואטסאפ"
        >
        </a>
        <span class="side-hand">👉</span>
    </div>

    <!-- WhatsApp Counter -->
    <div
        class="whatsapp-counter-final"
        bind:this={membersCounterRef}
        role="region"
        aria-label="מספר חברים"
    >
        <div class="counter-merge-wrapper fade-scale-in">
            <div class="count-big-number" aria-live="polite">
                {Math.floor($count)}
            </div>
            <div class="count-label-text">
                {$t.homepage.membersCount}
            </div>
        </div>
    </div>
</div>

<div class="section-title">
    <h2>{$t.homepage.ourPurchases}</h2>
</div>

<div class="purchases-list">
    <!-- Cellular -->
    <div class="purchase-card" style="margin-bottom: 3rem;">
        <a
            href="/details/cellular"
            class="purchase-link-overlay"
            aria-label={$t.purchases.cellular.title}
        ></a>
        <div class="purchase-img-frame">
            <img
                src="/assets/cellular.jpg"
                alt="תמונה המייצגת קבוצה סלולרית עם חברי הקבוצה חוסכים כסף"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3
                use:popOnView={() => (cellularPop = true)}
                class="cellular-title"
                class:pop={cellularPop}
            >{$t.purchases.cellular.title}</h3>
            <p>
                {$t.purchases.cellular.desc}
            </p>
        </div>
        <div class="purchase-status purchase-status-2col">
            <div class="status-col">
                <span class="status-line">
                    <span class="status-label">{$t.purchases.status}</span>
                    <span class="status-value" style="color: #4ade80;"
                        >{$t.purchases.active}</span
                    >
                </span>
                <span class="status-line">
                    <span class="status-label">{$t.purchases.canJoin}</span>
                    <span class="status-value" style="color: #4ade80;">{$t.purchases.yes}</span>
                </span>
            </div>
            <div class="status-col">
                <span class="status-label">{$t.purchases.saved}</span>
                <span
                    class="status-value highlight-monthly"
                    style="color: #4ade80; font-weight: bold;"
                >
                    {monthlySavings.toLocaleString("he-IL")}
                    {$t.currency} {$t.purchases.perMonth}
                </span>
                <span
                    class="status-value highlight-yearly"
                    style="color: #ff4444; font-weight: bold;"
                >
                    {targetSavings.toLocaleString("he-IL")}
                    {$t.currency} {$t.purchases.perYear}
                </span>
            </div>

            <div class="survey-badge-container">
                <div class="survey-rating-summary">
                    <span class="stars-gold">⭐⭐⭐⭐⭐</span>
                    <span class="rating-val">5.0/5</span>
                </div>
            </div>
        </div>
    </div>

    <!-- Fuel -->
    <div class="purchase-card" style="margin-bottom: 3rem;">
        <a
            href="https://forms.gle/2Y9SdUfqkJd5mPaS7"
            target="_blank"
            class="purchase-link-overlay"
            aria-label={$t.purchases.fuel.title}
        ></a>
        <div class="new-burst">{$t.purchases.newBadge}</div>
        <div class="purchase-img-frame fuel-zoom">
            <img
                src="/assets/fuel.jpg"
                alt="תמונה המייצגת תחנת דלק עם מחירי דלק מוזלים לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3
                use:popOnView={() => (fuelPop = true)}
                class="cellular-title"
                class:pop={fuelPop}
            >{$t.purchases.fuel.title}</h3>
            <p>{$t.purchases.fuel.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value" style="color: #22c55e;">{$t.purchases.active}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value" style="color: #22c55e;"
                >{$t.purchases.yes}</span
            >
        </div>
    </div>

    <!-- Soon Separator -->
    <div class="soon-separator">
        <span class="soon-text">{$t.homepage.soonColon}</span>
        <div class="separator-line"></div>
    </div>

    <!-- Internet -->
    <div class="purchase-card">
        <div class="purchase-img-frame">
            <img
                src="/assets/internet.jpg"
                alt="תמונה המייצגת קבוצת אינטרנט מהירה עם חיסכון לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3>{$t.purchases.internet.title}</h3>
            <p>{$t.purchases.internet.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.notStarted}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Car Insurance -->
    <div class="purchase-card">
        <div class="purchase-img-frame">
            <img
                src="/assets/car_insurance.png"
                alt="תמונה המייצגת ביטוח חברות לרכב עם הנחות לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3>{$t.purchases.carInsurance.title}</h3>
            <p>{$t.purchases.carInsurance.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.notStarted}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Electricity -->
    <div class="purchase-card">
        <div class="purchase-img-frame">
            <img
                src="/assets/electricity.jpg"
                alt="תמונה המייצגת חשמל חשמוני עם הנחות קבוצתית לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3>{$t.purchases.electricity.title}</h3>
            <p>{$t.purchases.electricity.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.notStarted}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>

    <!-- Coupons -->
    <div class="purchase-card">
        <div class="purchase-img-frame">
            <img
                src="/assets/coupons.jpg"
                alt="תמונה המייצגת קופונים והנחות לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3>{$t.purchases.coupons.title}</h3>
            <p>{$t.purchases.coupons.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.notStarted}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
    </div>
</div>

<div class="section-title" style="margin-top: 5rem;">
    <h2
        style="font-size: 1.8rem; font-family: 'Assistant', sans-serif; background: none; -webkit-text-fill-color: #facc15;"
    >
        {$t.homepage.nextPurchases}
    </h2>
</div>

<div class="boycott-banner">
    <span class="boycott-icon">✊</span>
    <p class="boycott-text">
        כשנגיע ל-10,000 חברים נחל הליך של חרם כנגד משווקים שמפקיעים מחירים!
    </p>
    <span class="boycott-icon">✊</span>
</div>

<style>
    :global(.hl-whatsapp) {
        display: inline-block;
        font-size: 1.35em;
        font-weight: 900;
        padding: 0 0.15em;
        letter-spacing: 0.02em;
    }

    .cellular-title {
        display: inline-block;
        transform-origin: center;
    }
    .cellular-title.pop {
        animation: cellular-pop 1.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
    }
    @keyframes cellular-pop {
        0% {
            transform: scale(1);
            text-shadow: none;
        }
        40% {
            transform: scale(1.12);
            text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }
        100% {
            transform: scale(1);
            text-shadow: none;
        }
    }
    @media (prefers-reduced-motion: reduce) {
        .cellular-title.pop { animation: none; }
    }

    /* Boycott banner */
    .boycott-banner {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.25rem;
        margin: 3rem auto 2rem;
        padding: 1.5rem 2rem;
        max-width: 900px;
        background: linear-gradient(135deg, rgba(220, 38, 38, 0.18) 0%, rgba(234, 88, 12, 0.18) 100%);
        border: 2px solid rgba(248, 113, 113, 0.55);
        border-radius: 18px;
        box-shadow: 0 10px 30px rgba(220, 38, 38, 0.25);
    }

    .boycott-text {
        color: #fecaca;
        font-size: 1.25rem;
        font-weight: 800;
        line-height: 1.5;
        text-align: center;
        margin: 0;
        text-shadow: 0 0 12px rgba(248, 113, 113, 0.3);
    }

    .boycott-icon {
        font-size: 2.2rem;
        animation: boycottPulse 1.6s ease-in-out infinite;
    }

    @keyframes boycottPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }

    @media (max-width: 600px) {
        .boycott-banner {
            padding: 1.1rem 1rem;
            gap: 0.75rem;
        }
        .boycott-text { font-size: 1rem; }
        .boycott-icon { font-size: 1.7rem; }
    }

    /* Centered Ad Banner */
    .centered-ad-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 2.5rem 0;
        width: 100%;
        gap: 1rem;
    }

    .ad-text-top {
        color: #4ade80;
        font-size: 1.1rem;
        font-weight: 800;
        text-align: center;
        margin: 0;
        max-width: 800px;
        text-shadow: 0 0 15px rgba(74, 222, 128, 0.2);
    }

    .banner-container-with-hands {
        display: flex;
        align-items: center;
        gap: 1.5rem;
    }

    .side-hand {
        font-size: 2.5rem;
        animation: pointing 1.5s ease-in-out infinite;
    }

    @keyframes pointing {
        0%,
        100% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(10px);
        }
    }

    .side-hand:first-child {
        animation: pointing-reverse 1.5s ease-in-out infinite;
    }

    @keyframes pointing-reverse {
        0%,
        100% {
            transform: translateX(0);
        }
        50% {
            transform: translateX(-10px);
        }
    }

    .centered-ad-banner {
        width: 380px;
        height: 110px;
        border-radius: 15px;
        background-image: url("/assets/screenshot-2.png");
        background-size: contain;
        background-position: center;
        background-repeat: no-repeat;
        display: block;
        text-decoration: none;
        border: 2px solid rgba(74, 222, 128, 0.4);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
        transition: all 0.3s ease;
    }

    .centered-ad-banner:hover {
        transform: scale(1.05);
        border-color: #4ade80;
        box-shadow: 0 0 20px rgba(74, 222, 128, 0.3);
    }

    /* Soon Separator */
    .soon-separator {
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 0;
        width: 100%;
        position: relative;
    }

    .soon-text {
        font-size: 2.5rem;
        font-weight: 900;
        white-space: nowrap;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        text-shadow: 0 0 30px rgba(250, 204, 21, 0.4);
    }

    @media (max-width: 768px) {
        .centered-ad-banner {
            width: 280px;
            height: 90px;
        }
        .ad-text-top {
            font-size: 0.95rem;
            padding: 0 1rem;
        }
        .side-hand {
            font-size: 1.5rem;
        }
        .banner-container-with-hands {
            gap: 0.8rem;
        }
    }

    .purchase-img-frame {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid var(--border-color);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        background: #000;
    }

    .purchase-img-frame img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border: none;
        border-radius: 0;
    }

    .fuel-zoom img {
        transform: scale(1.6);
        transform-origin: center;
    }

    @media (max-width: 768px) {
        .purchase-img-frame {
            width: 80px;
            height: 80px;
            margin: 0 auto;
        }
    }

    .purchase-card {
        position: relative;
    }

    .new-burst {
        position: absolute;
        top: -22px;
        right: -22px;
        z-index: 3;
        width: 74px;
        height: 74px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #facc15;
        color: #1a1a2e;
        font-weight: 800;
        font-size: 1.05rem;
        transform: rotate(-15deg);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
        clip-path: polygon(
            50% 0%, 61% 13%, 78% 6%, 78% 25%, 95% 25%,
            85% 40%, 100% 50%, 85% 60%, 95% 75%, 78% 75%,
            78% 94%, 61% 87%, 50% 100%, 39% 87%, 22% 94%,
            22% 75%, 5% 75%, 15% 60%, 0% 50%, 15% 40%,
            5% 25%, 22% 25%, 22% 6%, 39% 13%
        );
    }

    @media (max-width: 768px) {
        .new-burst {
            width: 56px;
            height: 56px;
            font-size: 0.85rem;
            top: -14px;
            right: 2px;
        }
    }

    .purchase-link-overlay {
        position: absolute;
        inset: 0;
        z-index: 1;
    }

    .purchase-status {
        position: relative;
    }

    .status-col,
    .status-line {
        display: contents;
    }

    @media (max-width: 768px) {
        .purchase-status-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            column-gap: 0.6rem;
            row-gap: 0.15rem;
            align-items: start;
            padding-top: 0.45rem;
        }

        .purchase-status-2col .status-col {
            display: flex;
            flex-direction: column;
            gap: 0;
        }

        .purchase-status-2col .status-col .status-line {
            display: flex;
            flex-direction: row;
            align-items: baseline;
            gap: 0.3rem;
            flex-wrap: wrap;
        }

        .purchase-status-2col .status-col:nth-child(2) .status-label {
            display: none;
        }

        .purchase-status-2col .status-col .status-label {
            font-size: 0.78rem;
            line-height: 1.1;
        }

        .purchase-status-2col .status-col .status-value {
            font-size: 0.85rem;
            line-height: 1.1;
        }

        .purchase-status-2col .survey-badge-container {
            grid-column: 1 / -1;
        }
    }

    .survey-badge-container {
        position: absolute;
        bottom: -40px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 0.8rem;
        z-index: 10;
        white-space: nowrap;
    }

    @media (min-width: 1025px) {
        .survey-badge-container {
            left: 140% !important; /* Move even further right to avoid hiding savings data */
        }
    }

    .survey-rating-summary {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: rgba(10, 17, 40, 0.9);
        backdrop-filter: blur(10px);
        padding: 5px 12px;
        border-radius: 12px;
        border: 1px solid rgba(250, 204, 21, 0.4);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        animation: slideInRight 0.5s ease-out;
    }

    @keyframes slideInRight {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
    }

    .stars-gold {
        font-size: 0.9rem;
        letter-spacing: 1px;
    }

    .rating-val {
        font-size: 0.8rem;
        font-weight: bold;
        color: #facc15;
    }

    .satisfaction-circle-link {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: 0.8rem;
        font-weight: 850;
        text-decoration: none;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4);
        border: 4px solid var(--bg-dark);
        transition: transform 0.12s ease-out, box-shadow 0.12s ease-out;
        line-height: 1.1;
        padding: 8px;
        box-sizing: border-box;
    }

    .satisfaction-circle-link:hover {
        transform: scale(1.08);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.5);
    }

    .satisfaction-circle-link:active {
        transform: scale(1.02);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.55);
    }

    /* במובייל/טאבלט תג הסקר מרחף בתחתית הכרטיס - חצי בפנים חצי בחוץ.
       הבלוק ממוקם בסוף ה-style כדי לדרוס את כללי הבסיס שמעליו */
    @media (max-width: 1024px) {
        /* כדי שהתג ימוקם יחסית לכרטיס ולא למקטע הסטטוס */
        .purchase-status {
            position: static;
        }

        .survey-badge-container {
            position: absolute;
            left: 50%;
            bottom: -34px;
            transform: translateX(-50%);
            justify-content: center;
            white-space: nowrap;
            gap: 0.45rem;
        }

        /* מרווח תחתון בכרטיס כדי שהתג לא יחפוף את הטקסט */
        .purchase-card:has(.survey-badge-container) {
            padding-bottom: 2.6rem;
        }

        .survey-rating-summary {
            padding: 3px 8px;
        }

        .stars-gold {
            font-size: 0.7rem;
        }

        .rating-val {
            font-size: 0.7rem;
        }

        .satisfaction-circle-link {
            width: 60px;
            height: 60px;
            font-size: 0.5rem;
            border-width: 3px;
            padding: 4px;
        }
    }
</style>
