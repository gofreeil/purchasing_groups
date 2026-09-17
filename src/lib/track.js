// ============================================================
// track.js — רישום אירועי תנועה מהדפדפן (הצד של הלקוח).
//
// כל אירוע נשלח כ-beacon ל-/api/track ומשם ל-Strapi. הקריאה לעולם לא
// חוסמת ולא זורקת: sendBeacon ממשיך גם כשהדף נסגר או עובר (למשל
// לחיצה שפותחת את טופס ההצטרפות בלשונית חדשה).
//
// סוגי האירועים:
//   visit      - כניסה לאתר. פעם אחת ל-session של הדפדפן (sessionStorage),
//                כלומר "כמה אנשים נכנסו" ולא "כמה דפים נצפו".
//   pageview   - צפייה בדף, בכל ניווט. slug = הנתיב.
//   deal_click - לחיצה על כרטיס מבצע בדף הבית. slug = מזהה העסקה.
//   join_click - לחיצה על טופס ההצטרפות בדף העסקה. slug = מזהה העסקה.
//
// בטוח לקריאה גם ב-SSR (לא עושה כלום בלי window).
// ============================================================

const SESSION_KEY = 'pg-visit-tracked';

/**
 * @param {'visit' | 'pageview' | 'deal_click' | 'join_click'} kind
 * @param {string} [slug]
 */
export function track(kind, slug = '') {
    if (typeof window === 'undefined') return;
    const payload = JSON.stringify({ kind, slug });
    try {
        if (navigator.sendBeacon) {
            // Blob עם content-type מפורש, כדי שהשרת יקרא request.json()
            const ok = navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
            if (ok) return;
        }
        fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
        }).catch(() => {});
    } catch {
        /* חסימת רשת / הרחבות - מוותרים בשקט */
    }
}

/**
 * צפייה בדף + כניסה לאתר (פעם אחת ל-session). נקרא מ-afterNavigate
 * ב-+layout.svelte על כל דף באתר.
 * @param {string} pathname
 */
export function trackPageview(pathname) {
    if (typeof window === 'undefined') return;
    // מסכי הניהול אינם "תנועה באתר" (וגם הצוות עצמו לא נספר - ראו api/track)
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) return;

    let firstInSession = false;
    try {
        if (!sessionStorage.getItem(SESSION_KEY)) {
            sessionStorage.setItem(SESSION_KEY, '1');
            firstInSession = true;
        }
    } catch {
        // אחסון חסום (גלישה פרטית קשוחה) - נספור כניסה על כל דף, עדיף מכלום
        firstInSession = true;
    }
    if (firstInSession) track('visit');
    track('pageview', pathname);
}
