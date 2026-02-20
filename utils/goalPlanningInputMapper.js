

const mapGoalData = (goal) => {
  const type = goal.type.trim().toLowerCase()
  if (type === "retirement") {
    return {
      goal_name: "Retirement",
      current_age: goal.currentAge,
      retirement_age: goal.retirementAge,
      life_expectancy: goal.lifeExpectancy,
      target_monthly_amount: goal.targetMonthlyAmount
    };
  }

  // Other goals
  return {
    goal_name: type,
    time_horizon_years: goal.timeHorizonYears,
    target_goal_amount: goal.targetAmount
  };
};



const mapFinanceData = (finance) => {
  return {
    monthly_income: finance.monthlyIncome,
    monthly_expenses: finance.monthlyExpenses,
    emi: finance.emi,
    current_savings: finance.currentSavings,
    required_emergency_fund: finance.emergencyFundRequired
  };
};



const buildPromptInput = (requestBody , riskProfile, currentInflation) => {
  const { goal, finance } = requestBody;

  const mappedGoal = mapGoalData(goal);
  const mappedFinance = mapFinanceData(finance);


  const risk_profile = riskProfile;  
  const inflation_rate = currentInflation;

  const finalObject = {
    ...mappedGoal,
    ...mappedFinance,
    risk_profile,
    inflation_rate
  };

  return Object.entries(finalObject)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
};




module.exports = {
    buildPromptInput,
};


