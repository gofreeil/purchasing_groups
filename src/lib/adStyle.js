// ============================================================
// adStyle.js - העיצוב של כרטיס פרסומת בטור הימני
// ------------------------------------------------------------
// עותק של adStyle.ts מ"קהילה בשכונה". פרסומת שהופצה משם ("פרסם בכל
// האתרים") נושאת את העיצוב שהמפרסם קבע בבילדר שם - מיקום/צורת הלוגו,
// גובה הרצועה האלכסונית, צבע והזזת הכותרת - בתוך landing._adStyle.
// בלי המודול הזה הכרטיס כאן היה תמונה חשופה, שונה ממה שרואים בקהילה.
//
// פרסומת שנבנתה בבילדר של האתר הזה שומרת באותו שדה את מה שנבחר בו
// (localAdStyle) - כולל גודל הכותרת והסלוגן של הדמו החי, שקטנים משל
// קהילה בשכונה. פרסומת ותיקה מהבילדר כאן, מלפני שהשדה נשמר, מקבלת את
// ברירות המחדל שהוא מציג (legacyAdStyle).
// ============================================================

/**
 * @typedef {'square' | 'circle'} LogoShape
 * @typedef {'right' | 'left' | 'cta'} LogoAnchor
 * @typedef {'right' | 'center' | 'left' | 'justify'} SubAlign
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
 *   titleSize: number,
 * }} AdStyle
 */

/** ברירת המחדל של הבילדר: רצועה בגובה 12% מהתמונה */
const DEFAULT_BAND_HEIGHT = 12;
/** הפרש בין שתי פינות הרצועה - מה שנותן לה את השיפוע */
const BAND_SLOPE = 10;
/** גודל הכותרת (rem): בקהילה בשכונה, ובדמו החי של הבילדר כאן */
const COMMUNITY_TITLE_SIZE = 1.15;
const LOCAL_TITLE_SIZE = 0.95;
/** גודל הסלוגן (rem) בדמו החי של הבילדר כאן */
const LOCAL_SUB_SIZE = 0.7;

/** @type {AdStyle} */
const DEFAULT_AD_STYLE = {
    logoShape: 'square',
    logoAnchor: 'right',
    logoX: null,
    logoY: null,
    bandHeight: DEFAULT_BAND_HEIGHT,
    titleOffsetY: 0,
    titleColor: '#ffffff',
    subFontSize: 0.88,
    subLineHeight: 1.3,
    subAlign: 'right',
    // פרסומת מקהילה בשכונה לא נושאת את השדה - הגודל שם קבוע
    titleSize: COMMUNITY_TITLE_SIZE,
};

/** @param {number} v @param {number} lo @param {number} hi */
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** @param {unknown} v @returns {number | null} */
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : null);

/**
 * צבע נכנס ל-style inline ולכן מותר רק hex - לא ביטוי CSS שרירותי
 * @param {unknown} v
 */
function parseColor(v) {
    return typeof v === 'string' && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim())
        ? v.trim()
        : DEFAULT_AD_STYLE.titleColor;
}

/**
 * מנרמל סגנון מקלט לא-בטוח (Strapi). null כשאין סגנון שמור בכלל.
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
        logoX: free ? clamp(x, 0, 100) : null,
        logoY: free ? clamp(y, 0, 100) : null,
        bandHeight: clamp(num(o.bandHeight) ?? DEFAULT_BAND_HEIGHT, 5, 50),
        titleOffsetY: clamp(num(o.titleOffsetY) ?? 0, -20, 60),
        titleColor: parseColor(o.titleColor),
        subFontSize: clamp(num(o.subFontSize) ?? DEFAULT_AD_STYLE.subFontSize, 0.6, 1.5),
        subLineHeight: clamp(num(o.subLineHeight) ?? DEFAULT_AD_STYLE.subLineHeight, 0.9, 2.2),
        subAlign: o.subAlign === 'center' || o.subAlign === 'left' || o.subAlign === 'justify' ? o.subAlign : 'right',
        titleSize: clamp(num(o.titleSize) ?? DEFAULT_AD_STYLE.titleSize, 0.6, 2),
    };
}

/**
 * ברירת המחדל החכמה של הבילדר כאן למיקום הלוגו: כותרת ארוכה (מעל 20
 * תווים) מורידה אותו לפינה שמעל רצועת ה-CTA
 * @param {string} title
 * @returns {LogoAnchor}
 */
