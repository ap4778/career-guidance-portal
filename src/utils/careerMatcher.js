const normalize = (value) => String(value || "").trim().toLowerCase();

// Scores combine weighted skill coverage (60%), interest overlap (25%) and
// experience fit (15%). This is deterministic sample-data matching, not AI.
export function matchCareers(careerList, profile = {}) {
  const userSkills = new Set((profile.skills || []).map(normalize));
  const userInterests = new Set((profile.interests || []).map(normalize));
  return careerList.map((career) => {
    const totalWeight = career.skills.reduce((sum, skill) => sum + skill.weight, 0) || 1;
    const matchedSkills = career.skills.filter((skill) => userSkills.has(normalize(skill.name))).map((skill) => skill.name);
    const missingSkills = career.skills.filter((skill) => !userSkills.has(normalize(skill.name))).map((skill) => skill.name);
    const skillScore = career.skills.reduce((sum, skill) => sum + (userSkills.has(normalize(skill.name)) ? skill.weight : 0), 0) / totalWeight;
    const interests = career.interests.filter((interest) => userInterests.has(normalize(interest)));
    const interestScore = career.interests.length ? interests.length / career.interests.length : 0;
    const level = profile.experience || "Entry";
    const experienceScore = career.experience.includes(level) ? 1 : level === "Entry" ? .55 : .7;
    const score = Math.round((skillScore * .6 + interestScore * .25 + experienceScore * .15) * 100);
    return { ...career, score, matchedSkills, missingSkills, interestsMatched: interests };
  }).sort((a, b) => b.score - a.score);
}
