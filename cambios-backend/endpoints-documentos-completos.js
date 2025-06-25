// ===== ENDPOINTS DE DOCUMENTOS - AGREGAR A TU ARCHIVO PRINCIPAL =====

// Función para normalizar rutas (agregar si no existe)
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

// Función para obtener la ruta completa del archivo (agregar si no existe)
const getServerFilePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return join(__dirname, '../../', normalizedPath);
};

// ===== ENDPOINT DE DESCARGA DE DOCUMENTOS =====
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

// ===== ENDPOINT DE SUBIDA DE DOCUMENTOS =====
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

// ===== ENDPOINT PARA OBTENER DOCUMENTO ESPECÍFICO =====
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

// ===== ENDPOINT PARA ELIMINAR DOCUMENTO =====
app.delete('/api/documentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener información del documento antes de eliminarlo
    const [documentos] = await pool.query('SELECT * FROM documentos WHERE id = ?', [id]);
    
    if (documentos.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }
    
    const documento = documentos[0];
    
    // Eliminar archivo físico si existe
    if (documento.ruta_archivo) {
      try {
        const filePath = getServerFilePath(documento.ruta_archivo);
        await fs.unlink(filePath);
        console.log('Archivo físico eliminado:', filePath);
      } catch (fileError) {
        console.error('Error al eliminar archivo físico:', fileError);
        // Continuar aunque no se pueda eliminar el archivo físico
      }
    }
    
    // Eliminar registro de la base de datos
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

// ===== ENDPOINT PARA LISTAR DOCUMENTOS =====
app.get('/api/documentos', async (req, res) => {
  try {
    const { caso_id, tipo, orden = 'fecha_creacion', direccion = 'DESC' } = req.query;
    
    let sql = `
      SELECT d.*, c.nombre_completo as cliente
      FROM documentos d
      LEFT JOIN casos c ON d.caso_id = c.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (caso_id) {
      sql += ' AND d.caso_id = ?';
      params.push(caso_id);
    }
    
    if (tipo) {
      sql += ' AND d.tipo = ?';
      params.push(tipo);
    }
    
    sql += ` ORDER BY d.${orden} ${direccion}`;
    
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener documentos:', error);
    res.status(500).json({ error: 'Error al obtener los documentos' });
  }
});

// ===== ENDPOINT PARA OBTENER DOCUMENTOS DE UN CASO =====
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

// ===== CONFIGURACIÓN DE MULTER (agregar si no existe) =====
/*
const multer = require('multer');
const { join } = require('path');
const fs = require('fs').promises;

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
*/ 