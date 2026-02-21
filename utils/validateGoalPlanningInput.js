const { validateBySchema } = require("./validation.js");
const {VALID_MODES } = require("../constants/goalPlanning.js")
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

  investmentMode: {
    type: "string",
    required: true,
    custom: (value) => {
      return !VALID_MODES.includes(value?.toLowerCase())
        ? `investmentMode must be one of: ${VALID_MODES.join(", ")}`
        : null;
    }
  },

 
  surplusCheck: {
    virtual: true,
    dependsOn: ["monthlyIncome", "monthlyExpenses", "emi", "investmentMode"],
    custom: (_, data) => {
      const mode = data.investmentMode?.trim()?.toLowerCase();

      // lumpsum has no surplus requirement
      if (!["sip", "hybrid"].includes(mode)) return null;

      const surplus =
        (data.monthlyIncome   ?? 0) -
        (data.monthlyExpenses ?? 0) -
        (data.emi             ?? 0);

      if (surplus < 0) {

        return (
          `Monthly expenses and EMI exceed income. ` +
          `Outflow: ${data.monthlyExpenses + data.emi}, ` +
          `Income: ${data.monthlyIncome}`
        );
      }

      if (surplus === 0) {
      
        return (
          `No investable surplus available after expenses and EMI. ` +
          `Reduce expenses or EMI to free up monthly investment capacity.`
        );
      }

      return null;
    }
  }
};

const rootSchema = {
  goal: {
    type: "object",
    required: true,
    schema: (goal) => {
      const type = goal?.type?.trim()?.toLowerCase();
      return type === "retirement"
        ? retirementGoalSchema
        : defaultGoalSchema;
    }
  },
  finance: {
    type: "object",
    required: true,
    schema: financeSchema
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

module.exports = { validateGoalPlanningInput };


