import type { Caso } from "../../hooks/useCasos";

export default function TiemposYMovimientos({ casos }: { casos: Caso[] }) {
  // Simulación de cálculo de tiempo promedio (días entre fecha y fechaActualizacion)
  const tiempos = casos.map(caso => {
    const inicio = new Date(caso.fecha_apertura);
    const fin = new Date(caso.fecha_actualizacion);
    return (fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24);
  });
  
  const promedio = tiempos.length
    ? (tiempos.reduce((a, b) => a + b, 0) / tiempos.length).toFixed(1)
    : "N/A";

  // Últimos movimientos (ordenados por fechaActualizacion)
  const ultimos = [...casos]
    .sort((a, b) => 
      new Date(b.fecha_actualizacion).getTime() - new Date(a.fecha_actualizacion).getTime()
    )
    .slice(0, 5);

  return (
    <div className="dashboard-card">
      <div className="tiempo-promedio">
        <h4>Tiempo promedio de resolución</h4>
        <div className="tiempo-valor">{promedio} días</div>
      </div>
      
      <div className="movimientos">
        <h4>Últimos movimientos</h4>
        <div className="movimientos-list">
          {ultimos.map(caso => (
            <div key={caso.id} className="movimiento-item">
              <div className="movimiento-info">
                <strong>{caso.cliente}</strong>
                <span>{caso.abogado}</span>
              </div>
              <div className="movimiento-fecha">
                {new Date(caso.fecha_actualizacion).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .dashboard-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-top: 1rem;
        }
        .tiempo-promedio {
          text-align: center;
          margin-bottom: 2rem;
        }
        .tiempo-valor {
          font-size: 2rem;
          font-weight: bold;
          color: #007bff;
        }
        .movimientos-list {
          margin-top: 1rem;
        }
        .movimiento-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border-bottom: 1px solid #dee2e6;
        }
        .movimiento-info {
          display: flex;
          flex-direction: column;
        }
        .movimiento-info span {
          color: #6c757d;
          font-size: 0.9rem;
        }
        .movimiento-fecha {
          color: #6c757d;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
} 