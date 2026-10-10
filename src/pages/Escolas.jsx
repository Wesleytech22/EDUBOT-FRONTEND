import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import '../styles/oportunidades.css';
import '../styles/escolas.css';

const ROLE_LABEL = { administrador: 'Administrador', equipe_escola: 'Equipe da Escola' };
const EMPTY_SCHOOL_FORM = { name: '', adminName: '', adminEmail: '', adminPassword: '' };
const EMPTY_USER_FORM = { name: '', email: '', password: '', role: 'equipe_escola' };

function StatusBadge({ active, on = 'Ativa', off = 'Suspensa' }) {
  return (
    <span
      className="badge"
      style={active ? { background: 'var(--g100)', color: 'var(--g600)' } : { background: 'var(--r100)', color: 'var(--r600)' }}
    >
      {active ? on : off}
    </span>
  );
}

// Contas de acesso de uma escola: o Administrador da plataforma cria contas
// (Administrador ou Equipe da Escola) e ativa/desativa quem não deve mais
// entrar. Não existe autocadastro público (RF-20).
function SchoolAccounts({ school }) {
  const [users, setUsers] = useState(null);
  const [form, setForm] = useState(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/schools/${school.id}/users`);
      setUsers(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar as contas.');
    }
  }, [school.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.post(`/schools/${school.id}/users`, form);
      setForm(EMPTY_USER_FORM);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível criar a conta.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(account) {
    setBusyId(account.id);
    setError('');
    try {
      await api.patch(`/schools/${school.id}/users/${account.id}`, { active: !account.active });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível atualizar a conta.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="sch-accounts">
      {!users ? (
        <p className="opp-hint">Carregando contas…</p>
      ) : (
        <div className="table-scroll">
          <table className="opp-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Situação</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((account) => (
                <tr key={account.id}>
                  <td>{account.name}</td>
                  <td>{account.email}</td>
                  <td>{ROLE_LABEL[account.role]}</td>
                  <td>
                    <StatusBadge active={account.active} off="Desativada" />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => toggleActive(account)}
                      disabled={busyId === account.id}
                    >
                      {account.active ? 'Desativar' : 'Reativar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="sch-user-form" onSubmit={handleCreate}>
        <input
          className="input"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          aria-label="Nome da nova conta"
          required
        />
        <input
          className="input"
          type="email"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          aria-label="E-mail da nova conta"
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Senha inicial (mín. 8)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          aria-label="Senha inicial"
          minLength={8}
          required
        />
        <select
          className="input"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          aria-label="Perfil"
        >
          <option value="equipe_escola">Equipe da Escola</option>
          <option value="administrador">Administrador</option>
        </select>
        <button type="submit" className="btn btn-secondary" disabled={saving}>
          {saving ? 'Criando…' : 'Adicionar conta'}
        </button>
      </form>
      {error && <p className="field error">{error}</p>}
    </div>
  );
}

// Multi-escola — área do Administrador da plataforma: cadastra as escolas
// (já com o primeiro Administrador de cada uma), suspende/reativa, gerencia
// as contas e abre o painel de qualquer escola.
export default function Escolas() {
  const { selectSchool } = useAuth();
  const navigate = useNavigate();

  const [schools, setSchools] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_SCHOOL_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [openAccounts, setOpenAccounts] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/schools');
      setSchools(data.items);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível carregar as escolas.');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccess('');
    try {
      const { data } = await api.post('/schools', {
        name: form.name,
        admin: { name: form.adminName, email: form.adminEmail, password: form.adminPassword },
      });
      setSuccess(`Escola "${data.name}" cadastrada. ${data.admin.email} já pode entrar com a senha inicial.`);
      setForm(EMPTY_SCHOOL_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Não foi possível cadastrar a escola.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleSchool(school) {
    const action = school.active ? 'suspender' : 'reativar';
    if (school.active && !window.confirm(`Suspender "${school.name}"? Ninguém da escola entra e o chatbot dela para de responder.`)) {
      return;
    }
    setBusyId(school.id);
    try {
      await api.patch(`/schools/${school.id}`, { active: !school.active });
      await load();
    } catch (err) {
      setError(err.response?.data?.error || `Não foi possível ${action} a escola.`);
    } finally {
      setBusyId(null);
    }
  }

  function openPanel(school) {
    selectSchool(school);
    navigate('/');
  }

  async function copyLink(school) {
    try {
      await navigator.clipboard.writeText(school.telegramLink);
      setCopiedId(school.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Copie o link do chatbot:', school.telegramLink);
    }
  }

  return (
    <Layout title="Escolas">
      <div className="sch-head">
        <p className="opp-hint">
          Cada escola tem o seu próprio controle: oportunidades, contatos, chatbot, métricas, atendimento e Painel
          Escolar.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? 'Cancelar' : 'Nova escola'}
        </button>
      </div>

      {success && <p className="sch-success">{success}</p>}
      {error && <p className="field error">{error}</p>}

      {showForm && (
        <form className="card sch-form" onSubmit={handleCreate}>
          <h3>Nova escola</h3>
          <div className="field">
            <label htmlFor="schoolName">Nome da escola *</label>
            <input
              id="schoolName"
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex.: E.E. Professora Maria José"
              required
            />
          </div>
          <p className="opp-hint">Primeiro Administrador da escola (a coordenação):</p>
          <div className="sch-form-grid">
            <div className="field">
              <label htmlFor="adminName">Nome *</label>
              <input
                id="adminName"
                className="input"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="adminEmail">E-mail institucional *</label>
              <input
                id="adminEmail"
                className="input"
                type="email"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="adminPassword">Senha inicial *</label>
              <input
                id="adminPassword"
                className="input"
                type="password"
                minLength={8}
                value={form.adminPassword}
                onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                required
              />
              <span className="hint">Mínimo de 8 caracteres. A pessoa pode trocá-la em "Esqueci minha senha".</span>
            </div>
          </div>
          {formError && <p className="field error">{formError}</p>}
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Cadastrando…' : 'Cadastrar escola'}
          </button>
        </form>
      )}

      {!schools && !error && <p className="opp-hint">Carregando…</p>}

      {schools && (
        <div className="sch-list">
          {schools.map((school) => (
            <div className="card sch-card" key={school.id}>
              <div className="sch-card-head">
                <div>
                  <h3>
                    {school.name} <StatusBadge active={school.active} />
                  </h3>
                  <p className="opp-hint">Identificador: {school.slug}</p>
                </div>
                <div className="sch-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => openPanel(school)}
                    disabled={!school.active}
                  >
                    Abrir painel
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setOpenAccounts(openAccounts === school.id ? null : school.id)}
                  >
                    {openAccounts === school.id ? 'Fechar contas' : 'Contas'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => toggleSchool(school)}
                    disabled={busyId === school.id}
                  >
                    {school.active ? 'Suspender' : 'Reativar'}
                  </button>
                </div>
              </div>

              <div className="sch-counts">
                <div>
                  <strong>{school.counts.users}</strong>
                  <span>Contas</span>
                </div>
                <div>
                  <strong>{school.counts.opportunities}</strong>
                  <span>Oportunidades</span>
                </div>
                <div>
                  <strong>{school.counts.contacts}</strong>
                  <span>Contatos inscritos</span>
                </div>
                <div>
                  <strong>{school.counts.students}</strong>
                  <span>Alunos</span>
                </div>
              </div>

              <p className="sch-link">
                Chatbot no Telegram:{' '}
                {school.telegramLink ? (
                  <>
                    <a href={school.telegramLink} target="_blank" rel="noreferrer">
                      {school.telegramLink}
                    </a>
                    <button type="button" className="sch-copy" onClick={() => copyLink(school)}>
                      {copiedId === school.id ? 'Copiado!' : 'Copiar'}
                    </button>
                  </>
                ) : (
                  <span className="opp-hint">bot do Telegram não configurado no servidor</span>
                )}
              </p>

              {openAccounts === school.id && <SchoolAccounts school={school} />}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
