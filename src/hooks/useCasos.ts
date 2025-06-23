import { useEffect, useState, useMemo } from "react";

export interface Caso {
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
  prioridad: "Alta" | "Media" | "Baja";
  estado: string;
  fecha_apertura: string;
  fecha_actualizacion: string;
  total_documentos?: number;
  ultimo_documento?: string;
  cliente: string;
  rit: string | null;
  asunto: string;
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
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<FiltrosCasos>({
    busqueda: "",
    estado: "Todos",
    abogado: "Todos"
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [responseCasos, responseEstados] = await Promise.all([
        fetch('http://localhost:3001/api/casos'),
        fetch('http://localhost:3001/api/estados')
      ]);

      if (!responseCasos.ok) throw new Error('Error al cargar casos');
      if (!responseEstados.ok) throw new Error('Error al cargar estados');
      
      const [casosList, estadosList] = await Promise.all([
        responseCasos.json(),
        responseEstados.json()
      ]);
      
      setCasos(casosList.map((caso: any) => ({
        ...caso,
        cliente: caso.nombre_completo,
        asunto: caso.descripcion_asunto,
        fechaApertura: caso.fecha_apertura,
        fecha_actualizacion: caso.fecha_actualizacion || caso.fecha_apertura
      })));
      setEstados(['Todos', ...estadosList.map((e: any) => e.nombre)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
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
    error,
    refreshCasos: fetchData,
    filtros,
    actualizarFiltros,
    abogados,
    estados,
    totalCasos: casos.length
  };
} 