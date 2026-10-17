import "./StatCard.css";

export default function StatCard({ icon: Icon, label, value, tone = "violet", note }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} aria-hidden="true" /></div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>
    </article>
  );
}
