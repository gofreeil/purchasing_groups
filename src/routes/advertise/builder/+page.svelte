<script>
    import { onMount } from "svelte";
    import { browser } from "$app/environment";
    import { goto } from "$app/navigation";
    import { adImgFit, AD_ZOOM_MIN, AD_ZOOM_MAX } from "$lib/adImageFit.js";
    import { logoClearance } from "$lib/logoClearance.js";
    import { normalizePlanDays } from "$lib/adPlans.js";
    import {
        bandCorners, logoCornerSide, legacyAdStyle,
        DEFAULT_SUB_FONT_SIZE, SUB_FONT_SIZE_MIN, SUB_FONT_SIZE_MAX,
        DEFAULT_SUB_LINE_HEIGHT, SUB_LINE_HEIGHT_MIN, SUB_LINE_HEIGHT_MAX,
    } from "$lib/adStyle.js";
    import { gradientStyle } from "$lib/adGradient.js";
    import { builderT, fmt } from "$lib/translations/builder.js";
    import { AD_DRAFT_KEY, getAdEditTarget, setAdEditTarget, clearAdEditTarget } from "$lib/adDraft.js";
    import {
        AD_EFFECTIVE_LIMIT, MAIN_IMAGE_MAX_BYTES,
        bodyBytes, fmtWeight, approxDataUrlBytes, compressImageToFit, compressLogoFile,
        shrinkAdPayload, heaviestImageLabel,
    } from "$lib/adPayloadBudget.js";

    // בונה הפרסומות - הועתק מאתר "קהילה בשכונה" והותאם לקבוצות רכישה:
    // CSS רגיל (בלי Tailwind), גרדיאנטים כמחרוזות CSS. עיצוב הכרטיס, הדמו
    // החי והשפות (עברית/אנגלית/רוסית) זהים לבילדר שם, כדי שפרסומת שהופצה
    // משם תיערך כאן בלי לאבד אף פרמטר.

    let { data } = $props();

    // ===== שמירה מקומית =====
    const LS_KEY = AD_DRAFT_KEY;
    const PAID_KEY = "ad_paid";
    const PAID_AT_KEY = "ad_paid_at";

    const ADMIN_WA_NUMBER = "972508750632";

    // ===== שערת גישה =====
    let accessGranted = $state(false);
    let accessChecked = $state(false);
    let isSuperAdmin = $derived(Boolean(data?.isSuperAdmin));

    // ===== חלון עריכה חינם =====
    /** @type {Date | null} */
    let paidAt = $state(null);
    let now = $state(new Date());
    let freeEditUntil = $derived.by(() => {
        if (!paidAt) return null;
        const d = new Date(paidAt);
        d.setHours(23, 59, 59, 999);
        return d;
    });
    let freeMsRemaining = $derived(freeEditUntil ? Math.max(0, freeEditUntil.getTime() - now.getTime()) : 0);
    let freeEditExpired = $derived(Boolean(freeEditUntil) && freeMsRemaining === 0);

    // התקופה שנבחרה (במחירון או בעורך דף הנחיתה) - נשמרת ל-localStorage,
    // כדי ש"הפרסום ירוץ עד" ישקף את המסלול האמיתי (עד שנה) ולא חודש קבוע.
    const PLAN_DAYS_KEY = "ad_plan_days";
    let planDays = $state(30);

    /** @param {number} ms */
    function fmtCountdown(ms) {
        const totalMin = Math.floor(ms / 60000);
        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
    /** @param {Date} d */
    function fmtDateShort(d) {
        return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit" });
    }

    // ===== שדות הטופס =====
    let logo = $state("");
    let logoOriginal = $state("");
    let logoShape = $state(/** @type {'square' | 'circle'} */ ("square"));
    // לוגו על העכבר (שלב 6), גודל ורקע הלוגו
    let hoverLogo = $state(false);
    let hoverLogoX = $state(50);
    let hoverLogoY = $state(22);
    let hoverLogoSize = $state(56);
    let logoSize = $state(36);
    let logoBg = $state(/** @type {'white' | 'black' | 'clear'} */ ("white"));
    let hasCircleCrop = $state(false);
    let logoPosition = $state(/** @type {'right' | 'left' | 'cta'} */ ("right"));
    // נהיה true ברגע שהמפרסם בוחר מיקום בעצמו. עד אז המיקום מתחלף
    // אוטומטית: כותרת ארוכה → מעל ה-CTA, אחרת → פינה ימנית.
    let logoPositionExplicit = $state(false);

    // ===== מיקום חופשי של הלוגו =====
    // מרכז הלוגו באחוזי משבצת התמונה. null בשני הצירים = הלוגו עדיין יושב
    // על העוגן (logoPosition). ברגע שהמפרסם גורר אותו - או מזיז בחיצי
    // המקלדת - כאן נשמרת הנקודה המדויקת שבה שחרר. כמו בקהילה בשכונה.
    let logoFreeX = $state(/** @type {number | null} */ (null));
    let logoFreeY = $state(/** @type {number | null} */ (null));
    let logoFree = $derived(logoFreeX !== null && logoFreeY !== null);
    let logoDragging = $state(false);

    // מחלקת העוגן כל עוד הלוגו במקום ברירת המחדל
    let logoAnchorClass = $derived(
        logoPosition === "left" ? "ad-logo-left" : logoPosition === "cta" ? "ad-logo-cta" : "ad-logo-right"
    );
    // מיקום inline - רק אחרי שהמפרסם הזיז את הלוגו בעצמו
    let logoFreeStyle = $derived(
        (logoFree
            ? `left:${logoFreeX}%; top:${logoFreeY}%; right:auto; bottom:auto; transform:translate(-50%,-50%);`
            : "") + (logoBg === "black" ? "background:#000;" : logoBg === "clear" ? "background:transparent;box-shadow:none;" : "") + (logoSize !== 36 ? `width:${logoSize}px;height:${logoSize}px;` : "")
    );

    // מידות הגרירה, נמדדות בלחיצה מול התצוגה שבה הלוגו נמצא (הדמו החי /
    // כרטיס התצוגה המקדימה), כך שאותו קוד עובד בשתיהן
    let dragWrapW = 0, dragWrapH = 0;
    let dragHalfW = 0, dragHalfH = 0;
    let dragStartX = 0, dragStartY = 0;
    let dragBaseCX = 0, dragBaseCY = 0;

    /**
     * מודד את הלוגו ואת משבצת התצוגה; מחזיר את מרכז הלוגו בפיקסלים בתוך המשבצת
     * @param {HTMLElement} el
     * @returns {{ cx: number, cy: number } | null}
     */
    function measureLogo(el) {
        const wrap = el.parentElement;
        if (!wrap) return null;
        const wr = wrap.getBoundingClientRect();
        const lr = el.getBoundingClientRect();
        if (!wr.width || !wr.height || !lr.width || !lr.height) return null;
        dragWrapW = wr.width; dragWrapH = wr.height;
        dragHalfW = lr.width / 2; dragHalfH = lr.height / 2;
        return { cx: lr.left - wr.left + dragHalfW, cy: lr.top - wr.top + dragHalfH };
    }

    /**
     * שומר מרכז לוגו (פיקסלים בתוך המשבצת), מוגבל כך שלא ייצא מהמודעה
     * @param {number} cx
     * @param {number} cy
     */
    function commitLogoCenter(cx, cy) {
        const x = Math.min(Math.max(cx, dragHalfW), dragWrapW - dragHalfW);
        const y = Math.min(Math.max(cy, dragHalfH), dragWrapH - dragHalfH);
        logoFreeX = Math.round((x / dragWrapW) * 1000) / 10;
        logoFreeY = Math.round((y / dragWrapH) * 1000) / 10;
        logoPositionExplicit = true; // עוצר את ההחלפה האוטומטית ימין/CTA
    }

    /** @param {PointerEvent} e */
    function logoPointerDown(e) {
        const el = /** @type {HTMLElement} */ (e.currentTarget);
        const center = measureLogo(el);
        if (!center) return;
        e.preventDefault();
        e.stopPropagation();
        dragBaseCX = center.cx; dragBaseCY = center.cy;
        dragStartX = e.clientX; dragStartY = e.clientY;
        logoDragging = true;
        try { el.setPointerCapture(e.pointerId); } catch {}
    }
    /** @param {PointerEvent} e */
    function logoPointerMove(e) {
        if (!logoDragging) return;
        commitLogoCenter(dragBaseCX + (e.clientX - dragStartX), dragBaseCY + (e.clientY - dragStartY));
    }
    /** @param {PointerEvent} e */
    function logoPointerUp(e) {
        if (!logoDragging) return;
        logoDragging = false;
        try { /** @type {HTMLElement} */ (e.currentTarget).releasePointerCapture(e.pointerId); } catch {}
    }
    /**
     * מקבילת מקלדת לגרירה: חץ מזיז ב-1% מהמשבצת, Shift+חץ ב-5%
     * @param {KeyboardEvent} e
     */
    function logoKeyDown(e) {
        /** @type {Record<string, [number, number]>} */
        const keys = {
            ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
        };
        const dir = keys[e.key];
        if (!dir) return;
        const el = /** @type {HTMLElement} */ (e.currentTarget);
        const center = measureLogo(el);
        if (!center) return;
        e.preventDefault();
        const stepPct = e.shiftKey ? 5 : 1;
        commitLogoCenter(
            center.cx + dir[0] * (dragWrapW * stepPct / 100),
            center.cy + dir[1] * (dragWrapH * stepPct / 100),
        );
    }
    /** חזרה למיקום האוטומטי של ברירת המחדל */
    function resetLogoPosition() {
        logoFreeX = null;
        logoFreeY = null;
        logoPositionExplicit = false;
    }
    /**
     * העוגנים הקבועים נשארים קיצורי לחיצה אחת - הם מבטלים מיקום חופשי
     * @param {'right' | 'left' | 'cta'} pos
     */
    function setLogoAnchor(pos) {
        logoFreeX = null;
        logoFreeY = null;
        logoPosition = pos;
        logoPositionExplicit = true;
    }

    // ===== חיתוך עגול ללוגו =====
    const CROP_STAGE = 320;
    let cropOpen = $state(false);
    let cropZoom = $state(1);
    let cropOffsetX = $state(0);
    let cropOffsetY = $state(0);
    let cropDragging = false;
    let cropDragStartX = 0, cropDragStartY = 0;
    let cropBaseOffsetX = 0, cropBaseOffsetY = 0;

    function openCropper() {
        if (!logoOriginal) return;
        if (!hasCircleCrop) { cropZoom = 1; cropOffsetX = 0; cropOffsetY = 0; }
        cropOpen = true;
    }
    function cancelCrop() {
        cropOpen = false;
        if (!hasCircleCrop) {
            logoShape = "square";
            if (logoOriginal) logo = logoOriginal;
        }
    }
    async function confirmCrop() {
        if (!logoOriginal) { cropOpen = false; return; }
        const img = new Image();
        img.src = logoOriginal;
        await new Promise((resolve, reject) => { img.onload = () => resolve(undefined); img.onerror = () => reject(); });

        const stage = CROP_STAGE;
        const aspectImg = img.width / img.height;
        let drawW, drawH;
        if (aspectImg > 1) { drawW = stage; drawH = stage / aspectImg; }
        else { drawH = stage; drawW = stage * aspectImg; }

        const canvas = document.createElement("canvas");
        canvas.width = stage; canvas.height = stage;
        const ctx = canvas.getContext("2d");
        if (!ctx) { cropOpen = false; return; }
        ctx.save();
        ctx.beginPath();
        ctx.arc(stage / 2, stage / 2, stage / 2, 0, Math.PI * 2);
        ctx.clip();
        ctx.translate(stage / 2 + cropOffsetX, stage / 2 + cropOffsetY);
        ctx.scale(cropZoom, cropZoom);
        ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
        ctx.restore();

        // גם הלוגו החתוך נכנס לתקציב המשקל של המודעה — מכווץ אם צריך
        const candidate = buildPayloadSnapshot();
        candidate.logo = canvas.toDataURL("image/png");
        await shrinkAdPayload(candidate, AD_EFFECTIVE_LIMIT);
        applyPayloadImages(candidate);
        hasCircleCrop = true;
        cropOpen = false;
    }
    function chooseSquare() {
        logoShape = "square";
        if (logoOriginal) logo = logoOriginal;
    }
    function chooseCircle() {
        logoShape = "circle";
        if (logoOriginal) openCropper();
    }
    /** @param {PointerEvent} e */
    function cropPointerDown(e) {
        cropDragging = true;
        cropDragStartX = e.clientX; cropDragStartY = e.clientY;
        cropBaseOffsetX = cropOffsetX; cropBaseOffsetY = cropOffsetY;
        /** @type {HTMLElement} */ (e.currentTarget).setPointerCapture(e.pointerId);
    }
    /** @param {PointerEvent} e */
    function cropPointerMove(e) {
        if (!cropDragging) return;
        cropOffsetX = cropBaseOffsetX + (e.clientX - cropDragStartX);
        cropOffsetY = cropBaseOffsetY + (e.clientY - cropDragStartY);
    }
    /** @param {PointerEvent} e */
    function cropPointerUp(e) {
        cropDragging = false;
        try { /** @type {HTMLElement} */ (e.currentTarget).releasePointerCapture(e.pointerId); } catch {}
    }
    /** @param {WheelEvent} e */
    function cropWheel(e) {
        e.preventDefault();
        const delta = -e.deltaY * 0.0015;
        cropZoom = Math.max(0.3, Math.min(4, cropZoom + delta));
    }

    let mainImage = $state("");
    let mainImageObjectX = $state(50);
    let mainImageObjectY = $state(50);
    let mainImageZoom = $state(1);
    // ה-fit המאוחד שמוזרם לכל התצוגות (וגם נשלח עם המודעה בשליחה)
    let mainImageFit = $derived({ x: mainImageObjectX, y: mainImageObjectY, z: mainImageZoom });
    let title = $state("");
    let titleColor = $state("#ffffff");
    let titleFontSize = $state(1.15);
    // לוגו בדף הנחיתה (נקבע בעמוד הנחיתה) - נשמר בטיוטה כדי שלא יתאפס בעריכה
    let lpLogoAlign = $state(/** @type {'right' | 'center' | 'left'} */ ("right"));
    let lpLogoBg = $state(/** @type {'white' | 'black' | 'clear' | null} */ (null));
    let lpLogoSize = $state(/** @type {number | null} */ (null));
    let titleOffsetY = $state(0);
    let subtitle = $state("");
    // טיפוגרפיית הסלוגן (שלב 5) - גודל, רווח בין שורות ויישור
    let subFontSize = $state(DEFAULT_SUB_FONT_SIZE);
    let subLineHeight = $state(DEFAULT_SUB_LINE_HEIGHT);
    let subAlign = $state(/** @type {import('$lib/adStyle.js').SubAlign} */ ("right"));
    let hoverText = $state("");
    let cta = $state("הקלק לפרטים והזמנות");
    // גרדיאנט כמחרוזת CSS - תואם לשדה color של adsData.js באתר הזה
    let gradient = $state("linear-gradient(135deg, #f59e0b, #ea580c)");
    let diagHeight = $state(12);

    // שדות דף הנחיתה - נטענים/נשמרים יחד עם הטיוטה, נערכים בדף ההמשך
    let landingHeadline = $state("");
    let landingPitch = $state("");
    let landingExtended = $state("");
    let landingImage = $state("");
    /** @type {[string, string, string]} */
    let landingAdvantages = $state(["", "", ""]);
    let uniqueness = $state("");
    let phone = $state("");
    let whatsapp = $state("");
    let website = $state("");
    let email = $state(data?.layoutUser?.email ?? "");
    let address = $state("");
    let hours = $state("");
    /** @type {Array<{ id: number, name: string, price: string, image: string, description: string }>} */
    let products = $state([]);
    let nextProductId = 1;

    // ===== מדריך שלבים =====
    /** @typedef {'image' | 'logo' | 'title' | 'gradient' | 'subtitle' | 'hover' | 'preview' | 'done'} Step */
    /** @type {Step[]} */
    const stepOrder = ["image", "logo", "title", "gradient", "subtitle", "hover", "preview"];
    let activeStep = $state(/** @type {Step} */ ("image"));

    /** @type {Record<string, { num: boolean, title: boolean }>} */
    const litFlags = $state({
        image: { num: false, title: false },
        logo: { num: false, title: false },
        title: { num: false, title: false },
        gradient: { num: false, title: false },
        subtitle: { num: false, title: false },
        hover: { num: false, title: false },
        preview: { num: false, title: false },
        done: { num: false, title: false },
    });

    const NUM_MS = 700;
    const TITLE_MS = 1500;

    /** @param {Step} step */
    function flashStep(step) {
        /** @type {number[]} */
        const timers = [];
        litFlags[step].num = true;
        timers.push(window.setTimeout(() => (litFlags[step].num = false), NUM_MS));
        timers.push(window.setTimeout(() => (litFlags[step].title = true), NUM_MS));
        timers.push(window.setTimeout(() => (litFlags[step].title = false), NUM_MS + TITLE_MS));
        return () => timers.forEach(clearTimeout);
    }

    $effect(() => {
        if (!browser) return;
        const cleanup = flashStep(activeStep);
        return cleanup;
    });

    /** @type {Record<string, HTMLElement | null>} */
    let stepRefs = $state({
        image: null, logo: null, title: null, gradient: null,
        subtitle: null, hover: null, preview: null, done: null,
    });

    // הדמו "קופץ" להתיישר עם השלב הפעיל
    let demoTop = $state(0);
    function updateDemoPosition() {
        if (!browser) return;
        const stepEl = stepRefs[activeStep];
        if (!stepEl) return;
        const colsEl = stepEl.closest(".builder-cols");
        if (!(colsEl instanceof HTMLElement)) return;
        const stepRect = stepEl.getBoundingClientRect();
        const colsRect = colsEl.getBoundingClientRect();
        demoTop = stepRect.top - colsRect.top;
    }
    $effect(() => {
        // מעקב אחרי activeStep + שינויי גודל חלון
        void activeStep;
        if (!browser) return;
        requestAnimationFrame(updateDemoPosition);
        const onResize = () => requestAnimationFrame(updateDemoPosition);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    });

    // גובה הפס האלכסוני וטיפוגרפיית הסלוגן - משתני CSS על ה-root, כדי שכל
    // התצוגות בבילדר (דמו חי, נייד, מחשב) יתעדכנו יחד. bandCorners הוא אותו
    // חישוב שהטור הימני מקבל מ-adStyleVars, כך שמה שמכוונים כאן הוא מה שיתפרסם.
    $effect(() => {
        if (!browser) return;
        const { left, right } = bandCorners(diagHeight);
        const root = document.documentElement.style;
        root.setProperty("--diag-top-left", `${left}%`);
        root.setProperty("--diag-top-right", `${right}%`);
        root.setProperty("--sub-size", `${subFontSize}rem`);
        root.setProperty("--sub-lh", String(subLineHeight));
        root.setProperty("--sub-align", subAlign);
    });

    // ===== העיצוב שנוסע עם המודעה =====
    // כל מה שהמפרסם מחליט על הכרטיס נארז כאן ונשלח עם המודעה כ-landing._adStyle -
    // אותו מבנה בדיוק כמו בקהילה בשכונה (adStyle.js), כך שגם פרסומת שהופצה
    // משם נשמרת חזרה בלי לאבד אף פרמטר.
    let adStyle = $derived({
        logoShape,
        logoBg,
        logoSize,
        hoverLogo,
        hoverLogoX,
        hoverLogoY,
        hoverLogoSize,
        lpLogoAlign,
        lpLogoBg,
        lpLogoSize,
        logoAnchor: logoPosition,
        logoX: logoFreeX,
        logoY: logoFreeY,
        bandHeight: diagHeight,
        titleOffsetY,
        titleFontSize,
        titleColor,
        subFontSize,
        subLineHeight,
        subAlign,
    });

    // שמירת מקום ללוגו בפינה שליד הכותרת - אותו כלל משותף של הטור הימני,
    // כך שהכותרת נשברת אותו דבר בתצוגה ובאתר
    let titleCornerSide = $derived(logoCornerSide(adStyle, Boolean(logo)));

    // הכיתובים בשפת האתר
    let T = $derived($builderT);

    /**
     * @param {HTMLElement | null} el
     * @param {number} [duration]
     */
    function slowScrollTo(el, duration = 1400) {
        if (!el) return;
        const startY = window.scrollY;
        const stickyHeader = document.querySelector("header");
        const headerOffset = stickyHeader ? stickyHeader.offsetHeight + 16 : 16;
        const targetY = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        const distance = targetY - startY;
        if (Math.abs(distance) < 4) return;
        const startTime = performance.now();
        /** @param {number} t */
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        /** @param {number} nowTs */
        function step(nowTs) {
            const elapsed = nowTs - startTime;
            const t = Math.min(1, elapsed / duration);
            window.scrollTo(0, startY + distance * ease(t));
            if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
    }

    /** @param {Step} to */
    function advance(to) {
        activeStep = to;
        queueMicrotask(() => slowScrollTo(stepRefs[to]));
        if (browser) {
            requestAnimationFrame(() => requestAnimationFrame(updateDemoPosition));
        }
    }

    /** @param {Step} s */
    function nextOf(s) {
        const i = stepOrder.indexOf(s);
        return stepOrder[Math.min(i + 1, stepOrder.length - 1)];
    }
    /** @param {Step} s */
    function prevOf(s) {
        const i = stepOrder.indexOf(s);
        return stepOrder[Math.max(i - 1, 0)];
    }

    // ===== גרירת קבצים =====
    let isDraggingMain = $state(false);
    let isDraggingLogo = $state(false);

    // ===== העלאת תמונות + שמירה על תקציב המשקל =====
    // המודעה כולה (תמונות + טקסטים) נשלחת ל-Strapi בבקשה אחת שמוגבלת
    // ל-~1MB. הכלל: אף העלאה לא משאירה את הטיוטה מעל התקציב — אם צריך
    // מפנים מקום בכיווץ תמונות קיימות, ואם גם זה לא מספיק ההעלאה נדחית
    // כאן, בשלב עצמו, עם הסבר — ולא בכישלון בשליחה הסופית.

    let compressNotice = $state({ visible: false, originalBytes: 0, finalBytes: 0 });
    /** @type {number | null} */
    let compressNoticeTimer = null;
    /**
     * @param {number} originalBytes
     * @param {number} finalBytes
     */
    function showCompressNotice(originalBytes, finalBytes) {
        if (compressNoticeTimer) { clearTimeout(compressNoticeTimer); compressNoticeTimer = null; }
        compressNotice = { visible: true, originalBytes, finalBytes };
        compressNoticeTimer = window.setTimeout(() => {
            compressNotice = { ...compressNotice, visible: false };
            compressNoticeTimer = null;
        }, 9000);
    }
    function dismissCompressNotice() {
        if (compressNoticeTimer) { clearTimeout(compressNoticeTimer); compressNoticeTimer = null; }
        compressNotice = { ...compressNotice, visible: false };
    }

    // הודעת דחייה ליד אזור ההעלאה שבו אין מקום לתמונה
    let uploadIssue = $state({ zone: /** @type {'' | 'main' | 'logo'} */ (""), msg: "" });

    /** המודעה כפי שתישלח בשליחה הסופית — הבסיס לכל מדידת משקל.
     * זהה במבנה ל-payload של submitAd בעורך דף הנחיתה; התקופה נמדדת
     * לפי המסלול הארוך ביותר — היא נבחרת רק בדף הנחיתה. */
    function buildPayloadSnapshot() {
        return {
            title, subtitle, hoverText, cta, gradient,
            logo, mainImage,
            mainImageFit: { x: mainImageObjectX, y: mainImageObjectY, z: mainImageZoom },
            landing: {
                headline: landingHeadline,
                pitch: landingPitch,
                extended: landingExtended,
                image: landingImage,
                advantages: [...landingAdvantages],
                uniqueness, phone, whatsapp, website, email, address, hours,
                products: products.map((p) => ({ ...p })),
                _adStyle: { ...adStyle },
            },
            ownerCode: "",
            requestedDurationDays: 365,
        };
    }

    /** החלת תמונות שכווצו בחזרה על המצב (אחרי shrinkAdPayload) @param {any} p */
    function applyPayloadImages(p) {
        if (p.mainImage !== mainImage) mainImage = p.mainImage;
        if (p.logo !== logo) logo = p.logo;
        if (p.landing.image !== landingImage) landingImage = p.landing.image;
        let productsChanged = false;
        const nextProducts = products.map((cur, i) => {
            const img = p.landing.products[i]?.image ?? cur.image;
            if (img !== cur.image) { productsChanged = true; return { ...cur, image: img }; }
            return cur;
        });
        if (productsChanged) products = nextProducts;
    }

    /**
     * @param {File | null | undefined} file
     * @param {'main' | 'logo'} target
     */
    async function processImageFile(file, target) {
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            alert(T.uploadImageFile);
            return;
        }
        uploadIssue = { zone: "", msg: "" };
        const res = target === "logo"
            ? await compressLogoFile(file)
            : await compressImageToFit(file, MAIN_IMAGE_MAX_BYTES);
        const url = String(res.dataUrl);

        // בדיקת התקציב הכולל: התמונה נכנסת רק אם כל המודעה נשארת מתחת לתקרה
        const candidate = buildPayloadSnapshot();
        if (target === "main") candidate.mainImage = url;
        else candidate.logo = url;
        const fit = await shrinkAdPayload(candidate, AD_EFFECTIVE_LIMIT);
        if (!fit.ok) {
            uploadIssue = {
                zone: target,
                msg: fmt(T.noRoom, { img: heaviestImageLabel(candidate, imageLabels) || "—" }),
            };
            return; // המצב הקיים לא נגעו בו — אפשר להמשיך לעבוד
        }

        applyPayloadImages(candidate);
        if (res.wasCompressed || fit.changed) {
            const finalUrl = target === "main" ? candidate.mainImage : candidate.logo;
            showCompressNotice(res.originalBytes, approxDataUrlBytes(finalUrl));
        }
        if (target === "main") {
            mainImageObjectX = 50;
            mainImageObjectY = 50;
            mainImageZoom = 1;
        } else {
            logoOriginal = candidate.logo;
            hasCircleCrop = false;
            if (logoShape === "circle") openCropper();
        }
    }

    /**
     * @param {Event} e
     * @param {'main' | 'logo'} target
     */
    async function handleImage(e, target) {
        const input = /** @type {HTMLInputElement} */ (e.target);
        await processImageFile(input.files?.[0], target);
    }

    /** @param {'main' | 'logo'} target */
    function clearImage(target) {
        if (target === "main") { mainImage = ""; mainImageObjectX = 50; mainImageObjectY = 50; mainImageZoom = 1; }
        else { logo = ""; logoOriginal = ""; hasCircleCrop = false; }
    }
    /** @param {'up' | 'down' | 'left' | 'right'} dir */
    function nudgeMainImage(dir) {
        const STEP = 8;
        if (dir === "up") mainImageObjectY = Math.max(0, mainImageObjectY - STEP);
        if (dir === "down") mainImageObjectY = Math.min(100, mainImageObjectY + STEP);
        if (dir === "left") mainImageObjectX = Math.max(0, mainImageObjectX - STEP);
        if (dir === "right") mainImageObjectX = Math.min(100, mainImageObjectX + STEP);
    }
    /** זום פנימה/החוצה בצעדים יחסיים; 1 = מילוי המשבצת (cover) */
    /** @param {'in' | 'out'} dir */
    function zoomMainImage(dir) {
        const FACTOR = 1.15;
        const next = dir === "in" ? mainImageZoom * FACTOR : mainImageZoom / FACTOR;
        mainImageZoom = Math.round(Math.min(AD_ZOOM_MAX, Math.max(AD_ZOOM_MIN, next)) * 100) / 100;
    }

    /**
     * תיבת טקסט שגדלה לפי התוכן. 90 תווים עם ירידות שורה מגיעים בקלות
     * לארבע-חמש שורות, ותיבה בגובה קבוע חתכה אותן: המפרסם ראה גלילה
     * פנימית ולא את סוף המשפט שכתב. הפרמטר הוא הערך עצמו, כדי שגם
     * טעינת הטיוטה (ולא רק הקלדה) תתאים את הגובה.
     * @param {HTMLTextAreaElement} node
     * @param {string} _value
     */
    function autoGrow(node, _value) {
        const fit = () => {
            node.style.height = "auto";
            node.style.height = `${node.scrollHeight}px`;
        };
        fit();
        node.addEventListener("input", fit);
        return {
            update: () => fit(),
            destroy: () => node.removeEventListener("input", fit),
        };
    }

    /**
     * @param {DragEvent} e
     * @param {(v: boolean) => void} setActive
     */
    function dragOver(e, setActive) {
        if (!e.dataTransfer?.types.includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        setActive(true);
    }
    /**
     * @param {DragEvent} e
     * @param {(v: boolean) => void} setActive
     */
    function dragLeave(e, setActive) {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);
    }
    /**
     * @param {DragEvent} e
     * @param {'main' | 'logo'} target
     * @param {(v: boolean) => void} setActive
     */
    async function handleDrop(e, target, setActive) {
        e.preventDefault();
        e.stopPropagation();
        setActive(false);
        await processImageFile(e.dataTransfer?.files?.[0], target);
    }

    /** @param {Step} field */
    function commitField(field) {
        if (activeStep !== field) return;
        advance(nextOf(field));
    }

    // ===== פלטת צבעים - גרדיאנטים כמחרוזות CSS =====
    const palettes = [
        { id: "amber",    labelKey: "pAmber",    cls: "linear-gradient(135deg, #f59e0b, #ea580c)" },
        { id: "orange",   labelKey: "pOrange",   cls: "linear-gradient(135deg, #f97316, #ef4444)" },
        { id: "yellow",   labelKey: "pYellow",   cls: "linear-gradient(135deg, #facc15, #f59e0b)" },
        { id: "red",      labelKey: "pRed",      cls: "linear-gradient(135deg, #dc2626, #db2777)" },
        { id: "rose",     labelKey: "pRose",     cls: "linear-gradient(135deg, #f43f5e, #c026d3)" },
        { id: "crimson",  labelKey: "pCrimson",  cls: "linear-gradient(135deg, #be123c, #7f1d1d)" },
        { id: "fuchsia",  labelKey: "pFuchsia",  cls: "linear-gradient(135deg, #d946ef, #9333ea)" },
        { id: "purple",   labelKey: "pPurple",   cls: "linear-gradient(135deg, #9333ea, #db2777)" },
        { id: "violet",   labelKey: "pViolet",   cls: "linear-gradient(135deg, #7c3aed, #4338ca)" },
        { id: "indigo",   labelKey: "pIndigo",   cls: "linear-gradient(135deg, #4f46e5, #2563eb)" },
        { id: "blue",     labelKey: "pBlue",     cls: "linear-gradient(135deg, #2563eb, #0891b2)" },
        { id: "sky",      labelKey: "pSky",      cls: "linear-gradient(135deg, #38bdf8, #3b82f6)" },
        { id: "teal",     labelKey: "pTeal",     cls: "linear-gradient(135deg, #14b8a6, #0891b2)" },
        { id: "emerald",  labelKey: "pEmerald",  cls: "linear-gradient(135deg, #10b981, #0f766e)" },
        { id: "green",    labelKey: "pGreen",    cls: "linear-gradient(135deg, #16a34a, #059669)" },
        { id: "lime",     labelKey: "pLime",     cls: "linear-gradient(135deg, #a3e635, #22c55e)" },
        { id: "slate",    labelKey: "pSlate",    cls: "linear-gradient(135deg, #64748b, #374151)" },
        { id: "dark",     labelKey: "pDark",     cls: "linear-gradient(135deg, #1f2937, #0f172a)" },
        { id: "peach",    labelKey: "pPeach",    cls: "linear-gradient(135deg, #fdba74, #f472b6)" },
        { id: "mint",     labelKey: "pMint",     cls: "linear-gradient(135deg, #6ee7b7, #2dd4bf)" },
        { id: "gold",     labelKey: "pGold",     cls: "linear-gradient(135deg, #eab308, #b45309)" },
        { id: "midnight", labelKey: "pMidnight", cls: "linear-gradient(135deg, #334155, #1e3a8a)" },
    ];

    const titleColors = [
        { c: "#ffffff", labelKey: "cWhite" },
        { c: "#fbbf24", labelKey: "cGold" },
        { c: "#fde047", labelKey: "cYellow" },
        { c: "#fb923c", labelKey: "cOrange" },
        { c: "#f87171", labelKey: "cRed" },
        { c: "#f9a8d4", labelKey: "cPink" },
        { c: "#c4b5fd", labelKey: "cPurple" },
        { c: "#67e8f9", labelKey: "cCyan" },
        { c: "#86efac", labelKey: "cGreen" },
        { c: "#0f172a", labelKey: "cBlack" },
    ];

    // יישור הסלוגן (שלב 5) - אותן ארבע אפשרויות של קהילה בשכונה
    /** @type {{ id: import('$lib/adStyle.js').SubAlign, labelKey: string, icon: string }[]} */
    const subAligns = [
        { id: "right",   labelKey: "s5AlignRight",   icon: "➡" },
        { id: "center",  labelKey: "s5AlignCenter",  icon: "↔" },
        { id: "left",    labelKey: "s5AlignLeft",    icon: "⬅" },
        { id: "justify", labelKey: "s5AlignJustify", icon: "☰" },
    ];

    /** כיתוב לפי מפתח שמגיע מנתונים (פלטה, צבעים, יישור) @param {string} key */
    function tr(key) {
        return /** @type {Record<string, string>} */ (/** @type {unknown} */ (T))[key] ?? key;
    }

    // ===== תצוגה מקדימה =====
    let previewMode = $state(/** @type {'mobile' | 'desktop'} */ ("mobile"));
    let hoverPreview = $state(false);
    // בשלב 6 (טקסט בריחוף) מציגים אוטומטית את הצד האחורי של הפרסומת
    const showHover = $derived(hoverPreview || activeStep === "hover");

    // ===== גישה =====
    // הלוגיקה: קודם מעצבים את הפרסומת, עניין התשלום מגיע רק בשלב
    // השליחה (בדף הנחיתה) — לכן הבונה פתוח לכולם, בלי שער תשלום.
    function checkAccess() {
        if (!browser) return;
        accessGranted = true;
        accessChecked = true;
    }

    // ===== עריכת פרסומת קיימת =====
    // הגעה עם ?edit=<id> מ"הפרסומות שלי": התוכן שרץ על האתר נטען מהשרת
    // ודורס את הטיוטה, כדי שהמפרסם יערוך את מה שבאמת מוצג ולא טיוטה
    // ישנה שנשארה כאן. המזהה נשמר ונוסע עם השליחה, וכך האישור מחליף
    // בדיוק את הפרסומת הזו.
    let editingAdId = $state("");
    let editLoad = $state(/** @type {'idle'|'loading'|'ok'|'error'} */ ("idle"));

    /** @param {string} id */
    async function loadAdForEdit(id) {
        editLoad = "loading";
        try {
            const res = await fetch(`/api/ads/mine?id=${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error(String(res.status));
            const ad = await res.json();

            logo = ad.logo ?? "";
            logoOriginal = ad.logo ?? "";
            mainImage = ad.mainImage ?? "";
            mainImageObjectX = typeof ad.mainImageFit?.x === "number" ? ad.mainImageFit.x : 50;
            mainImageObjectY = typeof ad.mainImageFit?.y === "number" ? ad.mainImageFit.y : 50;
            mainImageZoom = typeof ad.mainImageFit?.z === "number" ? ad.mainImageFit.z : 1;
            title = ad.title ?? "";
            subtitle = ad.subtitle ?? "";
            hoverText = ad.hoverText ?? "";
            cta = ad.cta || "הקלק לפרטים והזמנות";
            gradient = ad.gradient || gradient;

            // העיצוב שרץ על האתר - כל השדות של landing._adStyle, גם של פרסומת
            // שהופצה מקהילה בשכונה (לוגו חופשי, טיפוגרפיית הסלוגן), כדי שעריכה
            // ושמירה לא יאבדו אף אחד מהם. פרסומת ותיקה בלי עיצוב שמור מקבלת
            // את מה שהיא מוצגת בו בטור (legacyAdStyle).
            const st = ad.adStyle ?? legacyAdStyle(title);
            logoShape = st.logoShape;
            logoBg = st.logoBg ?? "white";
            logoSize = st.logoSize ?? 36;
            hoverLogo = st.hoverLogo === true;
            hoverLogoX = st.hoverLogoX ?? 50;
            hoverLogoY = st.hoverLogoY ?? 22;
            hoverLogoSize = st.hoverLogoSize ?? 56;
            lpLogoAlign = st.lpLogoAlign ?? "right";
            lpLogoBg = st.lpLogoBg ?? null;
            lpLogoSize = st.lpLogoSize ?? null;
            // הלוגו השמור כבר חתוך לעיגול - "עריכת החיתוך" זמינה מיד
            hasCircleCrop = st.logoShape === "circle";
            logoPosition = st.logoAnchor;
            // עיצוב שמור נבחר ידנית - ברירת המחדל החכמה לא תדרוס אותו.
            // בפרסומת ותיקה היא ממשיכה לפעול, בדיוק כמו בטור.
            logoPositionExplicit = Boolean(ad.adStyle);
            logoFreeX = st.logoX;
            logoFreeY = st.logoY;
            diagHeight = st.bandHeight;
            titleColor = st.titleColor;
            titleOffsetY = st.titleOffsetY;
            titleFontSize = st.titleFontSize ?? 1.15;
            subFontSize = st.subFontSize;
            subLineHeight = st.subLineHeight;
            subAlign = st.subAlign;

            const L = ad.landing ?? {};
            landingHeadline = L.headline ?? "";
            landingPitch = L.pitch ?? "";
            landingExtended = L.extended ?? "";
            landingImage = L.image ?? "";
            landingAdvantages = [L.advantages?.[0] ?? "", L.advantages?.[1] ?? "", L.advantages?.[2] ?? ""];
            uniqueness = L.uniqueness ?? "";
            phone = L.phone ?? "";
            whatsapp = L.whatsapp ?? "";
            website = L.website ?? "";
            email = L.email ?? "";
            address = L.address ?? "";
            hours = L.hours ?? "";
            products = Array.isArray(L.products) ? L.products : [];
            nextProductId = (products.reduce((/** @type {number} */ m, /** @type {any} */ p) => Math.max(m, p.id), 0) || 0) + 1;

            editLoad = "ok";
        } catch {
            // לא דורסים כלום בכישלון: מוטב שהמפרסם יראה את הטיוטה שלו
            // עם אזהרה, מאשר טופס ריק שיישלח כפרסומת חדשה.
            editLoad = "error";
        }
    }

    // ===== שמירה אוטומטית =====
    onMount(() => {
        if (!browser) return;
        checkAccess();

        // מניעת פתיחת תמונה בטאב חדש כשהגרירה מפספסת את אזור ההעלאה
        /** @param {DragEvent} e */
        const blockOutsideDrop = (e) => {
            if (e.dataTransfer?.types.includes("Files")) e.preventDefault();
        };
        window.addEventListener("dragover", blockOutsideDrop);
        window.addEventListener("drop", blockOutsideDrop);

        let storedPaidAt = localStorage.getItem(PAID_AT_KEY);
        if (!storedPaidAt && accessGranted) {
            storedPaidAt = new Date().toISOString();
            try { localStorage.setItem(PAID_AT_KEY, storedPaidAt); } catch {}
        }
        if (storedPaidAt) {
            const d = new Date(storedPaidAt);
            if (!isNaN(d.getTime())) paidAt = d;
        }

        // המסלול שנבחר; ערך לא מוכר מצטמצם למסלול ברירת המחדל (30 יום)
        const storedPlanDays = localStorage.getItem(PLAN_DAYS_KEY);
        if (storedPlanDays) planDays = normalizePlanDays(storedPlanDays);

        const tickId = window.setInterval(() => { now = new Date(); }, 60_000);

        /** @param {BeforeUnloadEvent} e */
        const beforeUnload = (e) => {
            if (accessGranted && formDirty && !freeEditExpired) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", beforeUnload);

        if (accessGranted) {
            try {
                const raw = localStorage.getItem(LS_KEY);
                if (raw) {
                    const d = JSON.parse(raw);
                    logo = d.logo ?? "";
                    logoOriginal = d.logoOriginal ?? d.logo ?? "";
                    logoShape = d.logoShape ?? "square";
                    hoverLogo = d.hoverLogo === true;
                    hoverLogoX = typeof d.hoverLogoX === "number" ? d.hoverLogoX : 50;
                    hoverLogoY = typeof d.hoverLogoY === "number" ? d.hoverLogoY : 22;
                    hoverLogoSize = typeof d.hoverLogoSize === "number" ? d.hoverLogoSize : 56;
                    logoSize = typeof d.logoSize === "number" ? d.logoSize : 36;
                    logoBg = d.logoBg === "black" || d.logoBg === "clear" ? d.logoBg : "white";
                    hasCircleCrop = Boolean(d.hasCircleCrop);
                    logoPosition = d.logoPosition ?? "right";
                    logoPositionExplicit = Boolean(d.logoPositionExplicit);
                    logoFreeX = typeof d.logoFreeX === "number" ? d.logoFreeX : null;
                    logoFreeY = typeof d.logoFreeY === "number" ? d.logoFreeY : null;
                    mainImage = d.mainImage ?? "";
                    mainImageObjectX = typeof d.mainImageObjectX === "number" ? d.mainImageObjectX : 50;
                    mainImageObjectY = typeof d.mainImageObjectY === "number" ? d.mainImageObjectY : 50;
                    mainImageZoom = typeof d.mainImageZoom === "number" ? d.mainImageZoom : 1;
                    title = d.title ?? "";
                    titleColor = d.titleColor ?? "#ffffff";
                    titleFontSize = typeof d.titleFontSize === "number" ? d.titleFontSize : 1.15;
                    lpLogoAlign = d.lpLogoAlign === "center" || d.lpLogoAlign === "left" ? d.lpLogoAlign : "right";
                    lpLogoBg = d.lpLogoBg === "white" || d.lpLogoBg === "black" || d.lpLogoBg === "clear" ? d.lpLogoBg : null;
                    lpLogoSize = typeof d.lpLogoSize === "number" ? d.lpLogoSize : null;
                    titleOffsetY = typeof d.titleOffsetY === "number" ? d.titleOffsetY : 0;
                    subtitle = d.subtitle ?? "";
                    subFontSize = typeof d.subFontSize === "number" ? d.subFontSize : DEFAULT_SUB_FONT_SIZE;
                    subLineHeight = typeof d.subLineHeight === "number" ? d.subLineHeight : DEFAULT_SUB_LINE_HEIGHT;
                    subAlign = d.subAlign === "center" || d.subAlign === "left" || d.subAlign === "justify" ? d.subAlign : "right";
                    hoverText = d.hoverText ?? "";
                    cta = d.cta || "הקלק לפרטים והזמנות";
                    gradient = d.gradient ?? gradient;
                    diagHeight = typeof d.diagHeight === "number" ? d.diagHeight : 12;
                    landingHeadline = d.landingHeadline ?? "";
                    landingPitch = d.landingPitch ?? "";
                    landingExtended = d.landingExtended ?? "";
                    landingImage = d.landingImage ?? "";
                    if (Array.isArray(d.landingAdvantages)) {
                        landingAdvantages = [
                            d.landingAdvantages[0] ?? "",
                            d.landingAdvantages[1] ?? "",
                            d.landingAdvantages[2] ?? "",
                        ];
                    }
                    uniqueness = d.uniqueness ?? "";
                    phone = d.phone ?? phone;
                    whatsapp = d.whatsapp ?? whatsapp;
                    website = d.website ?? "";
                    email = d.email ?? email;
                    address = d.address ?? "";
                    hours = d.hours ?? "";
                    products = Array.isArray(d.products) ? d.products : [];
                    nextProductId = (products.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
                }
            } catch {}
            // טיוטה ישנה שחורגת מהתקציב מכווצת מיד — לא מחכים לכישלון בסוף
            void repairDraftWeight();
        }

        // ?edit=<id> חייב לרוץ *אחרי* שחזור הטיוטה - הוא בא לדרוס אותה.
        // בלי הפרמטר מנקים את היעד: מפרסם שנכנס לבנות פרסומת חדשה אחרי
        // שערך פעם אחרת לא אמור להחליף בטעות את הקיימת שלו.
        const editId = new URLSearchParams(location.search).get("edit") ?? "";
        if (editId) {
            editingAdId = editId;
            // חזרה מעורך דף הנחיתה לאותה פרסומת - ממשיכים מהטיוטה
            // שעל המסך, ולא מושכים מחדש ומאבדים את מה שכבר שונה.
            const continuing = getAdEditTarget() === editId;
            setAdEditTarget(editId);
            if (!continuing) void loadAdForEdit(editId);
            else editLoad = "ok";
        } else {
            clearAdEditTarget();
        }

        return () => {
            window.removeEventListener("dragover", blockOutsideDrop);
            window.removeEventListener("drop", blockOutsideDrop);
            window.removeEventListener("beforeunload", beforeUnload);
            window.clearInterval(tickId);
        };
    });

    // ברירת מחדל חכמה למיקום הלוגו: כותרת ארוכה (מעל 20 תווים) לא משאירה
    // מקום ללוגו בפינה שליד הכותרת, ולכן הוא יורד ליד ה-CTA. נעצרת ברגע
    // שהמפרסם בוחר מיקום בעצמו.
    $effect(() => {
        if (!logo || logoPositionExplicit) return;
        const next = title.trim().length > 20 ? "cta" : "right";
        if (logoPosition !== next) logoPosition = next;
    });

    // דגל "נערך" לאזהרת beforeunload - רק אחרי עריכה אמיתית בסשן הזה
    let formDirty = $state(false);
    let autosaveRanOnce = false;

    $effect(() => {
        if (!browser) return;
        const snapshot = {
            logo, logoOriginal, hasCircleCrop, logoShape, logoBg, logoSize, hoverLogo, hoverLogoX, hoverLogoY, hoverLogoSize, logoPosition, logoPositionExplicit, logoFreeX, logoFreeY,
            mainImage, mainImageObjectX, mainImageObjectY, mainImageZoom, title, titleColor, titleOffsetY, titleFontSize, lpLogoAlign, lpLogoBg, lpLogoSize,
            subtitle, subFontSize, subLineHeight, subAlign, hoverText, cta, gradient, diagHeight,
            landingHeadline, landingPitch, landingExtended, landingImage, landingAdvantages,
            uniqueness, phone, whatsapp, website, email, address, hours, products,
        };
        try { localStorage.setItem(LS_KEY, JSON.stringify(snapshot)); } catch {}
        if (autosaveRanOnce) {
            formDirty = true;
        } else {
            autosaveRanOnce = true;
        }
    });

    function resetDraft() {
        if (!confirm(T.resetConfirm)) return;
        try { localStorage.removeItem(LS_KEY); } catch {}
        location.reload();
    }

    // ===== שער המעבר לעריכת דף הנחיתה =====
    // לא נותנים לעבור שלב עם בעיה שתתגלה רק בסוף: כל מה שחובה בכרטיס
    // נבדק כאן, וגם משקל המודעה — במקום שדף הנחיתה יחזיר את המשתמש אחורה.
    let adWeightBytes = $derived.by(() => bodyBytes(buildPayloadSnapshot()));
    let overweight = $derived(adWeightBytes > AD_EFFECTIVE_LIMIT);
    // שמות התמונות בהודעות המשקל, בשפת האתר
    let imageLabels = $derived({
        main: T.imgMain,
        logo: T.imgLogo,
        landing: T.imgLanding,
        product: (/** @type {number} */ n) => fmt(T.imgProduct, { n }),
    });
    let heaviestLabel = $derived.by(() => heaviestImageLabel(buildPayloadSnapshot(), imageLabels));
    let cardMissing = $derived.by(() => {
        /** @type {string[]} */
        const out = [];
        if (!mainImage) out.push(T.missMain);
        if (!title.trim()) out.push(T.missTitle);
        if (!subtitle.trim()) out.push(T.missSubtitle);
        if (!hoverText.trim()) out.push(T.missHover);
        return out;
    });
    let canLeaveToLanding = $derived(cardMissing.length === 0 && !overweight);

    let movingToLanding = $state(false);
    async function goToLandingEditor() {
        if (movingToLanding || !canLeaveToLanding) return;
        movingToLanding = true;
        // מעבר מכוון לעורך דף הנחיתה - לא "יציאה מהאתר". הטיוטה כבר נשמרה
        // ב-localStorage והעורך הבא קורא בדיוק אותה, ולכן אזהרת beforeunload
        // כאן הייתה התראת שווא שהבהילה מפרסמים באמצע התהליך.
        formDirty = false;
        await goto("/advertise/builder/landing");
    }

    // טיוטה שנשמרה לפני מנגנון התקציב (למשל לוגו כבד שעבר כמו שהוא)
    // מתוקנת מיד בטעינה — שלא תיתקע בשליחה הסופית.
    async function repairDraftWeight() {
        const p = buildPayloadSnapshot();
        const before = bodyBytes(p);
        if (before <= AD_EFFECTIVE_LIMIT) return;
        const res = await shrinkAdPayload(p, AD_EFFECTIVE_LIMIT);
        applyPayloadImages(p);
        if (res.changed) showCompressNotice(before, bodyBytes(p));
    }

    // ===== מודל עזרה בעיצוב - וואטסאפ לאדמין =====
    let helpOpen = $state(false);
    let helpProblem = $state("");
    let helpContact = $state("");
    let helpError = $state("");

    function openHelp() {
        helpProblem = "";
        helpContact = data?.layoutUser?.email ?? data?.layoutUser?.name ?? "";
        helpError = "";
        helpOpen = true;
        queueMicrotask(() => {
            setTimeout(() => document.getElementById("help-problem-input")?.focus(), 30);
        });
    }
    function closeHelp() {
        helpOpen = false;
    }
    function buildDraftSummary() {
        /** @type {string[]} */
        const parts = [];
        if (title) parts.push(fmt(T.dTitle, { v: title }));
        if (subtitle) parts.push(fmt(T.dSubtitle, { v: subtitle }));
        if (mainImage) parts.push(T.dMainImage);
        if (logo) parts.push(T.dLogo);
        if (hoverText) parts.push(fmt(T.dHover, { v: `${hoverText.slice(0, 60)}${hoverText.length > 60 ? "…" : ""}` }));
        return parts.join(" · ");
    }
    function submitHelp() {
        const problem = helpProblem.trim();
        const contact = helpContact.trim();
        if (problem.length < 5) {
            helpError = T.errDescribe;
            return;
        }
        const isLoggedIn = Boolean(data?.layoutUser?.email || data?.layoutUser?.name);
        if (!isLoggedIn && !contact) {
            helpError = T.errContact;
            return;
        }
        helpError = "";
        const identity = contact || data?.layoutUser?.email || data?.layoutUser?.name || T.anonymous;
        const draftSummary = buildDraftSummary();
        const waText =
            `${T.waHelpMsg}\n\n` +
            `🧑 ${identity}\n\n` +
            `${T.theProblem}\n"${problem}"` +
            (draftSummary ? `\n\n${T.draftState} ${draftSummary}` : "");
        const waUrl = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(waText)}`;
        window.open(waUrl, "_blank", "noopener,noreferrer");
        helpOpen = false;
    }
</script>

<svelte:head>
    <title>{T.pageTitle}</title>
</svelte:head>

{#if !accessChecked}
    <div style="min-height: 40vh;" aria-hidden="true"></div>
{:else}
    <div class="ad-builder" dir="rtl">

        <!-- הודעה צפה: תמונה נדחסה אוטומטית -->
        {#if compressNotice.visible}
            <div class="compress-toast" role="status" aria-live="polite">
                <button type="button" class="compress-toast-close" onclick={dismissCompressNotice} aria-label={T.closeNotice}>✕</button>
                <div class="compress-toast-body">
                    <span class="compress-toast-icon">🪄</span>
                    <div>
                        <p class="ct-title">{T.ctTitle}</p>
                        <p class="ct-text">
                            {fmt(T.ctBody, { from: fmtWeight(compressNotice.originalBytes) })}<strong>{fmtWeight(compressNotice.finalBytes)}</strong>.
                            <br />{T.ctTip}
                        </p>
                    </div>
                </div>
            </div>
        {/if}

        <!-- כותרת -->
        <div class="b-hero">
            <div class="b-hero-icon">🎨</div>
            <h1 class="b-hero-title">{T.heroTitle}</h1>
            <p class="b-hero-sub">
                {T.hero1}
                <br />{T.hero2}
            </p>

            <!-- עריכת פרסומת קיימת -->
            {#if editingAdId}
                <div class="b-editing" class:b-editing-err={editLoad === "error"}>
                    <span class="b-cd-icon">
                        {editLoad === "loading" ? "⏳" : editLoad === "error" ? "⚠️" : "✏️"}
                    </span>
                    <div>
                        <p class="b-cd-title">
                            {editLoad === "loading"
                                ? T.editLoading
                                : editLoad === "error"
                                  ? T.editFailedTitle
                                  : T.editTitle}
                        </p>
                        <p class="b-cd-text">
                            {editLoad === "error" ? T.editFailedBody : T.editBody}
                        </p>
                    </div>
                </div>
            {/if}

            <!-- ספירה לאחור ליום העריכה החינמי -->
            {#if paidAt && !freeEditExpired && freeEditUntil}
                <div class="b-countdown">
                    <span class="b-cd-icon">⏰</span>
                    <div>
                        <p class="b-cd-title">{T.cdTitle}</p>
                        <p class="b-cd-text">
                            {T.cdLeft} <strong>{fmtCountdown(freeMsRemaining)}</strong>
                            {T.cdMid} <strong>{T.cdFinish}</strong>
                            {fmt(T.cdEnd, { date: fmtDateShort(new Date(paidAt.getTime() + planDays * 24 * 60 * 60 * 1000)) })}
                        </p>
                    </div>
                </div>
            {:else if paidAt && freeEditExpired}
                <div class="b-expired">
                    <span class="b-cd-icon">⌛</span>
                    <div>
                        <p class="b-cd-title red">{T.expTitle}</p>
                        <p class="b-cd-text">{T.expBody}</p>
                    </div>
                </div>
            {/if}

            <!-- שמירה אוטומטית -->
            <div class="b-autosave">
                <span class="b-cd-icon">💾</span>
                <div>
                    <p class="b-as-title">{T.autosaveTitle}</p>
                    <p class="b-cd-text">{T.autosaveBody}</p>
                </div>
            </div>

            <div class="b-reset-row">
                <button type="button" onclick={resetDraft} class="b-reset">{T.reset}</button>
            </div>
        </div>

        <!-- ========== שתי עמודות: שלבים מימין, דמו חי משמאל ========== -->
        <div class="builder-cols">
            <div class="builder-steps">

                <!-- =================== שלב 1: תמונה ראשית =================== -->
                <section bind:this={stepRefs.image} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.image.title}>
                        <span class="step-num" class:step-num-light={litFlags.image.num}>1</span>
                        <h2>{T.s1Title}</h2>
                        {#if activeStep === "image"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">{T.s1Help}</p>

                    <div class="step1-grid">
                        <div class="tips-box">
                            <p class="tips-title">{T.tipsTitle}</p>
                            <ul>
                                <li>{T.tip1}</li>
                                <li>{T.tip2}</li>
                                <li>{T.tip3}</li>
                                <li>{T.tip4}</li>
                                <li>{T.tip5}</li>
                            </ul>
                        </div>

                        <label
                            class="upload-zone"
                            class:has-image={!!mainImage}
                            class:dragging={isDraggingMain}
                            ondragover={(e) => dragOver(e, (v) => (isDraggingMain = v))}
                            ondragleave={(e) => dragLeave(e, (v) => (isDraggingMain = v))}
                            ondrop={(e) => handleDrop(e, "main", (v) => (isDraggingMain = v))}
                        >
                            {#if mainImage}
                                <img src={mainImage} alt={T.mainImageAlt} style:object-fit="cover" style:object-position="{mainImageObjectX}% {mainImageObjectY}%" use:adImgFit={mainImageFit} />
                                <button type="button" class="remove-x" onclick={(e) => { e.preventDefault(); clearImage("main"); }} aria-label={T.removeImage}>✕</button>
                                <button type="button" class="crop-arrow up" onclick={(e) => { e.preventDefault(); nudgeMainImage("up"); }} aria-label={T.nudgeUp}>▲</button>
                                <button type="button" class="crop-arrow down" onclick={(e) => { e.preventDefault(); nudgeMainImage("down"); }} aria-label={T.nudgeDown}>▼</button>
                                <button type="button" class="crop-arrow left" onclick={(e) => { e.preventDefault(); nudgeMainImage("left"); }} aria-label={T.nudgeLeft}>◀</button>
                                <button type="button" class="crop-arrow right" onclick={(e) => { e.preventDefault(); nudgeMainImage("right"); }} aria-label={T.nudgeRight}>▶</button>
                                <button type="button" class="crop-reset" onclick={(e) => { e.preventDefault(); mainImageObjectX = 50; mainImageObjectY = 50; mainImageZoom = 1; }} aria-label={T.resetPos}>⊙</button>
                                <button type="button" class="crop-zoom zoom-in" onclick={(e) => { e.preventDefault(); zoomMainImage("in"); }} aria-label={T.zoomIn}>＋</button>
                                <button type="button" class="crop-zoom zoom-out" onclick={(e) => { e.preventDefault(); zoomMainImage("out"); }} aria-label={T.zoomOut}>－</button>
                            {:else}
                                <div class="upload-empty">
                                    <div class="upload-emoji">📸</div>
                                    <p class="upload-main">{isDraggingMain ? T.dropHere : T.clickOrDrag}</p>
                                    <p class="upload-note">{T.uploadNote}</p>
                                </div>
                            {/if}
                            <input type="file" accept="image/*" onchange={(e) => handleImage(e, "main")} class="hidden-input" />
                        </label>
                    </div>
                    {#if uploadIssue.zone === "main"}
                        <p class="upload-issue" role="alert">⛔ {uploadIssue.msg}</p>
                    {/if}
                    {#if mainImage}
                        <p class="crop-hint">{T.cropHint}</p>
                        <div class="step-nav-row">
                            <button type="button" class="step-nav-btn" onclick={() => advance("logo")}>{T.doneCentering}</button>
                        </div>
                    {/if}
                </section>

                <!-- =================== שלב 2: לוגו =================== -->
                <section bind:this={stepRefs.logo} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.logo.title}>
                        <span class="step-num" class:step-num-light={litFlags.logo.num}>2</span>
                        <h2>{T.s2Title}</h2>
                        {#if activeStep === "logo"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">{T.s2HelpPre} <strong class="amber-strong">{T.s2HelpStrong}</strong> {T.s2HelpPost}</p>

                    <div class="logo-row">
                        <div class="logo-upload-col">
                            <label
                                class="upload-zone-sm"
                                class:has-image={!!logo}
                                class:dragging={isDraggingLogo}
                                ondragover={(e) => dragOver(e, (v) => (isDraggingLogo = v))}
                                ondragleave={(e) => dragLeave(e, (v) => (isDraggingLogo = v))}
                                ondrop={(e) => handleDrop(e, "logo", (v) => (isDraggingLogo = v))}
                            >
                                {#if logo}
                                    <img src={logo} alt={T.logoAlt} />
                                    <button type="button" class="remove-x" onclick={(e) => { e.preventDefault(); clearImage("logo"); }} aria-label={T.removeLogo}>✕</button>
                                {:else}
                                    <div class="upload-sm-empty">
                                        <div class="upload-sm-emoji">{isDraggingLogo ? "✨" : "🏷️"}</div>
                                        <p>{isDraggingLogo ? T.release : T.uploadLogo}</p>
                                    </div>
                                {/if}
                                <input type="file" accept="image/*" onchange={(e) => handleImage(e, "logo")} class="hidden-input" />
                            </label>
                            {#if logo && logoShape === "circle" && hasCircleCrop}
                                <button type="button" onclick={openCropper} class="edit-crop-link">{T.editCrop}</button>
                            {/if}
                        </div>

                        {#if logo}
                            <div class="logo-controls">
                                <div>
                                    <p class="control-label">{T.cropShape}</p>
                                    <div class="seg-group">
                                        <button type="button" onclick={chooseSquare} class="seg-btn" class:active={logoShape === "square"}>{T.square}</button>
                                        <button type="button" onclick={chooseCircle} class="seg-btn" class:active={logoShape === "circle"}>{T.circle}</button>
                                    </div>
                                </div>
                                <div>
                                    <p class="control-label">רקע הלוגו</p>
                                    <div class="seg-group">
                                        {#each [["white", "לבן"], ["black", "שחור"], ["clear", "שקוף"]] as [v, label]}
                                            <button type="button" onclick={() => (logoBg = /** @type {'white' | 'black' | 'clear'} */ (v))} class="seg-btn" class:active={logoBg === v}>{label}</button>
                                        {/each}
                                    </div>
                                </div>
                                <div>
                                    <p class="control-label">גודל הלוגו</p>
                                    <div class="seg-group logo-size-ctl">
                                        <button type="button" aria-label="-" onclick={() => (logoSize = Math.max(20, logoSize - 4))} class="seg-btn">−</button>
                                        <input type="range" min="20" max="80" step="2" bind:value={logoSize} class="range-input logo-size-range" aria-label="גודל הלוגו" />
                                        <button type="button" aria-label="+" onclick={() => (logoSize = Math.min(80, logoSize + 4))} class="seg-btn">+</button>
                                    </div>
                                </div>
                                <div>
                                    <p class="control-label">{T.logoPos}</p>
                                    <div class="seg-group">
                                        <button type="button" onclick={() => setLogoAnchor("right")} class="seg-btn" class:active={!logoFree && logoPosition === "right"}>{T.posRight}</button>
                                        <button type="button" onclick={() => setLogoAnchor("left")} class="seg-btn" class:active={!logoFree && logoPosition === "left"}>{T.posLeft}</button>
                                        <button type="button" onclick={() => setLogoAnchor("cta")} class="seg-btn" class:active={!logoFree && logoPosition === "cta"}>{T.posBottom}</button>
                                    </div>
                                </div>
                            </div>

                            <!-- מיקום חופשי: גוררים את הלוגו על הדמו החי לכל נקודה -->
                            <div class="logo-drag-row">
                                <p class="logo-drag-hint">
                                    <span aria-hidden="true">🖐️</span>
                                    <span>{T.logoDragHint}</span>
                                </p>
                                {#if logoFree}
                                    <span class="logo-free-info">
                                        <span class="logo-free-coords">{logoFreeX}% · {logoFreeY}%</span>
                                        <button type="button" onclick={resetLogoPosition} class="logo-free-reset">{T.logoPosReset}</button>
                                    </span>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    {#if uploadIssue.zone === "logo"}
                        <p class="upload-issue" role="alert">⛔ {uploadIssue.msg}</p>
                    {/if}

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("logo"))}>{T.prevStep}</button>
                        <button type="button" class="step-nav-btn" onclick={() => advance("title")}>
                            {logo ? T.nextStep : T.skipLogo}
                        </button>
                    </div>

                    <!-- ===== מודל חיתוך עגול ===== -->
                    {#if cropOpen}
                        <div class="crop-modal-bg" role="dialog" aria-modal="true" aria-label={T.cropModalAria}>
                            <div class="crop-modal">
                                <div class="crop-modal-head">
                                    <h3>{T.cropTitle}</h3>
                                    <button type="button" class="crop-modal-x" onclick={cancelCrop} aria-label={T.close}>✕</button>
                                </div>
                                <p class="crop-help">{T.cropHelp}</p>
                                <div
                                    class="crop-stage"
                                    onpointerdown={cropPointerDown}
                                    onpointermove={cropPointerMove}
                                    onpointerup={cropPointerUp}
                                    onpointercancel={cropPointerUp}
                                    onwheel={cropWheel}
                                >
                                    <img
                                        src={logoOriginal}
                                        alt={T.logoAlt}
                                        class="crop-img"
                                        draggable="false"
                                        style:transform="translate({cropOffsetX}px, {cropOffsetY}px) scale({cropZoom})"
                                    />
                                    <div class="crop-circle-mask"></div>
                                </div>
                                <div class="crop-controls">
                                    <span class="crop-zoom-label">{T.zoom}</span>
                                    <input type="range" min="0.3" max="4" step="0.01" bind:value={cropZoom} class="crop-zoom-slider" aria-label={T.zoomLevel} />
                                    <span class="crop-zoom-val">{Math.round(cropZoom * 100)}%</span>
                                </div>
                                <div class="crop-actions">
                                    <button type="button" class="crop-btn-cancel" onclick={cancelCrop}>{T.cancel}</button>
                                    <button type="button" class="crop-btn-confirm" onclick={confirmCrop}>{T.confirmCrop}</button>
                                </div>
                            </div>
                        </div>
                    {/if}
                </section>

                <!-- =================== שלב 3: כותרת =================== -->
                <section bind:this={stepRefs.title} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.title.title}>
                        <span class="step-num" class:step-num-light={litFlags.title.num}>3</span>
                        <h2>{T.s3Title}</h2>
                        {#if activeStep === "title"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}

                        <div class="title-color-rail" aria-label={T.titleColorAria}>
                            <span class="title-color-label">{T.colorLabel}</span>
                            {#each titleColors as p}
                                <button
                                    type="button"
                                    onclick={() => (titleColor = p.c)}
                                    class="title-color-dot"
                                    class:selected={titleColor === p.c}
                                    style:background={p.c}
                                    title={tr(p.labelKey)}
                                    aria-label={tr(p.labelKey)}
                                    aria-pressed={titleColor === p.c}
                                ></button>
                            {/each}
                            <label class="title-color-custom" title={T.customColor}>
                                <input type="color" bind:value={titleColor} aria-label={T.customColorPick} />
                                <span>🎨</span>
                            </label>
                        </div>
                    </div>
                    <p class="step-help">{T.s3Help}</p>

                    <input
                        type="text"
                        bind:value={title}
                        maxlength="40"
                        onfocus={() => activeStep === "title" || (activeStep = "title")}
                        onblur={() => title.trim() && commitField("title")}
                        placeholder={T.s3Ph}
                        class="text-input"
                    />
                    <div class="char-count">{title.length}/40</div>

                    <div class="slider-block">
                        <div class="slider-head">
                            <p>גודל הכותרת <span class="amber-strong">{titleFontSize.toFixed(2)}</span></p>
                            <button type="button" onclick={() => (titleFontSize = 1.15)} class="slider-reset">{T.resetWord}</button>
                        </div>
                        <input type="range" min="0.8" max="1.8" step="0.05" bind:value={titleFontSize} class="range-input" aria-label="גודל הכותרת" />
                    </div>

                    <div class="slider-block">
                        <div class="slider-head">
                            <p>{T.titlePos} <span class="amber-strong">{titleOffsetY > 0 ? `+${titleOffsetY}` : titleOffsetY}px</span></p>
                            <button type="button" onclick={() => (titleOffsetY = 0)} class="slider-reset">{T.resetWord}</button>
                        </div>
                        <input type="range" min="-20" max="60" step="1" bind:value={titleOffsetY} class="range-input" aria-label={T.titlePosAria} />
                        <div class="slider-labels"><span>{T.up}</span><span>{T.down}</span></div>
                    </div>

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("title"))}>{T.prevStep}</button>
                        {#if title}
                            <button type="button" class="step-nav-btn" onclick={() => commitField("title")}>{T.nextStep}</button>
                        {/if}
                    </div>
                </section>

                <!-- =================== שלב 4: צבע הפס =================== -->
                <section bind:this={stepRefs.gradient} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.gradient.title}>
                        <span class="step-num" class:step-num-light={litFlags.gradient.num}>4</span>
                        <h2>{T.s4Title}</h2>
                        {#if activeStep === "gradient"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">{T.s4Help}</p>

                    <p class="control-label">{T.bandColor}</p>
                    <div class="color-rail" aria-label={T.bandColorAria}>
                        {#each palettes as p}
                            <button
                                type="button"
                                onclick={() => (gradient = p.cls)}
                                class="color-dot"
                                class:selected={gradient === p.cls}
                                style={gradientStyle(p.cls, "to bottom right")}
                                title={tr(p.labelKey)}
                                aria-label={tr(p.labelKey)}
                                aria-pressed={gradient === p.cls}
                            ></button>
                        {/each}
                    </div>

                    <div class="slider-block">
                        <div class="slider-head">
                            <p>{T.bandHeightPre} <span class="amber-strong">{diagHeight}%</span> {T.bandHeightPost}</p>
                        </div>
                        <input type="range" min="5" max="50" step="1" bind:value={diagHeight} class="range-input" aria-label={T.bandHeightAria} />
                        <div class="slider-labels"><span>{T.bandLow}</span><span>{T.bandHigh}</span></div>
                    </div>

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("gradient"))}>{T.prevStep}</button>
                        <button type="button" class="step-nav-btn" onclick={() => advance("subtitle")}>{T.continueNext}</button>
                    </div>
                </section>

                <!-- =================== שלב 5: סלוגן =================== -->
                <section bind:this={stepRefs.subtitle} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.subtitle.title}>
                        <span class="step-num" class:step-num-light={litFlags.subtitle.num}>5</span>
                        <h2>{T.s5Title}</h2>
                        {#if activeStep === "subtitle"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">{T.s5Help}</p>

                    <input
                        type="text"
                        bind:value={subtitle}
                        maxlength="70"
                        onfocus={() => activeStep === "subtitle" || (activeStep = "subtitle")}
                        onblur={() => subtitle.trim() && commitField("subtitle")}
                        placeholder={T.s5Ph}
                        class="text-input"
                    />
                    <div class="char-count">{subtitle.length}/70</div>

                    <!-- טיפוגרפיה של הסלוגן: גודל, רווח בין שורות ויישור - כמו בקהילה
                         בשכונה. הערכים נוסעים עם המודעה (_adStyle), ולכן מה שנראה כאן
                         הוא מה שיתפרסם. -->
                    <div class="sub-type-panel">
                        <p class="sub-type-title">{T.s5TypeTitle}</p>

                        <div class="sub-type-row">
                            <span class="sub-type-label">{T.s5Size}</span>
                            <input type="range" class="sub-type-range"
                                   min={SUB_FONT_SIZE_MIN} max={SUB_FONT_SIZE_MAX} step="0.02"
                                   bind:value={subFontSize}
                                   aria-label={T.s5Size}
                                   oninput={() => activeStep === "subtitle" || (activeStep = "subtitle")} />
                            <span class="sub-type-value">{subFontSize.toFixed(2)}</span>
                        </div>

                        <div class="sub-type-row">
                            <span class="sub-type-label">{T.s5LineHeight}</span>
                            <input type="range" class="sub-type-range"
                                   min={SUB_LINE_HEIGHT_MIN} max={SUB_LINE_HEIGHT_MAX} step="0.05"
                                   bind:value={subLineHeight}
                                   aria-label={T.s5LineHeight}
                                   oninput={() => activeStep === "subtitle" || (activeStep = "subtitle")} />
                            <span class="sub-type-value">{subLineHeight.toFixed(2)}</span>
                        </div>

                        <div class="sub-type-row">
                            <span class="sub-type-label">{T.s5Align}</span>
                            <div class="sub-type-aligns">
                                {#each subAligns as opt}
                                    <button type="button"
                                            onclick={() => (subAlign = opt.id)}
                                            title={tr(opt.labelKey)}
                                            aria-pressed={subAlign === opt.id}
                                            class="sub-type-align-btn"
                                            class:is-active={subAlign === opt.id}>
                                        <span aria-hidden="true">{opt.icon}</span>
                                        <span class="sub-type-align-text">{tr(opt.labelKey)}</span>
                                    </button>
                                {/each}
                            </div>
                        </div>

                        <button type="button" class="sub-type-reset"
                                onclick={() => { subFontSize = DEFAULT_SUB_FONT_SIZE; subLineHeight = DEFAULT_SUB_LINE_HEIGHT; subAlign = "right"; }}>
                            {T.s5TypeReset}
                        </button>
                    </div>

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("subtitle"))}>{T.prevStep}</button>
                        {#if subtitle}
                            <button type="button" class="step-nav-btn" onclick={() => commitField("subtitle")}>{T.nextStep}</button>
                        {/if}
                    </div>
                </section>

                <!-- =================== שלב 6: טקסט בריחוף =================== -->
                <section bind:this={stepRefs.hover} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.hover.title}>
                        <span class="step-num" class:step-num-light={litFlags.hover.num}>6</span>
                        <h2>{T.s6Title}</h2>
                        {#if activeStep === "hover"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">
                        {T.s6Help1}
                        <br /><strong class="amber-strong">{T.s6HelpStrong}</strong> {T.s6Help2}
                    </p>

                    <!-- התיבה גדלה לפי התוכן (autoGrow): גובה קבוע חתך את השורות
                         האחרונות והמפרסם לא ראה את סוף המשפט שכתב -->
                    <textarea
                        bind:value={hoverText}
                        use:autoGrow={hoverText}
                        maxlength="90"
                        rows="3"
                        onfocus={() => activeStep === "hover" || (activeStep = "hover")}
                        onblur={() => hoverText.trim() && commitField("hover")}
                        placeholder={T.s6Ph}
                        class="text-input"
                    ></textarea>
                    <div class="char-count">{hoverText.length}/90</div>

                    {#if logo}
                        <div class="hover-logo-ctl">
                            <label class="hover-logo-check">
                                <input type="checkbox" bind:checked={hoverLogo} onchange={() => activeStep === "hover" || (activeStep = "hover")} />
                                הצג את הלוגו גם בטקסט הריחוף
                            </label>
                            {#if hoverLogo}
                                <div class="hover-logo-row"><span>אופקי</span><input type="range" min="0" max="100" step="1" class="range-input" bind:value={hoverLogoX} /></div>
                                <div class="hover-logo-row"><span>אנכי</span><input type="range" min="0" max="100" step="1" class="range-input" bind:value={hoverLogoY} /></div>
                                <div class="hover-logo-row"><span>גודל</span><input type="range" min="20" max="120" step="2" class="range-input" bind:value={hoverLogoSize} /></div>
                            {/if}
                        </div>
                    {/if}

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("hover"))}>{T.prevStep}</button>
                        {#if hoverText}
                            <button type="button" class="step-nav-btn" onclick={() => commitField("hover")}>{T.nextStep}</button>
                        {/if}
                    </div>
                </section>

                <!-- =================== שלב 7: תצוגה מקדימה =================== -->
                <section bind:this={stepRefs.preview} class="step-card">
                    <div class="step-head" class:step-title-light={litFlags.preview.title}>
                        <span class="step-num" class:step-num-light={litFlags.preview.num}>7</span>
                        <h2>{T.s7Title}</h2>
                        {#if activeStep === "preview"}
                            <span class="tutorial-finger" aria-hidden="true">👇</span>
                        {/if}
                    </div>
                    <p class="step-help">{T.s7Help}</p>

                    <div class="preview-toggle-row">
                        <div class="seg-group">
                            <button type="button" onclick={() => (previewMode = "mobile")} class="seg-btn" class:active={previewMode === "mobile"}>{T.mobile}</button>
                            <button type="button" onclick={() => (previewMode = "desktop")} class="seg-btn" class:active={previewMode === "desktop"}>{T.desktop}</button>
                        </div>
                    </div>

                    {#if previewMode === "mobile"}
                        <div class="preview-frame">
                            <div class="phone-screen">
                                <div class="phone-notch"></div>
                                <div class="phone-content">
                                    <div class="mobile-popup">
                                        <div class="popup-title-row">
                                            {#if logo}
                                                <img src={logo} alt={T.logoAlt} class="popup-logo-above" class:circle={logoShape === "circle"} style={logoBg === "black" ? "background:#000;" : logoBg === "clear" ? "background:transparent;" : ""} />
                                            {/if}
                                            <h3 class="popup-title-above" style:color={titleColor}>{title || T.phTitle}</h3>
                                        </div>
                                        <div class="popup-img pro-img-wrap">
                                            {#if mainImage}
                                                <img src={mainImage} alt={title} style:object-position="{mainImageObjectX}% {mainImageObjectY}%" use:adImgFit={mainImageFit} />
                                            {:else}
                                                <div class="img-placeholder">{T.mainImageAlt}</div>
                                            {/if}
                                            <div class="pro-diag" style={gradientStyle(gradient, "to bottom right")}></div>
                                            <div class="pro-title-wrap mobile">
                                                <p class="pro-sub">{subtitle || T.phSlogan}</p>
                                            </div>
                                            <div class="close-countdown">5</div>
                                        </div>
                                        <div class="popup-body">
                                            <button type="button" class="popup-cta" style={gradientStyle(gradient, "to right")}>← {cta}</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p class="preview-caption">{T.mobileCaption}</p>
                        </div>
                    {:else}
                        <div class="preview-frame">
                            <div
                                role="button"
                                tabindex="0"
                                class="clean-card"
                                onmouseenter={() => (hoverPreview = true)}
                                onmouseleave={() => (hoverPreview = false)}
                                onfocus={() => (hoverPreview = true)}
                                onblur={() => (hoverPreview = false)}
                            >
                                <div class="pro-img-wrap clean-card-img" use:logoClearance={[title, subtitle, logo, logoFreeX, logoFreeY, logoPosition, diagHeight, titleOffsetY, subFontSize, subLineHeight, subAlign]}>
                                    {#if mainImage}
                                        <img src={mainImage} alt={title} class="ad-img" style:opacity={showHover ? 0 : 1} style:object-position="{mainImageObjectX}% {mainImageObjectY}%" use:adImgFit={mainImageFit} />
                                    {:else}
                                        <div class="img-placeholder">{T.imgPlaceholder}</div>
                                    {/if}
                                    <div class="pro-diag" style={gradientStyle(gradient, "to bottom right")} style:opacity={showHover ? 0 : 1}></div>
                                    <div
                                        class="pro-title-top"
                                        class:has-corner-logo-right={titleCornerSide === "right"}
                                        class:has-corner-logo-left={titleCornerSide === "left"}
                                        style:opacity={showHover ? 0 : 1}
                                        style:transform="translateY({titleOffsetY}px)"
                                    >
                                        <h3 class="pro-title" style:color={titleColor} style:font-size={titleFontSize !== 1.15 ? `${titleFontSize}rem` : undefined}><span class="logo-avoid" aria-hidden="true"></span>{title || T.phTitle}</h3>
                                    </div>
                                    <div class="pro-title-wrap" style:opacity={showHover ? 0 : 1}>
                                        <p class="pro-sub"><span class="logo-avoid" data-anchor="bottom" aria-hidden="true"></span>{subtitle || T.phSlogan}</p>
                                    </div>
                                    <div class="hover-overlay" style:opacity={showHover ? 1 : 0}>
                                        <h3 class="hover-title">{title || T.phTitleShort}</h3>
                                        <p class="hover-text">{hoverText || T.phHover}</p>
                                        {#if logo && hoverLogo}
                                            <img src={logo} alt="" class="hover-logo" style="left:{hoverLogoX}%;top:{hoverLogoY}%;width:{hoverLogoSize}px;height:{hoverLogoSize}px;{logoShape === 'circle' ? 'border-radius:50%;' : ''}{logoBg === 'black' ? 'background:#000;' : logoBg === 'clear' ? 'background:transparent;box-shadow:none;' : ''}" />
                                        {/if}
                                    </div>
                                    {#if logo}
                                        <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                        <!-- הלוגו עצמו הוא ידית הגרירה. role=button + tabindex נותנים לו
                                             מקבילת מקלדת מלאה (חיצים מזיזים אותו) -->
                                        <img
                                            src={logo}
                                            alt={T.logoAlt}
                                            data-ad-logo
                                            class="ad-logo ad-logo-draggable {logoFree ? 'ad-logo-free' : logoAnchorClass}"
                                            class:ad-logo-circle={logoShape === "circle"}
                                            class:ad-logo-dragging={logoDragging}
                                            style={logoFreeStyle}
                                            draggable="false"
                                            role="button"
                                            tabindex="0"
                                            aria-label={T.logoDragAria}
                                            onpointerdown={logoPointerDown}
                                            onpointermove={logoPointerMove}
                                            onpointerup={logoPointerUp}
                                            onpointercancel={logoPointerUp}
                                            onkeydown={logoKeyDown}
                                        />
                                    {/if}
                                </div>
                                <div class="promo-cta" style={gradientStyle(gradient, "to right")}>
                                    <p>{cta}</p>
                                </div>
                            </div>
                            <p class="preview-caption">{T.desktopCaption}</p>
                        </div>
                    {/if}

                    <div class="step-nav-row">
                        <button type="button" class="step-nav-btn" onclick={() => advance(prevOf("preview"))}>{T.prevStep}</button>
                        <div class="help-wrap">
                            <button type="button" onclick={openHelp} class="help-btn" aria-label={T.helpBtnAria}>
                                <span aria-hidden="true">😩</span>
                                <span>{T.helpBtn}</span>
                                <span aria-hidden="true">🆘</span>
                            </button>
                        </div>
                        <button type="button" class="step-nav-btn" onclick={goToLandingEditor} disabled={movingToLanding || !canLeaveToLanding}>
                            {movingToLanding ? T.movingLanding : T.looksGreat}
                        </button>
                    </div>

                    <!-- החסימה מוסברת כאן, בשלב עצמו — לא מגלים בדף הבא שחסר משהו -->
                    {#if !canLeaveToLanding}
                        <div class="step-block-note" role="alert">
                            {#if cardMissing.length > 0}
                                <p>{T.missingPre} <strong>{cardMissing.join(", ")}</strong>.</p>
                            {/if}
                            {#if overweight}
                                <p>
                                    {fmt(T.tooHeavy, { w: fmtWeight(adWeightBytes), max: fmtWeight(AD_EFFECTIVE_LIMIT) })}{#if heaviestLabel}&nbsp;{T.heaviestPre} <strong>{heaviestLabel}</strong>){/if}.
                                </p>
                            {/if}
                        </div>
                    {:else if adWeightBytes > AD_EFFECTIVE_LIMIT * 0.7}
                        <p class="weight-pill">{fmt(T.weightPill, { w: fmtWeight(adWeightBytes), max: fmtWeight(AD_EFFECTIVE_LIMIT) })}</p>
                    {/if}
                </section>

            </div><!-- /.builder-steps -->

            <!-- ========== דמו חי - קופץ להתיישר עם השלב הפעיל ========== -->
            <aside class="builder-demo" aria-label={T.demoAria} style:top="{demoTop}px">
                <div class="live-demo-card">
                    <p class="live-demo-label">{T.demoLabel}</p>
                    <div class="live-demo-frame" dir="rtl">
                        <div class="pro-img-wrap live-demo-img-wrap" use:logoClearance={[title, subtitle, logo, logoFreeX, logoFreeY, logoPosition, diagHeight, titleOffsetY, subFontSize, subLineHeight, subAlign]}>
                            {#if mainImage}
                                <img
                                    src={mainImage}
                                    alt={title}
                                    class="ad-img"
                                    style:object-position="{mainImageObjectX}% {mainImageObjectY}%"
                                    style:opacity={activeStep === "hover" ? 0 : 1}
                                    use:adImgFit={mainImageFit}
                                />
                            {:else}
                                <div class="placeholder-dashed placeholder-img" style:opacity={activeStep === "hover" ? 0 : 1}>
                                    <div class="placeholder-icon">📸</div>
                                    <p>{T.mainImageAlt}</p>
                                    <p class="placeholder-hint">{fmt(T.stepN, { n: 1 })}</p>
                                </div>
                            {/if}
                            <div class="pro-diag" style={gradientStyle(gradient, "to bottom right")} style:opacity={activeStep === "hover" ? 0 : 1}></div>
                            <div
                                class="pro-title-top"
                                class:has-corner-logo-right={titleCornerSide === "right"}
                                class:has-corner-logo-left={titleCornerSide === "left"}
                                style:transform="translateY({titleOffsetY}px)"
                                style:opacity={activeStep === "hover" ? 0 : 1}
                            >
                                {#if title}
                                    <h3 class="pro-title" style:color={titleColor} style:font-size={titleFontSize !== 1.15 ? `${titleFontSize}rem` : undefined}><span class="logo-avoid" aria-hidden="true"></span>{title}</h3>
                                {:else}
                                    <div class="placeholder-dashed placeholder-line">{T.phTitleStep}</div>
                                {/if}
                            </div>
                            <div class="pro-title-wrap" style:opacity={activeStep === "hover" ? 0 : 1}>
                                {#if subtitle}
                                    <p class="pro-sub"><span class="logo-avoid" data-anchor="bottom" aria-hidden="true"></span>{subtitle}</p>
                                {:else}
                                    <div class="placeholder-dashed placeholder-line small">{T.phSloganStep}</div>
                                {/if}
                            </div>
                            {#if logo}
                                <!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
                                <img
                                    src={logo}
                                    alt={T.logoAlt}
                                    data-ad-logo
                                    class="ad-logo ad-logo-draggable {logoFree ? 'ad-logo-free' : logoAnchorClass}"
                                    class:ad-logo-circle={logoShape === "circle"}
                                    class:ad-logo-dragging={logoDragging}
                                    style="{logoFreeStyle} opacity:{activeStep === 'hover' ? 0 : 1};"
                                    draggable="false"
                                    role="button"
                                    tabindex="0"
                                    aria-label={T.logoDragAria}
                                    onpointerdown={logoPointerDown}
                                    onpointermove={logoPointerMove}
                                    onpointerup={logoPointerUp}
                                    onpointercancel={logoPointerUp}
                                    onkeydown={logoKeyDown}
                                />
                            {:else}
                                <div
                                    class="placeholder-dashed placeholder-logo"
                                    class:pos-left={logoPosition === "left"}
                                    class:pos-cta={logoPosition === "cta"}
                                    style:opacity={activeStep === "hover" ? 0 : 1}
                                >{T.logoAlt}<br />{fmt(T.stepN, { n: 2 })}</div>
                            {/if}
                            <div class="hover-overlay" style:opacity={activeStep === "hover" ? 1 : 0}>
                                <h3 class="hover-title">{title || T.phTitleShort}</h3>
                                <p class="hover-text">{hoverText || T.phHoverShort}</p>
                                {#if logo && hoverLogo}
                                    <img src={logo} alt="" class="hover-logo" style="left:{hoverLogoX}%;top:{hoverLogoY}%;width:{hoverLogoSize}px;height:{hoverLogoSize}px;{logoShape === 'circle' ? 'border-radius:50%;' : ''}{logoBg === 'black' ? 'background:#000;' : logoBg === 'clear' ? 'background:transparent;box-shadow:none;' : ''}" />
                                {/if}
                            </div>
                        </div>
                        <div class="promo-cta" style={gradientStyle(gradient, "to right")}>
                            <p>{cta}</p>
                        </div>
                    </div>
                </div>
            </aside>

        </div><!-- /.builder-cols -->

    </div>
{/if}

<!-- תג אדמין -->
{#if accessGranted && isSuperAdmin}
    <div class="admin-badge" dir="rtl">
        <p>{T.adminBadge}</p>
    </div>
{/if}

<!-- =================== מודל עזרה בעיצוב =================== -->
{#if helpOpen}
    <div
        class="help-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-modal-title"
        onclick={(e) => { if (e.target === e.currentTarget) closeHelp(); }}
        onkeydown={(e) => { if (e.key === "Escape") closeHelp(); }}
        tabindex="-1"
    >
        <div class="help-modal" dir="rtl">
            <div class="help-modal-head">
                <span class="help-modal-icon" aria-hidden="true">🆘</span>
                <h2 id="help-modal-title">{T.helpModalTitle}</h2>
                <button type="button" class="help-close" onclick={closeHelp} aria-label={T.close}>×</button>
            </div>

            <p class="help-intro">{T.helpIntro}</p>

            <label class="help-field">
                <span class="help-label">{T.helpProblem} <span class="help-required">*</span></span>
                <textarea
                    id="help-problem-input"
                    bind:value={helpProblem}
                    maxlength="2000"
                    rows="5"
                    placeholder={T.helpProblemPh}
                    class="help-textarea"
                ></textarea>
                <span class="help-counter">{helpProblem.length}/2000</span>
            </label>

            {#if !data?.layoutUser?.email && !data?.layoutUser?.name}
                <label class="help-field">
                    <span class="help-label">{T.helpIdentify} <span class="help-required">*</span></span>
                    <input type="text" bind:value={helpContact} maxlength="200" placeholder={T.helpIdentifyPh} class="help-input" />
                </label>
            {:else}
                <p class="help-identity">
                    <span aria-hidden="true">🧑</span>
                    {T.identifiedAs}<strong>{data?.layoutUser?.name || data?.layoutUser?.email}</strong>
                </p>
            {/if}

            {#if helpError}
                <div class="help-error" role="alert">{helpError}</div>
            {/if}

            <div class="help-actions">
                <button type="button" class="help-btn-secondary" onclick={closeHelp}>{T.cancel}</button>
                <button type="button" class="help-btn-primary" onclick={submitHelp}>
                    <span aria-hidden="true">💬</span>
                    {T.sendOpenWa}
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    /* ============== מבנה כללי ============== */
    .ad-builder {
        max-width: 64rem;
        margin: 0 auto;
        padding: 1rem 1rem 3rem;
    }

    /* ============== הודעת דחיסה ============== */
    .compress-toast {
        position: fixed;
        top: 5rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 60;
        width: calc(100% - 1.5rem);
        max-width: 32rem;
        padding: 0.875rem 2.5rem 0.875rem 1rem;
        border-radius: 1rem;
        border: 1px solid rgba(251, 191, 36, 0.55);
        background: linear-gradient(135deg, rgba(120, 53, 15, 0.92), rgba(146, 64, 14, 0.88));
        box-shadow: 0 18px 40px -12px rgba(0, 0, 0, 0.55);
        backdrop-filter: blur(8px);
        animation: compressToastIn 280ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .compress-toast-close {
        position: absolute;
        top: 0.4rem;
        left: 0.5rem;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.35);
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.75rem;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255, 255, 255, 0.18);
        cursor: pointer;
    }
    .compress-toast-close:hover { background: rgba(220, 38, 38, 0.85); }
    .compress-toast-body {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        text-align: right;
    }
    .compress-toast-icon { font-size: 1.85rem; flex-shrink: 0; }
    .ct-title {
        font-weight: 900;
        color: #fde68a;
        font-size: 0.95rem;
        margin: 0 0 0.25rem;
    }
    .ct-text {
        color: #f3f4f6;
        font-size: 0.8rem;
        line-height: 1.5;
        margin: 0;
    }
    .ct-text strong { color: #fde68a; }
    @keyframes compressToastIn {
        from { opacity: 0; transform: translate(-50%, -8px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    /* ============== כותרת הדף ============== */
    .b-hero { text-align: center; margin-bottom: 2.5rem; }
    .b-hero-icon { font-size: 3rem; margin-bottom: 0.75rem; }
    .b-hero-title {
        font-size: 2.2rem;
        font-weight: 900;
        margin: 0 0 0.75rem;
        background: linear-gradient(to right, #fbbf24, #fde047, #fbbf24);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
    }
    .b-hero-sub {
        color: #d1d5db;
        font-size: 1.05rem;
        max-width: 42rem;
        margin: 0 auto;
        line-height: 1.6;
    }

    .b-countdown, .b-expired, .b-autosave, .b-editing {
        margin: 1.25rem auto 0;
        max-width: 42rem;
        border-radius: 1rem;
        padding: 0.9rem 1.1rem;
        text-align: right;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
    }
    .b-countdown {
        border: 2px solid rgba(245, 158, 11, 0.5);
        background: linear-gradient(135deg, rgba(120, 53, 15, 0.25), rgba(124, 45, 18, 0.15));
    }
    .b-expired {
        border: 1px solid rgba(239, 68, 68, 0.4);
        background: rgba(239, 68, 68, 0.1);
    }
    .b-editing {
        border: 2px solid rgba(56, 189, 248, 0.5);
        background: rgba(56, 189, 248, 0.1);
    }
    .b-editing-err {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.1);
    }
    .b-autosave {
        margin-top: 0.75rem;
        border: 1px solid rgba(34, 197, 94, 0.4);
        background: rgba(34, 197, 94, 0.08);
    }
    .b-cd-icon { font-size: 1.6rem; flex-shrink: 0; }
    .b-cd-title {
        font-weight: 900;
        color: #fcd34d;
        font-size: 0.95rem;
        margin: 0 0 0.25rem;
    }
    .b-cd-title.red { color: #fca5a5; }
    .b-as-title {
        font-weight: 900;
        color: #86efac;
        font-size: 0.95rem;
        margin: 0 0 0.25rem;
    }
    .b-cd-text {
        color: #e5e7eb;
        font-size: 0.82rem;
        line-height: 1.5;
        margin: 0;
    }
    .b-cd-text strong { color: #fde68a; }
    .b-reset-row {
        margin-top: 0.75rem;
        display: flex;
        justify-content: center;
    }
    .b-reset {
        background: none;
        border: none;
        color: #fbbf24;
        font-size: 0.75rem;
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
        font-family: inherit;
    }
    .b-reset:hover { color: #fcd34d; }

    /* ============== שתי עמודות + דמו קופץ ============== */
    .builder-cols {
        position: relative;
        padding-left: 186px; /* מקום לדמו (170px) + רווח - כמו בקהילה בשכונה */
    }
    .builder-steps { width: 100%; }
    .builder-demo {
        position: absolute;
        top: 0;
        left: 0;
        /* משבצת של 144px + ריפוד הכרטיס - כך הדמו ברוחב האמיתי של הטור */
        width: 170px;
        transition: top 700ms cubic-bezier(0.4, 0, 0.2, 1);
    }
    @media (max-width: 768px) {
        .builder-cols { padding-left: 0; }
        .builder-demo {
            position: static;
            width: 100%;
            /* גם בנייד התצוגה נשארת ברוחב האמיתי - משבצת רחבה יותר הייתה
               מראה שבירת שורות אחרת לגמרי ממה שיתפרסם */
            max-width: 170px;
            margin: 0 auto 1rem;
        }
    }

    /* מסגרת "מקום הדמו" מקווקוות בצד כל שלב */
    .builder-steps .step-card::before {
        content: "";
        position: absolute;
        top: 0.5rem;
        bottom: 0.5rem;
        left: -186px;
        width: 170px;
        border: 2px dashed rgba(251, 191, 36, 0.22);
        border-radius: 0.85rem;
        background: rgba(251, 191, 36, 0.025);
        pointer-events: none;
    }
    @media (max-width: 768px) {
        .builder-steps .step-card::before { display: none; }
    }

    .live-demo-card {
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 0.85rem;
        padding: 0.7rem;
    }
    .live-demo-label {
        color: #fbbf24;
        font-size: 0.78rem;
        font-weight: 800;
        text-align: center;
        margin: 0 0 0.5rem;
    }
    /* 144px בדיוק - רוחב המשבצת בטור הפרסומות (כמו בקהילה בשכונה). כשהתצוגה
       צרה או רחבה יותר הטקסט נשבר לשורות אחרות, והמפרסם רואה מודעה שאינה
       זו שתתפרסם. */
    .live-demo-frame {
        width: 144px;
        max-width: 100%;
        margin-inline: auto;
        border-radius: 0.55rem;
        overflow: hidden;
        background: #0f172a;
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
    }
    .live-demo-img-wrap {
        width: 100%;
        aspect-ratio: 144 / 450; /* פרופורציית הבאנר האמיתי בצד ימין */
    }

    /* ============== כרטיס שלב ============== */
    .step-card {
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 1.25rem;
        padding: 1.25rem 1.25rem 1.5rem;
        margin-bottom: 1.25rem;
        scroll-margin-top: 10rem;
        position: relative;
    }
    @media (min-width: 768px) {
        .step-card { padding: 1.75rem; margin-bottom: 1.75rem; }
    }

    .step-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.5rem;
        color: #e5e7eb;
        font-weight: 900;
        flex-wrap: wrap;
    }
    .step-head h2 {
        font-size: 1.125rem;
        font-weight: 900;
        line-height: 1.3;
        margin: 0;
    }
    @media (min-width: 768px) {
        .step-head h2 { font-size: 1.4rem; }
    }
    .step-num {
        width: 2rem;
        height: 2rem;
        border-radius: 999px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(circle, #fde047 0%, #f59e0b 60%, #d97706 100%);
        color: #000;
        font-weight: 900;
        font-size: 0.95rem;
        opacity: 0.85;
        flex-shrink: 0;
    }
    .step-help {
        color: #9ca3af;
        font-size: 0.875rem;
        line-height: 1.55;
        margin: 0 0 1rem;
    }
    .amber-strong { color: #fcd34d; }

    .step-nav-row {
        margin-top: 1.5rem;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
    }
    .step-nav-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.4rem;
        padding: 0.7rem 1.5rem;
        border-radius: 0.85rem;
        background: #f59e0b;
        color: #000;
        font-size: 0.95rem;
        font-weight: 800;
        line-height: 1.1;
        border: 1px solid rgba(245, 158, 11, 0.85);
        cursor: pointer;
        transition: all 0.15s;
        white-space: nowrap;
        font-family: inherit;
        box-shadow: 0 4px 14px -4px rgba(245, 158, 11, 0.5);
    }
    .step-nav-btn:hover {
        background: #fbbf24;
        box-shadow: 0 6px 18px -4px rgba(245, 158, 11, 0.6);
    }
    .step-nav-btn:active { transform: scale(0.97); }
    .step-nav-btn:disabled { opacity: 0.6; cursor: not-allowed; }

    /* חסימת שלב: הסבר במקום, על רקע כהה קריא */
    .step-block-note {
        margin-top: 0.9rem;
        padding: 0.8rem 1rem;
        border-radius: 0.85rem;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.45);
        color: #fecaca;
        font-size: 0.92rem;
        font-weight: 600;
        line-height: 1.55;
    }
    .step-block-note p { margin: 0; }
    .step-block-note p + p { margin-top: 0.35rem; }
    .step-block-note strong { color: #fff; }
    .upload-issue {
        margin-top: 0.7rem;
        padding: 0.7rem 0.9rem;
        border-radius: 0.75rem;
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.45);
        color: #fecaca;
        font-size: 0.9rem;
        font-weight: 600;
        line-height: 1.55;
    }
    .weight-pill {
        margin-top: 0.8rem;
        display: inline-block;
        padding: 0.35rem 0.85rem;
        border-radius: 999px;
        background: rgba(251, 191, 36, 0.12);
        border: 1px solid rgba(251, 191, 36, 0.35);
        color: #fde68a;
        font-size: 0.85rem;
        font-weight: 700;
    }

    /* אנימציות שלבים */
    @keyframes gentleHover {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-5px) scale(1.03); }
    }
    .tutorial-finger {
        display: inline-block;
        animation: gentleHover 2.6s ease-in-out infinite;
        font-size: 1.25rem;
        will-change: transform;
        filter: drop-shadow(0 0 5px rgba(245, 158, 11, 0.45));
    }
    @keyframes stepNumFlashAnim {
        0%, 100% { box-shadow: 0 0 0 0 rgba(251, 191, 36, 0); transform: scale(1); filter: brightness(1); }
        50% { box-shadow: 0 0 18px 6px rgba(251, 191, 36, 0.95); transform: scale(1.25); filter: brightness(1.55); }
    }
    .step-num.step-num-light {
        animation: stepNumFlashAnim 0.7s ease-in-out 1;
    }
    @keyframes stepTitleGlowAnim {
        0%, 100% { color: #e5e7eb; text-shadow: 0 0 0 rgba(251, 191, 36, 0); }
        50% { color: #fbbf24; text-shadow: 0 0 14px rgba(251, 191, 36, 0.9), 0 0 28px rgba(251, 191, 36, 0.5); }
    }
    .step-head.step-title-light h2 {
        animation: stepTitleGlowAnim 1.5s ease-in-out 1;
    }

    /* ============== קלטים ============== */
    /* תיבת הריחוף גדלה לפי התוכן ולכן אין בה גלילה פנימית שמסתירה שורות */
    textarea.text-input[rows="3"] {
        overflow-y: hidden;
        resize: none;
        min-height: 4.5rem;
    }
    .text-input {
        width: 100%;
        padding: 0.75rem 1rem;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.04);
        border: 2px solid rgba(255, 255, 255, 0.08);
        color: white;
        font-size: 0.95rem;
        font-weight: 500;
        outline: none;
        transition: all 0.15s;
        font-family: inherit;
        box-sizing: border-box;
        resize: vertical;
    }
    .text-input::placeholder { color: #6b7280; }
    .text-input:focus {
        border-color: rgba(245, 158, 11, 0.6);
        background: rgba(255, 255, 255, 0.06);
    }
    .char-count {
        font-size: 0.75rem;
        color: #6b7280;
        margin-top: 0.5rem;
        text-align: left;
    }

    .slider-block { margin-top: 1rem; }
    .slider-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.35rem;
    }
    .slider-head p {
        font-size: 0.85rem;
        font-weight: 700;
        color: #d1d5db;
        margin: 0;
    }
    .slider-reset {
        background: none;
        border: none;
        color: #9ca3af;
        font-size: 0.7rem;
        text-decoration: underline;
        cursor: pointer;
        font-family: inherit;
    }
    .slider-reset:hover { color: #fcd34d; }
    .range-input {
        width: 100%;
        accent-color: #f59e0b;
    }
    .slider-labels {
        display: flex;
        justify-content: space-between;
        font-size: 0.7rem;
        color: #6b7280;
        margin-top: 0.25rem;
    }

    /* ============== אזורי העלאה ============== */
    .step1-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }
    @media (max-width: 768px) {
        .step1-grid { grid-template-columns: 1fr; }
    }
    .tips-box {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 1rem 1.25rem;
        color: #d1d5db;
    }
    .tips-title {
        font-weight: 700;
        color: #fbbf24;
        margin: 0 0 0.75rem;
        font-size: 1rem;
    }
    .tips-box ul {
        margin: 0;
        padding: 0;
        list-style: none;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        font-size: 0.85rem;
        line-height: 1.5;
    }

    .upload-zone {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        border: 2px dashed rgba(245, 158, 11, 0.4);
        border-radius: 1rem;
        background: rgba(245, 158, 11, 0.04);
        cursor: pointer;
        transition: all 0.15s;
        overflow: hidden;
    }
    .upload-zone:hover {
        border-color: rgba(245, 158, 11, 0.7);
        background: rgba(245, 158, 11, 0.08);
    }
    /* גובה קבוע כשיש תמונה: התמונה ממוקמת אבסולוטית (adImgFit) ולא
       קובעת יותר את גובה האזור בעצמה */
    .upload-zone.has-image { border-style: solid; padding: 0; height: 280px; }
    .upload-zone img {
        width: 100%;
        height: 100%;
        min-height: 200px;
        max-height: 280px;
        object-fit: cover;
    }
    .upload-empty { text-align: center; padding: 1rem; }
    .upload-emoji { font-size: 2.25rem; margin-bottom: 0.5rem; }
    .upload-main { font-weight: 700; font-size: 1rem; color: #fff; margin: 0; }
    .upload-note { font-size: 0.75rem; color: #9ca3af; margin: 0.25rem 0 0; }
    .upload-zone.dragging {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.1);
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.18), 0 0 30px rgba(34, 197, 94, 0.25);
        transform: scale(1.01);
    }
    .hidden-input { display: none; }

    .logo-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
    }
    .logo-upload-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
    }
    .upload-zone-sm {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100px;
        height: 100px;
        flex-shrink: 0;
        border: 2px dashed rgba(245, 158, 11, 0.4);
        border-radius: 0.75rem;
        background: rgba(245, 158, 11, 0.04);
        cursor: pointer;
        overflow: hidden;
    }
    .upload-zone-sm.has-image { border-style: solid; padding: 0; }
    .upload-zone-sm img { width: 100%; height: 100%; object-fit: cover; }
    .upload-zone-sm.dragging {
        border-color: #22c55e;
        background: rgba(34, 197, 94, 0.12);
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
        transform: scale(1.04);
    }
    .upload-sm-empty { text-align: center; }
    .upload-sm-emoji { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .upload-sm-empty p {
        font-size: 0.75rem;
        font-weight: 700;
        color: #d1d5db;
        margin: 0;
    }
    .edit-crop-link {
        background: none;
        border: none;
        color: #fcd34d;
        font-size: 0.65rem;
        text-decoration: underline;
        cursor: pointer;
        font-family: inherit;
    }

    .remove-x {
        position: absolute;
        top: 0.4rem;
        left: 0.4rem;
        z-index: 5;
        width: 1.75rem;
        height: 1.75rem;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.65);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 0.85rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .remove-x:hover { background: rgba(220, 38, 38, 0.85); }

    .logo-controls {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1rem;
        align-self: center;
    }
    /* מיקום חופשי: רמז הגרירה + הקואורדינטות וכפתור החזרה לברירת המחדל */
    .logo-drag-row {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-top: 0.25rem;
    }
    .logo-drag-hint {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin: 0;
        font-size: 0.69rem;
        font-weight: 700;
        color: rgba(252, 211, 77, 0.9);
    }
    .logo-free-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.69rem;
        font-weight: 700;
        color: #9ca3af;
    }
    .logo-free-coords {
        border-radius: 0.375rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        padding: 0.125rem 0.5rem;
        font-variant-numeric: tabular-nums;
    }
    .logo-free-reset {
        border-radius: 0.375rem;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: none;
        padding: 0.125rem 0.5rem;
        color: #fcd34d;
        font: inherit;
        cursor: pointer;
        transition: color 0.15s, border-color 0.15s;
    }
    .logo-free-reset:hover {
        color: #fde68a;
        border-color: rgba(251, 191, 36, 0.6);
    }

    /* ============== טיפוגרפיית הסלוגן (שלב 5) - כמו בקהילה בשכונה ============== */
    .sub-type-panel {
        margin-top: 0.85rem;
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 0.9rem;
        background: rgba(255, 255, 255, 0.04);
        padding: 0.75rem 0.9rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        text-align: start;
    }
    .sub-type-title {
        margin: 0;
        color: rgb(253, 230, 138);
        font-weight: 900;
        font-size: 0.85rem;
    }
    .sub-type-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex-wrap: wrap;
    }
    .sub-type-label {
        color: rgb(209, 213, 219);
        font-weight: 700;
        font-size: 0.78rem;
        min-width: 6.5rem;
    }
    .sub-type-range {
        flex: 1 1 8rem;
        min-width: 7rem;
        accent-color: rgb(245, 158, 11);
    }
    .sub-type-value {
        color: white;
        font-weight: 700;
        font-size: 0.75rem;
        min-width: 2.6rem;
        text-align: center;
        font-variant-numeric: tabular-nums;
    }
    .sub-type-aligns {
        display: flex;
        gap: 0.35rem;
        flex-wrap: wrap;
        flex: 1 1 auto;
    }
    .sub-type-align-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        padding: 0.35rem 0.6rem;
        border-radius: 0.6rem;
        cursor: pointer;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        color: rgb(209, 213, 219);
        font-family: inherit;
        font-size: 0.72rem;
        font-weight: 700;
        transition: background 0.15s, border-color 0.15s, color 0.15s;
    }
    .sub-type-align-btn:hover { color: white; background: rgba(255, 255, 255, 0.1); }
    .sub-type-align-btn.is-active {
        background: rgb(245, 158, 11);
        border-color: rgb(245, 158, 11);
        color: black;
    }
    /* במסך צר נשארים האייקונים בלבד, כדי שארבע האפשרויות ייכנסו בשורה */
    @media (max-width: 480px) {
        .sub-type-align-text { display: none; }
    }
    .sub-type-reset {
        align-self: flex-start;
        background: none;
        border: none;
        cursor: pointer;
        color: rgb(252, 211, 77);
        font-family: inherit;
        font-size: 0.72rem;
        font-weight: 700;
        text-decoration: underline;
        text-underline-offset: 2px;
        padding: 0;
    }
    .control-label {
        font-size: 0.75rem;
        font-weight: 700;
        color: #9ca3af;
        margin: 0 0 0.35rem;
    }
    .seg-group {
        display: inline-flex;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
        padding: 0.25rem;
        gap: 0.15rem;
    }
    .seg-btn {
        padding: 0.3rem 0.7rem;
        border-radius: 0.4rem;
        font-size: 0.75rem;
        font-weight: 700;
        border: none;
        background: transparent;
        color: #d1d5db;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
        white-space: nowrap;
    }
    .seg-btn:hover { color: #fff; }
    .seg-btn.active {
        background: #f59e0b;
        color: #000;
    }

    /* ============== חיצי מיקום תמונה ============== */
    .crop-arrow {
        position: absolute;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 0.75rem;
        line-height: 1;
        cursor: pointer;
        z-index: 4;
        backdrop-filter: blur(4px);
        transition: all 150ms;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
    }
    .crop-arrow:hover { background: rgba(245, 158, 11, 0.85); color: black; }
    .crop-arrow.up { top: 8px; left: 50%; transform: translateX(-50%); }
    .crop-arrow.down { bottom: 8px; left: 50%; transform: translateX(-50%); }
    .crop-arrow.left { left: 8px; top: 50%; transform: translateY(-50%); }
    .crop-arrow.right { right: 8px; top: 50%; transform: translateY(-50%); }
    .crop-reset {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 0.9rem;
        line-height: 1;
        cursor: pointer;
        z-index: 4;
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        transition: all 150ms;
    }
    .crop-reset:hover { background: rgba(245, 158, 11, 0.85); color: black; }
    .crop-zoom {
        position: absolute;
        background: rgba(8,145,178,0.85);
        border: 1px solid rgba(103,232,249,0.9);
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 1.05rem;
        font-weight: 700;
        line-height: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 4;
        backdrop-filter: blur(4px);
        transition: all 150ms;
        padding: 0;
    }
    .crop-zoom:hover { background: rgba(103,232,249,0.95); color: black; }
    .crop-zoom.zoom-in { bottom: 8px; right: 8px; }
    .crop-zoom.zoom-out { bottom: 8px; left: 8px; }
    .crop-hint {
        font-size: 0.75rem;
        color: #9ca3af;
        margin-top: 0.6rem;
        text-align: center;
    }

    /* ============== מודל חיתוך עגול ============== */
    .crop-modal-bg {
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.75);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        backdrop-filter: blur(4px);
    }
    .crop-modal {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.1rem;
        max-width: 95vw;
        width: 380px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
        direction: rtl;
    }
    .crop-modal-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 0.4rem;
    }
    .crop-modal-head h3 {
        color: white;
        font-weight: 800;
        font-size: 1.05rem;
        margin: 0;
    }
    .crop-modal-x {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.1rem;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        line-height: 1;
    }
    .crop-modal-x:hover { color: white; }
    .crop-help {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.78rem;
        line-height: 1.4;
        margin: 0 0 0.7rem;
    }
    .crop-stage {
        position: relative;
        width: 100%;
        aspect-ratio: 1 / 1;
        background: #111;
        border-radius: 0.6rem;
        overflow: hidden;
        cursor: grab;
        touch-action: none;
        user-select: none;
    }
    .crop-stage:active { cursor: grabbing; }
    .crop-img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        pointer-events: none;
        user-select: none;
        -webkit-user-drag: none;
        transform-origin: center;
        will-change: transform;
    }
    .crop-circle-mask {
        position: absolute;
        inset: 0;
        border-radius: 50%;
        box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.55);
        pointer-events: none;
        border: 2px dashed rgba(255, 255, 255, 0.55);
    }
    .crop-controls {
        display: flex;
        align-items: center;
        gap: 0.65rem;
        margin: 0.85rem 0 0.6rem;
    }
    .crop-zoom-label { color: rgba(255, 255, 255, 0.85); font-size: 0.85rem; flex-shrink: 0; }
    .crop-zoom-slider { flex: 1; accent-color: #f59e0b; }
    .crop-zoom-val {
        color: rgba(255, 255, 255, 0.7);
        font-size: 0.78rem;
        min-width: 3rem;
        text-align: left;
    }
    .crop-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    .crop-btn-cancel {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.85);
        padding: 0.55rem 1rem;
        border-radius: 0.65rem;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        font-family: inherit;
    }
    .crop-btn-cancel:hover { background: rgba(255, 255, 255, 0.12); }
    .crop-btn-confirm {
        background: linear-gradient(to right, #f59e0b, #ea580c);
        border: none;
        color: black;
        padding: 0.55rem 1.25rem;
        border-radius: 0.65rem;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
        transition: transform 150ms;
    }
    .crop-btn-confirm:hover { transform: translateY(-1px); }

    /* ============== צבע הכותרת ============== */
    .title-color-rail {
        margin-inline-start: auto;
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        flex-wrap: wrap;
        justify-content: flex-end;
    }
    .title-color-label {
        font-size: 0.78rem;
        color: rgba(203, 213, 225, 0.85);
        margin-inline-end: 0.35rem;
        white-space: nowrap;
    }
    .title-color-dot {
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        border: 1.5px solid rgba(255, 255, 255, 0.25);
        cursor: pointer;
        transition: all 120ms;
        padding: 0;
    }
    .title-color-dot:hover { transform: scale(1.12); border-color: rgba(255, 255, 255, 0.6); }
    .title-color-dot.selected {
        border-color: #fbbf24;
        box-shadow: 0 0 0 1.5px rgba(251, 191, 36, 0.45);
        transform: scale(1.15);
    }
    .title-color-custom {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.25rem;
        height: 1.25rem;
        border-radius: 999px;
        background: linear-gradient(135deg, #f87171, #fbbf24, #34d399, #60a5fa, #c4b5fd);
        border: 1.5px solid rgba(255, 255, 255, 0.35);
        cursor: pointer;
        font-size: 0.65rem;
    }
    .title-color-custom input[type="color"] {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        border: 0;
        padding: 0;
    }

    /* ============== פלטת גרדיאנטים ============== */
    .color-rail {
        display: grid;
        grid-template-columns: repeat(11, 28px);
        grid-auto-rows: 28px;
        column-gap: 5px;
        row-gap: 5px;
        padding: 0.55rem;
        background: rgba(0, 0, 0, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 0.85rem;
        width: max-content;
        margin-inline: auto;
    }
    /* בנייד הרוחב נגזר מהמסך ולא ממספר עמודות קבוע — פלטה רחבה מדי
       גלשה אל מחוץ לכרטיס במסכים צרים */
    @media (max-width: 640px) {
        .color-rail {
            grid-template-columns: repeat(auto-fit, 28px);
            width: 100%;
            max-width: 100%;
            justify-content: center;
        }
    }
    .color-dot {
        width: 28px;
        height: 28px;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.16);
        cursor: pointer;
        padding: 0;
        transition: all 180ms ease;
    }
    .color-dot:hover {
        transform: scale(1.18);
        border-color: rgba(255, 255, 255, 0.7);
    }
    .color-dot.selected {
        transform: scale(1.25);
        border-color: white;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.22), 0 4px 12px rgba(0, 0, 0, 0.45);
    }

    /* ============== תצוגה מקדימה ============== */
    .preview-toggle-row {
        display: flex;
        justify-content: center;
        margin-bottom: 1rem;
    }
    .preview-frame {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
    }
    .preview-caption {
        color: #9ca3af;
        font-size: 0.8rem;
        text-align: center;
        max-width: 28rem;
        margin: 0;
    }

    .phone-screen {
        width: 280px;
        height: 540px;
        max-width: 90vw;
        background: #0b1224;
        border-radius: 2rem;
        border: 8px solid #111827;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(255, 255, 255, 0.05);
        position: relative;
        overflow: hidden;
    }
    .phone-notch {
        position: absolute;
        top: 6px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 16px;
        background: #111827;
        border-radius: 0 0 12px 12px;
        z-index: 10;
    }
    .phone-content {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
    }
    .mobile-popup {
        width: 100%;
        max-width: 240px;
        background: #0f172a;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
    }
    .popup-title-row {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        padding: 0.85rem 0.9rem;
        background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
        border-bottom: 2px solid rgba(255, 255, 255, 0.08);
    }
    .popup-title-above {
        flex: 1;
        margin: 0;
        padding: 0;
        text-align: center;
        font-weight: 900;
        font-size: 1.35rem;
        line-height: 1.15;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
    }
    .popup-logo-above {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        background: white;
        padding: 4px;
        object-fit: contain;
        flex-shrink: 0;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
    .popup-logo-above.circle { border-radius: 50%; }
    /* יחס ולא פיקסלים: גובה קבוע של 130px הראה חיתוך אחר ממה שהגולש
       מקבל בפועל במשבצת הרחבה-ונמוכה של הנייד */
    .popup-img {
        position: relative;
        aspect-ratio: 384 / 176;
    }
    .popup-img > img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
    .close-countdown {
        position: absolute;
        top: 8px;
        left: 8px;
        width: 28px;
        height: 28px;
        border-radius: 999px;
        background: rgba(0, 0, 0, 0.55);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: white;
        font-size: 12px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
    }
    .popup-body { padding: 0.85rem; }
    .popup-cta {
        display: block;
        width: 100%;
        padding: 0.55rem;
        border-radius: 0.6rem;
        color: white;
        font-weight: 700;
        font-size: 0.78rem;
        text-align: center;
        border: none;
        cursor: pointer;
        font-family: inherit;
    }

    .clean-card {
        width: 144px; /* רוחב המשבצת האמיתי בטור הפרסומות */
        border-radius: 0.6rem;
        overflow: hidden;
        background: #0f172a;
        box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6), 0 0 6px rgba(245, 158, 11, 0.35);
        animation: cleanCardPulse 2.5s ease-in-out infinite;
        cursor: pointer;
        position: relative;
        display: flex;
        flex-direction: column;
    }
    @keyframes cleanCardPulse {
        0%, 100% { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6), 0 0 6px rgba(245, 158, 11, 0.35); }
        50% { box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85), 0 0 10px rgba(245, 158, 11, 0.6); }
    }
    .clean-card-img {
        width: 100%;
        aspect-ratio: 144 / 450;
        position: relative;
    }

    /* ============== הפרסומת עצמה (משותף לדמו ולתצוגות) ============== */
    .pro-img-wrap {
        position: relative;
        overflow: hidden;
    }
    .ad-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: opacity 1500ms ease;
    }
    .pro-diag {
        position: absolute;
        inset: 0;
        clip-path: polygon(
            0 var(--diag-top-left, 88%),
            100% var(--diag-top-right, 78%),
            100% 100%,
            0 100%
        );
        opacity: 0.96;
        transition: opacity 1500ms ease, clip-path 280ms ease;
        pointer-events: none;
    }
    .pro-diag::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(125deg, transparent 30%, rgba(255, 255, 255, 0.18) 45%, transparent 60%);
        pointer-events: none;
    }
    .pro-title-top {
        position: absolute;
        left: 0;
        right: 0;
        top: 0;
        padding: 0.55rem 0.7rem 0.85rem;
        z-index: 4;
        text-align: center;
        background: linear-gradient(180deg, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.45) 55%, rgba(0, 0, 0, 0) 100%);
        transition: opacity 1500ms ease;
        pointer-events: none;
    }
    /* לוגו בפינה העליונה יושב בגובה הכותרת, ולכן הכותרת שומרת לו מקום -
       אחרת הוא מכסה את המילה האחרונה במשבצת של 144px. אותם כללים בדיוק
       בטור הפרסומות, כך שהכותרת נשברת אותו דבר בתצוגה ובאתר. */
    .pro-title-top.has-corner-logo-right { padding-right: 46px; }
    .pro-title-top.has-corner-logo-left { padding-left: 46px; }
    /* הכותרת - הערכים של קהילה בשכונה ושל הטור הימני (1.15rem) */
    .pro-title {
        color: white;
        font-weight: 900;
        font-size: 1.15rem;
        line-height: 1.15;
        margin: 0 0 0.2rem;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.7), 0 1px 2px rgba(0, 0, 0, 0.9);
        letter-spacing: -0.02em;
    }
    .pro-title-top .pro-title {
        margin: 0;
        text-align: center;
        letter-spacing: 0.005em;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.95);
    }
    .pro-title-wrap {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        padding: 0.55rem 0.7rem 1.1rem;
        z-index: 4;
        text-align: var(--sub-align, right);
        transition: opacity 1500ms ease;
    }
    .pro-title-wrap.mobile { padding: 0.65rem 0.85rem 1.25rem; }
    /* גודל/רווח/יישור מגיעים מהמשתנים של שלב 5 (אותם ש-adStyleVars מייצר
       לטור הפרסומות), עם ה-fallback הישן - בדיוק הכלל של הטור */
    .pro-sub {
        color: rgba(255, 255, 255, 0.95);
        font-weight: 600;
        font-size: var(--sub-size, 0.88rem);
        line-height: var(--sub-lh, 1.3);
        margin: 0;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
    }
    /* בנייד המשבצת רחבה יותר, ולכן הטיפוגרפיה מוגדלת ביחס קבוע לבחירת המפרסם */
    .pro-title-wrap.mobile .pro-sub { font-size: calc(var(--sub-size, 0.88rem) * 1.14); }
    /* השורה הראשונה של הסלוגן מתקצרת בעקבות האלכסון.
       logoClearance מכבה אותו (--logo-avoid-tri) כשהלוגו באותו צד */
    .pro-sub::before {
        content: "";
        display: var(--logo-avoid-tri, block);
        float: left;
        width: 28%;
        height: 1.35em;
        shape-outside: polygon(0 0, 100% 0, 0 100%);
    }
    .pro-title-wrap.mobile .pro-sub::before {
        width: 32%;
        height: 1.4em;
    }
    /* ה-float שגורם לטקסט לעקוף את הלוגו - מוצג ומוצב רק ע"י logoClearance */
    .logo-avoid {
        display: none;
    }
    .ad-logo {
        position: absolute;
        top: 6px;
        /* 36px כולל הריפוד - כמו בטור הפרסומות; עוגן ה-CTA מניח חצי לוגו = 18px */
        box-sizing: border-box;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        background: white;
        padding: 3px;
        object-fit: contain;
        z-index: 5;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
    .ad-logo-right { right: 6px; left: auto; }
    .ad-logo-left { left: 6px; right: auto; }
    .ad-logo-circle { border-radius: 50%; }
    /* הלוגו רוכב על הפינה הימנית של הרצועה האלכסונית: מרכזו על
       --diag-top-right (18px = חצי מגובה הלוגו) */
    .ad-logo-cta {
        top: auto;
        bottom: calc(100% - var(--diag-top-right, 78%) - 18px);
        right: 6px;
        left: auto;
    }
    /* מיקום חופשי - הנקודה המדויקת מגיעה מ-left/top inline שהגרירה כותבת */
    .ad-logo-free { top: auto; bottom: auto; right: auto; left: auto; }
    /* ידית גרירה: סמן יד + טבעת מקווקוות בריחוף/פוקוס. touch-action:none
       הוא מה שמאפשר לגרור באצבע במקום לגלול את הדף. */
    .ad-logo-draggable {
        cursor: grab;
        touch-action: none;
        user-select: none;
        -webkit-user-drag: none;
    }
    .ad-logo-draggable:hover {
        outline: 2px dashed rgba(251, 191, 36, 0.9);
        outline-offset: 2px;
    }
    .ad-logo-draggable:focus-visible {
        outline: 2px solid #fbbf24;
        outline-offset: 2px;
    }
    .ad-logo-dragging {
        cursor: grabbing;
        outline: 2px solid #fbbf24;
        outline-offset: 2px;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.55);
    }
    .hover-overlay {
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(4px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.75rem;
        text-align: center;
        transition: opacity 1500ms ease;
        pointer-events: none;
        z-index: 4;
    }
    .hover-logo {
        position: absolute;
        transform: translate(-50%, -50%);
        object-fit: contain;
        border-radius: 6px;
        background: white;
        padding: 3px;
        box-sizing: border-box;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
    }
    .hover-logo-ctl {
        margin-top: 0.75rem;
        padding: 0.6rem;
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(0, 0, 0, 0.2);
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }
    .hover-logo-check {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #d1d5db;
        cursor: pointer;
    }
    .hover-logo-row {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #9ca3af;
    }
    .hover-logo-row span { width: 3rem; flex-shrink: 0; }
    .hover-logo-row input { flex: 1; }
    .logo-size-ctl { align-items: center; gap: 0.25rem; }
    .logo-size-range { width: 5rem; }
    .hover-title {
        color: white;
        font-weight: 700;
        font-size: 0.95rem;
        margin: 0 0 0.4rem;
    }
    .hover-text {
        color: rgb(229, 231, 235);
        font-size: 0.7rem;
        line-height: 1.4;
        margin: 0 0 0.4rem;
        font-weight: 700;
        /* pre-line - ירידות שורה שהמפרסם הקליד בשלב 6 נשמרות בתצוגה
           המקדימה (בלי זה HTML מכווץ כל \n לרווח והמשפט נשפך לשורה אחת) */
        white-space: pre-line;
    }
    /* אותם מספרים של רצועת ה-CTA בטור הימני (p-2.5 / text-xs / leading-tight),
       כדי שטקסט ארוך יישבר שם בדיוק כמו כאן */
    .promo-cta {
        padding: 0.625rem;
        text-align: center;
    }
    .promo-cta p {
        color: white;
        font-weight: 700;
        font-size: 0.75rem;
        line-height: 1.25;
        margin: 0;
    }
    .img-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.03);
        color: #6b7280;
        font-size: 0.85rem;
        font-weight: 700;
    }

    /* ============== ממלאי מקום מקווקווים בדמו ============== */
    .placeholder-dashed {
        border: 2px dashed rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.04);
        color: rgba(255, 255, 255, 0.55);
        font-weight: 700;
        text-align: center;
        border-radius: 0.4rem;
        transition: opacity 1500ms ease;
    }
    .placeholder-img {
        position: absolute;
        inset: 6px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 0.3rem;
        font-size: 0.55rem;
    }
    .placeholder-img p { margin: 0; }
    .placeholder-icon { font-size: 1.5rem; }
    .placeholder-hint { color: rgba(251, 191, 36, 0.7); font-size: 0.5rem; }
    .placeholder-line {
        font-size: 0.5rem;
        padding: 0.25rem 0.4rem;
        line-height: 1;
        display: inline-block;
    }
    .placeholder-line.small { font-size: 0.45rem; }
    .placeholder-logo {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 28px;
        height: 28px;
        border-radius: 0.3rem;
        font-size: 0.45rem;
        line-height: 1.05;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 5;
    }
    .placeholder-logo.pos-left { left: 6px; right: auto; }
    .placeholder-logo.pos-cta {
        top: auto;
        bottom: calc(100% - var(--diag-top-right, 78%) - 14px);
        right: 6px;
    }

    /* ============== עזרה ============== */
    .help-wrap { position: relative; }
    .help-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.7rem 1.25rem;
        border-radius: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: #e5e7eb;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
        font-family: inherit;
        font-size: 0.9rem;
    }
    .help-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(251, 191, 36, 0.5);
        color: #fcd34d;
    }

    .help-backdrop {
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        backdrop-filter: blur(4px);
    }
    .help-modal {
        background: #0f172a;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1.25rem;
        max-width: 95vw;
        width: 440px;
        box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
    }
    .help-modal-head {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 0.5rem;
    }
    .help-modal-icon { font-size: 1.35rem; }
    .help-modal-head h2 {
        color: #fff;
        font-weight: 900;
        font-size: 1.1rem;
        margin: 0;
        flex: 1;
    }
    .help-close {
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        font-size: 1.35rem;
        cursor: pointer;
        line-height: 1;
        padding: 0.15rem 0.4rem;
    }
    .help-close:hover { color: #fff; }
    .help-intro {
        color: #9ca3af;
        font-size: 0.85rem;
        line-height: 1.5;
        margin: 0 0 1rem;
    }
    .help-field { display: block; margin-bottom: 0.9rem; }
    .help-label {
        display: block;
        color: #d1d5db;
        font-weight: 700;
        font-size: 0.85rem;
        margin-bottom: 0.35rem;
    }
    .help-required { color: #f87171; }
    .help-textarea, .help-input {
        width: 100%;
        padding: 0.65rem 0.85rem;
        border-radius: 0.6rem;
        background: rgba(255, 255, 255, 0.04);
        border: 2px solid rgba(255, 255, 255, 0.08);
        color: white;
        font-size: 0.9rem;
        outline: none;
        font-family: inherit;
        box-sizing: border-box;
        resize: vertical;
    }
    .help-textarea:focus, .help-input:focus {
        border-color: rgba(245, 158, 11, 0.6);
    }
    .help-counter {
        display: block;
        font-size: 0.7rem;
        color: #6b7280;
        margin-top: 0.25rem;
        text-align: left;
    }
    .help-identity {
        color: #d1d5db;
        font-size: 0.85rem;
        margin: 0 0 0.9rem;
    }
    .help-error {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        color: #fca5a5;
        border-radius: 0.5rem;
        padding: 0.5rem 0.75rem;
        font-size: 0.85rem;
        font-weight: 700;
        margin-bottom: 0.9rem;
    }
    .help-actions {
        display: flex;
        gap: 0.5rem;
        justify-content: flex-end;
    }
    .help-btn-secondary {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: rgba(255, 255, 255, 0.85);
        padding: 0.55rem 1rem;
        border-radius: 0.65rem;
        font-weight: 700;
        font-size: 0.85rem;
        cursor: pointer;
        font-family: inherit;
    }
    .help-btn-secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .help-btn-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        background: #16a34a;
        border: none;
        color: #fff;
        padding: 0.55rem 1.25rem;
        border-radius: 0.65rem;
        font-weight: 800;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s;
    }
    .help-btn-primary:hover { background: #22c55e; }

    /* ============== תג אדמין ============== */
    .admin-badge {
        position: fixed;
        top: 4rem;
        left: 50%;
        transform: translateX(-50%);
        z-index: 200;
        border-radius: 0.75rem;
        border: 1px solid rgba(168, 85, 247, 0.5);
        background: rgba(17, 24, 39, 0.95);
        padding: 0.4rem 1rem;
        box-shadow: 0 15px 40px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(6px);
    }
    .admin-badge p {
        color: #c4b5fd;
        font-size: 0.75rem;
        font-weight: 700;
        margin: 0;
    }
</style>
