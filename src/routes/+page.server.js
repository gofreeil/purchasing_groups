const DASHBOARD_SHEET_ID = "1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0";
const DASHBOARD_GID = "0";

// ערכי ברירת מחדל אם טעינת הגיליון נכשלת
const DEFAULT_CAMPAIGNS = {
    cellular: { monthly: 465, annual: 79854 },
    fuel: { monthly: 570, annual: 6840 },
    diesel: { monthly: 0, annual: 0 },
};
const DEFAULT_MEMBERS = 960;

// פענוח CSV עמיד: עוטף-מירכאות, פסיקים בתוך תאים, ושורות עם CR
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
    monthly: ["monthly", "חודשי", "חיסכון חודשי"],
    annual: ["annual", "yearly", "שנתי", "חיסכון שנתי"],
    members: ["members", "חברים", "מספר חברים"],
};

// מאתר את שורת הכותרות ומחזיר מיפוי {campaign, monthly, annual, members} → index
function findHeaders(rows) {
    for (let r = 0; r < rows.length; r++) {
        const norm = rows[r].map((c) => (c || "").trim().toLowerCase());
        const idx = {};
        for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
            const i = norm.findIndex((c) => aliases.includes(c));
            if (i >= 0) idx[key] = i;
        }
        if (idx.campaign !== undefined && (idx.monthly !== undefined || idx.annual !== undefined || idx.members !== undefined)) {
            return { headerRow: r, idx };
        }
    }
    return null;
}

const toInt = (v) => {
    const n = parseInt((v || "").replace(/[^\d-]/g, ""));
    return isNaN(n) ? 0 : n;
};
const toNum = (v) => {
    const n = parseFloat((v || "").replace(/[^\d.-]/g, ""));
    return isNaN(n) ? 0 : Math.round(n);
};

export async function load({ fetch }) {
    const campaigns = structuredClone(DEFAULT_CAMPAIGNS);
    let members = DEFAULT_MEMBERS;

    try {
        const url = `https://docs.google.com/spreadsheets/d/${DASHBOARD_SHEET_ID}/export?format=csv&gid=${DASHBOARD_GID}`;
        const response = await fetch(url);
        if (response.ok) {
            const rows = parseCsv(await response.text());
            const header = findHeaders(rows);
            if (header) {
                const { headerRow, idx } = header;
                for (let r = headerRow + 1; r < rows.length; r++) {
                    const row = rows[r];
                    const name = (row[idx.campaign] || "").trim().toLowerCase();
                    if (!name) continue;

                    if (name === "total") {
                        if (idx.members !== undefined) {
                            const v = toInt(row[idx.members]);
                            if (v > 0) members = v;
                        }
                        continue;
                    }

                    const monthly = idx.monthly !== undefined ? toNum(row[idx.monthly]) : 0;
                    const annual = idx.annual !== undefined ? toNum(row[idx.annual]) : 0;
                    if (monthly > 0 || annual > 0) {
                        campaigns[name] = { monthly, annual };
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to load dashboard sheet:", error);
    }

    return { campaigns, members };
}
