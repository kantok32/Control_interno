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
import UserManagementPage from './pages/UserManagementPage';
import SettingsPage from './pages/SettingsPage';
import EditarCasoPage from './pages/EditarCasoPage';
import DocumentacionPersonal from './pages/DocumentacionPersonal';
import Personal from './pages/Personal';
import NuevoPersonal from './pages/NuevoPersonal';
import DocumentosPersonal from './pages/DocumentosPersonal';

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
              <Route path="/casos/nuevo" element={<NuevoCaso />} />
              <Route path="/nuevo-caso" element={<NuevoCaso />} />
              <Route path="/casos/:casoId/documentos" element={<DocumentosCaso />} />
              <Route path="/casos/editar/:id" element={<EditarCasoPage />} />
              <Route path="/historial" element={<Historial />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/usuarios" element={<UserManagementPage />} />
              <Route path="/admin/configuracion" element={<SettingsPage />} />
              <Route path="/documentacion-personal" element={<DocumentacionPersonal />} />
              <Route path="/personal" element={<Personal />} />
              <Route path="/personal/nuevo" element={<NuevoPersonal />} />
              <Route path="/personal/:id/documentos" element={<DocumentosPersonal />} />
            </Route>
          </Route>
        </Routes>
      </CasosProvider>
    </AuthProvider>
  );
}

export default App;
