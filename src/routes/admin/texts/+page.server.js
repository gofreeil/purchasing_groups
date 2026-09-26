import { fail, redirect } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { isSuperAdmin } from '$lib/auth.js';
import { translations } from '$lib/i18n.js';
import { flattenTexts } from '$lib/siteTexts.js';
import { getSiteContent, saveSiteContent, DEFAULT_MEMBERS } from '$lib/server/siteContentStore.js';

/** הטקסטים בעברית כפי שהם בקוד - ברירות המחדל שהעריכה דורסת. */
const defaultTexts = () => flattenTexts(/** @type {any} */ (get(translations)).he);

/**
 * עריכת כיתובי האתר ומונה החברים - סופר-אדמין בלבד.
 * נשמרות רק דריסות: טקסט שזהה לקוד (או שרוקן) חוזר לקוד. ראו siteTexts.js.
 */
export async function load({ locals, fetch }) {
    if (!isSuperAdmin(locals.user)) throw redirect(302, '/admin');

    const content = await getSiteContent({ fetch });
    return {
        texts: defaultTexts().map(({ path, value }) => ({
            path,
            defaultValue: value,
            value: content.texts[path] ?? value,
            edited: path in content.texts,
        })),
        members: content.members,
        defaultMembers: DEFAULT_MEMBERS,
    };
}

export const actions = {
    save: async ({ request, locals, fetch }) => {
        if (!isSuperAdmin(locals.user)) return fail(403, { error: 'אין הרשאה' });

        const fd = await request.formData();

        /** @type {Record<string, string>} */
        const texts = {};
        for (const { path, value } of defaultTexts()) {
            const raw = fd.get(`t:${path}`);
            if (typeof raw !== 'string') continue;
            // הדפדפן שולח שורות כ-\r\n; הקוד כתוב עם \n
            const next = raw.replace(/\r\n/g, '\n');
            if (next.trim() && next !== value) texts[path] = next;
        }

        const membersRaw = String(fd.get('members') ?? '').replace(/[^\d]/g, '');
        const membersNum = membersRaw ? Number(membersRaw) : 0;
        const members = membersNum > 0 && membersNum !== DEFAULT_MEMBERS ? membersNum : null;

        try {
            await saveSiteContent({ texts, members }, { fetch, jwt: locals.jwt ?? '' });
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            return fail(502, { error: `השמירה נכשלה: ${msg.slice(0, 160)}` });
        }
        return { ok: true, message: 'נשמר ומעודכן באתר ✅' };
    },
};
