// ============================================================
// adSlots.js - כמה מקומות פרסום ממוספרים יש בטור הפרסומות
// משותף לשרת (הקצאת מספרים ב-adsStore) וללקוח (המשבצות הפנויות
// ב-RightAdBanner ובורר המקום במסך הניהול) - כדי שלא ייווצר פער
// בין המספרים שהמנהל רואה למה שהאתר מציג.
// ============================================================

export const AD_SLOT_COUNT = 16;

// ── צבעי המקומות ─────────────────────────────────────────────
// ארבע משפחות צבע, ארבעה גוונים בכל משפחה. המשפחה נקבעת לפי המיקום
// *בתוך קבוצת התצוגה* (הטור מציג 4 מקומות בכל פעם), ולכן מקומות 1, 5,
// 9 ו-13 חולקים משפחה - כל פרסומת רביעית בגוון דומה, כמו בשאר אתרי הרשת.
//
// קודם היו כאן 16 גוונים שונים לגמרי, וכל סיבוב של הטור החליף את כל
// לוח הצבעים; עכשיו כל קבוצה מציגה את אותן ארבע משפחות, והעין מזהה את
// המקום גם בלי לקרוא את המספר.
//
// המשפחות מוגדרות כ-RGB בסיסי, והגוונים הנגזרים (מסגרת/רקע/טקסט/כפתור)
// מחושבים ממנו - כדי שהכלל "כל רביעית באותה משפחה" יישמר מבנית ולא
// יישבר בעריכה ידנית של טבלה בת 64 ערכים.

/** @type {[number, number, number][][]} */
const FAMILIES = [
    [[249, 115, 22], [245, 158, 11], [251, 146, 60], [217, 119, 6]],   // כתום / ענבר
    [[59, 130, 246], [14, 165, 233], [99, 102, 241], [37, 99, 235]],   // כחול / תכלת
    [[34, 197, 94], [16, 185, 129], [20, 184, 166], [22, 163, 74]],    // ירוק / טורקיז
    [[168, 85, 247], [139, 92, 246], [217, 70, 239], [147, 51, 234]],  // סגול / ויולט
];

/** @param {[number, number, number]} rgb @param {number} alpha */
const rgba = ([r, g, b], alpha) => `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
/** @param {number[]} rgb */
const hex = (rgb) => '#' + rgb.map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
/** @param {[number, number, number]} rgb @param {number} t */
const lighten = ([r, g, b], t) => [r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t];
/** @param {[number, number, number]} rgb @param {number} t */
const darken = ([r, g, b], t) => /** @type {[number, number, number]} */ ([r * (1 - t), g * (1 - t), b * (1 - t)]);

/**
 * צבעי המקום לפי מספרו (1..AD_SLOT_COUNT), במערך באינדקס 0.
 * @type {{ family: number, border: string, bg: string, text: string, btn: string }[]}
 */
export const AD_SLOT_COLORS = Array.from({ length: AD_SLOT_COUNT }, (_, i) => {
    const family = i % FAMILIES.length;
    const shades = FAMILIES[family];
    const base = shades[Math.floor(i / FAMILIES.length) % shades.length];
    return {
        family,
        border: rgba(base, 0.3),
        bg: rgba(darken(base, 0.7), 0.1),
        text: hex(lighten(base, 0.3)),
        btn: hex(darken(base, 0.12)),
    };
});

/**
 * צבעי מקום מספרי. מקום מחוץ לטווח (גלישה מעל 16) מתגלגל חזרה,
 * כדי שתמיד יהיה צבע ולא undefined.
 * @param {number | null | undefined} slot
 */
export function adSlotColor(slot) {
    const n = Number(slot);
    if (!Number.isFinite(n) || n < 1) return AD_SLOT_COLORS[0];
    return AD_SLOT_COLORS[(Math.round(n) - 1) % AD_SLOT_COLORS.length];
}
