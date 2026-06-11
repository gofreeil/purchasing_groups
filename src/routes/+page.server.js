const DASHBOARD_SHEET_ID = "1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0";
const DASHBOARD_GID = "0";

// ערכי ברירת מחדל אם טעינת הגיליון נכשלת
const DEFAULT_CAMPAIGNS = {
    cellular: { monthly: 465, annual: 79854 },
    fuel: { monthly: 570, annual: 6840 },
    diesel: { monthly: 0, annual: 0 },
};
const DEFAULT_MEMBERS = 960;

// מבנה הגיליון של "סיכום רכישות קבוצתיות":
//   עמודה B (אינדקס 1) = תוויות שורה ("חתמו", "חיסכון ש\"ח בחודש", ...)
//   עמודה E (4) = סלולר "סכ"ה" | עמודה I (8) = דלק "סכ"ה"
//   עמודה G (6) = בנזין | עמודה H (7) = סולר (פירוט בתוך דלק)
const LABEL_COL = 1;
const CAMPAIGN_COLS = {
    cellular: 4,
    fuel: 8,
    diesel: 7, // ספציפית עמודת הסולר בתוך דלק
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

const norm = (v) => (v || "").trim();
const includesAll = (s, ...words) => {
    const t = norm(s);
    return words.every((w) => t.includes(w));
};
const isMonthlyRow = (l) => includesAll(l, "חיסכון") && (l.includes("חודש") || l.includes("חודשי"));
const isAnnualRow = (l) => includesAll(l, "חיסכון") && (l.includes("שנה") || l.includes("שנתי"));
const isMembersRow = (l) => norm(l).includes("חתמו");

const toNum = (v) => {
    const n = parseFloat(norm(v).replace(/[^\d.-]/g, ""));
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
            for (const row of rows) {
                const label = row[LABEL_COL] || "";
                if (!label) continue;

                if (isMonthlyRow(label)) {
                    for (const [name, col] of Object.entries(CAMPAIGN_COLS)) {
                        const v = toNum(row[col]);
                        if (v > 0) campaigns[name] = { ...campaigns[name], monthly: v };
                    }
                } else if (isAnnualRow(label)) {
                    for (const [name, col] of Object.entries(CAMPAIGN_COLS)) {
                        const v = toNum(row[col]);
                        if (v > 0) campaigns[name] = { ...campaigns[name], annual: v };
                    }
                }
            }
        }
    } catch (error) {
        console.error("Failed to load dashboard sheet:", error);
    }

    return { campaigns, members };
}
