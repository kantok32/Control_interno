import { PageHeader } from '../components/Layout';

const SettingsPage = () => {
    return (
        <>
            <PageHeader title="Configuración" />
            <div className="admin-main-container">
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
            </div>
        </>
    );
};

export default SettingsPage; 