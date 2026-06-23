<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { strapiGoogleExchange, getCurrentUser } from '$lib/strapi-client.js';

    let status = $state('working');
    let errorMsg = $state('');

    onMount(async () => {
        try {
            const params = new URLSearchParams(window.location.search);
            let returnTo = '/';
            try {
                const stored = sessionStorage.getItem('pg-oauth-returnTo');
                if (stored) returnTo = stored;
                sessionStorage.removeItem('pg-oauth-returnTo');
            } catch {}
            if (!params.get('access_token')) throw new Error('לא התקבל token מ-Google');
            await strapiGoogleExchange(params);
            const me = await getCurrentUser();
            if (!me) throw new Error('ההזדהות נכשלה');
            goto(returnTo);
        } catch (e) {
            errorMsg = e?.message ?? 'שגיאה בהזדהות';
            status = 'error';
        }
    });
</script>

<svelte:head><title>מתחבר עם Google...</title></svelte:head>

<section class="callback">
    {#if status === 'working'}
        <div class="icon">⏳</div>
        <p>מסיים את ההתחברות עם Google...</p>
    {:else}
        <div class="error">
            <div class="icon">⚠️</div>
            <p class="msg">{errorMsg}</p>
            <a href="/">חזרה לדף הבית</a>
        </div>
    {/if}
</section>

<style>
    .callback {
        max-width: 480px;
        margin: 4rem auto;
        text-align: center;
        padding: 2rem 1rem;
        color: rgba(255, 255, 255, 0.9);
    }
    .icon { font-size: 3rem; margin-bottom: 1rem; }
    .error .msg { color: #fca5a5; margin-bottom: 1rem; }
    .error a {
        display: inline-block;
        padding: 0.5rem 1.2rem;
        background: #facc15;
        color: #1f2937;
        border-radius: 8px;
        text-decoration: none;
        font-weight: 700;
    }
</style>
