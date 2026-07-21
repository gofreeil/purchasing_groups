<script>
    import { t } from "$lib/i18n.js";
    import { isLoggedIn } from "$lib/user.js";
    import { fade, slide } from "svelte/transition";
    import { invalidateAll } from "$app/navigation";

    // סמיילי שמשתנה רק לאחר לחיצה (לא על hover - כדי שלא יקפוץ)
    const EMOJI_BY_LEVEL = {
        1: { face: "😞", text: "מאוד לא מרוצה" },
        2: { face: "😐", text: "לא מרוצה" },
        3: { face: "🙂", text: "סביר" },
        4: { face: "😊", text: "מרוצה" },
        5: { face: "🤩", text: "מאוד מרוצה!" },
    };

    let { data } = $props();

    const whatsappLink = "https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI";

    // נתוני חיסכון/דירוג/ביקורות - קבועים בקוד (לא תלויים בעריכה ב-admin).
    // חברי פעילים מגיעים מ-Google Sheet (data.activeMembers).
    const STATS = {
        cellular: { rating: 5.0, savings: 25, annualSavings: 300, reviews: 47 },
        fuel: { rating: 4.9, savings: 15, annualSavings: 180, reviews: 21 },
    };

    // תוכן הקמפיין מגיע מ-data.campaign (ראה +page.server.js), שמקורו ב-$lib/campaigns.js בפרונט.

    // המשתמש בוחר חברה (או נשאר null אם אין חברות), ואז נותן דירוג אחד.
    let selectedCompany = $state(null);
    let rating = $state(0);
    let comments = $state("");
    let userName = $state("");
    let userCity = $state("");
    let submitted = $state(false);
    let submitError = $state("");
    let extraResponses = $state([]);
    let allResponses = $derived([...extraResponses, ...(data.responses || [])]);

    // ─── Admin ───
    let adminIsSuper = $derived(data.user?.app_role === 'super_admin');
    let adminBusy = $state({});
    let replyDraft = $state({});

    async function adminUpdate(r, fields) {
        if (!r.documentId) return;
        adminBusy = { ...adminBusy, [r.documentId]: true };
        try {
            const res = await fetch(`/api/admin/responses/${r.documentId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(fields),
            });
            if (!res.ok) throw new Error((await res.text()).slice(0, 200));
            await invalidateAll();
        } catch (e) {
            alert(`שגיאה: ${e.message}`);
        } finally {
            adminBusy = { ...adminBusy, [r.documentId]: false };
        }
    }
    const toggleFeatured = (r) => adminUpdate(r, { is_featured: !r.is_featured });
    const toggleLike = (r) => adminUpdate(r, { admin_liked: !r.admin_liked });
    const saveReply = (r) => {
        const text = (replyDraft[r.documentId] ?? r.admin_reply ?? '').trim();
        adminUpdate(r, { admin_reply: text || null }).then(() => {
            const { [r.documentId]: _, ...rest } = replyDraft;
            replyDraft = rest;
        });
    };
    let mustPickCompanyShake = $state(false); // אנימציית שייק על הגלולות אם מנסים לדרג לפני בחירה

    // רשימת חברות לדירוג. אם אין - מציגים דירוג בודד בלי בחירה.
    let ratingCompanies = $derived(
        Array.isArray(data.campaign?.rating_companies) && data.campaign.rating_companies.length > 0
            ? data.campaign.rating_companies
            : null,
    );

    // אם יש חברות - צריך לבחור אחת לפני שדירוג מופעל. אם אין - הדירוג זמין מיד.
    let canRate = $derived(ratingCompanies === null || selectedCompany !== null);
    let currentEmoji = $derived(EMOJI_BY_LEVEL[rating] ?? null);

    function selectCompany(name) {
        if (selectedCompany === name) return;
        selectedCompany = name;
        rating = 0; // איפוס כשבוחרים חברה אחרת
    }

    // ניסיון לדרג לפני בחירת חברה - חוסם, מציג רמיזה ומשפעיל אנימציה
    function tryRate(n) {
        if (ratingCompanies && !selectedCompany) {
            mustPickCompanyShake = true;
            setTimeout(() => (mustPickCompanyShake = false), 600);
            return;
        }
        rating = n;
    }
    let openFaq = $state(-1);
    let joinCtaEl = $state(null);
    let joinCtaClicked = $state(false);
    let plansTableHighlight = $state(false);
    let shareToast = $state(false);

    // תוכן/מבנה (מ-Strapi) - title/description/image/links/pageConfig
    let campaign = $derived(data.campaign?.slug ?? "");
    let campaignTitle = $derived(data.campaign?.title ?? "");
    let campaignDesc = $derived(data.campaign?.description ?? "");
    let campaignImage = $derived(data.campaign?.image_url ?? "");

    // מספרים (חברים/דירוג/חיסכון) - מהגיליון + קבועים בקוד
    let campaignStats = $derived({
        members: data.activeMembers ?? 0,
        rating: data.ratingCount > 0 ? data.averageRating : (STATS[campaign]?.rating ?? 0),
        savings: STATS[campaign]?.savings ?? 0,
        annualSavings: STATS[campaign]?.annualSavings ?? 0,
        reviews: STATS[campaign]?.reviews ?? 0,
        savingsText: STATS[campaign]?.savingsText ?? null,
        annualSavingsText: STATS[campaign]?.annualSavingsText ?? null,
    });
    let joinLink = $derived(data.campaign?.join_link ?? "");
    let joinLinkDiesel = $derived(data.campaign?.join_link_diesel ?? "");

    // pageData ממופה משדות ה-JSON שבסכמת Strapi לשמות המקוריים שמשמשים את ה-template למטה.
    // כשמוסיפים שדה חדש לטמפלייט - להוסיף את המיפוי כאן.
    let pageData = $derived.by(() => {
        const c = data.campaign;
        if (!c) return null;
        const hasAny =
            c.providers_line ||
            c.find_section ||
            c.benefits ||
            c.steps_override ||
            c.faq_override ||
            c.plans_table ||
            c.plans_table_diesel ||
            c.plans_table_note ||
            c.plans_table_diesel_note ||
            c.join_cta_subtitle;
        if (!hasAny) return null;
        return {
            providersLine: c.providers_line || null,
            findSection: c.find_section || null,
            benefits: c.benefits || null,
            stepsOverride: c.steps_override || null,
            faqOverride: c.faq_override || null,
            plansTable: c.plans_table || null,
            plansTableDiesel: c.plans_table_diesel || null,
            plansTableNote: c.plans_table_note || null,
            plansTableDieselNote: c.plans_table_diesel_note || null,
            joinCtaSubtitle: c.join_cta_subtitle || null,
        };
    });

    async function handleSubmit() {
        if (rating === 0) return;
        submitError = "";
        try {
            const res = await fetch("/api/satisfaction", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                    campaign_slug: campaign,
                    company: selectedCompany,
                    level: rating,
                    comments,
                    user_name: userName,
                    user_city: userCity,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const now = new Date().toISOString();
            extraResponses = [
                {
                    id: `optimistic-${Date.now()}`,
                    level: rating,
                    company: selectedCompany,
                    comments,
                    user_name: userName,
                    user_city: userCity,
                    submitted_at: now,
                    createdAt: now,
                },
                ...extraResponses,
            ];
            submitted = true;
            invalidateAll().then(() => { extraResponses = []; });
        } catch (err) {
            console.error("submit failed:", err);
            submitError = "השליחה נכשלה - נסה שוב בעוד מספר רגעים";
        }
    }

    function formatDate(iso) {
        try {
            const d = new Date(iso);
            const date = d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
            const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
            return `${date}, ${time}`;
        } catch { return ''; }
    }

    function mockLogin() {
        $isLoggedIn = true;
    }

    function toggleFaq(i) {
        openFaq = openFaq === i ? -1 : i;
    }

    function smoothScrollTo(targetY, duration) {
        return new Promise((resolve) => {
            const startY = window.scrollY;
            const distance = targetY - startY;
            const startTime = Date.now();
            function tick() {
                const t = Math.min((Date.now() - startTime) / duration, 1);
                const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
                window.scrollTo(0, startY + distance * eased);
                if (t < 1) setTimeout(tick, 16);
                else resolve();
            }
            tick();
        });
    }

    function getHeaderHeight() {
        return document.querySelector('.main-header')?.getBoundingClientRect().height ?? 0;
    }

    function centerInVisibleViewport(rect) {
        const headerHeight = getHeaderHeight();
        const visibleHeight = window.innerHeight - headerHeight;
        const elementCenter = rect.top + window.scrollY + rect.height / 2;
        return elementCenter - headerHeight - visibleHeight / 2;
    }

    async function handlePlansTableClick(e) {
        e.preventDefault();
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        if (isMobile) {
            const section = document.getElementById('plans-table');
            if (!section) return;
            const rect = section.getBoundingClientRect();
            const targetY = rect.top + window.scrollY - getHeaderHeight() - 12;
            await smoothScrollTo(targetY, 1500);
            const firstRow = section.querySelector('tbody tr');
            if (firstRow) {
                firstRow.classList.add('plan-row-highlight');
                await new Promise((r) => setTimeout(r, 1400));
                firstRow.classList.remove('plan-row-highlight');
            }
            return;
        }
        const target = document.getElementById('plans-table');
        if (!target) return;
        const targetY = centerInVisibleViewport(target.getBoundingClientRect());
        await smoothScrollTo(targetY, 1800);
        plansTableHighlight = true;
        await new Promise((r) => setTimeout(r, 1400));
        plansTableHighlight = false;
    }

    async function handleScrollToFormClick(e) {
        e.preventDefault();
        if (!joinLink) return;
        if (joinCtaEl) {
            const targetY = centerInVisibleViewport(joinCtaEl.getBoundingClientRect());
            await smoothScrollTo(targetY, 1600);
            joinCtaClicked = true;
            await new Promise((r) => setTimeout(r, 500));
            joinCtaClicked = false;
        }
        window.open(joinLink, "_blank", "noopener");
    }

    async function handleShareClick(e) {
        e.preventDefault();
        const url = `${window.location.origin}/`;
        const shareData = {
            title: 'רכישות קבוצתיות יוצאים לחירות',
            text: 'הצטרפו לקבוצת הרכישות שלנו והוזילו את ההוצאות החודשיות',
            url,
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                return;
            }
        } catch (err) {
            if (err && err.name === 'AbortError') return;
        }
        try {
            await navigator.clipboard.writeText(url);
        } catch {}
        shareToast = true;
        await new Promise((r) => setTimeout(r, 2200));
        shareToast = false;
    }

    async function handleStep1Click(e) {
        if (!joinLink) return;
        e.preventDefault();
        if (joinCtaEl) {
            const targetY = centerInVisibleViewport(joinCtaEl.getBoundingClientRect());
            await smoothScrollTo(targetY, 1600);
            joinCtaClicked = true;
            await new Promise((r) => setTimeout(r, 500));
            joinCtaClicked = false;
        }
        window.open(joinLink, "_blank", "noopener");
    }
</script>

<svelte:head>
    <title>{campaignTitle} | {$t.title}</title>
</svelte:head>

<div class="details-page" in:fade={{ duration: 300 }}>
    <!-- Hero + Stats unified banner -->
    <section class="hero-card">
        <div class="hero">
            <div class="hero-image">
                <img src={campaignImage} alt={campaignTitle} />
            </div>
            <div class="hero-content">
                <h1>{campaignTitle}</h1>
                <p class="hero-desc">{@html campaignDesc}</p>
                {#if pageData?.providersLine}
                    <p class="hero-desc hero-desc-providers">{pageData.providersLine}</p>
                {/if}
            </div>
        </div>

        {#if campaignStats.members > 0}
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">👥</div>
                    <div class="stat-value">{campaignStats.members}</div>
                    <div class="stat-label">{$t.details.statsMembers}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">⭐</div>
                    <div class="stat-value">{campaignStats.rating.toFixed(1)}/5</div>
                    <div class="stat-label">{$t.details.statsRating}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💰</div>
                    <div class="stat-value">{campaignStats.savingsText ?? `${campaignStats.savings.toLocaleString('he-IL')} ${$t.currency}`}</div>
                    <div class="stat-label">{$t.details.statsSavings}</div>
                    {#if campaignStats.annualSavingsText}
                        <div class="stat-sub">{campaignStats.annualSavingsText}</div>
                    {:else if campaignStats.annualSavings > 0}
                        <div class="stat-sub">{campaignStats.annualSavings.toLocaleString('he-IL')} {$t.currency} בשנה</div>
                    {/if}
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💬</div>
                    <div class="stat-value">{campaignStats.reviews}</div>
                    <div class="stat-label">{$t.details.statsReviews}</div>
                </div>
            </div>
        {/if}
    </section>

    {#if pageData?.benefits}
        <section class="section benefits-section">
            <h2>{pageData.benefits.title}</h2>
            <ul class="benefits-list">
                {#each pageData.benefits.items as benefit}
                    <li class="benefit-item">
                        <span class="benefit-icon" aria-hidden="true">{benefit.icon}</span>
                        <span class="benefit-text">{benefit.text}</span>
                    </li>
                {/each}
            </ul>
        </section>
    {/if}

    <!-- How it works -->
    <section class="section steps-section">
        <h2>{$t.details.howItWorks}</h2>
        <div class="steps">
            {#each (pageData?.stepsOverride ?? $t.details.steps) as step, i}
                {@const isPlansTableStep = i === 0 && !!pageData?.plansTable}
                {@const isScrollToFormStep = i === 1 && !!pageData && joinLink}
                {@const isShareStep = i === 2 && !!pageData}
                {@const isFormStep = i === 0 && joinLink && !isPlansTableStep}
                {@const stepHref = isPlansTableStep ? '#plans-table' : isScrollToFormStep ? '#join-cta' : isShareStep ? '/' : isFormStep ? joinLink : i === 2 ? whatsappLink : null}
                {#if stepHref}
                    <a
                        class="step step-link"
                        href={stepHref}
                        target={isFormStep || isPlansTableStep || isScrollToFormStep || isShareStep ? null : "_blank"}
                        rel={isFormStep || isPlansTableStep || isScrollToFormStep || isShareStep ? null : "noopener"}
                        onclick={isPlansTableStep ? handlePlansTableClick : isScrollToFormStep ? handleScrollToFormClick : isShareStep ? handleShareClick : isFormStep ? handleStep1Click : null}
                    >
                        <div class="step-num">{i + 1}</div>
                        <div class="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                    </a>
                {:else}
                    <div class="step">
                        <div class="step-num">{i + 1}</div>
                        <div class="step-icon">{step.icon}</div>
                        <h3>{step.title}</h3>
                        <p>{step.desc}</p>
                    </div>
                {/if}
            {/each}
        </div>
    </section>

    {#snippet faqContent()}
        <h2>{$t.details.faqTitle}</h2>
        <div class="faq-list">
            {#each (pageData?.faqOverride ?? $t.details.faq) as item, i}
                <div class="faq-item" class:open={openFaq === i}>
                    <button class="faq-q" onclick={() => toggleFaq(i)}>
                        <span>{item.q}</span>
                        <span class="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {#if openFaq === i}
                        <div class="faq-a" transition:slide={{ duration: 200 }}>
                            {@html item.a}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/snippet}

    {#if pageData?.findSection}
        <section class="section info-section">
            <div class="info-pane coverage-section">
                <h2>{pageData.findSection.title}</h2>
                {#if pageData.findSection.href}
                    <a
                        href={pageData.findSection.href}
                        target="_blank"
                        rel="noopener"
                        class="coverage-banner"
                        aria-label={pageData.findSection.ariaLabel}
                    >
                        <img src={pageData.findSection.image} alt={pageData.findSection.imageAlt} />
                        <span class="coverage-banner-label">{pageData.findSection.label}</span>
                    </a>
                {:else}
                    <div class="coverage-banner coverage-banner-static">
                        <img src={pageData.findSection.image} alt={pageData.findSection.imageAlt} />
                        {#if pageData.findSection.stationNames}
                            <span class="coverage-banner-label">{pageData.findSection.stationNames.join(' · ')}</span>
                        {:else if pageData.findSection.label}
                            <span class="coverage-banner-label">{pageData.findSection.label}</span>
                        {/if}
                    </div>
                {/if}
            </div>
            <div class="info-pane">
                {@render faqContent()}
            </div>
        </section>
    {:else}
        <section class="section">
            {@render faqContent()}
        </section>
    {/if}

    {#if pageData?.plansTable}
        <section id="plans-table" class="section plans-table-section">
            <h2>{pageData.plansTable.title}</h2>
            {#if pageData.plansTable.subtitle}
                <p class="plans-table-subtitle">{pageData.plansTable.subtitle}</p>
            {/if}
            <div class="plans-table-scroll" class:highlight={plansTableHighlight}>
                <table class="plans-table">
                    <thead>
                        <tr>
                            {#each pageData.plansTable.headers as header}
                                <th>{@html header}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each pageData.plansTable.rows as row}
                            <tr data-title={row.title} data-company={row.company}>
                                {#each row.cells as cell}
                                    <td data-label={cell.label}>
                                        {#if cell.image}
                                            <img src={cell.image.src} alt={cell.image.alt} class="plans-table-logo" />
                                        {:else if cell.html}
                                            {@html cell.html}
                                        {:else}
                                            {cell.value}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if pageData.plansTableNote}
                <p class="plans-table-note" role="note">
                    <span class="plans-table-note-icon" aria-hidden="true">⚠️</span>
                    {pageData.plansTableNote}
                </p>
            {/if}
        </section>
    {/if}

    {#if joinLink}
        <div id="join-cta" class="join-cta-wrap">
            <span class="join-cta-hand">👈</span>
            <a
                href={joinLink}
                target="_blank"
                rel="noopener"
                class="join-cta-banner"
                class:clicked={joinCtaClicked}
                bind:this={joinCtaEl}
                aria-label={$t.details.joinCta}
            >
                <div class="join-cta-content">
                    <h3>{@html pageData?.joinCtaSubtitle ?? campaignDesc}</h3>
                    <p>טופס הצטרפות</p>
                </div>
            </a>
            <span class="join-cta-hand">👉</span>
        </div>
    {/if}

    {#if pageData?.plansTableDiesel}
        <section class="section plans-table-section">
            <h2>{pageData.plansTableDiesel.title}</h2>
            {#if pageData.plansTableDiesel.subtitle}
                <p class="plans-table-subtitle">{pageData.plansTableDiesel.subtitle}</p>
            {/if}
            <div class="plans-table-scroll">
                <table class="plans-table">
                    <thead>
                        <tr>
                            {#each pageData.plansTableDiesel.headers as header}
                                <th>{@html header}</th>
                            {/each}
                        </tr>
                    </thead>
                    <tbody>
                        {#each pageData.plansTableDiesel.rows as row}
                            <tr data-title={row.title} data-company={row.company}>
                                {#each row.cells as cell}
                                    <td data-label={cell.label}>
                                        {#if cell.image}
                                            <img src={cell.image.src} alt={cell.image.alt} class="plans-table-logo" />
                                        {:else if cell.html}
                                            {@html cell.html}
                                        {:else}
                                            {cell.value}
                                        {/if}
                                    </td>
                                {/each}
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            {#if pageData.plansTableDieselNote}
                <p class="plans-table-note" role="note">
                    <span class="plans-table-note-icon" aria-hidden="true">⚠️</span>
                    {pageData.plansTableDieselNote}
                </p>
            {/if}
        </section>
    {/if}

    {#if joinLinkDiesel}
        <div class="join-cta-wrap">
            <span class="join-cta-hand">👈</span>
            <a
                href={joinLinkDiesel}
                target="_blank"
                rel="noopener"
                class="join-cta-banner"
                aria-label="טופס הצטרפות להנחה בסולר"
            >
                <div class="join-cta-content">
                    <h3>הנחה בסולר</h3>
                    <p>טופס הצטרפות</p>
                </div>
            </a>
            <span class="join-cta-hand">👉</span>
        </div>
    {/if}

    <!-- Rating only - הסקר המלא בדף /satisfaction/[campaign]/ -->
    <section class="section survey-section-wrap">
        <h2>שביעות רצון משירות החברה והמבצע</h2>

        <!-- אין דירוג בדף המבצע - רק סיכום ההצבעות, מקושר לדף הדירוגים והתגובות.
             במבצע חדש שאין בו עדיין דירוגים לא מציגים "0.0/5" אלא הזמנה לדרג ראשון. -->
        {#if campaignStats.rating > 0}
            <a
                href={`/details/${campaign}/responses`}
                class="rating-summary-cta"
                aria-label={`דירוג ${campaignStats.rating.toFixed(1)} מתוך 5 — למעבר לכל הדירוגים והתגובות`}
            >
                <div class="rating-summary-badge">
                    <span class="rating-summary-stars" aria-hidden="true">⭐⭐⭐⭐⭐</span>
                    <span class="rating-summary-val">{campaignStats.rating.toFixed(1)}/5</span>
                </div>
                <span class="rating-summary-text">לדירוגים והתגובות&nbsp;←</span>
            </a>
        {:else}
            <a
                href={`/details/${campaign}/responses`}
                class="rating-summary-cta"
                aria-label="עדיין אין דירוגים למבצע זה — למעבר לדף הדירוגים והתגובות"
            >
                <span class="rating-summary-text">עדיין אין דירוגים - היו הראשונים לדרג&nbsp;←</span>
            </a>
        {/if}

        {#if allResponses.length > 0}
            <div class="responses-list">
                <h3 class="responses-title">תגובות מובילות</h3>
                {#each allResponses as r (r.id)}
                    <div class="response-item" class:featured={r.is_featured}>
                        <div class="response-header">
                            <span class="response-stars">{'★'.repeat(r.level)}{'☆'.repeat(5 - r.level)}</span>
                            {#if r.company}
                                <span class="response-company">{r.company}</span>
                            {/if}
                            {#if r.is_featured}
                                <span class="response-pin" title="תגובה מובילה">📌</span>
                            {/if}
                            {#if r.admin_liked}
                                <span class="response-like" title="אהוב על האדמין">❤️</span>
                            {/if}
                            <span class="response-date">{formatDate(r.createdAt || r.submitted_at)}</span>
                        </div>
                        <div class="response-body">
                            {#if r.user_name || r.user_city}
                                <div class="response-user">
                                    {#if r.user_name}
                                        <span class="response-name">{r.user_name}</span>
                                    {/if}
                                    {#if r.user_city}
                                        <span class="response-city">{r.user_city}</span>
                                    {/if}
                                </div>
                            {/if}
                            {#if r.comments}
                                <p class="response-text">{r.comments}</p>
                            {/if}
                        </div>
                        {#if r.admin_reply}
                            <div class="response-admin-reply">
                                <span class="admin-reply-label">תגובת האדמין:</span>
                                <p class="admin-reply-text">{r.admin_reply}</p>
                            </div>
                        {/if}
                        {#if adminIsSuper}
                            <div class="admin-controls">
                                <button type="button" class="admin-btn" class:on={r.is_featured} disabled={adminBusy[r.documentId]} onclick={() => toggleFeatured(r)} title="פין">📌</button>
                                <button type="button" class="admin-btn" class:on={r.admin_liked} disabled={adminBusy[r.documentId]} onclick={() => toggleLike(r)} title="לייק">❤️</button>
                                {#if replyDraft[r.documentId] !== undefined || r.admin_reply}
                                    <input
                                        type="text"
                                        class="admin-reply-input"
                                        placeholder="תגובת אדמין"
                                        value={replyDraft[r.documentId] ?? r.admin_reply ?? ''}
                                        oninput={(e) => (replyDraft = { ...replyDraft, [r.documentId]: e.currentTarget.value })}
                                    />
                                    <button type="button" class="admin-btn" disabled={adminBusy[r.documentId]} onclick={() => saveReply(r)}>שמור</button>
                                {:else}
                                    <button type="button" class="admin-btn" onclick={() => (replyDraft = { ...replyDraft, [r.documentId]: '' })} title="תגובת אדמין">↩️</button>
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
                {#if (data.totalResponsesCount ?? 0) > allResponses.length}
                    <a class="responses-all-link" href={`/details/${campaign}/responses`}>
                        לכלל התגובות והדירוגים הקש כאן ←
                    </a>
                {/if}
            </div>
        {/if}
    </section>

    {#if shareToast}
        <div class="share-toast" role="status" aria-live="polite">
            ✅ הקישור הועתק - אפשר להדביק בכל מקום
        </div>
    {/if}

    <div class="bottom-nav">
        <button type="button" class="bottom-back" onclick={() => history.back()}>{$t.details.backToHome}</button>
        <button
            type="button"
            class="back-to-top"
            onclick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="חזרה לראש הדף"
        >
            <span class="arrow" aria-hidden="true">↑</span>
            <span>חזרה לראש הדף</span>
        </button>
    </div>
</div>

<style>
    .details-page {
        max-width: 1100px;
        margin: 0 auto 4rem;
        padding: 0 1.5rem;
        color: white;
    }

    .bottom-nav {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 2rem;
        gap: 1rem;
        flex-wrap: wrap;
    }

    .bottom-back {
        display: inline-block;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.3s ease;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        font-family: inherit;
    }

    .bottom-back:hover {
        color: #facc15;
    }

    .back-to-top {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: none;
        padding: 0.5rem 0.25rem;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.95rem;
        cursor: pointer;
        transition: color 0.2s ease, transform 0.2s ease;
    }

    .back-to-top:hover {
        color: #facc15;
        transform: translateY(-2px);
    }

    .back-to-top .arrow {
        font-size: 1.1rem;
        line-height: 1;
    }

    /* Unified hero + stats banner */
    .hero-card {
        background: linear-gradient(135deg, rgba(35, 45, 75, 0.88), rgba(45, 35, 65, 0.88));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(250, 204, 21, 0.18);
        border-radius: 24px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
        margin-bottom: 1.5rem;
        overflow: hidden;
    }

    /* Hero */
    .hero {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 1.8rem;
        align-items: center;
        padding: 1.5rem 1.8rem;
    }

    .hero-image {
        position: relative;
        width: 220px;
        height: 220px;
        border-radius: 20px;
        overflow: hidden;
        border: 2px solid rgba(250, 204, 21, 0.4);
    }

    .hero-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .hero-icon-badge {
        position: absolute;
        bottom: 12px;
        left: 12px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #facc15, #fb923c);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .hero-content {
        text-align: right;
    }

    .hero-badge {
        display: inline-block;
        padding: 0.4rem 1rem;
        background: rgba(250, 204, 21, 0.1);
        border: 1px solid rgba(250, 204, 21, 0.4);
        border-radius: 999px;
        font-size: 0.9rem;
        font-weight: 600;
        color: #facc15;
        margin-bottom: 1rem;
    }

    .hero-content h1 {
        font-size: 2.1rem;
        font-weight: 800;
        margin: 0 0 0.6rem;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1.2;
    }

    .hero-desc {
        font-size: 1.05rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        margin: 0 0 1rem;
    }

    .hero-cta {
        display: inline-block;
        padding: 0.7rem 1.6rem;
        font-size: 1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border-radius: 12px;
        text-decoration: none;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .hero-cta:hover {
        transform: translateY(-4px) scale(1.04);
        box-shadow: 0 12px 24px rgba(250, 204, 21, 0.35);
    }

    /* Stats - integrated as bottom strip of the hero-card */
    .stats-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0;
    }

    .stat-card {
        position: relative;
        padding: 1.1rem 1rem;
        background: transparent;
        border: none;
        text-align: center;
        transition: background 0.25s ease;
    }

    .stat-card + .stat-card::before {
        content: "";
        position: absolute;
        inset-inline-start: 0;
        top: 22%;
        bottom: 22%;
        width: 2px;
        background: rgba(255, 255, 255, 0.14);
        border-radius: 2px;
    }

    .stat-card:hover {
        background: rgba(250, 204, 21, 0.06);
    }

    .stat-icon {
        font-size: 2rem;
        margin-bottom: 0.4rem;
    }

    .stat-value {
        font-size: 1.7rem;
        font-weight: 800;
        color: #facc15;
        margin-bottom: 0.2rem;
    }

    .stat-label {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.7);
    }

    .stat-sub {
        margin-top: 0.4rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: #4ade80;
    }

    /* Sections */
    .section {
        padding: 2.5rem;
        background: linear-gradient(135deg, rgba(35, 45, 75, 0.88), rgba(45, 35, 65, 0.88));
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(250, 204, 21, 0.18);
        border-radius: 24px;
        margin-bottom: 2rem;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.35);
    }

    .section h2 {
        font-size: 1.8rem;
        font-weight: 800;
        color: #facc15;
        text-align: center;
        margin: 0 0 2rem;
    }

    /* Benefits list - בלי כרטיס נפרד לכל יתרון; במקומו קווי הפרדה דקים שנמוגים בקצוות */
    .benefits-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 0 2.5rem;
    }

    .benefit-item {
        position: relative;
        display: flex;
        align-items: flex-start;
        gap: 0.85rem;
        padding: 1.05rem 0.4rem;
    }

    /* הקו האופקי שבין השורות - לא נוגע בקצוות ונמוג בשני צדדיו */
    .benefit-item::after {
        content: '';
        position: absolute;
        left: 7%;
        right: 7%;
        bottom: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.16) 20%,
            rgba(255, 255, 255, 0.16) 80%,
            transparent
        );
    }

    .benefit-item:last-child::after {
        display: none;
    }

    .benefit-item:hover .benefit-text {
        color: #fff;
    }

    .benefit-icon {
        font-size: 1.6rem;
        line-height: 1;
        flex-shrink: 0;
    }

    .benefit-text {
        font-size: 1rem;
        line-height: 1.5;
        color: rgba(255, 255, 255, 0.92);
        margin: 0;
        transition: color 0.2s;
    }

    /* בדסקטופ - שתי עמודות עם קו אנכי במרווח שביניהן */
    @media (min-width: 820px) {
        .benefits-list {
            grid-template-columns: repeat(2, 1fr);
        }
        .benefit-item:nth-child(odd):not(:last-child)::before {
            content: '';
            position: absolute;
            inset-inline-end: -1.25rem;
            top: 14%;
            height: 72%;
            width: 1px;
            background: linear-gradient(
                180deg,
                transparent,
                rgba(255, 255, 255, 0.16),
                transparent
            );
        }
        /* בשורה האחרונה אין קו אופקי מתחת */
        .benefit-item:nth-last-child(2):nth-child(odd)::after {
            display: none;
        }
        /* מספר יתרונות אי-זוגי - מרכזים את האחרון במקום שיישאר לבד בעמודה */
        .benefit-item:last-child:nth-child(odd) {
            grid-column: 1 / -1;
            max-width: calc(50% - 1.25rem);
            margin-inline: auto;
        }
    }

    @media (max-width: 640px) {
        .benefit-item {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 0.7rem 0.5rem;
            gap: 0.25rem;
        }
        .benefit-icon {
            font-size: 1.4rem;
        }
        .benefit-text {
            font-size: 0.92rem;
            line-height: 1.35;
        }
    }

    /* Join CTA banner (form link) */
    .join-cta-wrap {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin: 0 0 1.5rem;
    }


    .join-cta-hand {
        font-size: 2.1rem;
        flex-shrink: 0;
        line-height: 1;
        animation: join-cta-hand-point 2.6s ease-in-out infinite;
    }

    .join-cta-hand:first-child {
        animation-name: join-cta-hand-point-reverse;
    }

    @keyframes join-cta-hand-point {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(-4px); }
    }

    @keyframes join-cta-hand-point-reverse {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(4px); }
    }

    .share-toast {
        position: fixed;
        bottom: 28px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 17, 40, 0.96);
        color: #facc15;
        padding: 0.85rem 1.3rem;
        border-radius: 14px;
        border: 2px solid rgba(250, 204, 21, 0.6);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 22px rgba(250, 204, 21, 0.35);
        font-weight: 700;
        font-size: 0.95rem;
        z-index: 9999;
        animation: share-toast-in 0.25s ease-out;
    }

    @keyframes share-toast-in {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to { opacity: 1; transform: translate(-50%, 0); }
    }

    .plans-table-section {
        margin-bottom: 1.5rem;
    }

    .plans-table-section h2 {
        text-align: center;
        color: #facc15;
        margin-bottom: 1rem;
    }

    .plans-table-subtitle {
        text-align: center;
        color: #ffffff;
        font-weight: 400;
        font-size: 1rem;
        margin: -0.5rem 0 1rem;
    }

    .plans-table-below {
        text-align: center;
        color: #ffffff;
        font-weight: 500;
        font-size: 1rem;
        margin: 0.85rem 0 0;
    }

    :global(.plans-table th .header-sub) {
        display: inline-block;
        font-size: 0.78em;
        font-weight: 500;
        opacity: 0.85;
    }

    :global(.plans-table td .multi-logos) {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        flex-wrap: wrap;
    }

    :global(.plans-table td .multi-logos .plans-table-logo) {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        overflow: hidden;
    }

    @media (max-width: 768px) {
        :global(.plans-table td .multi-logos) {
            gap: 0.3rem;
        }
        :global(.plans-table td .multi-logos .plans-table-logo) {
            width: 26px;
            height: 26px;
        }
    }

    .plans-table-note {
        margin: 1rem 0 0;
        padding: 0.85rem 1.1rem;
        background: rgba(220, 38, 38, 0.12);
        border: 1px solid rgba(248, 113, 113, 0.55);
        border-radius: 12px;
        color: #fecaca;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.5;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.55rem;
        box-shadow: 0 6px 18px rgba(220, 38, 38, 0.18);
    }

    .plans-table-note-icon {
        font-size: 1.25rem;
        flex-shrink: 0;
    }

    @media (max-width: 640px) {
        .plans-table-note {
            font-size: 0.88rem;
            padding: 0.75rem 0.9rem;
            text-align: right;
        }
    }

    .plans-table-scroll {
        overflow-x: auto;
        border-radius: 16px;
        border: 2px solid rgba(250, 204, 21, 0.6);
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
        background: rgba(10, 17, 40, 0.6);
        transition: border-color 0.35s ease, box-shadow 0.35s ease, transform 0.35s ease;
    }

    .plans-table-scroll.highlight {
        animation: plans-table-glow 1.4s ease;
    }

    @keyframes plans-table-glow {
        0% {
            border-color: rgba(250, 204, 21, 0.6);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
            transform: scale(1);
        }
        25% {
            border-color: #facc15;
            box-shadow: 0 0 28px 4px rgba(250, 204, 21, 0.9), 0 10px 30px rgba(0, 0, 0, 0.45);
            transform: scale(1.012);
        }
        60% {
            border-color: #facc15;
            box-shadow: 0 0 22px 2px rgba(250, 204, 21, 0.6), 0 10px 26px rgba(0, 0, 0, 0.4);
            transform: scale(1.006);
        }
        100% {
            border-color: rgba(250, 204, 21, 0.6);
            box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3);
            transform: scale(1);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .plans-table-scroll.highlight { animation: none; }
    }

    .plans-table {
        width: 100%;
        border-collapse: collapse;
        text-align: center;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1.02rem;
        table-layout: fixed;
    }

    .plans-table thead th {
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.18), rgba(251, 146, 60, 0.14));
        color: #facc15;
        font-weight: 800;
        padding: 0.85rem 0.5rem;
        border-bottom: 3px solid rgba(250, 204, 21, 0.7);
        white-space: normal;
        line-height: 1.25;
        font-size: 0.95rem;
        overflow-wrap: break-word;
    }

    .plans-table tbody td {
        padding: 0.8rem 0.5rem;
        border-bottom: 2px solid rgba(255, 255, 255, 0.12);
        overflow-wrap: break-word;
    }

    .plan-note {
        display: block;
        font-size: 0.78rem;
        color: rgba(255, 255, 255, 0.72);
        margin-top: 3px;
        line-height: 1.25;
    }

    .plans-table-logo {
        display: block;
        margin: 0 auto;
        max-width: 64px;
        max-height: 36px;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 4px;
    }

    .no-cost-icon {
        display: inline-block;
        font-size: 1.15em;
        line-height: 1;
        margin-bottom: 2px;
    }

    @media (max-width: 768px) {
        .plans-table-logo {
            max-width: 46px;
            max-height: 28px;
        }
    }

    .plans-table tbody tr:nth-child(even) {
        background: rgba(255, 255, 255, 0.03);
    }

    .plans-table tbody tr:hover {
        background: rgba(250, 204, 21, 0.08);
    }

    .plans-table tbody tr:last-child td {
        border-bottom: none;
    }

    @media (max-width: 768px) {
        .plans-table-scroll {
            overflow-x: visible;
            border: none;
            background: transparent;
            box-shadow: none;
            border-radius: 0;
        }

        .plans-table {
            display: block;
            table-layout: auto;
            font-size: 0.9rem;
        }

        .plans-table thead {
            position: absolute;
            width: 1px;
            height: 1px;
            margin: -1px;
            padding: 0;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }

        .plans-table tbody {
            display: block;
        }

        .plans-table tbody tr {
            display: block;
            position: relative;
            margin-bottom: 1rem;
            padding: 0;
            background: rgba(10, 17, 40, 0.6);
            border: 2px solid rgba(250, 204, 21, 0.6);
            border-radius: 14px;
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }

        .plans-table tbody tr.plan-row-highlight {
            animation: plan-row-glow 1.4s ease;
        }

        @keyframes plan-row-glow {
            0%, 100% {
                border-color: rgba(250, 204, 21, 0.6);
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
                transform: scale(1);
            }
            30% {
                border-color: #facc15;
                box-shadow: 0 0 24px 4px rgba(250, 204, 21, 0.9), 0 6px 16px rgba(0, 0, 0, 0.3);
                transform: scale(1.02);
            }
        }

        .plans-table tbody tr[data-title]::before {
            content: attr(data-title);
            display: block;
            background: linear-gradient(135deg, rgba(250, 204, 21, 0.22), rgba(251, 146, 60, 0.16));
            color: #facc15;
            font-weight: 800;
            font-size: 0.92rem;
            text-align: right;
            padding: 0.55rem 0.8rem 0.55rem 5rem;
            border-bottom: 2px solid rgba(250, 204, 21, 0.6);
            line-height: 1.2;
        }

        .plans-table tbody tr[data-company]::after {
            content: attr(data-company);
            position: absolute;
            top: 0.55rem;
            left: 0.8rem;
            color: rgba(255, 255, 255, 0.95);
            font-weight: 700;
            font-size: 0.9rem;
            line-height: 1.2;
        }

        .plans-table tbody td[data-label="שם התוכנית"],
        .plans-table tbody td[data-label="שם חברה"],
        .plans-table tbody td[data-label="רשת תחנות"] {
            display: none;
        }

        .plans-table tbody td[data-label="לוגו"] {
            position: absolute;
            top: 0.55rem;
            left: 0.5rem;
            display: block;
            padding: 0;
            margin: 0;
            background: transparent;
            border: none;
            z-index: 2;
        }

        /* multi-logos של סולר - לוגויים גדולים יותר (26px), מתקנים את המיקום למעלה */
        :global(.plans-table tbody td[data-label="לוגו"]:has(.multi-logos)) {
            top: 0.2rem;
        }

        .plans-table tbody td[data-label="לוגו"]::before {
            display: none;
        }

        .plans-table tbody td[data-label="לוגו"] img.plans-table-logo {
            max-height: 22px;
            max-width: 32px;
            width: auto;
            margin: 0;
        }

        .plans-table tbody tr > td:first-of-type {
            padding-top: 0.7rem;
        }

        .plans-table tbody td {
            margin: 0 0.4rem;
        }

        .plans-table tbody td br {
            display: none;
        }

        .plans-table tbody td .no-cost-icon {
            margin: 0 0 0 4px;
        }

        .plans-table tbody tr:nth-child(even) {
            background: rgba(10, 17, 40, 0.6);
        }

        .plans-table tbody tr:hover {
            background: rgba(10, 17, 40, 0.6);
        }

        .plans-table tbody tr:last-child {
            margin-bottom: 0;
        }

        .plans-table tbody tr:last-child td {
            border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
        }

        .plans-table tbody td {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
            padding: 0.55rem 0.5rem;
            border-bottom: 1px dashed rgba(255, 255, 255, 0.12);
            text-align: left;
            font-size: 0.9rem;
            white-space: normal;   /* ערכים ארוכים נשברים לשורה נוספת במקום להיחתך בקצה */
        }
        .plans-table tbody td > *,
        .plans-table tbody td {
            min-width: 0;          /* מאפשר לערך להתכווץ ולעטוף בתוך ה-flex */
        }

        .plans-table tbody tr td:last-child {
            border-bottom: none;
        }

        .plans-table tbody td::before {
            content: attr(data-label);
            color: #facc15;
            font-weight: 700;
            font-size: 0.75rem;
            text-align: right;
            flex: 0 0 auto;
            white-space: nowrap;
        }

        .plans-table tbody td > * {
            text-align: left;
        }

        .plan-note {
            font-size: 0.72rem;
            text-align: left;
        }

        .plans-table-logo {
            margin: 0;
            max-width: 56px;
            max-height: 32px;
        }
    }

    .join-cta-banner {
        flex: 1;
        display: block;
        padding: 1.4rem 1.8rem;
        background: linear-gradient(135deg, rgba(250, 204, 21, 0.12), rgba(251, 146, 60, 0.10));
        border: 4px solid #facc15;
        border-radius: 20px;
        text-decoration: none;
        color: white;
        text-align: center;
        box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3), 0 0 22px rgba(250, 204, 21, 0.45);
        transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }

    .join-cta-banner:hover {
        transform: translateY(-2px);
        border-color: #fde047;
        box-shadow: 0 14px 28px rgba(0, 0, 0, 0.38), 0 0 32px rgba(250, 204, 21, 0.65);
    }

    .join-cta-banner.clicked {
        animation: cta-press 0.5s ease;
    }

    @keyframes cta-press {
        0%   { transform: translateY(0) scale(1); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3); border-color: rgba(250, 204, 21, 0.45); }
        45%  { transform: translateY(3px) scale(0.97); box-shadow: 0 4px 10px rgba(250, 204, 21, 0.55); border-color: rgba(250, 204, 21, 1); background: linear-gradient(135deg, rgba(250, 204, 21, 0.28), rgba(251, 146, 60, 0.22)); }
        100% { transform: translateY(0) scale(1); box-shadow: 0 10px 22px rgba(0, 0, 0, 0.3); border-color: rgba(250, 204, 21, 0.45); }
    }

    .join-cta-content h3 {
        margin: 0 0 0.4rem;
        font-size: 1.45rem;
        color: #facc15;
    }

    :global(.join-cta-content h3 .cta-small) {
        font-size: 0.78em;
        font-weight: 700;
    }

    .join-cta-content p {
        margin: 0;
        color: rgba(255, 255, 255, 0.92);
        font-size: 1.05rem;
        font-weight: 600;
        line-height: 1.4;
    }

    /* Coverage + FAQ unified banner (cellular) */
    .info-section {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        align-items: center;
    }

    .info-section::before {
        content: "";
        position: absolute;
        left: 50%;
        top: 12%;
        bottom: 12%;
        width: 2px;
        background: rgba(255, 255, 255, 0.14);
        border-radius: 2px;
        transform: translateX(-50%);
    }

    .info-pane {
        min-width: 0;
    }

    /* Coverage banner */
    .coverage-section {
        text-align: center;
    }

    .coverage-banner {
        position: relative;
        display: inline-block;
        width: 100%;
        max-width: 320px;
        border-radius: 14px;
        overflow: hidden;
        text-decoration: none;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
        border: 2px solid rgba(250, 204, 21, 0.4);
        transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
        cursor: pointer;
    }

    .coverage-banner img {
        display: block;
        width: 100%;
        height: auto;
    }

    .coverage-banner-label {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 0.55rem 0.8rem;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.35));
        color: #facc15;
        font-weight: 800;
        font-size: 0.95rem;
        text-align: center;
    }

    .coverage-banner:hover {
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.45);
    }

    .coverage-banner:active {
        transform: translateY(0);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    }

    /* כשהבאנר אינו קישור - אין hover/cursor */
    .coverage-banner-static {
        cursor: default;
    }

    .coverage-banner-static:hover {
        transform: none;
        box-shadow: 0 8px 22px rgba(0, 0, 0, 0.35);
    }

    /* Steps */
    .steps {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
    }

    .step {
        position: relative;
        padding: 2rem 1.2rem 1.5rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        text-align: center;
    }

    .step-link {
        display: block;
        text-decoration: none;
        color: inherit;
        transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
    }

    .step-link:hover {
        transform: translateY(-2px);
        background: rgba(255, 255, 255, 0.07);
        border-color: rgba(250, 204, 21, 0.45);
    }

    .step-num {
        position: absolute;
        top: -16px;
        right: 50%;
        transform: translateX(50%);
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .step-icon {
        font-size: 2.2rem;
        margin-bottom: 0.6rem;
    }

    .step h3 {
        font-size: 1.1rem;
        margin: 0 0 0.4rem;
        color: white;
    }

    .step p {
        font-size: 0.95rem;
        color: rgba(255, 255, 255, 0.7);
        margin: 0;
        line-height: 1.5;
    }

    /* Benefits */
    .benefits {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .benefit {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.2rem 1.4rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        text-align: right;
    }

    .benefit-icon {
        font-size: 1.8rem;
        flex-shrink: 0;
    }

    .benefit-text {
        font-size: 1.05rem;
        font-weight: 500;
    }

    /* Reviews */
    .reviews {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1.2rem;
    }

    .review {
        padding: 1.5rem;
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        text-align: right;
    }

    .review-stars {
        font-size: 0.95rem;
        margin-bottom: 0.6rem;
        letter-spacing: 2px;
    }

    .review-text {
        font-size: 1rem;
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.6;
        margin: 0 0 0.8rem;
        font-style: italic;
    }

    .review-author {
        font-size: 0.9rem;
        color: #facc15;
        font-weight: 600;
    }

    /* FAQ */
    .faq-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    .faq-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        overflow: hidden;
    }

    .faq-item.open {
        border-color: rgba(250, 204, 21, 0.4);
    }

    .faq-q {
        width: 100%;
        padding: 0.7rem 1.4rem;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.05rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        text-align: right;
        font-family: inherit;
    }

    .faq-arrow {
        font-size: 1.4rem;
        color: #facc15;
    }

    .faq-a {
        padding: 0 1.4rem 1.2rem;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.6;
        text-align: right;
    }

    /* Survey */
    .survey-section-wrap {
        text-align: center;
    }

    /* סיכום ההצבעות בדף המבצע - קישור לדף הדירוגים והתגובות (במקום טופס דירוג) */
    .rating-summary-cta {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        gap: 0.6rem;
        margin: 0 auto 0.5rem;
        padding: 1.1rem 2rem;
        background: rgba(10, 17, 40, 0.55);
        border: 2px solid rgba(250, 204, 21, 0.45);
        border-radius: 18px;
        text-decoration: none;
        box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
    }
    .rating-summary-cta:hover {
        transform: translateY(-3px);
        border-color: #facc15;
        box-shadow: 0 10px 26px rgba(250, 204, 21, 0.35);
    }
    .rating-summary-badge {
        display: flex;
        align-items: center;
        gap: 0.7rem;
    }
    .rating-summary-stars {
        font-size: 1.5rem;
        letter-spacing: 2px;
        line-height: 1;
    }
    .rating-summary-val {
        font-size: 1.6rem;
        font-weight: 800;
        color: #facc15;
    }
    .rating-summary-text {
        font-size: 1.1rem;
        font-weight: 700;
        color: #facc15;
    }
    @media (max-width: 560px) {
        .rating-summary-cta {
            padding: 0.9rem 1.4rem;
        }
        .rating-summary-stars { font-size: 1.25rem; }
        .rating-summary-val { font-size: 1.35rem; }
        .rating-summary-text { font-size: 1rem; }
    }

    .restricted-box,
    .thank-you {
        padding: 2rem;
    }

    .restriction-icon,
    .success-icon {
        font-size: 3.5rem;
        margin-bottom: 0.8rem;
    }

    .thank-you h3 {
        font-size: 1.8rem;
        background: linear-gradient(to right, #facc15, #fb923c);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0 0 0.5rem;
    }

    .survey-form {
        max-width: 700px;
        margin: 0 auto;
    }

    .form-row {
        margin-bottom: 2rem;
        text-align: right;
    }

    .question {
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 1rem;
        display: block;
        color: rgba(255, 255, 255, 0.9);
    }

    /* שורה אחת לבחירה+דירוג - שני survey-step בצד-זה-לצד */
    .survey-inline-row {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.75rem;
        flex-wrap: wrap;
        margin-bottom: 1.1rem;
    }
    /* כל "שלב" בסקר - תווית קצרה ליד התוכן */
    .survey-step {
        display: flex;
        align-items: center;
        gap: 0.55rem;
    }
    .step-label {
        font-size: 1.15rem;
        font-weight: 800;
        color: #facc15;
        white-space: nowrap;
    }
    @media (max-width: 560px) {
        .survey-inline-row {
            gap: 0.9rem;
        }
        .step-label {
            font-size: 1rem;
        }
    }

    /* בחירת חברה לדירוג */
    .company-picker {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.6rem;
        margin: 0;
    }
    .company-pill {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 999px;
        padding: 0.5rem 1.2rem;
        color: rgba(255, 255, 255, 0.88);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.18s ease;
    }
    .company-pill:hover {
        background: rgba(250, 204, 21, 0.1);
        border-color: rgba(250, 204, 21, 0.5);
    }
    .company-pill.selected {
        background: linear-gradient(135deg, #facc15, #fb923c);
        border-color: #facc15;
        color: #1a1a1a;
        box-shadow: 0 4px 16px rgba(250, 204, 21, 0.35);
    }
    /* שייק על שורת הגלולות כאשר מנסים לדרג בלי לבחור חברה */
    .company-picker.shake {
        animation: pickerShake 0.55s ease;
    }
    @keyframes pickerShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-5px); }
        80% { transform: translateX(5px); }
    }
    .company-picker.shake .company-pill {
        border-color: #facc15;
        box-shadow: 0 0 12px rgba(250, 204, 21, 0.45);
    }
    @media (prefers-reduced-motion: reduce) {
        .company-picker.shake { animation: none; }
    }
    .rating-hint {
        margin: 0.75rem 0 0;
        text-align: center;
        color: #facc15;
        font-size: 0.95rem;
        font-weight: 600;
    }

    .submit-stack {
        display: flex;
        flex-direction: column;
        gap: 0.6rem;
        width: 140px;
    }
    .submit-stack .submit-btn {
        margin-top: 0;
        padding: 0.75rem 0.6rem;
        font-size: 0.95rem;
        white-space: nowrap;
    }
    .submit-stack .text-input {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
    }
    @media (max-width: 600px) {
        .submit-stack {
            width: 70%;
            justify-self: start;
        }
    }
    .text-input {
        width: 100%;
        padding: 0.35rem 0.65rem;
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.92);
        font-size: 0.82rem;
        font-family: inherit;
        transition: border-color 0.2s ease, background 0.2s ease;
    }
    .text-input::placeholder {
        color: rgba(255, 255, 255, 0.35);
        font-size: 0.82rem;
    }
    .text-input:focus {
        outline: none;
        border-color: rgba(250, 204, 21, 0.6);
        background: rgba(0, 0, 0, 0.4);
    }

    .comments-row {
        margin: 0.85rem 0 0.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.45rem;
    }
    .comments-label {
        font-size: 0.95rem;
        font-weight: 600;
        color: rgba(255, 255, 255, 0.85);
        text-align: right;
    }
    .comments-submit-grid {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 0.85rem;
        align-items: stretch;
    }
    .comments-submit-grid .submit-btn {
        margin-top: 0;
        align-self: stretch;
        white-space: nowrap;
    }
    @media (max-width: 600px) {
        .comments-submit-grid {
            grid-template-columns: 1fr;
        }
    }
    .comments-input {
        width: 100%;
        min-height: 80px;
        padding: 0.8rem 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 12px;
        color: rgba(255, 255, 255, 0.95);
        font-size: 1rem;
        font-family: inherit;
        resize: vertical;
        transition: border-color 0.2s ease, background 0.2s ease;
    }
    .comments-input::placeholder {
        color: rgba(255, 255, 255, 0.4);
    }
    .comments-input:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.45);
    }

    /* רשימת תגובות אחרונות */
    .responses-list {
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px dashed rgba(255, 255, 255, 0.15);
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
    }
    .responses-title {
        font-size: 1.05rem;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.85);
        margin: 0 0 0.5rem;
        text-align: right;
    }
    .response-item {
        background: rgba(0, 0, 0, 0.22);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 0.85rem 1.1rem;
    }
    .response-item.featured {
        border-color: rgba(250, 204, 21, 0.45);
        background: rgba(250, 204, 21, 0.05);
    }
    .response-pin,
    .response-like {
        font-size: 1rem;
        line-height: 1;
    }
    .response-admin-reply {
        margin-top: 0.75rem;
        padding: 0.6rem 0.85rem;
        background: rgba(96, 165, 250, 0.08);
        border-right: 3px solid rgba(96, 165, 250, 0.6);
        border-radius: 8px;
    }
    .admin-reply-label {
        display: block;
        font-size: 0.8rem;
        font-weight: 700;
        color: rgba(96, 165, 250, 0.95);
        margin-bottom: 0.25rem;
    }
    .admin-reply-text {
        margin: 0;
        color: rgba(255, 255, 255, 0.85);
        font-size: 0.92rem;
        line-height: 1.5;
        white-space: pre-wrap;
        text-align: right;
    }
    .responses-all-link {
        display: block;
        margin-top: 0.5rem;
        text-align: center;
        color: #facc15;
        text-decoration: none;
        font-weight: 600;
        font-size: 0.95rem;
        padding: 0.5rem;
        transition: color 0.2s ease;
    }
    .responses-all-link:hover {
        color: #fde047;
    }

    /* פס אדמין למעלה */
    .admin-bar {
        display: flex;
        justify-content: flex-end;
        gap: 0.6rem;
        align-items: center;
        padding: 0.4rem 0.8rem;
        font-size: 0.85rem;
    }
    .admin-user {
        color: rgba(255, 255, 255, 0.75);
    }
    .admin-link {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.18);
        color: rgba(255, 255, 255, 0.85);
        padding: 0.25rem 0.8rem;
        border-radius: 6px;
        font-size: 0.82rem;
        cursor: pointer;
        text-decoration: none;
    }
    .admin-link:hover {
        background: rgba(255, 255, 255, 0.12);
    }

    /* פקדי אדמין על תגובה */
    .admin-controls {
        display: flex;
        gap: 0.4rem;
        margin-top: 0.6rem;
        padding-top: 0.6rem;
        border-top: 1px dashed rgba(255, 255, 255, 0.1);
        align-items: center;
        flex-wrap: wrap;
    }
    .admin-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        color: rgba(255, 255, 255, 0.9);
        padding: 0.3rem 0.6rem;
        border-radius: 6px;
        font-size: 0.95rem;
        cursor: pointer;
        font-family: inherit;
        transition: background 0.15s ease;
    }
    .admin-btn:hover {
        background: rgba(255, 255, 255, 0.12);
    }
    .admin-btn.on {
        background: rgba(250, 204, 21, 0.18);
        border-color: rgba(250, 204, 21, 0.55);
    }
    .admin-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .admin-reply-input {
        flex: 1;
        min-width: 8rem;
        padding: 0.3rem 0.6rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 6px;
        color: rgba(255, 255, 255, 0.92);
        font-family: inherit;
        font-size: 0.9rem;
    }

    .response-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.3rem;
        flex-wrap: wrap;
    }
    .response-stars {
        color: #facc15;
        letter-spacing: 1px;
        font-size: 1.05rem;
    }
    .response-company {
        background: rgba(250, 204, 21, 0.12);
        border: 1px solid rgba(250, 204, 21, 0.35);
        border-radius: 999px;
        padding: 0.1rem 0.7rem;
        font-size: 0.85rem;
        color: #facc15;
        font-weight: 600;
    }
    .response-date {
        color: rgba(255, 255, 255, 0.45);
        font-size: 0.85rem;
        margin-inline-start: auto;
    }
    .response-body {
        display: flex;
        gap: 1rem;
        margin-top: 0.75rem;
        align-items: flex-start;
    }
    .response-user {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        flex-shrink: 0;
        min-width: 6rem;
        max-width: 9rem;
    }
    .response-name {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
        font-weight: 700;
    }
    .response-city {
        color: rgba(255, 255, 255, 0.6);
        font-size: 0.85rem;
    }
    .response-text {
        flex: 1;
        margin: 0;
        color: rgba(255, 255, 255, 0.88);
        line-height: 1.5;
        white-space: pre-wrap;
        text-align: right;
    }
    @media (max-width: 560px) {
        /* בנייד: השם+העיר בקופסה קטנה שצפה לפינה הימנית, והתוכן עוטף סביבה וממלא את שאר הרוחב */
        .response-body {
            display: flow-root;   /* מכיל את ה-float */
            gap: 0;
        }
        .response-user {
            float: inline-start;  /* RTL: נצמד לימין למעלה */
            min-width: 0;
            max-width: none;
            margin-inline-end: 1.25rem;    /* RTL: רווח בצד שמאל - בין השם לתוכן שעוטף */
            margin-bottom: 0.35rem;
            padding: 0;
            border: none;
            background: none;     /* בלתי נראית - רק השם והעיר, התוכן עוטף סביבם */
        }
        .response-name,
        .response-city {
            color: #facc15;       /* שם ועיר בצהוב */
        }
    }

    /* כוכבים + סמיילי דינמי */
    .star-rating {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        flex-wrap: wrap;
        margin-top: 0.5rem;
    }
    .stars {
        display: inline-flex;
        gap: 0.3rem;
        direction: ltr;
        flex-direction: row-reverse;
    }
    .star {
        background: transparent;
        border: none;
        cursor: pointer;
        font-size: 2.4rem;
        line-height: 1;
        color: rgba(255, 255, 255, 0.22);
        transition: color 0.18s ease, transform 0.15s ease, text-shadow 0.18s ease;
        padding: 0.15rem 0.05rem;
    }
    .star:hover { transform: scale(1.18); }
    .star.filled {
        color: #facc15;
        text-shadow: 0 0 12px rgba(250, 204, 21, 0.55);
    }
    .star:focus-visible {
        outline: 2px solid #facc15;
        outline-offset: 2px;
        border-radius: 4px;
    }
    .emoji-display {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        min-height: 56px;
        opacity: 1;
    }
    .emoji-face {
        font-size: 2.6rem;
        line-height: 1;
    }
    .emoji-text {
        font-size: 1.05rem;
        font-weight: 700;
        color: #facc15;
        white-space: nowrap;
    }
    @media (max-width: 480px) {
        .star-rating { gap: 1rem; }
        .star { font-size: 2rem; }
        .emoji-face { font-size: 2.2rem; }
        .emoji-text { font-size: 0.95rem; }
    }

    textarea {
        width: 100%;
        min-height: 90px;
        padding: 1rem;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: white;
        font-family: inherit;
        font-size: 1rem;
        resize: vertical;
        transition: border-color 0.3s ease;
        box-sizing: border-box;
    }

    textarea:focus {
        outline: none;
        border-color: #facc15;
        background: rgba(0, 0, 0, 0.4);
    }

    .primary-btn {
        padding: 1rem 2.5rem;
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(135deg, #facc15, #fb923c);
        color: #1a1a1a;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        font-family: inherit;
    }

    .primary-btn:hover:not(:disabled) {
        transform: translateY(-4px) scale(1.04);
        box-shadow: 0 10px 22px rgba(250, 204, 21, 0.35);
    }

    .submit-btn {
        margin-top: 1rem;
    }

    .submit-btn:disabled {
        cursor: not-allowed;
        opacity: 0.92;
    }

    /* Responsive */
    @media (max-width: 900px) {
        .hero {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 1.8rem;
        }

        .hero-image {
            width: 100%;
            max-width: 280px;
            height: 240px;
            margin: 0 auto;
        }

        .hero-content {
            text-align: center;
        }

        .hero-content h1 {
            margin-bottom: 0.3rem;
        }

        .hero-desc {
            font-size: 1.1rem;
            line-height: 1.15;
            margin: 0 0 0.25rem;
        }

        .hero-desc-providers {
            font-size: 1.05rem;
            line-height: 1.15;
            margin-bottom: 0;
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .stat-card {
            padding: 0.55rem 0.4rem;
        }

        .stat-icon {
            font-size: 1.35rem;
            margin-bottom: 0.15rem;
            line-height: 1;
        }

        .stat-value {
            font-size: 1.15rem;
            margin-bottom: 0.05rem;
            line-height: 1.1;
        }

        .stat-label {
            font-size: 0.72rem;
            line-height: 1.15;
        }

        .stat-sub {
            margin-top: 0.15rem;
            font-size: 0.68rem;
            line-height: 1.15;
        }

        .stat-card + .stat-card::before {
            top: 15%;
            bottom: 15%;
        }

        .reviews {
            grid-template-columns: 1fr;
        }

        .section.steps-section {
            background: transparent;
            border: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            padding: 0.5rem 0;
            margin-inline: -1.5rem;
            border-radius: 0;
        }

        .section.steps-section h2 {
            padding: 0 1rem;
        }

        .steps {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.4rem;
            padding: 0 0.4rem;
        }

        .step {
            padding: 1.4rem 0.5rem 0.9rem;
            border-radius: 12px;
        }

        .step-num {
            top: -14px;
            width: 28px;
            height: 28px;
            font-size: 0.9rem;
        }

        .step-icon {
            font-size: 1.9rem;
            margin-bottom: 0.45rem;
        }

        .step h3 {
            font-size: 1rem;
            margin: 0 0 0.3rem;
            line-height: 1.2;
        }

        .step p {
            font-size: 0.85rem;
            line-height: 1.3;
        }

        .info-section {
            grid-template-columns: 1fr;
            gap: 1.5rem;
        }

        .join-cta-wrap {
            gap: 0.5rem;
        }

        .join-cta-hand {
            font-size: 1.35rem;
        }

        .join-cta-banner {
            padding: 1.4rem 1rem;
        }

        .join-cta-content h3 {
            font-size: 1.2rem;
        }

        .join-cta-content p {
            font-size: 0.95rem;
        }

        .info-section::before {
            left: 12%;
            right: 12%;
            top: 50%;
            bottom: auto;
            width: auto;
            height: 2px;
            transform: translateY(-50%);
        }

        .benefits {
            grid-template-columns: 1fr;
        }

        .section {
            padding: 1.8rem 1.2rem;
        }

        .hero-content h1 {
            font-size: 1.7rem;
        }

        .section h2 {
            font-size: 1.4rem;
        }

        .rating-btn {
            width: 52px;
            height: 52px;
        }

        .rating-btn .emoji {
            font-size: 1.4rem;
        }

        .rating-container {
            gap: 0.5rem;
        }
    }

    /* בנייד צר: מצמצמים את הריפוד הצדדי של העמוד והסקשנים בצורה אחידה,
       כדי שכל המסגרות יתרחבו והתוכן יקבל יותר רוחב ולא ייחתך */
    @media (max-width: 560px) {
        .details-page {
            padding: 0 0.65rem;
        }
        .section {
            padding: 1.4rem 0.9rem;
        }
    }
    @media (max-width: 380px) {
        .details-page {
            padding: 0 0.4rem;
        }
        .section {
            padding: 1.2rem 0.65rem;
        }
        .plans-table tbody td {
            margin: 0 0.2rem;
        }
    }
</style>
