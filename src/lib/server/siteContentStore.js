// ============================================================
// siteContentStore.js — כיתובי האתר ומונה החברים, כפי שנערכו בפאנל.
//
// איפה זה נשמר: רשומה אחת ב-pg-campaigns עם slug שמור (site-texts),
// בשדה ה-json benefits: { texts: { "<נתיב>": "<טקסט>" }, members }.
// למה שם ולא collection חדש: ל-pg-campaigns כבר יש הרשאות כתיבה לצוות
// ופרסום אוטומטי אחרי שמירה, כך שלא נדרש שינוי ופריסה של הבאקאנד.
// הרשומה לא נוגעת בעסקאות: המיזוג ב-campaignsStore עובר רק על ה-slugs
// שב-campaigns.js, וה-edited_fields שלה ריק.
// ============================================================

import { env } from '$env/dynamic/private';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 3000;
const SLUG = 'site-texts';

// מונה החברים בדף הבית כשלא נערך בפאנל. לעדכון: מסך "כיתובי האתר" בפאנל.
export const DEFAULT_MEMBERS = 2004;

// נקרא בכל טעינת דף (מה-layout) - TTL קצר, ואיפוס מיידי אחרי שמירה.
const TTL_MS = 60_000;

/**
 * @typedef {{ documentId: string | null, texts: Record<string, string>, members: number | null }} SiteContent
 */

/** @type {{ at: number, value: SiteContent } | null} */
let cache = null;

/** @type {SiteContent} */
const EMPTY = { documentId: null, texts: {}, members: null };

/**
 * הכיתובים והמונה שנערכו. בכשל - האחרונים שהצליחו, או ריק (= תוכן הקוד).
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {Promise<SiteContent>}
 */
export async function getSiteContent({ fetch: f = fetch } = {}) {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
    try {
        const res = await f(`${STRAPI_URL}/api/pg-campaigns?filters[slug][$eq]=${SLUG}`, {
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Strapi responded ${res.status}`);
        const json = await res.json();
        const row = json?.data?.[0];
        const stored = row?.benefits ?? {};
        const members = Number(stored.members);
        /** @type {SiteContent} */
        const value = {
            documentId: row?.documentId ?? null,
            texts: stored.texts && typeof stored.texts === 'object' ? stored.texts : {},
            members: Number.isFinite(members) && members > 0 ? Math.round(members) : null,
        };
        cache = { at: Date.now(), value };
        return value;
    } catch (err) {
        console.warn('siteContentStore: loading failed', err instanceof Error ? err.message : err);
        return cache?.value ?? EMPTY;
    }
}

/**
 * שמירת הכיתובים והמונה. texts מכיל רק את מה ששונה מהקוד; members null =
 * חזרה לברירת המחדל שבקוד.
 * @param {{ texts: Record<string, string>, members: number | null }} content
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function saveSiteContent({ texts, members }, { fetch: f = fetch, jwt = '' } = {}) {
    // קריאה טרייה ולא מהמטמון - כדי לא ליצור רשומה כפולה
    cache = null;
    const existing = await getSiteContent({ fetch: f });

    /** @type {Record<string, string>} */
    const headers = { 'Content-Type': 'application/json' };
    if (jwt) headers['Authorization'] = `Bearer ${jwt}`;

    const data = {
        slug: SLUG,
        title: 'כיתובי האתר (נערך בפאנל)',
        status: 'inactive',
        edited_fields: [],
        benefits: { texts, members },
    };

    const url = existing.documentId
        ? `${STRAPI_URL}/api/pg-campaigns/${existing.documentId}`
        : `${STRAPI_URL}/api/pg-campaigns`;

    const res = await f(url, {
        method: existing.documentId ? 'PUT' : 'POST',
        headers,
        body: JSON.stringify({ data }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Strapi ${res.status}: ${txt.slice(0, 200)}`);
    }
    cache = null;
}
