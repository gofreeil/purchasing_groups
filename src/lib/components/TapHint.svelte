<script>
    /**
     * רמז "לחץ לפרטים ולהצטרפות" על כרטיס קבוצת רכישה בדף הבית.
     * כל כרטיס פעיל מקבל מופע משלו; הרמז מתנגן כשהכרטיס נראה על המסך וחוזר
     * על עצמו כל repeatMs (ברירת מחדל 10 שניות) כל עוד הכרטיס בתצוגה.
     * בנייד - יד אמיתית (אותה תמונה של gofreeil.com) שנכנסת מלמטה ומקישה על הכרטיס.
     * בלפטופ - סמן עכבר שמגיע לאותה נקודה ולוחץ.
     * במצב done (הגולש כבר השאיר פרטים - ראה $lib/joined.js) אותה יד, באותו גודל
     * ובאותה צורה, מסמנת "בוצע": תג ✓ ירוק על קצה האצבע במקום טבעת ההקשה, וכיתוב
     * doneLabel במקום label.
     * הרמז שקוף ללחיצות (pointer-events: none) כך שהקישור של הכרטיס ממשיך לעבוד.
     */
    import { onMount } from "svelte";

    let { label = "", done = false, doneLabel = "", repeatMs = 10000 } = $props();

    let root = $state();
    // armed - האלמנטים כבר ב-DOM (שקופים) כדי שהתמונה תרד ותפוענח מראש;
    // playing - מוסיף את מחלקת ההנפשה. ההפרדה מונעת גמגום בפריים הראשון.
    let armed = $state(false);
    let playing = $state(false);
    let isDesktop = $state(false);

    // משך הניגון: היד יוצאת אחרי 3 שניות והכיתוב נשאר עוד שנייה אחריה
    const PLAY_MS = 4200;

    onMount(() => {
        // ?hand=1 - מצב בדיקה: מתעלם מהעדפת הפחתת התנועה.
        // משמש לאבחון מרחוק ("אני לא רואה את היד")
        const forced = new URLSearchParams(location.search).has("hand");
        if (!forced && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        // מאזינים לשינוי רוחב (כולל מצב מכשיר ב-DevTools) כך שהמעבר יד/עכבר
        // מתעדכן חי ולא נקבע פעם אחת בטעינה
        const mq = window.matchMedia("(min-width: 769px)");
        const onMq = (/** @type {MediaQueryListEvent | MediaQueryList} */ e) => (isDesktop = e.matches);
        isDesktop = mq.matches;
        // Safari של iOS 13 ומטה לא תומך ב-addEventListener על MediaQueryList,
        // ובלי הבדיקה הזו כל ה-onMount היה נופל שם והרמז לא היה מופיע בכלל
        if (mq.addEventListener) mq.addEventListener("change", onMq);
        else if (mq.addListener) mq.addListener(onMq);

        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let hideTimer;
        /** @type {ReturnType<typeof setTimeout> | undefined} */
        let startTimer;
        /** @type {ReturnType<typeof setInterval> | undefined} */
        let loop;
        let dead = false;

        function play() {
            if (dead || playing) return;
            armed = true;
            // רגע קצר אחרי הרינדור - הדפדפן כבר צייר את האלמנטים והכין להם
            // שכבת קומפוזיציה, כך שההנפשה מתחילה חלק ולא מדלגת בפריים הראשון
            startTimer = setTimeout(() => {
                if (dead) return;
                playing = true;
                hideTimer = setTimeout(() => (playing = false), PLAY_MS);
            }, 50);
        }

        function stopLoop() {
            clearInterval(loop);
            loop = undefined;
            clearTimeout(startTimer);
        }

        // הרמז רץ רק כשהכרטיס נראה (לפחות חצי ממנו) - נכנס לתצוגה: ניגון ראשון
        // אחרי חצי שנייה של התייצבות ואז חזרה כל repeatMs; יצא מהתצוגה: עצירה.
        // כך כל כרטיס פעיל מקבל את היד שלו, ולא נשרפים ניגונים על כרטיסים שלא רואים.
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        if (loop) continue;
                        startTimer = setTimeout(play, 500);
                        loop = setInterval(play, repeatMs);
                    } else {
                        stopLoop();
                    }
                }
            },
            { threshold: 0.5 },
        );
        io.observe(root);
        // טעינה מוקדמת של התמונה כשהכרטיס במרחק מסך אחד, כדי שהניגון הראשון לא יגמגם
        const primer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    armed = true;
                    primer.disconnect();
                }
            },
            { rootMargin: "100% 0px" },
        );
        primer.observe(root);

        return () => {
            dead = true;
            io.disconnect();
            primer.disconnect();
            stopLoop();
            clearTimeout(hideTimer);
            if (mq.removeEventListener) mq.removeEventListener("change", onMq);
            else if (mq.removeListener) mq.removeListener(onMq);
        };
    });
