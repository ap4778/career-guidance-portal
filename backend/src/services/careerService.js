import { pool } from "../config/database.js";
import { HttpError } from "../utils/http.js";
import { getProfile } from "./profileService.js";
import { scoreCareer } from "./careerScoring.js";

export { scoreCareer } from "./careerScoring.js";

function parseJson(value, fallback) {
  if (Array.isArray(value) || (value && typeof value === "object")) return value;
  try { return JSON.parse(value); } catch { return fallback; }
}

export async function listCareers() {
  const [rows] = await pool.execute(
    `SELECT id, slug, title, category, description, salary_range AS salary,
      growth_outlook AS growth, experience_levels AS experience, interests
     FROM careers WHERE is_active = TRUE ORDER BY title`,
  );
  const [skills] = await pool.execute(
    `SELECT cs.career_id, s.name, cs.weight FROM career_skills cs
     JOIN skills s ON s.id = cs.skill_id ORDER BY s.name`,
  );
  return rows.map((career) => ({
    ...career,
    id: String(career.id),
    skills: skills.filter((item) => String(item.career_id) === String(career.id)).map(({ name, weight }) => ({ name, weight })),
    interests: parseJson(career.interests, []),
    experience: parseJson(career.experience, []),
  }));
}

export async function recommendCareers(userId, overrides = {}) {
  const profile = await getProfile(userId);
  const inputs = {
    skills: overrides.skills ?? profile.skills,
    interests: overrides.interests ?? profile.interests,
    education: overrides.education ?? profile.education,
    experience: overrides.experience ?? profile.experience,
  };
  if (!inputs.skills.length && !inputs.interests.length) {
    throw new HttpError(422, "Add at least one skill or interest to request recommendations.", "PROFILE_INCOMPLETE");
  }
  const results = (await listCareers()).map((career) => scoreCareer(career, inputs)).sort((a, b) => b.score - a.score);
  const [insert] = await pool.execute(
    "INSERT INTO career_assessments (user_id, inputs, recommendations) VALUES (?, ?, ?)",
    [userId, JSON.stringify(inputs), JSON.stringify(results.map(({ id, score, matchedSkills, missingSkills, interestsMatched, explanation }) => ({ id, score, matchedSkills, missingSkills, interestsMatched, explanation })))],
  );
  return { id: insert.insertId, inputs, results, createdAt: new Date().toISOString(), algorithm: "rule-based" };
}

export async function listAssessments(userId, page, limit) {
  const offset = (page - 1) * limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.execute("SELECT COUNT(*) AS total FROM career_assessments WHERE user_id = ?", [userId]),
    pool.execute(
      "SELECT id, inputs, recommendations, created_at FROM career_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
      [userId, limit, offset],
    ),
  ]);
  return {
    items: rows.map((row) => ({ ...row, inputs: parseJson(row.inputs, {}), recommendations: parseJson(row.recommendations, []) })),
    total: countRows[0].total,
    page,
    limit,
  };
}
