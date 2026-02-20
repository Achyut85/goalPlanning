const express = require("express");
const router = express.Router();

const { goalPlanningController } = require("../controllers/goalPlanning.js");
const {createUser} = require("../repositories/users.js");
const {createGoal, getGoalsForAnalysis} = require("../repositories/goalPlanning.js")

router.post("/goal-planning", goalPlanningController);

router.get("/test-user", async (req, res) => {
  try {
    const user = await createUser({
      name: "Test",
      email: "test@test.com",
      dateOfBirth: "1995-05-15",  // 👈 ADD THIS
      monthlyIncome: 50000,
      monthlyExpenses: 30000,
      emi: 5000,
      riskProfile: "moderate"
    });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get("/test-goal", async (req, res) => {
  try {
    const goal = await createGoal({
      userId: "6998388bd1105d1db4589d2e",  // 👈 Replace if different
      goalType: "retirement",
      status: "Achievable",
      timeHorizonYears: 20,

      assumptions: {
        inflationRate: 6,
        equityReturnRate: 12,
        debtReturnRate: 7
      },

      allocation: {
        totalGoalAmountFuture: 5000000,
        equityGoalAmount: 3500000,
        debtGoalAmount: 1500000
      },

      strategy: {
        type: "sip",
        equitySip: 10000,
        debtSip: 5000,
        totalSip: 15000,
        totalInvestment: 3600000,
        expectedGain: 1400000
      },

      feasibility: {
        sipAffordable: true,
        shortfall: 0,
        monthlySurplus: 15000
      },

      aiVersion: "v1",
      formulaVersion: "v1"
    });

    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const runTest = async () => {
  const goals = await getGoalsForAnalysis("6998388bd1105d1db4589d2e");
  console.log(goals);
};

runTest();

module.exports = router;
