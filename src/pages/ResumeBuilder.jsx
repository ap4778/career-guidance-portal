import { useState } from "react";
import { Plus, Printer, Trash2 } from "lucide-react";
import SkillTagInput from "../components/SkillTagInput.jsx";
import ResumePreview from "../components/ResumePreview.jsx";
import "./ResumeBuilder.css";

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const blankResume = { name: "", email: "", phone: "", location: "", website: "", summary: "", education: [{ id: makeId(), school: "", degree: "", year: "" }], skills: [], projects: [{ id: makeId(), name: "", description: "" }], experience: "" };

export default function ResumeBuilder({ resume, resumes, activeResumeId, skills, setResume, onSelectResume, onCreateResume, onDeleteResume, notify }) {
  const [theme, setTheme] = useState("classic");
  const update = (key, value) => setResume({ ...resume, [key]: value });
  const updateList = (key, id, field, value) => update(key, resume[key].map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addItem = (key, item) => update(key, [...resume[key], { id: makeId(), ...item }]);
  const removeItem = (key, id) => update(key, resume[key].filter((item) => item.id !== id));
  const printResume = () => { notify("Opening the print dialog. Choose “Save as PDF” to download your resume."); window.print(); };
  return (
    <div className="page-content resume-builder-page">
      <div className="page-header"><div><h1>Resume builder</h1><p className="page-subtitle">Create and update your resume.</p></div><div className="resume-actions"><label className="theme-picker"><span className="sr-only">Choose resume</span><select value={activeResumeId || ""} onChange={(event) => onSelectResume(event.target.value)}>{resumes.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label><button className="button button-soft" onClick={onCreateResume}><Plus size={15} /> New resume</button><button className="button button-soft" onClick={onDeleteResume} disabled={resumes.length < 2}><Trash2 size={15} /> Delete</button><button className="button button-primary print-button" onClick={printResume}><Printer size={16} /> Print / Save as PDF</button></div></div>
      <div className="resume-layout">
        <form className="panel resume-form" onSubmit={(event) => event.preventDefault()}>
          <section className="resume-form-section"><h2>Personal details</h2><div className="resume-fields"><label className="field-label">Full name<input value={resume.name} onChange={(event) => update("name", event.target.value)} placeholder="e.g. Jordan Lee" /></label><label className="field-label">Email<input type="email" value={resume.email} onChange={(event) => update("email", event.target.value)} placeholder="jordan@email.com" /></label><label className="field-label">Phone<input type="tel" value={resume.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+1 555 0100" /></label><label className="field-label">Location<input value={resume.location} onChange={(event) => update("location", event.target.value)} placeholder="City, Country" /></label><label className="field-label full-field">Website / LinkedIn<input type="url" value={resume.website} onChange={(event) => update("website", event.target.value)} placeholder="https://…" /></label></div></section>
          <section className="resume-form-section"><h2>Professional summary</h2><label className="field-label"><span className="sr-only">Summary</span><textarea rows="4" maxLength="500" value={resume.summary} onChange={(event) => update("summary", event.target.value)} placeholder="Write 2–3 sentences about what you do well and where you’re heading." /><small className="field-hint">{resume.summary.length}/500 characters</small></label></section>
          <section className="resume-form-section"><div className="form-section-heading"><h2>Education</h2><button type="button" className="text-button" onClick={() => addItem("education", { school: "", degree: "", year: "" })}><Plus size={15} /> Add education</button></div>
            {resume.education.map((item) => <div className="repeat-entry" key={item.id}><label className="field-label">School<input value={item.school} onChange={(event) => updateList("education", item.id, "school", event.target.value)} placeholder="College or university" /></label><label className="field-label">Degree<input value={item.degree} onChange={(event) => updateList("education", item.id, "degree", event.target.value)} placeholder="Degree or qualification" /></label><label className="field-label">Year<input value={item.year} onChange={(event) => updateList("education", item.id, "year", event.target.value)} placeholder="2024" /></label>{resume.education.length > 1 && <button type="button" className="icon-button remove-entry" onClick={() => removeItem("education", item.id)} aria-label="Remove education"><Trash2 size={15} /></button>}</div>)}
          </section>
          <section className="resume-form-section"><h2>Skills</h2><SkillTagInput value={resume.skills} onChange={(value) => update("skills", value)} suggestions={skills} /></section>
          <section className="resume-form-section"><div className="form-section-heading"><h2>Projects</h2><button type="button" className="text-button" onClick={() => addItem("projects", { name: "", description: "" })}><Plus size={15} /> Add project</button></div>
            {resume.projects.map((item) => <div className="repeat-entry project-entry" key={item.id}><label className="field-label">Project name<input value={item.name} onChange={(event) => updateList("projects", item.id, "name", event.target.value)} placeholder="Project title" /></label><label className="field-label full-field">What did you build?<textarea rows="2" value={item.description} onChange={(event) => updateList("projects", item.id, "description", event.target.value)} placeholder="Describe your role and the impact." /></label>{resume.projects.length > 1 && <button type="button" className="icon-button remove-entry" onClick={() => removeItem("projects", item.id)} aria-label="Remove project"><Trash2 size={15} /></button>}</div>)}
          </section>
          <section className="resume-form-section"><h2>Experience <span className="optional-label">Optional</span></h2><label className="field-label"><span className="sr-only">Experience</span><textarea rows="4" value={resume.experience} onChange={(event) => update("experience", event.target.value)} placeholder="Role, organization, dates and impact. Keep each achievement on a new line." /></label></section>
          <p className="autosave-note">✓ Your changes save automatically to your account.</p>
        </form>
        <aside className="resume-preview-column"><div className="preview-toolbar"><span><span className="preview-dot" /> Live preview</span><label className="theme-picker"><span className="sr-only">Resume template</span><select value={theme} onChange={(event) => setTheme(event.target.value)}><option value="classic">Classic template</option><option value="modern">Modern template</option></select></label></div><ResumePreview data={resume} theme={theme} /></aside>
      </div>
    </div>
  );
}
