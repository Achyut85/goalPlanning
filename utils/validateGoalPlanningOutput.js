const { validateBySchema } = require("./validation.js");
const {GOAL_TYPES} = require("../constants/goalPlanning.js")

const VALID_MODES         = ["SIP", "LumpSum", "Hybrid", "No Investment Required"];
const VALID_AFFORDABILITY = ["Comfortable", "Stretch", "Not Realistic"];
const VALID_HEALTH_STATUS = ["Excellent", "Good", "Fair", "At Risk"];
const VALID_SUSTAIN       = ["Sustainable", "Unsustainable"];



const allocationSchema = {
  equity_percent:  { type: "nonNegative", required: true },
  debt_percent:    { type: "nonNegative", required: true },
  liquid_percent:  { type: "nonNegative", required: true },
  equity_sip_amount:   { type: "nonNegative", required: true },
  debt_sip_amount:     { type: "nonNegative", required: true },
  liquid_sip_amount:   { type: "nonNegative", required: true },
  expected_return_percent: {
    type: "nonNegative", required: true,
    custom: (v) => v > 0 && v < 1
      ? `expected_return_percent looks like a decimal (${v}) — must be whole % e.g. 10 not 0.10`
      : null
  },
  liquid_buffer_years: { type: "nonNegative", required: false },


  _percentSum: {
    virtual: true,
    dependsOn: ["equity_percent", "debt_percent", "liquid_percent"],
    custom: (_, data) => {
      const total = (data.equity_percent ?? 0) +
                    (data.debt_percent   ?? 0) +
                    (data.liquid_percent ?? 0);
      return Math.round(total) !== 100
        ? `equity_percent + debt_percent + liquid_percent must sum to 100, got ${total}`
        : null;
    }
  },
};



const retirementSummarySchema = {
  current_age: {
    type: "positive", required: true,
    custom: (v) => v < 18 || v > 80 ? "current_age must be between 18 and 80" : null
  },
  target_age: {
    type: "positive", required: true,
    dependsOn: ["current_age"],
    custom: (v, data) => v <= data.current_age
      ? `target_age (${v}) must be greater than current_age (${data.current_age})` : null
  },
  horizon_years:   { type: "positive", required: true,  min: 1 },
  post_goal_years: { type: "positive", required: true,  min: 1 },
  inflation_rate:  { type: "nonNegative", required: true },
};

const nonRetirementSummarySchema = {
  current_age:     { type: "positive",    required: false },
  target_age:      { type: "positive",    required: false },
  horizon_years:   { type: "positive",    required: true, min: 1 },
  post_goal_years: { type: "positive",    required: false },
  inflation_rate:  { type: "nonNegative", required: true },
};



const corpusSchema = {
  target_corpus:               { type: "nonNegative", required: true },
  projected_corpus:            { type: "nonNegative", required: true },
  funding_gap:                 { type: "nonNegative", required: true },
  projected_readiness_percent: {
    type: "nonNegative", required: true,
    custom: (v) => v > 100 ? "projected_readiness_percent cannot exceed 100" : null
  },
};



const investmentPlanSchema = {
  required_monthly_sip: { type: "nonNegative", required: true },
  applied_monthly_sip:  { type: "nonNegative", required: true },
  lumpsum_used:         { type: "nonNegative", required: true },
  recommended_mode: {
    type: "string", required: true,
    custom: (v) => !VALID_MODES.includes(v)
      ? `recommended_mode must be one of: ${VALID_MODES.join(" | ")}` : null
  },
  affordability: {
    type: "string", required: true,
    custom: (v) => !VALID_AFFORDABILITY.includes(v)
      ? `affordability must be one of: ${VALID_AFFORDABILITY.join(" | ")}` : null
  },
};



const withdrawalSchema = {
  annual_required:              { type: "nonNegative", required: true },
  safe_withdrawal_rate_percent: { type: "nonNegative", required: true },
  sustainability_status: {
    type: "string", required: true,
    custom: (v) => !VALID_SUSTAIN.includes(v)
      ? `sustainability_status must be one of: ${VALID_SUSTAIN.join(" | ")}` : null
  },
};



const financialHealthSchema = {
  score: {
    type: "nonNegative", required: true,
    custom: (v) => v > 100 ? "score cannot exceed 100" : null
  },
  status: {
    type: "string", required: true,
    custom: (v) => !VALID_HEALTH_STATUS.includes(v)
      ? `status must be one of: ${VALID_HEALTH_STATUS.join(" | ")}` : null
  },
};



const buildRootSchema = (isRetirement) => ({
  goal_type: {
    type: "string", required: true,
    custom: (v) => !GOAL_TYPES.includes(v)
      ? `goal_type must be one of: ${GOAL_TYPES.join(" | ")}` : null
  },

  summary: {
    type: "object", required: true,
    schema: isRetirement ? retirementSummarySchema : nonRetirementSummarySchema,
  },

  corpus: {
    type: "object", required: true,
    schema: corpusSchema,
  },

  investment_plan: {
    type: "object", required: true,
    schema: investmentPlanSchema,
  },

  asset_allocation: {
    type: "object", required: true,
    schema: {
      pre_goal: {
        type: "object", required: true,
        schema: allocationSchema,
      },
      post_goal: {
        type: "object", required: isRetirement,
        schema: allocationSchema,
      },
    },
  },

  withdrawal: {
    type: "object", required: isRetirement,
    schema: withdrawalSchema,
  },

  financial_health: {
    type: "object", required: true,
    schema: financialHealthSchema,
  },

  recommendations: {
    required: true,
    custom: (v) => {
      if (!Array.isArray(v))  return "recommendations must be an array";
      if (v.length !== 3)     return `recommendations must have exactly 3 items, got ${v.length}`;
      for (let i = 0; i < v.length; i++) {
        const r = v[i];
        if (typeof r === "string" && r.trim()) continue;
        if (typeof r === "object" && r !== null && typeof r.text === "string" && r.text.trim()) continue;
        return `recommendations[${i}] must be a non-empty string or { id, text } object`;
      }
      return null;
    }
  },
});



const validateGoalPlanningOutput = (normalized = {}, stopOnFirstError = false) => {
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) {
    return {
      valid: false,
      errors: [{
        path: "root",
        code: "INVALID_OBJECT",
        message: "Normalized output must be a valid object"
      }]
    };
  }

  const isRetirement = normalized.goal_type === "retirement";
  const rootSchema   = buildRootSchema(isRetirement);
  const errors       = [];

  validateBySchema(normalized, rootSchema, "", errors, stopOnFirstError);

  return { valid: errors.length === 0, errors };
};

module.exports = { validateGoalPlanningOutput };