export function getSkillGaps(career, userSkills = []) {
  if (!career) return [];
  const userSet = new Set(userSkills.map((skill) => skill.toLowerCase()));
  const missing = career.skills.filter((skill) => !userSet.has(skill.name.toLowerCase()));
  return missing.map((skill, index) => ({
    ...skill,
    priority: index < 2 ? "High" : index < 4 ? "Medium" : "Low",
  }));
}
