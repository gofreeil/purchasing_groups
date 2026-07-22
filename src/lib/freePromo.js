// ============================================================
// freePromo.js - מבצע השקה: פרסום חינם עם קוד בדף התשלום
//
// FREE_PROMO = true  → מוצגת מודעת מבצע בדף הפרסום, והקוד
//                      "יוצאים לחירות" נותן פטור מלא מתשלום.
// FREE_PROMO = false → עצירת המבצע: המודעה נעלמת והקוד מפסיק לעבוד.
//
// לעצירה: לשנות את השורה למטה ל-false, commit + push.
// (הועתק מאתר "קהילה בשכונה" והותאם לקבוצות רכישה)
// ============================================================

export const FREE_PROMO = true;

/** המילים שהמשתמש מקליד בשדה ההנחה כדי לקבל פטור מלא */
export const FREE_PROMO_CODE_TEXT = 'יוצאים לחירות';

export const FREE_PROMO_LABEL = 'מבצע השקה - הפרסום חינם';

/**
 * קוד ההנחה של המבצע - מוזרק לרשימת הקודים בדף הפרסום כש-FREE_PROMO פעיל
 * @type {import('./discountCodes.js').DiscountCode}
 */
export const FREE_PROMO_DISCOUNT = {
    id: 'free-promo',
    label: FREE_PROMO_LABEL,
    code: FREE_PROMO_CODE_TEXT,
    kind: 'free',
    percent: 100,
    active: true,
};
