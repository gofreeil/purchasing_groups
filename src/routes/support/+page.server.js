import { fail } from '@sveltejs/kit';
import { STRAPI_URL, isAdmin } from '$lib/auth.js';

// תמיכה דרך האתר: פנייה אחת = שרשור צ'אט בין הפונה, ההנהלה וחברות השירות שהוקצו.
// ההרשאות (מי רואה איזו פנייה) נאכפות בבאקאנד; כאן רק מעבירים את ה-JWT.

/**
 * @param {typeof fetch} f @param {string} jwt @param {string} path @param {'GET'|'POST'} [method] @param {unknown} [data]
 */
async function api(f, jwt, path, method = 'GET', data = undefined) {
    const res = await f(`${STRAPI_URL}/api/pg-support-tickets/${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: data === undefined ? undefined : JSON.stringify({ data }),
        signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        let msg = '';
        try {
            msg = JSON.parse(txt)?.error?.message ?? '';
        } catch {
            /* גוף לא JSON */
        }
        throw new Error(msg || `שגיאת שרת ${res.status}`);
    }
    return res.json();
}

export async function load({ locals, url, fetch }) {
    if (!locals.user || !locals.jwt) return { loggedIn: false, tickets: [], thread: null, admin: false };
    const admin = isAdmin(locals.user);
    let tickets = [];
    let thread = null;
    let loadError = '';
    try {
        tickets = (await api(fetch, locals.jwt, 'inbox')).data ?? [];
        const id = url.searchParams.get('t');
        if (id) thread = (await api(fetch, locals.jwt, `thread/${encodeURIComponent(id)}`)).data ?? null;
    } catch (err) {
        loadError = err instanceof Error ? err.message : 'שגיאה בטעינה';
    }
    return { loggedIn: true, tickets, thread, admin, loadError };
}

export const actions = {
    open: async ({ request, locals, fetch }) => {
        if (!locals.jwt) return fail(401, { error: 'נדרשת התחברות' });
        const f = await request.formData();
        const subject = String(f.get('subject') ?? '').trim();
        const text = String(f.get('text') ?? '').trim();
        if (!subject || !text) return fail(400, { error: 'נא למלא נושא ותוכן' });
        try {
            const r = await api(fetch, locals.jwt, 'open', 'POST', {
                subject,
                text,
                category: String(f.get('category') ?? ''),
                company: String(f.get('company') ?? ''),
                phone: String(f.get('phone') ?? ''),
            });
            return { opened: r.data?.documentId ?? null };
        } catch (err) {
            return fail(500, { error: err instanceof Error ? err.message : 'השליחה נכשלה' });
        }
    },

    message: async ({ request, locals, fetch }) => {
        if (!locals.jwt) return fail(401, { error: 'נדרשת התחברות' });
        const f = await request.formData();
        const id = String(f.get('id') ?? '');
        const text = String(f.get('text') ?? '').trim();
        if (!text) return fail(400, { error: 'נא לכתוב הודעה' });
        try {
            await api(fetch, locals.jwt, `${encodeURIComponent(id)}/message`, 'POST', { text });
            return { sent: true };
        } catch (err) {
            return fail(500, { error: err instanceof Error ? err.message : 'השליחה נכשלה' });
        }
    },

    manage: async ({ request, locals, fetch }) => {
        if (!locals.jwt || !isAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });
        const f = await request.formData();
        const id = String(f.get('id') ?? '');
        /** @type {Record<string, unknown>} */
        const data = {};
        const status = String(f.get('status') ?? '');
        if (status) data.status = status;
        if (f.has('providers')) {
            data.provider_emails = String(f.get('providers') ?? '')
                .split(/[\s,;]+/)
                .filter(Boolean);
        }
        try {
            await api(fetch, locals.jwt, `${encodeURIComponent(id)}/manage`, 'POST', data);
            return { managed: true };
        } catch (err) {
            return fail(500, { error: err instanceof Error ? err.message : 'העדכון נכשל' });
        }
    },
};
