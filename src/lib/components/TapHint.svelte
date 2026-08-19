<script>
    /**
     * רמז "לחץ לפרטים ולהצטרפות" שמופיע פעם אחת על כרטיס מבצע ברגע שהגולש גולל אליו.
     * בנייד - יד אמיתית (אותה תמונה של gofreeil.com) שנכנסת מלמטה ומקישה על הכרטיס.
     * בלפטופ - סמן עכבר שמגיע לאותה נקודה ומבצע שתי לחיצות.
     * הרמז שקוף ללחיצות (pointer-events: none) כך שהקישור של הכרטיס ממשיך לעבוד.
     */
    import { onMount } from "svelte";

    let { label = "" } = $props();

    let root = $state();
    let playing = $state(false);
    let isDesktop = $state(false);

    onMount(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        // מאזינים לשינוי רוחב (כולל מצב מכשיר ב-DevTools) כך שהמעבר יד/עכבר
        // מתעדכן חי ולא נקבע פעם אחת בטעינה
        const mq = window.matchMedia("(min-width: 769px)");
        const onMq = (e) => (isDesktop = e.matches);
        isDesktop = mq.matches;
        mq.addEventListener("change", onMq);

        let hideTimer;
        let settleTimer;
        const stop = () => {
            window.removeEventListener("scroll", check);
            window.removeEventListener("resize", check);
            clearTimeout(settleTimer);
        };
        // אותה בדיקת-גלילה שבה משתמשת הבלטת הכותרות בדף הבית
        function check() {
            const r = root.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top > vh * 0.8 || r.bottom < vh * 0.3) return;
            // רץ פעם אחת בלבד לכל כרטיס
            stop();
            playing = true;
            hideTimer = setTimeout(() => (playing = false), 8700);
        }
        window.addEventListener("scroll", check, { passive: true });
        window.addEventListener("resize", check);
        check();
        // רענון באמצע הדף משחזר את הגלילה בלי לירות אירוע scroll - בדיקה נוספת
        // אחרי שהתמונות/הוידאו תפסו את גובהם והפריסה התייצבה
        settleTimer = setTimeout(check, 700);

        return () => {
            stop();
            mq.removeEventListener("change", onMq);
            clearTimeout(hideTimer);
        };
    });
</script>

