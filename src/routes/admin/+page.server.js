import { fail } from '@sveltejs/kit';
import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { expiryState, savedSoFar } from '$lib/memberships.js';
import {
    listAllMemberships,
    listMembers,
    setMembershipStatus,
    extendMembership,
} from '$lib/server/membershipsSource.js';
import { getAllRatings, needsReply } from '$lib/server/adminData.js';

/**
 * מסך הניהול הראשי — חמש לשוניות על אותם נתונים (?tab=...).
 * מוני ההמתנה לסרגל הניווט מגיעים מ-+layout.server.js; כאן נשלפות
 * הרשימות עצמן.
 */
export async function load({ locals, fetch }) {
    const user = locals.user;
    if (!isAdmin(user)) return { authorized: false, user: user ?? null };

    // הדירוגים מגיעים מ-Strapi ועלולים ליפול; כל השאר מקומי.
    const [memberships, members, ratings] = await Promise.all([
        listAllMemberships().catch(() => []),
        listMembers().catch(() => []),
        getAllRatings({ fetch }).catch(() => []),
    ]);

    // סיכום פר-עסקה ללשונית "עסקאות": כמה חברים, כמה חיסכון, ומה הדירוג.
    const deals = getCampaignList().map((c) => {
        const mine = memberships.filter((m) => m.campaignSlug === c.slug);
        const active = mine.filter((m) => m.status === 'active');
        const rated = ratings.filter((r) => r.campaignSlug === c.slug && r.level > 0);
        return {
            slug: c.slug,
            title: c.title,
            icon: c.icon,
            status: c.status,
            canJoin: c.can_join,
            members: new Set(mine.map((m) => m.userId)).size,
            activeCount: active.length,
            pendingCount: mine.filter((m) => m.status === 'pending').length,
            expiringCount: active.filter((m) => expiryState(m) === 'soon').length,
            monthlySaving: active.reduce((s, m) => s + m.monthlySaving, 0),
            totalSaved: mine.reduce((s, m) => s + savedSoFar(m), 0),
            ratingAvg: rated.length ? rated.reduce((s, r) => s + r.level, 0) / rated.length : 0,
            ratingCount: rated.length,
        };
    });

    const totals = {
        members: new Set(memberships.map((m) => m.userId)).size,
        active: memberships.filter((m) => m.status === 'active').length,
        monthlySaving: deals.reduce((s, d) => s + d.monthlySaving, 0),
        totalSaved: deals.reduce((s, d) => s + d.totalSaved, 0),
    };

    return {
        authorized: true,
        user,
        superAdmin: isSuperAdmin(user),
        memberships,
        members,
        deals,
        totals,
        ratings: ratings.slice(0, 60).map((r) => ({
            documentId: r.documentId,
            campaignSlug: r.campaignSlug,
            level: r.level,
            comments: r.comments ?? '',
            userName: r.user_name ?? '',
            userCity: r.user_city ?? '',
            company: r.company ?? '',
            createdAt: r.createdAt,
            answered: !needsReply(r),
        })),
    };
}

/** הסטטוסים שמותר לקבוע ידנית. */
const VALID_STATUS = ['active', 'pending', 'expired', 'cancelled'];

export const actions = {
    // אישור/דחייה/ביטול/החזרה של חברות בעסקה
    setStatus: async ({ request, locals }) => {
        if (!isAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });
        const fd = await request.formData();
        const id = String(fd.get('id') || '');
        const status = String(fd.get('status') || '');
        if (!id || !VALID_STATUS.includes(status)) return fail(400, { error: 'בקשה לא תקינה' });

        const m = await setMembershipStatus(id, /** @type {any} */ (status));
        if (!m) return fail(404, { error: 'הרשומה לא נמצאה' });
        const labels = { active: 'אושרה', pending: 'הוחזרה לממתינות', expired: 'סומנה כפגה', cancelled: 'בוטלה' };
        return { ok: true, message: `${m.userName} — החברות ${labels[/** @type {keyof typeof labels} */ (status)]}` };
    },

    // הארכת תקופה לחברות קיימת
    extend: async ({ request, locals }) => {
        if (!isAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });
        const fd = await request.formData();
        const id = String(fd.get('id') || '');
        const months = Number(fd.get('months') || 0);
        if (!id || !(months > 0)) return fail(400, { error: 'בקשה לא תקינה' });

        const m = await extendMembership(id, months);
        if (!m) return fail(404, { error: 'הרשומה לא נמצאה' });
        return { ok: true, message: `${m.userName} — התקופה הוארכה ב-${months} חודשים` };
    },
};
