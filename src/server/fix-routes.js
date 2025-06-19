import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../config.env') });

// Función para normalizar rutas de archivos
const normalizeFilePath = (filePath) => {
  if (!filePath) return null;
  
  // Si la ruta contiene rutas absolutas de Windows, extraer solo el nombre del archivo
  if (filePath.includes('C:\\') || filePath.includes('C:/')) {
    // Extraer solo el nombre del archivo de la ruta completa
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
    return `uploads/${fileName}`;
  }
  
  // Si ya es una ruta relativa, mantenerla
  if (filePath.startsWith('uploads/')) {
    return filePath;
  }
  
  // Si no tiene formato conocido, agregar el prefijo uploads/
  return `uploads/${filePath}`;
};

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

async function fixDocumentRoutes() {
  try {
    console.log('🔧 Iniciando corrección de rutas de documentos...');
    
    // Obtener todos los documentos con rutas problemáticas
    const [documentos] = await pool.query(`
      SELECT id, nombre, ruta_archivo 
      FROM documentos 
      WHERE ruta_archivo LIKE 'C:%' 
      OR ruta_archivo LIKE '/C:%'
      OR ruta_archivo LIKE '%\\%'
    `);
    
    console.log(`📊 Encontrados ${documentos.length} documentos para corregir`);
    
    if (documentos.length === 0) {
      console.log('✅ No hay documentos que necesiten corrección');
      return;
    }
    
    const actualizaciones = [];
    
    for (const doc of documentos) {
      try {
        console.log(`\n📄 Procesando documento ${doc.id}: ${doc.nombre}`);
        console.log(`   Ruta actual: ${doc.ruta_archivo}`);
        
        const rutaNormalizada = normalizeFilePath(doc.ruta_archivo);
        console.log(`   Ruta normalizada: ${rutaNormalizada}`);
        
        // Actualizar la ruta en la base de datos
        await pool.query(
          'UPDATE documentos SET ruta_archivo = ? WHERE id = ?',
          [rutaNormalizada, doc.id]
        );
        
        actualizaciones.push({
          id: doc.id,
          nombre: doc.nombre,
          rutaOriginal: doc.ruta_archivo,
          rutaNormalizada
        });
        
        console.log(`   ✅ Documento ${doc.id} actualizado correctamente`);
        
      } catch (docError) {
        console.error(`   ❌ Error al actualizar documento ${doc.id}:`, docError.message);
      }
    }
    
    console.log('\n📋 Resumen de actualizaciones:');
    console.log(`   Total de documentos procesados: ${documentos.length}`);
    console.log(`   Documentos actualizados exitosamente: ${actualizaciones.length}`);
    
    if (actualizaciones.length > 0) {
      console.log('\n📝 Detalles de las actualizaciones:');
      actualizaciones.forEach(update => {
        console.log(`   - ID ${update.id}: "${update.nombre}"`);
        console.log(`     De: ${update.rutaOriginal}`);
        console.log(`     A:  ${update.rutaNormalizada}`);
      });
    }
    
    console.log('\n✅ Proceso de corrección completado');
    
  } catch (error) {
    console.error('❌ Error durante la corrección de rutas:', error);
  } finally {
    await pool.end();
  }
}

// Ejecutar el script
fixDocumentRoutes(); 