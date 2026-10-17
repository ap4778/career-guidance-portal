import { Router } from "express";
import bcrypt from "bcryptjs";
import { body } from "express-validator";
import { pool } from "../config/database.js";
import { requireAuth, cookieOptions } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rateLimit.js";
import { validateRequest } from "../middleware/validation.js";
import { authenticateUser, registerUser, signSession } from "../services/authService.js";
import { asyncHandler, HttpError, sendData } from "../utils/http.js";

const router = Router();
const email = body("email").trim().normalizeEmail().isEmail().withMessage("Enter a valid email address.").isLength({ max: 254 });

router.post("/register", authRateLimit, [
  body("name").trim().isLength({ min: 2, max: 120 }).withMessage("Name must be between 2 and 120 characters."),
  email,
  body("password").isString().isLength({ min: 8, max: 128 }).withMessage("Password must be between 8 and 128 characters."),
  body("education").optional({ nullable: true }).trim().isLength({ max: 100 }),
  body("qualifications").optional({ nullable: true }).trim().isLength({ max: 4000 }),
  body("skills").optional().isArray({ max: 40 }),
  body("skills.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("interests").optional().isArray({ max: 20 }),
  body("interests.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  validateRequest,
], asyncHandler(async (request, response) => {
  const user = await registerUser({
    name: request.body.name.trim(),
    email: request.body.email,
    password: request.body.password,
    education: request.body.education,
    qualifications: request.body.qualifications,
    skills: request.body.skills || [],
    interests: request.body.interests || [],
  });
  response.cookie("careerpath_session", signSession(user), cookieOptions);
  return sendData(response, { user }, 201);
}));

router.post("/login", authRateLimit, [
  email,
  body("password").isString().isLength({ min: 1, max: 128 }),
  validateRequest,
], asyncHandler(async (request, response) => {
  const user = await authenticateUser(request.body.email, request.body.password);
  response.cookie("careerpath_session", signSession(user), cookieOptions);
  return sendData(response, { user });
}));

router.post("/logout", (_request, response) => {
  response.clearCookie("careerpath_session", { ...cookieOptions, maxAge: undefined });
  return sendData(response, { loggedOut: true });
});

router.get("/me", requireAuth, asyncHandler(async (request, response) => sendData(response, { user: request.user })));

router.patch("/password", requireAuth, [
  body("currentPassword").isString().isLength({ min: 1, max: 128 }),
  body("newPassword").isString().isLength({ min: 8, max: 128 }),
  validateRequest,
], asyncHandler(async (request, response) => {
  const [[row]] = await pool.execute("SELECT password_hash FROM users WHERE id = ?", [request.user.id]);
  if (!row || !(await bcrypt.compare(request.body.currentPassword, row.password_hash))) {
    throw new HttpError(400, "Current password is incorrect.", "CURRENT_PASSWORD_INVALID");
  }
  const hash = await bcrypt.hash(request.body.newPassword, 12);
  await pool.execute("UPDATE users SET password_hash = ? WHERE id = ?", [hash, request.user.id]);
  return sendData(response, { passwordChanged: true });
}));

export default router;
