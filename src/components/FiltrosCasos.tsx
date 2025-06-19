import React, { useState } from 'react';

interface FiltrosCasosProps {
  onFilterChange: (filtros: {
    estado: string;
    prioridad: string;
    busqueda: string;
  }) => void;
}

export const FiltrosCasos: React.FC<FiltrosCasosProps> = ({ onFilterChange }) => {
  const [filtros, setFiltros] = useState({
    estado: 'TODOS',
    prioridad: 'TODAS',
    busqueda: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    const nuevosFiltros = {
      ...filtros,
      [name]: value
    };
    setFiltros(nuevosFiltros);
    onFilterChange(nuevosFiltros);
  };

  return (
    <div className="filtros-container">
      <div className="filtros-group">
        <label htmlFor="estado">Estado:</label>
        <select
          id="estado"
          name="estado"
          value={filtros.estado}
          onChange={handleChange}
        >
          <option value="TODOS">Todos</option>
          <option value="CAPTACION">Captación</option>
          <option value="EN PROCESO">En Proceso</option>
          <option value="CERRADO">Cerrado</option>
        </select>
      </div>

      <div className="filtros-group">
        <label htmlFor="prioridad">Prioridad:</label>
        <select
          id="prioridad"
          name="prioridad"
          value={filtros.prioridad}
          onChange={handleChange}
        >
          <option value="TODAS">Todas</option>
          <option value="Alta">Alta</option>
          <option value="Media">Media</option>
          <option value="Baja">Baja</option>
        </select>
      </div>

      <div className="filtros-group search">
        <input
          type="text"
          name="busqueda"
          placeholder="Buscar por cliente, asunto o abogado..."
          value={filtros.busqueda}
          onChange={handleChange}
        />
      </div>
    </div>
  );
}; 