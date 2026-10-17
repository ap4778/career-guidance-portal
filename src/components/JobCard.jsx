import { Bookmark, ArrowUpRight } from "lucide-react";
import { formatRelativeDate } from "../utils/relativeDate.js";
import "./JobCard.css";

export default function JobCard({ job, match, saved, onSave, onDetails }) {
  return (
    <article className="job-card">
      <div className="company-monogram" aria-hidden="true">{job.company.slice(0, 1)}</div>
      <div className="job-card-main">
        <div className="job-title-row"><div><h3>{job.title}</h3><p className="job-company">{job.company}</p></div>{match > 0 && <span className="match-text">{match}% match</span>}</div>
        <p className="job-description">{job.description}</p>
        <div className="job-meta"><span>{job.location}</span><span>{job.type}</span><strong>{job.salary}</strong></div>
        {job.skills?.length > 0 && <p className="job-skills-text">{job.skills.slice(0, 4).join(", ")}</p>}
        <span className="job-posted">{formatRelativeDate(job.posted)}</span>
      </div>
      <div className="job-card-actions">
        <button onClick={() => onSave(job)} className={`save-job-button ${saved ? "is-saved" : ""}`} aria-label={saved ? "Remove saved job" : "Save job"} title={saved ? "Remove saved job" : "Save job"}><Bookmark size={17} fill={saved ? "currentColor" : "none"} /><span>{saved ? "Saved" : "Save"}</span></button>
        <button className="job-details-button" onClick={() => onDetails(job)}>Details <ArrowUpRight size={14} /></button>
      </div>
    </article>
  );
}
