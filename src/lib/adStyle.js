// ============================================================
// adStyle.js — העיצוב שהמפרסם קבע בבילדר, נשמר יחד עם המודעה
// ------------------------------------------------------------
// עותק זהה של adStyle.ts מ"קהילה בשכונה" (מקור האמת). פרסומת שהופצה
// משם ("פרסם בכל האתרים") נושאת את העיצוב שנקבע בבילדר שם בתוך
// landing._adStyle, והבילדר כאן שומר באותו שדה בדיוק את אותו מבנה -
// כך שפרסומת נראית אותו דבר בכל אתרי הרשת, ועריכה של פרסומת שהופצה
// לא מאבדת אף פרמטר. אותם ערכים מוחלים בתצוגה החיה בבילדר ובטור הימני.
//
// מודעה ותיקה שנשלחה לפני השדה הזה מקבלת null מ-parseAdStyle, ואז
// legacyAdStyle() משחזר את ההתנהגות שהייתה לה - כמו בקהילה בשכונה.
// ============================================================

/**
 * @typedef {'square' | 'circle'} LogoShape
 * @typedef {'right' | 'left' | 'cta'} LogoAnchor
 * @typedef {'right' | 'center' | 'left' | 'justify'} SubAlign - יישור תת-הכותרת: ימין / מרכז / שמאל / מילוי רוחב
 * @typedef {{
 *   logoShape: LogoShape,
 *   logoAnchor: LogoAnchor,
 *   logoX: number | null,
 *   logoY: number | null,
 *   bandHeight: number,
 *   titleOffsetY: number,
 *   titleColor: string,
 *   subFontSize: number,
 *   subLineHeight: number,
 *   subAlign: SubAlign,
 * }} AdStyle
 * logoShape - ריבוע (פינות מעוגלות) או עיגול מלא
 * logoAnchor - עוגן ברירת המחדל של הלוגו, כשאין לו מיקום חופשי
 * logoX/logoY - מרכז הלוגו באחוזי המשבצת. null בשני הצירים = יושב על העוגן
 * bandHeight - גובה הרצועה האלכסונית באחוזים מגובה התמונה
 * titleOffsetY - הזזה אנכית של הכותרת בפיקסלים
 * titleColor - צבע הכותרת (#rgb / #rrggbb בלבד — הערך נכנס ל-style inline)
 * subFontSize - גודל תת-הכותרת ב-rem
 * subLineHeight - רווח בין שורות תת-הכותרת (יחס, לא יחידה)
 * subAlign - יישור תת-הכותרת
 */

/** ברירת המחדל של הבילדר: רצועה בגובה 12% מהתמונה */
export const DEFAULT_BAND_HEIGHT = 12;
/** הפרש בין שתי פינות הרצועה — מה שנותן לה את השיפוע */
export const BAND_SLOPE = 10;
export const BAND_MIN = 5;
export const BAND_MAX = 50;
export const TITLE_OFFSET_MIN = -20;
export const TITLE_OFFSET_MAX = 60;

/** תת-הכותרת: הערכים שהיו קבועים ב-CSS לפני שהמפרסם קיבל שליטה עליהם */
export const DEFAULT_SUB_FONT_SIZE = 0.88;
export const SUB_FONT_SIZE_MIN = 0.6;
export const SUB_FONT_SIZE_MAX = 1.5;
export const DEFAULT_SUB_LINE_HEIGHT = 1.3;
export const SUB_LINE_HEIGHT_MIN = 0.9;
export const SUB_LINE_HEIGHT_MAX = 2.2;

/** @type {AdStyle} */
export const DEFAULT_AD_STYLE = {
    logoShape: 'square',
    logoAnchor: 'right',
    logoX: null,
    logoY: null,
    bandHeight: DEFAULT_BAND_HEIGHT,
    titleOffsetY: 0,
    titleColor: '#ffffff',
    subFontSize: DEFAULT_SUB_FONT_SIZE,
    subLineHeight: DEFAULT_SUB_LINE_HEIGHT,
    subAlign: 'right',
};

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** @param {unknown} v @returns {number | null} */
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

/**
 * צבע נכנס ל-style inline ולכן מותר רק hex — לא ביטוי CSS שרירותי
 * @param {unknown} v
 */
function parseColor(v) {
    return typeof v === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
        ? v.trim()
        : DEFAULT_AD_STYLE.titleColor;
}

/**
 * מנרמל סגנון מקלט לא-בטוח (Strapi / localStorage / דפדפן).
 * מחזיר null כשאין סגנון שמור בכלל - מודעה שנשלחה לפני השדה הזה.
 * @param {unknown} raw
 * @returns {AdStyle | null}
 */
