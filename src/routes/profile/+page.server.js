import { fail } from '@sveltejs/kit';
import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { listMembershipsForUser } from '$lib/server/membershipsSource.js';
import { summarize } from '$lib/memberships.js';
import {
    approveAd,
    getMyAds,
    pauseAd,
    rejectAd,
    resumeAd,
    unapproveAd,
} from '$lib/server/adsStore.js';
import { normalizePlanDays, planLabel } from '$lib/adPlans.js';

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

/**
 * קיצורי הניהול מ"הפרסומות שלי" - לאדמין שגם מפרסם בעצמו, כדי לא לעבור
 * למסך הניהול בשביל פרסומת אחת. אותן פונקציות בדיוק כמו ב-/admin/ads;
 * ההרשאה נבדקת בתוך כל פעולה, לא רק ב-load. כל התוצאות באותה צורה:
 * { message } בהצלחה, fail עם { error } בכישלון.
 * @param {any} locals
 * @param {Request} request
 * @returns {Promise<{ id: string, form: FormData, jwt: string } | { error: string, status: number }>}
 */
async function adAction(locals, request) {
    if (!isAdmin(locals.user)) return { error: 'נדרשת הרשאת ניהול', status: 403 };
    const form = await request.formData();
    const id = String(form.get('id') ?? '');
    if (!id) return { error: 'חסר מזהה פרסומת', status: 400 };
    return { id, form, jwt: locals.jwt ?? '' };
}

export const actions = {
    // אישור (או חידוש של פרסומת שפג תוקפה - אותה פעולה, תוקף חדש מהיום).
    // המסלול = מה שהמפרסם בחר בשליחה (הבחירה המפורשת נשארת במסך הניהול).
    approve: async ({ request, locals, fetch }) => {
        const a = await adAction(locals, request);
        if ('error' in a) return fail(a.status, { error: a.error });
        const durationDays = normalizePlanDays(a.form.get('durationDays'));
        try {
            await approveAd(a.id, { durationDays, fetch, jwt: a.jwt });
            return { message: `הפרסומת אושרה ופורסמה ל-${planLabel(durationDays)} ✅` };
        } catch (err) {
            console.error('profile approve failed:', err);
            return fail(502, { error: 'האישור נכשל - נסו שוב' });
        }
    },
    reject: async ({ request, locals, fetch }) => {
        const a = await adAction(locals, request);
        if ('error' in a) return fail(a.status, { error: a.error });
        try {
            await rejectAd(a.id, { reason: String(a.form.get('reason') ?? ''), fetch, jwt: a.jwt });
            return { message: 'הפרסומת נדחתה' };
        } catch (err) {
            console.error('profile reject failed:', err);
            return fail(502, { error: 'הדחייה נכשלה - נסו שוב' });
        }
    },
    // השהיה - יורדת מהאתר והימים שנותרו נשמרים לה
    pause: async ({ request, locals, fetch }) => {
        const a = await adAction(locals, request);
        if ('error' in a) return fail(a.status, { error: a.error });
        try {
            const r = await pauseAd(a.id, { fetch, jwt: a.jwt });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return { message: `${r.title} הושהתה - ${r.daysLeft} ימים שמורים לה` };
        } catch (err) {
            console.error('profile pause failed:', err);
            return fail(502, { error: 'ההשהיה נכשלה - נסו שוב' });
        }
    },
    // המשך אחרי השהיה - הימים השמורים נספרים מהיום
    resume: async ({ request, locals, fetch }) => {
        const a = await adAction(locals, request);
        if ('error' in a) return fail(a.status, { error: a.error });
        try {
            const r = await resumeAd(a.id, { fetch, jwt: a.jwt });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return { message: `${r.title} חזרה לאוויר - ${r.daysLeft} ימים` };
        } catch (err) {
            console.error('profile resume failed:', err);
            return fail(502, { error: 'ההפעלה מחדש נכשלה - נסו שוב' });
        }
    },
    // הורדה מהאתר בלי מחיקה - חוזרת לממתינות
    unapprove: async ({ request, locals, fetch }) => {
        const a = await adAction(locals, request);
        if ('error' in a) return fail(a.status, { error: a.error });
        try {
            await unapproveAd(a.id, { fetch, jwt: a.jwt });
            return { message: 'הפרסומת הורדה מהאתר וחזרה לממתינות' };
        } catch (err) {
            console.error('profile unapprove failed:', err);
            return fail(502, { error: 'ההורדה נכשלה - נסו שוב' });
        }
    },
};
