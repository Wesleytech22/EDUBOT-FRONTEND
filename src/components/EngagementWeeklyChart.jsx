import { useMemo } from 'react';

function formatWeekLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// RF-37/RF-38 — "Envios por semana", com o status de entrega consolidado de
// cada semana. Respostas recebidas entram aqui quando o chatbot (Sprint 04)
// passar a registrá-las.
export default function EngagementWeeklyChart({ weeklySeries }) {
  const maxWeekly = useMemo(() => {
    if (!weeklySeries?.length) return 1;
    return Math.max(1, ...weeklySeries.map((w) => w.enviado + w.falha + w.pendente));
  }, [weeklySeries]);

  return (
    <div className="card">
      <h3>Envios por semana</h3>
      <p className="opp-hint">RF-37 e RF-38 · envios agregados — respostas chegam com o chatbot na Sprint 04</p>
      {weeklySeries.length === 0 ? (
        <p className="opp-hint">Nenhum disparo no período selecionado.</p>
      ) : (
        <div className="met-chart">
          {weeklySeries.map((w) => (
            <div className="met-chart-col" key={w.week}>
              <div className="met-chart-bars">
                <div
                  className="met-chart-bar met-chart-bar-ok"
                  style={{ height: `${(w.enviado / maxWeekly) * 100}%` }}
                  title={`${w.enviado} entregues`}
                />
                <div
                  className="met-chart-bar met-chart-bar-fail"
                  style={{ height: `${(w.falha / maxWeekly) * 100}%` }}
                  title={`${w.falha} falhas`}
                />
                <div
                  className="met-chart-bar met-chart-bar-pending"
                  style={{ height: `${(w.pendente / maxWeekly) * 100}%` }}
                  title={`${w.pendente} pendentes`}
                />
              </div>
              <span className="met-chart-label">{formatWeekLabel(w.week)}</span>
            </div>
          ))}
        </div>
      )}
      <div className="met-chart-legend">
        <span><i className="met-dot met-dot-ok" /> Entregues</span>
        <span><i className="met-dot met-dot-fail" /> Falhas</span>
        <span><i className="met-dot met-dot-pending" /> Pendentes</span>
      </div>
    </div>
  );
}
