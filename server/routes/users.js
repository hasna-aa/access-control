import express from "express";
import { User } from "../models/User.js";

const router = express.Router();

// GET all users
router.get("/", async (req, res) => {
  try {
    const users = await User.find({}).sort({ id: 1 }).lean();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single user by custom numeric id
router.get("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await User.findOne({ id: userId }).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new user
router.post("/", async (req, res) => {
  try {
    const { name, email, roleId, roleName } = req.body;
    if (!name || !email || roleId === undefined || !roleName) {
      return res.status(400).json({ error: "name, email, roleId, and roleName are required fields" });
    }

    const lastUser = await User.findOne({}).sort({ id: -1 });
    const nextId = (lastUser && lastUser.id ? lastUser.id : 100) + 1;
    let assignedId = Number(req.body.id) || nextId;
    if (await User.exists({ id: assignedId })) {
      assignedId = nextId;
    }

    const newUser = new User({
      ...req.body,
      id: assignedId,
    });

    const saved = await newUser.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update user (e.g. role assignment)
router.put("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const updated = await User.findOneAndUpdate(
      { id: userId },
      { $set: req.body },
      { returnDocument: "after" }
    );
    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// DELETE user by custom numeric id
router.delete("/:id", async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const deleted = await User.findOneAndDelete({ id: userId });
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "User deleted successfully", id: userId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
