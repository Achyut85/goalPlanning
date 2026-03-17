const { validateBySchema } = require("./validation.js");
const { RISK_PROFILES, GOAL_TYPES } = require("../constants/goalPlanning.js");

/* ─── BASE SCHEMA — applies to every goal ─────────────────────── */
const baseSchema = {
  goal_type: {
    type: "string",
    required: true,
    custom: (v) =>
      !GOAL_TYPES.includes(v)
        ? `goal_type must be one of: ${GOAL_TYPES.join(" | ")}`
        : null,
  },
  risk_profile: {
    type: "string",
    required: true,
    custom: (v) =>
      !RISK_PROFILES.includes(v)
        ? `risk_profile must be one of: ${RISK_PROFILES.join(" | ")}`
        : null,
  },
  monthly_income:        { type: "positive",    required: true  },
  monthly_expenses:      { type: "nonNegative", required: true  },
  current_savings:       { type: "nonNegative", required: true  },
  emergency_fund_months: { type: "nonNegative", required: true  },
  has_loan:              { type: "boolean",     required: false },
  total_monthly_emi:     { type: "nonNegative", required: false },
  total_outstanding_loan:{ type: "nonNegative", required: false },
};

/* ─── GOAL-SPECIFIC SCHEMAS — merged on top of base ──────────── */

const retirementSchema = {
  current_age: {
    type: "positive",
    required: true,
    custom: (v) =>
      !Number.isInteger(v) || v < 18 || v > 80
        ? "current_age must be an integer between 18 and 80"
        : null,
  },
  retirement_age: {
    type: "positive",
    required: true,
    dependsOn: ["current_age"],
    custom: (v, data) =>
      v <= data.current_age
        ? `retirement_age (${v}) must be greater than current_age (${data.current_age})`
        : v - data.current_age < 5
        ? "At least 5 years needed between current_age and retirement_age"
        : null,
  },
  life_expectancy: {
    type: "positive",
    required: true,
    dependsOn: ["retirement_age"],
    custom: (v, data) => {
      if (!Number.isInteger(v) || v < 60 || v > 120)
        return "life_expectancy must be an integer between 60 and 120";
      if (v <= data.retirement_age)
        return `life_expectancy (${v}) must be greater than retirement_age (${data.retirement_age})`;
      return null;
    },
  },
  target_monthly_income: { type: "positive", required: true },
};

const houseSchema = {
  // normaliser computes target_amount_today = propertyValue × downPaymentPct / 100
  target_amount_today: { type: "positive", required: true },
  horizon_years: {
    type: "positive",
    required: true,
    custom: (v) => v < 1 ? "horizon_years must be at least 1" : null,
  },
};

const emergencySchema = {
  // normaliser maps: monthlyExpense → monthly_expenses (overrides base)
  //                  targetMonths  → target_months
  //                  existingMonths → existing_coverage_months
  // NOTE: monthly_expenses is already in baseSchema — the override here
  //       tightens it to "positive" (must be > 0 for emergency corpus calc)
  monthly_expenses: { type: "positive", required: true },
  target_months: {
    type: "positive",
    required: true,
    custom: (v) =>
      !Number.isInteger(v) || v < 1 || v > 24
        ? "target_months must be an integer between 1 and 24"
        : null,
  },
  existing_coverage_months: {
    type: "nonNegative",
    required: true,
    dependsOn: ["target_months"],
    custom: (v, data) =>
      v >= data.target_months
        ? `existing_coverage_months (${v}) must be less than target_months (${data.target_months})`
        : null,
  },
};

// marriage, education, vacation, wealth, business
const defaultSchema = {
  target_amount_today: { type: "positive", required: true },
  horizon_years: {
    type: "positive",
    required: true,
    custom: (v) => v < 1 ? "horizon_years must be at least 1" : null,
  },
};

/* ─── SCHEMA SELECTOR ─────────────────────────────────────────── */
const getGoalSchema = (goalType) => {
  switch (goalType) {
    case "retirement": return retirementSchema;
    case "house":      return houseSchema;
    case "emergency":  return emergencySchema;
    default:           return defaultSchema;
  }
};

/* ─── MAIN VALIDATOR ──────────────────────────────────────────── */
const validateGoalPlanningInput = (input, stopOnFirstError = false) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      valid: false,
      errors: [{ path: "root", code: "INVALID_OBJECT", message: "Valid input object is required" }],
    };
  }

  const goalType =
    typeof input.goal_type === "string"
      ? input.goal_type.trim().toLowerCase()
      : null;

  const goalSchema =
    goalType && GOAL_TYPES.includes(goalType) ? getGoalSchema(goalType) : {};

  // goal-specific schema merged after base — goal fields override base where keys overlap
  const mergedSchema = { ...baseSchema, ...goalSchema };

  const errors = [];
  validateBySchema(input, mergedSchema, "", errors, stopOnFirstError);

  return { valid: errors.length === 0, errors };
};

module.exports = { validateGoalPlanningInput };