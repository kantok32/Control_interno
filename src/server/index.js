import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import fs from 'fs/promises';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import { authenticateToken, requirePermission, logAuditoria } from './middleware/auth.js';
import personalRoutes from './routes/personal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Función para normalizar rutas de archivos
const normalizePath = (filePath) => {
  if (!filePath) return '';
  
  // Si la ruta es absoluta de Windows, extraer solo el nombre del archivo
  if (filePath.includes('C:\\') || filePath.includes('C:/')) {
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
    return `uploads/${fileName}`;
  }
  
  // Si ya es una ruta relativa con uploads/, mantenerla
  if (filePath.startsWith('uploads/')) {
    return filePath;
  }
  
  // Si no tiene formato conocido, agregar el prefijo uploads/
  return `uploads/${filePath}`;
};

// Función para obtener la ruta completa del archivo en el servidor
const getServerFilePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return join(__dirname, '../../', normalizedPath);
};

// Configurar multer para el manejo de archivos
const storage = multer.diskStorage({
  destination: async function (req, file, cb) {
    const uploadDir = join(__dirname, '../../uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: function (req, file, cb) {
    // Aquí puedes agregar validación de tipos de archivo si lo necesitas
    cb(null, true);
  }
});

dotenv.config({ path: join(__dirname, '../../config.env') });

const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por ventana
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' }
});
app.use('/api/', generalLimiter);

app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(join(__dirname, '../../uploads')));

// Rutas de autenticación (sin autenticación requerida)
app.use('/api/auth', authRoutes);
app.use('/api/personal', personalRoutes);

