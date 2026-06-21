import { error } from '@sveltejs/kit';
import { fetchCampaignBySlug } from '$lib/strapi.js';

export async function load({ params, fetch }) {
    let campaign = null;
    try {
        campaign = await fetchCampaignBySlug(params.campaign, { fetch });
    } catch (err) {
        console.error(`Failed to fetch campaign "${params.campaign}":`, err);
        throw error(503, 'מקור הנתונים אינו זמין כרגע, נסה שוב בעוד מספר רגעים');
    }

    if (!campaign) {
        throw error(404, 'Campaign not found');
    }

    return { campaign };
}
