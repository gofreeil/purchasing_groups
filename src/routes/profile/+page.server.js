import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { listMembershipsForUser } from '$lib/server/membershipsSource.js';
import { summarize } from '$lib/memberships.js';

/**
 * האזור האישי — העסקאות שהמשתמש חבר בהן, ממתי, עד מתי וכמה חסך.
 * מקור החברויות הוא membershipsSource (כרגע מוקאפ); הקמפיינים עצמם
 * מגיעים מ-campaigns.js, כדי שהכותרות והאייקונים יהיו זהים לדף הבית.
 */
export async function load({ locals }) {
    const user = locals.user;
    if (!user) return { authorized: false };

    const memberships = await listMembershipsForUser(user).catch(() => []);
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
        summary: summarize(memberships),
        campaigns,
        isAdmin: isAdmin(user),
        superAdmin: isSuperAdmin(user),
    };
}