// Crear nuevo personal
app.post('/api/personal', async (req, res) => {
  try {
    const {
      nombre,
      tipo_contrato,
      prevision,
      afp,
      sueldo_bruto,
      sueldo_liquido,
      inicio_contrato,
      termino_contrato,
      bono_incorporacion
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO personal_documentacion 
      (nombre, tipo_contrato, prevision, afp, sueldo_bruto, sueldo_liquido, inicio_contrato, termino_contrato, bono_incorporacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, tipo_contrato, prevision, afp, sueldo_bruto, sueldo_liquido, inicio_contrato, termino_contrato, bono_incorporacion]
    );

    res.status(201).json({ id: result.insertId, message: 'Personal creado correctamente' });
  } catch (error) {
    console.error('Error al crear personal:', error);
    res.status(500).json({ error: 'Error al crear personal' });
  }
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

export { pool };

// ===== ENDPOINTS PARA ESTADOS =====

// Obtener estados disponibles
app.get('/api/estados', async (req, res) => {
  try {
    console.log('Obteniendo estados disponibles...');
    const [estados] = await pool.query('SELECT nombre, descripcion FROM estados_caso ORDER BY id');
    console.log('Estados encontrados:', estados);
    res.json(estados);
  } catch (error) {
    console.error('Error al obtener estados:', error);
    res.status(500).json({ error: 'Error al obtener los estados' });
  }
});

// ===== ENDPOINTS PARA CASOS =====

// Obtener todos los casos con estadísticas de documentos
app.get('/api/casos', async (req, res) => {
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

// Crear un nuevo caso
app.post('/api/casos', async (req, res) => {
  try {
    const { 
      nombre_completo,
      fecha_nacimiento,
      rut,
      correo_electronico,
      telefono,
      domicilio,
      tipo_asesoria,
      situacion_legal,
      motivo_consulta,
      motivo_consulta_otro,
      descripcion_asunto,
      antecedentes_penales,
      abogado,
      prioridad,
      estado,
      rit
    } = req.body;
    
    // Todos los campos son opcionales - no hay validaciones estrictas
    const fecha_apertura = new Date().toISOString().slice(0, 19).replace('T', ' ');
    
    // Limpiar el RUT para dejar solo números si existe
    const rutLimpio = rut ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : null;
    
    // Si se proporciona un estado, verificar que existe
    if (estado) {
      const [estados] = await pool.query('SELECT nombre FROM estados_caso WHERE nombre = ?', [estado]);
      if (estados.length === 0) {
        return res.status(400).json({ error: 'El estado especificado no es válido' });
      }
    }
    
    const sql = `
      INSERT INTO casos (
        nombre_completo,
        fecha_nacimiento,
        rut,
        correo_electronico,
        telefono,
        domicilio,
        tipo_asesoria,
        situacion_legal,
        motivo_consulta,
        motivo_consulta_otro,
        descripcion_asunto,
        antecedentes_penales,
        abogado,
        prioridad,
        estado,
        rit,
        fecha_apertura
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
      nombre_completo || null,
      fecha_nacimiento || null,
      rutLimpio,
      correo_electronico || null,
      telefono || null,
      domicilio || null,
      tipo_asesoria || null,
      situacion_legal || false,
      motivo_consulta || null,
      motivo_consulta_otro || null,
      descripcion_asunto || null,
      antecedentes_penales || false,
      abogado || null,
      prioridad || 'Media',
      estado || null,
      rit || null,
      fecha_apertura
    ]);
    
    // Obtener el caso creado
    const [nuevoCaso] = await pool.query('SELECT * FROM casos WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      id: result.insertId, 
      caso: nuevoCaso[0],
      message: 'Caso creado exitosamente' 
    });
  } catch (error) {
    console.error('Error al crear caso:', error);
    res.status(500).json({ error: 'Error al crear el caso' });
  }
});

// Obtener un caso específico con sus documentos
app.get('/api/casos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información del caso
    const [casos] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos,
        (SELECT MAX(fecha_creacion) FROM documentos d WHERE d.caso_id = c.id) as ultimo_documento
      FROM casos c
      WHERE c.id = ?
    `, [id]);
    
    if (casos.length === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }
    
    // Obtener documentos del caso
    const [documentos] = await pool.query(`
      SELECT id, nombre, tipo, descripcion, ruta_archivo, tamano_bytes, tipo_mime, 
             fecha_creacion, fecha_actualizacion, creado_por
      FROM documentos 
      WHERE caso_id = ? 
      ORDER BY fecha_creacion DESC
    `, [id]);
    
    // Obtener estadísticas de documentos por tipo
    const [statsPorTipo] = await pool.query(`
      SELECT tipo, COUNT(*) as cantidad
      FROM documentos 
      WHERE caso_id = ?
      GROUP BY tipo
    `, [id]);
    
    res.json({
      caso: casos[0],
      documentos,
      estadisticas: {
        total_documentos: documentos.length,
        por_tipo: statsPorTipo
      }
    });
  } catch (error) {
    console.error('Error al obtener caso:', error);
    res.status(500).json({ error: 'Error al obtener el caso' });
  }
});

// Actualizar un caso existente
app.put('/api/casos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre_completo,
      fecha_nacimiento,
      rut,
      correo_electronico,
      telefono,
      domicilio,
      tipo_asesoria,
      situacion_legal,
      motivo_consulta,
      motivo_consulta_otro,
      descripcion_asunto,
      antecedentes_penales,
      abogado,
      prioridad,
      estado,
      rit
    } = req.body;

    // Validar campos requeridos
    const camposRequeridos = {
      nombre_completo: 'Nombre completo',
      fecha_nacimiento: 'Fecha de nacimiento',
      rut: 'RUT',
      correo_electronico: 'Correo electrónico',
      telefono: 'Teléfono',
      domicilio: 'Domicilio',
      tipo_asesoria: 'Tipo de asesoría',
      motivo_consulta: 'Motivo de consulta',
      descripcion_asunto: 'Descripción del asunto',
      abogado: 'Abogado',
      prioridad: 'Prioridad',
      estado: 'Estado',
      rit: 'RIT'
    };
    
    const camposFaltantes = [];
    for (const [campo, nombre] of Object.entries(camposRequeridos)) {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        camposFaltantes.push(nombre);
      }
    }
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({ 
        error: 'Campos requeridos faltantes', 
        camposFaltantes,
        message: `Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`
      });
    }

    // Limpiar el RUT
    const rutLimpio = rut ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : null;

    const query = `
      UPDATE casos 
      SET 
        nombre_completo = ?,
        fecha_nacimiento = ?,
        rut = ?,
        correo_electronico = ?,
        telefono = ?,
        domicilio = ?,
        tipo_asesoria = ?,
        situacion_legal = ?,
        motivo_consulta = ?,
        motivo_consulta_otro = ?,
        descripcion_asunto = ?,
        antecedentes_penales = ?,
        abogado = ?,
        prioridad = ?,
        estado = ?,
        rit = ?,
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await pool.query(query, [
      nombre_completo,
      fecha_nacimiento,
      rutLimpio,
      correo_electronico,
      telefono,
      domicilio,
      tipo_asesoria,
      situacion_legal ? 1 : 0,
      motivo_consulta,
      motivo_consulta_otro,
      descripcion_asunto,
      antecedentes_penales ? 1 : 0,
      abogado,
      prioridad,
      estado,
      rit,
      id
    ]);

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    // Obtener el caso actualizado con todos sus datos
    const [casoActualizado] = await pool.query(`
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos,
        (SELECT MAX(fecha_creacion) FROM documentos d WHERE d.caso_id = c.id) as ultimo_documento
      FROM casos c
      WHERE c.id = ?
    `, [id]);

    res.json(casoActualizado[0]);
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    res.status(500).json({ error: 'Error al actualizar el caso' });
  }
});

// Eliminar un caso por ID
app.delete('/api/casos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Verificar si el caso existe
    const [casos] = await pool.query('SELECT * FROM casos WHERE id = ?', [id]);
    if (!casos || casos.length === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }
    // Eliminar documentos asociados
    await pool.query('DELETE FROM documentos WHERE caso_id = ?', [id]);
    // Eliminar el caso
    await pool.query('DELETE FROM casos WHERE id = ?', [id]);
    res.json({ message: 'Caso y documentos asociados eliminados exitosamente' });
  } catch (error) {
    console.error('Error al eliminar caso:', error);
    res.status(500).json({ error: 'Error al eliminar el caso' });
  }
});

// ===== ENDPOINTS PARA DOCUMENTOS =====

// Endpoint para actualizar rutas de documentos (DEBE IR ANTES DE LA RUTA CON PARÁMETRO)
app.get('/api/documentos/actualizar-rutas', async (req, res) => {
  try {
    console.log('🔧 Iniciando actualización de rutas de documentos...');
    
    // Obtener todos los documentos con rutas absolutas
    const [documentos] = await pool.query(`
      SELECT id, nombre, ruta_archivo 
      FROM documentos 
      WHERE ruta_archivo LIKE 'C:%' 
      OR ruta_archivo LIKE '/C:%'
      OR ruta_archivo LIKE '%\\%'
    `);
    
    console.log(`📊 Encontrados ${documentos.length} documentos para actualizar`);
    
    if (documentos.length === 0) {
      return res.json({ 
        message: 'No hay documentos que necesiten corrección',
        total: 0,
        actualizados: 0
      });
    }
    
    const actualizaciones = [];
    
    for (const doc of documentos) {
      try {
        console.log(`📄 Procesando documento ${doc.id}: ${doc.nombre}`);
        console.log(`   Ruta actual: ${doc.ruta_archivo}`);
        
        const rutaNormalizada = normalizePath(doc.ruta_archivo);
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
    
    res.json({ 
      message: 'Proceso de actualización completado',
      actualizaciones,
      total: documentos.length,
      actualizados: actualizaciones.length
    });
  } catch (error) {
    console.error('❌ Error durante la corrección de rutas:', error);
    res.status(500).json({ 
      error: 'Error al actualizar las rutas',
      details: error.message
    });
  }
});

// Endpoint para obtener un documento específico
app.get('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, c.nombre_completo as cliente, c.descripcion_asunto as asunto
      FROM documentos d
      LEFT JOIN casos c ON d.caso_id = c.id
      WHERE d.id = ?
    `, [id]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener documento:', error);
    res.status(500).json({ error: 'Error al obtener el documento' });
  }
});

