import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE } from '$lib/auth.js';

/**
 * חזרה מ-SSO של "יוצאים לחירות" (community.gofreeil.com/sso), וגם יעד הכפתור
 * "המשך כ-<שם>" בדף ההתחברות (מי שזוהה מראש לפי העוגייה המשותפת).
 * קהילה כבר קבעה את העוגייה המשותפת `gofreeil-auth` על `.gofreeil.com`
 * אם המשתמש מחובר שם — ולכן כאן רק צריך לנתב הלאה.
 *
 * - הצלחה (יש עוגייה ואין שגיאה) → חזרה ל-returnTo עם ?welcome=new
 *   (מפעיל את מסך "ברוכים המצטרפים").
 * - כישלון (קהילה החזירה error, או שאין עוגייה בכלל) → הדף מציג מסך
 *   "עוד רגע ואתם בפנים" עם כניסה בלחיצה דרך Google/Facebook, במקום להחזיר
 *   את המשתמש לדף ההתחברות עם שגיאה סתומה.
 *
 * הזרקת welcome=new היא ללא-תנאי (צד-שרת אינו יכול לקרוא localStorage);
 * הבחנת "מצטרף חדש / שב" (gofreeil-welcomed) נאכפת בצד-הלקוח ב-WelcomeScreen —
 * דפדפן שכבר בורך פעם מקבל "ברוכים השבים" במקום "ברוכים המצטרפים".
 */
export function load({ url, cookies }) {
    const raw = url.searchParams.get('returnTo') || '/';
    const returnTo = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
    const err = url.searchParams.get('error');

    if (!err && cookies.get(AUTH_COOKIE)) {
        const sep = returnTo.includes('?') ? '&' : '?';
        throw redirect(302, `${returnTo}${sep}welcome=new`);
    }

    return { returnTo };
}
