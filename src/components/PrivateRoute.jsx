import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// RF-20 — bloqueia acesso a quem não está autenticado e, quando `roles` é
// informado, restringe a rota por perfil (Administrador x Equipe da Escola).
export default function PrivateRoute({ children, roles }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
