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

    // ── תנועה באתר ──
    let traffic = $derived(data.siteTraffic ?? null);
    /** @type {{ key: 'visits' | 'pageviews' | 'dealClicks' | 'joinClicks', icon: string, label: string, hint: string }[]} */
    const TRAFFIC_ROWS = [
        { key: 'visits', icon: '🚪', label: 'כניסות לאתר', hint: 'גולש אחד = כניסה אחת, גם אם עבר בין כמה דפים' },
        { key: 'pageviews', icon: '👁️', label: 'צפיות בדפים', hint: 'כל דף שנפתח' },
        { key: 'dealClicks', icon: '🤝', label: 'לחיצות על מבצע', hint: 'לחיצה על כרטיס מבצע בדף הבית' },
        { key: 'joinClicks', icon: '📝', label: 'לחיצות על טופס ההצטרפות', hint: 'לחיצה על הטופס בדף המבצע' },
    ];
    let dailyPeak = $derived(
        Math.max(1, ...((traffic?.daily ?? []).map((/** @type {any} */ d) => d.visit))),
    );
    let trafficDeals = $derived(traffic?.deals ?? []);
    let trafficPages = $derived(traffic?.pages ?? []);
    let maxPage = $derived(Math.max(1, ...trafficPages.map((/** @type {any} */ p) => p.views)));

    /** אחוז המרה: כמה מהלוחצים על המבצע המשיכו לטופס. @param {number} clicks @param {number} joins */
    const conversion = (clicks, joins) => (clicks > 0 ? Math.round((joins / clicks) * 100) : 0);
    /** @param {string} day YYYY-MM-DD → "17.9" */
    const shortDay = (day) => {
        const [, m, d] = day.split('-');
        return `${Number(d)}.${Number(m)}`;
    };
    /** @param {string} day YYYY-MM-DD → תאריך מלא בעברית */
    const longDay = (day) => new Date(`${day}T12:00:00`).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
    /** @param {string} path */
    const pageName = (path) => (path === '/' ? 'דף הבית' : path);
</script>

<svelte:head>
    <title>סטטיסטיקה | ניהול</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<!-- ═══ תנועה באתר: כניסות, צפיות, לחיצות על מבצע ועל טופס ההצטרפות ═══ -->
