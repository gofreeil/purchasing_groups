<script>
    let { data } = $props();

    // הרשמה בלחיצה מתוך מסך "עדיין אין חשבון": Google/Facebook יוצרים חשבון
    // ומחזירים ליעד המקורי עם welcome=new (מסך "ברוכים המצטרפים").
    const joinReturnTo = $derived(
        `${data.returnTo}${data.returnTo.includes('?') ? '&' : '?'}welcome=new`,
    );
    /** @param {'google' | 'facebook'} provider */
    const joinUrl = (provider) =>
        `/auth/login?provider=${provider}&returnTo=${encodeURIComponent(joinReturnTo)}`;

    /** @type {'google' | 'facebook' | null} */
    let loading = $state(null);
</script>

<svelte:head>
    <title>התחברות דרך יוצאים לחירות | רכישות קבוצתיות</title>
    <meta name="robots" content="noindex" />
</svelte:head>

<section class="join-page">
    <div class="join-icon" aria-hidden="true">🔒</div>
    <h1>עוד רגע ואתם בפנים</h1>
    <p class="lead">
        אתם בקבוצות הווצאפ של יוצאים לחירות, אבל עדיין אין לכם חשבון באתר. זה בסדר גמור, ככה זה
        לכולם בפעם הראשונה.
    </p>
    <p class="sub">
        לחיצה אחת למטה יוצרת לכם חשבון, ומשם אתם מזוהים בכל אתרי יוצאים לחירות בלי להירשם שוב.
    </p>

    <div class="providers">
        <a
            class="prov google"
            class:busy={loading !== null}
            href={joinUrl('google')}
            onclick={() => (loading = 'google')}
        >
            <span class="prov-icon">
                {#if loading === 'google'}
                    <span class="spinner dark"></span>
                {:else}
                    <svg width="20" height="20" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#4285F4" d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                        <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                        <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                        <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                    </svg>
                {/if}
            </span>
            המשך עם Google
        </a>

        <a
            class="prov facebook"
            class:busy={loading !== null}
            href={joinUrl('facebook')}
            onclick={() => (loading = 'facebook')}
        >
            <span class="prov-icon">
                {#if loading === 'facebook'}
                    <span class="spinner"></span>
                {:else}
                    <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                {/if}
            </span>
            המשך עם Facebook
        </a>
    </div>

    <p class="back">
        <a href={`/login?returnTo=${encodeURIComponent(data.returnTo)}`}>חזרה להתחברות</a>
    </p>
</section>

<style>
    .join-page {
        max-width: 480px;
        margin: 2.5rem auto;
        padding: 0 1rem;
        text-align: center;
    }
    .join-icon {
        width: 64px;
        height: 64px;
        margin: 0 auto 1rem;
        border-radius: 16px;
        background: linear-gradient(135deg, #eab308, #ea580c);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.9rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
    }
    .join-page h1 {
        color: #facc15;
        font-size: 1.8rem;
        margin: 0 0 0.6rem;
    }
    .lead {
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0 0 0.4rem;
    }
    .sub {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.92rem;
        line-height: 1.6;
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
        font-family: inherit;
    }
    .prov:hover { transform: translateY(-1px); }
    .prov.busy {
        opacity: 0.6;
        pointer-events: none;
    }
    .prov-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 26px;
        height: 26px;
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
    .spinner {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        animation: spin 0.8s linear infinite;
    }
    .spinner.dark {
        border-color: #d1d5db;
        border-top-color: #1f2937;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    .back {
        margin-top: 1.4rem;
        font-size: 0.88rem;
    }
    .back a {
        color: rgba(255, 255, 255, 0.55);
        text-decoration: underline;
    }
    .back a:hover { color: rgba(255, 255, 255, 0.85); }
</style>
