// קליינט Strapi בצד-לקוח עבור purchasing-groups.
// JWT נשמר ב-sessionStorage, מתאפס ביציאה מהדפדפן.

const BASE_URL = 'https://community-il.duckdns.org';
const JWT_KEY = 'pg-strapi-jwt';

export function getJwt() {
    if (typeof sessionStorage === 'undefined') return null;
    try { return sessionStorage.getItem(JWT_KEY); } catch { return null; }
}

export function setJwt(jwt) {
    if (typeof sessionStorage === 'undefined') return;
    try {
        if (jwt) sessionStorage.setItem(JWT_KEY, jwt);
        else sessionStorage.removeItem(JWT_KEY);
    } catch {}
}

export function logout() {
    setJwt(null);
}

export function googleOAuthStartUrl(returnTo = '/') {
    if (typeof sessionStorage !== 'undefined') {
        try { sessionStorage.setItem('pg-oauth-returnTo', returnTo); } catch {}
    }
    const callback = typeof window !== 'undefined'
        ? `${window.location.origin}/auth/google-callback`
        : '/auth/google-callback';
    return `${BASE_URL}/api/connect/google?callback=${encodeURIComponent(callback)}`;
}

export async function strapiGoogleExchange(queryParams) {
    const qs = queryParams.toString();
    const res = await fetch(`${BASE_URL}/api/auth/google/callback?${qs}`);
    if (!res.ok) throw new Error(`Google exchange failed: ${res.status}`);
    const data = await res.json();
    setJwt(data.jwt);
    return data;
}

export async function getCurrentUser() {
    const jwt = getJwt();
    if (!jwt) return null;
    try {
        const res = await fetch(`${BASE_URL}/api/users/me?populate=role`, {
            headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) {
            if (res.status === 401) setJwt(null);
            return null;
        }
        return await res.json();
    } catch {
        return null;
    }
}

export function isSuperAdmin(user) {
    return !!user && user.app_role === 'super_admin';
}

// PUT לעדכון תגובה (פין/לייק/תשובה) — רק super_admin (אכיפה גם בשרת).
// קוראים לפי documentId של Strapi v5.
export async function updateResponseAdmin(documentId, fields) {
    const jwt = getJwt();
    if (!jwt) throw new Error('לא מחובר');
    const res = await fetch(`${BASE_URL}/api/pg-satisfaction-responses/${documentId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ data: fields }),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`עדכון נכשל: ${res.status} ${txt.slice(0, 150)}`);
    }
    return res.json();
}
