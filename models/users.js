const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  // Multi-tenant isolation keys
  externalPid: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  externalUserId: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // Snapshot identity data (not source of truth)
  name: {
    type: String,
    trim: true
  },

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  // Financial data (owned by your system)
  monthlyIncome: {
    type: Number,
    required: true,
    min: 0
  },

  monthlyExpenses: {
    type: Number,
    required: true,
    min: 0
  },

  emi: {
    type: Number,
    default: 0,
    min: 0
  },

  riskProfile: {
    type: String,
    enum: ["conservative", "moderate", "aggressive"],
    required: true
  },

  emergencyFundAmount: {
    type: Number,
    default: 0,
    min: 0
  },

  dateOfBirth: {
    type: Date,
    required: true
  },

  //  Soft delete support
  isDeleted: {
    type: Boolean,
    default: false,
    index: true
  }

}, {
  timestamps: true
});



userSchema.index(
  { externalPid: 1, externalUserId: 1 },
  { unique: true }
);


userSchema.index(
  { externalPid: 1, externalUserId: 1, isDeleted: 1 }
);



module.exports = mongoose.model("User", userSchema);