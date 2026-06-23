// פרטי הזדהות משותפים לכל הסאב-דומיינים של gofreeil.com.
// העוגיה מוגדרת על `.gofreeil.com` כך שכל אתר תחת הדומיין מקבל אותה אוטומטית.
// בפיתוח (localhost) לא ניתן להגדיר Domain חוצה — נשמטת ההגדרה, ועוגיה תוקפת רק ל-localhost.

import { env } from '$env/dynamic/private';

export const AUTH_COOKIE = 'gofreeil-auth';
export const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');

export function authCookieOptions(url) {
    const isLocalhost = url && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    const opts = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 ימים
    };
    if (isLocalhost) {
        opts.secure = false;
    } else {
        opts.secure = true;
        opts.domain = '.gofreeil.com';
    }
    return opts;
}

export async function exchangeGoogleToken(accessToken, { fetch: f = fetch } = {}) {
    const res = await f(`${STRAPI_URL}/api/auth/google/callback?access_token=${encodeURIComponent(accessToken)}`);
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Google exchange failed: ${res.status} ${txt.slice(0, 200)}`);
    }
    return res.json();
}

export async function fetchCurrentUser(jwt, { fetch: f = fetch } = {}) {
    if (!jwt) return null;
    try {
        const res = await f(`${STRAPI_URL}/api/users/me?populate=role`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export function isSuperAdmin(user) {
    return !!user && user.app_role === 'super_admin';
}
