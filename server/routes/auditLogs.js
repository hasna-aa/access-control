import express from "express";
import { AuditLog } from "../models/AuditLog.js";

const router = express.Router();

// GET all audit logs
router.get("/", async (req, res) => {
  try {
    const logs = await AuditLog.find({}).sort({ id: -1 }).lean();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new audit log
router.post("/", async (req, res) => {
  try {
    const lastLog = await AuditLog.findOne({}).sort({ id: -1 });
    const nextId = (lastLog && lastLog.id ? lastLog.id : 0) + 1;
    const now = new Date();
    const timestamp = now.toISOString().replace("T", " ").slice(0, 19);

    let assignedId = Number(req.body.id) || nextId;
    if (await AuditLog.exists({ id: assignedId })) {
      assignedId = Date.now();
    }

    const log = new AuditLog({
      ...req.body,
      id: assignedId,
      timestamp: req.body.timestamp || timestamp,
    });

    const saved = await log.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET single audit log by custom numeric id
router.get("/:id", async (req, res) => {
  try {
    const logId = Number(req.params.id);
    const log = await AuditLog.findOne({ id: logId }).lean();
    if (!log) {
      return res.status(404).json({ error: "Audit log not found" });
    }
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE audit log by custom numeric id
router.delete("/:id", async (req, res) => {
  try {
    const logId = Number(req.params.id);
    const deleted = await AuditLog.findOneAndDelete({ id: logId });
    if (!deleted) {
      return res.status(404).json({ error: "Audit log not found" });
    }
    res.json({ message: "Audit log deleted successfully", id: logId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