export function parseAdStyle(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const o = /** @type {Record<string, unknown>} */ (raw);
    const x = num(o.logoX);
    const y = num(o.logoY);
    // מיקום חופשי תקף רק כששני הצירים קיימים - אחרת נופלים לעוגן
    const free = x !== null && y !== null;
    return {
        logoShape: o.logoShape === 'circle' ? 'circle' : 'square',
        logoAnchor: o.logoAnchor === 'left' ? 'left' : o.logoAnchor === 'cta' ? 'cta' : 'right',
        logoX: free ? clamp(/** @type {number} */ (x), 0, 100) : null,
        logoY: free ? clamp(/** @type {number} */ (y), 0, 100) : null,
        bandHeight: clamp(num(o.bandHeight) ?? DEFAULT_BAND_HEIGHT, BAND_MIN, BAND_MAX),
        titleOffsetY: clamp(num(o.titleOffsetY) ?? 0, TITLE_OFFSET_MIN, TITLE_OFFSET_MAX),
        titleColor: parseColor(o.titleColor),
        subFontSize: clamp(num(o.subFontSize) ?? DEFAULT_SUB_FONT_SIZE, SUB_FONT_SIZE_MIN, SUB_FONT_SIZE_MAX),
        subLineHeight: clamp(num(o.subLineHeight) ?? DEFAULT_SUB_LINE_HEIGHT, SUB_LINE_HEIGHT_MIN, SUB_LINE_HEIGHT_MAX),
        subAlign: parseSubAlign(o.subAlign),
    };
}

/**
 * @param {unknown} v
 * @returns {SubAlign}
 */
function parseSubAlign(v) {
    return v === 'center' || v === 'left' || v === 'justify' ? v : 'right';
}

/**
 * הכלל שלפיו נקבע מיקום הלוגו במודעות שנשלחו לפני שהסגנון נשמר:
 * כותרת ארוכה לא משאירה מקום ללוגו בפינה שלידה, ולכן הוא ירד לפינה
 * שמעל רצועת ה-CTA. משמר את מראה המודעות שכבר רצות על האתר.
 * @param {string} title
 * @returns {AdStyle}
 */
export function legacyAdStyle(title) {
    return {
        ...DEFAULT_AD_STYLE,
        logoAnchor: (title ?? '').trim().length > 20 ? 'cta' : 'right',
    };
}

/**
 * האם הלוגו יושב על מיקום חופשי שהמפרסם גרר בעצמו
 * @param {AdStyle} style
 */
export function isLogoFree(style) {
    return style.logoX !== null && style.logoY !== null;
}

/**
 * גובה הרצועה → שתי פינות ה-clip-path (אחוז מלמעלה; קטן יותר = רצועה גבוהה)
 * @param {number} bandHeight
 * @returns {{ left: number, right: number }}
 */
export function bandCorners(bandHeight) {
    const left = clamp(100 - bandHeight, 0, 100);
    return { left, right: Math.max(0, left - BAND_SLOPE) };
}

/**
 * משתני ה-CSS של הכרטיס (רצועה + טיפוגרפיית תת-הכותרת), לשתילה ב-style
 * של כרטיס בודד. אותם משתנים נצרכים ע"י ה-CSS בבילדר ובטור הימני, כדי
 * שהמפרסם יקבל בדיוק את מה שכיוון על המסך.
 * @param {AdStyle} style
 */
export function adStyleVars(style) {
    const { left, right } = bandCorners(style.bandHeight);
    return `--diag-top-left:${left}%;--diag-top-right:${right}%;`
        + `--sub-size:${style.subFontSize}rem;--sub-lh:${style.subLineHeight};--sub-align:${style.subAlign};`;
}

/**
 * מחלקת המיקום של הלוגו (ריק כשהמיקום חופשי ומגיע מ-style inline)
 * @param {AdStyle} style
 * @param {'ad' | 'promo'} prefix
 */
export function logoAnchorClass(style, prefix) {
    if (isLogoFree(style)) return `${prefix}-logo-free`;
    return `${prefix}-logo-${style.logoAnchor}`;
}

/**
 * מיקום חופשי → style inline. ריק כשהלוגו על העוגן
 * @param {AdStyle} style
 */
export function logoFreeStyle(style) {
    if (!isLogoFree(style)) return '';
    return `left:${style.logoX}%; top:${style.logoY}%; right:auto; bottom:auto; transform:translate(-50%,-50%);`;
}

/**
 * האם הלוגו יושב בפינה העליונה שליד הכותרת. במקרה כזה הכותרת מקבלת
 * ריפוד באותו צד, אחרת הלוגו מכסה לה את המילה האחרונה - המשבצת
 * רחבה 144px בלבד. הכלל זהה בבילדר ובאתר כדי שהתצוגה תהיה זהה.
 * @param {AdStyle} style
 * @param {boolean} hasLogo
 * @returns {'right' | 'left' | null}
 */
export function logoCornerSide(style, hasLogo) {
    if (!hasLogo || isLogoFree(style)) return null;
    return style.logoAnchor === 'left' ? 'left' : style.logoAnchor === 'right' ? 'right' : null;
}
