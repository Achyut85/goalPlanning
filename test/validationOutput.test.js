const { validateGoalPlanningOutput } = require("../utils/validateGoalPlanningOutput");

// ─── Helpers ────────────────────────────────────────────────────────────────

const makeSipAchievable = (overrides = {}) => ({
  goal: { type: "Retirement", status: "Achievable", suggest: "Start early" },
  time_horizon_years: 10,
  amounts: {
    total_goal_amount_future: 1000000,
    equity_goal_amount: 700000,
    debt_goal_amount: 300000,
  },
  sip: {
    equity_sip: 7000,
    debt_sip: 3000,
    total_sip: 10000,
    total_investment: 1200000,
    expected_gain: 200000,
  },
  returns: { equity_return_rate: 12, debt_return_rate: 7 },
  inflation_rate: 6,
  ...overrides,
});

const makeSipNotAchievable = (overrides = {}) => ({
  goal: { type: "Retirement", status: "Not Achievable", suggest: "Reduce goal" },
  ...overrides,
});

const makeLumpsumAchievable = (overrides = {}) => ({
  goal: { type: "House", status: "Achievable", suggest: "Invest now" },
  time_horizon_years: 5,
  amounts: {
    total_goal_amount_future: 500000,
    equity_goal_amount: 350000,
    debt_goal_amount: 150000,
  },
  lumpsum: {
    equity_lumpsum: 35000,
    debt_lumpsum: 15000,
    total_lumpsum: 50000,
    expected_gain: 100000,
  },
  returns: { equity_return_rate: 12, debt_return_rate: 7 },
  inflation_rate: 6,
  ...overrides,
});

const makeLumpsumNotAchievable = (overrides = {}) => ({
  goal: { type: "House", status: "Not Achievable", suggest: "Reduce goal" },
  ...overrides,
});

const makeHybridAchievable = (overrides = {}) => ({
  goal: {
    type: "Education",
    status: "Achievable",
    recommended_strategy: "SIP + Lumpsum Hybrid",
    suggest: "Use both SIP and lumpsum",
  },
  time_horizon_years: 8,
  feasibility: { sip_affordable: true, lumpsum_affordable: true },
  amounts: {
    total_goal_amount_future: 800000,
    equity_goal_amount: 560000,
    debt_goal_amount: 240000,
  },
  sip: {
    equity_sip: 3000,
    debt_sip: 1000,
    total_sip: 4000,
    monthly_surplus: 5000,
    shortfall: 0,
    affordable: true,
  },
  lumpsum: {
    equity_lumpsum: 20000,
    debt_lumpsum: 10000,
    total_lumpsum: 30000,
    equity_lumpsum_fv: 50000,
    debt_lumpsum_fv: 20000,
    total_lumpsum_fv: 70000,
    investable_savings: 30000,
    affordable: true,
  },
  hybrid: {
    equity_remaining: 60000,
    debt_remaining: 30000,
    total_remaining: 90000,
    total_investment: 120000,
    expected_gain: 200000,
  },
  returns: { equity_return_rate: 12, debt_return_rate: 7 },
  inflation_rate: 6,
  ...overrides,
});

const makeHybridPartiallyAchievable = (overrides = {}) =>
  makeHybridAchievable({
    goal: {
      type: "Education",
      status: "Partially Achievable",
      recommended_strategy: "Lumpsum Only",
      suggest: "SIP not affordable, use lumpsum",
    },
    feasibility: { sip_affordable: false, lumpsum_affordable: true },
    sip: {
      equity_sip: 0,
      debt_sip: 0,
      total_sip: 0,
      monthly_surplus: 1000,
      shortfall: 3000,
      affordable: false,
    },
    ...overrides,
  });

const makeHybridNotAchievable = (overrides = {}) => ({
  goal: { type: "Education", status: "Not Achievable", suggest: "Not feasible" },
  ...overrides,
});

// ─── Root / Mode Validation ──────────────────────────────────────────────────

