import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler, HttpError } from "./utils/http.js";
import authRoutes from "./routes/auth.js";
import { validateRequestOrigin } from "./middleware/auth.js";
import profileRoutes from "./routes/profile.js";
import careerRoutes from "./routes/careers.js";
import jobRoutes from "./routes/jobs.js";
import applicationRoutes from "./routes/applications.js";
import resumeRoutes from "./routes/resumes.js";
import roadmapRoutes from "./routes/roadmaps.js";
import adminRoutes from "./routes/admin.js";
import savedJobsRoutes from "./routes/savedJobs.js";
import skillsRoutes from "./routes/skills.js";
import { pool } from "./config/database.js";

export const app = express();
app.disable("x-powered-by");
if (env.nodeEnv === "production") app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({
  origin: env.frontendOrigin.split(",").map((origin) => origin.trim()),
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use((request, response, next) => {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return validateRequestOrigin(request, response, next);
  }
  return next();
});

app.get("/api/health", async (_request, response) => {
  try {
    await pool.query("SELECT 1");
    return response.json({ success: true, data: { status: "ok", database: "connected" } });
  } catch {
    return response.status(503).json({ success: false, error: { code: "DATABASE_UNAVAILABLE", message: "The API is running but the database is unavailable." } });
  }
});
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/careers", careerRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/saved-jobs", savedJobsRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/roadmaps", roadmapRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", (_request, _response, next) => next(new HttpError(404, "API endpoint was not found.", "NOT_FOUND")));
app.use(errorHandler);
