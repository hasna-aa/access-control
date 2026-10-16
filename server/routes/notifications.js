import express from "express";
import { Notification } from "../models/Notification.js";

const router = express.Router();

// GET all notifications
router.get("/", async (req, res) => {
  try {
    const notifications = await Notification.find({}).sort({ id: -1 }).lean();
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST new notification
router.post("/", async (req, res) => {
  try {
    const last = await Notification.findOne({}).sort({ id: -1 });
    const nextId = (last && last.id ? last.id : 0) + 1;

    let assignedId = Number(req.body.id) || nextId;
    if (await Notification.exists({ id: assignedId })) {
      assignedId = Date.now();
    }

    const notification = new Notification({
      ...req.body,
      id: assignedId,
      time: req.body.time || "Just now",
      unread: req.body.unread !== undefined ? req.body.unread : true,
    });

    const saved = await notification.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT mark all as read
router.put("/mark-read", async (req, res) => {
  try {
    await Notification.updateMany({ unread: true }, { $set: { unread: false } });
    const updated = await Notification.find({}).sort({ id: -1 }).lean();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT mark single notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const updated = await Notification.findOneAndUpdate(
      { id },
      { $set: { unread: false } },
      { returnDocument: "after" }
    );
    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE notification by custom numeric id
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = await Notification.findOneAndDelete({ id });
    if (!deleted) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification deleted successfully", id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
