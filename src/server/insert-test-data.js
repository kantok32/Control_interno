import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../config.env') });

async function insertTestData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '192.140.56.40',
    user: process.env.DB_USER || 'invers26_claudio_m1',
    password: process.env.DB_PASSWORD || 'Ni.co0189',
    database: process.env.DB_NAME || 'invers26_ERP'
  });

  const testData = [
    {
      nombre_completo: 'Corp. Acme',
      fecha_nacimiento: '1980-01-15',
      rut: '12345678-9',
      correo_electronico: 'contacto@corpacme.com',
      domicilio: 'Av. Providencia 1234, Santiago',
      tipo_asesoria: 'Civil',
      situacion_legal: false,
      motivo_consulta: 'Asesoria judicial',
      motivo_consulta_otro: null,
      descripcion_asunto: 'Disputa contractual por servicios no prestados.',
      antecedentes_penales: false,
      abogado: 'J. Pérez',
      prioridad: 'Alta',
      estado: 'CAPTACION'
    },
    {
      nombre_completo: 'Innovatech Solutions',
      fecha_nacimiento: '1990-05-20',
      rut: '87654321-0',
      correo_electronico: 'info@innovatech.com',
      domicilio: 'Las Condes 5678, Santiago',
      tipo_asesoria: 'Comercial',
      situacion_legal: false,
      motivo_consulta: 'Representacion judicial activa',
      motivo_consulta_otro: null,
      descripcion_asunto: 'Registro de patente para nuevo software de IA.',
      antecedentes_penales: false,
      abogado: 'A. Gómez',
      prioridad: 'Alta',
      estado: 'CAPTACION'
    },
    {
      nombre_completo: 'Tech Forward Inc.',
      fecha_nacimiento: '1985-08-10',
      rut: '11223344-5',
      correo_electronico: 'legal@techforward.com',
      domicilio: 'Ñuñoa 9012, Santiago',
      tipo_asesoria: 'Laboral',
      situacion_legal: false,
      motivo_consulta: 'Defensa en proceso judicial',
      motivo_consulta_otro: null,
      descripcion_asunto: 'Asesoría laboral para nueva contratación.',
      antecedentes_penales: false,
      abogado: 'M. Rodríguez',
      prioridad: 'Media',
      estado: 'CAPTACION'
    },
    {
      nombre_completo: 'Bienes Raíces Seguros',
      fecha_nacimiento: '1975-12-03',
      rut: '55667788-9',
      correo_electronico: 'admin@bienesraices.com',
      domicilio: 'Providencia 3456, Santiago',
      tipo_asesoria: 'Civil',
      situacion_legal: false,
      motivo_consulta: 'Mediacion/negociacion',
      motivo_consulta_otro: null,
      descripcion_asunto: 'Revisión de contrato de arrendamiento comercial.',
      antecedentes_penales: false,
      abogado: 'C. López',
      prioridad: 'Baja',
      estado: 'CAPTACION'
    },
    {
      nombre_completo: 'Familia Martínez',
      fecha_nacimiento: '1982-03-25',
      rut: '99887766-5',
      correo_electronico: 'martinez@email.com',
      domicilio: 'Las Condes 7890, Santiago',
      tipo_asesoria: 'Familia',
      situacion_legal: false,
      motivo_consulta: 'Asesoria judicial',
      motivo_consulta_otro: null,
      descripcion_asunto: 'Proceso de divorcio y custodia.',
      antecedentes_penales: false,
      abogado: 'S. Fernández',
      prioridad: 'Media',
      estado: 'CAPTACION'
    }
  ];

  try {
    console.log('Insertando datos de prueba...');
    
    for (const caso of testData) {
      const sql = `
        INSERT INTO casos (
          nombre_completo,
          fecha_nacimiento,
          rut,
          correo_electronico,
          domicilio,
          tipo_asesoria,
          situacion_legal,
          motivo_consulta,
          motivo_consulta_otro,
          descripcion_asunto,
          antecedentes_penales,
          abogado,
          prioridad,
          estado
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await pool.query(sql, [
        caso.nombre_completo,
        caso.fecha_nacimiento,
        caso.rut,
        caso.correo_electronico,
        caso.domicilio,
        caso.tipo_asesoria,
        caso.situacion_legal,
        caso.motivo_consulta,
        caso.motivo_consulta_otro,
        caso.descripcion_asunto,
        caso.antecedentes_penales,
        caso.abogado,
        caso.prioridad,
        caso.estado
      ]);
      
      console.log(`✅ Caso ${caso.nombre_completo} insertado exitosamente`);
    }
    
    console.log('\n✅ Todos los datos de prueba han sido insertados');
    
    // Verificar los datos insertados
    const [rows] = await pool.query("SELECT id, nombre_completo, abogado, prioridad, estado, fecha_apertura FROM casos ORDER BY fecha_apertura DESC");
    console.log('\nDatos en la tabla casos:');
    console.table(rows);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

insertTestData(); 