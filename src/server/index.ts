import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join, relative } from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const uploadsDir = join(__dirname, '../../uploads');

// Función para normalizar rutas
const normalizePath = (filePath: string): string => {
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
const getServerFilePath = (relativePath: string): string => {
  const normalizedPath = normalizePath(relativePath);
  return join(__dirname, '../../', normalizedPath);
};

// Función para convertir ruta absoluta a relativa
const toRelativePath = (absolutePath: string): string => {
  const relativePath = relative(__dirname, absolutePath);
  return normalizePath(relativePath);
};

dotenv.config({ path: join(__dirname, '../../config.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Configurar el middleware para servir archivos estáticos
app.use('/uploads', express.static(uploadsDir));

// Agregar endpoint de ping
app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong' });
});

const pool = mysql.createPool({
  host: process.env.DB_HOST || '192.140.56.40',
  user: process.env.DB_USER || 'invers26_claudio_m1',
  password: process.env.DB_PASSWORD || 'Ni.co0189',
  database: process.env.DB_NAME || 'invers26_ERP'
});

interface Documento {
  id: number;
  nombre: string;
  ruta_archivo?: string;
}

type QueryResult = Array<Record<string, any>>;

const getCasos: RequestHandler = async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM documentos d WHERE d.caso_id = c.id) as total_documentos,
        (SELECT MAX(fecha_creacion) FROM documentos d WHERE d.caso_id = c.id) as ultimo_documento
      FROM casos c 
      ORDER BY c.fecha_apertura DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener casos:', error);
    res.status(500).json({ error: 'Error al obtener los casos' });
  }
};

app.get('/api/casos', getCasos);

const getCasoById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const [caso] = await pool.query('SELECT * FROM casos WHERE id = ?', [id]) as [any[], any];
    const [documentos] = await pool.query('SELECT * FROM documentos WHERE caso_id = ?', [id]) as [any[], any];
    
    if (!Array.isArray(caso) || caso.length === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    res.json({
      caso: caso[0],
      documentos
    });
  } catch (error) {
    console.error('Error al obtener caso:', error);
    res.status(500).json({ error: 'Error al obtener el caso' });
  }
};

app.get('/api/casos/:id', getCasoById);

const updateCaso: RequestHandler = async (req, res) => {
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
      estado
    } = req.body;

    if (!nombre_completo || !rut || !tipo_asesoria || !motivo_consulta || !abogado) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');

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
      situacion_legal,
      motivo_consulta,
      motivo_consulta_otro,
      descripcion_asunto,
      antecedentes_penales,
      abogado,
      prioridad,
      estado,
      id
    ]) as [any, any];

    if (!result || result.affectedRows === 0) {
      return res.status(404).json({ error: 'Caso no encontrado' });
    }

    const [casoActualizado] = await pool.query('SELECT * FROM casos WHERE id = ?', [id]) as [any[], any];
    res.json(casoActualizado[0]);
  } catch (error) {
    console.error('Error al actualizar caso:', error);
    res.status(500).json({ error: 'Error al actualizar el caso' });
  }
};

app.put('/api/casos/:id', updateCaso);

// Actualizar las rutas en la base de datos (DEBE IR ANTES DE LA RUTA CON PARÁMETRO)
app.get('/api/documentos/actualizar-rutas', async (req: Request, res: Response) => {
  try {
    console.log('Iniciando actualización de rutas...');
    
    // Obtener todos los documentos con rutas absolutas
    const [documentos] = await pool.query(`
      SELECT id, ruta_archivo 
      FROM documentos 
      WHERE ruta_archivo LIKE 'C:%' 
      OR ruta_archivo LIKE '/C:%'
    `) as [any[], any];
    
    console.log(`Encontrados ${documentos.length} documentos para actualizar`);
    
    const actualizaciones = [];
    
    for (const doc of documentos) {
      try {
        if (doc.ruta_archivo) {
          console.log(`Procesando documento ${doc.id}, ruta actual: ${doc.ruta_archivo}`);
          const rutaNormalizada = normalizePath(doc.ruta_archivo);
          console.log(`Ruta normalizada: ${rutaNormalizada}`);
          
          await pool.query(
            'UPDATE documentos SET ruta_archivo = ? WHERE id = ?',
            [rutaNormalizada, doc.id]
          );
          
          actualizaciones.push({
            id: doc.id,
            rutaOriginal: doc.ruta_archivo,
            rutaNormalizada
          });
        }
      } catch (docError) {
        console.error(`Error al actualizar documento ${doc.id}:`, docError);
      }
    }
    
    res.json({ 
      message: 'Proceso de actualización completado',
      actualizaciones,
      total: documentos.length,
      actualizados: actualizaciones.length
    });
  } catch (error) {
    console.error('Error al actualizar rutas:', error);
    res.status(500).json({ 
      error: 'Error al actualizar las rutas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

// Endpoint para obtener un documento específico (DEBE IR DESPUÉS DE LAS RUTAS ESPECÍFICAS)
app.get('/api/documentos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(`
      SELECT d.*, c.nombre_completo as cliente, c.descripcion_asunto as asunto
      FROM documentos d
      LEFT JOIN casos c ON d.caso_id = c.id
      WHERE d.id = ?
    `, [id]) as [any[], any];

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
app.get('/api/documentos/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM documentos WHERE id = ?', [id]) as [any[], any];

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const documento = rows[0];
    if (!documento.ruta_archivo) {
      return res.status(404).json({ error: 'No hay archivo asociado a este documento' });
    }

    // Normalizar la ruta del archivo
    const normalizedPath = normalizePath(documento.ruta_archivo);
    const filePath = getServerFilePath(normalizedPath);

    try {
      // Verificar si el archivo existe
      await fs.access(filePath);
      
      // Enviar el archivo
      res.download(filePath, documento.nombre, (err) => {
        if (err) {
          console.error('Error al enviar el archivo:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Error al enviar el archivo' });
          }
        }
      });
    } catch (error) {
      console.error('Error al acceder al archivo:', error);
      res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }
  } catch (error) {
    console.error('Error en el endpoint de descarga:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 