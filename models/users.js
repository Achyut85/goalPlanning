// models/User.js

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: {
    type: String,
    
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

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
    min: 0
  },

   dateOfBirth: { 
    type: Date,
    required: true
  }


}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);