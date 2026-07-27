import { json, error } from '@sveltejs/kit';
import { submitAd } from '$lib/server/adsStore.js';
import { isOwnerCode, notifyOwnerCodeUse } from '$lib/server/adsCode.js';

// קליטת פרסומת חדשה מה-builder - נשמרת ב-Strapi במצב "ממתינה לאישור".
// אין דרישת התחברות (כמו במקור בקהילה בשכונה) - הסינון האמיתי הוא האישור הידני.
export async function POST({ request, fetch, locals }) {
    let payload;
    try {
        payload = await request.json();
    } catch {
        throw error(400, 'גוף הבקשה חייב להיות JSON תקין');
    }

    const required = ['title', 'subtitle', 'mainImage', 'gradient'];
    for (const k of required) {
        if (!payload?.[k] || typeof payload[k] !== 'string') {
            throw error(400, `חסר שדה: ${k}`);
        }
    }
    if (!payload.landing || typeof payload.landing !== 'object') {
        throw error(400, 'חסר אובייקט landing');
    }

    // הקוד מאומת כאן, בשרת — לא סומכים על דגל payment מהדפדפן
    const usedOwnerCode = isOwnerCode(payload.ownerCode);
    const requestedDurationDays = Number(payload.requestedDurationDays) === 180 ? 180 : 30;
    try {
        const ad = await submitAd(
            {
                submittedBy: locals.user
                    ? {
                        id: String(locals.user.id ?? ''),
                        email: locals.user.email ?? '',
                        name: locals.user.username ?? locals.user.name ?? '',
                    }
                    : undefined,
                title: payload.title,
                subtitle: payload.subtitle,
                payment: usedOwnerCode ? 'code' : 'pending',
                requestedDurationDays,
                hoverText: payload.hoverText ?? '',
                cta: payload.cta ?? '',
                gradient: payload.gradient,
                logo: payload.logo ?? '',
                mainImage: payload.mainImage,
                landing: {
                    headline: payload.landing.headline ?? '',
                    pitch: payload.landing.pitch ?? '',
                    extended: payload.landing.extended ?? '',
                    image: payload.landing.image ?? '',
                    advantages: [
                        payload.landing.advantages?.[0] ?? '',
                        payload.landing.advantages?.[1] ?? '',
                        payload.landing.advantages?.[2] ?? '',
                    ],
                    uniqueness: payload.landing.uniqueness ?? '',
                    phone: payload.landing.phone ?? '',
                    whatsapp: payload.landing.whatsapp ?? '',
                    website: payload.landing.website ?? '',
                    email: payload.landing.email ?? '',
                    address: payload.landing.address ?? '',
                    hours: payload.landing.hours ?? '',
                    products: Array.isArray(payload.landing.products) ? payload.landing.products : [],
                },
            },
            { fetch },
        );
        // התראה לבעלים על שימוש בקוד — לא חוסמת ולא מפילה את ההגשה
        if (usedOwnerCode) {
            await notifyOwnerCodeUse({
                adTitle: payload.title,
                durationDays: requestedDurationDays,
                submitter: locals.user
                    ? { name: locals.user.username ?? locals.user.name ?? '', email: locals.user.email ?? '' }
                    : null,
            });
        }
        return json({ ok: true, id: ad.id, status: ad.status });
    } catch (err) {
        console.error('ads/submit failed:', err);
        throw error(502, 'השליחה נכשלה - נסו שוב בעוד רגע');
    }
}
