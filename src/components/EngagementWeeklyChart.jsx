import { useMemo } from 'react';

function formatWeekLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// RF-37/RF-38 — "Envios e respostas por semana": status de entrega
// consolidado de cada semana e as respostas recebidas pelo chatbot.
export default function EngagementWeeklyChart({ weeklySeries }) {
  const maxWeekly = useMemo(() => {
    if (!weeklySeries?.length) return 1;
    return Math.max(1, ...weeklySeries.map((w) => Math.max(w.enviado, w.falha, w.pendente, w.respostas || 0)));
  }, [weeklySeries]);

  return (
    <div className="card">
      <h3>Envios e respostas por semana</h3>
      <p className="opp-hint">RF-37 e RF-38 · envios agregados e respostas recebidas no período</p>
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
                <div
                  className="met-chart-bar met-chart-bar-reply"
                  style={{ height: `${((w.respostas || 0) / maxWeekly) * 100}%` }}
                  title={`${w.respostas || 0} respostas`}
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
        <span><i className="met-dot met-dot-reply" /> Respostas</span>
      </div>
    </div>
  );
}
