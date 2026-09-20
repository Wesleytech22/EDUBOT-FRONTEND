import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/oportunidades', label: 'Oportunidades' },
  { to: '/metricas', label: 'Métricas', disabled: true },
  { to: '/painel-escolar', label: 'Painel Escolar', disabled: true },
  { to: '/integracao', label: 'Integração', disabled: true },
  { to: '/sobre', label: 'Sobre Nós' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">EduBot</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) =>
          item.disabled ? (
            <span key={item.to} className="nav-item nav-item-disabled" title="Fora do escopo da Sprint 02">
              <span className="dot" />
              {item.label}
            </span>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
            >
              <span className="dot" />
              {item.label}
            </NavLink>
          )
        )}
      </nav>
      <button type="button" className="sidebar-logout" onClick={logout}>
        Sair
      </button>
    </aside>
  );
}
