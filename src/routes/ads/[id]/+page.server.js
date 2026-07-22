import { error } from '@sveltejs/kit';
import { getAd } from '$lib/server/adsStore.js';

// דף הנחיתה הציבורי של פרסומת מאושרת.
export async function load({ params, fetch, setHeaders }) {
    const ad = await getAd(params.id, { fetch });
    if (!ad || ad.status !== 'approved' || (ad.expiresAt && Date.parse(ad.expiresAt) < Date.now())) {
        throw error(404, 'הפרסומת לא נמצאה');
    }
    setHeaders({ 'cache-control': 'public, s-maxage=60, stale-while-revalidate=600' });
    return { ad };
}
