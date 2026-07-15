import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, authCookieOptions, exchangeOAuthToken } from '$lib/auth.js';

export async function GET({ url, cookies, fetch }) {
    const returnTo = cookies.get('oauth-return-to') || '/';
    const accessToken = url.searchParams.get('access_token');
    // כישלון מ-Google עצמו (המשתמש ביטל / דחה הרשאות): חזרה עדינה למסך ההתחברות.
    if (!accessToken) throw redirect(302, loginWithError('failed', returnTo));

    const provider = cookies.get('oauth-provider') || 'google';
    let data;
    try {
        data = await exchangeOAuthToken(provider, accessToken, { fetch });
    } catch (e) {
        // במקום מסך 502 עם JSON גולמי — מפנים ל-/login עם הודעה ידידותית.
        // (מאז חיבור-החשבונות בשרת, "email already taken" כבר לא אמור לקרות,
        //  אבל זו רשת ביטחון לכל כשל אחר.)
        const msg = String(e?.message || '');
        const code = /already taken|already exist/i.test(msg) ? 'email_taken' : 'failed';
        throw redirect(302, loginWithError(code, returnTo));
    }
    if (!data?.jwt) throw redirect(302, loginWithError('failed', returnTo));

    cookies.set(AUTH_COOKIE, data.jwt, authCookieOptions(url));
    cookies.delete('oauth-return-to', { ...authCookieOptions(url) });
    cookies.delete('oauth-provider', { ...authCookieOptions(url) });
    throw redirect(302, returnTo);
}

/**
 * @param {string} code
 * @param {string} returnTo
 */
function loginWithError(code, returnTo) {
    const params = new URLSearchParams({ authError: code });
    if (returnTo && returnTo !== '/') params.set('returnTo', returnTo);
    return `/login?${params.toString()}`;
}
