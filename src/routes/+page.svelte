<script>
    import { onMount } from "svelte";
    import { tweened } from "svelte/motion";
    import { cubicOut } from "svelte/easing";
    import { lang, t } from "$lib/i18n.js";

    // הגדר כאן את מספר החברים הנוכחי בקבוצה
    let targetCount = 475;
    const count = tweened(0, {
        duration: 2500, // הגדלת זמן הספירה כדי שתמשיך גם אחרי הטעינה
        easing: cubicOut,
    });

    // הגדרת מונה חיסכון שנתי עם אפקט ספירה
    let targetSavings = $state(15227);
    const savings = tweened(0, {
        duration: 2000,
        easing: cubicOut,
    });

    // Intersection Observer להתחלת ספירת חברים בגלילה
    let membersCounterRef = $state();
    let membersCounterVisible = false;

    /** @param {IntersectionObserverEntry[]} entries */
    const handleIntersection = (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting && !membersCounterVisible) {
                membersCounterVisible = true;
                count.set(targetCount);
            }
        });
    };

    async function fetchSavingsFromSheet() {
        try {
            const sheetId = "18V5IdtRiN3dKo7habggKP5e55_xJPci158aJVuuWXVw";
            const gid = "2146350168";
            const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;

            const response = await fetch(url);
            const csvText = await response.text();

            // פיצול השורות ולקחת את השורה השלישית (X3)
            const rows = csvText.split("\n");
            if (rows.length > 2) {
                // שורה שלישית (אינדקס 2) היא X3 בגיליון
                const targetRow = rows[2].split(",");
                // עמודה X היא אינדקס 23 (A=0, B=1... X=23)
                const value = targetRow[23];

                if (value) {
                    // ניקוי תווים שהם לא מספרים
                    const numericValue = parseInt(value.replace(/[^\d]/g, ""));
                    if (!isNaN(numericValue)) {
                        targetSavings = numericValue;
                        savings.set(targetSavings);
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching savings from sheet:", error);
            // במקרה של שגיאה, נשתמש בערך ברירת המחדל שכבר מוגדר
            savings.set(targetSavings);
        }
    }

    onMount(() => {
        // משיכת נתונים מהגיליון
        fetchSavingsFromSheet();

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
            src="https://www.youtube.com/embed/pl7kV6-aTEw"
            title="סרטון הדרכה על קבוצות רכישות חוסכוניות"
            frameborder="0"
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

<div class="centered-ad-wrapper">
    <p class="ad-text-top">{$t.sidebar.whatsapp}</p>
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
</div>

<div class="section-title">
    <h2>{$t.homepage.ourPurchases}</h2>
</div>

<div class="purchases-list">
    <!-- Cellular -->
    <div class="purchase-card">
        <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header"
            target="_blank"
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
            <h3>{$t.purchases.cellular.title}</h3>
            <p>
                {$t.purchases.cellular.desc}
            </p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value" style="color: #4ade80;"
                >{$t.purchases.done}</span
            >
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.yes}</span>
            <span class="status-label">{$t.purchases.saved}</span>
            <span
                class="status-value savings"
                style="color: #ff4444; font-weight: bold;"
                >{targetSavings.toLocaleString("he-IL")}
                {$t.purchases.currencyPerYear}</span
            >

            <div class="survey-badge-container">
                <div class="survey-rating-summary">
                    <span class="stars-gold">⭐⭐⭐⭐⭐</span>
                    <span class="rating-val">5.0/5</span>
                </div>
                <a href="/satisfaction" class="satisfaction-circle-link">
                    {@html $t.satisfaction.title.replace(" ", "<br />")}
                </a>
            </div>
        </div>
    </div>

    <!-- Soon Separator -->
    <div class="soon-separator">
        <span class="soon-text">{$t.homepage.soonColon}</span>
        <div class="separator-line"></div>
    </div>

    <!-- Fuel -->
    <div class="purchase-card">
        <div class="purchase-img-frame fuel-zoom">
            <img
                src="/assets/fuel.jpg"
                alt="תמונה המייצגת תחנת דלק עם מחירי דלק מוזלים לחברי הקבוצה"
                class="purchase-img"
            />
        </div>
        <div class="purchase-info">
            <h3>{$t.purchases.fuel.title}</h3>
            <p>{$t.purchases.fuel.desc}</p>
        </div>
        <div class="purchase-status">
            <span class="status-label">{$t.purchases.status}</span>
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value">{$t.purchases.no}</span>
        </div>
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
            <span class="status-value">{$t.purchases.no}</span>
            <span class="status-label">{$t.purchases.canJoin}</span>
            <span class="status-value" style="color: #facc15;"
                >{$t.purchases.soon}</span
            >
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
            <span class="status-value">{$t.purchases.no}</span>
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
            <span class="status-value">{$t.purchases.no}</span>
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
            <span class="status-value">{$t.purchases.no}</span>
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

<style>
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
        background-image: url("/assets/צילום מסך 2025-12-02 122846.png");
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
        margin: 1rem 0;
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

    .purchase-link-overlay {
        position: absolute;
        inset: 0;
        z-index: 1;
    }

    .purchase-status {
        position: relative;
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
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        line-height: 1.1;
        padding: 8px;
        box-sizing: border-box;
    }

    .satisfaction-circle-link:hover {
        background: linear-gradient(135deg, #4ade80, #22c55e);
        color: white;
        transform: translateX(-50%) scale(1.1);
        box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);
    }
</style>
