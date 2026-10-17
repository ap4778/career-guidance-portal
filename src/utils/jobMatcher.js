export function getJobMatch(job, userSkills = []) {
  const skillSet = new Set(userSkills.map((skill) => skill.toLowerCase()));
  const directOverlap = job.skills.filter((skill) => skillSet.has(skill.toLowerCase())).length;
  return job.skills.length ? Math.round((directOverlap / job.skills.length) * 100) : 0;
}
