import { isSuperAdmin } from '$lib/auth.js';

// ה-builder נפתח רק למי ששילם (localStorage בצד הלקוח) או לאדמין ראשי (בדיקת שרת).
export function load({ locals }) {
    return {
        isSuperAdmin: isSuperAdmin(locals.user),
        layoutUser: locals.user
            ? { email: locals.user.email ?? null, name: locals.user.username ?? null }
            : null,
    };
}
