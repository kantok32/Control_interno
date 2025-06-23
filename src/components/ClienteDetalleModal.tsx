import React from 'react';

interface ClienteDetalleModalProps {
  open: boolean;
  onClose: () => void;
  cliente: {
    nombre_completo: string;
    rut: string;
    fecha_nacimiento: string;
    correo_electronico: string;
    telefono: string;
  };
}

function formatFecha(fecha: string) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d.getTime())) return fecha;
  return d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const ClienteDetalleModal: React.FC<ClienteDetalleModalProps> = ({ open, onClose, cliente }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content cliente-modal">
        <div className="modal-header">
          <h3>Datos Personales</h3>
          <button className="btn-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="cliente-dato"><span className="dato-label">Nombre completo:</span> <span className="dato-valor">{cliente.nombre_completo}</span></div>
          <div className="cliente-dato"><span className="dato-label">RUT:</span> <span className="dato-valor">{cliente.rut}</span></div>
          <div className="cliente-dato"><span className="dato-label">Fecha de nacimiento:</span> <span className="dato-valor">{formatFecha(cliente.fecha_nacimiento)}</span></div>
          <div className="cliente-dato"><span className="dato-label">Correo electrónico:</span> <span className="dato-valor">{cliente.correo_electronico}</span></div>
          <div className="cliente-dato"><span className="dato-label">Teléfono:</span> <span className="dato-valor">{cliente.telefono || '-'}</span></div>
        </div>
      </div>
    </div>
  );
};

export default ClienteDetalleModal; 