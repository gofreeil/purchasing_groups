// קליינט פשוט ל-Strapi - בלי תלות בחבילות נוספות.
// משתמש ב-env שמותקן בזמן הריצה (SvelteKit/Vite מטעין אותו על הצד-שרת בלבד).
import { env } from '$env/dynamic/private';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');

// תקרת זמן לכל קריאה ל-Strapi. בלעדיה, תקיעה בצד השני - לא שגיאה, פשוט
// חוסר תגובה - מחזיקה את הבקשה עד מגבלת הריצה של Vercel, והדף מחזיר 500.
// try/catch לא מגן מפני תקיעה, רק מפני שגיאה: בלי signal ה-catch לא נורה
// לעולם. עם signal הבקשה נכשלת מהר ונופלת ל-fallback שכבר קיים בכל קורא.
const REQUEST_TIMEOUT_MS = 3000;

/**
 * שגיאת Strapi עם הסיבה שהשרת החזיר (error.message בגוף התשובה) - כדי שמסכי
 * הניהול יוכלו לומר למשתמש למה פעולה נכשלה, ולא רק "נסו שוב".
 */
export class StrapiError extends Error {
    /**
     * @param {string} method @param {string} path @param {Response} res
     * @param {string} detail
     */
    constructor(method, path, res, detail) {
        super(`Strapi ${method} ${path} failed: ${res.status} ${res.statusText}${detail ? ` - ${detail}` : ''}`);
        this.status = res.status;
        this.detail = detail;
    }
}

/** @param {string} method @param {string} path @param {Response} res */
async function strapiError(method, path, res) {
    let detail = '';
    try {
        const body = await res.text();
        try {
            detail = String(JSON.parse(body)?.error?.message ?? '');
        } catch {
            detail = body.slice(0, 200);
        }
    } catch {
        // גוף שלא נקרא (ניתוק/תקרת זמן) - נשארים עם הסטטוס
    }
    return new StrapiError(method, path, res, detail.trim());
}

/**
 * הסיבה שקריאה ל-Strapi נכשלה, בעברית קצרה - להודעת השגיאה שהמשתמש רואה.
 * @param {unknown} err
 */
export function failReason(err) {
    if (err instanceof StrapiError) {
        const d = err.detail ? ` (${err.detail})` : '';
        if (err.status === 401) return 'החיבור פג - התנתקו והתחברו מחדש';
        if (err.status === 403) return `השרת דחה - אין הרשאה${d}`;
        if (err.status === 404) return 'הרשומה לא נמצאה בשרת';
        if (err.status === 413) return 'הנתונים גדולים מדי לשרת';
        return `שגיאת שרת ${err.status}${d}`;
    }
    if (err instanceof Error) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') return 'השרת לא הגיב בזמן';
        if (err.message === 'fetch failed') return 'אין חיבור לשרת';
        return err.message;
    }
    return String(err);
}

/**
 * @param {string} path
 * @param {Record<string, string | number | boolean | null | undefined>} [params]
 * @param {{ fetch?: typeof fetch, timeoutMs?: number }} [opts] timeoutMs - לשליפות
 *   כבדות בלבד (רשימות פרסומות עם base64, מגה-בייטים): התקרה כוללת גם את
 *   הורדת הגוף, ו-3 שניות חתכו אותן בייצור - והרשימה נפלה בשקט לריקה.
 */
export async function strapiGet(path, params = {}, { fetch: f = fetch, timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        search.set(key, String(value));
    }
    const qs = search.toString();
    const url = `${STRAPI_URL}/api/${path}${qs ? `?${qs}` : ''}`;
    const res = await f(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) throw await strapiError('GET', path, res);
    return res.json();
}

/**
 * @param {string} path
 * @param {unknown} data
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function strapiPost(path, data, { fetch: f = fetch } = {}) {
    const url = `${STRAPI_URL}/api/${path}`;
    const res = await f(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw await strapiError('POST', path, res);
    return res.json();
}

// עדכון רשומה קיימת (משמש את מסך אישור הפרסומות של האדמין).
/**
 * @param {string} path
 * @param {unknown} data
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function strapiPut(path, data, { fetch: f = fetch, jwt = '' } = {}) {
    const url = `${STRAPI_URL}/api/${path}`;
    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;
    const res = await f(url, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw await strapiError('PUT', path, res);
    return res.json();
}

// תוכן הקמפיינים עבר לפרונט (campaigns.js) - Strapi משמש כאן רק לתגובות שביעות-רצון.
/**
 * @typedef {Object} SatisfactionReply
 * @property {string} text
 * @property {string} [user_name]
 * @property {boolean} [is_admin]
 * @property {string} created_at
 */

/**
 * תגובת שביעות-רצון כפי שהיא מוחזרת מ-Strapi.
 * @typedef {Object} SatisfactionResponse
 * @property {number} [id]
 * @property {string} documentId
 * @property {string} [campaign_slug]
 * @property {number} level
 * @property {string | null} [company]
 * @property {string} [comments]
 * @property {string} [user_name]
 * @property {string} [user_city]
 * @property {string} [admin_reply]
 * @property {boolean} [admin_liked]
 * @property {boolean} [is_featured]
 * @property {string} createdAt
 * @property {string} submitted_at
 * @property {number} [likes]
 * @property {(string | number)[]} [liked_by]
 * @property {SatisfactionReply[]} [replies]
 */

/**
 * @param {string} campaignSlug
 * @param {{ fetch?: typeof fetch, pageSize?: number }} [opts]
 * @returns {Promise<SatisfactionResponse[]>}
 */
export async function fetchSatisfactionResponses(campaignSlug, { fetch: f = fetch, pageSize = 50 } = {}) {
    const data = await strapiGet('pg-satisfaction-responses', {
        'filters[campaign_slug][$eq]': campaignSlug,
        sort: 'createdAt:desc',
        'pagination[pageSize]': pageSize,
    }, { fetch: f });
    return data?.data ?? [];
}
