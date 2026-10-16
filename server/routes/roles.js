import express from "express";
import { Role } from "../models/Role.js";

const router = express.Router();

// GET all roles
router.get("/", async (req, res) => {
  try {
    const roles = await Role.find({}).sort({ id: 1 }).lean();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST create new role
router.post("/", async (req, res) => {
  try {
    const lastRole = await Role.findOne({}).sort({ id: -1 });
    const nextId = (lastRole && lastRole.id ? lastRole.id : 0) + 1;
    const today = new Date().toISOString().slice(0, 10);

    let assignedId = Number(req.body.id) || nextId;
    if (await Role.exists({ id: assignedId })) {
      assignedId = nextId;
    }

    const newRole = new Role({
      ...req.body,
      id: assignedId,
      createdDate: req.body.createdDate || today,
      isProtected: false,
    });

    const saved = await newRole.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// PUT update role by custom numeric id
router.put("/:id", async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const updated = await Role.findOneAndUpdate(
      { id: roleId },
      { $set: req.body },
      { returnDocument: "after" }
    );
    if (!updated) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json(updated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// GET single role by custom numeric id
router.get("/:id", async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const role = await Role.findOne({ id: roleId }).lean();
    if (!role) {
      return res.status(404).json({ error: "Role not found" });
    }
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE role by custom numeric id
router.delete("/:id", async (req, res) => {
  try {
    const roleId = Number(req.params.id);
    const target = await Role.findOne({ id: roleId });
    if (!target) {
      return res.status(404).json({ error: "Role not found" });
    }
    if (target.isProtected) {
      return res.status(403).json({ error: "Cannot delete protected system role" });
    }
    await Role.deleteOne({ id: roleId });
    res.json({ message: "Role deleted successfully", id: roleId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
