import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/Layout';
import UserManagement from '../components/UserManagement';

const Admin = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const canManageUsers = user?.permisos.usuarios.includes('leer');

    return (
        <>
            <PageHeader title="Administración" />
            <div className="admin-main-container">
                {/* Tabs de navegación */}
                <div className="admin-tabs-bar">
                    <button 
                        className={`admin-tab-btn${activeTab === 'dashboard' ? ' active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}
                    >
                        <i className="fas fa-tachometer-alt"></i> Dashboard
                    </button>
                    {canManageUsers && (
                        <button 
                            className={`admin-tab-btn${activeTab === 'users' ? ' active' : ''}`}
                            onClick={() => setActiveTab('users')}
                        >
                            <i className="fas fa-users"></i> Gestión de Usuarios
                        </button>
                    )}
                    <button 
                        className={`admin-tab-btn${activeTab === 'settings' ? ' active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <i className="fas fa-cog"></i> Configuración
                    </button>
                </div>

                <div className="admin-content-container">
                    {activeTab === 'dashboard' && (
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
                    )}

                    {activeTab === 'dashboard' && (
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
                    )}

                    {activeTab === 'users' && canManageUsers && (
                        <div className="admin-users-section">
                            <UserManagement />
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="admin-settings-card">
                            <h3>Configuración del Sistema</h3>
                            <div className="settings-section">
                                <div className="setting-item">
                                    <label>Duración de sesión:</label>
                                    <select defaultValue="15">
                                        <option value="15">15 minutos</option>
                                        <option value="30">30 minutos</option>
                                        <option value="60">1 hora</option>
                                    </select>
                                </div>
                                <div className="setting-item">
                                    <label>Intentos máximos de login:</label>
                                    <input type="number" defaultValue="5" min="3" max="10" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Admin; 