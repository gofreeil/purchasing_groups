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
 * @param {string} path
 * @param {Record<string, string | number | boolean | null | undefined>} [params]
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function strapiGet(path, params = {}, { fetch: f = fetch } = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        search.set(key, String(value));
    }
    const qs = search.toString();
    const url = `${STRAPI_URL}/api/${path}${qs ? `?${qs}` : ''}`;
    const res = await f(url, {
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`Strapi GET ${path} failed: ${res.status} ${res.statusText}`);
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
    if (!res.ok) throw new Error(`Strapi POST ${path} failed: ${res.status} ${res.statusText}`);
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
    if (!res.ok) throw new Error(`Strapi PUT ${path} failed: ${res.status} ${res.statusText}`);
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
