import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PersonalTable from '../components/PersonalTable';

const DocumentacionPersonal: React.FC = () => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://localhost:3001/api/personal')
      .then(res => res.json())
      .then(data => {
        setPersonal(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar los documentos');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="loading">Cargando personal...</div>;
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