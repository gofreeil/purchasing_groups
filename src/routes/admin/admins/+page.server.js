import { fail, redirect } from '@sveltejs/kit';
import { isSuperAdmin } from '$lib/auth.js';

/**
 * ניהול הרשאות — סופר-אדמין בלבד.
 *
 * ⚠️ מוקאפ: רשימת בעלי ההרשאות יושבת כאן בזיכרון. ההרשאה האמיתית נקבעת
 * בשדה app_role של המשתמש ב-Strapi, ולכן כשנחבר מקור אמת הקריאה והכתיבה
 * יעברו לשם — המסך עצמו לא ישתנה.
 */

const ROLES = ['super_admin', 'neighborhood_admin', 'user'];

/** @type {{ id: string, name: string, email: string, app_role: string, since: string }[]} */
const MOCK_STAFF = [
    { id: 's1', name: 'יהב ענתר', email: 'yahavanter@gmail.com', app_role: 'super_admin', since: '2024-02-11' },
    { id: 's2', name: 'משה כהן', email: 'moshe@gofreeil.com', app_role: 'neighborhood_admin', since: '2025-01-06' },
    { id: 's3', name: 'רחל לוי', email: 'rachel@gofreeil.com', app_role: 'neighborhood_admin', since: '2025-06-22' },
    { id: 's4', name: 'דוד פרידמן', email: 'david@gofreeil.com', app_role: 'user', since: '2025-11-03' },
];

export async function load({ locals }) {
    // המשתמש המחובר תמיד ראשון ברשימה, גם אם אינו במוקאפ
    const me = locals.user;
    if (!me || !isSuperAdmin(me)) throw redirect(302, '/admin');

    const staff = MOCK_STAFF.some((s) => s.email === me.email)
        ? MOCK_STAFF
        : [
              {
                  id: String(me.id),
                  name: me.name ?? me.username ?? me.email,
                  email: me.email,
                  app_role: me.app_role ?? 'super_admin',
                  since: (me.createdAt ?? '').slice(0, 10),
              },
              ...MOCK_STAFF,
          ];

    return { staff, roles: ROLES, meEmail: me.email };
}

export const actions = {
    setRole: async ({ request, locals }) => {
        const me = locals.user;
        if (!me || !isSuperAdmin(me)) return fail(403, { error: 'אין הרשאה' });
        const fd = await request.formData();
        const id = String(fd.get('id') || '');
        const role = String(fd.get('role') || '');
        if (!id || !ROLES.includes(role)) return fail(400, { error: 'בקשה לא תקינה' });

        const person = MOCK_STAFF.find((s) => s.id === id);
        if (!person) return fail(404, { error: 'המשתמש לא נמצא' });
        // סופר-אדמין שמוריד לעצמו את ההרשאה נועל את עצמו מחוץ לפאנל
        if (person.email === me.email && role !== 'super_admin') {
            return fail(400, { error: 'אי אפשר להוריד לעצמך את הרשאת הסופר-אדמין' });
        }
        person.app_role = role;
        return { ok: true, message: `${person.name} — ההרשאה עודכנה` };
    },
};
