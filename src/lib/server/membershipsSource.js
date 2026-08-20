// ============================================================
// membershipsSource.js — מקור הנתונים של "מי חבר באיזו עסקה".
//
//  ⚠️  כרגע זהו מוקאפ בלבד: הנתונים נוצרים כאן בקוד, אין מאחוריהם מאגר.
//      זהו *הקובץ היחיד* שצריך להחליף כשמקור האמת יוגדר (גיליון גוגל /
//      Strapi / טפסי ההצטרפות). כל שאר המסכים מדברים רק עם הפונקציות
//      המיוצאות למטה, ולכן ההחלפה לא תיגע בשום קובץ אחר:
//
//        listAllMemberships()        ← כל החברויות (מסכי הניהול)
//        listMembers()               ← החברויות מקובצות לפי אדם
//        listMembershipsForUser(u)   ← החברויות של המשתמש המחובר
//        getPendingCounts()          ← הבועות האדומות בסרגל הניווט
//
//      צורת הרשומה מתועדת ב-$lib/memberships.js (typedef Membership).
// ============================================================

import { getCampaignList } from '$lib/campaigns.js';
import { expiryState, savedSoFar } from '$lib/memberships.js';

const DAY_MS = 86_400_000;

// ── מחולל דטרמיניסטי ──────────────────────────────────────────
// אותו זרע מחזיר תמיד את אותם נתונים, כך שהמוקאפ לא "קופץ" בין רענון
// לרענון. כשיגיע מקור אמת כל האזור הזה נמחק.

/** @param {string} str */
function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}

