
const {buildGoalPrompt } = require("../services/buildGoalPrompt") 
const requestBody = {
  goal: {
    type: "Retirement",
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 85,
    targetMonthlyAmount: 50000,
  },
  finance: {
    monthlyIncome: 100000,
    monthlyExpenses: 40000,
    emi: 10000,
    currentSavings: 200000,
    emergencyFundRequired: 120000,
    investmentMode:"sip"

  },
};
console.log(buildGoalPrompt(requestBody , "moderate", 0.06));


