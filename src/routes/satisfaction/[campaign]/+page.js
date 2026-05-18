import { error } from '@sveltejs/kit';

// Valid campaign types. Later this list will come from Strapi.
const CAMPAIGNS = [
    'cellular',
    'internet',
    'fuel',
    'carInsurance',
    'electricity',
    'coupons'
];

export function load({ params }) {
    if (!CAMPAIGNS.includes(params.campaign)) {
        throw error(404, 'Campaign not found');
    }

    return { campaign: params.campaign };
}
