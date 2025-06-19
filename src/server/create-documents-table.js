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

async function createTables() {
  try {
    // Eliminar la tabla casos si existe (debido a las dependencias)
    await pool.query('DROP TABLE IF EXISTS documentos');
    await pool.query('DROP TABLE IF EXISTS casos');
    await pool.query('DROP TABLE IF EXISTS estados_caso');

    // Crear tabla de estados
    await pool.query(`
      CREATE TABLE IF NOT EXISTS estados_caso (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertar estado inicial
    await pool.query(`
      INSERT INTO estados_caso (nombre, descripcion) 
      VALUES ('CAPTACION', 'Estado inicial de captación del caso')
    `);

    // Crear tabla de casos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS casos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cliente VARCHAR(255) NOT NULL,
        asunto TEXT NOT NULL,
        abogado VARCHAR(100) NOT NULL,
        prioridad ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
        estado VARCHAR(50) NOT NULL,
        fecha_apertura TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (estado) REFERENCES estados_caso(nombre)
      )
    `);

    // Crear tabla de documentos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        caso_id INT NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        tipo VARCHAR(50),
        descripcion TEXT,
        ruta_archivo VARCHAR(255),
        tamano_bytes BIGINT,
        tipo_mime VARCHAR(100),
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        creado_por VARCHAR(100),
        FOREIGN KEY (caso_id) REFERENCES casos(id) ON DELETE CASCADE
      )
    `);

    console.log('Tablas creadas exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al crear las tablas:', error);
    process.exit(1);
  }
}

createTables(); 