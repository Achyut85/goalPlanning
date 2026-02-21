const express = require("express");
const router = express.Router();

const { goalPlanningController } = require("../controllers/goalPlanning.js");


router.post("/goal-planning", goalPlanningController);


module.exports = router;
