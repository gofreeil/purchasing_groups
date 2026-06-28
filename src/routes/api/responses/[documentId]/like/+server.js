import { json, error } from '@sveltejs/kit';
import { STRAPI_URL } from '$lib/auth.js';

// לייק ציבורי (toggle) על תגובה — כל משתמש מחובר. הזיהוי נעשה ב-Strapi לפי ה-JWT.
export async function POST({ params, locals, fetch }) {
    if (!locals.user) throw error(401, 'נדרשת הרשמה כדי לסמן לייק');
    if (!locals.jwt) throw error(401, 'לא מחובר');

    const res = await fetch(`${STRAPI_URL}/api/pg-satisfaction-responses/${params.documentId}/like`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${locals.jwt}`,
        },
        body: JSON.stringify({ data: {} }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw error(res.status, `Strapi: ${txt.slice(0, 200)}`);
    }
    return json(await res.json());
}
