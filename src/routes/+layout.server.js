import { listApproved } from '$lib/server/adsStore.js';

// חושף את המשתמש המחובר לכל הדפים דרך data.user,
// ואת הפרסומות המאושרות של מפרסמים - לסיידבר הפרסומות.
export async function load({ locals, fetch }) {
    const u = locals.user;

    // כשל בטעינת הפרסומות לא מפיל את האתר - פשוט לא מציגים אותן.
    /** @type {any[]} */
    let approvedAds = [];
    try {
        approvedAds = await listApproved({ fetch });
    } catch (err) {
        console.warn('layout: loading approved ads failed', err);
    }

    return {
        user: u
            ? {
                id: u.id,
                email: u.email,
                username: u.username,
                // שם תצוגה אמיתי אם קיים בסכמה (אחרת ניגזר באתר מהאימייל)
                name: u.name ?? u.fullName ?? u.firstname ?? null,
                // תמונת פרופיל (Strapi המשותף / Google) - לתצוגה בהדר
                avatar_url: u.avatar_url ?? u.picture ?? u.avatar ?? null,
                app_role: u.app_role ?? null,
            }
            : null,
        approvedAds,
    };
}
