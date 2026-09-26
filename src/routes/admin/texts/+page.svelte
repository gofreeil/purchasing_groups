<script>
    import { enhance } from '$app/forms';
    import { invalidateAll } from '$app/navigation';
    import { TEXT_SECTIONS } from '$lib/siteTexts.js';

    let { data, form } = $props();

    let saving = $state(false);
    let query = $state('');

    /** ערכי הטופס - מאותחלים מהשרת, ומתאפסים אליו אחרי שמירה */
    /** @type {Record<string, string>} */
    let values = $state({});
    let members = $state('');
    $effect.pre(() => {
        values = Object.fromEntries(data.texts.map((/** @type {any} */ t) => [t.path, t.value]));
        members = String(data.members ?? data.defaultMembers);
    });

    /** @type {Record<string, string>} */
    const sectionTitles = TEXT_SECTIONS;

    /** @param {string} path */
    const sectionOf = (path) => (path.includes('.') ? path.split('.')[0] : '');

    let sections = $derived.by(() => {
        const q = query.trim();
        /** @type {Map<string, any[]>} */
        const bySection = new Map();
        for (const text of data.texts) {
            if (q && !text.path.includes(q) && !(values[text.path] ?? '').includes(q) && !text.defaultValue.includes(q)) continue;
            const key = sectionOf(text.path);
            if (!bySection.has(key)) bySection.set(key, []);
            bySection.get(key)?.push(text);
        }
        return [...bySection.entries()];
    });

    let editedCount = $derived(data.texts.filter((/** @type {any} */ t) => t.edited).length);

    const submitSave = () => {
        saving = true;
        return async (/** @type {any} */ { update }) => {
            await update({ reset: false });
            await invalidateAll();
            saving = false;
        };
    };
</script>

