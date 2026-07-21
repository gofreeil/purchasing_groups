// מקור האמת לתוכן הקמפיינים — בפרונט, לא ב-Strapi.
// תוכן כמעט-סטטי (מסלולים/יתרונות/שאלות) שמשתנה לעיתים רחוקות; אין צורך ב-CMS עבורו,
// והחזקתו כאן מסירה תלות ב-Strapi (שהיה נופל ומעלים את הטבלה) ומאפשרת תיקון בקוד + דחיפה.
//
// נתונים דינמיים נשארים חיצוניים: חברים/חיסכון מ-Google Sheet, תגובות שביעות-רצון מ-Strapi.
// המבנה זהה לזה שה-API של Strapi החזיר (שדות שטוחים על האובייקט), כדי שהקומפוננטות לא ישתנו.

export const CAMPAIGNS = {
    cellular: {
        slug: 'cellular',
        title: 'קו הסלולר הזול במדינה!',
        description: 'החל מ-15 ש"ח לחודש, ללא התחייבות, ללא דמי הצטרפות',
        icon: '📱',
        image_url: '/assets/cellular.jpg',
        order: 1,
        status: 'active',
        can_join: true,
        providers_line: 'מסלולים בחברת רמי לוי, אקס פון, וויקום',
        rating_companies: ['רמי לוי', 'אקס פון', 'וויקום'],
        join_link: 'https://docs.google.com/forms/d/e/1FAIpQLSfRCs5W7HUuc5vcOuMGqsqaDubzNBn4YuC4UDbvoFmSCdJAiQ/viewform?usp=header',
        join_cta_subtitle: 'לקו הסלולר הזול במדינה - חברות רמי לוי / אקס פון / וויקום',
        find_section: {
            title: 'בדוק את הרשתות המומלצות בשכונה/ עבודה שלך',
            href: 'https://tiber.co.il/Home/Antenna',
            image: '/assets/coverage-banner.png',
            imageAlt: 'בדיקת קליטה סלולרית',
            ariaLabel: 'לבדיקת קליטה ב-tiber.co.il',
            label: 'לבדיקת קליטה ↗',
        },
        plans_table: {
            title: 'בחירת מסלול',
            headers: [
                'שם חברה',
                'שם התוכנית',
                'רשת בדור',
                'דקות/<br />סמסים',
                'חבילת גלישה ג\'יגה',
                'עלות ממוצעת לקו לשנה',
                'עלות סים',
                'עלות משלוח',
                'רוכב על רשת',
            ],
            rows: [
                {
                    title: 'תוכנית א\'', company: 'רמי לוי',
                    cells: [
                        { label: 'שם חברה', value: 'רמי לוי' },
                        { label: 'שם התוכנית', value: 'תוכנית א\'' },
                        { label: 'רשת בדור', value: '4/5' },
                        { label: 'דקות/סמסים', value: '2500' },
                        { label: 'חבילת גלישה ג\'יגה', value: '150' },
                        { label: 'עלות ממוצעת לקו לשנה', value: '14.9' },
                        { label: 'עלות סים', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'עלות משלוח', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'רוכב על רשת', image: { src: '/images/פלאפון.jfif', alt: 'פלאפון' } },
                    ],
                },
                {
                    title: 'תוכנית ב\' (עד 8 קווים)', company: 'רמי לוי',
                    cells: [
                        { label: 'שם חברה', value: 'רמי לוי' },
                        { label: 'שם התוכנית', value: 'תוכנית ב\' (עד 8 קווים)' },
                        { label: 'רשת בדור', value: '4/5' },
                        { label: 'דקות/סמסים', value: '5000' },
                        { label: 'חבילת גלישה ג\'יגה', value: '300' },
                        { label: 'עלות ממוצעת לקו לשנה', html: '16.4 <span class="plan-note">(עלות קו ל-2 מכשירים 15 ש"ח כל אחד)</span>' },
                        { label: 'עלות סים', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'עלות משלוח', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'רוכב על רשת', image: { src: '/images/פלאפון.jfif', alt: 'פלאפון' } },
                    ],
                },
                {
                    title: 'תוכנית ג\'', company: 'wecom',
                    cells: [
                        { label: 'שם חברה', value: 'wecom' },
                        { label: 'שם התוכנית', value: 'תוכנית ג\'' },
                        { label: 'רשת בדור', value: ' 4 (דור 5 בתוספת 7.9 ש"ח)' },
                        { label: 'דקות/סמסים', value: '5000' },
                        { label: 'חבילת גלישה ג\'יגה', value: 'ללא הגבלה' },
                        { label: 'עלות ממוצעת לקו לשנה', value: 'מחיר קבוע 19.9' },
                        { label: 'עלות סים', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'עלות משלוח', html: '<span class="no-cost-icon">🚫</span><br />ללא עלות' },
                        { label: 'רוכב על רשת', image: { src: '/images/סלקום.jfif', alt: 'סלקום' } },
                    ],
                },
                {
                    title: 'תוכנית ד\'', company: 'Xphone',
                    cells: [
                        { label: 'שם חברה', value: 'Xphone' },
                        { label: 'שם התוכנית', value: 'תוכנית ד\'' },
                        { label: 'רשת בדור', value: '4/5' },
                        { label: 'דקות/סמסים', value: '5000' },
                        { label: 'חבילת גלישה ג\'יגה', value: '500' },
                        { label: 'עלות ממוצעת לקו לשנה', value: '18.9' },
                        { label: 'עלות סים', value: '4.9 ש"ח' },
                        { label: 'עלות משלוח', value: '14.9 ש"ח' },
                        { label: 'רוכב על רשת', image: { src: '/images/סלקום.jfif', alt: 'סלקום' } },
                    ],
                },
            ],
        },
    },
    fuel: {
        slug: 'fuel',
        title: 'הנחה בדלק לכל החיים!',
        description: 'הנחה של 31 אגורות על כל ליטר בנזין מהמחיר היציג של סונול כל ימי חייך. ניתן לממש ב-555 תחנות ברחבי הארץ של דור אלון, טן, תפוז וסונול!',
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
        plans_table_note: 'שים לב: דלק, הינו מוצר במחיר מפוקח, לכן אין כפל מבצעים. אם המשתמש בוחר למלא בתדלוק עצמי הוא אינו זכאי להנחה על ההנחה.',
        plans_table_diesel_note: 'אין כפל מבצעים. המשתמש מקבל את ההנחה מהמחיר היציג של סונול ללא קשר לאופן המילוי - שירות עצמי או מלא.',
        find_section: {
            title: 'מצא את התחנות הקרובות אליך',
            image: '/images/gas-stations.png',
            imageAlt: 'תחנות דלק',
            stationNames: ['סונול', 'דור אלון', 'טן', 'תפוז'],
        },
        benefits: {
            title: 'היתרונות שלך',
            items: [
                { icon: '💸', text: 'הנחה קבועה בכל הארץ - החל מהליטר הראשון (בתחנות הדלק סונול, דור אלון, טן ותפוז)' },
                { icon: '🗺️', text: 'פריסה של כ-700 תחנות דלק ברחבי הארץ - ככה שתמיד יהיה לכם איפה לתדלק ובהנחה' },
                { icon: '✨', text: 'חווית תדלוק נוחה ופשוטה - נכנסת, תדלקת 😊' },
                { icon: '📋', text: 'חשבונית אחת מרוכזת - ניהול פשוט ונוח, בקרה על תדלוק רכבי המשפחה/העסק' },
                { icon: '✅', text: 'ללא דמי שימוש או התחייבות' },
                { icon: '🛠️', text: 'ללא דמי התקנה' },
                { icon: '📅', text: 'מועד חיוב קבוע בהוראת קבע בנקאית' },
            ],
        },
        steps_override: [
            { icon: '📍', title: 'בודקים תחנות בסביבה', desc: 'אם יש בסביבת הבית / עבודה מהתחנות הנ"ל עוברים לשלב הבא ⬅️' },
            { icon: '🤝', title: 'ממלאים פרטים בטופס הבנזין / סולר', desc: 'אנחנו דואגים שנציג יחזור אליכם בהקדם, לתת לכם יחס אישי.' },
            { icon: '💸', title: 'מתחילים לחסוך', desc: 'מצרפים חברים ומשפחה ומגדילים יותר את הכח שלנו.' },
        ],
        faq_override: [
            { q: 'האם יש דמי התקנה או תשלום חודשי כלשהו?', a: 'לא. לחברי יוצאים לחירות אין דמי התקנה או תשלום חודשי כלשהו.' },
            { q: 'האם אני מחוייב לתדלק רק בתחנות הדלק הללו?', a: 'לא. ניתן לתדלק בכל תחנה אך ההנחה קיימת רק בתחנות הללו.' },
            { q: 'האם תיתכן תחנת דלק עם הנחה גדולה משלנו?', a: 'כן, לעיתים ישנן תחנות עם מבצעים מיוחדים, במקרה כזה יש לתדלק ללא השימוש בדלקן כדי להנות מההנחה הטובה ביותר באותה השעה.' },
            { q: 'מה קורה כשאני מוכר את רכבי?', a: 'ניתן לשלוף בקלות את ההתקן ולהשליכו לאשפה,<br>או לבטלו מיידית אצלנו בחיוג לשירות<br>בטל׳ 04-659-2444.' },
        ],
        plans_table: {
            title: 'פירוט ההנחה בדלק (בנזין 95 או 98)',
            headers: ['רשת תחנות', 'הנחה לליטר בנזין', 'בסיס ההנחה', 'מס׳ תחנות זמינות', 'לוגו'],
            rows: [
                {
                    title: 'סונול',
                    cells: [
                        { label: 'רשת תחנות', value: 'סונול' },
                        { label: 'הנחה לליטר בנזין', value: '31 אגורות' },
                        { label: 'בסיס ההנחה', value: 'מהמחיר היציג של סונול' },
                        { label: 'מס׳ תחנות זמינות', value: '245' },
                        { label: 'לוגו', image: { src: '/images/sonol.png', alt: 'סונול' } },
                    ],
                },
                {
                    title: 'דור אלון',
                    cells: [
                        { label: 'רשת תחנות', value: 'דור אלון' },
                        { label: 'הנחה לליטר בנזין', value: '31 אגורות' },
                        { label: 'בסיס ההנחה', value: 'מהמחיר היציג של סונול' },
                        { label: 'מס׳ תחנות זמינות', value: '220' },
                        { label: 'לוגו', image: { src: '/images/dor-alon.png', alt: 'דור אלון' } },
                    ],
                },
                {
                    title: 'טן',
                    cells: [
                        { label: 'רשת תחנות', value: 'טן' },
                        { label: 'הנחה לליטר בנזין', value: '32 אגורות' },
                        { label: 'בסיס ההנחה', value: 'מהמחיר היציג של סונול' },
                        { label: 'מס׳ תחנות זמינות', value: '77' },
                        { label: 'לוגו', image: { src: '/images/ten.jfif', alt: 'טן' } },
                    ],
                },
                {
                    title: 'תפוז',
                    cells: [
                        { label: 'רשת תחנות', value: 'תפוז' },
                        { label: 'הנחה לליטר בנזין', value: '32 אגורות' },
                        { label: 'בסיס ההנחה', value: 'מהמחיר היציג של סונול' },
                        { label: 'מס׳ תחנות זמינות', value: '13' },
                        { label: 'לוגו', image: { src: '/images/tapuz.png', alt: 'תפוז' } },
                    ],
                },
            ],
        },
        plans_table_diesel: {
            title: 'פירוט ההנחה בסולר',
            subtitle: 'מחיר ההנחה משתנה בכל חודש ומתפרסם בקבוצת הוואטסאפ',
            headers: [
                'רשת תחנות',
                'הנחה לליטר סולר<br /><span class="header-sub">(הנחה לדוגמא)</span>',
                'בסיס ההנחה',
                'לוגו',
            ],
            rows: [
                {
                    title: 'כלל התחנות של -',
                    cells: [
                        { label: 'רשת תחנות', html: 'סונול / דור אלון / טן' },
                        { label: 'הנחה לליטר סולר', value: '3.76' },
                        { label: 'בסיס ההנחה', value: 'מהמחיר היציג של סונול' },
                        { label: 'לוגו', html: '<span class="multi-logos"><img src="/images/sonol.png" alt="סונול" class="plans-table-logo" /><img src="/images/dor-alon.png" alt="דור אלון" class="plans-table-logo" /><img src="/images/ten.jfif" alt="טן" class="plans-table-logo" /></span>' },
                    ],
                },
            ],
        },
    },
    internet: {
        slug: 'internet',
        title: 'אינטרנט ביתי הזול במדינה!',
        description: 'צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.',
        icon: '🌐',
        image_url: '/assets/internet.jpg',
        order: 3,
        status: 'soon',
        can_join: false,
    },
    carInsurance: {
        slug: 'carInsurance',
        title: 'ביטוח רכב הזול במדינה!',
        description: 'הצעה אישית לביטוח רכב קבוצתי המשתלם במדינה!<br />כולל הטבות ייחודיות רק לחברי הקבוצה',
        icon: '🚗',
        image_url: '/assets/car_insurance.png',
        order: 4,
        status: 'active',
        can_join: true,
        is_new: true,
        new_badge_text: 'חדש!',
        join_link: 'https://docs.google.com/forms/d/e/1FAIpQLSffJvHIO1PECwmTX_sYaRX2m96Pfef56R-xD9E63TUHm7NO_A/viewform?usp=header',
        join_cta_subtitle: 'ביטוח רכב במחיר קבוצתי <span class="cta-small">(פרטי / מסחרי)</span>',
        benefits: {
            title: 'היתרונות שלך',
            items: [
                { icon: '💪', text: 'כוח קנייה קבוצתי - מגיעים לחברות הביטוח יחד ולא כל אחד לבד' },
                { icon: '📋', text: 'הצעה אחת מרוכזת - בלי לרוץ בין סוכנים ואתרי השוואה' },
                { icon: '📞', text: 'נציג חוזר אליכם באופן אישי ועובר איתכם על הכיסויים' },
                { icon: '🚗', text: 'מתאים לכל סוגי הרכבים - פרטי, מסחרי וגם כמה רכבים במשפחה' },
                { icon: '🛡️', text: 'ללא התחייבות - ההצעה לעיונכם, ההחלטה תמיד שלכם' },
                { icon: '✅', text: 'ללא דמי הצטרפות ובלי עלות לחברי הקבוצה' },
            ],
        },
        steps_override: [
            { icon: '📝', title: 'ממלאים פרטים בטופס', desc: 'פרטי הרכב, הנהגים והפוליסה הנוכחית - לוקח דקה.' },
            { icon: '📞', title: 'מקבלים הצעה אישית', desc: 'נציג חוזר אליכם עם הצעת מחיר קבוצתית ובודק מולכם שהכיסוי מתאים.' },
            { icon: '💸', title: 'מתחילים לחסוך', desc: 'מצרפים חברים ומשפחה ומגדילים יותר את הכח שלנו.' },
        ],
        faq_override: [
            { q: 'האם מילוי הטופס מחייב אותי לרכוש את הביטוח?', a: 'לא. הטופס הוא לקבלת הצעה בלבד - ההחלטה אם לעבור נשארת אצלכם.' },
            { q: 'האם יש עלות להצטרפות לקבוצה?', a: 'לא. ההצטרפות לקבוצה וקבלת ההצעה חינמיות לחלוטין.' },
            { q: 'אני באמצע פוליסה קיימת - כדאי להשאיר פרטים?', a: 'כן. השאירו פרטים ונחזור אליכם לקראת מועד החידוש של הפוליסה.' },
            { q: 'אילו פרטים צריך כדי לקבל הצעה?', a: 'פרטי הרכב (יצרן, דגם ושנתון), פרטי הנהגים, ו<strong>חובה לדעת את המחיר של הפוליסה הנוכחית שלכם</strong> - בלעדיו אי אפשר להשוות ולדעת אם ההצעה הקבוצתית משתלמת לכם. הכל בטופס ההצטרפות.' },
        ],
    },
    electricity: {
        slug: 'electricity',
        title: 'מערכת חשמל עצמאית המשתלמת במדינה!',
        description: 'צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.',
        icon: '⚡',
        image_url: '/assets/electricity.jpg',
        order: 5,
        status: 'soon',
        can_join: false,
    },
    coupons: {
        slug: 'coupons',
        title: 'רכישת קופוני הנחה ברשתות המזון',
        description: 'צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.',
        icon: '🎟️',
        image_url: '/assets/coupons.jpg',
        order: 6,
        status: 'soon',
        can_join: false,
    },
};

// השוואה גם ב-lowercase: יש slug ב-camelCase (carInsurance), כך שקישור שהועתק
// באותיות קטנות (/details/carinsurance) לא יחזיר 404.
export function getCampaign(slug) {
    const lower = String(slug ?? '').toLowerCase();
    const key = Object.keys(CAMPAIGNS).find((k) => k === slug || k.toLowerCase() === lower);
    return key ? CAMPAIGNS[key] : null;
}

export function getCampaignList() {
    return Object.values(CAMPAIGNS).sort((a, b) => a.order - b.order);
}
