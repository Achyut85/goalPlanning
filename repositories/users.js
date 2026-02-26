const User = require("../models/users");


const createUser = (data) => {
  return User.create(data);
};


const getUserByExternalIds = (externalPid, externalUserId) => {
  return User.findOne({
    externalPid,
    externalUserId,
    isDeleted: false
  }).lean();
};


const updateUserFinancials = (externalPid, externalUserId, data) => {
  return User.findOneAndUpdate(
    {
      externalPid,
      externalUserId,
      isDeleted: false
    },
    { $set: data },
    {
      new: true,
      runValidators: true
    }
  ).lean();
};


const softDeleteUser = (externalPid, externalUserId) => {
  return User.findOneAndUpdate(
    {
      externalPid,
      externalUserId,
      isDeleted: false
    },
    { isDeleted: true },
    { new: true }
  );
};


const getUserFinancialSnapshot = (externalPid, externalUserId) => {
  return User.findOne({
    externalPid,
    externalUserId,
    isDeleted: false
  })
    .select("monthlyIncome monthlyExpenses emi riskProfile emergencyFundAmount")
    .lean();
};


const getUserBasicInfo = (externalPid, externalUserId) => {
  return User.findOne({
    externalPid,
    externalUserId,
    isDeleted: false
  })
    .select("name dateOfBirth")
    .lean();
};

module.exports = {
  createUser,
  getUserByExternalIds,
  updateUserFinancials,
  softDeleteUser,
  getUserFinancialSnapshot,
  getUserBasicInfo
};