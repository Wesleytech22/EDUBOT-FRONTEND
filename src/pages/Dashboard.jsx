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
// status de entrega por contato do broadcast (RF-06, Sprint 03). O card do
// Painel Escolar resume os dados sincronizados da planilha da escola
// (Sprint 05) — sem planilha conectada, mostra "ainda sem dados" em vez de
// números fictícios.
export default function Dashboard() {
  const [items, setItems] = useState(null);
  const [deliveryByOpp, setDeliveryByOpp] = useState(new Map());
  const [error, setError] = useState('');
  const [school, setSchool] = useState(null);
  const [schoolInfo, setSchoolInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // O status de entrega é complementar: se /metrics/dispatch-logs
        // falhar (ex.: backend ainda sem a Sprint 03), o Dashboard continua
        // funcionando só com as oportunidades, como antes.
        const [{ data }, logsData] = await Promise.all([
          api.get('/opportunities'),
          api
            .get('/metrics/dispatch-logs')
            .then((r) => r.data)
            .catch(() => ({ items: [] })),
        ]);
        const delivery = new Map();
        for (const log of logsData.items) {
          const agg = delivery.get(log.opportunity.id) || { enviado: 0, falha: 0, pendente: 0 };
          agg[log.status] += 1;
          delivery.set(log.opportunity.id, agg);
        }
        setDeliveryByOpp(delivery);
        setItems(data.items);

        // Complementar, como o status de entrega: sem o backend da Sprint 05
        // o card do Painel Escolar só fica sem dados.
        Promise.all([api.get('/students/summary'), api.get('/students/sync-status')])
          .then(([summary, status]) => setSchool({ ...summary.data, ...status.data }))
          .catch(() => setSchool(null));

        // Link de entrada no chatbot desta escola, para a coordenação divulgar.
        api
          .get('/schools/current')
          .then((r) => setSchoolInfo(r.data))
          .catch(() => setSchoolInfo(null));
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

  async function copyChatbotLink() {
    try {
      await navigator.clipboard.writeText(schoolInfo.telegramLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie o link do chatbot:', schoolInfo.telegramLink);
    }
  }

  return (
    <Layout title="Dashboard">
      {schoolInfo?.telegramLink && (
        <div className="card dash-chatbot-link">
          <div>
            <strong>Link do chatbot da escola</strong>
            <span>Divulgue para alunos e famílias se inscreverem pelo Telegram.</span>
          </div>
          <div className="dash-chatbot-actions">
            <a href={schoolInfo.telegramLink} target="_blank" rel="noreferrer">
              {schoolInfo.telegramLink}
            </a>
            <button type="button" className="btn btn-secondary" onClick={copyChatbotLink}>
              {copied ? 'Copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>
      )}

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
          {school && school.totalStudents > 0 ? (
            <>
              <div className="dash-school">
                <div>
                  <strong>{school.totalStudents}</strong>
                  <span>Alunos</span>
                </div>
                <div>
                  <strong>{Number(school.averageAttendance).toLocaleString('pt-BR')}%</strong>
                  <span>Frequência média</span>
                </div>
                <div>
                  <strong>{school.bySituation.Risco}</strong>
                  <span>Em risco</span>
                </div>
              </div>
              <p className="dash-hint">
                Sincronizado em {formatDateTime(school.lastSuccessfulSyncAt)} ·{' '}
                <Link to="/painel-escolar">Abrir Painel Escolar</Link>
              </p>
            </>
          ) : (
            <p className="opp-hint">
              Ainda sem dados — conecte a planilha da escola em <Link to="/integracao">Integração</Link>.
            </p>
          )}
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
