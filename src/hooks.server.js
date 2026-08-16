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

export async function handle({ event, resolve }) {
    if (PUBLIC_IMAGE_PATH.test(event.url.pathname)) {
        event.locals.user = null;
        event.locals.jwt = null;
        return resolve(event);
    }

    const jwt = event.cookies.get(AUTH_COOKIE);
    if (jwt) {
        event.locals.user = await fetchCurrentUser(jwt, { fetch: event.fetch });
        event.locals.jwt = jwt;
    } else {
        event.locals.user = null;
        event.locals.jwt = null;
    }
    return resolve(event);
}
