import React, { useState, useEffect } from 'react';
import API_ENDPOINTS, { authenticatedFetch } from '../config/api';

interface Documento {
  id: number;
  nombre: string;
  tipo: 'CONTRATO' | 'EVIDENCIA' | 'NOTA' | 'RESOLUCION' | 'OTRO';
  descripcion: string;
  contenido_texto?: string;
  ruta_archivo?: string;
  tamano_bytes?: number;
  tipo_mime?: string;
  fecha_creacion: string;
  creado_por: string;
}

interface DocumentosManagerProps {
  casoId: string;
}

const DocumentosManager: React.FC<DocumentosManagerProps> = ({ casoId }) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedDocumento, setSelectedDocumento] = useState<Documento | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'NOTA' as Documento['tipo'],
    descripcion: '',
    contenido_texto: '',
    creado_por: 'Usuario'
  });

  useEffect(() => {
    cargarDocumentos();
  }, [casoId]);

  const cargarDocumentos = async () => {
    setLoading(true);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.CASOS.DOCUMENTOS(casoId));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(API_ENDPOINTS.DOCUMENTOS.UPLOAD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          caso_id: casoId
        }),
      });

      if (!response.ok) {
        throw new Error('Error al crear documento');
      }

      await cargarDocumentos();
      setShowForm(false);
      setFormData({
        nombre: '',
        tipo: 'NOTA',
        descripcion: '',
        contenido_texto: '',
        creado_por: 'Usuario'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const eliminarDocumento = async (id: number) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este documento?')) {
      return;
    }

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.DOCUMENTOS.DELETE(id.toString()), {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Error al eliminar documento');
      }

      await cargarDocumentos();
    } catch (error) {
      console.error('Error:', error);
      setError('Error al eliminar documento');
    }
  };

  const handleViewDocument = async (documento: Documento) => {
    if (documento.contenido_texto) {
      setSelectedDocumento(documento);
    } else if (documento.ruta_archivo) {
      alert(`Archivo: ${documento.ruta_archivo}\nTamaño: ${(documento.tamano_bytes! / 1024).toFixed(2)} KB`);
    }
  };

  const handleDownload = async (documento: Documento) => {
    try {
      if (!documento.ruta_archivo) {
        throw new Error('No hay archivo para descargar');
      }

      const response = await authenticatedFetch(API_ENDPOINTS.DOCUMENTOS.DOWNLOAD(documento.id.toString()));
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  };

  const getTipoColor = (tipo: Documento['tipo']) => {
    const colors = {
      CONTRATO: 'bg-blue-100 text-blue-800',
      EVIDENCIA: 'bg-green-100 text-green-800',
      NOTA: 'bg-yellow-100 text-yellow-800',
      RESOLUCION: 'bg-purple-100 text-purple-800',
      OTRO: 'bg-gray-100 text-gray-800'
    };
    return colors[tipo];
  };

  if (loading) return <div className="p-4">Cargando documentos...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Documentos del Caso {casoId}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {showForm ? 'Cancelar' : 'Nuevo Documento'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-4">Crear Nuevo Documento</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({...formData, tipo: e.target.value as Documento['tipo']})}
                  className="w-full p-2 border rounded"
                >
                  <option value="CONTRATO">Contrato</option>
                  <option value="EVIDENCIA">Evidencia</option>
                  <option value="NOTA">Nota</option>
                  <option value="RESOLUCION">Resolución</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <input
                type="text"
                value={formData.descripcion}
                onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contenido</label>
              <textarea
                value={formData.contenido_texto}
                onChange={(e) => setFormData({...formData, contenido_texto: e.target.value})}
                className="w-full p-2 border rounded h-32"
                placeholder="Escribe el contenido del documento..."
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Guardar Documento
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {documentos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay documentos para este caso
          </div>
        ) : (
          documentos.map((documento) => (
            <div key={documento.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{documento.nombre}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(documento.tipo)}`}>
                      {documento.tipo}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">{documento.descripcion}</p>
                  <div className="text-sm text-gray-500">
                    <span>Creado por: {documento.creado_por}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(documento.fecha_creacion).toLocaleDateString()}</span>
                    {documento.tamano_bytes && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{(documento.tamano_bytes / 1024).toFixed(2)} KB</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDocument(documento)}
                    className="text-blue-600 hover:text-blue-800"
                    title="Ver documento"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  {documento.ruta_archivo && (
                    <button
                      onClick={() => handleDownload(documento)}
                      className="text-green-600 hover:text-green-800"
                      title="Descargar documento"
                    >
                      <i className="fas fa-download"></i>
                    </button>
                  )}
                  <button
                    onClick={() => eliminarDocumento(documento.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Eliminar documento"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para ver documento */}
      {selectedDocumento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">{selectedDocumento.nombre}</h3>
              <button
                onClick={() => setSelectedDocumento(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {selectedDocumento.contenido_texto}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentosManager; 