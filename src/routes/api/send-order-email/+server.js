import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// שליחת מייל אישור הזמנת פרסום דרך Resend (REST API ישיר - בלי תלות בחבילה).
// הועתק מאתר "קהילה בשכונה" והותאם: אתר אחד, בלי שכונות ובלי קופת קהילה.
// דורש env: RESEND_API_KEY (ואופציונלית FROM_EMAIL).

const SITE_NAME = 'רכישות קבוצתיות יוצאים לחירות';
const CONTACT_EMAIL = 'freedomhasbegun@gmail.com';
const CONTACT_WA = 'https://wa.me/972508750632';

/** @param {{ selectedItems: any[], totalPayment: number, totalMonthly: number, discountLabel?: string, discountValue?: number }} payload */
function buildEmailHtml(payload) {
    const { selectedItems, totalPayment, totalMonthly } = payload;
    const discountValue = payload.discountValue ?? 0;
    const discountLabel = payload.discountLabel ?? '';

    const halfItems = selectedItems.filter((r) => r.plan === 'half');
    const singleItems = selectedItems.filter((r) => r.plan === 'single');

    const itemsRows = selectedItems
        .map((item) => {
            const price = item.plan === 'half' ? item.total : item.single;
            const planLabel = item.plan === 'half' ? 'חצי שנה' : 'חודש בודד';
            const color = item.plan === 'half' ? '#f59e0b' : '#3b82f6';
            return `
        <tr>
          <td style="padding:12px 16px; border-bottom:1px solid #1e2a3a; color:#e2e8f0; font-size:15px;">${item.type}</td>
          <td style="padding:12px 16px; border-bottom:1px solid #1e2a3a; text-align:center;">
            <span style="background:${color}22; color:${color}; border:1px solid ${color}44;
                         border-radius:20px; padding:3px 10px; font-size:12px; font-weight:700;">${planLabel}</span>
          </td>
          <td style="padding:12px 16px; border-bottom:1px solid #1e2a3a; text-align:left; color:${color}; font-weight:700; font-size:15px;">₪${price}</td>
        </tr>`;
        })
        .join('');

    const summaryLine =
        halfItems.length > 0 && singleItems.length === 0
            ? `<p style="margin:0; color:#94a3b8; font-size:13px;">חבילת חצי שנה · ₪${totalMonthly} לחודש</p>`
            : halfItems.length === 0 && singleItems.length > 0
              ? `<p style="margin:0; color:#94a3b8; font-size:13px;">${singleItems.length} פרסומות לחודש אחד</p>`
              : `<p style="margin:0; color:#94a3b8; font-size:13px;">${halfItems.length} חצי שנה + ${singleItems.length} חודשים בודדים</p>`;

    return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>אישור הזמנת פרסום - ${SITE_NAME}</title>
</head>
<body style="margin:0; padding:0; background:#070b14; font-family:'Segoe UI', Arial, sans-serif; direction:rtl;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#070b14; padding:40px 16px;">
    <tr><td align="center">

      <table width="580" cellpadding="0" cellspacing="0"
             style="background:#0f172a; border-radius:20px; border:1px solid #1e2a3a; overflow:hidden;">

        <tr>
          <td style="background:linear-gradient(135deg,#1e3a5f 0%,#2d1b69 50%,#4a1942 100%); padding:36px 32px; text-align:center;">
            <div style="font-size:42px; margin-bottom:12px;">📢</div>
            <h1 style="margin:0 0 6px; color:#ffffff; font-size:26px; font-weight:900; letter-spacing:-0.5px;">
              ${SITE_NAME}
            </h1>
            <p style="margin:0; color:#a5b4fc; font-size:15px; font-weight:600;">
              ✅ בקשת הפרסום שלך התקבלה!
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:32px;">

            <p style="margin:0 0 24px; color:#cbd5e1; font-size:16px; line-height:1.7;">
              שלום,<br/>
              קיבלנו את בקשת הפרסום שלך. להלן סיכום ההזמנה שלך -
              ניצור איתך קשר תוך <strong style="color:#f59e0b;">24 שעות</strong> לתיאום הסופי.
            </p>

            <div style="background:#0a1628; border:1px solid #1e2a3a; border-radius:14px; margin-bottom:24px; overflow:hidden;">

              <div style="background:#111827; padding:12px 16px; border-bottom:1px solid #1e2a3a;">
                <p style="margin:0; color:#64748b; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1px;">
                  📋 פרסומות שנבחרו
                </p>
              </div>

              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#0f172a;">
                    <th style="padding:10px 16px; color:#64748b; font-size:12px; font-weight:700; text-align:right; border-bottom:1px solid #1e2a3a;">סוג פרסום</th>
                    <th style="padding:10px 16px; color:#64748b; font-size:12px; font-weight:700; text-align:center; border-bottom:1px solid #1e2a3a;">תוכנית</th>
                    <th style="padding:10px 16px; color:#64748b; font-size:12px; font-weight:700; text-align:left; border-bottom:1px solid #1e2a3a;">מחיר</th>
                  </tr>
                </thead>
                <tbody>${itemsRows}</tbody>
              </table>
            </div>

            <div style="background:linear-gradient(135deg,#1a2744 0%,#1a1a3e 100%);
                         border:2px solid #334155; border-radius:14px; padding:24px; text-align:center; margin-bottom:28px;">
              <p style="margin:0 0 4px; color:#64748b; font-size:13px; font-weight:700;">סה"כ לתשלום</p>
              ${discountValue > 0 ? `<p style="margin:0 0 8px; color:#22c55e; font-size:13px; font-weight:700;">🎟️ הנחה (${discountLabel}): -₪${discountValue}</p>` : ''}
              <p style="margin:0 0 6px; color:#ffffff; font-size:48px; font-weight:900; line-height:1;">₪${totalPayment}</p>
              ${summaryLine}
            </div>

            <div style="background:#0a1628; border:1px solid #1e2a3a; border-radius:14px; padding:20px; margin-bottom:28px;">
              <p style="margin:0 0 14px; color:#e2e8f0; font-size:14px; font-weight:700;">מה קורה עכשיו?</p>
              <table cellpadding="0" cellspacing="0">
                ${[
                    ['📧', 'קיבלנו את בקשתך', 'הבקשה רשומה במערכת שלנו'],
                    ['📞', 'ניצור איתך קשר', 'תוך 24 שעות לתיאום פרטי הפרסום'],
                    ['🎯', 'הפרסום יעלה', 'לאחר אישור סופי ותשלום'],
                ]
                    .map(
                        ([icon, title, desc]) => `
                <tr>
                  <td style="padding:6px 12px 6px 0; vertical-align:top; font-size:18px;">${icon}</td>
                  <td style="padding:6px 0 6px 0; vertical-align:top;">
                    <p style="margin:0; color:#e2e8f0; font-size:14px; font-weight:700;">${title}</p>
                    <p style="margin:0; color:#64748b; font-size:12px;">${desc}</p>
                  </td>
                </tr>`,
                    )
                    .join('')}
              </table>
            </div>

            <p style="margin:0; color:#64748b; font-size:13px; text-align:center; line-height:1.8;">
              שאלות? צרו קשר בכל עת:<br/>
              <a href="mailto:${CONTACT_EMAIL}" style="color:#f59e0b; text-decoration:none; font-weight:700;">${CONTACT_EMAIL}</a>
              &nbsp;·&nbsp;
              <a href="${CONTACT_WA}" style="color:#22c55e; text-decoration:none; font-weight:700;">WhatsApp</a>
            </p>

          </td>
        </tr>

        <tr>
          <td style="background:#070b14; border-top:1px solid #1e2a3a; padding:20px 32px; text-align:center;">
            <p style="margin:0; color:#334155; font-size:12px;">
              © ${new Date().getFullYear()} ${SITE_NAME}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST({ request }) {
    let payload;
    try {
        payload = await request.json();
    } catch {
        return json({ success: false, message: 'נתונים לא תקינים' }, { status: 400 });
    }

    const { email, selectedItems } = payload;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ success: false, message: 'כתובת אימייל לא תקינה' }, { status: 400 });
    }
    if (!selectedItems || selectedItems.length === 0) {
        return json({ success: false, message: 'לא נבחרו פרסומות' }, { status: 400 });
    }

    const apiKey = env.RESEND_API_KEY;
    if (!apiKey) {
        // שליחת מייל לא מוגדרת בסביבה הזו - המשתמש עדיין יכול לשלוח בוואטסאפ.
        return json(
            { success: false, message: 'שליחת מייל אינה זמינה כרגע - שלחו את ההזמנה בוואטסאפ' },
            { status: 503 },
        );
    }
    const fromEmail = env.FROM_EMAIL || 'onboarding@resend.dev';

    try {
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${SITE_NAME} <${fromEmail}>`,
                to: [email],
                subject: `✅ בקשת הפרסום שלך התקבלה - ₪${payload.totalPayment}`,
                html: buildEmailHtml(payload),
            }),
        });

        if (!res.ok) {
            console.error('Resend error:', res.status, await res.text().catch(() => ''));
            return json({ success: false, message: 'שגיאה בשליחת המייל' }, { status: 500 });
        }

        return json({ success: true, message: 'המייל נשלח בהצלחה!' });
    } catch (err) {
        console.error('Unexpected error sending email:', err);
        return json({ success: false, message: 'שגיאה לא צפויה' }, { status: 500 });
    }
}
