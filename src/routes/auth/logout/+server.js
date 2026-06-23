import { redirect } from '@sveltejs/kit';
import { AUTH_COOKIE, authCookieOptions } from '$lib/auth.js';

export function POST({ url, cookies }) {
    cookies.delete(AUTH_COOKIE, authCookieOptions(url));
    throw redirect(303, url.searchParams.get('returnTo') || '/');
}

export function GET({ url, cookies }) {
    cookies.delete(AUTH_COOKIE, authCookieOptions(url));
    throw redirect(303, url.searchParams.get('returnTo') || '/');
}
