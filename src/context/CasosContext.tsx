import React, { createContext, useContext, useState, useEffect } from 'react';
import API_ENDPOINTS, { authenticatedFetch } from '../config/api';

interface Caso {
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
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: string;
  fecha_apertura: string;
  fecha_actualizacion: string;
  total_documentos?: number;
  ultimo_documento?: string;
}

interface CasosContextType {
  casos: Caso[];
  loading: boolean;
  error: string | null;
  agregarCaso: (nuevoCaso: FormData) => Promise<Caso>;
  filtrarCasos: (filtros: any) => Caso[];
  cargarCasos: () => Promise<void>;
}

const CasosContext = createContext<CasosContextType | undefined>(undefined);

export const CasosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarCasos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.CASOS.LIST);
      if (!response.ok) {
        throw new Error('Error al cargar los casos');
      }
      const data = await response.json();
      setCasos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al cargar casos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCasos();
  }, []);

  const agregarCaso = async (formData: FormData): Promise<Caso> => {
    setLoading(true);
    setError(null);
    try {
      console.log('Iniciando creación de caso...');
      
      // Crear el objeto con los datos del caso usando la nueva estructura
      const casoData = {
        nombre_completo: formData.get('nombre_completo'),
        fecha_nacimiento: formData.get('fecha_nacimiento'),
        rut: formData.get('rut'),
        correo_electronico: formData.get('correo_electronico'),
        telefono: formData.get('telefono'),
        domicilio: formData.get('domicilio'),
        tipo_asesoria: formData.get('tipo_asesoria'),
        situacion_legal: formData.get('situacion_legal') === 'true',
        motivo_consulta: formData.get('motivo_consulta'),
        motivo_consulta_otro: formData.get('motivo_consulta_otro'),
        descripcion_asunto: formData.get('descripcion_asunto'),
        antecedentes_penales: formData.get('antecedentes_penales') === 'true',
        abogado: formData.get('abogado'),
        prioridad: formData.get('prioridad'),
        estado: formData.get('estado'),
        rit: formData.get('rit')
      };

      console.log('Datos del caso a enviar:', casoData);

      const responseCaso = await authenticatedFetch(API_ENDPOINTS.CASOS.CREATE, {
        method: 'POST',
        body: JSON.stringify(casoData)
      });

      console.log('Respuesta del servidor:', responseCaso.status, responseCaso.statusText);

      if (!responseCaso.ok) {
        const errorData = await responseCaso.json();
        console.error('Error del servidor:', errorData);
        throw new Error(errorData.message || 'Error al crear el caso');
      }

      const resultCaso = await responseCaso.json();
      console.log('Caso creado exitosamente:', resultCaso);
      const casoId = resultCaso.id;

      // Luego subimos los documentos si existen
      const archivos = formData.getAll('archivos');
      if (archivos.length > 0) {
        console.log('Subiendo archivos...');
        for (const archivo of archivos) {
          if (archivo instanceof File) {
            const docFormData = new FormData();
            docFormData.append('archivo', archivo);
            docFormData.append('caso_id', casoId);
            docFormData.append('nombre', archivo.name);
            docFormData.append('tipo', archivo.type);
            docFormData.append('descripcion', '');

            const responseDoc = await fetch(API_ENDPOINTS.DOCUMENTOS.UPLOAD, {
              method: 'POST',
              body: docFormData
            });

            if (!responseDoc.ok) {
              console.error('Error al subir documento:', archivo.name);
            }
          }
        }
      }
      
      // Recargar la lista de casos
      await cargarCasos();
      
      return resultCaso;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      console.error('Error al agregar caso:', err);
      throw err;
    } finally {
      setLoading(false);
    }
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
          caso.nombre_completo.toLowerCase().includes(terminoBusqueda) ||
          caso.descripcion_asunto.toLowerCase().includes(terminoBusqueda) ||
          caso.abogado.toLowerCase().includes(terminoBusqueda) ||
          caso.id.toString().toLowerCase().includes(terminoBusqueda)
        );
      }
      
      return cumpleFiltros;
    });
  };

  return (
    <CasosContext.Provider value={{ 
      casos, 
      loading, 
      error, 
      agregarCaso, 
      filtrarCasos,
      cargarCasos 
    }}>
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