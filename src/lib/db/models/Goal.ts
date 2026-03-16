import mongoose, { Schema, model } from "mongoose";

const goalSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetWeight: {
      type: Number,
    },
    targetBodyFat: {
      type: Number,
    },
    dailyCalorieGoal: {
      type: Number,
    },
    targetDate: {
      type: Date,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Delete cached model to ensure fresh schema is used
if (mongoose.models.Goal) {
  delete mongoose.models.Goal;
}

export const Goal = model("Goal", goalSchema);
