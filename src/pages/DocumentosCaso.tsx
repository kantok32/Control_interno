import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API_ENDPOINTS, { authenticatedFetch } from '../config/api';
import '../styles/components.css';

interface Documento {
  id: number;
  nombre: string;
  tipo: string;
  descripcion: string;
  ruta_archivo: string;
  tamano_bytes: number;
  tipo_mime: string;
  fecha_creacion: string;
}

interface CasoDetalle {
  caso: {
    id: string;
    nombre_completo: string;
    rut: string;
    tipo_asesoria: string;
    motivo_consulta: string;
    motivo_consulta_otro?: string;
    abogado: string;
    estado: string;
    prioridad: string;
    fecha_apertura: string;
  };
  documentos: Documento[];
}

export const DocumentosCaso: React.FC = () => {
  const { casoId } = useParams<{ casoId: string }>();
  const [casoDetalle, setCasoDetalle] = useState<CasoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editDoc, setEditDoc] = useState<Documento | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  const cargarCaso = async () => {
    if (!casoId) return;
    setLoading(true);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.CASOS.GET(casoId));
      if (!response.ok) {
        throw new Error('Error al cargar el caso');
      }
      const data = await response.json();
      setCasoDetalle(data);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al cargar el caso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCaso();
    // eslint-disable-next-line
  }, [casoId]);

  const formatearRut = (rut: string) => {
    if (!rut) return '';
    // Eliminar puntos y guión si existen
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    // Separar el número del dígito verificador
    const numero = rutLimpio.slice(0, -1);
    const dv = rutLimpio.slice(-1);
    // Formatear el número con puntos
    const numeroFormateado = numero.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return `${numeroFormateado}-${dv}`;
  };

  const handleDownload = async (documento: Documento) => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.DOCUMENTOS.DOWNLOAD(documento.id.toString()));
      if (!response.ok) {
        throw new Error('Error al descargar documento');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documento.nombre;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error:', error);
      setError('Error al descargar documento');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!casoId || !file) return;
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('caso_id', casoId);
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    try {
      const res = await fetch(API_ENDPOINTS.DOCUMENTOS.LIST, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        await cargarCaso();
        setFile(null);
        setNombre('');
        setDescripcion('');
        setShowModal(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setError('Error al subir el documento');
      }
    } catch {
      setError('Error al subir el documento');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDoc) return;
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.DOCUMENTOS.DELETE(editDoc.id.toString()), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: editNombre, descripcion: editDescripcion })
      });
      if (res.ok) {
        await cargarCaso();
        setEditDoc(null);
      } else {
        setError('Error al editar el documento');
      }
    } catch {
      setError('Error al editar el documento');
    }
  };

  const handleDelete = async (docId: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) return;
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.DOCUMENTOS.DELETE(docId.toString()), {
        method: 'DELETE'
      });
      if (res.ok) {
        await cargarCaso();
      } else {
        setError('Error al eliminar el documento');
      }
    } catch {
      setError('Error al eliminar el documento');
    }
  };

  if (loading) return <div className="loading">Cargando...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (!casoDetalle) return <div className="not-found">No se encontró el caso</div>;

  return (
    <div className="documentos-container">
      <div className="caso-header">
        <h2>Documentos del Caso #{casoDetalle.caso.id}</h2>
        <div className="caso-info">
          <div className="info-group">
            <p><strong>Cliente:</strong> {casoDetalle.caso.nombre_completo}</p>
            <p><strong>RUT:</strong> {formatearRut(casoDetalle.caso.rut)}</p>
          </div>
          <div className="info-group">
            <p><strong>Tipo Asesoría:</strong> {casoDetalle.caso.tipo_asesoria}</p>
            <p><strong>Motivo:</strong> {
              casoDetalle.caso.motivo_consulta === 'Otros' 
                ? casoDetalle.caso.motivo_consulta_otro 
                : casoDetalle.caso.motivo_consulta
            }</p>
          </div>
          <div className="info-group">
            <p><strong>Abogado:</strong> {casoDetalle.caso.abogado}</p>
            <p><strong>Estado:</strong> <span className={`estado-badge ${casoDetalle.caso.estado.toLowerCase()}`}>{casoDetalle.caso.estado}</span></p>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 8px 0' }}>
        <button className="btn btn-outline" onClick={() => window.location.href = '/casos'}>
          ← Volver
        </button>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Subir documento
        </button>
      </div>
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form
            onSubmit={handleUpload}
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 8,
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
              minWidth: 320,
              display: 'flex',
              flexDirection: 'column',
              gap: 16
            }}
          >
            <h3>Subir nuevo documento</h3>
            <input
              type="text"
              placeholder="Nombre del documento"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Descripción"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              required
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!file || !nombre.trim()}>
                Subir
              </button>
            </div>
            {file && <span style={{ color: '#888', fontSize: 13 }}>{file.name}</span>}
          </form>
        </div>
      )}
      {editDoc && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <form
            onSubmit={handleEdit}
            style={{
              background: '#fff',
              padding: 40,
              borderRadius: 12,
              boxShadow: '0 2px 24px rgba(0,0,0,0.18)',
              minWidth: 480,
              maxWidth: 600,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}
          >
            <h3 style={{ fontSize: 24, marginBottom: 8 }}>Editar documento</h3>
            <input
              type="text"
              placeholder="Nombre del documento"
              value={editNombre}
              onChange={e => setEditNombre(e.target.value)}
              required
              style={{ fontSize: 18, padding: '10px 12px' }}
            />
            <input
              type="text"
              placeholder="Descripción"
              value={editDescripcion}
              onChange={e => setEditDescripcion(e.target.value)}
              style={{ fontSize: 18, padding: '10px 12px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setEditDoc(null)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={!editNombre.trim()}>
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}
      <table className="casos-table" style={{ width: '100%', marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Archivo</th>
            <th>Fecha de subida</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {casoDetalle.documentos.length === 0 ? (
            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No hay documentos asociados a este caso</td></tr>
          ) : (
            casoDetalle.documentos.map(doc => (
              <tr key={doc.id}>
                <td>{doc.nombre}</td>
                <td>{doc.descripcion}</td>
                <td>
                  {doc.ruta_archivo && doc.ruta_archivo.endsWith('.pdf') ? (
                    <a
                      href={API_ENDPOINTS.FILES.GET(doc.ruta_archivo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                      style={{ color: '#3182ce', textDecoration: 'underline' }}
                    >
                      Descargar PDF
                    </a>
                  ) : (
                    <a
                      href={API_ENDPOINTS.FILES.GET(doc.ruta_archivo)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3182ce', textDecoration: 'underline' }}
                    >
                      {doc.ruta_archivo ? doc.ruta_archivo.split('/').pop() : ''}
                    </a>
                  )}
                </td>
                <td>{new Date(doc.fecha_creacion).toLocaleDateString()}</td>
                <td>
                  <button
                    className="icon-edit"
                    title="Editar"
                    style={{ marginRight: 8 }}
                    onClick={() => {
                      setEditDoc(doc);
                      setEditNombre(doc.nombre);
                      setEditDescripcion(doc.descripcion || '');
                    }}
                  >
                    <i className="fas fa-pencil-alt"></i>
                  </button>
                  <button
                    className="icon-delete"
                    title="Eliminar"
                    onClick={() => handleDelete(doc.id)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <button
                    className="icon-download"
                    title="Descargar"
                    onClick={() => handleDownload(doc)}
                  >
                    <i className="fas fa-download"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}; 