import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const ROLE_LABEL = {
  administrador: 'Coordenação · Administrador',
  equipe_escola: 'Coordenação · Equipe da Escola',
};

export default function Topbar({ title }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-profile">
        <span className="avatar-dot" />
        <span>{ROLE_LABEL[user?.role] || 'Equipe da Escola'}</span>
      </div>
    </header>
  );
}
