// ============================================================
// memberships.js — צורת "החברות של משתמש בעסקה" ומה שנגזר ממנה.
//
// כאן יושבים רק חישובים ותוויות, בלי שום מקור נתונים: גם מסכי הניהול
// וגם האזור האישי נשענים על אותן פונקציות, כדי ש"נשארו 12 ימים" ו-"חסכת
// 1,240 ₪" יראו את אותו מספר בשני המסכים. מקור הנתונים עצמו יושב מאחורי
// $lib/server/membershipsSource.js וניתן להחלפה בלי לגעת כאן.
//
// הקובץ נטען גם בדפדפן — אסור לייבא לכאן מודולי $lib/server.
// ============================================================

/**
 * חברות של משתמש בעסקה קבוצתית אחת.
 * @typedef {Object} Membership
 * @property {string} id
 * @property {string} userId
 * @property {string} userName
 * @property {string} userEmail
 * @property {string} [userPhone]
 * @property {string} [userCity]
 * @property {string} campaignSlug     ה-slug מ-campaigns.js
 * @property {string} [plan]           שם המסלול שנבחר
 * @property {string} [provider]       החברה המספקת
 * @property {'active'|'pending'|'expired'|'cancelled'} status
 * @property {string} joinedAt         ISO — תאריך ההצטרפות
 * @property {string} [expiresAt]      ISO — תאריך התפוגה (ריק = ללא התחייבות)
 * @property {number} monthlySaving    חיסכון חודשי בש"ח
 */

/** תוויות וצבע לכל סטטוס חברות. Record ולא const: המסכים ניגשים לפי
 * מחרוזת שמגיעה מהנתונים, ונופלים לתגית ניטרלית כשהיא לא מוכרת.
 * @type {Record<string, { label: string, tone: string }>} */
export const STATUS_HE = ({
    active: { label: 'פעיל', tone: 'ok' },
    pending: { label: 'ממתין לאישור', tone: 'warn' },
    expired: { label: 'פג תוקף', tone: 'danger' },
    cancelled: { label: 'בוטל', tone: 'muted' },
});

/** כמה ימים לפני התפוגה נחשבים "עומד לפוג" — הבועה האדומה במסך הפקיעות. */
export const EXPIRING_SOON_DAYS = 45;

const DAY_MS = 86_400_000;

/**
 * הפרש בימים בין שני תאריכים (b - a), מעוגל כלפי מטה.
 * @param {string | number | Date} a
 * @param {string | number | Date} b
 */
export function daysBetween(a, b) {
    const from = new Date(a).getTime();
    const to = new Date(b).getTime();
    if (isNaN(from) || isNaN(to)) return 0;
    return Math.floor((to - from) / DAY_MS);
}

/**
 * כמה ימים נשארו עד התפוגה. שלילי = כבר פג. null = בלי תאריך תפוגה.
 * @param {Membership} m
 * @param {number} [now]
 * @returns {number | null}
 */
export function daysLeft(m, now = Date.now()) {
    if (!m.expiresAt) return null;
    return daysBetween(now, m.expiresAt);
}

/**
 * מצב התפוגה לצורך תגיות והתראות.
 * @param {Membership} m
 * @param {number} [now]
 * @returns {'none' | 'expired' | 'soon' | 'ok'}
 */
export function expiryState(m, now = Date.now()) {
    const left = daysLeft(m, now);
    if (left === null) return 'none';
    if (left < 0) return 'expired';
    if (left <= EXPIRING_SOON_DAYS) return 'soon';
    return 'ok';
}

/**
 * כמה חודשים החברות פעילה בפועל — מההצטרפות ועד היום, אך לא מעבר
 * לתאריך התפוגה: אחרי שהמסלול נגמר החיסכון מפסיק להצטבר, ואחרת המספר
 * באזור האישי היה ממשיך לטפס לנצח על עסקה שכבר לא קיימת.
 * @param {Membership} m
 * @param {number} [now]
 */
export function activeMonths(m, now = Date.now()) {
    if (m.status === 'pending') return 0;
    const start = new Date(m.joinedAt).getTime();
    if (isNaN(start)) return 0;
    const endCandidates = [now];
    if (m.expiresAt) {
        const exp = new Date(m.expiresAt).getTime();
        if (!isNaN(exp)) endCandidates.push(exp);
    }
    const end = Math.min(...endCandidates);
    return Math.max(0, (end - start) / DAY_MS / 30.4375);
}

/**
 * כמה המשתמש חסך בעסקה הזו עד היום, בש"ח.
 * @param {Membership} m
 * @param {number} [now]
 */
export function savedSoFar(m, now = Date.now()) {
    return Math.round(activeMonths(m, now) * (m.monthlySaving || 0));
}

/**
 * סיכום כל החברויות של משתמש — הכותרת של האזור האישי.
 * @param {Membership[]} list
 * @param {number} [now]
 */
export function summarize(list, now = Date.now()) {
    const active = list.filter((m) => m.status === 'active');
    return {
        totalSaved: list.reduce((sum, m) => sum + savedSoFar(m, now), 0),
        monthlySaving: active.reduce((sum, m) => sum + (m.monthlySaving || 0), 0),
        activeCount: active.length,
        totalCount: list.length,
        expiringSoon: active.filter((m) => expiryState(m, now) === 'soon').length,
    };
}

/** @param {number} n */
export function fmtMoney(n) {
    return new Intl.NumberFormat('he-IL', { maximumFractionDigits: 0 }).format(Math.round(n || 0));
}

/** @param {string | null | undefined} iso */
export function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * "עוד 3 חודשים" / "לפני שבועיים" — טקסט קצר לתגית התפוגה.
 * @param {number | null} days
 */
export function humanDays(days) {
    if (days === null) return 'ללא התחייבות';
    const abs = Math.abs(days);
    const unit =
        abs < 31 ? `${abs} ימים` : abs < 365 ? `${Math.round(abs / 30.4375)} חודשים` : `${(abs / 365).toFixed(1)} שנים`;
    return days < 0 ? `פג לפני ${unit}` : `עוד ${unit}`;
}
