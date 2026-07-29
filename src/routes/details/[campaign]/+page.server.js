import { error } from '@sveltejs/kit';
import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getCampaign } from '$lib/campaigns.js';

// --- Google Sheet: מספר חברים פעילים פר-קמפיין (שורת "חתמו") ---
const DASHBOARD_SHEET_ID = '1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0';
const DASHBOARD_GID = '0';
const LABEL_COL = 1;
// carInsurance = עמודה K בגיליון. כל עוד שורת "חתמו" שם היא 0, בלוק הסטטיסטיקות
// בדף הפרטים נשאר מוסתר (מוצג רק כש-members > 0) — הוא ייפתח מעצמו כשהגיליון יתמלא.
/** @type {Record<string, number | undefined>} */
const CAMPAIGN_COLS = { cellular: 4, fuel: 8, carInsurance: 10 };
/** @type {Record<string, number>} */
const DEFAULT_MEMBERS = { cellular: 312, fuel: 198, carInsurance: 0 };

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
    try {
        const url = `https://docs.google.com/spreadsheets/d/${DASHBOARD_SHEET_ID}/export?format=csv&gid=${DASHBOARD_GID}`;
        const response = await fetch(url);
        if (!response.ok) return out;
        const rows = parseCsv(await response.text());
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

    // תוכן הקמפיין מגיע מהפרונט (campaigns.js) - לא תלוי ב-Strapi.
    const campaign = getCampaign(params.campaign);
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
