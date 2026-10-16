import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

function sanitizeError(error) {
  if (!error) return "Unknown error";
  const msg = error.message || String(error);
  // Redact credentials from any connection string pattern
  return msg.replace(/\/\/[^@]+@/g, "//***:***@");
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI?.trim();

  if (!uri) {
    const errorMsg = "[MongoDB] Connection Error: MONGODB_URI is not set in root .env file.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const options = {
      serverSelectionTimeoutMS: 10000,
    };

    const conn = await mongoose.connect(uri, options);
    const host = conn.connection.host || "cluster";
    const dbName = conn.connection.name || "default";

    // Safely log without printing connection string or credentials
    console.log(`[MongoDB] Connected successfully to database "${dbName}" on host "${host}".`);
    return conn;
  } catch (err) {
    const safeError = sanitizeError(err);
    console.error(`[MongoDB] Connection error: ${safeError}`);
    throw new Error(safeError);
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("[MongoDB] Connection lost. Disconnected from database.");
});

mongoose.connection.on("reconnected", () => {
  console.log("[MongoDB] Reconnected to database.");
});

