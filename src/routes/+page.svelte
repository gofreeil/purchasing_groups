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

            // פיצול השורות ולקחת את השורה השנייה (V2)
            const rows = csvText.split("\n");
            if (rows.length > 1) {
                // שורה שנייה (אינדקס 1) היא V2 בגיליון
                const secondRow = rows[1].split(",");
                // עמודה V היא אינדקס 21 (A=0, B=1... V=21)
                const value = secondRow[21];

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

<svelte:head>
    <title>{$t.homepage.title}</title>
</svelte:head>

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
            tabindex="0"
        ></iframe>
    </div>

    <!-- Annual Savings Counter -->
    <div class="savings-counter-final" role="region" aria-label="חיסכון שנתי">
        <div class="counter-merge-wrapper fade-scale-in">
            <div class="count-label-text">
                {$t.homepage.annualSavings}
            </div>
            <div class="count-big-number savings-number" aria-live="polite">
                {Math.floor($savings).toLocaleString("he-IL")} ש"ח
            </div>
        </div>
    </div>

    <div class="feature-box">
        <h2 class="features-title">יתרונות הקבוצה</h2>
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
    <a
        href="https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header"
        target="_blank"
        class="purchase-card"
        style="text-decoration: none; color: inherit;"
    >
        <img
            src="/assets/cellular.jpg"
            alt="תמונה המייצגת קבוצה סלולרית עם חברי הקבוצה חוסכים כסף"
            class="purchase-img"
        />
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
        </div>
    </a>

    <!-- Soon Separator -->
    <div class="soon-separator">
        <span class="soon-text">בקרוב:</span>
        <div class="separator-line"></div>
    </div>

    <!-- Internet -->
    <div class="purchase-card">
        <img
            src="/assets/internet.jpg"
            alt="תמונה המייצגת קבוצת אינטרנט מהירה עם חיסכון לחברי הקבוצה"
            class="purchase-img"
        />
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

    <!-- Fuel -->
    <div class="purchase-card">
        <img
            src="/assets/fuel.jpg"
            alt="תמונה המייצגת תחנת דלק עם מחירי דלק מוזלים לחברי הקבוצה"
            class="purchase-img"
        />
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

    <!-- Car Insurance -->
    <div class="purchase-card">
        <img
            src="/assets/car_insurance.png"
            alt="תמונה המייצגת ביטוח חברות לרכב עם הנחות לחברי הקבוצה"
            class="purchase-img"
        />
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
        <img
            src="/assets/electricity.jpg"
            alt="תמונה המייצגת חשמל חשמוני עם הנחות קבוצתית לחברי הקבוצה"
            class="purchase-img"
        />
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
        <img
            src="/assets/coupons.jpg"
            alt="תמונה המייצגת קופונים והנחות לחברי הקבוצה"
            class="purchase-img"
        />
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
        margin: 4rem 0 2rem;
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
</style>
