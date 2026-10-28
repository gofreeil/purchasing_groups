import { error, fail } from '@sveltejs/kit';
import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import {
    listAllForAdmin,
    approveAd,
    rejectAd,
    unapproveAd,
    moveApprovedAd,
    setAdSlot,
    addAdExtraSlot,
    removeAdExtraSlot,
    computeAdSlots,
    computeAdExtraSlots,
    computeSchedules,
    removeAd,
    trashAd,
    restoreAd,
    computeTrash,
    setAdDuration,
    setAdExpiry,
    normalizeDurationDays,
    pauseAd,
    resumeAd,
    sameAdvertiser,
} from '$lib/server/adsStore.js';
import { normalizePlanDays, planLabel } from '$lib/adPlans.js';
import { failReason } from '$lib/strapi.js';

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
    /** @type {any[]} */
    let schedules = [];
    /** @type {any[]} */
    let trash = [];
    let backendUnavailable = false;
    try {
        const all = await listAllForAdmin({ fetch, withDeleted: true });
        // האשפה: מה שנמחק (לשחזור) ומאושרות שפג תוקפן (לחידוש)
        trash = computeTrash(all);
        ads = all.filter((/** @type {any} */ a) => !a.deletedAt);
        // טבלת התזמון (כמו בגמ"ח הארצי): כל המאושרות - פורסם/פג/נותר + ניהול מהשורה
        schedules = computeSchedules(ads.filter((/** @type {any} */ a) => a.status === 'approved'));
        // מספר המקום של כל מאושרת בטור (1..12) - לתג ולבורר "מקום" בכרטיס
        const slotMap = computeAdSlots(ads.filter((/** @type {any} */ a) => a.status === 'approved'));
        // שכפל פרסומת - המקומות הנוספים האפקטיביים (1-based) של כל מאושרת
        const extraMap = computeAdExtraSlots(ads.filter((/** @type {any} */ a) => a.status === 'approved'));
        // editable = המנהל המחובר רשאי לפתוח את הפרסומת בעורך: שלו, או כל
        // פרסומת לסופר-אדמין. לאדמין רגיל עריכה של פרסומת של מפרסם אחר
        // נחסמת בשרת ממילא, ואין טעם להציג כפתור שיחזיר 404.
        const identity = { id: String(locals.user?.id ?? ''), email: locals.user?.email ?? '' };
        const superAdmin = isSuperAdmin(locals.user);
        ads = ads.map((/** @type {any} */ a) => ({
            ...a,
            ...(slotMap.has(a.id) ? { slot: slotMap.get(a.id) } : {}),
            // גובר על extraSlots הגולמי (0-based) של הרשומה
            extraSlots: extraMap.get(a.id) ?? [],
            editable: superAdmin || sameAdvertiser(a, identity),
            // השדות של כרטיס הטור (AdCard) בשמות שה-layout נותן להם - לתצוגה
            // המקדימה בריחוף/הקשה על הכותרת. הלוגו והתמונה כבר ברשומה.
            adStyle: a.landing?._adStyle ?? null,
            hover: a.hoverText,
            shop: Boolean(a.landing?._shopProduct),
        }));
    } catch (err) {
        console.error('admin/ads load failed:', err);
        backendUnavailable = true;
    }
    // חלון הקציבה (תקופה/תפוגה שרירותית) שמור לסופר-אדמין
    return { ads, schedules, trash, backendUnavailable, superAdmin: isSuperAdmin(locals.user) };
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
            return fail(502, { error: `האישור נכשל: ${failReason(err)}` });
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
            return fail(502, { error: `הדחייה נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההורדה נכשלה: ${failReason(err)}` });
        }
    },
    // "מחק" = לאשפה (אפשר לשחזר). שמור לסופר-אדמין; אדמין שמונה מוריד מהאתר
    remove: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'מחיקה שמורה לסופר-אדמין' });
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await trashAd(id, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            return { success: true, message: `"${r.title}" הועברה לאשפה - אפשר לשחזר אותה משם` };
        } catch (err) {
            console.error('remove failed:', err);
            return fail(502, { error: `המחיקה נכשלה: ${failReason(err)}` });
        }
    },
    // שחזור מהאשפה - למצב שהיה לפני המחיקה (מקום בטור ותוקף נשמרו)
    restore: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'שחזור שמור לסופר-אדמין' });
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await restoreAd(id, { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה באשפה' });
            return { success: true, message: `"${r.title}" שוחזרה ✅` };
        } catch (err) {
            console.error('restore failed:', err);
            return fail(502, { error: `השחזור נכשל: ${failReason(err)}` });
        }
    },
    // ריקון מהאשפה - מחיקה לצמיתות, בלי דרך חזרה
    purge: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'מחיקה שמורה לסופר-אדמין' });
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            await removeAd(id, { fetch, jwt: locals.jwt ?? '' });
            return { success: true, message: 'נמחקה לצמיתות' };
        } catch (err) {
            console.error('purge failed:', err);
            return fail(502, { error: `המחיקה נכשלה: ${failReason(err)}` });
        }
    },
    // קציבת תקופת פרסום - נספרת מיום האישור. שמורה לסופר-אדמין
    setDuration: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) {
            return fail(403, { error: 'קציבת תקופה שמורה לסופר-אדמין' });
        }
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
            return fail(502, { error: `קציבת התקופה נכשלה: ${failReason(err)}` });
        }
    },
    // תאריך תפוגה שרירותי מחלון הקציבה - הפרסומת יורדת בסוף היום שנבחר. שמור לסופר-אדמין
    setExpiry: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) {
            return fail(403, { error: 'קביעת תאריך תפוגה שמורה לסופר-אדמין' });
        }
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        const expires = String(form.get('expires') ?? '');
        if (!id || !expires) return fail(400, { error: 'חסר תאריך תפוגה' });
        const d = new Date(`${expires}T23:59:59`);
        if (isNaN(d.getTime())) return fail(400, { error: 'תאריך לא תקין' });
        try {
            const r = await setAdExpiry(id, d.toISOString(), { fetch, jwt: locals.jwt ?? '' });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            const day = new Date(r.expiresAt).toLocaleDateString('he-IL');
            const suffix = r.daysLeft < 0 ? ' - התאריך שנקבע כבר עבר, הפרסומת ירדה מהאתר' : '';
            return { success: true, message: `${r.title}: תפוגה נקבעה ל-${day}${suffix}` };
        } catch (err) {
            console.error('setExpiry failed:', err);
            return fail(502, { error: `קביעת התאריך נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההשהיה נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `ההפעלה מחדש נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `החלפת המקום נכשלה: ${failReason(err)}` });
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
            return fail(502, { error: `העברת המקום נכשלה: ${failReason(err)}` });
        }
    },
    // שכפל פרסומת: אותה פרסומת במקום נוסף בטור (סופר-אדמין)
    addExtraSlot: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'שכפל פרסומת שמור לסופר-אדמין' });
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        const raw = String(form.get('slot') ?? '');
        try {
            const r = await addAdExtraSlot(id, raw === 'same' ? 'same' : Number(raw), {
                fetch,
                jwt: locals.jwt ?? '',
            });
            if (!r) return fail(404, { error: 'הפרסומת לא נמצאה' });
            if (!r.ok) return fail(409, { error: r.error });
            return {
                success: true,
                message: `"${r.title}" שוכפלה גם ${r.slots.length > 1 ? 'למקומות' : 'למקום'} ${r.slots.join(', ')}`,
            };
        } catch (err) {
            console.error('addExtraSlot failed:', err);
            return fail(502, { error: `השכפול נכשל: ${failReason(err)}` });
        }
    },
    removeExtraSlot: async ({ request, locals, fetch }) => {
        ensureAdsAdmin(locals);
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'שכפל פרסומת שמור לסופר-אדמין' });
        const form = await request.formData();
        const id = String(form.get('id') ?? '');
        if (!id) return fail(400, { error: 'חסר מזהה פרסומת' });
        try {
            const r = await removeAdExtraSlot(id, Number(form.get('slot')), {
                fetch,
                jwt: locals.jwt ?? '',
            });
            if (!r) return fail(404, { error: 'השכפול לא נמצא' });
            return { success: true, message: `השכפול של "${r.title}" במקום ${r.slot} בוטל` };
        } catch (err) {
            console.error('removeExtraSlot failed:', err);
            return fail(502, { error: `ביטול השכפול נכשל: ${failReason(err)}` });
        }
    },
};
