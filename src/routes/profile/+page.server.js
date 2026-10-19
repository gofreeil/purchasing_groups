import { fail } from '@sveltejs/kit';
import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getCampaignList } from '$lib/campaigns.js';
import { listMembershipsForUser } from '$lib/server/membershipsSource.js';
import { summarize } from '$lib/memberships.js';
import {
    adImageUrl,
    approveAd,
    computeAdExtraSlots,
    computeAdSlots,
    computeSchedules,
    getMyAdsWithRecords,
    listApproved,
    pauseAd,
    rejectAd,
    resumeAd,
    unapproveAd,
} from '$lib/server/adsStore.js';
import { normalizePlanDays, planLabel } from '$lib/adPlans.js';
import { failReason } from '$lib/strapi.js';

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
    const { rows: myAds, records: myRecords } = await getMyAdsWithRecords(
        { id: String(user.id ?? ''), email: user.email ?? '' },
        { fetch },
    ).catch(() => ({ rows: [], records: [] }));
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
        schedule: isAdmin(user) ? await loadMySchedule(myRecords, fetch, isSuperAdmin(user)) : null,
        summary: summarize(memberships),
        campaigns,
        isAdmin: isAdmin(user),
        superAdmin: isSuperAdmin(user),
    };
}

/**
 * לאדמין: הפרסומות שלו שאושרו מוצגות ב"הפרסומות שלי" בשורות של טבלת
 * התזמון (AdScheduleTable - כמו בגמ"ח), עם כל הניהול מהשורה. הפעולות
 * עצמן הן של /admin/ads. בשביל בורר המקום והשכפול צריך לדעת מי תופסת
 * כל מקום בטור: הרשומות שלו (כבר נשלפו ל"הפרסומות שלי") + הפרסומות
 * שבאוויר מהקאש של הטור. שליפה של כל המאושרות כאן כבדה מדי - עמודת
 * ה-landing לבדה שוקלת מגה-בייטים, והיא נחתכה בתקרת הזמן בייצור.
 *
 * everyone (סופר-אדמין): כל הפרסומות שבאוויר, גם של מפרסמים אחרים, לפי
 * סדר המקומות - כדי שהטבלה תראה את כל הטור. מושהית/פגה של מפרסם אחר לא
 * נמצאת בקאש של הטור, ולכן היא נשארת במסך הניהול בלבד.
 * @param {any[]} myRecords
 * @param {typeof fetch} fetch
 * @param {boolean} [everyone]
 */
async function loadMySchedule(myRecords, fetch, everyone = false) {
    const myApproved = myRecords.filter((a) => a.status === 'approved');
    if (!myApproved.length && !everyone) return null;
    const mine = new Set(myApproved.map((a) => a.id));
    try {
        const live = await listApproved({ fetch }).catch(() => []);
        const liveById = new Map(live.map((/** @type {any} */ a) => [a.id, a]));
        const byId = new Map(liveById);
        for (const a of myApproved) byId.set(a.id, a);
        const all = [...byId.values()];
        if (!all.length) return null;
        const slots = computeAdSlots(all);
        const extras = computeAdExtraSlots(all);
        const shown = (/** @type {string} */ id) => everyone || mine.has(id);
        return {
            rows: computeSchedules(all).filter((s) => shown(s.id)),
            approved: all.map((a) => ({
                id: a.id,
                title: a.title,
                slot: slots.get(a.id),
                extraSlots: extras.get(a.id) ?? [],
            })),
            // הנתונים של חלון הקציבה ושל התצוגה המקדימה (ריחוף/הקשה על הכותרת)
            ads: all
                .filter((a) => shown(a.id))
                .map((a) => ({
                    id: a.id,
                    // "ערוך" פתוח לבעלים, ולסופר-אדמין גם על פרסומת של מפרסם
                    // אחר (העדכון נרשם על שם המפרסם המקורי)
                    editable: everyone || mine.has(a.id),
                    title: a.title,
                    submittedBy: a.submittedBy,
                    requestedDurationDays: a.requestedDurationDays,
                    payment: a.payment,
                    submittedAt: a.submittedAt,
                    decidedAt: a.decidedAt,
                    expiresAt: a.expiresAt,
                    durationDays: a.durationDays,
                    paused: a.paused,
                    cta: a.cta,
                    gradient: a.gradient,
                    mainImageFit: a.mainImageFit,
                    // התמונה ככתובת מהקאש של הטור - רק לפרסומת שבאוויר (הנתיב
                    // מגיש מאושרות חיות בלבד, והרשומות כאן בלי ה-base64 הכבד)
                    mainImage: liveById.has(a.id) ? adImageUrl(liveById.get(a.id), 'main') : '',
                })),
        };
    } catch (err) {
        // בלי הטבלה - השורות הרגילות של "הפרסומות שלי" מוצגות לכל הפרסומות
        console.warn('profile schedule failed:', err instanceof Error ? err.message : err);
        return null;
    }
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
            return fail(502, { error: `האישור נכשל: ${failReason(err)}` });
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
            return fail(502, { error: `הדחייה נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההשהיה נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההפעלה מחדש נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההורדה נכשלה: ${failReason(err)}` });
        }
    },
};
