<script>
    import { get } from 'svelte/store';
    import { page } from '$app/stores';
    import { lang, t } from '$lib/i18n.js';
    import { flattenTexts } from '$lib/siteTexts.js';
    import {
        replaceKeyFor,
        originalTextOf,
        originalPlaceholderOf,
        pauseTextReplacements,
    } from '$lib/textReplace.js';

    // עריכת כיתובים בתוך האתר (סופר-אדמין): גלגל השיניים הצף מבקש קוד
    // Google Authenticator, ואז כל טקסט בדף נערך במקומו - גם בתוך כפתורים
    // וקישורים, גם מספרים, וגם תוכן שנטען אחרי הכניסה למצב עריכה:
    //  - text-node שתוכנו שווה לכיתוב ב-i18n או לשדה של עסקה - נשמר כדריסה
    //    של הנתונים עצמם (siteContentStore / campaignsStore);
    //  - כל טקסט אחר, ו-placeholder של תיבה (לחיצה על התיבה) - נשמר כהחלפה
    //    לפי הטקסט המקורי (text:<מקור>), ומוחל בדפדפן (textReplace.js);
    //  - data-site-edit="members" (מונה החברים) נערך כמספר, ותאים עם
    //    data-se-cell בתוך data-se-table (טבלאות המסלולים) נערכים במקומם.
    // השמירה כותבת דריסות - בלי דיפלוי - ומרעננת.

    let { verified = false } = $props();

    let isVerified = $state(false);
    $effect.pre(() => {
        isVerified = verified;
    });

    let editing = $state(false);
    let askCode = $state(false);
    let code = $state('');
    let busy = $state(false);
    let error = $state('');
    let savedOk = $state(false);
    let changedCount = $state(0);

    const KEY_ATTR = 'data-se-key';
    /** orig - הטקסט שבקוד (חזרה אליו מוחקת את ההחלפה); raw/extras - לשחזור הרווחים סביב הטקסט
     * @type {Map<HTMLElement, { key: string, original: string, orig: string, raw: string, node: Text, extras: Text[] }>} */
    let wrapped = new Map();
    /** תיבות עם placeholder @type {Map<HTMLElement, { key: string, orig: string, shown: string }>} */
    let boxes = new Map();
    /** @type {{ el: HTMLElement, original: string } | null} */
    let membersEl = null;
    /** תאי טבלאות המסלולים - מפתח campaign:<slug>:<טבלה>:<נתיב בטבלה>
     * @type {Map<HTMLElement, { key: string, html: boolean, original: string }>} */
    let cells = new Map();
    /** ערך → תור מפתחות i18n/עסקה; ערך שמופיע בכמה מפתחות משויך לפי סדר ההופעה בדף
     * @type {Map<string, string[]>} */
    let byValue = new Map();
    /** @type {MutationObserver | null} */
    let editObserver = null;

    const EDITABLE_SELECTOR = `[${KEY_ATTR}],[data-site-edit][contenteditable],[data-se-cell][contenteditable]`;
    const NO_WRAP =
        '[data-se-ui],[data-se-key],[data-site-edit],[data-se-cell],[data-no-edit],[contenteditable],script,style,noscript,textarea,input,select,option,svg';
    const PH = 'input[placeholder],textarea[placeholder]';
    const HAS_TEXT = /[\p{L}\p{N}]/u;

    /** תוכן התא לשמירה: תא HTML נשמר כ-HTML (בלי סמני ההידרציה של Svelte) */
    function cellValue(/** @type {HTMLElement} */ el, /** @type {boolean} */ html) {
        return html ? el.innerHTML.replace(/<!--[\s\S]*?-->/g, '').trim() : el.innerText.trim();
    }

    /** textContent ולא innerText: innerText מושפע מ-CSS (text-transform) ואז כיתוב שלא נגעו בו נראה "ששונה" */
    function spanValue(/** @type {HTMLElement} */ span) {
        return (span.querySelector('br,div,p') ? span.innerText : (span.textContent ?? '')).trim();
    }

    function boxValue(/** @type {HTMLElement} */ box) {
        return (box.getAttribute('placeholder') ?? '').trim();
    }

    /** placeholder נערך בחלון קטן - אין לו טקסט שאפשר להקליד בתוכו */
    function editBox(/** @type {HTMLElement} */ box) {
        const b = boxes.get(box);
        if (!b) return;
        const v = prompt('הטקסט שמופיע בתוך התיבה (ריק = חזרה לנוסח המקורי):', boxValue(box));
        if (v === null) return;
        const next = v.trim() || b.orig;
        for (const [other, o] of boxes) if (o.key === b.key) other.setAttribute('placeholder', next);
        countChanges();
    }

    /** @param {MouseEvent} e */
    function blockLinks(e) {
        const target = /** @type {HTMLElement | null} */ (e.target);
        if (!target?.closest || target.closest('[data-se-ui]')) return;
        const box = /** @type {HTMLElement | null} */ (target.closest('[data-se-ph]'));
        if (box) {
            e.preventDefault();
            e.stopPropagation();
            editBox(box);
            return;
        }
        // במצב עריכה אין ניווט ואין הפעלת כפתורים - גם לא מטפלי הלחיצה של
        // האתר (מעקב, הודעת "מוקפא"). כרטיסים שמכוסים בקישור שקוף (כמו כרטיסי
        // העסקאות) "בולעים" את הלחיצה - מחפשים את הכיתוב שמתחת לסמן ומעבירים
        // אליו את הפוקוס, עם הסמן במקום שנלחץ.
        if (!target.closest('input,textarea,select') && target.closest('a,button,label,summary,[role="button"]')) {
            e.preventDefault();
            e.stopPropagation();
        }
        if (target.closest(EDITABLE_SELECTOR)) return;
        const hit = /** @type {HTMLElement | undefined} */ (
            document.elementsFromPoint(e.clientX, e.clientY).find((el) => el.matches(EDITABLE_SELECTOR))
        );
        if (!hit) return;
        e.preventDefault();
        e.stopPropagation();
        hit.focus();
        const range = document.caretRangeFromPoint?.(e.clientX, e.clientY);
        if (range && hit.contains(range.startContainer)) {
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }

    // שדות טקסט של עסקה שנערכים מתוך הדף - נשמרים כדריסה של העסקה
    // (campaignsStore), כמו במסך עריכת העסקה בפאנל
    const CAMPAIGN_TEXT_FIELDS = [
        'title',
        'description',
        'providers_line',
        'join_cta_subtitle',
        'new_badge_text',
        'plans_table_note',
        'plans_table_diesel_note',
    ];

    /** כיתובי העסקאות שבדף הנוכחי, כ-{ path, value } עם מפתח campaign:<slug>:<שדה> */
    function campaignTexts() {
        const pageData = /** @type {any} */ (get(page).data);
        const list = [...(pageData?.campaigns ?? []), ...(pageData?.campaign ? [pageData.campaign] : [])];
        return list.flatMap((c) =>
            CAMPAIGN_TEXT_FIELDS.filter((f) => typeof c?.[f] === 'string').map((f) => ({
                path: `campaign:${c.slug}:${f}`,
                value: c[f],
            })),
        );
    }

    function countChanges() {
        // לפי מפתח ולא לפי הופעה - כיתוב שחוזר בכמה כרטיסים הוא שינוי אחד
        const keys = new Set();
        for (const [el, info] of wrapped) if (spanValue(el) !== info.original) keys.add(info.key);
        for (const [box, b] of boxes) if (boxValue(box) !== b.shown) keys.add(b.key);
        if (membersEl && membersEl.el.innerText.trim() !== membersEl.original) keys.add('members');
        for (const [el, info] of cells) if (cellValue(el, info.html) !== info.original) keys.add(info.key);
        changedCount = keys.size;
    }

    /** @param {Text} node */
    function wrapNode(node) {
        const parent = node.parentElement;
        const raw = node.nodeValue ?? '';
        const shown = raw.trim();
        // טקסט עם אות או ספרה (לא סימנים/אימוג'י בלבד), שעוד לא נעטף, מחוץ לאזורים שלא עורכים
        if (!parent || !shown || !HAS_TEXT.test(shown) || parent.closest(NO_WRAP)) return;

        // כיתוב שחוזר בדף (למשל "סטטוס:" בכל כרטיס עסקה) - כל ההופעות
        // נערכות. אחרי שנגמרו המפתחות בתור, ההופעות הבאות שייכות לאחרון.
        const q = byValue.get(shown);
        let key, orig;
        if (q?.length) {
            key = /** @type {string} */ (q.length > 1 ? q.shift() : q[0]);
            orig = shown;
        } else {
            orig = originalTextOf(node);
            key = `text:${replaceKeyFor(orig)}`;
        }

        const at = raw.indexOf(shown);
        const lead = raw.slice(0, at);
        const trail = raw.slice(at + shown.length);
        const span = document.createElement('span');
        span.setAttribute(KEY_ATTR, key);
        span.setAttribute('contenteditable', 'true');
        span.setAttribute('spellcheck', 'false');
        span.textContent = shown;
        /** @type {Text[]} */
        const extras = [];
        /** @type {Node[]} */
        const parts = [];
        if (lead) {
            const a = document.createTextNode(lead);
            extras.push(a);
            parts.push(a);
        }
        parts.push(span);
        if (trail) {
            const b = document.createTextNode(trail);
            extras.push(b);
            parts.push(b);
        }
        node.replaceWith(...parts);
        span.addEventListener('input', () => {
            // אותו כיתוב בשאר הדף מתעדכן יחד, כדי שלא ייראה כאילו רק הופעה אחת השתנתה
            const v = spanValue(span);
            for (const [other, info] of wrapped) {
                if (other !== span && info.key === key) other.textContent = v;
            }
            countChanges();
        });
        wrapped.set(span, { key, original: shown, orig, raw, node, extras });
    }

    /** @param {HTMLElement} box */
    function markBox(box) {
        if (boxes.has(box) || box.closest('[data-no-edit],[data-se-ui]')) return;
        const shown = boxValue(box);
        if (!shown) return;
        const orig = originalPlaceholderOf(box);
        box.setAttribute('data-se-ph', '');
        boxes.set(box, { key: `text:${replaceKeyFor(orig)}`, orig, shown });
    }

    /** כל הטקסטים והתיבות שתחת root (אוספים קודם - העטיפה משנה את העץ) */
    function wrapTree(/** @type {Node} */ root) {
        if (root.nodeType === Node.TEXT_NODE) {
            wrapNode(/** @type {Text} */ (root));
            return;
        }
        if (root.nodeType !== Node.ELEMENT_NODE) return;
        const el = /** @type {HTMLElement} */ (root);
        /** @type {Text[]} */
        const nodes = [];
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let n;
        while ((n = walker.nextNode())) nodes.push(/** @type {Text} */ (n));
        nodes.forEach(wrapNode);
        if (el.matches(PH)) markBox(el);
        el.querySelectorAll(PH).forEach((b) => markBox(/** @type {HTMLElement} */ (b)));
    }

    function enterEditMode() {
        byValue = new Map();
        for (const { path, value } of [...flattenTexts(get(t)), ...campaignTexts()]) {
            const v = value.trim();
            if (!v || v.includes('<')) continue; // כיתובים עם HTML - דרך מסך הניהול
            const q = byValue.get(v);
            if (q) q.push(path);
            else byValue.set(v, [path]);
        }

        pauseTextReplacements(true);
        wrapped = new Map();
        boxes = new Map();
        wrapTree(document.body);

        const m = /** @type {HTMLElement | null} */ (document.querySelector('[data-site-edit="members"]'));
        membersEl = m ? { el: m, original: m.innerText.trim() } : null;
        if (m) {
            m.setAttribute('contenteditable', 'true');
            m.setAttribute('inputmode', 'numeric');
            m.addEventListener('input', countChanges);
        }

        cells = new Map();
        for (const el of /** @type {NodeListOf<HTMLElement>} */ (document.querySelectorAll('[data-se-table] [data-se-cell]'))) {
            const table = el.closest('[data-se-table]')?.getAttribute('data-se-table');
            const html = el.hasAttribute('data-se-html');
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('spellcheck', 'false');
            el.addEventListener('input', countChanges);
            cells.set(el, { key: `${table}:${el.getAttribute('data-se-cell')}`, html, original: cellValue(el, html) });
        }

        // תוכן שנטען אחרי הכניסה למצב עריכה (רשימה שהגיעה מהשרת, פרסומות) נעשה גם הוא ניתן לעריכה
        editObserver = new MutationObserver((records) => {
            for (const r of records) r.addedNodes.forEach((n) => n.isConnected && wrapTree(n));
        });
        editObserver.observe(document.body, { childList: true, subtree: true });

        document.addEventListener('click', blockLinks, true);
        changedCount = 0;
        error = '';
        savedOk = false;
        editing = true;
    }

    function exitEditMode() {
        editObserver?.disconnect();
        editObserver = null;
        // מחזירים את ה-text-nodes המקוריים של Svelte, כדי שהדף ימשיך להתעדכן
        for (const [span, info] of wrapped) {
            info.node.nodeValue = info.raw;
            span.replaceWith(info.node);
            info.extras.forEach((x) => x.remove());
        }
        wrapped = new Map();
        for (const [box, b] of boxes) {
            box.setAttribute('placeholder', b.shown);
            box.removeAttribute('data-se-ph');
        }
        boxes = new Map();
        if (membersEl) {
            membersEl.el.removeAttribute('contenteditable');
            membersEl.el.removeEventListener('input', countChanges);
            if (membersEl.el.innerText.trim() !== membersEl.original) location.reload();
            membersEl = null;
        }
        // התאים שייכים ל-Svelte ואי אפשר להחזיר אותם למקור - תא שנערך ובוטל מרענן
        let cellChanged = false;
        for (const [el, info] of cells) {
            if (cellValue(el, info.html) !== info.original) cellChanged = true;
            el.removeAttribute('contenteditable');
            el.removeEventListener('input', countChanges);
        }
        cells = new Map();
        if (cellChanged) location.reload();
        document.removeEventListener('click', blockLinks, true);
        pauseTextReplacements(false);
        editing = false;
        changedCount = 0;
    }

    function onGear() {
        error = '';
        // הדריסות חלות על העברית בלבד - עריכה בשפה אחרת הייתה נשמרת כעברית
        if (get(lang) !== 'he') {
            alert('עריכת כיתובים זמינה בעברית בלבד - החליפו שפה לעברית');
            return;
        }
        if (isVerified) enterEditMode();
        else askCode = true;
    }

    async function verifyCode() {
        if (busy) return;
        busy = true;
        error = '';
        try {
            // באתר החי - מול השרת המשותף של הרשת: הוא מנפיק עוגייה לכל *.gofreeil.com,
            // כך שאותו קוד פותח את העריכה גם בשאר האתרים (וזו מתקבלת כאן, ראו superAdminTotp.js)
            const network = /(^|\.)gofreeil\.com$/.test(location.hostname);
            const res = await fetch(network ? 'https://api.gofreeil.com/api/site-edit/verify' : '/api/site-edit/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: network ? 'include' : 'same-origin',
                body: JSON.stringify({ code }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || 'האימות נכשל');
            isVerified = true;
            askCode = false;
            code = '';
        } catch (e) {
            error = e instanceof Error ? e.message : 'האימות נכשל';
        } finally {
            busy = false;
        }
    }

    /** קוד מהגלגל: אימות ואז מצב עריכה. באמצע עריכה (תוקף פג): אימות ואז שמירה. */
    async function submitCode() {
        await verifyCode();
        if (!isVerified) return;
        if (editing) await saveAll();
        else enterEditMode();
    }

    async function saveAll() {
        if (busy) return;
        /** @type {Record<string, string>} */
        const texts = {};
        for (const [el, info] of wrapped) {
            const value = spanValue(el);
            if (value === info.original) continue;
            // החלפה שחזרה לנוסח שבקוד נשלחת כריקון - ההחלפה נמחקת (גם במפתח-דף של מספר)
            texts[info.key] = info.key.startsWith('text:') && value === info.orig ? '' : value;
        }
        for (const [box, b] of boxes) {
            const value = boxValue(box);
            if (value !== b.shown) texts[b.key] = value === b.orig ? '' : value;
        }
        for (const [el, info] of cells) {
            const value = cellValue(el, info.html);
            if (value !== info.original) texts[info.key] = value;
        }
        /** @type {Record<string, any>} */
        const payload = { texts };
        if (membersEl && membersEl.el.innerText.trim() !== membersEl.original) {
            payload.members = membersEl.el.innerText.trim();
        }
        if (!Object.keys(texts).length && !('members' in payload)) {
            exitEditMode();
            return;
        }
        busy = true;
        error = '';
        try {
            const res = await fetch('/api/site-edit/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => ({}));
            if (res.status === 401) {
                // פג תוקף האימות (12 שעות) - מבקשים קוד מחדש בלי לאבד את העריכות
                isVerified = false;
                askCode = true;
                throw new Error('פג תוקף האימות - הזינו קוד חדש ושמרו שוב');
            }
            if (!res.ok) throw new Error(body?.error || 'השמירה נכשלה');
            savedOk = true;
            setTimeout(() => location.reload(), 600);
        } catch (e) {
            error = e instanceof Error ? e.message : 'השמירה נכשלה';
            busy = false;
        }
    }
</script>

{#if !editing && !askCode}
    <button type="button" class="gear" data-se-ui onclick={onGear} title="עריכת כיתובי האתר" aria-label="עריכת כיתובי האתר"
        >⚙️</button
    >
{/if}

{#if askCode}
    <div class="panel code-panel" data-se-ui>
        <form
            onsubmit={(e) => {
                e.preventDefault();
                submitCode();
            }}
        >
            <span class="label">🔐 קוד מ-Google Authenticator</span>
            <!-- svelte-ignore a11y_autofocus -->
            <input
                class="code"
                bind:value={code}
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                placeholder="000000"
                autofocus
            />
            <button class="primary" disabled={busy || code.replace(/\D/g, '').length !== 6}>{busy ? '…' : 'אישור'}</button>
            <button
                type="button"
                class="ghost"
                onclick={() => {
                    askCode = false;
                    error = '';
                }}>ביטול</button
            >
        </form>
        {#if error}<span class="err">{error}</span>{/if}
    </div>
{/if}

{#if editing && !askCode}
    <div class="panel" data-se-ui>
        {#if savedOk}
            <span class="ok">✅ נשמר! מרענן…</span>
        {:else}
            <span class="label">⚙️ לחצו על כיתוב וערכו אותו{changedCount ? ` · ${changedCount} שונו` : ''}</span>
            {#if error}<span class="err" title={error}>{error}</span>{/if}
            <button type="button" class="ghost" onclick={exitEditMode} disabled={busy}>ביטול</button>
            <button type="button" class="primary" onclick={saveAll} disabled={busy || changedCount === 0}
                >{busy ? 'שומר…' : 'שמירה'}</button
            >
        {/if}
    </div>
{/if}

<style>
    .gear {
        position: fixed;
        bottom: 1rem;
        left: 1rem;
        z-index: 9990;
        width: 2.75rem;
        height: 2.75rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(15, 23, 42, 0.85);
        font-size: 1.35rem;
        line-height: 1;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
        opacity: 0.7;
        transition:
            opacity 0.2s,
            transform 0.3s;
    }
    .gear:hover {
        opacity: 1;
        transform: rotate(60deg);
    }
    .panel {
        position: fixed;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9991;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        max-width: calc(100vw - 2rem);
        box-sizing: border-box;
        padding: 0.55rem 1rem;
        border-radius: 1.25rem;
        border: 1px solid rgba(245, 158, 11, 0.5);
        background: rgba(15, 23, 42, 0.96);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        color: #e2e8f0;
        direction: rtl;
    }
    .panel form {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
    }
    .label {
        font-size: 0.8rem;
        font-weight: 700;
        white-space: nowrap;
    }
    .code {
        width: 6.5rem;
        direction: ltr;
        text-align: center;
        letter-spacing: 0.3em;
        font-size: 1.05rem;
        font-weight: 800;
        border-radius: 0.6rem;
        border: 1px solid rgba(255, 255, 255, 0.25);
        background: rgba(0, 0, 0, 0.35);
        color: #fff;
        padding: 0.3rem 0.4rem;
    }
    .primary,
    .ghost {
        border-radius: 999px;
        padding: 0.35rem 1rem;
        font-size: 0.85rem;
        font-weight: 800;
        cursor: pointer;
    }
    .primary {
        border: none;
        background: #22c55e;
        color: #052e16;
    }
    .ghost {
        border: 1px solid rgba(255, 255, 255, 0.3);
        background: transparent;
        color: #e2e8f0;
    }
    .primary:disabled,
    .ghost:disabled {
        opacity: 0.55;
        cursor: default;
    }
    .err {
        font-size: 0.75rem;
        font-weight: 700;
        color: #fca5a5;
    }
    .ok {
        font-size: 0.85rem;
        font-weight: 800;
        color: #86efac;
    }
    :global([data-se-key]),
    :global([data-site-edit][contenteditable]),
    :global([data-se-cell][contenteditable]) {
        /* אזורים שמעבירים לחיצות הלאה (pointer-events:none, כמו בלוק הסטטוס
           בכרטיסי העסקאות) - הכיתוב עצמו כן תופס את הלחיצה */
        pointer-events: auto;
        outline: 1px dashed rgba(245, 158, 11, 0.6);
        outline-offset: 2px;
        border-radius: 2px;
        cursor: text;
        min-width: 1ch;
        /* גם בתוך כפתורים עם user-select:none */
        -webkit-user-select: text;
        user-select: text;
    }
    :global([data-se-ph]) {
        outline: 1px dashed rgba(245, 158, 11, 0.6) !important;
        outline-offset: 2px;
        cursor: pointer !important;
    }
    :global([data-se-key]:hover),
    :global([data-site-edit][contenteditable]:hover),
    :global([data-se-cell][contenteditable]:hover) {
        outline-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
    }
    :global([data-se-key]:focus),
    :global([data-site-edit][contenteditable]:focus),
    :global([data-se-cell][contenteditable]:focus) {
        outline: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
    }
</style>