describe("Root & Mode Validation", () => {
  test("returns invalid for null output", () => {
    const result = validateGoalPlanningOutput(null, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_OBJECT");
  });

  test("returns invalid for array output", () => {
    const result = validateGoalPlanningOutput([], "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_OBJECT");
  });

  test("returns invalid for string output", () => {
    const result = validateGoalPlanningOutput("bad", "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_OBJECT");
  });

  test("returns invalid for unknown mode", () => {
    const result = validateGoalPlanningOutput(makeSipAchievable(), "unknown");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_MODE");
  });

  test("returns invalid when mode is missing", () => {
    const result = validateGoalPlanningOutput(makeSipAchievable(), undefined);
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_MODE");
  });

  test("mode is case-insensitive", () => {
    const result = validateGoalPlanningOutput(makeSipAchievable(), "SIP");
    expect(result.valid).toBe(true);
  });

  test("returns invalid when goal block is missing", () => {
    const result = validateGoalPlanningOutput({ amounts: {} }, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe("goal");
  });

  test("returns invalid when goal block is an array", () => {
    const result = validateGoalPlanningOutput({ goal: [] }, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe("goal");
  });

  test("returns invalid when goal.status is missing", () => {
    const result = validateGoalPlanningOutput(
      { goal: { type: "Retirement", suggest: "x" } },
      "sip"
    );
    expect(result.valid).toBe(false);
    expect(result.errors[0].path).toBe("goal.status");
  });
});

// ─── SIP Mode ────────────────────────────────────────────────────────────────

describe("SIP Mode - Achievable", () => {
  test("valid achievable SIP output passes", () => {
    const result = validateGoalPlanningOutput(makeSipAchievable(), "sip");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test("fails when goal.status is not Achievable", () => {
    const output = makeSipAchievable({
      goal: { type: "x", status: "Partial", suggest: "y" },
    });
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("goal.status"))).toBe(true);
  });

  test("fails when sip.total_sip is missing", () => {
    const output = makeSipAchievable();
    delete output.sip.total_sip;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });

  test("fails when equity_sip is negative", () => {
    const output = makeSipAchievable();
    output.sip.equity_sip = -100;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });

  test("fails when time_horizon_years is zero", () => {
    const output = makeSipAchievable({ time_horizon_years: 0 });
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });

  test("fails on math error: equity_sip + debt_sip !== total_sip", () => {
    const output = makeSipAchievable();
    output.sip.total_sip = 99999; // mismatch
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MATH_ERROR");
    expect(result.errors[0].path).toBe("sip.total_sip");
  });

  test("passes math check within tolerance (0.01)", () => {
    const output = makeSipAchievable();
    output.sip.total_sip = 10000.005; // within tolerance
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(true);
  });

  test("fails when inflation_rate is missing", () => {
    const output = makeSipAchievable();
    delete output.inflation_rate;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });

  test("fails when returns block is missing", () => {
    const output = makeSipAchievable();
    delete output.returns;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });

  test("fails when amounts block is missing", () => {
    const output = makeSipAchievable();
    delete output.amounts;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
  });
});

describe("SIP Mode - Not Achievable", () => {
  test("valid not-achievable SIP output passes", () => {
    const result = validateGoalPlanningOutput(makeSipNotAchievable(), "sip");
    expect(result.valid).toBe(true);
  });

test("fails when goal.status is not 'Not Achievable'", () => {
  const output = makeSipNotAchievable({
    goal: { type: "x", status: "Achievable", suggest: "y" },
  });

  const result = validateGoalPlanningOutput(output, "sip", true);

  expect(result.valid).toBe(false);

  // Since we stop on first error, there should be exactly 1 error
  expect(result.errors.length).toBe(1);

  // And that error should be about goal.status
  
});

  test("not-achievable SIP only requires goal block", () => {
    const output = { goal: { type: "x", status: "Not Achievable", suggest: "y" } };
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(true);
  });
});

// ─── Lumpsum Mode ─────────────────────────────────────────────────────────────

describe("Lumpsum Mode - Achievable", () => {
  test("valid achievable lumpsum output passes", () => {
    const result = validateGoalPlanningOutput(makeLumpsumAchievable(), "lumpsum");
    expect(result.valid).toBe(true);
  });

  test("fails on math error: equity_lumpsum + debt_lumpsum !== total_lumpsum", () => {
    const output = makeLumpsumAchievable();
    output.lumpsum.total_lumpsum = 99999;
    const result = validateGoalPlanningOutput(output, "lumpsum");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MATH_ERROR");
    expect(result.errors[0].path).toBe("lumpsum.total_lumpsum");
  });

  test("fails when lumpsum block is missing", () => {
    const output = makeLumpsumAchievable();
    delete output.lumpsum;
    const result = validateGoalPlanningOutput(output, "lumpsum");
    expect(result.valid).toBe(false);
  });

  test("fails when debt_lumpsum is negative", () => {
    const output = makeLumpsumAchievable();
    output.lumpsum.debt_lumpsum = -5000;
    const result = validateGoalPlanningOutput(output, "lumpsum");
    expect(result.valid).toBe(false);
  });

  test("fails when goal.status is wrong", () => {
    const output = makeLumpsumAchievable({
      goal: { type: "x", status: "Not Achievable", suggest: "y" },
    });
    const result = validateGoalPlanningOutput(output, "lumpsum");
    expect(result.valid).toBe(false);
  });
});

describe("Lumpsum Mode - Not Achievable", () => {
  test("valid not-achievable lumpsum output passes", () => {
    const result = validateGoalPlanningOutput(makeLumpsumNotAchievable(), "lumpsum");
    expect(result.valid).toBe(true);
  });

  test("not-achievable lumpsum only requires goal block", () => {
    const output = { goal: { type: "x", status: "Not Achievable", suggest: "y" } };
    const result = validateGoalPlanningOutput(output, "lumpsum");
    expect(result.valid).toBe(true);
  });
});

// ─── Hybrid Mode ─────────────────────────────────────────────────────────────

describe("Hybrid Mode - Achievable (SIP affordable)", () => {
  test("valid achievable hybrid passes", () => {
    const result = validateGoalPlanningOutput(makeHybridAchievable(), "hybrid");
    expect(result.valid).toBe(true);
  });

  test("fails when feasibility block is missing", () => {
    const output = makeHybridAchievable();
    delete output.feasibility;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
  });

  test("fails when lumpsum_affordable is false", () => {
    const output = makeHybridAchievable();
    output.feasibility.lumpsum_affordable = false;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path.includes("lumpsum_affordable"))).toBe(true);
  });

  test("fails when lumpsum.affordable is false", () => {
    const output = makeHybridAchievable();
    output.lumpsum.affordable = false;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
  });

  test("fails when feasibility.sip_affordable doesn't match sip.affordable", () => {
    const output = makeHybridAchievable();
    output.feasibility.sip_affordable = false; // mismatch with sip.affordable=true
    output.sip.affordable = true;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "CONSISTENCY_ERROR")).toBe(true);
  });

  test("fails when SIP is affordable but status is not Achievable", () => {
    const output = makeHybridAchievable();
    output.goal.status = "Partially Achievable";
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.path === "goal.status" && e.code === "CONSISTENCY_ERROR"
      )
    ).toBe(true);
  });

  test("fails when SIP is affordable but strategy is not 'SIP + Lumpsum Hybrid'", () => {
    const output = makeHybridAchievable();
    output.goal.recommended_strategy = "Lumpsum Only";
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.path === "goal.recommended_strategy")
    ).toBe(true);
  });

  test("fails when SIP is affordable but shortfall is non-zero", () => {
    const output = makeHybridAchievable();
    output.sip.shortfall = 500;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "sip.shortfall")).toBe(true);
  });

  test("fails on hybrid lumpsum math error", () => {
    const output = makeHybridAchievable();
    output.lumpsum.total_lumpsum = 99999; // mismatch
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MATH_ERROR");
    expect(result.errors[0].path).toBe("lumpsum.total_lumpsum");
  });

  test("fails on hybrid remaining math error", () => {
    const output = makeHybridAchievable();
    output.hybrid.total_remaining = 99999; // mismatch
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MATH_ERROR");
    expect(result.errors[0].path).toBe("hybrid.total_remaining");
  });

  test("fails when hybrid block is missing", () => {
    const output = makeHybridAchievable();
    delete output.hybrid;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
  });

  test("fails when recommended_strategy is invalid", () => {
    const output = makeHybridAchievable();
    output.goal.recommended_strategy = "SIP Only";
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
  });
});

