import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const ROLE_LABEL = {
  super_admin: 'Administrador da plataforma',
  administrador: 'Coordenação · Administrador',
  equipe_escola: 'Coordenação · Equipe da Escola',
};

export default function Topbar({ title }) {
  const { user, activeSchool, isPlatformAdmin, leaveSchool } = useAuth();
  const navigate = useNavigate();

  function handleSwitchSchool() {
    leaveSchool();
    navigate('/escolas');
  }

  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="topbar-right">
        {activeSchool && (
          <div className="topbar-school">
            <span className="topbar-school-name">{activeSchool.name}</span>
            {isPlatformAdmin && (
              <button type="button" className="topbar-switch" onClick={handleSwitchSchool}>
                Trocar escola
              </button>
            )}
          </div>
        )}
        <div className="topbar-profile">
          <span className="avatar-dot" />
          <span>{ROLE_LABEL[user?.role] || 'Equipe da Escola'}</span>
        </div>
      </div>
    </header>
  );
}
