import { Router } from "express";
import { body, param, query } from "express-validator";
import { pool } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { asyncHandler, HttpError, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

router.get("/", [
  query("careerId").optional().isInt({ min: 1 }).toInt(),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [roadmapRows] = await pool.execute(
    `SELECT r.id, r.title, r.description, r.career_id, c.title AS career
     FROM learning_roadmaps r JOIN careers c ON c.id = r.career_id
     WHERE (? IS NULL OR r.career_id = ?) ORDER BY c.title`,
    [request.query.careerId || null, request.query.careerId || null],
  );
  const [stepRows] = await pool.execute(
    `SELECT s.id, s.roadmap_id, s.phase, s.title, s.description, s.duration,
      s.resource_url, s.position, COALESCE(p.is_complete, FALSE) AS is_complete
     FROM roadmap_steps s LEFT JOIN user_roadmap_progress p
       ON p.step_id = s.id AND p.user_id = ? ORDER BY s.roadmap_id, s.position`,
    [request.user.id],
  );
  const roadmaps = roadmapRows.map((row) => {
    const steps = stepRows.filter((step) => String(step.roadmap_id) === String(row.id));
    return {
      id: String(row.id),
      careerId: String(row.career_id),
      career: row.career,
      title: row.title,
      description: row.description,
      phases: ["Beginner", "Intermediate", "Advanced"].map((phaseName) => ({
        name: phaseName,
        duration: phaseName === "Beginner" ? "4–6 weeks" : phaseName === "Intermediate" ? "6–8 weeks" : "6–10 weeks",
        topics: steps.filter((step) => step.phase === phaseName).map((step) => ({
          id: String(step.id),
          title: step.title,
          description: step.description,
          duration: step.duration,
          resource: step.resource_url,
          complete: Boolean(step.is_complete),
        })),
      })),
    };
  });
  return sendData(response, { roadmaps });
}));

router.patch("/:id/steps/:stepId", [
  param("id").isInt({ min: 1 }).toInt(),
  param("stepId").isInt({ min: 1 }).toInt(),
  body("complete").isBoolean(),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [steps] = await pool.execute(
    "SELECT id FROM roadmap_steps WHERE id = ? AND roadmap_id = ?",
    [request.params.stepId, request.params.id],
  );
  if (!steps.length) throw new HttpError(404, "Roadmap step was not found.", "ROADMAP_STEP_NOT_FOUND");
  await pool.execute(
    `INSERT INTO user_roadmap_progress (user_id, step_id, is_complete, completed_at)
     VALUES (?, ?, ?, IF(?, CURRENT_TIMESTAMP, NULL))
     ON DUPLICATE KEY UPDATE is_complete = VALUES(is_complete), completed_at = VALUES(completed_at)`,
    [request.user.id, request.params.stepId, request.body.complete, request.body.complete],
  );
  return sendData(response, { stepId: String(request.params.stepId), complete: request.body.complete });
}));

export default router;
