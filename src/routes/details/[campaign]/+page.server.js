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

const HEADER_ALIASES = {
    campaign: ["campaign", "קמפיין", "name", "שם"],
    members: ["members", "חברים", "מספר חברים"],
};

function findHeaders(rows) {
    for (let r = 0; r < rows.length; r++) {
        const norm = rows[r].map((c) => (c || "").trim().toLowerCase());
        const idx = {};
        for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
            const i = norm.findIndex((c) => aliases.includes(c));
            if (i >= 0) idx[key] = i;
        }
        if (idx.campaign !== undefined && idx.members !== undefined) {
            return { headerRow: r, idx };
        }
    }
    return null;
}

export async function load({ params, fetch }) {
    if (!CAMPAIGNS.includes(params.campaign)) {
        throw error(404, 'Campaign not found');
    }

    let activeMembers = DEFAULT_MEMBERS[params.campaign] ?? 0;

    try {
        const url = `https://docs.google.com/spreadsheets/d/${DASHBOARD_SHEET_ID}/export?format=csv&gid=${DASHBOARD_GID}`;
        const response = await fetch(url);
        if (response.ok) {
            const rows = parseCsv(await response.text());
            const header = findHeaders(rows);
            if (header) {
                const { headerRow, idx } = header;
                for (let r = headerRow + 1; r < rows.length; r++) {
                    const name = (rows[r][idx.campaign] || "").trim().toLowerCase();
                    if (name === params.campaign.toLowerCase()) {
                        const v = parseInt((rows[r][idx.members] || "").replace(/[^\d]/g, ""));
                        if (!isNaN(v) && v > 0) activeMembers = v;
                        break;
                    }
                }
            }
        }
    } catch (err) {
        console.error("Failed to load members from dashboard sheet:", err);
    }

    return { campaign: params.campaign, activeMembers };
}
