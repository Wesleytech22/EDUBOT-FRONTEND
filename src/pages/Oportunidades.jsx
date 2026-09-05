import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/oportunidades.css';

const STATUS_OPTIONS = ['Todas', 'Ativa', 'Rascunho', 'Encerrada'];
const STATUS_STYLE = {
  Ativa: { bg: 'var(--g100)', fg: 'var(--g600)' },
  Encerrada: { bg: 'var(--alt)', fg: 'var(--t600)' },
  Rascunho: { bg: 'var(--a100)', fg: 'var(--a600)' },
};

function formatDate(value) {
  return new Date(value).toLocaleDateString('pt-BR');
}

export default function Oportunidades() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [audiences, setAudiences] = useState(['Todos']);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Todas');
  const [targetAudience, setTargetAudience] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (status !== 'Todas') params.status = status;
      if (targetAudience !== 'Todos') params.targetAudience = targetAudience;

      const { data } = await api.get('/opportunities', { params });
      setItems(data.items);
      setAudiences(['Todos', ...new Set(data.items.map((o) => o.targetAudience))]);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar as oportunidades.');
    } finally {
      setLoading(false);
    }
  }, [search, status, targetAudience]);

  useEffect(() => {
    const timer = setTimeout(load, 250); // pequeno debounce da busca por texto
    return () => clearTimeout(timer);
  }, [load]);

  async function handleDispatch(id) {
    setActionError('');
    try {
      await api.patch(`/opportunities/${id}/dispatch`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Não foi possível disparar esta oportunidade.');
    }
  }

  function clearFilters() {
    setSearch('');
    setStatus('Todas');
    setTargetAudience('Todos');
  }

  return (
    <Layout
      title="Oportunidades"
      headerAction={
        <div className="opp-toolbar">
          <button type="button" className="btn btn-primary" onClick={() => navigate('/oportunidades/nova')}>
            Nova oportunidade
          </button>
        </div>
      }
    >
      <div className="card opp-filters">
        <input
          className="input opp-search"
          placeholder="Buscar oportunidade por título…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              Situação: {s}
            </option>
          ))}
        </select>
        <select className="input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
          {audiences.map((a) => (
            <option key={a} value={a}>
              Público-alvo: {a}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost" onClick={clearFilters}>
          Limpar filtros
        </button>
      </div>

      <div className="card">
        <h3>Oportunidades cadastradas</h3>
        <p className="opp-hint">RF-03 · busca por título e filtros por situação e público-alvo</p>

        {actionError && <p className="field error">{actionError}</p>}
        {error && <p className="field error">{error}</p>}
        {loading && <p className="opp-hint">Carregando…</p>}

        {!loading && items.length === 0 && !error && (
          <p className="opp-hint">Nenhuma oportunidade encontrada com os filtros atuais.</p>
        )}

        {!loading && items.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table">
              <thead>
                <tr>
                  <th>Oportunidade</th>
                  <th>Público-alvo</th>
                  <th>Prazo</th>
                  <th>Situação</th>
                  <th>Último disparo</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((o) => {
                  const style = STATUS_STYLE[o.status];
                  const isEncerrada = o.status === 'Encerrada';
                  const isRascunho = o.status === 'Rascunho';
                  return (
                    <tr key={o.id}>
                      <td>{o.title}</td>
                      <td>{o.targetAudience}</td>
                      <td>{formatDate(o.deadline)}</td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.fg }}>
                          {o.status}
                        </span>
                      </td>
                      <td>{o.dispatchedAt ? formatDate(o.dispatchedAt) : 'Não enviada'}</td>
                      <td className="opp-actions">
                        <Link to={`/oportunidades/${o.id}/editar`}>Editar</Link>
                        {isEncerrada ? (
                          <span className="opp-action-disabled">Ver histórico</span>
                        ) : (
                          <button
                            type="button"
                            className="opp-link-btn"
                            disabled={isRascunho}
                            title={isRascunho ? 'Salve e dispare pelo formulário da oportunidade' : ''}
                            onClick={() => handleDispatch(o.id)}
                          >
                            Disparar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="opp-footer">
          <span>Exibindo {items.length} de {items.length} oportunidades</span>
        </div>
      </div>
    </Layout>
  );
}
