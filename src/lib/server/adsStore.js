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
//   landing._mainImageFit ({ x, y, z }) - מיקום+זום התמונה הראשית מהבילדר.

import { strapiGet, strapiPost, strapiPut } from '$lib/strapi.js';
import { DEFAULT_PLAN_DAYS, normalizePlanDays } from '$lib/adPlans.js';
import { parseAdImageFit } from '$lib/adImageFit.js';
import { AD_SLOT_COUNT } from '$lib/adSlots.js';
import { imageStamp, decodeDataImage } from './inlineImage.js';

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
    const logo = row.logo ?? '';
    const mainImage = row.main_image ?? '';
    // גם תמונות דף הנחיתה נכנסות לחותם: כולן מוגשות מאותה כתובת עם אותו ?v=,
    // ולכן החלפת אחת מהן חייבת להחליף אותו - אחרת קאש ה-immutable יחזיק ישנה.
    const landingImages = [
        typeof row.landing?.image === 'string' ? row.landing.image : '',
        ...(Array.isArray(row.landing?.products)
            ? row.landing.products.map((/** @type {any} */ p) => p?.image ?? '')
            : []),
    ];
    return {
        id: row.documentId,
        status: row.ad_status ?? 'pending',
        title: row.title ?? '',
        subtitle: row.subtitle ?? '',
        hoverText: row.hover_text ?? '',
        cta: row.cta ?? '',
        gradient: row.gradient ?? '',
        logo,
        mainImage,
        // חותם התוכן של התמונות, לשימוש כ-?v= בכתובת שלהן: כך אפשר להגיש
        // אותן בקאש immutable ועדיין להחליף תמונה בלי שגולש יראה ישנה.
        // ראה adImageUrl / imageStamp.
        imgVersion: imageStamp(logo, mainImage, ...landingImages),
        // מודעות שנשלחו לפני הפיצ'ר - בלי fit; התצוגות משאירות אותן כפי שהיו
        mainImageFit: row.landing?._mainImageFit ? parseAdImageFit(row.landing._mainImageFit) : undefined,
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
        // המפרסם הקליד את קוד הבעלים — בקשה לפרסום חינם, לא אישור שלה
        codeRequested: row.landing?._codeRequested === true,
        requestedDurationDays: normalizePlanDays(row.landing?._requestedDurationDays),
        // מספר המקום בטור הפרסומות, 0-based (0 = מקום 1). המספר קבוע
        // לפרסומת: הוא לא זז כשמאשרים פרסומות אחרות, ונשמר לה גם דרך
        // השהיה ופקיעה. undefined = פרסומת ותיקה שטרם הוקצה לה מספר
        // (מקבלת אחד בפעולת הניהול/האישור הבאה, לפי מקומה הנוכחי על האתר).
        order: typeof row.landing?._order === 'number' ? row.landing._order : undefined,
        // השהיה: יורדת מהאתר ושומרת את הימים שנותרו לה
        paused: row.landing?._paused === true,
        pausedDaysLeft:
            typeof row.landing?._pausedDaysLeft === 'number' ? row.landing._pausedDaysLeft : undefined,
        // ----- עדכון של פרסומת קיימת -----
        // כשמפרסם עורך פרסומת שלו ושולח, נוצרת רשומה חדשה שמקושרת לישנה.
        // האישור מוריד את המקושרת ויורש ממנה את המקום בטור ואת תאריך
        // הסיום, כך שהעדכון נכנס בדיוק במקומה ולא כפרסומת נוספת.
        replacesAdId: typeof row.landing?._replacesAdId === 'string' ? row.landing._replacesAdId : '',
        replacesTitle: typeof row.landing?._replacesTitle === 'string' ? row.landing._replacesTitle : '',
        // הוחלפה בגרסה מעודכנת - היסטוריה, ולא פרסומת שנדחתה. מסוננת
        // ממסך הניהול ומ"הפרסומות שלי" כדי שלא תיראה כדחייה אמיתית.
        superseded: row.landing?._superseded === true,
    };
}

/** סדר התצוגה: קודם מי שקיבל מיקום ידני, אחריו החדשות ביותר.
 *  @param {any} a @param {any} b */
function byDisplayOrder(a, b) {
    const ao = a.order ?? Number.MAX_SAFE_INTEGER;
    const bo = b.order ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return Date.parse(b.submittedAt || 0) - Date.parse(a.submittedAt || 0);
}

