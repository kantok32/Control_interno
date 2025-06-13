import React, { createContext, useContext, useState } from 'react';

interface Caso {
  id: string;
  cliente: string;
  asunto: string;
  abogado: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'ACTIVO' | 'EN ESPERA' | 'CERRADO';
  fechaApertura: string;
}

interface CasosContextType {
  casos: Caso[];
  agregarCaso: (nuevoCaso: Omit<Caso, 'id'>) => void;
  filtrarCasos: (filtros: any) => Caso[];
}

const CasosContext = createContext<CasosContextType | undefined>(undefined);

export const CasosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [casos, setCasos] = useState<Caso[]>([
    {
      id: 'CAS-001',
      cliente: 'Empresa A',
      asunto: 'Contrato comercial',
      abogado: 'J. Pérez',
      prioridad: 'Alta',
      estado: 'ACTIVO',
      fechaApertura: '2024-03-01'
    },
    // ... otros casos de ejemplo ...
  ]);

  const agregarCaso = (nuevoCaso: Omit<Caso, 'id'>) => {
    // Generar un nuevo ID basado en el último caso
    const ultimoId = casos.length > 0 
      ? parseInt(casos[casos.length - 1].id.split('-')[1])
      : 0;
    const nuevoId = `CAS-${String(ultimoId + 1).padStart(3, '0')}`;

    const casoCompleto: Caso = {
      ...nuevoCaso,
      id: nuevoId
    };

    setCasos(prevCasos => [...prevCasos, casoCompleto]);
    return casoCompleto;
  };

  const filtrarCasos = (filtros: any) => {
    return casos.filter(caso => {
      let cumpleFiltros = true;
      
      if (filtros.estado && filtros.estado !== 'TODOS') {
        cumpleFiltros = cumpleFiltros && caso.estado === filtros.estado;
      }
      if (filtros.prioridad && filtros.prioridad !== 'TODAS') {
        cumpleFiltros = cumpleFiltros && caso.prioridad === filtros.prioridad;
      }
      if (filtros.busqueda) {
        const terminoBusqueda = filtros.busqueda.toLowerCase();
        cumpleFiltros = cumpleFiltros && (
          caso.cliente.toLowerCase().includes(terminoBusqueda) ||
          caso.asunto.toLowerCase().includes(terminoBusqueda) ||
          caso.abogado.toLowerCase().includes(terminoBusqueda) ||
          caso.id.toLowerCase().includes(terminoBusqueda)
        );
      }
      
      return cumpleFiltros;
    });
  };

  return (
    <CasosContext.Provider value={{ casos, agregarCaso, filtrarCasos }}>
      {children}
    </CasosContext.Provider>
  );
};

export const useCasos = () => {
  const context = useContext(CasosContext);
  if (context === undefined) {
    throw new Error('useCasos debe ser usado dentro de un CasosProvider');
  }
  return context;
}; 