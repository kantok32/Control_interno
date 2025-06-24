// Configuración de la API según el entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://inversioneshoffmann.cl/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ROLES: `${API_BASE_URL}/auth/roles`,
    USUARIOS: `${API_BASE_URL}/auth/usuarios`,
  },
  CASOS: {
    LIST: `${API_BASE_URL}/casos`,
    CREATE: `${API_BASE_URL}/casos`,
    UPDATE: (id: string) => `${API_BASE_URL}/casos/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/casos/${id}`,
  },
  PERSONAL: {
    LIST: `${API_BASE_URL}/personal`,
    CREATE: `${API_BASE_URL}/personal`,
    UPDATE: (id: string) => `${API_BASE_URL}/personal/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/personal/${id}`,
  },
  DOCUMENTOS: {
    UPLOAD: `${API_BASE_URL}/documentos/upload`,
    LIST: `${API_BASE_URL}/documentos`,
    DOWNLOAD: (id: string) => `${API_BASE_URL}/documentos/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/documentos/${id}`,
  }
};

export default API_ENDPOINTS; 