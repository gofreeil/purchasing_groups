/**
 * זיכרון "השארתי פרטים" - עוגיית צד-לקוח לכל קבוצת רכישה.
 * נשתלת כשהגולש לוחץ על טופס ההצטרפות בדף הקבוצה (הטופס עצמו הוא Google Form
 * חיצוני ולכן הלחיצה היא האות הטוב ביותר שיש לנו לכך שהפרטים הושארו).
 * בדף הבית היד המצביעה על הכרטיס הופכת ליד שמסמנת "בוצע" לקבוצות שסומנו.
 * צד-לקוח בלבד: document.cookie - כל הפונקציות בטוחות לקריאה גם ב-SSR (מחזירות ריק).
 */

const PREFIX = 'joined-';
const MAX_AGE = 60 * 60 * 24 * 365; // שנה

/** @param {string} slug */
export function markJoined(slug) {
    if (typeof document === 'undefined' || !slug) return;
    try {
        document.cookie = `${PREFIX}${encodeURIComponent(slug)}=1; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
    } catch {
        /* עוגיות חסומות - מוותרים בשקט */
    }
}

/** @returns {Set<string>} כל ה-slug-ים שסומנו כ"השארתי פרטים" בדפדפן זה */
export function readJoined() {
    /** @type {Set<string>} */
    const out = new Set();
    if (typeof document === 'undefined') return out;
    try {
        for (const part of document.cookie.split(';')) {
            const [k, v] = part.trim().split('=');
            if (k && k.startsWith(PREFIX) && v === '1') out.add(decodeURIComponent(k.slice(PREFIX.length)));
        }
    } catch {
        /* ignore */
    }
    return out;
}
