<script module>
    // משותף לכל המופעים: יד אחת בלבד בכל טעינת דף, גם כששני כרטיסים
    // נמצאים יחד בתצוגה. מתעדכן רק בצד הלקוח (onMount) - לא דולף בין בקשות SSR.
    let shown = false;
</script>

<script>
    /**
     * רמז "לחץ לפרטים ולהצטרפות" שמופיע פעם אחת בכל טעינת דף, על הכרטיס
     * שהגולש עצר עליו (אחרי שהגלילה נרגעה וכשמרכז הכרטיס במרכז המסך).
     * בנייד - יד אמיתית (אותה תמונה של gofreeil.com) שנכנסת מלמטה ומקישה על הכרטיס.
     * בלפטופ - סמן עכבר שמגיע לאותה נקודה ולוחץ.
     * הרמז שקוף ללחיצות (pointer-events: none) כך שהקישור של הכרטיס ממשיך לעבוד.
     */
    import { onMount } from "svelte";

    let { label = "" } = $props();

    let root = $state();
    // armed - האלמנטים כבר ב-DOM (שקופים) כדי שהתמונה תרד ותפוענח מראש;
    // playing - מוסיף את מחלקת ההנפשה. ההפרדה מונעת גמגום בפריים הראשון.
    let armed = $state(false);
    let playing = $state(false);
    let isDesktop = $state(false);

    onMount(() => {
        // ?hand=1 - מצב בדיקה: הרמז חוזר על כל כרטיס שעוצרים עליו ומתעלם
        // מהעדפת הפחתת התנועה. משמש לאבחון מרחוק ("אני לא רואה את היד")
        const forced = new URLSearchParams(location.search).has("hand");
        if (!forced && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
            return;
        // מאזינים לשינוי רוחב (כולל מצב מכשיר ב-DevTools) כך שהמעבר יד/עכבר
        // מתעדכן חי ולא נקבע פעם אחת בטעינה
        const mq = window.matchMedia("(min-width: 769px)");
        const onMq = (e) => (isDesktop = e.matches);
        isDesktop = mq.matches;
        // Safari של iOS 13 ומטה לא תומך ב-addEventListener על MediaQueryList,
        // ובלי הבדיקה הזו כל ה-onMount היה נופל שם והרמז לא היה מופיע בכלל
        if (mq.addEventListener) mq.addEventListener("change", onMq);
        else if (mq.addListener) mq.addListener(onMq);

        let hideTimer;
        let settleTimer;
        let startTimer;
        let dead = false;
        const stop = () => {
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            clearTimeout(settleTimer);
        };
        const viewportH = () =>
            window.innerHeight || document.documentElement.clientHeight;

        // מרנדרים את האלמנטים (שקופים) כבר כשהכרטיס במרחק מסך אחד, כדי
        // שהדפדפן יספיק להוריד ולפענח את התמונה לפני שההנפשה מתחילה
        function prime() {
            const r = root.getBoundingClientRect();
            const vh = viewportH();
            if (r.top < vh * 2 && r.bottom > -vh) armed = true;
        }

        // נורה רק אחרי שהגלילה נעצרה, ורק אם מרכז הכרטיס נמצא במרכז המסך.
        // כך היד מופיעה על הכרטיס שהגולש באמת עצר עליו, ולא נשרפת על כרטיס
        // שחלף תוך כדי גלילה מהירה (ואז הוא מגיע ליעד ולא רואה כלום).
        function fire() {
            if (dead || playing) return;
            if (!forced && shown) return stop();
            const r = root.getBoundingClientRect();
            const vh = viewportH();
            const center = r.top + r.height / 2;
            if (center < vh * 0.3 || center > vh * 0.72) return;
            if (!forced) {
                shown = true;
                stop();
            }
            armed = true;
            // רגע קצר אחרי הרינדור - הדפדפן כבר צייר את האלמנטים והכין להם
            // שכבת קומפוזיציה, כך שההנפשה מתחילה חלק ולא מדלגת בפריים הראשון
            startTimer = setTimeout(() => {
                if (dead) return;
                playing = true;
                // 4.2 שניות - היד יוצאת אחרי 3, והכיתוב נשאר עוד שנייה אחריה
                hideTimer = setTimeout(() => (playing = false), 4200);
            }, 50);
        }

        function onScroll() {
            if (!forced && shown) return stop();
            prime();
            // כל אירוע גלילה דוחה את הירי - הוא יקרה רק כשהגלילה שקטה
            clearTimeout(settleTimer);
            settleTimer = setTimeout(fire, 160);
        }

        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        prime();
        // טעינה שנוחתת כבר על הכרטיסים (רענון באמצע הדף) - בדיקה אחרי
        // שהתמונות/הוידאו תפסו את גובהם והפריסה התייצבה
        settleTimer = setTimeout(fire, 700);

        return () => {
            dead = true;
            stop();
            if (mq.removeEventListener) mq.removeEventListener("change", onMq);
            else if (mq.removeListener) mq.removeListener(onMq);
            clearTimeout(startTimer);
            clearTimeout(hideTimer);
        };
    });
</script>

<div
    class="tap-hint"
    class:desktop={isDesktop}
    class:play={playing}
    bind:this={root}
    aria-hidden="true"
>
    {#if armed}
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
            <img
                class="tap-hand"
                src="/images/finger.webp"
                alt=""
                width="500"
                height="802"
                decoding="async"
            />
        {/if}
        <span class="tap-label">{label}</span>
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
