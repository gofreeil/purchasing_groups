<script>
    /**
     * סימון "בוצע" קבוע לקבוצה שהגולש כבר השאיר בה פרטים (ראה $lib/joined.js):
     * אגודל מורם (אותו סגנון של היד המצביעה, במראה - הזרוע נכנסת מימין) שיושב
     * קבוע בפינה הימנית-תחתונה של הכרטיס/הבאנר, עם גלולת "בוצע ✓" קטנה.
     * מחליף את היד המצביעה המונפשת - אין מה להצביע עליו, הפעולה כבר נעשתה.
     * שקוף ללחיצות כך שהקישור של הכרטיס ממשיך לעבוד.
     */
    let { label = "", title = "" } = $props();
</script>

<div class="done-hand" role="img" aria-label={title || label} title={title || label}>
    <img
        src="/images/thumbs-up.webp"
        alt=""
        width="360"
        height="331"
        loading="lazy"
        decoding="async"
    />
    {#if label}
        <span class="done-pill">{label}</span>
    {/if}
</div>

<style>
    .done-hand {
        position: absolute;
        right: -16px;
        bottom: -10px;
        z-index: 5;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0;
    }
    .done-hand img {
        width: 96px;
        height: auto;
        display: block;
        filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.5));
        animation: done-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .done-pill {
        margin-top: -6px;
        padding: 0.18rem 0.6rem;
        border-radius: 999px;
        background: #16a34a;
        border: 1.5px solid #bbf7d0;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.45), 0 0 12px rgba(74, 222, 128, 0.45);
    }
    /* כניסה אחת קצרה בטעינה - לא לולאה */
    @keyframes done-pop {
        0% { opacity: 0; transform: scale(0.4) translateY(12px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
    }
    @media (prefers-reduced-motion: reduce) {
        .done-hand img { animation: none; }
    }
    @media (max-width: 430px) {
        .done-hand { right: -8px; bottom: -16px; }
        .done-hand img { width: 72px; }
        .done-pill { font-size: 0.78rem; padding: 0.15rem 0.5rem; }
    }
</style>
