// ═══ גיליון "סיכום רכישות קבוצתיות" — מקור אמת לחברים ולחיסכון ═══
//
// למה המודול הזה קיים:
// דף הבית ודף המבצע שניהם קראו את *אותו* גיליון, כל אחד עם עותק משלו של
// parseCsv ושל מזהה הגיליון, ובלי שום cache. הייצוא של docs.google.com עונה
// דרך הפניה ולוקח כשנייה שלמה בשביל 481 בייט - והשנייה הזו נכנסה ל-load
// בכל צפייה בכל אחד משני הדפים.
//
// בדף המבצע זה לא היה רק "איטי": ה-router של SvelteKit ממתין ל-load לפני
// שהוא מחליף את הדף, ולכן לחיצה על כרטיס מבצע בדף הבית נראתה מתה 1.5-2
// שניות (נמדד בדסקטופ; בנייד סלולרי יותר). זו הייתה התלונה "לא נפתח לי
// שום מבצע" - הגולש לוחץ, לא קורה כלום, והוא מוותר.
//
// עכשיו הגיליון נמשך פעם אחת ונשמר ל-5 דקות, ושני הדפים חולקים את השורות.

const SHEET_ID = '1YGcal1HFy-q4hLJfBF5uml1CMUO4KqZRYnnp6ZneIH0';
const GID = '0';

const TTL_MS = 300_000;
// הגיליון הוא מקור חיצוני לגמרי (Google), ותקיעה שלו לא אמורה להחזיק דף.
const TIMEOUT_MS = 3000;

/** @type {{ at: number, rows: string[][] } | null} */
let cache = null;

/**
 * מפרסר CSV עם תמיכה בשדות מצוטטים (הגיליון מכיל פסיקים בתוך תאים).
 * @param {string} text
 * @returns {string[][]}
 */
export function parseCsv(text) {
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

/**
 * שורות הגיליון, מה-cache אם הוא בתוקף. בכשל מחזירה את השורות האחרונות
 * שהצליחו (ורק אם מעולם לא הצלחנו - מערך ריק, והקוראים נופלים לברירות
 * המחדל שלהם). כך תקלה זמנית אצל גוגל לא משנה מספרים על המסך.
 *
 * @param {typeof globalThis.fetch} fetch
 * @returns {Promise<string[][]>}
 */
export async function fetchDashboardRows(fetch) {
    if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
    try {
        const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
        const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!response.ok) throw new Error(`sheet responded ${response.status}`);
        const rows = parseCsv(await response.text());
        cache = { at: Date.now(), rows };
        return rows;
    } catch (err) {
        console.error('dashboardSheet: fetch failed', err instanceof Error ? err.message : err);
        return cache?.rows ?? [];
    }
}
