import mongoose from "mongoose";
import { Role } from "./models/Role.js";
import { User } from "./models/User.js";
import { AuditLog } from "./models/AuditLog.js";
import { Notification } from "./models/Notification.js";
import { connectDB } from "./db.js";
import {
  INITIAL_ROLES,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
} from "../src/data/mockData.js";

export async function seedInitialData(force = false) {
  let isStandalone = false;
  try {
    if (mongoose.connection.readyState === 0) {
      isStandalone = true;
      await connectDB();
    }

    const roleCount = await Role.countDocuments();
    if (roleCount === 0 || force) {
      if (force) {
        await Promise.all([
          Role.deleteMany({}),
          User.deleteMany({}),
          AuditLog.deleteMany({}),
          Notification.deleteMany({}),
        ]);
        console.log("[MongoDB] Existing data cleared for re-seed.");
      }

      await Role.insertMany(INITIAL_ROLES);
      await User.insertMany(INITIAL_USERS);
      await AuditLog.insertMany(INITIAL_AUDIT_LOGS);
      await Notification.insertMany(INITIAL_NOTIFICATIONS);

      console.log("[MongoDB] Initial demonstration seed data successfully inserted!");
    } else {
      console.log(`[MongoDB] Database already has ${roleCount} roles. Skipping initial seed.`);
    }

    if (isStandalone) {
      await mongoose.disconnect();
      console.log("[MongoDB] Seed process completed. Disconnected from database.");
    }
  } catch (error) {
    console.error("[MongoDB] Error seeding initial data:", error.message || error);
    if (isStandalone) {
      try {
        await mongoose.disconnect();
      } catch {
        // Disconnect failure ignored during standalone cleanup
      }
    }
    throw error;
  }
}