export function autoLogoAnchor(title) {
    return (title ?? '').trim().length > 20 ? 'cta' : 'right';
}

/**
 * מה שהבילדר של האתר הזה מציג בדמו החי - נשמר עם הפרסומת ב-landing._adStyle
 * @param {{ logoShape: LogoShape, logoPosition: LogoAnchor, diagHeight: number, titleColor: string, titleOffsetY: number }} b
 * @returns {AdStyle}
 */
export function localAdStyle(b) {
    return {
        ...DEFAULT_AD_STYLE,
        logoShape: b.logoShape,
        logoAnchor: b.logoPosition,
        bandHeight: b.diagHeight,
        titleColor: b.titleColor,
        titleOffsetY: b.titleOffsetY,
        subFontSize: LOCAL_SUB_SIZE,
        titleSize: LOCAL_TITLE_SIZE,
    };
}

/**
 * פרסומת בלי עיצוב שמור - ברירות המחדל של הדמו החי בבילדר כאן:
 * לוגו מרובע במיקום האוטומטי, רצועה של 12% וכותרת לבנה
 * @param {string} title
 * @returns {AdStyle}
 */
export function legacyAdStyle(title) {
    return localAdStyle({
        logoShape: 'square',
        logoPosition: autoLogoAnchor(title),
        diagHeight: DEFAULT_BAND_HEIGHT,
        titleColor: DEFAULT_AD_STYLE.titleColor,
        titleOffsetY: 0,
    });
}

/** @param {AdStyle} style */
function isLogoFree(style) {
    return style.logoX !== null && style.logoY !== null;
}

/**
 * משתני ה-CSS של הכרטיס (רצועה + טיפוגרפיית הכותרת ותת-הכותרת), לשתילה
 * ב-style של כרטיס בודד.
 * @param {AdStyle} style
 */
export function adStyleVars(style) {
    const left = clamp(100 - style.bandHeight, 0, 100);
    const right = Math.max(0, left - BAND_SLOPE);
    return `--diag-top-left:${left}%;--diag-top-right:${right}%;`
        + `--sub-size:${style.subFontSize}rem;--sub-lh:${style.subLineHeight};--sub-align:${style.subAlign};`
        + `--title-size:${style.titleSize}rem;`;
}

/**
 * מחלקת המיקום של הלוגו (promo-logo-free כשהמיקום מגיע מ-style inline)
 * @param {AdStyle} style
 */
export function logoAnchorClass(style) {
    if (isLogoFree(style)) return 'promo-logo-free';
    return `promo-logo-${style.logoAnchor}`;
}

/**
 * מיקום חופשי -> style inline. ריק כשהלוגו על העוגן
 * @param {AdStyle} style
 */
export function logoFreeStyle(style) {
    if (!isLogoFree(style)) return '';
    return `left:${style.logoX}%; top:${style.logoY}%; right:auto; bottom:auto; transform:translate(-50%,-50%);`;
}

/**
 * האם הלוגו יושב בפינה העליונה שליד הכותרת - אז הכותרת מקבלת ריפוד
 * באותו צד, אחרת הלוגו מכסה לה את המילה האחרונה (המשבצת רחבה 144px).
 * @param {AdStyle} style
 * @param {boolean} hasLogo
 * @returns {'right' | 'left' | null}
 */
export function logoCornerSide(style, hasLogo) {
    if (!hasLogo || isLogoFree(style)) return null;
    return style.logoAnchor === 'left' ? 'left' : style.logoAnchor === 'right' ? 'right' : null;
}
