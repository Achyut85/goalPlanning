const { validateGoalPlanningInput } = require("../utils/validateGoalPlanningInput");
const { normaliseGoalInput }        = require("../utils/normaliseGoalInput");
const { buildGoalPrompt }           = require("./buildGoalPrompt");
const { GoogleGenAI }               = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const callGemini = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: { responseMimeType: "application/json" },
  });
  try {
    return JSON.parse(response.text);
  } catch {
    throw new Error("AI returned invalid JSON");
  }
};

const goalPlanningService = async (data) => {
  const goalType = data.goal;
  const input    = data.answers;


  const normalisedInput = normaliseGoalInput(goalType, input);

  const inputValidation = validateGoalPlanningInput(normalisedInput);
  if (!inputValidation.valid) {
    const error = new Error("Input validation failed");
    error.status  = 400;
    error.details = inputValidation.errors;
    throw error;
  }


  const prompt = buildGoalPrompt(normalisedInput); 

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("AI request timed out")), 100000)
  );

  let planData;
  try {
    planData = await Promise.race([callGemini(prompt), timeout]);
  } catch (err) {
    console.error("Gemini Error:", err.message);
    throw new Error(err.message || "AI generation failed");
  }

  return planData; 
};

module.exports = goalPlanningService;