/**
 * שליחת פרסומת לבדיקה (ad_status: pending).
 *
 * payload.editOfAdId = עריכה של פרסומת קיימת ("ערוך" על שורה מסוימת
 * ב"הפרסומות שלי"). הגרסה החדשה נכנסת כבקשה חדשה שמקושרת לישנה, ולא
 * דורסת אותה: מה שרץ על האתר נשאר באוויר עד שהעדכון יאושר, ורק אז
 * מתחלף בו - באותו מקום בטור ועם אותו תאריך סיום. מזהה שאינו שייך
 * למפרסם (טעות או ניחוש) פשוט לא מכובד, והשליחה נכנסת כפרסומת חדשה.
 *
 * @param {any} payload
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function submitAd(payload, { fetch: f = fetch } = {}) {
    const target = payload.editOfAdId
        ? await getOwnAdForEdit(payload.editOfAdId, payload.submittedBy ?? {}, { fetch: f })
        : null;

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
                // הגשה לעולם לא נכנסת כ"שולם". קוד הבעלים הוא *בקשה* לפרסום
                // חינם, והזכות עצמה ניתנת רק באישור הידני של האדמין.
                _payment: 'pending',
                _codeRequested: payload.payment === 'code',
                _requestedDurationDays: normalizePlanDays(payload.requestedDurationDays),
                _mainImageFit: parseAdImageFit(payload.mainImageFit),
                // הקישור לפרסומת שהעדכון בא להחליף. הכותרת נשמרת לצידו
                // כדי שמסך הניהול יוכל לומר "עדכון ל..." בלי שליפה נוספת.
                ...(target ? { _replacesAdId: target.id, _replacesTitle: target.title } : {}),
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
    const id = row?.documentId ?? '';
    // עדכונים קודמים לאותה פרסומת שעדיין ממתינים לא נשארים בתור: האדמין
    // אמור לראות בקשה אחת - האחרונה - ולא שלוש שנראות כפולות.
    if (target && id) await retireStalePendingEdits(target.id, id, { fetch: f });
    return { id, status: 'pending', replacesAdId: target?.id ?? '', replacesTitle: target?.title ?? '' };
}

/**
 * מוריד מהתור גרסה שהוחלפה: לא "נדחתה" - הוחלפה. הסימון חי בתוך
 * ה-landing (אין עמודה בסכמה), ולכן חובה לשלוח את כל האובייקט - Strapi
 * מחליף עמודת json במלואה.
 * @param {any} ad הרשומה כפי שחזרה מ-fromStrapi (עם landing מלא)
 * @param {string} successorId
 * @param {string} reason
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
async function retireAd(ad, successorId, reason, { fetch: f = fetch, jwt = '' } = {}) {
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(ad.id)}`,
        {
            ad_status: 'rejected',
            decided_at: new Date().toISOString(),
            rejection_reason: reason,
            expires_at: '',
            landing: { ...(ad.landing ?? {}), _superseded: true, _supersededBy: successorId },
        },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
}

/**
 * עדכונים ממתינים ישנים לאותה פרסומת - יורדים מהתור כשנשלח עדכון חדש.
 * כישלון כאן לא מפיל את השליחה: הגרסה החדשה כבר נשמרה, והכפילות בתור
 * היא אי-נוחות לאדמין ולא אובדן נתונים.
 * @param {string} targetId
 * @param {string} successorId
 * @param {{ fetch?: typeof fetch }} [opts]
 */
async function retireStalePendingEdits(targetId, successorId, { fetch: f = fetch } = {}) {
    try {
        /** @type {Record<string, string>} */
        const params = {
            'filters[ad_status][$eq]': 'pending',
            sort: 'submitted_at:desc',
            'pagination[pageSize]': '50',
        };
        // בלי logo ו-main_image: הן ה-base64 הכבד, וכאן צריך רק את הקישור
        ['ad_status', 'title', 'landing', 'submitted_at'].forEach((fld, i) => {
            params[`fields[${i}]`] = fld;
        });
        const data = await strapiGet(ENDPOINT, params, { fetch: f });
        const stale = (data?.data ?? [])
            .map(fromStrapi)
            .filter(Boolean)
            .filter(
                (/** @type {any} */ a) =>
                    a.id !== successorId && a.replacesAdId === targetId && !a.superseded,
            );
        for (const ad of stale) {
            await retireAd(ad, successorId, 'הוחלפה בגרסה מעודכנת שהמפרסם שלח', { fetch: f });
        }
    } catch (err) {
        console.warn(
            'adsStore: retireStalePendingEdits failed',
            err instanceof Error ? err.message : err,
        );
    }
}

