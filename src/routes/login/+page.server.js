import { fail, redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, STRAPI_URL, authCookieOptions } from '$lib/auth.js';
import { displayName } from '$lib/displayName.js';

/**
 * זיהוי מראש דרך העוגייה המשותפת gofreeil-auth (.gofreeil.com): hooks.server.js
 * כבר אימת אותה מול Strapi ומילא את locals.user, ולכן מי שכבר מחובר באתר אחר
 * של יוצאים לחירות רואה "המשך כ-<שם>" בלחיצה אחת. עוגייה מתה או חסרה → null,
 * וכפתור ה-SSO מוצג כאפשרות משנית בלבד (לא כהבטחה שתיכשל).
 */
export function load({ locals }) {
    /** @type {string | null} */
    let ssoName = null;
    try {
        const u = locals.user;
        if (u?.email || u?.username) ssoName = displayName(u, 'חבר הקהילה');
    } catch {
        /* מציגים את הדף הרגיל */
    }
    return { ssoName };
}

/**
 * מבנה אחיד לכל כשלי ההתחברות - כך הדף יכול לקרוא identifier/badCredentials בלי ענפים.
 * @param {number} status @param {string} error @param {string} [identifier] @param {boolean} [badCredentials]
 */
const failLogin = (status, error, identifier = '', badCredentials = false) =>
    fail(status, { error, identifier, badCredentials });

export const actions = {
    local: async ({ request, url, cookies, fetch }) => {
        const form = await request.formData();
        const identifier = String(form.get('identifier') || '').trim();
        const password = String(form.get('password') || '');
        const returnTo = String(form.get('returnTo') || '/');
        if (!identifier || !password) return failLogin(400, 'אימייל וסיסמה נדרשים', identifier);

        const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const raw = String(json?.error?.message || '');
            // "Invalid identifier or password" גם כשהחשבון נוצר דרך Google/Facebook (אין לו
            // סיסמה) - לכן ההודעה מציעה את שתי הדרכים: כפתורי הספקים, או שחזור סיסמה.
            if (!raw || /invalid identifier or password/i.test(raw)) {
                return failLogin(401, 'האימייל או הסיסמה לא תואמים.', identifier, true);
            }
            if (/not confirmed/i.test(raw)) {
                return failLogin(
                    401,
                    'כתובת האימייל עדיין לא אושרה. חפש במייל את הקישור לאישור, או בחר סיסמה חדשה כדי להמשיך.',
                    identifier,
                    true,
                );
            }
            if (/blocked/i.test(raw)) {
                return failLogin(403, 'החשבון הזה נחסם על ידי מנהל האתר.', identifier);
            }
            return failLogin(401, raw, identifier);
        }
        const data = await res.json();
        if (!data?.jwt) return failLogin(502, 'Strapi לא החזיר JWT', identifier);

        cookies.set(AUTH_COOKIE, data.jwt, authCookieOptions(url));
        // התחברות מפורשת בסיסמה מדף ההתחברות → מסך "ברוכים השבים"
        // (אותו דפוס כמו withWelcome בדף ההתחברות של שאר אתרי הרשת)
        const sep = returnTo.includes('?') ? '&' : '?';
        throw redirect(303, `${returnTo}${sep}welcome=back`);
    },
};
