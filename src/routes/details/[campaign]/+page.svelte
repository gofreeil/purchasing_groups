<script>
    import { t } from "$lib/i18n.js";
    import { isLoggedIn } from "$lib/user.js";
    import { fade, slide } from "svelte/transition";

    let { data } = $props();

    const icons = {
        cellular: "📱",
        internet: "🌐",
        fuel: "⛽",
        carInsurance: "🚗",
        electricity: "⚡",
        coupons: "🎟️",
    };

    const images = {
        cellular: "/assets/cellular.jpg",
        internet: "/assets/internet.jpg",
        fuel: "/assets/fuel.jpg",
        carInsurance: "/assets/car_insurance.png",
        electricity: "/assets/electricity.jpg",
        coupons: "/assets/coupons.jpg",
    };

    const joinLinks = {
        cellular: "https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header",
        fuel: "https://forms.gle/2Y9SdUfqkJd5mPaS7",
    };

    const whatsappLink = "https://chat.whatsapp.com/FWz0ha6fRqxEjDLzFVq7jI";

    const stats = {
        cellular: { rating: 5.0, savings: 25, annualSavings: 300, reviews: 47 },
        fuel: { rating: 4.9, savings: 60, annualSavings: 720, reviews: 21 },
        internet: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        carInsurance: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        electricity: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
        coupons: { rating: 0, savings: 0, annualSavings: 0, reviews: 0 },
    };

    let satisfactionLevel = $state(0);
    let improvements = $state("");
    let additionalComments = $state("");
    let submitted = $state(false);
    let openFaq = $state(-1);
    let joinCtaEl = $state(null);
    let joinCtaClicked = $state(false);
    let plansTableHighlight = $state(false);
    let shareToast = $state(false);

    let campaign = $derived(data.campaign);
    let campaignTitle = $derived($t.purchases[campaign].title);
    let campaignDesc = $derived($t.purchases[campaign].desc);
    let campaignIcon = $derived(icons[campaign] ?? "📋");
    let campaignImage = $derived(images[campaign]);
    let campaignStats = $derived({ ...stats[campaign], members: data.activeMembers });
    let joinLink = $derived(joinLinks[campaign]);

    const levels = [
        { value: 1, label: "😞" },
        { value: 2, label: "😐" },
        { value: 3, label: "🙂" },
        { value: 4, label: "😊" },
        { value: 5, label: "🤩" },
    ];

    function handleSubmit() {
        if (satisfactionLevel === 0) return;
        console.log("Survey submitted:", {
            campaign,
            satisfactionLevel,
            improvements,
            additionalComments,
        });
        submitted = true;
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

    async function handlePlansTableClick(e) {
        e.preventDefault();
        const target = document.getElementById('plans-table');
        if (!target) return;
        const rect = target.getBoundingClientRect();
        const center = rect.top + window.scrollY + rect.height / 2;
        const targetY = center - window.innerHeight / 2;
        await smoothScrollTo(targetY, 1800);
        plansTableHighlight = true;
        await new Promise((r) => setTimeout(r, 1400));
        plansTableHighlight = false;
    }

    async function handleScrollToFormClick(e) {
        e.preventDefault();
        if (!joinLink) return;
        if (joinCtaEl) {
            const rect = joinCtaEl.getBoundingClientRect();
            const bannerCenter = rect.top + window.scrollY + rect.height / 2;
            const targetY = bannerCenter - window.innerHeight / 2;
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
            const rect = joinCtaEl.getBoundingClientRect();
            const bannerCenter = rect.top + window.scrollY + rect.height / 2;
            const targetY = bannerCenter - window.innerHeight / 2;
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
    <a href="/" class="top-back">{$t.details.backToHome}</a>

    <!-- Hero + Stats unified banner -->
    <section class="hero-card">
        <div class="hero">
            <div class="hero-image">
                <img src={campaignImage} alt={campaignTitle} />
            </div>
            <div class="hero-content">
                <h1>{campaignTitle}</h1>
                <p class="hero-desc">{campaignDesc}</p>
                {#if campaign === 'cellular'}
                    <p class="hero-desc hero-desc-providers">מסלולים בחברת רמי לוי, אקס פון, וויקום</p>
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
                    <div class="stat-value">{campaignStats.savings} {$t.currency}</div>
                    <div class="stat-label">{$t.details.statsSavings}</div>
                    {#if campaignStats.annualSavings > 0}
                        <div class="stat-sub">{campaignStats.annualSavings} {$t.currency} בשנה</div>
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

    <!-- How it works -->
    <section class="section">
        <h2>{$t.details.howItWorks}</h2>
        <div class="steps">
            {#each $t.details.steps as step, i}
                {@const isPlansTableStep = i === 0 && campaign === 'cellular'}
                {@const isScrollToFormStep = i === 1 && campaign === 'cellular' && joinLink}
                {@const isShareStep = i === 2 && campaign === 'cellular'}
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
            {#each $t.details.faq as item, i}
                <div class="faq-item" class:open={openFaq === i}>
                    <button class="faq-q" onclick={() => toggleFaq(i)}>
                        <span>{item.q}</span>
                        <span class="faq-arrow">{openFaq === i ? '−' : '+'}</span>
                    </button>
                    {#if openFaq === i}
                        <div class="faq-a" transition:slide={{ duration: 200 }}>
                            {item.a}
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/snippet}

    {#if campaign === 'cellular'}
        <section class="section info-section">
            <div class="info-pane coverage-section">
                <h2>בדוק את הרשתות המומלצות בשכונה/ עבודה שלך</h2>
                <a
                    href="https://tiber.co.il/Home/Antenna"
                    target="_blank"
                    rel="noopener"
                    class="coverage-banner"
                    aria-label="לבדיקת קליטה ב-tiber.co.il"
                >
                    <img src="/assets/coverage-banner.png" alt="בדיקת קליטה סלולרית" />
                    <span class="coverage-banner-label">לבדיקת קליטה ↗</span>
                </a>
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

    {#if campaign === 'cellular'}
        <section id="plans-table" class="section plans-table-section">
            <h2>השוואת מסלולים</h2>
            <div class="plans-table-scroll" class:highlight={plansTableHighlight}>
                <table class="plans-table">
                    <thead>
                        <tr>
                            <th>שם חברה</th>
                            <th>שם התוכנית</th>
                            <th>רשת בדור</th>
                            <th>דקות/<br />סמסים</th>
                            <th>חבילת גלישה ג'יגה</th>
                            <th>עלות ממוצעת לקו לשנה</th>
                            <th>עלות סים</th>
                            <th>עלות משלוח</th>
                            <th>רובץ על רשת</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>רמי לוי</td>
                            <td>תוכנית א'</td>
                            <td>4/5</td>
                            <td>2500</td>
                            <td>150</td>
                            <td>14.9</td>
                            <td>🚫 ללא עלות</td>
                            <td>🚫 ללא עלות</td>
                            <td><img src="/images/פלאפון.jfif" alt="פלאפון" class="plans-table-logo" /></td>
                        </tr>
                        <tr>
                            <td>רמי לוי</td>
                            <td>תוכנית ב' (עד 8 קווים)</td>
                            <td>4/5</td>
                            <td>5000</td>
                            <td>300</td>
                            <td>16.4 <span class="plan-note">(עלות קו ל-2 מכשירים 15 ש"ח כל אחד)</span></td>
                            <td>🚫 ללא עלות</td>
                            <td>🚫 ללא עלות</td>
                            <td><img src="/images/פלאפון.jfif" alt="פלאפון" class="plans-table-logo" /></td>
                        </tr>
                        <tr>
                            <td>wecom</td>
                            <td>תוכנית ג'</td>
                            <td>4 (דור 5 בתוספת 7.9 ש"ח)</td>
                            <td>5000</td>
                            <td>ללא הגבלה</td>
                            <td>מחיר קבוע 19.9</td>
                            <td>🚫 ללא עלות</td>
                            <td>🚫 ללא עלות</td>
                            <td><img src="/images/סלקום.jfif" alt="סלקום" class="plans-table-logo" /></td>
                        </tr>
                        <tr>
                            <td>Xphone</td>
                            <td>תוכנית ד'</td>
                            <td>4/5</td>
                            <td>5000</td>
                            <td>500</td>
                            <td>18.9</td>
                            <td>4.9 ש"ח</td>
                            <td>14.9 ש"ח</td>
                            <td><img src="/images/סלקום.jfif" alt="סלקום" class="plans-table-logo" /></td>
                        </tr>
                    </tbody>
                </table>
            </div>
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
                    <h3>טופס ההצטרפות</h3>
                    <p>לקו הסלולר הזול במדינה - חברות רמי לוי / אקס פון / וויקום</p>
                </div>
            </a>
            <span class="join-cta-hand">👉</span>
        </div>
    {/if}

    <!-- Survey -->
    <section class="section survey-section-wrap">
        <h2>דרגו וכיתבו את החוויה שלכם</h2>

        {#if !$isLoggedIn}
            <div class="restricted-box">
                <div class="restriction-icon">🔒</div>
                <p>הפיצר יהיה זמין בהמשך</p>
            </div>
        {:else if submitted}
            <div class="thank-you" in:fade={{ duration: 400 }}>
                <div class="success-icon">✨</div>
                <h3>{$t.satisfaction.thankYou}</h3>
                <p>המשוב שלך עוזר לנו לצמוח ולהשתפר.</p>
            </div>
        {:else}
            <div class="survey-form">
                <div class="form-row">
                    <p class="question">{$t.satisfaction.q1Campaign}</p>
                    <div class="rating-container">
                        {#each levels as level}
                            <button
                                class="rating-btn {satisfactionLevel === level.value ? 'active' : ''}"
                                onclick={() => (satisfactionLevel = level.value)}
                                type="button"
                                aria-label={`${level.value}`}
                            >
                                <span class="emoji">{level.label}</span>
                            </button>
                        {/each}
                    </div>
                </div>

                <div class="form-row">
                    <label for="improvements" class="question">
                        {$t.satisfaction.question2}
                    </label>
                    <textarea
                        id="improvements"
                        bind:value={improvements}
                        placeholder="כתוב כאן..."
                    ></textarea>
                </div>

                <div class="form-row">
                    <label for="comments" class="question">
                        {$t.satisfaction.question3}
                    </label>
                    <textarea
                        id="comments"
                        bind:value={additionalComments}
                        placeholder="הערות נוספות..."
                    ></textarea>
                </div>

                <button
                    class="primary-btn submit-btn"
                    onclick={handleSubmit}
                    disabled={satisfactionLevel === 0}
                >
                    {$t.satisfaction.submit}
                </button>
            </div>
        {/if}
    </section>

    {#if shareToast}
        <div class="share-toast" role="status" aria-live="polite">
            ✅ הקישור הועתק — אפשר להדביק בכל מקום
        </div>
    {/if}
</div>

<style>
    .details-page {
        max-width: 1100px;
        margin: 2rem auto 4rem;
        padding: 0 1.5rem;
        color: white;
    }

    .top-back {
        display: inline-block;
        margin-bottom: 1.5rem;
        color: rgba(255, 255, 255, 0.7);
        text-decoration: none;
        font-size: 0.95rem;
        transition: color 0.3s ease;
    }

    .top-back:hover {
        color: #facc15;
    }

    /* Unified hero + stats banner */
    .hero-card {
        background: rgba(26, 26, 26, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
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

    /* Stats — integrated as bottom strip of the hero-card */
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
        background: rgba(26, 26, 26, 0.7);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        margin-bottom: 2rem;
    }

    .section h2 {
        font-size: 1.8rem;
        font-weight: 800;
        color: #facc15;
        text-align: center;
        margin: 0 0 2rem;
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
        .plans-table {
            font-size: 0.82rem;
        }
        .plans-table thead th {
            font-size: 0.78rem;
            padding: 0.55rem 0.3rem;
        }
        .plans-table tbody td {
            padding: 0.55rem 0.3rem;
        }
        .plan-note {
            font-size: 0.68rem;
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
        gap: 0.8rem;
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
        padding: 1.1rem 1.4rem;
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

    .rating-container {
        display: flex;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.5rem;
        direction: ltr;
    }

    .rating-btn {
        background: rgba(255, 255, 255, 0.05);
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .rating-btn .emoji {
        font-size: 1.8rem;
        transition: transform 0.3s ease;
    }

    .rating-btn:hover {
        background: rgba(250, 204, 21, 0.1);
        border-color: #facc15;
    }

    .rating-btn:hover .emoji {
        transform: scale(1.2);
    }

    .rating-btn.active {
        background: #facc15;
        border-color: #facc15;
        box-shadow: 0 0 20px rgba(250, 204, 21, 0.4);
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
        opacity: 0.5;
        cursor: not-allowed;
        filter: grayscale(1);
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

        .stats-grid {
            grid-template-columns: repeat(2, 1fr);
        }

        .steps,
        .reviews {
            grid-template-columns: 1fr;
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
</style>
