import { fail } from '@sveltejs/kit';
import { requestPasswordReset, RecoveryError } from '$lib/server/recovery.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** מילוי מראש כשמגיעים מדף ההתחברות עם האימייל שכבר הוקלד שם. */
export function load({ url }) {
    const email = (url.searchParams.get('email') || '').trim().slice(0, 254);
    return { email: EMAIL_RE.test(email) ? email : '' };
}

export const actions = {
    send: async ({ request, url, fetch }) => {
        const form = await request.formData();
        const email = String(form.get('email') || '').trim();
        if (!EMAIL_RE.test(email)) {
            return fail(400, { error: 'כתובת האימייל לא נראית תקינה. בדוק שהקלדת אותה נכון.', email });
        }
        try {
            await requestPasswordReset(email, url.origin, fetch);
        } catch (err) {
            if (err instanceof RecoveryError && err.kind === 'rate') {
                return fail(429, { error: 'ביקשת יותר מדי פעמים. נסה שוב בעוד כמה דקות.', email });
            }
            console.warn('forgot-password failed:', err instanceof Error ? err.message : err);
            return fail(503, { error: 'תקלה זמנית בשליחת המייל. נסה שוב בעוד רגע.', email });
        }
        return { sent: true, email, at: Date.now() };
    },
};
