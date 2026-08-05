// פרטי הזדהות משותפים לכל הסאב-דומיינים של gofreeil.com.
// העוגיה מוגדרת על `.gofreeil.com` כך שכל אתר תחת הדומיין מקבל אותה אוטומטית.
// בפיתוח (localhost) לא ניתן להגדיר Domain חוצה — נשמטת ההגדרה, ועוגיה תוקפת רק ל-localhost.

import { env } from '$env/dynamic/private';

export const AUTH_COOKIE = 'gofreeil-auth';
export const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');

/** אפשרויות העוגיה כפי ש-SvelteKit מצפה להן ב-cookies.set/delete. */
/** @typedef {Parameters<import('@sveltejs/kit').Cookies['set']>[2]} CookieOptions */

/**
 * @param {URL | null | undefined} url
 * @returns {CookieOptions}
 */
export function authCookieOptions(url) {
    const isLocalhost = !!url && (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    /** @type {CookieOptions} */
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

/**
 * @param {string} provider
 * @param {string} accessToken
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function exchangeOAuthToken(provider, accessToken, { fetch: f = fetch } = {}) {
    const res = await f(`${STRAPI_URL}/api/auth/${provider}/callback?access_token=${encodeURIComponent(accessToken)}`);
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`${provider} exchange failed: ${res.status} ${txt.slice(0, 200)}`);
    }
    return res.json();
}
// alias לתאימות
/**
 * @param {string} token
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export const exchangeGoogleToken = (token, opts) => exchangeOAuthToken('google', token, opts);

/**
 * @param {string | null | undefined} jwt
 * @param {{ fetch?: typeof fetch }} [opts]
 */
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

/** @param {{ app_role?: string } | null | undefined} user */
export function isSuperAdmin(user) {
    return !!user && user.app_role === 'super_admin';
}

/**
 * אדמין: סופר-אדמין או אדמין שמונה. מסך אישור הפרסומות פתוח לשניהם -
 * גם אדמין שמונה צריך לאשר, להשהות ולנהל פרסומות שכבר באתר.
 * @param {{ app_role?: string } | null | undefined} user
 */
export function isAdmin(user) {
    return !!user && (user.app_role === 'super_admin' || user.app_role === 'neighborhood_admin');
}
