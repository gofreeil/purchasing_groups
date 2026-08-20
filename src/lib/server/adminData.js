// עזרי נתונים למסכי הניהול: מה שמגיע ממקורות אמיתיים (פרסומות ודירוגים),
// עם מטמון קצר משלו. הנתונים על החברים והעסקאות מגיעים מ-membershipsSource.

import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getCampaignList } from '$lib/campaigns.js';
import { listAllForAdmin } from '$lib/server/adsStore.js';

const RATINGS_TTL_MS = 60_000;
/** @type {{ at: number, value: any[] } | null} */
let ratingsCache = null;

/**
 * כל דירוגי שביעות הרצון מכל העסקאות, החדשים קודם. הקריאה נשמרת לדקה:
 * גם הבועה בסרגל הניווט וגם לשונית הדירוגים נשענות עליה, וכל מעבר בין
 * מסכי הפאנל היה מייצר סבב קריאות ל-Strapi מחדש.
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getAllRatings({ fetch: f = fetch } = {}) {
    if (ratingsCache && Date.now() - ratingsCache.at < RATINGS_TTL_MS) return ratingsCache.value;

    const campaigns = getCampaignList();
    const lists = await Promise.all(
        campaigns.map((c) => fetchSatisfactionResponses(c.slug, { fetch: f, pageSize: 200 }).catch(() => [])),
    );
    const value = campaigns
        .flatMap((c, i) => lists[i].map((r) => ({ ...r, campaignSlug: r.campaign_slug || c.slug })))
        .sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0));

    ratingsCache = { at: Date.now(), value };
    return value;
}

/** דירוג שעדיין לא קיבל מענה מהצוות — זה מה שסופרת הבועה האדומה.
 * @param {any} r */
export const needsReply = (r) => !r?.admin_reply && !(r?.replies?.length > 0);

/**
 * מוני הפרסומות והדירוגים לסרגל הניווט. כל מקור נכשל בנפרד ומחזיר 0.
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getExternalCounts({ fetch: f = fetch } = {}) {
    const [ads, ratings] = await Promise.all([
        listAllForAdmin({ fetch: f })
            .then((list) => list.filter((/** @type {any} */ a) => a.status === 'pending').length)
            .catch(() => 0),
        getAllRatings({ fetch: f })
            .then((list) => list.filter(needsReply).length)
            .catch(() => 0),
    ]);
    return { ads, ratings };
}
