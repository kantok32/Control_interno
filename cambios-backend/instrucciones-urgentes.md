# 🚨 URGENTE: RESOLVER ERROR 404 EN DESCARGA DE DOCUMENTOS

## PROBLEMA ACTUAL
El endpoint `/api/documentos/11/download` devuelve 404 porque **NO EXISTE** en tu backend de cPanel.

## SOLUCIÓN INMEDIATA

### PASO 1: ACCEDER AL BACKEND
1. Ve a tu cPanel
2. Abre el **File Manager**
3. Navega hasta tu aplicación Node.js
4. Encuentra el archivo principal (probablemente `index.js` o `server.js`)

### PASO 2: AGREGAR FUNCIONES NECESARIAS
**AL INICIO DEL ARCHIVO** (después de los imports), agrega estas funciones:

```javascript
// Función para normalizar rutas
const normalizePath = (filePath) => {
  if (!filePath) return '';
  
  if (filePath.includes('C:\\') || filePath.includes('C:/')) {
    const fileName = filePath.split('\\').pop() || filePath.split('/').pop();
    return `uploads/${fileName}`;
  }
  
  if (filePath.startsWith('uploads/')) {
    return filePath;
  }
  
  return `uploads/${filePath}`;
};

// Función para obtener la ruta completa del archivo
const getServerFilePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return join(__dirname, '../../', normalizedPath);
};
```

### PASO 3: AGREGAR ENDPOINT DE DESCARGA
**AL FINAL DEL ARCHIVO** (antes del `app.listen`), agrega este endpoint:

```javascript
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
```

### PASO 4: AGREGAR ENDPOINT DE UPLOAD
**DESPUÉS del endpoint de descarga**, agrega este endpoint:

```javascript
// Endpoint para subir documentos
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
```

### PASO 5: VERIFICAR MULTER
Asegúrate de que multer esté configurado. Si no lo está, agrega esto **AL INICIO** del archivo:

```javascript
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
  }
});
```

### PASO 6: GUARDAR Y REINICIAR
1. **Guarda** el archivo
2. Ve a la sección **Node.js** en cPanel
3. **Reinicia** tu aplicación

### PASO 7: PROBAR
1. Ve a tu aplicación frontend
2. Intenta descargar un documento
3. Revisa los logs de Node.js en cPanel

## LOGS DE DEPURACIÓN
Después de aplicar los cambios, verás en los logs:
- "Solicitud de descarga recibida para documento ID: X"
- "Resultado de consulta a BD: [...]"
- "Documento encontrado: {...}"
- "Ruta del archivo: {...}"
- "Archivo encontrado en el sistema de archivos" o error específico

## ⚠️ IMPORTANTE
- Los logs te dirán exactamente qué está pasando
- Si el documento no existe en la BD
- Si la ruta del archivo es incorrecta
- Si el archivo no existe en el servidor
- Qué rutas está buscando exactamente

**¡APLICA ESTOS CAMBIOS INMEDIATAMENTE PARA RESOLVER EL ERROR 404!** 