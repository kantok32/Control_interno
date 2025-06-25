# INSTRUCCIONES PARA APLICAR CAMBIOS EN EL BACKEND

## PASO 1: ACCEDER AL BACKEND
1. Ve a tu cPanel
2. Abre el **File Manager**
3. Navega hasta la carpeta de tu aplicación Node.js
4. Encuentra el archivo principal (probablemente `index.js` o `server.js`)

## PASO 2: MEJORAR EL ENDPOINT DE DESCARGA
1. En tu archivo principal, busca esta línea:
   ```javascript
   app.get('/api/documentos/:id/download', async (req, res) => {
   ```

2. **REEMPLAZA** todo el bloque de código desde esa línea hasta el `});` correspondiente
3. **PEGA** el contenido del archivo `1-endpoint-descarga-mejorado.js`

## PASO 3: AGREGAR EL ENDPOINT DE UPLOAD
1. Después del endpoint de descarga (después del `});` del paso anterior)
2. **AGREGA** el contenido del archivo `2-endpoint-upload-nuevo.js`

## PASO 4: VERIFICAR FUNCIONES NECESARIAS
Asegúrate de que estas funciones existan en tu archivo:

```javascript
// Función para normalizar rutas (debe existir)
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

// Función para obtener la ruta completa del archivo (debe existir)
const getServerFilePath = (relativePath) => {
  const normalizedPath = normalizePath(relativePath);
  return join(__dirname, '../../', normalizedPath);
};
```

## PASO 5: VERIFICAR MULTER
Asegúrate de que multer esté configurado correctamente:

```javascript
const multer = require('multer');
const upload = multer({
  storage: multer.diskStorage({
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
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  }
});
```

## PASO 6: GUARDAR Y REINICIAR
1. **Guarda** el archivo
2. Ve a la sección **Node.js** en cPanel
3. **Reinicia** tu aplicación

## PASO 7: PROBAR
1. Ve a tu aplicación frontend
2. Intenta descargar un documento
3. Revisa los logs de Node.js en cPanel para ver los mensajes de depuración

## LOGS DE DEPURACIÓN
Después de aplicar los cambios, cuando intentes descargar un documento, verás en los logs:
- "Solicitud de descarga recibida para documento ID: X"
- "Resultado de consulta a BD: [...]"
- "Documento encontrado: {...}"
- "Ruta del archivo: {...}"
- "Archivo encontrado en el sistema de archivos" o error específico

## SOLUCIÓN DE PROBLEMAS
Si sigues teniendo errores 404, los logs te dirán exactamente:
- Si el documento no existe en la base de datos
- Si la ruta del archivo es incorrecta
- Si el archivo no existe en el servidor
- Qué rutas está buscando exactamente 