import { pool, withTransaction } from "../config/database.js";
import { HttpError } from "../utils/http.js";

function mapJob(row) {
  return {
    ...row,
    id: String(row.id),
    careerId: row.career_id ? String(row.career_id) : null,
    type: row.job_type,
    workMode: row.work_mode,
    remote: row.work_mode === "Remote",
    salary: row.salary_range || "Not provided",
    posted: row.created_at,
    skills: row.skills || [],
    isDemo: Boolean(row.is_demo),
    isActive: Boolean(row.is_active),
  };
}

const baseSelect = `SELECT j.id, j.title, j.company, j.location, j.job_type, j.work_mode,
  j.salary_range, j.description, j.career_id, j.application_deadline, j.is_demo,
  j.is_active, j.created_at, c.slug AS career_slug, c.category,
  GROUP_CONCAT(DISTINCT s.name ORDER BY s.name SEPARATOR '|||') AS skill_names
  FROM jobs j LEFT JOIN careers c ON c.id = j.career_id
  LEFT JOIN job_skills js ON js.job_id = j.id LEFT JOIN skills s ON s.id = js.skill_id`;

function transformRows(rows) {
  return rows.map((row) => mapJob({
    ...row,
    skills: row.skill_names ? row.skill_names.split("|||") : [],
    category: row.category || "Other",
  }));
}

function buildFilters(filters, includeInactive = false) {
  const where = [];
  const params = [];
  if (!includeInactive) where.push("j.is_active = TRUE");
  if (filters.q) {
    const term = `%${filters.q}%`;
    where.push("(j.title LIKE ? OR j.company LIKE ? OR j.description LIKE ? OR EXISTS (SELECT 1 FROM job_skills sjs JOIN skills ss ON ss.id=sjs.skill_id WHERE sjs.job_id=j.id AND ss.name LIKE ?))");
    params.push(term, term, term, term);
  }
  if (filters.title) { where.push("j.title LIKE ?"); params.push(`%${filters.title}%`); }
  if (filters.location) { where.push("j.location LIKE ?"); params.push(`%${filters.location}%`); }
  if (filters.jobType) { where.push("j.job_type = ?"); params.push(filters.jobType); }
  if (filters.workMode) { where.push("j.work_mode = ?"); params.push(filters.workMode); }
  if (filters.category) { where.push("c.category = ?"); params.push(filters.category); }
  if (filters.skill) {
    where.push("EXISTS (SELECT 1 FROM job_skills fs JOIN skills sk ON sk.id=fs.skill_id WHERE fs.job_id=j.id AND sk.name LIKE ?)");
    params.push(`%${filters.skill}%`);
  }
  return { sql: where.length ? ` WHERE ${where.join(" AND ")}` : "", params };
}

