
const { validateBySchema } = require("./validation.js");

const {INVESTMENT_MODE , VALID_MODES} = require("../constants/goalPlanning.js")
const isApproximatelyEqual = (a, b, tolerance = 0.1) =>
  Math.abs(a - b) <= tolerance;




const validateFinancialIntegrity = (output, mode) => {
  const errors = [];
  const m = mode?.trim()?.toLowerCase();

  // SIP MODE
  if (m === INVESTMENT_MODE.SIP && output.sip) {
    if (!isApproximatelyEqual(
      output.sip.equity_sip + output.sip.debt_sip,
      output.sip.total_sip
    )) {
      errors.push({
        path: "sip.total_sip",
        code: "MATH_ERROR",
        message: "equity_sip + debt_sip must equal total_sip",
      });
    }
  }

  // LUMPSUM MODE
  if (m === INVESTMENT_MODE.LUMPSUM && output.lumpsum) {
    if (!isApproximatelyEqual(
      output.lumpsum.equity_lumpsum + output.lumpsum.debt_lumpsum,
      output.lumpsum.total_lumpsum
    )) {
      errors.push({
        path: "lumpsum.total_lumpsum",
        code: "MATH_ERROR",
        message: "equity_lumpsum + debt_lumpsum must equal total_lumpsum",
      });
    }
  }

  // HYBRID MODE
  if (m === INVESTMENT_MODE.HYBRID && output.goal?.status !== "Not Achievable") {

    if (output.lumpsum &&
      !isApproximatelyEqual(
        output.lumpsum.equity_lumpsum + output.lumpsum.debt_lumpsum,
        output.lumpsum.total_lumpsum
      )) {
      errors.push({
        path: "lumpsum.total_lumpsum",
        code: "MATH_ERROR",
        message: "Hybrid lumpsum components mismatch",
      });
    }

    if (output.hybrid &&
      !isApproximatelyEqual(
        output.hybrid.equity_remaining + output.hybrid.debt_remaining,
        output.hybrid.total_remaining
      )) {
      errors.push({
        path: "hybrid.total_remaining",
        code: "MATH_ERROR",
        message: "Hybrid remaining components mismatch",
      });
    }
  }

  return errors;
};




const amountsSchema = {
  total_goal_amount_future: { type: "nonNegative", required: true },
  equity_goal_amount: { type: "nonNegative", required: true },
  debt_goal_amount: { type: "nonNegative", required: true },
};

const returnsSchema = {
  equity_return_rate: { type: "nonNegative", required: true },
  debt_return_rate: { type: "nonNegative", required: true },
};

const goalAchievableSchema = {
  type: { type: "string", required: true },
  status: {
    type: "string", required: true,
    custom: (v) =>
      v !== "Achievable"
        ? `goal.status must be "Achievable"` : null,
  },
  suggest: { type: "string", required: true },
};

const goalNotAchievableSchema = {
  type: { type: "string", required: true },
  status: {
    type: "string", required: true,
    custom: (v) =>
      v !== "Not Achievable"
        ? `goal.status must be "Not Achievable"` : null,
  },
  suggest: { type: "string", required: true },
};

const goalHybridSchema = {
  type: { type: "string", required: true },
  status: {
    type: "string", required: true,
    custom: (v) =>
      !["Achievable", "Partially Achievable", "Not Achievable"].includes(v)
        ? `goal.status must be "Achievable", "Partially Achievable" or "Not Achievable"`
        : null,
  },
  recommended_strategy: {
    type: "string", required: true,
    custom: (v) => {
      const valid = ["SIP + Lumpsum Hybrid", "Lumpsum Only"];
      return !valid.includes(v)
        ? `recommended_strategy must be one of: ${valid.join(" | ")}`
        : null;
    },
  },
  suggest: { type: "string", required: true },
};

const sipAchievableSchema = {
  goal: { type: "object", required: true, schema: goalAchievableSchema },
  time_horizon_years: { type: "positive", required: true },
  amounts: { type: "object", required: true, schema: amountsSchema },
  sip: {
    type: "object", required: true,
    schema: {
      equity_sip: { type: "positive", required: true },
      debt_sip: { type: "positive", required: true },
      total_sip: { type: "positive", required: true },
      total_investment: { type: "positive", required: true },
      expected_gain: { type: "nonNegative", required: true },
    },
  },
  returns: { type: "object", required: true, schema: returnsSchema },
  inflation_rate: { type: "nonNegative", required: true },
};

