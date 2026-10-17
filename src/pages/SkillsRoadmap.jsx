import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, ExternalLink } from "lucide-react";
import ProgressBar from "../components/ProgressBar.jsx";
import { getSkillGaps } from "../utils/skillGap.js";
import "./SkillsRoadmap.css";

export default function SkillsRoadmap({ profile, roadmaps, careers, onToggleStep }) {
  const [selectedId, setSelectedId] = useState(roadmaps[0]?.id || "");
  const [openPhases, setOpenPhases] = useState({ Beginner: true, Intermediate: true, Advanced: true });
  const roadmap = roadmaps.find((item) => item.id === selectedId) || roadmaps[0];
  const career = careers.find((item) => item.id === roadmap?.careerId);
  const gaps = useMemo(() => career ? getSkillGaps(career, profile.skills) : [], [career, profile.skills]);
  if (!roadmap) {
    return <div className="page-content roadmap-page"><div className="page-header"><div><h1>Skills & learning roadmap</h1><p className="page-subtitle">No learning roadmaps have been configured yet.</p></div></div></div>;
  }
  const topics = roadmap.phases.flatMap((phase) => phase.topics);
  const completed = topics.filter((topic) => topic.complete).length;
  const percent = topics.length ? Math.round(completed / topics.length * 100) : 0;
  return (
    <div className="page-content roadmap-page">
      <div className="page-header"><div><h1>Skills & learning roadmap</h1><p className="page-subtitle">Learning plan for {roadmap.career}.</p></div><div className="roadmap-select-wrap"><label htmlFor="roadmap-career">Target career</label><select id="roadmap-career" value={roadmap.id} onChange={(event) => setSelectedId(event.target.value)}>{roadmaps.map((item) => <option key={item.id} value={item.id}>{item.career}</option>)}</select><ChevronDown className="select-chevron" size={15} /></div></div>
      <div className="roadmap-overview-grid">
        <section className="panel roadmap-progress-card"><div className="roadmap-progress-main"><div className="roadmap-ring" style={{ "--progress": `${percent}%` }}><div><strong>{percent}%</strong><span>complete</span></div></div><div><h2>{roadmap.career}</h2><p>{completed} of {topics.length} topics completed</p></div></div><ProgressBar value={percent} /><div className="roadmap-encouragement"><span>Progress is saved to your account.</span></div></section>
        <section className="panel gap-card"><div className="section-heading"><div><h2>Skills to focus on</h2></div></div>
          {!gaps.length ? <p className="gap-empty">Great job — you already have the listed skills for this path!</p> : <div className="gap-list">{gaps.slice(0, 5).map((gap) => <div className="gap-item" key={gap.name}><span className="gap-indicator" /><strong>{gap.name}</strong><span className={`priority-badge priority-${gap.priority.toLowerCase()}`}>{gap.priority} priority</span></div>)}</div>}
          <p className="gap-footnote">Compared against your saved profile skills.</p>
        </section>
      </div>
      <section className="roadmap-phases"><div className="section-heading"><div><h2>Learning phases</h2></div><span className="roadmap-duration">About 4–6 months</span></div>
        {roadmap.phases.map((phase, phaseIndex) => {
          const phaseDone = phase.topics.filter((topic) => topic.complete).length;
          const isOpen = openPhases[phase.name];
          return <article className={`panel phase-card ${phaseIndex === 0 ? "phase-current" : ""}`} key={phase.name}>
            <button className="phase-header" aria-expanded={isOpen} onClick={() => setOpenPhases({ ...openPhases, [phase.name]: !isOpen })}><span className="phase-number">{phaseIndex + 1}</span><span className="phase-heading-copy"><strong>{phase.name}</strong><small>{phase.duration} · {phaseDone}/{phase.topics.length} topics</small></span><span className="phase-progress"><ProgressBar value={Math.round(phaseDone / phase.topics.length * 100)} /><ChevronDown className={isOpen ? "chevron-open" : ""} size={18} /></span></button>
            {isOpen && <div className="phase-topics">{phase.topics.map((topic) => <label className={`topic-item ${topic.complete ? "topic-done" : ""}`} key={topic.id}><input type="checkbox" checked={Boolean(topic.complete)} onChange={() => onToggleStep(roadmap, topic)} /><span className="topic-check"><CheckCircle2 size={17} /></span><span className="topic-copy"><strong>{topic.title}</strong><small><span>{topic.duration}</span><span>{topic.description || "Use a current learning resource"}</span></small></span>{topic.resource && <a href={topic.resource} target="_blank" rel="noreferrer" className="resource-link" aria-label={`Open learning resource for ${topic.title}`}><ExternalLink size={15} /></a>}</label>)}</div>}
          </article>;
        })}
      </section>
      <p className="roadmap-disclaimer">Resource suggestions are examples; links open general free-learning sites. Choose resources relevant to your selected career.</p>
    </div>
  );
}
