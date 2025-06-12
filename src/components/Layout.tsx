import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20
    },
    in: {
        opacity: 1,
        y: 0
    },
    out: {
        opacity: 0,
        y: -20
    }
};

const pageTransition: import('framer-motion').Transition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.4
};

const Layout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  return (
    <div className="container">
      <Sidebar />
      <main className="main-content">
        <AnimatePresence mode="wait">
            <motion.div
                key={location.pathname}
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
            >
                <Outlet />
            </motion.div>
        </AnimatePresence>
      </main>

      <button className="fab">
        <i className="fas fa-comment-dots"></i>
      </button>
    </div>
  );
};

// Componente de Cabecera reutilizable para las páginas
export const PageHeader = ({ title }: { title: string }) => {
  const { logout } = useAuth();

  return (
    <header className="main-header">
      <h2>{title}</h2>
      <div className="user-profile">
        <span>ADMIN</span>
        <span className="email">cla.munozh@inversionashoffmann.cl</span>
        {/* A FUTURO: el botón de logout debería estar en un menú desplegable de perfil */}
        <button onClick={logout} className="logout-icon" style={{background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem'}}>
            <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
  )
}

export default Layout; 