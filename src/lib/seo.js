// ============================================================
// seo.js — מקור אמת יחיד ל-SEO + Structured Data (JSON-LD)
// כל ה-URLים הקנוניים, שם המותג ומחוללי schema.org עוברים מכאן.
// משמש את רכיב <Seo> בכל דף, את ה-sitemap ואת ה-AI crawlers.
// ============================================================

/** הדומיין הקנוני היחיד. כל canonical / og:url / sitemap מצביעים לכאן. */
export const SITE_URL = 'https://groups.gofreeil.com';
export const SITE_NAME = 'רכישות קבוצתיות';
export const SITE_TAGLINE = 'מצטרפים יחד וחוסכים בגדול';
export const SITE_DESCRIPTION =
	'רכישות קבוצתיות של "יוצאים לחירות" — כוח קנייה קבוצתי שמוריד מחירים: קו סלולר החל מ-15 ש"ח לחודש, הנחה קבועה על דלק בכ-700 תחנות, ביטוח רכב, חשמל ואינטרנט. ההצטרפות חינם, בלי דמי חבר ובלי התחייבות.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/og-share.jpg`;
export const SITE_LOGO = `${SITE_URL}/assets/קבוצות-רכישה.png`;
export const CONTACT_EMAIL = 'freedomhasbegun@gmail.com';

/**
 * בונה URL מוחלט קנוני מנתיב יחסי.
 * @param {string} [path]
 * @returns {string}
 */
export function canonical(path = '/') {
	if (!path.startsWith('/')) path = '/' + path;
	return path === '/' ? SITE_URL : SITE_URL + path;
}

// ============================================================
// ---- רשת "יוצאים לחירות" ----
// קישורים הדדיים בין כל אתרי הרשת: כל אתר מקשר לאחרים בעוגן תיאורי,
// וכל Organization מצהיר על שיוך לתנועת האם. כך גוגל ומנועי ה-AI
// מזהים את כולם כישות אחת ומחלקים ביניהם את האמון (entity consolidation).
// רשימה זהה קיימת בכל מאגרי הרשת — עדכון כאן מחייב עדכון מקביל בכולם.
// ============================================================

/** @typedef {{ name: string, url: string, description: string }} NetworkSiteLink */

/** אתר האם של התנועה — הורה ארגוני לכל אתרי הרשת. @type {NetworkSiteLink} */
export const PARENT_SITE = {
	name: 'יוצאים לחירות',
	url: 'https://gofreeil.com',
	description: 'התנועה החברתית שמאחדת את כל אתרי הרשת — מתקדמים לעולם סולידרי, אחראי וחופשי'
};

/** @type {NetworkSiteLink[]} */
export const NETWORK_SITES = [
	PARENT_SITE,
	{
		name: 'קהילה בשכונה',
		url: 'https://community.gofreeil.com',
		description: 'כל יתרונות השכונה במקום אחד: יד שנייה, דירות, שידוכים, חוגים, בייבי סיטר וטרמפים'
	},
	{
		name: 'הגמ"ח הארצי',
		url: 'https://gemach.gofreeil.com',
		description: 'מאגר הגמ"חים הארצי — השאלת ציוד רפואי, ריהוט, שמלות וכלי אירוח בחינם'
	},
	{
		name: 'בעלי מקצוע כשירים',
		url: 'https://index.gofreeil.com',
		description: 'אינדקס בעלי מקצוע מדורגים שהתחייבו לאמנת הקהילה ולהטבות לחברי הקהילה'
	},
	{
		name: 'חכמי העדה — בתי הפיוס',
		url: 'https://chachmim.gofreeil.com',
		description: 'בוררות, פיוס ופתרון סכסוכים על פי תורת ישראל, בהתנדבות'
	},
	{
		name: 'רכישות קבוצתיות',
		url: 'https://groups.gofreeil.com',
		description: 'קבוצות רכישה שמורידות מחירים — סלולר, דלק, ביטוח וחשמל'
	},
	{
		name: 'פינת האבדות',
		url: 'https://avedot.gofreeil.com',
		description: 'לוח אבידות ומציאות ארצי — פרסום וחיפוש חינם'
	},
	{
		name: 'ועדי שכונות',
		url: 'https://neighborhoods.gofreeil.com',
		description: 'ועדי שכונות ומשילות התושבים על המוסדות המקומיים'
	},
	{
		name: 'מבקר רשויות המדינה',
		url: 'https://criticism.gofreeil.com',
		description: 'ביקורת ציבורית על הרשויות ומימוש זכויות התושב'
	},
	{
		name: 'דירוג ציבורי',
		url: 'https://rating.gofreeil.com',
		description: 'העם מדרג את הרשויות ואת עובדי הציבור'
	},
	{
		name: 'משאלי העם',
		url: 'https://referendum.gofreeil.com',
		description: 'הבעת דעה על הסוגיות האקטואליות שעל סדר היום'
	},
	{
		name: 'חנות החירות',
		url: 'https://shop.gofreeil.com',
		description: 'מוצרים נבחרים לבריאות טבעית, חקלאות ביתית וטכנולוגיה'
	}
];

/** אתרי הרשת ללא האתר הנוכחי — לשורת הקישורים בפוטר. */
export const OTHER_NETWORK_SITES = NETWORK_SITES.filter((s) => !SITE_URL.startsWith(s.url));

