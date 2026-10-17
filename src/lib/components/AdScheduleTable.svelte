<script>
    // טבלת "תזמון פרסומות" - אותה טבלה כמו ב-/admin/ads של הגמ"ח הארצי:
    // מקום + העבר, פרסומת ומפרסם, פורסם/פג וכמה נותר, וכל הניהול מהשורה.
    // משותפת למסך הניהול (/admin/ads) ול"הפרסומות שלי" באזור האישי.
    // הפעולות עצמן הן של /admin/ads: מהאזור האישי action="/admin/ads",
    // ושם onresult מציג את ההודעה (SvelteKit לא מעדכן את form של דף אחר).
    import { enhance } from "$app/forms";
    import { AD_SLOT_COUNT } from "$lib/adSlots.js";

    /**
     * @type {{
     *   schedules: any[],
     *   approved: any[],
     *   superAdmin?: boolean,
     *   action?: string,
     *   onresult?: (result: any) => void,
     *   onduration?: (id: string) => void,
     *   onhover?: (e: MouseEvent, id: string) => void,
     *   onleave?: () => void,
     *   onopen?: (id: string) => void,
     *   extra?: import('svelte').Snippet<[any]>,
     * }}
     */
    let {
        schedules,
        approved,
        superAdmin = false,
        action = "",
        onresult,
        onduration,
        onhover,
        onleave,
        onopen,
        extra,
    } = $props();

    // 16 המקומות הממוספרים בטור הפרסומות - בורר המקום בטבלה
    const SLOT_NUMBERS = Array.from({ length: AD_SLOT_COUNT }, (_, i) => i + 1);

    /** כל שליחה מהטבלה: ההודעה למי שביקש אותה, ואז הרענון הרגיל */
    function submit() {
        return async (/** @type {{ result: any, update: () => Promise<void> }} */ { result, update }) => {
            onresult?.(result);
            await update();
        };
    }

    // טבלת התזמון מסודרת לפי תאריך הפרסום - החדשות בראש
    let schedulesByDate = $derived(
        [...schedules].sort(
            (/** @type {any} */ a, /** @type {any} */ b) =>
                (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0),
        ),
    );

    // מי תופסת כל מקום בטור - גם מושהית/פגה שומרת את המקום שלה.
    // extra = שכפל פרסומת: המקום תפוס בעותק נוסף של פרסומת שמקומה הראשי אחר
    let slotOccupants = $derived.by(() => {
        /** @type {Map<number, {id: string, title: string, extra?: boolean}>} */
        const m = new Map();
        for (const a of approved) {
            if (typeof a.slot === "number") m.set(a.slot, { id: a.id, title: a.title });
        }
        for (const a of approved) {
            for (const n of a.extraSlots ?? []) {
                if (!m.has(n)) m.set(n, { id: a.id, title: a.title, extra: true });
            }
        }
        return m;
    });
    /** שכפל פרסומת - המקומות הפנויים: קודם אלה שבאותו גובה בטור (שם הפרסומת
     *  נשארת קבועה בסבב), אחריהם כל השאר
     * @param {{slot?: number}} s */
    function dupOptions(s) {
        const free = SLOT_NUMBERS.filter((n) => !slotOccupants.has(n));
        const pos = typeof s.slot === "number" ? (s.slot - 1) % 4 : -1;
        const same = free.filter((n) => (n - 1) % 4 === pos);
        return { same, rest: free.filter((n) => !same.includes(n)) };
    }
    /** @param {string} t */
    function shortTitle(t) {
        return t.length > 22 ? t.slice(0, 21) + "…" : t;
    }
    // רביעייה = המקומות שמתחלפים באותה משבצת בטור: א׳ = 1,5,9,13 (העליונה),
    // ב׳ = 2,6,10,14, ג׳ = 3,7,11,15, ד׳ = 4,8,12,16 (התחתונה). הטור עצמו מציג
    // 1-4 יחד, אחריהם 5-8 וכו׳ - אחד מכל רביעייה בכל רגע.
    // צבע ואות לכל רביעייה (רקע בהיר בלבד - כהה נשבר בהדגשת המערכת)
    const GROUP_LETTERS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח"];
    const POS_NAMES = ["עליונה", "שנייה", "שלישית", "תחתונה"];
    /** @param {number} n */
    function slotGroup(n) {
        return ((n - 1) % 4) + 1;
    }
    /** @param {number} n */
    function slotGroupLetter(n) {
        return GROUP_LETTERS[slotGroup(n) - 1] ?? String(slotGroup(n));
    }
    /** @param {number} n */
    function slotPosName(n) {
        return POS_NAMES[(n - 1) % 4];
    }
    /** @param {number} n */
    function slotOptionBg(n) {
        const g = slotGroup(n) % 4;
        if (g === 1) return "#dbeafe";
        if (g === 2) return "#dcfce7";
        if (g === 3) return "#fef9c3";
        return "#f3e8ff";
    }
    /** אפשרויות הבורר מקובצות לרביעיות - כל קבוצה מקבלת כותרת optgroup משלה
     * @param {number[]} options */
    function groupSlotOptions(options) {
        /** @type {Map<number, number[]>} */
        const byGroup = new Map();
        for (const n of options) {
            const g = slotGroup(n);
            byGroup.set(g, [...(byGroup.get(g) ?? []), n]);
        }
        return [...byGroup.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([g, nums]) => ({ letter: GROUP_LETTERS[g - 1] ?? String(g), nums }));
    }
    /** תווית אפשרות בבורר המקום: מספר + מיקום ברביעייה; מקום תפוס מסומן עם שם הפרסומת שיושבת בו
     * @param {number} n @param {string} selfId */
    function slotOptionLabel(n, selfId) {
        const base = `${n} · ${slotPosName(n)}`;
        const occ = slotOccupants.get(n);
        if (!occ) return `${base} — פנוי`;
        if (occ.id === selfId) return occ.extra ? `${base} — שכפול שלה` : `${base} — המקום הנוכחי`;
        return `${base} ⚠ ${occ.extra ? "שכפול: " : ""}${shortTitle(occ.title)}`;
    }
    // אזהרה חיה מתחת לבורר ברגע שנבחר מקום תפוס (לפי מזהה השורה)
    /** @type {Record<string, string>} */
    let slotWarning = $state({});
    /** @param {Event} e @param {{id: string}} self */
    function onSlotPick(e, self) {
        const n = Number(/** @type {HTMLSelectElement} */ (e.currentTarget).value);
        const occ = slotOccupants.get(n);
        slotWarning = {
            ...slotWarning,
            [self.id]: !occ || occ.id === self.id
                ? ""
                : occ.extra
                    ? `מקום ${n} הוא שכפול של "${shortTitle(occ.title)}" — לחיצה על "העבר" תבטל את השכפול הזה`
                    : `מקום ${n} תפוס ע"י "${shortTitle(occ.title)}" — לחיצה על "העבר" תחליף ביניהן`,
        };
    }
    /** אישור אחרון לפני העברה למקום תפוס - אישור = החלפה, ביטול = כלום לא זז
     * @param {MouseEvent} e @param {{id: string, title: string, slot?: number}} self */
    function confirmSlotMove(e, self) {
        const formEl = /** @type {HTMLButtonElement} */ (e.currentTarget).form;
        const sel = formEl?.elements.namedItem("slot");
        const n = Number(/** @type {HTMLSelectElement | null} */ (sel)?.value);
        const occ = slotOccupants.get(n);
        if (!occ || occ.id === self.id) return;
        const ok = confirm(
            occ.extra
                ? `⚠ מקום ${n} הוא שכפול של "${occ.title}".\n\n` +
                  `אישור - "${self.title}" תעבור למקום ${n}, והשכפול של "${occ.title}" שם יבוטל (המקום הראשי שלה לא זז).\n` +
                  `ביטול - ההעברה מתבטלת.`
                : `⚠ מקום ${n} כבר תפוס על ידי "${occ.title}".\n\n` +
                  `אישור - החלפה: "${self.title}" תעבור למקום ${n}, ו"${occ.title}" תעבור למקום ${self.slot ?? "-"}.\n` +
                  `ביטול - ההעברה מתבטלת ושתי הפרסומות נשארות במקומן.`,
        );
        if (!ok) e.preventDefault();
    }

    // תאריך ושעה בשתי שורות נפרדות בטבלת התזמון - חוסך רוחב כדי שכל
    // הטבלה תיכנס ברוחב המסך בלי גלילה אופקית
    /** @param {string} [s] */
    function fmtDay(s) {
        if (!s) return "";
        return new Date(s).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "2-digit" });
    }
    /** @param {string} [s] */
    function fmtTime(s) {
        if (!s) return "";
        return new Date(s).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    }
