const express = require("express");
const router = express.Router();

const { goalPlanningController } = require("../controllers/goalPlanning.js");
const {generatePdf } = require("../controllers/generatePdf.js")

router.post("/goal-planning", goalPlanningController);
router.post("/goal-planning/pdf",generatePdf);


module.exports = router;
