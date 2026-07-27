import { error, fail } from '@sveltejs/kit';
import { isSuperAdmin } from '$lib/auth.js';
import { listAllForAdmin, approveAd, rejectAd } from '$lib/server/adsStore.js';
import { normalizePlanDays, planLabel } from '$lib/adPlans.js';

// מסך אישור פרסומות - super_admin בלבד (גרסה פשוטה של ads-review מקהילה בשכונה).

/** @param {any} locals */
function ensureSuperAdmin(locals) {
    if (!isSuperAdmin(locals.user)) {
        throw error(403, 'נדרשת הרשאת מנהל ראשי');
    }
}

export async function load({ locals, fetch }) {
    ensureSuperAdmin(locals);
    let ads = [];
    let backendUnavailable = false;
    try {
        ads = await listAllForAdmin({ fetch });
    } catch (err) {
        console.error('admin/ads load failed:', err);
        backendUnavailable = true;
    }
    return { ads, backendUnavailable };
}

export const actions = {
    approve: async ({ request, locals, fetch }) => {
        ensureSuperAdmin(locals);
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
        ensureSuperAdmin(locals);
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
};
