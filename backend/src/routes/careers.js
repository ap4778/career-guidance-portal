import { Router } from "express";
import { body, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { listAssessments, listCareers, recommendCareers } from "../services/careerService.js";
import { asyncHandler, sendData } from "../utils/http.js";

const router = Router();

router.get("/", asyncHandler(async (_request, response) => sendData(response, { careers: await listCareers() })));

router.post("/recommendations", requireAuth, [
  body("skills").optional().isArray({ max: 40 }),
  body("skills.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("interests").optional().isArray({ max: 20 }),
  body("interests.*").optional().isString().trim().isLength({ min: 1, max: 100 }),
  body("education").optional({ nullable: true }).isString().isLength({ max: 100 }),
  body("experience").optional({ nullable: true }).isIn(["Entry", "Mid", "Senior"]),
  validateRequest,
], asyncHandler(async (request, response) => sendData(response, await recommendCareers(request.user.id, request.body), 201)));

router.get("/assessments", requireAuth, [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  validateRequest,
], asyncHandler(async (request, response) => sendData(response, await listAssessments(
  request.user.id,
  request.query.page || 1,
  request.query.limit || 10,
))));

export default router;
