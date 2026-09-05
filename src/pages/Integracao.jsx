import { useEffect, useState } from 'react';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/integracao.css';

// Tela 08 — Integração · Google Sheets (RF-14, RF-15): tira do time técnico
// a configuração da planilha. O Administrador define planilha e intervalo
// pela própria tela; a leitura (RF-14) é uma prova de conceito, sem
// sincronizar nada ainda — isso é o Módulo G, na tela Painel Escolar.
export default function Integracao() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const [sheetId, setSheetId] = useState('');
  const [sheetRange, setSheetRange] = useState('');
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
        setSheetId(data.sheetId || '');
        setSheetRange(data.sheetRange || 'A:Z');
        setUpdatedAt(data.updatedAt);
      } catch {
        // primeira configuração — segue com os campos vazios
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess('');
    try {
      const { data } = await api.put('/integrations/sheets/config', { sheetId, sheetRange });
      setUpdatedAt(data.updatedAt);
      setSaveSuccess('Configuração salva.');
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Não foi possível salvar a configuração.');
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
          <form className="card int-form" onSubmit={handleSave}>
            <h3>Configuração da planilha</h3>
            <p className="opp-hint">RF-15 · o Administrador define qual planilha e qual intervalo são consumidos</p>

            <div className="field">
              <label htmlFor="sheetId">ID da planilha *</label>
              <input
                id="sheetId"
                className="input"
                value={sheetId}
                onChange={(e) => setSheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                disabled={!isAdmin}
                required
              />
              <span className="hint">A parte do link entre <code>/d/</code> e <code>/edit</code>.</span>
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

            {updatedAt && (
              <p className="opp-hint">Última alteração: {new Date(updatedAt).toLocaleString('pt-BR')}</p>
            )}
            {saveError && <p className="field error">{saveError}</p>}
            {saveSuccess && <p className="int-success">{saveSuccess}</p>}

            {isAdmin ? (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar configuração'}
              </button>
            ) : (
              <p className="opp-hint">Somente o Administrador pode alterar esta configuração.</p>
            )}
          </form>

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
