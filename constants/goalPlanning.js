

const INVESTMENT_MODE = Object.freeze({
  SIP: "sip",
  LUMPSUM: "lumpsum",
  HYBRID: "hybrid",
});

const VALID_MODES = Object.freeze(Object.values(INVESTMENT_MODE));



const GOAL_STATUS = Object.freeze({
  ACHIEVABLE: "Achievable",
  PARTIALLY_ACHIEVABLE: "Partially Achievable",
  NOT_ACHIEVABLE: "Not Achievable",
});


const VALID_GOAL_STATUS = Object.freeze(Object.values(GOAL_STATUS));

const HYBRID_ALLOWED_STATUS = Object.freeze([
  GOAL_STATUS.ACHIEVABLE,
  GOAL_STATUS.PARTIALLY_ACHIEVABLE,
  GOAL_STATUS.NOT_ACHIEVABLE,
]);

const HYBRID_STRATEGY = Object.freeze({
  SIP_LUMPSUM: "SIP + Lumpsum Hybrid",
  LUMPSUM_ONLY: "Lumpsum Only",
});

const HYBRID_ALLOWED_STRATEGIES = Object.freeze([
  HYBRID_STRATEGY.SIP_LUMPSUM,
  HYBRID_STRATEGY.LUMPSUM_ONLY,
]);








module.exports = {
  INVESTMENT_MODE,
  VALID_MODES,
  GOAL_STATUS,
  HYBRID_ALLOWED_STATUS,
  HYBRID_STRATEGY,
  HYBRID_ALLOWED_STRATEGIES,
  VALID_GOAL_STATUS
};