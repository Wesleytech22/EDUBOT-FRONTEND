import { useEffect, useMemo, useState } from 'react';
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
  attachmentName: '',
};

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
          attachmentName: data.attachmentName || '',
        });
        setAlreadyDispatched(Boolean(data.dispatchedAt));
      } catch (err) {
        setServerError(err.response?.data?.error || 'Não foi possível carregar a oportunidade.');
      }
    })();
  }, [id, isEditing]);

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
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
    if (isEditing) {
      const { data } = await api.put(`/opportunities/${id}`, payload);
      return data;
    }
    const { data } = await api.post('/opportunities', payload);
    return data;
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
      // RF-04/RF-05 (Sprint 03): aciona o webhook do N8N e cria o log de envio.
      await api.patch(`/opportunities/${saved.id}/dispatch`);
      navigate(`/oportunidades/${saved.id}/disparo`);
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
          <p className="opp-hint">RF-02 · título, descrição, público-alvo, prazo e link ou anexo</p>

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
            <label htmlFor="attachmentName">Anexo (opcional)</label>
            <input
              id="attachmentName"
              className="input"
              value={form.attachmentName}
              onChange={handleChange('attachmentName')}
              placeholder="nome-do-arquivo.pdf"
            />
            <span className="hint">PDF, PNG ou JPG · até 5 MB (upload real fica fora do escopo da Sprint 02)</span>
          </div>

          <div className="nova-opp-divider" />

          {serverError && <p className="field error">{serverError}</p>}

          <div className="nova-opp-actions">
            <span className="hint">RF-30 · campos obrigatórios validados antes do envio</span>
            <div className="nova-opp-buttons">
              <button type="button" className="btn btn-ghost" onClick={() => navigate('/oportunidades')}>
                Cancelar
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleSaveDraft} disabled={saving}>
                Salvar rascunho
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveAndDispatch}
                disabled={saving || alreadyDispatched}
                title={alreadyDispatched ? 'Esta oportunidade já foi disparada' : ''}
              >
                Salvar e disparar
              </button>
            </div>
          </div>
        </form>

        <div className="nova-opp-side">
          <div className="card">
            <h3>Pré-visualização da mensagem</h3>
            <p className="opp-hint">RF-05 · texto enviado pelo fluxo do N8N via WAHA</p>
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
            <p className="opp-hint">RF-31 · o envio exige confirmação explícita</p>
            <ul className="nova-opp-confirm-list">
              <li><span className="dot" style={{ background: 'var(--g600)' }} /> Contatos com opt-in ativo receberão a mensagem</li>
              <li><span className="dot" style={{ background: 'var(--t400)' }} /> Envio imediato após a confirmação</li>
              <li><span className="dot" style={{ background: 'var(--t400)' }} /> O log de entrega é registrado por contato · RF-06</li>
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
