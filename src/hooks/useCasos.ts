import { useEffect, useState, useMemo } from "react";

export interface Caso {
  id: string;
  cliente: string;
  asunto: string;
  abogado: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: string;
  fechaApertura: string;
  fecha_actualizacion: string;
}

export interface FiltrosCasos {
  busqueda: string;
  estado: string;
  abogado: string;
}

export function useCasos() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [estados, setEstados] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosCasos>({
    busqueda: "",
    estado: "Todos",
    abogado: "Todos"
  });

  // Cargar casos y estados desde el backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Cargar casos
        const responseCasos = await fetch('http://localhost:3001/api/casos');
        if (!responseCasos.ok) throw new Error('Error al cargar casos');
        const casosList = await responseCasos.json();
        
        // Cargar estados
        const responseEstados = await fetch('http://localhost:3001/api/estados');
        if (!responseEstados.ok) throw new Error('Error al cargar estados');
        const estadosList = await responseEstados.json();
        
        setCasos(casosList.map((caso: any) => ({
          ...caso,
          fechaApertura: caso.fecha_apertura,
          fecha_actualizacion: caso.fecha_actualizacion || caso.fecha_apertura
        })));
        setEstados(['Todos', ...estadosList.map((e: any) => e.nombre)]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Lista de abogados únicos para el filtro
  const abogados = useMemo(() => {
    const uniqueAbogados = Array.from(new Set(casos.map(caso => caso.abogado)));
    return ["Todos", ...uniqueAbogados.sort()];
  }, [casos]);

  // Filtrar casos según los criterios
  const casosFiltrados = useMemo(() => {
    if (!casos.length) return [];

    return casos.filter(caso => {
      // Filtro de búsqueda
      const searchTerm = filtros.busqueda.toLowerCase().trim();
      const matchBusqueda = searchTerm === "" || [
        caso.cliente.toLowerCase(),
        caso.asunto.toLowerCase(),
        caso.id.toString().toLowerCase()
      ].some(field => field.includes(searchTerm));

      // Filtro de estado
      const matchEstado = filtros.estado === "Todos" || caso.estado === filtros.estado;

      // Filtro de abogado
      const matchAbogado = filtros.abogado === "Todos" || caso.abogado === filtros.abogado;

      return matchBusqueda && matchEstado && matchAbogado;
    });
  }, [casos, filtros]);

  // Función para actualizar filtros
  const actualizarFiltros = (nuevosFiltros: Partial<FiltrosCasos>) => {
    setFiltros(prevFiltros => ({
      ...prevFiltros,
      ...nuevosFiltros
    }));
  };

  return {
    casos: casosFiltrados,
    loading,
    filtros,
    actualizarFiltros,
    abogados,
    estados,
    totalCasos: casos.length
  };
} 