// Endpoint para descargar documentos
app.get('/api/documentos/:id/download', async (req, res) => {
  try {
    console.log('Solicitud de descarga recibida para documento ID:', req.params.id);
    
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM documentos WHERE id = ?', [id]);

    console.log('Resultado de consulta a BD:', rows);

    if (!rows || rows.length === 0) {
      console.log('Documento no encontrado en BD para ID:', id);
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const documento = rows[0];
    console.log('Documento encontrado:', {
      id: documento.id,
      nombre: documento.nombre,
      ruta_archivo: documento.ruta_archivo
    });

    if (!documento.ruta_archivo) {
      console.log('No hay ruta de archivo asociada al documento');
      return res.status(404).json({ error: 'No hay archivo asociado a este documento' });
    }

    // Normalizar la ruta del archivo
    const filePath = getServerFilePath(documento.ruta_archivo);
    console.log('Ruta del archivo:', {
      original: documento.ruta_archivo,
      normalizada: normalizePath(documento.ruta_archivo),
      completa: filePath
    });

    try {
      // Verificar si el archivo existe
      await fs.access(filePath);
      console.log('Archivo encontrado en el sistema de archivos');
      
      // Enviar el archivo
      res.download(filePath, documento.nombre, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error al enviar el archivo' });
          }
        } else {
          console.log('Archivo enviado exitosamente');
        }
      });
    } catch (error) {
      console.error('Error al acceder al archivo:', error);
      res.status(404).json({ 
        error: 'Archivo no encontrado en el servidor',
        ruta: documento.ruta_archivo,
        rutaNormalizada: normalizePath(documento.ruta_archivo),
        rutaCompleta: filePath
      });
    }
  } catch (error) {
    console.error('Error en el endpoint de descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener documentos de un caso específico
app.get('/api/casos/:casoId/documentos', async (req, res) => {
  try {
    const { casoId } = req.params;
    const { tipo, fecha_desde, fecha_hasta, orden = 'fecha_creacion', direccion = 'DESC' } = req.query;
    
    let sql = `
      SELECT id, nombre, tipo, descripcion, ruta_archivo, tamano_bytes, tipo_mime, 
             fecha_creacion, fecha_actualizacion, creado_por
      FROM documentos 
      WHERE caso_id = ?
    `;
    
    const params = [casoId];
    
    // Filtros
    if (tipo) {
      sql += ' AND tipo = ?';
      params.push(tipo);
    }
    
    if (fecha_desde) {
      sql += ' AND fecha_creacion >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      sql += ' AND fecha_creacion <= ?';
      params.push(fecha_hasta);
    }
    
    // Ordenamiento
    sql += ` ORDER BY ${orden} ${direccion}`;
    
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: 'Error al obtener los documentos' });
  }
});

