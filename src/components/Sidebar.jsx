import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/oportunidades', label: 'Oportunidades' },
  { to: '/metricas', label: 'Métricas' },
  { to: '/atendimento', label: 'Atendimento' },
  { to: '/painel-escolar', label: 'Painel Escolar' },
  { to: '/integracao', label: 'Integração' },
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
            <span
              key={item.to}
              className="nav-item nav-item-disabled"
              title={item.sprint ? `Disponível na ${item.sprint}` : 'Em breve'}
            >
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
