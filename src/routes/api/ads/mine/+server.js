import { json, error } from '@sveltejs/kit';
import { getOwnAdForEdit } from '$lib/server/adsStore.js';

/**
 * GET /api/ads/mine?id=<documentId>
 *
 * התוכן המלא של פרסומת אחת של המשתמש המחובר - להזנת הבילדר בעריכה
 * ("ערוך" על שורה ב"הפרסומות שלי"). הבעלות מאומתת בשרת; מזהה שאינו
 * שייך לחשבון מחזיר 404 ולא 403, כדי לא להסגיר שהוא בכלל קיים.
 */
export async function GET({ url, locals, fetch }) {
    const user = locals.user;
    if (!user) throw error(401, 'צריך להתחבר');

    const id = (url.searchParams.get('id') ?? '').trim();
    if (!id) throw error(400, 'חסר מזהה פרסומת');

    const ad = await getOwnAdForEdit(
        id,
        { id: String(user.id ?? ''), email: user.email ?? '' },
        { fetch },
    ).catch(() => null);
    if (!ad) throw error(404, 'הפרסומת לא נמצאה או שאינה שייכת לחשבון הזה');

    const L = ad.landing ?? {};
    // רק מה שהבילדר צריך כדי להמשיך לערוך - תוכן ועיצוב. המפתחות
    // הפנימיים של landing (_order, _payment, _replacesAdId וכו') לא
    // יוצאים לדפדפן: הם ניהוליים, והבילדר היה מחזיר אותם בשליחה.
    return json({
        id: ad.id,
        status: ad.status,
        title: ad.title,
        subtitle: ad.subtitle,
        hoverText: ad.hoverText,
        cta: ad.cta,
        gradient: ad.gradient,
        logo: ad.logo,
        mainImage: ad.mainImage,
        mainImageFit: ad.mainImageFit ?? null,
        landing: {
            headline: L.headline ?? '',
            pitch: L.pitch ?? '',
            extended: L.extended ?? '',
            image: L.image ?? '',
            advantages: [L.advantages?.[0] ?? '', L.advantages?.[1] ?? '', L.advantages?.[2] ?? ''],
            uniqueness: L.uniqueness ?? '',
            phone: L.phone ?? '',
            whatsapp: L.whatsapp ?? '',
            website: L.website ?? '',
            email: L.email ?? '',
            address: L.address ?? '',
            hours: L.hours ?? '',
            products: Array.isArray(L.products) ? L.products : [],
        },
    });
}
