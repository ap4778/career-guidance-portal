import { useEffect, useState } from "react";
import { api } from "../services/api.js";

const emptyJob = { title: "", company: "", location: "", jobType: "Full-time", workMode: "Remote", salaryRange: "", description: "", skills: [], skillsInput: "", careerId: "", applicationDeadline: "", isDemo: false, isActive: true };

export default function AdminDashboard({ careers }) {
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [jobForm, setJobForm] = useState(emptyJob);
  const [editingJobId, setEditingJobId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setError("");
    try {
      const [stats, userRows, jobRows, applicationRows] = await Promise.all([
        api("/admin/statistics"),
        api("/admin/users?limit=50"),
        api("/admin/jobs?limit=50"),
        api("/admin/applications?limit=50"),
      ]);
      setStatistics(stats);
      setUsers(userRows.items);
      setJobs(jobRows.items);
      setApplications(applicationRows.items);
    } catch (cause) {
      setError(cause.message || "Could not load admin data.");
    }
  };

  useEffect(() => { load(); }, []);

  const saveJob = async (event) => {
    event.preventDefault();
    const skills = jobForm.skillsInput.split(",").map((skill) => skill.trim()).filter(Boolean);
    setBusy(true);
    setError("");
    try {
      const body = {
        ...jobForm,
        careerId: jobForm.careerId || null,
        applicationDeadline: jobForm.applicationDeadline || null,
        skills,
      };
      await api(editingJobId ? `/jobs/${editingJobId}` : "/jobs", {
        method: editingJobId ? "PUT" : "POST",
        body,
      });
      setJobForm(emptyJob);
      setEditingJobId(null);
      setMessage(editingJobId ? "Job listing updated." : "Job listing created.");
      await load();
    } catch (cause) {
      setError(cause.message || "Could not create the job listing.");
    } finally {
      setBusy(false);
    }
  };

  const updateApplication = async (id, status) => {
    try {
      await api(`/admin/applications/${id}`, { method: "PATCH", body: { status } });
      setApplications((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      setMessage("Application status updated.");
    } catch (cause) { setError(cause.message); }
  };

  const updateUser = async (id, changes) => {
    try {
      await api(`/admin/users/${id}`, { method: "PATCH", body: changes });
      setUsers((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item));
      setMessage("User updated.");
    } catch (cause) { setError(cause.message); }
  };

  const toggleJob = async (job) => {
    try {
      await api(`/jobs/${job.id}`, { method: "PUT", body: {
        title: job.title,
        company: job.company,
        location: job.location,
        jobType: job.type,
        workMode: job.workMode,
        salaryRange: job.salary === "Not provided" ? "" : job.salary,
        description: job.description,
        careerId: job.careerId || null,
        applicationDeadline: job.application_deadline || null,
        isDemo: job.isDemo,
        skills: job.skills,
        isActive: !job.isActive,
      } });
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, isActive: !item.isActive } : item));
      setMessage("Job listing status updated.");
    } catch (cause) { setError(cause.message); }
  };

  const editJob = (job) => {
    setEditingJobId(job.id);
    setJobForm({
      title: job.title,
      company: job.company,
      location: job.location,
      jobType: job.type,
      workMode: job.workMode,
      salaryRange: job.salary === "Not provided" ? "" : job.salary,
      description: job.description,
      skillsInput: job.skills.join(", "),
      careerId: job.careerId || "",
      applicationDeadline: job.application_deadline ? new Date(job.application_deadline).toISOString().slice(0, 10) : "",
      isDemo: job.isDemo,
      isActive: job.isActive,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteJob = async (job) => {
    try {
      await api(`/jobs/${job.id}`, { method: "DELETE" });
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, isActive: false } : item));
      setMessage("Job listing deactivated and removed from student search.");
    } catch (cause) { setError(cause.message); }
  };

  return (
    <div className="page-content admin-page">
      <div className="page-header"><div><h1>Admin dashboard</h1><p className="page-subtitle">Manage accounts, job listings and applications.</p></div><button className="button button-soft" onClick={load}>Refresh</button></div>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {message && <p className="admin-message" role="status">{message}<button className="text-button" onClick={() => setMessage("")}>Dismiss</button></p>}
      <section className="admin-stat-grid">
        <article className="panel admin-stat"><span>Students</span><strong>{statistics?.users.find((item) => item.role === "student")?.count || 0}</strong></article>
        <article className="panel admin-stat"><span>Applications</span><strong>{statistics?.applications.reduce((sum, item) => sum + item.count, 0) || 0}</strong></article>
        <article className="panel admin-stat"><span>Career assessments</span><strong>{statistics?.popularCareers.reduce((sum, item) => sum + item.recommendations, 0) || 0}</strong></article>
      </section>
      <section className="panel admin-section"><h2>{editingJobId ? "Edit job listing" : "Create a job listing"}</h2><p>Use only authorized, verified listings. Mark invented or practice listings as demos.</p>
        <form className="admin-job-form" onSubmit={saveJob}>
          <label className="field-label">Title<input required maxLength="180" value={jobForm.title} onChange={(event) => setJobForm({ ...jobForm, title: event.target.value })} /></label>
          <label className="field-label">Company<input required maxLength="180" value={jobForm.company} onChange={(event) => setJobForm({ ...jobForm, company: event.target.value })} /></label>
          <label className="field-label">Location<input required maxLength="180" value={jobForm.location} onChange={(event) => setJobForm({ ...jobForm, location: event.target.value })} /></label>
          <label className="field-label">Job type<select value={jobForm.jobType} onChange={(event) => setJobForm({ ...jobForm, jobType: event.target.value })}>{["Full-time", "Part-time", "Contract", "Internship", "Temporary"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Work mode<select value={jobForm.workMode} onChange={(event) => setJobForm({ ...jobForm, workMode: event.target.value })}>{["On-site", "Hybrid", "Remote"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Salary range<input maxLength="100" value={jobForm.salaryRange} onChange={(event) => setJobForm({ ...jobForm, salaryRange: event.target.value })} /></label>
          <label className="field-label">Related career<select value={jobForm.careerId} onChange={(event) => setJobForm({ ...jobForm, careerId: event.target.value })}><option value="">No related career</option>{careers.map((career) => <option key={career.id} value={career.id}>{career.title}</option>)}</select></label>
          <label className="field-label">Application deadline<input type="date" value={jobForm.applicationDeadline} onChange={(event) => setJobForm({ ...jobForm, applicationDeadline: event.target.value })} /></label>
          <label className="field-label">Required skills (comma-separated)<input value={jobForm.skillsInput || ""} onChange={(event) => setJobForm({ ...jobForm, skillsInput: event.target.value })} /></label>
          <label className="field-label admin-full-field">Description<textarea required rows="3" maxLength="8000" value={jobForm.description} onChange={(event) => setJobForm({ ...jobForm, description: event.target.value })} /></label>
          <label className="remote-check"><input type="checkbox" checked={jobForm.isDemo} onChange={(event) => setJobForm({ ...jobForm, isDemo: event.target.checked })} />Clearly labeled demo listing</label>
          <button className="button button-primary" disabled={busy}>{busy ? "Saving…" : editingJobId ? "Save changes" : "Create listing"}</button>
          {editingJobId && <button className="button button-soft" type="button" disabled={busy} onClick={() => { setEditingJobId(null); setJobForm(emptyJob); }}>Cancel edit</button>}
        </form>
      </section>
      <section className="panel admin-section"><h2>Users</h2><div className="admin-table-wrap"><table className="tracker-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Account</th></tr></thead><tbody>{users.map((item) => <tr key={item.id}><td>{item.name}</td><td>{item.email}</td><td><select value={item.role} aria-label={`Role for ${item.email}`} onChange={(event) => updateUser(item.id, { role: event.target.value })}><option value="student">Student</option><option value="admin">Admin</option></select></td><td><button className="text-button" onClick={() => updateUser(item.id, { isActive: !item.isActive })}>{item.isActive ? "Deactivate" : "Activate"}</button></td></tr>)}</tbody></table></div></section>
      <section className="panel admin-section"><h2>Job listings</h2><div className="admin-table-wrap"><table className="tracker-table"><thead><tr><th>Role</th><th>Company</th><th>Location</th><th>Status</th><th>Actions</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.id}><td>{job.title}</td><td>{job.company}</td><td>{job.location}</td><td>{job.isDemo ? "Demo" : "Listing"} · {job.isActive ? "Active" : "Inactive"}</td><td><button className="text-button" onClick={() => editJob(job)}>Edit</button> <button className="text-button" onClick={() => toggleJob(job)}>{job.isActive ? "Deactivate" : "Activate"}</button>{job.isActive && <> <button className="text-button" onClick={() => deleteJob(job)}>Delete</button></>}</td></tr>)}</tbody></table></div></section>
      <section className="panel admin-section"><h2>Applications</h2><div className="admin-table-wrap"><table className="tracker-table"><thead><tr><th>Applicant</th><th>Role</th><th>Company</th><th>Status</th></tr></thead><tbody>{applications.map((item) => <tr key={item.id}><td>{item.applicant}<br /><small>{item.email}</small></td><td>{item.title}</td><td>{item.company}</td><td><select value={item.status} onChange={(event) => updateApplication(item.id, event.target.value)}>{["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"].map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div></section>
      <section className="panel admin-section"><h2>Popular career recommendations</h2>{!statistics?.popularCareers.length ? <p>No assessment data yet.</p> : <ol>{statistics.popularCareers.map((career) => <li key={career.id}>{career.title}: {career.recommendations}</li>)}</ol>}</section>
    </div>
  );
}
