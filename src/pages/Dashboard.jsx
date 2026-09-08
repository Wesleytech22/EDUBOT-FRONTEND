import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/dashboard.css';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Dashboard com dados reais do módulo de Oportunidades (RF-01 a RF-03,
// já concluído). Métricas de envio por contato, engajamento no FAQ e o
// Painel Escolar dependem dos módulos B/C (WhatsApp/N8N) e F/H (Google
// Sheets), ainda não implementados — por isso aparecem como "ainda sem
// dados", em vez de números fictícios.
export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/opportunities');
        setItems(data.items);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o dashboard.');
      }
    })();
  }, []);

  if (error) {
    return (
      <Layout title="Dashboard">
        <p className="field error">{error}</p>
      </Layout>
    );
  }

  if (!items) {
    return (
      <Layout title="Dashboard">
        <p className="opp-hint">Carregando…</p>
      </Layout>
    );
  }

  const dispatched = items.filter((o) => o.dispatchedAt);
  const kpis = [
    { value: items.length, label: 'Oportunidades cadastradas', ref: 'RF-01' },
    { value: items.filter((o) => o.status === 'Ativa').length, label: 'Ativas', ref: 'RF-03' },
    { value: dispatched.length, label: 'Disparadas', ref: 'RF-05' },
    { value: items.filter((o) => o.isDraft).length, label: 'Rascunhos', ref: 'RF-01' },
  ];

  const byAudience = new Map();
  for (const o of items) {
    byAudience.set(o.targetAudience, (byAudience.get(o.targetAudience) || 0) + 1);
  }
  const audienceBreakdown = [...byAudience.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxAudienceCount = Math.max(1, ...audienceBreakdown.map(([, count]) => count));

  const lastDispatches = [...dispatched]
    .sort((a, b) => new Date(b.dispatchedAt) - new Date(a.dispatchedAt))
    .slice(0, 5);

  return (
    <Layout title="Dashboard">
      <div className="dash-kpis">
        {kpis.map((kpi) => (
          <div className="card dash-kpi" key={kpi.label}>
            <strong>{kpi.value}</strong>
            <span>{kpi.label}</span>
            <small>{kpi.ref}</small>
          </div>
        ))}
      </div>

      <div className="dash-mid">
        <div className="card">
          <h3>Oportunidades por público-alvo</h3>
          <p className="dash-hint">RF-03 · distribuição das oportunidades cadastradas</p>
          {audienceBreakdown.length === 0 ? (
            <p className="opp-hint">Nenhuma oportunidade cadastrada ainda.</p>
          ) : (
            <div className="dash-bars">
              {audienceBreakdown.map(([audience, count]) => (
                <div className="dash-bar-row" key={audience}>
                  <span className="dash-bar-label">{audience}</span>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${(count / maxAudienceCount) * 100}%` }} />
                  </div>
                  <span className="dash-bar-pct">{count}</span>
                </div>
              ))}
            </div>
          )}
          <p className="dash-hint">Engajamento por interação no FAQ chega com o módulo de chatbot (Sprint 04).</p>
        </div>

        <div className="card">
          <h3>Painel escolar</h3>
          <p className="dash-hint">RF-18 e RF-19 · dados lidos do Google Sheets</p>
          <p className="opp-hint">Ainda sem dados — a integração com o Google Sheets chega na Sprint 05/06.</p>
        </div>
      </div>

      <div className="card">
        <h3>Últimos disparos</h3>
        <p className="dash-hint">RF-05 · oportunidades disparadas, mais recentes primeiro</p>
        {lastDispatches.length === 0 ? (
          <p className="opp-hint">Nenhuma oportunidade disparada ainda.</p>
        ) : (
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Oportunidade</th>
                  <th>Público-alvo</th>
                  <th>Data do disparo</th>
                </tr>
              </thead>
              <tbody>
                {lastDispatches.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title}</td>
                    <td>{row.targetAudience}</td>
                    <td>{formatDateTime(row.dispatchedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="dash-hint">Status de entrega por contato chega com o módulo de WhatsApp (Sprint 03).</p>
      </div>
    </Layout>
  );
}
