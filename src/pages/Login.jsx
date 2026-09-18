import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

const LOGOUT_REASON_MESSAGES = {
  inactivity: 'Sua sessão foi encerrada por inatividade. Faça login novamente.',
  expired: 'Sua sessão expirou. Faça login novamente.',
};

const RESET_SUCCESS_TIMEOUT_MS = 6000;

const RELEASE_NOTES = {
  sprint: 'Sprint 03',
  updatedAt: '10/09/2026',
  shipped: [
    {
      title: 'Nova tela "Sobre Nós"',
      description:
        'Conheça a equipe de desenvolvimento do EduBot — foto, cargo e bio de cada integrante, disponível no menu lateral.',
    },
  ],
  inProgress: [
    {
      title: 'Broadcast via WhatsApp',
      description: 'RF-04 a RF-06 · objetivo central desta sprint, ainda em desenvolvimento.',
    },
  ],
  upcoming: [
    { sprint: 'Sprint 04', title: 'Estrela da Cruzeiro na identidade visual do produto' },
    { sprint: 'Sprint 05', title: 'Segurança da informação (backup dos dados escolares)' },
  ],
};

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(Boolean(location.state?.resetSuccess));
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [logoutMessage] = useState(() => {
    const reason = localStorage.getItem('edubot_logout_reason');
    localStorage.removeItem('edubot_logout_reason');
    return LOGOUT_REASON_MESSAGES[reason] || '';
  });

  // Some só temporariamente e não deve reaparecer se o usuário voltar/atualizar
  // a página (o estado de navegação, do contrário, ficaria preso aqui).
  useEffect(() => {
    if (!resetSuccess) return;
    navigate(location.pathname, { replace: true, state: {} });
    const timer = setTimeout(() => setResetSuccess(false), RESET_SUCCESS_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResetSuccess(false);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível entrar. Tente novamente.');
    }
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <h1>EduBot</h1>
        <p>Plataforma web de gestão de oportunidades educacionais e acompanhamento escolar.</p>
        <span className="login-hero-badge">Acesso restrito à equipe da escola</span>

        <div className="login-release-notes">
          <button
            type="button"
            className="login-release-notes-toggle"
            onClick={() => setShowReleaseNotes((v) => !v)}
            aria-expanded={showReleaseNotes}
          >
            {showReleaseNotes ? 'Ocultar' : 'Ver'} novidades da {RELEASE_NOTES.sprint}
          </button>

          {showReleaseNotes && (
            <div className="login-release-notes-panel">
              <div className="login-release-notes-header">
                <strong>Novidades · {RELEASE_NOTES.sprint}</strong>
                <span>Atualizado em {RELEASE_NOTES.updatedAt}</span>
              </div>

              <ul className="login-release-notes-list">
                {RELEASE_NOTES.shipped.map((item) => (
                  <li key={item.title}>
                    <span className="badge login-release-badge login-release-badge-new">Novo</span>
                    <div>
                      <p className="login-release-item-title">{item.title}</p>
                      <p className="login-release-item-desc">{item.description}</p>
                    </div>
                  </li>
                ))}
                {RELEASE_NOTES.inProgress.map((item) => (
                  <li key={item.title}>
                    <span className="badge login-release-badge login-release-badge-progress">Em andamento</span>
                    <div>
                      <p className="login-release-item-title">{item.title}</p>
                      <p className="login-release-item-desc">{item.description}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="login-release-notes-next-label">Próximas sprints</p>
              <ul className="login-release-notes-next-list">
                {RELEASE_NOTES.upcoming.map((item) => (
                  <li key={item.title}>
                    <span className="badge login-release-badge login-release-badge-next">{item.sprint}</span>
                    {item.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Entrar na plataforma</h2>
          <p className="login-subtitle">Use as credenciais fornecidas pelo administrador.</p>

          <div className="field">
            <label htmlFor="email">E-mail institucional</label>
            <input
              id="email"
              className="input"
              type="email"
              placeholder="coordenacao@escola.edu.br"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Link className="login-forgot" to="/esqueci-senha">
            Esqueci minha senha
          </Link>

          {resetSuccess && (
            <p className="field login-error" style={{ color: 'var(--g600)' }}>
              Senha redefinida com sucesso. Entre com a nova senha.
            </p>
          )}
          {logoutMessage && <p className="field login-error">{logoutMessage}</p>}
          {error && <p className="field error login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="login-rf-notes">
            <p>RF-20 · Autenticação com perfis Administrador e Equipe da Escola</p>
            <p>RF-21 · Sessões inativas encerradas e acessos registrados em log</p>
          </div>
        </form>
      </section>
    </div>
  );
}
