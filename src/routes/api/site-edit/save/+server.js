import { json } from '@sveltejs/kit';
import { get } from 'svelte/store';
import { translations } from '$lib/i18n.js';
import { flattenTexts } from '$lib/siteTexts.js';
import { isTotpVerified } from '$lib/server/superAdminTotp.js';
import { getSiteContent, saveSiteContent, DEFAULT_MEMBERS } from '$lib/server/siteContentStore.js';
import { getCampaignForAdmin, saveCampaignOverride } from '$lib/server/campaignsStore.js';

// אותה רשימה כמו ב-SiteEditor - רק שדות טקסט פשוטים של עסקה
const CAMPAIGN_TEXT_FIELDS = new Set([
    'title',
    'description',
    'providers_line',
    'join_cta_subtitle',
    'new_badge_text',
    'plans_table_note',
    'plans_table_diesel_note',
]);

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

    // כיתובי עסקאות (campaign:<slug>:<שדה>) נשמרים כדריסה של העסקה עצמה.
    // שמירת עסקה קובעת מחדש את כל רשימת השדות הערוכים, ולכן שולחים גם את
    // השדות שכבר נערכו קודם - אחרת הם היו חוזרים לקוד.
    /** @type {Map<string, Record<string, any>>} */
    const campaignPatches = new Map();
    for (const [key, raw] of Object.entries(patch)) {
        const m = /^campaign:([\w-]+):(\w+)$/.exec(key);
        if (!m || typeof raw !== 'string' || !CAMPAIGN_TEXT_FIELDS.has(m[2])) continue;
        const changes = campaignPatches.get(m[1]) ?? {};
        changes[m[2]] = raw.replace(/\r\n/g, '\n').trim() || null;
        campaignPatches.set(m[1], changes);
    }

    const opts = { fetch: event.fetch, jwt: event.locals.jwt ?? '' };
    try {
        for (const [slug, changes] of campaignPatches) {
            const current = await getCampaignForAdmin(slug, { fetch: event.fetch });
            if (!current) continue;
            /** @type {Record<string, any>} */
            const full = {};
            for (const k of current.editedKeys ?? []) full[k] = current[k];
            await saveCampaignOverride(slug, { ...full, ...changes }, opts);
        }
        await saveSiteContent({ texts, members }, opts);
    } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        return json({ error: `השמירה נכשלה: ${msg.slice(0, 160)}` }, { status: 502 });
    }
    return json({ ok: true });
}
