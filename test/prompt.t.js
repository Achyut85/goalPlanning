
const {buildGoalPrompt } = require("../services/buildGoalPrompt") 
const requestBody = {
  goal: {
    type: "Retirement",
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 90,
    targetMonthlyAmount: 60000,
  },
  finance: {
    monthlyIncome: 100000,
    monthlyExpenses: 50000,
    emi: 10000,
    currentSavings: 300000,
    emergencyFundRequired: 120000,
  },
};
console.log(buildGoalPrompt(requestBody , "moderate", 0.06));