import express from 'express';
import type { Request, Response, RequestHandler } from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'control_interno',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Función para normalizar rutas de archivos
const normalizePath = (filePath: string): string => {
  // Convertir separadores de Windows a Unix
  let normalized = filePath.replace(/\\/g, '/');
  
  // Remover múltiples separadores consecutivos
  normalized = normalized.replace(/\/+/g, '/');
  
  // Si la ruta es absoluta de Windows, convertirla a relativa
  if (normalized.match(/^[A-Z]:/)) {
    // Extraer solo la parte después de uploads/
    const uploadsIndex = normalized.indexOf('uploads/');
    if (uploadsIndex !== -1) {
      normalized = normalized.substring(uploadsIndex);
    }
  }
  
  return normalized;
};

// Función para obtener la ruta completa del servidor
const getServerFilePath = (relativePath: string): string => {
  return path.join(__dirname, '..', '..', relativePath);
};

// Agregar endpoint de ping
app.get('/api/ping', (_req, res) => {
  res.json({ message: 'pong' });
});

const getCasos: RequestHandler = async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        c.*,
        COUNT(d.id) as total_documentos,
        MAX(d.fecha_subida) as ultimo_documento
      FROM casos c
      LEFT JOIN documentos d ON c.id = d.caso_id
      GROUP BY c.id
      ORDER BY c.fecha_actualizacion DESC
    `);
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
      res.status(404).json({ error: 'Caso no encontrado' });
      return;
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
      res.status(400).json({ error: 'Faltan campos requeridos' });
      return;
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
      res.status(404).json({ error: 'Caso no encontrado' });
      return;
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
app.get('/api/documentos/actualizar-rutas', async (_req: Request, res: Response) => {
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
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
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
      res.status(404).json({ error: 'Documento no encontrado' });
      return;
    }

    const documento = rows[0];
    if (!documento.ruta_archivo) {
      res.status(404).json({ error: 'No hay archivo asociado a este documento' });
      return;
    }

    const filePath = getServerFilePath(documento.ruta_archivo);
    
    try {
      // Verificar si el archivo existe
      await fs.promises.access(filePath);
      
      // Enviar el archivo
      res.download(filePath, documento.nombre);
    } catch (fileError) {
      console.error('Error al acceder al archivo:', fileError);
      res.status(404).json({ error: 'Archivo no encontrado en el servidor' });
    }
  } catch (error) {
    console.error('Error al descargar documento:', error);
    res.status(500).json({ error: 'Error al descargar el documento' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
}); 