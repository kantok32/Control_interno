import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function testDatabase() {
  const pool = mysql.createPool({
    host: '192.140.56.40',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'invers26_ERP'
  });

  try {
    console.log('Probando conexión a la base de datos...');
    
    // Probar conexión
    const connection = await pool.getConnection();
    console.log('✅ Conexión exitosa a la base de datos');
    
    // Verificar si la tabla casos existe
    const [tables] = await connection.query("SHOW TABLES LIKE 'casos'");
    if (Array.isArray(tables) && tables.length > 0) {
      console.log('✅ La tabla "casos" existe');
      
      // Mostrar estructura de la tabla
      const [columns] = await connection.query("DESCRIBE casos");
      console.log('\nEstructura de la tabla casos:');
      console.table(columns);
      
      // Contar registros
      const [countResult] = await connection.query("SELECT COUNT(*) as total FROM casos");
      const total = (countResult as any)[0].total;
      console.log(`\nTotal de casos en la tabla: ${total}`);
      
      if (total > 0) {
        // Mostrar algunos registros de ejemplo
        const [rows] = await connection.query("SELECT * FROM casos LIMIT 5");
        console.log('\nPrimeros 5 casos:');
        console.table(rows);
      }
    } else {
      console.log('❌ La tabla "casos" no existe');
      console.log('\nCreando la tabla casos...');
      
      const createTableSQL = `
        CREATE TABLE casos (
          id VARCHAR(20) PRIMARY KEY,
          cliente VARCHAR(255) NOT NULL,
          asunto TEXT NOT NULL,
          abogado VARCHAR(255) NOT NULL,
          fecha_apertura DATE NOT NULL,
          fecha_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          prioridad ENUM('Alta', 'Media', 'Baja') DEFAULT 'Media',
          estado ENUM('ACTIVO', 'EN ESPERA', 'CERRADO') DEFAULT 'ACTIVO'
        )
      `;
      
      await connection.query(createTableSQL);
      console.log('✅ Tabla "casos" creada exitosamente');
    }
    
    connection.release();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testDatabase(); 