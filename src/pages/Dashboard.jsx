import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/dashboard.css';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Dashboard com dados reais do módulo de Oportunidades (RF-01 a RF-03) e do
// status de entrega por contato do broadcast (RF-06, Sprint 03). Engajamento
// no FAQ e o Painel Escolar dependem dos módulos C (chatbot) e F/H (Google
// Sheets), ainda não implementados — por isso aparecem como "ainda sem
// dados", em vez de números fictícios.
export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [deliveryByOpp, setDeliveryByOpp] = useState(new Map());
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [{ data }, { data: logsData }] = await Promise.all([
          api.get('/opportunities'),
          api.get('/metrics/dispatch-logs'),
        ]);
        const delivery = new Map();
        for (const log of logsData.items) {
          const agg = delivery.get(log.opportunity.id) || { enviado: 0, falha: 0, pendente: 0 };
          agg[log.status] += 1;
          delivery.set(log.opportunity.id, agg);
        }
        setDeliveryByOpp(delivery);
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
    { value: items.length, label: 'Oportunidades cadastradas' },
    { value: items.filter((o) => o.status === 'Ativa').length, label: 'Ativas' },
    { value: dispatched.length, label: 'Disparadas' },
    { value: items.filter((o) => o.isDraft).length, label: 'Rascunhos' },
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
          </div>
        ))}
      </div>

      <div className="dash-mid">
        <div className="card">
          <h3>Oportunidades por público-alvo</h3>
          <p className="dash-hint">Distribuição das oportunidades cadastradas</p>
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
          <p className="dash-hint">
            Respostas e dúvidas recebidas pelo chatbot estão em <Link to="/metricas">Métricas</Link>.
          </p>
        </div>

        <div className="card">
          <h3>Painel escolar</h3>
          <p className="dash-hint">Dados lidos do Google Sheets</p>
          <p className="opp-hint">Ainda sem dados — a integração com o Google Sheets chega na Sprint 05/06.</p>
        </div>
      </div>

      <div className="card">
        <h3>Últimos disparos</h3>
        <p className="dash-hint">Oportunidades disparadas, mais recentes primeiro</p>
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
                  <th>Entregues</th>
                  <th>Falhas</th>
                  <th>Pendentes</th>
                </tr>
              </thead>
              <tbody>
                {lastDispatches.map((row) => {
                  const d = deliveryByOpp.get(row.id) || { enviado: 0, falha: 0, pendente: 0 };
                  return (
                    <tr key={row.id}>
                      <td>
                        <Link to={`/oportunidades/${row.id}/disparo`}>{row.title}</Link>
                      </td>
                      <td>{row.targetAudience}</td>
                      <td>{formatDateTime(row.dispatchedAt)}</td>
                      <td>{d.enviado}</td>
                      <td>{d.falha}</td>
                      <td>{d.pendente}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
