// ============================================================
// siteStats.js — מוני התנועה של האתר: כניסות, צפיות בדפים, לחיצות על
// מבצע ולחיצות על טופס ההצטרפות.
//
// הספירה עצמה יושבת ב-Strapi (content type: pg-site-events) עם שורה
// אחת לכל יום × סוג × מזהה ו-increment אטומי בצד השרת - כך שגם בקשות
// מקבילות לא מאבדות ספירה, ומסך הניהול מקבל סיכום מוכן (כמה GROUP BY)
// במקום למשוך את כל הרשומות.
//
//   trackSiteEvent(kind, slug)  ← רישום אירוע אחד (ציבורי, בלי טוקן)
//   getSiteStats({ jwt })       ← הסיכום למסך הניהול (JWT של אדמין מחובר)
//
// סוגי האירועים מתועדים ב-$lib/track.js (הצד של הדפדפן).
// ============================================================

import { env } from '$env/dynamic/private';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');
const ENDPOINT = `${STRAPI_URL}/api/pg-site-events`;
const REQUEST_TIMEOUT_MS = 3000;

export const EVENT_KINDS = /** @type {const} */ (['visit', 'pageview', 'deal_click', 'join_click']);
/** @typedef {(typeof EVENT_KINDS)[number]} EventKind */

/** @param {unknown} kind @returns {kind is EventKind} */
export function isEventKind(kind) {
    return typeof kind === 'string' && /** @type {readonly string[]} */ (EVENT_KINDS).includes(kind);
}

/**
 * רישום אירוע אחד. כשל כאן לעולם לא מפריע לגלישה - הקורא (api/track)
 * בולע את השגיאה ורושם ללוג בלבד.
 * @param {EventKind} kind
 * @param {string} slug נתיב הדף (pageview) או מזהה העסקה (deal_click / join_click)
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function trackSiteEvent(kind, slug, { fetch: f = fetch } = {}) {
    const res = await f(`${ENDPOINT}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, slug }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`track ${kind} failed: ${res.status}`);
}

/**
 * @typedef {Object} SiteStatsDay
 * @property {string} day YYYY-MM-DD (שעון ישראל)
 * @property {number} visit
 * @property {number} pageview
 * @property {number} deal_click
 * @property {number} join_click
 *
 * @typedef {Object} SiteStatsDeal
 * @property {string} slug
 * @property {number} dealClicks   לחיצות על כרטיס המבצע, מאז ומתמיד
 * @property {number} joinClicks   לחיצות על טופס ההצטרפות, מאז ומתמיד
 * @property {number} dealClicks30 ב-30 הימים האחרונים
 * @property {number} joinClicks30 ב-30 הימים האחרונים
 *
 * @typedef {Object} SiteStats
 * @property {string} today
 * @property {string | null} since היום הראשון שנספר (null = עוד לא נרשם כלום)
 * @property {Record<EventKind, number>} totals מאז ומתמיד
 * @property {SiteStatsDay[]} daily 30 הימים האחרונים, מהישן לחדש, כולל ימים ריקים
 * @property {SiteStatsDeal[]} deals
 * @property {{ path: string, views: number }[]} pages הדפים הנצפים ב-30 יום
 */

// הסיכום נקרא בכל מסך של הפאנל (הפס הקבוע בכותרת) - דקה של מטמון
// חוסכת סבב ל-Strapi על כל מעבר בין לשוניות, ועדיין מרגישה "חי".
const TTL_MS = 60_000;
/** @type {{ at: number, value: SiteStats } | null} */
let cache = null;

/**
 * הסיכום למסכי הניהול. זורק כשאין גישה (למשל כשה-backend עדיין לא נפרס
 * עם ה-content type) - הקוראים מציגים "המונה עדיין לא חובר".
 * @param {{ fetch?: typeof fetch, jwt: string }} opts
 * @returns {Promise<SiteStats>}
 */
export async function getSiteStats({ fetch: f = fetch, jwt }) {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.value;

    const res = await f(`${ENDPOINT}/summary`, {
        headers: { Authorization: `Bearer ${jwt}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`site stats summary failed: ${res.status}`);
    const json = await res.json();
    if (!json?.ok) throw new Error('site stats summary: bad payload');

    /** @type {SiteStats} */
    const value = {
        today: String(json.today ?? ''),
        since: json.since ? String(json.since) : null,
        totals: {
            visit: Number(json.totals?.visit) || 0,
            pageview: Number(json.totals?.pageview) || 0,
            deal_click: Number(json.totals?.deal_click) || 0,
            join_click: Number(json.totals?.join_click) || 0,
        },
        daily: Array.isArray(json.daily) ? json.daily : [],
        deals: Array.isArray(json.deals) ? json.deals : [],
        pages: Array.isArray(json.pages) ? json.pages : [],
    };
    cache = { at: Date.now(), value };
    return value;
}

/**
 * סכום של סוג אירוע ב-N הימים האחרונים (כולל היום), מתוך הסדרה היומית.
 * @param {SiteStats} stats @param {EventKind} kind @param {number} days
 */
export function sumLastDays(stats, kind, days) {
    return stats.daily.slice(-days).reduce((s, d) => s + (Number(d[kind]) || 0), 0);
}

/**
 * הפס הקבוע בכותרת הפאנל - ארבעת המספרים שהמנהל רוצה לראות בכל כניסה.
 * @param {SiteStats} stats
 */
export function siteStatsStrip(stats) {
    return {
        visitsToday: sumLastDays(stats, 'visit', 1),
        visits7: sumLastDays(stats, 'visit', 7),
        visits30: sumLastDays(stats, 'visit', 30),
        dealClicks30: sumLastDays(stats, 'deal_click', 30),
        joinClicks30: sumLastDays(stats, 'join_click', 30),
    };
}
