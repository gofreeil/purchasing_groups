<script>
    import { fade } from "svelte/transition";
    import { invalidateAll } from "$app/navigation";

    // טופס דירוג + תגובה. הטופס תמיד גלוי; אם אורח (לא מחובר) מנסה לדרג/לשלוח,
    // מוצגת הודעת הרשמה במקום לבצע את הפעולה.
    // campaignSlug: ה-slug של המבצע; ratingCompanies: רשימת חברות לבחירה (או null);
    // loggedIn: האם המשתמש מחובר; loginHref: יעד כפתור ההרשמה.
    let { campaignSlug, ratingCompanies = null, loggedIn = true, loginHref = "/login" } = $props();

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
    let mustPickCompanyShake = $state(false);
    let showRegisterPrompt = $state(false); // מופיע רק כשאורח לוחץ על דירוג/שליחה

    let companies = $derived(
        Array.isArray(ratingCompanies) && ratingCompanies.length > 0 ? ratingCompanies : null,
    );
    let canRate = $derived(companies === null || selectedCompany !== null);
    let currentEmoji = $derived(EMOJI_BY_LEVEL[rating] ?? null);

    function selectCompany(name) {
        if (selectedCompany === name) return;
        selectedCompany = name;
        rating = 0;
    }

    function tryRate(n) {
        // אורח שלוחץ על דירוג - מציגים הודעת הרשמה ולא מדרגים
        if (!loggedIn) {
            showRegisterPrompt = true;
            return;
        }
        if (companies && !selectedCompany) {
            mustPickCompanyShake = true;
            setTimeout(() => (mustPickCompanyShake = false), 600);
            return;
        }
        rating = n;
    }

    async function handleSubmit() {
        if (!loggedIn) {
            showRegisterPrompt = true;
            return;
        }
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
            if (res.status === 401) {
                submitError = "נדרשת הרשמה כדי לדרג ולהגיב";
                return;
            }
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            submitted = true;
            invalidateAll();
        } catch (err) {
            console.error("submit failed:", err);
            submitError = "השליחה נכשלה - נסה שוב בעוד מספר רגעים";
        }
    }
