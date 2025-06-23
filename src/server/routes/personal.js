import express from 'express';
import { pool } from '../index.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configuración de multer para subir archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Obtener todo el personal
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM personal_documentacion');
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ error: 'Error al obtener el personal' });
  }
});

// Obtener documentos de un personal
router.get('/:id/documentos', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT * FROM documentos_personal WHERE personal_id = ?', [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener documentos del personal:', error);
    res.status(500).json({ error: 'Error al obtener los documentos' });
  }
});

// Subir documento para un personal
router.post('/:id/documentos', upload.single('archivo'), async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  if (!req.file) {
    return res.status(400).json({ error: 'Archivo requerido' });
  }
  try {
    const nombre = req.file.originalname;
    const ruta_archivo = 'uploads/' + req.file.filename;
    const fecha_subida = new Date();
    await pool.query(
      'INSERT INTO documentos_personal (personal_id, nombre, descripcion, ruta_archivo, fecha_subida) VALUES (?, ?, ?, ?, ?)',
      [id, nombre, descripcion, ruta_archivo, fecha_subida]
    );
    const [nuevoDoc] = await pool.query('SELECT * FROM documentos_personal WHERE personal_id = ? AND ruta_archivo = ? ORDER BY id DESC LIMIT 1', [id, ruta_archivo]);
    res.json(nuevoDoc[0]);
  } catch (error) {
    console.error('Error al subir documento:', error);
    res.status(500).json({ error: 'Error al subir el documento' });
  }
});

// Eliminar documento de un personal
router.delete('/:id/documentos/:docId', async (req, res) => {
  const { docId } = req.params;
  try {
    // Obtener la ruta del archivo para eliminarlo físicamente
    const [rows] = await pool.query('SELECT ruta_archivo FROM documentos_personal WHERE id = ?', [docId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });
    const ruta = rows[0].ruta_archivo;
    // Eliminar el registro de la base de datos
    await pool.query('DELETE FROM documentos_personal WHERE id = ?', [docId]);
    // Eliminar el archivo físico
    const fs = require('fs');
    if (fs.existsSync(ruta)) {
      fs.unlinkSync(ruta);
    } else if (fs.existsSync('./' + ruta)) {
      fs.unlinkSync('./' + ruta);
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({ error: 'Error al eliminar el documento' });
  }
});

// Editar nombre y descripción de un documento
router.put('/:id/documentos/:docId', async (req, res) => {
  const { docId } = req.params;
  const { nombre, descripcion } = req.body;
  try {
    await pool.query('UPDATE documentos_personal SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion, docId]);
    const [rows] = await pool.query('SELECT * FROM documentos_personal WHERE id = ?', [docId]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error al editar documento:', error);
    res.status(500).json({ error: 'Error al editar el documento' });
  }
});

export default router; 