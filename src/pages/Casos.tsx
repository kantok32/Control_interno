import { useState } from 'react';
import { PageHeader } from "../components/Layout";
import { useNavigate } from 'react-router-dom';
import { CasosTable } from '../components/CasosTable';
import { useCasos } from '../context/CasosContext';
import { FiltrosCasos } from '../components/FiltrosCasos';

const Casos = () => {
  const { casos, loading, error, filtrarCasos, cargarCasos } = useCasos();
  const [filtros, setFiltros] = useState({
    estado: 'TODOS',
    prioridad: 'TODAS',
    busqueda: ''
  });
  const navigate = useNavigate();

  if (loading) return <div className="loading">Cargando casos...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  const casosFiltrados = filtrarCasos(filtros);

  const handleFilterChange = (nuevosFiltros: typeof filtros) => {
    setFiltros(nuevosFiltros);
  };

  const handleCasoUpdated = () => {
    cargarCasos();
  };

  return (
    <>
      <PageHeader title="Gestión de Casos" />

      <section className="toolbar">
        <FiltrosCasos onFilterChange={handleFilterChange} />
        <div className="actions">
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/nuevo-caso')}
          >
            <i className="fas fa-plus"></i> Nuevo Caso
          </button>
        </div>
      </section>

      <section className="data-table-section">
        <div className="table-info">
          <p>Mostrando {casosFiltrados.length} casos</p>
        </div>
        <CasosTable 
          casos={casosFiltrados} 
          onCasoUpdated={handleCasoUpdated}
        />
      </section>
    </>
  );
};

export default Casos; 