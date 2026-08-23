import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { listMembershipsForUser } from '$lib/server/membershipsSource.js';
import { summarize } from '$lib/memberships.js';
import { getMyAds } from '$lib/server/adsStore.js';

/**
 * האזור האישי — העסקאות שהמשתמש חבר בהן, ממתי, עד מתי וכמה חסך.
 * מקור החברויות הוא membershipsSource - שעדיין לא חובר למאגר, ולכן
 * הרשימה ריקה והמסך מציג "עוד לא הצטרפת לעסקאות". הקמפיינים עצמם
 * מגיעים מ-campaigns.js, כדי שהכותרות והאייקונים יהיו זהים לדף הבית.
 */
export async function load({ locals, fetch }) {
    const user = locals.user;
    if (!user) return { authorized: false };

    const memberships = await listMembershipsForUser(user).catch(() => []);
    // הפרסומות של המשתמש - לרשימת "הפרסומות שלי", שם לכל אחת יש כפתור
    // עריכה. תקלה מול Strapi לא מפילה את האזור האישי: הרשימה פשוט ריקה.
    const myAds = await getMyAds(
        { id: String(user.id ?? ''), email: user.email ?? '' },
        { fetch },
    ).catch(() => []);
    const joined = new Set(memberships.map((m) => m.campaignSlug));

    // רק מה שהמסך באמת קורא — שם, אייקון ותמונה — ולא אובייקט הקמפיין
    // המלא (טבלאות מסלולים, שאלות ותשובות). כל השדות האלה היו נשלחים
    // פעמיים: ב-HTML של ה-SSR ושוב בנתוני ההידרציה.
    const campaigns = getCampaignList().map((c) => ({
        slug: c.slug,
        title: c.title,
        description: c.description,
        icon: c.icon,
        status: c.status,
        canJoin: c.can_join,
        joined: joined.has(c.slug),
    }));

    return {
        authorized: true,
        memberships,
        myAds,
        summary: summarize(memberships),
        campaigns,
        isAdmin: isAdmin(user),
        superAdmin: isSuperAdmin(user),
    };
}
