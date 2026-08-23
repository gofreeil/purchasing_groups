import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getMergedCampaignList } from '$lib/server/campaignsStore.js';
import { fetchDashboardRows } from '$lib/server/dashboardSheet.js';

// ----- Google Sheet: מקור אמת לנתוני חברים וחיסכון -----
// המבנה (לפי "סיכום רכישות קבוצתיות"):
//   עמודה B (1) = תוויות שורה ("חתמו", "חיסכון ש"ח בחודש", ...)
//   עמודה E (4) = סלולר "סכ"ה" | עמודה I (8) = דלק "סכ"ה" | עמודה G (6) = בנזין | עמודה H (7) = סולר
//   עמודה K (10) = ביטוח רכב (עמודה יחידה, בלי פילוח ספקים)
const LABEL_COL = 1;
// שים לב: diesel (עמודה H) *נספר בכוונה* בנוסף ל-fuel, למרות ש"סכ"ה דלק" כבר כולל אותו.
// זה לא באג — התוספת מייצגת חברה נוספת שאינה מופיעה בגיליון הזה. לא להסיר.
const CAMPAIGN_COLS = { cellular: 4, fuel: 8, diesel: 7, carInsurance: 10 };

/** @type {Record<string, { monthly: number, annual: number }>} */
const DEFAULT_CAMPAIGNS = {
    cellular: { monthly: 465, annual: 79854 },
    fuel: { monthly: 570, annual: 6840 },
    diesel: { monthly: 0, annual: 0 },
    carInsurance: { monthly: 0, annual: 0 },
};
const DEFAULT_MEMBERS = 1078;

/** @param {string | null | undefined} v */
const norm = (v) => (v || '').trim();
/** @param {string | null | undefined} s @param {...string} words */
const includesAll = (s, ...words) => { const t = norm(s); return words.every((w) => t.includes(w)); };
/** @param {string} l */
const isMonthlyRow = (l) => includesAll(l, 'חיסכון') && (l.includes('חודש') || l.includes('חודשי'));
/** @param {string} l */
const isAnnualRow = (l) => includesAll(l, 'חיסכון') && (l.includes('שנה') || l.includes('שנתי'));
/** @param {string | null | undefined} l */
const isMembersRow = (l) => norm(l).includes('חתמו');
/** @param {string | null | undefined} v */
const toNum = (v) => {
    const n = parseFloat(norm(v).replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : Math.round(n);
};

/**
 * ה-cache והנפילה-לערך-האחרון יושבים ב-dashboardSheet, שמשותף עם דף המבצע.
 * כאן נשארה רק הקריאה של העמודות הרלוונטיות לדף הבית.
 * @param {typeof globalThis.fetch} fetch
 */
async function loadSheetData(fetch) {
    const aggregated = structuredClone(DEFAULT_CAMPAIGNS);
    const members = DEFAULT_MEMBERS;
    for (const row of await fetchDashboardRows(fetch)) {
        const label = row[LABEL_COL] || '';
        if (!label) continue;
        if (isMonthlyRow(label)) {
            for (const [name, col] of Object.entries(CAMPAIGN_COLS)) {
                const v = toNum(row[col]);
                if (v > 0) aggregated[name] = { ...aggregated[name], monthly: v };
            }
        } else if (isAnnualRow(label)) {
            for (const [name, col] of Object.entries(CAMPAIGN_COLS)) {
                const v = toNum(row[col]);
                if (v > 0) aggregated[name] = { ...aggregated[name], annual: v };
            }
        }
    }
    return { aggregated, members };
}

// גם הדירוגים נשמרים ל-TTL קצר: אחרי שהגיליון ירד מנתיב הבקשה הם היו
// הרכיב האיטי שנשאר בו. ממוצע כוכבים מתעדכן דקה אחרי שנשלח סקר חדש -
// זה מספיק, ולעומת זאת כל צפייה חסכה 3 קריאות ל-Strapi.
const RATINGS_TTL_MS = 60_000;
/** @type {{ at: number, value: Record<string, { avg: number, count: number }> } | null} */
let ratingsCache = null;

/**
 * @param {string[]} activeSlugs
 * @param {typeof globalThis.fetch} fetch
 */
async function loadAverageRatings(activeSlugs, fetch) {
    if (ratingsCache && Date.now() - ratingsCache.at < RATINGS_TTL_MS) return ratingsCache.value;

    // בקשות מקבילות, רק לקמפיינים פעילים.
    // pageSize: 500 כדי לכלול את *כל* הדירוגים בממוצע (עקבי עם דף /responses).
    const responseLists = await Promise.all(
        activeSlugs.map((slug) =>
            fetchSatisfactionResponses(slug, { fetch, pageSize: 500 }).catch(() => []),
        ),
    );
    /** @type {Record<string, { avg: number, count: number }>} */
    const averageRatings = {};
    activeSlugs.forEach((slug, i) => {
        const rated = responseLists[i].filter((r) => typeof r.level === 'number' && r.level > 0);
        if (rated.length > 0) {
            averageRatings[slug] = {
                avg: rated.reduce((s, r) => s + r.level, 0) / rated.length,
                count: rated.length,
            };
        }
    });
    ratingsCache = { at: Date.now(), value: averageRatings };
    return averageRatings;
}

export async function load({ fetch }) {
    // אסור קאש ציבורי על ה-HTML: הדף מוטמע עם data.user מה-layout,
    // ו-CDN שישמור אותו יגיש את פרטי המשתמש המחובר לגולשים אחרים.

    // תוכן הקמפיינים בפרונט (campaigns.js), עם דריסות שנערכו בפאנל הניהול;
    // רק נתוני החיסכון/חברים דינמיים מ-Google Sheet.
    const finalCampaigns = await getMergedCampaignList({ fetch });

    // ממוצע דירוג פר-קמפיין מתגובות סקר אמיתיות - רק לקמפיינים פעילים.
    const activeSlugs = finalCampaigns.filter((c) => c.status === 'active').map((c) => c.slug);

    // הגיליון והדירוגים לא תלויים זה בזה. קודם הם רצו בטור, וה-TTFB של דף
    // הבית היה סכום שניהם; עכשיו הוא הארוך מבין השניים.
    const [sheet, averageRatings] = await Promise.all([
        loadSheetData(fetch),
        loadAverageRatings(activeSlugs, fetch),
    ]);

    return {
        campaigns: finalCampaigns,
        sheetData: sheet.aggregated,
        members: sheet.members,
        averageRatings,
    };
}
