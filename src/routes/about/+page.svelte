<script>
    // ============================================================
    // אודותינו — מי אנחנו, למי האתר מיועד ואגף "שאלות ותשובות".
    // השו"ת וסכמת ה-FAQPage נבנים שניהם מ-$lib/aboutFaq.js (מקור אמת אחד),
    // כדי שמנועי חיפוש ומנועי AI יקראו בדיוק את הטקסט שמוצג בדף.
    // ============================================================
    import Seo from "$lib/components/Seo.svelte";
    import JsonLd from "$lib/components/JsonLd.svelte";
    import { SITE_NAME, SITE_URL, PARENT_SITE, faqSchema, breadcrumbSchema } from "$lib/seo.js";
    import { ABOUT_FAQ, ABOUT_INTRO } from "$lib/aboutFaq.js";

    const schemas = [
        {
            "@context": "https://schema.org",
            "@type": "AboutPage",
            name: `אודותינו | ${SITE_NAME}`,
            description: ABOUT_INTRO,
            url: `${SITE_URL}/about`,
            inLanguage: "he-IL",
            isPartOf: { "@id": `${SITE_URL}/#website` },
            about: { "@id": `${SITE_URL}/#organization` },
        },
        breadcrumbSchema([
            { name: SITE_NAME, path: "/" },
            { name: "אודותינו", path: "/about" },
        ]),
        faqSchema(ABOUT_FAQ),
    ];
</script>

<Seo
    title="אודותינו | רכישות קבוצתיות יוצאים לחירות"
    description="מה זה אתר הרכישות הקבוצתיות של יוצאים לחירות, למי הוא מיועד, אילו קבוצות רכישה פעילות בו, איך מצטרפים חינם ומי עומד מאחוריו — כולל שאלות ותשובות."
    path="/about"
    keywords="אודות, רכישות קבוצתיות, קבוצת רכישה, יוצאים לחירות, שאלות ותשובות"
/>
<JsonLd data={schemas} />

<div class="about-container" dir="rtl">
    <div class="content-wrapper">
        <h1 class="main-title">אודותינו</h1>

        <p class="intro">{ABOUT_INTRO}</p>
        <p class="intro">
            האתר הוא חלק מרשת האתרים של
            <a href={PARENT_SITE.url} target="_blank" rel="noopener noreferrer">{PARENT_SITE.name}</a>
            — {PARENT_SITE.description}.
        </p>

        <section id="faq" class="faq-section" aria-labelledby="faq-title">
            <h2 id="faq-title">שאלות ותשובות</h2>
            <div class="faq-list">
                {#each ABOUT_FAQ as item, i (item.q)}
                    <details class="faq-item" open={i < 2}>
                        <summary>{item.q}</summary>
                        <p>{item.a}</p>
                    </details>
                {/each}
            </div>
        </section>

        <p class="back-link"><a href="/">→ חזרה לדף הבית</a></p>
    </div>
</div>

<style>
    .about-container {
        padding: 4rem 2rem;
        min-height: 80vh;
        background: transparent;
        color: var(--text-white);
        text-align: right;
        font-family: 'Heebo', "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    }

    .content-wrapper {
        max-width: 800px;
        margin: 0 auto;
        background: rgba(255, 255, 255, 0.05);
        padding: 3rem;
        border-radius: 20px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .main-title {
        font-size: 2.5rem;
        color: #facc15;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .intro {
        font-size: 1.1rem;
        line-height: 1.8;
        color: var(--text-white);
        margin-bottom: 1rem;
    }

    .intro a {
        color: #4ade80;
        text-decoration: underline;
        text-underline-offset: 3px;
    }

    .faq-section {
        margin-top: 3rem;
    }

    .faq-section h2 {
        font-size: 1.75rem;
        color: #4ade80;
        margin-bottom: 1.25rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        padding-bottom: 0.5rem;
    }

    .faq-list {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .faq-item {
        background: rgba(255, 255, 255, 0.04);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        padding: 0.25rem 1.25rem;
        transition: border-color 0.2s ease, background 0.2s ease;
    }

    .faq-item[open] {
        background: rgba(59, 130, 246, 0.08);
        border-color: rgba(59, 130, 246, 0.35);
    }

    .faq-item summary {
        cursor: pointer;
        font-weight: 700;
        font-size: 1.1rem;
        color: #facc15;
        padding: 0.75rem 0;
        list-style: none;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
    }

    .faq-item summary::-webkit-details-marker {
        display: none;
    }

    .faq-item summary::after {
        content: "+";
        font-size: 1.4rem;
        line-height: 1;
        color: var(--text-gray);
        flex-shrink: 0;
        transition: transform 0.2s ease;
    }

    .faq-item[open] summary::after {
        transform: rotate(45deg);
    }

    .faq-item p {
        margin: 0 0 1rem;
        line-height: 1.8;
        color: var(--text-gray);
        font-size: 1.05rem;
    }

    .back-link {
        margin-top: 2.5rem;
        text-align: center;
    }

    .back-link a {
        color: var(--primary-blue);
        text-decoration: none;
    }

    .back-link a:hover {
        text-decoration: underline;
    }

    @media (max-width: 768px) {
        .about-container {
            padding: 2rem 1rem;
        }

        .content-wrapper {
            padding: 1.5rem;
        }

        .main-title {
            font-size: 2rem;
        }
    }
</style>
