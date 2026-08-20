import { isAdmin, isSuperAdmin } from '$lib/auth.js';
import { getPendingCounts, noPendingCounts } from '$lib/server/membershipsSource.js';
import { getExternalCounts } from '$lib/server/adminData.js';

/**
 * מעטפת מסכי הניהול. ההרשאה עצמה נאכפת בכל מסך בנפרד (כדי לשמור על מסך
 * "אין הרשאה" מסודר ב-/admin), וכאן רק נטענים הנתונים המשותפים לסרגל הניווט.
 *
 * depends + invalidate (ב-+layout.svelte) מריצים את ה-load הזה בכל מעבר
 * בתוך הפאנל: בלעדיהם הבועה נשארת תקועה על המספר שהיה כשנפתחה הלשונית,
 * גם אחרי שהפריטים טופלו.
 */
export async function load({ locals, fetch, depends }) {
    depends('app:pending');

    const user = locals.user;
    const admin = isAdmin(user);
    if (!admin) {
        return { isAdmin: false, superAdmin: false, pending: noPendingCounts() };
    }

    // כשל בכל אחד מהמקורות לא מפיל את הפאנל — הבועות פשוט מתאפסות.
    const pending = await getExternalCounts({ fetch })
        .then((extra) => getPendingCounts(extra))
        .catch(() => noPendingCounts());

    return { isAdmin: true, superAdmin: isSuperAdmin(user), pending };
}
