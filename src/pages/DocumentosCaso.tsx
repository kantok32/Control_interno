import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API_ENDPOINTS from '../config/api';
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

  useEffect(() => {
    const cargarCaso = async () => {
      if (!casoId) return;
      
      try {
        const response = await fetch(API_ENDPOINTS.CASOS.GET(casoId));
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

    cargarCaso();
  }, [casoId]);

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      const response = await fetch(API_ENDPOINTS.DOCUMENTOS.DOWNLOAD(documento.id.toString()));
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

      <div className="documentos-grid">
        {casoDetalle.documentos.length === 0 ? (
          <div className="no-documentos">
            <i className="fas fa-folder-open"></i>
            <p>No hay documentos asociados a este caso</p>
          </div>
        ) : (
          casoDetalle.documentos.map(doc => (
            <div key={doc.id} className="documento-card">
              <div className="documento-icon">
                <i className={`fas fa-file-${doc.tipo_mime.includes('pdf') ? 'pdf' : 'alt'}`}></i>
              </div>
              <div className="documento-info">
                <h4>{doc.nombre}</h4>
                <p className="documento-meta">
                  <span className="tipo">{doc.tipo_mime}</span>
                  <span className="tamano">{formatearTamaño(doc.tamano_bytes)}</span>
                </p>
                <p className="documento-fecha">
                  {new Date(doc.fecha_creacion).toLocaleDateString()}
                </p>
                {doc.descripcion && (
                  <p className="documento-descripcion">{doc.descripcion}</p>
                )}
              </div>
              <div className="documento-actions">
                <button 
                  onClick={() => handleDownload(doc)}
                  className="btn-download"
                  title="Descargar archivo"
                >
                  <i className="fas fa-download"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}; 