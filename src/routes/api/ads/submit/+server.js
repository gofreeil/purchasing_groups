import { json, error } from '@sveltejs/kit';
import { submitAd } from '$lib/server/adsStore.js';
import { isOwnerCode, notifyOwnerCodeUse } from '$lib/server/adsCode.js';
import { normalizePlanDays } from '$lib/adPlans.js';

// קליטת פרסומת חדשה מה-builder - נשמרת ב-Strapi במצב "ממתינה לאישור".
// האישור עצמו ידני. חובה להיות מחובר: מודעה בלי submitted_by היא מודעה בלי
// בעלים — המפרסם לא יוכל לעולם לראות את הביצועים שלה, לערוך אותה או לחדש.
export async function POST({ request, fetch, locals }) {
    const user = locals.user;
    if (!user) {
        throw error(401, 'צריך להתחבר לפני השליחה — כך הפרסומת נשמרת על החשבון שלכם ותוכלו לעקוב אחריה ולערוך אותה');
    }

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
    const requestedDurationDays = normalizePlanDays(payload.requestedDurationDays);
    try {
        const ad = await submitAd(
            {
                submittedBy: {
                    id: String(user.id ?? ''),
                    email: user.email ?? '',
                    name: user.username ?? user.name ?? '',
                },
                title: payload.title,
                subtitle: payload.subtitle,
                payment: usedOwnerCode ? 'code' : 'pending',
                requestedDurationDays,
                hoverText: payload.hoverText ?? '',
                cta: payload.cta ?? '',
                gradient: payload.gradient,
                logo: payload.logo ?? '',
                mainImage: payload.mainImage,
                mainImageFit: payload.mainImageFit,
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
                submitter: { name: user.username ?? user.name ?? '', email: user.email ?? '' },
            });
        }
        return json({ ok: true, id: ad.id, status: ad.status });
    } catch (err) {
        console.error('ads/submit failed:', err);
        // תקרת koa-body של Strapi (~1MB) — שגיאה שהמפרסם יכול לתקן בעצמו
        if (err instanceof Error && err.message.includes('failed: 413')) {
            throw error(413, 'התמונות כבדות מדי - הקטינו תמונה ונסו שוב');
        }
        throw error(502, 'השליחה נכשלה - נסו שוב בעוד רגע');
    }
}
