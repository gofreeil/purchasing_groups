<script>
    import { fade } from "svelte/transition";
    import { invalidateAll } from "$app/navigation";

    // הטופס בדיוק כפי שהיה בדף המבצע - בחירת חברה (אם יש), כוכבים + סמיילי, הערות, שם/עיר ושליחה.
    let { campaignSlug, ratingCompanies = null } = $props();

    // סמיילי שמשתנה רק לאחר לחיצה (לא על hover - כדי שלא יקפוץ)
    const EMOJI_BY_LEVEL = {
        1: { face: "😞", text: "מאוד לא מרוצה" },
        2: { face: "😐", text: "לא מרוצה" },
        3: { face: "🙂", text: "סביר" },
        4: { face: "😊", text: "מרוצה" },
        5: { face: "🤩", text: "מאוד מרוצה!" },
    };

    let selectedCompany = $state(null);
    let rating = $state(0);
    let comments = $state("");
    let userName = $state("");
    let userCity = $state("");
    let submitted = $state(false);
    let submitError = $state("");
    let mustPickCompanyShake = $state(false); // אנימציית שייק על הגלולות אם מנסים לדרג לפני בחירה

    let companies = $derived(
        Array.isArray(ratingCompanies) && ratingCompanies.length > 0 ? ratingCompanies : null,
    );
    // אם יש חברות - צריך לבחור אחת לפני שדירוג מופעל. אם אין - הדירוג זמין מיד.
    let canRate = $derived(companies === null || selectedCompany !== null);
    let currentEmoji = $derived(EMOJI_BY_LEVEL[rating] ?? null);

    function selectCompany(name) {
        if (selectedCompany === name) return;
        selectedCompany = name;
        rating = 0; // איפוס כשבוחרים חברה אחרת
    }

    // ניסיון לדרג לפני בחירת חברה - חוסם, מציג רמיזה ומשפעיל אנימציה
    function tryRate(n) {
        if (companies && !selectedCompany) {
            mustPickCompanyShake = true;
            setTimeout(() => (mustPickCompanyShake = false), 600);
            return;
        }
        rating = n;
    }

    async function handleSubmit() {
        if (rating === 0) return;
        submitError = "";
        try {
            const res = await fetch("/api/satisfaction", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    campaign_slug: campaignSlug,
                    company: selectedCompany,
                    level: rating,
                    comments,
                    user_name: userName,
                    user_city: userCity,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            submitted = true;
            invalidateAll();
        } catch (err) {
            console.error("submit failed:", err);
            submitError = "השליחה נכשלה - נסה שוב בעוד מספר רגעים";
        }
    }
</script>

<section class="section survey-section-wrap">
    <h2>שביעות רצון משירות החברה ומהמבצע</h2>

    {#if submitted}
        <div class="thank-you" in:fade={{ duration: 400 }}>
            <div class="success-icon">✨</div>
            <h3>תודה על הדירוג!</h3>
            <p>המשוב שלך עוזר לנו להשתפר.</p>
        </div>
    {:else}
        <div class="survey-form">
            <div class="survey-inline-row">
                {#if companies}
                    <div class="survey-step">
                        <span class="step-label">בחר:</span>
                        <div
                            class="company-picker"
                            class:shake={mustPickCompanyShake}
                            role="radiogroup"
                            aria-label="בחר חברה לדירוג"
                        >
                            {#each companies as company}
                                <button
                                    type="button"
                                    role="radio"
                                    aria-checked={selectedCompany === company}
                                    class="company-pill"
                                    class:selected={selectedCompany === company}
                                    onclick={() => selectCompany(company)}
                                >
                                    {company}
                                </button>
                            {/each}
                        </div>
                    </div>
                {/if}

                <div class="survey-step">
                    <span class="step-label">דרג:</span>
                    <div class="star-rating">
                        <div class="stars" role="presentation">
                            {#each [1, 2, 3, 4, 5] as n}
                                <button
                                    type="button"
                                    class="star"
                                    class:filled={n <= rating}
                                    onclick={() => tryRate(n)}
                                    aria-label={`דירוג ${n} מתוך 5`}
                                >★</button>
                            {/each}
                        </div>
                        {#if currentEmoji}
                            <div class="emoji-display" in:fade={{ duration: 220 }}>
                                <span class="emoji-face" aria-hidden="true">{currentEmoji.face}</span>
                                <span class="emoji-text">{currentEmoji.text}</span>
                            </div>
                        {/if}
                    </div>
                </div>
            </div>

            {#if mustPickCompanyShake}
                <p class="rating-hint" in:fade={{ duration: 180 }}>
                    סמן קודם את החברה שנותנת לך שירות, ואז דרג ⬆️
                </p>
            {/if}

            <div class="comments-row">
                <label for="survey-comments" class="comments-label">הערות לגבי החברה המדורגת בלבד:</label>
                <div class="comments-submit-grid">
                    <textarea
                        id="survey-comments"
                        class="comments-input"
                        bind:value={comments}
                        placeholder="מצב קליטה, כמה כסף התוכנית חסכה לך בחודש וכמה בשנה"
                        rows="3"
                    ></textarea>
                    <div class="submit-stack">
                        <input
                            type="text"
                            class="text-input"
                            bind:value={userName}
                            placeholder="שם"
                            aria-label="שם"
                        />
                        <input
                            type="text"
                            class="text-input"
                            bind:value={userCity}
                            placeholder="עיר"
                            aria-label="עיר"
                        />
                        <button
                            class="primary-btn submit-btn"
                            onclick={handleSubmit}
                            disabled={rating === 0 || !canRate}
                        >
                            שלח דירוג ותגובה
                        </button>
                    </div>
                </div>
            </div>

            {#if submitError}
                <div class="submit-error" role="alert">{submitError}</div>
            {/if}
        </div>
    {/if}
</section>

<style>
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
    .survey-section-wrap {
        text-align: center;
    }

    .thank-you {
        padding: 2rem;
    }
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

    /* שורה אחת לבחירה+דירוג - שני survey-step בצד-זה-לצד */
    .survey-inline-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.1rem;
    }
    /* כל "שלב" בסקר - תווית קצרה ליד התוכן */
    .survey-step {
        display: flex;
        align-items: center;
        gap: 0.55rem;
    }
    .step-label {
        font-size: 1.15rem;
        font-weight: 800;
        color: #facc15;
        white-space: nowrap;
    }
    @media (max-width: 560px) {
        .survey-inline-row {
            gap: 0.9rem;
        }
        .step-label {
            font-size: 1rem;
        }
    }

    /* בחירת חברה לדירוג */
    .company-picker {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.6rem;
        margin: 0;
    }
    .company-pill {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        padding: 0.5rem 1.2rem;
        color: rgba(255, 255, 255, 0.88);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s ease;
    }
    .company-pill:hover {
        background: rgba(250, 204, 21, 0.1);
        border-color: rgba(250, 204, 21, 0.5);
    }
    .company-pill.selected {
        background: linear-gradient(135deg, #facc15, #fb923c);
        border-color: #facc15;
        color: #1a1a1a;
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.35);
    }
    /* שייק על שורת הגלולות כאשר מנסים לדרג בלי לבחור חברה */
    .company-picker.shake {
        animation: pickerShake 0.55s ease;
    }
    @keyframes pickerShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }
    .company-picker.shake .company-pill {
        border-color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.45);
    }
    @media (prefers-reduced-motion: reduce) {
        .company-picker.shake { animation: none; }
    }
    .rating-hint {
        margin: 0.75rem 0 0;
        text-align: center;
        color: #facc15;
        font-size: 0.95rem;
        font-weight: 600;
    }

    .submit-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: 140px;
    }
    .submit-stack .submit-btn {
        margin-top: 0;
        padding: 0.75rem 0.6rem;
        font-size: 0.95rem;
        white-space: nowrap;
    }
    .submit-stack .text-input {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }
    @media (max-width: 600px) {
        .submit-stack {
            width: 70%;
            justify-self: start;
        }
    }
    .text-input {
        width: 100%;
        padding: 0.35rem 0.65rem;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.82rem;
        font-family: inherit;
        transition: border-color 0.2s ease, background 0.2s ease;
    }
    .text-input::placeholder {
        color: rgba(255, 255, 255, 0.35);
        font-size: 0.82rem;
    }
    .text-input:focus {
        outline: none;
        border-color: rgba(250, 204, 21, 0.6);
        background: rgba(0, 0, 0, 0.4);
    }

    .comments-row {
        margin: 0.85rem 0 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }
    .comments-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
        text-align: right;
    }
    .comments-submit-grid {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.85rem;
        align-items: stretch;
    }
    .comments-submit-grid .submit-btn {
        margin-top: 0;
        align-self: stretch;
        white-space: nowrap;
    }
    @media (max-width: 600px) {
        .comments-submit-grid {
            grid-template-columns: 1fr;
        }
    }
    .comments-input {
        width: 100%;
        min-height: 80px;
        padding: 0.8rem 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease, background 0.2s ease;
    }
    .comments-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
    .comments-input:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.45);
    }

    /* כוכבים + סמיילי דינמי */
    .star-rating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
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
        font-size: 2.4rem;
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
        opacity: 1;
    }
    .emoji-face {
        font-size: 2.6rem;
        line-height: 1;
    }
    .emoji-text {
        font-size: 1.05rem;
        font-weight: 700;
        color: #facc15;
        white-space: nowrap;
    }
    @media (max-width: 480px) {
        .star-rating { gap: 1rem; }
        .star { font-size: 2rem; }
        .emoji-face { font-size: 2.2rem; }
        .emoji-text { font-size: 0.95rem; }
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
        cursor: not-allowed;
        opacity: 0.92;
    }

    .submit-error {
        margin-top: 1rem;
        padding: 0.7rem 1rem;
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.55);
        border-radius: 10px;
        color: #fecaca;
        font-weight: 600;
    }

    @media (max-width: 900px) {
        .section {
            padding: 1.8rem 1.2rem;
        }
        .section h2 {
            font-size: 1.4rem;
        }
    }
</style>
