import { redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { savedSoFar } from '$lib/memberships.js';
import { SOURCE_CONNECTED, listAllMemberships } from '$lib/server/membershipsSource.js';

const MONTHS = 12;

/**
 * מסך הסטטיסטיקה — הכל נגזר מהחברויות עצמן, בלי מקור נוסף:
 * הצטרפויות לפי חודש, חיסכון מצטבר, פילוח לפי עסקה ולפי עיר.
 */
export async function load({ locals }) {
    if (!isAdmin(locals.user)) throw redirect(302, '/admin');

    const memberships = await listAllMemberships().catch(() => []);

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

    // ── פילוח לפי עסקה ──
    const titles = new Map(getCampaignList().map((c) => [c.slug, { title: c.title, icon: c.icon }]));
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
