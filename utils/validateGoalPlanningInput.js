const { validateBySchema } = require("./validation.js");

const RISK_PROFILES = [
  "very conservative",
  "conservative",
  "moderate",
  "aggressive",
  "very aggressive"
];


const retirementGoalSchema = {
  type: { type: "string", required: true },

  currentAge: { type: "adultAge", required: true },

  retirementAge: {
    type: "adultAge",
    required: true,
    dependsOn: ["currentAge"],
    custom: (value, data) =>
      value <= data.currentAge
        ? `Retirement age (${value}) must be greater than current age (${data.currentAge})`
        : null
  },

  lifeExpectancy: {
    type: "adultAge",
    required: true,
    dependsOn: ["retirementAge"],
    custom: (value, data) =>
      value <= data.retirementAge
        ? `Life expectancy (${value}) must be greater than retirement age (${data.retirementAge})`
        : null
  },

  targetMonthlyAmount: {
    type: "positive",
    required: true
  }
};

const defaultGoalSchema = {
  type: { type: "string", required: true },

  timeHorizonYears: {
    type: "positive",
    required: true,
    min: 1
  },

  targetAmount: {
    type: "positive",
    required: true
  }
};



const financeSchema = {
  monthlyIncome:         { type: "positive",    required: true },
  monthlyExpenses:       { type: "nonNegative", required: true },
  emi:                   { type: "nonNegative", required: true },
  currentSavings:        { type: "nonNegative", required: true },
  emergencyFundRequired: { type: "nonNegative", required: true },
};


const rootSchema = {
  goal: {
    type: "object",
    required: true,
    schema: (goal = {}) => {
      const type =
        typeof goal.type === "string"
          ? goal.type.trim().toLowerCase()
          : undefined;

      return type === "retirement"
        ? retirementGoalSchema
        : defaultGoalSchema;
    }
  },

  finance: {
    type: "object",
    required: true,
    schema: financeSchema
  },

 riskProfile: {
  type: "string",
  required: true,
  custom: (v) => {
    return !RISK_PROFILES.includes(v)
      ? `riskProfile must be one of: ${valid.join(" | ")}`
      : null;
  }
}
};



const validateGoalPlanningInput = (
  userInput,
  stopOnFirstError = false
) => {
  const errors = [];

  if (
    !userInput ||
    typeof userInput !== "object" ||
    Array.isArray(userInput)
  ) {
    return {
      valid: false,
      errors: [{
        path: "root",
        code: "INVALID_OBJECT",
        message: "Valid input object is required"
      }]
    };
  }

  validateBySchema(userInput, rootSchema, "", errors, stopOnFirstError);

  return {
    valid: errors.length === 0,
    errors
  };
};

module.exports = {
  validateGoalPlanningInput
};