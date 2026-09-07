import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api.js';
import '../styles/login.css';

export default function RedefinirSenha() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      navigate('/login', { replace: true, state: { resetSuccess: true } });
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível redefinir a senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="login-screen">
        <section className="login-form-wrap" style={{ width: '100%' }}>
          <div className="login-card">
            <h2>Link inválido</h2>
            <p className="login-subtitle">
              Este link de redefinição está incompleto. Solicite um novo em{' '}
              <Link to="/esqueci-senha">Esqueci minha senha</Link>.
            </p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <section className="login-hero">
        <h1>EduBot</h1>
        <p>Plataforma web de gestão de oportunidades educacionais e acompanhamento escolar.</p>
        <span className="login-hero-badge">Acesso restrito à equipe da escola</span>
      </section>

      <section className="login-form-wrap">
        <form className="login-card" onSubmit={handleSubmit}>
          <h2>Redefinir senha</h2>
          <p className="login-subtitle">Escolha uma nova senha para acessar a plataforma.</p>

          <div className="field">
            <label htmlFor="password">Nova senha</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              id="confirmPassword"
              className="input"
              type="password"
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          {error && <p className="field error login-error">{error}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Salvando…' : 'Redefinir senha'}
          </button>
        </form>
      </section>
    </div>
  );
}
