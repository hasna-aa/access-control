import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    scope: { type: String, default: "Assigned Branch" },
    selectedBranches: { type: [String], default: [] },
    level: { type: Number, default: 0 },
    limit: { type: Number, default: 0 },
    createdDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    isProtected: { type: Boolean, default: false },
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const Role = mongoose.model("Role", RoleSchema);
