const User = require("../models/users");


const createUser = async (data) => {
  return await User.create(data);
};


const getUserById = async (userId) => {
  return await User.findById(userId);
};


const updateUserFinancials = async (userId, data) => {
  return await User.findByIdAndUpdate(
    userId,
    { $set: data },
    { new: true }
  );
};

const deleteUser = async (userId) => {
  return await User.findByIdAndDelete(userId);
};


const getUserFinancialSnapshot = async (userId) => {
  return await User.findById(userId).select(
    "monthlyIncome monthlyExpenses emi riskProfile emergencyFundAmount"
  );
};

const getUserBasicInfo = async (userId) => {
  return await User.findById(userId)
    .select("name dateOfBirth")
    .lean();
};

module.exports = {
  createUser,
  getUserById,
  updateUserFinancials,
  deleteUser,
  getUserFinancialSnapshot,
  getUserBasicInfo
};