const normalize = (value) => String(value || "").trim().toLocaleLowerCase();

export function scoreCareer(career, profile) {
  const userSkills = new Set(profile.skills.map(normalize));
  const userInterests = new Set(profile.interests.map(normalize));
  const matchedSkills = career.skills.filter((skill) => userSkills.has(normalize(skill.name))).map((skill) => skill.name);
  const missingSkills = career.skills.filter((skill) => !userSkills.has(normalize(skill.name))).map((skill) => skill.name);
  const weightTotal = career.skills.reduce((sum, skill) => sum + Number(skill.weight), 0) || 1;
  const skillScore = career.skills.reduce((sum, skill) => sum + (userSkills.has(normalize(skill.name)) ? Number(skill.weight) : 0), 0) / weightTotal;
  const interestsMatched = career.interests.filter((interest) => userInterests.has(normalize(interest)));
  const interestScore = career.interests.length ? interestsMatched.length / career.interests.length : 0;
  const experience = profile.experience || "Entry";
  const experienceScore = career.experience.includes(experience) ? 1 : experience === "Entry" ? 0.55 : 0.7;
  const score = Math.round((skillScore * 0.6 + interestScore * 0.25 + experienceScore * 0.15) * 100 + 1e-10);
  const reasons = [];
  if (matchedSkills.length) reasons.push(`Your ${matchedSkills.slice(0, 3).join(", ")} skills align with this path`);
  if (interestsMatched.length) reasons.push(`your interest in ${interestsMatched[0].toLocaleLowerCase()} supports the fit`);
  return {
    ...career,
    score,
    matchedSkills,
    missingSkills,
    interestsMatched,
    explanation: reasons.length ? `${reasons.join(", ")}.` : "This path may be worth exploring. Add relevant skills and interests to improve the assessment.",
  };
}
