import { redirect, error } from '@sveltejs/kit';
import { AUTH_COOKIE, authCookieOptions, exchangeOAuthToken } from '$lib/auth.js';

export async function GET({ url, cookies, fetch }) {
    const accessToken = url.searchParams.get('access_token');
    if (!accessToken) throw error(400, 'access_token חסר');

    const provider = cookies.get('oauth-provider') || 'google';
    let data;
    try {
        data = await exchangeOAuthToken(provider, accessToken, { fetch });
    } catch (e) {
        throw error(502, `הזדהות נכשלה: ${e.message}`);
    }
    if (!data?.jwt) throw error(502, 'Strapi לא החזיר JWT');

    cookies.set(AUTH_COOKIE, data.jwt, authCookieOptions(url));
    const returnTo = cookies.get('oauth-return-to') || '/';
    cookies.delete('oauth-return-to', { ...authCookieOptions(url) });
    cookies.delete('oauth-provider', { ...authCookieOptions(url) });
    throw redirect(302, returnTo);
}
