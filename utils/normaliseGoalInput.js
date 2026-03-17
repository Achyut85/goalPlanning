function normaliseGoalInput(goalType, input) {
  const num = (k) => +(String(input[k] || "0").replace(/,/g, "")) || 0;
 
  const riskMap = {
    conservative:        "conservative",
    moderate:            "moderate",
    aggressive:          "aggressive",
    "very conservative": "very_conservative",
    "very aggressive":   "very_aggressive",
  };
  const risk    = riskMap[(input.riskAppetite || "moderate").toLowerCase()] || "moderate";
  const hasLoan = input.hasLoan === "yes";
 
  const base = {
    goal_type:              goalType,
    risk_profile:           risk,
    monthly_income:         num("monthlyIncome"),
    monthly_expenses:       num("monthlyExpenses"),
    current_savings:        num("currentSavings"),
    emergency_fund_months:  num("emergencyFundMonths"),
    has_loan:               hasLoan,
    total_monthly_emi:      hasLoan ? num("loanEmi")         : 0,
    total_outstanding_loan: hasLoan ? num("loanOutstanding") : 0,
  };
 
  if (goalType === "retirement") return {
    ...base,
    current_age:           num("currentAge"),
    retirement_age:        num("retirementAge"),
    life_expectancy:       num("lifeExpectancy"),
    target_monthly_income: num("targetMonthlyIncome"),
  };
 
  if (goalType === "house") {
    const pv = num("propertyValue");
    const dp = num("downPaymentPct") || 20;
    return {
      ...base,
      target_amount_today: Math.round(pv * dp / 100), // SIP target = down payment only
      horizon_years:       num("timeHorizon"),
    };
  }
 
  if (goalType === "emergency") return {
    ...base,
    monthly_expenses:         num("monthlyExpense"), // singular key from frontend
    target_months:            num("targetMonths"),
    existing_coverage_months: num("existingMonths"),
  };
 
  // marriage, education, vacation, wealth, business
  return {
    ...base,
    target_amount_today: num("targetAmount"),
    horizon_years:       num("timeHorizon"),
  };
}

module.exports = {normaliseGoalInput};