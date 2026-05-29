const SHEET_ID = "18V5IdtRiN3dKo7habggKP5e55_xJPci158aJVuuWXVw";
const GID = "2146350168";

// ערכי ברירת מחדל אם טעינת הגיליון נכשלת
const DEFAULT_ANNUAL = 79854;
const DEFAULT_MONTHLY = 465;

export async function load({ fetch }) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

    let annualSavings = DEFAULT_ANNUAL;
    let monthlySavings = DEFAULT_MONTHLY;

    try {
        const response = await fetch(url);
        if (response.ok) {
            const rows = (await response.text()).split("\n");
            if (rows.length > 2) {
                // תא Z3: שורה 3 (אינדקס 2), עמודה Z (אינדקס 25) - חיסכון שנתי
                const annual = parseInt(
                    (rows[2].split(",")[25] || "").replace(/[^\d]/g, ""),
                );
                if (!isNaN(annual)) annualSavings = annual;

                // תא Z2: שורה 2 (אינדקס 1), עמודה Z (אינדקס 25) - חיסכון חודשי
                const monthly = parseInt(
                    (rows[1].split(",")[25] || "").replace(/[^\d]/g, ""),
                );
                if (!isNaN(monthly)) monthlySavings = monthly;
            }
        }
    } catch (error) {
        console.error("Failed to load savings from Google Sheet:", error);
    }

    return { annualSavings, monthlySavings };
}
