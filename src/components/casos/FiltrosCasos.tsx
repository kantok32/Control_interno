import type { FiltrosCasos as FiltrosCasosType } from "../../hooks/useCasos";
import "../../styles/components.css";
import { useNavigate } from 'react-router-dom';

interface Props {
  filtros: FiltrosCasosType;
  onFiltrosChange: (filtros: Partial<FiltrosCasosType>) => void;
  abogados: string[];
  estados: string[];
}

export default function FiltrosCasos({ filtros, onFiltrosChange, abogados, estados }: Props) {
  const navigate = useNavigate();

  return (
    <div className="filtros-container">
      <div className="search-bar">
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Buscar por N° de caso, cliente o asunto..."
          value={filtros.busqueda}
          onChange={(e) => onFiltrosChange({ busqueda: e.target.value })}
        />
      </div>

      <div className="filters">
        <div className="filter-group">
          <label htmlFor="estado-filter">Estado:</label>
          <select
            id="estado-filter"
            value={filtros.estado}
            onChange={(e) => onFiltrosChange({ estado: e.target.value })}
          >
            {estados.map(estado => (
              <option key={estado} value={estado === "Todos" ? "Todos" : estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="abogado-filter">Abogado:</label>
          <select
            id="abogado-filter"
            value={filtros.abogado}
            onChange={(e) => onFiltrosChange({ abogado: e.target.value })}
          >
            {abogados.map(abogado => (
              <option key={abogado} value={abogado}>
                {abogado}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="actions">
        <button 
          className="btn btn-primary"
          onClick={() => navigate('/nuevo-caso')}
        >
          <i className="fas fa-plus"></i> Nuevo Caso
        </button>
      </div>
    </div>
  );
} 