import { useCallback, useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import { SYNC_POLL_MS, describeNextSync } from '../services/syncSchedule.js';
import '../styles/oportunidades.css';
import '../styles/integracao.css';

const MODES = [
  { value: 'api', label: 'Colar link' },
  { value: 'upload', label: 'Anexar arquivo CSV' },
];

const INTERVAL_LABELS = {
  0: 'Somente manual',
  15: 'A cada 15 minutos',
  30: 'A cada 30 minutos',
  60: 'A cada hora',
  360: 'A cada 6 horas',
  1440: 'Uma vez por dia',
};

const RUN_STYLE = {
  sucesso: { bg: 'var(--g100)', fg: 'var(--g600)', label: 'Sucesso' },
  falha: { bg: 'var(--r100)', fg: 'var(--r600)', label: 'Falha' },
};

// Mensagem de retorno de "salvar link"/"enviar arquivo", que já sincronizam.
function syncResultMessage(prefix, sync) {
  if (!sync) return { ok: true, text: prefix };
  return sync.status === 'sucesso'
    ? { ok: true, text: `${prefix} ${sync.detail}` }
    : { ok: false, text: `${prefix} Mas a sincronização falhou: ${sync.detail}` };
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

// Tela 08 — Integração · Google Sheets: tira do time técnico a configuração
// da planilha. O Administrador escolhe entre colar o link da planilha
// (leitura ao vivo) ou anexar um CSV exportado dela, para escolas que
// preferem não compartilhar o link. A Equipe da Escola só consulta.
export default function Integracao() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const fileInputRef = useRef(null);

  const [config, setConfig] = useState(null);
  const [mode, setMode] = useState('api');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetRange, setSheetRange] = useState('A:E');
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [runs, setRuns] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [intervalSaving, setIntervalSaving] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [preview, setPreview] = useState(null);

  function applyConfig(data) {
    setConfig(data);
    setMode(data.source || 'api');
    setSheetUrl(data.sheetId ? `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit` : '');
    setSheetRange(data.sheetRange || 'A:E');
  }

  const loadRuns = useCallback(async () => {
    try {
      const { data } = await api.get('/integrations/sheets/sync-runs', { params: { limit: 10 } });
      setRuns(data.items);
    } catch {
      // o histórico é complementar — não bloqueia a configuração
    }
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/students/sync-status');
      setSyncStatus(data);
    } catch {
      // complementar, como o histórico
    }
  }, []);

  // A rotina automática roda no servidor: histórico e próximo horário são
  // conferidos a cada 30 s, sem precisar atualizar a página.
  useEffect(() => {
    loadRuns();
    loadStatus();
    const timer = setInterval(() => {
      loadRuns();
      loadStatus();
    }, SYNC_POLL_MS);
    return () => clearInterval(timer);
  }, [loadRuns, loadStatus]);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/integrations/sheets/config');
        applyConfig(data);
      } catch (err) {
        setSaveError(err.response?.data?.error || 'Não foi possível carregar a configuração da planilha.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function switchMode(next) {
    setMode(next);
    setSaveError('');
    setSaveSuccess('');
  }

  async function handleSaveLink(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const { data } = await api.put('/integrations/sheets/config', { sheetUrl, sheetRange });
      applyConfig(data.config);
      const message = syncResultMessage('Link salvo.', data.sync);
      if (message.ok) setSaveSuccess(message.text);
      else setSaveError(message.text);
      loadRuns();
      loadStatus();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Não foi possível salvar o link.');
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadFile(e) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setSaveError('Escolha um arquivo .csv para enviar.');
      return;
    }

    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post('/integrations/sheets/upload', formData);
      applyConfig(data.config);
      const message = syncResultMessage('Arquivo enviado.', data.sync);
      if (message.ok) setSaveSuccess(message.text);
      else setSaveError(message.text);
      loadRuns();
      loadStatus();
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Não foi possível enviar o arquivo.');
    } finally {
      setSaving(false);
    }
  }

  async function handleIntervalChange(e) {
    const syncIntervalMinutes = Number(e.target.value);
    setIntervalSaving(true);
    setSyncMessage(null);
    try {
      const { data } = await api.put('/integrations/sheets/sync-settings', { syncIntervalMinutes });
      setConfig(data);
      loadStatus();
    } catch (err) {
      setSyncMessage({ ok: false, text: err.response?.data?.error || 'Não foi possível alterar a frequência.' });
    } finally {
      setIntervalSaving(false);
    }
  }

  async function handleSyncNow() {
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
      loadRuns();
      loadStatus();
    }
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setPreviewError('');
    setPreview(null);
    try {
      const { data } = await api.get('/integrations/sheets/preview');
      setPreview(data);
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Não foi possível ler a planilha.');
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Layout title="Integração · Google Sheets">
      <p className="opp-hint">
        A plataforma lê a planilha da escola, sem substituí-la: os dados continuam sendo mantidos na planilha.
      </p>

      {loading ? (
        <p className="opp-hint">Carregando…</p>
      ) : (
        <div className="int-grid">
          <div className="card int-form">
            <h3>Origem dos dados</h3>
            <p className="opp-hint">
              {config?.configured
                ? `Em uso: ${config.source === 'upload' ? `arquivo ${config.uploadedFilename}` : 'link do Google Sheets'}`
                : 'Nenhuma planilha configurada ainda.'}
            </p>

            <div className="int-mode-switch" role="tablist">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  role="tab"
                  aria-selected={mode === m.value}
                  className={`int-mode-btn${mode === m.value ? ' int-mode-btn-active' : ''}`}
                  onClick={() => switchMode(m.value)}
                  disabled={!isAdmin}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {mode === 'api' ? (
              <form onSubmit={handleSaveLink}>
                <div className="field">
                  <label htmlFor="sheetUrl">Link da planilha *</label>
                  <input
                    id="sheetUrl"
                    className="input"
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/.../edit"
                    disabled={!isAdmin}
                    required
                  />
                  <span className="hint">
                    Copie o link inteiro da barra de endereço. A planilha precisa estar compartilhada como
                    "qualquer pessoa com o link pode visualizar".
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="sheetRange">Aba e intervalo *</label>
                  <input
                    id="sheetRange"
                    className="input"
                    value={sheetRange}
                    onChange={(e) => setSheetRange(e.target.value)}
                    placeholder="Alunos!A:E"
                    disabled={!isAdmin}
                    required
                  />
                  <span className="hint">
                    Colunas na ordem Nome, Série, Presenças e Faltas. Ex.: Alunos!A:D (a linha de
                    cabeçalho é reconhecida automaticamente). A frequência e a situação do aluno
                    (Regular a partir de 85%, Atenção de 75% a 84,9%, Risco abaixo de 75%) são calculadas pelo sistema.
                  </span>
                </div>

                {isAdmin ? (
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Salvando…' : 'Salvar link'}
                  </button>
                ) : (
                  <p className="opp-hint">Somente o Administrador pode alterar esta configuração.</p>
                )}
              </form>
            ) : (
              <form onSubmit={handleUploadFile}>
                <div className="field">
                  <label htmlFor="sheetFile">Arquivo CSV *</label>
                  <input
                    id="sheetFile"
                    className="input"
                    type="file"
                    accept=".csv,text/csv"
                    ref={fileInputRef}
                    disabled={!isAdmin}
                  />
                  <span className="hint">
                    No Google Sheets: Arquivo → Fazer download → Valores separados por vírgula (.csv). No Excel:
                    Salvar como → CSV. Até 5 MB.
                  </span>
                </div>

                {config?.uploadedFilename && (
                  <p className="opp-hint">
                    Último arquivo: <strong>{config.uploadedFilename}</strong> · enviado em{' '}
                    {formatDateTime(config.uploadedAt)}
                  </p>
                )}

                {isAdmin ? (
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Enviando…' : 'Enviar arquivo'}
                  </button>
                ) : (
                  <p className="opp-hint">Somente o Administrador pode alterar esta configuração.</p>
                )}
              </form>
            )}

            {config?.updatedAt && <p className="opp-hint">Última alteração: {formatDateTime(config.updatedAt)}</p>}
            {saveError && <p className="field error">{saveError}</p>}
            {saveSuccess && <p className="int-success">{saveSuccess}</p>}
          </div>

          <div className="card int-preview">
            <h3>Prévia de leitura</h3>
            <p className="opp-hint">Lê a planilha configurada agora, sem gravar nada — para conferir as colunas.</p>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePreview}
              disabled={previewLoading || !config?.configured}
            >
              {previewLoading ? 'Lendo…' : 'Ler planilha agora'}
            </button>

            {previewError && <p className="field error int-preview-msg">{previewError}</p>}

            {/* Antes da primeira leitura, o cartão (da mesma altura do ao lado)
                explica para que serve a prévia, em vez de ficar vazio. */}
            {!preview && !previewError && !previewLoading && (
              <div className="int-preview-empty">
                {config?.configured ? (
                  <>
                    <strong>Deseja ver como está a planilha antes de sincronizar?</strong>
                    <span>
                      Clique em "Ler planilha agora" para visualizar o que já foi preenchido. Nada é gravado na
                      plataforma nesta prévia.
                    </span>
                  </>
                ) : (
                  <>
                    <strong>Nenhuma planilha configurada ainda.</strong>
                    <span>
                      Cole o link ou anexe o arquivo CSV em "Origem dos dados" para visualizar aqui como a planilha
                      está preenchida.
                    </span>
                  </>
                )}
              </div>
            )}

            {preview && (
              <div className="int-preview-msg">
                {preview.values.length === 0 ? (
                  <p className="opp-hint">A planilha respondeu, mas o intervalo veio vazio.</p>
                ) : (
                  <>
                    <p className="opp-hint">
                      {preview.totalRows > preview.values.length
                        ? `Mostrando as ${preview.values.length} primeiras de ${preview.totalRows} linhas.`
                        : `${preview.totalRows} linha(s) lida(s).`}
                    </p>
                    {/* Rolagem própria (horizontal e vertical): planilhas com muitas
                        colunas ou textos longos não podem esticar a tela. */}
                    <div className="int-preview-scroll">
                      <table className="int-table">
                        <tbody>
                          {preview.values.map((row, i) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <tr key={i}>
                              {row.map((cell, j) => (
                                // eslint-disable-next-line react/no-array-index-key
                                <td key={j} title={cell}>
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && (
        <div className="card int-sync">
          <div className="int-sync-head">
            <div>
              <h3>Sincronização</h3>
              <p className="opp-hint">
                Os dados da planilha são copiados para o Painel Escolar automaticamente, na frequência escolhida.
              </p>
              {describeNextSync(syncStatus) && <p className="int-sync-next">{describeNextSync(syncStatus)}</p>}
            </div>
            <div className="int-sync-actions">
              <select
                className="input"
                value={config?.syncIntervalMinutes ?? 60}
                onChange={handleIntervalChange}
                disabled={!isAdmin || intervalSaving}
                aria-label="Frequência da sincronização automática"
              >
                {(config?.syncIntervalOptions || [0, 15, 30, 60, 360, 1440]).map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {INTERVAL_LABELS[minutes] || `A cada ${minutes} minutos`}
                  </option>
                ))}
              </select>
              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSyncNow}
                  disabled={syncing || !config?.configured}
                >
                  {syncing ? 'Sincronizando…' : 'Sincronizar agora'}
                </button>
              )}
            </div>
          </div>

          {syncMessage && <p className={syncMessage.ok ? 'int-success' : 'field error'}>{syncMessage.text}</p>}

          {runs.length === 0 ? (
            <p className="opp-hint">Nenhuma sincronização registrada ainda.</p>
          ) : (
            <div className="table-scroll">
              <table className="opp-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Origem</th>
                    <th>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => {
                    const style = RUN_STYLE[run.status];
                    return (
                      <tr key={run.id}>
                        <td>{formatDateTime(run.createdAt)}</td>
                        <td>
                          <span className="badge" style={{ background: style.bg, color: style.fg }}>
                            {style.label}
                          </span>
                        </td>
                        <td>{run.trigger === 'manual' ? 'Manual' : 'Automática'}</td>
                        <td className="int-run-detail">{run.detail}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
