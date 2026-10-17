import { Router } from "express";
import { body } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { getProfile, updateProfile } from "../services/profileService.js";
import { asyncHandler, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => sendData(response, { profile: await getProfile(request.user.id) })));

router.put("/", [
  body("name").optional().trim().isLength({ min: 2, max: 120 }),
  body("email").optional().trim().normalizeEmail().isEmail().isLength({ max: 254 }),
  body("education").optional({ nullable: true }).trim().isLength({ max: 100 }),
  body("experience").optional().isIn(["Entry", "Mid", "Senior"]),
  body("qualifications").optional({ nullable: true }).trim().isLength({ max: 4000 }),
  body("preferredCareerId").optional({ nullable: true }).isInt({ min: 1 }),
  body("preferredLocation").optional({ nullable: true }).trim().isLength({ max: 160 }),
  body("skills").optional().isArray({ max: 40 }),
  body("skills.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("interests").optional().isArray({ max: 20 }),
  body("interests.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  validateRequest,
], asyncHandler(async (request, response) => sendData(response, {
  profile: await updateProfile(request.user.id, request.body),
})));

export default router;
