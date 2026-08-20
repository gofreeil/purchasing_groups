import { listApproved, computeAdSlots, adImageUrl } from '$lib/server/adsStore.js';
import { isAdmin, isSuperAdmin } from '$lib/auth.js';

// חושף את המשתמש המחובר לכל הדפים דרך data.user,
// ואת הפרסומות המאושרות של מפרסמים - לסיידבר הפרסומות.
export async function load({ locals, fetch }) {
    const u = locals.user;

    // כשל בטעינת הפרסומות לא מפיל את האתר - פשוט לא מציגים אותן.
    /** @type {any[]} */
    let approvedAds = [];
    try {
        const live = await listApproved({ fetch });
        // מספר המקום (1..16) קובע גם את סדר הפרסומות וגם אילו משבצות פנויות
        // מוצגות סביבן בטור - נקבע במסך הניהול ומחושב כאן פעם אחת לרשימה.
        const slots = computeAdSlots(live);
        // רק השדות שהרכיבים באמת קוראים (RightAdBanner, MobileAdsDrawer),
        // והתמונה ככתובת ולא כ-base64: ה-load הזה רץ בכל ניווט בכל עמוד
        // באתר, ולכן כל בייט שנשלח כאן יוצא מהשרת מחדש בכל צפייה - פעמיים
        // (ב-HTML של ה-SSR ובנתוני ההידרציה). כך נשרפה מכסת ה-Origin
        // Transfer של Vercel: 1,700KB מתוך דף של 1,777KB היו התמונות
        // המוטבעות. הצמצום נעשה כאן ולא ב-listApproved, כי אותה רשימה
        // משמשת גם את נתיב התמונה - שצריך דווקא את ה-base64 המלא.
        // ראה adImageUrl.
        approvedAds = live.map((/** @type {any} */ a) => ({
            id: a.id,
            title: a.title,
            subtitle: a.subtitle,
            cta: a.cta,
            hover: a.hoverText,
            gradient: a.gradient,
            mainImage: adImageUrl(a, 'main'),
            mainImageFit: a.mainImageFit,
            // מספר המקום בטור (1..16) - נקבע במסך הניהול
            slot: slots.get(a.id) ?? 0,
        }));
    } catch (err) {
        console.warn('layout: loading approved ads failed', err);
    }

    return {
        user: u
            ? {
                id: u.id,
                email: u.email,
                username: u.username,
                // שם תצוגה אמיתי אם קיים בסכמה (אחרת ניגזר באתר מהאימייל)
                name: u.name ?? u.fullName ?? u.firstname ?? null,
                // תמונת פרופיל (Strapi המשותף / Google) - לתצוגה בהדר
                avatar_url: u.avatar_url ?? u.picture ?? u.avatar ?? null,
                app_role: u.app_role ?? null,
            }
            : null,
        // דגלי ההרשאה נגזרים כאן ולא בדפדפן: $lib/auth.js מייבא משתני
        // סביבה פרטיים ואי אפשר לייבא אותו לתוך קומפוננטה. ההדר צריך רק
        // לדעת אם להציג את הקישור לפאנל.
        isAdmin: isAdmin(u),
        superAdmin: isSuperAdmin(u),
        approvedAds,
    };
}
