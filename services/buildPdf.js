const { generatePlanPdf } = require("../utils/generatePlanPdf");

const buildPdf = async ({ planData, pTitle, client, gKey, ans }) => {
    if (!gKey)     throw new Error("gKey is required.");
    if (!planData) throw new Error("planData is required.");

    return generatePlanPdf({ planData, pTitle, client, gKey, ans });
};

module.exports = { buildPdf };