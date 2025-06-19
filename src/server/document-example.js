import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../config.env') });

async function documentExample() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '192.140.56.40',
    user: process.env.DB_USER || 'invers26_claudio_m1',
    password: process.env.DB_PASSWORD || 'Ni.co0189',
    database: process.env.DB_NAME || 'invers26_ERP'
  });

  try {
    console.log('=== EJEMPLO DE ALMACENAMIENTO DE DOCUMENTOS ===\n');

    // 1. Insertar un documento de texto (contrato)
    console.log('1. Insertando documento de texto (contrato)...');
    const contratoSQL = `
      INSERT INTO documentos (caso_id, nombre, tipo, descripcion, contenido_texto, creado_por)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const contratoData = [
      'CAS-001',
      'Contrato de Servicios Legales',
      'CONTRATO',
      'Contrato firmado con Corp. Acme para servicios de asesoría legal',
      `CONTRATO DE SERVICIOS LEGALES

ENTRE LAS PARTES:
- Estudio Jurídico Hoffmann (Proveedor)
- Corp. Acme (Cliente)

OBJETO: Asesoría legal en disputa contractual

TÉRMINOS Y CONDICIONES:
1. El proveedor se compromete a brindar asesoría legal especializada
2. Honorarios: $5,000 USD mensuales
3. Duración: 6 meses
4. Confidencialidad: Total

Firmado el 15 de enero de 2023`,
      'Sistema'
    ];
    
    await pool.query(contratoSQL, contratoData);
    console.log('✅ Contrato insertado exitosamente');

    // 2. Insertar una nota de texto
    console.log('\n2. Insertando nota de texto...');
    const notaSQL = `
      INSERT INTO documentos (caso_id, nombre, tipo, descripcion, contenido_texto, creado_por)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    const notaData = [
      'CAS-001',
      'Nota de Reunión - 20/01/2023',
      'NOTA',
      'Notas de la reunión inicial con el cliente',
      `REUNIÓN INICIAL - CASO CORP. ACME
Fecha: 20 de enero de 2023
Asistentes: J. Pérez, Representante de Corp. Acme

PUNTOS TRATADOS:
- Revisión del contrato en disputa
- Identificación de cláusulas problemáticas
- Estrategia de defensa propuesta
- Próximos pasos: Recopilación de evidencia

DECISIONES:
- Proceder con análisis detallado del contrato
- Solicitar documentación adicional al cliente
- Programar reunión de seguimiento en 2 semanas

Notas adicionales: El cliente está muy preocupado por el impacto financiero de la disputa.`,
      'J. Pérez'
    ];
    
    await pool.query(notaSQL, notaData);
    console.log('✅ Nota insertada exitosamente');

    // 3. Insertar un documento con ruta de archivo (simulado)
    console.log('\n3. Insertando documento con ruta de archivo...');
    const archivoSQL = `
      INSERT INTO documentos (caso_id, nombre, tipo, descripcion, ruta_archivo, tamano_bytes, tipo_mime, creado_por)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const archivoData = [
      'CAS-002',
      'Patente Software IA - Documento Principal',
      'EVIDENCIA',
      'Documento principal de la patente para el software de IA',
      '/uploads/patentes/patente-ia-2023.pdf',
      2048576, // 2MB
      'application/pdf',
      'A. Gómez'
    ];
    
    await pool.query(archivoSQL, archivoData);
    console.log('✅ Documento con ruta insertado exitosamente');

    // 4. Mostrar todos los documentos
    console.log('\n4. Mostrando todos los documentos...');
    const [documentos] = await pool.query(`
      SELECT d.*, c.cliente 
      FROM documentos d 
      LEFT JOIN casos c ON d.caso_id = c.id 
      ORDER BY d.fecha_creacion DESC
    `);
    
    console.log('\nDocumentos almacenados:');
    documentos.forEach((doc, index) => {
      console.log(`\n${index + 1}. ${doc.nombre}`);
      console.log(`   Caso: ${doc.caso_id} - ${doc.cliente}`);
      console.log(`   Tipo: ${doc.tipo}`);
      console.log(`   Descripción: ${doc.descripcion}`);
      console.log(`   Tamaño: ${doc.tamano_bytes ? (doc.tamano_bytes / 1024).toFixed(2) + ' KB' : 'Texto'}`);
      console.log(`   Creado: ${doc.fecha_creacion}`);
      console.log(`   Por: ${doc.creado_por}`);
      
      if (doc.contenido_texto) {
        console.log(`   Contenido (primeras 100 chars): ${doc.contenido_texto.substring(0, 100)}...`);
      }
      if (doc.ruta_archivo) {
        console.log(`   Archivo: ${doc.ruta_archivo}`);
      }
    });

    // 5. Ejemplo de búsqueda por tipo
    console.log('\n5. Buscando documentos de tipo CONTRATO...');
    const [contratos] = await pool.query(`
      SELECT nombre, caso_id, fecha_creacion 
      FROM documentos 
      WHERE tipo = 'CONTRATO'
    `);
    
    console.log('Contratos encontrados:');
    console.table(contratos);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

documentExample(); 