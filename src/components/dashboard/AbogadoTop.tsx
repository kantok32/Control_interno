import type { Caso } from "../../hooks/useCasos";

export default function AbogadoTop({ casos }: { casos: Caso[] }) {
  const conteo: Record<string, number> = {};
  casos.forEach(caso => {
    conteo[caso.abogado] = (conteo[caso.abogado] || 0) + 1;
  });
  
  // Obtener los top 3 abogados
  const topAbogados = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  return (
    <div className="dashboard-card">
      <h4>Top Abogados por Asignaciones</h4>
      <div className="top-list">
        {topAbogados.map(([abogado, cantidad], index) => (
          <div key={abogado} className="top-item">
            <div className="rank">{index + 1}</div>
            <div className="info">
              <strong>{abogado}</strong>
              <span>{cantidad} casos</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .dashboard-card {
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .top-list {
          margin-top: 1rem;
        }
        .top-item {
          display: flex;
          align-items: center;
          margin: 10px 0;
          padding: 8px;
          border-radius: 4px;
          background: #f8f9fa;
        }
        .rank {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #007bff;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 12px;
          font-weight: bold;
        }
        .info {
          display: flex;
          flex-direction: column;
        }
        .info span {
          color: #6c757d;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
} 