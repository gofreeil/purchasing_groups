// "הבקשה הראשונה" של מי שנשלח להירשם/להתחבר באמצע פעולה.
//
// אורח שלוחץ על פעולה שדורשת חשבון נשלח להתחברות עם יעד חזרה (?returnTo=). בסיום
// ההרשמה/התחברות הוא נוחת ביעד עם ?welcome=..., ומסך הפתיחה (WelcomeScreen) מציג:
// "השלמת את ההרשמה! כעת תועבר לבקשתך הראשונה — <תיאור>" ונסגר אל הבקשה עצמה.
// תיאור יש רק ליעדים שהם פעולה; דף הבית, דפי עיון והאזור האישי אינם "בקשה".

/** @type {Array<[RegExp, string]>} */
const ROUTE_LABELS = [
	[/^\/details\/[^/]+\/responses$/, 'דירוג ותגובה על המבצע'],
	[/^\/advertise(\/|$)/, 'בניית מודעה'],
	[/^\/admin(\/|$)/, 'ממשק הניהול']
];

/**
 * תיאור הבקשה לפי נתיב היעד (כולל query), או null כשהיעד אינו בקשה
 * @param {string} pathAndSearch
 * @returns {string | null}
 */
export function describeReturn(pathAndSearch) {
	let path;
	try {
		path = new URL(pathAndSearch, 'http://x').pathname.replace(/\/+$/, '') || '/';
	} catch {
		return null;
	}
	for (const [re, label] of ROUTE_LABELS) if (re.test(path)) return label;
	return null;
}
