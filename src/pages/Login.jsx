import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/login.css';

const LOGOUT_REASON_MESSAGES = {
  inactivity: 'Sua sessão foi encerrada por inatividade. Faça login novamente.',
  expired: 'Sua sessão expirou. Faça login novamente.',
};

const RESET_SUCCESS_TIMEOUT_MS = 6000;

const RELEASE_NOTES = {
  sprint: 'Sprint 05',
  updatedAt: '21/10/2026',
  note: 'A Sprint 05 é a última etapa do projeto: o que estava previsto para a Sprint 06 (Painel Escolar e Google Sheets) foi antecipado e entregue nesta sprint.',
  shipped: [
    {
      title: 'Segurança · Backups',
      description:
        'Backup diário automático do banco de dados escolar, guardado num banco permanente, com histórico e botão de backup sob demanda para o Administrador da plataforma.',
    },
    {
      title: 'Várias escolas na mesma plataforma',
      description:
        'Nova tela Escolas: o Administrador da plataforma cadastra cada escola e suas contas, e cada escola tem o próprio painel, oportunidades, chatbot e equipe.',
    },
    {
      advancedFrom: 'Sprint 06',
      title: 'Integração com o Google Sheets',
      description:
        'O Administrador conecta a planilha da escola por link ou arquivo CSV, informa aba e intervalo e confere uma prévia da leitura antes de salvar.',
    },
    {
      advancedFrom: 'Sprint 06',
      title: 'Sincronização automática da planilha',
      description:
        'Frequência de sincronização configurável, botão "Sincronizar agora", histórico de sucessos e falhas e aviso da próxima sincronização.',
    },
    {
      advancedFrom: 'Sprint 06',
      title: 'Painel Escolar',
      description:
        'Frequência e situação de cada aluno calculadas pelas presenças e faltas (Regular, Atenção e Risco), com busca, filtros, cartões que seguem os filtros, paginação e exportação em CSV.',
    },
    {
      advancedFrom: 'Sprint 06',
      title: 'Bonificação do aluno pelo Telegram',
      description: 'O aluno ganha 10 pontos ao entrar no bot e 5 pontos por mensagem enviada, visíveis no Painel Escolar.',
    },
    {
      advancedFrom: 'Sprint 06',
      title: 'Resumo do Painel Escolar no Dashboard',
      description: 'Total de alunos, frequência média e quantos estão em risco logo na primeira tela.',
    },
    {
      title: 'Correções',
      description:
        'Login e "Esqueci minha senha" sem diferenciar maiúsculas no e-mail, semanas das Métricas no fuso de Manaus, foto da equipe enviada pelo celular e senha visível no cadastro de contas.',
    },
  ],
  inProgress: [],
  upcoming: [],
  testAccess: [
    { role: 'Administrador da Plataforma', email: 'lumenforgeti@gmail.com', password: '12345678' },
    { role: 'Administrador da Escola', email: 'wealeyr537@gmail.com', password: 'LumenforgeDPTI' },
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
      const loggedUser = await login(email, password);
      // O Administrador da plataforma começa pela lista de escolas.
      navigate(loggedUser?.role === 'super_admin' ? '/escolas' : '/', { replace: true });
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
                    {item.advancedFrom ? (
                      <span className="badge login-release-badge login-release-badge-advanced">
                        Antecipado · {item.advancedFrom}
                      </span>
                    ) : (
                      <span className="badge login-release-badge login-release-badge-new">Novo</span>
                    )}
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

              {RELEASE_NOTES.note && <p className="login-release-notes-note">{RELEASE_NOTES.note}</p>}

              {RELEASE_NOTES.upcoming.length > 0 && (
                <>
                  <p className="login-release-notes-next-label">Próxima sprint</p>
                  <ul className="login-release-notes-next-list">
                    {RELEASE_NOTES.upcoming.map((item) => (
                      <li key={item.title}>
                        <span className="badge login-release-badge login-release-badge-next">{item.sprint}</span>
                        {item.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}

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
            <PasswordInput
              id="password"
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
        </form>
      </section>
    </div>
  );
}