const sipNotAchievableSchema = {
  goal: { type: "object", required: true, schema: goalNotAchievableSchema },
};

const lumpsumAchievableSchema = {
  goal: { type: "object", required: true, schema: goalAchievableSchema },
  time_horizon_years: { type: "positive", required: true },
  amounts: { type: "object", required: true, schema: amountsSchema },
  lumpsum: {
    type: "object", required: true,
    schema: {
      equity_lumpsum: { type: "positive", required: true },
      debt_lumpsum: { type: "positive", required: true },
      total_lumpsum: { type: "positive", required: true },
      expected_gain: { type: "nonNegative", required: true },
    },
  },
  returns: { type: "object", required: true, schema: returnsSchema },
  inflation_rate: { type: "nonNegative", required: true },
};

const lumpsumNotAchievableSchema = {
  goal: { type: "object", required: true, schema: goalNotAchievableSchema },
};

const hybridOutputSchema = {
  goal: { type: "object", required: true, schema: goalHybridSchema },
  time_horizon_years: { type: "positive", required: true },

  feasibility: {
    type: "object", required: true,
    schema: {
      sip_affordable: { type: "boolean", required: true },
      lumpsum_affordable: {
        type: "boolean",
        required: true,
        custom: (v) => v !== true ? "lumpsum_affordable must always be true in hybrid mode" : null
      },
    },
  },


  amounts: { type: "object", required: true, schema: amountsSchema },

  sip: {
    type: "object", required: true,
    schema: {
      equity_sip: { type: "nonNegative", required: true },
      debt_sip: { type: "nonNegative", required: true },
      total_sip: { type: "nonNegative", required: true },
      monthly_surplus: { type: "nonNegative", required: true },
      shortfall: { type: "nonNegative", required: true },
      affordable: { type: "boolean", required: true },
    },
  },

  lumpsum: {
    type: "object", required: true,
    schema: {
      equity_lumpsum: { type: "nonNegative", required: true },
      debt_lumpsum: { type: "nonNegative", required: true },
      total_lumpsum: { type: "nonNegative", required: true },
      equity_lumpsum_fv: { type: "nonNegative", required: true },
      debt_lumpsum_fv: { type: "nonNegative", required: true },
      total_lumpsum_fv: { type: "nonNegative", required: true },
      investable_savings: { type: "nonNegative", required: true },
      affordable: {
        type: "boolean",
        required: true,
        custom: (v) => v !== true ? "lumpsum.affordable must always be true in hybrid mode" : null
      },
    },
  },

  hybrid: {
    type: "object", required: true,
    schema: {
      equity_remaining: { type: "nonNegative", required: true },
      debt_remaining: { type: "nonNegative", required: true },
      total_remaining: { type: "nonNegative", required: true },
      total_investment: { type: "nonNegative", required: true },
      expected_gain: { type: "nonNegative", required: true },
    },
  },

  returns: { type: "object", required: true, schema: returnsSchema },
  inflation_rate: { type: "nonNegative", required: true },
};


const hybridNotAchievableSchema = {
  goal: { type: "object", required: true, schema: goalNotAchievableSchema },
}


const validateSIPOutput = (output) => {
  const errors = [];

  const status = output?.goal?.status;

  const schema =
    status === "Not Achievable"
      ? sipNotAchievableSchema
      : sipAchievableSchema;

  // Schema validation
  validateBySchema(output, schema, "", errors, true);

  // Financial math validation
  if (
    errors.length === 0 &&
    status === "Achievable"
  ) {
    errors.push(
      ...validateFinancialIntegrity(output, INVESTMENT_MODE.SIP)
    );
  }

  return errors;
};


