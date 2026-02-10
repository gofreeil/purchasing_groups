import { writable, readable, derived } from 'svelte/store';

export const lang = writable('he');

export const translations = readable({
    he: {
        title: "רכישות קבוצתיות יוצאים לחירות",
        subtitle: "הצטרף והוזל עכשיו את ההוצאות החודשיות שלך",
        addOffer: "+ הוסף הצעה",
        login: "התחברות",
        logoAlt: "לוגו",
        sidebar: {
            whatsapp: "הצטרף עכשיו לקבוצת הווצאפ השקטה שלנו כדי להיות שותף בהנחות החודשיות",
            neighborhoods: "הצטרף לפרוייקט ועדי השכונות לקידום חברה מתוקנת שבה העם שולט על מוסדותיו",
            craftsmen: "רוצה הנחה אצל בעלי מקצוע כשירים?",
            investments: "השקעות קבוצתיות בעסקים ונדל\"ן",
            sponsored: "תוכן שיווקי",
            yourAdHere: "מקום פרסום זה יכול להיות שלך",
            advertise: "רוצים לפרסם כאן?",
            contact: "צור קשר"
        },
        homepage: {
            title: "עמוד הבית | רכישות קבוצתיות יוצאים לחירות",
            features: [
                "ההנחה משמעותית בכל ההוצאות החודשיות.",
                "התארגנות לכרטיס מועדון עם הנחות בחנויות המותגים.",
                "התארגנות לרכישת ירקות ופירות היישר מהחקלאי עד לשכונה.",
                "שמירה על זכות המזומן וייעול השימוש בו."
            ],
            membersCount: "חברים בקבוצה",
            ourPurchases: "הרכישות הקבוצתיות שלנו:",
            nextPurchases: "עסקאות נוספות יצטרפו לפי ההצבעה בקבוצת הווצאפ, מי שנוכח קובע!"
        },
        footer: {
            clickForActivity: "לכלל פעילות התנועה החברתית יוצאים לחירות הקלק:",
            libertyLink: "יוצאים לחירות בונים עולם חדש!",
            contactUs: "צור קשר",
            privacy: "מדיניות פרטיות"
        },
        purchases: {
            cellular: {
                title: "קו הסלולר הזול במדינה בהתחייבות!",
                desc: "החל מ-15 ש\"ח לחודש. השאר את הפרטים בטופס ותהנה מהנחה ייחודית רק לנו!",
                alt: "סלולר"
            },
            internet: {
                title: "אינטרנט ביתי הזול במדינה בהתחייבות!",
                desc: "צוותנו פועלים לאתר את העסקה המשתלמת ביותר עבורנו.",
                alt: "אינטרנט"
            },
            fuel: {
                title: "הנחה בדלק!",
                desc: "צוותנו פועלים לאתר הנחה לתנועה החברתית שלנו!",
                alt: "דלק"
            },
            carInsurance: {
                title: "ביטוח רכב הזול במדינה בהתחייבות!",
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
            saved: "חסכנו מהעסקה:",
            done: "בוצע",
            yes: "כן",
            no: "לא",
            soon: "בקרוב...",
            currencyPerYear: 'ש"ח לשנה'
        }
    },
    en: {
        title: "Liberty Purchasing Groups",
        subtitle: "Join and reduce your monthly expenses now",
        addOffer: "+ Add Offer",
        login: "Login",
        logoAlt: "Logo",
        sidebar: {
            whatsapp: "Join our silent WhatsApp group now to participate in monthly discounts",
            neighborhoods: "Join the Neighborhood Committees project to promote a corrected society where the people control their institutions",
            craftsmen: "Want a discount with qualified professionals?",
            investments: "Group investments in business and real estate",
            sponsored: "Sponsored Content",
            yourAdHere: "This advertising space could be yours",
            advertise: "Want to advertise here?",
            contact: "Contact us"
        },
        homepage: {
            title: "Home | Liberty Purchasing Groups",
            features: [
                "Significant discount on all monthly expenses.",
                "Organizing a club card with discounts at brand stores.",
                "Organizing for purchasing vegetables and fruits directly from the farmer to the neighborhood.",
                "Preserving the right to cash and optimizing its use."
            ],
            membersCount: "Group Members",
            ourPurchases: "Our Purchasing Groups:",
            nextPurchases: "More deals will be added according to the WhatsApp group vote, those who are present decide!"
        },
        footer: {
            clickForActivity: "For all social movement activities Liberty click:",
            libertyLink: "Liberty building a new world!",
            contactUs: "Contact Us",
            privacy: "Privacy Policy"
        },
        purchases: {
            cellular: {
                title: "Cheapest mobile line in the country guaranteed!",
                desc: "Starting from 15 ILS per month. Leave details in the form and enjoy a unique discount just for us!",
                alt: "Cellular"
            },
            internet: {
                title: "Cheapest home internet in the country guaranteed!",
                desc: "Our team is working to find the most profitable deal for us.",
                alt: "Internet"
            },
            fuel: {
                title: "Fuel Discount!",
                desc: "Our team is working to find a discount for our social movement!",
                alt: "Fuel"
            },
            carInsurance: {
                title: "Cheapest car insurance in the country guaranteed!",
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
            saved: "Saved from deal:",
            done: "Done",
            yes: "Yes",
            no: "No",
            soon: "Soon...",
            currencyPerYear: "ILS/year"
        }
    },
    ru: {
        title: "Группы Закупок Свобода",
        subtitle: "Присоединяйтесь и сократите свои ежемесячные расходы сейчас",
        addOffer: "+ Добавить предложение",
        login: "Войти",
        logoAlt: "Логотип",
        sidebar: {
            whatsapp: "Присоединяйтесь к нашей тихой группе в WhatsApp сейчас, чтобы участвовать в ежемесячных скидках",
            neighborhoods: "Присоединяйтесь к проекту Районных комитетов для продвижения исправленного общества, где народ контролирует свои институты",
            craftsmen: "Хотите скидку у квалифицированных специалистов?",
            investments: "Групповые инвестиции в бизнес и недвижимость",
            sponsored: "Рекламный контент",
            yourAdHere: "Это рекламное место может быть вашим",
            advertise: "Хотите разместить рекламу здесь?",
            contact: "Связаться с нами"
        },
        homepage: {
            title: "Главная | Группы Закупок Свобода",
            features: [
                "Значительная скидка на все ежемесячные расходы.",
                "Организация клубной карты со скидками в брендовых магазинах.",
                "Организация закупки овощей и фруктов напрямую от фермера в район.",
                "Сохранение права на наличные и оптимизация их использования."
            ],
            membersCount: "Участников в группе",
            ourPurchases: "Наши группы закупок:",
            nextPurchases: "Новые сделки будут добавлены по результатам голосования в WhatsApp, присутствующие решают!"
        },
        footer: {
            clickForActivity: "Для всех мероприятий общественного движения Свобода нажмите:",
            libertyLink: "Свобода строит новый мир!",
            contactUs: "Связаться с нами",
            privacy: "Политика конфиденциальности"
        },
        purchases: {
            cellular: {
                title: "Самая дешевая мобильная связь в стране гарантирована!",
                desc: "От 15 шекелей в месяц. Оставьте данные в форме и получите уникальную скидку только для нас!",
                alt: "Мобильная связь"
            },
            internet: {
                title: "Самый дешевый домашний интернет в стране гарантирован!",
                desc: "Наша команда работает над поиском наиболее выгодного предложения для нас.",
                alt: "Интернет"
            },
            fuel: {
                title: "Скидка на топливо!",
                desc: "Наша команда работает над поиском скидки для нашего общественного движения!",
                alt: "Топливо"
            },
            carInsurance: {
                title: "Самая дешевая страховка автомобиля в стране гарантирована!",
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
