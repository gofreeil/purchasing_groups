<script>
    import { enhance } from '$app/forms';
    import RecoveryCard from '$lib/components/RecoveryCard.svelte';

    let { data, form } = $props();

    let email = $state(data.email || '');
    let loading = $state(false);
    // בפועל השרת מגביל לשליחה אחת ל-45 שניות לכתובת; מעט מעל כדי שהלחיצה החוזרת תמיד תשלח.
    const COOLDOWN = 50;
    let cooldown = $state(0);

    // נשאר במסך "נשלח" גם כששליחה חוזרת נכשלת (form.sent נעלם אז, אבל השגיאה מוצגת כאן)
    let sentTo = $state('');
    const sent = $derived(!!sentTo);

    // כל שליחה מוצלחת (form.at חדש) מאפסת את הספירה לאחור של "שלח שוב".
    $effect(() => {
        if (!form?.sent) return;
        sentTo = form.email;
        cooldown = COOLDOWN;
        const timer = setInterval(() => {
            cooldown -= 1;
            if (cooldown <= 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    });

    /** קיצור "פתח את תיבת המייל" לספקים נפוצים, לפי הדומיין של הכתובת. */
    /** @type {Record<string, [string, string]>} */
    const MAIL_APPS = {
        'gmail.com': ['Gmail', 'https://mail.google.com/'],
        'googlemail.com': ['Gmail', 'https://mail.google.com/'],
        'outlook.com': ['Outlook', 'https://outlook.live.com/mail/'],
        'hotmail.com': ['Outlook', 'https://outlook.live.com/mail/'],
        'live.com': ['Outlook', 'https://outlook.live.com/mail/'],
        'yahoo.com': ['Yahoo Mail', 'https://mail.yahoo.com/'],
        'walla.co.il': ['וואלה מייל', 'https://mail.walla.co.il/'],
        'walla.com': ['וואלה מייל', 'https://mail.walla.co.il/'],
    };
    const mailApp = $derived(MAIL_APPS[(sentTo.split('@')[1] || '').toLowerCase()] ?? null);
</script>

<svelte:head>
    <title>שחזור גישה לחשבון | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex, follow" />
</svelte:head>

{#if sent}
    <RecoveryCard icon="📬" title="הקישור בדרך אליך">
        <p class="lead">
            אם הכתובת <strong class="addr" dir="ltr">{sentTo}</strong> רשומה אצלנו, שלחנו אליה עכשיו
            מייל עם קישור לבחירת סיסמה חדשה. הקישור תקף לשעתיים.
        </p>

        {#if mailApp}
            <a class="primary open-mail" href={mailApp[1]} target="_blank" rel="noopener noreferrer">
                פתח את {mailApp[0]} ↗
            </a>
        {/if}

        <ul class="tips">
            <li>המייל מגיע בדרך כלל תוך דקה.</li>
            <li>לא רואה אותו? בדוק בתיקיית <strong>ספאם</strong> או <strong>קידומי מכירות</strong>.</li>
            <li>הקלקה על הקישור במייל מחברת אותך מיד, בלי להתחבר שוב.</li>
        </ul>

        <form
            method="POST"
            action="?/send"
            class="resend"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    loading = false;
                };
            }}
        >
            <input type="hidden" name="email" value={sentTo} />
            <button type="submit" class="ghost" disabled={loading || cooldown > 0}>
                {#if loading}שולח…{:else if cooldown > 0}שלח שוב בעוד {cooldown} שנ'{:else}לא הגיע? שלח שוב{/if}
            </button>
        </form>

        {#if form?.error}<div class="form-error" role="alert">{form.error}</div>{/if}

        <p class="alt">
            טעות בכתובת? <a href="/forgot-password?email={encodeURIComponent(sentTo)}" data-sveltekit-reload>תקן והקלד מחדש</a>
        </p>
    </RecoveryCard>
{:else}
    <RecoveryCard
        icon="🔑"
        title="שכחת סיסמה?"
        sub="לא נורא. הקלד את האימייל שלך ונשלח קישור לבחירת סיסמה חדשה — ותהיה מחובר מיד."
    >
        <form
            method="POST"
            action="?/send"
            class="rec-form"
            use:enhance={() => {
                loading = true;
                return async ({ update }) => {
                    await update({ reset: false });
                    loading = false;
                };
            }}
        >
            <label>
                <span>האימייל שלך</span>
                <!-- svelte-ignore a11y_autofocus -->
                <input
                    type="email"
                    name="email"
                    bind:value={email}
                    placeholder="name@example.com"
                    autocomplete="email"
                    inputmode="email"
                    dir="ltr"
                    autofocus
                    required
                />
            </label>

            {#if form?.error}<div class="form-error" role="alert">{form.error}</div>{/if}

            <button type="submit" class="primary" disabled={loading}>
                {loading ? 'שולח…' : 'שלח לי קישור'}
            </button>
        </form>

        <p class="alt"><a href="/login">← חזרה להתחברות</a></p>
    </RecoveryCard>
{/if}

<section class="social-tip">
    <p>
        <strong>נרשמת עם Google או Facebook?</strong>
        אז אין לך סיסמה ואין צורך בה — פשוט היכנס בלחיצה:
    </p>
    <div class="social-btns">
        <a class="soc google" href="/auth/login">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
            </svg>
            Google
        </a>
        <a class="soc facebook" href="/auth/login?provider=facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
        </a>
    </div>
</section>

<style>
    .lead {
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.75;
        margin: 0 0 1.1rem;
    }
    .addr {
        color: #fde68a;
        word-break: break-all;
        unicode-bidi: embed;
    }
    .rec-form {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
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
    input[type='email'] {
        padding: 0.8rem 0.95rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.95);
        font-family: inherit;
        font-size: 1.02rem;
        text-align: left;
    }
    input[type='email']::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }
    input[type='email']:focus {
        outline: none;
        border-color: #facc15;
        box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.18);
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
        transition: background 0.15s ease, transform 0.1s ease;
    }
    .primary:hover:not(:disabled) {
        background: #fde047;
        transform: translateY(-1px);
    }
    .primary:disabled {
        opacity: 0.6;
        cursor: wait;
    }
    .open-mail {
        margin-bottom: 1rem;
    }
    .ghost {
        width: 100%;
        background: transparent;
        color: #fde68a;
        border: 1px solid rgba(250, 204, 21, 0.4);
        padding: 0.7rem 1rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.95rem;
        cursor: pointer;
        font-family: inherit;
    }
    .ghost:hover:not(:disabled) {
        background: rgba(250, 204, 21, 0.1);
    }
    .ghost:disabled {
        color: rgba(255, 255, 255, 0.45);
        border-color: rgba(255, 255, 255, 0.15);
        cursor: default;
    }
    .tips {
        margin: 0 0 1.1rem;
        padding: 0.85rem 1.8rem 0.85rem 1rem;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 10px;
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.9rem;
        line-height: 1.7;
    }
    .form-error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        padding: 0.6rem 0.85rem;
        border-radius: 8px;
        font-size: 0.92rem;
        margin-top: 0.8rem;
    }
    .alt {
        margin: 1.1rem 0 0;
        text-align: center;
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.55);
    }
    .alt a {
        color: #fde68a;
    }
    .social-tip {
        max-width: 480px;
        margin: -1rem auto 2.5rem;
        padding: 0 1rem;
        text-align: center;
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.9rem;
        line-height: 1.6;
    }
    .social-tip p {
        margin: 0 0 0.7rem;
    }
    .social-btns {
        display: flex;
        gap: 0.6rem;
        justify-content: center;
    }
    .soc {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.55rem 1.1rem;
        border-radius: 10px;
        font-weight: 700;
        font-size: 0.92rem;
        text-decoration: none;
    }
    .soc.google {
        background: #fff;
        color: #1f2937;
    }
    .soc.facebook {
        background: #1877f2;
        color: #fff;
    }
</style>
