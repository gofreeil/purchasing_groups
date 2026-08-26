<script>
    // ============================================================
    // AdCardPreview — עותק סטטי של כרטיס הפרסומת מהטור הימני באתר
    // (RightAdBanner), בלי קישור, בלי סבב ובלי דהיית-ריחוף. משמש את
    // מסך הניהול לתצוגה מקדימה: ריחוף על כותרת הפרסומת (דסקטופ)
    // או הקשה עליה (נייד). אותו מבנה ואותם מידות — מה שרואים כאן
    // הוא בדיוק מה שמוצג על האתר.
    // ============================================================
    import { adImgFit, parseAdImageFit } from "$lib/adImageFit.js";

    /** @type {{ ad: any }} */
    let { ad } = $props();
</script>

<div class="paid-ad-preview">
    <div class="paid-ad-media">
        {#if ad.mainImage}
            <img
                src={ad.mainImage}
                alt={ad.title}
                loading="lazy"
                decoding="async"
                use:adImgFit={parseAdImageFit(ad.mainImageFit)}
            />
        {/if}
    </div>
    <div class="paid-ad-cta" style="background: {ad.gradient || 'linear-gradient(135deg,#f59e0b,#ea580c)'}">
        {ad.cta || ad.title}
    </div>
</div>

<style>
    /* עותק מדויק של .paid-ad מ-RightAdBanner — אותו רוחב (144px) ואותו
       יחס תמונה (144/450), כדי שהתצוגה המקדימה תהיה זהה למה שבאמת
       מוצג בטור הפרסומות. בלי מעברי ריחוף ובלי קישור. */
    .paid-ad-preview {
        display: block;
        width: 144px;
        overflow: hidden;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35);
        background: #111827;
    }
    .paid-ad-media {
        position: relative;
        width: 100%;
        aspect-ratio: 144 / 450;
        overflow: hidden;
    }
    .paid-ad-media img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
    .paid-ad-cta {
        padding: 0.625rem 0.5rem;
        text-align: center;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        line-height: 1.2;
    }
</style>
