import { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/integracao.css';

const MODES = [
  { value: 'api', label: 'Colar link' },
  { value: 'upload', label: 'Anexar arquivo' },
];

// Tela 08 — Integração · Google Sheets (RF-14, RF-15): tira do time técnico
// a configuração da planilha. O Administrador escolhe entre colar o link
// da planilha (leitura ao vivo via API) ou anexar um CSV exportado, para
// escolas que preferem não compartilhar o link. A leitura (RF-14) é uma
// prova de conceito, sem sincronizar nada ainda — isso é o Módulo G, na
// tela Painel Escolar.
export default function Integracao() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const fileInputRef = useRef(null);

  const [mode, setMode] = useState('api');
  const [sheetUrl, setSheetUrl] = useState('');
  const [sheetRange, setSheetRange] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState(null);
  const [uploadedAt, setUploadedAt] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const [previewRows, setPreviewRows] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/integrations/sheets/config');
        setMode(data.source || 'api');
        setSheetUrl(data.sheetId ? `https://docs.google.com/spreadsheets/d/${data.sheetId}/edit` : '');
        setSheetRange(data.sheetRange || 'A:Z');
        setUploadedFilename(data.uploadedFilename);
        setUploadedAt(data.uploadedAt);
        setUpdatedAt(data.updatedAt);
      } catch {
        // primeira configuração — segue com os campos vazios
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
      setUpdatedAt(data.updatedAt);
      setSaveSuccess('Link salvo — a leitura passa a usar a API do Google Sheets.');
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
      setUploadedFilename(data.uploadedFilename);
      setUploadedAt(data.uploadedAt);
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
    setPreviewRows(null);
    try {
      const { data } = await api.get('/integrations/sheets/preview');
      setPreviewRows(data.values);
    } catch (err) {
      setPreviewError(err.response?.data?.error || 'Não foi possível ler a planilha.');
    } finally {
      setPreviewLoading(false);
    }
  }

  return (
    <Layout title="Integração · Google Sheets">
      <p className="opp-hint">RF-14, RF-15 · leitura da planilha da escola, sem substituir a ferramenta de origem</p>

      {loading ? (
        <p className="opp-hint">Carregando…</p>
      ) : (
        <div className="int-grid">
          <div className="card int-form">
            <h3>Configuração da planilha</h3>
            <p className="opp-hint">RF-15 · escolha como a plataforma vai ler os dados escolares</p>

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
                    Copie e cole o link inteiro da barra de endereço — o ID é extraído automaticamente. A
                    planilha precisa estar compartilhada como "qualquer pessoa com o link pode visualizar".
                  </span>
                </div>

                <div className="field">
                  <label htmlFor="sheetRange">Intervalo *</label>
                  <input
                    id="sheetRange"
                    className="input"
                    value={sheetRange}
                    onChange={(e) => setSheetRange(e.target.value)}
                    placeholder="Alunos!A2:D"
                    disabled={!isAdmin}
                    required
                  />
                  <span className="hint">Sem cabeçalho no intervalo — comece na primeira linha de dados.</span>
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
                  <input id="sheetFile" className="input" type="file" accept=".csv,text/csv" ref={fileInputRef} disabled={!isAdmin} />
                  <span className="hint">
                    No Google Sheets ou Excel: Arquivo → Fazer download → Valores separados por vírgula
                    (.csv). Até 5 MB.
                  </span>
                </div>

                {uploadedFilename && (
                  <p className="opp-hint">
                    Arquivo atual: <strong>{uploadedFilename}</strong>
                    {uploadedAt && ` · enviado em ${new Date(uploadedAt).toLocaleString('pt-BR')}`}
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

            {updatedAt && mode === 'api' && (
              <p className="opp-hint">Última alteração: {new Date(updatedAt).toLocaleString('pt-BR')}</p>
            )}
            {saveError && <p className="field error">{saveError}</p>}
            {saveSuccess && <p className="int-success">{saveSuccess}</p>}
          </div>

          <div className="card int-preview">
            <h3>Prévia de leitura</h3>
            <p className="opp-hint">RF-14 · prova de conceito — lê a planilha configurada agora, sem gravar nada</p>

            <button type="button" className="btn btn-secondary" onClick={handlePreview} disabled={previewLoading}>
              {previewLoading ? 'Lendo…' : 'Ler planilha agora'}
            </button>

            {previewError && <p className="field error" style={{ marginTop: 12 }}>{previewError}</p>}

            {previewRows && (
              <div className="table-scroll" style={{ marginTop: 16 }}>
                {previewRows.length === 0 ? (
                  <p className="opp-hint">A planilha respondeu, mas o intervalo veio vazio.</p>
                ) : (
                  <table className="int-table">
                    <tbody>
                      {previewRows.map((row, i) => (
                        // eslint-disable-next-line react/no-array-index-key
                        <tr key={i}>
                          {row.map((cell, j) => (
                            // eslint-disable-next-line react/no-array-index-key
                            <td key={j}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
