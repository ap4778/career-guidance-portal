import { useState } from "react";
import SkillTagInput from "../components/SkillTagInput.jsx";
import { api } from "../services/api.js";
import "./AccountSettings.css";

export default function AccountSettings({ profile, setProfile, careers, skills, notify }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const update = (key, value) => setProfile({ ...profile, [key]: value });

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordBusy(true);
    try {
      await api("/auth/password", { method: "PATCH", body: { currentPassword, newPassword } });
      setCurrentPassword("");
      setNewPassword("");
      notify("Password changed successfully.");
    } catch (error) {
      setPasswordError(error.message || "Password could not be changed.");
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="page-content account-settings-page">
      <div className="page-header"><div><h1>Profile & settings</h1><p className="page-subtitle">Update your career details and account settings.</p></div><span className="local-badge">Profile completion · {profile.profile_completion || 0}%</span></div>
      <section className="panel settings-panel">
        <div className="section-heading"><div><h2>Career profile</h2><p>Changes save automatically to your account.</p></div></div>
        <div className="settings-grid">
          <label className="field-label">Full name<input value={profile.name || ""} onChange={(event) => update("name", event.target.value)} maxLength="120" /></label>
          <label className="field-label">Email address<input type="email" value={profile.email || ""} onChange={(event) => update("email", event.target.value)} maxLength="254" /></label>
          <label className="field-label">Education level<select value={profile.education || "Bachelor's degree"} onChange={(event) => update("education", event.target.value)}>{["High school", "Associate degree", "Bachelor's degree", "Master's degree", "Doctorate"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Experience level<select value={profile.experience || "Entry"} onChange={(event) => update("experience", event.target.value)}>{["Entry", "Mid", "Senior"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field-label">Preferred career<select value={profile.preferred_career_id || ""} onChange={(event) => update("preferred_career_id", event.target.value || null)}><option value="">Choose a career</option>{careers.map((career) => <option key={career.id} value={career.id}>{career.title}</option>)}</select></label>
          <label className="field-label">Preferred job location<input value={profile.preferred_location || ""} onChange={(event) => update("preferred_location", event.target.value)} maxLength="160" placeholder="City, region, or Remote" /></label>
          <label className="field-label settings-wide">Qualifications<textarea rows="3" value={profile.qualifications || ""} onChange={(event) => update("qualifications", event.target.value)} maxLength="4000" placeholder="Certifications, coursework, or qualifications" /></label>
          <div className="settings-wide"><label className="field-label">Technical skills<SkillTagInput value={profile.skills || []} onChange={(value) => update("skills", value)} suggestions={skills} /></label></div>
          <label className="field-label settings-wide">Career interests<input value={(profile.interests || []).join(", ")} onChange={(event) => update("interests", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} placeholder="Design, research, building products" /><small className="field-hint">Separate interests with commas.</small></label>
        </div>
      </section>
      <section className="panel settings-panel">
        <div className="section-heading"><div><h2>Change password</h2></div></div>
        <form className="password-change-form" onSubmit={changePassword}>
          <label className="field-label">Current password<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required maxLength="128" /></label>
          <label className="field-label">New password<input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength="8" maxLength="128" /></label>
          {passwordError && <p className="account-error settings-wide" role="alert">{passwordError}</p>}
          <button className="button button-primary" disabled={passwordBusy || newPassword.length < 8}>{passwordBusy ? "Updating…" : "Update password"}</button>
        </form>
      </section>
    </div>
  );
}
