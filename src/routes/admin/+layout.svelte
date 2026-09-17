<script>
    // מעטפת אחידה לכל מסכי הניהול — כותרת, זהות המנהל וסרגל ניווט.
    // רשימת המסכים מגיעה מ-$lib/adminNav.js, אותה רשימה בדיוק שמוצגת
    // פרוסה כאריחים באזור האישי (/profile#admin), כדי שלא יתפצלו.
    import { page } from '$app/stores';
    import { goto, afterNavigate, invalidate } from '$app/navigation';
    import { adminNav, isActiveNav } from '$lib/adminNav.js';
    import { displayName } from '$lib/displayName.js';

    /** @type {{ children: import('svelte').Snippet, data: any }} */
    let { children, data } = $props();

    // בכל מעבר בין מסכי הפאנל — שליפה מחדש של מוני ההמתנה (app:pending
    // ב-+layout.server.js). בלי זה הרשימה מתחלפת והבועה נשארת על המספר
    // שהיה בטעינת הדף: מסך ריק עם התראה דולקת. 'enter' = הטעינה הראשונה,
    // שבה הנתונים ממילא טריים.
    afterNavigate((nav) => {
        if (nav.type !== 'enter') invalidate('app:pending');
    });

    let isAdmin = $derived(Boolean(data.isAdmin));
    let nav = $derived(adminNav(isAdmin, Boolean(data.superAdmin)));
    let pending = $derived(data.pending ?? { pending: 0, expiring: 0, ads: 0, members: 0 });
    // הפס הקבוע של התנועה - כניסות ולחיצות - בכל מסך של הפאנל, לכל אדמין.
    // במסך הסטטיסטיקה עצמו הוא מיותר: שם המספרים פרוסים במלואם.
    let traffic = $derived(data.traffic ?? null);
    let showTraffic = $derived(!!traffic && $page.url.pathname !== '/admin/stats');
    // ?tab=... הוא מה שקובע איזו לשונית פעילה ב-/admin (ראו admin/+page.svelte)
    let currentTab = $derived($page.url.searchParams.get('tab'));

    /** מונה ההמתנה של המסך — הבועה האדומה. @param {any} item */
    const alertOf = (item) => (item.alert ? (pending[item.alert] ?? 0) : 0);
    /** מונה "כמה נתונים יש" — תגית אפורה, לא התראה. @param {any} item */
    const countOf = (item) => (item.count ? (pending[item.count] ?? 0) : 0);

    // חזרה דף אחורה; בכניסה ישירה לכתובת נופלים לעמוד הפאנל הראשי.
    function goBack() {
        if (typeof history !== 'undefined' && history.length > 1) history.back();
        else goto('/admin');
    }
</script>

