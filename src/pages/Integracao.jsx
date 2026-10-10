import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/integracao.css';

const MODES = [
  { value: 'api', label: 'Colar link' },
  { value: 'upload', label: 'Anexar arquivo CSV' },
];

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

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [preview, setPreview] = useState(null);

  function applyConfig(data) {
    setConfig(data);
    setMode(data.source || 'api');
    setSheetUrl(data.sheetId ? `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit` : '');
    setSheetRange(data.sheetRange || 'A:E');
  }

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
      setSaveSuccess('Link salvo — a plataforma passa a ler a planilha diretamente do Google Sheets.');
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
      setSaveSuccess(`Arquivo enviado — ${data.rowCount} linha(s) lida(s).`);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Não foi possível enviar o arquivo.');
    } finally {
      setSaving(false);
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
                    Colunas na ordem Nome, Série, Presenças, Faltas e Situação. Ex.: Alunos!A:E (a linha de
                    cabeçalho é reconhecida automaticamente).
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
    </Layout>
  );
}
