import { useState } from "react";
import { ArrowRight, BriefcaseBusiness, CalendarCheck, CheckCircle2, CircleDollarSign, Plus, Target } from "lucide-react";
import { Link } from "react-router-dom";
import StatCard from "../components/StatCard.jsx";
import CareerCard from "../components/CareerCard.jsx";
import JobCard from "../components/JobCard.jsx";
import ProgressBar from "../components/ProgressBar.jsx";
import { getJobMatch } from "../utils/jobMatcher.js";
import "./Dashboard.css";

export default function Dashboard({ profile, setProfile, applications, savedJobs, roadmaps, jobs, savedGuidance, onSaveJob, onJobDetails }) {
  const [editingName, setEditingName] = useState(false);
  const topCareer = savedGuidance?.results?.[0];
  const recommendations = (jobs || []).map((job) => ({ job, match: getJobMatch(job, profile.skills) })).sort((a, b) => b.match - a.match).slice(0, 3);
  const roadmapItems = (roadmaps || []).flatMap((roadmap) => roadmap.phases.flatMap((phase) => phase.topics));
  const completed = roadmapItems.filter((topic) => topic.complete).length;
  const progress = roadmapItems.length ? Math.round(completed / roadmapItems.length * 100) : 0;
  const counts = ["Applied", "Under Review", "Shortlisted", "Rejected", "Selected"].map((status) => ({ status, count: applications.filter((app) => app.status === status).length }));
  const maxCount = Math.max(1, ...counts.map((item) => item.count));
  return (
    <div className="page-content dashboard-page">
      <div className="welcome-row">
        <div><div className="welcome-heading">
          {editingName ? <input autoFocus value={profile.name} aria-label="Your name" onChange={(event) => setProfile({ ...profile, name: event.target.value })} onBlur={() => setEditingName(false)} onKeyDown={(event) => event.key === "Enter" && setEditingName(false)} /> : <h1>Welcome back, {profile.name || "there"}</h1>}
          <button className="subtle-button" onClick={() => setEditingName(!editingName)}>{editingName ? "Done" : "Edit name"}</button>
        </div></div>
        <Link to="/guidance" className="button button-primary">Career guidance</Link>
      </div>

      <section className="stat-grid" aria-label="Career statistics">
        <StatCard icon={BriefcaseBusiness} label="Jobs saved" value={savedJobs.length} />
        <StatCard icon={CheckCircle2} label="Applications" value={applications.length} tone="blue" />
        <StatCard icon={CalendarCheck} label="In review" value={counts.find((item) => item.status === "Under Review").count + counts.find((item) => item.status === "Shortlisted").count} tone="orange" />
        <StatCard icon={CircleDollarSign} label="Selected" value={counts.find((item) => item.status === "Selected").count} tone="green" />
      </section>

      <div className="dashboard-main-grid">
        <section className="panel overview-panel">
          <div className="section-heading"><div><h2>Career snapshot</h2></div><Target className="heading-icon" size={21} /></div>
          <div className="overview-highlight"><div className="overview-orb"><Target size={21} /></div><div><span className="muted-label">Top skill match</span><h3>{topCareer?.title || "Explore a career path"}</h3><p>{profile.skills.length ? `Based on ${profile.skills.length} skills in your profile` : "Add skills to see career recommendations"}</p></div><strong className="overview-score">{topCareer?.score || 0}%</strong></div>
          <ProgressBar value={topCareer?.score || 0} label="Skills alignment" />
          <div className="overview-links"><Link to="/guidance">View career recommendations <ArrowRight size={15} /></Link><Link to="/roadmap">Open learning plan <ArrowRight size={15} /></Link></div>
        </section>
        <section className="panel application-chart">
          <div className="section-heading"><div><h2>Application status</h2></div><Link className="quiet-link" to="/jobs">Manage <ArrowRight size={15} /></Link></div>
          <div className="chart-total"><strong>{applications.length}</strong><span>total applications</span></div>
          <div className="bar-chart" role="img" aria-label={counts.map((item) => `${item.status}: ${item.count}`).join(", ")}>
            {counts.map((item) => <div className="chart-column" key={item.status}><div className="chart-bar-area"><span className="chart-bar" style={{ height: `${Math.max(8, item.count / maxCount * 100)}%` }} /><b>{item.count}</b></div><span className="chart-label">{item.status}</span></div>)}
          </div>
        </section>
      </div>

      <div className="dashboard-lower-grid">
        <section className="section-block"><div className="section-heading"><div><h2>Recommended jobs</h2></div><Link className="quiet-link" to="/jobs">Browse all <ArrowRight size={15} /></Link></div>
          <div className="dashboard-job-grid">{recommendations.map(({ job, match }) => <JobCard key={job.id} job={job} match={match} saved={savedJobs.includes(job.id)} onSave={onSaveJob} onDetails={onJobDetails} />)}</div>
        </section>
        <section className="panel skill-progress-panel"><div className="section-heading"><div><h2>Learning plan</h2></div><Link className="icon-button" to="/roadmap" aria-label="Open roadmap"><ArrowRight size={17} /></Link></div>
          <div className="learning-stat"><strong>{progress}%</strong><span>overall complete</span></div><ProgressBar value={progress} />
          <div className="dashboard-phase-progress">{["Beginner", "Intermediate", "Advanced"].map((phaseName) => {
            const phaseTopics = (roadmaps || []).flatMap((roadmap) => roadmap.phases.find((phase) => phase.name === phaseName)?.topics || []);
            const phaseCompleted = phaseTopics.filter((topic) => topic.complete).length;
            return <ProgressBar key={phaseName} label={`${phaseName} topics · ${phaseCompleted}/${phaseTopics.length}`} value={phaseTopics.length ? Math.round(phaseCompleted / phaseTopics.length * 100) : 0} />;
          })}</div>
          <p className="roadmap-summary">{completed} topic{completed === 1 ? "" : "s"} checked off across your learning paths.</p>
          <Link to="/roadmap" className="button button-soft"><Plus size={15} /> Continue learning</Link>
        </section>
      </div>
      <footer className="app-footer">Career recommendations use a rule-based assessment. Job listings are fictional examples for demonstration.</footer>
    </div>
  );
}
