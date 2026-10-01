<script>
    import { enhance } from '$app/forms';
    import RecoveryCard from '$lib/components/RecoveryCard.svelte';

    let { data, form } = $props();

    let password = $state('');
    let confirm = $state('');
    let show = $state(false);
    let loading = $state(false);

    // מד חוזק פשוט: אורך + גיוון. לא חוסם דבר (המינימום היחיד הוא 6 תווים) - רק מכוון לסיסמה טובה יותר.
    const strength = $derived.by(() => {
        if (!password) return 0;
        let s = 0;
        if (password.length >= 6) s++;
        if (password.length >= 10) s++;
        if (/[a-zא-ת]/i.test(password) && /\d/.test(password)) s++;
        if (/[^a-zA-Z0-9א-ת]/.test(password) || (/[A-Z]/.test(password) && /[a-z]/.test(password))) s++;
        return Math.min(s, 4);
    });
    const LABELS = ['', 'חלשה', 'סבירה', 'טובה', 'חזקה'];
    const mismatch = $derived(confirm.length > 0 && password !== confirm);
    const canSubmit = $derived(password.length >= 6 && password === confirm && !loading);
    const invalidLink = $derived(!data.code || !!form?.expired);
</script>

<svelte:head>
    <title>בחירת סיסמה חדשה | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex, follow" />
</svelte:head>

{#if invalidLink}
    <RecoveryCard icon="⏳" title="הקישור כבר לא תקף">
        <p class="lead">
            {form?.error || 'הקישור חסר או לא תקין.'}
            זה קורה כשנשלח מייל חדש אחריו, או שכבר השתמשת בו. בקשת קישור חדש לוקחת חצי דקה.
        </p>
        <a class="primary" href="/forgot-password">שלח לי קישור חדש</a>
        <p class="alt"><a href="/login">← חזרה להתחברות</a></p>
    </RecoveryCard>
{:else}
    <RecoveryCard
        icon="🔒"
        title="בחירת סיסמה חדשה"
        sub="נשאר רק לבחור סיסמה — ומיד אחרי זה תהיה מחובר לאתר."
    >
        <form
            method="POST"
            class="rec-form"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    loading = false;
                };
            }}
        >
            <input type="hidden" name="code" value={data.code} />

            <label>
                <span>סיסמה חדשה</span>
                <div class="pw">
                    <!-- svelte-ignore a11y_autofocus -->
                    <input
                        type={show ? 'text' : 'password'}
                        name="password"
                        bind:value={password}
                        autocomplete="new-password"
                        minlength="6"
                        placeholder="לפחות 6 תווים"
                        autofocus
                        required
                    />
                    <button type="button" class="eye" onclick={() => (show = !show)} aria-pressed={show}>
                        {show ? 'הסתר' : 'הצג'}
                    </button>
                </div>
            </label>

            {#if password}
                <div class="meter" aria-live="polite">
                    <div class="bars" data-level={strength}>
                        <i></i><i></i><i></i><i></i>
                    </div>
                    <span class="meter-label" data-level={strength}>{LABELS[strength]}</span>
                </div>
            {/if}

            <label>
                <span>הקלד שוב לאימות</span>
                <input
                    type={show ? 'text' : 'password'}
                    name="confirm"
                    bind:value={confirm}
                    autocomplete="new-password"
                    placeholder="אותה סיסמה"
                    required
                />
            </label>
            {#if mismatch}<p class="hint-bad" role="alert">הסיסמאות עדיין לא זהות</p>{/if}

            {#if form?.error}<div class="form-error" role="alert">{form.error}</div>{/if}

            <button type="submit" class="primary" disabled={!canSubmit}>
                {loading ? 'שומר…' : 'שמור סיסמה והתחבר'}
            </button>
        </form>
    </RecoveryCard>
{/if}

<style>
    .lead {
        color: rgba(255, 255, 255, 0.82);
        line-height: 1.75;
        margin: 0 0 1.2rem;
    }
    .rec-form {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .rec-form label {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
    }
    .rec-form label span {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.78);
    }
    input[type='password'],
    input[type='text'] {
        width: 100%;
        box-sizing: border-box;
        padding: 0.8rem 0.95rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.95);
        font-family: inherit;
        font-size: 1.02rem;
    }
    input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
    input:focus {
        outline: none;
        border-color: #facc15;
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.18);
    }
    .pw {
        position: relative;
    }
    .pw input {
        padding-left: 4.2rem;
    }
    .eye {
        position: absolute;
        left: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.08);
        color: rgba(255, 255, 255, 0.8);
        border: none;
        border-radius: 7px;
        padding: 0.3rem 0.6rem;
        font-size: 0.8rem;
        font-family: inherit;
        cursor: pointer;
    }
    .meter {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        margin-top: -0.3rem;
    }
    .bars {
        display: flex;
        gap: 4px;
        flex: 1;
    }
    .bars i {
        flex: 1;
        height: 5px;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.12);
        transition: background 0.2s ease;
    }
    .bars[data-level='1'] i:nth-child(-n + 1) { background: #ef4444; }
    .bars[data-level='2'] i:nth-child(-n + 2) { background: #f59e0b; }
    .bars[data-level='3'] i:nth-child(-n + 3) { background: #84cc16; }
    .bars[data-level='4'] i:nth-child(-n + 4) { background: #22c55e; }
    .meter-label {
        font-size: 0.8rem;
        min-width: 3.2rem;
        color: rgba(255, 255, 255, 0.7);
    }
    .hint-bad {
        margin: -0.4rem 0 0;
        font-size: 0.85rem;
        color: #fca5a5;
    }
    .form-error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        padding: 0.6rem 0.85rem;
        border-radius: 8px;
        font-size: 0.92rem;
    }
    .primary {
        display: block;
        text-align: center;
        background: #facc15;
        color: #1f2937;
        border: none;
        padding: 0.85rem 1rem;
        border-radius: 10px;
        font-weight: 800;
        font-size: 1.05rem;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        margin-top: 0.2rem;
        transition: background 0.15s ease, transform 0.1s ease;
    }
    .primary:hover:not(:disabled) {
        background: #fde047;
        transform: translateY(-1px);
    }
    .primary:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .alt {
        margin: 1.1rem 0 0;
        text-align: center;
        font-size: 0.9rem;
    }
    .alt a {
        color: #fde68a;
    }
</style>
