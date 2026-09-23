// Linha do card "Status de entrega" (RF-37): quantidade, percentual e barra.
export default function DeliveryStatusItem({ label, count, total, modifier }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="met-status-item">
      <div className="met-status-top">
        <span>{label}</span>
        <strong>
          {count.toLocaleString('pt-BR')} <small>· {percent}%</small>
        </strong>
      </div>
      <div className="met-status-track">
        <div className={`met-status-fill met-status-fill-${modifier}`} style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