</script>

<div class="sched-wrap">
    <table class="sched-table" dir="rtl">
        <thead>
            <!-- 4 עמודות בלבד - המידע מוערם בכמה שורות בכל תא, כדי שבדסקטופ
                 הכל ייכנס למסך אחד בלי גלילה אופקית -->
            <tr>
                <th>מקום</th>
                <th>פרסומת ומפרסם</th>
                <th>תקופה</th>
                <th>ניהול</th>
            </tr>
        </thead>
        <tbody>
            {#each schedulesByDate as s (s.id)}
                {@const tone = s.state === "paused" ? "blue" : s.state === "expired" ? "red" : s.state === "ending" ? "amber" : "emerald"}
                {@const stateLabel = s.state === "paused" ? "מושהית"
                    : s.state === "expired" ? "פגה"
                    : s.state === "ending" ? "פגה בקרוב"
                    : "פעילה"}
                {@const daysTone = s.state === "paused" ? "blue"
                    : s.daysLeft < 0 ? "red"
                    : s.daysLeft <= 7 ? "amber"
                    : "emerald"}
                {@const progress = s.durationDays > 0
                    ? Math.min(100, Math.max(0, ((s.durationDays - Math.max(0, s.daysLeft)) / s.durationDays) * 100))
                    : 100}
                <!-- מקום מעל 16 (גלישה) מתווסף לבורר כדי שלא ייעלם -->
                {@const slotOptions = s.slot && !SLOT_NUMBERS.includes(s.slot)
                    ? [...SLOT_NUMBERS, s.slot].sort((/** @type {number} */ a, /** @type {number} */ b) => a - b)
                    : SLOT_NUMBERS}
                <tr>
                    <!-- מספר המקום בטור + העברה ישירה למקום אחר (מקום תפוס - מתחלפות).
                         פריסה אנכית צרה - כדי שכל הטבלה תיכנס ברוחב המסך בלי גלילה -->
                    <td>
                        <form method="POST" action="{action}?/setSlot" use:enhance={submit} class="sch-slot">
                            <input type="hidden" name="id" value={s.id} />
                            <div class="sch-slot-row">
                                <span class="sch-slot-badge"
                                      style="background:{typeof s.slot === 'number' ? slotOptionBg(s.slot) : '#fff'}"
                                      title={typeof s.slot === "number" ? `רביעייה ${slotGroupLetter(s.slot)}׳ · המשבצת ה${slotPosName(s.slot)} בטור` : ""}>
                                    {typeof s.slot === "number" ? `${s.slot} · ${slotGroupLetter(s.slot)}׳` : "-"}
                                </span>
                                <select name="slot" class="sch-select" onchange={(e) => onSlotPick(e, s)}>
                                    <!-- כל רביעייה תחת כותרת משלה - הקשר מספר↔רביעייה קריא במילים,
                                         לא רק בצבע; מקום תפוס שומר את צבע הרביעייה ומסומן באדום מודגש -->
                                    {#each groupSlotOptions(slotOptions) as grp (grp.letter)}
                                        <optgroup label="— רביעייה {grp.letter}׳ · המשבצת ה{slotPosName(grp.nums[0])} בטור —">
                                            {#each grp.nums as n (n)}
                                                {@const occ = slotOccupants.get(n)}
                                                {@const takenByOther = !!occ && occ.id !== s.id}
                                                <option value={n} selected={n === s.slot}
                                                        style="background:{slotOptionBg(n)};color:{takenByOther ? '#b91c1c' : '#111'};font-weight:{takenByOther ? '700' : '400'}">
                                                    {slotOptionLabel(n, s.id)}
                                                </option>
                                            {/each}
                                        </optgroup>
                                    {/each}
                                </select>
                            </div>
                            <button type="submit" class="sch-btn purple"
                                    onclick={(e) => confirmSlotMove(e, s)}
                                    title="העבר למקום שנבחר; מקום תפוס - תתבקש לאשר החלפה בין השתיים">
                                ⇄ העבר
                            </button>
                            {#if slotWarning[s.id]}
                                <span class="sch-warning">⚠ {slotWarning[s.id]}</span>
                            {/if}
                        </form>
                    </td>
                    <!-- פרסומת + מפרסם + סטטוס בתא אחד, מוערמים.
                         ריחוף על הכותרת = תצוגה מקדימה צפה; הקשה = מודאל עם הכרטיס עצמו.
                         בלי onopen - הכותרת פותחת את דף הנחיתה -->
                    <td>
                        {#if onopen}
                            <button type="button" class="sch-title"
                                    onmouseenter={(e) => onhover?.(e, s.id)}
                                    onmouseleave={() => onleave?.()}
                                    onclick={() => onopen(s.id)}
                                    title="תצוגה מקדימה של הפרסומת כפי שהיא מוצגת באתר">
                                {s.title}
                            </button>
                        {:else}
                            <a class="sch-title" href="/ads/{s.id}" target="_blank" rel="noopener" title="דף הנחיתה באתר">{s.title}</a>
                        {/if}
                        <div class="sch-adv">{s.advertiserName || "-"}</div>
                        <div class="sch-email">{s.advertiserEmail}</div>
                        <span class="sch-state tone-{tone}">{stateLabel}</span>
                    </td>
                    <!-- כל נתוני הזמן בתא אחד: פורסם, פג, וכמה נותר מתוך המשך -->
                    <td class="sch-period">
                        <div>פורסם: {fmtDay(s.publishedAt)} <span class="sch-time">{fmtTime(s.publishedAt)}</span></div>
                        <div>פג: {fmtDay(s.expiresAt)} <span class="sch-time">{fmtTime(s.expiresAt)}</span></div>
                        <div class="sch-days tone-{daysTone}">
                            {s.daysLeft < 0 ? `${-s.daysLeft}- ימים` : `${s.daysLeft} ימים`}
                            <span class="sch-of">מתוך {s.durationDays}</span>
                        </div>
                        <div class="sch-bar">
                            <div class="sch-bar-fill tone-{tone === 'blue' ? 'emerald' : tone}" style="width: {progress}%"></div>
                        </div>
                    </td>
                    <!-- ניהול הפרסומת ישירות מהשורה: קציבת תקופה, השהיה, הורדה, מחיקה.
                         רוחב מוגבל - הכפתורים נערמים בשתי שורות במקום להרחיב את הטבלה -->
                    <td>
                        <div class="sch-actions">
                            <!-- פותח את חלון הקציבה: פרטי תשלום ותאריכים + שינוי תקופה/תפוגה.
                                 שמור לסופר-אדמין (כמו המחיקה) - אדמין רגיל לא רואה את הכפתור -->
                            {#if superAdmin && onduration}
                                <button type="button" class="sch-btn blue"
                                        onclick={() => onduration(s.id)}
                                        title="פרטי התקופה והתשלום + שינוי תקופה או תאריך תפוגה">
                                    ⏱ קצוב
                                </button>
                            {/if}

                            {#if s.state === "paused"}
                                <form method="POST" action="{action}?/resume" use:enhance={submit}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <button type="submit" class="sch-btn emerald" title="הימים השמורים נספרים מהיום">
                                        ▶ המשך
                                    </button>
                                </form>
                            {:else}
                                <form method="POST" action="{action}?/pause" use:enhance={submit}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <button type="submit" class="sch-btn white"
                                            title="יורדת מהאתר ושומרת את הימים שנותרו"
                                            onclick={(e) => { if (!confirm("להשהות את הפרסומת? היא תרד מהאתר והימים שנותרו יישמרו לה.")) e.preventDefault(); }}>
                                        ⏸ השהה
                                    </button>
                                </form>
                            {/if}

                            <form method="POST" action="{action}?/unapprove" use:enhance={submit}>
                                <input type="hidden" name="id" value={s.id} />
                                <button type="submit" class="sch-btn amber"
                                        title="חוזרת לתור האישורים"
                                        onclick={(e) => { if (!confirm("להוריד את הפרסומת מהאתר ולהחזיר אותה לממתינות?")) e.preventDefault(); }}>
                                    ⤴ הורד
                                </button>
                            </form>

                            {#if superAdmin}
                                <form method="POST" action="{action}?/remove" use:enhance={submit}>
                                    <input type="hidden" name="id" value={s.id} />
                                    <button type="submit" class="sch-btn red"
                                            onclick={(e) => { if (!confirm(`למחוק לצמיתות את "${s.title}"?`)) e.preventDefault(); }}>
                                        🗑 מחק
                                    </button>
                                </form>
                            {/if}
                            <!-- שכפל פרסומת (סופר-אדמין): אותה פרסומת גם במקומות נוספים - למשל
                                 2 ו-6, כך שהיא נשארת באותו גובה ולא מתחלפת בסבב.
                                 תג ⧉ = שכפול קיים; לחיצה עליו מבטלת אותו -->
                            {#if superAdmin}
                                {@const dup = dupOptions(s)}
                                <div style="display: contents">
                                    {#each s.extraSlots ?? [] as n (n)}
                                        <form method="POST" action="{action}?/removeExtraSlot" use:enhance={submit}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <input type="hidden" name="slot" value={n} />
                                            <button type="submit" class="sch-dup-chip"
                                                    style="background:{slotOptionBg(n)}"
                                                    title="שכפול במקום {n} (המשבצת ה{slotPosName(n)} בטור) - לחיצה מבטלת את השכפול">
                                                ⧉ {n} · {slotGroupLetter(n)}׳ <span class="x">✕</span>
                                            </button>
                                        </form>
                                    {/each}
                                    {#if dup.same.length + dup.rest.length > 0}
                                        <form method="POST" action="{action}?/addExtraSlot" use:enhance={submit}>
                                            <input type="hidden" name="id" value={s.id} />
                                            <select name="slot" aria-label="שכפל פרסומת" class="sch-dup-select"
                                                    onchange={(e) => e.currentTarget.form?.requestSubmit()}>
                                                <option value="" selected disabled>⧉ שכפל פרסומת</option>
                                                {#if dup.same.length > 1}
                                                    <option value="same" style="background:#fff;color:#111;font-weight:700">
                                                        ★ קבועה בכל הסבב ({dup.same.join(", ")})
                                                    </option>
                                                {/if}
                                                {#if dup.same.length > 0}
                                                    <optgroup label="★ אותו גובה בטור">
                                                        {#each dup.same as n (n)}
                                                            <option value={n} style="background:{slotOptionBg(n)};color:#111">{n} · {slotPosName(n)}</option>
                                                        {/each}
                                                    </optgroup>
                                                {/if}
                                                <optgroup label="מקומות פנויים אחרים">
                                                    {#each dup.rest as n (n)}
                                                        <option value={n} style="background:{slotOptionBg(n)};color:#111">{n} · {slotPosName(n)}</option>
                                                    {/each}
                                                </optgroup>
                                            </select>
                                        </form>
                                    {/if}
                                </div>
                            {/if}
                            <!-- כפתורים נוספים של הדף המארח (באזור האישי: צפה / ערוך) -->
                            {@render extra?.(s)}
                        </div>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</div>

<style>
    .sched-wrap {
        overflow-x: auto; border-radius: 1rem;
        border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05);
    }
    .sched-table { width: 100%; font-size: 0.875rem; border-collapse: collapse; }
    .sched-table thead { background: rgba(255, 255, 255, 0.05); }
    .sched-table th {
        text-align: right; font-weight: 700; padding: 0.625rem 0.5rem;
        font-size: 0.75rem; color: #9ca3af; letter-spacing: 0.025em;
    }
    .sched-table td { padding: 0.5rem; vertical-align: middle; }
    .sched-table tbody tr { border-top: 1px solid rgba(255, 255, 255, 0.1); }
    .sched-table tbody tr:hover { background: rgba(255, 255, 255, 0.05); }

    .sch-slot { display: flex; flex-direction: column; align-items: flex-start; gap: 0.25rem; }
    .sch-slot-row { display: flex; align-items: center; gap: 0.25rem; }
    .sch-slot-badge {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 1.5rem; height: 1.5rem; padding: 0 0.375rem; border-radius: 0.5rem;
        border: 1px solid rgba(0, 0, 0, 0.2); color: #111;
        font-weight: 900; font-size: 0.75rem; white-space: nowrap;
    }
    .sch-select {
        padding: 0.25rem 0.375rem; border-radius: 0.5rem;
        background: rgba(0, 0, 0, 0.4); border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff; font-size: 11px; font-family: inherit;
    }
    .sch-select:focus { outline: none; border-color: rgba(251, 191, 36, 0.5); }
    .sch-warning {
        font-size: 10px; font-weight: 700; color: #fcd34d; line-height: 1.375; max-width: 150px;
    }

    .sch-title {
        display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical;
        overflow: hidden; overflow-wrap: break-word; max-width: 160px;
        padding: 0; background: none; border: none; font-family: inherit; font-size: inherit;
        font-weight: 700; color: #fff; line-height: 1.375; text-align: right; cursor: pointer;
        text-decoration: underline dotted rgba(255, 255, 255, 0.3); text-underline-offset: 2px;
    }
    .sch-title:hover { color: #fcd34d; }
    .sch-adv, .sch-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }
    .sch-adv { font-size: 0.75rem; color: #d1d5db; margin-top: 0.125rem; }
    .sch-email { font-size: 10px; color: #6b7280; }
    .sch-state {
        display: inline-block; margin-top: 0.25rem; font-size: 11px; font-weight: 900;
        padding: 0.125rem 0.5rem; border-radius: 999px; white-space: nowrap; border: 1px solid;
    }
    .sch-state.tone-emerald { background: rgba(16, 185, 129, 0.15); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4); }
    .sch-state.tone-amber { background: rgba(245, 158, 11, 0.15); color: #fcd34d; border-color: rgba(245, 158, 11, 0.4); }
    .sch-state.tone-red { background: rgba(239, 68, 68, 0.15); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4); }
    .sch-state.tone-blue { background: rgba(59, 130, 246, 0.15); color: #93c5fd; border-color: rgba(59, 130, 246, 0.4); }

    .sch-period { font-size: 0.75rem; line-height: 1.625; white-space: nowrap; color: #d1d5db; }
    .sch-time { font-size: 10px; color: #6b7280; }
    .sch-days { font-weight: 900; margin-top: 0.125rem; }
    .sch-of { font-weight: 700; color: #6b7280; font-size: 10px; }
    .sch-bar {
        margin-top: 0.25rem; height: 0.375rem; width: 6rem; border-radius: 999px;
        background: rgba(255, 255, 255, 0.1); overflow: hidden;
    }
    .sch-bar-fill { height: 100%; }
    .sch-bar-fill.tone-emerald { background: #34d399; }
    .sch-bar-fill.tone-amber { background: #fbbf24; }
    .sch-bar-fill.tone-red { background: #f87171; }
    .tone-emerald { color: #6ee7b7; }
    .tone-amber { color: #fcd34d; }
    .tone-red { color: #fca5a5; }
    .tone-blue { color: #93c5fd; }

    .sch-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; max-width: 240px; }
    .sch-btn {
        padding: 0.25rem 0.625rem; border-radius: 0.5rem; border: 1px solid;
        font-size: 11px; font-weight: 900; font-family: inherit; white-space: nowrap; cursor: pointer;
        transition: background 0.15s;
    }
    .sch-btn.purple { background: rgba(168, 85, 247, 0.2); border-color: rgba(168, 85, 247, 0.4); color: #e9d5ff; padding: 0.25rem 0.5rem; }
    .sch-btn.purple:hover { background: rgba(168, 85, 247, 0.3); }
    .sch-btn.blue { background: rgba(59, 130, 246, 0.2); border-color: rgba(59, 130, 246, 0.4); color: #bfdbfe; }
    .sch-btn.blue:hover { background: rgba(59, 130, 246, 0.3); }
    .sch-btn.emerald { background: rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); color: #a7f3d0; }
    .sch-btn.emerald:hover { background: rgba(16, 185, 129, 0.3); }
    .sch-btn.white { background: rgba(255, 255, 255, 0.1); border-color: rgba(255, 255, 255, 0.2); color: #e5e7eb; }
    .sch-btn.white:hover { background: rgba(255, 255, 255, 0.2); }
    .sch-btn.amber { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.4); color: #fde68a; }
    .sch-btn.amber:hover { background: rgba(245, 158, 11, 0.25); }
    .sch-btn.red { background: rgba(220, 38, 38, 0.2); border-color: rgba(239, 68, 68, 0.4); color: #fca5a5; }
    .sch-btn.red:hover { background: rgba(220, 38, 38, 0.3); }
    .sch-dup-chip {
        display: inline-flex; align-items: center; gap: 0.25rem; height: 1.5rem; padding: 0 0.375rem;
        border-radius: 0.5rem; border: 1px solid rgba(0, 0, 0, 0.2); color: #111;
        font-size: 11px; font-weight: 900; font-family: inherit; white-space: nowrap; cursor: pointer;
    }
    .sch-dup-chip:hover { opacity: 0.8; }
    .sch-dup-chip .x { color: #b91c1c; }
    .sch-dup-select {
        border-radius: 0.5rem; border: 1px solid rgba(14, 165, 233, 0.4); background: rgba(14, 165, 233, 0.15);
        padding: 0.25rem 0.375rem; font-size: 11px; font-weight: 900; font-family: inherit; color: #bae6fd;
    }
    .sch-dup-select:focus { outline: none; border-color: rgba(56, 189, 248, 0.6); }
</style>
