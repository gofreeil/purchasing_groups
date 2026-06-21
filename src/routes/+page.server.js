import { fetchCampaigns, fetchStat } from '$lib/strapi.js';

// ערכי ברירת מחדל אם Strapi לא זמין - האתר לא ייפול גם כשהבאקאנד יורד.
const DEFAULT_STAT = {
    total_members: 964,
    total_annual_savings: 86694,
    boycott_threshold: 10000,
    boycott_text: 'כשנגיע ל-10,000 חברים נחל הליך של חרם כנגד משווקים שמפקיעים מחירים!',
};

export async function load({ fetch }) {
    let campaigns = [];
    let stat = DEFAULT_STAT;
    let strapiError = null;

    try {
        const [campaignsData, statData] = await Promise.all([
            fetchCampaigns({ fetch }),
            fetchStat({ fetch }),
        ]);
        campaigns = campaignsData;
        if (statData) stat = statData;
    } catch (err) {
        console.error('Failed to load from Strapi:', err);
        strapiError = err.message;
    }

    return { campaigns, stat, strapiError };
}
