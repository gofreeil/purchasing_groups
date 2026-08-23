<script>
    import { fmtMoney, STATUS_HE } from '$lib/memberships.js';

    let { data } = $props();

    let months = $derived(data.months ?? []);
    let deals = $derived(data.deals ?? []);
    let cities = $derived(data.cities ?? []);
    let totals = $derived(data.totals ?? { members: 0, memberships: 0, totalSaved: 0, monthlySaving: 0 });

    // גובה העמודה יחסי לחודש החזק ביותר — כך הגרף קריא בכל סדר גודל
    let peak = $derived(Math.max(1, ...months.map((/** @type {any} */ m) => m.joins)));
    let maxDeal = $derived(Math.max(1, ...deals.map((/** @type {any} */ d) => d.count)));
    let maxCity = $derived(Math.max(1, ...cities.map((/** @type {any} */ c) => c.count)));
</script>

<svelte:head>
    <title>סטטיסטיקה | ניהול</title>
    <meta name="robots" content="noindex" />
</svelte:head>

{#if !data.sourceConnected}
    <div class="no-source">
        🔌 <strong>מקור הנתונים עדיין לא חובר</strong> — כל המספרים במסך נגזרים מהחברויות בעסקאות,
        ויתמלאו ברגע שיחובר מקור אמת.
    </div>
{/if}

<div class="kpis">
    <div class="kpi"><span>חברים</span><strong>{fmtMoney(totals.members)}</strong></div>
    <div class="kpi"><span>חברויות בעסקאות</span><strong>{fmtMoney(totals.memberships)}</strong></div>
    <div class="kpi gold"><span>חיסכון חודשי</span><strong>{fmtMoney(totals.monthlySaving)} ₪</strong></div>
    <div class="kpi gold"><span>חיסכון מצטבר</span><strong>{fmtMoney(totals.totalSaved)} ₪</strong></div>
</div>

<section>
    <h2>📈 הצטרפויות ב-12 החודשים האחרונים</h2>
    <div class="chart">
        {#each months as m (m.key)}
            <div class="col" title="{m.label}: {m.joins} הצטרפויות">
                <span class="col-val">{m.joins || ''}</span>
                <div class="col-bar" style="height:{(m.joins / peak) * 100}%"></div>
                <span class="col-label">{m.label}</span>
            </div>
        {/each}
    </div>
</section>

<div class="two-up">
    <section>
        <h2>🤝 פילוח לפי עסקה</h2>
        <div class="rows">
            {#each deals as d (d.slug)}
                <div class="row">
                    <span class="row-name"><span aria-hidden="true">{d.icon}</span> {d.title}</span>
                    <div class="row-track"><div class="row-fill" style="width:{(d.count / maxDeal) * 100}%"></div></div>
                    <span class="row-val">{d.count}</span>
                    <span class="row-money">{fmtMoney(d.saved)} ₪</span>
                </div>
            {/each}
            {#if !deals.length}<p class="empty">אין נתונים</p>{/if}
        </div>
    </section>

    <section>
        <h2>📍 ערים מובילות</h2>
        <div class="rows">
            {#each cities as c (c.name)}
                <div class="row">
                    <span class="row-name">{c.name}</span>
                    <div class="row-track">
                        <div class="row-fill alt" style="width:{(c.count / maxCity) * 100}%"></div>
                    </div>
                    <span class="row-val">{c.count}</span>
                </div>
            {/each}
            {#if !cities.length}<p class="empty">אין נתונים</p>{/if}
        </div>
    </section>
</div>

<section>
    <h2>🗂️ מצב החברויות</h2>
    <div class="status-grid">
        {#each data.statuses as s (s.status)}
            <div class="status {STATUS_HE[s.status]?.tone ?? 'muted'}">
                <strong>{fmtMoney(s.count)}</strong>
                <span>{STATUS_HE[s.status]?.label ?? s.status}</span>
            </div>
        {/each}
    </div>
</section>

<style>
    .no-source {
        border-radius: 0.75rem;
        border: 1px solid rgba(59, 130, 246, 0.3);
        background: rgba(59, 130, 246, 0.08);
        color: #bfdbfe;
        padding: 0.7rem 1rem;
        font-size: 0.82rem;
        line-height: 1.6;
        margin-bottom: 1rem;
    }

    .kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        margin-bottom: 2rem;
    }
    .kpi {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.9rem 1rem;
        text-align: center;
    }
    .kpi span {
        display: block;
        font-size: 0.75rem;
        color: var(--text-gray);
        margin-bottom: 0.3rem;
    }
    .kpi strong {
        font-size: 1.5rem;
        font-weight: 900;
        color: #fff;
    }
    .kpi.gold strong {
        color: var(--accent-yellow);
    }
    @media (max-width: 700px) {
        .kpis {
            grid-template-columns: repeat(2, 1fr);
        }
        .kpi strong {
            font-size: 1.2rem;
        }
    }

    section {
        margin-bottom: 2rem;
    }
    section h2 {
        font-size: 1.02rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.85rem;
    }
    .two-up {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
        gap: 1.5rem;
    }
    .empty {
        color: #6b7280;
        font-size: 0.85rem;
    }

    /* ── גרף עמודות ── */
    .chart {
        display: flex;
        align-items: flex-end;
        gap: 0.4rem;
        height: 12rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem 0.75rem 0.5rem;
    }
    .col {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
        gap: 0.25rem;
        min-width: 0;
    }
    .col-val {
        font-size: 0.7rem;
        font-weight: 800;
        color: var(--accent-yellow);
    }
    .col-bar {
        width: 100%;
        max-width: 2.5rem;
        min-height: 2px;
        border-radius: 0.35rem 0.35rem 0 0;
        background: linear-gradient(to top, #2563eb, #7c3aed);
    }
    .col-label {
        font-size: 0.62rem;
        color: var(--text-gray);
        white-space: nowrap;
    }

    /* ── שורות פילוח ── */
    .rows {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
    }
    .row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.8rem;
    }
    .row-name {
        flex: 0 0 8.5rem;
        color: #e5e7eb;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .row-track {
        flex: 1;
        height: 0.5rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
    }
    .row-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(to left, #3b82f6, #7c3aed);
    }
    .row-fill.alt {
        background: linear-gradient(to left, #22c55e, #facc15);
    }
    .row-val {
        flex: 0 0 2rem;
        text-align: left;
        font-weight: 800;
        color: #fff;
    }
    .row-money {
        flex: 0 0 5.5rem;
        text-align: left;
        font-weight: 700;
        color: var(--accent-yellow);
        font-size: 0.75rem;
    }

    /* ── מצב החברויות ── */
    .status-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
        gap: 0.6rem;
    }
    .status {
        border-radius: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.85rem;
        text-align: center;
    }
    .status strong {
        display: block;
        font-size: 1.4rem;
        font-weight: 900;
        color: #fff;
    }
    .status span {
        font-size: 0.75rem;
        color: var(--text-gray);
    }
    .status.ok strong {
        color: #86efac;
    }
    .status.warn strong {
        color: #fcd34d;
    }
    .status.danger strong {
        color: #fca5a5;
    }
</style>
