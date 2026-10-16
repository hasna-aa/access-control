import mongoose from "mongoose";

const AuditLogSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    timestamp: { type: String, required: true },
    actor: { type: String, required: true },
    actionType: { type: String, required: true },
    roleName: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", AuditLogSchema);
