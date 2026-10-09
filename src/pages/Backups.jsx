import { useCallback, useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/oportunidades.css';
import '../styles/backups.css';

const STATUS_STYLE = {
  sucesso: { bg: 'var(--g100)', fg: 'var(--g600)', label: 'Sucesso' },
  falha: { bg: 'var(--r100)', fg: 'var(--r600)', label: 'Falha' },
};

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1).replace('.', ',')} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

// Segurança da informação (Sprint 05): a rotina de backup do banco roda
// sozinha no servidor; esta tela mostra ao Administrador se ela está
// funcionando — último backup, próximo agendado, retenção e histórico com as
// falhas à mostra — e permite um backup imediato antes de uma manutenção.
// O arquivo do backup nunca é baixado pela tela: ele contém o banco inteiro.
export default function Backups() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [runMessage, setRunMessage] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const { data: status } = await api.get('/backups');
      setData(status);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar a situação dos backups.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleRunNow() {
    setRunning(true);
    setRunMessage(null);
    try {
      const { data: result } = await api.post('/backups/run');
      setRunMessage({ ok: true, text: `Backup concluído (${formatSize(result.sizeBytes)}).` });
    } catch (err) {
      setRunMessage({ ok: false, text: err.response?.data?.error || 'O backup falhou.' });
    } finally {
      setRunning(false);
      load();
    }
  }

  if (error) {
    return (
      <Layout title="Segurança · Backups">
        <p className="field error">{error}</p>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout title="Segurança · Backups">
        <p className="opp-hint">Carregando…</p>
      </Layout>
    );
  }

  const lastRun = data.history[0];
  const lastFailed = lastRun?.status === 'falha';

  return (
    <Layout title="Segurança · Backups">
      <p className="opp-hint">
        Cópias de segurança automáticas do banco de dados escolar, para recuperar as informações em caso de falha.
      </p>

      {lastFailed && (
        <div className="bk-alert">
          <strong>O último backup falhou</strong> em {formatDateTime(lastRun.createdAt)}: {lastRun.detail}
        </div>
      )}

      <div className="bk-cards">
        <div className="card bk-card">
          <span>Último backup bem-sucedido</span>
          <strong>{data.lastSuccess ? formatDateTime(data.lastSuccess.createdAt) : 'Nenhum ainda'}</strong>
          {data.lastSuccess && <small>{formatSize(data.lastSuccess.sizeBytes)}</small>}
        </div>
        <div className="card bk-card">
          <span>Próximo backup automático</span>
          <strong>{data.schedule.enabled ? formatDateTime(data.schedule.nextRunAt) : 'Desativado'}</strong>
          <small>{data.schedule.enabled ? 'Rotina diária no servidor' : 'Rotina agendada desligada no servidor'}</small>
        </div>
        <div className="card bk-card">
          <span>Retenção</span>
          <strong>{data.retentionCount} mais recentes</strong>
          <small>Os mais antigos são apagados automaticamente</small>
        </div>
      </div>

      <div className="card">
        <div className="bk-history-head">
          <div>
            <h3>Histórico</h3>
            <p className="opp-hint">Sucessos e falhas das últimas execuções</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleRunNow} disabled={running}>
            {running ? 'Fazendo backup…' : 'Fazer backup agora'}
          </button>
        </div>

        {runMessage && <p className={runMessage.ok ? 'bk-success' : 'field error'}>{runMessage.text}</p>}

        {data.history.length === 0 ? (
          <p className="opp-hint">Nenhum backup registrado ainda.</p>
        ) : (
          <div className="table-scroll">
            <table className="opp-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Origem</th>
                  <th>Tamanho</th>
                  <th>Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {data.history.map((run) => {
                  const style = STATUS_STYLE[run.status];
                  return (
                    <tr key={run.id}>
                      <td>{formatDateTime(run.createdAt)}</td>
                      <td>
                        <span className="badge" style={{ background: style.bg, color: style.fg }}>
                          {style.label}
                        </span>
                      </td>
                      <td>{run.trigger === 'manual' ? 'Manual' : 'Automático'}</td>
                      <td>{formatSize(run.sizeBytes)}</td>
                      <td className="bk-detail">
                        {run.status === 'falha'
                          ? run.detail
                          : run.removedCount > 0
                            ? `${run.removedCount} backup(s) antigo(s) removido(s) pela retenção`
                            : '—'}
                      </td>
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
