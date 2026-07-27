// מאגר הפרסומות שהועלו ע"י מפרסמים - מבוסס Strapi (כמו pg-satisfaction-responses).
// הועתק מאתר "קהילה בשכונה" (adsStore.ts) והותאם לקבוצות רכישה:
// אתר אחד, בלי שכונות, בלי תזכורות - רק שליחה / אישור / דחייה / תצוגה.
//
// Content type נדרש ב-Strapi: pg-submitted-ads עם השדות:
//   ad_status (string), title, subtitle, hover_text, cta, gradient (text),
//   logo (text ארוך - base64), main_image (text ארוך - base64), landing (JSON),
//   submitted_by_id, submitted_by_email, submitted_by_name, submitted_at,
//   decided_at, rejection_reason, expires_at, duration_days (number).
//
// אי אפשר להוסיף עמודות חדשות ל-content type (Strapi דוחה מפתחות לא מוכרים),
// לכן פרטי התשלום מהשליחה נארזים בתוך ה-JSON של landing:
//   landing._payment ("code" = הוזן קוד התנועה, כמו שולם | "pending" = לתיאום)
//   landing._requestedDurationDays (אחד ממסלולי adPlans) - התקופה שהמפרסם ביקש.

import { strapiGet, strapiPost, strapiPut } from '$lib/strapi.js';
import { DEFAULT_PLAN_DAYS, normalizePlanDays } from '$lib/adPlans.js';

const ENDPOINT = 'pg-submitted-ads';
export const DEFAULT_DURATION_DAYS = DEFAULT_PLAN_DAYS;

// קאש קצר לרשימת המאושרות - נטען בכל ניווט דרך ה-layout, אין צורך להציף את Strapi.
const TTL_MS = 120_000;
/** @type {{ at: number, list: any[] } | null} */
let approvedCache = null;

export function invalidateAdsCache() {
    approvedCache = null;
}

/** @param {any} row - רשומת Strapi v5 (שטוחה, עם documentId) */
function fromStrapi(row) {
    if (!row) return null;
    return {
        id: row.documentId,
        status: row.ad_status ?? 'pending',
        title: row.title ?? '',
        subtitle: row.subtitle ?? '',
        hoverText: row.hover_text ?? '',
        cta: row.cta ?? '',
        gradient: row.gradient ?? '',
        logo: row.logo ?? '',
        mainImage: row.main_image ?? '',
        landing: row.landing ?? {},
        submittedBy: {
            id: row.submitted_by_id ?? '',
            email: row.submitted_by_email ?? '',
            name: row.submitted_by_name ?? '',
        },
        submittedAt: row.submitted_at ?? row.createdAt ?? '',
        decidedAt: row.decided_at ?? '',
        rejectionReason: row.rejection_reason ?? '',
        expiresAt: row.expires_at ?? '',
        durationDays: row.duration_days ?? DEFAULT_DURATION_DAYS,
        // פרטי התשלום מהשליחה - ארוזים בתוך ה-JSON של landing (אין עמודות חדשות)
        payment: row.landing?._payment === 'code' ? 'code' : 'pending',
        requestedDurationDays: normalizePlanDays(row.landing?._requestedDurationDays),
    };
}

