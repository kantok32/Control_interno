// ===== CAMBIOS NECESARIOS PARA EL BACKEND EN CPANEL =====

// 1. AGREGAR LOGS DE DEPURACIÓN AL ENDPOINT DE DESCARGA
// Busca el endpoint: app.get('/api/documentos/:id/download', async (req, res) => {
// Y reemplázalo con este código:

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

// 2. AGREGAR EL ENDPOINT FALTANTE PARA SUBIR DOCUMENTOS
// Agrega este código después del endpoint de descarga:

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

// ===== INSTRUCCIONES PARA APLICAR EN CPANEL =====

/*
1. Ve a tu cPanel
2. Abre el File Manager
3. Navega hasta tu aplicación Node.js
4. Encuentra el archivo principal (probablemente index.js o server.js)
5. Busca el endpoint: app.get('/api/documentos/:id/download'
6. Reemplázalo con el código de arriba (sección 1)
7. Agrega el nuevo endpoint de upload (sección 2)
8. Guarda el archivo
9. Reinicia tu aplicación Node.js en cPanel

NOTAS IMPORTANTES:
- Asegúrate de que las funciones getServerFilePath y normalizePath existan
- Verifica que multer esté configurado correctamente
- Los logs aparecerán en los logs de error de Node.js en cPanel
*/ 