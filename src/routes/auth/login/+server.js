import { redirect } from '@sveltejs/kit';
import { STRAPI_URL, authCookieOptions } from '$lib/auth.js';

const ALLOWED_PROVIDERS = ['google', 'facebook'];

export function GET({ url, cookies }) {
    const provider = (url.searchParams.get('provider') || 'google').toLowerCase();
    if (!ALLOWED_PROVIDERS.includes(provider)) {
        throw redirect(303, '/login');
    }
    const returnTo = url.searchParams.get('returnTo') || '/';
    const cookieOpts = { ...authCookieOptions(url), maxAge: 600, httpOnly: true };
    cookies.set('oauth-return-to', returnTo, cookieOpts);
    cookies.set('oauth-provider', provider, cookieOpts);
    // אותו ה-callback URL לכל provider (זה רשום אצל Strapi/Google כתובת בודדה).
    const callbackUrl = `${url.origin}/auth/google-callback`;
    const startUrl = `${STRAPI_URL}/api/connect/${provider}?callback=${encodeURIComponent(callbackUrl)}`;
    throw redirect(302, startUrl);
}