<div class="admin-shell" dir="rtl">
    {#if isAdmin}
        <div class="panel-head">
            <div class="panel-id">
                <span class="panel-emoji" aria-hidden="true">🛠️</span>
                <div>
                    <h1>פאנל ניהול</h1>
                    <p class="panel-sub">
                        <span class="role-pill" class:super={data.superAdmin}>
                            {data.superAdmin ? '👑 סופר-אדמין' : '🛡️ אדמין'}
                        </span>
                        <span class="who">{displayName(data.user)} · {data.user?.email || ''}</span>
                    </p>
                </div>
            </div>
            <div class="panel-actions">
                <button type="button" class="ghost-btn" onclick={goBack}>↩ חזור</button>
                <a class="ghost-btn" href="/profile">👤 האזור האישי</a>
                <a class="ghost-btn" href="/">← לאתר</a>
            </div>
        </div>

        <!-- סרגל הניווט. הבועה האדומה = פריטים שממתינים לטיפול באותו מסך. -->
        <nav class="panel-nav" aria-label="מסכי הניהול">
            {#each nav as item (item.href)}
                {@const alert = alertOf(item)}
                {@const count = countOf(item)}
                <a
                    href={item.href}
                    class="nav-item"
                    class:active={isActiveNav(item, $page.url.pathname, currentTab)}
                >
                    <span aria-hidden="true">{item.icon}</span>
                    <span>{item.label}</span>
                    {#if alert > 0}
                        <span class="nav-alert"><span class="sr-only">ממתינים לטיפול:</span>{alert}</span>
                    {:else if count > 0}
                        <span class="nav-count">{count}</span>
                    {/if}
                </a>
            {/each}
        </nav>

        <!-- תנועה באתר במבט אחד. הפירוט המלא (גרף, לפי מבצע, דפים) ב-/admin/stats -->
        {#if showTraffic && traffic}
            <a class="traffic-strip" href="/admin/stats" aria-label="תנועה באתר - לפירוט">
                <span class="ts-group">
                    <span class="ts-icon" aria-hidden="true">🚪</span>
                    <span class="ts-label">כניסות לאתר</span>
                    <span class="ts-item"><strong>{traffic.visitsToday}</strong> היום</span>
                    <span class="ts-item"><strong>{traffic.visits7}</strong> 7 ימים</span>
                    <span class="ts-item"><strong>{traffic.visits30}</strong> 30 יום</span>
                </span>
                <span class="ts-group">
                    <span class="ts-icon" aria-hidden="true">🤝</span>
                    <span class="ts-label">לחצו על מבצע</span>
                    <span class="ts-item"><strong>{traffic.dealClicks30}</strong> 30 יום</span>
                </span>
                <span class="ts-group">
                    <span class="ts-icon" aria-hidden="true">📝</span>
                    <span class="ts-label">לחצו על טופס ההצטרפות</span>
                    <span class="ts-item"><strong>{traffic.joinClicks30}</strong> 30 יום</span>
                </span>
                <span class="ts-more">📈 לפירוט</span>
            </a>
        {/if}
    {/if}

    {@render children()}
</div>

<style>
    .admin-shell {
        max-width: 72rem;
        margin: 0 auto;
        width: 100%;
    }

    /* ── כותרת הפאנל ── */
    .panel-head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
    }
    .panel-id {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .panel-emoji {
        font-size: 2rem;
        line-height: 1;
    }
    .panel-head h1 {
        margin: 0;
        font-size: 1.75rem;
        font-weight: 900;
        color: #fff;
    }
    .panel-sub {
        margin: 0.35rem 0 0;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.78rem;
        color: var(--text-gray);
    }
    .role-pill {
        border-radius: 999px;
        border: 1px solid rgba(59, 130, 246, 0.4);
        background: rgba(30, 58, 138, 0.35);
        color: #93c5fd;
        padding: 0.1rem 0.55rem;
        font-weight: 800;
    }
    .role-pill.super {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(120, 53, 15, 0.35);
        color: #fcd34d;
    }
    .who {
        overflow-wrap: anywhere;
    }

    .panel-actions {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        gap: 0.5rem;
    }
    .ghost-btn {
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.04);
        color: #e5e7eb;
        padding: 0.4rem 0.9rem;
        font-size: 0.85rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
    }
    .ghost-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    /* ── סרגל הניווט ── */
    .panel-nav {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 1rem;
        margin-bottom: 1.5rem;
    }
    .nav-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        border-radius: 0.75rem;
        padding: 0.5rem 0.85rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: #d1d5db;
        background: rgba(255, 255, 255, 0.04);
        transition: background 0.15s, color 0.15s;
    }
    .nav-item:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }
    .nav-item.active {
        background: linear-gradient(to left, #2563eb, #7c3aed);
        color: #fff;
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.35);
    }
    .nav-alert {
        position: absolute;
        top: -0.4rem;
        left: -0.4rem;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 1.25rem;
        height: 1.25rem;
        padding: 0 0.25rem;
        border-radius: 999px;
        background: #dc2626;
        color: #fff;
        font-size: 0.68rem;
        font-weight: 900;
        line-height: 1;
        box-shadow: 0 0 0 2px var(--bg-dark);
    }
    .nav-count {
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.3);
        padding: 0.1rem 0.4rem;
        font-size: 0.68rem;
        font-weight: 800;
    }

    /* ── פס התנועה ── */
    .traffic-strip {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem 1.25rem;
        margin: -0.5rem 0 1.5rem;
        padding: 0.6rem 1rem;
        border-radius: 0.9rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.03);
        font-size: 0.8rem;
        color: #d1d5db;
        transition: background 0.15s, border-color 0.15s;
    }
    .traffic-strip:hover {
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(255, 255, 255, 0.2);
    }
    .ts-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.35rem 0.6rem;
    }
    .ts-icon {
        font-size: 1rem;
    }
    .ts-label {
        font-weight: 700;
        color: #9ca3af;
    }
    .ts-item strong {
        color: var(--accent-yellow);
        font-weight: 900;
        font-size: 0.95rem;
    }
    .ts-more {
        margin-inline-start: auto;
        font-weight: 700;
        color: #93c5fd;
        white-space: nowrap;
    }
    @media (max-width: 640px) {
        .ts-more {
            margin-inline-start: 0;
        }
    }

    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    @media (max-width: 640px) {
        .panel-head h1 {
            font-size: 1.4rem;
        }
        .panel-actions {
            width: 100%;
        }
        .ghost-btn {
            flex: 1;
            text-align: center;
        }
    }
</style>