<svelte:head>
    <title>כיתובי האתר | ניהול</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
    <h2>✏️ כיתובי האתר</h2>
    <p class="sub">
        {#if editedCount}
            <span class="pill edited">{editedCount} כיתובים נערכו</span>
        {:else}
            <span class="pill plain">כל הכיתובים מהקוד</span>
        {/if}
    </p>
</div>

<p class="explain">
    כאן עורכים את מונה החברים ואת הכיתובים באתר (בעברית). מה שנשמר גובר על מה שכתוב בקוד. כדי לחזור לטקסט
    המקורי לוחצים ↺ ליד השדה (או מרוקנים אותו) ושומרים. כיתובי העסקאות עצמן נערכים בלשונית "עסקאות".
</p>

{#if form?.message}<div class="alert ok">{form.message}</div>{/if}
{#if form?.error}<div class="alert error">{form.error}</div>{/if}

<form method="POST" action="?/save" use:enhance={submitSave}>
    <section class="group">
        <h3>👥 מונה החברים בדף הבית</h3>
        <label class="field members">
            <span class="field-label">
                מספר החברים
                {#if data.members}<span class="dot" title="נערך בפאנל">●</span>{/if}
            </span>
            <input type="number" name="members" min="1" bind:value={members} />
            <span class="hint">ברירת המחדל בקוד: {data.defaultMembers}</span>
        </label>
    </section>

    <input class="search" type="search" placeholder="🔍 חיפוש כיתוב…" bind:value={query} />

    {#each sections as [key, texts] (key)}
        <section class="group">
            <h3>{sectionTitles[key] ?? key}</h3>
            <div class="fields">
                {#each texts as text (text.path)}
                    {@const changed = (values[text.path] ?? '') !== text.defaultValue}
                    <label class="field">
                        <span class="field-label">
                            <code>{text.path}</code>
                            {#if text.edited}<span class="dot" title="נערך בפאנל">●</span>{/if}
                            {#if changed}
                                <button
                                    type="button"
                                    class="restore"
                                    title="חזרה לטקסט שבקוד"
                                    onclick={() => (values[text.path] = text.defaultValue)}>↺</button
                                >
                            {/if}
                        </span>
                        <textarea
                            name="t:{text.path}"
                            rows={Math.min(8, Math.max(1, Math.ceil(text.defaultValue.length / 70)))}
                            bind:value={values[text.path]}
                        ></textarea>
                        {#if changed}<span class="hint">במקור: {text.defaultValue}</span>{/if}
                    </label>
                {/each}
            </div>
        </section>
    {:else}
        <p class="empty">לא נמצא כיתוב שמתאים לחיפוש</p>
    {/each}

    <!-- שדות שהחיפוש הסתיר עדיין נשלחים, אחרת השמירה הייתה מאפסת אותם -->
    {#each data.texts as text (text.path)}
        {#if !sections.some(([, list]) => list.includes(text))}
            <input type="hidden" name="t:{text.path}" value={values[text.path] ?? ''} />
        {/if}
    {/each}

    <div class="bar">
        <button class="save" disabled={saving}>{saving ? 'שומר…' : '💾 שמור'}</button>
    </div>
</form>

<style>
    .head {
        margin-bottom: 0.75rem;
    }
    .head h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 800;
        color: #fff;
    }
    .sub {
        margin: 0.35rem 0 0;
        font-size: 0.75rem;
    }
    .explain {
        border-radius: 0.75rem;
        border: 1px solid rgba(59, 130, 246, 0.3);
        background: rgba(59, 130, 246, 0.08);
        color: #bfdbfe;
        padding: 0.7rem 1rem;
        font-size: 0.8rem;
        line-height: 1.6;
        margin: 0 0 1rem;
    }
    .pill {
        border-radius: 999px;
        padding: 0.1rem 0.55rem;
        font-size: 0.7rem;
        font-weight: 800;
        border: 1px solid transparent;
    }
    .pill.edited {
        background: rgba(245, 158, 11, 0.15);
        border-color: rgba(245, 158, 11, 0.35);
        color: #fcd34d;
    }
    .pill.plain {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
        color: #cbd5e1;
    }
    .alert {
        border-radius: 0.75rem;
        padding: 0.7rem 1rem;
        font-size: 0.85rem;
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
        line-height: 1.6;
    }
    .group {
        border-radius: 1rem;
        border: 1px solid var(--border-color);
        background: rgba(255, 255, 255, 0.03);
        padding: 1rem;
        margin-bottom: 1rem;
    }
    .group h3 {
        margin: 0 0 0.85rem;
        font-size: 0.95rem;
        font-weight: 800;
        color: #fff;
    }
    .fields {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
    }
    .field.members {
        max-width: 16rem;
    }
    .field-label {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.8rem;
        font-weight: 700;
        color: #e2e8f0;
    }
    .field-label code {
        direction: ltr;
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-gray);
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0.3rem;
        padding: 0.05rem 0.35rem;
        overflow-wrap: anywhere;
    }
    .dot {
        color: #fbbf24;
        font-size: 0.7rem;
    }
    .restore {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.06);
        color: #e2e8f0;
        border-radius: 0.4rem;
        padding: 0 0.4rem;
        font-size: 0.8rem;
        cursor: pointer;
    }
    input,
    textarea {
        width: 100%;
        box-sizing: border-box;
        border-radius: 0.6rem;
        border: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        padding: 0.5rem 0.7rem;
        font: inherit;
        font-size: 0.9rem;
    }
    textarea {
        resize: vertical;
        line-height: 1.5;
    }
    .search {
        margin-bottom: 1rem;
    }
    .hint {
        font-size: 0.72rem;
        color: var(--text-gray);
        line-height: 1.5;
    }
    .empty {
        text-align: center;
        color: var(--text-gray);
    }
    .bar {
        position: sticky;
        bottom: 0;
        display: flex;
        justify-content: center;
        padding: 0.75rem 0;
        background: linear-gradient(transparent, rgba(2, 6, 23, 0.9) 40%);
    }
    .save {
        border: none;
        border-radius: 0.75rem;
        background: #22c55e;
        color: #052e16;
        font-weight: 800;
        font-size: 0.95rem;
        padding: 0.6rem 2rem;
        cursor: pointer;
    }
    .save:disabled {
        opacity: 0.6;
        cursor: wait;
    }
</style>
