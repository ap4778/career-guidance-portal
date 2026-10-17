import { Router } from "express";
import { body, param, query } from "express-validator";
import { pool, withTransaction } from "../config/database.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { listAdminJobs } from "../services/jobService.js";
import { asyncHandler, HttpError, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth, requireRole("admin"));

router.get("/users", [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("q").optional().trim().isLength({ max: 160 }),
  validateRequest,
], asyncHandler(async (request, response) => {
  const page = request.query.page || 1;
  const limit = request.query.limit || 20;
  const offset = (page - 1) * limit;
  const term = request.query.q ? `%${request.query.q}%` : null;
  const [[{ total }], [users]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM users WHERE (? IS NULL OR full_name LIKE ? OR email LIKE ?)", [term, term, term]),
    pool.execute(
      `SELECT id, full_name AS name, email, role, is_active AS isActive, created_at AS createdAt
       FROM users WHERE (? IS NULL OR full_name LIKE ? OR email LIKE ?)
       ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [term, term, term, limit, offset],
    ),
  ]);
  return sendData(response, { items: users.map((user) => ({ ...user, id: String(user.id), isActive: Boolean(user.isActive) })), total, page, limit });
}));

router.patch("/users/:id", [
  param("id").isInt({ min: 1 }).toInt(),
  body("role").optional().isIn(["student", "admin"]),
  body("isActive").optional().isBoolean(),
  validateRequest,
], asyncHandler(async (request, response) => {
  if (String(request.params.id) === String(request.user.id)
    && (request.body.isActive === false || request.body.role === "student")) {
    throw new HttpError(400, "You cannot deactivate or demote your own administrator account.", "SELF_ACCESS_CHANGE_NOT_ALLOWED");
  }
  const assignments = [];
  const values = [];
  if (request.body.role !== undefined) { assignments.push("role = ?"); values.push(request.body.role); }
  if (request.body.isActive !== undefined) { assignments.push("is_active = ?"); values.push(request.body.isActive); }
  if (!assignments.length) throw new HttpError(422, "Provide a role or active-state change.", "NO_CHANGES");
  const [result] = await pool.execute(`UPDATE users SET ${assignments.join(", ")} WHERE id = ?`, [...values, request.params.id]);
  if (!result.affectedRows) throw new HttpError(404, "User was not found.", "USER_NOT_FOUND");
  return sendData(response, { updated: true });
}));

router.get("/jobs", [
  query("q").optional().trim().isLength({ max: 160 }),
  query("title").optional().trim().isLength({ max: 160 }),
  query("skill").optional().trim().isLength({ max: 100 }),
  query("location").optional().trim().isLength({ max: 160 }),
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  query("jobType").optional().isIn(["Full-time", "Part-time", "Contract", "Internship", "Temporary"]),
  query("workMode").optional().isIn(["On-site", "Hybrid", "Remote"]),
  query("category").optional().trim().isLength({ max: 100 }),
  validateRequest,
], asyncHandler(async (request, response) => sendData(response, await listAdminJobs({
  q: request.query.q?.trim(),
  title: request.query.title?.trim(),
  skill: request.query.skill?.trim(),
  location: request.query.location?.trim(),
  jobType: request.query.jobType,
  workMode: request.query.workMode,
  category: request.query.category?.trim(),
  page: Number(request.query.page || 1),
  limit: Number(request.query.limit || 12),
}))));

router.get("/applications", [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
  query("status").optional().isIn(["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"]),
  validateRequest,
], asyncHandler(async (request, response) => {
  const page = request.query.page || 1;
  const limit = request.query.limit || 30;
  const offset = (page - 1) * limit;
  const status = request.query.status || null;
  const [[{ total }], [items]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM applications WHERE (? IS NULL OR status = ?)", [status, status]),
    pool.execute(
      `SELECT a.id, a.user_id, u.full_name AS applicant, u.email, a.job_id,
        j.title, j.company, a.status, a.applied_at, a.updated_at
       FROM applications a JOIN users u ON u.id = a.user_id JOIN jobs j ON j.id = a.job_id
       WHERE (? IS NULL OR a.status = ?) ORDER BY a.applied_at DESC LIMIT ? OFFSET ?`,
      [status, status, limit, offset],
    ),
  ]);
  return sendData(response, { items: items.map((item) => ({ ...item, id: String(item.id), userId: String(item.user_id), jobId: String(item.job_id) })), total, page, limit });
}));

router.patch("/applications/:id", [
  param("id").isInt({ min: 1 }).toInt(),
  body("status").isIn(["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"]),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [result] = await pool.execute("UPDATE applications SET status = ? WHERE id = ?", [request.body.status, request.params.id]);
  if (!result.affectedRows) throw new HttpError(404, "Application was not found.", "APPLICATION_NOT_FOUND");
  return sendData(response, { id: String(request.params.id), status: request.body.status });
}));

router.get("/statistics", asyncHandler(async (_request, response) => {
  const [[userRows], [applicationRows], [recommendationRows]] = await Promise.all([
    pool.execute("SELECT role, COUNT(*) AS count FROM users GROUP BY role"),
    pool.execute("SELECT status, COUNT(*) AS count FROM applications GROUP BY status"),
    pool.execute(
      `SELECT c.id, c.title, COUNT(*) AS recommendations
       FROM career_assessments a
       JOIN JSON_TABLE(a.recommendations, '$[*]' COLUMNS (career_id VARCHAR(32) PATH '$.id')) r
       JOIN careers c ON c.id = r.career_id
       GROUP BY c.id, c.title ORDER BY recommendations DESC LIMIT 20`,
    ),
  ]);
  return sendData(response, { users: userRows, applications: applicationRows, popularCareers: recommendationRows });
}));

export default router;
