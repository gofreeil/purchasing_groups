// ============================================================
// freePromo.js - מבצע השקה: פרסום חינם עם קוד בדף התשלום
//
// כבוי לצמיתות: קוד הבעלים עבר לאימות בצד השרת בלבד
// (ADS_OWNER_CODE, ראו $lib/server/adsCode.js) — קוד שנבדק
// בצד הלקוח מופיע בהכרח בקוד המקור הציבורי ולכן אינו סודי.
// הקובץ נשאר כדי לא לשבור ייבוא בדף הפרסום; הקוד עצמו הוסר.
// ============================================================

export const FREE_PROMO = false;

/** ריק — הקוד לא נמצא יותר בקוד הלקוח */
export const FREE_PROMO_CODE_TEXT = '';

export const FREE_PROMO_LABEL = 'מבצע השקה - הפרסום חינם';

/**
 * קוד ההנחה של המבצע - לא מוזרק יותר (FREE_PROMO=false)
 * @type {import('./discountCodes.js').DiscountCode}
 */
export const FREE_PROMO_DISCOUNT = {
    id: 'free-promo',
    label: FREE_PROMO_LABEL,
    code: FREE_PROMO_CODE_TEXT,
    kind: 'free',
    percent: 100,
    active: false,
};
