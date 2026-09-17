import { isAdmin } from '$lib/auth.js';
import { isEventKind, trackSiteEvent } from '$lib/server/siteStats.js';

/**
 * רישום אירוע תנועה - נקרא מהדפדפן דרך $lib/track.js (sendBeacon).
 *
 * הספירה עוברת דרך שרת האתר ולא ישירות ל-Strapi: כך כתובת ה-API לא
 * חשופה בדפדפן, אפשר לסנן בוטים לפי User-Agent, ולא לספור את הצוות
 * עצמו - מנהל שמסתובב בפאנל ובודק את האתר היה מנפח את המספרים שלו.
 */
const BOT_UA =
    /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|headless|lighthouse|pingdom|uptime|monitor|vercel-screenshot/i;

export async function POST({ request, fetch, locals }) {
    const ua = request.headers.get('user-agent') ?? '';
    if (!ua || BOT_UA.test(ua) || isAdmin(locals.user)) {
        return new Response(null, { status: 204 });
    }

    /** @type {any} */
    let body = null;
    try {
        body = await request.json();
    } catch {
        return new Response(null, { status: 204 });
    }
    const kind = body?.kind;
    if (!isEventKind(kind)) return new Response(null, { status: 204 });
    const slug = typeof body?.slug === 'string' ? body.slug.trim().slice(0, 120) : '';

    try {
        await trackSiteEvent(kind, slug, { fetch });
    } catch (err) {
        // כשל בספירה לא אמור להפריע לגלישה - ללוג בלבד
        console.warn('[track] failed:', err instanceof Error ? err.message : err);
    }
    return new Response(null, { status: 204 });
}
