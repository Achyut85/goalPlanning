const { buildPdf } = require("../services/buildPdf");



const generatePdf = async (req, res) => {
    try {
        const { planData, pTitle, client, gKey, ans } = req.body;

        if (!planData || !gKey)
            return res.status(400).json({ error: "planData and gKey are required." });

        const pdfBuffer = await buildPdf({ planData, pTitle, client, gKey, ans });

      
        const safeFilename = (pTitle || "goal-plan")
            .replace(/[^\w\s-]/g, "")   
            .replace(/\s+/g, "-")       
            .replace(/-+/g, "-")         
            .trim()
            || "goal-plan";              

        res.set({
            "Content-Type":        "application/pdf",
            "Content-Disposition": `attachment; filename="${safeFilename}.pdf"`,
            "Content-Length":      pdfBuffer.length,
        });
        return res.send(pdfBuffer);

    } catch (err) {
        console.error("[generatePdf]", err.message);
        return res.status(500).json({ error: "Failed to generate PDF.", detail: err.message });
    }
}

module.exports = { generatePdf };