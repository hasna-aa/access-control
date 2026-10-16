import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    time: { type: String, default: "Just now" },
    unread: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", NotificationSchema);
