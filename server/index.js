import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { seedInitialData } from "./seedData.js";
import rolesRouter from "./routes/roles.js";
import usersRouter from "./routes/users.js";
import auditLogsRouter from "./routes/auditLogs.js";
import notificationsRouter from "./routes/notifications.js";
import resetRouter from "./routes/reset.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/roles", rolesRouter);
app.use("/api/users", usersRouter);
app.use("/api/audit-logs", auditLogsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/reset", resetRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: "connected",
    time: new Date().toISOString(),
  });
});

// Start Server ONLY after MongoDB Atlas connects successfully
async function startServer() {
  try {
    console.log("[Server] Connecting to MongoDB Atlas...");
    await connectDB();
    console.log("[Server] Database connected. Checking initial demo seeds...");
    await seedInitialData();

    const server = app.listen(PORT, () => {
      console.log(`[Server] Express API server running on http://localhost:${PORT}`);
    });

    return server;
  } catch (error) {
    console.error("[Server] Fatal: Express server will NOT start because MongoDB Atlas connection failed.");
    console.error(`[Server] Connection failure reason: ${error.message || error}`);
    console.error("[Server] Please verify MONGODB_URI in root .env and ensure your network allows Atlas access.");
    process.exit(1);
  }
}

startServer();

