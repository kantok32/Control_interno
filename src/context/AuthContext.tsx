import React, { createContext, useState, useContext, type ReactNode } from 'react';

// Interfaz para definir la forma del contexto de autenticación
interface AuthContextType {
  isAuthenticated: boolean;
  login: (user: string, pass: string) => Promise<void>;
  logout: () => void;
}

// Crear el contexto con un valor inicial por defecto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props para el AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// ---- Proveedor de Autenticación ----
// Este componente envolverá la aplicación y proveerá el contexto.
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  // Estado para rastrear si el usuario está autenticado.
  // En una aplicación real, se inicializaría verificando un token en localStorage.
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // ---- Función de Login Simulada ----
  const login = async (user: string, pass: string) => {
    // A FUTURO: Aquí es donde harías la llamada a tu API de autenticación.
    // Ejemplo:
    // try {
    //   const response = await fetch('/api/login', {
    //     method: 'POST',
    //     body: JSON.stringify({ username, password }),
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    //   if (response.ok) {
    //     const { token } = await response.json();
    //     localStorage.setItem('authToken', token); // Guardar token
    //     setIsAuthenticated(true);
    //   } else {
    //     throw new Error('Credenciales inválidas');
    //   }
    // } catch (error) {
    //   console.error('Error de login:', error);
    // }

    // Lógica de simulación actual:
    if (user === 'admin' && pass === 'admin') {
      setIsAuthenticated(true);
      console.log('Login exitoso');
    } else {
      console.error('Credenciales incorrectas');
      throw new Error('Credenciales incorrectas');
    }
  };

  // ---- Función de Logout ----
  const logout = () => {
    // A FUTURO: Aquí deberías limpiar el token y notificar al backend.
    // localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    console.log('Logout exitoso');
  };

  // El valor que será accesible por los componentes hijos
  const value = {
    isAuthenticated,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ---- Hook Personalizado ----
// Facilita el uso del contexto de autenticación en otros componentes.
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
}; 