/** @param {string} seed */
function rng(seed) {
    let a = hash(seed);
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/** @param {() => number} r @param {any[]} arr */
const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
/** @param {() => number} r @param {number} min @param {number} max */
const between = (r, min, max) => Math.floor(r() * (max - min + 1)) + min;

// ── תוכן המוקאפ ───────────────────────────────────────────────

const FIRST_NAMES = [
    'יוסי', 'מרים', 'אברהם', 'שרה', 'דוד', 'רחל', 'משה', 'לאה', 'יעקב', 'חנה',
    'שמואל', 'אסתר', 'נתן', 'רבקה', 'אליהו', 'תמר', 'ישראל', 'דבורה', 'מנחם', 'יעל',
    'צבי', 'נעמי', 'אהרן', 'רות', 'שלמה', 'מיכל', 'בנימין', 'אביגיל',
];
const LAST_NAMES = [
    'כהן', 'לוי', 'מזרחי', 'פרידמן', 'ביטון', 'אזולאי', 'דהן', 'אברהמי', 'שפירא',
    'רוזנברג', 'גולן', 'בן דוד', 'חדד', 'אוחיון', 'שטרן', 'קליין', 'וייס', 'הרשקוביץ',
];
const CITIES = [
    'ירושלים', 'בני ברק', 'בית שמש', 'מודיעין עילית', 'אשדוד', 'נתיבות', 'אלעד',
    'ביתר עילית', 'צפת', 'רכסים', 'פתח תקווה', 'חיפה',
];

/**
 * מסלולים, ספקים וטווחי חיסכון לכל עסקה — כדי שהכרטיס במסך ייראה כמו
 * הדבר האמיתי. months: 0 = ללא התחייבות (בלי תאריך תפוגה).
 */
const PLANS = /** @type {Record<string, { providers: string[], plans: string[], saving: [number, number], months: number[] }>} */ ({
    cellular: {
        providers: ['רמי לוי', 'אקס פון', 'וויקום'],
        plans: ['תוכנית א', 'תוכנית ב', 'תוכנית ג'],
        saving: [28, 95],
        months: [12, 24],
    },
    fuel: {
        providers: ['סונול', 'דור אלון', 'טן', 'תפוז'],
        plans: ['בנזין', 'סולר'],
        saving: [45, 190],
        months: [0, 12, 24],
    },
    carInsurance: {
        providers: ['הראל', 'כלל', 'מנורה', 'איילון'],
        plans: ['מקיף', 'צד שלישי', 'חובה + מקיף'],
        saving: [70, 260],
        months: [12],
    },
    internet: {
        providers: ['פרטנר', 'בזק', 'הוט'],
        plans: ['סיבים 100', 'סיבים 600'],
        saving: [30, 80],
        months: [12, 24],
    },
});

/** העסקאות שאפשר להצטרף אליהן בפועל — מהן נבנה המוקאפ. */
function joinableSlugs() {
    const list = getCampaignList().filter((c) => c.can_join && PLANS[c.slug]);
    return (list.length ? list : getCampaignList()).map((c) => c.slug);
}

/**
 * בונה חברות אחת. התאריכים נגזרים מ"היום" כדי שהמוקאפ תמיד ייראה חי:
 * חלק פעילות, חלק עומדות לפוג, חלק כבר פגו.
 * @param {() => number} r
 * @param {string} slug
 * @param {{ id: string, name: string, email: string, phone: string, city: string }} person
 * @param {number} idx
 * @returns {import('$lib/memberships.js').Membership}
 */
function makeMembership(r, slug, person, idx) {
    const spec = PLANS[slug] ?? PLANS.cellular;
    const joinedDaysAgo = between(r, 20, 900);
    const joinedAt = new Date(Date.now() - joinedDaysAgo * DAY_MS);
    const months = pick(r, spec.months);
    const termMs = months * 30.4375 * DAY_MS;
    let expiresAt = months ? new Date(joinedAt.getTime() + termMs) : null;

    // חידושים: מי שהצטרף לפני שנתיים למסלול שנתי חידש אותו מאז, ותאריך
    // ההצטרפות שלו נשאר המקורי. בלי זה כל מי שוותיק היה מוצג כ"פג תוקף",
    // ורוב המסך היה אפור. lapsed = מיעוט שבאמת לא חידש.
    const lapsed = r() < 0.15;
    if (expiresAt && !lapsed) {
        while (expiresAt.getTime() < Date.now()) {
            expiresAt = new Date(expiresAt.getTime() + termMs);
        }
    }

    // רוב החברויות פעילות; מיעוט ממתין לאישור, ומה שתאריכו חלף מסומן כפג.
    const roll = r();
    /** @type {import('$lib/memberships.js').Membership['status']} */
    let status = 'active';
    if (roll < 0.08) status = 'pending';
    else if (roll < 0.13) status = 'cancelled';
    else if (expiresAt && expiresAt.getTime() < Date.now()) status = 'expired';

    // הרשמה שממתינה לאישור היא תמיד טרייה — אחרת "ממתין 700 יום" נראה שבור
    const joined = status === 'pending' ? new Date(Date.now() - between(r, 0, 9) * DAY_MS) : joinedAt;

    return {
        id: person.id + '-' + slug + '-' + idx,
        userId: person.id,
        userName: person.name,
        userEmail: person.email,
        userPhone: person.phone,
        userCity: person.city,
        campaignSlug: slug,
        plan: pick(r, spec.plans),
        provider: pick(r, spec.providers),
        status,
        joinedAt: joined.toISOString(),
        expiresAt: expiresAt ? expiresAt.toISOString() : undefined,
        monthlySaving: between(r, spec.saving[0], spec.saving[1]),
    };
}

/**
 * אדם + החברויות שלו, משוחזר מזרע קבוע.
 * @param {string} seed
 * @param {{ name?: string, email?: string, id?: string }} [override] פרטי המשתמש המחובר
 */
function makePerson(seed, override = {}) {
    const r = rng(seed);
    const first = pick(r, FIRST_NAMES);
    const last = pick(r, LAST_NAMES);
    const person = {
        id: override.id || 'u-' + hash(seed).toString(36),
        name: override.name || first + ' ' + last,
        email: override.email || 'demo' + (hash(seed) % 900) + '@example.com',
        phone: '05' + between(r, 0, 8) + '-' + between(r, 1000000, 9999999),
        city: pick(r, CITIES),
    };

    const slugs = joinableSlugs();
    const count = Math.min(slugs.length, between(r, 1, 3));
    /** @type {string[]} */
    const chosen = [];
    while (chosen.length < count) {
        const s = pick(r, slugs);
        if (!chosen.includes(s)) chosen.push(s);
    }
    return {
        ...person,
        memberships: chosen.map((slug, i) => makeMembership(r, slug, person, i)),
    };
}

/** כמה חברים יש במוקאפ. */
const MOCK_MEMBER_COUNT = 26;

/** @type {{ at: number, people: ReturnType<typeof makePerson>[] } | null} */
let cache = null;
// התאריכים נגזרים מ-Date.now(), ולכן המוקאפ נבנה מחדש כל שעה — אחרת
// "עוד 3 ימים" היה נשאר תקוע על אותו מספר כל עוד התהליך חי.
const CACHE_TTL_MS = 3_600_000;

function people() {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.people;
    const list = Array.from({ length: MOCK_MEMBER_COUNT }, (_, i) => makePerson('member-' + i));
    cache = { at: Date.now(), people: list };
    return list;
}

// ── ה-API שהמסכים צורכים ──────────────────────────────────────

/**
 * כל החברויות במערכת, החדשות קודם.
 * @returns {Promise<import('$lib/memberships.js').Membership[]>}
 */
export async function listAllMemberships() {
    return people()
        .flatMap((p) => p.memberships)
        .sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));
}

