import { redirect, error } from '@sveltejs/kit';
import { AUTH_COOKIE, authCookieOptions, exchangeGoogleToken } from '$lib/auth.js';

export async function GET({ url, cookies, fetch }) {
    const accessToken = url.searchParams.get('access_token');
    const returnTo = url.searchParams.get('returnTo') || '/';
    if (!accessToken) throw error(400, 'access_token חסר');

    let data;
    try {
        data = await exchangeGoogleToken(accessToken, { fetch });
    } catch (e) {
        throw error(502, `הזדהות נכשלה: ${e.message}`);
    }
    if (!data?.jwt) throw error(502, 'Strapi לא החזיר JWT');

    cookies.set(AUTH_COOKIE, data.jwt, authCookieOptions(url));
    throw redirect(302, returnTo);
}
