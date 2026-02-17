<script>
    import { lang, t } from "$lib/i18n.js";
</script>

<div
    class="privacy-container"
    style="direction: {$lang === 'he' ? 'rtl' : 'ltr'}; text-align: {$lang ===
    'he'
        ? 'right'
        : 'left'};"
>
    <div class="content-wrapper">
        <h1 class="main-title">{$t.footer.privacy}</h1>
        <p class="last-updated">{$t.footer.lastUpdated}</p>

        {#each $t.footer.privacySections as section}
            <section class="privacy-section">
                <h2>{section.title}</h2>
                <p>{section.content}</p>
                {#if section.list}
                    <ul>
                        {#each section.list as item}
                            <li>{item}</li>
                        {/each}
                    </ul>
                {/if}
            </section>
        {/each}
    </div>
</div>

<style>
    .privacy-container {
        padding: 4rem 2rem;
        min-height: 80vh;
        background: transparent;
        color: var(--text-white);
        font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.05); /* רקע עדין לקריאות */
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .main-title {
        font-size: 2.5rem;
        color: #facc15;
        margin-bottom: 0.5rem;
        text-align: center;
    }

    .last-updated {
        text-align: center;
        color: var(--text-gray);
        margin-bottom: 3rem;
        font-size: 0.9rem;
    }

    .privacy-section {
        margin-bottom: 2.5rem;
    }

    h2 {
        font-size: 1.5rem;
        color: #4ade80;
        margin-bottom: 1rem;
        border-bottom: 1px solid rgba(74, 222, 128, 0.3);
        padding-bottom: 0.5rem;
        display: inline-block;
    }

    p {
        line-height: 1.6;
        margin-bottom: 1rem;
        font-size: 1.05rem;
        color: #e2e8f0;
    }

    ul {
        padding-right: 1.5rem;
        margin-bottom: 1rem;
    }

    li {
        margin-bottom: 0.8rem;
        line-height: 1.5;
        color: #cbd5e1;
    }

    @media (max-width: 768px) {
        .privacy-container {
            padding: 2rem 1rem;
        }

        .content-wrapper {
            padding: 1.5rem;
        }

        .main-title {
            font-size: 1.8rem;
        }

        h2 {
            font-size: 1.3rem;
        }

        p,
        li {
            font-size: 0.95rem;
        }
    }
</style>