/**
 * החברויות מקובצות לפי אדם — הטבלה במסך "חברים".
 */
export async function listMembers() {
    return people()
        .map((p) => {
            const active = p.memberships.filter((m) => m.status === 'active');
            return {
                id: p.id,
                name: p.name,
                email: p.email,
                phone: p.phone,
                city: p.city,
                memberships: p.memberships,
                activeCount: active.length,
                totalSaved: p.memberships.reduce((s, m) => s + savedSoFar(m), 0),
                monthlySaving: active.reduce((s, m) => s + m.monthlySaving, 0),
                // תאריך ההצטרפות הראשון — "חבר מאז"
                memberSince: p.memberships.reduce(
                    (min, m) => (Date.parse(m.joinedAt) < Date.parse(min) ? m.joinedAt : min),
                    p.memberships[0]?.joinedAt ?? new Date().toISOString(),
                ),
            };
        })
        .sort((a, b) => b.totalSaved - a.totalSaved);
}

/**
 * החברויות של המשתמש המחובר.
 *
 * ⚠️ מוקאפ: אין עדיין קישור אמיתי בין חשבון לעסקאות, ולכן הרשומות נגזרות
 * דטרמיניסטית מהאימייל — כל משתמש רואה תמיד את אותו פרופיל, וזה נראה
 * אמיתי מספיק כדי לאשר את המסך. כשיהיה מקור אמת, כאן תבוא השאילתה.
 *
 * @param {{ id?: string | number, email?: string, name?: string, username?: string } | null | undefined} user
 * @returns {Promise<import('$lib/memberships.js').Membership[]>}
 */
export async function listMembershipsForUser(user) {
    if (!user?.email) return [];
    const person = makePerson('user:' + user.email.toLowerCase(), {
        id: String(user.id ?? user.email),
        name: user.name || user.username || undefined,
        email: user.email,
    });
    return person.memberships.sort((a, b) => Date.parse(b.joinedAt) - Date.parse(a.joinedAt));
}

/**
 * שינוי סטטוס של חברות (אישור / דחייה / ביטול / החזרה).
 *
 * ⚠️ מוקאפ: השינוי חי בזיכרון התהליך בלבד ונמחק ברענון המטמון או בפריסה
 * הבאה. הוא קיים כדי שהמסכים יהיו לחיצים ואפשר יהיה לאשר את ההתנהגות;
 * כשיגיע מקור אמת כאן תבוא הכתיבה אליו.
 *
 * @param {string} id
 * @param {import('$lib/memberships.js').Membership['status']} status
 */
export async function setMembershipStatus(id, status) {
    for (const p of people()) {
        const m = p.memberships.find((x) => x.id === id);
        if (!m) continue;
        m.status = status;
        return m;
    }
    return null;
}

/**
 * הארכת תקופת החברות במספר חודשים — מהתפוגה הנוכחית, או מהיום אם כבר פגה.
 * ⚠️ מוקאפ, כמו setMembershipStatus.
 * @param {string} id
 * @param {number} months
 */
export async function extendMembership(id, months) {
    for (const p of people()) {
        const m = p.memberships.find((x) => x.id === id);
        if (!m) continue;
        const base = Math.max(Date.now(), m.expiresAt ? Date.parse(m.expiresAt) : 0);
        m.expiresAt = new Date(base + months * 30.4375 * DAY_MS).toISOString();
        if (m.status === 'expired') m.status = 'active';
        return m;
    }
    return null;
}

/** מבנה מוני ההמתנה כשאין נתונים — נופלים לזה בכל כשל. */
export function noPendingCounts() {
    return { pending: 0, expiring: 0, ads: 0, ratings: 0, members: 0, total: 0 };
}

/**
 * הבועות האדומות בסרגל הניווט של הפאנל.
 * @param {{ ads?: number, ratings?: number }} [extra] מונים שמגיעים ממקורות אמיתיים
 */
export async function getPendingCounts(extra = {}) {
    const all = await listAllMemberships();
    const pending = all.filter((m) => m.status === 'pending').length;
    const expiring = all.filter((m) => m.status === 'active' && expiryState(m) === 'soon').length;
    const ads = extra.ads ?? 0;
    const ratings = extra.ratings ?? 0;
    return {
        pending,
        expiring,
        ads,
        ratings,
        members: new Set(all.map((m) => m.userId)).size,
        total: pending + expiring + ads + ratings,
    };
}
