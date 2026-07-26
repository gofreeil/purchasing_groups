// ============================================================
// networkSites.js - הרשימה הקנונית של כל אתרי רשת "יוצאים לחירות"
// משמשת את רשת הלוגואים במסך הברכה (WelcomeScreen) — כוללת את
// כל האתרים, כולל האתר הנוכחי עצמו. רשימה זהה קיימת בכל המאגרים
// של הרשת — עדכון כאן מחייב עדכון מקביל בכולם.
// (שונה מ-adsData.js שמשמש לרוטציית פרסומות ומחליף את המודעה העצמית.)
//
// התאמות מקומיות ל-purchasing_groups (אותם 10 אתרים, אותם צבעים):
// - אין Tailwind — השדה color הוא CSS gradient מוכן לשימוש כ-background
//   (ההקסים המקבילים למחלקות ה-Tailwind שבגרסת הייחוס).
// - התמונות מפנות לקבצים שכבר קיימים במאגר תחת /assets (אותם קבצים
//   שמשמשים את adsData.js) — אין כפילות בינארית.
// ============================================================

/**
 * @typedef {Object} NetworkSite
 * @property {number} id
 * @property {string} title
 * @property {string} href
 * @property {string} image
 * @property {string} color
 */

/** @type {NetworkSite[]} */
export const networkSites = [
	{
		id: 1,
		title: 'בתי הפיוס',
		href: 'https://chachmim.gofreeil.com/',
		image: '/assets/bati-hapius.png',
		color: 'linear-gradient(135deg, #ea580c, #dc2626)'
	},
	{
		id: 2,
		title: 'הגמ"ח הארצי',
		href: 'https://gemach.gofreeil.com/',
		image: '/assets/gemach-harzi.png',
		color: 'linear-gradient(135deg, #db2777, #c026d3, #7e22ce)'
	},
	{
		id: 3,
		title: 'קהילה בשכונה',
		href: 'https://community.gofreeil.com/',
		image: '/assets/community-neighborhood.png',
		color: 'linear-gradient(135deg, #3b82f6, #9333ea)'
	},
	{
		id: 4,
		title: 'ועדי שכונות',
		href: 'https://neighborhoods.gofreeil.com/',
		image: '/assets/news/vaadei-shchunot.png',
		color: 'linear-gradient(135deg, #2563eb, #0891b2)'
	},
	{
		id: 5,
		title: 'מבקר רשויות המדינה',
		href: 'https://criticism.gofreeil.com/',
		image: '/assets/mevaker-rashuyot.png',
		color: 'linear-gradient(135deg, #1d4ed8, #4338ca)'
	},
	{
		id: 6,
		title: 'דירוג ציבורי',
		href: 'https://rating.gofreeil.com/',
		image: '/assets/public-rating.jpeg',
		color: 'linear-gradient(135deg, #4f46e5, #2563eb)'
	},
	{
		id: 7,
		title: 'משאלי העם',
		href: 'https://referendum.gofreeil.com/',
		image: '/assets/referendum.png',
		color: 'linear-gradient(135deg, #9333ea, #4338ca)'
	},
	{
		id: 8,
		title: 'קבוצת רכישה',
		href: 'https://groups.gofreeil.com/',
		image: '/assets/whatsapp_cta.png',
		color: 'linear-gradient(135deg, #166534, #064e3b)'
	},
	{
		id: 9,
		title: 'בעלי מקצוע כשירים',
		href: 'https://index.gofreeil.com/',
		image: '/assets/professionals.png',
		color: 'linear-gradient(135deg, #eab308, #f97316)'
	},
	{
		id: 10,
		title: 'חנות החירות',
		href: 'https://shop.gofreeil.com/',
		image: '/assets/shop.webp',
		color: 'linear-gradient(135deg, #059669, #0f766e)'
	}
];
