import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/resultadoDisparo.css';

const STATUS_LABEL = {
  enviado: 'Entregue',
  falha: 'Falha',
  pendente: 'Pendente',
};

const STATUS_STYLE = {
  enviado: { bg: 'var(--g100)', fg: 'var(--g600)' },
  falha: { bg: 'var(--r100)', fg: 'var(--r600)' },
  pendente: { bg: 'var(--a100)', fg: 'var(--a600)' },
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

// Tela — Resultado do Disparo (RF-04 a RF-06): fecha o ciclo do envio, com
// as falhas à mostra em vez de escondidas atrás de um número agregado.
export default function ResultadoDisparo() {
  const { id } = useParams();
  const [opportunity, setOpportunity] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError('');
      try {
        const [{ data: opp }, { data: logsData }] = await Promise.all([
          api.get(`/opportunities/${id}`),
          api.get(`/opportunities/${id}/dispatch-logs`),
        ]);
        setOpportunity(opp);
        setLogs(logsData.items);
      } catch (err) {
        setError(err.response?.data?.error || 'Não foi possível carregar o resultado do disparo.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const total = logs.length;
  const enviados = logs.filter((l) => l.status === 'enviado').length;
  const falhas = logs.filter((l) => l.status === 'falha').length;
  const pendentes = logs.filter((l) => l.status === 'pendente').length;
  const taxaEntrega = total > 0 ? Math.round((enviados / total) * 100) : 0;

  return (
    <Layout title="Resultado do disparo">
      <p className="opp-breadcrumb">
        <Link to="/oportunidades">Oportunidades</Link> &nbsp;›&nbsp; Resultado do disparo
      </p>

      {loading && <p className="opp-hint">Carregando…</p>}
      {error && <p className="field error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3>{opportunity?.title}</h3>
            <p className="opp-hint">RF-06 · log de envio por destinatário, com status de entrega</p>
          </div>

          <div className="rd-kpis">
            <div className="card rd-kpi">
              <strong>{total}</strong>
              <span>Contatos</span>
            </div>
            <div className="card rd-kpi">
              <strong>{enviados}</strong>
              <span>Entregues</span>
            </div>
            <div className="card rd-kpi">
              <strong>{falhas}</strong>
              <span>Falhas</span>
            </div>
            <div className="card rd-kpi">
              <strong>{taxaEntrega}%</strong>
              <span>Taxa de entrega</span>
            </div>
          </div>

          <div className="card">
            <h3>Detalhe por contato</h3>
            {pendentes > 0 && (
              <p className="opp-hint">
                {pendentes} contato(s) ainda aguardando confirmação do N8N — atualize a página para ver o
                andamento.
              </p>
            )}

            {total === 0 ? (
              <p className="opp-hint">Nenhum log de envio encontrado para esta oportunidade.</p>
            ) : (
              <div className="table-scroll">
                <table className="rd-table">
                  <thead>
                    <tr>
                      <th>Contato</th>
                      <th>Telefone</th>
                      <th>Status</th>
                      <th>Motivo</th>
                      <th>Horário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const style = STATUS_STYLE[log.status];
                      return (
                        <tr key={log.id}>
                          <td>{log.contact.name || '—'}</td>
                          <td>{log.contact.phone}</td>
                          <td>
                            <span className="badge" style={{ background: style.bg, color: style.fg }}>
                              {STATUS_LABEL[log.status]}
                            </span>
                          </td>
                          <td>{log.status === 'falha' ? log.detail || 'Motivo não informado.' : '—'}</td>
                          <td>{formatDateTime(log.updatedAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </Layout>
  );
}
