import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Oportunidades from './pages/Oportunidades.jsx';
import NovaOportunidade from './pages/NovaOportunidade.jsx';
import PainelEscolar from './pages/PainelEscolar.jsx';
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
        path="/painel-escolar"
        element={
          <PrivateRoute>
            <PainelEscolar />
          </PrivateRoute>
        }
      />

      {/* Métricas e Integração ficam na branch feat/sprint05-metricas-integracao */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
