<script module>
    // משותף לכל המופעים: יד אחת בלבד בכל טעינת דף, גם כששני כרטיסים
    // נמצאים יחד בתצוגה. מתעדכן רק בצד הלקוח (onMount) - לא דולף בין בקשות SSR.
    let shown = false;
</script>

<script>
    /**
     * רמז "לחץ לפרטים ולהצטרפות" שמופיע פעם אחת בכל טעינת דף, על כרטיס המבצע
     * הראשון שהגולש גולל אליו.
     * בנייד - יד אמיתית (אותה תמונה של gofreeil.com) שנכנסת מלמטה ומקישה על הכרטיס.
     * בלפטופ - סמן עכבר שמגיע לאותה נקודה ולוחץ.
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
            if (shown) return stop();
            const r = root.getBoundingClientRect();
            const vh = window.innerHeight || document.documentElement.clientHeight;
            if (r.top > vh * 0.8 || r.bottom < vh * 0.3) return;
            shown = true;
            stop();
            playing = true;
            // 4.2 שניות - היד יוצאת אחרי 3, והכיתוב נשאר עוד שנייה אחריה
            hideTimer = setTimeout(() => (playing = false), 4200);
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
        width: 48px;
        height: 48px;
        margin: -24px 0 0 -24px;
        border-radius: 50%;
        border: 2px solid rgba(74, 222, 128, 0.95);
        box-shadow: 0 0 16px rgba(74, 222, 128, 0.45);
        opacity: 0;
        animation: tap-ring 700ms ease-out 0.75s forwards;
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
        animation: tap-pointer 3s cubic-bezier(0.3, 0.5, 0.35, 1) forwards;
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
        animation: tap-pointer 3s cubic-bezier(0.3, 0.5, 0.35, 1) forwards;
    }

    /* כניסה מלמטה-ימין, הקשה אחת (0.75s), החזקה קצרה ויציאה חזרה */
    @keyframes tap-pointer {
        0% { opacity: 0; transform: translate(34px, 82px) scale(0.9); }
        12% { opacity: 1; transform: translate(0, 0) scale(1); }
        20% { transform: translate(0, 0) scale(1); }
        25% { transform: translate(-1px, -4px) scale(0.93); }
        31% { transform: translate(0, 0) scale(1); }
        90% { opacity: 1; transform: translate(0, 0) scale(1); }
        100% { opacity: 0; transform: translate(26px, 66px) scale(0.94); }
    }

    /* ── הכיתוב ──────────────────────────────────────────── */
    .tap-label {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        /* בועה צמודה לקצה האצבע מעל-משמאל, כך שהאצבע נוגעת בה */
        margin: -4px 0 0 -3px;
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
        animation: tap-label 4s ease forwards;
    }
    /* עולה יחד עם היד (0.36 שנייה) ומתחיל לדעוך ב-2.7 שניות - דעיכה איטית
       של 1.3 שניות, כך שכשהיד יוצאת הבועה כבר בדרך החוצה */
    @keyframes tap-label {
        0% { opacity: 0; transform: translate(-100%, -100%) translateY(10px); }
        9% { opacity: 1; transform: translate(-100%, -100%) translateY(0); }
        67% { opacity: 1; transform: translate(-100%, -100%) translateY(0); }
        83% { opacity: 0.55; transform: translate(-100%, -100%) translateY(2px); }
        100% { opacity: 0; transform: translate(-100%, -100%) translateY(8px); }
    }

    /* בלפטופ הכיתוב יושב מתחת-מימין לסמן, כמו tooltip שנגרר עם העכבר */
    .tap-hint.desktop .tap-label {
        margin: 18px 0 0 10px;
        animation-name: tap-label-desktop;
    }
    @keyframes tap-label-desktop {
        0% { opacity: 0; transform: translateY(10px); }
        9% { opacity: 1; transform: translateY(0); }
        67% { opacity: 1; transform: translateY(0); }
        83% { opacity: 0.55; transform: translateY(2px); }
        100% { opacity: 0; transform: translateY(8px); }
    }

    @media (max-width: 380px) {
        .tap-label { font-size: 0.92rem; padding: 0.38rem 0.75rem; }
        .tap-hand { width: 92px; }
    }
</style>
