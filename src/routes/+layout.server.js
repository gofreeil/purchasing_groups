// חושף את המשתמש המחובר לכל הדפים דרך data.user.
export function load({ locals }) {
    const u = locals.user;
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
    };
}
