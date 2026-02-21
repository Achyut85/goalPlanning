const { validateGoalPlanningInput } = require("../utils/validateGoalPlanningInput");

describe("Goal Planning Validation - Full Coverage", () => {

  // ─────────────────────────────────────────────
  // 🔧 Helpers
  // ─────────────────────────────────────────────
  const hasError = (errors, path, code) =>
    errors.some(e => e.path === path && (code ? e.code === code : true));

  const hasMessage = (errors, text) =>
    errors.some(e => e.message.includes(text));

  // ─────────────────────────────────────────────
  // 🔧 Base fixtures
  // ─────────────────────────────────────────────
  const baseGoal = {
    type: "retirement",
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 85,
    targetMonthlyAmount: 50000,
  };

  const baseFinance = {
    monthlyIncome: 100000,
    monthlyExpenses: 40000,
    emi: 10000,
    currentSavings: 200000,
    emergencyFundRequired: 50000,
    investmentMode: "sip",
  };

  // ════════════════════════════════════════════
  // ✅ VALID CASES
  // ════════════════════════════════════════════
  describe("Valid Cases", () => {

    test("Valid retirement input should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: baseFinance
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("Valid input with zero EMI should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, emi: 0 }
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("Valid input where current savings exactly equals emergency fund should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, currentSavings: 50000, emergencyFundRequired: 50000 }
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test("Valid SIP mode should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "sip" }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid lumpsum mode should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "lumpsum" }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid hybrid mode should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "hybrid" }
      });
      expect(result.valid).toBe(true);
    });

    test("investmentMode case insensitive — SIP uppercase should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "SIP" }
      });
      expect(result.valid).toBe(true);
    });

    test("investmentMode case insensitive — Hybrid mixed case should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "Hybrid" }
      });
      expect(result.valid).toBe(true);
    });

    test("investmentMode case insensitive — LUMPSUM uppercase should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "LUMPSUM" }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid input with zero monthly expenses should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyExpenses: 0 }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid input with zero current savings should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, currentSavings: 0 }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid input with zero emergency fund required should pass", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, emergencyFundRequired: 0 }
      });
      expect(result.valid).toBe(true);
    });

    test("Valid input with retirement age 1 more than current age should pass", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 59, retirementAge: 60, lifeExpectancy: 61 },
        finance: baseFinance
      });
      expect(result.valid).toBe(true);
    });

    test("Valid input with life expectancy 1 more than retirement age should pass", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, retirementAge: 60, lifeExpectancy: 61 },
        finance: baseFinance
      });
      expect(result.valid).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ AGE LOGIC RULES
  // ════════════════════════════════════════════
  describe("Age Logic Rules", () => {

    test("Retirement age less than current age should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 50, retirementAge: 40 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "Retirement age")).toBe(true);
    });

    test("Retirement age equal to current age should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 50, retirementAge: 50 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "Retirement age")).toBe(true);
    });

    test("Life expectancy less than retirement age should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, retirementAge: 60, lifeExpectancy: 55 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "Life expectancy")).toBe(true);
    });

    test("Life expectancy equal to retirement age should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, retirementAge: 60, lifeExpectancy: 60 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "Life expectancy")).toBe(true);
    });

    test("Current age as zero should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 0 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_VALUE")).toBe(true);
    });

    test("Negative current age should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: -10 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_VALUE")).toBe(true);
    });

    test("Current age below 18 should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 17 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_VALUE")).toBe(true);
    });

    test("Current age above 100 should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 101 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_VALUE")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ REQUIRED FIELDS
  // ════════════════════════════════════════════
  describe("Required Fields", () => {

    test("Missing goal type should fail", () => {
      const { type, ...rest } = baseGoal;
      const result = validateGoalPlanningInput({
        goal: rest,
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.type", "REQUIRED")).toBe(true);
    });

    test("Missing targetMonthlyAmount should fail", () => {
      const { targetMonthlyAmount, ...rest } = baseGoal;
      const result = validateGoalPlanningInput({
        goal: rest,
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.targetMonthlyAmount", "REQUIRED")).toBe(true);
    });

    test("Missing monthlyIncome should fail", () => {
      const { monthlyIncome, ...rest } = baseFinance;
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: rest
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyIncome", "REQUIRED")).toBe(true);
    });

    test("Missing emergencyFundRequired should fail", () => {
      const { emergencyFundRequired, ...rest } = baseFinance;
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: rest
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.emergencyFundRequired", "REQUIRED")).toBe(true);
    });

    test("Missing investmentMode should fail", () => {
      const { investmentMode, ...rest } = baseFinance;
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: rest
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.investmentMode", "REQUIRED")).toBe(true);
    });

    test("Missing currentAge should fail", () => {
      const { currentAge, ...rest } = baseGoal;
      const result = validateGoalPlanningInput({
        goal: rest,
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "REQUIRED")).toBe(true);
    });

    test("Missing retirementAge should fail", () => {
      const { retirementAge, ...rest } = baseGoal;
      const result = validateGoalPlanningInput({
        goal: rest,
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.retirementAge", "REQUIRED")).toBe(true);
    });

    test("Missing lifeExpectancy should fail", () => {
      const { lifeExpectancy, ...rest } = baseGoal;
      const result = validateGoalPlanningInput({
        goal: rest,
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.lifeExpectancy", "REQUIRED")).toBe(true);
    });

    test("Missing emi should fail", () => {
      const { emi, ...rest } = baseFinance;
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: rest
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.emi", "REQUIRED")).toBe(true);
    });

    test("Entirely missing finance block should fail with multiple errors", () => {
      const result = validateGoalPlanningInput({ goal: baseGoal });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance", "REQUIRED")).toBe(true);
    });

    test("Entirely missing goal block should fail with multiple errors", () => {
      const result = validateGoalPlanningInput({ finance: baseFinance });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal", "REQUIRED")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ TYPE VALIDATION
  // ════════════════════════════════════════════
  describe("Type Validation", () => {

    test("String value for monthlyIncome should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyIncome: "100000" }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyIncome", "INVALID_TYPE")).toBe(true);
    });

    test("String value for currentAge should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: "30" },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_TYPE")).toBe(true);
    });

    test("Boolean value for retirementAge should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, retirementAge: true },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.retirementAge", "INVALID_TYPE")).toBe(true);
    });

    test("Float age values should fail (ages must be integers)", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, currentAge: 30.5 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.currentAge", "INVALID_TYPE")).toBe(true);
    });

    test("Float retirementAge should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, retirementAge: 60.9 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.retirementAge", "INVALID_TYPE")).toBe(true);
    });

    test("Float lifeExpectancy should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, lifeExpectancy: 85.5 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.lifeExpectancy", "INVALID_TYPE")).toBe(true);
    });

    test("Null monthlyExpenses should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyExpenses: null }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyExpenses", "REQUIRED")).toBe(true);
    });

    test("Array value for goal block should fail", () => {
      const result = validateGoalPlanningInput({
        goal: [],
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal", "INVALID_TYPE")).toBe(true);
    });

    test("Array value for finance block should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: []
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance", "INVALID_TYPE")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ VALUE VALIDATION
  // ════════════════════════════════════════════
  describe("Value Validation", () => {

    test("Negative monthly income should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyIncome: -1000 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyIncome", "INVALID_VALUE")).toBe(true);
    });

    test("Zero monthly income should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyIncome: 0 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyIncome", "INVALID_VALUE")).toBe(true);
    });

    test("Negative monthly expenses should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, monthlyExpenses: -500 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.monthlyExpenses", "INVALID_VALUE")).toBe(true);
    });

    test("Negative EMI should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, emi: -1000 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.emi", "INVALID_VALUE")).toBe(true);
    });

    test("Negative current savings should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, currentSavings: -500 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.currentSavings", "INVALID_VALUE")).toBe(true);
    });

    test("Zero targetMonthlyAmount should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, targetMonthlyAmount: 0 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.targetMonthlyAmount", "INVALID_VALUE")).toBe(true);
    });

    test("Negative targetMonthlyAmount should fail", () => {
      const result = validateGoalPlanningInput({
        goal: { ...baseGoal, targetMonthlyAmount: -5000 },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal.targetMonthlyAmount", "INVALID_VALUE")).toBe(true);
    });

    test("Negative emergencyFundRequired should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, emergencyFundRequired: -1000 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.emergencyFundRequired", "INVALID_VALUE")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ INVESTMENT MODE VALIDATION
  // ════════════════════════════════════════════
  describe("Investment Mode", () => {

    test("Unknown goal type should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "weekly" }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.investmentMode", "CUSTOM_VALIDATION")).toBe(true);
    });

    test("Empty string investmentMode should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "" }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.investmentMode", "INVALID_TYPE")).toBe(true);
    });

    test("Numeric investmentMode should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: 123 }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.investmentMode", "INVALID_TYPE")).toBe(true);
    });

    test("investmentMode = 'monthly' should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: { ...baseFinance, investmentMode: "monthly" }
      });
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "finance.investmentMode", "CUSTOM_VALIDATION")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ SIP BUSINESS RULES
  // ════════════════════════════════════════════
  describe("SIP Business Rules", () => {

    test("Expenses + EMI exactly equal to income (zero surplus) should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 100000,
          monthlyExpenses: 90000,
          emi: 10000,
          investmentMode: "sip"
        }
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "No investable surplus")).toBe(true);
    });

    test("Expenses + EMI exceeding income (negative surplus) should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 100000,
          monthlyExpenses: 95000,
          emi: 10000,
          investmentMode: "sip"
        }
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "exceed income")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ HYBRID BUSINESS RULES
  // ════════════════════════════════════════════
  describe("Hybrid Business Rules", () => {

    test("Hybrid zero surplus should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 100000,
          monthlyExpenses: 90000,
          emi: 10000,
          investmentMode: "hybrid"
        }
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "No investable surplus")).toBe(true);
    });

    test("Hybrid negative surplus should fail", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 100000,
          monthlyExpenses: 95000,
          emi: 10000,
          investmentMode: "hybrid"
        }
      });
      expect(result.valid).toBe(false);
      expect(hasMessage(result.errors, "exceed income")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ✅ LUMPSUM — NO SURPLUS CHECK
  // ════════════════════════════════════════════
  describe("Lumpsum Business Rules", () => {

    test("Lumpsum with zero surplus should still pass (no surplus required)", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 100000,
          monthlyExpenses: 90000,
          emi: 10000,
          investmentMode: "lumpsum"
        }
      });
      expect(result.valid).toBe(true);
    });

    test("Lumpsum with negative surplus should still pass (no surplus required)", () => {
      const result = validateGoalPlanningInput({
        goal: baseGoal,
        finance: {
          ...baseFinance,
          monthlyIncome: 50000,
          monthlyExpenses: 90000,
          emi: 10000,
          investmentMode: "lumpsum"
        }
      });
      expect(result.valid).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ MULTIPLE ERRORS
  // ════════════════════════════════════════════
  describe("Multiple Errors", () => {

    test("Multiple invalid fields should return multiple errors", () => {
      const result = validateGoalPlanningInput({
        goal: {
          type: "retirement",
          currentAge: -5,
          retirementAge: 30,
          lifeExpectancy: 20,
          targetMonthlyAmount: 0
        },
        finance: {
          monthlyIncome: -1000,
          monthlyExpenses: 40000,
          emi: 10000,
          currentSavings: -500,
          emergencyFundRequired: 50000,
          investmentMode: "sip"
        }
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(4);
    });

    test("All goal fields invalid should return multiple errors", () => {
      const result = validateGoalPlanningInput({
        goal: {
          type: "retirement",
          currentAge: "abc",
          retirementAge: "xyz",
          lifeExpectancy: false,
          targetMonthlyAmount: -100
        },
        finance: baseFinance
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    test("Both goal and finance blocks missing should return 2 REQUIRED errors", () => {
      const result = validateGoalPlanningInput({});
      expect(result.valid).toBe(false);
      expect(hasError(result.errors, "goal",    "REQUIRED")).toBe(true);
      expect(hasError(result.errors, "finance", "REQUIRED")).toBe(true);
    });

  });

  // ════════════════════════════════════════════
  // ❌ INVALID ROOT INPUT
  // ════════════════════════════════════════════
  describe("Invalid Root Input", () => {

    test("Null input should fail gracefully", () => {
      const result = validateGoalPlanningInput(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("Empty object input should fail", () => {
      const result = validateGoalPlanningInput({});
      expect(result.valid).toBe(false);
    });

    test("Array input should fail gracefully", () => {
      const result = validateGoalPlanningInput([]);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("String input should fail gracefully", () => {
      const result = validateGoalPlanningInput("invalid");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("Number input should fail gracefully", () => {
      const result = validateGoalPlanningInput(42);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test("Boolean input should fail gracefully", () => {
      const result = validateGoalPlanningInput(true);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

  });

  // ════════════════════════════════════════════
  // ❌ STOP ON FIRST ERROR FLAG
  // ════════════════════════════════════════════
  describe("stopOnFirstError flag", () => {

    test("stopOnFirstError=true should return exactly 1 error", () => {
      const result = validateGoalPlanningInput(
        {
          goal: {
            type: "retirement",
            currentAge: -5,
            retirementAge: 30,
            lifeExpectancy: 20,
            targetMonthlyAmount: 0
          },
          finance: {
            monthlyIncome: -1000,
            monthlyExpenses: 40000,
            emi: 10000,
            currentSavings: -500,
            emergencyFundRequired: 50000,
            investmentMode: "sip"
          }
        },
        true  // stopOnFirstError
      );
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });

    test("stopOnFirstError=false should return all errors", () => {
      const result = validateGoalPlanningInput(
        {
          goal: {
            type: "retirement",
            currentAge: -5,
            retirementAge: 30,
            lifeExpectancy: 20,
            targetMonthlyAmount: 0
          },
          finance: {
            monthlyIncome: -1000,
            monthlyExpenses: 40000,
            emi: 10000,
            currentSavings: -500,
            emergencyFundRequired: 50000,
            investmentMode: "sip"
          }
        },
        false 
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

  });

});