</script>

<div
    class="tap-hint"
    class:desktop={isDesktop}
    class:play={playing}
    class:done
    bind:this={root}
    aria-hidden="true"
>
    {#if armed}
        {#if done}
            <!-- במקום טבעת ההקשה: תג ✓ ירוק שנשאר על קצה האצבע כל זמן הניגון -->
            <span class="tap-check">
                <svg viewBox="0 0 24 24" width="30" height="30">
                    <path
                        d="M5 12.5 L10 17.5 L19 7.5"
                        fill="none"
                        stroke="#052e16"
                        stroke-width="3.2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            </span>
        {:else}
            <span class="tap-ring"></span>
        {/if}
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
            <!-- אותה תמונה, אותו גודל ואותו מיקום בשני המצבים (מצביעה / בוצע) -->
            <img
                class="tap-hand"
                src="/images/finger.webp"
                alt=""
                width="500"
                height="802"
                decoding="async"
            />
        {/if}
        <span class="tap-label">{done ? doneLabel : label}</span>
    {/if}
</div>

<style>
    .tap-hint {
        position: absolute;
        /* בכתיב הארוך ולא inset - הרמז עובד גם בדפדפני נייד ישנים */
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        pointer-events: none;
        z-index: 6;
        /* נקודת ההקשה על הכרטיס - היד/הסמן והטבעת מיושרים אליה.
           נמוכה מספיק כדי שבועת הכיתוב שמעליה לא תכסה את שם הקבוצה */
        --tap-x: 74%;
        --tap-y: 56%;
    }
    .tap-hint.desktop {
        --tap-x: 55%;
        --tap-y: 52%;
    }

    /* כל החלקים שקופים עד שמופעלת מחלקת play, ומונפשים אך ורק ב-transform
       וב-opacity - שתי התכונות שהדפדפן מריץ על ה-GPU בלי פריסה או ציור
       מחדש בכל פריים. will-change מכין להם שכבה מראש כדי שלא תהיה קפיצה
       בפריים הראשון, גם באמצע גלילה. */
    .tap-ring,
    .tap-check,
    .tap-hand,
    .tap-cursor,
    .tap-label {
        position: absolute;
        left: var(--tap-x);
        top: var(--tap-y);
        opacity: 0;
        will-change: transform, opacity;
        backface-visibility: hidden;
    }

    /* ── טבעת ההקשה ──────────────────────────────────────── */
    .tap-ring {
        width: 48px;
        height: 48px;
        margin: -24px 0 0 -24px;
        border-radius: 50%;
        border: 2px solid rgba(74, 222, 128, 0.95);
        box-shadow: 0 0 16px rgba(74, 222, 128, 0.45);
    }
    .tap-hint.play .tap-ring {
        animation: tap-ring 800ms linear 0.8s forwards;
    }
    @keyframes tap-ring {
        0% {
            opacity: 0;
            transform: scale(0.3);
            animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        20% {
            opacity: 0.9;
            animation-timing-function: cubic-bezier(0.33, 0, 0.67, 1);
        }
        100% { opacity: 0; transform: scale(1.5); }
    }

    /* ── תג "בוצע" (מצב done) ─────────────────────────────
       באותו גודל ובאותה נקודה של טבעת ההקשה, כך שהיד נוגעת בו בדיוק
       כמו שהיא נוגעת בטבעת במצב הרגיל */
    .tap-check {
        width: 48px;
        height: 48px;
        margin: -24px 0 0 -24px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #4ade80;
        border: 2px solid #eafff1;
        box-shadow: 0 0 18px rgba(74, 222, 128, 0.7), 0 6px 14px rgba(0, 0, 0, 0.4);
    }
    .tap-check svg { display: block; }
    .tap-hint.play .tap-check {
        animation: tap-check 3.4s linear 0.8s forwards;
    }
    /* קופץ פנימה ברגע ההקשה, נשאר עם היד ונמוג יחד עם הכיתוב */
    @keyframes tap-check {
        0% {
            opacity: 0;
            transform: scale(0.3);
            animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        12% { opacity: 1; transform: scale(1.1); }
        20% { transform: scale(1); }
        80% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(1); }
    }

    /* ── היד בנייד ───────────────────────────────────────── */
    .tap-hand {
        width: 104px;
        height: auto;
        /* קצה האצבע נמצא ב-~10%/1.5% של התמונה - מיישרים אותו לנקודת ההקשה */
        margin: -3px 0 0 -11px;
        filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.5));
    }

    /* ── סמן העכבר בלפטופ ────────────────────────────────── */
    .tap-cursor {
        /* חוד החץ ב-~19%/13% מגודל ה-SVG */
        margin: -4px 0 0 -6px;
        line-height: 0;
        filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.5));
    }

    .tap-hint.play .tap-hand,
    .tap-hint.play .tap-cursor {
        animation: tap-pointer 3s linear forwards;
    }

    /* כניסה מלמטה-ימין, הקשה אחת (0.85s), החזקה ויציאה חזרה.
       תזוזה טהורה בלי scale - כך אין רסטור מחדש של הצל בכל פריים,
       וכל קטע מקבל עקומת האטה משלו כדי שהמעברים לא ייראו קטועים. */
    @keyframes tap-pointer {
        0% {
            opacity: 0;
            transform: translate3d(30px, 78px, 0);
            animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        14% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            animation-timing-function: linear;
        }
        23% {
            transform: translate3d(0, 0, 0);
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        28% {
            transform: translate3d(-2px, -7px, 0);
            animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        35% {
            transform: translate3d(0, 0, 0);
            animation-timing-function: linear;
        }
        88% {
            opacity: 1;
            transform: translate3d(0, 0, 0);
            animation-timing-function: cubic-bezier(0.55, 0, 0.9, 0.55);
        }
        100% { opacity: 0; transform: translate3d(24px, 62px, 0); }
    }

    /* ── הכיתוב ──────────────────────────────────────────── */
    .tap-label {
        /* בועה צמודה לקצה האצבע מעל-משמאל, כך שהאצבע נוגעת בה */
        margin: -4px 0 0 -3px;
        padding: 0.5rem 1rem;
        border-radius: 999px;
        background: rgba(10, 20, 36, 0.94);
        border: 1.5px solid rgba(74, 222, 128, 0.8);
        color: #eafff1;
        font-size: 1.25rem;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 0 16px rgba(74, 222, 128, 0.22);
    }
    /* במצב "בוצע" הבועה ירוקה מלאה - אותו גודל, רק צבע הפוך */
    .tap-hint.done .tap-label {
        background: #16a34a;
        border-color: #bbf7d0;
        color: #ffffff;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45), 0 0 18px rgba(74, 222, 128, 0.5);
    }
    .tap-hint.play .tap-label {
        animation: tap-label 4s linear forwards;
    }
    /* עולה יחד עם היד, מחזיק עד 2.7 שניות ואז נמוג בקצב אחיד עד 4 */
    @keyframes tap-label {
        0% {
            opacity: 0;
            transform: translate(-100%, -100%) translateY(10px);
            animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        11% {
            opacity: 1;
            transform: translate(-100%, -100%) translateY(0);
        }
        67% {
            opacity: 1;
            transform: translate(-100%, -100%) translateY(0);
        }
        100% { opacity: 0; transform: translate(-100%, -100%) translateY(6px); }
    }

    /* בלפטופ הכיתוב יושב מתחת-מימין לסמן, כמו tooltip שנגרר עם העכבר */
    .tap-hint.desktop .tap-label {
        margin: 18px 0 0 10px;
    }
    .tap-hint.play.desktop .tap-label {
        animation-name: tap-label-desktop;
    }
    @keyframes tap-label-desktop {
        0% {
            opacity: 0;
            transform: translateY(10px);
            animation-timing-function: cubic-bezier(0.22, 0.61, 0.36, 1);
        }
        11% { opacity: 1; transform: translateY(0); }
        67% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(6px); }
    }

    /* בשורה אחת הבועה מוגבלת ברוחב הכרטיס, ולכן במסכי טלפון הגופן יורד
       מדרגה כדי שהיא לא תחרוג ממנו */
    @media (max-width: 430px) {
        .tap-label { font-size: 1.15rem; padding: 0.45rem 0.85rem; }
        .tap-hand { width: 98px; }
    }
    @media (max-width: 380px) {
        .tap-label { font-size: 1.05rem; padding: 0.4rem 0.75rem; }
        .tap-hand { width: 92px; }
    }
</style>
