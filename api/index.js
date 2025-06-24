const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs').promises;
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();

// Configuración de CORS para permitir Firebase
app.use(cors({
  origin: ['https://controlinterno-83e0a.web.app', 'http://localhost:5173'],
  credentials: true
}));

// Middleware de seguridad
app.use(helmet());
app.use(express.json({ limit: '50mb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});
app.use('/', generalLimiter);

// Configuración de la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambiar-en-produccion';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'tu-refresh-secreto-super-seguro-cambiar-en-produccion';

// Middleware para verificar token JWT
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

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

// Función para generar tokens
const generateTokens = (userId) => {
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
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username y password son requeridos' });
    }

    // Verificar si el usuario está bloqueado
    const [usuarios] = await pool.query(`
      SELECT u.*, r.nombre as rol_nombre, r.permisos
      FROM usuarios u
      JOIN roles r ON u.rol_id = r.id
      WHERE u.username = ?
    `, [username]);

    if (usuarios.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const usuario = usuarios[0];

    // Verificar si está bloqueado
    if (usuario.bloqueado_hasta && new Date() < new Date(usuario.bloqueado_hasta)) {
      return res.status(423).json({ 
        error: 'Cuenta bloqueada temporalmente',
        bloqueado_hasta: usuario.bloqueado_hasta
      });
    }

    // Verificar contraseña
    const passwordValid = await verifyPassword(password, usuario.password_hash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Generar tokens
    const { accessToken, refreshToken } = generateTokens(usuario.id);

    // Guardar tokens en la base de datos
    await pool.query(`
      INSERT INTO sesiones (usuario_id, token, tipo, expira_en, ip_address, user_agent)
      VALUES (?, ?, 'access', DATE_ADD(NOW(), INTERVAL 15 MINUTE), ?, ?),
             (?, ?, 'refresh', DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)
    `, [
      usuario.id, accessToken, req.ip, req.get('User-Agent'),
      usuario.id, refreshToken, req.ip, req.get('User-Agent')
    ]);

    // Preparar respuesta (sin datos sensibles)
    const userResponse = {
      id: usuario.id,
      username: usuario.username,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol_nombre,
      permisos: JSON.parse(usuario.permisos)
    };

    res.json({
      message: 'Login exitoso',
      user: userResponse,
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Logout
app.post('/auth/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidar tokens
    await pool.query(
      'UPDATE sesiones SET activo = FALSE WHERE usuario_id = ? AND token = ?',
      [req.user.id, req.token]
    );

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Refresh token
app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    // Verificar refresh token en la base de datos
    const [sesiones] = await pool.query(
      'SELECT * FROM sesiones WHERE token = ? AND tipo = "refresh" AND activo = TRUE AND expira_en > NOW()',
      [refreshToken]
    );

    if (sesiones.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    // Generar nuevos tokens
    const { accessToken, newRefreshToken } = generateTokens(sesiones[0].usuario_id);

    // Invalidar token anterior y guardar nuevos
    await pool.query(
      'UPDATE sesiones SET activo = FALSE WHERE token = ?',
      [refreshToken]
    );

    await pool.query(`
      INSERT INTO sesiones (usuario_id, token, tipo, expira_en, ip_address, user_agent)
      VALUES (?, ?, 'access', DATE_ADD(NOW(), INTERVAL 15 MINUTE), ?, ?),
             (?, ?, 'refresh', DATE_ADD(NOW(), INTERVAL 7 DAY), ?, ?)
    `, [
      sesiones[0].usuario_id, accessToken, req.ip, req.get('User-Agent'),
      sesiones[0].usuario_id, newRefreshToken, req.ip, req.get('User-Agent')
    ]);

    res.json({
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    console.error('Error en refresh token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener roles
app.get('/auth/roles', authenticateToken, async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT id, nombre, descripcion FROM roles ORDER BY id');
    res.json(roles);
  } catch (error) {
    console.error('Error al obtener roles:', error);
    res.status(500).json({ error: 'Error al obtener roles' });
  }
});

// ===== ENDPOINTS PARA CASOS =====

// Obtener todos los casos
app.get('/casos', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos,
        (SELECT MAX(fecha_creacion) FROM documentos d WHERE d.caso_id = c.id) as ultimo_documento
      FROM casos c 
      ORDER BY c.fecha_apertura DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener casos:', error);
    res.status(500).json({ error: 'Error al obtener los casos' });
  }
});

// ===== ENDPOINTS PARA PERSONAL =====

// Obtener todo el personal
app.get('/personal', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM personal ORDER BY nombre_completo');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ error: 'Error al obtener el personal' });
  }
});

// Endpoint de prueba
app.get('/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente', timestamp: new Date().toISOString() });
});

// Puerto para cPanel (usar el puerto que cPanel asigne)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

module.exports = app; 