import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import api from '../services/api.js';
import '../styles/novaOportunidade.css';

const EMPTY_FORM = {
  title: '',
  description: '',
  targetAudience: '',
  deadline: '',
  link: '',
};

// Anexo da oportunidade: mesmo limite validado no backend.
const ATTACHMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ATTACHMENT_MAX_BYTES = 5 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function formatDeadlinePreview(deadline) {
  if (!deadline) return '__/__/____';
  const [year, month, day] = deadline.split('-');
  if (!year || !month || !day) return deadline;
  return `${day}/${month}/${year}`;
}

export default function NovaOportunidade() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY_FORM);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [alreadyDispatched, setAlreadyDispatched] = useState(false);
  // Oportunidade já publicada (não é rascunho): editar não pode rebaixá-la
  // para rascunho — o salvamento mantém o status atual.
  const [isPublished, setIsPublished] = useState(false);
  // Anexo já salvo no servidor, arquivo novo escolhido e remoção pendente —
  // o arquivo só é enviado ao salvar a oportunidade.
  const [savedAttachment, setSavedAttachment] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const attachmentInputRef = useRef(null);

  useEffect(() => {
    if (!isEditing) return;
    (async () => {
      try {
        const { data } = await api.get(`/opportunities/${id}`);
        setForm({
          title: data.title,
          description: data.description,
          targetAudience: data.targetAudience,
          deadline: data.deadline?.slice(0, 10) || '',
          link: data.link || '',
        });
        setSavedAttachment(data.hasAttachment ? { name: data.attachmentName } : null);
        setAlreadyDispatched(Boolean(data.dispatchedAt));
        setIsPublished(!data.isDraft);
      } catch (err) {
        setServerError(err.response?.data?.error || 'Não foi possível carregar a oportunidade.');
      }
    })();
  }, [id, isEditing]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function handleAttachmentChange(e) {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (!ATTACHMENT_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, attachment: 'Envie um arquivo PDF, PNG ou JPG.' }));
      e.target.value = '';
      return;
    }
    if (file.size > ATTACHMENT_MAX_BYTES) {
      setErrors((prev) => ({ ...prev, attachment: 'O anexo deve ter no máximo 5 MB.' }));
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, attachment: undefined }));
    setAttachmentFile(file);
    setRemoveAttachment(false);
  }

  function clearAttachment() {
    if (attachmentFile) {
      setAttachmentFile(null);
    } else {
      setRemoveAttachment(true);
    }
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }

  // O download exige o token, por isso o arquivo é buscado pela API e aberto
  // em uma nova aba a partir de um blob.
  async function openSavedAttachment() {
    try {
      const { data } = await api.get(`/opportunities/${id}/attachment`, { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      setServerError('Não foi possível abrir o anexo.');
    }
  }

  async function syncAttachment(opportunityId) {
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('file', attachmentFile);
      await api.put(`/opportunities/${opportunityId}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else if (removeAttachment && savedAttachment) {
      await api.delete(`/opportunities/${opportunityId}/attachment`);
    }
    // A tela pode continuar montada depois de salvar (nova → editar): o que
    // foi enviado passa a ser o anexo salvo.
    if (attachmentFile) setSavedAttachment({ name: attachmentFile.name });
    else if (removeAttachment) setSavedAttachment(null);
    setAttachmentFile(null);
    setRemoveAttachment(false);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  }

  // Validação obrigatória no front (RF-30) — replicada no back (Express) para segurança do payload.
  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Informe o título da oportunidade.';
    if (!form.description.trim()) next.description = 'Informe a descrição.';
    if (!form.targetAudience.trim()) next.targetAudience = 'Informe o público-alvo.';
    if (!form.deadline) next.deadline = 'Informe o prazo de inscrição.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function persist(payload) {
    let saved;
    if (isEditing) {
      ({ data: saved } = await api.put(`/opportunities/${id}`, payload));
    } else {
      ({ data: saved } = await api.post('/opportunities', payload));
    }
    await syncAttachment(saved.id);
    return saved;
  }

  async function handleSaveDraft() {
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      const saved = await persist({ ...form, isDraft: true });
      navigate(`/oportunidades/${saved.id}/editar`);
    } catch (err) {
      setServerError(err.response?.data?.error || 'Não foi possível salvar o rascunho.');
    } finally {
      setSaving(false);
    }
  }

  // Edição de oportunidade já publicada: salva sem mudar para rascunho.
  async function handleSaveChanges() {
    if (!validate()) return;
    setSaving(true);
    setServerError('');
    try {
      await persist({ ...form, isDraft: false });
      navigate('/oportunidades');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndDispatch() {
    if (!validate()) return;
    if (!confirmChecked) {
      setServerError('Confirme o envio para todos os contatos antes de disparar.');
      return;
    }
    setSaving(true);
    setServerError('');
    try {
      const saved = await persist({ ...form, isDraft: false });
      // RF-05 restrito à Sprint 02: apenas atualiza status no banco (sem N8N/WAHA real).
      await api.patch(`/opportunities/${saved.id}/dispatch`);
      navigate('/oportunidades');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Não foi possível disparar esta oportunidade.');
    } finally {
      setSaving(false);
    }
  }

  const previewMessage = useMemo(() => {
    const title = form.title || 'Título da oportunidade';
    const audience = form.targetAudience || 'Público-alvo';
    const deadline = formatDeadlinePreview(form.deadline);
    const link = form.link || 'link a definir';
    return `Nova oportunidade: ${title}\nPúblico: ${audience}\nInscrições até ${deadline}\n\nSaiba mais: ${link}\n\nResponda MENU para ver todas as oportunidades ativas ou SAIR para deixar de receber.`;
  }, [form]);

  return (
    <Layout title={isEditing ? 'Editar oportunidade' : 'Nova oportunidade'}>
      <p className="opp-breadcrumb">
        <Link to="/oportunidades">Oportunidades</Link> &nbsp;›&nbsp; {isEditing ? 'Editar' : 'Nova oportunidade'}
      </p>

      <div className="nova-opp-grid">
        <form
          className="card nova-opp-form"
          onSubmit={(e) => e.preventDefault()}
        >
          <h3>Dados da oportunidade</h3>
          <p className="opp-hint">Título, descrição, público-alvo, prazo e link ou anexo</p>

          <div className="field">
            <label htmlFor="title">Título da oportunidade *</label>
            <input id="title" className="input" value={form.title} onChange={handleChange('title')} placeholder="Bolsa Integral ETEC 2027" />
            <span className="hint">Aparece como primeira linha da mensagem enviada no WhatsApp.</span>
            {errors.title && <span className="error">{errors.title}</span>}
          </div>

          <div className="field">
            <label htmlFor="description">Descrição *</label>
            <textarea
              id="description"
              className="input"
              rows={4}
              value={form.description}
              onChange={handleChange('description')}
              placeholder="Bolsas integrais para o curso técnico integrado ao Ensino Médio..."
            />
            {errors.description && <span className="error">{errors.description}</span>}
          </div>

          <div className="nova-opp-row">
            <div className="field">
              <label htmlFor="targetAudience">Público-alvo *</label>
              <input
                id="targetAudience"
                className="input"
                value={form.targetAudience}
                onChange={handleChange('targetAudience')}
                placeholder="Ensino Médio"
              />
              {errors.targetAudience && <span className="error">{errors.targetAudience}</span>}
            </div>
            <div className="field">
              <label htmlFor="deadline">Prazo de inscrição *</label>
              <input id="deadline" type="date" className="input" value={form.deadline} onChange={handleChange('deadline')} />
              {errors.deadline && <span className="error">{errors.deadline}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="link">Link da oportunidade</label>
            <input
              id="link"
              className="input"
              value={form.link}
              onChange={handleChange('link')}
              placeholder="https://vestibulinho.etec.sp.gov.br/inscricao"
            />
          </div>

          <div className="field">
            <label htmlFor="attachment">Anexo (opcional)</label>
            {attachmentFile ? (
              <div className="nova-opp-attachment">
                <span className="nova-opp-attachment-name">{attachmentFile.name}</span>
                <span className="hint">{formatFileSize(attachmentFile.size)} · enviado ao salvar</span>
                <button type="button" className="btn btn-ghost" onClick={clearAttachment} disabled={saving}>
                  Remover
                </button>
              </div>
            ) : savedAttachment && !removeAttachment ? (
              <div className="nova-opp-attachment">
                <span className="nova-opp-attachment-name">{savedAttachment.name}</span>
                <button type="button" className="btn btn-ghost" onClick={openSavedAttachment}>
                  Abrir
                </button>
                <button type="button" className="btn btn-ghost" onClick={clearAttachment} disabled={saving}>
                  Remover
                </button>
              </div>
            ) : null}
            <input
              id="attachment"
              ref={attachmentInputRef}
              type="file"
              className="input nova-opp-file"
              accept="application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg"
              onChange={handleAttachmentChange}
              disabled={saving}
            />
            <span className="hint">
              {removeAttachment && !attachmentFile
                ? 'O anexo atual será removido ao salvar.'
                : 'PDF, PNG ou JPG · até 5 MB'}
            </span>
            {errors.attachment && <span className="error">{errors.attachment}</span>}
          </div>

          <div className="nova-opp-divider" />

          {serverError && <p className="field error">{serverError}</p>}

          <div className="nova-opp-actions">
            <span className="hint">Campos obrigatórios validados antes do envio</span>
            <div className="nova-opp-buttons">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/oportunidades')}>
                Cancelar
              </button>
              {isPublished ? (
                <button type="button" className="btn btn-primary" onClick={handleSaveChanges} disabled={saving}>
                  Salvar alterações
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                  Salvar rascunho
                </button>
              )}
              {!alreadyDispatched && (
                <button
                  type="button"
                  className={isPublished ? 'btn btn-secondary' : 'btn btn-primary'}
                  onClick={handleSaveAndDispatch}
                  disabled={saving}
                >
                  Salvar e disparar
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="nova-opp-side">
          <div className="card">
            <h3>Pré-visualização da mensagem</h3>
            <p className="opp-hint">Texto que será enviado pelo fluxo do N8N via WAHA (na Sprint 03)</p>
            <div className="wa-chat">
              <div className="wa-bubble">
                <strong>EduBot · E. E. Jardim União</strong>
                <p>{previewMessage}</p>
                <span className="wa-time">agora</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3>Confirmação de disparo</h3>
            <p className="opp-hint">O envio exige confirmação explícita</p>
            <ul className="nova-opp-confirm-list">
              <li><span className="dot" style={{ background: 'var(--g600)' }} /> Contatos com opt-in ativo receberão a mensagem</li>
              <li><span className="dot" style={{ background: 'var(--t400)' }} /> Envio imediato após a confirmação</li>
              <li><span className="dot" style={{ background: 'var(--t400)' }} /> O log de entrega é registrado por contato</li>
            </ul>
            <label className="nova-opp-checkbox">
              <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
              Confirmo o envio desta oportunidade a todos os contatos.
            </label>
            <div className="nova-opp-warning">
              O disparo não pode ser cancelado depois de iniciado.
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
