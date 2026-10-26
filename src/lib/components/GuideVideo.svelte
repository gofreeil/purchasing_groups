<script>
    // נגן סרטון ההדרכה (eitanium). נגן צף (דסקטופ ונייד): אחרי שהגולש לחץ על הנגן
    // והסרטון מתנגן, גלילה אל מתחתיו מצמידה אותו לפינת המסך. רק CSS - העברת
    // ה-iframe ב-DOM הייתה טוענת אותו מחדש. העיצוב ב-app.css (.video-container-large).
    import { onMount } from "svelte";
    import { VIDEO, VIDEO_ORIGIN } from "$lib/video.js";

    /** fill: ממלא את רוחב ההורה במקום 66% (דף אודותינו) */
    let { fill = false } = $props();

    /** @type {HTMLDivElement | undefined} */
    let videoBox = $state();
    /** @type {HTMLIFrameElement | undefined} */
    let videoFrame = $state();
    let videoClicked = false;
    let videoPlaying = false;
    let videoOutOfView = false;
    let videoFloatClosed = false;
    let videoFloating = $state(false);
    function updateVideoFloat() {
        if (!videoOutOfView || videoFloatClosed) videoFloating = false;
        else if (videoClicked && videoPlaying) videoFloating = true;
        // עצירה בתוך הנגן הצף לא מורידה אותו - רק סגירה או חזרה לסרטון
    }
    function closeVideoFloat() {
        videoFloatClosed = true;
        videoFrame?.contentWindow?.postMessage("pause", VIDEO_ORIGIN);
        updateVideoFloat();
    }
    onMount(() => {
        const io = new IntersectionObserver(([e]) => {
            videoOutOfView = !e.isIntersecting && e.boundingClientRect.top < 0;
            // חזרה לסרטון מאפסת את הסגירה - בגלילה הבאה הוא יצוף שוב
            if (e.isIntersecting) videoFloatClosed = false;
            updateVideoFloat();
        });
        if (videoBox) io.observe(videoBox);
        // לחיצה בתוך iframe זר לא מגיעה לדף - רק blur של החלון כשהפוקוס עובר אליו
        const onBlur = () => {
            if (document.activeElement === videoFrame) videoClicked = true;
        };
        // הנגן של eitanium מדווח לדף העליון על play/pause/ended
        /** @param {MessageEvent} e */
        const onMessage = (e) => {
            if (e.origin !== VIDEO_ORIGIN || e.source !== videoFrame?.contentWindow) return;
            const type = e.data?.type;
            if (type === "play") {
                videoPlaying = true;
                // בנייד (בעיקר iOS) לחיצה בתוך ה-iframe לא תמיד מעבירה אליו פוקוס,
                // ואז ה-blur לא יורה. הפעלה בנגן לא מתחיל מעצמו = לחיצה של הגולש.
                if (navigator.userActivation?.hasBeenActive) videoClicked = true;
            } else if (type === "pause" || type === "ended") videoPlaying = false;
            else return;
            updateVideoFloat();
        };
        window.addEventListener("blur", onBlur);
        window.addEventListener("message", onMessage);
        return () => {
            io.disconnect();
            window.removeEventListener("blur", onBlur);
            window.removeEventListener("message", onMessage);
        };
    });
</script>

<div class="video-container-large" class:video-fill={fill} bind:this={videoBox}>
    <div class="video-frame" class:video-floating={videoFloating}>
        <iframe
            bind:this={videoFrame}
            src={VIDEO.embedUrl}
            title="סרטון הדרכה על קבוצות רכישות חוסכוניות"
            aria-describedby="video-desc"
            frameborder="0"
            loading="lazy"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowfullscreen
        ></iframe>
        {#if videoFloating}
            <button
                type="button"
                class="video-float-close"
                aria-label="סגירת הנגן הצף"
                onclick={closeVideoFloat}>✕</button
            >
        {/if}
    </div>
</div>
