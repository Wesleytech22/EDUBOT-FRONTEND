import { useState } from 'react';
import Sidebar from '../layout/Sidebar'; // já existe (Gabriel Yanes — [Dashboard] Layout Sidebar de navegação)
import PageHeader from '../layout/PageHeader'; // já existe (Gabriel Yanes — [Dashboard] Header com avatar/nome/perfil)
import StatCard from './StatCard';
import EngagementWeeklyChart from './EngagementWeeklyChart'; // escopo do Clayton
import './MetricsEngagementPage.css';

const DEFAULT_DATA = {
  period: { label: 'Últimos 30 dias', range: '01/09/2026 — 30/09/2026' },
  opportunity: 'Todas',
  stats: {
    notificationsSent: 1248,
    contactsReached: 212,
    deliveryRate: 97.4,
    responsesReceived: 386,
  },
  deliveryStatus: { delivered: 1215, failed: 28, pending: 5 },
  faq: [
    { question: 'Como faço a inscrição?', count: 92 },
    { question: 'Qual é o prazo final?', count: 78 },
    { question: 'Quais documentos preciso?', count: 61 },
    { question: 'A bolsa cobre o material?', count: 47 },
  ],
  topEngagement: [
    { name: 'Bolsa Integral ETEC 2027', percent: 92 },
    { name: 'Curso Técnico em Informática', percent: 84 },
    { name: 'Edital PROUNI 2027', percent: 71 },
    { name: 'Curso de Inglês Gratuito', percent: 63 },
  ],
};

export default function MetricsEngagementPage({ data = DEFAULT_DATA }) {
  const [period, setPeriod] = useState(data.period.label);
  const [opportunity, setOpportunity] = useState(data.opportunity);

  const { stats, deliveryStatus, faq, topEngagement } = data;
  const deliveryTotal = deliveryStatus.delivered + deliveryStatus.failed + deliveryStatus.pending;
  const maxFaqCount = Math.max(...faq.map((item) => item.count));

  return (
    <div className="metrics-page">
      <Sidebar active="metricas" />

      <main className="content">
        <div className="content-header">
          <h1>Métricas de engajamento</h1>
          <PageHeader role="Coordenação · Equipe da Escola" />
        </div>

        <div className="filters">
          <div className="f">
            <label>Período: </label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Este mês</option>
            </select>
          </div>
          <div className="f">
            <span className="val">{data.period.range}</span>
          </div>
          <div className="f">
            <label>Oportunidade: </label>
            <select value={opportunity} onChange={(e) => setOpportunity(e.target.value)}>
              <option>Todas</option>
              {topEngagement.map((item) => (
                <option key={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="note">RF-39 · métricas filtradas por período e por oportunidade</div>
        </div>

        <div className="stat-row">
          <StatCard value={stats.notificationsSent.toLocaleString('pt-BR')} label="Notificações enviadas" tag="RF-37" />
          <StatCard value={stats.contactsReached.toLocaleString('pt-BR')} label="Contatos alcançados" tag="RF-37" />
          <StatCard value={`${stats.deliveryRate.toFixed(1).replace('.', ',')}%`} label="Taxa de entrega" tag="RF-37" highlight />
          <StatCard value={stats.responsesReceived.toLocaleString('pt-BR')} label="Respostas recebidas" tag="RF-38" />
        </div>

        <div className="row2">
          <EngagementWeeklyChart />

          <div className="card">
            <h2>Status de entrega</h2>
            <div className="sub">RF-37 · status consolidado dos envios do período</div>

            <DeliveryStatusItem label="Entregues" count={deliveryStatus.delivered} total={deliveryTotal} color="var(--green)" />
            <DeliveryStatusItem label="Falhas" count={deliveryStatus.failed} total={deliveryTotal} color="var(--red)" />
            <DeliveryStatusItem label="Pendentes" count={deliveryStatus.pending} total={deliveryTotal} color="var(--amber)" />

            <div className="status-note">Somente envios do período filtrado · RF-39</div>
          </div>
        </div>

        <div className="row2">
          <div className="card">
            <h2>Dúvidas mais frequentes</h2>
            <div className="sub">RF-38 · intenções identificadas pelo chatbot no período</div>
            {faq.map((item) => (
              <div className="list-item" key={item.question}>
                <span className="name">{item.question}</span>
                <div className="track">
                  <div className="fill" style={{ width: `${(item.count / maxFaqCount) * 100}%` }} />
                </div>
                <span className="num">{item.count}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Maior engajamento</h2>
            <div className="sub">RF-38 · taxa de resposta por oportunidade</div>
            {topEngagement.map((item) => (
              <div className="eng-item" key={item.name}>
                <span>{item.name}</span>
                <span className="pct">{item.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function DeliveryStatusItem({ label, count, total, color }) {
  const percent = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="status-item">
      <div className="top">
        <span>{label}</span>
        <strong>{count.toLocaleString('pt-BR')}</strong>
      </div>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${percent}%`, background: color }} />
      </div>
    </div>
  );
}
