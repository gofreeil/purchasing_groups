// ============================================================
// superAdminTotp.js — אימות קוד Google Authenticator לעריכת האתר.
//
// עריכת כיתובים מתוך האתר (גלגל השיניים) דורשת, מעבר להתחברות כסופר-
// אדמין, קוד בן 6 ספרות מ-Google Authenticator. כך גם עוגיית התחברות
// שדלפה לא מספיקה כדי לשנות את האתר.
//
// הסוד משותף לכל האתרים של הרשת (משתנה הסביבה SUPER_ADMIN_TOTP_SECRET,
// base32) - רשומה אחת באפליקציה מאמתת בכולם. אחרי קוד נכון נשמרת עוגייה
// חתומה ל-12 שעות, קשורה למשתמש, כדי לא לבקש קוד על כל שמירה.
// ============================================================

import { env } from '$env/dynamic/private';
import { isSuperAdmin } from '$lib/auth.js';

export const TOTP_COOKIE = 'site_edit_2fa';
const COOKIE_TTL_MS = 12 * 60 * 60 * 1000;
const STEP_SECONDS = 30;

// ניסיונות שגויים: 5 לכל 10 דקות למשתמש. בזיכרון השרת - בסביבה serverless
// זה לא הרמטי, אבל 6 ספרות עם חלון של 30 שניות לא נפרצות בכמה ניסיונות.
const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
/** @type {Map<string, { count: number, resetAt: number }>} */
const attempts = new Map();

const secret = () => (env.SUPER_ADMIN_TOTP_SECRET || '').replace(/\s+/g, '').toUpperCase();

/** האם הוגדר סוד בכלל (בלעדיו אין עריכה מהאתר). */
export const totpConfigured = () => secret().length >= 16;

/** @param {string} s */
function base32Decode(s) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = 0;
    let value = 0;
    /** @type {number[]} */
    const out = [];
    for (const ch of s.replace(/=+$/, '')) {
        const idx = alphabet.indexOf(ch);
        if (idx < 0) throw new Error('bad base32');
        value = (value << 5) | idx;
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 0xff);
            bits -= 8;
        }
    }
    return new Uint8Array(out);
}

/**
 * HMAC ב-Web Crypto (זמין בכל סביבת ריצה, בלי תלות ב-Node).
 * @param {'SHA-1' | 'SHA-256'} hash @param {Uint8Array<ArrayBuffer>} key @param {Uint8Array<ArrayBuffer>} data
 */
async function hmac(hash, key, data) {
    const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash }, false, ['sign']);
    return new Uint8Array(await crypto.subtle.sign('HMAC', k, data));
}

/** השוואה בזמן קבוע - לא מדליפה כמה תווים נכונים. @param {string} a @param {string} b */
function safeEqual(a, b) {
    if (a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

const encoder = new TextEncoder();

/** @param {Uint8Array<ArrayBuffer>} key @param {number} counter */
async function hotp(key, counter) {
    const buf = new Uint8Array(8);
    new DataView(buf.buffer).setBigUint64(0, BigInt(counter));
    const h = await hmac('SHA-1', key, buf);
    const offset = h[h.length - 1] & 0xf;
    const code = (new DataView(h.buffer).getUint32(offset) & 0x7fffffff) % 1_000_000;
    return String(code).padStart(6, '0');
}

/**
 * בדיקת קוד מול הסוד, עם סבילות של צעד אחד לכל כיוון (שעון לא מסונכרן).
 * @param {string} code
 */
async function checkCode(code) {
    const clean = String(code ?? '').replace(/\D/g, '');
    if (clean.length !== 6 || !totpConfigured()) return false;
    const key = base32Decode(secret());
    const now = Math.floor(Date.now() / 1000 / STEP_SECONDS);
    for (const drift of [0, -1, 1]) {
        if (safeEqual(await hotp(key, now + drift), clean)) return true;
    }
    return false;
}

/** @param {string} payload */
async function sign(payload) {
    const mac = await hmac('SHA-256', encoder.encode(`site-edit:${secret()}`), encoder.encode(payload));
    return Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * אימות הקוד ושמירת העוגייה.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {string} code
 * @returns {Promise<{ ok: true } | { ok: false, status: number, error: string }>}
 */
export async function verifyTotp(event, code) {
    const user = event.locals.user;
    if (!user || !isSuperAdmin(user)) return { ok: false, status: 403, error: 'אין הרשאה' };
    if (!totpConfigured()) return { ok: false, status: 503, error: 'אימות דו-שלבי לא הוגדר בשרת' };

    const id = String(user.id);
    const now = Date.now();
    const rec = attempts.get(id);
    if (rec && rec.resetAt > now && rec.count >= MAX_ATTEMPTS) {
        return { ok: false, status: 429, error: 'יותר מדי ניסיונות. נסו שוב בעוד כמה דקות' };
    }

    if (!(await checkCode(code))) {
        const next = rec && rec.resetAt > now ? rec : { count: 0, resetAt: now + ATTEMPT_WINDOW_MS };
        next.count += 1;
        attempts.set(id, next);
        return { ok: false, status: 401, error: 'הקוד שגוי' };
    }

    attempts.delete(id);
    const exp = now + COOKIE_TTL_MS;
    const payload = `${id}.${exp}`;
    event.cookies.set(TOTP_COOKIE, `${payload}.${await sign(payload)}`, {
        path: '/',
        httpOnly: true,
        secure: event.url.protocol === 'https:',
        sameSite: 'strict',
        maxAge: COOKIE_TTL_MS / 1000,
    });
    return { ok: true };
}

/**
 * האם המשתמש הנוכחי סופר-אדמין שאימת קוד ב-12 השעות האחרונות.
 * @param {import('@sveltejs/kit').RequestEvent | { locals: App.Locals, cookies: import('@sveltejs/kit').Cookies }} event
 */
export async function isTotpVerified(event) {
    const user = event.locals.user;
    if (!user || !isSuperAdmin(user) || !totpConfigured()) return false;
    const raw = event.cookies.get(TOTP_COOKIE) ?? '';
    const [id, exp, sig] = raw.split('.');
    if (!id || !exp || !sig || id !== String(user.id) || Number(exp) < Date.now()) return false;
    return safeEqual(sig, await sign(`${id}.${exp}`));
}
