import { Router } from "express";
import { body, param } from "express-validator";
import { pool } from "../config/database.js";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { asyncHandler, HttpError, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

function parseContent(content) {
  if (content && typeof content === "object") return content;
  try { return JSON.parse(content); } catch { return {}; }
}

router.get("/", asyncHandler(async (request, response) => {
  const [rows] = await pool.execute("SELECT id, title, content, created_at, updated_at FROM resumes WHERE user_id = ? ORDER BY updated_at DESC", [request.user.id]);
  return sendData(response, { resumes: rows.map((row) => ({ ...row, id: String(row.id), content: parseContent(row.content) })) });
}));

router.post("/", [
  body("title").optional().trim().isLength({ min: 1, max: 120 }),
  body("content").isObject(),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [result] = await pool.execute(
    "INSERT INTO resumes (user_id, title, content) VALUES (?, ?, ?)",
    [request.user.id, request.body.title || "My resume", JSON.stringify(request.body.content)],
  );
  return sendData(response, { resume: { id: String(result.insertId), title: request.body.title || "My resume", content: request.body.content } }, 201);
}));

router.get("/:id", [param("id").isInt({ min: 1 }).toInt(), validateRequest], asyncHandler(async (request, response) => {
  const [rows] = await pool.execute("SELECT id, title, content, created_at, updated_at FROM resumes WHERE id = ? AND user_id = ?", [request.params.id, request.user.id]);
  if (!rows[0]) throw new HttpError(404, "Resume was not found.", "RESUME_NOT_FOUND");
  return sendData(response, { resume: { ...rows[0], id: String(rows[0].id), content: parseContent(rows[0].content) } });
}));

router.put("/:id", [
  param("id").isInt({ min: 1 }).toInt(),
  body("title").optional().trim().isLength({ min: 1, max: 120 }),
  body("content").isObject(),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [result] = await pool.execute(
    "UPDATE resumes SET title = COALESCE(?, title), content = ? WHERE id = ? AND user_id = ?",
    [request.body.title || null, JSON.stringify(request.body.content), request.params.id, request.user.id],
  );
  if (!result.affectedRows) {
    const [rows] = await pool.execute("SELECT id FROM resumes WHERE id = ? AND user_id = ?", [request.params.id, request.user.id]);
    if (!rows.length) throw new HttpError(404, "Resume was not found.", "RESUME_NOT_FOUND");
  }
  return sendData(response, { resume: { id: String(request.params.id), title: request.body.title, content: request.body.content } });
}));

router.delete("/:id", [param("id").isInt({ min: 1 }).toInt(), validateRequest], asyncHandler(async (request, response) => {
  const [result] = await pool.execute("DELETE FROM resumes WHERE id = ? AND user_id = ?", [request.params.id, request.user.id]);
  if (!result.affectedRows) throw new HttpError(404, "Resume was not found.", "RESUME_NOT_FOUND");
  return sendData(response, { deleted: true });
}));

export default router;
