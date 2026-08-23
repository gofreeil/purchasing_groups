<script>
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import {
        STATUS_HE,
        fmtDate,
        fmtMoney,
        savedSoFar,
        daysLeft,
        humanDays,
        expiryState,
    } from '$lib/memberships.js';

    let { data, form } = $props();

    // הלשונית הפעילה נגזרת מה-URL (?tab=members) ולא ממצב מקומי — סרגל
    // הניווט שב-admin/+layout.svelte מחליף לשוניות בעזרת הקישורים האלה,
    // ו"חזור" בדפדפן עובד כמצופה.
    let tab = $derived($page.url.searchParams.get('tab') || 'pending');
    let busy = $state('');

    let memberships = $derived(data.memberships ?? []);
    let members = $derived(data.members ?? []);
    let deals = $derived(data.deals ?? []);
    let totals = $derived(data.totals ?? { members: 0, active: 0, monthlySaving: 0, totalSaved: 0 });
    let ratings = $derived(data.ratings ?? []);

    // שם ואייקון של עסקה לפי slug — נגזר מ-deals כדי לא לייבא את campaigns.js
    // (קובץ תוכן גדול) אל תוך חבילת הדפדפן של מסך הניהול.
    let dealBySlug = $derived(new Map(deals.map((/** @type {any} */ d) => [d.slug, d])));
    /** @param {string} slug */
    const dealTitle = (slug) => dealBySlug.get(slug)?.title ?? slug;
    /** @param {string} slug */
    const dealIcon = (slug) => dealBySlug.get(slug)?.icon ?? '🤝';

    let pendingList = $derived(memberships.filter((/** @type {any} */ m) => m.status === 'pending'));
    let expiringList = $derived(
        memberships
            .filter((/** @type {any} */ m) => m.status === 'active' && expiryState(m) === 'soon')
            .sort((/** @type {any} */ a, /** @type {any} */ b) => (daysLeft(a) ?? 0) - (daysLeft(b) ?? 0)),
    );

    // ── חיפוש וסינון בלשונית החברים ──
    let q = $state('');
    let dealFilter = $state('all');
    let filteredMembers = $derived(
        members.filter((/** @type {any} */ p) => {
            if (dealFilter !== 'all' && !p.memberships.some((/** @type {any} */ m) => m.campaignSlug === dealFilter))
                return false;
            const needle = q.trim().toLowerCase();
            if (!needle) return true;
            return [p.name, p.email, p.phone, p.city].some((v) =>
                String(v || '').toLowerCase().includes(needle),
            );
        }),
    );

    // אילו כרטיסי חבר פתוחים (רשימת העסקאות שלהם)
    let open = $state(/** @type {Record<string, boolean>} */ ({}));
    /** @param {string} id */
    const toggle = (id) => (open[id] = !open[id]);

    // enhance: מסמן busy לפי מזהה, ואחרי הפעולה מרענן את הרשימות
    /** @param {string} key */
    const submitFn = (key) => () => {
        busy = key;
        return async (/** @type {any} */ { update }) => {
            await update({ reset: false });
            busy = '';
        };
    };

    const EXTEND_OPTIONS = [6, 12, 24];
</script>

