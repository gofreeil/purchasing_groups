<script>
    import { enhance } from '$app/forms';
    import { fmtDate } from '$lib/memberships.js';

    let { data, form } = $props();
    let busy = $state('');

    /** @type {Record<string, { label: string, tone: string }>} */
    const ROLE_HE = {
        super_admin: { label: '👑 סופר-אדמין', tone: 'gold' },
        neighborhood_admin: { label: '🛡️ אדמין', tone: 'blue' },
        user: { label: 'משתמש רגיל', tone: 'muted' },
    };

    /** @param {string} key */
    const submitFn = (key) => () => {
        busy = key;
        return async (/** @type {any} */ { update }) => {
            await update({ reset: false });
            busy = '';
        };
    };
</script>

<svelte:head>
    <title>ניהול אדמינים | ניהול</title>
    <meta name="robots" content="noindex" />
</svelte:head>

{#if !data.sourceConnected}
    <div class="no-source">
        🔌 <strong>רשימת בעלי ההרשאות עדיין לא נשלפת</strong> — התפקיד נקבע בשדה
        <code>app_role</code> של המשתמש ב-Strapi, ושם גם משנים אותו כרגע. למטה מוצג המנהל המחובר בלבד.
    </div>
{/if}

{#if form?.message}<div class="alert ok">{form.message}</div>{/if}
{#if form?.error}<div class="alert error">{form.error}</div>{/if}

<h2 class="tab-title">🔑 בעלי הרשאות ({data.staff.length})</h2>
<p class="tab-sub">סופר-אדמין רואה ומשנה הכל. אדמין מנהל עסקאות, חברים ופרסומות — בלי הרשאות.</p>

<div class="list">
    {#each data.staff as p (p.id)}
        <div class="card">
            <span class="avatar" aria-hidden="true">{(p.name || '?').charAt(0)}</span>
            <div class="who">
                <h3>{p.name} {#if p.email === data.meEmail}<span class="me">(אתם)</span>{/if}</h3>
                <p class="muted-line">{p.email}{p.since ? ` · מונה ב-${fmtDate(p.since)}` : ''}</p>
            </div>
            <span class="pill {ROLE_HE[p.app_role]?.tone ?? 'muted'}">
                {ROLE_HE[p.app_role]?.label ?? p.app_role}
            </span>
            <div class="actions">
                {#each data.roles.filter((/** @type {string} */ r) => r !== p.app_role) as role (role)}
                    <form method="POST" action="?/setRole" use:enhance={submitFn(p.id + role)}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="role" value={role} />
                        <button class="act" disabled={busy === p.id + role}>
                            {busy === p.id + role ? '…' : `→ ${ROLE_HE[role]?.label ?? role}`}
                        </button>
                    </form>
                {/each}
            </div>
        </div>
    {/each}
</div>

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
    .no-source code {
        background: rgba(0, 0, 0, 0.35);
        border-radius: 0.3rem;
        padding: 0.05rem 0.35rem;
        direction: ltr;
        display: inline-block;
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

    .tab-title {
        font-size: 1.1rem;
        font-weight: 800;
        color: #fff;
        margin: 0 0 0.35rem;
    }
    .tab-sub {
        margin: 0 0 1.25rem;
        font-size: 0.82rem;
        color: var(--text-gray);
    }

    .list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }
    .card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 0.9rem 1rem;
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
    .who {
        flex: 1;
        min-width: 10rem;
    }
    .who h3 {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 800;
        color: #fff;
    }
    .me {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--accent-yellow);
    }
    .muted-line {
        margin: 0.15rem 0 0;
        font-size: 0.76rem;
        color: var(--text-gray);
        overflow-wrap: anywhere;
    }

    .pill {
        border-radius: 999px;
        padding: 0.2rem 0.7rem;
        font-size: 0.75rem;
        font-weight: 800;
        white-space: nowrap;
        border: 1px solid transparent;
    }
    .pill.gold {
        background: rgba(120, 53, 15, 0.35);
        border-color: rgba(245, 158, 11, 0.4);
        color: #fcd34d;
    }
    .pill.blue {
        background: rgba(30, 58, 138, 0.35);
        border-color: rgba(59, 130, 246, 0.4);
        color: #93c5fd;
    }
    .pill.muted {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
    }

    .actions {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
    }
    .act {
        border-radius: 0.6rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.06);
        color: #e5e7eb;
        padding: 0.35rem 0.8rem;
        font-size: 0.78rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
    }
    .act:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.12);
        color: #fff;
    }
    .act:disabled {
        opacity: 0.4;
        cursor: default;
    }
</style>
