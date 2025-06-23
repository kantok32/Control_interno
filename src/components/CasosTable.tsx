import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EditarCasoForm } from './EditarCasoForm';
import ClienteDetalleModal from './ClienteDetalleModal';

interface Caso {
  id: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  rut: string;
  correo_electronico: string;
  telefono: string;
  domicilio: string;
  tipo_asesoria: string;
  situacion_legal: boolean;
  motivo_consulta: string;
  motivo_consulta_otro?: string;
  descripcion_asunto: string;
  antecedentes_penales: boolean;
  abogado: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: string;
  fecha_apertura: string;
  fecha_actualizacion?: string;
  total_documentos?: number;
  ultimo_documento?: string;
  cliente: string;
  rit: string | null;
  asunto: string;
}

interface CasosTableProps {
  casos: Caso[];
  onCasoUpdated?: () => void;
}

export const CasosTable: React.FC<CasosTableProps> = ({ casos, onCasoUpdated }) => {
  const navigate = useNavigate();
  const [casoEditar, setCasoEditar] = useState<Caso | null>(null);
  const [clienteModalOpen, setClienteModalOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<any>(null);

  const getPrioridadClass = (prioridad: string) => {
    const clases = {
      Alta: 'badge-danger',
      Media: 'badge-warning',
      Baja: 'badge-success'
    };
    return `badge ${clases[prioridad as keyof typeof clases]}`;
  };

  const getEstadoClass = (estado: string) => {
    const clases: { [key: string]: string } = {
      'CAPTACION': 'badge-info',
      'EN PROCESO': 'badge-warning',
      'CERRADO': 'badge-success'
    };
    return `badge ${clases[estado] || 'badge-secondary'}`;
  };

  const verDocumentos = (casoId: string) => {
    navigate(`/casos/${casoId}/documentos`);
  };

  const handleCloseEdit = () => {
    setCasoEditar(null);
  };

  const handleSaveEdit = () => {
    if (onCasoUpdated) {
      onCasoUpdated();
    }
    setCasoEditar(null);
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleDelete = async (casoId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este caso? Esta acción no se puede deshacer.')) return;
    try {
      const response = await fetch(`http://localhost:3001/api/casos/${casoId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        alert('Error al eliminar el caso');
        return;
      }
      if (onCasoUpdated) onCasoUpdated();
    } catch (err) {
      alert('Error al eliminar el caso');
    }
  };

  return (
    <>
      <div className="table-container">
        <table className="casos-table">
          <thead>
            <tr>
              <th>N° Caso</th>
              <th>Cliente</th>
              <th>RIT</th>
              <th>Asunto</th>
              <th>Tipo Asesoría</th>
              <th>Motivo Consulta</th>
              <th>Abogado</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha Apertura</th>
              <th>Última Modificación</th>
              <th>Documentos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {casos.map(caso => (
              <tr key={caso.id}>
                <td>{caso.id}</td>
                <td>
                  <span
                    className="cliente-link"
                    style={{ cursor: 'pointer', color: '#3182ce', textDecoration: 'underline' }}
                    onClick={() => {
                      setClienteSeleccionado({
                        nombre_completo: caso.nombre_completo,
                        rut: caso.rut,
                        fecha_nacimiento: caso.fecha_nacimiento,
                        correo_electronico: caso.correo_electronico,
                        telefono: caso.telefono
                      });
                      setClienteModalOpen(true);
                    }}
                  >
                    {caso.nombre_completo}
                  </span>
                </td>
                <td>{caso.rit || '-'}</td>
                <td>{caso.descripcion_asunto}</td>
                <td>{caso.tipo_asesoria}</td>
                <td>
                  <div className="motivo-info">
                    <div className="motivo">{caso.motivo_consulta}</div>
                    {caso.motivo_consulta === 'Otros' && caso.motivo_consulta_otro && (
                      <div className="motivo-otro">{truncateText(caso.motivo_consulta_otro, 30)}</div>
                    )}
                  </div>
                </td>
                <td>{caso.abogado}</td>
                <td>
                  <span className={getPrioridadClass(caso.prioridad)}>
                    {caso.prioridad}
                  </span>
                </td>
                <td>
                  <span className={getEstadoClass(caso.estado)}>
                    {caso.estado}
                  </span>
                </td>
                <td>{new Date(caso.fecha_apertura).toLocaleDateString()}</td>
                <td>{caso.fecha_actualizacion ? new Date(caso.fecha_actualizacion).toLocaleDateString() : '-'}</td>
                <td>
                  <div className="documentos-info">
                    <span className="documentos-count">
                      {caso.total_documentos || 0} docs
                    </span>
                    {caso.ultimo_documento && (
                      <div className="ultimo-doc">
                        {new Date(caso.ultimo_documento).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-icons">
                    <button 
                      className="icon-info"
                      title="Ver documentos"
                      onClick={() => verDocumentos(caso.id)}
                    >
                      <i className="fas fa-folder-open"></i>
                    </button>
                    <Link to={`/casos/editar/${caso.id}`} className="icon-edit" title="Editar caso">
                      <i className="fas fa-pencil-alt"></i>
                    </Link>
                    <button 
                      className="icon-delete"
                      title="Eliminar caso"
                      onClick={() => handleDelete(caso.id)}
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {casoEditar && (
        <EditarCasoForm
          caso={casoEditar}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}

      <ClienteDetalleModal
        open={clienteModalOpen}
        onClose={() => setClienteModalOpen(false)}
        cliente={clienteSeleccionado}
      />
    </>
  );
}; 