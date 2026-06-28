import { json, error } from '@sveltejs/kit';
import { STRAPI_URL } from '$lib/auth.js';

// תגובה ציבורית לתגובה — כל משתמש מחובר. הזיהוי נעשה ב-Strapi לפי ה-JWT.
export async function POST({ params, request, locals, fetch }) {
    if (!locals.user) throw error(401, 'נדרשת הרשמה כדי להגיב');
    if (!locals.jwt) throw error(401, 'לא מחובר');

    let body;
    try {
        body = await request.json();
    } catch {
        throw error(400, 'JSON body required');
    }
    const text = String(body?.text ?? '').trim();
    if (!text) throw error(400, 'נדרש טקסט לתגובה');

    const res = await fetch(`${STRAPI_URL}/api/pg-satisfaction-responses/${params.documentId}/reply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${locals.jwt}`,
        },
        body: JSON.stringify({
            data: {
                text,
                user_name: String(body?.user_name ?? ''),
                user_city: String(body?.user_city ?? ''),
            },
        }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw error(res.status, `Strapi: ${txt.slice(0, 200)}`);
    }
    return json(await res.json());
}
