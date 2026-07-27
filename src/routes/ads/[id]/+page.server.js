import { error } from '@sveltejs/kit';
import { getAd } from '$lib/server/adsStore.js';

// דף הנחיתה הציבורי של פרסומת מאושרת.
export async function load({ params, fetch }) {
    const ad = await getAd(params.id, { fetch });
    if (!ad || ad.status !== 'approved' || (ad.expiresAt && Date.parse(ad.expiresAt) < Date.now())) {
        throw error(404, 'הפרסומת לא נמצאה');
    }
    // אסור קאש ציבורי על ה-HTML: הדף מוטמע עם data.user מה-layout,
    // ו-CDN שישמור אותו יגיש את פרטי המשתמש המחובר לגולשים אחרים.
    return { ad };
}
