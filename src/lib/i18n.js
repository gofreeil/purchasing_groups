import { writable, readable, derived } from 'svelte/store';

export const lang = writable('he');

export const translations = readable({
    he: {
        title: "רכישות קבוצתיות יוצאים לחירות",
        subtitle: "הצטרף והוזל עכשיו את ההוצאות החודשיות שלך",
        addOffer: "+ הוסף הצעה",
        login: "התחברות",
        logoAlt: "לוגו",
        currency: 'ש"ח',
        sidebar: {
            whatsapp: "הצטרף עכשיו לקבוצת הווצאפ המשותפת שלנו והיה חלק מהמהפכה הצרכנית",
            neighborhoods: "הצטרף לפרוייקט ועדי השכונות לקידום חברה מתוקנת שבה העם שולט על מוסדותיו",
            craftsmen: "רוצה הנחה אצל בעלי מקצוע כשירים?",
            investments: "השקעות קבוצתיות בעסקים ונדל\"ן",
            investmentsCommunity: "רוצה להשקיע יחד עם קהילת המשקיעים של יוצאים לחירות?",
            growFood: "גדל בביתך את מזונותיך",
            soonTag: "בקרוב",
            sponsored: "תוכן שיווקי",
            yourAdHere: "מקום פרסום זה יכול להיות שלך",
            advertise: "רוצים לפרסם כאן?",
            contact: "צור קשר"
        },
        homepage: {
            title: "מהפכת הוזלת יוקר המחיה צומחת מהעם",
            featuresTitle: "יתרונות הקבוצה",
            features: [
                { icon: "💰", text: "הנחה משמעותית בכל ההוצאות החודשיות!" },
                { icon: "🥬🥕🍅", text: "התארגנות לרכישת ירקות ופירות היישר מהחקלאי עד לשכונה." },
                { icon: "🛒", text: "התארגנות לכרטיס מועדון עם הנחות בחנויות המותגים." },
                { icon: "💵", text: "שמירה על זכות המזומן וייעול השימוש בו." }
            ],
            membersCount: "חברים שחוסכים כל חודש",
            annualSavings: "הקבוצה שלנו חוסכת השנה:",
            ourPurchases: "הרכישות הקבוצתיות הפעילות שלנו:",
            soonColon: "בקרוב:",
            nextPurchases: "עסקאות נוספות יצטרפו לפי ההצבעה בקבוצת הווצאפ, מי שנוכח קובע!"
        },
        footer: {
            clickForActivity: "לכלל פעילות התנועה החברתית יוצאים לחירות הקלק:",
            libertyLink: "יוצאים לחירות בונים עולם חדש!",
            contactUs: "צור קשר",
            privacy: "מדיניות פרטיות",
            lastUpdated: "עדכון אחרון: פברואר 2026",
            privacySections: [
                {
                    title: "1. כללי",
                    content: "ברוכים הבאים לאתר \"מהפכת הוזלת יוקר המחיה צומחת מהעם\" (להלן: \"האתר\"). האתר מופעל על ידי \"יוצאים לחירות\" ומכבד את פרטיות המשתמשים בו. מטרת המדיניות היא להסביר בשקיפות מהם המידע שנאסף וכיצד אנו משתמשים בו, בהתאם להוראות חוק הגנת הפרטיות, התשמ\"א-1981."
                },
                {
                    title: "2. איסוף מידע",
                    content: "בעת השימוש באתר, אנו עשויים לאסוף את המידע הבא:",
                    list: [
                        "מידע שנמסר מרצון: שם מלא, מספר טלפון, כתובת דוא\"ל ומידע נוסף שתזין בטפסי יצירת קשר או הצטרפות לקבוצות רכישה.",
                        "מידע טכני: נתונים הנאספים אוטומטית כגון כתובת IP, סוג דפדפן, מערכת הפעלה וזמני גישה, לצורך תפעול תקין וסטטיסטיקה."
                    ]
                },
                {
                    title: "3. שימוש במידע",
                    content: "אנו נעשה שימוש במידע אך ורק למטרות שלשמן נמסר:",
                    list: [
                        "יצירת קשר עמך בנוגע לשירותים או מוצרים שהתעניינת בהם.",
                        "שיפור חווית הגלישה והתאמת התכנים באתר.",
                        "משלוח עדכונים שוטפים ומידע שיווקי, בכפוף להסכמתך (שניתן לבטל בכל עת).",
                        "ניהול ותפעול שוטף של קבוצות הרכישה."
                    ]
                },
                {
                    title: "4. מסירת מידע לצד שלישי",
                    content: "אנו מתחייבים לא להעביר את פרטיך לצדדים שלישיים ללא הסכמתך, למעט במקרים הבאים:",
                    list: [
                        "לצורך אספקת השירות (למשל, העברת פרטים לספק רלוונטי שביקשת להצטרף אליו).",
                        "על פי דרישת רשויות החוק או צו שיפוטי.",
                        "במקרה של מחלוקת משפטית הדורשת את חשיפת הפרטים."
                    ]
                },
                {
                    title: "5. אבטחת מידע",
                    content: "אנו נוקטים באמצעי אבטחה מקובלים טכנולוגית וארגונית כדי להגן על המידע שלך מפני גישה בלתי מורשית. יחד עם זאת, רשת האינטרנט אינה מאובטחת במאה אחוז, ואיננו יכולים להבטיח חסינות מוחלטת מפני חדירות למידע."
                },
                {
                    title: "6. זכויותיך כמשתמש",
                    content: "על פי חוק הגנת הפרטיות, אתה זכאי לעיין במידע המוחזק עליך במאגר המידע שלנו. אם מצאת שהמידע אינו נכון או אינו מעודכן, אתה רשאי לבקש לתקנו או למחוק אותו."
                },
                {
                    title: "7. יצירת קשר",
                    content: "בכל שאלה או בקשה הנוגעת למדיניות הפרטיות, ניתן לפנות אלינו במייל: freedomhasbegun@gmail.com"
                }
            ]
        },
        purchases: {
            cellular: {
                title: "קו הסלולר הזול במדינה!",
                desc: "החל מ-15 ש\"ח לחודש. השאר את הפרטים בטופס ותהנה מהנחה ייחודית רק לנו!",
                alt: "סלולר"
            },
            internet: {
                title: "אינטרנט ביתי הזול במדינה!",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "אינטרנט"
            },
            fuel: {
                title: "הנחה בדלק!",
                desc: "צוותנו פועלים לאתר הנחה לתנועה החברתית שלנו!",
                alt: "דלק"
            },
            carInsurance: {
                title: "ביטוח רכב הזול במדינה!",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "ביטוח רכב"
            },
            electricity: {
                title: "מערכת חשמל עצמאית המשתלמת במדינה!",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "חשמל"
            },
            coupons: {
                title: "רכישת קופוני הנחה ברשתות המזון",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "קופונים"
            },
            status: "סטטוס:",
            canJoin: "האם ניתן להצטרף?",
            saved: "הקבוצה חוסכת מהעסקה:",
            perMonth: 'כל חודש',
            perYear: 'בשנה',
            done: "בוצע",
            yes: "כן",
            no: "לא",
            soon: "בקרוב...",
            currency: 'ש"ח'
        },
        satisfaction: {
            title: "סקר שביעות רצון",
            restrictedTitle: "גישה מוגבלת",
            restrictedMessage: "הסקר מיועד ללקוחות רשומים בלבד. אנא התחבר כדי להשתתף.",
            loginToParticipate: "התחבר להשתתפות",
            question1: "מהי מידת שביעות הרצון שלך מרכישות קבוצתיות?",
            question2: "אילו מוצרים או שירותים נוספים היית רוצה לראות?",
            question3: "הערות נוספות:",
            submit: "שלח סקר",
            thankYou: "תודה על השתתפותך!",
            backToHome: "חזרה לדף הבית"
        }
    },
    en: {
        title: "Group Purchases Liberty",
        subtitle: "Join and reduce your monthly expenses now",
        addOffer: "+ Add Offer",
        login: "Login",
        logoAlt: "Logo",
        currency: 'ILS',
        sidebar: {
            whatsapp: "Join our shared WhatsApp group now and be part of the consumer revolution",
            neighborhoods: "Join the Neighborhood Committees project to promote a corrected society where the people control their institutions",
            craftsmen: "Want a discount with qualified professionals?",
            investments: "Group investments in business and real estate",
            investmentsCommunity: "Want to invest together with the Liberty investor community?",
            growFood: "Grow your own food at home",
            soonTag: "Soon",
            sponsored: "Sponsored Content",
            yourAdHere: "This advertising space could be yours",
            advertise: "Want to advertise here?",
            contact: "Contact us"
        },
        homepage: {
            title: "The cost of living reduction revolution grows from the people",
            featuresTitle: "Group Benefits",
            features: [
                { icon: "💰", text: "Significant discount on all monthly expenses!" },
                { icon: "🥬🥕🍅", text: "Organizing for purchasing vegetables and fruits directly from the farmer to the neighborhood." },
                { icon: "🛒", text: "Organizing a club card with discounts at brand stores." },
                { icon: "💵", text: "Preserving the right to cash and optimizing its use." }
            ],
            membersCount: "Members saving every month",
            annualSavings: "Our group saves per year:",
            ourPurchases: "Our Purchasing Groups:",
            soonColon: "Coming Soon:",
            nextPurchases: "More deals will be added according to the WhatsApp group vote, those who are present decide!"
        },
        footer: {
            clickForActivity: "For all Liberty social movement activities click here:",
            libertyLink: "Liberty building a new world!",
            contactUs: "Contact Us",
            privacy: "Privacy Policy",
            lastUpdated: "Last updated: February 2026",
            privacySections: [
                {
                    title: "1. General",
                    content: "Welcome to the 'Cost of Living Reduction Revolution' website (hereinafter: the 'Site'). The Site is operated by 'Liberty' and respects the privacy of its users. The purpose of this policy is to transparently explain what information is collected and how we use it, in accordance with the provisions of the Privacy Protection Law, 1981."
                },
                {
                    title: "2. Information Collection",
                    content: "When using the Site, we may collect the following information:",
                    list: [
                        "Voluntarily provided information: Full name, phone number, email address, and other information you enter in contact or joining forms.",
                        "Technical information: Data collected automatically such as IP address, browser type, operating system, and access times, for proper operation and statistics."
                    ]
                },
                {
                    title: "3. Use of Information",
                    content: "We will use the information solely for the purposes for which it was provided:",
                    list: [
                        "Contacting you regarding services or products you were interested in.",
                        "Improving the browsing experience and tailoring content on the site.",
                        "Sending regular updates and marketing information, subject to your consent (which can be canceled at any time).",
                        "Managing and ongoing operation of purchasing groups."
                    ]
                },
                {
                    title: "4. Disclosure of Information to Third Parties",
                    content: "We undertake not to transfer your details to third parties without your consent, except in the following cases:",
                    list: [
                        "For the purpose of providing the service (for example, transferring details to a relevant supplier you requested to join).",
                        "Requirement of law enforcement authorities or a court order.",
                        "In the event of a legal dispute requiring the disclosure of details."
                    ]
                },
                {
                    title: "5. Information Security",
                    content: "We take technologically and organizationally accepted security measures to protect your information from unauthorized access. However, the internet is not 100% secure, and we cannot guarantee complete immunity from data breaches."
                },
                {
                    title: "6. Your Rights as a User",
                    content: "According to the Privacy Protection Law, you are entitled to view the information held about you in our database. If you find that the information is incorrect or out of date, you may request to correct or delete it."
                },
                {
                    title: "7. Contact Us",
                    content: "For any questions or requests regarding the privacy policy, you can contact us via email: freedomhasbegun@gmail.com"
                }
            ]
        },
        purchases: {
            cellular: {
                title: "Cheapest mobile line in the country!",
                desc: "Starting from 15 ILS per month. Leave details in the form and enjoy a unique discount just for us!",
                alt: "Cellular"
            },
            internet: {
                title: "Cheapest home internet in the country!",
                desc: "Our team is working to find the most profitable deal for us.",
                alt: "Internet"
            },
            fuel: {
                title: "Fuel Discount!",
                desc: "Our team is working to find a discount for our social movement!",
                alt: "Fuel"
            },
            carInsurance: {
                title: "Cheapest car insurance in the country!",
                desc: "Our team is working to find the most profitable deal for us.",
                alt: "Car Insurance"
            },
            electricity: {
                title: "Most profitable independent electricity system in the country!",
                desc: "Our team is working to find the most profitable deal for us.",
                alt: "Electricity"
            },
            coupons: {
                title: "Purchase of discount coupons in food chains",
                desc: "Our team is working to find the most profitable deal for us.",
                alt: "Coupons"
            },
            status: "Status:",
            canJoin: "Can I join?",
            saved: "The group saves from the deal:",
            perMonth: 'per month',
            perYear: 'per year',
            done: "Done",
            yes: "Yes",
            no: "No",
            soon: "Soon...",
            currency: "ILS"
        },
        satisfaction: {
            title: "Satisfaction Survey",
            restrictedTitle: "Restricted Access",
            restrictedMessage: "The survey is for registered customers only. Please login to participate.",
            loginToParticipate: "Login to Participate",
            question1: "How satisfied are you with the group purchases?",
            question2: "What other products or services would you like to see?",
            question3: "Additional comments:",
            submit: "Submit Survey",
            thankYou: "Thank you for participating!",
            backToHome: "Back to Home"
        }
    },
    ru: {
        title: "Групповые закупки Свобода",
        subtitle: "Присоединяйтесь и сократите свои ежемесячные расходы сейчас",
        addOffer: "+ Добавить предложение",
        login: "Войти",
        logoAlt: "Логотип",
        currency: 'шек.',
        sidebar: {
            whatsapp: "Присоединяйтесь к нашей общей группе в WhatsApp сейчас и станьте частью потребительской революции",
            neighborhoods: "Присоединяйтесь к проекту Районных комитетов для продвижения исправленного общества, где народ контролирует свои институты",
            craftsmen: "Хотите скидку у квалифицированных специалистов?",
            investments: "Групповые инвестиции в бизнес и недвижимость",
            investmentsCommunity: "Хотите инвестировать вместе с сообществом инвесторов Свобода?",
            growFood: "Выращивайте еду у себя дома",
            soonTag: "Скоро",
            sponsored: "Рекламный контент",
            yourAdHere: "Это рекламное место может быть вашим",
            advertise: "Хотите разместить рекламу здесь?",
            contact: "Связаться с нами"
        },
        homepage: {
            title: "Революция по снижению цен на проживание растет из народа",
            featuresTitle: "Преимущества группы",
            features: [
                { icon: "💰", text: "Значительная скидка на все ежемесячные расходы!" },
                { icon: "🥬🥕🍅", text: "Организация закупки овощей и фруктов напрямую от фермера в район." },
                { icon: "🛒", text: "Организация клубной карты со скидками в брендовых магазинах." },
                { icon: "💵", text: "Сохранение права на наличные и оптимизация их использования." }
            ],
            membersCount: "Участников экономят каждый месяц",
            annualSavings: "Наша группа экономит в год:",
            ourPurchases: "Наши группы закупок:",
            soonColon: "Скоро:",
            nextPurchases: "Новые сделки будут добавлены по результатам голосования в WhatsApp, присутствующие решают!"
        },
        footer: {
            clickForActivity: "Для всех мероприятий общественного движения Свобода нажмите здесь:",
            libertyLink: "Свобода строит новый мир!",
            contactUs: "Связаться с нами",
            privacy: "Политика конфиденциальности",
            lastUpdated: "Последнее обновление: Февраль 2026",
            privacySections: [
                {
                    title: "1. Общие положения",
                    content: "Добро пожаловать на сайт 'Революция по снижению стоимости жизни растет из народа' (далее: 'Сайт'). Сайт управляется организацией 'Свобода' и уважает конфиденциальность своих пользователей. Цель данной политики - прозрачно объяснить, какая информация собирается и как мы ее используем в соответствии с положениями Закона о защите конфиденциальности 1981 года."
                },
                {
                    title: "2. Сбор информации",
                    content: "При использовании Сайта мы можем собирать следующую информацию:",
                    list: [
                        "Добровольно предоставленная информация: ФИО, номер телефона, адрес электронной почты и другая информация, которую вы вводите в формах связи или присоединения.",
                        "Техническая информация: Данные, собираемые автоматически, такие как IP-адрес, тип браузера, операционная система и время доступа, для правильной работы и статистики."
                    ]
                },
                {
                    title: "3. Использование информации",
                    content: "Мы будем использовать информацию исключительно в целях, для которых она была предоставлена:",
                    list: [
                        "Связь с вами по поводу услуг или продуктов, которые вас заинтересовали.",
                        "Улучшение качества просмотра и адаптация контента на сайте.",
                        "Рассылка регулярных обновлений и маркетинговой информации при условии вашего согласия (которое можно отозвать в любое время).",
                        "Управление и текущая деятельность групп закупок."
                    ]
                },
                {
                    title: "4. Передача информации третьим лицам",
                    content: "Мы обязуемся не передавать ваши данные третьим лицам без вашего согласия, за исключением следующих случаев:",
                    list: [
                        "Для целей предоставления услуги (например, передача данных соответствующему поставщику, к которому вы просили присоединиться).",
                        "По требованию правоохранительных органов или по решению суда.",
                        "В случае судебного спора, требующего раскрытия информации."
                    ]
                },
                {
                    title: "5. Безопасность информации",
                    content: "Мы принимаем технологически и организационно приемлемые меры безопасности для защиты вашей информации от несанкционированного доступа. Однако интернет не защищен на 100%, и мы не можем гарантировать полную неуязвимость от взлома данных."
                },
                {
                    title: "6. Ваши права как пользователя",
                    content: "В соответствии с Законом о защите конфиденциальности, вы имеете право просматривать информацию о вас, хранящуюся в нашей базе данных. Если вы обнаружите, что информация неверна или устарела, вы можете попросить исправить или удалить ее."
                },
                {
                    title: "7. Контакты",
                    content: "По любым вопросам или запросам относительно политики конфиденциальности вы можете связаться с нами по электронной почте: freedomhasbegun@gmail.com"
                }
            ]
        },
        purchases: {
            cellular: {
                title: "Самая дешевая мобильная связь в стране!",
                desc: "От 15 шекелей в месяц. Оставьте данные в форме и получите уникальную скидку только для нас!",
                alt: "Мобильная связь"
            },
            internet: {
                title: "Самый дешевый домашний интернет в стране!",
                desc: "Наша команда работает над поиском наиболее выгодного предложения для нас.",
                alt: "Интернет"
            },
            fuel: {
                title: "Скидка на топливо!",
                desc: "Наша команда работает над поиском скидки для нашего общественного движения!",
                alt: "Топливо"
            },
            carInsurance: {
                title: "Самая дешевая страховка автомобиля в стране!",
                desc: "Наша команда работает над поиском наиболее выгодного предложения для нас.",
                alt: "Страховка авто"
            },
            electricity: {
                title: "Самая выгодная независимая электросистема в стране!",
                desc: "Наша команда работает над поиском наиболее выгодного предложения для нас.",
                alt: "Электричество"
            },
            coupons: {
                title: "Покупка дисконтных купонов в продуктовых сетях",
                desc: "Наша команда работает над поиском наиболее выгодного предложения для нас.",
                alt: "Купоны"
            },
            status: "Статус:",
            canJoin: "Можно присоединиться?",
            saved: "Сэкономлено:",
            done: "Сделано",
            yes: "Да",
            no: "Нет",
            soon: "Скоро...",
            currencyPerYear: "шекелей/год"
        }
    }
});

export const t = derived([lang, translations], ([$lang, $translations]) => {
    /** @type {any} */
    const trans = $translations;
    return trans[$lang];
});
