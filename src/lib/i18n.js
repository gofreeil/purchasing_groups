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
            whatsapp: 'הצטרף עכשיו לקבוצת <span class="hl-whatsapp">הווצאפ</span> המשותפת שלנו והיה חלק מהמהפכה הצרכנית',
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
            membersCount: "חברים שחוסכים כל חודש!",
            annualSavings: "הקבוצה שלנו חוסכת השנה:",
            ourPurchases: "הרכישות הקבוצתיות הפעילות שלנו:",
            soonColon: "הבאים בתור:",
            nextPurchases: "עסקאות נוספות יצטרפו לפי ההצבעה בקבוצת הווצאפ, מי שנוכח קובע!"
        },
        footer: {
            clickForActivity: "לכלל פעילות התנועה החברתית יוצאים לחירות הקלק:",
            libertyLink: "יוצאים לחירות בונים עולם חדש!",
            contactUs: "צור קשר",
            privacy: "מדיניות פרטיות",
            lastUpdated: "עודכן לאחרונה: 10/6/24",
            privacySections: [
                {
                    title: "1. כללי",
                    content: "מדיניות פרטיות זו מתארת כיצד יוצאים לחירות, ע\"ר 580802007 (להלן: \"העמותה\", \"אנחנו\"), אוספת, משתמשת, שומרת ומעבירה מידע אישי של משתמשים באתר רכישות קבוצתיות (\"השירות\"). השימוש בשירות ומסירת מידע במסגרתו מהווים הסכמה לתנאי מדיניות זו. המדיניות נכתבה בלשון זכר מטעמי נוחות בלבד ומתייחסת לכל המגדרים."
                },
                {
                    title: "2. איזה מידע אנו אוספים",
                    content: "במסגרת ההצטרפות לקבוצות הרכישה אנו אוספים את המידע הבא:",
                    list: [
                        "שם פרטי ושם משפחה",
                        "מספר טלפון",
                        "כתובת דואר אלקטרוני",
                        "מספר תעודת זהות - נאסף לצורך הצטרפותך לעסקאות הקבוצתיות מול ספקי השירות, אשר מחייבים מסירת מספר זהות לצורך התקשרות חוזית ואספקת השירות",
                        "מידע נוסף שתמסור מרצונך בעת ההצטרפות"
                    ]
                },
                {
                    title: "3. מסירת מידע אינה חובה חוקית",
                    content: "אינך מחויב על פי דין למסור לנו מידע כלשהו. מסירת המידע נעשית מרצונך החופשי ובהסכמתך. עם זאת, ללא מסירת המידע הנדרש - לרבות מספר תעודת זהות - לא נוכל לצרף אותך לחלק מהעסקאות הקבוצתיות שדורשות זאת מצד הספק."
                },
                {
                    title: "4. מטרות השימוש במידע",
                    content: "נשתמש במידע למטרות הבאות בלבד:",
                    list: [
                        "צירופך לקבוצות הרכישה ולעסקאות מול ספקי השירות",
                        "יצירת קשר עמך בנוגע לעסקאות ולפעילות הקבוצה",
                        "העברת הפרטים הנדרשים לספקי השירות לצורך מימוש העסקה",
                        "ניהול תקין של פעילות העמותה",
                        "לא נעשה במידע שימוש למטרה שלא פורטה לעיל ללא הסכמתך."
                    ]
                },
                {
                    title: "5. העברת מידע לצדדים שלישיים",
                    content: "לצורך מימוש העסקאות הקבוצתיות, אנו מעבירים מידע - ובכלל זה מספר תעודת הזהות - לספקי השירות הרלוונטיים שעמם מתקשרת הקבוצה (כגון ספק סלולר, חברת דלק וכיוצא בזה). ההעברה נעשית אך ורק לצורך מימוש העסקה שאליה בחרת להצטרף. אנו עושים מאמץ סביר להעביר מידע רק לספקים המתחייבים לשמור על המידע בהתאם לדין. עם זאת, מרגע שהמידע נמסר לספק, השימוש בו כפוף למדיניות הפרטיות של אותו ספק, ואין לנו שליטה מלאה עליו. לא נמכור, נשכיר או נסחור במידע שלך, ולא נעבירו לגורם אחר זולת ספקי השירות כאמור, אלא אם נידרש לכך על פי דין, צו שיפוטי, או דרישת רשות מוסמכת."
                },
                {
                    title: "6. אבטחת מידע",
                    content: "אנו נוקטים אמצעים סבירים לאבטחת המידע בהתאם לתקנות הגנת הפרטיות (אבטחת מידע), התשע\"ז-2017. עם זאת, אין באפשרותנו להבטיח חסינות מוחלטת מפני חדירה או שימוש לרעה, ואיננו אחראים לנזק שייגרם כתוצאה מאירוע אבטחה שאינו בשליטתנו הסבירה."
                },
                {
                    title: "7. שמירת המידע",
                    content: "נשמור את המידע למשך הזמן הנדרש להגשמת המטרות שלעיל, או כל עוד נדרש על פי דין. בתום התקופה יימחק המידע או יעבור אנונימיזציה."
                },
                {
                    title: "8. זכויותיך לפי חוק",
                    content: "בהתאם לחוק הגנת הפרטיות, התשמ\"א-1981, עומדות לך הזכויות הבאות:",
                    list: [
                        "זכות עיון - לעיין במידע המוחזק עליך במאגר.",
                        "זכות תיקון - לבקש לתקן מידע שאינו נכון, שלם, ברור או מעודכן.",
                        "זכות מחיקה - לבקש את מחיקת המידע, בכפוף לחובות שמירה על פי דין.",
                        "הסרה מרשימת דיוור - לבקש שלא לקבל פניות שיווקיות.",
                        "למימוש זכויותיך ניתן לפנות אלינו בכתובת: freedomhasbegun@gmail.com ונפעל בהתאם להוראות הדין."
                    ]
                },
                {
                    title: "9. דיוור ופניות שיווקיות",
                    content: "ככל שנשלח אליך תוכן שיווקי, נעשה זאת בהתאם לסעיף 30א לחוק התקשורת (בזק ושידורים), התשמ\"ב-1982 (\"חוק הספאם\"), ותהיה רשאי להסיר עצמך מרשימת התפוצה בכל עת."
                },
                {
                    title: "10. שינויים במדיניות",
                    content: "אנו רשאים לעדכן מדיניות זו מעת לעת. המדיניות המעודכנת תפורסם בעמוד זה ותיכנס לתוקף עם פרסומה."
                },
                {
                    title: "11. יצירת קשר",
                    content: "בכל שאלה בנוגע למדיניות זו או לטיפול במידע שלך, ניתן לפנות אל: יוצאים לחירות, דוא\"ל: freedomhasbegun@gmail.com"
                }
            ]
        },
        purchases: {
            cellular: {
                title: "קו הסלולר הזול במדינה!",
                desc: "החל מ-15 ש\"ח לחודש, ללא התחייבות, ללא דמי הצטרפות",
                alt: "סלולר"
            },
            internet: {
                title: "אינטרנט ביתי הזול במדינה!",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "אינטרנט"
            },
            fuel: {
                title: "הנחה בדלק לכל החיים!",
                desc: "הנחה של 31 אגורות על כל ליטר בנזין מהמחיר היציג של סונול כל ימי חייך. ניתן לממש ב-555 תחנות ברחבי הארץ של <strong style=\"color:#fff;font-weight:800\">דור אלון, טן, תפוז וסונול!</strong>",
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
            canJoin: "האם עדיין ניתן להצטרף?",
            saved: "הקבוצה חוסכת מהעסקה:",
            perMonth: 'כל חודש',
            perYear: 'בשנה',
            active: "פעיל",
            yes: "כן",
            no: "לא",
            notStarted: "לא החל",
            closed: "סגור",
            soon: "בקרוב...",
            fuelListOpens: "הרשימה תיפתח ביום רביעי 20/5",
            newBadge: "חדש",
            currency: 'ש"ח'
        },
        satisfaction: {
            title: "סקר שביעות רצון",
            chooseTitle: "סקרי שביעות רצון",
            chooseSubtitle: "לכל מבצע סקר משלו – בחרו מבצע כדי לדרג אותו",
            forCampaign: "סקר שביעות רצון:",
            backToSurveys: "חזרה לרשימת הסקרים",
            notFound: "המבצע המבוקש לא נמצא",
            restrictedTitle: "גישה מוגבלת",
            restrictedMessage: "הסקר מיועד ללקוחות רשומים בלבד. אנא התחבר כדי להשתתף.",
            loginToParticipate: "התחבר להשתתפות",
            question1: "מהי מידת שביעות הרצון שלך מרכישות קבוצתיות?",
            q1Campaign: "מהי מידת שביעות הרצון שלך ממבצע זה?",
            question2: "אילו מוצרים או שירותים נוספים היית רוצה לראות?",
            question3: "הערות נוספות:",
            submit: "שלח סקר",
            thankYou: "תודה על השתתפותך!",
            backToHome: "חזרה לדף הבית"
        },
        details: {
            badge: "מבצע מומלץ",
            overviewTitle: "סקירה כללית",
            statsMembers: "חברים פעילים",
            statsRating: "דירוג ממוצע",
            statsSavings: "חיסכון חודשי ממוצע",
            statsReviews: "ביקורות",
            howItWorks: "איך זה עובד?",
            steps: [
                { icon: "📊", title: "בוחרים תוכנית", desc: "בוחרים את המסלול והחברה הרצויים מתוך טבלת ההשוואה." },
                { icon: "🤝", title: "ממלאים פרטים בטופס", desc: "אנחנו דואגים שנציג יחזור אליכם לתת לכם יחס אישי." },
                { icon: "💸", title: "מתחילים לחסוך", desc: "מצרפים חברים ומשפחה ומגדילים יותר את הכח שלנו." }
            ],
            benefitsTitle: "מה אתם מקבלים?",
            benefits: [
                { icon: "💰", text: "מחיר נמוך משמעותית ממחיר השוק" },
                { icon: "🛡️", text: "ללא התחייבות וללא דמי הצטרפות" },
                { icon: "📞", text: "תמיכה מלאה מצוות הקבוצה" },
                { icon: "🔄", text: "אפשרות לעבור חזרה לספק הנוכחי בכל עת" }
            ],
            faqTitle: "שאלות נפוצות",
            faq: [
                { q: "האם יש דמי חבר?", a: "לא. ההצטרפות לקבוצה ולעסקאות חינמית לחלוטין." },
                { q: "האם המחיר מובטח לכל החיים?", a: "המחיר מובטח לתקופת ההתקשרות המוסכמת מול הספק, בדרך כלל שנה." },
                { q: "מה קורה אם אני לא מרוצה?", a: "ניתן לעבור חזרה לספק הקודם או לכל ספק אחר בכל עת, ללא קנס." }
            ],
            reviewsTitle: "מה החברים אומרים?",
            sampleReviews: [
                { name: "דניאל כ.", stars: 5, text: "חסכון אמיתי כל חודש. המעבר היה פשוט ומהיר." },
                { name: "מירב ל.", stars: 5, text: "הצטרפתי לפני 3 חודשים ואני כבר ממליצה לכל החברים." },
                { name: "אבי ש.", stars: 5, text: "שירות מצוין, התמיכה זמינה ואדיבה." }
            ],
            surveyTitle: "ספרו לנו על החוויה שלכם",
            joinCta: "למילוי הטופס",
            backToHome: "← אל הדף הקודם"
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
            whatsapp: 'Join our shared <span class="hl-whatsapp">WhatsApp</span> group now and be part of the consumer revolution',
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
            soonColon: "Up Next:",
            nextPurchases: "More deals will be added according to the WhatsApp group vote, those who are present decide!"
        },
        footer: {
            clickForActivity: "For all Liberty social movement activities click here:",
            libertyLink: "Liberty building a new world!",
            contactUs: "Contact Us",
            privacy: "Privacy Policy",
            lastUpdated: "Last updated: 10/6/24",
            privacySections: [
                {
                    title: "1. General",
                    content: "This privacy policy describes how Liberty (Yotzim LaCherut), Registered Non-Profit 580802007 (hereinafter: the \"Association\", \"we\"), collects, uses, stores, and transfers personal information of users of the purchasing groups website (the \"Service\"). Use of the Service and provision of information through it constitute consent to the terms of this policy. The policy is written in masculine form for convenience only and applies to all genders."
                },
                {
                    title: "2. What Information We Collect",
                    content: "As part of joining the purchasing groups, we collect the following information:",
                    list: [
                        "First and last name",
                        "Phone number",
                        "Email address",
                        "Israeli ID number (Teudat Zehut) - collected to enable your participation in group transactions with service providers, who require an ID number for contractual engagement and service provision",
                        "Additional information you voluntarily provide upon joining"
                    ]
                },
                {
                    title: "3. Providing Information Is Not a Legal Obligation",
                    content: "You are not legally required to provide us with any information. Information is provided of your own free will and with your consent. However, without providing the required information - including the ID number - we will not be able to enroll you in some of the group transactions that require it on the provider's side."
                },
                {
                    title: "4. Purposes of Information Use",
                    content: "We will use the information only for the following purposes:",
                    list: [
                        "Enrolling you in purchasing groups and transactions with service providers",
                        "Contacting you regarding transactions and group activities",
                        "Transferring required details to service providers for the purpose of executing the transaction",
                        "Proper management of the Association's activities",
                        "We will not use the information for any purpose not specified above without your consent."
                    ]
                },
                {
                    title: "5. Transfer of Information to Third Parties",
                    content: "For the purpose of executing the group transactions, we transfer information - including the ID number - to the relevant service providers with whom the group engages (such as mobile carriers, fuel companies, and so on). The transfer is made solely for the purpose of executing the transaction you have chosen to join. We make reasonable efforts to transfer information only to providers who commit to safeguard it in accordance with the law. However, once the information is provided to a provider, its use is subject to that provider's privacy policy, and we do not have full control over it. We will not sell, rent, or trade your information, and will not transfer it to any other party other than the aforementioned service providers, unless required by law, court order, or a request from a competent authority."
                },
                {
                    title: "6. Information Security",
                    content: "We take reasonable measures to secure information in accordance with the Privacy Protection Regulations (Information Security), 2017. However, we cannot guarantee complete immunity from intrusion or misuse, and we are not responsible for damage caused as a result of a security incident beyond our reasonable control."
                },
                {
                    title: "7. Information Retention",
                    content: "We will retain the information for as long as required to achieve the above purposes, or as long as required by law. At the end of the period, the information will be deleted or anonymized."
                },
                {
                    title: "8. Your Legal Rights",
                    content: "Pursuant to the Privacy Protection Law, 1981, you have the following rights:",
                    list: [
                        "Right of access - to view the information held about you in the database.",
                        "Right of correction - to request correction of information that is inaccurate, incomplete, unclear, or outdated.",
                        "Right of deletion - to request deletion of information, subject to retention obligations under the law.",
                        "Removal from mailing list - to request not to receive marketing communications.",
                        "To exercise your rights, you may contact us at: freedomhasbegun@gmail.com and we will act in accordance with the law."
                    ]
                },
                {
                    title: "9. Marketing Communications",
                    content: "Insofar as we send you marketing content, we will do so in accordance with Section 30A of the Communications Law (Telecommunications and Broadcasts), 1982 (the \"Spam Law\"), and you will be entitled to remove yourself from the mailing list at any time."
                },
                {
                    title: "10. Changes to the Policy",
                    content: "We may update this policy from time to time. The updated policy will be published on this page and will take effect upon publication."
                },
                {
                    title: "11. Contact",
                    content: "For any question regarding this policy or the handling of your information, you may contact: Liberty (Yotzim LaCherut), Email: freedomhasbegun@gmail.com"
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
            active: "Active",
            yes: "Yes",
            no: "No",
            notStarted: "Not started",
            closed: "Closed",
            soon: "Soon...",
            fuelListOpens: "List opens Wednesday 20/5",
            newBadge: "New",
            currency: "ILS"
        },
        satisfaction: {
            title: "Satisfaction Survey",
            chooseTitle: "Satisfaction Surveys",
            chooseSubtitle: "Each campaign has its own survey – pick a campaign to rate it",
            forCampaign: "Satisfaction Survey:",
            backToSurveys: "Back to surveys list",
            notFound: "The requested campaign was not found",
            restrictedTitle: "Restricted Access",
            restrictedMessage: "The survey is for registered customers only. Please login to participate.",
            loginToParticipate: "Login to Participate",
            question1: "How satisfied are you with the group purchases?",
            q1Campaign: "How satisfied are you with this campaign?",
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
            whatsapp: 'Присоединяйтесь к нашей общей группе в <span class="hl-whatsapp">WhatsApp</span> сейчас и станьте частью потребительской революции',
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
            soonColon: "На очереди:",
            nextPurchases: "Новые сделки будут добавлены по результатам голосования в WhatsApp, присутствующие решают!"
        },
        footer: {
            clickForActivity: "Для всех мероприятий общественного движения Свобода нажмите здесь:",
            libertyLink: "Свобода строит новый мир!",
            contactUs: "Связаться с нами",
            privacy: "Политика конфиденциальности",
            lastUpdated: "Последнее обновление: 10/6/24",
            privacySections: [
                {
                    title: "1. Общие положения",
                    content: "Настоящая политика конфиденциальности описывает, как организация 'Свобода' (Yotzim LaCherut), некоммерческая организация 580802007 (далее: 'Организация', 'мы'), собирает, использует, хранит и передает персональную информацию пользователей сайта групповых закупок ('Сервис'). Использование Сервиса и предоставление информации в его рамках означают согласие с условиями данной политики. Политика написана в мужском роде исключительно для удобства и относится ко всем полам."
                },
                {
                    title: "2. Какую информацию мы собираем",
                    content: "В рамках присоединения к группам закупок мы собираем следующую информацию:",
                    list: [
                        "Имя и фамилия",
                        "Номер телефона",
                        "Адрес электронной почты",
                        "Номер удостоверения личности (Teudat Zehut) - собирается для вашего присоединения к групповым сделкам с поставщиками услуг, которые требуют предоставления номера удостоверения личности для заключения договора и оказания услуг",
                        "Дополнительная информация, которую вы добровольно предоставляете при присоединении"
                    ]
                },
                {
                    title: "3. Предоставление информации не является юридической обязанностью",
                    content: "Вы не обязаны по закону предоставлять нам какую-либо информацию. Предоставление информации осуществляется по вашей свободной воле и с вашего согласия. Однако без предоставления необходимой информации - включая номер удостоверения личности - мы не сможем присоединить вас к некоторым групповым сделкам, которые этого требуют со стороны поставщика."
                },
                {
                    title: "4. Цели использования информации",
                    content: "Мы будем использовать информацию только в следующих целях:",
                    list: [
                        "Присоединение вас к группам закупок и сделкам с поставщиками услуг",
                        "Связь с вами по вопросам сделок и деятельности группы",
                        "Передача необходимых данных поставщикам услуг для реализации сделки",
                        "Надлежащее управление деятельностью Организации",
                        "Мы не будем использовать информацию в целях, не указанных выше, без вашего согласия."
                    ]
                },
                {
                    title: "5. Передача информации третьим лицам",
                    content: "Для реализации групповых сделок мы передаем информацию - в том числе номер удостоверения личности - соответствующим поставщикам услуг, с которыми группа заключает договор (таким как операторы мобильной связи, топливные компании и т.д.). Передача осуществляется исключительно с целью реализации сделки, к которой вы решили присоединиться. Мы прилагаем разумные усилия, чтобы передавать информацию только поставщикам, которые обязуются хранить ее в соответствии с законом. Однако с момента передачи информации поставщику ее использование регулируется политикой конфиденциальности этого поставщика, и мы не имеем над ней полного контроля. Мы не будем продавать, сдавать в аренду или торговать вашей информацией, и не будем передавать ее другому лицу, кроме указанных поставщиков услуг, за исключением случаев, когда это требуется по закону, судебному решению или требованию уполномоченного органа."
                },
                {
                    title: "6. Безопасность информации",
                    content: "Мы принимаем разумные меры по обеспечению безопасности информации в соответствии с Положениями о защите конфиденциальности (информационная безопасность), 2017 г. Однако мы не можем гарантировать полную неуязвимость от взлома или неправомерного использования и не несем ответственности за ущерб, причиненный в результате инцидента безопасности, выходящего за пределы нашего разумного контроля."
                },
                {
                    title: "7. Хранение информации",
                    content: "Мы будем хранить информацию в течение времени, необходимого для достижения вышеуказанных целей, или столько, сколько требуется по закону. По истечении этого срока информация будет удалена или обезличена."
                },
                {
                    title: "8. Ваши законные права",
                    content: "В соответствии с Законом о защите конфиденциальности 1981 года вы имеете следующие права:",
                    list: [
                        "Право доступа - просматривать информацию о вас, хранящуюся в базе данных.",
                        "Право на исправление - требовать исправления неточной, неполной, неясной или устаревшей информации.",
                        "Право на удаление - требовать удаления информации с учетом обязательств по хранению согласно закону.",
                        "Удаление из рассылки - просить не получать маркетинговые сообщения.",
                        "Для реализации ваших прав вы можете связаться с нами по адресу: freedomhasbegun@gmail.com, и мы будем действовать в соответствии с законом."
                    ]
                },
                {
                    title: "9. Рассылка и маркетинговые сообщения",
                    content: "Если мы отправим вам маркетинговый контент, мы будем делать это в соответствии со статьей 30A Закона о связи (телекоммуникации и вещание) 1982 г. ('Закон о спаме'), и вы будете иметь право в любое время отписаться от рассылки."
                },
                {
                    title: "10. Изменения в политике",
                    content: "Мы можем время от времени обновлять данную политику. Обновленная политика будет опубликована на этой странице и вступит в силу с момента публикации."
                },
                {
                    title: "11. Контакты",
                    content: "По любым вопросам, касающимся данной политики или обработки вашей информации, вы можете обратиться: 'Свобода' (Yotzim LaCherut), эл. почта: freedomhasbegun@gmail.com"
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
            active: "Активно",
            yes: "Да",
            no: "Нет",
            notStarted: "Не начато",
            closed: "Закрыто",
            soon: "Скоро...",
            fuelListOpens: "Список откроется в среду 20/5",
            newBadge: "Новинка",
            currencyPerYear: "шекелей/год"
        },
        satisfaction: {
            title: "Опрос удовлетворённости",
            chooseTitle: "Опросы удовлетворённости",
            chooseSubtitle: "У каждого предложения свой опрос – выберите предложение для оценки",
            forCampaign: "Опрос удовлетворённости:",
            backToSurveys: "Назад к списку опросов",
            notFound: "Запрашиваемое предложение не найдено",
            restrictedTitle: "Ограниченный доступ",
            restrictedMessage: "Опрос доступен только зарегистрированным клиентам. Пожалуйста, войдите, чтобы участвовать.",
            loginToParticipate: "Войти для участия",
            question1: "Насколько вы довольны групповыми закупками?",
            q1Campaign: "Насколько вы довольны этим предложением?",
            question2: "Какие ещё продукты или услуги вы хотели бы видеть?",
            question3: "Дополнительные комментарии:",
            submit: "Отправить опрос",
            thankYou: "Спасибо за участие!",
            backToHome: "На главную"
        }
    }
});

export const t = derived([lang, translations], ([$lang, $translations]) => {
    /** @type {any} */
    const trans = $translations;
    return trans[$lang];
});