export async function listJobs(filters) {
  const { sql, params } = buildFilters(filters);
  const offset = (filters.page - 1) * filters.limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(DISTINCT j.id) AS total FROM jobs j LEFT JOIN careers c ON c.id = j.career_id${sql}`, params),
    pool.execute(`${baseSelect}${sql} GROUP BY j.id ORDER BY j.created_at DESC, j.id DESC LIMIT ? OFFSET ?`, [...params, filters.limit, offset]),
  ]);
  return { items: transformRows(rows), total: countRows[0].total, page: filters.page, limit: filters.limit };
}

export async function listAdminJobs(filters) {
  const { sql, params } = buildFilters(filters, true);
  const offset = (filters.page - 1) * filters.limit;
  const [[countRows], [rows]] = await Promise.all([
    pool.execute(`SELECT COUNT(DISTINCT j.id) AS total FROM jobs j LEFT JOIN careers c ON c.id = j.career_id${sql}`, params),
    pool.execute(`${baseSelect}${sql} GROUP BY j.id ORDER BY j.created_at DESC LIMIT ? OFFSET ?`, [...params, filters.limit, offset]),
  ]);
  return { items: transformRows(rows), total: countRows[0].total, page: filters.page, limit: filters.limit };
}

export async function getJob(id, includeInactive = false) {
  const [rows] = await pool.execute(`${baseSelect} WHERE j.id = ?${includeInactive ? "" : " AND j.is_active = TRUE"} GROUP BY j.id LIMIT 1`, [id]);
  if (!rows[0]) throw new HttpError(404, "Job listing was not found.", "JOB_NOT_FOUND");
  return transformRows(rows)[0];
}

async function replaceJobSkills(connection, jobId, skills = []) {
  await connection.execute("DELETE FROM job_skills WHERE job_id = ?", [jobId]);
  for (const name of [...new Set(skills)]) {
    await connection.execute("INSERT INTO skills (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)", [name]);
    const [[skill]] = await connection.execute("SELECT id FROM skills WHERE name = ?", [name]);
    await connection.execute("INSERT INTO job_skills (job_id, skill_id) VALUES (?, ?)", [jobId, skill.id]);
  }
}

export async function createJob(input, adminId) {
  const id = await withTransaction(async (connection) => {
    const [result] = await connection.execute(
      `INSERT INTO jobs (title, company, location, job_type, work_mode, salary_range,
        description, career_id, application_deadline, is_demo, is_active, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.title, input.company, input.location, input.jobType, input.workMode, input.salaryRange || null, input.description, input.careerId || null, input.applicationDeadline || null, Boolean(input.isDemo), input.isActive !== false, adminId],
    );
    await replaceJobSkills(connection, result.insertId, input.skills);
    return result.insertId;
  });
  return getJob(id, true);
}

export async function updateJob(id, input) {
  await withTransaction(async (connection) => {
    const [rows] = await connection.execute("SELECT id FROM jobs WHERE id = ? FOR UPDATE", [id]);
    if (!rows.length) throw new HttpError(404, "Job listing was not found.", "JOB_NOT_FOUND");
    const fields = {
      title: ["title", input.title],
      company: ["company", input.company],
      location: ["location", input.location],
      jobType: ["job_type", input.jobType],
      workMode: ["work_mode", input.workMode],
      salaryRange: ["salary_range", input.salaryRange],
      description: ["description", input.description],
      careerId: ["career_id", input.careerId],
      applicationDeadline: ["application_deadline", input.applicationDeadline],
      isDemo: ["is_demo", input.isDemo],
      isActive: ["is_active", input.isActive],
    };
    const assignments = [];
    const values = [];
    for (const [key, [column, value]] of Object.entries(fields)) {
      if (value !== undefined) {
        assignments.push(`${column} = ?`);
        values.push(value === "" ? null : value);
      }
    }
    if (assignments.length) await connection.execute(`UPDATE jobs SET ${assignments.join(", ")} WHERE id = ?`, [...values, id]);
    if (input.skills !== undefined) await replaceJobSkills(connection, id, input.skills);
  });
  return getJob(id, true);
}

export async function deleteJob(id) {
  const [result] = await pool.execute("UPDATE jobs SET is_active = FALSE WHERE id = ?", [id]);
  if (!result.affectedRows) throw new HttpError(404, "Job listing was not found.", "JOB_NOT_FOUND");
}

export async function listSavedJobs(userId) {
  const [rows] = await pool.execute(
    `${baseSelect} JOIN saved_jobs sj ON sj.job_id = j.id WHERE sj.user_id = ? AND j.is_active = TRUE GROUP BY j.id ORDER BY MAX(sj.created_at) DESC, j.id DESC`,
    [userId],
  );
  return transformRows(rows);
}

export async function saveJob(userId, jobId) {
  await getJob(jobId);
  await pool.execute("INSERT IGNORE INTO saved_jobs (user_id, job_id) VALUES (?, ?)", [userId, jobId]);
}

export async function unsaveJob(userId, jobId) {
  await pool.execute("DELETE FROM saved_jobs WHERE user_id = ? AND job_id = ?", [userId, jobId]);
}
