import { json, error } from '@sveltejs/kit';
import { STRAPI_URL, isSuperAdmin } from '$lib/auth.js';

// פרוקסי לעדכון תגובה: SvelteKit קורא את ה-JWT מה-cookie ו-forward לStrapi עם Bearer.
// Strapi-side ה-controller דוחה כל מי שאינו super_admin (אכיפה כפולה).
export async function PATCH({ params, request, locals, fetch }) {
    if (!isSuperAdmin(locals.user)) throw error(403, 'רק super_admin');
    if (!locals.jwt) throw error(401, 'לא מחובר');

    const body = await request.json();
    const allowed = {};
    if ('is_featured' in body) allowed.is_featured = !!body.is_featured;
    if ('admin_liked' in body) allowed.admin_liked = !!body.admin_liked;
    if ('admin_reply' in body) allowed.admin_reply = body.admin_reply == null || body.admin_reply === '' ? null : String(body.admin_reply);

    const res = await fetch(`${STRAPI_URL}/api/pg-satisfaction-responses/${params.documentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${locals.jwt}`,
        },
        body: JSON.stringify({ data: allowed }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw error(res.status, `Strapi: ${txt.slice(0, 200)}`);
    }
    return json(await res.json());
}
