import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/Layout';

const Admin = () => {
    const { user } = useAuth();

    return (
        <>
            <PageHeader title="Admin Dashboard" />
            <div className="admin-main-container">
                <div className="admin-dashboard-cards">
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <i className="fas fa-user-shield"></i>
                            <span>Rol Actual</span>
                        </div>
                        <div className="admin-card-body">
                            <span className="admin-role-badge">{user?.rol}</span>
                        </div>
                    </div>
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <i className="fas fa-key"></i>
                            <span>Permisos</span>
                        </div>
                        <div className="admin-card-body">
                            <span>{Object.keys(user?.permisos || {}).length} módulos</span>
                        </div>
                    </div>
                    <div className="admin-card">
                        <div className="admin-card-header">
                            <i className="fas fa-clock"></i>
                            <span>Último Acceso</span>
                        </div>
                        <div className="admin-card-body">
                            <span>Hoy</span>
                        </div>
                    </div>
                </div>
                <div className="admin-user-info-card">
                    <h4>Información del Usuario</h4>
                    <div className="admin-user-info-grid">
                        <div>
                            <span className="admin-user-info-label">Nombre:</span>
                            <span>{user?.nombre_completo}</span>
                        </div>
                        <div>
                            <span className="admin-user-info-label">Email:</span>
                            <span>{user?.email}</span>
                        </div>
                        <div>
                            <span className="admin-user-info-label">Usuario:</span>
                            <span>{user?.username}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Admin; 