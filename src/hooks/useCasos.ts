import { useEffect, useState, useMemo } from "react";

export interface Caso {
  id: string;
  cliente: string;
  asunto: string;
  abogado: string;
  prioridad: "Alta" | "Media" | "Baja";
  estado: "ACTIVO" | "EN ESPERA" | "CERRADO";
  fechaApertura: string;
  ultimaActualizacion: string;
}

export interface FiltrosCasos {
  busqueda: string;
  estado: string;
  abogado: string;
}

// Datos simulados que coinciden con la imagen
const casosSimulados: Caso[] = [
  {
    id: "CAS-001",
    cliente: "Corp. Acme",
    asunto: "Disputa contractual por servicios no prestados.",
    abogado: "J. Pérez",
    prioridad: "Alta",
    estado: "ACTIVO",
    fechaApertura: "2023-01-15",
    ultimaActualizacion: "2023-05-20"
  },
  {
    id: "CAS-002",
    cliente: "Innovatech Solutions",
    asunto: "Registro de patente para nuevo software de IA.",
    abogado: "A. Gómez",
    prioridad: "Alta",
    estado: "ACTIVO",
    fechaApertura: "2023-02-10",
    ultimaActualizacion: "2023-05-18"
  },
  {
    id: "CAS-003",
    cliente: "Tech Forward Inc.",
    asunto: "Asesoría laboral para nueva contratación.",
    abogado: "M. Rodríguez",
    prioridad: "Media",
    estado: "EN ESPERA",
    fechaApertura: "2023-03-05",
    ultimaActualizacion: "2023-05-22"
  },
  {
    id: "CAS-004",
    cliente: "Bienes Raíces Seguros",
    asunto: "Revisión de contrato de arrendamiento comercial.",
    abogado: "C. López",
    prioridad: "Baja",
    estado: "CERRADO",
    fechaApertura: "2023-03-20",
    ultimaActualizacion: "2023-05-15"
  },
  {
    id: "CAS-005",
    cliente: "Familia Martínez",
    asunto: "Proceso de divorcio y custodia.",
    abogado: "S. Fernández",
    prioridad: "Media",
    estado: "ACTIVO",
    fechaApertura: "2023-04-01",
    ultimaActualizacion: "2023-05-21"
  },
  {
    id: "CAS-006",
    cliente: "Comercializadora del Sur",
    asunto: "Defensa en caso de responsabilidad de producto.",
    abogado: "J. Pérez",
    prioridad: "Alta",
    estado: "EN ESPERA",
    fechaApertura: "2023-04-10",
    ultimaActualizacion: "2023-05-19"
  },
  {
    id: "CAS-007",
    cliente: "Startup Creativa",
    asunto: "Constitución de la sociedad y pacto de socios.",
    abogado: "A. Gómez",
    prioridad: "Media",
    estado: "ACTIVO",
    fechaApertura: "2023-05-02",
    ultimaActualizacion: "2023-05-17"
  },
  {
    id: "CAS-008",
    cliente: "Constructora Monte",
    asunto: "Litigio por incumplimiento de obra.",
    abogado: "C. López",
    prioridad: "Baja",
    estado: "CERRADO",
    fechaApertura: "2023-05-11",
    ultimaActualizacion: "2023-05-22"
  }
];

export const ESTADOS = ["Todos", "ACTIVO", "EN ESPERA", "CERRADO"];

export function useCasos() {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosCasos>({
    busqueda: "",
    estado: "Todos",
    abogado: "Todos"
  });

  // Simular llamada a la API
  useEffect(() => {
    const fetchCasos = async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      setCasos(casosSimulados);
      setLoading(false);
    };

    fetchCasos();
  }, []);

  // Lista de abogados únicos para el filtro
  const abogados = useMemo(() => {
    const uniqueAbogados = Array.from(new Set(casosSimulados.map(caso => caso.abogado)));
    return ["Todos", ...uniqueAbogados.sort()];
  }, []);

  // Filtrar casos según los criterios
  const casosFiltrados = useMemo(() => {
    if (!casos.length) return [];

    return casos.filter(caso => {
      // Filtro de búsqueda
      const searchTerm = filtros.busqueda.toLowerCase().trim();
      const matchBusqueda = searchTerm === "" || [
        caso.cliente.toLowerCase(),
        caso.asunto.toLowerCase(),
        caso.id.toLowerCase()
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
    ESTADOS,
    totalCasos: casos.length
  };
} 