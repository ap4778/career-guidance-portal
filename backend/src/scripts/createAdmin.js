import bcrypt from "bcryptjs";
import { pool } from "../config/database.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password === "change-this-before-creating-admin" || password.length < 12) {
  throw new Error("Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters in backend/.env before running this script.");
}

try {
  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ('CareerPath Admin', ?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'admin', is_active = TRUE`,
    [email, passwordHash],
  );
  await pool.execute(
    "INSERT IGNORE INTO user_profiles (user_id) SELECT id FROM users WHERE email = ?",
    [email],
  );
  console.log(`Administrator account provisioned for ${email}.`);
} finally {
  await pool.end();
}
