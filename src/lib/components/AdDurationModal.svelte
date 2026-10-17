<script>
    // חלון הקציבה (סופר-אדמין): כל מה שצריך לדעת על התקופה והתשלום של
    // הפרסומת, ושתי דרכי שינוי - מסלול ימים (נספר מיום האישור) או תאריך
    // תפוגה שרירותי. משותף למסך הניהול ול"הפרסומות שלי"; הפעולות עצמן הן
    // של /admin/ads (action="/admin/ads" מהאזור האישי).
    import { enhance } from "$app/forms";
    import { adPlans } from "$lib/adPlans.js";

    /**
     * @type {{
     *   ad: any,
     *   action?: string,
     *   onclose: () => void,
     *   onresult?: (result: any) => void,
     * }}
     */
    let { ad, action = "", onclose, onresult } = $props();

    // תקופות שאפשר לקצוב לפרסומת שכבר באתר (נספרות מיום האישור)
    const DURATION_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

    /** @param {string} iso */
    function fmtDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
    /** תאריך ISO → ערך של <input type="date">. @param {string} [iso] */
    const toDateInput = (iso) => (iso ? iso.slice(0, 10) : "");
    /** ימים שנותרו לפרסומת. @param {any} a */
    const daysLeftOf = (a) =>
        a?.expiresAt ? Math.ceil((Date.parse(a.expiresAt) - Date.now()) / 86400000) : null;
    /** סגירת החלון עם שליחת טופס מתוכו - הנתונים כבר נתפסו ע"י enhance */
    function closeOnSubmit() {
        onclose();
        return async (/** @type {{ result: any, update: () => Promise<void> }} */ { result, update }) => {
            onresult?.(result);
            await update();
        };
    }

    let plan = $derived(adPlans.find((/** @type {any} */ p) => p.days === ad.requestedDurationDays));
    let daysLeft = $derived(daysLeftOf(ad));
    let durOptions = $derived(
        ad.durationDays && !DURATION_OPTIONS.includes(ad.durationDays)
            ? [...DURATION_OPTIONS, ad.durationDays].sort((a, b) => a - b)
            : DURATION_OPTIONS,
    );
</script>

