import { error } from '@sveltejs/kit';

const CAMPAIGNS = [
    'cellular',
    'internet',
    'fuel',
    'carInsurance',
    'electricity',
    'coupons'
];

const CELLULAR_SHEET_ID = "18V5IdtRiN3dKo7habggKP5e55_xJPci158aJVuuWXVw";
const CELLULAR_GID = "2146350168";

const FUEL_SHEET_ID = "1ai8g7KRudXXXgoesfCliMqVV427pJqHxR54Avsx5Zgs";
const FUEL_GID = "732534558";

const DEFAULT_MEMBERS = {
    cellular: 312,
    fuel: 198,
};

export async function load({ params, fetch }) {
    if (!CAMPAIGNS.includes(params.campaign)) {
        throw error(404, 'Campaign not found');
    }

    let activeMembers = DEFAULT_MEMBERS[params.campaign] ?? 0;

    if (params.campaign === 'cellular') {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${CELLULAR_SHEET_ID}/export?format=csv&gid=${CELLULAR_GID}`;
            const response = await fetch(url);
            if (response.ok) {
                const rows = (await response.text()).split("\n");
                // תא Y2 = שורה 2 (אינדקס 1), עמודה Y (אינדקס 24) - מספר קווים
                const value = parseInt(
                    (rows[1]?.split(",")[24] || "").replace(/[^\d]/g, ""),
                );
                if (!isNaN(value) && value > 0) activeMembers = value;
            }
        } catch (err) {
            console.error("Failed to load cellular members from sheet:", err);
        }
    } else if (params.campaign === 'fuel') {
        try {
            const url = `https://docs.google.com/spreadsheets/d/${FUEL_SHEET_ID}/export?format=csv&gid=${FUEL_GID}`;
            const response = await fetch(url);
            if (response.ok) {
                const rows = (await response.text()).split("\n");
                // תא F4 = שורה 4 (אינדקס 3), עמודה F (אינדקס 5) - מספר משתתפים בקבוצת הדלק
                const value = parseInt(
                    (rows[3]?.split(",")[5] || "").replace(/[^\d]/g, ""),
                );
                if (!isNaN(value) && value > 0) activeMembers = value;
            }
        } catch (err) {
            console.error("Failed to load fuel members from sheet:", err);
        }
    }

    return { campaign: params.campaign, activeMembers };
}
