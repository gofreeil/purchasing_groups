import { error } from '@sveltejs/kit';
import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getMergedCampaign } from '$lib/server/campaignsStore.js';
import { fetchDashboardRows } from '$lib/server/dashboardSheet.js';

// --- Google Sheet: מספר חברים פעילים פר-קמפיין (שורת "חתמו") ---
const LABEL_COL = 1;

// carInsurance = עמודה K בגיליון. כל עוד שורת "חתמו" שם היא 0, בלוק הסטטיסטיקות
// בדף הפרטים נשאר מוסתר (מוצג רק כש-members > 0) — הוא ייפתח מעצמו כשהגיליון יתמלא.
/** @type {Record<string, number | undefined>} */
const CAMPAIGN_COLS = { cellular: 4, fuel: 8, carInsurance: 10 };
/** @type {Record<string, number>} */
const DEFAULT_MEMBERS = { cellular: 312, fuel: 198, carInsurance: 0 };

/** @param {string | null | undefined} l */
const isMembersRow = (l) => (l || '').trim().includes('חתמו');
/** @param {string | null | undefined} l */
const isMonthlySavingsRow = (l) => (l || '').includes('חיסכון') && (l || '').includes('בחודש');
/** @param {string | null | undefined} l */
const isAnnualSavingsRow = (l) => (l || '').includes('חיסכון') && (l || '').includes('בשנה');
/** @param {string | null | undefined} v */
const toInt = (v) => {
    const n = parseInt((v || '').replace(/[^\d-]/g, ''));
    return isNaN(n) ? 0 : n;
};
/** @param {string | null | undefined} v */
const toNum = (v) => {
    const n = parseFloat((v || '').replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
};

/**
 * @param {typeof globalThis.fetch} fetch
 * @param {string} campaignSlug
 */
async function loadSheetStats(fetch, campaignSlug) {
    const out = {
        activeMembers: DEFAULT_MEMBERS[campaignSlug] ?? 0,
        monthlySavings: 0,
        annualSavings: 0,
    };
    const col = CAMPAIGN_COLS[campaignSlug];
    if (col === undefined) return out;
    // השורות מגיעות מ-dashboardSheet: משיכה אחת ל-5 דקות, משותפת עם דף
    // הבית. קודם כל כניסה לדף מבצע משכה את ה-CSV מגוגל מחדש (~שנייה),
    // וה-router של SvelteKit ממתין ל-load לפני שהוא מחליף את הדף - כך
    // שלחיצה על כרטיס בדף הבית נראתה מתה 1.5-2 שניות.
    try {
        const rows = await fetchDashboardRows(fetch);
        for (const row of rows) {
            const label = row[LABEL_COL];
            if (isMembersRow(label)) {
                const v = toInt(row[col]);
                if (v > 0) out.activeMembers = v;
            } else if (isMonthlySavingsRow(label)) {
                out.monthlySavings = Math.round(toNum(row[col]));
            } else if (isAnnualSavingsRow(label)) {
                out.annualSavings = Math.round(toNum(row[col]));
            }
        }
    } catch (err) {
        console.error('Failed to load sheet stats:', err);
    }
    return out;
}

export async function load({ params, fetch }) {
    // אסור קאש ציבורי על ה-HTML: הדף מוטמע עם data.user מה-layout,
    // ו-CDN שישמור אותו יגיש את פרטי המשתמש המחובר לגולשים אחרים.

    // תוכן הקמפיין מגיע מהפרונט (campaigns.js), עם דריסות שנערכו בפאנל
    // הניהול. Strapi שלא זמין פשוט לא מחזיר דריסות - הדף עדיין מלא.
    const campaign = await getMergedCampaign(params.campaign, { fetch });
    if (!campaign) {
        throw error(404, 'Campaign not found');
    }

    const [sheetStats, responses] = await Promise.all([
        loadSheetStats(fetch, params.campaign),
        fetchSatisfactionResponses(params.campaign, { fetch }).catch((err) => {
            console.error('Failed to fetch satisfaction responses:', err.message);
            return [];
        }),
    ]);

    // ממוצע דירוג מחושב מאותן תגובות שכבר נטענו — בלי בקשה נוספת.
    const ratedResponses = responses.filter(r => typeof r.level === 'number' && r.level > 0);
    const averageRating = ratedResponses.length > 0
        ? ratedResponses.reduce((sum, r) => sum + r.level, 0) / ratedResponses.length
        : 0;

    // 3 תגובות מובילות לדף הראשי — מסומנות פין קודם, אחר כך לפי תאריך.
    const sorted = [...responses].sort((a, b) => {
        const ap = a.is_featured ? 1 : 0;
        const bp = b.is_featured ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const ad = new Date(a.createdAt || a.submitted_at || 0).getTime();
        const bd = new Date(b.createdAt || b.submitted_at || 0).getTime();
        return bd - ad;
    });
    const topResponses = sorted.slice(0, 3);

    return {
        campaign,
        activeMembers: sheetStats.activeMembers,
        sheetMonthlySavings: sheetStats.monthlySavings,
        sheetAnnualSavings: sheetStats.annualSavings,
        averageRating,
        ratingCount: ratedResponses.length,
        responses: topResponses,
        totalResponsesCount: responses.length,
    };
}
