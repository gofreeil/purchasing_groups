// ============================================================
// campaignsStore.js — תוכן העסקאות: ברירת מחדל בקוד + עריכה מהפאנל.
//
// למה שכבת "דריסה" ולא פשוט לקרוא הכל מ-Strapi:
// תוכן הקמפיינים הועבר בכוונה אל תוך campaigns.js אחרי ש-Strapi נפל
// והעלים את טבלת המסלולים מהאתר (ראו ההערה בראש campaigns.js). לחזור
// לקריאה ישירה משם היה מחזיר בדיוק את התקלה הזו.
//
// לכן: campaigns.js נשאר מקור האמת והרשת-ביטחון, ו-Strapi מחזיק רק את
// השדות שהאדמין ערך בפועל. המיזוג הוא שדה-שדה - שדה שלא נערך נשאר מהקוד.
// אם Strapi לא זמין, הדריסות פשוט לא נטענות והאתר מציג את תוכן הקוד.
// ============================================================

import { env } from '$env/dynamic/private';
import { CAMPAIGNS, getCampaign, getCampaignList } from '$lib/campaigns.js';
import { EDITABLE_FIELDS, isEmptyValue } from '$lib/campaignFields.js';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 3000;

// הדריסות נקראות בכל טעינת דף בית ודף עסקה. TTL קצר מספיק כדי שעריכה
// תיראה כמעט מיד, ומונע קריאה ל-Strapi על כל צפייה.
const TTL_MS = 60_000;

/** @type {{ at: number, bySlug: Map<string, any> } | null} */
let cache = null;

/** מאפס את המטמון אחרי שמירה, כדי שהעריכה תיראה מיד ולא בעוד דקה. */
export function invalidateCampaignsCache() {
    cache = null;
}

/**
 * רשומות הדריסה מ-Strapi, לפי slug. בכשל - מחזירה את האחרונות שהצליחו,
 * ואם מעולם לא הצלחנו, מפה ריקה (כלומר: תוכן הקוד בלבד).
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {Promise<Map<string, any>>}
 */
