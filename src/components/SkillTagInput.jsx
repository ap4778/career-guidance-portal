import { useState } from "react";
import { Plus, X } from "lucide-react";
import "./SkillTagInput.css";

export default function SkillTagInput({ value = [], onChange, suggestions = [] }) {
  const [entry, setEntry] = useState("");
  const addSkill = (skill) => {
    const cleaned = skill.trim();
    if (cleaned && !value.some((item) => item.toLowerCase() === cleaned.toLowerCase())) onChange([...value, cleaned]);
    setEntry("");
  };
  const available = suggestions.filter((skill) => !value.some((item) => item.toLowerCase() === skill.toLowerCase()));
  return (
    <div>
      <div className="tag-input-box">
        {value.map((skill) => <span className="skill-tag" key={skill}>{skill}<button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(value.filter((item) => item !== skill))}><X size={13} /></button></span>)}
        <div className="tag-entry" onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSkill(entry); } }}>
          <input aria-label="Add a skill" value={entry} onChange={(event) => setEntry(event.target.value)} placeholder="Type a skill and press Enter" />
          <button className="icon-button" type="button" aria-label="Add skill" onClick={() => addSkill(entry)}><Plus size={17} /></button>
        </div>
      </div>
      <div className="suggestion-list" aria-label="Suggested skills">{available.slice(0, 9).map((skill) => <button type="button" key={skill} onClick={() => addSkill(skill)}>{skill}<Plus size={12} /></button>)}</div>
    </div>
  );
}
