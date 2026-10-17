import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import JobCard from "../components/JobCard.jsx";
import Modal from "../components/Modal.jsx";
import { getJobMatch } from "../utils/jobMatcher.js";
import { formatRelativeDate } from "../utils/relativeDate.js";
import { api } from "../services/api.js";
import "./JobPortal.css";

export default function JobPortal({ profile, jobs, careers, savedJobs, applications, onToggleSaved, onApply, onRemoveApplication, notify }) {
  const [serverJobs, setServerJobs] = useState(jobs);
  const [totalJobs, setTotalJobs] = useState(jobs.length);
  const [page, setPage] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsError, setJobsError] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All roles");
  const [location, setLocation] = useState("Any location");
  const [type, setType] = useState("Any type");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sort, setSort] = useState("match");
  const [savedTab, setSavedTab] = useState(false);
  const [selected, setSelected] = useState(null);
  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(async () => {
      setJobsLoading(true);
      setJobsError("");
      try {
        if (savedTab) {
          const response = await api("/saved-jobs");
          if (!cancelled) {
            setServerJobs(response.jobs);
            setTotalJobs(response.jobs.length);
          }
        } else {
          const params = new URLSearchParams({ page: String(page), limit: "12" });
          if (query.trim()) params.set("q", query.trim());
          if (category !== "All roles") params.set("category", category);
          if (location !== "Any location") params.set("location", location);
          if (type !== "Any type") params.set("jobType", type);
          if (remoteOnly) params.set("workMode", "Remote");
          const response = await api(`/jobs?${params.toString()}`);
          if (!cancelled) {
            setServerJobs(response.items);
            setTotalJobs(response.total);
          }
        }
      } catch (error) {
        if (!cancelled) setJobsError(error.message || "Could not load job listings.");
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    }, 200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query, category, location, type, remoteOnly, savedTab, page]);
  const filteredJobs = useMemo(() => {
    const filtered = serverJobs.filter((job) => {
      const searchText = `${job.title} ${job.company} ${job.description} ${job.skills.join(" ")}`.toLowerCase();
      return (!savedTab || savedJobs.includes(job.id)) && (!query || searchText.includes(query.toLowerCase()));
    }).map((job) => ({ job, match: getJobMatch(job, profile.skills) }));
    return filtered.sort((a, b) => sort === "date" ? b.job.posted.localeCompare(a.job.posted) : sort === "title" ? a.job.title.localeCompare(b.job.title) : b.match - a.match);
  }, [query, savedTab, serverJobs, savedJobs, sort, profile.skills]);
  const apply = () => {
    if (!selected) return;
    onApply(selected);
    setSelected(null);
  };
  const selectedMatch = selected ? getJobMatch(selected, profile.skills) : 0;
  const clearFilters = () => { setQuery(""); setCategory("All roles"); setLocation("Any location"); setType("Any type"); setRemoteOnly(false); setPage(1); };
  const pageCount = Math.max(1, Math.ceil(totalJobs / (savedTab ? Math.max(totalJobs, 1) : 12)));
  return (
    <div className="page-content jobs-page">
      <div className="page-header"><div><h1>Jobs</h1></div></div>
      <div className="job-tabs"><button className={!savedTab ? "selected" : ""} onClick={() => { setSavedTab(false); setPage(1); }}>Explore jobs</button><button className={savedTab ? "selected" : ""} onClick={() => { setSavedTab(true); setPage(1); }}>Saved jobs</button></div>
      <section className="filter-panel panel">
        <label className="search-field"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search roles, companies or skills…" aria-label="Search jobs" />{query && <button className="icon-button" onClick={() => { setQuery(""); setPage(1); }} aria-label="Clear search"><X size={15} /></button>}</label>
        <div className="filter-controls">
          <label className="sr-only" htmlFor="role-filter">Role category</label><select id="role-filter" value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option>All roles</option>{[...new Set(careers.map((career) => career.category))].map((item) => <option key={item}>{item}</option>)}</select>
          <label className="sr-only" htmlFor="location-filter">Location</label><select id="location-filter" value={location} onChange={(event) => { setLocation(event.target.value); setPage(1); }}><option>Any location</option>{[...new Set(jobs.map((job) => job.location))].sort().map((item) => <option key={item}>{item}</option>)}</select>
          <label className="sr-only" htmlFor="type-filter">Job type</label><select id="type-filter" value={type} onChange={(event) => { setType(event.target.value); setPage(1); }}><option>Any type</option>{[...new Set(jobs.map((job) => job.type))].map((item) => <option key={item}>{item}</option>)}</select>
          <label className="remote-check"><input type="checkbox" checked={remoteOnly} onChange={(event) => { setRemoteOnly(event.target.checked); setPage(1); }} /> Remote</label>
          <label className="sort-select"><SlidersHorizontal size={15} /><span className="sr-only">Sort jobs</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="match">Best match</option><option value="date">Newest</option><option value="title">Job title</option></select></label>
        </div>
        {(query || category !== "All roles" || location !== "Any location" || type !== "Any type" || remoteOnly) && <button className="clear-filters text-button" onClick={clearFilters}>Clear filters <X size={14} /></button>}
      </section>
      <div className="results-summary">{totalJobs} {totalJobs === 1 ? "job" : "jobs"}</div>
      {jobsError && <p className="guidance-error" role="alert">{jobsError}</p>}
      {jobsLoading && <p role="status" className="jobs-loading">Loading job listings…</p>}
      {!jobsLoading && !filteredJobs.length ? <div className="panel empty-state jobs-empty"><h3>{savedTab ? "No saved jobs yet." : "No jobs found."}</h3><p>{savedTab ? "Save a job from the list to see it here." : "Try another search or clear your filters."}</p>{savedTab && <button className="button button-soft" onClick={() => setSavedTab(false)}>Explore jobs</button>}</div> : <div className="job-grid">{filteredJobs.map(({ job, match }) => <JobCard key={job.id} job={job} match={match} saved={savedJobs.includes(job.id)} onSave={onToggleSaved} onDetails={setSelected} />)}</div>}
      {!savedTab && pageCount > 1 && <div className="jobs-pagination"><button className="button button-soft" disabled={page <= 1 || jobsLoading} onClick={() => setPage((current) => current - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button className="button button-soft" disabled={page >= pageCount || jobsLoading} onClick={() => setPage((current) => current + 1)}>Next</button></div>}

      <section className="panel tracker-panel"><div className="section-heading"><div><h2>Application tracker</h2></div></div>
        {!applications.length ? <p className="tracker-empty">No applications yet. Open a job and choose Apply to start tracking your progress.</p> : <div className="tracker-table-wrap"><table className="tracker-table"><thead><tr><th>Role</th><th>Company</th><th>Applied</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{applications.map((application) => {
          const job = application.job || jobs.find((item) => item.id === application.jobId);
          if (!job) return null;
          return <tr key={application.id}><td><strong>{job.title}</strong></td><td>{job.company}</td><td>{application.appliedDate}</td><td><span className={`status-select status-${application.status.toLowerCase().replaceAll(" ", "-")}`}>{application.status}</span></td><td><button className="icon-button delete-application" aria-label={`Delete ${job.title} application`} onClick={() => onRemoveApplication(application)}>×</button></td></tr>;
        })}</tbody></table></div>}
      </section>
      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.title || "Job details"}>
        {selected && <div className="job-modal-details"><p className="job-company">{selected.company} · {selected.location}</p><div className="job-modal-meta"><span>{selected.type}</span><span>{selected.salary}</span>{selected.remote && <span>Remote</span>}</div><h3>About this role</h3><p>{selected.description}</p><h3>Skills they’re looking for</h3><div className="job-skill-tags">{selected.skills.map((skill) => <span key={skill}>{skill}</span>)}</div><p className="posted-date">Posted {formatRelativeDate(selected.posted)}{selectedMatch > 0 && ` · ${selectedMatch}% match to your profile`}</p><button className="button button-primary apply-button" onClick={apply}>Add to application tracker</button></div>}
      </Modal>
    </div>
  );
}
