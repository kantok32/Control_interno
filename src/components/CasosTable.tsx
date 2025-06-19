import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EditarCasoForm } from './EditarCasoForm';

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
}

interface CasosTableProps {
  casos: Caso[];
  onCasoUpdated?: () => void;
}

export const CasosTable: React.FC<CasosTableProps> = ({ casos, onCasoUpdated }) => {
  const navigate = useNavigate();
  const [casoEditar, setCasoEditar] = useState<Caso | null>(null);

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

  const handleEditarClick = (caso: Caso) => {
    setCasoEditar(caso);
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

  const formatRut = (rut: string) => {
    if (!rut) return '-';
    // Si el RUT tiene más de 8 caracteres, formatearlo
    if (rut.length > 8) {
      const numero = rut.slice(0, -1);
      const dv = rut.slice(-1);
      return `${numero.slice(0, -3)}.${numero.slice(-3)}-${dv}`;
    }
    return rut;
  };

  return (
    <>
      <div className="table-container">
        <table className="casos-table">
          <thead>
            <tr>
              <th>N° Caso</th>
              <th>Cliente</th>
              <th>RUT</th>
              <th>Tipo Asesoría</th>
              <th>Motivo Consulta</th>
              <th>Abogado</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Fecha Apertura</th>
              <th>Documentos</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {casos.map(caso => (
              <tr key={caso.id}>
                <td>{caso.id}</td>
                <td>
                  <div className="cliente-info">
                    <div className="nombre">{caso.nombre_completo}</div>
                    <div className="contacto">
                      <div className="email">{caso.correo_electronico}</div>
                      {caso.telefono && <div className="telefono">{caso.telefono}</div>}
                    </div>
                  </div>
                </td>
                <td>{formatRut(caso.rut)}</td>
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
                <td className="action-buttons">
                  <div className="action-icons">
                    <button 
                      className="icon-info"
                      title="Ver documentos"
                      onClick={() => verDocumentos(caso.id)}
                    >
                      <i className="fas fa-folder-open"></i>
                    </button>
                    <button 
                      className="icon-edit"
                      title="Editar caso"
                      onClick={() => handleEditarClick(caso)}
                    >
                      <i className="fas fa-pencil-alt"></i>
                    </button>
                    <button 
                      className="icon-delete"
                      title="Eliminar caso"
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
    </>
  );
}; 