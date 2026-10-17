import { Router } from "express";
import { body, param, query } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { requireRole } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { createJob, deleteJob, getJob, listJobs, listSavedJobs, saveJob, unsaveJob, updateJob } from "../services/jobService.js";
import { asyncHandler, sendData } from "../utils/http.js";

const router = Router();
const integerId = param("id").isInt({ min: 1 }).toInt();
const jobId = param("jobId").isInt({ min: 1 }).toInt();
const jobFields = [
  body("title").trim().isLength({ min: 2, max: 180 }),
  body("company").trim().isLength({ min: 2, max: 180 }),
  body("location").trim().isLength({ min: 2, max: 180 }),
  body("jobType").isIn(["Full-time", "Part-time", "Contract", "Internship", "Temporary"]),
  body("workMode").isIn(["On-site", "Hybrid", "Remote"]),
  body("salaryRange").optional({ nullable: true }).isString().isLength({ max: 100 }),
  body("description").trim().isLength({ min: 5, max: 8000 }),
  body("careerId").optional({ nullable: true }).isInt({ min: 1 }),
  body("applicationDeadline").optional({ nullable: true }).isISO8601().toDate(),
  body("isDemo").optional().isBoolean(),
  body("isActive").optional().isBoolean(),
  body("skills").isArray({ max: 30 }),
  body("skills.*").isString().trim().isLength({ min: 1, max: 100 }),
];
const parseJobFilters = (request, _response, next) => {
  request.jobFilters = {
    q: request.query.q?.trim(),
    title: request.query.title?.trim(),
    skill: request.query.skill?.trim(),
    location: request.query.location?.trim(),
    jobType: request.query.jobType,
    workMode: request.query.workMode,
    category: request.query.category?.trim(),
    page: Number(request.query.page || 1),
    limit: Number(request.query.limit || 12),
  };
  next();
};

router.get("/", [
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
  parseJobFilters,
], asyncHandler(async (request, response) => sendData(response, await listJobs(request.jobFilters))));

router.get("/saved", requireAuth, asyncHandler(async (request, response) => sendData(response, { jobs: await listSavedJobs(request.user.id) })));
router.post("/saved/:jobId", requireAuth, [jobId, validateRequest], asyncHandler(async (request, response) => {
  await saveJob(request.user.id, request.params.jobId);
  return sendData(response, { saved: true }, 201);
}));
router.delete("/saved/:jobId", requireAuth, [jobId, validateRequest], asyncHandler(async (request, response) => {
  await unsaveJob(request.user.id, request.params.jobId);
  return sendData(response, { saved: false });
}));

router.get("/:id", [integerId, validateRequest], asyncHandler(async (request, response) => sendData(response, { job: await getJob(request.params.id) })));
router.post("/", requireAuth, requireRole("admin"), [...jobFields, validateRequest], asyncHandler(async (request, response) => sendData(response, {
  job: await createJob(request.body, request.user.id),
}, 201)));
router.put("/:id", requireAuth, requireRole("admin"), [integerId, ...jobFields, validateRequest], asyncHandler(async (request, response) => sendData(response, {
  job: await updateJob(request.params.id, request.body),
})));
router.delete("/:id", requireAuth, requireRole("admin"), [integerId, validateRequest], asyncHandler(async (request, response) => {
  await deleteJob(request.params.id);
  return sendData(response, { deleted: true });
}));

export default router;
