import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/painelEscolar.css';

const SITUATION_OPTIONS = ['Todas', 'Regular', 'Atenção', 'Risco'];
const SITUATION_STYLE = {
  Regular: { bg: 'var(--g100)', fg: 'var(--g600)' },
  Atenção: { bg: 'var(--a100)', fg: 'var(--a600)' },
  Risco: { bg: 'var(--r100)', fg: 'var(--r600)' },
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

// Tela 07 — Painel Escolar (RF-16 a RF-19): a restrição do produto aparece
// antes dos dados — a plataforma lê a planilha, nunca escreve nela.
export default function PainelEscolar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState(['Todas']);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('Todas');
  const [situation, setSituation] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (grade !== 'Todas') params.grade = grade;
      if (situation !== 'Todas') params.situation = situation;

      const { data } = await api.get('/students', { params });
      setItems(data.items);
      setGrades(['Todas', ...new Set(data.items.map((s) => s.grade))]);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar os dados escolares.');
    } finally {
      setLoading(false);
    }
  }, [search, grade, situation]);

  const loadSideData = useCallback(async () => {
    try {
      const [{ data: summaryData }, { data: statusData }] = await Promise.all([
        api.get('/students/summary'),
        api.get('/students/sync-status'),
      ]);
      setSummary(summaryData);
      setSyncStatus(statusData);
    } catch {
      // não bloqueia a listagem principal se os indicadores falharem
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    loadSideData();
  }, [loadSideData]);

  async function handleSync() {
    setSyncing(true);
    setSyncError('');
    try {
      await api.post('/students/sync');
      await Promise.all([load(), loadSideData()]);
    } catch (err) {
      setSyncError(err.response?.data?.detail || err.response?.data?.error || 'Falha ao sincronizar.');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <Layout title="Painel Escolar">
      <div className="pe-readonly-banner">
        <span className="dot" style={{ background: 'var(--b600)' }} />
        Somente leitura — a plataforma consome a planilha da escola, mas nunca escreve nela.
      </div>

      <div className="pe-top">
        <div className="card pe-summary">
          {summary && (
            <>
              <div>
                <strong>{summary.totalStudents}</strong>
                <span>Alunos na base</span>
              </div>
              <div>
                <strong>{summary.averageAttendance}%</strong>
                <span>Frequência média</span>
              </div>
              <div>
                <strong>{summary.regularRate}%</strong>
                <span>Desempenho geral</span>
              </div>
            </>
          )}
        </div>

        <div className="card pe-sync">
          <h3>Sincronização</h3>
          {syncStatus?.lastSuccessfulSyncAt ? (
            <p className="pe-sync-ok">
              <span className="dot" style={{ background: 'var(--g600)' }} /> Última sincronização bem-sucedida:{' '}
              {formatDateTime(syncStatus.lastSuccessfulSyncAt)}
            </p>
          ) : (
            <p className="opp-hint">Nenhuma sincronização bem-sucedida ainda.</p>
          )}
          {syncStatus?.lastRun?.status === 'falha' && (
            <p className="pe-sync-fail">
              Última tentativa falhou em {formatDateTime(syncStatus.lastRun.createdAt)}: {syncStatus.lastRun.detail}
            </p>
          )}
          {syncError && <p className="field error">{syncError}</p>}
          {isAdmin && (
            <button type="button" className="btn btn-secondary" onClick={handleSync} disabled={syncing}>
              {syncing ? 'Sincronizando…' : 'Sincronizar agora'}
            </button>
          )}
        </div>
      </div>

      <div className="card pe-filters">
        <input
          className="input pe-search"
          placeholder="Buscar aluno por nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)}>
          {grades.map((g) => (
            <option key={g} value={g}>
              Série: {g}
            </option>
          ))}
        </select>
        <select className="input" value={situation} onChange={(e) => setSituation(e.target.value)}>
          {SITUATION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              Situação: {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <h3>Alunos</h3>
        <p className="opp-hint">RF-18 · nome, série, frequência, situação e data da última atualização</p>

        {error && <p className="field error">{error}</p>}
        {loading && <p className="opp-hint">Carregando…</p>}

        {!loading && items.length === 0 && !error && (
          <p className="opp-hint">Nenhum aluno encontrado com os filtros atuais.</p>
        )}

        {!loading && items.length > 0 && (
          <div className="table-scroll">
            <table className="opp-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Série</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                  <th>Última atualização</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const style = SITUATION_STYLE[s.situation];
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.grade}</td>
                      <td>{s.attendance}%</td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.fg }}>
                          {s.situation}
                        </span>
                      </td>
                      <td>{formatDateTime(s.syncedAt)}</td>
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
