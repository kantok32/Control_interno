import express from 'express';
import mysql from 'mysql2/promise';
import rateLimit from 'express-rate-limit';
import { 
  authenticateToken, 
  requirePermission, 
  requireRole,
  generateTokens,
  verifyPassword,
  hashPassword,
  logAuditoria,
  updateLastAccess,
  handleFailedLogin,
  resetFailedAttempts
} from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

// Rate limiting para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos
  message: { error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== ENDPOINTS DE AUTENTICACIÓN =====

// Login
router.post('/login', loginLimiter, async (req, res) => {
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
      await handleFailedLogin(username);
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
      await handleFailedLogin(username);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar si el usuario está activo
    if (!usuario.activo) {
      return res.status(401).json({ error: 'Cuenta desactivada' });
    }

    // Resetear intentos fallidos
    await resetFailedAttempts(usuario.id);

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

    // Actualizar último acceso
    await updateLastAccess(usuario.id);

    // Registrar auditoría
    await logAuditoria(usuario.id, 'LOGIN', 'usuarios', usuario.id, null, null, req);

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
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Invalidar tokens
    await pool.query(
      'UPDATE sesiones SET activo = FALSE WHERE usuario_id = ? AND token = ?',
      [req.user.id, req.token]
    );

    // Registrar auditoría
    await logAuditoria(req.user.id, 'LOGOUT', 'usuarios', req.user.id, null, null, req);

    res.json({ message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
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

// ===== ENDPOINTS DE GESTIÓN DE USUARIOS =====

// Obtener todos los usuarios (solo ADMIN y SUPER_ADMIN)
router.get('/usuarios', 
  authenticateToken, 
  requireRole(['SUPER_ADMIN', 'ADMIN']), 
  async (req, res) => {
    try {
      const [usuarios] = await pool.query(`
        SELECT 
          u.id, u.username, u.email, u.nombre_completo, u.activo,
          u.ultimo_acceso, u.fecha_creacion, u.fecha_actualizacion,
          r.nombre as rol_nombre, r.descripcion as rol_descripcion,
          c.nombre_completo as creado_por_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        LEFT JOIN usuarios c ON u.creado_por = c.id
        ORDER BY u.fecha_creacion DESC
      `);

      res.json(usuarios);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Crear nuevo usuario (solo SUPER_ADMIN y ADMIN)
router.post('/usuarios', 
  authenticateToken, 
  requireRole(['SUPER_ADMIN', 'ADMIN']),
  async (req, res) => {
    try {
      const { 
        username, 
        email, 
        password, 
        nombre_completo, 
        rol_id 
      } = req.body;

      // Validaciones
      if (!username || !email || !password || !nombre_completo || !rol_id) {
        return res.status(400).json({ error: 'Todos los campos son requeridos' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      }

      // Verificar que el rol existe
      const [roles] = await pool.query('SELECT * FROM roles WHERE id = ?', [rol_id]);
      if (roles.length === 0) {
        return res.status(400).json({ error: 'Rol no válido' });
      }

      // Verificar que el username y email no existan
      const [existentes] = await pool.query(
        'SELECT id FROM usuarios WHERE username = ? OR email = ?',
        [username, email]
      );

      if (existentes.length > 0) {
        return res.status(400).json({ error: 'Username o email ya existe' });
      }

      // Hashear contraseña
      const passwordHash = await hashPassword(password);

      // Crear usuario
      const [result] = await pool.query(`
        INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol_id, creado_por)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [username, email, passwordHash, nombre_completo, rol_id, req.user.id]);

      // Obtener usuario creado
      const [nuevoUsuario] = await pool.query(`
        SELECT 
          u.id, u.username, u.email, u.nombre_completo, u.activo,
          u.fecha_creacion, r.nombre as rol_nombre
        FROM usuarios u
        JOIN roles r ON u.rol_id = r.id
        WHERE u.id = ?
      `, [result.insertId]);

      // Registrar auditoría
      await logAuditoria(req.user.id, 'CREAR_USUARIO', 'usuarios', result.insertId, null, nuevoUsuario[0], req);

      res.status(201).json({
        message: 'Usuario creado exitosamente',
        usuario: nuevoUsuario[0]
      });

    } catch (error) {
      console.error('Error al crear usuario:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

// Obtener roles disponibles
router.get('/roles', 
  authenticateToken, 
  requirePermission('usuarios', 'leer'),
  async (req, res) => {
    try {
      const [roles] = await pool.query(`
        SELECT id, nombre, descripcion, fecha_creacion
        FROM roles
        ORDER BY nombre
      `);

      res.json(roles);
    } catch (error) {
      console.error('Error al obtener roles:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
);

export default router; 