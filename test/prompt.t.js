
const {buildGoalPrompt } = require("../services/buildGoalPrompt") 



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

  const safeSurplus = monthlyIncome - monthlyExpenses - emi;


  const investableSavings = currentSavings - emergencyFundRequired;


  const minLumpsumThreshold = Math.max(
    3 * monthlyExpenses,
    3 * Math.max(safeSurplus, 0)
  );


  const canDoLumpsum = investableSavings >= minLumpsumThreshold;
  const canDoSIP = safeSurplus > 0;


  if (canDoLumpsum && canDoSIP) return "hybrid"; 
  if (canDoSIP) return "sip";                     
  if (canDoLumpsum) return "lumpsum";            

  return null; 
};


// const requestBody = {
//   goal: {
//     type: "Retirement",
//     currentAge: 30,
//     retirementAge: 60,
//     lifeExpectancy: 90,
//     targetMonthlyAmount: 60000
//   },
//   finance: {
//     monthlyIncome: 100001,
//     monthlyExpenses: 40000,
//     emi: 10000,
//     currentSavings: 500000,   
//     emergencyFundRequired: 120000  
//   },
//   riskProfile: "very_conservative",
// };

const requestBody = {
  goal: {
    type: "ChildEducation",
    childCurrentAge: 5,
    educationAge: 18,
    targetAmount: 2500000   // already inflated OR raw target
  },
  finance: {
    monthlyIncome: 100001,
    monthlyExpenses: 40000,
    emi: 10000,
    currentSavings: 300000,
    emergencyFundRequired: 120000
  },
  riskProfile: "moderate",
};


// const requestBody = {
//   goal: {
//     type: "BuyHouse",
//     yearsToPurchase: 5,
//     targetAmount: 7000000,      // full future house cost
//     downPaymentPercent: 0.20    // 20% down payment
//   },
//   finance: {
//     monthlyIncome: 100001,
//     monthlyExpenses: 40000,
//     emi: 10000,
//     currentSavings: 500000,
//     emergencyFundRequired: 120000
//   },
//   riskProfile: "moderate",
// };

// const requestBody = {
//   goal: {
//     type: "Other",
//     timeHorizonYears: 10,
//     targetAmount: 2000000
//   },
//   finance: {
//     monthlyIncome: 100001,
//     monthlyExpenses: 40000,
//     emi: 10000,
//     currentSavings: 200000,
//     emergencyFundRequired: 120000
//   },
//   riskProfile: "aggressive",
// };

const data = requestBody;


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
      inflationRate:0.06
    }
  };

console.log(buildGoalPrompt(enrichedInput));