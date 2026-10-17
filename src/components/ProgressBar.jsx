import "./ProgressBar.css";

export default function ProgressBar({ value = 0, label, color }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <div className="progress-wrap">
      {label && <div className="progress-label"><span>{label}</span><strong>{safeValue}%</strong></div>}
      <div className="progress-track" role="progressbar" aria-valuenow={safeValue} aria-valuemin="0" aria-valuemax="100">
        <span className="progress-fill" style={{ width: `${safeValue}%`, ...(color ? { background: color } : {}) }} />
      </div>
    </div>
  );
}
