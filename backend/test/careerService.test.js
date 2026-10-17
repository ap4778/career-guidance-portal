import test from "node:test";
import assert from "node:assert/strict";
import { scoreCareer } from "../src/services/careerScoring.js";

const career = {
  id: "1",
  title: "Frontend Developer",
  skills: [{ name: "JavaScript", weight: 1 }, { name: "React", weight: 1 }],
  interests: ["Building products", "Design"],
  experience: ["Entry", "Mid"],
};

test("career score combines weighted skills, interests, and experience", () => {
  const result = scoreCareer(career, {
    skills: ["JavaScript"],
    interests: ["Building products"],
    experience: "Entry",
  });
  assert.equal(result.score, 58);
  assert.deepEqual(result.matchedSkills, ["JavaScript"]);
  assert.deepEqual(result.missingSkills, ["React"]);
  assert.deepEqual(result.interestsMatched, ["Building products"]);
  assert.match(result.explanation, /JavaScript/);
});

test("career scoring normalizes skill and interest case and gives useful gap output", () => {
  const result = scoreCareer(career, {
    skills: ["javascript", "REACT"],
    interests: ["design"],
    experience: "Senior",
  });
  assert.equal(result.score, 83);
  assert.deepEqual(result.matchedSkills, ["JavaScript", "React"]);
  assert.deepEqual(result.missingSkills, []);
  assert.deepEqual(result.interestsMatched, ["Design"]);
});

test("empty profile receives a low baseline and still includes every missing skill", () => {
  const result = scoreCareer(career, { skills: [], interests: [], experience: "Entry" });
  assert.equal(result.score, 15);
  assert.deepEqual(result.missingSkills, ["JavaScript", "React"]);
  assert.ok(result.explanation.length > 0);
});
