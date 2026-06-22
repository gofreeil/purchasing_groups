// Default campaign data - מחליף את Strapi כשהוא לא זמין.
// **חשוב**: עדכון של תוכן Strapi לא ישתקף כאן עד עדכון הקובץ הזה.
// המבנה זהה בדיוק לזה של ה-API של Strapi (data[0] של pg-campaigns).
//
// מקור: מבוסס על ה-seed ב-community-backend/src/seeds/pg-campaigns.ts.
// המגמה: למנוע מהאתר ליפול גם אם Strapi down ל-5 דקות.

export const FALLBACK_CAMPAIGNS = {
    cellular: {
        slug: 'cellular',
        title: 'סלולר חוסכוני',
        description: 'מסלולי סלולר זולים במיוחד מבית רמי לוי, אקס פון ווויקום',
        icon: '📱',
        image_url: '/assets/cellular.jpg',
        order: 1,
        status: 'active',
        can_join: true,
        is_new: false,
        providers_line: 'מסלולים בחברת רמי לוי, אקס פון, וויקום',
        rating_companies: ['רמי לוי', 'אקס פון', 'וויקום'],
        join_link: 'https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header',
        join_cta_subtitle: 'לקו הסלולר הזול במדינה - חברות רמי לוי / אקס פון / וויקום',
        find_section: {
            href: 'https://tiber.co.il/Home/Antenna',
            image: '/assets/coverage-banner.png',
            label: 'לבדיקת קליטה ↗',
            title: 'בדוק את הרשתות המומלצות בשכונה/ עבודה שלך',
            imageAlt: 'בדיקת קליטה סלולרית',
            ariaLabel: 'לבדיקת קליטה ב-tiber.co.il',
        },
    },
    fuel: {
        slug: 'fuel',
        title: 'דלק חוסכוני',
        description: 'הנחה קבועה בדלק בתחנות סונול, דור אלון, טן ותפוז',
        icon: '⛽',
        image_url: '/assets/fuel.jpg',
        order: 2,
        status: 'active',
        can_join: true,
        is_new: true,
        new_badge_text: 'חדש!',
        rating_companies: ['בנזין', 'סולר'],
        join_link: 'https://forms.gle/2Y9SdUfqkJd5mPaS7',
        join_link_diesel: 'https://docs.google.com/forms/d/e/1FAIpQLScz6iFzBwX7oGYXdh98Y9aah_RgWXINtbsJ5u05wWYE8anVUA/viewform?usp=publish-editor',
        join_cta_subtitle: 'הנחה בדלק <span class="cta-small">(95 או 98)</span>',
        find_section: {
            image: '/images/gas-stations.png',
            title: 'מצא את התחנות הקרובות אליך',
            imageAlt: 'תחנות דלק',
            stationNames: ['סונול', 'דור אלון', 'טן', 'תפוז'],
        },
    },
    internet: { slug: 'internet', title: 'אינטרנט מהיר', description: 'בקרוב - חבילות אינטרנט בהנחה לחברי הקבוצה', icon: '🌐', image_url: '/assets/internet.jpg', order: 3, status: 'soon', can_join: false },
    carInsurance: { slug: 'carInsurance', title: 'ביטוח רכב', description: 'בקרוב - ביטוח רכב קבוצתי בהנחה משמעותית', icon: '🚗', image_url: '/assets/car_insurance.png', order: 4, status: 'soon', can_join: false },
    electricity: { slug: 'electricity', title: 'חשמל חוסכוני', description: 'בקרוב - חבילות חשמל בהנחה לחברי הקבוצה', icon: '⚡', image_url: '/assets/electricity.jpg', order: 5, status: 'soon', can_join: false },
    coupons: { slug: 'coupons', title: 'קופונים והנחות', description: 'בקרוב - קופונים והנחות בלעדיים לחברי הקבוצה', icon: '🎟️', image_url: '/assets/coupons.jpg', order: 6, status: 'soon', can_join: false },
};

export function fallbackCampaign(slug) {
    return FALLBACK_CAMPAIGNS[slug] ?? null;
}

export function fallbackCampaignList() {
    return Object.values(FALLBACK_CAMPAIGNS).sort((a, b) => a.order - b.order);
}
