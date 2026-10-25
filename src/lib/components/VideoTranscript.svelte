<script>
    import { VIDEO } from "$lib/video.js";

    /** fill: ממלא את רוחב ההורה במקום 66% (דף אודותינו) */
    let { fill = false } = $props();
</script>

<!-- נגישות: תיאור הסרטון לקוראי מסך (aria-describedby של ה-iframe) + תמלול מלא
     מקופל - לעיוורים ולכבדי שמיעה, וגם טקסט שגוגל קורא -->
<p id="video-desc" class="sr-only">{VIDEO.description} התמלול המלא נמצא מתחת לסרטון.</p>
<details class="video-transcript" class:fill>
    <summary><span aria-hidden="true">📝</span> תמלול הסרטון</summary>
    {#each VIDEO.transcript as para}
        <p>{para}</p>
    {/each}
</details>

<style>
    .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    /* תמלול הסרטון - שורה קטנה צמודה לסרטון, נפתח לפי בקשה */
    .video-transcript {
        width: 66%;
        max-width: 860px;
        margin-top: -0.6rem;
        font-size: 0.85rem;
        line-height: 1.6;
        text-align: right;
    }
    .video-transcript.fill {
        width: 100%;
        max-width: none;
        margin-top: 0.5rem;
    }
    .video-transcript summary {
        width: fit-content;
        margin: 0 auto;
        cursor: pointer;
        color: #facc15;
        font-weight: 700;
    }
    .video-transcript p {
        margin: 0.4rem 0 0;
    }
    @media (max-width: 768px) {
        .video-transcript {
            width: 85%;
            margin-top: -0.4rem;
        }
        .video-transcript.fill {
            width: 100%;
            margin-top: 0.5rem;
        }
    }
</style>
