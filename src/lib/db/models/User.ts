import mongoose, { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    profilePic: {
      type: String,
    },
    emailVerified: {
      type: Date,
    },
    birthdate: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
    },
    height: {
      type: Number,
    },
  },
  {
    timestamps: true,
  },
);

// Delete cached model to ensure fresh schema is used
if (mongoose.models.User) {
  delete mongoose.models.User;
}

export const User = model("User", userSchema);
