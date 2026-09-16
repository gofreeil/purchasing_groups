// ============================================================
// shareResponse.js — "שיתוף חכם" של תגובת שביעות-רצון ברשתות החברתיות.
//
// כל תגובה מקבלת קישור משלה: /details/<campaign>?r=<documentId>.
// דף הפרטים מזהה את הפרמטר, מטמיע את התגובה בתגי ה-Open Graph (כותרת,
// תיאור, og:url) ומדגיש אותה בגלילה - כך שהתצוגה המקדימה בוואטסאפ/פייסבוק
// מציגה את התגובה עצמה, והלחיצה נוחתת על דף המבצע עם כל עיקרי האתר.
//
// הטקסט שנשלח ב-navigator.share (או מועתק ללוח) כולל את הדירוג, שם
// המגיב, התגובה, עיקרי הקבוצה והקישור.
// ============================================================
import { SITE_URL } from '$lib/seo.js';

/**
 * רק השדות שהשיתוף צריך - כך גם תגובה אופטימית (id מחרוזתי) עוברת.
 * @typedef {Pick<import('$lib/strapi.js').SatisfactionResponse, 'level' | 'comments' | 'user_name' | 'user_city'> & { documentId: string }} SatisfactionResponse
 */

const OG_TITLE_MAX = 90;
const OG_DESC_MAX = 300;

// שם תצוגה ידידותי - לעולם לא מזהה אוטומטי כמו "google_1164663...".
const AUTO_ID = /^(google|facebook|apple|community|local)[_-]/i;

/** @param {string | null | undefined} s */
export function displayName(s) {
	const v = String(s ?? '').trim();
	if (!v || AUTO_ID.test(v)) return '';
	return v;
}

/** @param {number | null | undefined} level */
export function starsOf(level) {
	const n = Math.max(0, Math.min(5, Math.round(Number(level) || 0)));
	return '★'.repeat(n) + '☆'.repeat(5 - n);
}

/**
 * @param {string} s
 * @param {number} max
 */
function clip(s, max) {
	const t = String(s ?? '').replace(/\s+/g, ' ').trim();
	return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

/**
 * הנתיב היחסי של התגובה (בלי דומיין).
 * @param {string} campaignSlug
 * @param {string} documentId
 */
export function responseSharePath(campaignSlug, documentId) {
	return `/details/${campaignSlug}?r=${encodeURIComponent(documentId)}`;
}

/**
 * הקישור המוחלט שמשותף - תמיד על הדומיין הקנוני.
 * @param {string} campaignSlug
 * @param {string} documentId
 */
export function responseShareUrl(campaignSlug, documentId) {
	return SITE_URL + responseSharePath(campaignSlug, documentId);
}

/**
 * מי המגיב, לתצוגה: "עופר, ירושלים" / "עופר" / "חבר קבוצה".
 * @param {Pick<SatisfactionResponse, 'user_name' | 'user_city'>} r
 */
export function responseAuthor(r) {
	const name = displayName(r.user_name) || 'חבר/ת קבוצה';
	const city = String(r.user_city ?? '').trim();
	return city ? `${name}, ${city}` : name;
}

/**
 * תגי Open Graph לתגובה משותפת - מה שמופיע בתצוגה המקדימה.
 * @param {{ campaignTitle: string, response: SatisfactionResponse }} opts
 * @returns {{ title: string, description: string }}
 */
export function responseOgMeta({ campaignTitle, response: r }) {
	const stars = starsOf(r.level);
	const who = displayName(r.user_name) || 'חבר/ת קבוצה';
	const title = clip(`${stars} ${who} על ${campaignTitle} — רכישה קבוצתית`, OG_TITLE_MAX);
	const quote = clip(r.comments ?? '', 180);
	const lead = quote ? `"${quote}" — ${responseAuthor(r)}. ` : `${responseAuthor(r)} דירג/ה ${stars}. `;
	const description = clip(
		`${lead}${campaignTitle} | קבוצת רכישה של יוצאים לחירות — ההצטרפות חינם, בלי דמי חבר ובלי התחייבות.`,
		OG_DESC_MAX
	);
	return { title, description };
}

/**
 * הטקסט שמצורף לשיתוף (וואטסאפ, טלגרם וכו'). הקישור נשלח בנפרד
 * דרך שדה url של navigator.share, ובנפילה ללוח - מצורף בסוף.
 * @param {{ campaignTitle: string, response: SatisfactionResponse, highlights?: string[] }} opts
 */
export function responseShareText({ campaignTitle, response: r, highlights = [] }) {
	const lines = [`${starsOf(r.level)} ${responseAuthor(r)} על ${campaignTitle}:`];
	const quote = clip(r.comments ?? '', 400);
	if (quote) lines.push(`"${quote}"`);
	lines.push('');
	lines.push(`${campaignTitle} — קבוצת רכישה של יוצאים לחירות`);
	for (const h of highlights) if (h) lines.push(`✅ ${h}`);
	lines.push('ההצטרפות חינם, בלי דמי חבר ובלי התחייבות 👇');
	return lines.join('\n');
}

/**
 * מפעיל את דיאלוג השיתוף של המכשיר; אם אין (דסקטופ) - מעתיק ללוח.
 * @param {{ campaignSlug: string, campaignTitle: string, response: SatisfactionResponse, highlights?: string[] }} opts
 * @returns {Promise<'shared' | 'copied' | 'cancelled' | 'failed'>}
 */
export async function shareResponse({ campaignSlug, campaignTitle, response, highlights }) {
	const url = responseShareUrl(campaignSlug, response.documentId);
	const text = responseShareText({ campaignTitle, response, highlights });
	const { title } = responseOgMeta({ campaignTitle, response });
	if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
		try {
			await navigator.share({ title, text, url });
			return 'shared';
		} catch (err) {
			if (err && /** @type {Error} */ (err).name === 'AbortError') return 'cancelled';
			// NotAllowedError וכו' - נופלים להעתקה ללוח
		}
	}
	try {
		await navigator.clipboard.writeText(`${text}\n${url}`);
		return 'copied';
	} catch {
		return 'failed';
	}
}
