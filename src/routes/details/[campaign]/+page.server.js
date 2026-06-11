import { error } from '@sveltejs/kit';

const CAMPAIGNS = [
    'cellular',
    'internet',
    'fuel',
    'carInsurance',
    'electricity',
    'coupons'
];

const DASHBOARD_SHEET_ID = "1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0";
const DASHBOARD_GID = "0";

const DEFAULT_MEMBERS = {
    cellular: 312,
    fuel: 198,
};

const LABEL_COL = 1;
const CAMPAIGN_COLS = {
    cellular: 4,
    fuel: 8,
};

function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') { cell += '"'; i++; }
                else inQuotes = false;
            } else cell += ch;
        } else if (ch === '"') {
            inQuotes = true;
        } else if (ch === ",") {
            row.push(cell); cell = "";
        } else if (ch === "\n") {
            row.push(cell); rows.push(row); row = []; cell = "";
        } else if (ch === "\r") {
            // ignore
        } else cell += ch;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    return rows;
}

const isMembersRow = (l) => (l || "").trim().includes("חתמו");
const toInt = (v) => {
    const n = parseInt((v || "").replace(/[^\d-]/g, ""));
    return isNaN(n) ? 0 : n;
};

export async function load({ params, fetch }) {
    if (!CAMPAIGNS.includes(params.campaign)) {
        throw error(404, 'Campaign not found');
    }

    let activeMembers = DEFAULT_MEMBERS[params.campaign] ?? 0;
    const col = CAMPAIGN_COLS[params.campaign];

    if (col !== undefined) {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${DASHBOARD_SHEET_ID}/export?format=csv&gid=${DASHBOARD_GID}`;
            const response = await fetch(url);
            if (response.ok) {
                const rows = parseCsv(await response.text());
                for (const row of rows) {
                    if (isMembersRow(row[LABEL_COL])) {
                        const v = toInt(row[col]);
                        if (v > 0) activeMembers = v;
                        break;
                    }
                }
            }
        } catch (err) {
            console.error("Failed to load members from dashboard sheet:", err);
        }
    }

    return { campaign: params.campaign, activeMembers };
}
