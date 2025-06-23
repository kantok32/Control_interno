import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCasos } from '../context/CasosContext';
import '../styles/components.css';

interface Estado {
  nombre: string;
  descripcion: string;
}

interface NuevoCasoForm {
  nombre_completo: string;
  fecha_nacimiento: string;
  rut: string;
  correo_electronico: string;
  telefono: string;
  domicilio: string;
  tipo_asesoria: 'Derecho de Familia' | 'Derecho Laboral' | 'Derecho Penal' | 'Derecho Comercial' | 'Derecho Civil';
  situacion_legal: boolean;
  motivo_consulta: 'Asesoria judicial' | 'Representacion judicial activa' | 'Defensa en proceso judicial' | 'Mediacion/negociacion' | 'Otros';
  motivo_consulta_otro?: string;
  descripcion_asunto: string;
  antecedentes_penales: boolean;
  abogado: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: string;
  rit: string;
  archivos: File[];
}

interface FormErrors {
  nombre_completo?: string;
  fecha_nacimiento?: string;
  rut?: string;
  correo_electronico?: string;
  telefono?: string;
  domicilio?: string;
  tipo_asesoria?: string;
  motivo_consulta?: string;
  motivo_consulta_otro?: string;
  descripcion_asunto?: string;
  abogado?: string;
  estado?: string;
  rit?: string;
  archivos?: string;
  submit?: string;
}

const abogadosDisponibles = [
  'J. Pérez',
  'A. Gómez',
  'M. Rodríguez',
  'C. López',
  'S. Fernández'
];

const motivosConsulta = [
  'Asesoria judicial',
  'Representacion judicial activa',
  'Defensa en proceso judicial',
  'Mediacion/negociacion',
  'Otros'
] as const;

const tiposAsesoria = [
  'Derecho de Familia',
  'Derecho Laboral',
  'Derecho Penal',
  'Derecho Comercial',
  'Derecho Civil'
] as const;

