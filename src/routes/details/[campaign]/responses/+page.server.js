import { error } from '@sveltejs/kit';
import { fetchSatisfactionResponses } from '$lib/strapi.js';
import { getCampaign } from '$lib/campaigns.js';

export async function load({ params, fetch }) {
    // אסור קאש ציבורי על ה-HTML: הדף מוטמע עם data.user מה-layout,
    // ו-CDN שישמור אותו יגיש את פרטי המשתמש המחובר לגולשים אחרים.

    const campaign = getCampaign(params.campaign);
    if (!campaign) throw error(404, 'Campaign not found');

    const responses = await fetchSatisfactionResponses(params.campaign, { fetch, pageSize: 500 })
        .catch((err) => {
            console.error('Failed to fetch satisfaction responses:', err.message);
            return [];
        });

    // מסומנים כפינים קודם, אחר כך לפי תאריך יורד.
    const sorted = [...responses].sort((a, b) => {
        const ap = a.is_featured ? 1 : 0;
        const bp = b.is_featured ? 1 : 0;
        if (ap !== bp) return bp - ap;
        const ad = new Date(a.createdAt || a.submitted_at || 0).getTime();
        const bd = new Date(b.createdAt || b.submitted_at || 0).getTime();
        return bd - ad;
    });

    const ratedResponses = responses.filter((r) => typeof r.level === 'number' && r.level > 0);
    const averageRating = ratedResponses.length > 0
        ? ratedResponses.reduce((sum, r) => sum + r.level, 0) / ratedResponses.length
        : 0;

    return {
        campaign,
        responses: sorted,
        averageRating,
        ratingCount: ratedResponses.length,
    };
}
