import { redirect } from '@sveltejs/kit';

/**
 * חזרה מ-SSO של קהילה בשכונה (community.gofreeil.com/sso).
 * קהילה כבר קבעה את העוגייה המשותפת `gofreeil-auth` על `.gofreeil.com`
 * אם המשתמש מחובר שם — ולכן כאן רק צריך לנתב הלאה.
 *
 * - הצלחה  → חזרה ל-returnTo עם ?welcome=new (מפעיל את מסך "ברוכים המצטרפים").
 * - כישלון → ?error=not_registered → חזרה ל-/login עם הודעה.
 *
 * הזרקת welcome=new היא ללא-תנאי (endpoint צד-שרת אינו יכול לקרוא localStorage);
 * שער "ביקור ראשון בדפדפן" (gofreeil-welcomed) נאכף בצד-הלקוח ב-WelcomeScreen —
 * משתמש חוזר מקבל את הפרמטר אך המסך אינו מוצג והפרמטר נוקה מה-URL.
 */
export function GET({ url }) {
	const returnTo = url.searchParams.get('returnTo') || '/';
	const err = url.searchParams.get('error');

	if (err === 'not_registered') {
		throw redirect(302, '/login?communityError=1');
	}

	const sep = returnTo.includes('?') ? '&' : '?';
	throw redirect(302, `${returnTo}${sep}welcome=new`);
}
