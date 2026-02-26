const mongoose = require("mongoose");
const {VALID_MODES , VALID_GOAL_STATUS} = require("../constants/goalPlanning");
const goalSchema = new mongoose.Schema({

   
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

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },


    parentGoalId: {
        type: mongoose.Schema.Types.ObjectId,
        index: true
    },


    version: {
        type: Number,
        default: 1
    },


    isActivePlan: {
        type: Boolean,
        default: true,
        index: true
    },
    isDeleted: {
        type: Boolean,
        default: false,
        index: true
    },


    goalType: {
        type: String,
        enum: ["retirement", "house", "education", "marriage", "car", "other"],
        required: true
    },

    status: {
        type: String,
        enum: VALID_GOAL_STATUS,
        required: true,
        index: true
    },

    timeHorizonYears: {
        type: Number,
        required: true,
        min: 1
    },

    // AI Assumptions Snapshot
    assumptions: {
        inflationRate: { type: Number, required: true },
        equityReturnRate: { type: Number, required: true },
        debtReturnRate: { type: Number, required: true }
    },

    // Allocation Snapshot
    allocation: {
        totalGoalAmountFuture: { type: Number, required: true },
        equityGoalAmount: { type: Number, required: true },
        debtGoalAmount: { type: Number, required: true }
    },

    // Strategy Snapshot
    strategy: {
        type: {
            type: String,
            enum: VALID_MODES,
            required: true
        },

        equitySip: { type: Number, default: 0 },
        debtSip: { type: Number, default: 0 },
        totalSip: { type: Number, default: 0 },

        equityLumpsum: { type: Number, default: 0 },
        debtLumpsum: { type: Number, default: 0 },
        totalLumpsum: { type: Number, default: 0 },

        totalInvestment: {
            type: Number,
            required: true
        },

        expectedGain: {
            type: Number,
            required: true
        }
    },

    // Feasibility Snapshot
    feasibility: {
        sipAffordable: { type: Boolean, default: false },
        shortfall: { type: Number, default: 0 },
        monthlySurplus: { type: Number, default: 0 }
    },

    //  Version Tracking
    aiVersion: { type: String, default: "v1" },
    formulaVersion: { type: String, default: "v1" }

}, { timestamps: true });


// 🔥 Performance + Tenant Safety Indexes
goalSchema.index({ externalPid: 1, externalUserId: 1 });
goalSchema.index({ externalPid: 1, status: 1 });
goalSchema.index({ parentGoalId: 1, version: -1 });

module.exports = mongoose.model("Goal", goalSchema);