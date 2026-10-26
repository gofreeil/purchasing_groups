<script>
    import { enhance } from '$app/forms';
    import { goto, invalidateAll } from '$app/navigation';
    import { onMount } from 'svelte';

    let { data, form } = $props();

    const CATEGORIES = ['שאלה כללית', 'בעיה בעסקה / בשירות', 'תשלום וחיוב', 'הצטרפות / ביטול', 'אחר'];
    const STATUS = { open: 'פתוחה', answered: 'נענתה', closed: 'סגורה' };
    const ROLE_LABEL = { owner: 'הפונה', admin: 'הנהלה', provider: 'חברת שירות' };

    let creating = $state(false);
    let busy = $state(false);
    let draft = $state('');
    const thread = $derived(data.thread);
    const returnTo = '/support';

    // רענון שקט של השרשור הפתוח - כדי לראות תגובות חדשות בלי לרענן ידנית
    onMount(() => {
        const timer = setInterval(() => {
            if (data.thread && !busy && !draft) invalidateAll();
        }, 20000);
        return () => clearInterval(timer);
    });

    /** @param {string} iso */
    const when = (iso) =>
        new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
</script>

<svelte:head>
    <title>תמיכה | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex, follow" />
</svelte:head>

<div class="wrap" dir="rtl">
    <h1>🛟 תמיכה והנהלה</h1>

    {#if !data.loggedIn}
        <div class="card center">
            <p>כדי לפנות להנהלה יש להירשם או להתחבר.</p>
            <a class="btn" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>התחברות / הרשמה</a>
        </div>
    {:else}
        {#if data.loadError}<div class="err">{data.loadError}</div>{/if}

        {#if thread}
            <a class="back" href="/support">← כל הפניות</a>
            <div class="card">
                <div class="head">
                    <strong>{thread.subject}</strong>
                    <span class="st st-{thread.status}">{STATUS[thread.status]}</span>
                </div>
                <div class="meta">
                    {#if thread.category}{thread.category} · {/if}{#if thread.company}{thread.company} · {/if}
                    {#if thread.role !== 'owner'}
                        {thread.user_name}
                        {#if thread.user_email}· <span dir="ltr">{thread.user_email}</span>{/if}
                        {#if thread.user_phone}· <span dir="ltr">{thread.user_phone}</span>{/if}
                    {/if}
                </div>

                <div class="chat">
                    {#each thread.messages as m}
                        <div class="msg from-{m.from === thread.role ? 'me' : 'other'}">
                            <div class="by">{m.name} <small>({ROLE_LABEL[m.from] ?? ''}) · {when(m.at)}</small></div>
                            <div class="txt">{m.text}</div>
                        </div>
                    {/each}
                </div>

                {#if thread.status !== 'closed' || data.admin}
                    <form
                        method="POST"
                        action="?/message"
                        class="reply"
                        use:enhance={() => {
                            busy = true;
                            return async ({ update }) => {
                                await update({ reset: true });
                                draft = '';
                                busy = false;
                            };
                        }}
                    >
                        <input type="hidden" name="id" value={thread.documentId} />
                        <textarea name="text" rows="2" placeholder="כתבו הודעה…" bind:value={draft} required></textarea>
                        <button class="btn" disabled={busy}>{busy ? 'שולח…' : 'שלח'}</button>
                    </form>
                {:else}
                    <div class="meta">הפנייה סגורה. אפשר לפתוח פנייה חדשה.</div>
                {/if}
                {#if form?.error}<div class="err">{form.error}</div>{/if}

                {#if data.admin}
                    <form method="POST" action="?/manage" class="manage" use:enhance={() => async ({ update }) => update({ reset: false })}>
                        <input type="hidden" name="id" value={thread.documentId} />
                        <label>
                            חברות שירות עם גישה (מיילים רשומים באתר, מופרדים בפסיק)
                            <input name="providers" dir="ltr" value={(thread.provider_emails ?? []).join(', ')} placeholder="company@example.com" />
                        </label>
                        <div class="row">
                            <button class="btn sm">שמור גישה</button>
                            {#if thread.status === 'closed'}
                                <button class="btn sm ghost" name="status" value="open">פתח מחדש</button>
                            {:else}
                                <button class="btn sm ghost" name="status" value="closed">סגור פנייה</button>
                            {/if}
                        </div>
                    </form>
                {/if}
            </div>
        {:else}
            <div class="bar">
                <button class="btn" onclick={() => (creating = !creating)}>{creating ? 'ביטול' : '➕ פנייה חדשה'}</button>
            </div>

            {#if creating}
                <form
                    method="POST"
                    action="?/open"
                    class="card new"
                    use:enhance={() => {
                        busy = true;
                        return async ({ result, update }) => {
                            busy = false;
                            if (result.type === 'success' && result.data?.opened) {
                                creating = false;
                                await goto(`/support?t=${result.data.opened}`, { invalidateAll: true });
                            } else await update({ reset: false });
                        };
                    }}
                >
                    <select name="category">
                        {#each CATEGORIES as c}<option>{c}</option>{/each}
                    </select>
                    <input name="company" placeholder="חברה / עסקה (אם רלוונטי)" maxlength="80" />
                    <input name="subject" placeholder="נושא" maxlength="120" required />
                    <input name="phone" type="tel" dir="ltr" placeholder="טלפון לחזרה (לא חובה)" maxlength="30" />
                    <textarea name="text" rows="4" placeholder="פרטו את הפנייה…" maxlength="3000" required></textarea>
                    <button class="btn" disabled={busy}>{busy ? 'שולח…' : 'שלח פנייה'}</button>
                    {#if form?.error}<div class="err">{form.error}</div>{/if}
                </form>
            {/if}

            {#if data.tickets.length === 0}
                <div class="card center">עדיין אין פניות.</div>
            {:else}
                <div class="list">
                    {#each data.tickets as t}
                        <a class="item" href={`/support?t=${t.documentId}`}>
                            <div class="head">
                                <strong>{t.subject}</strong>
                                <span class="st st-{t.status}">{STATUS[t.status]}</span>
                            </div>
                            <div class="meta">
                                {#if t.role !== 'owner'}{t.user_name} · {/if}{when(t.last_activity)} · {t.count} הודעות
                            </div>
                            <div class="prev">{t.preview}</div>
                        </a>
                    {/each}
                </div>
            {/if}
        {/if}
    {/if}
</div>

<style>
    .wrap { max-width: 720px; margin: 0 auto; padding: 12px 14px 24px; color: var(--text-white); }
    h1 { font-size: 1.3rem; margin: 4px 0 10px; }
    .card { background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 12px; margin-bottom: 10px; }
    .center { text-align: center; }
    .bar { margin-bottom: 8px; }
    .btn { background: var(--primary-blue); color: #fff; border: 0; border-radius: 8px; padding: 8px 16px; font: inherit; cursor: pointer; text-decoration: none; display: inline-block; }
    .btn.sm { padding: 5px 12px; font-size: 0.85rem; }
    .btn.ghost { background: transparent; border: 1px solid var(--border-color); }
    .btn:disabled { opacity: 0.6; }
    .new { display: flex; flex-direction: column; gap: 8px; }
    input, select, textarea { background: rgba(0, 0, 0, 0.25); color: #fff; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px; font: inherit; width: 100%; box-sizing: border-box; }
    .list { display: flex; flex-direction: column; gap: 8px; }
    .item { display: block; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 12px; padding: 10px 12px; color: inherit; text-decoration: none; }
    .head { display: flex; justify-content: space-between; gap: 8px; align-items: center; }
    .meta { color: var(--text-gray); font-size: 0.8rem; margin-top: 2px; }
    .prev { font-size: 0.88rem; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .st { font-size: 0.72rem; padding: 2px 8px; border-radius: 99px; background: #475569; white-space: nowrap; }
    .st-open { background: #b45309; }
    .st-answered { background: #15803d; }
    .back { color: var(--accent-yellow); font-size: 0.9rem; display: inline-block; margin-bottom: 6px; }
    .chat { display: flex; flex-direction: column; gap: 8px; margin: 10px 0; max-height: 55vh; overflow-y: auto; }
    .msg { max-width: 85%; padding: 8px 10px; border-radius: 12px; background: rgba(0, 0, 0, 0.3); }
    .from-me { align-self: flex-start; background: rgba(59, 130, 246, 0.35); }
    .from-other { align-self: flex-end; }
    .by { font-size: 0.78rem; font-weight: 600; }
    .by small { color: var(--text-gray); font-weight: 400; }
    .txt { white-space: pre-wrap; word-break: break-word; margin-top: 2px; }
    .reply { display: flex; gap: 8px; align-items: flex-end; }
    .manage { margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; font-size: 0.85rem; }
    .row { display: flex; gap: 8px; }
    .err { color: #fca5a5; font-size: 0.85rem; margin-top: 6px; }
</style>
