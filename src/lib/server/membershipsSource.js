// ============================================================
// membershipsSource.js — מקור הנתונים של "מי חבר באיזו עסקה".
//
// כרגע אין מאחוריו מאגר: כל הפונקציות מחזירות ריק, ו-SOURCE_CONNECTED
// הוא false. המסכים בודקים את הדגל הזה ומציגים "מקור הנתונים עדיין לא
// חובר" במקום מסך ריק שנראה כאילו אין חברים.
//
// זהו *הקובץ היחיד* שצריך למלא כשמקור האמת יוגדר (גיליון גוגל / Strapi /
// טפסי ההצטרפות). כל שאר המסכים מדברים רק עם הפונקציות שכאן, ולכן החיבור
// לא ייגע בשום קובץ אחר:
//
//   listAllMemberships()        ← כל החברויות (מסכי הניהול)
//   listMembers()               ← החברויות מקובצות לפי אדם
//   listMembershipsForUser(u)   ← החברויות של המשתמש המחובר
//   getPendingCounts()          ← הבועות האדומות בסרגל הניווט
//   setMembershipStatus(id, s)  ← אישור / דחייה / ביטול / החזרה
//   extendMembership(id, m)     ← הארכת תקופה
//
// צורת הרשומה מתועדת ב-$lib/memberships.js (typedef Membership).
// ============================================================

import { expiryState, savedSoFar } from '$lib/memberships.js';

/**
 * האם יש מאחורי המודול מאגר אמיתי. כל עוד false — המסכים אומרים זאת
 * במפורש במקום להציג אפסים כאילו הם נתונים.
 */
export const SOURCE_CONNECTED = false;

/**
 * כל החברויות במערכת, החדשות קודם.
 * @returns {Promise<import('$lib/memberships.js').Membership[]>}
 */
export async function listAllMemberships() {
    return [];
}

/**
 * החברויות מקובצות לפי אדם — הטבלה במסך "חברים".
 */
export async function listMembers() {
    const all = await listAllMemberships();

    /** @type {Map<string, import('$lib/memberships.js').Membership[]>} */
    const byUser = new Map();
    for (const m of all) {
        const list = byUser.get(m.userId);
        if (list) list.push(m);
        else byUser.set(m.userId, [m]);
    }

    return [...byUser.values()]
        .map((memberships) => {
            const first = memberships[0];
            const active = memberships.filter((m) => m.status === 'active');
            return {
                id: first.userId,
                name: first.userName,
                email: first.userEmail,
                phone: first.userPhone ?? '',
                city: first.userCity ?? '',
                memberships,
                activeCount: active.length,
                totalSaved: memberships.reduce((s, m) => s + savedSoFar(m), 0),
                monthlySaving: active.reduce((s, m) => s + m.monthlySaving, 0),
                // תאריך ההצטרפות הראשון — "חבר מאז"
                memberSince: memberships.reduce(
                    (min, m) => (Date.parse(m.joinedAt) < Date.parse(min) ? m.joinedAt : min),
                    first.joinedAt,
                ),
            };
        })
        .sort((a, b) => b.totalSaved - a.totalSaved);
}

/**
 * החברויות של המשתמש המחובר — האזור האישי.
 * @param {{ id?: string | number, email?: string } | null | undefined} user
 * @returns {Promise<import('$lib/memberships.js').Membership[]>}
 */
export async function listMembershipsForUser(user) {
    if (!user?.email) return [];
    const email = user.email.toLowerCase();
    const all = await listAllMemberships();
    return all
        .filter((m) => m.userEmail?.toLowerCase() === email || String(m.userId) === String(user.id))
        .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));
}

/**
 * שינוי סטטוס של חברות (אישור / דחייה / ביטול / החזרה).
 * @param {string} _id
 * @param {import('$lib/memberships.js').Membership['status']} _status
 * @returns {Promise<import('$lib/memberships.js').Membership | null>}
 */
export async function setMembershipStatus(_id, _status) {
    return null;
}

/**
 * הארכת תקופת החברות במספר חודשים.
 * @param {string} _id
 * @param {number} _months
 * @returns {Promise<import('$lib/memberships.js').Membership | null>}
 */
export async function extendMembership(_id, _months) {
    return null;
}

/** מבנה מוני ההמתנה כשאין נתונים — נופלים לזה בכל כשל. */
export function noPendingCounts() {
    return { pending: 0, expiring: 0, ads: 0, ratings: 0, members: 0, total: 0 };
}

/**
 * הבועות האדומות בסרגל הניווט של הפאנל.
 * @param {{ ads?: number, ratings?: number }} [extra] מונים שמגיעים ממקורות אמיתיים
 */
export async function getPendingCounts(extra = {}) {
    const all = await listAllMemberships();
    const pending = all.filter((m) => m.status === 'pending').length;
    const expiring = all.filter((m) => m.status === 'active' && expiryState(m) === 'soon').length;
    const ads = extra.ads ?? 0;
    const ratings = extra.ratings ?? 0;
    return {
        pending,
        expiring,
        ads,
        ratings,
        members: new Set(all.map((m) => m.userId)).size,
        total: pending + expiring + ads + ratings,
    };
}
