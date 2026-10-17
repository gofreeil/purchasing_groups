<script>
    // תצוגה מקדימה של הכרטיס כפי שהוא באמת מוצג בטור הפרסומות באתר:
    // ריחוף על כותרת פרסומת (דסקטופ) = הכרטיס צף ליד הכותרת; הקשה עליה
    // (נייד/דסקטופ) = מודאל עם הכרטיס. משותפת למסך הניהול (/admin/ads)
    // ול"הפרסומות שלי" באזור האישי - הדף מחזיק ref וקורא show/hide/open.
    import AdCardPreview from "./AdCardPreview.svelte";

    /** @type {{ ad: any, x: number, y: number } | null} */
    let hoverPreview = $state(null);
    /** @type {any} */
    let modalPreviewAd = $state(null);
    const PREVIEW_W = 144, PREVIEW_H = 490; // מידות הכרטיס האמיתי בטור (144px + יחס 144/450)

    /** ריחוף על הכותרת. @param {MouseEvent} e @param {any} ad */
    export function show(e, ad) {
        // מסך מגע - אין ריחוף אמיתי; ההקשה פותחת את המודאל במקום
        if (!ad || window.matchMedia("(hover: none)").matches) return;
        const r = /** @type {HTMLElement} */ (e.currentTarget).getBoundingClientRect();
        // הכרטיס צף משמאל לכותרת, מוצמד לגבולות המסך (fixed) - כדי
        // ששום מכל גלילה לא יחתוך אותו
        const y = Math.max(8, Math.min(window.innerHeight - PREVIEW_H - 8, r.top + r.height / 2 - PREVIEW_H / 2));
        const x = Math.max(8, r.left - PREVIEW_W - 16);
        hoverPreview = { ad, x, y };
    }

    export function hide() {
        hoverPreview = null;
    }

    /** הקשה על הכותרת. @param {any} ad */
    export function open(ad) {
        hoverPreview = null;
        modalPreviewAd = ad ?? null;
    }
</script>

<!-- תצוגה מקדימה צפה בריחוף על הכותרת (דסקטופ בלבד) -->
{#if hoverPreview}
    <div class="hover-preview" style="left:{hoverPreview.x}px; top:{hoverPreview.y}px">
        <AdCardPreview ad={hoverPreview.ad} />
    </div>
{/if}

<!-- מודאל תצוגה מקדימה בהקשה על הכותרת (נייד ודסקטופ) -->
{#if modalPreviewAd}
    <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
    <div class="preview-backdrop" role="presentation" onclick={() => (modalPreviewAd = null)}>
        <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
        <div
            class="preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="תצוגה מקדימה של הפרסומת"
            tabindex="-1"
            onclick={(e) => e.stopPropagation()}
        >
            <AdCardPreview ad={modalPreviewAd} />
            <div class="preview-actions">
                <a href="/ads/{modalPreviewAd.id}" target="_blank" rel="noopener" class="preview-btn">פתח דף נחיתה</a>
                <button type="button" class="preview-btn" onclick={() => (modalPreviewAd = null)}>✕ סגור</button>
            </div>
        </div>
    </div>
{/if}

<svelte:window onkeydown={(e) => { if (e.key === "Escape") { modalPreviewAd = null; hoverPreview = null; } }} />

<style>
    /* התצוגה המקדימה הצפה בריחוף - מחוץ לכל מכל גלילה (fixed) */
    .hover-preview {
        position: fixed;
        z-index: 40;
        pointer-events: none;
        filter: drop-shadow(0 25px 25px rgba(0, 0, 0, 0.5));
    }
    /* במסכים צרים אין ריחוף אמיתי - המודאל מחליף אותה */
    @media (max-width: 768px) {
        .hover-preview { display: none; }
    }

    .preview-backdrop {
        position: fixed;
        inset: 0;
        z-index: 50;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow-y: auto;
    }
    .preview-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        margin: auto 0;
    }
    .preview-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    .preview-btn {
        padding: 0.45rem 1rem;
        border-radius: 0.6rem;
        background: rgba(255, 255, 255, 0.08);
        color: #d1d5db;
        border: 1px solid rgba(255, 255, 255, 0.15);
        font-weight: 800;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
    }
    .preview-btn:hover { color: #fff; }
</style>
