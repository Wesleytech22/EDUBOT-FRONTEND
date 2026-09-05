import Layout from '../components/Layout.jsx';
import '../styles/dashboard.css';

// MOCK DATA ONLY — SPRINT 02 (ver retro, slide 8 e documentos/E-Kanban-Sprint02.md).
// A leitura real via API (Google Sheets / métricas de envio) fica para as
// Sprints 05 e 06. Aqui o objetivo técnico é apenas a rota protegida e a
// renderização do componente principal do React.
const KPIS = [
  { value: '1.2k', label: 'Notificações enviadas', ref: 'RF-12' },
  { value: '98%', label: 'Contatos alcançados', ref: 'RF-12' },
  { value: '200+', label: 'Contatos com opt-in', ref: 'RF-10' },
  { value: '150', label: 'Interações no FAQ', ref: 'RF-13' },
];

const ENGAGEMENT = [
  { title: 'Bolsa Integral ETEC 2027', pct: 92 },
  { title: 'Curso Técnico em Informática', pct: 84 },
  { title: 'Edital PROUNI 2027', pct: 71 },
  { title: 'Curso de Inglês Gratuito', pct: 63 },
  { title: 'Programa Jovem Aprendiz', pct: 48 },
  { title: 'Feira de Profissões', pct: 35 },
];

const DISPATCHES = [
  { title: 'Bolsa Integral ETEC 2027', sent: 212, delivered: 208, failed: 4, date: '24/09 09:12' },
  { title: 'Curso Técnico em Informática', sent: 212, delivered: 211, failed: 1, date: '18/09 14:03' },
  { title: 'Edital PROUNI 2027', sent: 205, delivered: 199, failed: 6, date: '11/09 08:47' },
];

export default function Dashboard() {
  return (
    <Layout title="Dashboard">
      <div className="dash-kpis">
        {KPIS.map((kpi) => (
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
          <p className="dash-hint">RF-13 · taxa de resposta por oportunidade</p>
          <div className="dash-bars">
            {ENGAGEMENT.map((item) => (
              <div className="dash-bar-row" key={item.title}>
                <span className="dash-bar-label">{item.title}</span>
                <div className="dash-bar-track">
                  <div className="dash-bar-fill" style={{ width: `${item.pct}%` }} />
                </div>
                <span className="dash-bar-pct">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Painel escolar</h3>
          <p className="dash-hint">RF-18 e RF-19 · dados lidos do Google Sheets</p>
          <div className="dash-school-kpis">
            <div>
              <strong>92%</strong>
              <span>Frequência média</span>
            </div>
            <div>
              <strong>88%</strong>
              <span>Desempenho geral</span>
            </div>
          </div>
          <div className="dash-sync-banner">
            <span className="dot" style={{ background: 'var(--g600)' }} />
            Sincronizado às 07:40 de hoje · RF-17
          </div>
          <p className="dash-school-count">318 alunos na base sincronizada</p>
          <p className="dash-hint">Somente leitura — a planilha da escola permanece a única fonte de escrita.</p>
        </div>
      </div>

      <div className="card">
        <h3>Últimos disparos</h3>
        <p className="dash-hint">RF-06 · log de envio com status de entrega</p>
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
              {DISPATCHES.map((row) => (
                <tr key={row.title}>
                  <td>{row.title}</td>
                  <td>{row.sent}</td>
                  <td>{row.delivered}</td>
                  <td>{row.failed}</td>
                  <td>{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
