import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import API_ENDPOINTS, { authenticatedFetch } from '../config/api';

interface DocumentoPersonal {
  id: number;
  personal_id: number;
  nombre: string;
  descripcion: string;
  ruta_archivo: string;
  fecha_subida: string;
}

const DocumentosPersonal: React.FC = () => {
  const { id } = useParams();
  const [documentos, setDocumentos] = useState<DocumentoPersonal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editDoc, setEditDoc] = useState<DocumentoPersonal | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editDescripcion, setEditDescripcion] = useState('');

  useEffect(() => {
    const cargarDocumentos = async () => {
      if (!id) return;
      
      try {
        const response = await authenticatedFetch(API_ENDPOINTS.PERSONAL.DOCUMENTOS(id));
        if (!response.ok) {
          throw new Error('Error al cargar documentos');
        }
        const data = await response.json();
        setDocumentos(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar documentos');
      } finally {
        setLoading(false);
      }
    };

    cargarDocumentos();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !file) return;
    
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('nombre', nombre);
    formData.append('descripcion', descripcion);
    try {
      const res = await fetch(API_ENDPOINTS.PERSONAL.DOCUMENTOS(id), {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const nuevoDoc = await res.json();
        setDocumentos(prev => [...prev, nuevoDoc]);
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

  if (loading) return <div>Cargando documentos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div style={{ padding: '2rem', position: 'relative' }}>
      <h2>Documentos del Personal</h2>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
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
            onSubmit={async e => {
              e.preventDefault();
              if (!id) return;
              
              try {
                const res = await authenticatedFetch(API_ENDPOINTS.PERSONAL.DOCUMENTO(id, editDoc.id.toString()), {
                  method: 'PUT',
                  body: JSON.stringify({ nombre: editNombre, descripcion: editDescripcion })
                });
                if (res.ok) {
                  const updated = await res.json();
                  setDocumentos(prev => prev.map(d => d.id === updated.id ? updated : d));
                  setEditDoc(null);
                } else {
                  alert('Error al editar el documento');
                }
              } catch {
                alert('Error al editar el documento');
              }
            }}
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
          {documentos.map(doc => (
            <tr key={doc.id}>
              <td>{doc.nombre}</td>
              <td>{doc.descripcion}</td>
              <td>
                {doc.ruta_archivo.endsWith('.pdf') ? (
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
                    {doc.ruta_archivo.split('/').pop()}
                  </a>
                )}
              </td>
              <td>{new Date(doc.fecha_subida).toLocaleDateString()}</td>
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
                  onClick={async () => {
                    if (window.confirm('¿Seguro que deseas eliminar este documento?')) {
                      if (!id) return;
                      
                      try {
                        const res = await authenticatedFetch(API_ENDPOINTS.PERSONAL.DOCUMENTO(id, doc.id.toString()), {
                          method: 'DELETE'
                        });
                        if (res.ok) {
                          setDocumentos(prev => prev.filter(d => d.id !== doc.id));
                        } else {
                          alert('Error al eliminar el documento');
                        }
                      } catch {
                        alert('Error al eliminar el documento');
                      }
                    }
                  }}
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DocumentosPersonal; 