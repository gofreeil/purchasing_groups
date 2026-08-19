// ============================================================
// adsCode.js — קוד הבעלים לפרסום ללא תשלום, בצד השרת בלבד.
// הקוד עצמו לא נמצא בקוד המקור (המאגר ציבורי!) אלא במשתנה
// הסביבה ADS_OWNER_CODE. הדפדפן שולח את מה שהוקלד, והשרת:
//   1. מאמת מולו (verify-code + בזמן ההגשה עצמה — כך שאי אפשר
//      לזייף payment='code' בבקשה ישירה).
//   2. בכל שימוש בקוד — שולח הודעה לתיבת ההודעות של הבעלים
//      באתר קהילה בשכונה (אוסף messages ב-Strapi המשותף), עם
//      זהות המשתמש שהשתמש בקוד. דורש STRAPI_TOKEN בסביבה
//      (users/messages אינם פתוחים לציבור); נמען: ADS_NOTIFY_EMAIL.
// פורט מ-national-gemach (adsCode.ts).
// ============================================================

import { env } from '$env/dynamic/private';
import { planLabelWithPrice } from '$lib/adPlans.js';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');

// אותה תקרת זמן כמו בשאר הקריאות לשרת: בלעדיה תקיעה של Strapi תופסת את
// בקשת ההגשה עד מגבלת הריצה, והמפרסם מקבל "השליחה נכשלה" אחרי המתנה ארוכה.
const REQUEST_TIMEOUT_MS = 3000;
const SITE_NAME = 'רכישות קבוצתיות';

/** @param {string} v */
function normalize(v) {
    return v.trim().replace(/\s+/g, ' ');
}

/** האם הטקסט שהוקלד הוא קוד הבעלים. אם ADS_OWNER_CODE לא הוגדר — תמיד לא.
 *  @param {unknown} raw */
export function isOwnerCode(raw) {
    const secret = normalize(env.ADS_OWNER_CODE ?? '');
    if (!secret) return false;
    return typeof raw === 'string' && normalize(raw) === secret;
}

/** @param {string} path @param {any} [init] */
async function api(path, init = {}) {
    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    const token = env.STRAPI_TOKEN || '';
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${STRAPI_URL}${path}`, { ...init, headers, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
}

/** מזהה המשתמש (Strapi) של הבעלים — לפי ADS_NOTIFY_EMAIL. */
async function resolveOwnerUserId() {
    const email = (env.ADS_NOTIFY_EMAIL ?? '').trim().toLowerCase();
    if (!email) return null;
    try {
        const res = await api(`/api/users?filters[email][$eq]=${encodeURIComponent(email)}`);
        if (!res.ok) return null;
        // users-permissions מחזיר מערך שטוח (לא { data })
        const users = await res.json();
        return Array.isArray(users) ? (users[0]?.id ?? null) : null;
    } catch {
        return null;
    }
}

/** מזהי כל נמעני ההתראות: הבעלים וגם כל אדמין שמונה (super_admin).
 *  התראה על בקשת פרסום צריכה להגיע לכל מי שמוסמך לאשר אותה, לא רק לאדם אחד.
 *  @returns {Promise<number[]>} */
async function resolveAdminUserIds() {
    /** @type {Set<number>} */
    const ids = new Set();
    const owner = await resolveOwnerUserId();
    if (owner) ids.add(owner);
    try {
        const res = await api('/api/users?filters[app_role][$eq]=super_admin&pagination[limit]=100');
        if (res.ok) {
            const users = await res.json();
            if (Array.isArray(users)) {
                for (const u of users) if (u?.id) ids.add(u.id);
            }
        }
    } catch {
        /* בלי רשימת אדמינים נסתפק בבעלים */
    }
    return [...ids];
}

/** הודעה על *כל* בקשת פרסום חדשה — לא רק על שימוש בקוד. בלי זה פרסומת
 *  נשמרה כ"ממתינה לאישור" בשקט ואיש לא ידע עליה.
 *  @param {{ adTitle: string, durationDays: number, usedOwnerCode: boolean, submitter?: { name?: string | null, email?: string | null } | null }} info */
export async function notifyAdminsNewAd(info) {
    try {
        const receivers = await resolveAdminUserIds();
        if (receivers.length === 0) {
            console.warn('adsCode: no notify recipient resolved — skipping new-ad notification');
            return;
        }
        const who = info.submitter?.email
            ? `${info.submitter.name || 'ללא שם'} (${info.submitter.email})`
            : 'משתמש לא מחובר';
        const content =
            `📢 בקשת פרסום חדשה — ${SITE_NAME}\n` +
            `פרסומת: "${info.adTitle}"\n` +
            `מי שלח: ${who}\n` +
            `תקופה מבוקשת: ${planLabelWithPrice(info.durationDays)}\n` +
            `תשלום: ${info.usedOwnerCode ? 'קוד בעלים' : 'ממתין לתשלום'}\n` +
            `המודעה ממתינה לאישור ב-groups.gofreeil.com/admin/ads`;
        await Promise.all(receivers.map((receiver) =>
            api('/api/messages', {
                method: 'POST',
                body: JSON.stringify({ data: { receiver, content, read: false } }),
            })
        ));
    } catch (err) {
        console.warn('adsCode: new-ad notification failed', err instanceof Error ? err.message : err);
    }
}

/** הודעה לבעלים על שימוש בקוד — לתיבת ההודעות בקהילה בשכונה.
 *  כשל כאן לא מפיל את ההגשה.
 *  @param {{ adTitle: string, durationDays: number, submitter?: { name?: string | null, email?: string | null } | null }} info */
export async function notifyOwnerCodeUse(info) {
    try {
        const receiver = await resolveOwnerUserId();
        if (!receiver) {
            console.warn('adsCode: no notify recipient resolved — skipping owner notification');
            return;
        }
        const who = info.submitter?.email
            ? `${info.submitter.name || 'ללא שם'} (${info.submitter.email})`
            : 'משתמש לא מחובר';
        const content =
            `📢 שימוש בקוד בעלים — ${SITE_NAME}\n` +
            `פרסומת: "${info.adTitle}"\n` +
            `מי השתמש: ${who}\n` +
            `תקופה מבוקשת: ${planLabelWithPrice(info.durationDays)}\n` +
            `המודעה ממתינה לאישור ב-groups.gofreeil.com/admin/ads`;
        const res = await api('/api/messages', {
            method: 'POST',
            body: JSON.stringify({ data: { receiver, content, read: false } }),
        });
        if (!res.ok) console.warn('adsCode: owner notification failed', res.status);
    } catch (err) {
        console.warn('adsCode: owner notification failed', err instanceof Error ? err.message : err);
    }
}
