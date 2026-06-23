import { error } from '@sveltejs/kit';
import { fetchCampaignBySlug, fetchSatisfactionResponses } from '$lib/strapi.js';
import { fallbackCampaign } from '$lib/fallback-campaigns.js';

// --- Google Sheet: מספר חברים פעילים פר-קמפיין (שורת "חתמו") ---
const DASHBOARD_SHEET_ID = '1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0';
const DASHBOARD_GID = '0';
const LABEL_COL = 1;
const CAMPAIGN_COLS = { cellular: 4, fuel: 8 };
const DEFAULT_MEMBERS = { cellular: 312, fuel: 198 };

function parseCsv(text) {
    const rows = [];
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

const isMembersRow = (l) => (l || '').trim().includes('חתמו');
const isMonthlySavingsRow = (l) => (l || '').includes('חיסכון') && (l || '').includes('בחודש');
const isAnnualSavingsRow = (l) => (l || '').includes('חיסכון') && (l || '').includes('בשנה');
const toInt = (v) => {
    const n = parseInt((v || '').replace(/[^\d-]/g, ''));
    return isNaN(n) ? 0 : n;
};
const toNum = (v) => {
    const n = parseFloat((v || '').replace(/[^\d.-]/g, ''));
    return isNaN(n) ? 0 : n;
};

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

export async function load({ params, fetch, setHeaders }) {
    // SSR cache: 60s טרי, עד 10 דקות stale-while-revalidate.
    // משמעות - גם אם Strapi נופל ל-10 דקות, ה-CDN של Vercel ימשיך לשרת את הגרסה האחרונה.
    setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=600' });

    let campaign = null;
    try {
        campaign = await fetchCampaignBySlug(params.campaign, { fetch });
    } catch (err) {
        // graceful degradation: אם Strapi נופל - לחזור ל-hardcoded fallback במקום לזרוק 503
        console.error(`Strapi unreachable for "${params.campaign}", using fallback:`, err.message);
        campaign = fallbackCampaign(params.campaign);
    }

    if (!campaign) {
        // ה-slug באמת לא קיים - לא Strapi down
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

    return {
        campaign,
        activeMembers: sheetStats.activeMembers,
        sheetMonthlySavings: sheetStats.monthlySavings,
        sheetAnnualSavings: sheetStats.annualSavings,
        averageRating,
        ratingCount: ratedResponses.length,
        responses,
    };
}