const validateLumpsumOutput = (output) => {
  const errors = [];

  const status = output?.goal?.status;

  const schema =
    status === "Not Achievable"
      ? lumpsumNotAchievableSchema
      : lumpsumAchievableSchema;

  // Schema validation
  validateBySchema(output, schema, "", errors, true);

  // Financial math validation
  if (
    errors.length === 0 &&
    status === "Achievable"
  ) {
    errors.push(
      ...validateFinancialIntegrity(output, INVESTMENT_MODE.LUMPSUM)
    );
  }

  return errors;
};


const validateHybridOutput = (output) => {
  const errors = [];

  const status = output?.goal?.status;

  const schema =
    status === "Not Achievable"
      ? hybridNotAchievableSchema
      : hybridOutputSchema;

  // Schema validation
  validateBySchema(output, schema, "", errors, true);

  // Hybrid-specific business logic
  if (
    errors.length === 0 &&
    status !== "Not Achievable"
  ) {
    const { feasibility, sip, goal } = output;

    // 1️⃣ sip_affordable must match sip.affordable
    if (feasibility?.sip_affordable !== sip?.affordable) {
      errors.push({
        path: "feasibility.sip_affordable",
        code: "CONSISTENCY_ERROR",
        message: "feasibility.sip_affordable must match sip.affordable",
      });
    }

    // 2️⃣ When SIP is affordable
    if (feasibility?.sip_affordable === true) {
      if (goal.status !== "Achievable") {
        errors.push({
          path: "goal.status",
          code: "CONSISTENCY_ERROR",
          message: 'When SIP is affordable, status must be "Achievable"',
        });
      }

      if (goal.recommended_strategy !== "SIP + Lumpsum Hybrid") {
        errors.push({
          path: "goal.recommended_strategy",
          code: "CONSISTENCY_ERROR",
          message:
            'When SIP is affordable, strategy must be "SIP + Lumpsum Hybrid"',
        });
      }

      if (sip.shortfall !== 0) {
        errors.push({
          path: "sip.shortfall",
          code: "CONSISTENCY_ERROR",
          message: "When SIP is affordable, shortfall must be 0",
        });
      }
    }

    // 3️⃣ When SIP is NOT affordable
    if (feasibility?.sip_affordable === false) {
      if (
        !["Partially Achievable", "Not Achievable"].includes(goal.status)
      ) {
        errors.push({
          path: "goal.status",
          code: "CONSISTENCY_ERROR",
          message:
            'When SIP is not affordable, status must be "Partially Achievable" or "Not Achievable"',
        });
      }

      if (goal.recommended_strategy !== "Lumpsum Only") {
        errors.push({
          path: "goal.recommended_strategy",
          code: "CONSISTENCY_ERROR",
          message:
            'When SIP is not affordable, strategy must be "Lumpsum Only"',
        });
      }

      if (sip.shortfall === 0) {
        errors.push({
          path: "sip.shortfall",
          code: "CONSISTENCY_ERROR",
          message:
            "When SIP is not affordable, shortfall must be greater than 0",
        });
      }
    }
  }

  // Financial math validation
  if (
    errors.length === 0 &&
    status === "Achievable"
  ) {
    errors.push(
      ...validateFinancialIntegrity(output, INVESTMENT_MODE.HYBRID)
    );
  }

  return errors;
};



const MODE_VALIDATORS = {
  [INVESTMENT_MODE.SIP]: validateSIPOutput,
  [INVESTMENT_MODE.LUMPSUM]: validateLumpsumOutput,
  [INVESTMENT_MODE.HYBRID]: validateHybridOutput,
};

const validateGoalPlanningOutput = (output, mode) => {
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return {
      valid: false,
      errors: [{
        path: "root",
        code: "INVALID_OBJECT",
        message: "AI output must be a valid object",
      }],
    };
  }

  const normalizedMode = mode?.trim()?.toLowerCase();

  if (!VALID_MODES.includes(normalizedMode)) {
    return {
      valid: false,
      errors: [{
        path: "mode",
        code: "INVALID_MODE",
        message: `mode must be one of: ${VALID_MODES.join(", ")}`,
      }],
    };
  }

  const validator = MODE_VALIDATORS[normalizedMode];

  const errors = validator(output);

  return {
    valid: errors.length === 0,
    errors,
  };
};

module.exports = { validateGoalPlanningOutput };