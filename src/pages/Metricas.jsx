import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/metricas.css';

function formatWeekLabel(isoDate) {
  const d = new Date(`${isoDate}T00:00:00`);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Tela 06 — Métricas de Engajamento (RF-37 a RF-39, responde à expectativa
// EX-09). Escopo Sprint 03: só dados reais de disparo (dispatch_logs),
// recortáveis por período e por oportunidade. Dúvidas frequentes e taxa de
// resposta dependem do chatbot (Módulo C/D), que chega na Sprint 04 — por
// isso aparecem como "ainda sem dados", como já é o padrão do Dashboard.
export default function Metricas() {
  const [opportunities, setOpportunities] = useState([]);
  const [opportunityId, setOpportunityId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/opportunities')
      .then(({ data }) => setOpportunities(data.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const params = {};
        if (opportunityId) params.opportunityId = opportunityId;
        if (from) params.from = from;
        if (to) params.to = to;
        const { data } = await api.get('/metrics/overview', { params });
        setData(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar as métricas.');
      } finally {
        setLoading(false);
      }
    })();
  }, [opportunityId, from, to]);

  const maxWeekly = useMemo(() => {
    if (!data?.weeklySeries?.length) return 1;
    return Math.max(1, ...data.weeklySeries.map((w) => w.enviado + w.falha + w.pendente));
  }, [data]);

  return (
    <Layout title="Métricas de engajamento">
      <div className="card met-filters">
        <div className="field">
          <label>Oportunidade</label>
          <select value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
            <option value="">Todas</option>
            {opportunities.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>De</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="field">
          <label>Até</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
      </div>

      {loading && <p className="opp-hint">Carregando…</p>}
      {error && <p className="field error">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="met-kpis">
            <div className="card met-kpi">
              <strong>{data.dispatch.totalNotifications}</strong>
              <span>Notificações enviadas</span>
              <small>RF-37</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.contactsReached}</strong>
              <span>Contatos alcançados</span>
              <small>RF-37</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.deliveryRate}%</strong>
              <span>Taxa de entrega</span>
              <small>RF-37</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.failed}</strong>
              <span>Falhas de entrega</span>
              <small>RF-37</small>
            </div>
          </div>

          <div className="card met-chart-card">
            <h3>Envios por semana</h3>
            <p className="opp-hint">
              RF-38 · status de entrega consolidado — respostas chegam com o chatbot na Sprint 04
            </p>
            {data.weeklySeries.length === 0 ? (
              <p className="opp-hint">Nenhum disparo no período selecionado.</p>
            ) : (
              <div className="met-chart">
                {data.weeklySeries.map((w) => (
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

          <div className="card">
            <h3>Dúvidas mais frequentes</h3>
            <p className="opp-hint">RF-39 · identificadas pelo chatbot</p>
            <p className="opp-hint">Ainda sem dados — chega com o Módulo C (chatbot) na Sprint 04.</p>
          </div>
        </>
      )}
    </Layout>
  );
}
