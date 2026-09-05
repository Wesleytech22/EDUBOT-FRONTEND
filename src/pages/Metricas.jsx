import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/metricas.css';

// Tela 06 — Métricas de Engajamento (RF-12, RF-13): responde à expectativa
// EX-09 da coordenação. Diferente do Dashboard (Sprint 02, dados mock),
// tudo aqui vem de GET /api/metrics/overview, calculado a partir dos
// disparos e interações reais registrados desde a Sprint 03/04.
export default function Metricas() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/metrics/overview');
        setData(data);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar as métricas.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Layout title="Métricas">
      {loading && <p className="opp-hint">Carregando…</p>}
      {error && <p className="field error">{error}</p>}

      {data && (
        <>
          <div className="met-kpis">
            <div className="card met-kpi">
              <strong>{data.dispatch.totalNotifications}</strong>
              <span>Notificações enviadas</span>
              <small>RF-12</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.contactsReached}</strong>
              <span>Contatos alcançados</span>
              <small>RF-12</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.deliveryRate}%</strong>
              <span>Taxa de entrega</span>
              <small>RF-12</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.chatbot.totalInteractions}</strong>
              <span>Interações no FAQ</span>
              <small>RF-13</small>
            </div>
          </div>

          <div className="met-kpis">
            <div className="card met-kpi">
              <strong>{data.chatbot.automationRate}%</strong>
              <span>Taxa de automação</span>
              <small>Dúvidas resolvidas sem atendente ÷ total</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.chatbot.responseRate}%</strong>
              <span>Taxa de resposta</span>
              <small>Contatos que interagiram ÷ contatos alcançados</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.dispatch.failed}</strong>
              <span>Falhas de entrega</span>
              <small>RF-12</small>
            </div>
            <div className="card met-kpi">
              <strong>{data.chatbot.escalated}</strong>
              <span>Encaminhadas a atendente</span>
              <small>RF-09</small>
            </div>
          </div>

          <div className="met-mid">
            <div className="card">
              <h3>Oportunidades com maior engajamento</h3>
              <p className="opp-hint">RF-13 · perguntas recebidas ÷ contatos que a receberam</p>
              {data.chatbot.topEngagementOpportunities.length === 0 ? (
                <p className="opp-hint">Ainda não há disparos com interação suficiente para ranquear.</p>
              ) : (
                <div className="met-bars">
                  {data.chatbot.topEngagementOpportunities.map((item) => (
                    <div className="met-bar-row" key={item.id}>
                      <span className="met-bar-label">{item.title}</span>
                      <div className="met-bar-track">
                        <div className="met-bar-fill" style={{ width: `${item.engagementRate}%` }} />
                      </div>
                      <span className="met-bar-pct">{item.engagementRate}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3>Dúvidas mais frequentes</h3>
              <p className="opp-hint">RF-13 · identificadas pelo chatbot</p>
              {data.chatbot.topFrequentQuestions.length === 0 ? (
                <p className="opp-hint">Nenhuma dúvida registrada ainda.</p>
              ) : (
                <ol className="met-questions">
                  {data.chatbot.topFrequentQuestions.map((q) => (
                    <li key={q.message}>
                      <span>{q.message}</span>
                      <span className="badge" style={{ background: 'var(--b100)', color: 'var(--b700)' }}>
                        {q.count}×
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
