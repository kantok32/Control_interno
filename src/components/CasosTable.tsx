import React from 'react';

interface Caso {
  id: string;
  cliente: string;
  asunto: string;
  abogado: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'ACTIVO' | 'EN ESPERA' | 'CERRADO';
  fechaApertura: string;
}

interface CasosTableProps {
  casos: Caso[];
}

export const CasosTable: React.FC<CasosTableProps> = ({ casos }) => {
  const getPrioridadClass = (prioridad: string) => {
    const clases = {
      Alta: 'badge-danger',
      Media: 'badge-warning',
      Baja: 'badge-success'
    };
    return `badge ${clases[prioridad as keyof typeof clases]}`;
  };

  const getEstadoClass = (estado: string) => {
    const clases = {
      'ACTIVO': 'badge-primary',
      'EN ESPERA': 'badge-warning',
      'CERRADO': 'badge-secondary'
    };
    return `badge ${clases[estado as keyof typeof clases]}`;
  };

  return (
    <div className="table-container">
      <table className="casos-table">
        <thead>
          <tr>
            <th>N° Caso</th>
            <th>Cliente</th>
            <th>Asunto</th>
            <th>Abogado</th>
            <th>Prioridad</th>
            <th>Estado</th>
            <th>Fecha Apertura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {casos.map(caso => (
            <tr key={caso.id}>
              <td>{caso.id}</td>
              <td>{caso.cliente}</td>
              <td>{caso.asunto}</td>
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
              <td>{new Date(caso.fechaApertura).toLocaleDateString()}</td>
              <td className="action-buttons">
                <button className="action-btn view" title="Ver detalle">
                  <i className="fas fa-folder-open"></i>
                </button>
                <button className="action-btn edit" title="Editar caso">
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <button className="action-btn delete" title="Eliminar caso">
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