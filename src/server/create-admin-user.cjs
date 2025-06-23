const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: 'config.env' });

async function crearAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'control_interno'
  });

  // Busca el rol ADMIN
  const [roles] = await pool.query("SELECT id FROM roles WHERE nombre = 'ADMIN' LIMIT 1");
  if (roles.length === 0) {
    console.error('No existe el rol ADMIN en la tabla roles.');
    process.exit(1);
  }
  const rolId = roles[0].id;

  // Verifica si ya existe el usuario admin
  const [existentes] = await pool.query("SELECT id FROM usuarios WHERE username = 'admin'");
  if (existentes.length > 0) {
    console.log('El usuario admin ya existe.');
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash('admin', 12);

  await pool.query(
    `INSERT INTO usuarios (username, email, password_hash, nombre_completo, rol_id, activo, intentos_fallidos)
     VALUES (?, ?, ?, ?, ?, 1, 0)`,
    ['admin', 'admin@localhost', passwordHash, 'Administrador Provisional', rolId]
  );

  console.log('Usuario admin/admin creado exitosamente.');
  process.exit(0);
}

crearAdmin(); 