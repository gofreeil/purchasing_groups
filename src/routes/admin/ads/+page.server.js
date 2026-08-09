import { error, fail } from '@sveltejs/kit';
import { isAdmin } from '$lib/auth.js';
import {
    listAllForAdmin,
    approveAd,
    rejectAd,
    unapproveAd,
    moveApprovedAd,
    setAdSlot,
    computeAdSlots,
    setAdDuration,
    normalizeDurationDays,
    pauseAd,
    resumeAd,
} from '$lib/server/adsStore.js';
import { normalizePlanDays, planLabel } from '$lib/adPlans.js';

// מסך אישור פרסומות (גרסה פשוטה של ads-review מקהילה בשכונה).
// פתוח לסופר-אדמין וגם לאדמין שמונה - שניהם מאשרים ומנהלים פרסומות.

/** @param {any} locals */
function ensureAdsAdmin(locals) {
    if (!isAdmin(locals.user)) {
        throw error(403, 'נדרשת הרשאת ניהול');
    }
}

export async function load({ locals, fetch }) {
    ensureAdsAdmin(locals);
    /** @type {any[]} */
    let ads = [];
    let backendUnavailable = false;
    try {
        ads = await listAllForAdmin({ fetch });
        // מספר המקום של כל מאושרת בטור (1..12) - לתג ולבורר "מקום" בכרטיס
        const slotMap = computeAdSlots(ads.filter((/** @type {any} */ a) => a.status === 'approved'));
        ads = ads.map((/** @type {any} */ a) =>
            slotMap.has(a.id) ? { ...a, slot: slotMap.get(a.id) } : a,
        );
    } catch (err) {
        console.error('admin/ads load failed:', err);
        backendUnavailable = true;
    }
    return { ads, backendUnavailable };
}

export const actions = {
    approve: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        // משך הפרסום נקבע כאן ולא ע"י המפרסם - התשלום ידני, אז מי שקיבל
        // את הכסף הוא זה שקובע איזה מסלול שולם בפועל.
        const durationDays = normalizePlanDays(form.get('durationDays'));
        try {
            await approveAd(id, { durationDays, fetch, jwt: locals.jwt ?? '' });
            return {
                success: true,
                message: `הפרסומת אושרה ופורסמה ל-${planLabel(durationDays)} ✅`,
            };
        } catch (err) {
            console.error('approve failed:', err);
            return fail(502, { error: 'האישור נכשל - נסו שוב' });
        }
    },
    reject: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        const reason = String(form.get('reason') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            await rejectAd(id, { reason, fetch, jwt: locals.jwt ?? '' });
            return { success: true, message: 'הפרסומת נדחתה' };
        } catch (err) {
            console.error('reject failed:', err);
            return fail(502, { error: 'הדחייה נכשלה - נסו שוב' });
        }
    },
    // הורדת פרסומת שכבר באתר - חוזרת לממתינות, בלי למחוק אותה
    unapprove: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            await unapproveAd(id, { fetch, jwt: locals.jwt ?? '' });
            return { success: true, message: 'הפרסומת הורדה מהאתר וחזרה לממתינות' };
        } catch (err) {
            console.error('unapprove failed:', err);
            return fail(502, { error: 'ההורדה נכשלה - נסו שוב' });
        }
    },
    // קציבת תקופת פרסום - נספרת מיום האישור
    setDuration: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        const days = normalizeDurationDays(form.get('days'));
        try {
            const r = await setAdDuration(id, days, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            const suffix = r.daysLeft < 0 ? ' - התקופה כבר חלפה, הפרסומת ירדה מהאתר' : '';
            return { success: true, message: `${r.title}: ${days} ימים${suffix}` };
        } catch (err) {
            console.error('setDuration failed:', err);
            return fail(502, { error: 'קציבת התקופה נכשלה - נסו שוב' });
        }
    },
    // השהיה - יורדת מהאתר ושומרת את הימים שנותרו
    pause: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await pauseAd(id, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return { success: true, message: `${r.title} הושהתה - ${r.daysLeft} ימים שמורים לה` };
        } catch (err) {
            console.error('pause failed:', err);
            return fail(502, { error: 'ההשהיה נכשלה - נסו שוב' });
        }
    },
    // המשך אחרי השהיה - הימים השמורים נספרים מהיום
    resume: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await resumeAd(id, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return { success: true, message: `${r.title} חזרה לאוויר - ${r.daysLeft} ימים` };
        } catch (err) {
            console.error('resume failed:', err);
            return fail(502, { error: 'ההפעלה מחדש נכשלה - נסו שוב' });
        }
    },
    // החלפת מקום בסדר התצוגה באתר
    move: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        const dir = form.get('dir') === 'down' ? 'down' : 'up';
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await moveApprovedAd(id, dir, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(400, { error: 'הפרסומת כבר בקצה הרשימה' });
            return { success: true, message: `${r.title} - מקום ${r.position} מתוך ${r.total}` };
        } catch (err) {
            console.error('move failed:', err);
            return fail(502, { error: 'החלפת המקום נכשלה - נסו שוב' });
        }
    },
    // הצבת פרסומת במקום מספרי בטור (1..12); מקום תפוס - השתיים מתחלפות
    setSlot: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await setAdSlot(id, Number(form.get('slot')), { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return {
                success: true,
                message: r.swappedTitle
                    ? `"${r.title}" עברה למקום ${r.slot}, ו"${r.swappedTitle}" עברה למקום ${r.swappedSlot}`
                    : `"${r.title}" עברה למקום ${r.slot}`,
            };
        } catch (err) {
            console.error('setSlot failed:', err);
            return fail(502, { error: 'העברת המקום נכשלה - נסו שוב' });
        }
    },
};
