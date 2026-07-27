// ============================================================
// adPlans.js — מסלולי הפרסום באתר: תקופה + מחיר, בתשלום מראש.
// מקור אמת יחיד: הבילדר (/advertise/builder/landing), ה-API
// (/api/ads/submit), מאגר המודעות ומסך האישור (/admin/ads) —
// כולם נגזרים מהרשימה הזו, כדי שלא יהיו שני מחירונים.
// שינוי מחיר/תקופה נעשה כאן בלבד.
// זהה לרשימה שבשאר אתרי הרשת (הגמ"ח הארצי, בעלי המקצוע).
// ============================================================

/**
 * @typedef {Object} AdPlan
 * @property {number} days   אורך הפרסום בימים — גם המפתח שנשמר ב-Strapi
 * @property {string} label  תווית קצרה לכפתור/לרשימה
 * @property {string} title  הניסוח המלא, כמו בשורת המחירון
 * @property {number} price  מחיר בשקלים — תשלום מראש לכל התקופה
 */

/** @type {AdPlan[]} */
export const adPlans = [
    { days: 7,   label: 'שבוע',    title: 'פרסום לשבוע',    price: 50 },
    { days: 30,  label: '30 יום',  title: 'פרסום ל-30 יום', price: 130 },
    { days: 90,  label: 'רבעון',   title: 'פרסום לרבעון',   price: 350 },
    { days: 180, label: 'חצי שנה', title: 'פרסום לחצי שנה', price: 600 },
    { days: 365, label: 'שנה',     title: 'פרסום לכל השנה', price: 1000 },
];

/** ברירת המחדל — המסלול החודשי */
export const DEFAULT_PLAN_DAYS = 30;

/** כל ערך שמגיע מבחוץ (דפדפן/Strapi/טופס) מצומצם לאחד המסלולים
 *  @param {unknown} value @returns {number} */
export function normalizePlanDays(value) {
    const days = Number(value);
    return adPlans.some((p) => p.days === days) ? days : DEFAULT_PLAN_DAYS;
}

/** @param {unknown} value @returns {AdPlan} */
export function planFor(value) {
    const days = normalizePlanDays(value);
    return /** @type {AdPlan} */ (adPlans.find((p) => p.days === days));
}

/** "חצי שנה" @param {unknown} value @returns {string} */
export const planLabel = (value) => planFor(value).label;

/** "חצי שנה — 600 ₪" @param {unknown} value @returns {string} */
export const planLabelWithPrice = (value) => {
    const p = planFor(value);
    return `${p.label} — ${p.price} ₪`;
};