/**
 * הפרסומות המאושרות שחיות עכשיו על האתר, בסדר התצוגה (לפי מספר המקום).
 *
 * מחזירה את הרשומות המלאות - כולל התמונות כ-base64 - ולא גרסה רזה: כך גם
 * נתיב התמונה (/api/ad-image) נשען על אותו cache בלי סיבוב נוסף ל-Strapi.
 * הצמצום לשדות שהרכיבים באמת קוראים נעשה ב-+layout.server.js, שם גם
 * התמונות מומרות לכתובת - ואסור להחזיר מכאן ישירות לדפדפן.
 *
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
        const live = (data?.data ?? [])
            .map(fromStrapi)
            .filter(Boolean)
            // אכיפת תוקף בזמן קריאה - פרסומת שפג תוקפה יורדת מהאתר אוטומטית.
            // רשומות ישנות בלי expires_at לא נפסלות.
            .filter((/** @type {any} */ a) => !a.expiresAt || Date.parse(a.expiresAt) > now)
            // פרסומת מושהית יורדת מהאתר ושומרת את הימים שנותרו לה
            .filter((/** @type {any} */ a) => !a.paused);
        // מספר המקום (1..12) קובע גם את סדר הפרסומות וגם אילו משבצות פנויות
        // מוצגות סביבן בטור. מחושב בזיכרון בלבד - נתיב קריאה לא כותב
        // ל-Strapi; הקיבוע נעשה בפעולות הניהול.
        const slots = computeSlots(live);
        const list = [...live].sort(
            (/** @type {any} */ a, /** @type {any} */ b) =>
                (slots.get(a.id) ?? 0) - (slots.get(b.id) ?? 0),
        );
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

// ============================================================
// הגשת תמונות הפרסומת ככתובת, לא כ-base64 בתוך הדף
// ------------------------------------------------------------
// התמונות שמורות ב-Strapi כ-data:image/...;base64 בתוך הרשומה. כשה-layout
// החזיר אותן כמות שהן, כל טעינת דף *באתר כולו* סחבה אותן שוב: 1,700KB מתוך
// דף של 1,777KB היו base64 (96%), וכל תמונה נשלחה פעמיים - פעם ב-HTML של
// ה-SSR ופעם בנתוני ההידרציה. הכל נספר כ-Fast Origin Transfer של Vercel,
// ומכסה חודשית שלמה נשרפת בכמה אלפי צפיות.
//
// במקום זה ה-layout מחזיר כתובת ל-/api/ad-image/<id>/<kind>, והתמונה נשלפת
// פעם אחת ונשמרת בקאש של הדפדפן ושל הקצה - כך היא לא נספרת שוב בכל צפייה.
// ============================================================

/**
 * logo/main הן תמונות הכרטיס בטור. landing ו-product-<n> הן של דף הנחיתה
 * (/ads/<id>) - הדף שאליו מגיעה כל לחיצה על פרסומת, ולכן גם הוא חייב להגיש
 * תמונות מכתובת ולא מוטבעות. הוא היה הדף הכבד באתר: 2,020KB לצפייה, 98%
 * מהם base64 - יותר ממה שדף הבית שקל לפני התיקון.
 * @typedef {'logo' | 'main' | 'landing' | `product-${number}`} AdImageKind
 */

/**
 * @param {string | undefined} v
 * @returns {v is AdImageKind}
 */
export function isAdImageKind(v) {
    if (!v) return false;
    return v === 'logo' || v === 'main' || v === 'landing' || /^product-\d+$/.test(v);
}

/** @param {any} ad @param {AdImageKind} kind @returns {string} */
function pickImage(ad, kind) {
    if (kind === 'logo') return ad.logo ?? '';
    if (kind === 'main') return ad.mainImage ?? '';
    if (kind === 'landing') return ad.landing?.image ?? '';
    const idx = Number(kind.slice('product-'.length));
    return ad.landing?.products?.[idx]?.image ?? '';
}

/**
 * הכתובת שבה הצרכן (RightAdBanner / המגירה בנייד) ימשוך את התמונה.
 * ריק נשאר ריק (הצרכן בודק אמת/שקר), וערך שאינו data: - למשל כתובת חיצונית
 * במודעה ותיקה - עובר כמות שהוא.
 * @param {any} ad
 * @param {AdImageKind} kind
 * @returns {string}
 */
export function adImageUrl(ad, kind) {
    const raw = pickImage(ad, kind);
    if (!raw) return '';
    if (!raw.startsWith('data:')) return raw;
    return `/api/ad-image/${ad.id}/${kind}?v=${ad.imgVersion}`;
}

/**
 * אותה רשומה, כשכל שדות התמונה שבה הוחלפו בכתובות - לדף הנחיתה /ads/<id>,
 * שמחזיר את הפרסומת המלאה ולכן סחב את כל התמונות המוטבעות. חל על פרסומת
 * מאושרת בלבד, כי הנתיב מגיש מאושרות בלבד.
 * @param {any} ad
 * @returns {any}
 */
export function withAdImageUrls(ad) {
    if (!ad || ad.status !== 'approved') return ad;
    const products = Array.isArray(ad.landing?.products)
        ? ad.landing.products.map((/** @type {any} */ p, /** @type {number} */ i) => ({
            ...p,
            image: p?.image ? adImageUrl(ad, `product-${i}`) : '',
        }))
        : [];
    return {
        ...ad,
        logo: adImageUrl(ad, 'logo'),
        mainImage: adImageUrl(ad, 'main'),
        landing: { ...ad.landing, image: adImageUrl(ad, 'landing'), products },
    };
}

