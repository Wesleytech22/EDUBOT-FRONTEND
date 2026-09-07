import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import '../styles/login.css';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Não foi possível processar o pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
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
          <h2>Esqueci minha senha</h2>
          <p className="login-subtitle">Informe o e-mail institucional para receber o link de redefinição.</p>

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

          {error && <p className="field error login-error">{error}</p>}
          {message && <p className="field login-error" style={{ color: 'var(--g600)' }}>{message}</p>}

          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? 'Enviando…' : 'Enviar link de redefinição'}
          </button>

          <Link to="/login" className="login-forgot">
            Voltar para o login
          </Link>
        </form>
      </section>
    </div>
  );
}
