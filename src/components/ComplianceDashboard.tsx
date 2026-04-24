import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { calculateGlobalCompliance } from '../utils/compliance';
import { ShieldCheck, ShieldAlert, Shield, AlertTriangle, FileText, CheckCircle2, XCircle, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis } from 'recharts';

interface ComplianceDashboardProps {
  projects: ProjectData[];
  onClose: () => void;
  onSelectProject: (project: ProjectData) => void;
}

export const ComplianceDashboard: React.FC<ComplianceDashboardProps> = ({ projects, onClose, onSelectProject }) => {
  const complianceData = useMemo(() => calculateGlobalCompliance(projects), [projects]);

  const correlationData = useMemo(() => {
    return projects.map(p => {
      const comp = calculateGlobalCompliance([p]).avgScore;
      
      // Calculate delay
      const plannedStart = new Date(p.project.fechaInicio);
      const plannedEnd = new Date(p.project.fechaFin);
      const plannedMonths = (plannedEnd.getTime() - plannedStart.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      const prorrogas = p.otrosies.filter(o => o.plazoAdicionalMeses && o.plazoAdicionalMeses > 0);
      const delayMonths = prorrogas.reduce((sum, o) => sum + (o.plazoAdicionalMeses || 0), 0);

      return {
        name: p.project.nombre,
        compliance: comp,
        delay: delayMonths,
        status: p.project.estado
      };
    });
  }, [projects]);

  const statusDistribution = useMemo(() => {
    const dist: Record<string, { Alto: number, Medio: number, Bajo: number }> = {};
    projects.forEach(p => {
      const status = p.project.estado;
      const compStatus = calculateGlobalCompliance([p]).status;
      if (!dist[status]) dist[status] = { Alto: 0, Medio: 0, Bajo: 0 };
      dist[status][compStatus]++;
    });
    return Object.entries(dist).map(([status, counts]) => ({
      status,
      ...counts
    }));
  }, [projects]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${
              complianceData.status === 'Alto' ? 'bg-emerald-100 text-emerald-600' :
              complianceData.status === 'Medio' ? 'bg-amber-100 text-amber-600' :
              'bg-rose-100 text-rose-600'
            }`}>
              {complianceData.status === 'Alto' ? <ShieldCheck size={24} /> : 
               complianceData.status === 'Medio' ? <Shield size={24} /> : 
               <ShieldAlert size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Control Normativo Detallado</h2>
              <p className="text-sm text-slate-500">Análisis de documentación y requisitos legales</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Índice Global de Cumplimiento</h3>
              <div className="flex items-end gap-3">
                <span className={`text-4xl font-bold ${
                  complianceData.status === 'Alto' ? 'text-emerald-600' :
                  complianceData.status === 'Medio' ? 'text-amber-600' :
                  'text-rose-600'
                }`}>
                  {complianceData.avgScore.toFixed(1)}%
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium mb-1 ${
                  complianceData.status === 'Alto' ? 'bg-emerald-100 text-emerald-700' :
                  complianceData.status === 'Medio' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  Nivel {complianceData.status}
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Proyectos con Doc. Completa</h3>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-indigo-600">
                  {complianceData.completeProjectsPct.toFixed(1)}%
                </span>
                <span className="text-sm text-slate-500 mb-1 font-medium">
                  del portafolio
                </span>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Alertas Críticas Activas</h3>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-bold text-rose-600">
                  {complianceData.criticalProjects.length}
                </span>
                <span className="text-sm text-slate-500 mb-1 font-medium">
                  proyectos en riesgo
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Correlación Incumplimiento vs Retraso */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={20} />
                Correlación: Incumplimiento vs Retraso
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="compliance" name="Cumplimiento" unit="%" domain={[0, 100]} />
                    <YAxis type="number" dataKey="delay" name="Retraso" unit=" meses" />
                    <ZAxis type="category" dataKey="name" name="Proyecto" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter name="Proyectos" data={correlationData} fill="#8b5cf6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-slate-500 text-center mt-2">
                * Proyectos con menor cumplimiento tienden a presentar mayores retrasos.
              </p>
            </div>

            {/* Cumplimiento por Estado */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <FileText className="text-indigo-500" size={20} />
                Cumplimiento por Estado del Proyecto
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="Alto" stackId="a" fill="#10b981" name="Cumplimiento Alto" />
                    <Bar dataKey="Medio" stackId="a" fill="#f59e0b" name="Cumplimiento Medio" />
                    <Bar dataKey="Bajo" stackId="a" fill="#f43f5e" name="Cumplimiento Bajo" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Lista de Proyectos con Incumplimientos Críticos */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-rose-50/30">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ShieldAlert className="text-rose-500" size={20} />
                Proyectos con Incumplimientos Críticos
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                    <th className="p-4 font-medium">Proyecto</th>
                    <th className="p-4 font-medium">Score</th>
                    <th className="p-4 font-medium">Alertas Normativas</th>
                    <th className="p-4 font-medium text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {complianceData.criticalProjects.length > 0 ? (
                    complianceData.criticalProjects.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <div className="font-medium text-slate-800">{item.project.project.nombre}</div>
                          <div className="text-xs text-slate-500">{item.project.project.id}</div>
                        </td>
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            {item.compliance.score}%
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {item.compliance.missingCDP && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                                <XCircle size={10} /> Sin CDP
                              </span>
                            )}
                            {item.compliance.missingRC && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-red-50 text-red-600 border border-red-100">
                                <XCircle size={10} /> Sin RC
                              </span>
                            )}
                            {item.compliance.missingPolizas && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-orange-50 text-orange-600 border border-orange-100">
                                <AlertTriangle size={10} /> Sin Pólizas
                              </span>
                            )}
                            {item.compliance.incompleteDocs && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-100">
                                <FileText size={10} /> Docs. Incompletos
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <button 
                            onClick={() => {
                              onSelectProject(item.project);
                              onClose();
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Ver Proyecto
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2" />
                        No hay proyectos con incumplimientos críticos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
