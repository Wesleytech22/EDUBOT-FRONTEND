import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// RF-20 — bloqueia acesso a quem não está autenticado.
export default function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
