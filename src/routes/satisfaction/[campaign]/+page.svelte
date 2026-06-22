<script>
    import { t } from "$lib/i18n.js";
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

    const EMOJI_BY_LEVEL = {
        0: { face: "🤔", text: "" },
        1: { face: "😞", text: "מאוד לא מרוצה" },
        2: { face: "😐", text: "לא מרוצה" },
        3: { face: "🙂", text: "סביר" },
        4: { face: "😊", text: "מרוצה" },
        5: { face: "🤩", text: "מאוד מרוצה!" },
    };

    let satisfactionLevel = $state(0);
    let hoverLevel = $state(0);
    let improvements = $state("");
    let additionalComments = $state("");
    let phone = $state("");
    let submitted = $state(false);
    let submitError = $state("");

    let displayRating = $derived(hoverLevel || satisfactionLevel);
    let currentEmoji = $derived(EMOJI_BY_LEVEL[displayRating]);

    let campaign = $derived(data.campaign);
    let campaignTitle = $derived($t.purchases[campaign]?.title ?? campaign);
    let campaignIcon = $derived(icons[campaign] ?? "📋");

    async function handleSubmit() {
        if (satisfactionLevel === 0) return;
        submitError = "";
        try {
            const res = await fetch("/api/satisfaction", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    campaign_slug: campaign,
                    level: satisfactionLevel,
                    improvements,
                    comments: additionalComments,
                    phone,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            submitted = true;
        } catch (err) {
            console.error("submit failed:", err);
            submitError = "השליחה נכשלה - נסה שוב בעוד מספר רגעים";
        }
    }
</script>

<svelte:head>
    <title>{$t.satisfaction.forCampaign} {campaignTitle} | {$t.title}</title>
</svelte:head>

<div class="satisfaction-page-container">
    {#if submitted}
        <div class="thank-you-message" in:fade={{ duration: 400 }}>
            <div class="success-icon">✨</div>
            <h1>{$t.satisfaction.thankYou}</h1>
            <p>המשוב שלך עוזר לנו לצמוח ולהשתפר.</p>
            <a href="/" class="back-home-btn">חזרה לדף הבית</a>
        </div>
    {:else}
        <div class="survey-form" in:slide={{ duration: 400 }}>
            <div class="campaign-badge">
                <span class="campaign-icon">{campaignIcon}</span>
                <span class="campaign-label">{$t.satisfaction.forCampaign}</span>
            </div>
            <h1 class="survey-title">{campaignTitle}</h1>

            <div class="survey-section">
                <p class="question">{$t.satisfaction.q1Campaign}</p>
                <div class="star-rating">
                    <div class="stars" onmouseleave={() => (hoverLevel = 0)} role="presentation">
                        {#each [1, 2, 3, 4, 5] as n}
                            <button
                                type="button"
                                class="star"
                                class:filled={n <= displayRating}
                                onclick={() => (satisfactionLevel = n)}
                                onmouseenter={() => (hoverLevel = n)}
                                aria-label={`דירוג ${n} מתוך 5`}
                            >★</button>
                        {/each}
                    </div>
                    <div class="emoji-display" class:active={displayRating > 0}>
                        <span class="emoji-face" aria-hidden="true">{currentEmoji.face}</span>
                        {#if currentEmoji.text}
                            <span class="emoji-text">{currentEmoji.text}</span>
                        {/if}
                    </div>
                </div>
            </div>

            <div class="survey-section">
                <label for="improvements" class="question"
                    >{$t.satisfaction.question2}</label
                >
                <textarea
                    id="improvements"
                    bind:value={improvements}
                    placeholder="כתוב כאן..."
                ></textarea>
            </div>

            <div class="survey-section">
                <label for="comments" class="question"
                    >{$t.satisfaction.question3}</label
                >
                <textarea
                    id="comments"
                    bind:value={additionalComments}
                    placeholder="הערות נוספות..."
                ></textarea>
            </div>

            <div class="survey-section">
                <label for="phone" class="question">
                    מספר טלפון (אופציונלי - כדי שנוכל לחזור אליך)
                </label>
                <input
                    id="phone"
                    type="tel"
                    bind:value={phone}
                    placeholder="050-1234567"
                />
            </div>

            {#if submitError}
                <div class="submit-error" role="alert">{submitError}</div>
            {/if}

            <button
                class="submit-btn"
                onclick={handleSubmit}
                disabled={satisfactionLevel === 0}
            >
                {$t.satisfaction.submit}
            </button>

            <a href="/" class="back-link">← חזרה לדף הבית</a>
        </div>
    {/if}
</div>

<style>
    .satisfaction-page-container {
        max-width: 800px;
        margin: 4rem auto;
        padding: 2.5rem;
        background: rgba(26, 26, 26, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
        color: white;
        text-align: center;
    }

    .restricted-access h1,
    .thank-you-message h1 {
        font-size: 2.2rem;
        margin-bottom: 1.5rem;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .restriction-icon,
    .success-icon {
        font-size: 4rem;
        margin-bottom: 1rem;
    }

    .login-prompt-btn,
    .back-home-btn,
    .submit-btn {
        margin-top: 2rem;
        padding: 1rem 2.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        text-decoration: none;
        display: inline-block;
    }

    .login-prompt-btn:hover,
    .back-home-btn:hover,
    .submit-btn:hover:not(:disabled) {
        transform: translateY(-5px) scale(1.05);
        box-shadow: 0 10px 20px rgba(250, 204, 21, 0.3);
    }

    .campaign-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.5rem 1.2rem;
        background: rgba(250, 204, 21, 0.1);
        border: 1px solid rgba(250, 204, 21, 0.3);
        border-radius: 999px;
        margin-bottom: 1.2rem;
    }

    .campaign-icon {
        font-size: 1.5rem;
    }

    .campaign-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: #facc15;
    }

    .survey-title {
        font-size: 2.2rem;
        font-weight: 800;
        margin-bottom: 3rem;
        color: #facc15;
    }

    .survey-section {
        margin-bottom: 2.5rem;
        text-align: right;
    }

    .question {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: block;
        color: rgba(255, 255, 255, 0.9);
    }

    /* כוכבים + סמיילי דינמי */
    .star-rating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        margin-top: 1rem;
    }
    .stars {
        display: inline-flex;
        gap: 0.3rem;
        direction: ltr;
        flex-direction: row-reverse;
    }
    .star {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 2.6rem;
        line-height: 1;
        color: rgba(255, 255, 255, 0.22);
        transition: color 0.18s ease, transform 0.15s ease, text-shadow 0.18s ease;
        padding: 0.15rem 0.05rem;
    }
    .star:hover { transform: scale(1.18); }
    .star.filled {
        color: #facc15;
        text-shadow: 0 0 12px rgba(250, 204, 21, 0.55);
    }
    .star:focus-visible {
        outline: 2px solid #facc15;
        outline-offset: 2px;
        border-radius: 4px;
    }
    .emoji-display {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        min-height: 56px;
        opacity: 0.4;
        transform: scale(0.85);
        transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
    }
    .emoji-display.active {
        opacity: 1;
        transform: scale(1);
    }
    .emoji-face {
        font-size: 2.8rem;
        line-height: 1;
    }
    .emoji-text {
        font-size: 1.1rem;
        font-weight: 700;
        color: #facc15;
        white-space: nowrap;
    }
    @media (max-width: 480px) {
        .star-rating { gap: 1rem; }
        .star { font-size: 2.1rem; }
        .emoji-face { font-size: 2.3rem; }
        .emoji-text { font-size: 0.95rem; }
    }

    textarea {
        width: 100%;
        min-height: 100px;
        padding: 1.2rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        transition: border-color 0.3s ease;
    }

    textarea:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.4);
    }

    .submit-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
    }

    .back-link {
        display: block;
        margin-top: 1.5rem;
        color: rgba(255, 255, 255, 0.6);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    .back-link:hover {
        color: #facc15;
    }

    @media (max-width: 600px) {
        .satisfaction-page-container {
            margin: 1rem;
            padding: 1.5rem;
        }

        .survey-title {
            font-size: 1.6rem;
        }
    }
</style>
