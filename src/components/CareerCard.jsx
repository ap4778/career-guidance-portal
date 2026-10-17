import { ArrowUpRight, Check, TrendingUp } from "lucide-react";
import ProgressBar from "./ProgressBar.jsx";
import "./CareerCard.css";

export default function CareerCard({ career, rank, compact = false, onExplore }) {
  return (
    <article className={`career-card ${compact ? "career-compact" : ""}`}>
      <div className="career-card-top"><span className="career-rank">#{rank}</span><span className="match-pill">{career.score}% match</span></div>
      <h3>{career.title}</h3><p className="career-description">{career.description}</p>
      {!compact && <ProgressBar value={career.score} />}
      <div className="career-detail-row"><span>Salary range</span><strong>{career.salary}</strong></div>
      <div className="career-detail-row"><span><TrendingUp size={14} /> Growth</span><strong>{career.growth}</strong></div>
      {!compact && <>
        <div className="career-reason"><strong>Why this fits</strong><p>{career.explanation || (career.matchedSkills.length ? `Your ${career.matchedSkills.slice(0, 3).join(", ")} skills align with this path${career.interestsMatched.length ? `, and your interest in ${career.interestsMatched[0].toLowerCase()} supports the fit` : ""}.` : "This path aligns with your selected interests. Add more relevant skills to improve your match.")}</p></div>
        <div className="career-skill-lists"><div><span className="list-heading">Matched skills</span><div className="mini-tags">{career.matchedSkills.length ? career.matchedSkills.map((skill) => <span key={skill}><Check size={11} />{skill}</span>) : <em>None yet</em>}</div></div><div><span className="list-heading">Skills to build</span><div className="mini-tags missing">{career.missingSkills.slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div></div></div>
      </>}
      {onExplore && <button className="text-button" onClick={() => onExplore(career)}>Explore career <ArrowUpRight size={15} /></button>}
    </article>
  );
}