async function fetchOverrides({ fetch: f = fetch } = {}) {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.bySlug;
    try {
        const res = await f(`${STRAPI_URL}/api/pg-campaigns?pagination[pageSize]=100`, {
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Strapi responded ${res.status}`);
        const json = await res.json();
        /** @type {Map<string, any>} */
        const bySlug = new Map();
        for (const row of json?.data ?? []) {
            if (row?.slug) bySlug.set(String(row.slug), row);
        }
        cache = { at: Date.now(), bySlug };
        return bySlug;
    } catch (err) {
        console.warn('campaignsStore: loading overrides failed', err instanceof Error ? err.message : err);
        return cache?.bySlug ?? new Map();
    }
}

/**
 * אילו שדות ברשומת Strapi הם באמת עריכה מהפאנל.
 *
 * חובה שתהיה רשימה מפורשת ולא "כל שדה שיש בו ערך": ב-collection כבר
 * יושב seed מיוני 2026 שנוצר לפני שהתוכן עבר לקוד, והוא חולק על הקוד -
 * למשל carInsurance מסומן שם status:"soon" בעוד שבקוד הוא active עם
 * can_join. מיזוג לפי "יש ערך" היה מוריד עסקה פעילה ל"בקרוב" באתר, ומחזיר
 * טבלאות מסלולים ישנות. רשומה בלי edited_fields (כלומר כל ה-seed) נחשבת
 * ריקה לגמרי, ולכן היא לא משפיעה על כלום.
 *
 * @param {any} override
 * @returns {string[]}
 */
function editedKeysOf(override) {
    const raw = override?.edited_fields;
    if (!Array.isArray(raw)) return [];
    const valid = new Set(EDITABLE_FIELDS.map((f) => f.key));
    return raw.filter((k) => valid.has(k) && !isEmptyValue(override[k]));
}

/**
 * מיזוג שדה-שדה: רק שדה שנערך בפאנל גובר על הקוד.
 * @param {any} base קמפיין מ-campaigns.js
 * @param {any} override רשומת Strapi (או undefined)
 */
function merge(base, override) {
    const keys = editedKeysOf(override);
    if (!keys.length) return base;
    const out = { ...base };
    for (const key of keys) out[key] = override[key];
    return out;
}

/**
 * רשימת העסקאות לאתר - תוכן הקוד עם הדריסות מהפאנל.
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getMergedCampaignList({ fetch: f = fetch } = {}) {
    const overrides = await fetchOverrides({ fetch: f });
    if (!overrides.size) return getCampaignList();
    return getCampaignList()
        .map((c) => merge(c, overrides.get(c.slug)))
        .sort((a, b) => a.order - b.order);
}

/**
 * עסקה אחת לאתר - תוכן הקוד עם הדריסות מהפאנל.
 * @param {string | null | undefined} slug
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getMergedCampaign(slug, { fetch: f = fetch } = {}) {
    const base = getCampaign(slug);
    if (!base) return null;
    const overrides = await fetchOverrides({ fetch: f });
    return merge(base, overrides.get(base.slug));
}

/**
 * העסקאות למסך הניהול: התוכן הממוזג, ולצידו אילו שדות נערכו בפאנל
 * (כדי שהמסך יסמן "נערך" ויאפשר איפוס לברירת המחדל).
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function listCampaignsForAdmin({ fetch: f = fetch } = {}) {
    const overrides = await fetchOverrides({ fetch: f });
    return getCampaignList().map((base) => {
        const override = overrides.get(base.slug);
        const editedKeys = editedKeysOf(override);
        return {
            ...merge(base, override),
            documentId: override?.documentId ?? null,
            editedKeys,
            // ברירת המחדל שבקוד - המסך מציג אותה מתחת לשדה שנערך
            defaults: base,
        };
    });
}

/**
 * עסקה אחת למסך העריכה.
 * @param {string} slug
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getCampaignForAdmin(slug, { fetch: f = fetch } = {}) {
    const list = await listCampaignsForAdmin({ fetch: f });
    return list.find((c) => c.slug === slug) ?? null;
}

/**
 * שמירת דריסות לעסקה. שדה שנשלח ריק נמחק מהדריסה וחוזר לערך שבקוד.
 * @param {string} slug
 * @param {Record<string, any>} patch
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function saveCampaignOverride(slug, patch, { fetch: f = fetch, jwt = '' } = {}) {
    if (!CAMPAIGNS[slug]) throw new Error(`עסקה לא מוכרת: ${slug}`);

    const overrides = await fetchOverrides({ fetch: f });
    const existing = overrides.get(slug);

    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    // ערך ריק נשמר כ-null: כך הדריסה נמחקת והשדה חוזר לקוד.
    /** @type {Record<string, any>} */
    const data = { slug, title: patch.title || CAMPAIGNS[slug].title };
    /** @type {string[]} */
    const edited = [];
    // הרחבת הטיפוס מאפשרת גישה לפי מפתח דינמי (field.key) בלולאה למטה
    const base = /** @type {Record<string, any>} */ (CAMPAIGNS[slug]);
    for (const field of EDITABLE_FIELDS) {
        if (!(field.key in patch)) continue;
        const value = patch[field.key];
        data[field.key] = isEmptyValue(value) ? null : value;
        // רק שדה שבאמת שונה מהקוד נרשם כדריסה. ערך זהה לקוד לא מוסיף
        // כלום, ולעומת זאת הוא היה מקפיא את הערך: תיקון עתידי בקוד לא
        // היה מגיע לאתר כי הדריסה הישנה הייתה גוברת עליו.
        if (!isEmptyValue(value) && JSON.stringify(value) !== JSON.stringify(base[field.key])) {
            edited.push(field.key);
        }
    }
    // הרשימה הזו היא מה שקובע מה נדרס בפועל - ראו editedKeysOf.
    data.edited_fields = edited;

    const url = existing?.documentId
        ? `${STRAPI_URL}/api/pg-campaigns/${existing.documentId}`
        : `${STRAPI_URL}/api/pg-campaigns`;

    const res = await f(url, {
        method: existing?.documentId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Strapi ${res.status}: ${txt.slice(0, 200)}`);
    }
    invalidateCampaignsCache();
    return res.json();
}

/**
 * איפוס העסקה לתוכן שבקוד.
 *
 * מרוקן את edited_fields ולא מוחק את הרשומה: ב-collection יושבות גם
 * רשומות seed ישנות שלא אנחנו יצרנו, ומחיקה שלהן היא פעולה הרסנית
 * ובלתי הפיכה על נתונים שאינם שייכים למסך הזה. ריקון הרשימה משיג את
 * אותה תוצאה - האתר חוזר לתוכן שבקוד - בלי לאבד כלום.
 *
 * @param {string} slug
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function resetCampaignOverride(slug, { fetch: f = fetch, jwt = '' } = {}) {
    const overrides = await fetchOverrides({ fetch: f });
    const existing = overrides.get(slug);
    if (!existing?.documentId) return false;

    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const res = await f(`${STRAPI_URL}/api/pg-campaigns/${existing.documentId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ data: { edited_fields: [] } }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Strapi ${res.status}: ${txt.slice(0, 200)}`);
    }
    invalidateCampaignsCache();
    return true;
}
