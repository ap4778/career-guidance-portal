import { Router } from "express";
import { body, param, query } from "express-validator";
import { pool } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { asyncHandler, HttpError, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

router.get("/", [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest,
], asyncHandler(async (request, response) => {
  const page = request.query.page || 1;
  const limit = request.query.limit || 20;
  const offset = (page - 1) * limit;
  const [[{ total }], [rows]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM applications WHERE user_id = ?", [request.user.id]),
    pool.execute(
      `SELECT a.id, a.job_id, a.status, a.cover_letter, a.applied_at, a.updated_at,
        j.title, j.company, j.location, j.job_type, j.work_mode
       FROM applications a JOIN jobs j ON j.id = a.job_id
       WHERE a.user_id = ? ORDER BY a.applied_at DESC LIMIT ? OFFSET ?`,
      [request.user.id, limit, offset],
    ),
  ]);
  return sendData(response, {
    items: rows.map((row) => ({
      id: String(row.id), jobId: String(row.job_id), status: row.status,
      appliedDate: String(row.applied_at).slice(0, 10), coverLetter: row.cover_letter,
      job: { id: String(row.job_id), title: row.title, company: row.company, location: row.location, type: row.job_type, workMode: row.work_mode },
    })),
    total,
    page,
    limit,
  });
}));

router.post("/", [
  body("jobId").isInt({ min: 1 }).toInt(),
  body("coverLetter").optional({ nullable: true }).isString().isLength({ max: 8000 }),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [jobs] = await pool.execute("SELECT id FROM jobs WHERE id = ? AND is_active = TRUE", [request.body.jobId]);
  if (!jobs.length) throw new HttpError(404, "This job listing is not available.", "JOB_NOT_FOUND");
  const [result] = await pool.execute(
    "INSERT INTO applications (user_id, job_id, cover_letter) VALUES (?, ?, ?)",
    [request.user.id, request.body.jobId, request.body.coverLetter || null],
  );
  return sendData(response, { id: String(result.insertId), jobId: String(request.body.jobId), status: "Applied", appliedDate: new Date().toISOString().slice(0, 10) }, 201);
}));

router.delete("/:id", [param("id").isInt({ min: 1 }).toInt(), validateRequest], asyncHandler(async (request, response) => {
  const [result] = await pool.execute("DELETE FROM applications WHERE id = ? AND user_id = ?", [request.params.id, request.user.id]);
  if (!result.affectedRows) throw new HttpError(404, "Application was not found.", "APPLICATION_NOT_FOUND");
  return sendData(response, { deleted: true });
}));

export default router;
