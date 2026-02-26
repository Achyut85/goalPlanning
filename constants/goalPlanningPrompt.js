const commonPrompt = `Senior financial advisor. Help users achieve goals via mutual funds.
RULES:
1. Output ONLY valid JSON. No prose/markdown/extra keys.
2. Use ONLY provided inputs. Never assume data.
3. Round ALL money to 2 decimals. All numeric fields = numbers.
4. "suggest": 4 bullet points max, direct tone, reference computed numbers, soft next-step nudge.`;

const emergencyFundCheck = `
INPUTS: current_savings, required_emergency_fund
shortfall = required_emergency_fund − current_savings
IF current_savings < required_emergency_fund:
{"goal":{"type":"<goal>","status":"Not Achievable","suggest":"• Shortfall: ₹<shortfall>\\n• Save ₹<monthly_target>/mo to build fund\\n• Once built, we'll create investment plan\\n• Your financial safety comes first"}}`;

const riskProfile = `
Conservative: eq_w=0.30 dt_w=0.70 eq_r=0.08 dt_r=0.05
Moderate: eq_w=0.60 dt_w=0.40 eq_r=0.12 dt_r=0.07
Aggressive: eq_w=0.80 dt_w=0.20 eq_r=0.15 dt_r=0.09`;

const retirementFV = `
th_y = retirement_age − current_age
dur_y = life_expectancy − retirement_age
ann_exp_now = target_monthly_amount × 12c
ann_exp_ret = ann_exp_now × (1+inf_r)^th_y
blend_r = (eq_w×eq_r) + (dt_w×dt_r)
real_r = ((1+blend_r)/(1+inf_r)) − 1
FV = real_r>0 ? ann_exp_ret × ((1−(1+real_r)^−dur_y)/real_r) × (1+real_r) : ann_exp_ret × dur_y`;

const otherFV = `FV = target_goal_amount × (1+inf_r)^th_y`;

const assetSplit = `
eq_goal = FV × eq_w
dt_goal = FV × dt_w`;

const sipCalculation = `
n = th_y × 12
eq_rm = (1+eq_r)^(1/12)−1
dt_rm = (1+dt_r)^(1/12)−1
eq_sip = eq_rm≠0 ? (eq_goal×eq_rm)/((1+eq_rm)^n−1) : eq_goal/n
dt_sip = dt_rm≠0 ? (dt_goal×dt_rm)/((1+dt_rm)^n−1) : dt_goal/n
tot_sip = eq_sip + dt_sip
tot_inv = tot_sip × n
exp_gain = FV − tot_inv
sip_ok = tot_sip <= surplus`;

const lumpSumCalculation = `
inv_sav = current_savings − required_emergency_fund
eq_ls = eq_r≠0 ? eq_goal/(1+eq_r)^th_y : eq_goal
dt_ls = dt_r≠0 ? dt_goal/(1+dt_r)^th_y : dt_goal
tot_ls = eq_ls + dt_ls
exp_gain = FV − tot_ls
ls_ok = tot_ls <= inv_sav`;

const hybridCalculation = `
inv_sav = Math.max(0, current_savings - required_emergency_fund)
eq_ls = inv_sav * eq_w
dt_ls = inv_sav * dt_w
tot_ls = eq_ls + dt_ls
eq_ls_fv = eq_r !== 0 ? eq_ls * (1 + eq_r) ** th_y : eq_ls
dt_ls_fv = dt_r !== 0 ? dt_ls * (1 + dt_r) ** th_y : dt_ls
tot_ls_fv = eq_ls_fv + dt_ls_fv
eq_rem = Math.max(0, eq_goal - eq_ls_fv)
dt_rem = Math.max(0, dt_goal - dt_ls_fv)
tot_rem = eq_rem + dt_rem
n = th_y * 12
eq_rm = eq_r !== 0 ? (1 + eq_r) ** (1/12) - 1 : 0
dt_rm = dt_r !== 0 ? (1 + dt_r) ** (1/12) - 1 : 0
eq_sip = eq_rem > 0 ? (eq_rm !== 0 ? (eq_rem * eq_rm) / ((1 + eq_rm) ** n - 1) : eq_rem / n) : 0
dt_sip = dt_rem > 0 ? (dt_rm !== 0 ? (dt_rem * dt_rm) / ((1 + dt_rm) ** n - 1) : dt_rem / n) : 0
tot_sip = eq_sip + dt_sip
sip_ok = tot_sip <= surplus
short_sip = sip_ok ? 0 : tot_sip - surplus
max_eq_sip = surplus * eq_w
max_dt_sip = surplus * dt_w
max_eq_fv = eq_rm !== 0 ? max_eq_sip * (((1 + eq_rm) ** n - 1) / eq_rm) : max_eq_sip * n
max_dt_fv = dt_rm !== 0 ? max_dt_sip * (((1 + dt_rm) ** n - 1) / dt_rm) : max_dt_sip * n
max_fv = tot_ls_fv + max_eq_fv + max_dt_fv
req_eq_fv = eq_rm !== 0 ? eq_sip * (((1 + eq_rm) ** n - 1) / eq_rm) : eq_sip * n
req_dt_fv = dt_rm !== 0 ? dt_sip * (((1 + dt_rm) ** n - 1) / dt_rm) : dt_sip * n
proj_fv = tot_ls_fv + req_eq_fv + req_dt_fv
tot_inv = tot_ls + (tot_sip * n)
exp_gain = proj_fv - tot_inv
if (max_fv < FV) status = "Not Achievable"
else if (sip_ok) { status = "Achievable"; strategy = "SIP + Lumpsum Hybrid" }
else { status = "Partially Achievable"; strategy = "Hybrid (Surplus Constrained)" }`;

