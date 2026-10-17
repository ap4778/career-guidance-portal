import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import SkillTagInput from "../components/SkillTagInput.jsx";
import { skills as skillOptions } from "../data/skills.js";
import "./Onboarding.css";

const interests = ["Building products", "Design", "Analyzing data", "Business", "People", "Research", "Systems", "Problem solving"];

export default function Onboarding({ name, initialSkills = [], initialInterests = [], onComplete }) {
  const [skills, setSkills] = useState(initialSkills);
  const [selectedInterests, setSelectedInterests] = useState(initialInterests);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleInterest = (interest) => {
    setSelectedInterests((current) => current.includes(interest)
      ? current.filter((item) => item !== interest)
      : [...current, interest]);
    setMessage("");
  };

  const finish = async () => {
    if (!skills.length && !selectedInterests.length) {
      setMessage("Choose at least one skill or interest to personalize your dashboard.");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      await onComplete({ skills, interests: selectedInterests });
    } catch (error) {
      setMessage(error.message || "Your profile could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="onboarding-page">
      <header className="onboarding-brand">CareerPath</header>
      <section className="panel onboarding-card">
        <h1>Set up your profile{name ? `, ${name}` : ""}</h1>
        <p className="onboarding-intro">Choose skills and interests to get career recommendations. You can update them later.</p>
        <label className="onboarding-label">Skills you have or are learning</label>
        <SkillTagInput value={skills} onChange={setSkills} suggestions={skillOptions} />
        <fieldset className="onboarding-interests"><legend>Things you enjoy</legend><div className="onboarding-chips">{interests.map((interest) => {
          const selected = selectedInterests.includes(interest);
          return <button key={interest} type="button" aria-pressed={selected} className={selected ? "selected" : ""} onClick={() => toggleInterest(interest)}>{selected && <Check size={13} />}{interest}</button>;
        })}</div></fieldset>
        {message && <p className="onboarding-error" role="alert">{message}</p>}
        <button className="button button-primary onboarding-submit" onClick={finish} disabled={saving}>{saving ? <><LoaderCircle className="spin" size={16} /> Saving profile…</> : "Continue to dashboard"}</button>
        <p className="onboarding-storage-note">Saved privately in this browser. No profile data leaves your device.</p>
      </section>
    </main>
  );
}
