import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaTachometerAlt, FaUsers, FaCogs } from 'react-icons/fa';
import logo from '../assets/Logo_hoffmann.negro.png';

const Sidebar = () => {
    const [isAdminOpen, setIsAdminOpen] = useState(false);

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
                    <li className="sidebar-dropdown">
                        <button onClick={() => setIsAdminOpen(!isAdminOpen)}>
                            <i className="fas fa-user-shield"></i> ADMIN <i className={`fas fa-chevron-down arrow ${isAdminOpen ? 'open' : ''}`}></i>
                        </button>
                        {isAdminOpen && (
                            <ul className="sidebar-submenu">
                                <li>
                                    <NavLink to="/admin" end>
                                        <FaTachometerAlt /> Dashboard
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/usuarios">
                                        <FaUsers /> Usuarios
                                    </NavLink>
                                </li>
                                <li>
                                    <NavLink to="/admin/configuracion">
                                        <FaCogs /> Configuración
                                    </NavLink>
                                </li>
                            </ul>
                        )}
                    </li>
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar; 