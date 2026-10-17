import { pool, withTransaction } from "../config/database.js";
import { replaceUserInterests, replaceUserSkills } from "./authService.js";

export async function getProfile(userId) {
  const [[userRows], [skillRows], [interestRows]] = await Promise.all([
    pool.execute(
      `SELECT u.id, u.full_name AS name, u.email, u.role, p.education_level AS education,
        p.experience_level AS experience,
        p.qualifications, p.preferred_career_id, c.title AS preferred_career,
        p.preferred_location AS preferred_location, p.profile_completion
       FROM users u LEFT JOIN user_profiles p ON p.user_id = u.id
       LEFT JOIN careers c ON c.id = p.preferred_career_id WHERE u.id = ?`,
      [userId],
    ),
    pool.execute(
      `SELECT s.name, us.proficiency FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = ? ORDER BY s.name`,
      [userId],
    ),
    pool.execute("SELECT interest FROM user_interests WHERE user_id = ? ORDER BY interest", [userId]),
  ]);
  const user = userRows[0];
  return {
    ...user,
    skills: skillRows.map((skill) => skill.name),
    skillDetails: skillRows,
    interests: interestRows.map((interest) => interest.interest),
  };
}

export async function updateProfile(userId, input) {
  await withTransaction(async (connection) => {
    if (input.name !== undefined) {
      await connection.execute("UPDATE users SET full_name = ? WHERE id = ?", [input.name, userId]);
    }
    if (input.email !== undefined) {
      await connection.execute("UPDATE users SET email = ? WHERE id = ?", [input.email, userId]);
    }
    await connection.execute(
      `UPDATE user_profiles SET education_level = IF(?, ?, education_level),
        experience_level = IF(?, ?, experience_level), qualifications = IF(?, ?, qualifications),
        preferred_career_id = IF(?, ?, preferred_career_id),
        preferred_location = IF(?, ?, preferred_location) WHERE user_id = ?`,
      [
        input.education !== undefined, input.education ?? null,
        input.experience !== undefined, input.experience ?? "Entry",
        input.qualifications !== undefined, input.qualifications ?? null,
        input.preferredCareerId !== undefined, input.preferredCareerId || null,
        input.preferredLocation !== undefined, input.preferredLocation ?? null,
        userId,
      ],
    );
    if (input.skills !== undefined) await replaceUserSkills(connection, userId, input.skills);
    if (input.interests !== undefined) await replaceUserInterests(connection, userId, input.interests);
  });
  const profile = await getProfile(userId);
  const completion = calculateCompletion(profile);
  await pool.execute("UPDATE user_profiles SET profile_completion = ? WHERE user_id = ?", [completion, userId]);
  return { ...profile, profile_completion: completion };
}

function calculateCompletion(profile) {
  const checks = [
    Boolean(profile.name), Boolean(profile.education), Boolean(profile.qualifications),
    profile.skills.length > 0, profile.interests.length > 0,
    Boolean(profile.preferred_location || profile.preferred_career_id),
  ];
  return Math.round(checks.filter(Boolean).length / checks.length * 100);
}
