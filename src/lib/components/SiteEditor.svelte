<script>
    import { get } from 'svelte/store';
    import { lang, t } from '$lib/i18n.js';
    import { flattenTexts } from '$lib/siteTexts.js';

    // עריכת כיתובים בתוך האתר (סופר-אדמין): גלגל השיניים הצף מבקש קוד
    // Google Authenticator, ואז כל כיתוב בדף נערך במקומו. המיפוי טקסט→מפתח
    // נעשה בזמן ריצה (כמו ב-PageTextEditor של חכמי העדה): כל text-node
    // שתוכנו שווה לערך של כיתוב ב-i18n נעטף ב-span contenteditable. בנוסף,
    // אלמנט עם data-site-edit="members" (מונה החברים) נערך כמספר.
    // השמירה כותבת דריסות (siteContentStore) - בלי דיפלוי - ומרעננת.

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
    /** @type {Map<HTMLElement, { key: string, original: string, node: Text }>} */
    let wrapped = new Map();
    /** @type {{ el: HTMLElement, original: string } | null} */
    let membersEl = null;

    /** @param {MouseEvent} e */
    function blockLinks(e) {
        // קישור שמכיל כיתוב נערך - לחיצה עליו עורכת ולא מנווטת
        const target = /** @type {HTMLElement | null} */ (e.target);
        if (target?.closest(`[${KEY_ATTR}],[data-site-edit]`)) e.preventDefault();
    }

    function countChanges() {
        let n = 0;
        for (const [el, info] of wrapped) if (el.innerText.trim() !== info.original) n++;
        if (membersEl && membersEl.el.innerText.trim() !== membersEl.original) n++;
        changedCount = n;
    }

    function enterEditMode() {
        // ערך → תור מפתחות; ערך שמופיע בכמה מפתחות משויך לפי סדר ההופעה בדף
        /** @type {Map<string, string[]>} */
        const byValue = new Map();
        for (const { path, value } of flattenTexts(get(t))) {
            const v = value.trim();
            if (!v || v.includes('<')) continue; // כיתובים עם HTML - דרך מסך הניהול
            const q = byValue.get(v);
            if (q) q.push(path);
            else byValue.set(v, [path]);
        }

        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        /** @type {{ node: Text, key: string, text: string }[]} */
        const toWrap = [];
        /** @type {Node | null} */
        let n;
        while ((n = walker.nextNode())) {
            const node = /** @type {Text} */ (n);
            const parent = node.parentElement;
            if (!parent || parent.closest('[data-se-ui],script,style,textarea,button,select,option,[data-site-edit]')) continue;
            const text = (node.textContent ?? '').trim();
            const q = text && byValue.get(text);
            if (q && q.length) toWrap.push({ node, key: /** @type {string} */ (q.shift()), text });
        }

        wrapped = new Map();
        for (const { node, key, text } of toWrap) {
            const span = document.createElement('span');
            span.setAttribute(KEY_ATTR, key);
            span.setAttribute('contenteditable', 'true');
            span.setAttribute('spellcheck', 'false');
            span.textContent = text;
            node.replaceWith(span);
            span.addEventListener('input', countChanges);
            wrapped.set(span, { key, original: text, node });
        }

        const m = /** @type {HTMLElement | null} */ (document.querySelector('[data-site-edit="members"]'));
        membersEl = m ? { el: m, original: m.innerText.trim() } : null;
        if (m) {
            m.setAttribute('contenteditable', 'true');
            m.setAttribute('inputmode', 'numeric');
            m.addEventListener('input', countChanges);
        }

        document.addEventListener('click', blockLinks, true);
        changedCount = 0;
        error = '';
        savedOk = false;
        editing = true;
    }

    function exitEditMode() {
        // מחזירים את ה-text-nodes המקוריים של Svelte, כדי שהדף ימשיך להתעדכן
        for (const [span, info] of wrapped) {
            info.node.textContent = info.original;
            span.replaceWith(info.node);
        }
        wrapped = new Map();
        if (membersEl) {
            membersEl.el.removeAttribute('contenteditable');
            membersEl.el.removeEventListener('input', countChanges);
            if (membersEl.el.innerText.trim() !== membersEl.original) location.reload();
            membersEl = null;
        }
        document.removeEventListener('click', blockLinks, true);
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
            const res = await fetch('/api/site-edit/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
            const value = el.innerText.trim();
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
    :global([data-site-edit][contenteditable]) {
        outline: 1px dashed rgba(245, 158, 11, 0.6);
        outline-offset: 2px;
        border-radius: 2px;
        cursor: text;
        min-width: 1ch;
    }
    :global([data-se-key]:hover),
    :global([data-site-edit][contenteditable]:hover) {
        outline-color: #f59e0b;
        background: rgba(245, 158, 11, 0.1);
    }
    :global([data-se-key]:focus),
    :global([data-site-edit][contenteditable]:focus) {
        outline: 2px solid #3b82f6;
        background: rgba(59, 130, 246, 0.1);
    }
</style>
