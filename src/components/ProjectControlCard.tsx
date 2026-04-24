import React, { useState } from 'react';
import { ProjectData, ProjectDocument, Avance } from '../types';
import { 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  AlertTriangle, 
  Activity, 
  Briefcase, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  BarChart3, 
  History, 
  FileCheck,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Plus
} from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

interface ProjectControlCardProps {
  project: ProjectData;
  onSelect: (project: ProjectData) => void;
  formatCurrency: (value: number) => string;
  analysis: any;
}

export const ProjectControlCard: React.FC<ProjectControlCardProps> = ({ 
  project, 
  onSelect, 
  formatCurrency,
  analysis 
}) => {
  const { addAvance } = useProject();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'alerts' | 'documents' | 'timeline' | 'avances'>('overview');

  const statusColors = {
    'Crítico': 'border-rose-500 bg-rose-50 text-rose-700',
    'Riesgo': 'border-amber-500 bg-amber-50 text-amber-700',
    'Normal': 'border-emerald-500 bg-emerald-50 text-emerald-700'
  };

  const badgeColors = {
    'Crítico': 'bg-rose-100 text-rose-700 border-rose-200',
    'Riesgo': 'bg-amber-100 text-amber-700 border-amber-200',
    'Normal': 'bg-emerald-100 text-emerald-700 border-emerald-200'
  };

  const miniDashboardData = [
    { name: 'Físico', value: project.project.avanceFisico, color: '#6366f1' },
    { name: 'Prog.', value: project.project.avanceProgramado, color: '#94a3b8' },
    { name: 'Finan.', value: analysis.financialProgress, color: '#10b981' }
  ];

  const recentDocs = project.documents?.slice(0, 3) || [];
  const activeAlerts = project.alerts.filter(a => a.estado === 'Abierta').slice(0, 3);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-indigo-500 shadow-xl lg:col-span-2 xl:col-span-3' : 'hover:shadow-md hover:border-indigo-200'}`}
    >
      {/* Header Section (Always Visible) */}
      <div 
        className="p-5 cursor-pointer group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
              {project.project.id}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColors[analysis.semaforo as keyof typeof badgeColors]}`}>
              {analysis.semaforo}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-indigo-600 font-medium">
              {isExpanded ? 'Contraer' : 'Expandir Control'} 
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>
          </div>
        </div>

        <h3 className="font-bold text-slate-900 text-lg leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
          {project.project.nombre}
        </h3>
        <div className="text-sm text-slate-500 flex items-center gap-1 mb-4">
          <MapPin size={14} className="text-slate-400" />
          {project.project.municipio}, {project.project.departamento}
        </div>

        {/* Quick Indicators (Hover-like view but always present in collapsed) */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="space-y-1 group/stat relative">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Físico</span>
              <span className="text-slate-700">{project.project.avanceFisico}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                style={{ width: `${project.project.avanceFisico}%` }}
              />
            </div>
            {/* Quick View Tooltip on Hover */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/stat:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              Programado: {project.project.avanceProgramado}%
            </div>
          </div>
          <div className="space-y-1 group/stat relative">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Finan.</span>
              <span className="text-slate-700">{analysis.financialProgress.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                style={{ width: `${analysis.financialProgress}%` }}
              />
            </div>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/stat:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              Pagos: {formatCurrency(project.presupuesto.pagosRealizados)}
            </div>
          </div>
          <div className="space-y-1 group/stat relative">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Atraso</span>
              <span className={analysis.delay > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {analysis.delay.toFixed(1)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${analysis.delay > 10 ? 'bg-rose-500' : analysis.delay > 0 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                style={{ width: `${Math.min(analysis.delay * 2, 100)}%` }}
              />
            </div>
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/stat:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              Días: {analysis.daysRemaining} restantes
            </div>
          </div>
        </div>

        {!isExpanded && (
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div className="flex -space-x-2">
              {activeAlerts.length > 0 && (
                <div className="w-6 h-6 rounded-full bg-rose-100 border-2 border-white flex items-center justify-center text-rose-600" title={`${activeAlerts.length} Alertas Activas`}>
                  <AlertTriangle size={12} />
                </div>
              )}
              <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-indigo-600" title="Ver Timeline">
                <History size={12} />
              </div>
              <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-600" title="Ver Documentos">
                <FileText size={12} />
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect(project);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Ficha 360° <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 bg-slate-50/30"
          >
            {/* Control Center Navigation */}
            <div className="flex border-b border-slate-200 bg-white px-5 overflow-x-auto no-scrollbar">
              {[
                { id: 'overview', label: 'Dashboard', icon: BarChart3 },
                { id: 'contracts', label: 'Contratos', icon: Briefcase },
                { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
                { id: 'documents', label: 'Documentos', icon: FileText },
                { id: 'timeline', label: 'Timeline', icon: History },
                { id: 'avances', label: 'Avances', icon: TrendingUp }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-500 text-indigo-600 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Mini Dashboard Chart */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                      <Activity size={14} className="text-indigo-500" /> Rendimiento Actual
                    </h4>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={miniDashboardData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{fontSize: 10}} />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            formatter={(value) => [`${value}%`, 'Valor']}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {miniDashboardData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Días Restantes</div>
                          <div className="text-sm font-bold text-slate-700">{analysis.daysRemaining} días</div>
                        </div>
                      </div>
                      {analysis.expired && <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded">VENCIDO</span>}
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Inversión Total</div>
                          <div className="text-sm font-bold text-slate-700">{formatCurrency(project.presupuesto.valorTotal)}</div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                          <TrendingUp size={16} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Desviación</div>
                          <div className="text-sm font-bold text-slate-700">{analysis.delay.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Status */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4">Estado del Sistema</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Interventoría</span>
                        {analysis.missingInterventoria ? 
                          <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={12} /> Pendiente</span> : 
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Asignada</span>
                        }
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Presupuesto (CDP/RC)</span>
                        {analysis.missingCDP_RC ? 
                          <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={12} /> Faltante</span> : 
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Completo</span>
                        }
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Permisos Ambientales</span>
                        {analysis.missingPermits ? 
                          <span className="text-rose-600 font-bold flex items-center gap-1"><AlertTriangle size={12} /> En trámite</span> : 
                          <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Aprobados</span>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'contracts' && (
                <div className="space-y-4">
                  {project.contracts.map(contract => (
                    <div key={contract.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">{contract.tipo}</div>
                          <h5 className="font-bold text-slate-800">{contract.contratista}</h5>
                          <div className="text-xs text-slate-500 font-mono mt-1">NIT: {contract.nit}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-slate-900">{formatCurrency(contract.valor)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase mt-1">Valor Contrato</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          <span>Inicio: {contract.fechaInicio}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Clock size={14} className="text-slate-400" />
                          <span>Fin: {contract.fechaFin}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {project.contracts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                      No hay contratos registrados para este proyecto.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {project.alerts.map(alert => (
                    <div key={alert.id} className={`p-4 rounded-xl border flex gap-4 ${alert.estado === 'Abierta' ? (alert.nivel === 'Alto' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100') : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${alert.estado === 'Abierta' ? (alert.nivel === 'Alto' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600') : 'bg-slate-200 text-slate-500'}`}>
                        <AlertTriangle size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className={`font-bold text-sm ${alert.estado === 'Abierta' ? (alert.nivel === 'Alto' ? 'text-rose-900' : 'text-amber-900') : 'text-slate-700'}`}>
                            {alert.tipo}
                          </h5>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{alert.fecha}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-2">{alert.descripcion}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${alert.nivel === 'Alto' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'}`}>
                            Prioridad {alert.nivel}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${alert.estado === 'Abierta' ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-200 border-slate-300 text-slate-500'}`}>
                            {alert.estado}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {project.alerts.length === 0 && (
                    <div className="text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                      No hay alertas registradas.
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentDocs.map(doc => (
                    <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-indigo-200 transition-colors group">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-sm text-slate-800 truncate">{doc.titulo}</h5>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium uppercase mt-1">
                          <span>{doc.tipo}</span>
                          <span>•</span>
                          <span>{doc.fechaCreacion}</span>
                        </div>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  ))}
                  {recentDocs.length === 0 && (
                    <div className="col-span-full text-center py-8 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                      No hay documentos recientes.
                    </div>
                  )}
                  {recentDocs.length > 0 && (
                    <button className="col-span-full py-3 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 rounded-xl border border-indigo-100 transition-colors">
                      Ver todos los documentos
                    </button>
                  )}
                </div>
              )}

              {activeTab === 'timeline' && (
                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {[
                    { date: project.project.fechaInicio, event: 'Inicio de Proyecto', type: 'start', icon: Calendar },
                    { date: '2024-02-15', event: 'Asignación de Interventoría', type: 'milestone', icon: CheckCircle2 },
                    { date: '2024-05-20', event: 'Primer Informe de Avance', type: 'report', icon: FileCheck },
                    { date: project.project.fechaFin, event: 'Fecha Estimada de Finalización', type: 'end', icon: Clock }
                  ].map((item, i) => (
                    <div key={i} className="relative">
                      <div className={`absolute -left-8 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center z-10 ${item.type === 'start' ? 'bg-emerald-500 text-white' : item.type === 'end' ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400 border-slate-200'}`}>
                        <item.icon size={12} />
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.date}</div>
                        <h5 className="font-bold text-sm text-slate-800">{item.event}</h5>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'avances' && (
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h5 className="font-bold text-slate-800 mb-4">Registrar Nuevo Avance</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <input type="date" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" id="avance-fecha" />
                      <input type="number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Avance Físico (%)" id="avance-fisico" />
                      <input type="number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Avance Financiero (%)" id="avance-financiero" />
                      <input type="number" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Avance Programado (%)" id="avance-programado" />
                      <button 
                        onClick={() => {
                          const fecha = (document.getElementById('avance-fecha') as HTMLInputElement).value;
                          const fisicoPct = Number((document.getElementById('avance-fisico') as HTMLInputElement).value);
                          const financieroPct = Number((document.getElementById('avance-financiero') as HTMLInputElement).value);
                          const programadoPct = Number((document.getElementById('avance-programado') as HTMLInputElement).value);
                          if (fecha && fisicoPct >= 0 && financieroPct >= 0 && programadoPct >= 0) {
                            addAvance(project.project.id, { 
                              id: Math.random().toString(36).substr(2, 9), 
                              projectId: project.project.id, 
                              fecha, 
                              fisicoPct, 
                              financieroPct, 
                              programadoPct,
                              observaciones: 'Avance registrado manualmente',
                              reportadoPor: 'Usuario'
                            });
                            alert('Avance registrado');
                          } else {
                            alert('Por favor completa todos los campos correctamente');
                          }
                        }}
                        className="col-span-2 bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Registrar Avance
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
              <div className="text-xs text-slate-400 font-medium italic">
                Última actualización: {new Date().toLocaleDateString()}
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => onSelect(project)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  Abrir Control Total <Activity size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const MapPin = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const DollarSign = ({ size, className }: { size: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="12" x2="12" y1="2" y2="22" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);
