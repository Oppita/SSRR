import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { calculateGlobalPredictiveRisks } from '../utils/predictive';
import { 
  AlertTriangle, TrendingUp, TrendingDown, Activity, 
  ShieldAlert, DollarSign, Clock, ArrowRight, BrainCircuit,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';

interface PredictiveRisksDashboardProps {
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
}

export const PredictiveRisksDashboard: React.FC<PredictiveRisksDashboardProps> = ({ projects, onSelectProject }) => {
  const risks = useMemo(() => calculateGlobalPredictiveRisks(projects), [projects]);

  const topRisks = risks.slice(0, 5);

  const riskDistribution = useMemo(() => {
    const dist = { Alto: 0, Medio: 0, Bajo: 0 };
    risks.forEach(r => dist[r.riskLevel]++);
    return [
      { name: 'Riesgo Alto', value: dist.Alto, color: '#ef4444' },
      { name: 'Riesgo Medio', value: dist.Medio, color: '#f59e0b' },
      { name: 'Riesgo Bajo', value: dist.Bajo, color: '#10b981' },
    ];
  }, [risks]);

  const scatterData = risks.map(r => ({
    name: r.projectName,
    delay: r.delayProbability,
    cost: r.costOverrunProbability,
    legal: r.legalRisk,
    overall: r.overallRisk,
    projectId: r.projectId
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Info */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
            <BrainCircuit size={32} className="text-indigo-300" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Motor de Riesgos Predictivos</h2>
            <p className="text-indigo-200 max-w-3xl">
              Este modelo analiza patrones históricos, desviaciones actuales y cumplimiento normativo para predecir 
              retrasos, sobrecostos y riesgos jurídicos antes de que se materialicen.
            </p>
          </div>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Proyectos en Riesgo Alto</h3>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-2">
            {riskDistribution[0].value} <span className="text-lg text-slate-500 font-medium">/ {projects.length}</span>
          </div>
          <p className="text-sm text-slate-500">Requieren intervención inmediata</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Riesgo Promedio de Retraso</h3>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-2">
            {Math.round(risks.reduce((sum, r) => sum + r.delayProbability, 0) / (risks.length || 1))}%
          </div>
          <p className="text-sm text-slate-500">Probabilidad global de extensión de plazo</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <DollarSign size={20} />
            </div>
            <h3 className="font-semibold text-slate-800">Riesgo Promedio de Sobrecosto</h3>
          </div>
          <div className="text-4xl font-bold text-slate-900 mb-2">
            {Math.round(risks.reduce((sum, r) => sum + r.costOverrunProbability, 0) / (risks.length || 1))}%
          </div>
          <p className="text-sm text-slate-500">Probabilidad global de requerir adiciones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matriz de Riesgo: Retraso vs Sobrecosto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Activity className="text-indigo-500" size={20} />
            Matriz Predictiva: Retraso vs Sobrecosto
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="delay" name="Prob. Retraso" unit="%" domain={[0, 100]} />
                <YAxis type="number" dataKey="cost" name="Prob. Sobrecosto" unit="%" domain={[0, 100]} />
                <ZAxis type="number" dataKey="overall" range={[50, 400]} name="Riesgo Global" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter name="Proyectos" data={scatterData}>
                  {scatterData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.overall >= 65 ? '#ef4444' : entry.overall >= 35 ? '#f59e0b' : '#10b981'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div> Riesgo Alto</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div> Riesgo Medio</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> Riesgo Bajo</div>
          </div>
        </div>

        {/* Ranking de Proyectos Críticos */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldAlert className="text-rose-500" size={20} />
            Top 5 Proyectos Críticos
          </h3>
          <div className="space-y-4 flex-1">
            {topRisks.map((risk, idx) => {
              const project = projects.find(p => p.project.id === risk.projectId);
              return (
                <div key={risk.projectId} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-indigo-200 transition-colors cursor-pointer" onClick={() => project && onSelectProject(project)}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5 ${
                        idx === 0 ? 'bg-rose-600' : idx === 1 ? 'bg-rose-500' : idx === 2 ? 'bg-rose-400' : 'bg-amber-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm line-clamp-1" title={risk.projectName}>{risk.projectName}</h4>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <span className="flex items-center gap-1"><Clock size={12} /> {risk.delayProbability}% Retraso</span>
                          <span className="flex items-center gap-1"><DollarSign size={12} /> {risk.costOverrunProbability}% Sobrecosto</span>
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-bold ${
                      risk.riskLevel === 'Alto' ? 'bg-rose-100 text-rose-700' : 
                      risk.riskLevel === 'Medio' ? 'bg-amber-100 text-amber-700' : 
                      'bg-emerald-100 text-emerald-700'
                    }`}>
                      {risk.overallRisk}%
                    </div>
                  </div>
                  
                  {/* Mini Alertas */}
                  {risk.predictiveAlerts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="flex items-start gap-2 text-xs text-rose-600">
                        <AlertCircle size={14} className="shrink-0 mt-0.5" />
                        <span className="line-clamp-1" title={risk.predictiveAlerts[0]}>{risk.predictiveAlerts[0]}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {topRisks.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                No hay proyectos con datos suficientes.
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
