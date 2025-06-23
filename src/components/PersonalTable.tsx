import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Personal {
  id: number;
  nombre: string;
  tipo_contrato: string;
  prevision: string;
  adp: string;
  sueldo_bruto: number;
  sueldo_liquido: number;
  inicio_contrato: string;
  termino_contrato: string;
  bono_incorporacion: number;
}

interface PersonalTableProps {
  personal: Personal[];
}

const PersonalTable: React.FC<PersonalTableProps> = ({ personal }) => {
  const navigate = useNavigate();

  return (
    <div className="table-container">
      <table className="casos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo de Contrato</th>
            <th>Previsión</th>
            <th>ADP</th>
            <th>Sueldo Bruto</th>
            <th>Sueldo Líquido</th>
            <th>Inicio Contrato</th>
            <th>Término Contrato</th>
            <th>Bono Incorporación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {personal.map((p) => (
            <tr key={p.id}>
              <td>{p.nombre}</td>
              <td>{p.tipo_contrato}</td>
              <td>{p.prevision}</td>
              <td>{p.adp}</td>
              <td>{p.sueldo_bruto?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
              <td>{p.sueldo_liquido?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
              <td>{p.inicio_contrato}</td>
              <td>{p.termino_contrato || '-'}</td>
              <td>{p.bono_incorporacion?.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' })}</td>
              <td>
                <button className="icon-edit" title="Editar"><i className="fas fa-pencil-alt"></i></button>
                <button className="icon-delete" title="Eliminar"><i className="fas fa-trash-alt"></i></button>
                <button className="icon-doc" title="Agregar Documentos" onClick={() => navigate(`/personal/${p.id}/documentos`)}><i className="fas fa-file-upload"></i></button>
                {/* Aquí puedes agregar más acciones, como ver documentos */}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonalTable; 