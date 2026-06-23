// קליינט פשוט ל-Strapi - בלי תלות בחבילות נוספות.
// משתמש ב-env שמותקן בזמן הריצה (SvelteKit/Vite מטעין אותו על הצד-שרת בלבד).
import { env } from '$env/dynamic/private';

const STRAPI_URL = (env.STRAPI_URL || 'https://api.gofreeil.com').replace(/\/$/, '');

export async function strapiGet(path, params = {}, { fetch: f = fetch } = {}) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null) continue;
        search.set(key, String(value));
    }
    const qs = search.toString();
    const url = `${STRAPI_URL}/api/${path}${qs ? `?${qs}` : ''}`;
    const res = await f(url, { headers: { 'Content-Type': 'application/json' } });
    if (!res.ok) throw new Error(`Strapi GET ${path} failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function strapiPost(path, data, { fetch: f = fetch } = {}) {
    const url = `${STRAPI_URL}/api/${path}`;
    const res = await f(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
    });
    if (!res.ok) throw new Error(`Strapi POST ${path} failed: ${res.status} ${res.statusText}`);
    return res.json();
}

export async function fetchCampaigns({ fetch: f = fetch } = {}) {
    const data = await strapiGet('pg-campaigns', {
        sort: 'order:asc',
        'pagination[pageSize]': 100,
    }, { fetch: f });
    return data?.data ?? [];
}

export async function fetchCampaignBySlug(slug, { fetch: f = fetch } = {}) {
    const data = await strapiGet('pg-campaigns', {
        'filters[slug][$eq]': slug,
        'pagination[pageSize]': 1,
    }, { fetch: f });
    return (data?.data ?? [])[0] ?? null;
}

export async function fetchSatisfactionResponses(campaignSlug, { fetch: f = fetch, pageSize = 50 } = {}) {
    const data = await strapiGet('pg-satisfaction-responses', {
        'filters[campaign_slug][$eq]': campaignSlug,
        sort: 'createdAt:desc',
        'pagination[pageSize]': pageSize,
    }, { fetch: f });
    return data?.data ?? [];
}
