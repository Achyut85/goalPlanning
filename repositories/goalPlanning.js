const Goal = require("../models/goalPlanning");


const createGoal = async (data) => {
  return await Goal.create(data);
};

const getGoalsByUserId = async (userId) => {
  return await Goal.find({ userId });
};


const getGoalById = async (goalId) => {
  return await Goal.findById(goalId);
};

const updateGoal = async (goalId, data) => {
  return await Goal.findByIdAndUpdate(
    goalId,
    { $set: data },
    { new: true }
  );
};


const deleteGoal = async (goalId) => {
  return await Goal.findByIdAndDelete(goalId);
};


const countGoalsByStatus = async (userId, status) => {
  return await Goal.countDocuments({ userId, status });
};




const getGoalsForAnalysis = async (userId) => {
  return await Goal.find({ userId })
    .select(`
      goalType
      status
      timeHorizonYears

      assumptions.inflationRate
      assumptions.equityReturnRate
      assumptions.debtReturnRate

      allocation.totalGoalAmountFuture
      allocation.equityGoalAmount
      allocation.debtGoalAmount

      strategy.type
      strategy.totalSip
      strategy.totalLumpsum
      strategy.totalInvestment
      strategy.expectedGain

      feasibility.sipAffordable
      feasibility.shortfall
      feasibility.monthlySurplus
    `)
    .lean();
};




const getGoalMetrics = async (userId) => {
  return await Goal.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: null,
        totalGoals: { $sum: 1 },
        achievableGoals: {
          $sum: { $cond: [{ $eq: ["$status", "Achievable"] }, 1, 0] }
        },
        notAchievableGoals: {
          $sum: { $cond: [{ $eq: ["$status", "Not Achievable"] }, 1, 0] }
        },
        totalShortfall: { $sum: "$shortfall" }
      }
    }
  ]);
};

module.exports = {
  createGoal,
  getGoalsByUserId,
  getGoalById,
  updateGoal,
  deleteGoal,
  countGoalsByStatus,
  getGoalsForAnalysis,
  getGoalMetrics
};