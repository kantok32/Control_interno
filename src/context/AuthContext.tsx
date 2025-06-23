import React, { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// Interfaz para definir la forma del contexto de autenticación
interface User {
  id: number;
  username: string;
  email: string;
  nombre_completo: string;
  rol: string;
  permisos: {
    usuarios: string[];
    casos: string[];
    documentos: string[];
    configuracion: string[];
    auditoria: string[];
  };
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  // Verificar si hay tokens guardados al cargar la aplicación
  useEffect(() => {
    const savedAccessToken = localStorage.getItem('accessToken');
    const savedRefreshToken = localStorage.getItem('refreshToken');
    const savedUser = localStorage.getItem('user');

    if (savedAccessToken && savedRefreshToken && savedUser) {
      setAccessToken(savedAccessToken);
      setRefreshTokenValue(savedRefreshToken);
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // ---- Función de Login ----
  const login = async (username: string, password: string) => {
    try {
      console.log('Enviando login:', { username, password });
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error de autenticación');
      }

      const data = await response.json();
      
      // Guardar tokens y datos del usuario
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken);
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log('Login exitoso');
    } catch (error) {
      console.error('Error de login:', error);
      throw error;
    }
  };

  // ---- Función de Refresh Token ----
  const refreshToken = async () => {
    if (!refreshTokenValue) {
      throw new Error('No hay refresh token disponible');
    }

    try {
      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Error al refrescar token');
      }

      const data = await response.json();
      
      // Actualizar tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      setAccessToken(data.accessToken);
      setRefreshTokenValue(data.refreshToken);
    } catch (error) {
      console.error('Error al refrescar token:', error);
      throw error;
    }
  };

  // ---- Función de Logout ----
  const logout = async () => {
    try {
      // Intentar hacer logout en el servidor
      if (accessToken) {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Error en logout del servidor:', error);
    } finally {
      // Limpiar datos locales
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      
      setAccessToken(null);
      setRefreshTokenValue(null);
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('Logout exitoso');
    }
  };

  // El valor que será accesible por los componentes hijos
  const value = {
    isAuthenticated,
    user,
    login,
    logout,
    refreshToken,
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