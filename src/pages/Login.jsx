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
  updatedAt: '23/09/2026',
  shipped: [
    {
      title: 'Disparo em massa das oportunidades',
      description:
        'O botão Disparar envia a oportunidade para todos os contatos com opt-in, sem editar a mensagem contato a contato.',
    },
    {
      title: 'Nova tela "Resultado do Disparo"',
      description:
        'Enviados, entregues, falhas e taxa de entrega, com o motivo de cada falha e a opção de reenviar só para quem falhou.',
    },
    {
      title: 'Nova tela "Métricas de engajamento"',
      description:
        'Envios por semana e status de entrega consolidado, com filtros por período e por oportunidade.',
    },
    {
      title: 'Status de entrega no Dashboard',
      description: 'Os últimos disparos mostram entregues, falhas e pendentes de cada oportunidade.',
    },
    {
      title: 'Correção na edição de oportunidades',
      description: 'Oportunidades já publicadas voltam a ser salvas com "Salvar alterações", sem virar rascunho.',
    },
  ],
  inProgress: [
    {
      title: 'Entrega das mensagens no celular',
      description: 'O disparo já está pronto; a entrega real aguarda a conexão do número de WhatsApp da escola.',
    },
  ],
  upcoming: [
    { sprint: 'Sprint 04', title: 'Chatbot com opt-in/opt-out e fila de atendimento' },
    { sprint: 'Sprint 04', title: 'Estrela da Cruzeiro na identidade visual do produto' },
    { sprint: 'Sprint 05', title: 'Segurança da informação (backup dos dados escolares)' },
  ],
  testAccess: [
    { role: 'Administrador', email: 'wealeyr537@gmail.com', password: 'LumenforgeDPTI' },
    { role: 'Equipe da Escola', email: 'wealeyr6@gmail.com', password: 'LumenforgeDPTI' },
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
  const [showPassword, setShowPassword] = useState(false);

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

              <p className="login-release-notes-next-label">Acessos para teste do portal</p>
              <ul className="login-release-notes-test-access">
                {RELEASE_NOTES.testAccess.map((item) => (
                  <li key={item.role}>
                    <strong>{item.role}</strong>
                    <span>{item.email} · {item.password}</span>
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
            <div className="password-field">
              <input
                id="password"
                className="input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M3 3l18 18M10.58 10.58a2 2 0 002.83 2.83M9.36 5.11A9.94 9.94 0 0112 5c5 0 9 4.5 10 7-.42 1.13-1.16 2.34-2.17 3.44M6.53 6.53C4.6 7.9 3.08 9.77 2 12c1 2.5 5 7 10 7 1.29 0 2.5-.24 3.6-.67" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
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
        </form>
      </section>
    </div>
  );
}