const NuevoCaso = () => {
  const navigate = useNavigate();
  const { agregarCaso } = useCasos();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const fechaActual = new Date().toISOString().split('T')[0];
  
  useEffect(() => {
    const cargarEstados = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/estados');
        if (!response.ok) throw new Error('Error al cargar estados');
        const data = await response.json();
        setEstados(data);
        if (data.length > 0) {
          setFormData(prev => ({
            ...prev,
            estado: data[0].nombre
          }));
        }
      } catch (error) {
        console.error('Error al cargar estados:', error);
      }
    };
    cargarEstados();
  }, []);

  const [formData, setFormData] = useState<NuevoCasoForm>({
    nombre_completo: '',
    fecha_nacimiento: '',
    rut: '',
    correo_electronico: '',
    telefono: '',
    domicilio: '',
    tipo_asesoria: 'Derecho de Familia',
    situacion_legal: false,
    motivo_consulta: 'Asesoria judicial',
    motivo_consulta_otro: '',
    descripcion_asunto: '',
    antecedentes_penales: false,
    abogado: '',
    prioridad: 'Media',
    estado: '',
    rit: '',
    archivos: []
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!formData.nombre_completo.trim()) {
      newErrors.nombre_completo = 'El nombre completo es requerido';
    }
    if (!formData.fecha_nacimiento) {
      newErrors.fecha_nacimiento = 'La fecha de nacimiento es requerida';
    }
    if (!formData.rut.trim()) {
      newErrors.rut = 'El RUT es requerido';
    }
    if (!formData.correo_electronico.trim()) {
      newErrors.correo_electronico = 'El correo electrónico es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_electronico)) {
      newErrors.correo_electronico = 'El correo electrónico no es válido';
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    } else if (!/^\+?56?\d{9}$/.test(formData.telefono.replace(/\s+/g, ''))) {
      newErrors.telefono = 'El teléfono debe ser un número válido de Chile (9 dígitos)';
    }
    if (!formData.domicilio.trim()) {
      newErrors.domicilio = 'El domicilio es requerido';
    }
    if (!formData.tipo_asesoria.trim()) {
      newErrors.tipo_asesoria = 'El tipo de asesoría es requerido';
    }
    if (!formData.descripcion_asunto.trim()) {
      newErrors.descripcion_asunto = 'La descripción del asunto es requerida';
    }
    if (formData.motivo_consulta === 'Otros' && !formData.motivo_consulta_otro?.trim()) {
      newErrors.motivo_consulta_otro = 'Debe especificar el otro motivo de consulta';
    }
    if (!formData.abogado) {
      newErrors.abogado = 'Debe seleccionar un abogado';
    }
    if (!formData.estado) {
      newErrors.estado = 'Debe seleccionar un estado';
    }
    if (!formData.rit.trim()) {
      newErrors.rit = 'El RIT es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      
      // Agregar los datos del caso
      const fields = [
        'nombre_completo',
        'fecha_nacimiento',
        'rut',
        'correo_electronico',
        'telefono',
        'domicilio',
        'rit',
        'tipo_asesoria',
        'situacion_legal',
        'motivo_consulta',
        'motivo_consulta_otro',
        'descripcion_asunto',
        'antecedentes_penales',
        'abogado',
        'prioridad',
        'estado'
      ];
      fields.forEach(field => {
        const key = field as keyof NuevoCasoForm;
        if (key in formData && key !== 'archivos') {
          formDataToSend.append(key, (formData[key] as any).toString());
        }
      });

      // Agregar los archivos
      formData.archivos.forEach((file) => {
        formDataToSend.append('archivos', file);
      });

      await agregarCaso(formDataToSend);
      navigate('/casos');
    } catch (error) {
      console.error('Error al crear el caso:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Error al crear el caso. Por favor, intente nuevamente.'
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const validFiles = newFiles.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
      
      if (validFiles.length !== newFiles.length) {
        setErrors(prev => ({
          ...prev,
          archivos: 'Algunos archivos exceden el límite de 10MB'
        }));
      }

      setFormData(prev => ({
        ...prev,
        archivos: [...prev.archivos, ...validFiles]
      }));
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => file.size <= 10 * 1024 * 1024);

    if (validFiles.length !== droppedFiles.length) {
      setErrors(prev => ({
        ...prev,
        archivos: 'Algunos archivos exceden el límite de 10MB'
      }));
    }

    setFormData(prev => ({
      ...prev,
      archivos: [...prev.archivos, ...validFiles]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      archivos: prev.archivos.filter((_, i) => i !== index)
    }));
    setErrors(prev => ({
      ...prev,
      archivos: undefined
    }));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="nuevo-caso-container">
      <div className="form-header">
        <h2>Registro de Nuevo Caso</h2>
        <button className="close-button" onClick={() => navigate('/casos')}>×</button>
      </div>

      <form onSubmit={handleSubmit} className="nuevo-caso-form">
        {errors.submit && (
          <div className="error-message submit-error">
            {errors.submit}
          </div>
        )}
        
        <div className="form-section">
          <h3>Datos Personales</h3>
          
          <div className="form-row nombre-fecha">
            <div className="form-group">
              <label htmlFor="nombre_completo">
                Nombre Completo <span className="required">*</span>
              </label>
              <input
                type="text"
                id="nombre_completo"
                name="nombre_completo"
                value={formData.nombre_completo || ""}
                onChange={handleChange}
                placeholder="Ingrese el nombre completo"
                className={errors.nombre_completo ? 'error' : ''}
                required
              />
              {errors.nombre_completo && <span className="error-message">{errors.nombre_completo}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="fecha_nacimiento">
                Fecha de Nacimiento <span className="required">*</span>
              </label>
              <input
                type="date"
                id="fecha_nacimiento"
                name="fecha_nacimiento"
                value={formData.fecha_nacimiento ? formData.fecha_nacimiento.slice(0, 10) : ""}
                onChange={handleChange}
                max={fechaActual}
                className={errors.fecha_nacimiento ? 'error' : ''}
                required
              />
              {errors.fecha_nacimiento && <span className="error-message">{errors.fecha_nacimiento}</span>}
            </div>
          </div>

          <div className="form-row contacto">
            <div className="form-group">
              <label htmlFor="rut">
                RUT <span className="required">*</span>
              </label>
              <input
                type="text"
                id="rut"
                name="rut"
                value={formData.rut || ""}
                onChange={handleChange}
                placeholder="12.345.678-9"
                className={errors.rut ? 'error' : ''}
                required
              />
              {errors.rut && <span className="error-message">{errors.rut}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="correo_electronico">
                Correo Electrónico <span className="required">*</span>
              </label>
              <input
                type="email"
                id="correo_electronico"
                name="correo_electronico"
                value={formData.correo_electronico || ""}
                onChange={handleChange}
                placeholder="ejemplo@correo.com"
                className={errors.correo_electronico ? 'error' : ''}
                required
              />
              {errors.correo_electronico && <span className="error-message">{errors.correo_electronico}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="telefono">
                Teléfono <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono || ""}
                onChange={handleChange}
                placeholder="+56912345678"
                className={errors.telefono ? 'error' : ''}
                required
              />
              {errors.telefono && <span className="error-message">{errors.telefono}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="rit">RIT</label>
              <input
                type="text"
                id="rit"
                name="rit"
                value={formData.rit || ""}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group full-width">
            <label htmlFor="domicilio">
              Domicilio <span className="required">*</span>
            </label>
            <input
              type="text"
              id="domicilio"
              name="domicilio"
              value={formData.domicilio || ""}
              onChange={handleChange}
              placeholder="Ingrese el domicilio completo"
              className={errors.domicilio ? 'error' : ''}
              required
            />
            {errors.domicilio && <span className="error-message">{errors.domicilio}</span>}
          </div>
        </div>

        <div className="form-section">
          <h3>Información del Caso</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="tipo_asesoria">
                Tipo de Asesoría <span className="required">*</span>
              </label>
              <select
                id="tipo_asesoria"
                name="tipo_asesoria"
                value={formData.tipo_asesoria}
                onChange={handleChange}
                className={errors.tipo_asesoria ? 'error' : ''}
              >
                {tiposAsesoria.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errors.tipo_asesoria && <span className="error-message">{errors.tipo_asesoria}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="situacion_legal">
                Situación Legal Actual
              </label>
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="situacion_legal"
                  name="situacion_legal"
                  checked={Boolean(formData.situacion_legal)}
                  onChange={handleChange}
                />
                <label htmlFor="situacion_legal">Tiene situación legal actual</label>
              </div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="motivo_consulta">
                Motivo de la Consulta <span className="required">*</span>
              </label>
              <select
                id="motivo_consulta"
                name="motivo_consulta"
                value={formData.motivo_consulta}
                onChange={handleChange}
                className={errors.motivo_consulta ? 'error' : ''}
              >
                {motivosConsulta.map(motivo => (
                  <option key={motivo} value={motivo}>
                    {motivo}
                  </option>
                ))}
              </select>
              {errors.motivo_consulta && <span className="error-message">{errors.motivo_consulta}</span>}
            </div>

            {formData.motivo_consulta === 'Otros' && (
              <div className="form-group">
                <label htmlFor="motivo_consulta_otro">
                  Especifique el motivo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="motivo_consulta_otro"
                  name="motivo_consulta_otro"
                  value={formData.motivo_consulta_otro}
                  onChange={handleChange}
                  placeholder="Especifique el motivo de la consulta"
                  className={errors.motivo_consulta_otro ? 'error' : ''}
                />
                {errors.motivo_consulta_otro && <span className="error-message">{errors.motivo_consulta_otro}</span>}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="descripcion_asunto">
              Descripción breve del asunto <span className="required">*</span>
            </label>
            <textarea
              id="descripcion_asunto"
              name="descripcion_asunto"
              value={formData.descripcion_asunto}
              onChange={handleChange}
              placeholder="Describa brevemente el asunto"
              className={errors.descripcion_asunto ? 'error' : ''}
            />
            {errors.descripcion_asunto && <span className="error-message">{errors.descripcion_asunto}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="antecedentes_penales">
              Antecedentes Penales
            </label>
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="antecedentes_penales"
                name="antecedentes_penales"
                checked={Boolean(formData.antecedentes_penales)}
                onChange={handleChange}
              />
              <label htmlFor="antecedentes_penales">Tiene antecedentes penales</label>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>Asignación y Documentos</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="abogado">
                Abogado Asignado <span className="required">*</span>
              </label>
              <select
                id="abogado"
                name="abogado"
                value={formData.abogado}
                onChange={handleChange}
                className={errors.abogado ? 'error' : ''}
              >
                <option value="">Seleccione un abogado</option>
                {abogadosDisponibles.map(abogado => (
                  <option key={abogado} value={abogado}>
                    {abogado}
                  </option>
                ))}
              </select>
              {errors.abogado && <span className="error-message">{errors.abogado}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="prioridad">Prioridad</label>
              <select
                id="prioridad"
                name="prioridad"
                value={formData.prioridad}
                onChange={handleChange}
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estado">
                Estado <span className="required">*</span>
              </label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={errors.estado ? 'error' : ''}
              >
                <option value="">Seleccione un estado</option>
                {estados.map(estado => (
                  <option key={estado.nombre} value={estado.nombre}>
                    {estado.nombre}
                  </option>
                ))}
              </select>
              {errors.estado && <span className="error-message">{errors.estado}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Documentos Adjuntos</label>
            <div
              className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={openFileDialog}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                style={{ display: 'none' }}
              />
              <div className="drop-zone-text">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>Arrastra archivos aquí o haz clic para seleccionar</p>
                <span>Máximo 10MB por archivo</span>
              </div>
            </div>
            {errors.archivos && <span className="error-message">{errors.archivos}</span>}
            {formData.archivos.length > 0 && (
              <div className="selected-files">
                {formData.archivos.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="remove-file"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/casos')}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            <i className="fas fa-times"></i>
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            <i className="fas fa-save"></i>
            {isSubmitting ? 'Guardando...' : 'Guardar Caso'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NuevoCaso; 