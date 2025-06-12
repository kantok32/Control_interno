import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    // A FUTURO: Podrías añadir lógica de roles aquí.
    // Ejemplo:
    // const { user } = useAuth();
    // if (requiredRole && user.role !== requiredRole) {
    //   return <Navigate to="/unauthorized" />;
    // }

    if (!isAuthenticated) {
        // Si el usuario no está autenticado, redirigirlo a la página de login.
        return <Navigate to="/login" />;
    }

    // Si el usuario está autenticado, renderizar el contenido de la ruta solicitada.
    return <Outlet />;
};

export default ProtectedRoute; 