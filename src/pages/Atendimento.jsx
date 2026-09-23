import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/oportunidades.css';
import '../styles/atendimento.css';

const STATUS_OPTIONS = [
  { value: 'pendente', label: 'Pendentes' },
  { value: 'atendido', label: 'Atendidas' },
  { value: 'todas', label: 'Todas' },
];

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// RF-09 — fila de dúvidas que o chatbot não resolveu sozinho (ou em que o
// contato pediu ATENDENTE). A equipe responde pelo WhatsApp da escola e
// marca a solicitação como atendida aqui.
export default function Atendimento() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('pendente');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await api.get('/support-requests');
      setItems(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar a fila de atendimento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleStatus(item) {
    setUpdatingId(item.id);
    try {
      const next = item.status === 'pendente' ? 'atendido' : 'pendente';
      await api.patch(`/support-requests/${item.id}`, { status: next });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: next } : i)));
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível atualizar a solicitação.');
    } finally {
      setUpdatingId(null);
    }
  }

  const pendentes = items.filter((i) => i.status === 'pendente').length;
  const visible = status === 'todas' ? items : items.filter((i) => i.status === status);

  return (
    <Layout title="Atendimento">
      <div className="card opp-filters">
        <div className="atd-tabs" role="tablist">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={status === opt.value}
              className={`atd-tab${status === opt.value ? ' atd-tab-active' : ''}`}
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
              {opt.value === 'pendente' && pendentes > 0 && <span className="atd-count">{pendentes}</span>}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-ghost" onClick={load}>
          Atualizar
        </button>
      </div>

      <div className="card">
        <h3>Solicitações encaminhadas pelo chatbot</h3>
        <p className="opp-hint">
          RF-09 · dúvidas que o fluxo automático não resolveu ou em que o contato pediu ATENDENTE. Responda pelo
          WhatsApp da escola e marque como atendida.
        </p>

        {error && <p className="field error">{error}</p>}
        {loading && <p className="opp-hint">Carregando…</p>}

        {!loading && visible.length === 0 && !error && (
          <p className="opp-hint">
            {status === 'pendente' ? 'Nenhuma solicitação pendente.' : 'Nenhuma solicitação encontrada.'}
          </p>
        )}

        {!loading && visible.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table">
              <thead>
                <tr>
                  <th>Contato</th>
                  <th>Telefone</th>
                  <th>Mensagem</th>
                  <th>Recebida em</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((item) => (
                  <tr key={item.id}>
                    <td>{item.contact.name || '—'}</td>
                    <td>
                      <a
                        href={`https://wa.me/${item.contact.phone.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {item.contact.phone}
                      </a>
                    </td>
                    <td className="atd-message">{item.message}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <span className={`badge atd-badge-${item.status}`}>
                        {item.status === 'pendente' ? 'Pendente' : 'Atendida'}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="opp-link-btn"
                        disabled={updatingId === item.id}
                        onClick={() => toggleStatus(item)}
                      >
                        {item.status === 'pendente' ? 'Marcar como atendida' : 'Reabrir'}
                      </button>
                    </td>
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