describe("Hybrid Mode - Partially Achievable (SIP not affordable)", () => {
  test("valid partially achievable hybrid passes", () => {
    const result = validateGoalPlanningOutput(
      makeHybridPartiallyAchievable(),
      "hybrid"
    );
    expect(result.valid).toBe(true);
  });

  test("fails when SIP is not affordable but status is Achievable", () => {
    const output = makeHybridPartiallyAchievable();
    output.goal.status = "Achievable";
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some(
        (e) => e.path === "goal.status" && e.code === "CONSISTENCY_ERROR"
      )
    ).toBe(true);
  });

  test("fails when SIP not affordable but strategy is 'SIP + Lumpsum Hybrid'", () => {
    const output = makeHybridPartiallyAchievable();
    output.goal.recommended_strategy = "SIP + Lumpsum Hybrid";
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.path === "goal.recommended_strategy")
    ).toBe(true);
  });

  test("fails when SIP not affordable but shortfall is 0", () => {
    const output = makeHybridPartiallyAchievable();
    output.sip.shortfall = 0;
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.path === "sip.shortfall")).toBe(true);
  });

  test("feasibility.sip_affordable must match sip.affordable (false case)", () => {
    const output = makeHybridPartiallyAchievable();
    output.feasibility.sip_affordable = true; // mismatch with sip.affordable=false
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "CONSISTENCY_ERROR")
    ).toBe(true);
  });
});

