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

// Multi-escola — o Administrador da plataforma tem a lista de escolas e os
// backups (que cobrem o banco de todas as escolas) no topo, e só vê os
// módulos de escola depois de abrir uma delas.
const PLATFORM_ITEMS = [
  { to: '/escolas', label: 'Escolas' },
  { to: '/backups', label: 'Backups' },
];
const GLOBAL_PATHS = ['/sobre'];

export default function Sidebar() {
  const { logout, isPlatformAdmin, activeSchool } = useAuth();
  const visibleItems = isPlatformAdmin
    ? [...PLATFORM_ITEMS, ...NAV_ITEMS.filter((item) => activeSchool || GLOBAL_PATHS.includes(item.to))]
    : NAV_ITEMS;

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
