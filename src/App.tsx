import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CasosProvider } from './context/CasosContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Casos from './pages/Casos';
import Historial from './pages/Historial';
import Admin from './pages/Admin';
import NuevoCaso from './pages/NuevoCaso';
import { DocumentosCaso } from './pages/DocumentosCaso';

function App() {
  return (
    <AuthProvider>
      <CasosProvider>
        <Routes>
          {/* Ruta pública para el login */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="/casos" element={<Casos />} />
              <Route path="/casos/:id/documentos" element={<DocumentosCaso />} />
              <Route path="/nuevo-caso" element={<NuevoCaso />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>
        </Routes>
      </CasosProvider>
    </AuthProvider>
  );
}

export default App;
