import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getCampaignList } from '$lib/campaigns.js';

// ----- Google Sheet: מקור אמת לנתוני חברים וחיסכון -----
// המבנה (לפי "סיכום רכישות קבוצתיות"):
//   עמודה B (1) = תוויות שורה ("חתמו", "חיסכון ש"ח בחודש", ...)
//   עמודה E (4) = סלולר "סכ"ה" | עמודה I (8) = דלק "סכ"ה" | עמודה G (6) = בנזין | עמודה H (7) = סולר
//   עמודה K (10) = ביטוח רכב (עמודה יחידה, בלי פילוח ספקים)
const DASHBOARD_SHEET_ID = '1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0';
const DASHBOARD_GID = '0';
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
const DEFAULT_MEMBERS = 1070;

/**
 * @param {string} text
 * @returns {string[][]}
 */
function parseCsv(text) {
    /** @type {string[][]} */
    const rows = [];
    /** @type {string[]} */
    let row = [];
    let cell = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { cell += '"'; i++; }
                else inQuotes = false;
            } else cell += ch;
        } else if (ch === '"') inQuotes = true;
        else if (ch === ',') { row.push(cell); cell = ''; }
        else if (ch === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; }
        else if (ch === '\r') { /* ignore */ }
        else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
}

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

/** @param {typeof globalThis.fetch} fetch */
async function loadSheetData(fetch) {
    const aggregated = structuredClone(DEFAULT_CAMPAIGNS);
    let members = DEFAULT_MEMBERS;
    try {
        const url = `https://docs.google.com/spreadsheets/d/${DASHBOARD_SHEET_ID}/export?format=csv&gid=${DASHBOARD_GID}`;
        const response = await fetch(url);
        if (response.ok) {
            const rows = parseCsv(await response.text());
            for (const row of rows) {
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
        }
    } catch (error) {
        console.error('Failed to load dashboard sheet:', error);
    }
    return { aggregated, members };
}

export async function load({ fetch }) {
    // אסור קאש ציבורי על ה-HTML: הדף מוטמע עם data.user מה-layout,
    // ו-CDN שישמור אותו יגיש את פרטי המשתמש המחובר לגולשים אחרים.

    // תוכן הקמפיינים בפרונט (campaigns.js); רק נתוני החיסכון/חברים דינמיים מ-Google Sheet.
    const finalCampaigns = getCampaignList();
    const sheet = await loadSheetData(fetch);

    // ממוצע דירוג פר-קמפיין מתגובות סקר אמיתיות - בקשות מקבילות, רק לקמפיינים פעילים.
    // pageSize: 500 כדי לכלול את *כל* הדירוגים בממוצע (עקבי עם דף /responses).
    const activeSlugs = finalCampaigns.filter((c) => c.status === 'active').map((c) => c.slug);
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

    return {
        campaigns: finalCampaigns,
        sheetData: sheet.aggregated,
        members: sheet.members,
        averageRatings,
    };
}
