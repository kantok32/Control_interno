import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalTable from '../components/PersonalTable';
import API_ENDPOINTS from '../config/api';

const DocumentacionPersonal: React.FC = () => {
  const navigate = useNavigate();
  const [personal, setPersonal] = useState([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPersonal = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.PERSONAL.LIST);
        if (!response.ok) {
          throw new Error('Error al cargar personal');
        }
        const data = await response.json();
        setPersonal(data);
      } catch (error) {
        console.error('Error:', error);
        setError('Error al cargar personal');
      }
    };

    fetchPersonal();
  }, []);

  if (error) return <div className="error">{error}</div>;

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Documentación de Personal</h2>
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
    </div>
  );
};

export default DocumentacionPersonal; 