import { json, error } from '@sveltejs/kit';
import { strapiPost } from '$lib/strapi.js';

export async function POST({ request, fetch }) {
    let body;
    try {
        body = await request.json();
    } catch {
        throw error(400, 'JSON body required');
    }
    const {
        campaign_slug,
        company = null,
        level,
        improvements = '',
        comments = '',
        phone = '',
        user_name = '',
        user_city = '',
    } = body || {};
    const lvl = parseInt(level, 10);
    if (!campaign_slug || !lvl || lvl < 1 || lvl > 5) {
        throw error(400, 'campaign_slug + level (1-5) נדרשים');
    }
    try {
        await strapiPost(
            'pg-satisfaction-responses',
            {
                campaign_slug,
                company: company ? String(company) : null,
                level: lvl,
                improvements: String(improvements),
                comments: String(comments),
                user_phone: String(phone),
                user_name: String(user_name),
                user_city: String(user_city),
                submitted_at: new Date().toISOString(),
            },
            { fetch },
        );
    } catch (err) {
        console.error('satisfaction POST failed:', err);
        throw error(502, 'השליחה נכשלה');
    }
    return json({ success: true });
}
