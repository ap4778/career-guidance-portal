import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { pool, withTransaction } from "../config/database.js";
import { HttpError } from "../utils/http.js";

export async function registerUser({ name, email, password, education, qualifications, skills = [], interests = [] }) {
  const passwordHash = await bcrypt.hash(password, 12);
  return withTransaction(async (connection) => {
    const [existing] = await connection.execute("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);
    if (existing.length) throw new HttpError(409, "An account with this email already exists.", "EMAIL_IN_USE");
    const [insert] = await connection.execute(
      "INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, 'student')",
      [name, email, passwordHash],
    );
    const userId = insert.insertId;
    await connection.execute(
      "INSERT INTO user_profiles (user_id, education_level, qualifications) VALUES (?, ?, ?)",
      [userId, education || null, qualifications || null],
    );
    await replaceUserSkills(connection, userId, skills);
    await replaceUserInterests(connection, userId, interests);
    return { id: userId, name, email, role: "student" };
  });
}

export async function authenticateUser(email, password) {
  const [rows] = await pool.execute(
    "SELECT id, full_name, email, password_hash, role, is_active FROM users WHERE email = ? LIMIT 1",
    [email],
  );
  const user = rows[0];
  if (!user || !user.is_active || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "Email or password is incorrect.", "INVALID_CREDENTIALS");
  }
  return { id: user.id, name: user.full_name, email: user.email, role: user.role };
}

export function signSession(user) {
  return jwt.sign({ sub: String(user.id), role: user.role }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

async function replaceUserSkills(connection, userId, skills) {
  await connection.execute("DELETE FROM user_skills WHERE user_id = ?", [userId]);
  for (const item of skills) {
    const name = typeof item === "string" ? item : item.name;
    const proficiency = typeof item === "string" ? "beginner" : (item.proficiency || "beginner");
    await connection.execute("INSERT INTO skills (name) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name)", [name]);
    const [[skill]] = await connection.execute("SELECT id FROM skills WHERE name = ?", [name]);
    await connection.execute("INSERT INTO user_skills (user_id, skill_id, proficiency) VALUES (?, ?, ?)", [userId, skill.id, proficiency]);
  }
}

async function replaceUserInterests(connection, userId, interests) {
  await connection.execute("DELETE FROM user_interests WHERE user_id = ?", [userId]);
  for (const interest of interests) {
    await connection.execute("INSERT INTO user_interests (user_id, interest) VALUES (?, ?)", [userId, interest]);
  }
}

export { replaceUserSkills, replaceUserInterests };
