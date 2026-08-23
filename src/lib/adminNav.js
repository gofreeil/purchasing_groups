// ============================================================
// adminNav.js — מקור אמת יחיד למסכי פאנל הניהול ולהרשאות שלהם.
// אותו דפוס כמו באינדקס העסקים: חלק מהמסכים הם לשוניות בתוך /admin
// (?tab=...), ולכן לפריט יש גם path וגם tab — הבדיקה מי "פעיל" נשענת
// על שניהם.
//
// שני צרכנים: סרגל הניווט של הפאנל (admin/+layout.svelte), והאריחים
// שבתחתית האזור האישי (/profile#admin) — כדי שרשימת המסכים והגבלות
// התפקיד לא יתפצלו לשני מקומות.
//
// הקובץ נטען גם בדפדפן — אסור לייבא לכאן מודולי $lib/server.
// ============================================================

/**
 * @typedef {Object} AdminNavItem
 * @property {string} href     הקישור המלא (כולל ?tab= אם צריך)
 * @property {string} path     הנתיב בלי query — לבדיקת "פעיל"
 * @property {string} [tab]    ערך ה-tab, למסכים שהם לשונית בתוך /admin
 * @property {string} icon
 * @property {string} label    תווית קצרה — לסרגל הניווט
 * @property {string} title    כותרת מלאה — לאריח באזור האישי
 * @property {string} desc     משפט הסבר — לאריח באזור האישי
 * @property {'pending'|'expiring'|'ads'|'ratings'} [alert] איזה מונה-המתנה שייך למסך
 * @property {'members'} [count] מונה "כמה נתונים יש" (תגית אפורה, לא התראה)
 * @property {boolean} [navOnly] מוצג רק בסרגל הניווט — לא כאריח באזור האישי
 */

/**
 * המסכים שהמשתמש רשאי לראות.
 * @param {boolean} isAdmin
 * @param {boolean} [superAdmin]
 * @returns {AdminNavItem[]}
 */
export function adminNav(isAdmin, superAdmin = false) {
    if (!isAdmin) return [];

    return [
        {
            href: '/admin?tab=pending',
            path: '/admin',
            tab: 'pending',
            icon: '⏳',
            label: 'ממתינים',
            title: 'ממתינים לאישור',
            desc: 'הרשמות חדשות לעסקאות שממתינות לאישור',
            alert: 'pending',
        },
        {
            href: '/admin?tab=members',
            path: '/admin',
            tab: 'members',
            icon: '👥',
            label: 'חברים',
            title: 'ניהול חברים',
            desc: 'מי הצטרף, לאילו עסקאות, ממתי וכמה חסך',
            count: 'members',
        },
        {
            href: '/admin?tab=deals',
            path: '/admin',
            tab: 'deals',
            icon: '🤝',
            label: 'עסקאות',
            title: 'העסקאות הקבוצתיות',
            desc: 'עריכת תוכן העסקאות, וכמה חברים וחיסכון יש בכל אחת',
        },
        {
            href: '/admin?tab=expiring',
            path: '/admin',
            tab: 'expiring',
            icon: '⏰',
            label: 'פקיעות',
            title: 'עסקאות שעומדות לפוג',
            desc: 'למי נגמרת התקופה בקרוב — לפני שהוא נושר',
            alert: 'expiring',
        },
        {
            href: '/admin?tab=ratings',
            path: '/admin',
            tab: 'ratings',
            icon: '⭐',
            label: 'דירוגים',
            title: 'דירוגי שביעות רצון',
            desc: 'מה החברים כתבו על כל עסקה',
            alert: 'ratings',
        },
        {
            href: '/admin/ads',
            path: '/admin/ads',
            icon: '📢',
            label: 'פרסומות',
            title: 'ניהול פרסומות',
            desc: 'אישור מודעות, לוח תפוסה ונתוני מפרסמים',
            alert: 'ads',
        },
        {
            // באזור האישי הנתונים כבר פרוסים בכרטיס החיסכון — אריח מיותר
            href: '/admin/stats',
            path: '/admin/stats',
            icon: '📈',
            label: 'סטטיסטיקה',
            title: 'סטטיסטיקה',
            desc: 'צמיחה, חיסכון מצטבר ופילוח העסקאות',
            navOnly: true,
        },
        ...(superAdmin
            ? [
                  {
                      href: '/admin/admins',
                      path: '/admin/admins',
                      icon: '🔑',
                      label: 'אדמינים',
                      title: 'ניהול אדמינים',
                      desc: 'מינוי אדמינים והסרת הרשאות',
                  },
              ]
            : []),
    ];
}

/** האריחים לאזור האישי — בלי מה שמסומן לניווט בלבד.
 * @param {boolean} isAdmin @param {boolean} [superAdmin] @returns {AdminNavItem[]} */
export function adminTiles(isAdmin, superAdmin = false) {
    return adminNav(isAdmin, superAdmin).filter((item) => !item.navOnly);
}

/**
 * האם פריט הניווט הוא המסך הנוכחי.
 * @param {AdminNavItem} item
 * @param {string} pathname
 * @param {string | null} tab הלשונית הפעילה כרגע (רק כשהמסך הוא /admin)
 */
export function isActiveNav(item, pathname, tab) {
    if (item.tab) return pathname === item.path && (tab || 'pending') === item.tab;
    return pathname === item.path || pathname.startsWith(item.path + '/');
}
