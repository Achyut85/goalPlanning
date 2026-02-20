const { validateGoalPlanningInput } = require("../utils/validateGoalPlanningInput");
const { validateGoalPlanningOutput } = require("../utils/validateGoalPlanningOutput");
const { buildGoalPrompt } = require("./buildGoalPrompt");
const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const goalPlanningService = async (data, riskProfile = "moderate", inflationRate = 0.06) => {
    
    const inputValidation = validateGoalPlanningInput(data);
    if (!inputValidation.valid) {
        const error = new Error("Input validation failed");
        error.details = inputValidation.errors;
        throw error;
    }

    const investmentMode = data.finance?.investmentMode || "SIP";

  
    const prompt = buildGoalPrompt(data, riskProfile, inflationRate);

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

        
        const outputValidation = validateGoalPlanningOutput(parsed, investmentMode);
        if (!outputValidation.valid) {
            const error = new Error("AI output validation failed");
            error.details = outputValidation.errors;
            throw error;
        }

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