/**
 * שליחת פרסומת חדשה לבדיקה (ad_status: pending).
 * @param {any} payload
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function submitAd(payload, { fetch: f = fetch } = {}) {
    const res = await strapiPost(
        ENDPOINT,
        {
            ad_status: 'pending',
            title: payload.title,
            subtitle: payload.subtitle ?? '',
            hover_text: payload.hoverText ?? '',
            cta: payload.cta ?? '',
            gradient: payload.gradient ?? '',
            logo: payload.logo ?? '',
            main_image: payload.mainImage ?? '',
            landing: {
                ...(payload.landing ?? {}),
                _payment: payload.payment === 'code' ? 'code' : 'pending',
                _requestedDurationDays: normalizePlanDays(payload.requestedDurationDays),
            },
            submitted_by_id: payload.submittedBy?.id ?? '',
            submitted_by_email: payload.submittedBy?.email ?? '',
            submitted_by_name: payload.submittedBy?.name ?? '',
            submitted_at: new Date().toISOString(),
        },
        { fetch: f },
    );
    invalidateAdsCache();
    const row = res?.data;
    return { id: row?.documentId ?? '', status: 'pending' };
}

/**
 * רשימת פרסומות מאושרות - גרסה רזה לסיידבר (בלי פרטי המפרסם).
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function listApproved({ fetch: f = fetch } = {}) {
    if (approvedCache && Date.now() - approvedCache.at < TTL_MS) {
        return approvedCache.list;
    }
    try {
        const data = await strapiGet(
            ENDPOINT,
            {
                'filters[ad_status][$eq]': 'approved',
                sort: 'submitted_at:desc',
                'pagination[pageSize]': 25,
            },
            { fetch: f },
        );
        const now = Date.now();
        const list = (data?.data ?? [])
            .map(fromStrapi)
            .filter(Boolean)
            // אכיפת תוקף בזמן קריאה - פרסומת שפג תוקפה יורדת מהאתר אוטומטית.
            // רשומות ישנות בלי expires_at לא נפסלות.
            .filter((/** @type {any} */ a) => !a.expiresAt || Date.parse(a.expiresAt) > now)
            .map((/** @type {any} */ a) => ({
            id: a.id,
            title: a.title,
            subtitle: a.subtitle,
            cta: a.cta,
            hover: a.hoverText,
            gradient: a.gradient,
            mainImage: a.mainImage,
        }));
        approvedCache = { at: Date.now(), list };
        return list;
    } catch (err) {
        // כשל (למשל: ה-content type עדיין לא נוצר ב-Strapi) - קאש שלילי קצר
        // כדי שלא נציף את Strapi בבקשה כושלת בכל ניווט.
        console.warn('adsStore: listApproved failed', err instanceof Error ? err.message : err);
        approvedCache = { at: Date.now(), list: [] };
        return [];
    }
}

/**
 * שליפת פרסומת בודדת לפי documentId (לדף הנחיתה /ads/[id]).
 * @param {string} id
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getAd(id, { fetch: f = fetch } = {}) {
    try {
        const data = await strapiGet(`${ENDPOINT}/${encodeURIComponent(id)}`, {}, { fetch: f });
        return fromStrapi(data?.data);
    } catch {
        return null;
    }
}

/**
 * כל הפרסומות למסך האדמין (ממתינות + מאושרות + נדחות).
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function listAllForAdmin({ fetch: f = fetch } = {}) {
    const data = await strapiGet(
        ENDPOINT,
        { sort: 'submitted_at:desc', 'pagination[pageSize]': 100 },
        { fetch: f },
    );
    return (data?.data ?? []).map(fromStrapi).filter(Boolean);
}

/**
 * אישור פרסומת - קובע תוקף (ברירת מחדל: 30 יום).
 * @param {string} id
 * @param {{ durationDays?: number, fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function approveAd(id, { durationDays = DEFAULT_DURATION_DAYS, fetch: f = fetch, jwt = '' } = {}) {
    const days = normalizePlanDays(durationDays);
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        {
            ad_status: 'approved',
            decided_at: new Date().toISOString(),
            rejection_reason: '',
            duration_days: days,
            expires_at: expires.toISOString(),
        },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
}

/**
 * דחיית פרסומת (עם סיבה אופציונלית).
 * @param {string} id
 * @param {{ reason?: string, fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function rejectAd(id, { reason = '', fetch: f = fetch, jwt = '' } = {}) {
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        {
            ad_status: 'rejected',
            decided_at: new Date().toISOString(),
            rejection_reason: reason,
        },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
}