<svelte:window onkeydown={(e) => { if (e.key === "Escape") onclose(); }} />

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div class="qm-overlay" role="presentation" onclick={onclose}>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="qm-dialog" role="dialog" aria-modal="true" aria-label="קציבת תקופת פרסום" tabindex="-1"
         onclick={(e) => e.stopPropagation()}>
        <div class="qm-head">
            <h3>⏱ קציבת תקופה - {ad.title}</h3>
            <button type="button" class="a-btn ghost" onclick={onclose}>✕</button>
        </div>
        <!-- מה המפרסם שילם ומתי - כל הנתונים במקום אחד -->
        <dl class="qm-facts">
            <dt>מפרסם</dt>
            <dd>{ad.submittedBy?.name || '-'}
                {#if ad.submittedBy?.email}<span class="qm-dim">· {ad.submittedBy.email}</span>{/if}
            </dd>
            <dt>מסלול שנרכש</dt>
            <dd>{plan ? `${plan.label} - ${plan.price} ₪` : `${ad.requestedDurationDays || '-'} ימים`}</dd>
            <dt>סטטוס תשלום</dt>
            <dd class={ad.payment === 'code' ? 'qm-paid' : 'qm-unpaid'}>
                {ad.payment === 'code' ? '✓ שולם (אושר בקוד)' : '⏳ לתיאום מול המפרסם'}
            </dd>
            <dt>הוגש</dt><dd>{fmtDate(ad.submittedAt) || '-'}</dd>
            <dt>פורסם</dt><dd>{fmtDate(ad.decidedAt) || '-'}</dd>
            <dt>פג בתאריך</dt><dd>{fmtDate(ad.expiresAt) || '-'}</dd>
            <dt>נותרו</dt>
            <dd>{daysLeft === null ? '-' : `${daysLeft} ימים`}
                {#if ad.durationDays}<span class="qm-dim">מתוך {ad.durationDays}</span>{/if}
                {#if ad.paused}<span class="qm-dim">(מושהית)</span>{/if}
            </dd>
        </dl>
        <!-- דרך 1: קציבה במסלול ימים, נספרת מיום האישור -->
        <form method="POST" action="{action}?/setDuration" use:enhance={closeOnSubmit} class="qm-row">
            <input type="hidden" name="id" value={ad.id} />
            <label class="duration-label">
                תקופה מיום האישור:
                <select name="days" class="duration-select">
                    {#each durOptions as d (d)}
                        <option value={d} selected={d === ad.durationDays}>{d} ימים</option>
                    {/each}
                </select>
            </label>
            <button type="submit" class="a-btn approve">קצוב</button>
        </form>
        <!-- דרך 2: תאריך תפוגה שרירותי - הפרסומת יורדת בסוף היום שנבחר -->
        <form method="POST" action="{action}?/setExpiry" use:enhance={closeOnSubmit} class="qm-row">
            <input type="hidden" name="id" value={ad.id} />
            <label class="duration-label">
                או תאריך תפוגה:
                <input type="date" name="expires" required value={toDateInput(ad.expiresAt)} class="duration-select" />
            </label>
            <button type="submit" class="a-btn approve">קבע תאריך</button>
        </form>
        <p class="qm-note">
            קציבה במסלול נספרת מיום האישור, ולכן מסלול קצר מהזמן שכבר עבר מוריד את הפרסומת מיד.
            תאריך ידני קובע את התפוגה לסוף היום שנבחר - גם אחורה (הורדה מיידית) וגם קדימה.
        </p>
    </div>
</div>

<style>
    .qm-overlay {
        position: fixed; inset: 0; z-index: 60; background: rgba(0, 0, 0, 0.7);
        display: flex; align-items: center; justify-content: center;
        padding: 16px; overflow-y: auto;
    }
    .qm-dialog {
        width: 100%; max-width: 430px; margin: auto 0;
        background: #0f172a; border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 16px; padding: 20px; color: #e5e7eb; text-align: right;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
    }
    .qm-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
    .qm-head h3 { margin: 0; font-size: 1rem; color: #fff; }
    .qm-facts {
        display: grid; grid-template-columns: auto 1fr; gap: 6px 12px;
        margin: 0 0 16px; font-size: 0.8rem;
    }
    .qm-facts dt { color: #94a3b8; font-weight: 700; }
    .qm-facts dd { margin: 0; }
    .qm-dim { color: #64748b; }
    .qm-paid { color: #6ee7b7; font-weight: 800; }
    .qm-unpaid { color: #fcd34d; font-weight: 800; }
    .qm-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .qm-note { margin: 12px 0 0; font-size: 0.7rem; color: #64748b; line-height: 1.5; }

    .a-btn {
        padding: 0.45rem 1rem; border-radius: 0.6rem; border: none;
        font-weight: 800; font-size: 0.8rem; cursor: pointer; font-family: inherit;
        display: inline-flex; align-items: center; transition: all 0.15s;
    }
    .a-btn.approve { background: #16a34a; color: #fff; }
    .a-btn.approve:hover { background: #22c55e; }
    .a-btn.ghost { background: rgba(255, 255, 255, 0.08); color: #d1d5db; border: 1px solid rgba(255, 255, 255, 0.15); }
    .a-btn.ghost:hover { color: #fff; }
    .duration-label {
        display: inline-flex; align-items: center; gap: 0.35rem;
        font-size: 0.75rem; color: #9ca3af; font-weight: 700;
    }
    .duration-select {
        padding: 0.4rem 0.5rem; border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff; font-size: 0.75rem; font-weight: 700; font-family: inherit; cursor: pointer;
    }
</style>
