import { fail, redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, STRAPI_URL, authCookieOptions } from '$lib/auth.js';

export const actions = {
    local: async ({ request, url, cookies, fetch }) => {
        const form = await request.formData();
        const identifier = String(form.get('identifier') || '').trim();
        const password = String(form.get('password') || '');
        const returnTo = String(form.get('returnTo') || '/');
        if (!identifier || !password) return fail(400, { error: 'אימייל וסיסמה נדרשים' });

        const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier, password }),
        });
        if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            const msg = json?.error?.message || 'אימייל או סיסמה שגויים';
            return fail(401, { error: msg, identifier });
        }
        const data = await res.json();
        if (!data?.jwt) return fail(502, { error: 'Strapi לא החזיר JWT' });

        cookies.set(AUTH_COOKIE, data.jwt, authCookieOptions(url));
        throw redirect(303, returnTo);
    },
};