<section class="traffic">
    <h2>🌐 תנועה באתר</h2>
    {#if !traffic}
        <div class="no-source">
            🔌 <strong>מוני התנועה עדיין לא מחוברים</strong> — הספירה נשמרת ב-Strapi
            (pg-site-events) ותופיע כאן ברגע שה-backend ייפרס עם המונים.
        </div>
    {:else}
        <div class="traffic-table-wrap">
            <table class="traffic-table">
                <thead>
                    <tr>
                        <th class="th-name"></th>
                        <th>היום</th>
                        <th>7 ימים</th>
                        <th>30 יום</th>
                        <th class="th-all">סה"כ</th>
                    </tr>
                </thead>
                <tbody>
                    {#each TRAFFIC_ROWS as row (row.key)}
                        {@const v = traffic[row.key]}
                        <tr>
                            <th class="row-head" title={row.hint}>
                                <span aria-hidden="true">{row.icon}</span> {row.label}
                            </th>
                            <td>{fmtMoney(v.today)}</td>
                            <td>{fmtMoney(v.d7)}</td>
                            <td>{fmtMoney(v.d30)}</td>
                            <td class="td-all">{fmtMoney(v.all)}</td>
                        </tr>
                    {/each}
                    <tr class="conv-row">
                        <th class="row-head" title="כמה מהלוחצים על מבצע המשיכו לטופס ההצטרפות">
                            <span aria-hidden="true">🎯</span> המרה: מבצע → טופס
                        </th>
                        <td>{conversion(traffic.dealClicks.today, traffic.joinClicks.today)}%</td>
                        <td>{conversion(traffic.dealClicks.d7, traffic.joinClicks.d7)}%</td>
                        <td>{conversion(traffic.dealClicks.d30, traffic.joinClicks.d30)}%</td>
                        <td class="td-all">{conversion(traffic.dealClicks.all, traffic.joinClicks.all)}%</td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p class="traffic-note">
            {#if traffic.since}נספר מאז {longDay(traffic.since)}.{:else}עדיין לא נרשמה תנועה.{/if}
            לא כולל גלישה של הצוות (אדמינים) ובוטים. "היום" לפי שעון ישראל.
        </p>

        <h3>🚪 כניסות לאתר ב-30 הימים האחרונים</h3>
        <div class="chart">
            {#each traffic.daily as d, i (d.day)}
                <div
                    class="col"
                    title="{longDay(d.day)}: {d.visit} כניסות · {d.pageview} צפיות · {d.deal_click} לחיצות על מבצע · {d.join_click} לחיצות על טופס"
                >
                    <span class="col-val">{d.visit || ''}</span>
                    <div class="col-bar" style="height:{(d.visit / dailyPeak) * 100}%"></div>
                    <span class="col-label" class:hidden={i % 5 !== 4 && i !== traffic.daily.length - 1}>{shortDay(d.day)}</span>
                </div>
            {/each}
        </div>

        <div class="two-up">
            <section>
                <h3>🤝 לפי מבצע</h3>
                <div class="rows deals-table">
                    <div class="deal-head">
                        <span class="row-name"></span>
                        <span class="deal-col" title="לחיצות על כרטיס המבצע: 30 יום / סה&quot;כ">מבצע</span>
                        <span class="deal-col" title="לחיצות על טופס ההצטרפות: 30 יום / סה&quot;כ">טופס</span>
                        <span class="deal-conv" title="כמה מהלוחצים על המבצע המשיכו לטופס (30 יום)">המרה</span>
                    </div>
                    {#each trafficDeals as d (d.slug)}
                        <div class="row">
                            <span class="row-name"><span aria-hidden="true">{d.icon}</span> {d.title}</span>
                            <span class="deal-col"><strong>{fmtMoney(d.dealClicks30)}</strong><small>/ {fmtMoney(d.dealClicks)}</small></span>
                            <span class="deal-col"><strong>{fmtMoney(d.joinClicks30)}</strong><small>/ {fmtMoney(d.joinClicks)}</small></span>
                            <span class="deal-conv">{conversion(d.dealClicks30, d.joinClicks30)}%</span>
                        </div>
                    {/each}
                    {#if !trafficDeals.length}<p class="empty">עדיין לא נרשמו לחיצות</p>{/if}
                    <p class="deal-legend">מספר גדול = 30 הימים האחרונים · קטן = מאז ומתמיד</p>
                </div>
            </section>

            <section>
                <h3>👁️ הדפים הנצפים (30 יום)</h3>
                <div class="rows">
                    {#each trafficPages as p (p.path)}
                        <div class="row">
                            <span class="row-name" title={p.path}>{pageName(p.path)}</span>
                            <div class="row-track"><div class="row-fill alt" style="width:{(p.views / maxPage) * 100}%"></div></div>
                            <span class="row-val">{fmtMoney(p.views)}</span>
                        </div>
                    {/each}
                    {#if !trafficPages.length}<p class="empty">עדיין לא נרשמו צפיות</p>{/if}
                </div>
            </section>
        </div>
    {/if}
</section>

<h2 class="part-title">🤝 חברויות בעסקאות</h2>

{#if !data.sourceConnected}
    <div class="no-source">
        🔌 <strong>מקור הנתונים עדיין לא חובר</strong> — כל המספרים מכאן ולמטה נגזרים מהחברויות בעסקאות,
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
    section h3 {
        font-size: 0.92rem;
        font-weight: 800;
        color: #e5e7eb;
        margin: 0 0 0.7rem;
    }
    .part-title {
        font-size: 1.15rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 1rem;
        padding-top: 1.25rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* ── תנועה באתר ── */
    .traffic {
        margin-bottom: 2.5rem;
    }
    .traffic > h2 {
        font-size: 1.15rem;
    }
    .traffic .chart {
        margin-bottom: 1.5rem;
    }
    .traffic-table-wrap {
        overflow-x: auto;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
    }
    .traffic-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
        text-align: center;
    }
    .traffic-table th,
    .traffic-table td {
        padding: 0.65rem 0.75rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        white-space: nowrap;
    }
    .traffic-table thead th {
        font-size: 0.72rem;
        font-weight: 700;
        color: var(--text-gray);
        background: rgba(255, 255, 255, 0.03);
    }
    .traffic-table tbody tr:last-child th,
    .traffic-table tbody tr:last-child td {
        border-bottom: 0;
    }
    .traffic-table .row-head {
        text-align: right;
        font-weight: 700;
        color: #e5e7eb;
        white-space: normal;
        min-width: 11rem;
    }
    .traffic-table td {
        font-weight: 800;
        font-size: 1.05rem;
        color: #fff;
    }
    .traffic-table .th-all,
    .traffic-table .td-all {
        background: rgba(250, 204, 21, 0.06);
    }
    .traffic-table .td-all {
        color: var(--accent-yellow);
    }
    .traffic-table .conv-row td {
        font-size: 0.9rem;
        color: #86efac;
    }
    .traffic-table .conv-row .row-head {
        color: #bbf7d0;
    }
    .traffic-note {
        margin: 0.6rem 0.25rem 1.5rem;
        font-size: 0.75rem;
        color: var(--text-gray);
        line-height: 1.6;
    }
    .col-label.hidden {
        visibility: hidden;
    }
    .deal-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.7rem;
        font-weight: 700;
        color: var(--text-gray);
        padding-bottom: 0.35rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
    }
    .deal-col {
        flex: 0 0 5.5rem;
        text-align: center;
        color: #fff;
    }
    .deal-col strong {
        font-weight: 800;
    }
    .deal-col small {
        color: var(--text-gray);
        font-size: 0.7rem;
        margin-inline-start: 0.25rem;
    }
    .deal-conv {
        flex: 0 0 3.2rem;
        text-align: center;
        font-weight: 800;
        color: #86efac;
    }
    .deals-table .row-name {
        flex: 1;
    }
    .deal-legend {
        margin: 0.5rem 0 0;
        font-size: 0.68rem;
        color: #6b7280;
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
