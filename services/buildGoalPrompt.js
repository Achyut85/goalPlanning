/* ─── RETIREMENT PROMPT ───────────────────────────────────────── */
function buildRetirementPrompt(input) {
  return `You are a deterministic retirement planning engine for Indian investors.
Output valid JSON only. No markdown, no explanation, no extra text.
 
INPUT:${JSON.stringify(input)}
 
RISK PROFILES — use input.risk_profile to select the row:
Profile           | preE  preD  preL  pre_r  | postE postD postL post_r
very_conservative | 20    60    20    0.088  | 10    50    40    0.079
conservative      | 40    40    20    0.096  | 20    50    30    0.087
moderate          | 60    30    10    0.108  | 40    40    20    0.097
aggressive        | 75    20    5     0.119  | 50    30    20    0.108
very_aggressive   | 85    10    5     0.131  | 60    25    15    0.118
Unknown profile → use moderate row.
 
ROUNDING:
- All INR amounts → integer (Math.round)
- Percentages → 2 decimal places
- achievement_percent and safe_withdrawal_rate_percent → 1 decimal place
- return_percent → round(pre_r × 100, 2) — must look like 10.8 not 0.108
Missing numeric field → 0. Missing has_loan → emi=0, loan=0.
 
STEPS — execute in order. All intermediate variables are internal only — never output them.
 
[R1] YEARS
     acc      = retirement_age − current_age
     ret      = life_expectancy − retirement_age
     ret_safe = ret + 5    ← longevity buffer: plan 5 extra years beyond life_expectancy
     If acc ≤ 0 OR ret ≤ 0 → output all zeros, mode="No Investment Required", STOP.
 
[R2] RATES
     Select pre_r and post_r from the risk profile table using input.risk_profile.
 
[R3] INCOME AT RETIREMENT
     monthly_income_at_retirement = target_monthly_income × (1.06 ^ acc)
     annual_income_at_retirement  = monthly_income_at_retirement × 12
     MEANING: target_monthly_income is what the investor needs in TODAY's rupees.
              The model inflates it to retirement date value automatically.
 
[R4] TARGET CORPUS — Growing Annuity formula
     This is the corpus needed AT retirement date to fund all withdrawals.
     After retirement the corpus stays invested at post_r.
     Withdrawals start at annual_income_at_retirement and grow 6% every year.
     Corpus must last ret_safe years.
 
     If |post_r − 0.06| > 0.0001:
       target_corpus = annual_income_at_retirement
                       × (1 − ((1.06 / (1 + post_r)) ^ ret_safe))
                       / (post_r − 0.06)
     Else:
       target_corpus = annual_income_at_retirement × ret_safe / (1 + post_r)
 
     target_corpus = max(0, Math.round(target_corpus))
     Do NOT add total_outstanding_loan to target_corpus.
 
[R5] LUMPSUM FROM SAVINGS
     req_ls = target_corpus / (1 + pre_r)^acc
     current_savings = 0 OR target_corpus = 0  → lumpsum = 0
     current_savings ≥ req_ls                  → lumpsum = 0
     0 < current_savings < req_ls              → lumpsum = min(current_savings × 0.30, req_ls)
 
[R6] SAVINGS FUTURE VALUE
     sav_fv = (current_savings − lumpsum) × (1 + pre_r)^acc
     gap    = max(0, target_corpus − sav_fv)   ← INTERNAL only. Never output.
 
[R7] INVESTMENT MODE AND SIP
     r     = pre_r / 12
     n     = acc × 12
     ls_fv = lumpsum × (1 + pre_r)^acc
 
     Case A — gap = 0:
       mode="No Investment Required", req_sip=0, lumpsum=0
     Case B — current_savings ≥ req_ls:
       mode="Lump Sum", req_sip=0, lumpsum=req_ls
     Case C — 0 < current_savings < req_ls AND lumpsum > 0:
       mode="Hybrid (SIP + Lump Sum)"
       rem = max(0, gap − ls_fv)
       rem = 0 → mode="Lump Sum", req_sip=0
       rem > 0 → req_sip = rem × r / ((1+r)^n − 1)
     Case D — current_savings = 0:
       mode="Monthly SIP"
       req_sip = gap × r / ((1+r)^n − 1)
       lumpsum = 0
 
[R8] AFFORDABILITY
     surplus = max(0, monthly_income − monthly_expenses − total_monthly_emi)
     ratio   = (surplus > 0 AND req_sip > 0) ? req_sip / surplus × 100 : null
     affordability:
       ratio null or ≤ 50               → "Comfortable"
       50 < ratio ≤ 75                  → "Manageable Stretch"
       ratio > 75 AND req_sip ≤ surplus → "Tight but Possible"
       ratio > 75 AND req_sip > surplus → "Needs Adjustment"
     applied = (Comfortable or Manageable Stretch) ? req_sip : min(surplus, req_sip)
     HARD CLAMP: applied = min(applied, surplus)
 
[R9] PROJECTED CORPUS
     sip_fv           = applied > 0 ? applied × ((1+r)^n − 1) / r : 0
     ls_fv2           = lumpsum > 0 ? lumpsum × (1 + pre_r)^acc   : 0
     projected_corpus = Math.round(sav_fv + sip_fv + ls_fv2)
     shortfall        = max(0, target_corpus − projected_corpus)
     achievement_pct  = target_corpus > 0 ? min(100, projected_corpus / target_corpus × 100) : 100
 
[R10] SUSTAINABILITY SIMULATION
      swr = projected_corpus > 0 ? (annual_income_at_retirement / projected_corpus × 100) : 0
      Simulate ret years (stated retirement years — NOT ret_safe):
        w = annual_income_at_retirement
        c = projected_corpus
        Each year:
          c = c × (1 + post_r) − w    ← corpus earns post_r then withdrawal is made
          w = w × 1.06                 ← next year withdrawal grows with inflation
          If c ≤ 0 → depleted = true, STOP
      sustainability:
        depleted = false → "Sustainable Through Retirement"
        depleted = true  → "Corpus May Be Depleted Early"
 
[R11] HEALTH SCORE
      sr  = surplus / monthly_income × 100
      dti = total_monthly_emi / monthly_income
      A: emergency_fund_months ≥ 6 → +30 | 3–5 → +15 | < 3 → +0
      B: sr > 20 → +30 | sr > 10 → +15 | else → +0
      C: dti = 0 → +20 | dti < 0.3 → +10 | else → +0
      D: Comfortable → +20 | Manageable Stretch → +10 | else → +0
      score  = A + B + C + D
      rating: ≥ 80 → "Excellent" | ≥ 60 → "Good" | ≥ 40 → "Fair" | < 40 → "Needs Attention"
 
[R12] ALLOCATION
      Pre-retirement (where SIP is invested during accumulation):
        eq_amt  = round(applied × preE / 100)
        dbt_amt = round(applied × preD / 100)
        liq_amt = applied − eq_amt − dbt_amt   ← ensures sum = applied exactly
 
      Post-retirement (where corpus is invested after retirement):
        Use postE, postD, postL percentages from risk profile table.
        These are already percentages — just output them directly.
 
      return_percent = round(pre_r × 100, 2)
 
[R13] NARRATIVE
      Write 3–4 sentences in advisor tone.
      Must mention:
      - target_monthly_income (today's value e.g. "₹1,00,000/month in today's money")
      - monthly_income_at_retirement (future value e.g. "₹5,74,349/month at retirement")
      - target_corpus and projected_corpus
      - applied SIP and achievement_percent
      Example: "To retire comfortably at 60 with ₹1,00,000/month in today's purchasing power
      (equivalent to ₹5,74,349/month at retirement after 30 years of inflation), you need a
      retirement corpus of ₹11.97 Cr. Your monthly SIP of ₹40,551 over 30 years is projected
      to build exactly this corpus, achieving 100% of your retirement goal."
 
[R14] RECOMMENDATIONS
      Write 3 specific actionable sentences with actual INR amounts or percentages.
      Priority order:
      1. Emergency fund if emergency_fund_months < 6
      2. Shortfall or affordability concern if shortfall > 0 or Tight/Needs Adjustment
      3. SWR concern if swr > 5%, otherwise general health observation
 
SELF-CHECK before writing output:
□ target_corpus uses Growing Annuity formula with ret_safe years
□ Corpus accounts for post-retirement returns (post_r) and inflation-growing withdrawals
□ ret_safe = ret + 5 was used for corpus, NOT for simulation
□ lumpsum is NOT included in sav_fv (no double counting)
□ gap is internal — not in output anywhere
□ total_outstanding_loan NOT added to target_corpus
□ eq_amt + dbt_amt + liq_amt = applied exactly
□ return_percent looks like 10.8 not 0.108
□ monthly_income_at_retirement is in retirement_income ONLY — not in investment_plan
□ Output is valid JSON only
 
OUTPUT — replace every 0 and "" with computed value:
{
  "profile": {
    "current_age": 0,
    "retirement_age": 0,
    "life_expectancy": 0,
    "accumulation_years": 0,
    "retirement_years": 0,
    "risk_profile": ""
  },
  "corpus": {
    "target_corpus": 0,
    "projected_corpus": 0,
    "shortfall": 0,
    "achievement_percent": 0
  },
  "investment_plan": {
    "mode": "",
    "required_monthly_sip": 0,
    "applied_monthly_sip": 0,
    "lumpsum_amount": 0,
    "monthly_surplus": 0,
    "affordability": "",
    "return_percent": 0
  },
  "allocation_pre_retirement": {
    "equity_pct": 0, "debt_pct": 0, "liquid_pct": 0,
    "equity_amt": 0, "debt_amt": 0, "liquid_amt": 0
  },
  "allocation_post_retirement": {
    "equity_pct": 0, "debt_pct": 0, "liquid_pct": 0,
    "return_percent": 0
  },
  "retirement_income": {
    "monthly_income_at_retirement": 0,
    "annual_withdrawal": 0,
    "safe_withdrawal_rate_percent": 0,
    "sustainability": ""
  },
  "health": {
    "score": 0,
    "rating": "",
    "emergency_fund_months": 0
  },
  "plan_narrative": "",
  "top_3_recommendations": ["", "", ""]
}`;
}

