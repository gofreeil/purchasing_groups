<script>
    import { t } from "$lib/i18n.js";
    import { fade } from "svelte/transition";

    // Campaign list - later this will come from Strapi.
    const campaigns = [
        { key: "cellular", icon: "📱" },
        { key: "internet", icon: "🌐" },
        { key: "fuel", icon: "⛽" },
        { key: "carInsurance", icon: "🚗" },
        { key: "electricity", icon: "⚡" },
        { key: "coupons", icon: "🎟️" },
    ];
</script>

<svelte:head>
    <title>{$t.satisfaction.chooseTitle} | {$t.title}</title>
</svelte:head>

<div class="surveys-hub" in:fade={{ duration: 300 }}>
    <h1 class="hub-title">{$t.satisfaction.chooseTitle}</h1>
    <p class="hub-subtitle">{$t.satisfaction.chooseSubtitle}</p>

    <div class="campaigns-grid">
        {#each campaigns as campaign}
            <a href="/satisfaction/{campaign.key}" class="campaign-card">
                <span class="campaign-icon">{campaign.icon}</span>
                <span class="campaign-name"
                    >{$t.purchases[campaign.key].title}</span
                >
                <span class="campaign-cta">{$t.satisfaction.title} →</span>
            </a>
        {/each}
    </div>
</div>

<style>
    .surveys-hub {
        max-width: 900px;
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

    .hub-title {
        font-size: 2.5rem;
        font-weight: 800;
        margin-bottom: 0.8rem;
        color: #facc15;
    }

    .hub-subtitle {
        font-size: 1.1rem;
        color: rgba(255, 255, 255, 0.7);
        margin-bottom: 3rem;
    }

    .campaigns-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 1.5rem;
    }

    .campaign-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.8rem;
        padding: 2rem 1.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 16px;
        text-decoration: none;
        color: white;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .campaign-card:hover {
        transform: translateY(-6px);
        border-color: #facc15;
        background: rgba(250, 204, 21, 0.08);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
    }

    .campaign-icon {
        font-size: 3rem;
    }

    .campaign-name {
        font-size: 1.15rem;
        font-weight: 700;
    }

    .campaign-cta {
        font-size: 0.95rem;
        font-weight: 600;
        color: #facc15;
    }

    @media (max-width: 600px) {
        .surveys-hub {
            margin: 1rem;
            padding: 1.5rem;
        }

        .hub-title {
            font-size: 1.8rem;
        }

        .campaigns-grid {
            grid-template-columns: 1fr;
        }
    }
</style>
