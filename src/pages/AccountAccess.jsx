import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import "./AccountAccess.css";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validate = {
  name: (value) => value.trim() ? "" : "Please enter your name.",
  email: (value) => emailPattern.test(value.trim()) ? "" : "Enter a valid email address.",
  password: (value) => value.length >= 8 ? "" : "Password must be at least 8 characters.",
};

export default function AccountAccess({ onLogin, onRegister, notify, dark, onThemeToggle, connectionError = "" }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const changeMode = (nextMode) => {
    setMode(nextMode);
    setErrors({});
    setSubmitError("");
  };

  const touchField = (field, value) => {
    setErrors((current) => ({ ...current, [field]: validate[field](value) }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = { email: validate.email(email), password: validate.password(password) };
    if (mode === "register") nextErrors.name = validate.name(name);
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    setSubmitError("");
    setBusy(true);
    try {
      // Keep the form visible briefly so the loading state is clear in a demo.
      await new Promise((resolve) => window.setTimeout(resolve, 800));
      if (mode === "register") {
        await onRegister({ name: name.trim(), email: email.trim().toLowerCase(), password });
        notify(`Account created. Welcome, ${name.trim()}!`);
      } else {
        await onLogin({ email: email.trim().toLowerCase(), password });
        notify("Signed in successfully.");
      }
    } catch (error) {
      setSubmitError(error.message || "We couldn't complete that request. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const nameError = errors.name;
  const emailError = errors.email;
  const passwordError = errors.password;
  const strength = password.length === 0 ? null
    : password.length < 8 ? "Weak"
      : password.length >= 12 && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password) ? "Strong" : "Fair";

  return (
    <main className="account-page">
      <section className="account-brand-panel">
        <a className="account-brand" href="/">CareerPath</a>
        <div className="account-pitch">
          <h1>Career planning, in one place.</h1>
          <p>Explore career options, keep track of applications and plan the skills you want to build.</p>
        </div>
        <p className="account-brand-footer">CareerPath · Career guidance and job search</p>
      </section>
      <section className="account-form-side">
        <div className="account-form-card">
          <div className="account-mobile-brand">CareerPath</div>
          <h2>{mode === "login" ? "Sign in" : "Create an account"}</h2>
          <p className="account-form-intro">{mode === "login" ? "Access your career plans and applications." : "Set up an account to save your progress."}</p>
          <div className="account-mode-tabs" role="tablist" aria-label="Choose an account action">
            <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => changeMode("login")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => changeMode("register")}>Create account</button>
          </div>
          <form className="account-form" onSubmit={submit} noValidate>
            {mode === "register" && <label className="account-field">
              <span>Your name</span>
              <span className={`account-input-wrap ${nameError ? "has-error" : ""}`}><input id="account-name" autoComplete="name" value={name} onChange={(event) => { setName(event.target.value); setSubmitError(""); }} onBlur={() => touchField("name", name)} placeholder="e.g. Alex Morgan" required aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "name-error" : undefined} /></span>
              {nameError && <small className="field-error" id="name-error" aria-live="polite">{nameError}</small>}
            </label>}
            <label className="account-field">
              <span>Email address</span>
              <span className={`account-input-wrap ${emailError ? "has-error" : ""}`}><input id="account-email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setSubmitError(""); }} onBlur={() => touchField("email", email)} placeholder="you@example.com" required aria-invalid={Boolean(emailError)} aria-describedby={emailError ? "email-error" : undefined} /></span>
              {emailError && <small className="field-error" id="email-error" aria-live="polite">{emailError}</small>}
            </label>
            <label className="account-field">
              <span>Password</span>
              <span className={`account-input-wrap ${passwordError ? "has-error" : ""}`}><input id="account-password" type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => { setPassword(event.target.value); setSubmitError(""); }} onBlur={() => touchField("password", password)} placeholder={mode === "register" ? "At least 8 characters" : "Enter your password"} required minLength="8" aria-invalid={Boolean(passwordError)} aria-describedby={[passwordError && "password-error", strength && "password-strength"].filter(Boolean).join(" ") || undefined} /><button type="button" className="password-visibility" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword ? "Hide" : "Show"}</button></span>
              {passwordError && <small className="field-error" id="password-error" aria-live="polite">{passwordError}</small>}
              {mode === "register" && strength && <span className={`password-strength strength-${strength.toLowerCase()}`} id="password-strength"><span className="strength-meter"><i /><i /><i /></span><span>Password strength: <b>{strength}</b></span></span>}
            </label>
            <div className="auth-live-message" aria-live="polite" aria-atomic="true">
              {submitError && <p className="account-error" role="alert">{submitError}</p>}
              {connectionError && <p className="account-error" role="alert">{connectionError}</p>}
            </div>
            <button className="button button-primary account-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle className="spin" size={16} /> Please wait…</> : mode === "login" ? "Sign in" : "Create account"}</button>
          </form>
        </div>
        <div className="account-form-footer"><button type="button" className="auth-theme-toggle" onClick={onThemeToggle}>{dark ? "Use light appearance" : "Use dark appearance"}</button><p>CareerPath · Career guidance and job search</p></div>
      </section>
    </main>
  );
}
