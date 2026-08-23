import { fail, redirect } from '@sveltejs/kit';
import { isSuperAdmin } from '$lib/auth.js';

/**
 * ניהול הרשאות — סופר-אדמין בלבד.
 *
 * ההרשאה נקבעת בשדה app_role של המשתמש ב-Strapi. כאן עדיין אין קריאה
 * לרשימת המשתמשים ואין כתיבה אליה, ולכן המסך מציג רק את המנהל המחובר
 * (נתון אמיתי, מהעוגייה) ומסביר איפה משנים תפקיד בפועל. כשהקריאה
 * ל-Strapi תתווסף — כאן היא תיכנס, והמסך עצמו לא ישתנה.
 */

const ROLES = ['super_admin', 'neighborhood_admin', 'user'];

/** האם כבר יש קריאה/כתיבה אמיתית לרשימת בעלי ההרשאות. */
const STAFF_SOURCE_CONNECTED = false;

export async function load({ locals }) {
    const me = locals.user;
    if (!me || !isSuperAdmin(me)) throw redirect(302, '/admin');

    return {
        sourceConnected: STAFF_SOURCE_CONNECTED,
        roles: ROLES,
        meEmail: me.email,
        staff: [
            {
                id: String(me.id),
                name: me.name ?? me.username ?? me.email,
                email: me.email,
                app_role: me.app_role ?? 'super_admin',
                since: (me.createdAt ?? '').slice(0, 10),
            },
        ],
    };
}

export const actions = {
    setRole: async ({ locals }) => {
        const me = locals.user;
        if (!me || !isSuperAdmin(me)) return fail(403, { error: 'אין הרשאה' });
        return fail(501, {
            error: 'שינוי תפקיד עדיין לא מחובר — כרגע משנים את app_role ישירות ב-Strapi',
        });
    },
};