<svelte:head>
    <title>פאנל ניהול | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<!-- תגית סטטוס לחברות (פעיל / ממתין / פג / בוטל) -->
{#snippet statusPill(/** @type {string} */ status)}
    <span class="pill {STATUS_HE[status]?.tone ?? 'muted'}">{STATUS_HE[status]?.label ?? status}</span>
{/snippet}

<!-- שורת עסקה בתוך כרטיס חבר: תאריכים, תפוגה וחיסכון -->
{#snippet membershipRow(/** @type {any} */ m)}
    <div class="ms-row">
        <span class="ms-icon" aria-hidden="true">{dealIcon(m.campaignSlug)}</span>
        <div class="ms-main">
            <div class="ms-title">
                {dealTitle(m.campaignSlug)}
                {#if m.provider}<span class="ms-provider">· {m.provider}{m.plan ? ` · ${m.plan}` : ''}</span>{/if}
            </div>
            <div class="ms-meta">
                <span>הצטרף: {fmtDate(m.joinedAt)}</span>
                <span class="sep">|</span>
                <span class:danger={expiryState(m) === 'expired'} class:warn={expiryState(m) === 'soon'}>
                    תפוגה: {m.expiresAt ? fmtDate(m.expiresAt) : 'ללא התחייבות'}
                    {#if m.expiresAt}<span class="days">({humanDays(daysLeft(m))})</span>{/if}
                </span>
            </div>
        </div>
        <div class="ms-money">
            <strong>{fmtMoney(savedSoFar(m))} ₪</strong>
            <span>{fmtMoney(m.monthlySaving)} ₪ לחודש</span>
        </div>
        {@render statusPill(m.status)}
    </div>
{/snippet}

<!-- כפתורי שינוי סטטוס -->
{#snippet statusBtns(/** @type {string} */ id, /** @type {string[][]} */ actions)}
    {#each actions as [status, label, cls] (status)}
        <form method="POST" action="?/setStatus" use:enhance={submitFn(id + status)}>
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="status" value={status} />
            <button class="act {cls}" disabled={busy === id + status}>
                {busy === id + status ? '…' : label}
            </button>
        </form>
    {/each}
{/snippet}

{#if !data.authorized}
    <div class="gate">
        <div class="gate-emoji">🔒</div>
        {#if !data.user}
            <h1>נדרשת התחברות</h1>
            <p>פאנל הניהול פתוח לצוות רכישות קבוצתיות בלבד.</p>
            <a class="gate-btn" href="/login?returnTo=/admin">התחברות</a>
        {:else}
            <h1>אין הרשאה</h1>
            <p>החשבון {data.user.email} אינו מורשה לניהול. פנו לסופר-אדמין.</p>
        {/if}
    </div>
{:else}
    {#if !data.sourceConnected}
        <div class="no-source">
            🔌 <strong>מקור הנתונים של החברים והעסקאות עדיין לא חובר</strong> — הלשוניות ממתינים,
            חברים, עסקאות ופקיעות יתמלאו ברגע שיחובר. הדירוגים והפרסומות כבר עובדים על נתונים אמיתיים.
        </div>
    {/if}

    {#if form?.message}<div class="alert ok">{form.message}</div>{/if}
    {#if form?.error}<div class="alert error">{form.error}</div>{/if}

    <!-- ארבעת המספרים הגדולים — זהים בכל הלשוניות -->
    <div class="kpis">
        <div class="kpi">
            <span class="kpi-label">חברים</span>
            <strong>{fmtMoney(totals.members)}</strong>
        </div>
        <div class="kpi">
            <span class="kpi-label">חברויות פעילות</span>
            <strong>{fmtMoney(totals.active)}</strong>
        </div>
        <div class="kpi gold">
            <span class="kpi-label">חיסכון חודשי לקבוצה</span>
            <strong>{fmtMoney(totals.monthlySaving)} ₪</strong>
        </div>
        <div class="kpi gold">
            <span class="kpi-label">חיסכון מצטבר עד היום</span>
            <strong>{fmtMoney(totals.totalSaved)} ₪</strong>
        </div>
    </div>

    {#if tab === 'pending'}
        <!-- ═══ ממתינים לאישור ═══ -->
        <h2 class="tab-title">⏳ הרשמות שממתינות לאישור ({pendingList.length})</h2>
        {#if !pendingList.length}
            <p class="empty">
                {data.sourceConnected ? 'אין הרשמות שממתינות לטיפול 🎉' : 'אין נתונים להציג — מקור הנתונים לא חובר'}
            </p>
        {:else}
            <div class="list">
                {#each pendingList as m (m.id)}
                    <div class="card">
                        <div class="card-head">
                            <span class="big-icon" aria-hidden="true">{dealIcon(m.campaignSlug)}</span>
                            <div>
                                <h3>{m.userName}</h3>
                                <p class="muted-line">
                                    {dealTitle(m.campaignSlug)}
                                    {#if m.plan}· {m.plan}{/if}
                                    {#if m.provider}· {m.provider}{/if}
                                </p>
                            </div>
                            <span class="pill warn">נרשם {fmtDate(m.joinedAt)}</span>
                        </div>
                        <p class="contact">
                            <span>✉️ {m.userEmail}</span>
                            {#if m.userPhone}<span>📞 {m.userPhone}</span>{/if}
                            {#if m.userCity}<span>📍 {m.userCity}</span>{/if}
                            <span>💰 חיסכון צפוי: {fmtMoney(m.monthlySaving)} ₪ לחודש</span>
                        </p>
                        <div class="actions">
                            {@render statusBtns(m.id, [
                                ['active', '✓ אשר והפעל', 'ok'],
                                ['cancelled', '✕ דחה', 'danger'],
                            ])}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {:else if tab === 'members'}
        <!-- ═══ חברים ═══ -->
        <h2 class="tab-title">👥 חברים ({filteredMembers.length})</h2>
        <div class="filters">
            <input class="search" type="search" bind:value={q} placeholder="חיפוש לפי שם, אימייל, טלפון או עיר…" />
            <div class="chips">
                <button class="chip" class:on={dealFilter === 'all'} onclick={() => (dealFilter = 'all')}>הכל</button>
                {#each deals.filter((/** @type {any} */ d) => d.members > 0) as d (d.slug)}
                    <button class="chip" class:on={dealFilter === d.slug} onclick={() => (dealFilter = d.slug)}>
                        {d.icon} {d.title.length > 18 ? d.title.slice(0, 18) + '…' : d.title}
                    </button>
                {/each}
            </div>
        </div>

        {#if !filteredMembers.length}
            <p class="empty">
                {data.sourceConnected ? 'לא נמצאו חברים שמתאימים לחיפוש' : 'אין נתונים להציג — מקור הנתונים לא חובר'}
            </p>
        {:else}
            <div class="list">
                {#each filteredMembers as p (p.id)}
                    <div class="card">
                        <button class="member-head" onclick={() => toggle(p.id)} aria-expanded={!!open[p.id]}>
                            <span class="avatar" aria-hidden="true">{(p.name || '?').charAt(0)}</span>
                            <div class="member-id">
                                <h3>{p.name}</h3>
                                <p class="muted-line">{p.email} · {p.phone} · {p.city}</p>
                            </div>
                            <div class="member-stats">
                                <span class="stat"><strong>{p.activeCount}</strong> עסקאות</span>
                                <span class="stat gold"><strong>{fmtMoney(p.totalSaved)} ₪</strong> חסך</span>
                                <span class="stat">חבר מאז {fmtDate(p.memberSince)}</span>
                            </div>
                            <span class="chev" class:open={open[p.id]} aria-hidden="true">⌄</span>
                        </button>
                        {#if open[p.id]}
                            <div class="member-body">
                                {#each p.memberships as m (m.id)}
                                    {@render membershipRow(m)}
                                    <div class="row-actions">
                                        {#if m.status === 'pending'}
                                            {@render statusBtns(m.id, [
                                                ['active', '✓ אשר', 'ok'],
                                                ['cancelled', '✕ דחה', 'danger'],
                                            ])}
                                        {:else if m.status === 'active'}
                                            {@render statusBtns(m.id, [['cancelled', 'בטל חברות', 'ghost']])}
                                        {:else}
                                            {@render statusBtns(m.id, [['active', '↻ הפעל מחדש', 'ok']])}
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        {/if}
    {:else if tab === 'deals'}
        <!-- ═══ עסקאות ═══ -->
        <h2 class="tab-title">🤝 העסקאות הקבוצתיות ({deals.length})</h2>
        <div class="deal-grid">
            {#each deals as d (d.slug)}
                <div class="deal-card" class:soon={d.status !== 'active'}>
                    <div class="deal-head">
                        <span class="big-icon" aria-hidden="true">{d.icon}</span>
                        <h3>{d.title}</h3>
                        <span class="pill {d.status === 'active' ? 'ok' : 'muted'}">
                            {d.status === 'active' ? 'פעילה' : 'בקרוב'}
                        </span>
                    </div>
                    <div class="deal-stats">
                        <div><strong>{fmtMoney(d.members)}</strong><span>חברים</span></div>
                        <div><strong>{fmtMoney(d.activeCount)}</strong><span>פעילים</span></div>
                        <div class="gold"><strong>{fmtMoney(d.monthlySaving)} ₪</strong><span>לחודש</span></div>
                        <div class="gold"><strong>{fmtMoney(d.totalSaved)} ₪</strong><span>נחסכו</span></div>
                    </div>
                    <div class="deal-foot">
                        {#if d.ratingCount}
                            <span class="pill muted">⭐ {d.ratingAvg.toFixed(1)} ({d.ratingCount})</span>
                        {/if}
                        {#if d.pendingCount}<span class="pill warn">{d.pendingCount} ממתינים</span>{/if}
                        {#if d.expiringCount}<span class="pill danger">{d.expiringCount} לקראת פקיעה</span>{/if}
                        {#if d.editedCount}<span class="pill muted">✏️ {d.editedCount} שדות נערכו</span>{/if}
                        <a class="edit-link" href="/admin/deals/{d.slug}">✏️ ערוך תוכן</a>
                        <a class="deal-link" href="/details/{d.slug}">לדף העסקה ←</a>
                    </div>
                </div>
            {/each}
        </div>
    {:else if tab === 'expiring'}
        <!-- ═══ פקיעות ═══ -->
        <h2 class="tab-title">⏰ עסקאות שעומדות לפוג ({expiringList.length})</h2>
        <p class="tab-sub">מי שהתקופה שלו נגמרת ב-45 הימים הקרובים — כדאי לפנות אליו לפני שהוא נושר.</p>
        {#if !expiringList.length}
            <p class="empty">
                {data.sourceConnected ? 'אף חברות לא עומדת לפוג בקרוב 👌' : 'אין נתונים להציג — מקור הנתונים לא חובר'}
            </p>
        {:else}
            <div class="list">
                {#each expiringList as m (m.id)}
                    <div class="card">
                        <div class="card-head">
                            <span class="big-icon" aria-hidden="true">{dealIcon(m.campaignSlug)}</span>
                            <div>
                                <h3>{m.userName}</h3>
                                <p class="muted-line">{dealTitle(m.campaignSlug)} · {m.provider} · {m.plan}</p>
                            </div>
                            <span class="pill danger">{humanDays(daysLeft(m))}</span>
                        </div>
                        <p class="contact">
                            <span>✉️ {m.userEmail}</span>
                            {#if m.userPhone}<span>📞 {m.userPhone}</span>{/if}
                            <span>📅 הצטרף {fmtDate(m.joinedAt)}</span>
                            <span>⏳ פג ב-{fmtDate(m.expiresAt)}</span>
                            <span>💰 חסך עד כה {fmtMoney(savedSoFar(m))} ₪</span>
                        </p>
                        <div class="actions">
                            <span class="act-label">הארך ב:</span>
                            {#each EXTEND_OPTIONS as months (months)}
                                <form method="POST" action="?/extend" use:enhance={submitFn(m.id + months)}>
                                    <input type="hidden" name="id" value={m.id} />
                                    <input type="hidden" name="months" value={months} />
                                    <button class="act ok" disabled={busy === m.id + months}>
                                        {busy === m.id + months ? '…' : `${months} חודשים`}
                                    </button>
                                </form>
                            {/each}
                            {@render statusBtns(m.id, [['cancelled', 'לא ממשיך', 'ghost']])}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {:else if tab === 'ratings'}
        <!-- ═══ דירוגים ═══ -->
        <h2 class="tab-title">⭐ דירוגי שביעות רצון ({ratings.length})</h2>
        <p class="tab-sub">מה שהחברים כתבו בסקרי שביעות הרצון. מענה לתגובה נעשה בדף העסקה.</p>
        {#if !ratings.length}
            <p class="empty">עדיין אין דירוגים</p>
        {:else}
            <div class="list">
                {#each ratings as r (r.documentId)}
                    <div class="card rating" class:unanswered={!r.answered}>
                        <div class="card-head">
                            <span class="big-icon" aria-hidden="true">{dealIcon(r.campaignSlug)}</span>
                            <div>
                                <h3>{r.userName || 'אנונימי'}{r.userCity ? ` · ${r.userCity}` : ''}</h3>
                                <p class="muted-line">
                                    {dealTitle(r.campaignSlug)}{r.company ? ` · ${r.company}` : ''} · {fmtDate(r.createdAt)}
                                </p>
                            </div>
                            <span class="stars" title="{r.level} מתוך 5">
                                {'★'.repeat(Math.round(r.level))}{'☆'.repeat(Math.max(0, 5 - Math.round(r.level)))}
                            </span>
                        </div>
                        {#if r.comments}<p class="quote">{r.comments}</p>{/if}
                        <div class="actions">
                            {#if !r.answered}<span class="pill warn">ממתין למענה</span>{/if}
                            <a class="deal-link" href="/details/{r.campaignSlug}/responses">לכל התגובות בעסקה ←</a>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    {/if}
{/if}

<style>
    /* ── מצבי גישה ── */
    .gate {
        max-width: 28rem;
        margin: 3rem auto;
        padding: 2.5rem;
        text-align: center;
        border-radius: 1.5rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
    }
    .gate-emoji {
        font-size: 3rem;
        margin-bottom: 1rem;
    }
    .gate h1 {
        margin: 0 0 0.75rem;
        font-size: 1.5rem;
        color: #fff;
    }
    .gate p {
        color: var(--text-gray);
        margin: 0 0 1.5rem;
    }
    .gate-btn {
        display: inline-block;
        border-radius: 999px;
        background: var(--primary-blue);
        color: #fff;
        font-weight: 800;
        padding: 0.7rem 1.6rem;
    }

    /* ── הודעות ── */
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
    .alert {
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 1rem;
        text-align: center;
    }
    .alert.ok {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.35);
        color: #86efac;
    }
    .alert.error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
    }

    /* ── ארבעת המספרים ── */
    .kpis {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        margin-bottom: 1.75rem;
    }
    .kpi {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.9rem 1rem;
        text-align: center;
    }
    .kpi-label {
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

    /* ── כותרות לשונית ── */
    .tab-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.35rem;
    }
    .tab-sub {
        margin: 0 0 1rem;
        font-size: 0.82rem;
        color: var(--text-gray);
    }
    .empty {
        text-align: center;
        color: #6b7280;
        padding: 2.5rem 0;
    }

    /* ── כרטיסים ── */
    .list {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .card {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
    }
    .card-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    .card-head h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
    }
    .card-head > div {
        flex: 1;
        min-width: 10rem;
    }
    .big-icon {
        font-size: 1.6rem;
        line-height: 1;
    }
    .muted-line {
        margin: 0.15rem 0 0;
        font-size: 0.78rem;
        color: var(--text-gray);
    }
    .contact {
        display: flex;
        flex-wrap: wrap;
        gap: 0.35rem 1rem;
        margin: 0.75rem 0 0;
        font-size: 0.8rem;
        color: #cbd5e1;
    }

    /* ── תגיות ── */
    .pill {
        border-radius: 999px;
        padding: 0.15rem 0.6rem;
        font-size: 0.72rem;
        font-weight: 800;
        white-space: nowrap;
        border: 1px solid transparent;
    }
    .pill.ok {
        background: rgba(34, 197, 94, 0.15);
        border-color: rgba(34, 197, 94, 0.35);
        color: #86efac;
    }
    .pill.warn {
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.35);
        color: #fcd34d;
    }
    .pill.danger {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.35);
        color: #fca5a5;
    }
    .pill.muted {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
    }

    /* ── כפתורי פעולה ── */
    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.85rem;
    }
    .act-label {
        font-size: 0.8rem;
        color: var(--text-gray);
    }
    .act {
        border-radius: 0.6rem;
        border: 1px solid transparent;
        padding: 0.4rem 0.9rem;
        font-size: 0.82rem;
        font-weight: 800;
        font-family: inherit;
        color: #fff;
        cursor: pointer;
        transition: filter 0.15s;
    }
    .act:hover:not(:disabled) {
        filter: brightness(1.15);
    }
    .act:disabled {
        opacity: 0.4;
        cursor: default;
    }
    .act.ok {
        background: #16a34a;
    }
    .act.danger {
        background: #dc2626;
    }
    .act.ghost {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        color: #e5e7eb;
    }

    /* ── לשונית חברים ── */
    .filters {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        margin-bottom: 1rem;
    }
    .search {
        width: 100%;
        border-radius: 0.75rem;
        border: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        padding: 0.6rem 0.9rem;
        font-size: 0.9rem;
        font-family: inherit;
        box-sizing: border-box;
    }
    .search::placeholder {
        color: #64748b;
    }
    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
    }
    .chip {
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.04);
        color: #d1d5db;
        padding: 0.3rem 0.8rem;
        font-size: 0.78rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
    }
    .chip.on {
        background: var(--accent-yellow);
        border-color: var(--accent-yellow);
        color: #1a1a1a;
    }

    .member-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        background: none;
        border: 0;
        padding: 0;
        color: inherit;
        font-family: inherit;
        text-align: right;
        cursor: pointer;
    }
    .avatar {
        width: 2.4rem;
        height: 2.4rem;
        flex-shrink: 0;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        font-weight: 900;
        font-size: 1.1rem;
    }
    .member-id {
        flex: 1;
        min-width: 8rem;
    }
    .member-id h3 {
        margin: 0;
        font-size: 0.98rem;
        font-weight: 800;
        color: #fff;
    }
    .member-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem 0.9rem;
        font-size: 0.75rem;
        color: var(--text-gray);
    }
    .member-stats strong {
        color: #fff;
    }
    .member-stats .gold strong {
        color: var(--accent-yellow);
    }
    .chev {
        font-size: 1rem;
        color: var(--text-gray);
        transition: transform 0.2s;
    }
    .chev.open {
        transform: rotate(180deg);
    }
    .member-body {
        margin-top: 0.85rem;
        border-top: 1px solid var(--border-color);
        padding-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .row-actions {
        display: flex;
        gap: 0.4rem;
        padding: 0 0 0.5rem 0;
        border-bottom: 1px dashed rgba(255, 255, 255, 0.07);
    }
    .row-actions:last-child {
        border-bottom: 0;
    }

    /* ── שורת עסקה ── */
    .ms-row {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        flex-wrap: wrap;
    }
    .ms-icon {
        font-size: 1.2rem;
    }
    .ms-main {
        flex: 1;
        min-width: 11rem;
    }
    .ms-title {
        font-size: 0.88rem;
        font-weight: 700;
        color: #e5e7eb;
    }
    .ms-provider {
        color: var(--text-gray);
        font-weight: 500;
    }
    .ms-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        font-size: 0.74rem;
        color: var(--text-gray);
        margin-top: 0.1rem;
    }
    .ms-meta .sep {
        opacity: 0.4;
    }
    .ms-meta .days {
        opacity: 0.8;
    }
    .ms-meta .warn {
        color: #fcd34d;
    }
    .ms-meta .danger {
        color: #fca5a5;
    }
    .ms-money {
        text-align: left;
        line-height: 1.3;
    }
    .ms-money strong {
        display: block;
        font-size: 0.95rem;
        color: var(--accent-yellow);
    }
    .ms-money span {
        font-size: 0.7rem;
        color: var(--text-gray);
    }

    /* ── לשונית עסקאות ── */
    .deal-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
        gap: 0.85rem;
    }
    .deal-card {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
    }
    .deal-card.soon {
        opacity: 0.65;
    }
    .deal-head {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin-bottom: 0.85rem;
    }
    .deal-head h3 {
        flex: 1;
        margin: 0;
        font-size: 0.92rem;
        font-weight: 800;
        color: #fff;
    }
    .deal-stats {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.4rem;
        text-align: center;
    }
    .deal-stats div {
        border-radius: 0.6rem;
        background: rgba(0, 0, 0, 0.25);
        padding: 0.45rem 0.2rem;
    }
    .deal-stats strong {
        display: block;
        font-size: 0.9rem;
        color: #fff;
    }
    .deal-stats .gold strong {
        color: var(--accent-yellow);
    }
    .deal-stats span {
        font-size: 0.66rem;
        color: var(--text-gray);
    }
    .deal-foot {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.4rem;
        margin-top: 0.85rem;
    }
    .deal-link {
        margin-inline-start: auto;
        font-size: 0.78rem;
        font-weight: 700;
        color: #93c5fd;
    }
    .edit-link {
        border-radius: 0.6rem;
        border: 1px solid rgba(250, 204, 21, 0.35);
        background: rgba(250, 204, 21, 0.1);
        color: #fde68a;
        font-size: 0.78rem;
        font-weight: 800;
        padding: 0.3rem 0.75rem;
    }
    .edit-link:hover {
        background: rgba(250, 204, 21, 0.18);
        color: #fff;
    }
    .deal-link:hover {
        color: #dbeafe;
    }

    /* ── לשונית דירוגים ── */
    .rating.unanswered {
        border-color: rgba(245, 158, 11, 0.3);
    }
    .stars {
        color: var(--accent-yellow);
        font-size: 0.95rem;
        letter-spacing: 0.05em;
    }
    .quote {
        margin: 0.75rem 0 0;
        border-inline-start: 3px solid rgba(255, 255, 255, 0.15);
        padding-inline-start: 0.75rem;
        font-size: 0.85rem;
        color: #cbd5e1;
        line-height: 1.6;
    }
</style>
