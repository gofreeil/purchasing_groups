// חושף את המשתמש המחובר לכל הדפים דרך data.user.
export function load({ locals }) {
    const u = locals.user;
    return {
        user: u
            ? { id: u.id, email: u.email, username: u.username, app_role: u.app_role ?? null }
            : null,
    };
}
