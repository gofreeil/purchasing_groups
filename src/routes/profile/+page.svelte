<script>
    import { page } from '$app/stores';
    import { adminTiles } from '$lib/adminNav.js';
    import {
        STATUS_HE,
        fmtDate,
        fmtMoney,
        savedSoFar,
        daysLeft,
        humanDays,
        expiryState,
        activeMonths,
    } from '$lib/memberships.js';

    let { data } = $props();

    // שם תצוגה ידידותי — אותה לוגיקה כמו בהדר: לעולם לא מזהה אוטומטי
    // מסוג "google_1164663...".
    const AUTO_ID = /^(google|facebook|apple|community|local)[_-]/i;
    /** @param {string | null | undefined} s */
    const human = (s) => (!s || AUTO_ID.test(s) ? '' : s);
    let displayName = $derived.by(() => {
        const u = data?.user;
        if (!u) return '';
        const emailLocal = u.email && !AUTO_ID.test(u.email) ? u.email.split('@')[0] : '';
        return human(u.name) || emailLocal || human(u.username) || 'משתמש';
    });
    let initial = $derived((displayName || 'U').charAt(0).toUpperCase());

    let memberships = $derived(data.memberships ?? []);
    let summary = $derived(data.summary ?? { totalSaved: 0, monthlySaving: 0, activeCount: 0, totalCount: 0, expiringSoon: 0 });
    let campaigns = $derived(data.campaigns ?? []);
    let tiles = $derived(adminTiles(Boolean(data.isAdmin), Boolean(data.superAdmin)));

    // "חבר מאז" — ההצטרפות הראשונה שלו לאיזושהי עסקה
    let memberSince = $derived(
        memberships.length
            ? memberships.reduce(
                  (/** @type {string} */ min, /** @type {any} */ m) =>
                      Date.parse(m.joinedAt) < Date.parse(min) ? m.joinedAt : min,
                  memberships[0].joinedAt,
              )
            : '',
    );

    // עסקאות שהוא עוד לא בפנים — ההזדמנות לחסוך יותר
    let notJoined = $derived(campaigns.filter((/** @type {any} */ c) => !c.joined));

    /**
     * כמה מהתקופה כבר עברה — הפס הצבעוני על הכרטיס.
     * @param {any} m
     */
    function progress(m) {
        if (!m.expiresAt) return 0;
        const start = Date.parse(m.joinedAt);
        const end = Date.parse(m.expiresAt);
        if (!(end > start)) return 0;
        return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
    }
</script>

