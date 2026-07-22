// קודי הנחה לדף הפרסום - גרסה פשוטה ומקומית (ללא Strapi).
// הועתק מאתר "קהילה בשכונה" והותאם: אין רכזים ואין שכונות - רק קודים כלליים.

/**
 * @typedef {Object} DiscountCode
 * @property {string} id
 * @property {string} label   - תווית להצגה (למשל "הנחת בעלים")
 * @property {string} code    - הטקסט שהמשתמש מקליד
 * @property {'percent'|'free'} kind
 * @property {number} percent - אחוז ההנחה (100 = פטור מלא)
 * @property {boolean} active
 */

/** @type {DiscountCode[]} */
export const DEFAULT_DISCOUNT_CODES = [
    {
        id: 'owner',
        label: 'הנחת בעלים',
        code: 'הנחת בעלים',
        kind: 'percent',
        percent: 20,
        active: true,
    },
    {
        id: 'free',
        label: 'פטור מלא',
        code: "לה' הארץ ומלואה",
        kind: 'free',
        percent: 100,
        active: true,
    },
];

// נירמול סלחני: מסיר גרשיים/גרש, מכווץ רווחים, אותיות קטנות -
// כדי שהקלדה עם או בלי סימני פיסוק תתקבל.
/** @param {string} s */
export function normalizeCode(s) {
    return (s || '')
        .replace(/["'׳״`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
}

/**
 * בודק אם הקלט תואם לאחד הקודים.
 * @param {string} input
 * @param {DiscountCode[]} codes
 * @returns {{ applied: boolean, matched: DiscountCode | null, reason: '' | 'inactive' | 'unknown' }}
 */
export function evaluateDiscount(input, codes) {
    const normalized = normalizeCode(input);
    if (!normalized) return { applied: false, matched: null, reason: '' };
    const found = codes.find((c) => normalizeCode(c.code) === normalized);
    if (!found) return { applied: false, matched: null, reason: 'unknown' };
    if (!found.active) return { applied: false, matched: found, reason: 'inactive' };
    return { applied: true, matched: found, reason: '' };
}

/**
 * סכום ההנחה בש"ח עבור סכום כולל נתון.
 * @param {number} total
 * @param {DiscountCode} matched
 */
export function discountAmount(total, matched) {
    if (matched.kind === 'free') return total;
    return Math.round((total * matched.percent) / 100);
}
