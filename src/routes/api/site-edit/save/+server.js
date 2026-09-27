import { json } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { translations } from '$lib/i18n.js';
import { flattenTexts } from '$lib/siteTexts.js';
import { isTotpVerified } from '$lib/server/superAdminTotp.js';
import { getSiteContent, saveSiteContent, DEFAULT_MEMBERS } from '$lib/server/siteContentStore.js';

/**
 * שמירת עריכה מתוך האתר: רק הכיתובים שנשלחו משתנים, השאר נשארים כפי
 * שנשמרו. טקסט שחזר להיות זהה לקוד (או רוקן) - הדריסה שלו נמחקת.
 * דורש סופר-אדמין שאימת קוד Google Authenticator (ראו superAdminTotp.js).
 */
export async function POST(event) {
    if (!(await isTotpVerified(event))) return json({ error: 'נדרש אימות קוד' }, { status: 401 });

    const body = await event.request.json().catch(() => null);
    /** @type {Record<string, unknown>} */
    const patch = body?.texts && typeof body.texts === 'object' ? body.texts : {};

    const defaults = new Map(
        flattenTexts(/** @type {any} */ (get(translations)).he).map((t) => [t.path, t.value]),
    );
    const current = await getSiteContent({ fetch: event.fetch });
    const texts = { ...current.texts };
    for (const [path, raw] of Object.entries(patch)) {
        if (!defaults.has(path) || typeof raw !== 'string') continue;
        const value = raw.replace(/\r\n/g, '\n');
        if (!value.trim() || value === defaults.get(path)) delete texts[path];
        else texts[path] = value;
    }

    let members = current.members;
    if (body?.members !== undefined) {
        const n = Number(String(body.members).replace(/[^\d]/g, ''));
        members = n > 0 && n !== DEFAULT_MEMBERS ? n : null;
    }

    try {
        await saveSiteContent({ texts, members }, { fetch: event.fetch, jwt: event.locals.jwt ?? '' });
    } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        return json({ error: `השמירה נכשלה: ${msg.slice(0, 160)}` }, { status: 502 });
    }
    return json({ ok: true });
}
