import { error, fail, redirect } from '@sveltejs/kit';
import { isAdmin } from '$lib/auth.js';
import { EDITABLE_FIELDS, parseFieldValue } from '$lib/campaignFields.js';
import {
    getCampaignForAdmin,
    saveCampaignOverride,
    resetCampaignOverride,
} from '$lib/server/campaignsStore.js';

/**
 * עריכת תוכן עסקה. מה שנשמר כאן הוא *דריסה* על התוכן שבקוד
 * (campaigns.js): שדה שנשאר ריק חוזר לערך שבקוד, ו"אפס הכל" מוחק את
 * הדריסה כולה. ראו ההסבר בראש campaignsStore.js.
 */
export async function load({ params, locals, fetch }) {
    if (!isAdmin(locals.user)) throw redirect(302, '/admin');

    const campaign = await getCampaignForAdmin(params.slug, { fetch }).catch(() => null);
    if (!campaign) throw error(404, 'העסקה לא נמצאה');

    return { campaign };
}

export const actions = {
    save: async ({ params, request, locals, fetch }) => {
        if (!isAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });

        const fd = await request.formData();

        /** @type {Record<string, any>} */
        const patch = {};
        for (const field of EDITABLE_FIELDS) {
            // checkbox שלא סומן אינו נשלח כלל - צריך לקרוא אותו כ-false ולא לדלג
            if (field.type !== 'boolean' && !fd.has(field.key)) continue;
            try {
                patch[field.key] = parseFieldValue(field, fd.get(field.key));
            } catch (err) {
                return fail(400, { error: err instanceof Error ? err.message : 'ערך לא תקין' });
            }
        }

        try {
            await saveCampaignOverride(params.slug, patch, { fetch, jwt: locals.jwt ?? '' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            // 403/401 = ההרשאה ל-pg-campaign עדיין לא נפתחה בצד Strapi
            if (/\b(401|403)\b/.test(msg)) {
                return fail(403, {
                    error: 'Strapi דחה את השמירה - יש לפתוח הרשאת create/update ל-pg-campaign עבור תפקיד authenticated',
                });
            }
            return fail(502, { error: `השמירה נכשלה: ${msg.slice(0, 160)}` });
        }
        return { ok: true, message: 'התוכן נשמר ומעודכן באתר ✅' };
    },

    reset: async ({ params, locals, fetch }) => {
        if (!isAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });
        try {
            const removed = await resetCampaignOverride(params.slug, { fetch, jwt: locals.jwt ?? '' });
            return {
                ok: true,
                message: removed ? 'העסקה חזרה לתוכן שבקוד' : 'לא היו עריכות - התוכן ממילא מהקוד',
            };
        } catch (err) {
            return fail(502, {
                error: `האיפוס נכשל: ${err instanceof Error ? err.message.slice(0, 160) : ''}`,
            });
        }
    },
};
