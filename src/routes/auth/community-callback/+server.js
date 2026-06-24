import { redirect } from '@sveltejs/kit';

/**
 * חזרה מ-SSO של קהילה בשכונה (community.gofreeil.com/sso).
 * קהילה כבר קבעה את העוגייה המשותפת `gofreeil-auth` על `.gofreeil.com`
 * אם המשתמש מחובר שם — ולכן כאן רק צריך לנתב הלאה.
 *
 * - הצלחה  → חזרה ל-returnTo עם ?welcome=community (לברכה).
 * - כישלון → ?error=not_registered → חזרה ל-/login עם הודעה.
 */
export function GET({ url }) {
	const returnTo = url.searchParams.get('returnTo') || '/';
	const err = url.searchParams.get('error');

	if (err === 'not_registered') {
		throw redirect(302, '/login?communityError=1');
	}

	const sep = returnTo.includes('?') ? '&' : '?';
	throw redirect(302, `${returnTo}${sep}welcome=community`);
}
