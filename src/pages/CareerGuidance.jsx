import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import SkillTagInput from "../components/SkillTagInput.jsx";
import CareerCard from "../components/CareerCard.jsx";
import { api } from "../services/api.js";
import "./CareerGuidance.css";

const interestOptions = ["Building products", "Design", "Analyzing data", "Business", "People", "Research", "Systems", "Problem solving"];

export default function CareerGuidance({ profile, setProfile, savedGuidance, setSavedGuidance, careers, skills, notify }) {
  const [form, setForm] = useState(savedGuidance?.inputs || profile);
  const [loading, setLoading] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [results, setResults] = useState(savedGuidance?.results || []);
  const toggleInterest = (interest) => setForm((current) => ({ ...current, interests: current.interests.includes(interest) ? current.interests.filter((item) => item !== interest) : [...current.interests, interest] }));
  const getRecommendations = async (event) => {
    event.preventDefault();
    if (!form.skills.length && !form.interests.length) { notify("Add at least one skill or interest to get meaningful matches."); return; }
    setLoading(true);
    setRequestError("");
    try {
      const assessment = await api("/careers/recommendations", { method: "POST", body: form });
      const matches = assessment.results;
      setResults(matches);
      setSavedGuidance(assessment);
      setProfile({ ...profile, skills: form.skills, interests: form.interests, education: form.education, experience: form.experience });
      notify("Your career recommendations are ready.");
    } catch (error) {
      setRequestError(error.message || "Career recommendations could not be generated.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="page-content guidance-page">
      <div className="page-header"><div><h1>Career guidance</h1><p className="page-subtitle">Explore roles based on your skills, interests and experience.</p></div><span className="local-badge">Rule-based assessment</span></div>
      <div className="guidance-layout">
        <form className="panel guidance-form" onSubmit={getRecommendations}>
          <div className="section-heading"><div><h2>Tell us about you</h2><p className="form-intro">A few details help us find a better fit.</p></div></div>
          <label className="field-label">Your skills <span>Required to improve the match</span></label>
          <SkillTagInput value={form.skills} onChange={(next) => setForm({ ...form, skills: next })} suggestions={skills} />
          <fieldset className="interest-fieldset"><legend>What are you interested in?</legend><div className="interest-chips">{interestOptions.map((interest) => <button type="button" key={interest} className={`interest-chip ${form.interests.includes(interest) ? "selected" : ""}`} aria-pressed={form.interests.includes(interest)} onClick={() => toggleInterest(interest)}>{interest}</button>)}</div></fieldset>
          <div className="form-two-columns">
            <label className="field-label">Education level<select value={form.education} onChange={(event) => setForm({ ...form, education: event.target.value })}><option>High school</option><option>Associate degree</option><option>Bachelor's degree</option><option>Master's degree</option><option>Doctorate</option></select></label>
            <label className="field-label">Experience level<select value={form.experience} onChange={(event) => setForm({ ...form, experience: event.target.value })}><option>Entry</option><option>Mid</option><option>Senior</option></select></label>
          </div>
          <button type="submit" className="button button-primary recommendation-button" disabled={loading}>{loading ? <><LoaderCircle className="spin" size={17} /> Calculating recommendations…</> : "Get recommendations"}</button>
          <p className="privacy-note">Your profile and assessment history are saved to your account. Matching is rule-based, not a live AI service.</p>
        </form>
        <section className="recommendations-area">
          <div className="section-heading"><div><h2>Career recommendations</h2></div></div>
          {requestError && <p className="guidance-error" role="alert">{requestError}</p>}
          {!results.length ? <div className="empty-state panel"><h3>No recommendations yet</h3><p>Add skills or interests, then get recommendations to compare career paths.</p></div> : <div className="career-results">{results.map((career, index) => <CareerCard key={career.id} career={career} rank={index + 1} />)}</div>}
          <div className="algorithm-explainer"><p><strong>How matching works</strong><br />The score combines skill overlap (60%), interest match (25%) and experience fit (15%). Recommendations use a sample career catalogue and are not live labor-market data.</p></div>
        </section>
      </div>
    </div>
  );
}
