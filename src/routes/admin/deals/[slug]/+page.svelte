<script>
    import { enhance } from '$app/forms';
    import {
        FIELD_GROUPS,
        fieldsOf,
        formatFieldValue,
    } from '$lib/campaignFields.js';

    let { data, form } = $props();

    let campaign = $derived(data.campaign);
    let editedKeys = $derived(new Set(campaign.editedKeys ?? []));
    let saving = $state(false);

    /** @type {Record<string, string>} */
    const STATUS_HE = {
        active: 'פעילה באתר',
        soon: 'בקרוב',
        inactive: 'מוסתרת',
    };

    const submitSave = () => {
        saving = true;
        return async (/** @type {any} */ { update }) => {
            await update({ reset: false });
            saving = false;
        };
    };

    const confirmReset = () => (/** @type {any} */ { cancel }) => {
        if (!confirm('לאפס את כל העריכות ולחזור לתוכן שבקוד?')) {
            cancel();
            return;
        }
        saving = true;
        return async (/** @type {any} */ { update }) => {
            await update({ reset: false });
            saving = false;
        };
    };
</script>

<svelte:head>
    <title>עריכת {campaign.title} | ניהול</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<div class="head">
    <span class="icon" aria-hidden="true">{campaign.icon}</span>
    <div>
        <h2>{campaign.title}</h2>
        <p class="sub">
            <code>{campaign.slug}</code>
            {#if editedKeys.size}
                <span class="pill edited">{editedKeys.size} שדות נערכו בפאנל</span>
            {:else}
                <span class="pill plain">כל התוכן מהקוד</span>
            {/if}
        </p>
    </div>
    <a class="view-link" href="/details/{campaign.slug}" target="_blank" rel="noopener">צפייה בדף ↗</a>
</div>

<p class="explain">
    מה שנערך כאן נשמר כ<strong>דריסה</strong> על התוכן שבקוד. שדה שנשאר ריק חוזר אוטומטית לערך
    שבקוד, כך שגם אם Strapi לא זמין — האתר ממשיך להציג את התוכן המלא.
</p>

{#if form?.message}<div class="alert ok">{form.message}</div>{/if}
{#if form?.error}<div class="alert error">{form.error}</div>{/if}

<form method="POST" action="?/save" use:enhance={submitSave}>
    {#each FIELD_GROUPS as group (group.key)}
        <section class="group">
            <h3>{group.icon} {group.title}</h3>
            <div class="fields">
                {#each fieldsOf(group.key) as field (field.key)}
                    {@const value = campaign[field.key]}
                    {@const isEdited = editedKeys.has(field.key)}
                    <label class="field" class:wide={field.type === 'json' || field.type === 'textarea'}>
                        <span class="field-label">
                            {field.label}
                            {#if isEdited}<span class="dot" title="נערך בפאנל">●</span>{/if}
                        </span>

                        {#if field.type === 'boolean'}
                            <input type="checkbox" name={field.key} checked={!!value} />
                        {:else if field.type === 'select'}
                            <select name={field.key} value={value ?? ''}>
                                {#each field.options ?? [] as opt (opt)}
                                    <option value={opt}>{STATUS_HE[opt] ?? opt}</option>
                                {/each}
                            </select>
                        {:else if field.type === 'textarea'}
                            <textarea name={field.key} rows="3">{formatFieldValue(field, value)}</textarea>
                        {:else if field.type === 'json'}
                            <textarea class="json" name={field.key} rows="8" spellcheck="false"
                                >{formatFieldValue(field, value)}</textarea
                            >
                        {:else if field.type === 'number'}
                            <input type="number" name={field.key} value={value ?? ''} />
                        {:else}
                            <input
                                type={field.type === 'url' ? 'url' : 'text'}
                                name={field.key}
                                value={formatFieldValue(field, value)}
                                dir={field.type === 'url' ? 'ltr' : 'auto'}
                            />
                        {/if}

                        {#if field.hint}<span class="hint">{field.hint}</span>{/if}
                    </label>
                {/each}
            </div>
        </section>
    {/each}

    <div class="bar">
        <button class="save" disabled={saving}>{saving ? 'שומר…' : '💾 שמור'}</button>
        <a class="ghost" href="/admin?tab=deals">ביטול</a>
    </div>
</form>

<form method="POST" action="?/reset" use:enhance={confirmReset()} class="reset-form">
    <button class="reset" disabled={saving || !editedKeys.size}>↺ אפס לתוכן שבקוד</button>
</form>

<style>
    .head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.75rem;
    }
    .icon {
        font-size: 2rem;
    }
    .head > div {
        flex: 1;
        min-width: 0;
    }
    .head h2 {
        margin: 0;
        font-size: 1.2rem;
        font-weight: 800;
        color: #fff;
    }
    .sub {
        margin: 0.25rem 0 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-gray);
    }
    .sub code {
        direction: ltr;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 0.3rem;
        padding: 0.05rem 0.35rem;
    }
    .view-link {
        font-size: 0.8rem;
        font-weight: 700;
        color: #93c5fd;
        white-space: nowrap;
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
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 0.85rem;
    }
    @media (max-width: 700px) {
        .fields {
            grid-template-columns: 1fr;
        }
    }
    .field {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        min-width: 0;
    }
    .field.wide {
        grid-column: 1 / -1;
    }
    .field-label {
        font-size: 0.8rem;
        font-weight: 700;
        color: #e5e7eb;
    }
    .dot {
        color: var(--accent-yellow);
        font-size: 0.6rem;
        vertical-align: middle;
    }
    .hint {
        font-size: 0.7rem;
        color: var(--text-gray);
        line-height: 1.5;
    }

    .field input[type='text'],
    .field input[type='url'],
    .field input[type='number'],
    .field select,
    .field textarea {
        width: 100%;
        box-sizing: border-box;
        border-radius: 0.6rem;
        border: 1px solid var(--border-color);
        background: rgba(0, 0, 0, 0.25);
        color: #fff;
        padding: 0.5rem 0.7rem;
        font-size: 0.85rem;
        font-family: inherit;
    }
    .field textarea {
        resize: vertical;
        line-height: 1.6;
    }
    .field textarea.json {
        direction: ltr;
        text-align: left;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.75rem;
    }
    .field input[type='checkbox'] {
        width: 1.15rem;
        height: 1.15rem;
        accent-color: var(--accent-yellow);
    }

    .bar {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        margin: 1.25rem 0 0.75rem;
    }
    .save {
        border: 0;
        border-radius: 0.7rem;
        background: #16a34a;
        color: #fff;
        font-weight: 800;
        font-family: inherit;
        font-size: 0.9rem;
        padding: 0.6rem 1.6rem;
        cursor: pointer;
    }
    .save:disabled {
        opacity: 0.5;
        cursor: default;
    }
    .ghost {
        border-radius: 0.7rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.04);
        color: #e5e7eb;
        font-size: 0.85rem;
        font-weight: 700;
        padding: 0.6rem 1.2rem;
    }

    .reset-form {
        margin-bottom: 2rem;
    }
    .reset {
        border-radius: 0.6rem;
        border: 1px solid rgba(239, 68, 68, 0.35);
        background: rgba(239, 68, 68, 0.1);
        color: #fca5a5;
        font-size: 0.8rem;
        font-weight: 700;
        font-family: inherit;
        padding: 0.45rem 1rem;
        cursor: pointer;
    }
    .reset:disabled {
        opacity: 0.35;
        cursor: default;
    }
</style>
