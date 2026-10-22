import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import EsqueciSenha from './pages/EsqueciSenha.jsx';
import RedefinirSenha from './pages/RedefinirSenha.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Oportunidades from './pages/Oportunidades.jsx';
import NovaOportunidade from './pages/NovaOportunidade.jsx';
import ResultadoDisparo from './pages/ResultadoDisparo.jsx';
import Metricas from './pages/Metricas.jsx';
import SobreNos from './pages/SobreNos.jsx';
import Atendimento from './pages/Atendimento.jsx';
import Backups from './pages/Backups.jsx';
import Integracao from './pages/Integracao.jsx';
import PainelEscolar from './pages/PainelEscolar.jsx';
import Escolas from './pages/Escolas.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />

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
          <PrivateRoute roles={['administrador']}>
            <NovaOportunidade />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades/:id/editar"
        element={
          <PrivateRoute roles={['administrador']}>
            <NovaOportunidade />
          </PrivateRoute>
        }
      />

      <Route
        path="/oportunidades/:id/disparo"
        element={
          <PrivateRoute roles={['administrador']}>
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
        path="/atendimento"
        element={
          <PrivateRoute>
            <Atendimento />
          </PrivateRoute>
        }
      />

      <Route
        path="/backups"
        element={
          <PrivateRoute roles={['super_admin']} needsSchool={false}>
            <Backups />
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

      <Route
        path="/integracao"
        element={
          <PrivateRoute>
            <Integracao />
          </PrivateRoute>
        }
      />

      <Route
        path="/escolas"
        element={
          <PrivateRoute roles={['super_admin']} needsSchool={false}>
            <Escolas />
          </PrivateRoute>
        }
      />

      <Route
        path="/sobre"
        element={
          <PrivateRoute needsSchool={false}>
            <SobreNos />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
