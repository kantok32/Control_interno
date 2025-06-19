import React, { useState, useEffect } from 'react';
import '../styles/components.css';

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
}

interface EditarCasoFormProps {
  caso: Caso;
  onClose: () => void;
  onSave: () => void;
}

const tiposAsesoria = [
  'Derecho de Familia',
  'Derecho Laboral',
  'Derecho Penal',
  'Derecho Comercial',
  'Derecho Civil'
] as const;

const motivosConsulta = [
  'Asesoria judicial',
  'Representacion judicial activa',
  'Defensa en proceso judicial',
  'Mediacion/negociacion',
  'Otros'
] as const;

const abogadosDisponibles = [
  'J. Pérez',
  'A. Gómez',
  'M. Rodríguez',
  'C. López',
  'S. Fernández'
] as const;

export const EditarCasoForm: React.FC<EditarCasoFormProps> = ({ caso, onClose, onSave }) => {
  const [formData, setFormData] = useState<Caso>(caso);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:3001/api/casos/${caso.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el caso');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editar-caso-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Editar Caso #{caso.id}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="editar-caso-form">
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
                  value={formData.nombre_completo}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_nacimiento">
                  Fecha de Nacimiento <span className="required">*</span>
                </label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                  required
                />
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
                  value={formData.rut}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo_electronico">
                  Correo Electrónico <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="correo_electronico"
                  name="correo_electronico"
                  value={formData.correo_electronico}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">
                  Teléfono <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
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
                value={formData.domicilio}
                onChange={handleChange}
                required
              />
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
                  required
                >
                  {tiposAsesoria.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="motivo_consulta">
                  Motivo de Consulta <span className="required">*</span>
                </label>
                <select
                  id="motivo_consulta"
                  name="motivo_consulta"
                  value={formData.motivo_consulta}
                  onChange={handleChange}
                  required
                >
                  {motivosConsulta.map((motivo) => (
                    <option key={motivo} value={motivo}>
                      {motivo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="abogado">
                  Abogado Asignado <span className="required">*</span>
                </label>
                <select
                  id="abogado"
                  name="abogado"
                  value={formData.abogado}
                  onChange={handleChange}
                  required
                >
                  {abogadosDisponibles.map((abogado) => (
                    <option key={abogado} value={abogado}>
                      {abogado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {formData.motivo_consulta === 'Otros' && (
              <div className="form-group">
                <label htmlFor="motivo_consulta_otro">
                  Especifique Motivo <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="motivo_consulta_otro"
                  name="motivo_consulta_otro"
                  value={formData.motivo_consulta_otro || ''}
                  onChange={handleChange}
                  required
                />
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="prioridad">
                  Prioridad <span className="required">*</span>
                </label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={formData.prioridad}
                  onChange={handleChange}
                  required
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
                  required
                >
                  <option value="CAPTACION">Captación</option>
                  <option value="EN PROCESO">En Proceso</option>
                  <option value="CERRADO">Cerrado</option>
                </select>
              </div>
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion_asunto">
                Descripción del Asunto <span className="required">*</span>
              </label>
              <textarea
                id="descripcion_asunto"
                name="descripcion_asunto"
                value={formData.descripcion_asunto}
                onChange={handleChange}
                rows={4}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="situacion_legal"
                    checked={Boolean(formData.situacion_legal)}
                    onChange={handleChange}
                  />
                  Tiene situación legal pendiente
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="antecedentes_penales"
                    checked={Boolean(formData.antecedentes_penales)}
                    onChange={handleChange}
                  />
                  Tiene antecedentes penales
                </label>
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 