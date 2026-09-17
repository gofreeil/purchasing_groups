import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { savedSoFar } from '$lib/memberships.js';
import { SOURCE_CONNECTED, listAllMemberships } from '$lib/server/membershipsSource.js';
import { getSiteStats, sumLastDays } from '$lib/server/siteStats.js';

const MONTHS = 12;

/**
 * מסך הסטטיסטיקה. שני חלקים:
 *   תנועה באתר — כניסות, צפיות, לחיצות על מבצע ועל טופס ההצטרפות
 *                (מוני pg-site-events ב-Strapi, ראו $lib/server/siteStats.js).
 *   חברויות   — הכל נגזר מהחברויות עצמן: הצטרפויות לפי חודש, חיסכון
 *                מצטבר, פילוח לפי עסקה ולפי עיר.
 */
export async function load({ locals, fetch }) {
    if (!isAdmin(locals.user)) throw redirect(302, '/admin');

    const [memberships, traffic] = await Promise.all([
        listAllMemberships().catch(() => []),
        // כשה-backend עדיין לא נפרס עם המונים (או Strapi לא זמין) - null,
        // והמסך אומר זאת במפורש במקום להציג אפסים שנראים כמו נתונים.
        locals.jwt ? getSiteStats({ fetch, jwt: locals.jwt }).catch(() => null) : Promise.resolve(null),
    ]);

    // ── הצטרפויות ב-12 החודשים האחרונים ──
    const now = new Date();
    const months = Array.from({ length: MONTHS }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1);
        return {
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' }),
            joins: 0,
        };
    });
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const m of memberships) {
        const d = new Date(m.joinedAt);
        if (isNaN(d.getTime())) continue;
        const bucket = byKey.get(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
        if (bucket) bucket.joins++;
    }

    const titles = new Map(getCampaignList().map((c) => [c.slug, { title: c.title, icon: c.icon }]));

    // ── תנועה באתר: היום / 7 ימים / 30 יום / מאז ומתמיד, לכל סוג אירוע ──
    /** @param {import('$lib/server/siteStats.js').EventKind} kind */
    const windows = (kind) =>
        traffic
            ? {
                  today: sumLastDays(traffic, kind, 1),
                  d7: sumLastDays(traffic, kind, 7),
                  d30: sumLastDays(traffic, kind, 30),
                  all: traffic.totals[kind],
              }
            : { today: 0, d7: 0, d30: 0, all: 0 };
    const siteTraffic = traffic
        ? {
              since: traffic.since,
              today: traffic.today,
              visits: windows('visit'),
              pageviews: windows('pageview'),
              dealClicks: windows('deal_click'),
              joinClicks: windows('join_click'),
              daily: traffic.daily,
              // כל עסקה שנלחצה אי-פעם (מבצע או טופס), עם השם והאייקון מהקוד
              deals: traffic.deals.map((d) => ({
                  ...d,
                  title: titles.get(d.slug)?.title ?? d.slug,
                  icon: titles.get(d.slug)?.icon ?? '🤝',
              })),
              pages: traffic.pages,
          }
        : null;

    // ── פילוח לפי עסקה ──
    /** @type {Map<string, { slug: string, title: string, icon: string, count: number, saved: number }>} */
    const perDeal = new Map();
    for (const m of memberships) {
        const meta = titles.get(m.campaignSlug);
        const row = perDeal.get(m.campaignSlug) ?? {
            slug: m.campaignSlug,
            title: meta?.title ?? m.campaignSlug,
            icon: meta?.icon ?? '🤝',
            count: 0,
            saved: 0,
        };
        row.count++;
        row.saved += savedSoFar(m);
        perDeal.set(m.campaignSlug, row);
    }

    // ── פילוח לפי עיר (עשר המובילות) ──
    /** @type {Map<string, number>} */
    const cityCount = new Map();
    for (const m of memberships) {
        if (!m.userCity) continue;
        cityCount.set(m.userCity, (cityCount.get(m.userCity) ?? 0) + 1);
    }
    const cities = [...cityCount.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const statuses = ['active', 'pending', 'expired', 'cancelled'].map((s) => ({
        status: s,
        count: memberships.filter((m) => m.status === s).length,
    }));

    return {
        sourceConnected: SOURCE_CONNECTED,
        siteTraffic,
        months,
        deals: [...perDeal.values()].sort((a, b) => b.count - a.count),
        cities,
        statuses,
        totals: {
            members: new Set(memberships.map((m) => m.userId)).size,
            memberships: memberships.length,
            totalSaved: memberships.reduce((s, m) => s + savedSoFar(m), 0),
            monthlySaving: memberships
                .filter((m) => m.status === 'active')
                .reduce((s, m) => s + m.monthlySaving, 0),
        },
    };
}
