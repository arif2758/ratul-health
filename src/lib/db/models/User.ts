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
    emailVerified: {
      type: Date,
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
