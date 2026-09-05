import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Oportunidades from './pages/Oportunidades.jsx';
import NovaOportunidade from './pages/NovaOportunidade.jsx';
import ResultadoDisparo from './pages/ResultadoDisparo.jsx';
import Metricas from './pages/Metricas.jsx';
import Integracao from './pages/Integracao.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades"
        element={
          <PrivateRoute>
            <Oportunidades />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades/nova"
        element={
          <PrivateRoute>
            <NovaOportunidade />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades/:id/editar"
        element={
          <PrivateRoute>
            <NovaOportunidade />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades/:id/disparo"
        element={
          <PrivateRoute>
            <ResultadoDisparo />
          </PrivateRoute>
        }
      />

      <Route
        path="/metricas"
        element={
          <PrivateRoute>
            <Metricas />
          </PrivateRoute>
        }
      />

      <Route
        path="/integracao"
        element={
          <PrivateRoute>
            <Integracao />
          </PrivateRoute>
        }
      />

      {/* Painel Escolar fica para o merge da Sprint 06 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