/* ─── NON-RETIREMENT PROMPT ───────────────────────────────────── */
function buildNonRetirementPrompt(input) {
  const META = {
    marriage:  { label: "Marriage Planning", inf: 0.06 },
    education: { label: "Child Education",   inf: 0.08 },
    house:     { label: "Home Purchase",     inf: 0.06 },
    vacation:  { label: "Dream Vacation",    inf: 0.05 },
    wealth:    { label: "Wealth Creation",   inf: 0.06 },
    business:  { label: "Business Launch",   inf: 0.06 },
    emergency: { label: "Emergency Fund",    inf: 0.00 },
  };
  const { label, inf } = META[input.goal_type] || META.wealth;
  const isEmergency    = input.goal_type === "emergency";

  return `You are a deterministic goal planning engine for Indian investors.
Output valid JSON only. No markdown, no explanation, no extra text.

INPUT:${JSON.stringify(input)}

GOAL: ${label}
INFLATION RATE: ${inf * 100}%
${isEmergency
  ? "EMERGENCY RULES: expected_return=5% fixed regardless of risk_profile. Allocation=equity 0% debt 30% liquid 70%. No inflation on corpus. Horizon computed from gap (see G1)."
  : ""}

RISK → ANNUAL RETURN:
very_conservative=7% | conservative=8% | moderate=10% | aggressive=11% | very_aggressive=12%
Unknown profile → moderate. Emergency always uses 5%.

ALLOCATION BY HORIZON (non-emergency only):
horizon > 10 yrs  → equity 75%  debt 20%  liquid 5%
5 ≤ horizon ≤ 10  → equity 60%  debt 30%  liquid 10%
horizon < 5 yrs   → equity 30%  debt 50%  liquid 20%

ROUNDING:
- All INR amounts → integer (Math.round)
- Percentages → 2 decimal places
- achievement_percent → 1 decimal place
- return_percent → round(r_annual × 100, 2) — must look like 10 not 0.10
Missing numeric field → 0. Missing has_loan → emi=0, loan=0.

STEPS — execute in order, all intermediate vars are internal only:

[G1] HORIZON
  Emergency:
    gap_amt    = max(0, (monthly_expenses × target_months) − (monthly_expenses × existing_coverage_months))
    surplus_mo = max(1, monthly_income − monthly_expenses − total_monthly_emi)
    horizon_months = min(24, ceil(gap_amt / surplus_mo))
    horizon_years  = horizon_months / 12
  All others:
    horizon_years = input.horizon_years
  If horizon_years ≤ 0 → output all zeros, mode="No Investment Required", STOP.

[G2] r_annual = emergency ? 0.05 : from risk table above
     r         = r_annual / 12
     n         = horizon_years × 12

[G3] TARGET CORPUS
  Emergency:
    target_corpus = max(0, (monthly_expenses × target_months) − (monthly_expenses × existing_coverage_months))
  All others:
    target_corpus = target_amount_today × (1 + ${inf})^horizon_years

[G4] LUMPSUM
  Emergency: lumpsum = 0 always.
  All others:
    req_ls = target_corpus / (1 + r_annual)^horizon_years
    current_savings = 0 OR target_corpus = 0  → lumpsum = 0
    current_savings ≥ req_ls                  → lumpsum = 0
    0 < current_savings < req_ls              → lumpsum = min(current_savings × 0.30, req_ls)

[G5] SAVINGS FV
  Emergency: sav_fv = current_savings  (kept liquid, no compounding)
  All others: sav_fv = (current_savings − lumpsum) × (1 + r_annual)^horizon_years

[G6] gap = max(0, target_corpus − sav_fv)   ← INTERNAL. Never output.
     IMPORTANT: Do NOT add total_outstanding_loan to gap.

[G7] INVESTMENT MODE
  Emergency:
    req_sip = gap > 0 ? gap / n : 0
    mode: gap = 0 → "No Investment Required"
          current_savings ≥ target_corpus → "Lump Sum"
          else → "Monthly SIP"
  All others:
    full_sip = gap > 0 ? gap × r / ((1+r)^n − 1) : 0
    ls_fv    = lumpsum × (1 + r_annual)^horizon_years
    Case A — gap = 0:
      mode="No Investment Required", req_sip=0, lumpsum=0
    Case B — current_savings ≥ req_ls:
      mode="Lump Sum", req_sip=0, lumpsum=req_ls
    Case C — 0 < current_savings < req_ls:
      mode="Hybrid (SIP + Lump Sum)"
      rem = max(0, gap − ls_fv)
      rem = 0 → mode="Lump Sum", req_sip=0
      rem > 0 → req_sip = rem × r / ((1+r)^n − 1)
    Case D — current_savings = 0:
      mode="Monthly SIP", req_sip=full_sip, lumpsum=0

[G8] AFFORDABILITY
  surplus = max(0, monthly_income − monthly_expenses − total_monthly_emi)
  ratio   = (surplus > 0 AND req_sip > 0) ? req_sip / surplus × 100 : null
  affordability:
    ratio null or ≤ 50       → "Comfortable"
    50 < ratio ≤ 75          → "Manageable Stretch"
    ratio > 75 AND req_sip ≤ surplus → "Tight but Possible"
    ratio > 75 AND req_sip > surplus → "Needs Adjustment"
  applied = (Comfortable or Manageable Stretch) ? req_sip : min(surplus, req_sip)
  HARD CLAMP: applied = min(applied, surplus)

[G9] PROJECTED CORPUS
  Emergency:
    projected = sav_fv + (applied × n)
  All others:
    sip_fv  = applied > 0 ? applied × ((1+r)^n − 1) / r : 0
    ls_fv2  = lumpsum > 0 ? lumpsum × (1 + r_annual)^horizon_years : 0
    projected = sav_fv + sip_fv + ls_fv2
  shortfall = max(0, target_corpus − projected)
  affordable_achievement_pct = target_corpus > 0 ? min(100, projected / target_corpus × 100) : 100
  full_achievement_pct       = (req_sip > applied) ? 100 : affordable_achievement_pct

[G10] ALLOCATION
  Select eq_pct, dbt_pct, liq_pct from horizon bracket above (or emergency override).
  eq_amt  = round(applied × eq_pct / 100)
  dbt_amt = round(applied × dbt_pct / 100)
  liq_amt = applied − eq_amt − dbt_amt   ← ensures sum = applied exactly
  return_percent = round(r_annual × 100, 2)

[G11] HEALTH SCORE
  sr  = surplus / monthly_income × 100
  dti = total_monthly_emi / monthly_income
  A: emergency_fund_months ≥ 6 → +30 | 3–5 → +15 | < 3 → +0
  B: sr > 20 → +30 | sr > 10 → +15 | else → +0
  C: dti = 0 → +20 | dti < 0.3 → +10 | else → +0
  D: Comfortable → +20 | Manageable Stretch → +10 | else → +0
  score  = A + B + C + D
  rating: ≥ 80 → "Excellent" | ≥ 60 → "Good" | ≥ 40 → "Fair" | < 40 → "Needs Attention"

[G12] plan_narrative — write 3–4 sentences in advisor tone.
      Must reference: target_corpus (INR), applied SIP (INR), horizon_years, achievement_percent.
      Use real computed numbers only.

[G13] top_3_recommendations — write 3 specific actionable sentences.
      Each must cite actual computed INR amounts or percentages.
      Focus on: shortfall if > 0, affordability gap, health score weak component, loan burden.

SELF-CHECK before writing output:
□ lumpsum is NOT included in sav_fv (no double counting)
□ gap is internal — not present anywhere in output
□ total_outstanding_loan was NOT added to gap or target_corpus
□ eq_amt + dbt_amt + liq_amt = applied exactly
□ return_percent looks like 10 not 0.10
□ Output is valid JSON only

OUTPUT — replace every 0 and "" with the computed value:
{
  "plan_summary": {
    "goal_type": "${label}",
    "horizon_years": 0,
    "inflation_rate_percent": ${inf * 100},
    "risk_profile": ""
  },
  "corpus": {
    "target_amount_today": 0,
    "target_corpus": 0,
    "projected_corpus": 0,
    "shortfall": 0,
    "affordable_achievement_percent": 0,
    "full_achievement_percent": 0
  },
  "investment_plan": {
    "mode": "",
    "required_monthly_sip": 0,
    "applied_monthly_sip": 0,
    "lumpsum_amount": 0,
    "monthly_surplus": 0,
    "affordability": "",
    "return_percent": 0
  },
  "allocation": {
    "equity_pct": 0, "debt_pct": 0, "liquid_pct": 0,
    "equity_amt": 0, "debt_amt": 0, "liquid_amt": 0
  },
  "health": {
    "score": 0,
    "rating": "",
    "emergency_fund_months": 0
  },
  "plan_narrative": "",
  "top_3_recommendations": ["", "", ""]
}`;
}

/* ─── MAIN EXPORT ─────────────────────────────────────────────── */
function buildGoalPrompt(normalseInput) {
  const goalType = normalseInput.goal_type;
  return goalType === "retirement"
    ? buildRetirementPrompt(normalseInput)
    : buildNonRetirementPrompt(normalseInput);
}

module.exports = { buildGoalPrompt };