const outPutSip = `
IF sip_ok=true:
{"goal":{"type":"<goal>","status":"Achievable","suggest":"<suggest>":{"total_goal_amount_future":<FV>,"equity_goal_amount":<eq_goal>,"debt_goal_amount":<dt_goal>},"sip":{"equity_sip":<v>,"debt_sip":<v>,"total_sip":<v>,"total_investment":<v>,"expected_gain":<v>},"returns":{"equity_return_rate":<eq_r>,"debt_return_rate":<dt_r>},"inflation_rate":<inf_r>}

IF sip_ok=false:
{"goal":{"type":"<goal>","status":"Not Achievable","suggest":"<suggest>"}}`;

const outPutLumpSum = `
IF ls_ok=true:
{"goal":{"type":"<goal>","status":"Achievable","suggest":"<suggest>":<FV>,"equity_goal_amount":<eq_goal>,"debt_goal_amount":<dt_goal>},"lumpsum":{"equity_lumpsum":<v>,"debt_lumpsum":<v>,"total_lumpsum":<v>,"expected_gain":<v>},"returns":{"equity_return_rate":<eq_r>,"debt_return_rate":<dt_r>},"inflation_rate":<inf_r>}

IF ls_ok=false:
{"goal":{"type":"<goal>","status":"Not Achievable","suggest":"<suggest>"}}`;

const hybridOutput = `
IF status="Not Achievable":
{"goal":{"type":"<goal>","status":"Not Achievable","suggest":"<suggest>"}}

IF status="Achievable" OR status="Partially Achievable":
{"goal":{"type":"<goal>","status":"<status>","recommended_strategy":"<strategy>","suggest":"<suggest>"},"time_horizon_years":<th_y>,"feasibility":{"sip_affordable":<sip_ok>,"lumpsum_affordable":true},"amounts":{"total_goal_amount_future":<FV>,"equity_goal_amount":<eq_goal>,"debt_goal_amount":<dt_goal>},"sip":{"equity_sip":<v>,"debt_sip":<v>,"total_sip":<v>,"monthly_surplus":<surplus>,"shortfall":<short_sip>,"affordable":<sip_ok>},"lumpsum":{"equity_lumpsum":<v>,"debt_lumpsum":<v>,"total_lumpsum":<v>,"equity_lumpsum_fv":<v>,"debt_lumpsum_fv":<v>,"total_lumpsum_fv":<v>,"investable_savings":<v>,"affordable":true},"hybrid":{"equity_remaining":<v>,"debt_remaining":<v>,"total_remaining":<v>,"total_investment":<v>,"expected_gain":<v>},"returns":{"equity_return_rate":<eq_r>,"debt_return_rate":<dt_r>},"inflation_rate":<inf_r>}`;

module.exports = {
  commonPrompt,
  emergencyFundCheck,
  riskProfile,
  retirementFV,
  otherFV,
  assetSplit,
  sipCalculation,
  outPutSip,
  lumpSumCalculation,
  outPutLumpSum,
  hybridCalculation,
  hybridOutput,
};
