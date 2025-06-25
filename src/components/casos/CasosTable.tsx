import FiltrosCasos from "./FiltrosCasos";
import { useCasos } from "../../hooks/useCasos";
import "../../styles/components.css";

export default function CasosTable() {
  const { 
    casos, 
    loading, 
    filtros, 
    actualizarFiltros, 
    abogados, 
    estados,
    totalCasos 
  } = useCasos();

  if (loading) return <div>Cargando casos...</div>;

  return (
    <div className="casos-container">
      <FiltrosCasos
        filtros={filtros}
        onFiltrosChange={actualizarFiltros}
        abogados={abogados}
        estados={estados}
      />

      <div className="table-info">
        <p>Mostrando {casos.length} de {totalCasos} casos</p>
      </div>

      <div className="table-container">
        <table className="casos-table">
          <thead>
            <tr>
              <th>CLIENTE</th>
              <th>ASUNTO</th>
              <th>ABOGADO</th>
              <th>N° DE CASO</th>
              <th>FECHA APERTURA</th>
              <th>ÚLT. ACTUALIZACIÓN</th>
              <th>PRIORIDAD</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {casos.map(caso => (
              <tr key={caso.id}>
                <td>{caso.cliente}</td>
                <td>{caso.asunto}</td>
                <td>{caso.abogado}</td>
                <td>{caso.id}</td>
                <td>{new Date(caso.fecha_apertura).toLocaleDateString()}</td>
                <td>{new Date(caso.fecha_actualizacion).toLocaleDateString()}</td>
                <td>
                  <span className={`prioridad-badge ${caso.prioridad.toLowerCase()}`}>
                    {caso.prioridad}
                  </span>
                </td>
                <td>
                  <span className={`estado-badge ${caso.estado.toLowerCase().replace(" ", "-")}`}>
                    {caso.estado}
                  </span>
                </td>
                <td className="action-icons">
                  <button className="action-btn info" title="Ver detalle/entradas"><i className="fas fa-folder-open"></i></button>
                  <button className="action-btn edit" title="Editar caso"><i className="fas fa-pencil-alt"></i></button>
                  <button className="action-btn delete" title="Eliminar caso"><i className="fas fa-trash-alt"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 