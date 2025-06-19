import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../config.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

async function updateDatabase() {
  try {
    // Modificar la tabla casos
    await pool.query(`
      ALTER TABLE casos 
      DROP COLUMN cliente,
      DROP COLUMN asunto,
      ADD COLUMN nombre_completo VARCHAR(255) NOT NULL AFTER id,
      ADD COLUMN fecha_nacimiento DATE NOT NULL AFTER nombre_completo,
      ADD COLUMN rut VARCHAR(12) NOT NULL AFTER fecha_nacimiento,
      ADD COLUMN correo_electronico VARCHAR(255) NOT NULL AFTER rut,
      ADD COLUMN domicilio TEXT NOT NULL AFTER correo_electronico,
      ADD COLUMN tipo_asesoria VARCHAR(255) NOT NULL AFTER domicilio,
      ADD COLUMN situacion_legal BOOLEAN NOT NULL DEFAULT FALSE AFTER tipo_asesoria,
      ADD COLUMN motivo_consulta ENUM('Asesoria judicial', 'Representacion judicial activa', 'Defensa en proceso judicial', 'Mediacion/negociacion', 'Otros') NOT NULL AFTER situacion_legal,
      ADD COLUMN motivo_consulta_otro TEXT AFTER motivo_consulta,
      ADD COLUMN descripcion_asunto TEXT NOT NULL AFTER motivo_consulta_otro,
      ADD COLUMN antecedentes_penales BOOLEAN NOT NULL DEFAULT FALSE AFTER descripcion_asunto;
    `);

    // Agregar la columna telefono si no existe
    await pool.query(`
      ALTER TABLE casos
      ADD COLUMN IF NOT EXISTS telefono VARCHAR(20) DEFAULT NULL
      AFTER correo_electronico
    `);

    console.log('Tabla casos actualizada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al actualizar la base de datos:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateDatabase(); 