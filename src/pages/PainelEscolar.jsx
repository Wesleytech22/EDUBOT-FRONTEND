import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { SYNC_POLL_MS, describeNextSync } from '../services/syncSchedule.js';
import '../styles/oportunidades.css';
import '../styles/painelEscolar.css';

const SITUATION_OPTIONS = ['Todas', 'Regular', 'Atenção', 'Risco'];
const SITUATION_STYLE = {
  Regular: { bg: 'var(--g100)', fg: 'var(--g600)' },
  Atenção: { bg: 'var(--a100)', fg: 'var(--a600)' },
  Risco: { bg: 'var(--r100)', fg: 'var(--r600)' },
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatPercent(value) {
  return `${Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

// Tela 07 — Painel Escolar: a restrição do produto aparece antes dos dados —
// a plataforma lê a planilha da escola, nunca escreve nela. Busca e filtros
// sobre os dados sincronizados, exportação em CSV e o carimbo da última
// sincronização (com a falha à mostra, se a última tentativa falhou).
export default function PainelEscolar() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const [items, setItems] = useState([]);
  const [grades, setGrades] = useState([]);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('Todas');
  const [situation, setSituation] = useState('Todas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [summary, setSummary] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [exporting, setExporting] = useState(false);

  const filterParams = useCallback(() => {
    const params = {};
    if (search.trim()) params.search = search.trim();
    if (grade !== 'Todas') params.grade = grade;
    if (situation !== 'Todas') params.situation = situation;
    return params;
  }, [search, grade, situation]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/students', { params: filterParams() });
      setItems(data.items);
      setGrades(data.grades);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar os dados escolares.');
    } finally {
      setLoading(false);
    }
  }, [filterParams]);

  const loadSideData = useCallback(async () => {
    try {
      const [{ data: summaryData }, { data: statusData }] = await Promise.all([
        api.get('/students/summary'),
        api.get('/students/sync-status'),
      ]);
      setSummary(summaryData);
      setSyncStatus(statusData);
    } catch {
      // os indicadores são complementares — não bloqueiam a listagem
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    loadSideData();
  }, [loadSideData]);

  // A sincronização automática acontece no servidor: a tela confere o status
  // a cada 30 s e, quando aparece uma sincronização nova, recarrega os dados
  // — sem precisar atualizar a página.
  const lastRunRef = useRef(null);
  useEffect(() => {
    lastRunRef.current = syncStatus?.lastRun?.createdAt || null;
  }, [syncStatus]);

  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const { data } = await api.get('/students/sync-status');
        const changed = (data.lastRun?.createdAt || null) !== lastRunRef.current;
        setSyncStatus(data);
        if (changed) await Promise.all([load(), loadSideData()]);
      } catch {
        // tenta de novo no próximo ciclo
      }
    }, SYNC_POLL_MS);
    return () => clearInterval(timer);
  }, [load, loadSideData]);

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const { data } = await api.post('/students/sync');
      setSyncMessage({ ok: true, text: data.detail });
    } catch (err) {
      setSyncMessage({
        ok: false,
        text: err.response?.data?.detail || err.response?.data?.error || 'Falha ao sincronizar.',
      });
    } finally {
      setSyncing(false);
      await Promise.all([load(), loadSideData()]);
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      const { data } = await api.get('/students/export.csv', { params: filterParams(), responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `painel-escolar-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Não foi possível exportar o CSV.');
    } finally {
      setExporting(false);
    }
  }

  const notConfigured = syncStatus && !syncStatus.configured;
  const lastRunFailed = syncStatus?.lastRun?.status === 'falha';

  return (
    <Layout title="Painel Escolar">
      <div className="pe-readonly-banner">
        <span className="dot" style={{ background: 'var(--b600)' }} />
        Somente leitura — a plataforma consome a planilha da escola, mas nunca escreve nela.
      </div>

      {notConfigured && (
        <div className="card pe-empty">
          <h3>Nenhuma planilha conectada</h3>
          <p className="opp-hint">
            {isAdmin
              ? 'Conecte a planilha da escola (link do Google Sheets ou arquivo CSV) para os dados aparecerem aqui.'
              : 'O Administrador ainda não conectou a planilha da escola.'}
          </p>
          {isAdmin && (
            <Link to="/integracao" className="btn btn-primary">
              Configurar integração
            </Link>
          )}
        </div>
      )}

      <div className="pe-top">
        <div className="pe-summary">
          <div className="card pe-kpi">
            <strong>{summary ? summary.totalStudents : '—'}</strong>
            <span>Alunos na base</span>
          </div>
          <div className="card pe-kpi">
            <strong>{summary ? formatPercent(summary.averageAttendance) : '—'}</strong>
            <span>Frequência média</span>
          </div>
          <div className="card pe-kpi">
            <strong>{summary ? `${summary.regularRate}%` : '—'}</strong>
            <span>Em situação regular</span>
            {summary && summary.totalStudents > 0 && (
              <small>
                {summary.bySituation['Atenção']} em atenção · {summary.bySituation.Risco} em risco
              </small>
            )}
          </div>
        </div>

        <div className="card pe-sync">
          <h3>Sincronização</h3>
          {syncStatus?.lastSuccessfulSyncAt ? (
            <p className="pe-sync-ok">
              <span className="dot" style={{ background: 'var(--g600)' }} />
              Última sincronização: {formatDateTime(syncStatus.lastSuccessfulSyncAt)}
            </p>
          ) : (
            <p className="opp-hint">Nenhuma sincronização bem-sucedida ainda.</p>
          )}
          {lastRunFailed && (
            <p className="pe-sync-fail">
              A última tentativa falhou ({formatDateTime(syncStatus.lastRun.createdAt)}): {syncStatus.lastRun.detail}
            </p>
          )}
          {syncMessage && <p className={syncMessage.ok ? 'pe-sync-ok' : 'pe-sync-fail'}>{syncMessage.text}</p>}
          {describeNextSync(syncStatus) && <p className="pe-sync-next">{describeNextSync(syncStatus)}</p>}
          {isAdmin && !notConfigured && (
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
          aria-label="Buscar aluno por nome"
        />
        <select className="input" value={grade} onChange={(e) => setGrade(e.target.value)} aria-label="Série">
          <option value="Todas">Série: Todas</option>
          {grades.map((g) => (
            <option key={g} value={g}>
              Série: {g}
            </option>
          ))}
        </select>
        <select
          className="input"
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
          aria-label="Situação"
        >
          {SITUATION_OPTIONS.map((s) => (
            <option key={s} value={s}>
              Situação: {s}
            </option>
          ))}
        </select>
      </div>

      <div className="card">
        <div className="pe-list-head">
          <div>
            <h3>Alunos</h3>
            <p className="opp-hint">A frequência é calculada a partir das presenças e faltas registradas na planilha.</p>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExport}
            disabled={exporting || items.length === 0}
          >
            {exporting ? 'Exportando…' : 'Exportar CSV'}
          </button>
        </div>

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
                  <th>Presenças</th>
                  <th>Faltas</th>
                  <th>Frequência</th>
                  <th>Situação</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const style = SITUATION_STYLE[s.situation];
                  return (
                    <tr key={s.id}>
                      <td>{s.name}</td>
                      <td>{s.grade}</td>
                      <td>{s.attendancePresent}</td>
                      <td>{s.attendanceAbsent}</td>
                      <td>{formatPercent(s.attendance)}</td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.fg }}>
                          {s.situation}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {syncStatus?.lastSuccessfulSyncAt && (
          <p className="pe-footer">
            Dados da planilha da escola · sincronizados em {formatDateTime(syncStatus.lastSuccessfulSyncAt)}
          </p>
        )}
      </div>
    </Layout>
  );
}
