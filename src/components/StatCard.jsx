// KPI da Tela 06 (RF-37/RF-38). `highlight` destaca o indicador principal.
export default function StatCard({ value, label, tag, highlight = false }) {
  return (
    <div className={`card met-kpi${highlight ? ' met-kpi-highlight' : ''}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {tag && <small>{tag}</small>}
    </div>
  );
}
