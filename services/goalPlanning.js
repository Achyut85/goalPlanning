const { validateGoalPlanningInput } = require("../utils/validateGoalPlanningInput");
const { validateGoalPlanningOutput } = require("../utils/validateGoalPlanningOutput");
const { buildGoalPrompt } = require("./buildGoalPrompt");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const calculateSurplus = ({
  monthlyIncome = 0,
  monthlyExpenses = 0,
  emi = 0
}) => {
  return Number(monthlyIncome) - Number(monthlyExpenses) - Number(emi);
};

const decideInvestmentMode = ({
  monthlyIncome = 0,
  monthlyExpenses = 0,
  emi = 0,
  currentSavings = 0,
  emergencyFundRequired = 0,
}) => {
  // 1️⃣ Calculate monthly surplus after EMI
  const safeSurplus = monthlyIncome - monthlyExpenses - emi;

  // 2️⃣ Calculate investable savings beyond emergency fund
  const investableSavings = currentSavings - emergencyFundRequired;

  // 3️⃣ Dynamic minimum lumpsum threshold (industry practice)
  const minLumpsumThreshold = Math.max(
    3 * monthlyExpenses,
    3 * Math.max(safeSurplus, 0)
  );

  // 4️⃣ Flags for what the user can do
  const canDoLumpsum = investableSavings >= minLumpsumThreshold;
  const canDoSIP = safeSurplus > 0;

  // 5️⃣ Decision logic
  if (canDoLumpsum && canDoSIP) return "hybrid"; // both possible
  if (canDoSIP) return "sip";                     // only SIP possible
  if (canDoLumpsum) return "lumpsum";            // only lumpsum possible

  return null; // nothing feasible
};


const goalPlanningService = async (data, inflationRate = 0.06) => {


  const inputValidation = validateGoalPlanningInput(data);

  if (!inputValidation.valid) {
    const error = new Error("Input validation failed");
    error.details = inputValidation.errors;
    throw error;
  }

const surplus = calculateSurplus(data.finance);

const investmentMode = decideInvestmentMode({
  monthlyIncome: data.finance.monthlyIncome,
  monthlyExpenses: data.finance.monthlyExpenses,
  emi: data.finance.emi,
  currentSavings: data.finance.currentSavings,
  emergencyFundRequired: data.finance.emergencyFundRequired
});

  if (!investmentMode) {
    throw new Error("User not eligible for investment planning.");
  }

 
  const enrichedInput = {
    ...data,
    system: {
      surplus,
      investmentMode,
      inflationRate
    }
  };


  const prompt = buildGoalPrompt(enrichedInput);

  try {


    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      },
    });

    const aiRaw = response.text;

    let parsed;

    try {
      parsed = JSON.parse(aiRaw);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

 
    // const outputValidation =
    //   validateGoalPlanningOutput(parsed, investmentMode);

    // if (!outputValidation.valid) {
    //   const error = new Error("AI output validation failed");
    //   error.details = outputValidation.errors;
    //   throw error;
    // }

   
    return {
      success: true,
      message: "Goal plan generated",
      aiResponse: parsed,
    };

  } catch (error) {

    if (error.details) {
      throw error;
    }

    console.error("Gemini Error:", error.message);
    throw new Error("AI Generation failed");
  }
};

module.exports = goalPlanningService;