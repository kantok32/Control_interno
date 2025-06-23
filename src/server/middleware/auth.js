import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu-refresh-secreto-super-seguro-cambiar-en-produccion';

// Middleware para verificar token JWT
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verificar que el token existe en la base de datos y está activo
    const [sesiones] = await pool.query(
      'SELECT * FROM sesiones WHERE token = ? AND activo = TRUE AND expira_en > NOW()',
      [token]
    );

    if (sesiones.length === 0) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    // Obtener información del usuario
    const [usuarios] = await pool.query(`
      SELECT u.*, r.nombre as rol_nombre, r.permisos
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.id = ? AND u.activo = TRUE
    `, [decoded.userId]);

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }

    const usuario = usuarios[0];
    usuario.permisos = JSON.parse(usuario.permisos);
    
    req.user = usuario;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido' });
    }
    console.error('Error en autenticación:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar permisos específicos
export const requirePermission = (recurso, accion) => {
  return (req, res, next) => {
    try {
      const permisos = req.user.permisos;
      
      if (!permisos[recurso] || !permisos[recurso].includes(accion)) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: `No tienes permisos para ${accion} en ${recurso}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Error en verificación de permisos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Middleware para verificar rol específico
export const requireRole = (roles) => {
  const rolesArray = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    try {
      if (!rolesArray.includes(req.user.rol_nombre)) {
        return res.status(403).json({ 
          error: 'Acceso denegado',
          message: `Rol requerido: ${rolesArray.join(' o ')}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Error en verificación de rol:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};

// Función para generar tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Función para verificar contraseña
export const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Función para hashear contraseña
export const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Función para registrar actividad de auditoría
export const logAuditoria = async (usuarioId, accion, tablaAfectada, registroId, datosAnteriores, datosNuevos, req) => {
  try {
    await pool.query(`
      INSERT INTO logs_auditoria (
        usuario_id, accion, tabla_afectada, registro_id, 
        datos_anteriores, datos_nuevos, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      usuarioId,
      accion,
      tablaAfectada,
      registroId,
      JSON.stringify(datosAnteriores),
      JSON.stringify(datosNuevos),
      req.ip,
      req.get('User-Agent')
    ]);
  } catch (error) {
    console.error('Error al registrar auditoría:', error);
  }
};

// Función para actualizar último acceso
export const updateLastAccess = async (userId) => {
  try {
    await pool.query(
      'UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error al actualizar último acceso:', error);
  }
};

// Función para manejar intentos fallidos de login
export const handleFailedLogin = async (username) => {
  try {
    await pool.query(`
      UPDATE usuarios 
      SET intentos_fallidos = intentos_fallidos + 1,
          bloqueado_hasta = CASE 
            WHEN intentos_fallidos >= 4 THEN DATE_ADD(NOW(), INTERVAL 30 MINUTE)
            ELSE bloqueado_hasta
          END
      WHERE username = ?
    `, [username]);
  } catch (error) {
    console.error('Error al manejar intento fallido:', error);
  }
};

// Función para resetear intentos fallidos
export const resetFailedAttempts = async (userId) => {
  try {
    await pool.query(
      'UPDATE usuarios SET intentos_fallidos = 0, bloqueado_hasta = NULL WHERE id = ?',
      [userId]
    );
  } catch (error) {
    console.error('Error al resetear intentos fallidos:', error);
  }
}; 