import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../components/Layout';
import { useCasos } from '../context/CasosContext';

interface NuevoCasoForm {
  cliente: string;
  asunto: string;
  abogado: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'ACTIVO' | 'EN ESPERA' | 'CERRADO';
  fechaApertura: string;
}

const abogadosDisponibles = [
  'J. Pérez',
  'A. Gómez',
  'M. Rodríguez',
  'C. López',
  'S. Fernández'
];

const NuevoCaso = () => {
  const navigate = useNavigate();
  const { agregarCaso } = useCasos();
  const [formData, setFormData] = useState<NuevoCasoForm>({
    cliente: '',
    asunto: '',
    abogado: '',
    prioridad: 'Media',
    estado: 'ACTIVO',
    fechaApertura: new Date().toISOString().split('T')[0]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevoCaso = agregarCaso(formData);
    console.log('Caso creado:', nuevoCaso);
    navigate('/casos');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <>
      <PageHeader title="Crear Nuevo Caso" />
      <div className="nuevo-caso-container">
        <form onSubmit={handleSubmit} className="nuevo-caso-form">
          <div className="form-group">
            <label htmlFor="cliente">Cliente</label>
            <input
              type="text"
              id="cliente"
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
              placeholder="Nombre del cliente"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="asunto">Asunto</label>
            <textarea
              id="asunto"
              name="asunto"
              value={formData.asunto}
              onChange={handleChange}
              placeholder="Descripción del caso"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="abogado">Abogado Asignado</label>
              <select
                id="abogado"
                name="abogado"
                value={formData.abogado}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar abogado</option>
                {abogadosDisponibles.map(abogado => (
                  <option key={abogado} value={abogado}>
                    {abogado}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="prioridad">Prioridad</label>
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                required
              >
                <option value="ACTIVO">ACTIVO</option>
                <option value="EN ESPERA">EN ESPERA</option>
                <option value="CERRADO">CERRADO</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="fechaApertura">Fecha de Apertura</label>
              <input
                type="date"
                id="fechaApertura"
                name="fechaApertura"
                value={formData.fechaApertura}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => navigate('/casos')}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              Crear Caso
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NuevoCaso; 