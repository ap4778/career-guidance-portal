import { Router } from "express";
import { param } from "express-validator";
import { requireAuth } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { listSavedJobs, saveJob, unsaveJob } from "../services/jobService.js";
import { asyncHandler, sendData } from "../utils/http.js";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (request, response) => sendData(response, { jobs: await listSavedJobs(request.user.id) })));
router.post("/:jobId", [param("jobId").isInt({ min: 1 }).toInt(), validateRequest], asyncHandler(async (request, response) => {
  await saveJob(request.user.id, request.params.jobId);
  return sendData(response, { saved: true }, 201);
}));
router.delete("/:jobId", [param("jobId").isInt({ min: 1 }).toInt(), validateRequest], asyncHandler(async (request, response) => {
  await unsaveJob(request.user.id, request.params.jobId);
  return sendData(response, { saved: false });
}));

export default router;
