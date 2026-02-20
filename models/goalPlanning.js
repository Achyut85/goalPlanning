// models/Goal.js

const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({


    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },


    goalType: {
        type: String,
        enum: ["retirement", "house", "education", "marriage", "car", "other"],
        required: true
    },
    status: {
        type: String,
        enum: ["Achievable", "Not Achievable", "Partially Achievable"],
        required: true,
        index: true  
    },

    timeHorizonYears: {
        type: Number,
        required: true,
        min: 1
    },


    assumptions: {
        inflationRate: {
            type: Number,
            required: true
        },
        equityReturnRate: {
            type: Number,
            required: true
        },
        debtReturnRate: {
            type: Number,
            required: true
        }
    },


    allocation: {
        totalGoalAmountFuture: {
            type: Number,
            required: true
        },
        equityGoalAmount: {
            type: Number,
            required: true
        },
        debtGoalAmount: {
            type: Number,
            required: true
        }
    },


    strategy: {
        type: {
            type: String,
            enum: ["sip", "lumpsum", "hybrid"],
            required: true
        },

        equitySip: Number,
        debtSip: Number,
        totalSip: Number,

        equityLumpsum: Number,
        debtLumpsum: Number,
        totalLumpsum: Number,

        totalInvestment: {
            type: Number,
            required: true
        },

        expectedGain: {
            type: Number,
            required: true
        }
    },

    feasibility: {
        sipAffordable: Boolean,
        shortfall: {
            type: Number,
            default: 0
        },
        monthlySurplus: Number
    },


    aiVersion: String,
    formulaVersion: String,

}, { timestamps: true });

module.exports = mongoose.model("Goal", goalSchema);