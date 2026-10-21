// ============================================================
// textReplace.js — כיתובים שנערכו בגלגל ⚙️ ואין להם מפתח בקוד.
//
// כיתוב של i18n או של עסקה נשמר כדריסה של הנתונים עצמם (SiteEditor).
// כל טקסט אחר בדף (טקסט קבוע בקומפוננטה, מספר בטבלה, placeholder של
// תיבה) נשמר כהחלפה לפי הטקסט המקורי: { "<מקור>": "<חדש>" } ("" = נמחק), ומוחל כאן
// בדפדפן על כל text-node שתוכנו (אחרי trim) זהה למקור - כמו העורך המשותף
// של שאר אתרי הרשת (community-backend/public/site-editor.js).
// כיתוב עם אותיות - לכל האתר; מספר בלבד - לדף שבו נערך (מפתח "@<נתיב>|<מספר>").
// ============================================================

const SKIP = 'script,style,noscript,textarea,input,select,option,svg,[data-no-edit],[data-se-ui],[data-se-key]';
const PH = 'input[placeholder],textarea[placeholder]';
const HAS_LETTER = /\p{L}/u;

/** @type {Map<string, string>} */
let replacements = new Map();
let touched = false; // הוחלה לפחות החלפה אחת - שומרים עקביות גם אם המפה התרוקנה
let paused = false;
let scheduled = false;
/** @type {Set<Node>} */
const pending = new Set();
/** text-node / תיבה -> הטקסט המקורי, כשהחלפנו אותו @type {WeakMap<Node, string>} */
const originals = new WeakMap();
/** text-node / תיבה -> הערך שכתבנו (לזיהוי שהוא עדיין שלנו) @type {WeakMap<Node, string>} */
const applied = new WeakMap();
/** @type {MutationObserver | null} */
let observer = null;

/** המפתח של החלפה: כיתוב עם אותיות - לכל האתר; מספר בלבד - לדף הנוכחי בלבד */
export function replaceKeyFor(/** @type {string} */ orig) {
    return HAS_LETTER.test(orig) ? orig : `@${location.pathname}|${orig}`;
}

/** @param {string} raw */
function split(raw) {
    const t = raw.trim();
    const i = raw.indexOf(t);
    return { t, lead: raw.slice(0, i), trail: raw.slice(i + t.length) };
}

/** @param {Text} node */
function applyNode(node) {
    const raw = node.nodeValue ?? '';
    const t = raw.trim();
    const prev = originals.get(node);
    const mine = prev !== undefined && applied.get(node) === raw;
    // ריק - אלא אם זה טקסט שאנחנו מחקנו (החלפה ריקה), שאולי צריך להחזיר
    if (!t && !mine) return;
    if (!mine) {
        originals.delete(node);
        applied.delete(node);
    }
    const orig = mine ? /** @type {string} */ (prev) : t;
    const next = replacements.get(replaceKeyFor(orig));
    if (next === undefined || next === orig) {
        if (mine) {
            // ההחלפה בוטלה - חוזרים לטקסט שבקוד
            const s = split(raw);
            node.nodeValue = s.lead + orig + s.trail;
            originals.delete(node);
            applied.delete(node);
        }
        return;
    }
    if (mine && next === t) return;
    const p = split(raw);
    const value = p.lead + next + p.trail;
    node.nodeValue = value;
    originals.set(node, orig);
    applied.set(node, value);
    touched = true;
}

/** @param {Element} box */
function applyPlaceholder(box) {
    const cur = box.getAttribute('placeholder') ?? '';
    const prev = originals.get(box);
    const mine = prev !== undefined && applied.get(box) === cur;
    if (!mine) {
        originals.delete(box);
        applied.delete(box);
    }
    const orig = mine ? /** @type {string} */ (prev) : cur.trim();
    if (!orig) return;
    const next = replacements.get(replaceKeyFor(orig));
    if (next === undefined || next === orig) {
        if (mine) {
            box.setAttribute('placeholder', orig);
            originals.delete(box);
            applied.delete(box);
        }
        return;
    }
    if (mine && next === cur) return;
    box.setAttribute('placeholder', next);
    originals.set(box, orig);
    applied.set(box, next);
    touched = true;
}

/** הטקסט שבקוד של text-node שאולי הוחלף - המפתח שבו ההחלפה נשמרת */
export function originalTextOf(/** @type {Text} */ node) {
    const raw = node.nodeValue ?? '';
    const prev = originals.get(node);
    return prev !== undefined && applied.get(node) === raw ? prev : raw.trim();
}

/** ה-placeholder שבקוד של תיבה שאולי הוחלף */
export function originalPlaceholderOf(/** @type {Element} */ box) {
    const cur = box.getAttribute('placeholder') ?? '';
    const prev = originals.get(box);
    return prev !== undefined && applied.get(box) === cur ? prev : cur.trim();
}

/** @param {Node} root */
function applyTree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
        if (!root.parentElement?.closest(SKIP)) applyNode(/** @type {Text} */ (root));
        return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE) return;
    const el = /** @type {Element} */ (root);
    if (el.matches(PH)) {
        if (!el.closest('[data-no-edit],[data-se-ui]')) applyPlaceholder(el);
        return;
    }
    if (el.closest(SKIP)) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
            if (n.nodeType === Node.ELEMENT_NODE) {
                const e = /** @type {Element} */ (n);
                if (e.matches(PH)) {
                    applyPlaceholder(e);
                    return NodeFilter.FILTER_REJECT;
                }
                return e.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
            }
            return NodeFilter.FILTER_ACCEPT;
        },
    });
    let n;
    while ((n = walker.nextNode())) applyNode(/** @type {Text} */ (n));
}

function flush() {
    scheduled = false;
    if (paused || (replacements.size === 0 && !touched)) {
        pending.clear();
        return;
    }
    const nodes = [...pending];
    pending.clear();
    for (const n of nodes) if (n.isConnected) applyTree(n);
}

function schedule() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(flush, 0);
}

function ensureObserver() {
    if (observer) return;
    observer = new MutationObserver((records) => {
        // בלי החלפות (המצב הרגיל) - אפס עבודה על כל שינוי DOM
        if (paused || (replacements.size === 0 && !touched)) return;
        for (const r of records) {
            if (r.type === 'childList') r.addedNodes.forEach((n) => pending.add(n));
            else pending.add(r.target); // characterData / placeholder
        }
        if (pending.size) schedule();
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder'],
    });
}

/** המפה שנשמרה (מה-layout). מחילים מיד על כל הדף, ומכאן על כל תוכן חדש. */
export function setTextReplacements(/** @type {Record<string, string>} */ map) {
    replacements = new Map(Object.entries(map ?? {}));
    if (replacements.size === 0 && !touched) return;
    ensureObserver();
    // סינכרונית ולא בתור - כדי שהטקסט הישן כמעט לא יבהב אחרי הטעינה
    if (!paused) applyTree(document.body);
}

/** אחרי ניווט: מספרים נשמרים לפי דף, ולכן מחילים מחדש על מה שנשאר על המסך */
export function refreshTextReplacements() {
    if (replacements.size === 0 && !touched) return;
    pending.add(document.body);
    schedule();
}

/** במצב עריכה ההחלפה עוצרת (העורך עוטף את הטקסטים), ביציאה - מוחלת מחדש */
export function pauseTextReplacements(/** @type {boolean} */ value) {
    paused = value;
    if (!value) refreshTextReplacements();
}