// Crear un nuevo documento
app.post('/api/documentos', upload.single('archivo'), async (req, res) => {
  try {
    console.log('Datos recibidos en /api/documentos:', {
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    
    const { caso_id, nombre, tipo, descripcion } = req.body;
    const archivo = req.file;
    
    // Validar campos requeridos
    if (!caso_id) {
      return res.status(400).json({ error: 'caso_id es requerido' });
    }
    if (!nombre) {
      return res.status(400).json({ error: 'nombre es requerido' });
    }
    if (!archivo) {
      return res.status(400).json({ error: 'archivo es requerido' });
    }
    
    // Verificar que el caso existe
    const [casos] = await pool.query('SELECT id FROM casos WHERE id = ?', [caso_id]);
    if (casos.length === 0) {
      // Si el archivo se subió, eliminarlo
      if (archivo) {
        await fs.unlink(archivo.path);
      }
      return res.status(400).json({ error: 'El caso especificado no existe' });
    }
    
    const sql = `
      INSERT INTO documentos (
        caso_id, 
        nombre, 
        tipo, 
        descripcion, 
        ruta_archivo, 
        tamano_bytes, 
        tipo_mime
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
      caso_id,
      nombre,
      tipo || archivo.mimetype,
      descripcion || '',
      archivo ? archivo.path : null,
      archivo ? archivo.size : null,
      archivo ? archivo.mimetype : null
    ]);
    
    // Obtener el documento creado
    const [nuevoDoc] = await pool.query('SELECT * FROM documentos WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      id: result.insertId, 
      documento: nuevoDoc[0],
      message: 'Documento creado exitosamente' 
    });
  } catch (error) {
    // Si hay error y el archivo se subió, eliminarlo
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo temporal:', unlinkError);
      }
    }
    console.error('Error al crear documento:', error);
    res.status(500).json({ error: 'Error al crear el documento' });
  }
});

// Endpoint para subir documentos (alias del endpoint anterior)
app.post('/api/documentos/upload', upload.single('archivo'), async (req, res) => {
  try {
    console.log('Datos recibidos en /api/documentos/upload:', {
      body: req.body,
      file: req.file,
      headers: req.headers
    });
    
    const { caso_id, nombre, tipo, descripcion } = req.body;
    const archivo = req.file;
    
    // Validar campos requeridos
    if (!caso_id) {
      return res.status(400).json({ error: 'caso_id es requerido' });
    }
    if (!nombre) {
      return res.status(400).json({ error: 'nombre es requerido' });
    }
    if (!archivo) {
      return res.status(400).json({ error: 'archivo es requerido' });
    }
    
    // Verificar que el caso existe
    const [casos] = await pool.query('SELECT id FROM casos WHERE id = ?', [caso_id]);
    if (casos.length === 0) {
      // Si el archivo se subió, eliminarlo
      if (archivo) {
        await fs.unlink(archivo.path);
      }
      return res.status(400).json({ error: 'El caso especificado no existe' });
    }
    
    const sql = `
      INSERT INTO documentos (
        caso_id, 
        nombre, 
        tipo, 
        descripcion, 
        ruta_archivo, 
        tamano_bytes, 
        tipo_mime
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.query(sql, [
      caso_id,
      nombre,
      tipo || archivo.mimetype,
      descripcion || '',
      archivo ? archivo.path : null,
      archivo ? archivo.size : null,
      archivo ? archivo.mimetype : null
    ]);
    
    // Obtener el documento creado
    const [nuevoDoc] = await pool.query('SELECT * FROM documentos WHERE id = ?', [result.insertId]);
    
    res.status(201).json({ 
      id: result.insertId, 
      documento: nuevoDoc[0],
      message: 'Documento subido exitosamente' 
    });
  } catch (error) {
    // Si hay error y el archivo se subió, eliminarlo
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        console.error('Error al eliminar archivo temporal:', unlinkError);
      }
    }
    console.error('Error al subir documento:', error);
    res.status(500).json({ error: 'Error al subir el documento' });
  }
});

// Actualizar un documento
app.put('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tipo, descripcion, contenido_texto } = req.body;
    
    const sql = `
      UPDATE documentos 
      SET nombre = ?, tipo = ?, descripcion = ?, contenido_texto = ?, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    const [result] = await pool.query(sql, [nombre, tipo, descripcion, contenido_texto, id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    // Obtener el documento actualizado
    const [docActualizado] = await pool.query('SELECT * FROM documentos WHERE id = ?', [id]);
    
    res.json({ 
      documento: docActualizado[0],
      message: 'Documento actualizado exitosamente' 
    });
  } catch (error) {
    console.error('Error al actualizar documento:', error);
    res.status(500).json({ error: 'Error al actualizar el documento' });
  }
});

// Eliminar un documento
app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    res.json({ message: 'Documento eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

// ===== ENDPOINTS DE CONSULTAS AVANZADAS =====

// Búsqueda global de documentos
app.get('/api/documentos/buscar', async (req, res) => {
  try {
    const { q, tipo, fecha_desde, fecha_hasta, caso_id } = req.query;
    
    let sql = `
      SELECT d.*, c.nombre_completo, c.descripcion_asunto
      FROM documentos d
      LEFT JOIN casos c ON d.caso_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (q) {
      sql += ' AND (d.nombre LIKE ? OR d.descripcion LIKE ? OR d.contenido_texto LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (tipo) {
      sql += ' AND d.tipo = ?';
      params.push(tipo);
    }
    
    if (caso_id) {
      sql += ' AND d.caso_id = ?';
      params.push(caso_id);
    }
    
    if (fecha_desde) {
      sql += ' AND d.fecha_creacion >= ?';
      params.push(fecha_desde);
    }
    
    if (fecha_hasta) {
      sql += ' AND d.fecha_creacion <= ?';
      params.push(fecha_hasta);
    }
    
    sql += ' ORDER BY d.fecha_creacion DESC';
    
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en búsqueda de documentos:', error);
    res.status(500).json({ error: 'Error en la búsqueda' });
  }
});

