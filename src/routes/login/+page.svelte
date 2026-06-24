<script>
    import { page } from '$app/stores';
    let { form } = $props();

    const returnTo = $derived($page.url.searchParams.get('returnTo') || '/');
    const communityLoginUrl = $derived(
        `https://community.gofreeil.com/login?returnTo=${encodeURIComponent('https://groups.gofreeil.com' + returnTo)}`,
    );
</script>

<svelte:head><title>התחברות | רכישות קבוצתיות</title></svelte:head>

<section class="login-page">
    <h1>התחברות</h1>
    <p class="sub">בחר איך להתחבר. אם אין לך חשבון — ההתחברות יוצרת אותו אוטומטית.</p>

    <div class="providers">
        <a class="prov google" href={`/auth/login?returnTo=${encodeURIComponent(returnTo)}`}>
            <span class="prov-icon">
                <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
            </span>
            התחבר עם Google
        </a>

        <a class="prov facebook" href={`/auth/login?provider=facebook&returnTo=${encodeURIComponent(returnTo)}`}>
            <span class="prov-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
            </span>
            התחבר עם Facebook
        </a>

        <a class="prov community" href={communityLoginUrl}>
            <span class="prov-icon">
                <img src="/assets/yotzim-lecherut.png" alt="יוצאים לחירות" />
            </span>
            התחבר דרך קהילת יוצאים לחירות
        </a>
    </div>

    <div class="divider"><span>או</span></div>

    <form class="local-form" method="POST" action="?/local" autocomplete="on">
        <input type="hidden" name="returnTo" value={returnTo} />
        <label>
            <span>אימייל או שם משתמש</span>
            <input
                type="text"
                name="identifier"
                value={form?.identifier ?? ''}
                autocomplete="username"
                required
            />
        </label>
        <label>
            <span>סיסמה</span>
            <input
                type="password"
                name="password"
                autocomplete="current-password"
                required
            />
        </label>
        {#if form?.error}
            <div class="form-error">{form.error}</div>
        {/if}
        <button type="submit" class="local-submit">התחבר</button>
    </form>

    <p class="signup-hint">
        אין לך עוד חשבון? אחת מ-3 האפשרויות שלמעלה תיצור לך בלחיצה אחת.
    </p>
</section>

<style>
    .login-page {
        max-width: 480px;
        margin: 2.5rem auto;
        padding: 0 1rem;
        text-align: right;
    }
    .login-page h1 {
        color: #facc15;
        font-size: 1.8rem;
        margin: 0 0 0.4rem;
    }
    .sub {
        color: rgba(255, 255, 255, 0.7);
        margin: 0 0 1.6rem;
    }
    .providers {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
    }
    .prov {
        display: flex;
        align-items: center;
        gap: 0.7rem;
        padding: 0.75rem 1rem;
        border-radius: 10px;
        font-weight: 700;
        text-decoration: none;
        transition: transform 0.1s ease, background 0.15s ease;
        font-size: 0.98rem;
    }
    .prov:hover { transform: translateY(-1px); }
    .prov-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
        font-size: 1.1rem;
    }
    .prov-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        border-radius: 4px;
    }
    .prov.google {
        background: #fff;
        color: #1f2937;
        border: 1px solid #e5e7eb;
    }
    .prov.facebook {
        background: #1877f2;
        color: #fff;
    }
    .prov.community {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        color: #fff;
    }
    .divider {
        position: relative;
        text-align: center;
        margin: 1.4rem 0;
    }
    .divider::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: rgba(255, 255, 255, 0.15);
    }
    .divider span {
        position: relative;
        background: var(--bg, #0f1726);
        padding: 0 0.7rem;
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.85rem;
    }
    .local-form {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
    }
    .local-form label {
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
    }
    .local-form label span {
        font-size: 0.88rem;
        color: rgba(255, 255, 255, 0.75);
    }
    .local-form input {
        padding: 0.6rem 0.85rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        color: rgba(255, 255, 255, 0.95);
        font-family: inherit;
        font-size: 0.95rem;
    }
    .local-form input:focus {
        outline: none;
        border-color: #facc15;
    }
    .form-error {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
        padding: 0.55rem 0.8rem;
        border-radius: 8px;
        font-size: 0.9rem;
    }
    .local-submit {
        background: #facc15;
        color: #1f2937;
        border: none;
        padding: 0.7rem 1rem;
        border-radius: 8px;
        font-weight: 700;
        font-size: 1rem;
        cursor: pointer;
        font-family: inherit;
    }
    .local-submit:hover { background: #fde047; }
    .signup-hint {
        margin-top: 1.4rem;
        color: rgba(255, 255, 255, 0.55);
        font-size: 0.88rem;
        text-align: center;
    }
</style>
