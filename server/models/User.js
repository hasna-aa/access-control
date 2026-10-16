import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    roleId: { type: Number, required: true },
    roleName: { type: String, required: true },
    branch: { type: String, default: "Main Branch" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
