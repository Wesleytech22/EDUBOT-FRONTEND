export default function StatCard({ value, label, tag, highlight = false }) {
  return (
    <div className="stat-card">
      <div className={`num${highlight ? ' green' : ''}`}>{value}</div>
      <div className="label">{label}</div>
      {tag && <div className="tag">{tag}</div>}
    </div>
  );
}
