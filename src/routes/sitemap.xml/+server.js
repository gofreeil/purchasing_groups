// ============================================================
// sitemap.xml — מפת האתר. כוללת את דף הבית וכל דף קבוצת רכישה בנפרד,
// כדי שגוגל יאנדקס כל קמפיין כדף נחיתה עצמאי ("קו סלולר זול", "הנחה בדלק").
// ============================================================

import { getCampaignList } from '$lib/campaigns.js';
import { SITE_URL } from '$lib/seo.js';

export const prerender = false;

/** בריחת תווים אסורים ב-XML @param {string} s */
function xmlEscape(s) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

export function GET({ setHeaders }) {
	const campaigns = getCampaignList();

	const urls = [
		{ loc: `${SITE_URL}/`, changefreq: 'daily', priority: '1.0' },
		// דפי קמפיין פעילים בעדיפות גבוהה; "בקרוב" נסרקים גם הם, בעדיפות נמוכה
		...campaigns.map((c) => ({
			loc: `${SITE_URL}/details/${encodeURIComponent(c.slug)}`,
			changefreq: 'weekly',
			priority: c.status === 'active' ? '0.9' : '0.5'
		})),
		{ loc: `${SITE_URL}/advertise`, changefreq: 'monthly', priority: '0.4' },
		{ loc: `${SITE_URL}/privacy`, changefreq: 'yearly', priority: '0.2' },
		{ loc: `${SITE_URL}/advertise/terms`, changefreq: 'yearly', priority: '0.2' }
	];

	const xml =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urls
			.map(
				(u) =>
					`  <url>\n` +
					`    <loc>${xmlEscape(u.loc)}</loc>\n` +
					`    <changefreq>${u.changefreq}</changefreq>\n` +
					`    <priority>${u.priority}</priority>\n` +
					`  </url>`
			)
			.join('\n') +
		`\n</urlset>`;

	setHeaders({
		'Content-Type': 'application/xml',
		'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=7200'
	});
	return new Response(xml);
}
