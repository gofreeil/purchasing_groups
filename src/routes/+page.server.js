const CELLULAR_SHEET_ID = "18V5IdtRiN3dKo7habggKP5e55_xJPci158aJVuuWXVw";
const CELLULAR_GID = "2146350168";

const FUEL_SHEET_ID = "1ai8g7KRudXXXgoesfCliMqVV427pJqHxR54Avsx5Zgs";
const FUEL_GID = "732534558";

// ערכי ברירת מחדל אם טעינת הגיליון נכשלת
const DEFAULT_ANNUAL = 79854;
const DEFAULT_MONTHLY = 465;
const DEFAULT_FUEL_MONTHLY = 570;
const DEFAULT_FUEL_ANNUAL = 6840;

export async function load({ fetch }) {
    let annualSavings = DEFAULT_ANNUAL;
    let monthlySavings = DEFAULT_MONTHLY;
    let fuelMonthlySavings = DEFAULT_FUEL_MONTHLY;
    let fuelAnnualSavings = DEFAULT_FUEL_ANNUAL;

    // --- חיסכון סלולר (תאי Z2/Z3) ---
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CELLULAR_SHEET_ID}/export?format=csv&gid=${CELLULAR_GID}`;
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
        console.error("Failed to load cellular savings from Google Sheet:", error);
    }

    // --- חיסכון דלק (תא I4 - חיסכון חודשי; שנתי = חודשי * 12) ---
    try {
        const url = `https://docs.google.com/spreadsheets/d/${FUEL_SHEET_ID}/export?format=csv&gid=${FUEL_GID}`;
        const response = await fetch(url);
        if (response.ok) {
            const rows = (await response.text()).split("\n");
            // תא I4: שורה 4 (אינדקס 3), עמודה I (אינדקס 8) - חיסכון חודשי דלק
            const fuelMonthly = parseInt(
                (rows[3]?.split(",")[8] || "").replace(/[^\d]/g, ""),
            );
            if (!isNaN(fuelMonthly) && fuelMonthly > 0) {
                fuelMonthlySavings = fuelMonthly;
                fuelAnnualSavings = fuelMonthly * 12;
            }
        }
    } catch (error) {
        console.error("Failed to load fuel savings from Google Sheet:", error);
    }

    return { annualSavings, monthlySavings, fuelMonthlySavings, fuelAnnualSavings };
}
