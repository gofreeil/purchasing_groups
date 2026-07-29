<script>
    import RatingForm from "$lib/components/RatingForm.svelte";
    import { invalidateAll } from "$app/navigation";

    let { data } = $props();

    // שם תצוגה ידידותי. לעולם לא להציג מזהה אוטומטי כמו "google_1164663...".
    const AUTO_ID = /^(google|facebook|apple|community|local)[_-]/i;
    /** @param {string|null|undefined} s @param {string} [fallback] */
    function humanName(s, fallback = '') {
        if (!s || AUTO_ID.test(s)) return fallback;
        return s;
    }
    /** השם הנקי של המשתמש המחובר, לשמירה בתגובות חדשות */
    let myName = $derived(
        humanName(data.user?.name) || humanName(data.user?.username) || '',
    );

    let loginHref = $derived(
        `/login?returnTo=${encodeURIComponent(`/details/${data.campaign?.slug ?? ""}/responses`)}`,
    );

    // ─── אדמין: מחיקת תגובה (super_admin בלבד) ───
    let adminIsSuper = $derived(data.user?.app_role === 'super_admin');
    /** @type {string | null} */
    let deletingId = $state(null);

    // ─── לייק + תגובה ציבוריים (לכל משתמש מחובר) ───
    let loggedIn = $derived(!!data.user);
    let currentUserId = $derived(data.user?.id != null ? String(data.user.id) : null);
    let showLoginPrompt = $state(false);

    // override-ים אופטימיים לפי documentId
    /** @type {Record<string, { likes: number, liked: boolean }>} */
    let likeOverride = $state({});
    /** @type {Record<string, boolean>} */
    let likeBusy = $state({});
    /** @type {Record<string, import('$lib/strapi.js').SatisfactionReply[]>} */
    let repliesOverride = $state({});
    /** @type {Record<string, boolean>} */
    let replyOpen = $state({});
    /** @type {Record<string, string>} */
    let replyDraft = $state({});
    /** @type {Record<string, boolean>} */
    let replyBusy = $state({});

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    function likeState(r) {
        const o = likeOverride[r.documentId];
        if (o) return o;
        const arr = Array.isArray(r.liked_by) ? r.liked_by.map(String) : [];
        const likes = typeof r.likes === 'number' ? r.likes : arr.length;
        const liked = currentUserId ? arr.includes(currentUserId) : false;
        return { likes, liked };
    }

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    function repliesFor(r) {
        const o = repliesOverride[r.documentId];
        if (Array.isArray(o)) return o;
        return Array.isArray(r.replies) ? r.replies : [];
    }

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    async function toggleLike(r) {
        if (!loggedIn) { showLoginPrompt = true; return; }
        if (!r.documentId || likeBusy[r.documentId]) return;
        const cur = likeState(r);
        likeOverride = { ...likeOverride, [r.documentId]: { likes: cur.likes + (cur.liked ? -1 : 1), liked: !cur.liked } };
        likeBusy = { ...likeBusy, [r.documentId]: true };
        try {
            const res = await fetch(`/api/responses/${r.documentId}/like`, { method: 'POST' });
            if (!res.ok) throw new Error((await res.text()).slice(0, 200));
            const out = await res.json();
            likeOverride = { ...likeOverride, [r.documentId]: { likes: out.likes, liked: out.liked } };
        } catch (e) {
            likeOverride = { ...likeOverride, [r.documentId]: cur };
            alert('שמירת הלייק נכשלה, נסה שוב');
        } finally {
            likeBusy = { ...likeBusy, [r.documentId]: false };
        }
    }

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    function toggleReplyBox(r) {
        if (!loggedIn) { showLoginPrompt = true; return; }
        replyOpen = { ...replyOpen, [r.documentId]: !replyOpen[r.documentId] };
    }

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    async function submitReply(r) {
        if (!loggedIn) { showLoginPrompt = true; return; }
        const text = (replyDraft[r.documentId] ?? '').trim();
        if (!text || replyBusy[r.documentId]) return;
        replyBusy = { ...replyBusy, [r.documentId]: true };
        try {
            const res = await fetch(`/api/responses/${r.documentId}/reply`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ text, user_name: myName }),
            });
            if (!res.ok) throw new Error((await res.text()).slice(0, 200));
            const out = await res.json();
            repliesOverride = { ...repliesOverride, [r.documentId]: out.replies };
            replyDraft = { ...replyDraft, [r.documentId]: '' };
            replyOpen = { ...replyOpen, [r.documentId]: false };
        } catch (e) {
            alert('שליחת התגובה נכשלה, נסה שוב');
        } finally {
            replyBusy = { ...replyBusy, [r.documentId]: false };
        }
    }

    /** @param {import('$lib/strapi.js').SatisfactionResponse} r */
    async function deleteResponse(r) {
        if (!r.documentId) return;
        if (!confirm('למחוק את התגובה הזו לצמיתות?')) return;
        deletingId = r.documentId;
        try {
            const res = await fetch(`/api/admin/responses/${r.documentId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.text()).slice(0, 200));
            await invalidateAll();
        } catch (e) {
            alert(`שגיאה במחיקה: ${/** @type {Error} */ (e).message}`);
        } finally {
            deletingId = null;
        }
    }

    /** @param {string} iso */
    function formatDate(iso) {
        try {
            const d = new Date(iso);
            const date = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
            const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            return `${date}, ${time}`;
        } catch { return ''; }
    }
</script>

<svelte:head>
    <title>כל התגובות והדירוגים | {data.campaign?.title ?? 'קמפיין'}</title>
</svelte:head>

<section class="responses-page">
    <header class="responses-page-head">
        <h1>שביעות רצון משירות החברה והמבצע</h1>
        <p class="responses-page-tagline">
            {#if data.campaign?.title}{data.campaign.title} {/if}כל הדירוגים והתגובות
        </p>
        {#if data.ratingCount > 0}
            <div class="rating-badge" aria-label={`ממוצע ${data.averageRating.toFixed(1)} מתוך 5 מתוך ${data.ratingCount} דירוגים`}>
                <span class="stars-gold" aria-hidden="true">⭐⭐⭐⭐⭐</span>
                <span class="rating-val">{data.averageRating.toFixed(1)}/5 ({data.ratingCount})</span>
            </div>
        {/if}
    </header>

    <section class="rate-section">
        <h2 class="rate-title">דרגו ושתפו את דעתכם</h2>
        <RatingForm
            campaignSlug={data.campaign?.slug ?? ''}
            ratingCompanies={data.campaign?.rating_companies ?? null}
            loggedIn={!!data.user}
            {loginHref}
        />
    </section>

    {#if showLoginPrompt && !loggedIn}
        <div class="register-prompt" role="alert">
            <span class="register-prompt-icon" aria-hidden="true">🔒</span>
            <p class="register-prompt-text">
                כדי לסמן לייק או להגיב, אנא הירשם תחילה — כך נוודא שאין בוטים בהצבעות ובתגובות
            </p>
            <a href={loginHref} class="register-prompt-btn">הרשמה / התחברות</a>
        </div>
    {/if}

    {#if data.responses.length === 0}
        <p class="empty-state">אין עדיין תגובות. תהיה הראשון!</p>
    {:else}
        <div class="responses-list">
            {#each data.responses as r (r.id)}
                {@const ls = likeState(r)}
                {@const reps = repliesFor(r)}
                <div class="response-item" class:featured={r.is_featured}>
                    <div class="response-header">
                        <span class="response-stars">{'★'.repeat(r.level)}{'☆'.repeat(5 - r.level)}</span>
                        {#if r.company}
                            <span class="response-company">{r.company}</span>
                        {/if}
                        {#if r.is_featured}<span class="response-pin" title="תגובה מובילה">📌</span>{/if}
                        {#if r.admin_liked}<span class="response-like" title="אהוב על האדמין">❤️</span>{/if}
                        <span class="response-date">{formatDate(r.createdAt || r.submitted_at)}</span>
                    </div>
                    <div class="response-body">
                        {#if humanName(r.user_name) || r.user_city}
                            <div class="response-user">
                                {#if humanName(r.user_name)}<span class="response-name">{humanName(r.user_name)}</span>{/if}
                                {#if r.user_city}<span class="response-city">{r.user_city}</span>{/if}
                            </div>
                        {/if}
                        {#if r.comments}<p class="response-text">{r.comments}</p>{/if}
                    </div>
                    {#if r.admin_reply}
                        <div class="response-admin-reply">
                            <span class="admin-reply-label">תגובת האדמין:</span>
                            <p class="admin-reply-text">{r.admin_reply}</p>
                        </div>
                    {/if}

                    <!-- פעולות ציבוריות: לייק + הגב (לכל משתמש מחובר) -->
                    <div class="response-actions">
                        <button
                            type="button"
                            class="action-btn like-btn"
                            class:liked={ls.liked}
                            onclick={() => toggleLike(r)}
                            disabled={likeBusy[r.documentId]}
                            aria-pressed={ls.liked}
                            title={ls.liked ? 'בטל לייק' : 'אהבתי'}
                        >
                            <span class="action-icon">{ls.liked ? '❤️' : '🤍'}</span>
                            <span class="action-label">אהבתי</span>
                            {#if ls.likes > 0}<span class="like-count">{ls.likes}</span>{/if}
                        </button>
                        <button
                            type="button"
                            class="action-btn reply-toggle"
                            onclick={() => toggleReplyBox(r)}
                            title="הגב לתגובה"
                        >
                            <span class="action-icon">💬</span>
                            <span class="action-label">הגב{reps.length > 0 ? ` (${reps.length})` : ''}</span>
                        </button>
                    </div>

                    {#if reps.length > 0}
                        <div class="replies-list">
                            {#each reps as rep, i (i)}
                                <div class="reply-item" class:admin={rep.is_admin}>
                                    <div class="reply-meta">
                                        <span class="reply-name">{humanName(rep.user_name, 'משתמש')}{#if rep.is_admin} <span class="reply-admin-tag">מנהל</span>{/if}</span>
                                        {#if rep.created_at}<span class="reply-date">{formatDate(rep.created_at)}</span>{/if}
                                    </div>
                                    <p class="reply-text">{rep.text}</p>
                                </div>
                            {/each}
                        </div>
                    {/if}

                    {#if replyOpen[r.documentId]}
                        <div class="reply-box">
                            <textarea
                                class="reply-input"
                                rows="2"
                                placeholder="כתוב תגובה…"
                                value={replyDraft[r.documentId] ?? ''}
                                oninput={(e) => (replyDraft = { ...replyDraft, [r.documentId]: e.currentTarget.value })}
                            ></textarea>
                            <div class="reply-box-actions">
                                <button
                                    type="button"
                                    class="reply-send-btn"
                                    onclick={() => submitReply(r)}
                                    disabled={replyBusy[r.documentId] || !((replyDraft[r.documentId] ?? '').trim())}
                                >
                                    {replyBusy[r.documentId] ? 'שולח…' : 'שלח תגובה'}
                                </button>
                            </div>
                        </div>
                    {/if}

                    {#if adminIsSuper}
                        <div class="admin-controls">
                            <button
                                type="button"
                                class="admin-del-btn"
                                disabled={deletingId === r.documentId}
                                onclick={() => deleteResponse(r)}
                                title="מחק תגובה"
                            >
                                🗑️ {deletingId === r.documentId ? 'מוחק…' : 'מחק'}
                            </button>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    <a class="back-link" href={`/details/${data.campaign?.slug ?? ''}`}>
        ← חזרה לדף המבצע
    </a>
</section>

<style>
    .responses-page {
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1rem;
    }

    /* אזור הדירוג - טופס למחוברים, הודעת הרשמה לאורחים */
    .rate-section {
        background: linear-gradient(135deg, rgba(35, 45, 75, 0.88), rgba(45, 35, 65, 0.88));
        border: 1px solid rgba(250, 204, 21, 0.18);
        border-radius: 20px;
        padding: 1.5rem 1.5rem 1.75rem;
        margin-bottom: 2rem;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
    }
    .rate-title {
        text-align: center;
        color: #facc15;
        font-size: 1.4rem;
        font-weight: 800;
        margin: 0 0 1.2rem;
    }
    .responses-page-head {
        text-align: center;
        margin-bottom: 2rem;
    }
    .responses-page-head h1 {
        color: #facc15;
        font-size: 2.4rem;
        font-weight: 800;
        line-height: 1.15;
        margin: 0 0 0.5rem;
    }
    .responses-page-tagline {
        color: rgba(255, 255, 255, 0.92);
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0 0 0.6rem;
    }
    /* באדג' ממוצע עם כוכבים - עיצוב זהה לדף הבית */
    .rating-badge {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        margin-top: 0.7rem;
        padding: 6px 16px;
        background: rgba(10, 17, 40, 0.9);
        border: 1px solid rgba(250, 204, 21, 0.4);
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
    .rating-badge .stars-gold {
        font-size: 1.1rem;
        letter-spacing: 1px;
    }
    .rating-badge .rating-val {
        font-size: 0.9rem;
        font-weight: bold;
        color: #facc15;
    }
    @media (max-width: 600px) {
        .responses-page-head h1 { font-size: 1.85rem; }
        .responses-page-tagline { font-size: 1.05rem; }
    }
    .responses-page-sub {
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 1rem;
    }
    .back-link {
        display: block;
        text-align: center;
        margin-top: 2rem;
        color: #facc15;
        text-decoration: none;
        font-weight: 600;
    }
    .back-link:hover { color: #fde047; }
    .empty-state {
        text-align: center;
        color: rgba(255, 255, 255, 0.55);
        padding: 3rem 1rem;
    }
    .responses-list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .response-item {
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 0.85rem 1.1rem;
    }
    .response-item.featured {
        border-color: rgba(250, 204, 21, 0.45);
        background: rgba(250, 204, 21, 0.05);
    }
    .response-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.3rem;
        flex-wrap: wrap;
    }
    .response-stars {
        color: #facc15;
        letter-spacing: 1px;
        font-size: 1.05rem;
    }
    .response-company {
        background: rgba(250, 204, 21, 0.12);
        border: 1px solid rgba(250, 204, 21, 0.35);
        border-radius: 999px;
        padding: 0.1rem 0.7rem;
        font-size: 0.85rem;
        color: #facc15;
        font-weight: 600;
    }
    .response-date {
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.85rem;
        margin-inline-start: auto;
    }
    .response-pin, .response-like {
        font-size: 1rem;
        line-height: 1;
    }
    .response-body {
        display: flex;
        gap: 1rem;
        margin-top: 0.75rem;
        align-items: flex-start;
    }
    .response-user {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        flex-shrink: 0;
        min-width: 6rem;
        max-width: 9rem;
    }
    .response-name {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        font-weight: 700;
    }
    .response-city {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
    }
    .response-text {
        flex: 1;
        margin: 0;
        color: rgba(255, 255, 255, 0.88);
        line-height: 1.5;
        white-space: pre-wrap;
        text-align: right;
    }
    .response-admin-reply {
        margin-top: 0.75rem;
        padding: 0.6rem 0.85rem;
        background: rgba(96, 165, 250, 0.08);
        border-right: 3px solid rgba(96, 165, 250, 0.6);
        border-radius: 8px;
    }
    .admin-reply-label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: rgba(96, 165, 250, 0.95);
        margin-bottom: 0.25rem;
    }
    .admin-reply-text {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.92rem;
        line-height: 1.5;
        white-space: pre-wrap;
        text-align: right;
    }
    .admin-controls {
        display: flex;
        justify-content: flex-start;
        margin-top: 0.6rem;
        padding-top: 0.6rem;
        border-top: 1px dashed rgba(255, 255, 255, 0.1);
    }
    .admin-del-btn {
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.5);
        color: #fecaca;
        padding: 0.3rem 0.8rem;
        border-radius: 6px;
        font-size: 0.85rem;
        font-weight: 600;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s ease;
    }
    .admin-del-btn:hover:not(:disabled) {
        background: rgba(220, 38, 38, 0.25);
    }
    .admin-del-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* ── פעולות ציבוריות: לייק + הגב ── */
    .response-actions {
        display: flex;
        gap: 0.6rem;
        margin-top: 0.75rem;
        flex-wrap: wrap;
    }
    .action-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.85);
        padding: 0.3rem 0.75rem;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 600;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
    }
    .action-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(250, 204, 21, 0.4);
    }
    .action-btn:active:not(:disabled) { transform: scale(0.96); }
    .action-btn:disabled { opacity: 0.7; cursor: default; }
    .action-icon { font-size: 1rem; line-height: 1; }
    .like-btn.liked {
        background: rgba(244, 63, 94, 0.12);
        border-color: rgba(244, 63, 94, 0.5);
        color: #fda4af;
    }
    .like-count {
        background: rgba(250, 204, 21, 0.18);
        color: #facc15;
        border-radius: 999px;
        padding: 0 0.45rem;
        font-size: 0.8rem;
        font-weight: 700;
        min-width: 1.2rem;
        text-align: center;
    }

    /* ── רשימת תגובות-לתגובה ── */
    .replies-list {
        margin-top: 0.7rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        padding-inline-start: 0.5rem;
        border-inline-start: 2px solid rgba(255, 255, 255, 0.08);
    }
    .reply-item {
        background: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
    }
    .reply-item.admin {
        background: rgba(96, 165, 250, 0.08);
        border-inline-start: 3px solid rgba(96, 165, 250, 0.6);
    }
    .reply-meta {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.2rem;
        flex-wrap: wrap;
    }
    .reply-name {
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.85rem;
        font-weight: 700;
    }
    .reply-admin-tag {
        background: rgba(96, 165, 250, 0.2);
        color: #93c5fd;
        border-radius: 6px;
        padding: 0 0.35rem;
        font-size: 0.7rem;
        font-weight: 700;
    }
    .reply-date {
        color: rgba(255, 255, 255, 0.4);
        font-size: 0.78rem;
        margin-inline-start: auto;
    }
    .reply-text {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.9rem;
        line-height: 1.45;
        white-space: pre-wrap;
        text-align: right;
    }

    /* ── תיבת כתיבת תגובה ── */
    .reply-box {
        margin-top: 0.6rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .reply-input {
        width: 100%;
        box-sizing: border-box;
        padding: 0.5rem 0.75rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.95);
        font-size: 0.9rem;
        font-family: inherit;
        resize: vertical;
        text-align: right;
    }
    .reply-input::placeholder { color: rgba(255, 255, 255, 0.4); }
    .reply-input:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.45);
    }
    .reply-box-actions {
        display: flex;
        justify-content: flex-start;
    }
    .reply-send-btn {
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border: none;
        border-radius: 8px;
        padding: 0.4rem 1.1rem;
        font-size: 0.88rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .reply-send-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(250, 204, 21, 0.3);
    }
    .reply-send-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    /* ── הודעת הרשמה לאורח ── */
    .register-prompt {
        margin: 0 auto 1.5rem;
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
    .register-prompt-icon { font-size: 2.2rem; line-height: 1; }
    .register-prompt-text {
        margin: 0;
        font-size: 1.02rem;
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
