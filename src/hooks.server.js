import { AUTH_COOKIE, fetchCurrentUser } from '$lib/auth.js';

export async function handle({ event, resolve }) {
    const jwt = event.cookies.get(AUTH_COOKIE);
    if (jwt) {
        event.locals.user = await fetchCurrentUser(jwt, { fetch: event.fetch });
        event.locals.jwt = jwt;
    } else {
        event.locals.user = null;
        event.locals.jwt = null;
    }
    return resolve(event);
}
