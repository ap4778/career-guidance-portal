import { Router } from "express";
import { pool } from "../config/database.js";
import { asyncHandler, sendData } from "../utils/http.js";

const router = Router();
router.get("/", asyncHandler(async (_request, response) => {
  const [rows] = await pool.execute("SELECT id, name FROM skills ORDER BY name");
  return sendData(response, { skills: rows });
}));

export default router;
