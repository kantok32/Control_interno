import { NavLink } from 'react-router-dom';
import logo from '../assets/Logo_hoffmann.negro.png';

const Sidebar = () => {
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
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar; 