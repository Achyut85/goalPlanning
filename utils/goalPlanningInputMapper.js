

const mapGoalData = (goal = {}) => {
  const type =
    typeof goal.type === "string"
      ? goal.type.trim().toLowerCase()
      : "unknown";

  if (type === "retirement") {
    return {
      goal_name: "Retirement",
      current_age: goal.currentAge,
      retirement_age: goal.retirementAge,
      life_expectancy: goal.lifeExpectancy,
      target_monthly_amount: goal.targetMonthlyAmount,
    };
  }

  return {
    goal_name: type,
    time_horizon_years: goal.timeHorizonYears,
    target_goal_amount: goal.targetAmount
  };
};




const mapFinanceData = (finance = {}) => {
  return {
    monthly_income: finance.monthlyIncome,
    monthly_expenses: finance.monthlyExpenses,
    emi: finance.emi,
    current_savings: finance.currentSavings,
    required_emergency_fund: finance.emergencyFundRequired
  };
};




const mapRiskProfile = (riskProfile) => {
  return {
    risk_profile:
      typeof riskProfile === "string"
        ? riskProfile.toLowerCase()
        : undefined
  };
};




const mapSystemData = (system = {}) => {
  return {
    surplus: system.surplus,
    inflation_rate: system.inflationRate,
    investment_mode: system.investmentMode
  };
};




const buildPromptInput = (enrichedInput) => {

  const { goal, finance, riskProfile, system } = enrichedInput;

  const finalObject = {
    ...mapGoalData(goal),
    ...mapFinanceData(finance),
    ...mapRiskProfile(riskProfile),
    ...mapSystemData(system)
  };

  return Object.entries(finalObject)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};

module.exports = {
  buildPromptInput,
};