/**
 * הבייטים עצמם, לנתיב שמגיש אותם. נשלף מרשימת המאושרות שב-cache: בלי
 * round-trip ל-Strapi, וגם כשומר סף - תמונות של פרסומת שלא אושרה (או
 * שהורדה מהאתר) לא נחשפות דרך ניחוש מזהה.
 * @param {string} id
 * @param {AdImageKind} kind
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {Promise<{ mime: string, bytes: ArrayBuffer } | null>}
 */
export async function getApprovedAdImage(id, kind, { fetch: f = fetch } = {}) {
    const list = await listApproved({ fetch: f });
    let ad = list.find((/** @type {any} */ a) => a.id === id);
    // listApproved מסננת מושהות ופגות-תוקף ומוגבלת ל-25 הראשונות - אבל דף
    // הנחיתה /ads/<id> של פרסומת *מושהית* עדיין נטען (הוא חוסם רק פגות תוקף).
    // בלי הנפילה הזו כל התמונות שלו היו מחזירות 404 והדף היה נשבר.
    // הנתיב האיטי רץ רק כשהתמונה לא בקאש של הקצה, כלומר כמעט אף פעם.
    if (!ad) {
        const direct = await getAd(id, { fetch: f });
        if (direct?.status === 'approved') ad = direct;
    }
    if (!ad) return null;
    return decodeDataImage(pickImage(ad, kind));
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
    // גרסה שהוחלפה בעדכון מאושר לא מוצגת: היא לא "נדחתה" ולא ממתינה -
    // היא ההיסטוריה של פרסומת שכבר רצה על האתר בגרסה חדשה יותר.
    return (data?.data ?? [])
        .map(fromStrapi)
        .filter(Boolean)
        .filter((/** @type {any} */ a) => !a.superseded);
}

/**
 * אישור פרסומת - קובע תוקף (ברירת מחדל: 30 יום).
 * @param {string} id
 * @param {{ durationDays?: number, fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function approveAd(id, { durationDays = DEFAULT_DURATION_DAYS, fetch: f = fetch, jwt = '' } = {}) {
    const days = normalizePlanDays(durationDays);
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // ----- מספר המקום בטור (1..12) -----
    // ברירת המחדל: פרסומת חדשה תופסת את המספר הפנוי הנמוך ביותר ואף אחת
    // לא זזה ממקומה. פרסומת שהורדה ואושרה מחדש חוזרת למקומה הקודם אם
    // הוא עדיין פנוי.
    /** @type {number | undefined} */
    let slot;
    /** @type {any} */
    let landing;
    // הפרסומת שהאישור הזה בא להחליף (עדכון שמפרסם שלח על פרסומת קיימת)
    /** @type {any} */
    let replaced = null;
    try {
        const all = await listAllForAdmin({ fetch: f });
        const current = all.find((/** @type {any} */ a) => a.id === id);
        landing = current?.landing;
        replaced = current?.replacesAdId
            ? all.find(
                  (/** @type {any} */ a) =>
                      a.id === current.replacesAdId && a.status === 'approved',
              ) ?? null
            : null;
        const approvedNow = all.filter(
            (/** @type {any} */ a) => a.status === 'approved' && a.id !== id,
        );
        const slots = await ensureSlotsPersisted(approvedNow, { fetch: f, jwt });
        const taken = new Set(slots.values());
        if (typeof current?.order === 'number' && current.order >= 0 && !taken.has(current.order)) {
            slot = current.order;
        } else {
            slot = 0;
            while (taken.has(slot)) slot++;
        }
        // עדכון נכנס *במקום* הפרסומת שהוא מחליף - אותה משבצת בדיוק,
        // גם אם היא תפוסה כרגע על ידה: היא יורדת מיד אחרי האישור.
        if (replaced && typeof replaced.order === 'number' && replaced.order >= 0) {
            slot = replaced.order;
        }
    } catch (err) {
        // כשל בהקצאה לא מפיל אישור - הפרסומת תקבל מספר בפעולת הניהול הבאה
        console.warn('adsStore: slot assignment failed', err instanceof Error ? err.message : err);
    }

    // התקופה שכבר שולמה ממשיכה כרגיל: עדכון תוכן לא מאריך ולא מקצר
    // אותה, ולכן העדכון יורש את תאריך הסיום של הפרסומת שהוא מחליף.
    const inheritedExpiry =
        replaced?.expiresAt && Date.parse(replaced.expiresAt) > Date.now() ? replaced.expiresAt : '';

    /** @type {Record<string, unknown>} */
    const data = {
        ad_status: 'approved',
        decided_at: new Date().toISOString(),
        rejection_reason: '',
        duration_days: inheritedExpiry ? (replaced.durationDays ?? days) : days,
        expires_at: inheritedExpiry || expires.toISOString(),
    };
    // Strapi מחליף עמודת json במלואה - שולחים את כל ה-landing עם המספר
    if (slot !== undefined && landing !== undefined) {
        data.landing = { ...(landing ?? {}), _order: slot };
    }
    await strapiPut(`${ENDPOINT}/${encodeURIComponent(id)}`, data, { fetch: f, jwt });
    // רק אחרי שהעדכון באוויר מורידים את הישנה - כך אין רגע שבו המשבצת
    // ריקה, וכישלון באמצע משאיר את הישנה חיה במקום כלום.
    if (replaced) {
        await retireAd(replaced, id, 'הוחלפה בגרסה מעודכנת שאושרה', { fetch: f, jwt }).catch(
            (/** @type {unknown} */ err) =>
                console.warn(
                    'adsStore: retire replaced ad failed',
                    err instanceof Error ? err.message : err,
                ),
        );
    }
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

