import { redirect } from '@sveltejs/kit';
import { STRAPI_URL, authCookieOptions } from '$lib/auth.js';

export function GET({ url, cookies }) {
    const returnTo = url.searchParams.get('returnTo') || '/';
    // returnTo נשמר ב-cookie קצר טווח — Strapi דורש callback בלי query params להתאמה מדויקת.
    cookies.set('oauth-return-to', returnTo, { ...authCookieOptions(url), maxAge: 600, httpOnly: true });
    const callbackUrl = `${url.origin}/auth/google-callback`;
    const startUrl = `${STRAPI_URL}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`;
    throw redirect(302, startUrl);
}
