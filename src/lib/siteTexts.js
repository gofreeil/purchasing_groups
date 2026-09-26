// ============================================================
// siteTexts.js — עריכת כיתובי האתר מהפאנל (סופר-אדמין).
//
// אותו דפוס כמו העסקאות (campaignsStore): הטקסטים שב-i18n.js הם מקור
// האמת והרשת-ביטחון, והפאנל שומר רק *דריסות* לפי נתיב, למשל
// "homepage.membersCount" או "homepage.features.0.text". מה שלא נערך
// נשאר מהקוד, ואם Strapi לא זמין האתר מציג את הקוד כרגיל.
//
// הקובץ נטען גם בדפדפן — אסור לייבא לכאן מודולי $lib/server.
// ============================================================

/** כותרות המקטעים במסך העריכה, לפי המפתח העליון ב-i18n. */
export const TEXT_SECTIONS = {
    '': 'כללי',
    sidebar: 'טור צד',
    homepage: 'דף הבית',
    footer: 'תחתית ומדיניות פרטיות',
    purchases: 'רכישות',
    satisfaction: 'סקר שביעות רצון',
    details: 'דף העסקה',
};

/**
 * כל הטקסטים באובייקט, כרשימת { path, value }.
 * @param {any} obj
 * @param {string} [prefix]
 * @returns {{ path: string, value: string }[]}
 */
export function flattenTexts(obj, prefix = '') {
    /** @type {{ path: string, value: string }[]} */
    const out = [];
    for (const [key, value] of Object.entries(obj ?? {})) {
        const path = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'string') out.push({ path, value });
        else if (value && typeof value === 'object') out.push(...flattenTexts(value, path));
    }
    return out;
}

/**
 * עותק של האובייקט עם הדריסות. נתיב שלא קיים בקוד מדולג - כך דריסה ישנה
 * של טקסט שהוסר מהקוד לא יוצרת מפתחות רפאים.
 * @param {any} base
 * @param {Record<string, string> | null | undefined} overrides
 */
export function applyTextOverrides(base, overrides) {
    const entries = Object.entries(overrides ?? {});
    if (!entries.length) return base;
    const out = structuredClone(base);
    for (const [path, value] of entries) {
        if (typeof value !== 'string') continue;
        const keys = path.split('.');
        const last = /** @type {string} */ (keys.pop());
        let node = out;
        for (const k of keys) {
            node = node?.[k];
            if (!node || typeof node !== 'object') break;
        }
        if (node && typeof node === 'object' && typeof node[last] === 'string') node[last] = value;
    }
    return out;
}
