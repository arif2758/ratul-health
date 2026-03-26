import mongoose, { Schema, model } from "mongoose";

const metricsSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    height: {
      type: Number,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    activityLevel: {
      type: String,
      enum: [
        "sedentary",
        "light",
        "moderate",
        "active",
        "very_active",
      ],
      required: true,
    },
    bodyFatPercentage: {
      type: Number,
    },
    bmi: {
      type: Number,
    },
    bmr: {
      type: Number,
    },
    tdee: {
      type: Number,
    },
    idealWeight: {
      type: Number,
    },
    waist: {
      type: Number,
    },
    neck: {
      type: Number,
    },
    hip: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Delete cached model to ensure fresh schema is used
if (mongoose.models.Metrics) {
  delete mongoose.models.Metrics;
}

export const Metrics = model("Metrics", metricsSchema);
