import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/dashboard.css';

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

// Agrupa o log de envio (por contato) em uma linha por oportunidade, para
// a tabela "Últimos disparos" — mesma ideia da Tela 05, mas cruzando todas
// as oportunidades em vez de uma só.
function groupDispatchLogsByOpportunity(items) {
  const byOpportunity = new Map();

  for (const log of items) {
    const key = log.opportunity.id;
    if (!byOpportunity.has(key)) {
      byOpportunity.set(key, {
        title: log.opportunity.title,
        sent: 0,
        delivered: 0,
        failed: 0,
        lastAt: log.createdAt,
      });
    }
    const group = byOpportunity.get(key);
    group.sent += 1;
    if (log.status === 'enviado') group.delivered += 1;
    if (log.status === 'falha') group.failed += 1;
    if (new Date(log.createdAt) > new Date(group.lastAt)) group.lastAt = log.createdAt;
  }

  return Array.from(byOpportunity.values())
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt))
    .slice(0, 5);
}

// Dashboard com dados reais (RF-12, RF-13, RF-17, RF-19) — sem nenhum
// número fixo: enquanto o sistema não tiver disparos, interações ou uma
// sincronização, os cards aparecem zerados ou com uma mensagem de "ainda
// sem dados", nunca com um valor inventado.
export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [schoolSummary, setSchoolSummary] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [dispatchGroups, setDispatchGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [metricsRes, summaryRes, syncRes, logsRes] = await Promise.all([
          api.get('/metrics/overview'),
          api.get('/students/summary'),
          api.get('/students/sync-status'),
          api.get('/metrics/dispatch-logs'),
        ]);
        setMetrics(metricsRes.data);
        setSchoolSummary(summaryRes.data);
        setSyncStatus(syncRes.data);
        setDispatchGroups(groupDispatchLogsByOpportunity(logsRes.data.items));
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <p className="opp-hint">Carregando…</p>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Dashboard">
        <p className="field error">{error}</p>
      </Layout>
    );
  }

  const kpis = [
    { value: metrics.dispatch.totalNotifications, label: 'Notificações enviadas', ref: 'RF-12' },
    { value: metrics.dispatch.contactsReached, label: 'Contatos alcançados', ref: 'RF-12' },
    { value: `${metrics.dispatch.deliveryRate}%`, label: 'Taxa de entrega', ref: 'RF-12' },
    { value: metrics.chatbot.totalInteractions, label: 'Interações no FAQ', ref: 'RF-13' },
  ];

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
          <h3>Oportunidades com maior engajamento</h3>
          <p className="dash-hint">RF-13 · perguntas recebidas ÷ contatos que a receberam</p>
          {metrics.chatbot.topEngagementOpportunities.length === 0 ? (
            <p className="opp-hint">Ainda não há disparos com interação suficiente para ranquear.</p>
          ) : (
            <div className="dash-bars">
              {metrics.chatbot.topEngagementOpportunities.map((item) => (
                <div className="dash-bar-row" key={item.id}>
                  <span className="dash-bar-label">{item.title}</span>
                  <div className="dash-bar-track">
                    <div className="dash-bar-fill" style={{ width: `${item.engagementRate}%` }} />
                  </div>
                  <span className="dash-bar-pct">{item.engagementRate}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3>Painel escolar</h3>
          <p className="dash-hint">RF-18 e RF-19 · dados lidos da planilha da escola</p>
          <div className="dash-school-kpis">
            <div>
              <strong>{schoolSummary.averageAttendance}%</strong>
              <span>Frequência média</span>
            </div>
            <div>
              <strong>{schoolSummary.regularRate}%</strong>
              <span>Desempenho geral</span>
            </div>
          </div>
          {syncStatus.lastSuccessfulSyncAt ? (
            <div className="dash-sync-banner">
              <span className="dot" style={{ background: 'var(--g600)' }} />
              Sincronizado em {formatDateTime(syncStatus.lastSuccessfulSyncAt)} · RF-17
            </div>
          ) : (
            <div className="dash-sync-banner" style={{ background: 'var(--alt)', color: 'var(--t600)' }}>
              <span className="dot" style={{ background: 'var(--t400)' }} />
              Ainda sem sincronização bem-sucedida · RF-17
            </div>
          )}
          <p className="dash-school-count">{schoolSummary.totalStudents} aluno(s) na base sincronizada</p>
          <p className="dash-hint">Somente leitura — a planilha da escola permanece a única fonte de escrita.</p>
        </div>
      </div>

      <div className="card">
        <h3>Últimos disparos</h3>
        <p className="dash-hint">RF-06 · log de envio com status de entrega</p>
        {dispatchGroups.length === 0 ? (
          <p className="opp-hint">Nenhum disparo realizado ainda.</p>
        ) : (
          <div className="table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Oportunidade</th>
                  <th>Enviados</th>
                  <th>Entregues</th>
                  <th>Falhas</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {dispatchGroups.map((row) => (
                  <tr key={row.title}>
                    <td>{row.title}</td>
                    <td>{row.sent}</td>
                    <td>{row.delivered}</td>
                    <td>{row.failed}</td>
                    <td>{formatDateTime(row.lastAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
