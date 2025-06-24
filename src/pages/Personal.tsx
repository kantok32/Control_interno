import { useEffect, useState } from 'react';
import { PageHeader } from "../components/Layout";
import { useNavigate } from 'react-router-dom';
import PersonalTable from '../components/PersonalTable';
import API_ENDPOINTS from '../config/api';

const Personal = () => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(API_ENDPOINTS.PERSONAL.LIST)
      .then(res => res.json())
      .then(data => {
        setPersonal(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el personal');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando personal...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <>
      <PageHeader title="Gestión de Personal" />
      <section className="toolbar">
        <div className="actions">
          <button 
            className="btn btn-outline" 
            onClick={() => navigate('/personal/nuevo')}
          >
            <i className="fas fa-plus"></i> Nuevo Personal
          </button>
        </div>
      </section>
      <section className="data-table-section">
        <div className="table-info">
          <p>Mostrando {personal.length} registros</p>
        </div>
        <PersonalTable personal={personal} />
      </section>
    </>
  );
};

export default Personal; 