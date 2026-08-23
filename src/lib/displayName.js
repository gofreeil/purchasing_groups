// שם תצוגה ידידותי למשתמש מחובר.
//
// לעולם לא להציג מזהה אוטומטי של ספק ההזדהות כמו
// "google_116466357545977974554": ב-Strapi המשותף זה מה שנשמר ב-username
// כשנרשמים דרך גוגל, וכל מסך שמציג אותו כשם נראה שבור. שני צרכנים -
// ההדר הראשי ומעטפת פאנל הניהול - ולכן הלוגיקה יושבת כאן ולא בשניהם.

const AUTO_ID = /^(google|facebook|apple|community|local)[_-]/i;

/** @param {string | null | undefined} s */
function humanOrEmpty(s) {
    if (!s || AUTO_ID.test(s)) return '';
    return s;
}

/**
 * סדר העדפה: שם אמיתי ← החלק שלפני @ באימייל ← username אנושי ← "משתמש".
 * @param {{ name?: string | null, username?: string | null, email?: string | null } | null | undefined} user
 * @param {string} [fallback]
 */
export function displayName(user, fallback = 'משתמש') {
    if (!user) return '';
    const emailLocal = user.email && !AUTO_ID.test(user.email) ? user.email.split('@')[0] : '';
    return humanOrEmpty(user.name) || emailLocal || humanOrEmpty(user.username) || fallback;
}
