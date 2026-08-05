<script>
    import { enhance } from "$app/forms";
    import { adPlans } from "$lib/adPlans.js";
    import { adImgFit, parseAdImageFit } from "$lib/adImageFit.js";

    // מסך אישור פרסומות לאדמין - ממתינות / מאושרות / נדחות.
    let { data, form } = $props();

    /** @type {'pending' | 'approved' | 'rejected'} */
    let tab = $state("pending");

    // תקופות שאפשר לקצוב לפרסומת שכבר באתר (נספרות מיום האישור)
    const DURATION_OPTIONS = [7, 14, 30, 60, 90, 180, 365];

    let pending = $derived(data.ads.filter((/** @type {any} */ a) => a.status === "pending"));
    // המאושרות בסדר התצוגה באתר - כדי שהחצים יזיזו בדיוק את מה שהגולש רואה
    let approved = $derived(
        data.ads
            .filter((/** @type {any} */ a) => a.status === "approved")
            .sort((/** @type {any} */ a, /** @type {any} */ b) => {
                const ao = a.order ?? Number.MAX_SAFE_INTEGER;
                const bo = b.order ?? Number.MAX_SAFE_INTEGER;
                if (ao !== bo) return ao - bo;
                return Date.parse(b.submittedAt || 0) - Date.parse(a.submittedAt || 0);
            }),
    );
    // המקומות בטור נספרים רק על מי שבאמת מוצגת - מושהית לא תופסת מקום
    let liveOrder = $derived(
        approved.filter((/** @type {any} */ a) => !a.paused).map((/** @type {any} */ a) => a.id),
    );
    let rejected = $derived(data.ads.filter((/** @type {any} */ a) => a.status === "rejected"));
    let shown = $derived(tab === "pending" ? pending : tab === "approved" ? approved : rejected);

    /** @param {string} iso */
    function fmtDate(iso) {
        if (!iso) return "";
        const d = new Date(iso);
        if (isNaN(d.getTime())) return "";
        return d.toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
    }
</script>

<svelte:head>
    <title>אישור פרסומות | ניהול</title>
</svelte:head>

