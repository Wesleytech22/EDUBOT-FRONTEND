import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/oportunidades', label: 'Oportunidades' },
  { to: '/metricas', label: 'Métricas' },
  { to: '/painel-escolar', label: 'Painel Escolar' },
  { to: '/integracao', label: 'Integração' },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">EduBot</div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `nav-item${isActive ? ' nav-item-active' : ''}`}
          >
            <span className="dot" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <button type="button" className="sidebar-logout" onClick={logout}>
        Sair
      </button>
    </aside>
  );
}
