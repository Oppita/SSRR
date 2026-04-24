import React, { useMemo } from 'react';
import { ProjectData, RiesgoTerritorial } from '../types';
import { getMitigationGaps } from '../services/riskService';
import { AlertTriangle, Target, Activity, ShieldCheck } from 'lucide-react';

interface Props {
  municipioId: string;
  municipioNombre: string;
  projects: ProjectData[];
  riesgos: RiesgoTerritorial[];
  onClose: () => void;
}

export const MunicipalityDetailView: React.FC<Props> = ({ municipioId, municipioNombre, projects, riesgos, onClose }) => {
  const muniRisks = useMemo(() => riesgos.filter(r => r.municipioId === municipioId), [riesgos, municipioId]);
  const muniProjects = useMemo(() => projects.filter(p => p.project.municipio === municipioNombre), [projects, municipioNombre]);
  const gaps = useMemo(() => getMitigationGaps(municipioId, riesgos, projects), [municipioId, riesgos, projects]);

  const totalImpact = muniRisks.reduce((acc, r) => acc + r.poblacion_expuesta, 0);

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-2xl font-bold text-slate-900">Detalle: {municipioNombre}</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800">Cerrar</button>
        </div>
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
              <p className="text-indigo-600 text-sm font-semibold">Riesgos Activos</p>
              <p className="text-2xl font-bold text-indigo-900">{muniRisks.length}</p>
            </div>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-emerald-600 text-sm font-semibold">Proyectos Asociados</p>
              <p className="text-2xl font-bold text-emerald-900">{muniProjects.length}</p>
            </div>
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
              <p className="text-amber-600 text-sm font-semibold">Brechas de Mitigación</p>
              <p className="text-2xl font-bold text-amber-900">{gaps.length}</p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={20} /> Riesgos Activos
            </h3>
            {muniRisks.map(r => (
              <div key={r.id} className="p-3 border border-slate-200 rounded-lg mb-2 flex justify-between">
                <span>{r.tipo_riesgo} ({r.impacto})</span>
                <span className="font-bold">{r.poblacion_expuesta} expuestos</span>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Target className="text-indigo-500" size={20} /> Proyectos Asociados
            </h3>
            {muniProjects.map(p => (
              <div key={p.project.id} className="p-3 border border-slate-200 rounded-lg mb-2">
                <p className="font-semibold">{p.project.nombre}</p>
                <p className="text-sm text-slate-600">Estado: {p.project.estado}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
