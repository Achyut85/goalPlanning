const toNum = (v, fallback = 0) => {
  if (v === undefined || v === null) return fallback;
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

const toNumOrNull = (v) => {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const fixReturnPercent = (v) => {
  const n = toNum(v);
  if (n > 0 && n < 1) return Math.round(n * 10000) / 100;
  return Math.round(n * 100) / 100;
};

const normalizeReadiness = (v, projected, target) => {
  let n = Number(v);

  if (isNaN(n) || n === 0) {
    if (target > 0) {
      n = (projected / target) * 100;
    } else {
      return 100;
    }
  }

  n = Math.round(n * 10) / 10;
  return Math.min(100, Math.max(0, n));
};

const normalizeAllocation = (alloc) => {
  if (!alloc) return null;

  return {
    equity_percent: Math.min(100, Math.max(0, toNum(alloc.equity_percent))),
    debt_percent: Math.min(100, Math.max(0, toNum(alloc.debt_percent))),
    liquid_percent: Math.min(100, Math.max(0, toNum(alloc.liquid_percent))),

    equity_sip_amount: Math.max(
      0,
      toNum(alloc.equity_sip_amount ?? alloc.equity_amount)
    ),

    debt_sip_amount: Math.max(
      0,
      toNum(alloc.debt_sip_amount ?? alloc.debt_amount)
    ),

    liquid_sip_amount: Math.max(
      0,
      toNum(alloc.liquid_sip_amount ?? alloc.liquid_amount)
    ),

    expected_return_percent: fixReturnPercent(
      alloc.expected_return_percent
    ),

    liquid_buffer_years: toNumOrNull(alloc.liquid_buffer_years),
  };
};

function normalizeGoalOutput(apiResponse = {}) {
  const raw = apiResponse?.data?.aiResponse ?? apiResponse;

  const goalType = raw.goal_type ?? (
    raw.swp_summary ||
    raw.asset_allocation_pre_retirement ||
    raw.summary?.accumulation_years
      ? "retirement"
      : raw.summary?.goal_type ?? "unknown"
  );

  return {
    goal_type: goalType,

    summary: {
      current_age:     toNumOrNull(raw.summary?.current_age),
      target_age:      toNumOrNull(raw.summary?.target_age      ?? raw.summary?.retirement_age),
      horizon_years:   toNumOrNull(raw.summary?.horizon_years   ?? raw.summary?.accumulation_years),
      post_goal_years: toNumOrNull(raw.summary?.post_goal_years ?? raw.summary?.retirement_years),
      inflation_rate:  toNumOrNull(raw.summary?.inflation_rate),
    },

    corpus: {
      target_corpus:    toNum(raw.corpus?.target_corpus),
      projected_corpus: toNum(raw.corpus?.projected_corpus),

      funding_gap: Math.max(
        0,
        toNum(raw.corpus?.funding_gap)
      ),

      projected_readiness_percent: normalizeReadiness(
        raw.corpus?.projected_readiness_percent,
        raw.corpus?.projected_corpus,
        raw.corpus?.target_corpus
      ),
    },

    investment_plan: {
      required_monthly_sip: toNum(raw.investment_plan?.required_monthly_sip),
      applied_monthly_sip:  toNum(raw.investment_plan?.applied_monthly_sip),
      lumpsum_used:         toNum(raw.investment_plan?.lumpsum_used),
      recommended_mode:     raw.investment_plan?.recommended_mode ?? "—",
      affordability:        raw.investment_plan?.affordability    ?? "—",
    },

    asset_allocation: {
      pre_goal: normalizeAllocation(
        raw.asset_allocation?.pre_goal ??
        raw.asset_allocation_pre_retirement ??
        raw.asset_allocation_pre_goal
      ),

      post_goal: normalizeAllocation(
        raw.asset_allocation?.post_goal ??
        raw.asset_allocation_post_retirement
      ),
    },

    withdrawal: (raw.withdrawal ?? raw.swp_summary) ? {
      annual_required: toNum(
        raw.withdrawal?.annual_required ??
        raw.swp_summary?.annual_withdrawal_required
      ),

      safe_withdrawal_rate_percent: toNum(
        raw.withdrawal?.safe_withdrawal_rate_percent ??
        raw.swp_summary?.safe_withdrawal_rate_percent
      ),

      sustainability_status:
        raw.withdrawal?.sustainability_status ??
        raw.swp_summary?.sustainability_status ??
        "—",
    } : null,

    financial_health: {
      score: toNum(
        raw.financial_health?.score ??
        raw.financial_health?.health_score
      ),

      status:
        raw.financial_health?.status ??
        raw.financial_health?.health_status ??
        "—",
    },

    recommendations: Array.isArray(raw.recommendations)
      ? raw.recommendations.map((r, i) =>
          typeof r === "string" ? { id: i, text: r } : r
        )
      : Array.isArray(raw.top_3_recommendations)
      ? raw.top_3_recommendations.map((r, i) =>
          typeof r === "string" ? { id: i, text: r } : r
        )
      : [],
  };
}

module.exports = { normalizeGoalOutput };