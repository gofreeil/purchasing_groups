// ============================================================
// campaignFields.js — אילו שדות של עסקה ניתנים לעריכה מהפאנל.
//
// מקור אמת אחד לשלושה צרכנים: טופס העריכה (מה מציגים), השרת (מה מותר
// לקבל מהטופס), ושכבת המיזוג ב-campaignsStore (אילו שדות דורסים את
// הקוד). הרשימה תואמת לשדות של pg-campaign ב-Strapi.
//
// הקובץ נטען גם בדפדפן — אסור לייבא לכאן מודולי $lib/server.
// ============================================================

/**
 * @typedef {Object} CampaignField
 * @property {string} key
 * @property {string} label
 * @property {'text'|'textarea'|'number'|'boolean'|'select'|'url'|'json'} type
 * @property {string} [hint]      משפט הסבר מתחת לשדה
 * @property {string[]} [options] לשדה select
 * @property {string} group       לאיזה מקטע בטופס השדה שייך
 */

/** @type {CampaignField[]} */
export const EDITABLE_FIELDS = [
    // ── כרטיס העסקה בדף הבית ──
    { key: 'title', label: 'כותרת', type: 'text', group: 'basic', hint: 'מה שמופיע על הכרטיס ובראש דף העסקה' },
    { key: 'description', label: 'תיאור קצר', type: 'textarea', group: 'basic', hint: 'שורת המשנה על הכרטיס' },
    { key: 'icon', label: 'אייקון', type: 'text', group: 'basic', hint: 'אימוג׳י בודד, למשל 📱' },
    { key: 'image_url', label: 'תמונת הכרטיס', type: 'text', group: 'basic', hint: 'נתיב מתוך static, למשל /assets/cellular.jpg' },
    { key: 'order', label: 'סדר תצוגה', type: 'number', group: 'basic', hint: 'מספר קטן = מוקדם יותר ברשימה' },

    // ── מצב ──
    {
        key: 'status',
        label: 'מצב העסקה',
        type: 'select',
        options: ['active', 'soon', 'inactive'],
        group: 'state',
        hint: 'active = פעילה באתר · soon = בקרוב · inactive = מוסתרת',
    },
    { key: 'can_join', label: 'אפשר להצטרף', type: 'boolean', group: 'state', hint: 'מציג את כפתור ההצטרפות' },
    { key: 'is_new', label: 'סמן כחדשה', type: 'boolean', group: 'state' },
    { key: 'new_badge_text', label: 'טקסט תגית "חדש"', type: 'text', group: 'state' },

    // ── הצטרפות ──
    { key: 'providers_line', label: 'שורת הספקים', type: 'text', group: 'join', hint: 'למשל: מסלולים בחברת רמי לוי, אקס פון, וויקום' },
    { key: 'join_link', label: 'קישור הצטרפות', type: 'url', group: 'join' },
    { key: 'join_link_diesel', label: 'קישור הצטרפות (סולר)', type: 'url', group: 'join', hint: 'רלוונטי לעסקת הדלק בלבד' },
    { key: 'join_cta_subtitle', label: 'שורת משנה לכפתור', type: 'textarea', group: 'join' },

    // ── תוכן דף העסקה ──
    { key: 'plans_table_note', label: 'הערה מתחת לטבלת המסלולים', type: 'textarea', group: 'content' },
    { key: 'plans_table_diesel_note', label: 'הערה לטבלת הסולר', type: 'textarea', group: 'content' },
    { key: 'rating_companies', label: 'חברות לדירוג', type: 'json', group: 'content', hint: 'מערך שמות, למשל: ["רמי לוי", "אקס פון"]' },
    { key: 'find_section', label: 'מקטע "בדקו בסביבה"', type: 'json', group: 'content' },
    { key: 'benefits', label: 'יתרונות', type: 'json', group: 'content' },
    { key: 'steps_override', label: 'שלבי ההצטרפות', type: 'json', group: 'content' },
    { key: 'faq_override', label: 'שאלות ותשובות', type: 'json', group: 'content' },
    { key: 'plans_table', label: 'טבלת המסלולים', type: 'json', group: 'content' },
    { key: 'plans_table_diesel', label: 'טבלת מסלולי הסולר', type: 'json', group: 'content' },
];

/** מקטעי הטופס, לפי הסדר שבו הם מוצגים. */
export const FIELD_GROUPS = [
    { key: 'basic', title: 'כרטיס העסקה', icon: '🪧' },
    { key: 'state', title: 'מצב ותגיות', icon: '🚦' },
    { key: 'join', title: 'הצטרפות', icon: '🤝' },
    { key: 'content', title: 'תוכן דף העסקה', icon: '📄' },
];

/** @param {string} group */
export const fieldsOf = (group) => EDITABLE_FIELDS.filter((f) => f.group === group);

/** @param {string} key */
export const fieldByKey = (key) => EDITABLE_FIELDS.find((f) => f.key === key);

/**
 * "ריק" לצורך המיזוג: null/undefined/מחרוזת ריקה/מערך ריק/אובייקט ריק.
 * boolean ו-0 אינם ריקים - false ו-0 הם ערכים לגיטימיים שצריכים לדרוס.
 * @param {any} v
 */
export function isEmptyValue(v) {
    if (v === null || v === undefined) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object') return Object.keys(v).length === 0;
    return false;
}

/**
 * המרת ערך מהטופס (הכל מגיע כמחרוזת) לטיפוס של השדה.
 * זורקת שגיאה מובנת כשה-JSON לא תקין, כדי שהמסך יראה אותה ליד השדה.
 * @param {CampaignField} field
 * @param {FormDataEntryValue | null} raw
 */
export function parseFieldValue(field, raw) {
    const str = raw === null ? '' : String(raw);
    switch (field.type) {
        case 'boolean':
            return str === 'on' || str === 'true';
        case 'number': {
            if (str.trim() === '') return null;
            const n = Number(str);
            if (!Number.isFinite(n)) throw new Error(`"${field.label}" חייב להיות מספר`);
            return n;
        }
        case 'json': {
            if (str.trim() === '') return null;
            try {
                return JSON.parse(str);
            } catch {
                throw new Error(`"${field.label}" אינו JSON תקין`);
            }
        }
        default:
            return str.trim();
    }
}

/**
 * ערך לתצוגה בטופס — JSON מוצג מפורמט, שאר הטיפוסים כמחרוזת.
 * @param {CampaignField} field
 * @param {any} value
 */
export function formatFieldValue(field, value) {
    if (value === null || value === undefined) return '';
    if (field.type === 'json') return JSON.stringify(value, null, 2);
    return String(value);
}
