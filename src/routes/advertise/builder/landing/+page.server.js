import { isSuperAdmin } from '$lib/auth.js';

// אותה שערת גישה כמו ב-builder הראשי.
export function load({ locals }) {
    return {
        isSuperAdmin: isSuperAdmin(locals.user),
        layoutUser: locals.user
            ? { email: locals.user.email ?? null, name: locals.user.username ?? null }
            : null,
    };
}
