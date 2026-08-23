// ============================================================
// adDraft.js — המפתחות המשותפים של טיוטת הפרסומת ב-localStorage.
// שלושה מסכים נוגעים באותה טיוטה: הבילדר (כרטיס הפרסומת), עורך דף
// הנחיתה, והאזור האישי. עד כה כל אחד מהם החזיק את שם המפתח כמחרוזת
// משלו; "עריכת פרסומת קיימת" מוסיפה מפתח שנוסע בין שלושתם, ולכן
// הוא חי כאן ולא משוכפל.
// ============================================================

/** הטיוטה עצמה — כל מה שהמפרסם מילא בבילדר ובעורך דף הנחיתה */
export const AD_DRAFT_KEY = 'pg_ad_builder_draft_v1';

/**
 * המזהה של הפרסומת שנערכת עכשיו — נכתב כשלוחצים "ערוך" על פרסומת
 * מסוימת ב"הפרסומות שלי". זה מה שהופך את העריכה למדויקת: השליחה
 * נושאת את המזהה, והאישור מחליף בדיוק את הפרסומת הזו — לא פרסומת
 * אחרת של אותו מפרסם, ולא נוספת לידה.
 */
export const AD_EDIT_TARGET_KEY = 'pg_ad_edit_target_v1';

/** @param {string} id */
export function setAdEditTarget(id) {
	try {
		localStorage.setItem(AD_EDIT_TARGET_KEY, id);
	} catch {
		/* מצב פרטי / אחסון מלא - העריכה תיפול לזיהוי הרגיל */
	}
}

/** @returns {string} מחרוזת ריקה = לא נערכת פרסומת קיימת */
export function getAdEditTarget() {
	try {
		return localStorage.getItem(AD_EDIT_TARGET_KEY) || '';
	} catch {
		return '';
	}
}

export function clearAdEditTarget() {
	try {
		localStorage.removeItem(AD_EDIT_TARGET_KEY);
	} catch {
		/* ignore */
	}
}
