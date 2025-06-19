import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde el directorio raíz
dotenv.config({ path: join(__dirname, '../../config.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

async function testDatabase() {
  try {
    // Verificar tabla estados_caso
    console.log('\nVerificando tabla estados_caso:');
    const [estadosColumns] = await pool.query("DESCRIBE estados_caso");
    console.table(estadosColumns);

    console.log('\nEstados disponibles:');
    const [estados] = await pool.query("SELECT * FROM estados_caso");
    console.table(estados);

    // Verificar tabla casos
    console.log('\nVerificando tabla casos:');
    const [casosColumns] = await pool.query("DESCRIBE casos");
    console.table(casosColumns);

    // Verificar tabla documentos
    console.log('\nVerificando tabla documentos:');
    const [docsColumns] = await pool.query("DESCRIBE documentos");
    console.table(docsColumns);

    process.exit(0);
  } catch (error) {
    console.error('Error al verificar la base de datos:', error);
    process.exit(1);
  }
}

testDatabase(); 