// Estadísticas generales
app.get('/api/estadisticas', async (req, res) => {
  try {
    // Estadísticas de casos
    const [statsCasos] = await pool.query(`
      SELECT 
        COUNT(*) as total_casos,
        COUNT(CASE WHEN estado = 'CAPTACION' THEN 1 END) as casos_captacion,
        COUNT(CASE WHEN estado = 'EN PROCESO' THEN 1 END) as casos_en_proceso,
        COUNT(CASE WHEN estado = 'CERRADO' THEN 1 END) as casos_cerrados
      FROM casos
    `);
    
    // Estadísticas de documentos
    const [statsDocumentos] = await pool.query(`
      SELECT 
        COUNT(*) as total_documentos,
        COUNT(CASE WHEN tipo = 'CONTRATO' THEN 1 END) as contratos,
        COUNT(CASE WHEN tipo = 'EVIDENCIA' THEN 1 END) as evidencias,
        COUNT(CASE WHEN tipo = 'NOTA' THEN 1 END) as notas,
        COUNT(CASE WHEN tipo = 'RESOLUCION' THEN 1 END) as resoluciones
      FROM documentos
    `);
    
    // Documentos recientes
    const [documentosRecientes] = await pool.query(`
      SELECT d.nombre, d.tipo, d.fecha_creacion, c.nombre_completo, c.id as caso_id
      FROM documentos d
      LEFT JOIN casos c ON d.caso_id = c.id
      ORDER BY d.fecha_creacion DESC
      LIMIT 10
    `);
    
    // Casos con más documentos
    const [casosTopDocumentos] = await pool.query(`
      SELECT 
        c.id, 
        c.nombre_completo, 
        (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos
      FROM casos c
      HAVING total_documentos > 0
      ORDER BY total_documentos DESC
      LIMIT 5
    `);
    
    res.json({
      casos: statsCasos[0],
      documentos: statsDocumentos[0],
      documentos_recientes: documentosRecientes,
      casos_top_documentos: casosTopDocumentos
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

// ===== ENDPOINT DE SALUD =====
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected'
  });
});

// Crear un nuevo caso
app.post('/api/casos/crear', upload.array('archivos'), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insertar el caso
    const { 
      nombre_completo,
      fecha_nacimiento,
      rut,
      correo_electronico,
      telefono,
      domicilio,
      tipo_asesoria,
      situacion_legal,
      motivo_consulta,
      motivo_consulta_otro,
      descripcion_asunto,
      antecedentes_penales,
      abogado,
      prioridad,
      estado,
      rit
    } = req.body;

    // Validar campos requeridos
    const camposRequeridos = {
      nombre_completo: 'Nombre completo',
      fecha_nacimiento: 'Fecha de nacimiento',
      rut: 'RUT',
      correo_electronico: 'Correo electrónico',
      telefono: 'Teléfono',
      domicilio: 'Domicilio',
      tipo_asesoria: 'Tipo de asesoría',
      motivo_consulta: 'Motivo de consulta',
      descripcion_asunto: 'Descripción del asunto',
      abogado: 'Abogado',
      prioridad: 'Prioridad',
      estado: 'Estado',
      rit: 'RIT'
    };
    
    const camposFaltantes = [];
    for (const [campo, nombre] of Object.entries(camposRequeridos)) {
      if (!req.body[campo] || req.body[campo].toString().trim() === '') {
        camposFaltantes.push(nombre);
      }
    }
    
    if (camposFaltantes.length > 0) {
      return res.status(400).json({ 
        error: 'Campos requeridos faltantes', 
        camposFaltantes,
        message: `Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`
      });
    }

    const fecha_apertura = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // Limpiar el RUT para dejar solo números
    const rutLimpio = rut ? rut.replace(/[^0-9kK]/g, '').toUpperCase() : null;

    const [casoResult] = await connection.query(
      `INSERT INTO casos (
        nombre_completo,
        fecha_nacimiento,
        rut,
        correo_electronico,
        telefono,
        domicilio,
        tipo_asesoria,
        situacion_legal,
        motivo_consulta,
        motivo_consulta_otro,
        descripcion_asunto,
        antecedentes_penales,
        abogado,
        prioridad,
        estado,
        rit,
        fecha_apertura
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nombre_completo,
        fecha_nacimiento,
        rutLimpio,
        correo_electronico,
        telefono,
        domicilio,
        tipo_asesoria,
        situacion_legal,
        motivo_consulta,
        motivo_consulta_otro,
        descripcion_asunto,
        antecedentes_penales,
        abogado,
        prioridad,
        estado,
        rit,
        fecha_apertura
      ]
    );
    const casoId = casoResult.insertId;

    // Procesar archivos adjuntos si existen
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        await connection.query(
          `INSERT INTO documentos (
            caso_id, 
            nombre, 
            tipo, 
            descripcion, 
            ruta_archivo, 
            tamano_bytes, 
            tipo_mime, 
            creado_por
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            casoId,
            file.originalname,
            'EVIDENCIA',
            'Archivo adjunto al crear el caso',
            file.filename,
            file.size,
            file.mimetype,
            'Sistema'
          ]
        );
      }
    }

    await connection.commit();
    
    // Obtener el caso creado con sus documentos
    const [caso] = await connection.query(
      `SELECT 
         c.*, 
         (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos
       FROM casos c 
       WHERE c.id = ?`,
      [casoId]
    );

    res.status(201).json({ 
      message: 'Caso creado exitosamente',
      caso: caso[0],
      archivosAdjuntos: req.files ? req.files.length : 0
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear caso:', error);
    // Si hay error, eliminar los archivos subidos
    if (req.files) {
      for (const file of req.files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Error al eliminar archivo:', unlinkError);
        }
      }
    }
    res.status(500).json({ error: 'Error al crear el caso' });
  } finally {
    connection.release();
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📊 Endpoints disponibles:`);
  console.log(`   GET  /api/casos - Listar casos con estadísticas`);
  console.log(`   GET  /api/casos/:id - Obtener caso específico con documentos`);
  console.log(`   GET  /api/casos/:casoId/documentos - Documentos de un caso`);
  console.log(`   GET  /api/documentos/:id - Obtener documento específico`);
  console.log(`   POST /api/documentos - Crear nuevo documento`);
  console.log(`   PUT  /api/documentos/:id - Actualizar documento`);
  console.log(`   DELETE /api/documentos/:id - Eliminar documento`);
  console.log(`   GET  /api/documentos/buscar - Búsqueda avanzada`);
  console.log(`   GET  /api/estadisticas - Estadísticas generales`);
  console.log(`   GET  /api/health - Estado del servidor`);
}); 