import { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout.jsx';
import StatCard from '../components/StatCard.jsx';
import EngagementWeeklyChart from '../components/EngagementWeeklyChart.jsx';
import DeliveryStatusItem from '../components/DeliveryStatusItem.jsx';
import api from '../services/api.js';
import '../styles/metricas.css';

const PERIOD_OPTIONS = [
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: 'mes', label: 'Este mês' },
  { value: 'tudo', label: 'Todo o período' },
  { value: 'custom', label: 'Personalizado' },
];

function toIsoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Converte a opção de período em intervalo [from, to] (datas inclusivas).
function resolvePeriod(period, customFrom, customTo) {
  const today = new Date();
  if (period === '7d' || period === '30d') {
    const start = new Date(today);
    start.setDate(today.getDate() - (period === '7d' ? 6 : 29));
    return { from: toIsoDate(start), to: toIsoDate(today) };
  }
  if (period === 'mes') {
    return { from: toIsoDate(new Date(today.getFullYear(), today.getMonth(), 1)), to: toIsoDate(today) };
  }
  if (period === 'custom') return { from: customFrom, to: customTo };
  return { from: '', to: '' };
}

function formatDate(isoDate) {
  if (!isoDate) return '';
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('pt-BR');
}

// Tela 06 — Métricas de Engajamento (RF-37 a RF-39, responde à expectativa
// EX-09). Envios vêm dos dispatch_logs; respostas, dúvidas frequentes e
// engajamento por oportunidade vêm das mensagens que o chatbot registrou
// (Sprint 04). Tudo recortável por período e por oportunidade.
export default function Metricas() {
  const [opportunities, setOpportunities] = useState([]);
  const [opportunityId, setOpportunityId] = useState('');
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { from, to } = useMemo(
    () => resolvePeriod(period, customFrom, customTo),
    [period, customFrom, customTo]
  );

  useEffect(() => {
    api
      .get('/opportunities')
      .then(({ data }) => setOpportunities(data.items.filter((o) => o.dispatchedAt)))
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

  function clearFilters() {
    setOpportunityId('');
    setPeriod('30d');
    setCustomFrom('');
    setCustomTo('');
  }

  const rangeLabel = from || to ? `${formatDate(from) || '…'} — ${formatDate(to) || 'hoje'}` : 'Desde o primeiro disparo';

  return (
    <Layout title="Métricas de engajamento">
      <div className="card met-filters">
        <select className="input met-filter-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
          {PERIOD_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              Período: {p.label}
            </option>
          ))}
        </select>

        {period === 'custom' ? (
          <div className="met-filter-range">
            <input
              className="input"
              type="date"
              aria-label="Data inicial"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <span>até</span>
            <input
              className="input"
              type="date"
              aria-label="Data final"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </div>
        ) : (
          <span className="met-filter-range-label">{rangeLabel}</span>
        )}

        <select
          className="input met-filter-opp"
          value={opportunityId}
          onChange={(e) => setOpportunityId(e.target.value)}
        >
          <option value="">Oportunidade: Todas</option>
          {opportunities.map((o) => (
            <option key={o.id} value={o.id}>
              Oportunidade: {o.title}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn-ghost" onClick={clearFilters}>
          Limpar filtros
        </button>

        <p className="met-filters-note">RF-39 · métricas filtradas por período e por oportunidade</p>
      </div>

      {loading && <p className="opp-hint">Carregando…</p>}
      {error && <p className="field error">{error}</p>}

      {!loading && !error && data && (
        <>
          <div className="met-kpis">
            <StatCard value={data.dispatch.totalNotifications.toLocaleString('pt-BR')} label="Notificações enviadas" tag="RF-37" />
            <StatCard value={data.dispatch.contactsReached.toLocaleString('pt-BR')} label="Contatos alcançados" tag="RF-37" />
            <StatCard value={`${data.dispatch.deliveryRate}%`} label="Taxa de entrega" tag="RF-37" highlight />
            <StatCard value={data.chatbot.responsesReceived.toLocaleString('pt-BR')} label="Respostas recebidas" tag="RF-38" />
          </div>

          <div className="met-row2">
            <EngagementWeeklyChart weeklySeries={data.weeklySeries} />

            <div className="card">
              <h3>Status de entrega</h3>
              <p className="opp-hint">RF-37 · status consolidado dos envios do período</p>
              <DeliveryStatusItem
                label="Entregues"
                count={data.dispatch.delivered}
                total={data.dispatch.totalNotifications}
                modifier="ok"
              />
              <DeliveryStatusItem
                label="Falhas"
                count={data.dispatch.failed}
                total={data.dispatch.totalNotifications}
                modifier="fail"
              />
              <DeliveryStatusItem
                label="Pendentes"
                count={data.dispatch.pending}
                total={data.dispatch.totalNotifications}
                modifier="pending"
              />
              <p className="met-status-note">Somente envios do período filtrado · RF-39</p>
            </div>
          </div>

          <div className="met-row2">
            <div className="card">
              <h3>Dúvidas mais frequentes</h3>
              <p className="opp-hint">RF-38 · intenções identificadas pelo chatbot no período</p>
              {data.chatbot.topQuestions.length === 0 ? (
                <p className="met-empty">Nenhuma dúvida recebida pelo chatbot no período.</p>
              ) : (
                data.chatbot.topQuestions.map((q) => (
                  <div className="met-list-item" key={q.question}>
                    <span className="met-list-name">{q.question}</span>
                    <div className="met-list-track">
                      <div
                        className="met-list-fill"
                        style={{ width: `${(q.count / data.chatbot.topQuestions[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="met-list-num">{q.count}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>Maior engajamento</h3>
              <p className="opp-hint">RF-38 · taxa de resposta por oportunidade</p>
              {data.chatbot.topEngagement.length === 0 ? (
                <p className="met-empty">Nenhuma oportunidade entregue no período.</p>
              ) : (
                data.chatbot.topEngagement.map((e) => (
                  <div className="met-eng-item" key={e.opportunityId}>
                    <span>
                      {e.name}
                      <small>
                        {e.responded} de {e.reached} contato(s) responderam
                      </small>
                    </span>
                    <strong>{e.percent}%</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
