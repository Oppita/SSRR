import React, { useMemo, useState } from 'react';
import { ProjectData } from '../types';
import { detectAlerts } from '../utils/alerts';
import { calculateGlobalCompliance } from '../utils/compliance';
import { AdvancedAnalytics } from './AdvancedAnalytics';
import { HistoricalAnalytics } from './HistoricalAnalytics';
import { ComplianceDashboard } from './ComplianceDashboard';
import { PredictiveRisksDashboard } from './PredictiveRisksDashboard';
import { ImpactoTerritorialDashboard } from './ImpactoTerritorialDashboard';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend 
} from 'recharts';
import { 
  Activity, AlertCircle, CheckCircle2, Clock, DollarSign, TrendingUp, 
  TrendingDown, AlertTriangle, Target, Zap, BarChart3, FileText, FolderKanban, MapPin, ChevronDown, ChevronUp, History, ShieldCheck, ShieldAlert, Shield, BrainCircuit
} from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { calculateProjectTotals } from '../utils/projectCalculations';

interface DashboardProps {
  projects: ProjectData[];
  onSelectProject: (project: ProjectData) => void;
  onManageLiquidation?: (project: ProjectData) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ projects, onSelectProject, onManageLiquidation }) => {
  const { updateProject, state } = useProject();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'historica' | 'predictiva' | 'impacto'>('general');
  const [showCompliance, setShowCompliance] = useState(false);
  
  const complianceData = useMemo(() => calculateGlobalCompliance(projects), [projects]);

  const metrics = useMemo(() => {
    // Calculate total investment avoiding double-counting of convenios
    const uniqueConvenioIds = new Set<string>();
    let totalInvestment = 0;
    
    projects.forEach(p => {
      if (p.project.convenioId) {
        if (!uniqueConvenioIds.has(p.project.convenioId)) {
          uniqueConvenioIds.add(p.project.convenioId);
          const convenio = state.convenios.find(c => c.id === p.project.convenioId);
          if (convenio) {
            totalInvestment += convenio.valorTotal;
          } else {
            totalInvestment += p.presupuesto.valorTotal;
          }
        }
      } else {
        totalInvestment += p.presupuesto.valorTotal;
      }
    });

    const totalExecuted = projects.reduce((sum, p) => sum + p.presupuesto.pagosRealizados, 0);
    const avgPhysical = projects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / (projects.length || 1);
    const avgFinancial = projects.reduce((sum, p) => sum + p.project.avanceFinanciero, 0) / (projects.length || 1);
    
    const lowPerformance = projects.filter(p => p.project.avanceFisico < p.project.avanceProgramado - 10);
    const activeContracts = projects.reduce((sum, p) => sum + p.contracts.filter(c => c.tipo === 'Obra').length, 0);
    const totalContractValue = projects.reduce((sum, p) => sum + p.contracts.reduce((cSum, c) => cSum + c.valor, 0), 0);
    
    const projectTotals = projects.map(p => calculateProjectTotals(p.project, p.contracts, p.otrosies, state.convenios, state.afectaciones, undefined, p.project.suspensiones || [], undefined, state.proyectos, undefined, state.presupuestos));
    const totalCurrentContractValue = projectTotals.reduce((sum, t) => sum + t.valorTotal, 0);
    const totalAdditionsValue = projectTotals.reduce((sum, t) => sum + t.valorAdicional, 0);
    
    const totalComisionesCost = state.comisiones.reduce((sum, c) => sum + c.costoTotal, 0);
    const totalComisionesCount = state.comisiones.length;
    
    const costPerPct = totalInvestment / (avgPhysical || 1);
    
    return {
      totalInvestment,
      totalExecuted,
      avgPhysical,
      avgFinancial,
      lowPerformance,
      executionEfficiency: avgPhysical / (avgFinancial || 1),
      deviation: avgPhysical - avgFinancial,
      activeContracts,
      totalCurrentContractValue,
      costPerPct,
      totalComisionesCost,
      totalComisionesCount
    };
  }, [projects, state.comisiones]);

  const alerts = useMemo(() => detectAlerts(projects), [projects]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard Ejecutivo SRR</h1>
          <p className="text-slate-500 mt-1">Monitoreo integral de proyectos, finanzas y rendimiento.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'general' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart3 size={16} />
            Vista General
          </button>
          <button
            onClick={() => setActiveTab('historica')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'historica' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <History size={16} />
            Analítica Histórica
          </button>
          <button
            onClick={() => setActiveTab('predictiva')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'predictiva' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BrainCircuit size={16} />
            Riesgos Predictivos
          </button>
          <button
            onClick={() => setActiveTab('impacto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'impacto' 
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/50' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Target size={16} />
            Impacto Territorial
          </button>
        </div>
      </div>

      {activeTab === 'historica' ? (
        <HistoricalAnalytics projects={projects} />
      ) : activeTab === 'predictiva' ? (
        <PredictiveRisksDashboard projects={projects} onSelectProject={onSelectProject} />
      ) : activeTab === 'impacto' ? (
        <ImpactoTerritorialDashboard projects={projects} onSelectProject={onSelectProject} />
      ) : (
        <>
          {/* Advanced Analytics Section */}
          <AdvancedAnalytics projects={projects} />

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
          >
            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="text-amber-600" />
              Alertas Automáticas ({alerts.length})
            </h3>
            <button className="text-amber-700 hover:bg-amber-100 p-1 rounded-full transition-colors">
              {isAlertsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
          
          {isAlertsExpanded && (
            <div className="space-y-2 mt-4 animate-in slide-in-from-top-2 duration-200">
              {alerts.map((a, i) => (
                <div key={i} className="text-sm text-amber-800 p-3 bg-white rounded-lg border border-amber-100">
                  <span className="font-bold">[{a.level}]</span> {a.projectName}: {a.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Avance Físico Real" 
          value={`${metrics.avgPhysical.toFixed(1)}%`} 
          subtitle="Promedio ponderado" 
          icon={<Activity size={24} />} 
          color="indigo" 
          onClick={() => setSelectedMetric('fisico')}
        />
        <MetricCard 
          title="Avance Financiero" 
          value={`${metrics.avgFinancial.toFixed(1)}%`} 
          subtitle="Promedio ponderado" 
          icon={<DollarSign size={24} />} 
          color="emerald" 
          onClick={() => setSelectedMetric('financiero')}
        />
        <MetricCard 
          title="Inversión Total" 
          value={formatCurrency(metrics.totalInvestment)} 
          subtitle="Presupuesto Asignado" 
          icon={<FileText size={24} />} 
          color="amber" 
          onClick={() => setSelectedMetric('valor')}
        />
        <MetricCard 
          title="Inversión Ejecutada" 
          value={formatCurrency(metrics.totalExecuted)} 
          subtitle="Pagos Realizados" 
          icon={<BarChart3 size={24} />} 
          color="indigo" 
          onClick={() => setSelectedMetric('costo')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="Eficiencia Ejecución" 
          value={metrics.executionEfficiency.toFixed(2)} 
          subtitle="Físico / Financiero" 
          icon={<Zap size={24} />} 
          color="amber" 
          onClick={() => setSelectedMetric('eficiencia')}
        />
        <MetricCard 
          title="Desviación" 
          value={`${metrics.deviation.toFixed(1)}%`} 
          subtitle="Físico vs Financiero" 
          icon={metrics.deviation >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />} 
          color={metrics.deviation >= 0 ? "emerald" : "rose"} 
          onClick={() => setSelectedMetric('desviacion')}
        />
        <MetricCard 
          title="Costo Comisiones" 
          value={formatCurrency(metrics.totalComisionesCost)} 
          subtitle={`${metrics.totalComisionesCount} comisiones ejecutadas`} 
          icon={<MapPin size={24} />} 
          color="indigo" 
          onClick={() => setSelectedMetric('comisiones')}
        />
        <MetricCard 
          title="Cumplimiento Normativo" 
          value={`${complianceData.avgScore.toFixed(1)}%`} 
          subtitle={`${complianceData.criticalProjects.length} alertas críticas`} 
          icon={
            complianceData.status === 'Alto' ? <ShieldCheck size={24} /> : 
            complianceData.status === 'Medio' ? <Shield size={24} /> : 
            <ShieldAlert size={24} />
          } 
          color={
            complianceData.status === 'Alto' ? 'emerald' : 
            complianceData.status === 'Medio' ? 'amber' : 
            'rose'
          } 
          onClick={() => setShowCompliance(true)}
        />
      </div>

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedMetric === 'fisico' && 'Detalle de Avance Físico'}
                  {selectedMetric === 'financiero' && 'Detalle de Avance Financiero'}
                  {selectedMetric === 'valor' && 'Detalle de Valor Contractual'}
                  {selectedMetric === 'costo' && 'Análisis de Costo por Avance'}
                  {selectedMetric === 'eficiencia' && 'Análisis de Eficiencia'}
                  {selectedMetric === 'desviacion' && 'Análisis de Desviación'}
                  {selectedMetric === 'comisiones' && 'Análisis de Comisiones a Territorio'}
                </h3>
                <p className="text-sm text-slate-500">Desglose detallado por proyecto y rendimiento.</p>
              </div>
              <button 
                onClick={() => setSelectedMetric(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <AlertCircle className="rotate-45 text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Chart or Detailed List */}
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projects.map(p => ({
                      name: p.project.nombre.substring(0, 15) + '...',
                      valor: 
                        selectedMetric === 'fisico' ? p.project.avanceFisico :
                        selectedMetric === 'financiero' ? p.project.avanceFinanciero :
                        selectedMetric === 'valor' ? p.contracts.reduce((sum, c) => sum + c.valor, 0) :
                        selectedMetric === 'eficiencia' ? p.project.avanceFisico / (p.project.avanceFinanciero || 1) :
                        selectedMetric === 'comisiones' ? state.comisiones.filter(c => c.projectId === p.project.id).reduce((sum, c) => sum + c.costoTotal, 0) :
                        p.project.avanceFisico - p.project.avanceProgramado
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {projects.map(p => (
                    <div key={p.project.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm font-bold border border-slate-100">
                          {p.project.nombre[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.project.nombre}</p>
                          <p className="text-xs text-slate-500">{p.project.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-slate-900">
                          {selectedMetric === 'fisico' && `${p.project.avanceFisico}%`}
                          {selectedMetric === 'financiero' && `${p.project.avanceFinanciero}%`}
                          {selectedMetric === 'valor' && formatCurrency(p.contracts.reduce((sum, c) => sum + c.valor, 0))}
                          {selectedMetric === 'eficiencia' && (p.project.avanceFisico / (p.project.avanceFinanciero || 1)).toFixed(2)}
                          {selectedMetric === 'comisiones' && (
                            <div className="text-right">
                              <p className="font-black text-slate-900">{formatCurrency(state.comisiones.filter(c => c.projectId === p.project.id).reduce((sum, c) => sum + c.costoTotal, 0))}</p>
                              <p className="text-[10px] text-slate-500 font-bold uppercase">
                                {state.comisiones.filter(c => c.projectId === p.project.id).length} comisiones
                              </p>
                              <p className={`text-[10px] font-bold uppercase ${
                                state.comisiones.filter(c => c.projectId === p.project.id).length > 2 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {state.comisiones.filter(c => c.projectId === p.project.id).length > 2 ? 'Alto impacto en seguimiento' : 'Seguimiento normal'}
                              </p>
                            </div>
                          )}
                          {selectedMetric === 'desviacion' && `${(p.project.avanceFisico - p.project.avanceProgramado).toFixed(1)}%`}
                        </p>
                        <button 
                          onClick={() => {
                            onSelectProject(p);
                            setSelectedMetric(null);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-wider"
                        >
                          Ver Proyecto
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedMetric(null)}
                className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Low Performance Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="text-indigo-500" />
          Semáforos de Rendimiento
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.map(p => {
            const deviation = p.project.avanceFisico - p.project.avanceProgramado;
            let statusColor = 'bg-emerald-100 border-emerald-200 text-emerald-800';
            let icon = <CheckCircle2 className="text-emerald-500" size={20} />;
            let statusText = 'En tiempo';

            if (deviation < -15) {
              statusColor = 'bg-rose-100 border-rose-200 text-rose-800';
              icon = <AlertTriangle className="text-rose-500" size={20} />;
              statusText = 'Retraso Crítico';
            } else if (deviation < -5) {
              statusColor = 'bg-amber-100 border-amber-200 text-amber-800';
              icon = <AlertCircle className="text-amber-500" size={20} />;
              statusText = 'Retraso Moderado';
            }

            return (
              <div key={p.project.id} className={`p-4 rounded-xl border ${statusColor} flex flex-col gap-2 cursor-pointer hover:opacity-90 transition-opacity`} onClick={() => onSelectProject(p)}>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm truncate pr-2" title={p.project.nombre}>{p.project.nombre}</span>
                  {icon}
                </div>
                <div className="text-xs font-medium opacity-80">{statusText}</div>
                <div className="flex justify-between text-xs mt-2">
                  <span>Físico: {p.project.avanceFisico}%</span>
                  <span>Prog: {p.project.avanceProgramado}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <AlertTriangle className="text-rose-500" />
          Proyectos con Bajo Rendimiento ({metrics.lowPerformance.length})
        </h3>
        <div className="space-y-4">
          {metrics.lowPerformance.map(p => (
            <div key={p.project.id} className="flex items-center justify-between p-4 bg-rose-50 rounded-lg border border-rose-100">
              <div>
                <p className="font-semibold text-rose-900">{p.project.nombre}</p>
                <p className="text-sm text-rose-700">Avance Físico: {p.project.avanceFisico}% | Programado: {p.project.avanceProgramado}%</p>
              </div>
              <button onClick={() => onSelectProject(p)} className="text-sm font-medium text-rose-600 hover:text-rose-800">Ver Detalles</button>
            </div>
          ))}
          {metrics.lowPerformance.length === 0 && (
            <p className="text-sm text-slate-500">No hay proyectos con bajo rendimiento.</p>
          )}
        </div>
      </div>

      {/* Institutional Flow Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <FolderKanban className="text-indigo-500" />
          Banco de Proyectos y Estructuración
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.filter(p => ['Banco de proyectos', 'En viabilidad', 'En estructuración', 'Aprobado', 'En contratación'].includes(p.project.estado)).map(p => {
            const getProgress = (items: any[] = []) => {
              if (items.length === 0) return 0;
              return Math.round((items.filter(i => i.completed).length / items.length) * 100);
            };
            const tec = getProgress(p.project.lifecycle?.estructuracion?.tecnico);
            const fin = getProgress(p.project.lifecycle?.estructuracion?.financiero);
            const jur = getProgress(p.project.lifecycle?.estructuracion?.juridico);

            return (
              <div key={p.project.id} className="p-5 border border-slate-200 rounded-xl hover:border-indigo-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{p.project.nombre}</h4>
                    <p className="text-xs text-slate-500">{p.project.municipio}</p>
                  </div>
                  <StatusBadge status={p.project.estado} />
                </div>
                {p.project.estado === 'En estructuración' && (
                  <div className="space-y-3 mt-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Técnico</span>
                        <span className="font-bold text-slate-900">{tec}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${tec}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Financiero</span>
                        <span className="font-bold text-slate-900">{fin}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${fin}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-600">Jurídico</span>
                        <span className="font-bold text-slate-900">{jur}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${jur}%` }}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex justify-end">
                  <button onClick={() => onSelectProject(p)} className="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider">
                    Ver Proyecto
                  </button>
                </div>
              </div>
            );
          })}
          {projects.filter(p => ['Banco de proyectos', 'En viabilidad', 'En estructuración', 'Aprobado', 'En contratación'].includes(p.project.estado)).length === 0 && (
            <p className="text-slate-500 text-sm col-span-2">No hay proyectos en fase de estructuración o contratación.</p>
          )}
        </div>
      </div>

      {/* Liquidation Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
          <CheckCircle2 className="text-emerald-500" />
          Proyectos en Fase de Liquidación
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.filter(p => p.project.estado === 'En liquidación' || (p.project.avanceFisico === 100 && p.project.estado !== 'Liquidado')).map(p => {
            const items = p.project.lifecycle?.liquidacion?.checklist || [];
            const progress = items.length > 0 ? Math.round((items.filter(i => i.completed).length / items.length) * 100) : 0;

            return (
              <div key={p.project.id} className="p-5 border border-slate-200 rounded-xl hover:border-emerald-300 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-slate-900">{p.project.nombre}</h4>
                    <p className="text-xs text-slate-500">{p.project.municipio}</p>
                  </div>
                  <StatusBadge status={p.project.estado} />
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-600">Progreso de Liquidación</span>
                    <span className="font-bold text-emerald-600">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-3">
                  {p.project.estado !== 'En liquidación' && (
                    <button 
                      onClick={() => updateProject({ ...p.project, estado: 'En liquidación' })}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-lg"
                    >
                      Pasar a Liquidación
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      if (onManageLiquidation) {
                        onManageLiquidation(p);
                      } else {
                        onSelectProject(p);
                      }
                    }} 
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1.5 rounded-lg"
                  >
                    Gestionar Liquidación
                  </button>
                </div>
              </div>
            );
          })}
          {projects.filter(p => p.project.estado === 'En liquidación' || (p.project.avanceFisico === 100 && p.project.estado !== 'Liquidado')).length === 0 && (
            <p className="text-slate-500 text-sm col-span-2">No hay proyectos pendientes de liquidación.</p>
          )}
        </div>
      </div>

      {/* Monitoreo de Interventoría 
      {interventoriaData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-indigo-600" />
              Monitoreo de Interventoría
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                  <th className="p-4 font-semibold">Proyecto</th>
                  <th className="p-4 font-semibold">Último Informe</th>
                  <th className="p-4 font-semibold">Tendencia</th>
                  <th className="p-4 font-semibold">Clasificación</th>
                  <th className="p-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {interventoriaData.map(({ project, analysis }) => {
                  const report = analysis.latestReport!;
                  return (
                    <tr key={project.project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900 truncate max-w-[200px]" title={project.project.nombre}>
                          {project.project.nombre}
                        </div>
                        <div className="text-xs text-slate-500">{project.project.id}</div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm font-medium text-slate-900">Semana {report.semana}</div>
                        <div className="text-xs text-slate-500">{report.fechaInicio} al {report.fechaFin}</div>
                      </td>
                      <td className="p-4">
                        {analysis.trend === 'up' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
                            <TrendingUp size={16} /> Positiva
                          </span>
                        ) : analysis.trend === 'down' ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                            <TrendingDown size={16} /> Negativa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
                            <TrendingUp size={16} className="rotate-45" /> Estable
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          analysis.status === 'normal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                          analysis.status === 'riesgo' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {analysis.status === 'normal' && <CheckCircle2 size={12} />}
                          {analysis.status === 'riesgo' && <AlertTriangle size={12} />}
                          {analysis.status === 'critico' && <AlertCircle size={12} />}
                          {analysis.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedReport({ project, report, type: 'summary' })}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Resumen Ejecutivo"
                          >
                            <FileSearch size={18} />
                          </button>
                          <button 
                            onClick={() => setSelectedReport({ project, report, type: 'full' })}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Informe Completo (PDF)"
                          >
                            <FileText size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      {/* End of General Tab */}
        </>
      )}

      {showCompliance && (
        <ComplianceDashboard 
          projects={projects} 
          onClose={() => setShowCompliance(false)} 
          onSelectProject={onSelectProject} 
        />
      )}

    </div>
  );
};

// Helper Components
const FolderKanbanIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/><path d="M8 10v4"/><path d="M12 10v2"/><path d="M16 10v6"/></svg>;

const MetricCard = ({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color,
  onClick
}: { 
  title: string, 
  value: string, 
  subtitle: string, 
  icon: React.ReactNode, 
  color: 'indigo' | 'emerald' | 'amber' | 'rose',
  onClick?: () => void
}) => {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white',
    emerald: 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white',
    rose: 'bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white',
  };

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col transition-all duration-300 group ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1 hover:border-indigo-200' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl transition-all duration-300 ${colorMap[color]}`}>
          {icon}
        </div>
        {onClick && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Zap size={16} className="text-indigo-600" />
          </div>
        )}
      </div>
      <div className="mt-auto">
        <h4 className="text-slate-500 text-sm font-medium mb-1">{title}</h4>
        <div className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{value}</div>
        <div className="text-xs text-slate-400 mt-2 font-medium">{subtitle}</div>
      </div>
    </div>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  let colorClass = 'bg-slate-100 text-slate-700';
  
  if (status === 'En Ejecución') colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  if (status === 'Terminado') colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'Suspendido') colorClass = 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'En Liquidación') colorClass = 'bg-purple-50 text-purple-700 border-purple-200';

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};
