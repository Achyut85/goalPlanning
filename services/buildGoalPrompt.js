const {
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
} = require("../constants/goalPlanningPrompt.js");

const { buildPromptInput } = require("../utils/goalPlanningInputMapper.js"); 



const getFvLogic = (goalType) =>
  goalType.trim().toLowerCase() === "retirement" ? retirementFV : otherFV;


const commonCoreSteps = (mappedInput, fvLogic) => `
${commonPrompt}
INPUT:
${mappedInput}
[S1-EMERGENCY]${emergencyFundCheck}
[S2-RISK]${riskProfile}
[S3-FV]${fvLogic}
[S4-SPLIT]${assetSplit}`;


const buildGoalPrompt = (requestBody , riskProfile, currentInflation) => {
  const mappedInput = buildPromptInput(requestBody , riskProfile, currentInflation);
  const fvLogic = getFvLogic(requestBody.goal.type);

  const base = commonCoreSteps(mappedInput, fvLogic);

  const modeBlocks = {
    sip: `[S5-SIP]${sipCalculation}\n[S6-OUT]${outPutSip}`,
    lumpsum: `[S5-LUMPSUM]${lumpSumCalculation}\n[S6-OUT]${outPutLumpSum}`,
    hybrid: `[S5-HYBRID]${hybridCalculation}\n[S6-OUT]${hybridOutput}`,
  };

  const mode = requestBody.finance?.investmentMode
    ?.trim()
    .toLowerCase();

  if (!modeBlocks[mode]) {
    throw new Error(`Invalid investmentMode: ${mode}`);
  }

  return `${base}\n${modeBlocks[mode]}`;
};

module.exports = { buildGoalPrompt };