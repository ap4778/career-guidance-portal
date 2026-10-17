import "./ResumePreview.css";

export default function ResumePreview({ data, theme = "classic" }) {
  const fullName = data.name || "Your Name";
  return (
    <article className={`resume-paper resume-${theme}`} id="resume-print-area">
      <header className="resume-heading"><h1>{fullName}</h1><p>{[data.email, data.phone, data.location, data.website].filter(Boolean).join("  ·  ") || "Email · Phone · Location"}</p></header>
      {data.summary && <section><h2>Profile</h2><p>{data.summary}</p></section>}
      {data.education.filter((item) => item.school || item.degree).length > 0 && <section><h2>Education</h2>{data.education.filter((item) => item.school || item.degree).map((item) => <div className="resume-entry" key={item.id}><strong>{item.degree || "Degree"}</strong><span>{item.school}{item.year && ` · ${item.year}`}</span></div>)}</section>}
      {data.skills.length > 0 && <section><h2>Skills</h2><p>{data.skills.join("  ·  ")}</p></section>}
      {data.projects.filter((item) => item.name || item.description).length > 0 && <section><h2>Projects</h2>{data.projects.filter((item) => item.name || item.description).map((item) => <div className="resume-entry" key={item.id}><strong>{item.name || "Project"}</strong><p>{item.description}</p></div>)}</section>}
      {data.experience && <section><h2>Experience</h2><p className="resume-preserve-lines">{data.experience}</p></section>}
    </article>
  );
}
