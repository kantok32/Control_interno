import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NuevoPersonal: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    tipo_contrato: '',
    prevision: '',
    afp: '',
    sueldo_bruto: '',
    sueldo_liquido: '',
    inicio_contrato: '',
    termino_contrato: '',
    bono_incorporacion: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: enviar datos al backend
    alert('Personal agregado (simulado)');
    navigate('/personal');
  };

  return (
    <div className="nuevo-caso-container">
      <div className="form-header">
        <h2>Nuevo Personal</h2>
        <button className="close-button" onClick={() => navigate('/personal')}>×</button>
      </div>
      <form onSubmit={handleSubmit} className="nuevo-caso-form">
        <div className="form-section">
          <div className="form-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Tipo de Contrato</label>
            <input type="text" name="tipo_contrato" value={formData.tipo_contrato} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Previsión</label>
            <input type="text" name="prevision" value={formData.prevision} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>AFP</label>
            <input type="text" name="afp" value={formData.afp} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sueldo Bruto</label>
            <input type="number" name="sueldo_bruto" value={formData.sueldo_bruto} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Sueldo Líquido</label>
            <input type="number" name="sueldo_liquido" value={formData.sueldo_liquido} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Inicio de Contrato</label>
            <input type="date" name="inicio_contrato" value={formData.inicio_contrato} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Término de Contrato</label>
            <input type="date" name="termino_contrato" value={formData.termino_contrato} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Bono Incorporación</label>
            <input type="number" name="bono_incorporacion" value={formData.bono_incorporacion} onChange={handleChange} />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Guardar</button>
        </div>
      </form>
    </div>
  );
};

export default NuevoPersonal; 