// ============================================================
// ---- מחוללי schema.org (JSON-LD) ----
// ============================================================

/** WebSite — זהות האתר, שפה וקישורי הרשת */
export function websiteSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		'@id': `${SITE_URL}/#website`,
		name: SITE_NAME,
		alternateName: ['רכישות קבוצתיות יוצאים לחירות', 'קבוצת רכישה', 'כוח קנייה קבוצתי'],
		url: SITE_URL,
		description: SITE_DESCRIPTION,
		inLanguage: 'he-IL',
		publisher: { '@id': `${SITE_URL}/#organization` },
		relatedLink: NETWORK_SITES.filter((s) => !SITE_URL.startsWith(s.url)).map((s) => s.url)
	};
}

/** Organization — זהות המותג למנועי חיפוש ול-AI, כולל שיוך לתנועת האם */
export function organizationSchema() {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		'@id': `${SITE_URL}/#organization`,
		name: SITE_NAME,
		url: SITE_URL,
		logo: { '@type': 'ImageObject', url: SITE_LOGO },
		image: DEFAULT_OG_IMAGE,
		description: SITE_DESCRIPTION,
		email: CONTACT_EMAIL,
		areaServed: { '@type': 'Country', name: 'Israel' },
		inLanguage: 'he-IL',
		parentOrganization: {
			'@type': 'Organization',
			name: PARENT_SITE.name,
			url: PARENT_SITE.url
		},
		sameAs: NETWORK_SITES.filter((s) => !SITE_URL.startsWith(s.url)).map((s) => s.url)
	};
}

/**
 * פירורי לחם — מסלול ניווט שגוגל מציג בתוצאות
 * @param {Array<{ name: string, path: string }>} items
 */
export function breadcrumbSchema(items) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((it, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: it.name,
			item: canonical(it.path)
		}))
	};
}

/**
 * CollectionPage + ItemList — לדף הבית (רשימת הקבוצות)
 * @param {{ name: string, description: string, path: string, items?: Array<{ name: string, path: string }>, numberOfItems?: number }} opts
 */
export function collectionSchema(opts) {
	/** @type {Record<string, unknown>} */
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: opts.name,
		description: opts.description,
		url: canonical(opts.path),
		inLanguage: 'he-IL',
		isPartOf: { '@id': `${SITE_URL}/#website` }
	};
	if (opts.items?.length) {
		schema.mainEntity = {
			'@type': 'ItemList',
			numberOfItems: opts.numberOfItems ?? opts.items.length,
			itemListElement: opts.items.slice(0, 60).map((it, i) => ({
				'@type': 'ListItem',
				position: i + 1,
				name: it.name,
				url: canonical(it.path)
			}))
		};
	}
	return schema;
}

/**
 * FAQPage — שאלות ותשובות שגוגל ו-AI אוהבים לצטט
 * @param {Array<{ q: string, a: string }>} qa
 */
export function faqSchema(qa) {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: qa
			.filter((x) => x?.q && x?.a)
			.map(({ q, a }) => ({
				'@type': 'Question',
				name: stripHtml(q),
				acceptedAnswer: { '@type': 'Answer', text: stripHtml(a) }
			}))
	};
}

/**
 * Service — קבוצת רכישה בודדת (דף קמפיין) או השירות כולו (דף הבית)
 * @param {{ name: string, description: string, path: string, image?: string, rating?: number, reviewCount?: number, category?: string }} opts
 */
export function campaignServiceSchema(opts) {
	/** @type {Record<string, unknown>} */
	const schema = {
		'@context': 'https://schema.org',
		'@type': 'Service',
		'@id': `${canonical(opts.path)}#service`,
		name: opts.name,
		description: stripHtml(opts.description),
		url: canonical(opts.path),
		serviceType: opts.category ?? 'רכישה קבוצתית',
		provider: { '@id': `${SITE_URL}/#organization` },
		areaServed: { '@type': 'Country', name: 'Israel' },
		inLanguage: 'he-IL',
		...(opts.image ? { image: opts.image.startsWith('http') ? opts.image : SITE_URL + opts.image } : {}),
		offers: {
			'@type': 'Offer',
			price: 0,
			priceCurrency: 'ILS',
			description: 'ההצטרפות לקבוצת הרכישה חינם, בלי דמי חבר ובלי התחייבות',
			availability: 'https://schema.org/InStock',
			url: canonical(opts.path)
		},
		isPartOf: { '@id': `${SITE_URL}/#website` }
	};
	// דירוג מוצהר רק כשיש חוות דעת אמיתיות — aggregateRating בלי ביקורות נחשב ספאם
	if (opts.rating && opts.reviewCount) {
		schema.aggregateRating = {
			'@type': 'AggregateRating',
			ratingValue: Number(Number(opts.rating).toFixed(1)),
			reviewCount: opts.reviewCount,
			bestRating: 5,
			worstRating: 1
		};
	}
	return schema;
}

/**
 * ניקוי תגי HTML מטקסט שנכנס ל-JSON-LD (התוכן באתר מכיל <br> ו-<span>).
 * @param {string} s
 */
function stripHtml(s) {
	return String(s ?? '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}
