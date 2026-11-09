import { AUTH_COOKIE, fetchCurrentUser } from '$lib/auth.js';

/**
 * נתיב תמונות הפרסומות ציבורי לחלוטין ולא תלוי-משתמש, ולכן עוקף את שרשרת
 * הזיהוי: כל בקשה רגילה כאן הייתה נוגעת בעוגיית ההתחברות ומזהה את המשתמש
 * מול Strapi, ותשובה שנוגעת בעוגיות (Set-Cookie) לעולם לא נשמרת בקאש של
 * Vercel - ה-CDN היה מחזיר MISS על כל בקשת תמונה, והבייטים היו יוצאים
 * מהשרת מחדש בכל צפייה. בלי העקיפה הזו כמעט כל התועלת שבהגשת התמונות
 * מנתיב נפרד הולכת לאיבוד (נמדד באתר "קהילה בשכונה").
 */
const PUBLIC_IMAGE_PATH = /^\/api\/ad-image\/[^/]+\/[^/]+$/;

/**
 * נתיבי סריקה של בוטים (וורדפרס/PHP/קבצי סודות) + קבצים שדפדפנים ואנדרואיד מבקשים מעצמם
 * ואין לנו (favicon.ico, apple-touch-icon, assetlinks.json). בלי הקיצור כל בקשה כזו מרנדרת את
 * דף ה-404 המלא, כולל טעינת ה-layout — ונמדדו כאן כמה בקשות כאלה בכל שעה. עונים בשורה אחת,
 * ו-s-maxage נותן ל-CDN של Vercel לזכור את התשובה כך שחזרה על אותו נתיב לא מגיעה לפונקציה.
 * אם יוסף קובץ אמיתי ל-static/ הוא יוגש ישירות מה-CDN, לפני שהקוד הזה בכלל רץ.
 */
const JUNK_PATH =
    /\.(?:php\d*|aspx?|jsp|cgi)$|^\/(?:wp-[^/]*|wordpress|phpmyadmin|cgi-bin|\.env[^/]*|\.git|\.aws|\.ssh)(?:\/|$)/i;
const ABSENT_FILES = new Set([
    '/favicon.ico',
    '/apple-touch-icon.png',
    '/apple-touch-icon-precomposed.png',
    '/.well-known/assetlinks.json'
]);

export async function handle({ event, resolve }) {
    if (
        event.request.method === 'GET' &&
        (JUNK_PATH.test(event.url.pathname) || ABSENT_FILES.has(event.url.pathname))
    ) {
        return new Response('Not found', {
            status: 404,
            headers: {
                'content-type': 'text/plain; charset=utf-8',
                'cache-control': 'public, s-maxage=86400'
            }
        });
    }

    if (PUBLIC_IMAGE_PATH.test(event.url.pathname)) {
        event.locals.user = null;
        event.locals.jwt = null;
        return resolve(event);
    }

    const jwt = event.cookies.get(AUTH_COOKIE);
    if (jwt) {
        // רשת ביטחון אחרונה: הקוד הזה רץ לפני כל דף באתר, ולכן כל חריגה כאן
        // היא 500 גורף. כשל בזיהוי המשתמש צריך להוריד אותו למצב "לא מחובר",
        // לא להפיל את הדף.
        try {
            event.locals.user = await fetchCurrentUser(jwt, { fetch: event.fetch });
        } catch (err) {
            console.warn('hooks: fetchCurrentUser failed', err instanceof Error ? err.message : err);
            event.locals.user = null;
        }
        event.locals.jwt = jwt;
    } else {
        event.locals.user = null;
        event.locals.jwt = null;
    }
    return resolve(event);
}
