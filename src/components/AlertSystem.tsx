import React, { useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { getMitigationGaps } from '../services/riskService';

export const AlertSystem: React.FC = () => {
  const { state } = useProject();

  const alerts = useMemo(() => {
    const list: string[] = [];

    // 1. High risk + no intervention
    state.municipios.forEach(m => {
      const gaps = getMitigationGaps(m.id, state.riesgosTerritoriales, state.proyectos);
      if (gaps.length > 0 && gaps.some(r => r.impacto === 'alto')) {
        list.push(`Alerta: Municipio ${m.nombre} tiene riesgo alto sin intervención.`);
      }
    });

    // 2. Key project delayed
    state.proyectos.forEach(p => {
      if (p.estado === 'En ejecución' && p.matrix?.atrasoEjecucionObra && p.matrix.atrasoEjecucionObra > 10) {
        list.push(`Alerta: Proyecto clave ${p.nombre} está atrasado.`);
      }
    });

    // 3. Convenio con bajo impacto real
    state.convenios.forEach(c => {
      if (c.valorTotal > 1000000000 && c.riesgosImpactadosIds?.length === 0) {
        list.push(`Alerta: Convenio ${c.nombre} tiene bajo impacto registrado.`);
      }
    });

    // 4. Entes de Control
    state.entesControl?.forEach(e => {
      if (e.estado === 'Sancionado') {
        const contratista = state.contratistas.find(c => c.id === e.referenciaId);
        list.push(`CRÍTICO: Contratista ${contratista?.nombre || e.referenciaId} SANCIONADO por ${e.entidad}.`);
      } else if (e.estado === 'Con Hallazgos') {
        const contratista = state.contratistas.find(c => c.id === e.referenciaId);
        list.push(`Alerta: Contratista ${contratista?.nombre || e.referenciaId} presenta hallazgos en ${e.entidad}.`);
      }
    });

    return list;
  }, [state]);

  return (
    <div className="p-4 bg-red-50 rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-red-800">Alertas del Sistema</h2>
      {alerts.length === 0 ? (
        <p>No hay alertas activas.</p>
      ) : (
        <ul className="list-disc pl-5">
          {alerts.map((alert, index) => (
            <li key={index} className="text-red-700">{alert}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