<div class="ads-admin" dir="rtl">
    <h1>📢 אישור פרסומות</h1>

    {#if data.backendUnavailable}
        <div class="admin-alert error">שרת התוכן אינו זמין כרגע - נסו לרענן בעוד רגע.</div>
    {/if}
    {#if form?.message}
        <div class="admin-alert ok">{form.message}</div>
    {/if}
    {#if form?.error}
        <div class="admin-alert error">{form.error}</div>
    {/if}

    <div class="tabs">
        <button type="button" class="tab-btn" class:active={tab === "pending"} onclick={() => (tab = "pending")}>
            ⏳ ממתינות ({pending.length})
        </button>
        <button type="button" class="tab-btn" class:active={tab === "approved"} onclick={() => (tab = "approved")}>
            ✅ מאושרות ({approved.length})
        </button>
        <button type="button" class="tab-btn" class:active={tab === "rejected"} onclick={() => (tab = "rejected")}>
            ❌ נדחו ({rejected.length})
        </button>
    </div>

    {#if shown.length === 0}
        <p class="empty">אין פרסומות בקטגוריה הזו.</p>
    {/if}

    <div class="ads-list">
        {#each shown as ad, adIndex (ad.id)}
            <div class="ad-card">
                <div class="ad-card-img">
                    {#if ad.mainImage}
                        <!-- אותו מיקום/זום שהמפרסם קבע - המנהל מאשר את מה שבאמת יוצג -->
                        <img src={ad.mainImage} alt={ad.title} use:adImgFit={parseAdImageFit(ad.mainImageFit)} />
                    {:else}
                        <div class="no-img">אין תמונה</div>
                    {/if}
                </div>
                <div class="ad-card-body">
                    <div class="ad-card-head">
                        <h2>{ad.title}</h2>
                        <span class="status-pill {ad.status}">
                            {ad.status === "pending" ? "ממתינה" : ad.status === "approved" ? "מאושרת" : "נדחתה"}
                        </span>
                        {#if ad.status === "approved" && ad.paused}
                            <span class="status-pill pending">⏸ מושהית — {ad.pausedDaysLeft ?? 0} ימים שמורים</span>
                        {/if}
                        {#if ad.payment === "code"}
                            <span class="status-pill approved">💳 קוד תנועה — כמו שולם</span>
                        {:else if ad.codeRequested}
                            <!-- הקוד הוא בקשה בלבד. חייב לומר במפורש שלא שולם,
                                 אחרת מאשרים פרסומת בהנחה שנכנס כסף. -->
                            <span class="status-pill pending">🎟️ ביקש חינם עם קוד — לא שולם</span>
                        {:else}
                            <span class="status-pill pending">⌛ תשלום לתיאום</span>
                        {/if}
                    </div>
                    <p class="ad-sub">{ad.subtitle}</p>
                    {#if ad.hoverText}<p class="ad-hover">ריחוף: {ad.hoverText}</p>{/if}
                    <p class="ad-meta">
                        {#if ad.submittedBy?.email}👤 {ad.submittedBy.email} · {/if}
                        📅 נשלחה: {fmtDate(ad.submittedAt)}
                        {#if ad.status === "approved" && ad.expiresAt} · ⏳ תוקף עד: {fmtDate(ad.expiresAt)}{/if}
                    </p>
                    {#if ad.landing?.phone || ad.landing?.website}
                        <p class="ad-meta">
                            {#if ad.landing.phone}📞 {ad.landing.phone}{/if}
                            {#if ad.landing.website}
                                · 🌐 <a href={ad.landing.website} target="_blank" rel="noopener noreferrer">{ad.landing.website}</a>
                            {/if}
                        </p>
                    {/if}
                    {#if ad.rejectionReason}
                        <p class="ad-reject-reason">סיבת דחייה: {ad.rejectionReason}</p>
                    {/if}

                    {#if ad.status === "approved" && tab === "approved" && !ad.paused}
                        {@const slotIndex = liveOrder.indexOf(ad.id)}
                        <!-- מקום הפרסומת בטור באתר + החלפת מקום -->
                        <div class="slot-row">
                            <span class="slot-badge">{slotIndex + 1}</span>
                            <span class="slot-label">מקום {slotIndex + 1} מתוך {liveOrder.length} בטור הפרסומות</span>
                            <form method="POST" action="?/move" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="hidden" name="dir" value="up" />
                                <button type="submit" class="a-btn ghost" disabled={slotIndex === 0} title="העלה מקום אחד">▲ למעלה</button>
                            </form>
                            <form method="POST" action="?/move" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="hidden" name="dir" value="down" />
                                <button type="submit" class="a-btn ghost" disabled={slotIndex === liveOrder.length - 1} title="הורד מקום אחד">▼ למטה</button>
                            </form>
                        </div>
                    {/if}

                    <div class="ad-actions">
                        {#if ad.status === "approved"}
                            <a href="/ads/{ad.id}" target="_blank" class="a-btn ghost">פתח את דף הנחיתה ↗</a>
                            <!-- קציבת תקופה: נספרת מיום האישור, ולכן קציבה קצרה
                                 מהזמן שכבר רץ מורידה את הפרסומת מיד -->
                            <form method="POST" action="?/setDuration" use:enhance class="approve-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <label class="duration-label">
                                    תקופה:
                                    <select name="days" class="duration-select">
                                        {#each DURATION_OPTIONS as d (d)}
                                            <option value={d} selected={d === ad.durationDays}>{d} ימים</option>
                                        {/each}
                                    </select>
                                </label>
                                <button type="submit" class="a-btn ghost" title="התקופה נספרת מיום האישור">⏱ קצוב</button>
                            </form>
                            {#if ad.paused}
                                <form method="POST" action="?/resume" use:enhance>
                                    <input type="hidden" name="id" value={ad.id} />
                                    <button type="submit" class="a-btn approve" title="הימים השמורים נספרים מהיום">▶ המשך</button>
                                </form>
                            {:else}
                                <!-- השהיה: יורדת מהאתר, הימים שנותרו נשמרים לה -->
                                <form method="POST" action="?/pause" use:enhance>
                                    <input type="hidden" name="id" value={ad.id} />
                                    <button
                                        type="submit"
                                        class="a-btn ghost"
                                        onclick={(e) => {
                                            if (!confirm("להשהות את הפרסומת? היא תרד מהאתר והימים שנותרו יישמרו לה.")) e.preventDefault();
                                        }}
                                    >
                                        ⏸ השהה
                                    </button>
                                </form>
                            {/if}
                            <!-- הורדה מהאתר בלי מחיקה: הפרסומת חוזרת לממתינות -->
                            <form method="POST" action="?/unapprove" use:enhance>
                                <input type="hidden" name="id" value={ad.id} />
                                <button
                                    type="submit"
                                    class="a-btn ghost"
                                    onclick={(e) => {
                                        if (!confirm("להוריד את הפרסומת מהאתר ולהחזיר אותה לממתינות?")) e.preventDefault();
                                    }}
                                >
                                    ⏸ הורד מהאתר
                                </button>
                            </form>
                        {/if}
                        {#if ad.status !== "approved"}
                            <form method="POST" action="?/approve" use:enhance class="approve-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <label class="duration-label">
                                    שולם עבור:
                                    <!-- ברירת המחדל = התקופה שהמפרסם בחר בשליחה -->
                                    <select name="durationDays" class="duration-select">
                                        {#each adPlans as plan (plan.days)}
                                            <option value={plan.days} selected={ad.requestedDurationDays === plan.days}>
                                                {plan.label} — {plan.price} ₪
                                            </option>
                                        {/each}
                                    </select>
                                </label>
                                <button type="submit" class="a-btn approve">✅ אשר ופרסם</button>
                            </form>
                        {/if}
                        {#if ad.status !== "rejected"}
                            <form method="POST" action="?/reject" use:enhance class="reject-form">
                                <input type="hidden" name="id" value={ad.id} />
                                <input type="text" name="reason" placeholder="סיבת דחייה (לא חובה)" class="reject-input" />
                                <button type="submit" class="a-btn reject">❌ דחה</button>
                            </form>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>
</div>

<style>
    .ads-admin {
        max-width: 56rem;
        margin: 0 auto;
        padding: 1rem 1rem 3rem;
    }
    .ads-admin h1 {
        font-size: 1.75rem;
        font-weight: 900;
        color: #fff;
        margin: 0 0 1.25rem;
        text-align: center;
    }

    .admin-alert {
        border-radius: 0.75rem;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        font-weight: 700;
        margin-bottom: 1rem;
        text-align: center;
    }
    .admin-alert.ok {
        background: rgba(34, 197, 94, 0.12);
        border: 1px solid rgba(34, 197, 94, 0.35);
        color: #86efac;
    }
    .admin-alert.error {
        background: rgba(239, 68, 68, 0.12);
        border: 1px solid rgba(239, 68, 68, 0.35);
        color: #fca5a5;
    }

    .tabs {
        display: flex;
        gap: 0.5rem;
        margin-bottom: 1.25rem;
        flex-wrap: wrap;
        justify-content: center;
    }
    .tab-btn {
        padding: 0.5rem 1.1rem;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.15);
        background: rgba(255, 255, 255, 0.05);
        color: #d1d5db;
        font-weight: 700;
        font-size: 0.9rem;
        cursor: pointer;
        font-family: inherit;
        transition: all 0.15s;
    }
    .tab-btn:hover { color: #fff; }
    .tab-btn.active {
        background: #f59e0b;
        border-color: #f59e0b;
        color: #000;
    }

    .empty {
        text-align: center;
        color: #6b7280;
        padding: 2rem 0;
    }

    .ads-list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .ad-card {
        display: flex;
        gap: 1rem;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1rem;
        padding: 1rem;
    }
    @media (max-width: 640px) {
        .ad-card { flex-direction: column; }
    }
    .ad-card-img {
        width: 120px;
        flex-shrink: 0;
        border-radius: 0.6rem;
        overflow: hidden;
        background: rgba(0, 0, 0, 0.3);
        /* עוגן לתמונה הממוקמת אבסולוטית ע"י adImgFit + גובה שלא יקרוס */
        position: relative;
        min-height: 160px;
    }
    @media (max-width: 640px) {
        .ad-card-img { width: 100%; height: 180px; max-height: 180px; }
    }
    .ad-card-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }
    .no-img {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 100px;
        color: #6b7280;
        font-size: 0.75rem;
    }
    .ad-card-body {
        flex: 1;
        min-width: 0;
    }
    .ad-card-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
        flex-wrap: wrap;
    }
    .ad-card-head h2 {
        font-size: 1.1rem;
        font-weight: 900;
        color: #fff;
        margin: 0;
    }
    .status-pill {
        font-size: 0.7rem;
        font-weight: 900;
        padding: 0.15rem 0.6rem;
        border-radius: 999px;
    }
    .status-pill.pending {
        background: rgba(245, 158, 11, 0.15);
        border: 1px solid rgba(245, 158, 11, 0.4);
        color: #fcd34d;
    }
    .status-pill.approved {
        background: rgba(34, 197, 94, 0.15);
        border: 1px solid rgba(34, 197, 94, 0.4);
        color: #86efac;
    }
    .status-pill.rejected {
        background: rgba(239, 68, 68, 0.15);
        border: 1px solid rgba(239, 68, 68, 0.4);
        color: #fca5a5;
    }
    .ad-sub {
        color: #d1d5db;
        font-size: 0.9rem;
        margin: 0 0 0.35rem;
    }
    .ad-hover {
        color: #9ca3af;
        font-size: 0.8rem;
        margin: 0 0 0.35rem;
    }
    .ad-meta {
        color: #6b7280;
        font-size: 0.75rem;
        margin: 0 0 0.25rem;
    }
    .ad-meta a { color: #93c5fd; }
    .ad-reject-reason {
        color: #fca5a5;
        font-size: 0.8rem;
        font-weight: 700;
        margin: 0.25rem 0;
    }

    .ad-actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
    }
    /* שורת המקום בטור + חצי החלפת מקום */
    .slot-row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: 0.75rem;
        padding-top: 0.6rem;
        border-top: 1px solid rgba(255, 255, 255, 0.12);
    }
    .slot-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 1.6rem;
        height: 1.6rem;
        border-radius: 0.5rem;
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.45);
        color: #a7f3d0;
        font-weight: 900;
        font-size: 0.8rem;
    }
    .slot-label {
        font-size: 0.75rem;
        font-weight: 700;
        opacity: 0.75;
        margin-inline-end: auto;
    }
    .a-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
    }
    .a-btn {
        padding: 0.45rem 1rem;
        border-radius: 0.6rem;
        border: none;
        font-weight: 800;
        font-size: 0.8rem;
        cursor: pointer;
        font-family: inherit;
        text-decoration: none;
        transition: all 0.15s;
        display: inline-flex;
        align-items: center;
    }
    .a-btn.approve { background: #16a34a; color: #fff; }
    .a-btn.approve:hover { background: #22c55e; }
    .a-btn.reject { background: rgba(239, 68, 68, 0.85); color: #fff; }
    .a-btn.reject:hover { background: #ef4444; }
    .a-btn.ghost {
        background: rgba(255, 255, 255, 0.08);
        color: #d1d5db;
        border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .a-btn.ghost:hover { color: #fff; }
    .approve-form,
    .reject-form {
        display: flex;
        gap: 0.4rem;
        align-items: center;
        flex-wrap: wrap;
    }
    .duration-label {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-size: 0.75rem;
        color: #9ca3af;
        font-weight: 700;
    }
    .duration-select {
        padding: 0.4rem 0.5rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: #fff;
        font-size: 0.75rem;
        font-weight: 700;
        font-family: inherit;
        cursor: pointer;
    }
    .reject-input {
        padding: 0.4rem 0.7rem;
        border-radius: 0.5rem;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.12);
        color: #fff;
        font-size: 0.75rem;
        outline: none;
        font-family: inherit;
        width: 170px;
    }
    .reject-input:focus { border-color: rgba(239, 68, 68, 0.5); }
</style>
