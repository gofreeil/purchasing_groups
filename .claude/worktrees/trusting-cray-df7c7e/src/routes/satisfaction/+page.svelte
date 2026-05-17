<script>
    import { lang, t } from "$lib/i18n.js";
    import { isLoggedIn } from "$lib/user.js";
    import { fade, slide } from "svelte/transition";
    import { onMount } from "svelte";

    let satisfactionLevel = $state(0);
    let nextProduct = $state("");
    let additionalComments = $state("");
    let submitted = $state(false);

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
            satisfactionLevel,
            nextProduct,
            additionalComments,
        });

        submitted = true;
    }

    function mockLogin() {
        $isLoggedIn = true;
    }
</script>

<svelte:head>
    <title>{$t.satisfaction.title} | {$t.title}</title>
</svelte:head>

<div class="satisfaction-page-container">
    {#if !$isLoggedIn}
        <div class="restricted-access" in:fade={{ duration: 300 }}>
            <div class="restriction-icon">🔒</div>
            <h1>{$t.satisfaction.restrictedTitle}</h1>
            <p>{$t.satisfaction.restrictedMessage}</p>
            <button class="login-prompt-btn" onclick={mockLogin}>
                {$t.satisfaction.loginToParticipate}
            </button>
        </div>
    {:else if submitted}
        <div class="thank-you-message" in:fade={{ duration: 400 }}>
            <div class="success-icon">✨</div>
            <h1>{$t.satisfaction.thankYou}</h1>
            <p>המשוב שלך עוזר לנו לצמוח ולהשתפר.</p>
            <a href="/" class="back-home-btn">{$t.satisfaction.backToHome}</a>
        </div>
    {:else}
        <div class="survey-form" in:slide={{ duration: 400 }}>
            <h1 class="survey-title">{$t.satisfaction.title}</h1>

            <div class="survey-section">
                <p class="question">{$t.satisfaction.question1}</p>
                <div class="rating-container">
                    {#each levels as level}
                        <button
                            class="rating-btn {satisfactionLevel === level.value
                                ? 'active'
                                : ''}"
                            onclick={() => (satisfactionLevel = level.value)}
                            type="button"
                        >
                            <span class="emoji">{level.label}</span>
                        </button>
                    {/each}
                </div>
            </div>

            <div class="survey-section">
                <label for="nextProduct" class="question"
                    >{$t.satisfaction.question2}</label
                >
                <textarea
                    id="nextProduct"
                    bind:value={nextProduct}
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

            <button
                class="submit-btn"
                onclick={handleSubmit}
                disabled={satisfactionLevel === 0}
            >
                {$t.satisfaction.submit}
            </button>
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

    /* Restricted Access Styles */
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

    /* Survey Form Styles */
    .survey-title {
        font-size: 2.5rem;
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

    .rating-container {
        display: flex;
        justify-content: center;
        gap: 1.5rem;
        margin-top: 1rem;
        direction: ltr; /* Keeps emojis in order even in RTL */
    }

    .rating-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 70px;
        height: 70px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .rating-btn .emoji {
        font-size: 2rem;
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

    .rating-btn.active .emoji {
        transform: scale(1.1);
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

    @media (max-width: 600px) {
        .satisfaction-page-container {
            margin: 1rem;
            padding: 1.5rem;
        }

        .rating-container {
            gap: 0.5rem;
        }

        .rating-btn {
            width: 55px;
            height: 55px;
        }

        .rating-btn .emoji {
            font-size: 1.5rem;
        }

        .survey-title {
            font-size: 1.8rem;
        }
    }
</style>
