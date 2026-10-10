import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import '../styles/layout.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/oportunidades', label: 'Oportunidades' },
  { to: '/metricas', label: 'Métricas' },
  { to: '/atendimento', label: 'Atendimento' },
  // Módulos ainda não liberados: "sprint" informa no tooltip quando chegam.
  { to: '/painel-escolar', label: 'Painel Escolar', disabled: true, sprint: 'Sprint 05' },
  { to: '/integracao', label: 'Integração', disabled: true, sprint: 'Sprint 05' },
  { to: '/backups', label: 'Backups', roles: ['administrador'] },
  { to: '/sobre', label: 'Sobre Nós' },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">EduBot</div>
      <nav className="sidebar-nav">
        {visibleItems.map((item) =>
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
