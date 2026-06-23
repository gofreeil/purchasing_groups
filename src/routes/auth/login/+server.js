import { redirect } from '@sveltejs/kit';
import { STRAPI_URL } from '$lib/auth.js';

export function GET({ url }) {
    const returnTo = url.searchParams.get('returnTo') || '/';
    const callbackUrl = `${url.origin}/auth/google-callback?returnTo=${encodeURIComponent(returnTo)}`;
    const startUrl = `${STRAPI_URL}/api/connect/google?callback=${encodeURIComponent(callbackUrl)}`;
    throw redirect(302, startUrl);
}
