import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EditarCasoForm } from '../components/EditarCasoForm';
import { useCasos } from '../hooks/useCasos';

const EditarCasoPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { casos, loading: loadingCasos, error: errorCasos, refreshCasos } = useCasos();
  const [caso, setCaso] = useState<any>(null);

  useEffect(() => {
    if (id) {
      const casoEncontrado = casos.find(c => c.id.toString() === id);
      if (casoEncontrado) {
        setCaso(casoEncontrado);
      } else if (!loadingCasos && casos.length > 0) {
        // Opcional: manejar caso no encontrado
        console.warn(`Caso con id ${id} no encontrado.`);
        // navigate('/casos'); 
      }
    }
  }, [id, casos, loadingCasos, navigate]);

  const handleSave = async () => {
    await refreshCasos();
    navigate('/casos');
  };

  if (loadingCasos || !caso) {
    return <div>Cargando datos del caso...</div>;
  }
  
  if (errorCasos) {
    return <div className="error-message">Error al cargar el caso: {errorCasos}</div>;
  }

  return (
    <div className="page-container">
      <div className="form-container">
        <EditarCasoForm
          caso={caso}
          onSave={handleSave}
          onClose={() => navigate('/casos')}
        />
      </div>
    </div>
  );
};

export default EditarCasoPage; 