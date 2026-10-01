<script>
    /** כרטיס משותף לדפי שחזור הגישה (שכחתי סיסמה / איפוס סיסמה). */
    let { icon = '🔑', title, sub = '', children } = $props();
</script>

<section class="rec-page">
    <div class="rec-card">
        <div class="rec-icon" aria-hidden="true">{icon}</div>
        <h1>{title}</h1>
        {#if sub}<p class="rec-sub">{sub}</p>{/if}
        {@render children?.()}
    </div>
</section>

<style>
    .rec-page {
        max-width: 480px;
        margin: 2.5rem auto;
        padding: 0 1rem;
    }
    .rec-card {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 18px;
        padding: 1.8rem 1.4rem 1.5rem;
        text-align: right;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    }
    .rec-icon {
        width: 58px;
        height: 58px;
        display: grid;
        place-items: center;
        font-size: 1.9rem;
        border-radius: 16px;
        background: rgba(250, 204, 21, 0.14);
        border: 1px solid rgba(250, 204, 21, 0.35);
        margin-bottom: 0.9rem;
    }
    h1 {
        color: #facc15;
        font-size: 1.65rem;
        margin: 0 0 0.45rem;
    }
    .rec-sub {
        color: rgba(255, 255, 255, 0.72);
        line-height: 1.65;
        margin: 0 0 1.3rem;
    }
</style>
