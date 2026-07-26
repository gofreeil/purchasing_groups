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
 * הבחנת "מצטרף חדש / שב" (gofreeil-welcomed) נאכפת בצד-הלקוח ב-WelcomeScreen —
 * דפדפן שכבר בורך פעם מקבל "ברוכים השבים" במקום "ברוכים המצטרפים".
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
