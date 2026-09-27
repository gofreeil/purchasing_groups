import { json } from '@sveltejs/kit';
import { verifyTotp } from '$lib/server/superAdminTotp.js';

/** קוד Google Authenticator לפני עריכה מהאתר (גלגל השיניים). */
export async function POST(event) {
    const body = await event.request.json().catch(() => ({}));
    const result = await verifyTotp(event, String(body?.code ?? ''));
    if (!result.ok) return json({ error: result.error }, { status: result.status });
    return json({ ok: true });
}