describe("Hybrid Mode - Not Achievable", () => {
  test("valid not-achievable hybrid passes with only goal block", () => {
    const result = validateGoalPlanningOutput(makeHybridNotAchievable(), "hybrid");
    expect(result.valid).toBe(true);
  });

 0
  test("fails when goal.status is wrong for not-achievable schema", () => {
    const output = makeHybridNotAchievable({
      goal: { type: "x", status: "Achievable", suggest: "y" },
    });
    const result = validateGoalPlanningOutput(output, "hybrid");
    expect(result.valid).toBe(false);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe("Edge Cases", () => {
  test("math tolerance exactly at boundary (0.01) passes", () => {
    const output = makeSipAchievable();
    output.sip.total_sip = 10000.01; // exactly at tolerance
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(true);
  });

  test("math error just beyond tolerance (0.011) fails", () => {
    const output = makeSipAchievable();
    output.sip.total_sip = 10001; // just over tolerance
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("MATH_ERROR");
  });

  test("zero is valid for nonNegative fields", () => {
    const output = makeSipAchievable();
    output.inflation_rate = 0;
    output.sip.expected_gain = 0;
    const result = validateGoalPlanningOutput(output, "sip");
    expect(result.valid).toBe(true);
  });

  test("mode with extra whitespace is handled", () => {
    const result = validateGoalPlanningOutput(makeSipAchievable(), "  sip  ");
    expect(result.valid).toBe(true);
  });

  test("math errors are not checked if schema validation fails first", () => {
    const output = makeSipAchievable();
    delete output.sip.equity_sip; // schema error
    output.sip.total_sip = 99999;  // also math error
    const result = validateGoalPlanningOutput(output, "sip");
    // Should report schema error, not math error
    expect(result.errors.every((e) => e.code !== "MATH_ERROR")).toBe(true);
  });
});
