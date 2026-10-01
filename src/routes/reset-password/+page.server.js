import { fail, redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, authCookieOptions } from '$lib/auth.js';
import { confirmPasswordReset, RecoveryError } from '$lib/server/recovery.js';

/** @param {number} status @param {string} error @param {boolean} [expired] */
const failReset = (status, error, expired = false) => fail(status, { error, expired });

export function load({ url }) {
    return { code: (url.searchParams.get('code') || '').trim().slice(0, 400) };
}

export const actions = {
    default: async ({ request, url, cookies, fetch }) => {
        const form = await request.formData();
        const code = String(form.get('code') || '').trim();
        const password = String(form.get('password') || '');
        const confirm = String(form.get('confirm') || '');

        if (!code) return failReset(400, 'הקישור לא תקין.', true);
        if (password.length < 6) return failReset(400, 'הסיסמה צריכה להכיל לפחות 6 תווים.');
        if (password !== confirm) return failReset(400, 'שתי הסיסמאות לא זהות. נסה שוב.');

        let jwt;
        try {
            jwt = await confirmPasswordReset(code, password, fetch);
        } catch (err) {
            if (err instanceof RecoveryError && err.kind === 'invalid') {
                return failReset(400, 'הקישור כבר נוצל או שפג תוקפו (הוא תקף לשעתיים).', true);
            }
            if (err instanceof RecoveryError && err.kind === 'rate') {
                return failReset(429, 'יותר מדי ניסיונות. נסה שוב בעוד כמה דקות.');
            }
            console.warn('reset-password failed:', err instanceof Error ? err.message : err);
            return failReset(503, 'תקלה זמנית בשרת. נסה שוב בעוד רגע.');
        }

        // הסיסמה נקבעה = המשתמש הוכיח בעלות על המייל, ולכן נכנס מיד (העוגייה
        // המשותפת gofreeil-auth מחברת אותו גם בשאר אתרי הרשת).
        cookies.set(AUTH_COOKIE, jwt, authCookieOptions(url));
        throw redirect(303, '/?welcome=back');
    },
};
