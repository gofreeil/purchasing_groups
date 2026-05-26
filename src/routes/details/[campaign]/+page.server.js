import { error } from '@sveltejs/kit';

const CAMPAIGNS = [
    'cellular',
    'internet',
    'fuel',
    'carInsurance',
    'electricity',
    'coupons'
];

const SHEET_ID = "18V5IdtRiN3dKo7habggKP5e55_xJPci158aJVuuWXVw";
const GID = "2146350168";

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
            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
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
    }

    return { campaign: params.campaign, activeMembers };
}
