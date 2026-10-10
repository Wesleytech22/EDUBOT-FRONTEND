import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// RF-20 — bloqueia acesso a quem não está autenticado e, quando `roles` é
// informado, restringe a rota por perfil (Administrador x Equipe da Escola).
// Multi-escola: o Administrador da plataforma passa onde o Administrador
// passa, mas as telas de uma escola (needsSchool) exigem que ele tenha
// escolhido qual escola abrir — senão volta para a lista de escolas.
export default function PrivateRoute({ children, roles, needsSchool = true }) {
  const { isAuthenticated, user, isPlatformAdmin, activeSchool } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  const role = user?.role;
  const allowed = !roles || roles.includes(role) || (isPlatformAdmin && roles.includes('administrador'));
  if (!allowed) {
    return <Navigate to={isPlatformAdmin ? '/escolas' : '/'} replace />;
  }
  if (isPlatformAdmin && needsSchool && !activeSchool) {
    return <Navigate to="/escolas" replace />;
  }
  return children;
}
