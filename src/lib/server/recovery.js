// שחזור גישה לחשבון מול ה-Strapi המשותף של רשת האתרים (api.gofreeil.com).
// ה-Strapi שולח את המייל; כאן רק מבקשים ממנו, ומוסרים לו את כתובת דף האיפוס
// של האתר הזה כדי שהקישור במייל יחזיר את המשתמש לכאן ולא לאתר אחר ברשת.
import { STRAPI_URL } from '$lib/auth.js';

const TIMEOUT_MS = 8000;

/** שגיאה מובחנת: kind = 'rate' | 'invalid' | 'server' */
export class RecoveryError extends Error {
    /** @param {'rate' | 'invalid' | 'server'} kind @param {string} [message] */
    constructor(kind, message = kind) {
        super(message);
        this.kind = kind;
    }
}

/**
 * @param {string} path
 * @param {unknown} body
 * @param {typeof fetch} f
 */
async function post(path, body, f) {
    try {
        return await f(`${STRAPI_URL}/api/${path}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch {
        throw new RecoveryError('server', 'Strapi לא זמין');
    }
}

/**
 * שולח מייל שחזור. תשובת השרת זהה גם כשהאימייל לא רשום (אין דליפת "מי רשום"),
 * ולכן הצלחה כאן אומרת רק "הבקשה התקבלה".
 * @param {string} email
 * @param {string} origin כתובת האתר הזה (https://groups.gofreeil.com)
 * @param {typeof fetch} f
 */
export async function requestPasswordReset(email, origin, f = fetch) {
    let res = await post('auth/forgot-password', { email, resetUrl: `${origin}/reset-password` }, f);
    // שרת ישן (לפני התמיכה ב-resetUrl) דוחה שדה לא מוכר ב-400 - מנסים בלעדיו.
    if (res.status === 400) res = await post('auth/forgot-password', { email }, f);
    if (res.status === 429) throw new RecoveryError('rate');
    if (!res.ok) throw new RecoveryError(res.status >= 500 ? 'server' : 'invalid');
}

/**
 * קובע סיסמה חדשה עם הקוד מהמייל ומחזיר JWT - המשתמש נכנס מיד.
 * @param {string} code
 * @param {string} password
 * @param {typeof fetch} f
 * @returns {Promise<string>}
 */
export async function confirmPasswordReset(code, password, f = fetch) {
    const res = await post(
        'auth/reset-password',
        { code, password, passwordConfirmation: password },
        f,
    );
    if (res.status === 429) throw new RecoveryError('rate');
    if (res.status >= 500) throw new RecoveryError('server');
    if (!res.ok) throw new RecoveryError('invalid');
    const data = await res.json().catch(() => ({}));
    if (!data?.jwt) throw new RecoveryError('server', 'Strapi לא החזיר JWT');
    return data.jwt;
}