</script>

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
                <div class="survey-step company-step">
                    <span class="step-label">בחר חברה:</span>
                    <div
                        class="company-row"
                        class:shake={mustPickCompanyShake}
                        role="radiogroup"
                        aria-label="בחר חברה לדירוג"
                    >
                        {#each companies as company}
                            <button
                                type="button"
                                role="radio"
                                aria-checked={selectedCompany === company}
                                class="company-box"
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

        {#if showRegisterPrompt}
            <div class="register-prompt" in:fade={{ duration: 220 }} role="alert">
                <span class="register-prompt-icon" aria-hidden="true">🔒</span>
                <p class="register-prompt-text">
                    הדירוג והדעה שלך חשובים לנו, אנא הירשם תחילה על מנת לוודא שבוטים לא מעורבים בהצבעה והתגובות
                </p>
                <a href={loginHref} class="register-prompt-btn">הרשמה / התחברות</a>
            </div>
        {/if}

        <div class="comments-row">
            <label for="rate-comments" class="comments-label">הערות לגבי החברה המדורגת בלבד:</label>
            <div class="comments-submit-grid">
                <textarea
                    id="rate-comments"
                    class="comments-input"
                    bind:value={comments}
                    placeholder={`שירות החברה, מהירות הגלישה,
כמה כסף אני חוסך בחודש, כמה בשנה
וכו'`}
                    rows="3"
                ></textarea>
                <div class="submit-stack">
                    <input type="text" class="text-input" bind:value={userName} placeholder="שם" aria-label="שם" />
                    <input type="text" class="text-input" bind:value={userCity} placeholder="עיר" aria-label="עיר" />
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

<style>
    .thank-you {
        padding: 2rem;
        text-align: center;
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

    .survey-inline-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.1rem;
    }
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
        .survey-inline-row { gap: 0.6rem; }
        .step-label { font-size: 1rem; }
        .survey-step { gap: 0.35rem; min-width: 0; }
    }

    /* בחירת חברה - תווית בשורה למעלה, שלוש החברות פרוסות מתחת במסגרות מרובעות-מעוגלות */
    .company-step {
        flex: 1 0 100%;          /* תופס שורה שלמה משלו */
        flex-direction: column;
        align-items: stretch;
        gap: 0.45rem;
    }
    .company-step .step-label {
        text-align: center;
    }
    .company-row {
        display: flex;
        gap: 0.5rem;
        width: 100%;
    }
    .company-box {
        flex: 1 1 0;             /* שלושתם ברוחב שווה, פרוסים על כל השורה */
        min-width: 0;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;     /* מרובע עם פינות מעוגלות, לא גלולה */
        padding: 0.55rem 0.4rem;
        color: rgba(255, 255, 255, 0.88);
        font-size: 1rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: all 0.18s ease;
    }
    .company-box:hover {
        background: rgba(250, 204, 21, 0.1);
        border-color: rgba(250, 204, 21, 0.5);
    }
    .company-box.selected {
        background: linear-gradient(135deg, #facc15, #fb923c);
        border-color: #facc15;
        color: #1a1a1a;
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.35);
    }
    .company-row.shake {
        animation: pickerShake 0.55s ease;
    }
    .company-row.shake .company-box {
        border-color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.45);
    }
    @keyframes pickerShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }
    @media (prefers-reduced-motion: reduce) {
        .company-row.shake { animation: none; }
    }
    .rating-hint {
        margin: 0.75rem 0 0;
        text-align: center;
        color: #facc15;
        font-size: 0.95rem;
        font-weight: 600;
    }

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
        gap: 1.5rem;
        align-items: stretch;   /* ה-textarea נמתח אנכית עד תחתית הכפתור השלישי */
    }
    .comments-submit-grid .submit-btn {
        margin-top: 0;
        white-space: nowrap;
    }
    @media (max-width: 600px) {
        .comments-submit-grid {
            grid-template-columns: 1fr;
            gap: 0.85rem;
        }
        .comments-input { max-width: 100%; }
    }
    .submit-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: 140px;
    }
    .submit-stack .text-input {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }
    @media (max-width: 600px) {
        .submit-stack {
            width: 70%;
        }
    }
    .comments-input {
        width: 100%;
        max-width: 490px;          /* רוחב המסגרת - מורחב שמאלה עם רווח מהכפתורים */
        justify-self: start;       /* RTL: עוגן לימין; הקצה השמאלי זז ימינה → רווח מהכפתורים */
        box-sizing: border-box;    /* כולל את ה-padding ברוחב, אחרת ה-textarea חורג מהמכל שמאלה בנייד */
        min-height: 0;
        height: auto;
        padding: 0.55rem 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease, background 0.2s ease;
    }
    .comments-input::placeholder { color: rgba(255, 255, 255, 0.4); }
    .comments-input:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.45);
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
        padding: 0.75rem 0.6rem;
        font-size: 0.95rem;
        white-space: nowrap;
    }
    .submit-btn:disabled {
        cursor: not-allowed;
        opacity: 0.92;
    }

    .submit-error {
        margin-top: 0.8rem;
        padding: 0.6rem 1rem;
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.55);
        border-radius: 10px;
        color: #fecaca;
        font-weight: 600;
        text-align: center;
    }

    /* הודעת הרשמה - מופיעה רק כשאורח לוחץ על הדירוג, הטופס נשאר גלוי מעליה */
    .register-prompt {
        margin: 1rem auto 0;
        max-width: 560px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
        padding: 1.2rem 1.4rem;
        background: rgba(250, 204, 21, 0.08);
        border: 1px solid rgba(250, 204, 21, 0.45);
        border-radius: 14px;
        text-align: center;
    }
    .register-prompt-icon {
        font-size: 2.2rem;
        line-height: 1;
    }
    .register-prompt-text {
        margin: 0;
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.6;
        color: rgba(255, 255, 255, 0.92);
    }
    .register-prompt-btn {
        display: inline-block;
        padding: 0.7rem 2rem;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        font-size: 1.02rem;
        font-weight: 800;
        border-radius: 12px;
        text-decoration: none;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
    }
    .register-prompt-btn:hover {
        transform: translateY(-3px) scale(1.03);
        box-shadow: 0 10px 22px rgba(250, 204, 21, 0.4);
    }
</style>
