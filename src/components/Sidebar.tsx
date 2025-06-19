import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import logo from '../assets/Logo_hoffmann.negro.png';

const Sidebar = () => {
  const [showLogs, setShowLogs] = useState(false);
  const [log, setLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckConnection = async () => {
    setLoading(true);
    setShowLogs(true);
    try {
      // Aquí deberías llamar a tu backend para chequear la conexión
      const res = await fetch('http://localhost:3001/api/ping');
      const data = await res.json();
      setLog(data.message || 'Conexión exitosa');
    } catch (error) {
      setLog('Error de conexión a la base de datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseLogs = () => {
    setShowLogs(false);
    setLog(null); // Limpiar el log al cerrar
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Logo Hoffmann" className="sidebar-logo" />
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li><NavLink to="/"><i className="fas fa-tachometer-alt"></i> DASHBOARD</NavLink></li>
          <li><NavLink to="/casos"><i className="fas fa-briefcase"></i> CASOS</NavLink></li>
          <li><NavLink to="/historial"><i className="fas fa-history"></i> HISTORIAL</NavLink></li>
          <li><NavLink to="/admin"><i className="fas fa-user-shield"></i> ADMIN <i className="fas fa-chevron-down arrow"></i></NavLink></li>
          <li><button className="sidebar-log-btn" onClick={handleCheckConnection}><i className="fas fa-database"></i> LOGS</button></li>
        </ul>
      </nav>
      {showLogs && (
        <div className="modal-logs">
          <div className="modal-logs-content">
            <h3>Estado de conexión a la base de datos</h3>
            {loading ? <p>Verificando conexión...</p> : <p>{log}</p>}
            <button onClick={handleCloseLogs}>Cerrar</button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 