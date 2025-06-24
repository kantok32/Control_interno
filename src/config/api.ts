// Configuración de la API según el entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.inversioneshoffmann.cl';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    ROLES: `${API_BASE_URL}/auth/roles`,
    USUARIOS: `${API_BASE_URL}/auth/usuarios`,
    ABOGADOS: `${API_BASE_URL}/auth/usuarios/abogados`,
  },
  CASOS: {
    LIST: `${API_BASE_URL}/casos`,
    CREATE: `${API_BASE_URL}/casos`,
    UPDATE: (id: string) => `${API_BASE_URL}/casos/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/casos/${id}`,
    GET: (id: string) => `${API_BASE_URL}/casos/${id}`,
    DOCUMENTOS: (id: string) => `${API_BASE_URL}/casos/${id}/documentos`,
  },
  PERSONAL: {
    LIST: `${API_BASE_URL}/personal`,
    CREATE: `${API_BASE_URL}/personal`,
    UPDATE: (id: string) => `${API_BASE_URL}/personal/${id}`,
    DELETE: (id: string) => `${API_BASE_URL}/personal/${id}`,
    DOCUMENTOS: (id: string) => `${API_BASE_URL}/personal/${id}/documentos`,
    DOCUMENTO: (personalId: string, docId: string) => `${API_BASE_URL}/personal/${personalId}/documentos/${docId}`,
  },
  DOCUMENTOS: {
    UPLOAD: `${API_BASE_URL}/documentos/upload`,
    LIST: `${API_BASE_URL}/documentos`,
    DOWNLOAD: (id: string) => `${API_BASE_URL}/documentos/${id}/download`,
    DELETE: (id: string) => `${API_BASE_URL}/documentos/${id}`,
  },
  ESTADOS: {
    LIST: `${API_BASE_URL}/estados`,
  },
  FILES: {
    GET: (ruta: string) => `${API_BASE_URL}/${ruta}`,
  }
};

// Función helper para hacer solicitudes autenticadas
export const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Si el token expiró (401), intentar refrescar
  if (response.status === 401 && token) {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          
          // Reintentar la solicitud original con el nuevo token
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          return await fetch(url, {
            ...options,
            headers,
          });
        }
      }
    } catch (error) {
      console.error('Error al refrescar token:', error);
      // Si falla el refresh, redirigir al login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
};

export default API_ENDPOINTS; 