/**
 * הורדת פרסומת מהאתר בלי למחוק אותה - חוזרת לממתינות והתוקף מתאפס,
 * כדי שהמשבצת תתפנה מיד. אישור מחדש מחזיר אותה לאוויר.
 * @param {string} id
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
export async function unapproveAd(id, { fetch: f = fetch, jwt = '' } = {}) {
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        {
            ad_status: 'pending',
            decided_at: '',
            expires_at: '',
            rejection_reason: '',
        },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
}

const MIN_DURATION_DAYS = 1;
const MAX_DURATION_DAYS = 730;

/** מנרמל קלט ימים מהטופס לטווח שפוי. @param {unknown} raw */
export function normalizeDurationDays(raw) {
    const n = Math.round(Number(raw));
    if (!Number.isFinite(n)) return DEFAULT_DURATION_DAYS;
    return Math.min(MAX_DURATION_DAYS, Math.max(MIN_DURATION_DAYS, n));
}

/**
 * קוצב לפרסומת תקופה חדשה. התקופה נספרת מיום האישור, ולכן קציבה קצרה
 * מהזמן שכבר רץ מורידה את הפרסומת מהאתר מיד - וזו המשמעות של "לקצוב".
 * @param {string} id
 * @param {number} days
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,expiresAt:string,daysLeft:number}|null>}
 */
