import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_ENDPOINTS, { authenticatedFetch } from '../config/api';

interface Personal {
  id: number;
  nombre: string;
  tipo_contrato: string;
  prevision: string;
  afp: string;
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
  const [editData, setEditData] = useState<Personal | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEdit = (p: Personal) => {
    setEditData(p);
    setEditForm({ ...p });
    setShowEditModal(true);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.PERSONAL.UPDATE(editData!.id.toString()), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (res.ok) {
        setShowEditModal(false);
        window.location.reload();
      } else {
        alert('Error al actualizar el personal');
      }
    } catch {
      alert('Error al actualizar el personal');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    setLoading(true);
    try {
      const res = await authenticatedFetch(API_ENDPOINTS.PERSONAL.DELETE(id.toString()), {
        method: 'DELETE'
      });
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Error al eliminar el personal');
      }
    } catch {
      alert('Error al eliminar el personal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="table-container">
      {showEditModal && editForm && (
        <div className="modal-bg" style={{ position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.3)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <form onSubmit={handleEditSubmit} style={{ background:'#fff', padding:32, borderRadius:8, minWidth:320, display:'flex', flexDirection:'column', gap:16, maxWidth:500 }}>
            <h3>Editar Personal</h3>
            <input type="text" name="nombre" value={editForm.nombre} onChange={handleEditChange} required placeholder="Nombre" />
            <input type="text" name="tipo_contrato" value={editForm.tipo_contrato} onChange={handleEditChange} required placeholder="Tipo de Contrato" />
            <input type="text" name="prevision" value={editForm.prevision} onChange={handleEditChange} placeholder="Previsión" />
            <input type="text" name="afp" value={editForm.afp} onChange={handleEditChange} placeholder="AFP" />
            <input type="number" name="sueldo_bruto" value={editForm.sueldo_bruto} onChange={handleEditChange} placeholder="Sueldo Bruto" />
            <input type="number" name="sueldo_liquido" value={editForm.sueldo_liquido} onChange={handleEditChange} placeholder="Sueldo Líquido" />
            <input type="date" name="inicio_contrato" value={editForm.inicio_contrato || ''} onChange={handleEditChange} placeholder="Inicio Contrato" />
            <input type="date" name="termino_contrato" value={editForm.termino_contrato || ''} onChange={handleEditChange} placeholder="Término Contrato" />
            <input type="number" name="bono_incorporacion" value={editForm.bono_incorporacion} onChange={handleEditChange} placeholder="Bono Incorporación" />
            <div style={{ display:'flex', justifyContent:'flex-end', gap:8 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
      <table className="casos-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Tipo de Contrato</th>
            <th>Previsión</th>
            <th>AFP</th>
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
              <td>{p.afp}</td>
              <td>{Number(p.sueldo_bruto).toLocaleString('es-CL')}</td>
              <td>{Number(p.sueldo_liquido).toLocaleString('es-CL')}</td>
              <td>{p.inicio_contrato}</td>
              <td>{p.termino_contrato || '-'}</td>
              <td>{Number(p.bono_incorporacion).toLocaleString('es-CL')}</td>
              <td>
                <div className="action-icons">
                  <button className="action-btn edit" title="Editar" onClick={() => handleEdit(p)}><i className="fas fa-pencil-alt"></i></button>
                  <button className="action-btn delete" title="Eliminar" onClick={() => handleDelete(p.id)}><i className="fas fa-trash-alt"></i></button>
                  <button className="action-btn doc" title="Agregar Documentos" onClick={() => navigate(`/personal/${p.id}/documentos`)}><i className="fas fa-file-upload"></i></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PersonalTable; 