<div class="tap-hint" class:desktop={isDesktop} bind:this={root} aria-hidden="true">
    {#if playing}
        <span class="tap-ring"></span>
        <span class="tap-ring ring-2"></span>
        {#if isDesktop}
            <span class="tap-cursor">
                <svg viewBox="0 0 24 24" width="34" height="34">
                    <path
                        d="M4.5 3.2 L4.5 19.6 L8.9 15.6 L11.6 21.4 L14.6 20 L11.9 14.4 L18 14.2 Z"
                        fill="#ffffff"
                        stroke="#0b1220"
                        stroke-width="1.3"
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
        {:else}
            <img class="tap-hand" src="/images/finger.webp" alt="" width="500" height="802" />
        {/if}
        <span class="tap-label">{label}</span>
    {/if}
</div>

<style>
    .tap-hint {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 6;
        /* נקודת ההקשה על הכרטיס - היד/הסמן והטבעות מיושרים אליה.
           נמוכה מספיק כדי שבועת הכיתוב שמעליה לא תכסה את שם הקבוצה */
        --tap-x: 66%;
        --tap-y: 56%;
    }
    .tap-hint.desktop {
        --tap-x: 55%;
        --tap-y: 52%;
    }

    /* ── טבעות ההקשה ─────────────────────────────────────── */
    .tap-ring {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        width: 58px;
        height: 58px;
        margin: -29px 0 0 -29px;
        border-radius: 50%;
        border: 2px solid rgba(74, 222, 128, 0.95);
        box-shadow: 0 0 16px rgba(74, 222, 128, 0.45);
        opacity: 0;
        animation: tap-ring 900ms ease-out 1.36s forwards;
    }
    .tap-ring.ring-2 {
        animation-delay: 2.3s;
    }
    @keyframes tap-ring {
        0% { opacity: 0; transform: scale(0.25); }
        18% { opacity: 0.9; }
        100% { opacity: 0; transform: scale(1.55); }
    }

    /* ── היד בנייד ───────────────────────────────────────── */
    .tap-hand {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        width: 104px;
        height: auto;
        /* קצה האצבע נמצא ב-~10%/1.5% של התמונה - מיישרים אותו לנקודת ההקשה */
        margin: -3px 0 0 -11px;
        transform-origin: 10% 1.5%;
        filter: drop-shadow(0 10px 22px rgba(0, 0, 0, 0.55));
        animation: tap-pointer 8.5s cubic-bezier(0.3, 0.5, 0.35, 1) forwards;
    }

    /* ── סמן העכבר בלפטופ ────────────────────────────────── */
    .tap-cursor {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        /* חוד החץ ב-~19%/13% מגודל ה-SVG */
        margin: -4px 0 0 -6px;
        line-height: 0;
        transform-origin: 19% 13%;
        filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55));
        animation: tap-pointer 8.5s cubic-bezier(0.3, 0.5, 0.35, 1) forwards;
    }

    /* כניסה מלמטה-ימין, שתי הקשות (1.36s ו-2.3s), החזקה ארוכה כדי שיספיקו
       לקרוא את הכיתוב, ויציאה חזרה */
    @keyframes tap-pointer {
        0% { opacity: 0; transform: translate(34px, 82px) scale(0.9); }
        8% { opacity: 1; transform: translate(0, 0) scale(1); }
        13% { transform: translate(0, 0) scale(1); }
        16% { transform: translate(-1px, -4px) scale(0.93); }
        19% { transform: translate(0, 0) scale(1); }
        24% { transform: translate(0, 0) scale(1); }
        27% { transform: translate(-1px, -4px) scale(0.93); }
        30% { transform: translate(0, 0) scale(1); }
        90% { opacity: 1; transform: translate(0, 0) scale(1); }
        100% { opacity: 0; transform: translate(26px, 66px) scale(0.94); }
    }

    /* ── הכיתוב ──────────────────────────────────────────── */
    .tap-label {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        /* בועה מעל-משמאל לקצה האצבע, כך שהאצבע מצביעה אליה ואל הכרטיס */
        margin: -12px 0 0 -10px;
        padding: 0.45rem 0.95rem;
        border-radius: 999px;
        background: rgba(10, 20, 36, 0.94);
        border: 1.5px solid rgba(74, 222, 128, 0.8);
        color: #eafff1;
        font-size: 1.05rem;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(74, 222, 128, 0.22);
        opacity: 0;
        animation: tap-label 8.5s ease forwards;
    }
    /* הכיתוב עולה מוקדם ונשאר גלוי כ-6.5 שניות - מספיק זמן לקרוא אותו */
    @keyframes tap-label {
        0%, 8% { opacity: 0; transform: translate(-100%, -100%) translateY(10px); }
        14% { opacity: 1; transform: translate(-100%, -100%) translateY(0); }
        90% { opacity: 1; transform: translate(-100%, -100%) translateY(0); }
        100% { opacity: 0; transform: translate(-100%, -100%) translateY(8px); }
    }

    /* בלפטופ הכיתוב יושב מתחת-מימין לסמן, כמו tooltip שנגרר עם העכבר */
    .tap-hint.desktop .tap-label {
        margin: 26px 0 0 14px;
        animation-name: tap-label-desktop;
    }
    @keyframes tap-label-desktop {
        0%, 8% { opacity: 0; transform: translateY(10px); }
        14% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(8px); }
    }

    @media (max-width: 380px) {
        .tap-label { font-size: 0.92rem; padding: 0.38rem 0.75rem; }
        .tap-hand { width: 92px; }
    }
</style>