export async function setAdDuration(id, days, { fetch: f = fetch, jwt = '' } = {}) {
    const ad = await getAd(id, { fetch: f });
    if (!ad) return null;
    const from = ad.decidedAt || ad.submittedAt || new Date().toISOString();
    const expires = new Date(new Date(from).getTime() + days * 24 * 60 * 60 * 1000);
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        { duration_days: days, expires_at: expires.toISOString() },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
    return {
        title: ad.title,
        expiresAt: expires.toISOString(),
        daysLeft: Math.ceil((expires.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
    };
}

/**
 * קובע תאריך תפוגה שרירותי (מחלון הקציבה). המשך (duration_days) נגזר
 * ממנו ביחס ליום האישור, כדי שהתצוגה תמשיך להציג משך עקבי.
 * @param {string} id
 * @param {string} expiresIso
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,expiresAt:string,daysLeft:number}|null>}
 */
export async function setAdExpiry(id, expiresIso, { fetch: f = fetch, jwt = '' } = {}) {
    const ad = await getAd(id, { fetch: f });
    if (!ad) return null;
    const expires = new Date(expiresIso);
    if (isNaN(expires.getTime())) return null;
    const DAY = 24 * 60 * 60 * 1000;
    const from = ad.decidedAt || ad.submittedAt || new Date().toISOString();
    const days = Math.max(0, Math.ceil((expires.getTime() - Date.parse(from)) / DAY));
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        { duration_days: days, expires_at: expires.toISOString() },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
    return {
        title: ad.title,
        expiresAt: expires.toISOString(),
        daysLeft: Math.ceil((expires.getTime() - Date.now()) / DAY),
    };
}

/**
 * השהיה: הפרסומת יורדת מהאתר אבל שומרת את הימים שנותרו לה. בשונה
 * מ"הורד מהאתר" - המפרסם לא מפסיד ימים ששילם עליהם.
 * @param {string} id
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,daysLeft:number}|null>}
 */
export async function pauseAd(id, { fetch: f = fetch, jwt = '' } = {}) {
    const ad = await getAd(id, { fetch: f });
    if (!ad) return null;
    if (ad.paused) return { title: ad.title, daysLeft: ad.pausedDaysLeft ?? 0 };
    const DAY = 24 * 60 * 60 * 1000;
    const daysLeft = ad.expiresAt
        ? Math.max(0, Math.ceil((Date.parse(ad.expiresAt) - Date.now()) / DAY))
        : (ad.durationDays || DEFAULT_DURATION_DAYS);
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        { landing: { ...(ad.landing ?? {}), _paused: true, _pausedDaysLeft: daysLeft } },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
    return { title: ad.title, daysLeft };
}

/**
 * המשך אחרי השהיה: הימים שנשמרו נספרים מחדש מהיום.
 * @param {string} id
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,expiresAt:string,daysLeft:number}|null>}
 */
export async function resumeAd(id, { fetch: f = fetch, jwt = '' } = {}) {
    const ad = await getAd(id, { fetch: f });
    if (!ad) return null;
    const DAY = 24 * 60 * 60 * 1000;
    const daysLeft = ad.pausedDaysLeft ?? ad.durationDays ?? DEFAULT_DURATION_DAYS;
    const expires = new Date(Date.now() + daysLeft * DAY);
    const landing = { ...(ad.landing ?? {}) };
    delete landing._paused;
    delete landing._pausedDaysLeft;
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(id)}`,
        { landing, expires_at: expires.toISOString(), ad_status: 'approved' },
        { fetch: f, jwt },
    );
    invalidateAdsCache();
    return { title: ad.title, expiresAt: expires.toISOString(), daysLeft };
}

// ----- מקומות ממוספרים בטור הפרסומות (1..12) -----

/**
 * כותב מספר מקום לפרסומת. המספר נשמר ב-landing._order, אותה עמודת json
 * שכבר נושאת מפתחות פנימיים (_payment, _paused) - בלי שינוי סכמה
 * ב-Strapi. שולחים את כל אובייקט ה-landing כי Strapi מחליף עמודת json
 * במלואה, ומפתח חסר היה נמחק.
 * @param {any} ad
 * @param {number} order
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 */
async function writeOrder(ad, order, { fetch: f = fetch, jwt = '' } = {}) {
    await strapiPut(
        `${ENDPOINT}/${encodeURIComponent(ad.id)}`,
        { landing: { ...(ad.landing ?? {}), _order: order } },
        { fetch: f, jwt },
    );
}

/**
 * המספר האפקטיבי של כל פרסומת ברשימה (0-based). מי שכבר נקבע לה מספר -
 * שומרת עליו (בהתנגשות, הראשונה בסדר התצוגה גוברת); מי שאין לה מקבלת את
 * המספר הפנוי הנמוך ביותר, לפי סדר התצוגה הנוכחי. כך פרסומות ותיקות בלי
 * מספר מקבלות בדיוק את מקומן של היום - ההקצאה הראשונה לא מזיזה כלום.
 * @param {any[]} list
 * @returns {Map<string, number>}
 */
function computeSlots(list) {
    /** @type {Map<string, number>} */
    const bySlot = new Map();
    /** @type {Set<number>} */
    const taken = new Set();
    const display = [...list].sort(byDisplayOrder);
    for (const ad of display) {
        if (typeof ad.order === 'number' && ad.order >= 0 && !taken.has(ad.order)) {
            bySlot.set(ad.id, ad.order);
            taken.add(ad.order);
        }
    }
    let next = 0;
    for (const ad of display) {
        if (bySlot.has(ad.id)) continue;
        while (taken.has(next)) next++;
        bySlot.set(ad.id, next);
        taken.add(next);
    }
    return bySlot;
}

/**
 * מספרי המקומות לתצוגה (1-based) - לדפי שרת שמציגים "מקום N מתוך 12".
 * @param {any[]} list
 * @returns {Map<string, number>}
 */
export function computeAdSlots(list) {
    return new Map([...computeSlots(list)].map(([id, s]) => [id, s + 1]));
}

/**
 * מקבע ב-Strapi מספר מקום לכל פרסומת ברשימה שעדיין אין לה (או שהמספר
 * השמור מתנגש). כותב רק את מי שהשתנה - בהקצאה הראשונה זו כל הרשימה,
 * ומכאן והלאה כלום. רץ בפעולות ניהול בלבד, לא בנתיבי קריאה.
 * @param {any[]} list
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<Map<string, number>>}
 */
async function ensureSlotsPersisted(list, { fetch: f = fetch, jwt = '' } = {}) {
    const slots = computeSlots(list);
    const dirty = list.filter((/** @type {any} */ ad) => ad.order !== slots.get(ad.id));
    if (dirty.length > 0) {
        await Promise.all(
            dirty.map((/** @type {any} */ ad) => writeOrder(ad, slots.get(ad.id) ?? 0, { fetch: f, jwt })),
        );
        invalidateAdsCache();
    }
    return slots;
}

/**
 * כל המאושרות בסדר התצוגה - כולל מושהות ופגות תוקף: המספר נשאר קבוע
 * לפרסומת גם דרך השהיה ופקיעה, ולכן פעולות המקום עובדות על כולן.
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {Promise<any[]>}
 */
async function listApprovedForSlots({ fetch: f = fetch } = {}) {
    const all = await listAllForAdmin({ fetch: f });
    return all.filter((/** @type {any} */ a) => a.status === 'approved').sort(byDisplayOrder);
}

/**
 * מזיז פרסומת מאושרת מקום אחד למעלה/למטה: מחליפה מספרים עם השכנה
 * בסדר התצוגה. שאר הפרסומות לא זזות.
 * מחזיר null אם הפרסומת לא נמצאה או שהיא כבר בקצה הרשימה.
 * @param {string} id
 * @param {'up'|'down'} direction
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,position:number,total:number}|null>}
 */
export async function moveApprovedAd(id, direction, { fetch: f = fetch, jwt = '' } = {}) {
    const list = await listApprovedForSlots({ fetch: f });
    const slots = await ensureSlotsPersisted(list, { fetch: f, jwt });
    const sorted = [...list].sort(
        (/** @type {any} */ a, /** @type {any} */ b) =>
            (slots.get(a.id) ?? 0) - (slots.get(b.id) ?? 0),
    );
    const from = sorted.findIndex((/** @type {any} */ a) => a.id === id);
    if (from === -1) return null;
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= sorted.length) return null;

    const moved = sorted[from];
    const other = sorted[to];
    const movedSlot = slots.get(moved.id) ?? 0;
    const otherSlot = slots.get(other.id) ?? 0;
    await Promise.all([
        writeOrder(moved, otherSlot, { fetch: f, jwt }),
        writeOrder(other, movedSlot, { fetch: f, jwt }),
    ]);
    invalidateAdsCache();
    return { title: moved.title, position: otherSlot + 1, total: AD_SLOT_COUNT };
}

/**
 * מציב פרסומת מאושרת במקום מספרי מסוים בטור (1..12). מקום תפוס - השתיים
 * מתחלפות זו בזו; שאר הפרסומות לא זזות. המספר נשאר קבוע לפרסומת גם דרך
 * השהיה ופקיעה - כשהיא חוזרת לאוויר היא חוזרת לאותו מקום.
 * @param {string} id
 * @param {number} requested
 * @param {{ fetch?: typeof fetch, jwt?: string }} [opts]
 * @returns {Promise<{title:string,slot:number,swappedTitle?:string,swappedSlot?:number}|null>}
 */
export async function setAdSlot(id, requested, { fetch: f = fetch, jwt = '' } = {}) {
    const n = Math.round(Number(requested));
    if (!Number.isFinite(n)) return null;
    const target = Math.min(AD_SLOT_COUNT, Math.max(1, n)) - 1;

    const list = await listApprovedForSlots({ fetch: f });
    const ad = list.find((/** @type {any} */ a) => a.id === id);
    if (!ad) return null;
    const slots = await ensureSlotsPersisted(list, { fetch: f, jwt });
    const cur = slots.get(id) ?? 0;
    if (cur === target) return { title: ad.title, slot: target + 1 };

    const occupant =
        list.find((/** @type {any} */ a) => a.id !== id && slots.get(a.id) === target) ?? null;
    await Promise.all([
        writeOrder(ad, target, { fetch: f, jwt }),
        ...(occupant ? [writeOrder(occupant, cur, { fetch: f, jwt })] : []),
    ]);
    invalidateAdsCache();
    return {
        title: ad.title,
        slot: target + 1,
        ...(occupant ? { swappedTitle: occupant.title, swappedSlot: cur + 1 } : {}),
    };
}

// ============================================================
// "הפרסומות שלי" - הפרסומות של המפרסם המחובר, לעריכה מהאזור האישי
// ------------------------------------------------------------
// עד כאן פרסומת הייתה חד-כיוונית: המפרסם שולח, האדמין מאשר, וזהו -
// לתקן כותרת או להחליף תמונה חייב לעבור דרך פאנל Strapi. שלוש
// הפונקציות כאן פותחות את הכיוון ההפוך: לראות את הפרסומות שלי,
// ולפתוח אחת מהן בבילדר לעריכה.
// ============================================================

/**
 * האם הפרסומת שייכת למפרסם הזה. ההשוואה לפי מזהה המשתמש, ואם אין
 * התאמה - לפי אימייל: מי שהתחבר פעם ב-Google ופעם בסיסמה מקבל מזהה
 * אחר, ובלי הנפילה לאימייל הוא היה מאבד גישה לפרסומת שלו.
 * @param {any} ad
 * @param {{ id?: string, email?: string }} identity
 */
export function sameAdvertiser(ad, identity) {
    const id = String(identity?.id ?? '').trim();
    const email = String(identity?.email ?? '').trim().toLowerCase();
    if (id && String(ad?.submittedBy?.id ?? '').trim() === id) return true;
    if (email && String(ad?.submittedBy?.email ?? '').trim().toLowerCase() === email) return true;
    return false;
}

/**
 * @typedef {Object} MyAdSummary
 * @property {string} id
 * @property {string} title
 * @property {string} subtitle
 * @property {'pending'|'approved'|'rejected'} status
 * @property {number} [slot] מקום בטור (1..12) - למאושרות בלבד
 * @property {string} expiresAt
 * @property {boolean} paused
 * @property {boolean} live מוצגת בפועל על האתר עכשיו
 * @property {string} rejectionReason
 * @property {string} replacesTitle כותרת הפרסומת שהעדכון הזה בא להחליף
 */

/**
 * כל הפרסומות של המפרסם - לרשימת "הפרסומות שלי" באזור האישי, שם לכל
 * אחת יש כפתור עריכה משלה.
 *
 * השליפה מוגבלת לרשומות שלו ומדלגת על שתי עמודות ה-base64 הכבדות
 * (logo, main_image): רשומה מלאה שוקלת מאות KB, והאזור האישי לא מציג
 * את התמונות בכלל. גרסאות שהוחלפו לא נכללות - הן היסטוריה.
 *
 * @param {{ id?: string, email?: string }} identity
 * @param {{ fetch?: typeof fetch }} [opts]
 * @returns {Promise<MyAdSummary[]>}
 */
export async function getMyAds(identity, { fetch: f = fetch } = {}) {
    const uid = String(identity?.id ?? '').trim();
    const email = String(identity?.email ?? '').trim();
    if (!uid && !email) return [];

    /** @type {Record<string, string>} */
    const params = { sort: 'submitted_at:desc', 'pagination[pageSize]': '50' };
    [
        'ad_status',
        'title',
        'subtitle',
        'expires_at',
        'duration_days',
        'rejection_reason',
        'submitted_at',
        'submitted_by_id',
        'submitted_by_email',
        'landing',
    ].forEach((fld, i) => {
        params[`fields[${i}]`] = fld;
    });
    let i = 0;
    if (uid) params[`filters[$or][${i++}][submitted_by_id][$eq]`] = uid;
    if (email) params[`filters[$or][${i++}][submitted_by_email][$eq]`] = email;

    try {
        const data = await strapiGet(ENDPOINT, params, { fetch: f });
        const now = Date.now();
        /** @type {Record<string, number>} */
        const rank = { approved: 0, pending: 1, rejected: 2 };
        return (data?.data ?? [])
            .map(fromStrapi)
            .filter(Boolean)
            // הסינון בשרת הוא לפי מזהה *או* אימייל; מוודאים כאן שוב שהשורה
            // באמת של המפרסם, כדי שגם שינוי בסכמה לא ידליף פרסומת זרה.
            .filter((/** @type {any} */ a) => !a.superseded && sameAdvertiser(a, identity))
            .map((/** @type {any} */ a) => ({
                id: a.id,
                title: a.title,
                subtitle: a.subtitle,
                status: a.status,
                // המספר נשמר לפרסומת באישור (_order, 0-based); בלי מספר
                // שמור לא מנחשים - חישוב על רשימה חלקית ייתן מקום שגוי.
                slot:
                    a.status === 'approved' && typeof a.order === 'number'
                        ? a.order + 1
                        : undefined,
                expiresAt: a.expiresAt,
                paused: a.paused === true,
                live:
                    a.status === 'approved' &&
                    !a.paused &&
                    (!a.expiresAt || Date.parse(a.expiresAt) > now),
                rejectionReason: a.rejectionReason,
                replacesTitle: a.replacesTitle,
            }))
            .sort(
                (/** @type {any} */ x, /** @type {any} */ y) =>
                    (rank[x.status] ?? 9) - (rank[y.status] ?? 9) ||
                    (x.slot ?? 99) - (y.slot ?? 99),
            );
    } catch (err) {
        console.warn('adsStore: getMyAds failed', err instanceof Error ? err.message : err);
        return [];
    }
}

/**
 * הפרסומת המלאה לעריכה בבילדר - לבעליה בלבד. הבדיקה נעשית בשרת לפי
 * זהות המפרסם, כך שאי אפשר למשוך תוכן של פרסומת זרה בניחוש מזהה.
 * @param {string} id
 * @param {{ id?: string, email?: string }} identity
 * @param {{ fetch?: typeof fetch }} [opts]
 */
export async function getOwnAdForEdit(id, identity, { fetch: f = fetch } = {}) {
    if (!id || (!identity?.id && !identity?.email)) return null;
    const ad = await getAd(id, { fetch: f });
    if (!ad || ad.superseded) return null;
    return sameAdvertiser(ad, identity) ? ad : null;
}
