import express from "express";
import { seedInitialData } from "../seedData.js";
import { Role } from "../models/Role.js";
import { User } from "../models/User.js";
import { AuditLog } from "../models/AuditLog.js";
import { Notification } from "../models/Notification.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    await seedInitialData(true);
    const [roles, users, auditLogs, notifications] = await Promise.all([
      Role.find({}).sort({ id: 1 }).lean(),
      User.find({}).sort({ id: 1 }).lean(),
      AuditLog.find({}).sort({ id: -1 }).lean(),
      Notification.find({}).sort({ id: -1 }).lean(),
    ]);

    res.json({
      message: "Database reset to initial demo seeds successfully",
      roles,
      users,
      auditLogs,
      notifications,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
