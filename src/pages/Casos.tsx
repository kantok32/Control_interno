import { PageHeader } from "../components/Layout";

// A FUTURO: Estos datos vendrían de una API.
const mockCasos = [
    { id: 'CAS-001', cliente: 'Corp. Acme', asunto: 'Disputa contractual por servicios no prestados.', tipo: 'Mercantil', abogado: 'J. Pérez', fechaApertura: '2023-01-15', ultimaActualizacion: '2023-05-20', estado: 'Activo', prioridad: 'Alta' },
    { id: 'CAS-002', cliente: 'Innovatech Solutions', asunto: 'Registro de patente para nuevo software de IA.', tipo: 'Prop. Intelectual', abogado: 'A. Gómez', fechaApertura: '2023-02-10', ultimaActualizacion: '2023-05-18', estado: 'Activo', prioridad: 'Alta' },
    { id: 'CAS-003', cliente: 'Tech Forward Inc.', asunto: 'Asesoría laboral para nueva contratación.', tipo: 'Laboral', abogado: 'M. Rodríguez', fechaApertura: '2023-03-05', ultimaActualizacion: '2023-05-22', estado: 'En Espera', prioridad: 'Media' },
    { id: 'CAS-004', cliente: 'Bienes Raíces Seguros', asunto: 'Revisión de contrato de arrendamiento comercial.', tipo: 'Inmobiliario', abogado: 'C. López', fechaApertura: '2023-03-20', ultimaActualizacion: '2023-05-15', estado: 'Cerrado', prioridad: 'Baja' },
    { id: 'CAS-005', cliente: 'Familia Martínez', asunto: 'Proceso de divorcio y custodia.', tipo: 'Familiar', abogado: 'S. Fernández', fechaApertura: '2023-04-01', ultimaActualizacion: '2023-05-21', estado: 'Activo', prioridad: 'Media' },
    { id: 'CAS-006', cliente: 'Comercializadora del Sur', asunto: 'Defensa en caso de responsabilidad de producto.', tipo: 'Civil', abogado: 'J. Pérez', fechaApertura: '2023-04-10', ultimaActualizacion: '2023-05-19', estado: 'En Espera', prioridad: 'Alta' },
    { id: 'CAS-007', cliente: 'Startup Creativa', asunto: 'Constitución de la sociedad y pacto de socios.', tipo: 'Mercantil', abogado: 'A. Gómez', fechaApertura: '2023-05-02', ultimaActualizacion: '2023-05-17', estado: 'Activo', prioridad: 'Media' },
    { id: 'CAS-008', cliente: 'Constructora Monte', asunto: 'Litigio por incumplimiento de obra.', tipo: 'Civil', abogado: 'C. López', fechaApertura: '2023-05-11', ultimaActualizacion: '2023-05-22', estado: 'Cerrado', prioridad: 'Baja' },
];

const StatusBadge = ({ estado }: { estado: string }) => {
    const statusClass = `status-badge status-${estado.toLowerCase().replace(' ', '-')}`;
    return <span className={statusClass}>{estado}</span>;
}

const Casos = () => {
  return (
    <>
      <PageHeader title="Gestión de Casos" />

      <section className="toolbar">
        <div className="search-bar">
          <i className="fas fa-search"></i>
          <input type="text" placeholder="Buscar por N° de caso o cliente..." />
        </div>
        <div className="filters">
            <label htmlFor="status-filter">Estado</label>
            <select id="status-filter">
                <option value="">Todos</option>
                <option value="Activo">Activo</option>
                <option value="En Espera">En Espera</option>
                <option value="Cerrado">Cerrado</option>
            </select>
            <label htmlFor="abogado-filter">Abogado</label>
            <select id="abogado-filter">
                <option disabled selected>Filtrar por Abogado...</option>
            </select>
        </div>
        <div className="actions">
          <button className="btn btn-outline"><i className="fas fa-plus"></i> Nuevo Caso</button>
        </div>
      </section>

      <section className="data-table-section">
        <div className="table-info">
          <p>Mostrando {mockCasos.length} de {mockCasos.length} casos</p>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Asunto</th>
              <th>Abogado</th>
              <th>N° de Caso</th>
              <th>Fecha Apertura</th>
              <th>Últ. Actualización</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {mockCasos.map(caso => (
              <tr key={caso.id}>
                <td>{caso.cliente}</td>
                <td>{caso.asunto}</td>
                <td>{caso.abogado}</td>
                <td>{caso.id}</td>
                <td>{caso.fechaApertura}</td>
                <td>{caso.ultimaActualizacion}</td>
                <td>{caso.prioridad}</td>
                <td><StatusBadge estado={caso.estado} /></td>
                <td className="action-icons">
                  <i className="fas fa-folder-open icon-info" title="Ver detalle/entradas"></i>
                  <i className="fas fa-pencil-alt icon-edit" title="Editar caso"></i>
                  <i className="fas fa-trash-alt icon-delete" title="Eliminar caso"></i>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
};

export default Casos; 