import { getApprovedAdImage, isAdImageKind } from '$lib/server/adsStore.js';
import { immutableImageResponse } from '$lib/server/inlineImage.js';

/**
 * תמונות הפרסומות - במקום base64 מוטבע בכל דף.
 *
 * הכתובת נושאת ?v=<חותם תוכן>, ולכן היא ייחודית לתמונה הזו: אם התמונה
 * מוחלפת משתנה גם החותם וגם הכתובת. זה מה שמאפשר קאש "לנצח" (immutable)
 * גם בדפדפן וגם בקצה של Vercel - אחרי הבקשה הראשונה התמונה כבר לא יוצאת
 * שוב מהשרת, ולא נספרת שוב במכסת ה-Origin Transfer.
 *
 * מוגש רק מפרסומות מאושרות שחיות על האתר (getApprovedAdImage נשען על אותה
 * רשימה שב-cache), כך שתמונות של פרסומת ממתינה/נדחית אינן נחשפות דרך ניחוש
 * מזהה.
 */
export async function GET({ params, fetch }) {
    if (!isAdImageKind(params.kind)) {
        return new Response(null, { status: 404 });
    }

    const img = await getApprovedAdImage(params.id, params.kind, { fetch });
    if (!img) {
        return new Response(null, { status: 404 });
    }

    return immutableImageResponse(img);
}
