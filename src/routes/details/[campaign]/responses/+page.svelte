<script>
    import RatingForm from "$lib/components/RatingForm.svelte";

    let { data } = $props();

    let loginHref = $derived(
        `/login?returnTo=${encodeURIComponent(`/details/${data.campaign?.slug ?? ""}/responses`)}`,
    );

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
        <p class="responses-page-tagline">כל הדירוגים והתגובות</p>
        <p class="responses-page-sub">
            {#if data.campaign?.title}{data.campaign.title}{/if}
            {#if data.ratingCount > 0}
                · ממוצע {data.averageRating.toFixed(1)}/5 ({data.ratingCount})
            {/if}
        </p>
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

    {#if data.responses.length === 0}
        <p class="empty-state">אין עדיין תגובות. תהיה הראשון!</p>
    {:else}
        <div class="responses-list">
            {#each data.responses as r (r.id)}
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
                        {#if r.user_name || r.user_city}
                            <div class="response-user">
                                {#if r.user_name}<span class="response-name">{r.user_name}</span>{/if}
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
        color: rgba(255, 255, 255, 0.85);
        font-size: 1.2rem;
        font-weight: 600;
        margin: 0 0 0.6rem;
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
</style>