<svelte:head>
    <title>האזור האישי | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="profile" dir="rtl">
    {#if !data.authorized}
        <div class="gate">
            <div class="gate-emoji">👤</div>
            <h1>האזור האישי</h1>
            <p>כאן רואים את כל העסקאות שהצטרפתם אליהן וכמה חסכתם. צריך להתחבר קודם.</p>
            <a class="gate-btn" href={`/login?returnTo=${encodeURIComponent($page.url.pathname)}`}>התחברות</a>
        </div>
    {:else}
        <!-- ═══ כותרת: מי אני ═══ -->
        <header class="hero">
            {#if data.user?.avatar_url}
                <img class="hero-avatar" src={data.user.avatar_url} alt="" referrerpolicy="no-referrer" />
            {:else}
                <span class="hero-avatar fallback" aria-hidden="true">{initial}</span>
            {/if}
            <div class="hero-id">
                <h1>{displayName}</h1>
                <p class="hero-meta">
                    <span>{data.user?.email}</span>
                    {#if memberSince}<span class="sep">·</span><span>חבר מאז {fmtDate(memberSince)}</span>{/if}
                </p>
            </div>
            {#if data.isAdmin}
                <a class="admin-cta" href="/admin">🛠️ פאנל ניהול</a>
            {/if}
        </header>

        <!-- ═══ כמה חסכתי ═══ -->
        <section class="savings">
            <div class="savings-main">
                <span class="savings-label">חסכת עד היום</span>
                <strong class="savings-big">{fmtMoney(summary.totalSaved)} <span>₪</span></strong>
                <span class="savings-note">
                    {#if summary.monthlySaving > 0}
                        ובקצב הנוכחי — עוד {fmtMoney(summary.monthlySaving * 12)} ₪ בשנה הקרובה
                    {:else}
                        הצטרפו לעסקה כדי להתחיל לחסוך
                    {/if}
                </span>
            </div>
            <div class="savings-side">
                <div class="mini">
                    <strong>{fmtMoney(summary.monthlySaving)} ₪</strong>
                    <span>חיסכון חודשי</span>
                </div>
                <div class="mini">
                    <strong>{summary.activeCount}</strong>
                    <span>עסקאות פעילות</span>
                </div>
                <div class="mini" class:alert={summary.expiringSoon > 0}>
                    <strong>{summary.expiringSoon}</strong>
                    <span>לקראת חידוש</span>
                </div>
            </div>
        </section>

        <!-- ═══ העסקאות שלי ═══ -->
        <section>
            <h2 class="sec-title">🤝 העסקאות שלי</h2>
            {#if !memberships.length}
                <p class="empty">עדיין לא הצטרפתם לאף עסקה. למטה מחכות לכם ההזדמנויות 👇</p>
            {:else}
                <div class="deals">
                    {#each memberships as m (m.id)}
                        {@const state = expiryState(m)}
                        {@const left = daysLeft(m)}
                        <article class="deal" class:expired={m.status === 'expired'} class:cancelled={m.status === 'cancelled'}>
                            <div class="deal-top">
                                <span class="deal-icon" aria-hidden="true">
                                    {campaigns.find((/** @type {any} */ c) => c.slug === m.campaignSlug)?.icon ?? '🤝'}
                                </span>
                                <div class="deal-id">
                                    <h3>
                                        {campaigns.find((/** @type {any} */ c) => c.slug === m.campaignSlug)?.title ?? m.campaignSlug}
                                    </h3>
                                    {#if m.provider || m.plan}
                                        <p class="deal-plan">{m.provider}{m.plan ? ` · ${m.plan}` : ''}</p>
                                    {/if}
                                </div>
                                <span class="pill {STATUS_HE[m.status]?.tone ?? 'muted'}">
                                    {STATUS_HE[m.status]?.label ?? m.status}
                                </span>
                            </div>

                            <!-- שני התאריכים שהם העיקר: ממתי ועד מתי -->
                            <div class="dates">
                                <div class="date">
                                    <span class="date-label">הצטרפת ב</span>
                                    <strong>{fmtDate(m.joinedAt)}</strong>
                                </div>
                                <div class="date" class:warn={state === 'soon'} class:danger={state === 'expired'}>
                                    <span class="date-label">בתוקף עד</span>
                                    <strong>{m.expiresAt ? fmtDate(m.expiresAt) : 'ללא התחייבות'}</strong>
                                    {#if m.expiresAt}<span class="date-rel">{humanDays(left)}</span>{/if}
                                </div>
                                <div class="date saved">
                                    <span class="date-label">חסכת בעסקה הזו</span>
                                    <strong>{fmtMoney(savedSoFar(m))} ₪</strong>
                                    <span class="date-rel">
                                        {fmtMoney(m.monthlySaving)} ₪ לחודש · {Math.round(activeMonths(m))} חודשים
                                    </span>
                                </div>
                            </div>

                            {#if m.expiresAt && m.status === 'active'}
                                <div class="bar" role="presentation">
                                    <div class="bar-fill" class:warn={state === 'soon'} style="width:{progress(m)}%"></div>
                                </div>
                            {/if}

                            {#if state === 'soon' && m.status === 'active'}
                                <p class="renew-note">⏰ התקופה נגמרת בקרוב — נחזור אליכם לפני החידוש.</p>
                            {:else if m.status === 'pending'}
                                <p class="renew-note pending">⏳ ההרשמה התקבלה וממתינה לאישור הצוות.</p>
                            {/if}

                            <a class="deal-link" href="/details/{m.campaignSlug}">לפרטי העסקה ←</a>
                        </article>
                    {/each}
                </div>
            {/if}
        </section>

        <!-- ═══ מה עוד אפשר ═══ -->
        {#if notJoined.length}
            <section>
                <h2 class="sec-title">✨ עסקאות שעוד לא הצטרפתם אליהן</h2>
                <div class="offers">
                    {#each notJoined as c (c.slug)}
                        <a class="offer" class:soon={!c.canJoin} href="/details/{c.slug}">
                            <span class="offer-icon" aria-hidden="true">{c.icon}</span>
                            <span class="offer-body">
                                <strong>{c.title}</strong>
                                <span>{c.description}</span>
                            </span>
                            <span class="pill {c.canJoin ? 'ok' : 'muted'}">{c.canJoin ? 'הצטרפו' : 'בקרוב'}</span>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}

        <!-- ═══ אריחי הניהול — לאדמינים בלבד ═══ -->
        {#if tiles.length}
            <section id="admin">
                <h2 class="sec-title">🛠️ ניהול האתר</h2>
                <div class="tiles">
                    {#each tiles as t (t.href)}
                        <a class="tile" href={t.href}>
                            <span class="tile-icon" aria-hidden="true">{t.icon}</span>
                            <strong>{t.title}</strong>
                            <span>{t.desc}</span>
                        </a>
                    {/each}
                </div>
            </section>
        {/if}
    {/if}
</div>

<style>
    .profile {
        max-width: 60rem;
        margin: 0 auto;
        width: 100%;
    }

    /* ── מסך התחברות ── */
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
        line-height: 1.6;
    }
    .gate-btn {
        display: inline-block;
        border-radius: 999px;
        background: var(--primary-blue);
        color: #fff;
        font-weight: 800;
        padding: 0.7rem 1.6rem;
    }

    /* ── כותרת ── */
    .hero {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
        margin-bottom: 1.25rem;
    }
    .hero-avatar {
        width: 4rem;
        height: 4rem;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid rgba(250, 204, 21, 0.5);
        flex-shrink: 0;
        display: block;
    }
    .hero-avatar.fallback {
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        font-weight: 900;
        font-size: 1.8rem;
    }
    .hero-id {
        flex: 1;
        min-width: 12rem;
    }
    .hero-id h1 {
        margin: 0;
        font-size: 1.6rem;
        font-weight: 900;
        color: #fff;
    }
    .hero-meta {
        margin: 0.25rem 0 0;
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        font-size: 0.82rem;
        color: var(--text-gray);
        overflow-wrap: anywhere;
    }
    .hero-meta .sep {
        opacity: 0.5;
    }
    .admin-cta {
        border-radius: 999px;
        border: 1px solid rgba(245, 158, 11, 0.4);
        background: rgba(120, 53, 15, 0.3);
        color: #fcd34d;
        font-weight: 800;
        font-size: 0.85rem;
        padding: 0.5rem 1.1rem;
    }
    .admin-cta:hover {
        background: rgba(120, 53, 15, 0.5);
    }

    /* ── כרטיס החיסכון ── */
    .savings {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 1.25rem;
        border-radius: 1.25rem;
        border: 1px solid rgba(250, 204, 21, 0.25);
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.1), rgba(59, 130, 246, 0.08));
        padding: 1.5rem;
        margin-bottom: 2rem;
    }
    .savings-main {
        flex: 1;
        min-width: 14rem;
    }
    .savings-label {
        display: block;
        font-size: 0.85rem;
        color: var(--text-gray);
        font-weight: 700;
    }
    .savings-big {
        display: block;
        font-size: 2.75rem;
        font-weight: 900;
        line-height: 1.1;
        color: var(--accent-yellow);
        margin: 0.15rem 0;
    }
    .savings-big span {
        font-size: 1.5rem;
    }
    .savings-note {
        font-size: 0.82rem;
        color: #cbd5e1;
    }
    .savings-side {
        display: flex;
        gap: 0.6rem;
    }
    .mini {
        border-radius: 0.85rem;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.7rem 0.9rem;
        text-align: center;
        min-width: 5.5rem;
    }
    .mini strong {
        display: block;
        font-size: 1.1rem;
        font-weight: 900;
        color: #fff;
    }
    .mini span {
        font-size: 0.7rem;
        color: var(--text-gray);
    }
    .mini.alert strong {
        color: #fcd34d;
    }
    @media (max-width: 640px) {
        .savings-big {
            font-size: 2.1rem;
        }
        .savings-side {
            width: 100%;
        }
        .mini {
            flex: 1;
            min-width: 0;
        }
    }

    /* ── כותרות מקטע ── */
    .sec-title {
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.85rem;
    }
    .empty {
        text-align: center;
        color: #6b7280;
        padding: 2rem 0;
    }
    section {
        margin-bottom: 2.25rem;
    }

    /* ── כרטיס עסקה ── */
    .deals {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .deal {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1.1rem;
    }
    .deal.expired,
    .deal.cancelled {
        opacity: 0.6;
    }
    .deal-top {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-bottom: 0.9rem;
    }
    .deal-icon {
        font-size: 1.8rem;
        line-height: 1;
    }
    .deal-id {
        flex: 1;
        min-width: 8rem;
    }
    .deal-id h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
    }
    .deal-plan {
        margin: 0.15rem 0 0;
        font-size: 0.78rem;
        color: var(--text-gray);
    }

    .dates {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;
    }
    @media (max-width: 640px) {
        .dates {
            grid-template-columns: 1fr;
        }
    }
    .date {
        border-radius: 0.75rem;
        background: rgba(0, 0, 0, 0.25);
        padding: 0.6rem 0.75rem;
    }
    .date-label {
        display: block;
        font-size: 0.7rem;
        color: var(--text-gray);
        margin-bottom: 0.15rem;
    }
    .date strong {
        font-size: 0.95rem;
        font-weight: 800;
        color: #fff;
    }
    .date-rel {
        display: block;
        font-size: 0.7rem;
        color: var(--text-gray);
        margin-top: 0.1rem;
    }
    .date.warn strong {
        color: #fcd34d;
    }
    .date.danger strong {
        color: #fca5a5;
    }
    .date.saved strong {
        color: var(--accent-yellow);
    }

    .bar {
        height: 0.35rem;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.08);
        overflow: hidden;
        margin-top: 0.75rem;
    }
    .bar-fill {
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(to left, #22c55e, #3b82f6);
    }
    .bar-fill.warn {
        background: linear-gradient(to left, #f59e0b, #ef4444);
    }

    .renew-note {
        margin: 0.75rem 0 0;
        font-size: 0.8rem;
        font-weight: 700;
        color: #fcd34d;
    }
    .renew-note.pending {
        color: #93c5fd;
    }
    .deal-link {
        display: inline-block;
        margin-top: 0.75rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #93c5fd;
    }
    .deal-link:hover {
        color: #dbeafe;
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

    /* ── עסקאות שעוד לא הצטרף אליהן ── */
    .offers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(17rem, 1fr));
        gap: 0.6rem;
    }
    .offer {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        border-radius: 0.9rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.85rem;
        transition: background 0.15s, border-color 0.15s;
    }
    .offer:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(250, 204, 21, 0.3);
    }
    .offer.soon {
        opacity: 0.6;
    }
    .offer-icon {
        font-size: 1.5rem;
    }
    .offer-body {
        flex: 1;
        min-width: 0;
    }
    .offer-body strong {
        display: block;
        font-size: 0.85rem;
        font-weight: 800;
        color: #fff;
    }
    .offer-body span {
        display: block;
        font-size: 0.72rem;
        color: var(--text-gray);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    /* ── אריחי הניהול ── */
    .tiles {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
        gap: 0.6rem;
    }
    .tile {
        border-radius: 0.9rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.9rem;
        transition: background 0.15s, border-color 0.15s;
    }
    .tile:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(59, 130, 246, 0.35);
    }
    .tile-icon {
        font-size: 1.4rem;
        display: block;
        margin-bottom: 0.35rem;
    }
    .tile strong {
        display: block;
        font-size: 0.88rem;
        font-weight: 800;
        color: #fff;
    }
    .tile span {
        font-size: 0.74rem;
        color: var(--text-gray);
        line-height: 1.5;
    }
</style>
