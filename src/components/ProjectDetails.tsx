import React, { useState, useRef, useMemo } from 'react';
import { ProjectData, Avance, Seguimiento, ProjectDocument, Contract, Otrosie } from '../types';
import { useProject } from '../store/ProjectContext';
import { StatusBadge } from './Dashboard';
import { downloadFileWithAutoRepair } from '../lib/storage';
import { 
  ArrowLeft, Building2, FileText, DollarSign, Activity, 
  AlertTriangle, Leaf, Calendar, MapPin, Target, Users,
  Paperclip, Image as ImageIcon, Download, CheckCircle2, Clock, ShieldAlert,
  PlusCircle, Eye, Upload, Trash2, Edit2, ChevronDown, ChevronUp, Globe,
  BrainCircuit, TrendingUp, TrendingDown, Zap, ShieldAlert as ShieldAlertIcon, X,
  Briefcase, Shield, FileWarning, Search, Filter, MoreVertical,
  Layers, PieChart as PieChartIcon, LayoutDashboard, Share2, Sparkles, ShieldCheck
} from 'lucide-react';
import { generatePDF as generatePDFUtil } from '../utils/pdfGenerator';
import { PredictiveAnalytics } from './PredictiveAnalytics';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { calculateContractTotals, calculateProjectTotals } from '../utils/projectCalculations';
import { InterventoriaReportsTab } from './InterventoriaReportsTab';
import { ComisionesTerritorio } from './ComisionesTerritorio';
import { FinancialExecutionModule } from './FinancialExecutionModule';
import { ProjectDocumentsTab } from './ProjectDocumentsTab';
import { AddOtrosieForm } from './AddOtrosieForm';
import { ChecklistLiquidacion } from './ChecklistLiquidacion';
import { AddContractForm } from './AddContractForm';
import { ProjectHierarchyTree } from './ProjectHierarchyTree';
import { ContractTimeline } from './ContractTimeline';
import { RiskDashboard } from './RiskDashboard';
import { ContratosDetallados } from './ContratosDetallados';
import { AvancesGraficos } from './AvancesGraficos';
import { GestionOPS } from './GestionOPS';
import { GestionComisiones } from './GestionComisiones';
import { EditProjectModal } from './EditProjectModal';
import { SmartTimeline } from './SmartTimeline';
import { ProjectRadiography } from './ProjectRadiography';
import { ScheduleReconstructor } from './ScheduleReconstructor';
import { InformeAnalysisComponent } from './InformeAnalysis';
import { ActasYSuspensionesTab } from './ActasYSuspensionesTab';
import { CompromisosTab } from './CompromisosTab';
import { ImpactoTerritorialDashboard } from './ImpactoTerritorialDashboard';
import { FinancialImpactDashboard } from './FinancialImpactDashboard';
import { EditContractModal } from './EditContractModal';
import { GestionPolizas } from './GestionPolizas';
import { ActividadesProyecto } from './ActividadesProyecto';

interface ProjectDetailsProps {
  data: ProjectData;
  onBack: () => void;
  onUpdateProject?: (projectId: string, section: string, field: string, value: any) => void;
  onOpenVista360?: () => void;
}



export const ProjectDetails: React.FC<ProjectDetailsProps> = ({ data, onBack, onUpdateProject, onOpenVista360 }) => {
  const { state, deleteProject, deleteContract, deleteOtrosie } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>('resumen');
  const [activeSubTabTerritorio, setActiveSubTabTerritorio] = useState<string>('actividades');
  const [activeSubTabMonitoreo, setActiveSubTabMonitoreo] = useState<string>('alertas');
  const [activeSubTabContratos, setActiveSubTabContratos] = useState<string>('jerarquia');
  const [activeSubTabResumen, setActiveSubTabResumen] = useState<string>('nucleo');
  const [activeSubTabDocumentos, setActiveSubTabDocumentos] = useState<string>('repositorio');

  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [showAddOtrosie, setShowAddOtrosie] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [selectedOtrosie, setSelectedOtrosie] = useState<Otrosie | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contractToDelete, setContractToDelete] = useState<string | null>(null);
  const [otrosieToDelete, setOtrosieToDelete] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);
  const { 
    project, 
    contracts, 
    otrosies, 
    afectaciones, 
    presupuesto, 
    avances, 
    alerts, 
    environmental, 
    seguimientos,
    pagos = [],
    interventoriaReports: reports = []
  } = data;

  const convenio = useMemo(() => 
    state.convenios.find(c => c.id === project.convenioId),
    [state.convenios, project.convenioId]
  );

  const convenioTotals = useMemo(() => {
    if (!convenio) return null;
    return calculateProjectTotals(
      project, 
      state.contratos, 
      state.otrosies, 
      state.convenios, 
      state.afectaciones || [], 
      state.pagos || [], 
      state.suspensiones || [], 
      [], 
      state.proyectos,
      undefined,
      state.presupuestos
    );
  }, [convenio, project, state.contratos, state.otrosies, state.convenios, state.afectaciones, state.pagos, state.suspensiones, state.proyectos]);

  const timeProgress = useMemo(() => {
    if (!convenio || !convenio.fechaInicio || !convenio.fechaFin) return 0;
    const start = new Date(convenio.fechaInicio).getTime();
    const end = new Date(convenio.fechaFin).getTime();
    const now = new Date().getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return ((now - start) / (end - start)) * 100;
  }, [convenio]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };
  type TabType = 'resumen' | 'contratos' | 'financiero' | 'monitoreo' | 'territorio' | 'documentos' | 'polizas' | 'actividades';
  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen e Impacto', icon: <Target size={18} /> },
    { id: 'contratos', label: 'Gestión y Contratos', icon: <Briefcase size={18} /> },
    { id: 'financiero', label: 'Eje Financiero', icon: <DollarSign size={18} /> },
    { id: 'monitoreo', label: 'PILA Inteligencia (IA)', icon: <BrainCircuit size={18} /> },
    { id: 'territorio', label: 'Despliegue Territorial', icon: <MapPin size={18} /> },
    { id: 'documentos', label: 'Archivo Digital', icon: <FileText size={18} /> },
  ];

  // --- CAPA 7: GENERADOR AUTOMÁTICO DE INFORMES ---
  const generatePDF = async () => {
    if (!reportRef.current) return;
    setIsGeneratingPDF(true);
    
    try {
      await generatePDFUtil(reportRef.current, {
        filename: `Informe_Semanal_${project.id}.pdf`,
        backgroundColor: '#ffffff'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button 
          onClick={onBack}
          className="p-2 mt-1 rounded-full hover:bg-slate-200 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {project.id}
            </span>
            <StatusBadge status={project.estado} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 leading-tight">{project.nombre}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <div className="flex items-center gap-1.5">
              <MapPin size={16} />
              <span>{project.municipio}, {project.departamento}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building2 size={16} />
              <span>{project.tipoObra}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={16} />
              <span>{project.fechaInicio} — {project.fechaFin}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFinancialModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg font-medium transition-colors shadow-sm"
          >
            <DollarSign size={18} />
            Módulo Financiero
          </button>
          {onOpenVista360 && (
            <button
              onClick={onOpenVista360}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm"
            >
              <Globe size={18} />
              Vista 360°
            </button>
          )}
          <button
            onClick={() => setShowEditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-medium transition-colors"
          >
            <Edit2 size={18} />
            Editar Proyecto
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg font-medium transition-colors"
          >
            <Trash2 size={18} />
            Borrar Proyecto
          </button>
        </div>
      </div>

      {showEditModal && (
        <EditProjectModal 
          project={project} 
          presupuesto={presupuesto}
          onClose={() => setShowEditModal(false)} 
        />
      )}

      {showFinancialModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-slate-50 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
            <div className="bg-indigo-700 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Módulo de Ejecución Financiera Centralizado</h3>
                  <p className="text-indigo-100 text-xs font-medium">Gestión de CDP, RC y RP — {project.nombre}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowFinancialModal(false)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-8">
              <FinancialExecutionModule projectId={project.id} />
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end shrink-0">
              <button 
                onClick={() => setShowFinancialModal(false)}
                className="px-8 py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-slate-200"
              >
                Cerrar Módulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 min-h-[400px]">
        
        {activeTab === 'resumen' && (
          <div className="flex space-x-2 overflow-x-auto mb-6 border-b border-slate-100">
            <button onClick={() => setActiveSubTabResumen('nucleo')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabResumen === 'nucleo' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Núcleo del Proyecto</button>
            <button onClick={() => setActiveSubTabResumen('jerarquia')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabResumen === 'jerarquia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Jerarquía y Eventos</button>
            <button onClick={() => setActiveSubTabResumen('radiografia')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabResumen === 'radiografia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Radiografía Integral</button>
            <button onClick={() => setActiveSubTabResumen('impacto')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabResumen === 'impacto' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Impacto Territorial</button>
          </div>
        )}

        {/* TAB 1: PROYECTO */}
        {activeTab === 'resumen' && activeSubTabResumen === 'nucleo' && (
          <div className="space-y-8 animate-in fade-in">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">Núcleo del Proyecto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <InfoItem label="Línea de Intervención" value={project.linea} />
                <InfoItem label="Tipo de Obra" value={project.tipoObra} />
                <InfoItem label="Ubicación" value={`${project.municipio}, ${project.departamento}`} />
                <InfoItem label="Beneficiarios" value={project.beneficiarios || 'No especificado'} />
                
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <h4 className="font-bold text-indigo-900 mb-2">Fechas Clave</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Inicio:</span>
                      <span className="font-semibold text-indigo-900">{project.fechaInicio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-indigo-700">Fin Programado:</span>
                      <span className="font-semibold text-indigo-900">{project.fechaFin}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <button
                    onClick={() => setShowFinancialModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-all border border-indigo-200"
                  >
                    <DollarSign size={20} />
                    Abrir Módulo de Ejecución Financiera
                  </button>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                  <h4 className="font-medium text-slate-700 mb-4">Métricas de Avance</h4>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Avance Físico</span>
                      <span className="font-bold text-slate-900">{project.avanceFisico}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${project.avanceFisico}%` }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Avance Financiero</span>
                      <span className="font-bold text-slate-900">{project.avanceFinanciero}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                      <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${project.avanceFinanciero}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h4 className="font-medium text-slate-700 mb-4">Resumen Presupuestal</h4>
                  {(() => {
                    const { valorAdicional: totalAdiciones, valorTotal: totalPresupuestoActual } = calculateProjectTotals(project, contracts, otrosies, state.convenios, state.afectaciones, pagos, project.suspensiones || [], undefined, state.proyectos, undefined, state.presupuestos);
                    const aportesFngrdActual = (presupuesto.aportesFngrd || 0) + totalAdiciones;
                    
                    const chartData = [
                      { name: 'Aportes FNGRD', value: aportesFngrdActual, fill: '#4f46e5' },
                      { name: 'Aportes Municipio', value: presupuesto.aportesMunicipio, fill: '#10b981' },
                      { name: 'Otros Aportes', value: Math.max(0, totalPresupuestoActual - aportesFngrdActual - presupuesto.aportesMunicipio), fill: '#f59e0b' }
                    ].filter(d => d.value > 0);

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Presupuesto Actual</p>
                            <p className="text-2xl font-black text-slate-900">{formatCurrency(totalPresupuestoActual)}</p>
                          </div>
                          {totalAdiciones > 0 && (
                            <div className="text-right">
                              <p className="text-xs text-emerald-600 font-bold">Adiciones Totales</p>
                              <p className="text-sm font-bold text-emerald-700">+{formatCurrency(totalAdiciones)}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Detalle Presupuestal */}
                        <div className="bg-slate-50 rounded-lg p-3 text-sm space-y-2 border border-slate-200">
                          <p className="font-bold text-slate-700 text-xs uppercase">Detalle Financiero</p>
                          <div className="flex justify-between">
                            <span>Valor Convenio</span>
                            <span className="font-bold">{formatCurrency(convenio?.valorTotal || 0)}</span>
                          </div>
                          {otrosies.filter(o => o.convenioId === project.convenioId).map(o => (
                            <div key={o.id} className="flex justify-between text-xs text-slate-600">
                              <span>Otrosí: {o.objeto}</span>
                              <span>+{formatCurrency(o.valorAdicional || 0)}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="h-48 mt-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                nameKey="name"
                              >
                                {chartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Ejecución y Disponibilidad */}
                        <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Comprometido OPS:</span>
                            <span className="text-sm font-bold text-slate-800">{formatCurrency(presupuesto.valorComprometidoProfesionales || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Comprometido Comisiones:</span>
                            <span className="text-sm font-bold text-slate-800">{formatCurrency(presupuesto.valorComprometidoComisiones || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-slate-600">Pagos Realizados:</span>
                            <span className="text-sm font-bold text-slate-800">{formatCurrency(presupuesto.pagosRealizados || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                            <span className="text-sm font-bold text-slate-700">Saldo Disponible:</span>
                            <span className={`text-sm font-black ${presupuesto.valorDisponible && presupuesto.valorDisponible < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatCurrency(presupuesto.valorDisponible || 0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Impacto Territorial Summary in Vista 360 */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mt-8">
              <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Target className="text-indigo-500" />
                Impacto Territorial y Reducción de Riesgo
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div className="text-emerald-600 mb-2"><Users size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">{project.poblacionBeneficiada?.toLocaleString() || 'N/A'}</div>
                  <div className="text-xs font-medium text-emerald-700">Personas Protegidas</div>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100">
                  <div className="text-rose-600 mb-2"><Activity size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">{project.riesgoAntes || 'N/A'}</div>
                  <div className="text-xs font-medium text-rose-700">Nivel de Riesgo Inicial</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="text-indigo-600 mb-2"><TrendingDown size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">{project.riesgoDespues || 'N/A'}</div>
                  <div className="text-xs font-medium text-indigo-700">Nivel de Riesgo Actual</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div className="text-blue-600 mb-2"><Zap size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">
                    {project.poblacionBeneficiada && project.poblacionBeneficiada > 0 ? 
                      formatCurrency(calculateProjectTotals(project, contracts, otrosies, state.convenios, state.afectaciones, pagos, project.suspensiones || [], undefined, state.proyectos, undefined, state.presupuestos).valorTotal / project.poblacionBeneficiada) 
                      : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-blue-700">Costo por Persona</div>
                </div>
                <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                  <div className="text-amber-600 mb-2"><Briefcase size={20} /></div>
                  <div className="text-2xl font-bold text-slate-900">{project.empleosGenerados?.toLocaleString() || 'N/A'}</div>
                  <div className="text-xs font-medium text-amber-700">Empleos Generados</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'territorio' && (
          <div className="flex space-x-2 overflow-x-auto mb-6 border-b border-slate-100">
            <button onClick={() => setActiveSubTabTerritorio('actividades')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'actividades' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Actividades PMU</button>
            <button onClick={() => setActiveSubTabTerritorio('compromisos')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'compromisos' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Compromisos</button>
            <button onClick={() => setActiveSubTabTerritorio('ops')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'ops' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Gestión OPS</button>
            <button onClick={() => setActiveSubTabTerritorio('comisiones')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'comisiones' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Comisiones a Terreno</button>
            <button onClick={() => setActiveSubTabTerritorio('ambiental')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'ambiental' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Ambiental</button>
            <button onClick={() => setActiveSubTabTerritorio('interventoria')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabTerritorio === 'interventoria' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Interventoría</button>
          </div>
        )}

        {/* TAB 1.1: ACTIVIDADES Y PMU */}
        {activeTab === 'territorio' && activeSubTabTerritorio === 'actividades' && (
          <div className="animate-in fade-in">
            <ActividadesProyecto project={project} />
          </div>
        )}

        {activeTab === 'contratos' && (
          <div className="flex space-x-2 overflow-x-auto mb-6 border-b border-slate-100">
            <button onClick={() => setActiveSubTabContratos('jerarquia')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabContratos === 'jerarquia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Estructura Contractual</button>
            <button onClick={() => setActiveSubTabContratos('detallado')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabContratos === 'detallado' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Análisis Detallado</button>
            <button onClick={() => setActiveSubTabContratos('polizas')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabContratos === 'polizas' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Pólizas y Garantías</button>
          </div>
        )}

        {/* TAB 2: CONTRATOS */}
        {activeTab === 'contratos' && activeSubTabContratos === 'jerarquia' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Jerarquía: Convenio (Nivel 1) */}
            {convenio && convenioTotals && (
              <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-3xl p-6 shadow-sm mb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
                      <Layers size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">Nivel 1: Convenio Marco</span>
                        <span className="text-xs font-bold text-slate-400">No. {convenio.numero}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900">{convenio.nombre}</h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end bg-white/60 px-4 py-2 rounded-xl border border-indigo-100">
                    <div className="text-sm font-bold text-indigo-600">{formatCurrency(convenioTotals.valorTotal)}</div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Total Convenio</div>
                  </div>
                </div>

                {/* Trazabilidad Financiera Rápida */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contratado</p>
                    <p className="text-sm font-bold text-slate-700">{formatCurrency(convenioTotals.valorContratado)}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Ejecutado</p>
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(convenioTotals.valorEjecutado)}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Saldo x Ejecutar</p>
                    <p className="text-sm font-bold text-rose-600">{formatCurrency(convenioTotals.saldoPorEjecutar)}</p>
                  </div>
                  <div className="bg-white/80 p-3 rounded-xl border border-indigo-50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Estado</p>
                    <p className="text-sm font-bold text-indigo-600">{convenio.estado}</p>
                  </div>
                </div>

                {/* Barras de Progreso */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Progreso Financiero */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <DollarSign size={12} className="text-emerald-500" /> Ejecución Financiera
                      </div>
                      <div className="text-sm font-black text-emerald-600">
                        {((convenioTotals.valorEjecutado / convenioTotals.valorTotal) * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
                        style={{ width: `${Math.min(100, (convenioTotals.valorEjecutado / convenioTotals.valorTotal) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Progreso Temporal */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Clock size={12} className="text-indigo-500" /> Transcurso del Tiempo
                      </div>
                      <div className="text-sm font-black text-indigo-600">
                        {timeProgress.toFixed(1)}%
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                      <div 
                        className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full transition-all duration-1000"
                        style={{ width: `${timeProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest pt-4 mt-4 border-t border-indigo-50">
                  <span className="flex items-center gap-1"><TrendingUp size={10} className="text-emerald-500" /> Inicio: {convenio.fechaInicio}</span>
                  <span className="flex items-center gap-1"><Calendar size={10} className="text-indigo-500" /> Fin: {convenio.fechaFin}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-800">
                  {convenio ? 'Nivel 2: Estructura Contractual Derivada' : 'Estructura Contractual'}
                </h3>
                {convenio && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-lg uppercase tracking-wider border border-slate-200">
                    Vinculado a Convenio
                  </span>
                )}
              </div>
              <button onClick={() => setShowAddContract(true)} className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">+ Nuevo Contrato</button>
            </div>
            {showAddContract && <AddContractForm projectId={project.id} onClose={() => setShowAddContract(false)} />}
            
            <div className="grid grid-cols-1 gap-6">
              {contracts.map(contract => {
                const contractOtrosies = otrosies.filter(o => o.contractId === contract.id);
                const { 
                  valorTotal: totalValor, 
                  plazoTotalMeses: totalPlazo,
                  valorAdicional,
                  plazoAdicionalMeses
                } = calculateContractTotals(contract, contractOtrosies);
                
                return (
                <div 
                  key={contract.id} 
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
                  onClick={() => setSelectedContract(contract)}
                >
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                        contract.tipo === 'Obra' ? 'bg-indigo-100 text-indigo-700' : 
                        contract.tipo === 'Interventoría' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {contract.tipo}
                      </span>
                      <span className="text-sm font-bold text-slate-900">{contract.numero}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-indigo-600 flex flex-col items-end">
                        <span>{formatCurrency(contract.valor)}</span>
                        {valorAdicional > 0 && (
                          <span className="text-xs text-emerald-600">Total: {formatCurrency(totalValor)}</span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingContract(contract);
                        }}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                        title="Editar contrato"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractToDelete(contract.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar contrato"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Objeto Contractual</h5>
                        <p className="text-sm text-slate-700 leading-relaxed">{contract.objetoContractual}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contratista</h5>
                          <p className="text-sm font-semibold text-slate-900">{contract.contratista}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">NIT: {contract.nit}</p>
                            {(() => {
                              const entes = state.entesControl?.filter(e => e.tipoReferencia === 'Contratista' && state.contratistas.find(c => c.nit === contract.nit)?.id === e.referenciaId) || [];
                              const hasSanciones = entes.some(e => e.estado === 'Sancionado');
                              const hasHallazgos = entes.some(e => e.estado === 'Con Hallazgos');
                              if (hasSanciones) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Sancionado</span>;
                              if (hasHallazgos) return <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">Hallazgos</span>;
                              return null;
                            })()}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supervisor / Interventor</h5>
                          <p className="text-sm font-semibold text-slate-900">{contract.supervisor || 'No asignado'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-4 space-y-4 border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Plazo Inicial</span>
                        <span className="text-sm font-bold text-slate-900">{contract.plazoMeses} meses</span>
                      </div>
                      {plazoAdicionalMeses > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-indigo-600 font-bold">Plazo Total</span>
                          <span className="text-sm font-bold text-indigo-600">{totalPlazo} meses</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Inicio</span>
                        <span className="text-sm font-bold text-slate-900">{contract.fechaInicio || 'Pendiente'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500">Fin</span>
                        <span className="text-sm font-bold text-slate-900">{contract.fechaFin || 'Pendiente'}</span>
                      </div>
                      
                      {contract.obligacionesPrincipales && contract.obligacionesPrincipales.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Obligaciones Clave</h5>
                          <ul className="space-y-1">
                            {contract.obligacionesPrincipales.slice(0, 3).map((ob, i) => (
                              <li key={i} className="text-[10px] text-slate-600 flex gap-2">
                                <span className="text-indigo-500">•</span>
                                <span className="line-clamp-1">{ob}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <ChecklistLiquidacion contract={contract} documents={data.documents || []} />
                      <div className="grid grid-cols-2 gap-2">
                        <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100">Acta Inicio</button>
                        <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100">Otrosí</button>
                        <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100">Suspensión</button>
                        <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100">Informe</button>
                        <button className="text-[10px] font-bold text-indigo-600 bg-indigo-50 p-2 rounded-lg hover:bg-indigo-100">Liquidación</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}
              {contracts.length === 0 && <EmptyState message="No hay contratos registrados." />}
            </div>
          </div>
        )}

        {/* TAB 2.1: DETALLE CONTRATOS */}
        {activeTab === 'contratos' && activeSubTabContratos === 'detallado' && (
          <div className="animate-in fade-in">
            <ContratosDetallados contracts={contracts} otrosies={otrosies} projectId={project.id} project={project} />
          </div>
        )}

        {/* TAB 2.2: JERARQUÍA Y EVENTOS */}
        {activeTab === 'resumen' && activeSubTabResumen === 'jerarquia' && (
          <div className="space-y-12 animate-in fade-in">
            <ProjectHierarchyTree 
              project={project} 
              contracts={contracts} 
              otrosies={otrosies} 
              pagos={pagos}
              reports={reports}
            />
            <div className="border-t border-slate-100 pt-12">
              <ContractTimeline contracts={contracts} otrosies={otrosies} />
            </div>
          </div>
        )}

        {activeTab === 'monitoreo' && (
          <div className="flex space-x-2 overflow-x-auto mb-6 border-b border-slate-100">
            <button onClick={() => setActiveSubTabMonitoreo('alertas')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabMonitoreo === 'alertas' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Riesgos y Alertas</button>
            <button onClick={() => setActiveSubTabMonitoreo('seguimiento')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabMonitoreo === 'seguimiento' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Timeline y Avances</button>
            <button onClick={() => setActiveSubTabMonitoreo('reconstructor')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabMonitoreo === 'reconstructor' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Reconstructor Cronológico</button>
            <button onClick={() => setActiveSubTabMonitoreo('analitica')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabMonitoreo === 'analitica' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Analítica Predictiva</button>
            <button onClick={() => setActiveSubTabMonitoreo('actas')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabMonitoreo === 'actas' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Actas y Suspensiones</button>
          </div>
        )}

        {/* TAB 2.2: DASHBOARD INTEGRAL DE GESTIÓN */}
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'actas' && (
          <div className="animate-in fade-in">
            <ActasYSuspensionesTab projectId={project.id} />
          </div>
        )}

        {/* TAB 2.3: DASHBOARD DE RIESGOS */}
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'alertas' && (
          <div className="animate-in fade-in">
            <RiskDashboard 
              contracts={contracts} 
              otrosies={otrosies} 
              pagos={pagos} 
              reports={reports} 
              projects={[data]}
            />
          </div>
        )}

        {/* TAB 3: FINANCIERO */}
        {['financiero'].includes(activeTab) && (
          <div className="space-y-8 animate-in fade-in">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">Ejecución Financiera</h3>
            
            {(() => {
              const { 
                valorTotal: totalActual, 
                valorEjecutado: ejecutadoActual,
                saldoPorContratar,
                saldoPorEjecutar
              } = calculateProjectTotals(project, contracts, otrosies, state.convenios, state.afectaciones, pagos, project.suspensiones || [], undefined, state.proyectos, undefined, state.presupuestos);

              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 col-span-1 md:col-span-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm text-slate-500 font-medium mb-1">Valor Total Actualizado</div>
                        <div className="text-3xl font-bold text-slate-900">{formatCurrency(totalActual)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-500 font-medium mb-1">Ejecución Financiera (Pagos)</div>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(ejecutadoActual)}</div>
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl bg-amber-50/30">
                      <div className="text-sm text-slate-500 mb-1">Saldo por Contratar</div>
                      <div className="font-semibold text-lg text-amber-700">{formatCurrency(saldoPorContratar)}</div>
                      <div className="mt-2 text-xs text-slate-400 bg-white inline-block px-2 py-1 rounded border border-slate-100">
                        Presupuesto no asignado a contratos
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl bg-blue-50/30">
                      <div className="text-sm text-slate-500 mb-1">Saldo por Ejecutar</div>
                      <div className="font-semibold text-lg text-blue-700">{formatCurrency(saldoPorEjecutar)}</div>
                      <div className="mt-2 text-xs text-slate-400 bg-white inline-block px-2 py-1 rounded border border-slate-100">
                        Pendiente por pagar de contratos
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Soportes Presupuestales</div>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">CDP:</span>
                          <span className="font-mono font-medium">{presupuesto.cdp}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">RC:</span>
                          <span className="font-mono font-medium">{presupuesto.rc}</span>
                        </div>
                      </div>
                    </div>

                    {/* Integración con Pólizas */}
                    <div className="border border-slate-200 p-5 rounded-xl bg-indigo-50/30 col-span-1 md:col-span-3">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                          <ShieldCheck size={18} />
                          Cobertura de Riesgos (Pólizas y Garantías)
                        </h4>
                        <button 
                          onClick={() => setActiveTab('polizas')}
                          className="text-xs font-bold text-indigo-600 hover:underline"
                        >
                          Ver Detalle
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {(() => {
                          const projectPolizas = state.polizas.filter(p => 
                            contracts.some(c => c.id === p.id_contrato)
                          );
                          const totalAsegurado = projectPolizas.reduce((acc, p) => acc + (p.valor_asegurado || 0), 0);
                          const coveragePct = totalActual > 0 ? (totalAsegurado / totalActual) * 100 : 0;
                          const expiredCount = projectPolizas.filter(p => new Date(p.fecha_finalizacion_vigencia) < new Date()).length;

                          return (
                            <>
                              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Asegurado</span>
                                <span className="text-lg font-bold text-indigo-700">{formatCurrency(totalAsegurado)}</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">% Cobertura Global</span>
                                <span className="text-lg font-bold text-indigo-700">{coveragePct.toFixed(1)}%</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Pólizas Activas</span>
                                <span className="text-lg font-bold text-emerald-600">{projectPolizas.length - expiredCount}</span>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                                <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Pólizas Vencidas</span>
                                <span className={`text-lg font-bold ${expiredCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>{expiredCount}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border border-slate-200 p-5 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Aportes FNGRD</div>
                      <div className="font-semibold text-lg">{formatCurrency(presupuesto.aportesFngrd)}</div>
                      <div className="mt-2 text-xs text-slate-400 bg-slate-100 inline-block px-2 py-1 rounded">
                        {((presupuesto.aportesFngrd / totalActual) * 100).toFixed(1)}% del total actual
                      </div>
                    </div>

                    <div className="border border-slate-200 p-5 rounded-xl">
                      <div className="text-sm text-slate-500 mb-1">Aportes Municipio</div>
                      <div className="font-semibold text-lg">{formatCurrency(presupuesto.aportesMunicipio)}</div>
                      <div className="mt-2 text-xs text-slate-400 bg-slate-100 inline-block px-2 py-1 rounded">
                        {((presupuesto.aportesMunicipio / totalActual) * 100).toFixed(1)}% del total actual
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <FinancialExecutionModule projectId={project.id} />
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: SEGUIMIENTO */}
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'seguimiento' && (
          <div className="space-y-12 animate-in fade-in">
            <AvancesGraficos data={data} />
            
            <div className="border-t border-slate-200 pt-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-lg font-semibold text-slate-800">Timeline del Proyecto</h3>
                <div className="flex gap-3">
                  <button 
                    onClick={generatePDF}
                    disabled={isGeneratingPDF}
                    className="text-sm bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-900 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Download size={16} />
                    {isGeneratingPDF ? 'Generando PDF...' : 'Generar Informe PDF'}
                  </button>
                  <button className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                    + Nuevo Reporte
                  </button>
                </div>
              </div>
              
              <div className="relative border-l-2 border-indigo-200 ml-4 space-y-8 pb-4">
                {/* Combine all events for a complete timeline */}
                {(() => {
                  const timelineEvents = [
                    ...avances.map(a => ({ id: a.id, fecha: a.fecha, tipo: 'Avance', titulo: `Avance Reportado: ${a.fisicoPct}%`, descripcion: a.observaciones, responsable: a.reportadoPor, color: 'indigo', adjuntos: a.adjuntos, trazabilidad: undefined })),
                    ...seguimientos.map(s => ({ id: s.id, fecha: s.fecha, tipo: 'Seguimiento', titulo: `${s.tipo}: Cambio Detectado`, descripcion: s.descripcion, responsable: s.responsable, color: 'emerald', trazabilidad: s.trazabilidad, adjuntos: undefined })),
                    ...contracts.map(c => ({ id: c.id, fecha: c.fechaInicio || project.fechaInicio, tipo: 'Contrato', titulo: `Contrato ${c.numero}`, descripcion: c.objetoContractual, responsable: c.contratista, color: 'blue', adjuntos: undefined, trazabilidad: undefined })),
                    ...otrosies.map(o => ({ id: o.id, fecha: o.fechaFirma, tipo: 'Otrosí', titulo: `Otrosí ${o.numero}`, descripcion: o.objeto, responsable: 'N/A', color: 'amber', adjuntos: undefined, trazabilidad: undefined })),
                    ...reports.map(r => ({ id: r.id, fecha: r.fechaFin, tipo: 'Informe', titulo: `Informe Semana ${r.semana}`, descripcion: r.observaciones, responsable: r.interventorResponsable, color: 'purple', adjuntos: undefined, trazabilidad: undefined })),
                    ...state.polizas.filter(p => contracts.some(c => c.id === p.id_contrato)).map(p => ({ 
                      id: p.id, 
                      fecha: p.fecha_inicio_vigencia, 
                      tipo: 'Póliza', 
                      titulo: `Póliza: ${p.tipo_amparo}`, 
                      descripcion: `Expedida por ${p.entidad_aseguradora}. Número: ${p.numero_poliza}. Cobertura: ${p.porcentaje_cobertura}%`, 
                      responsable: 'N/A', 
                      color: 'indigo', 
                      adjuntos: undefined, 
                      trazabilidad: undefined 
                    }))
                  ] as { id: string; fecha: string; tipo: string; titulo: string; descripcion: string; responsable: string; color: string; adjuntos?: any[]; trazabilidad?: string; }[];

                  return timelineEvents.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map((item) => (
                    <div key={`${item.tipo}-${item.id}`} className="relative pl-8">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${
                        item.color === 'indigo' ? 'bg-indigo-600' : 
                        item.color === 'emerald' ? 'bg-emerald-500' : 
                        item.color === 'blue' ? 'bg-blue-500' :
                        item.color === 'amber' ? 'bg-amber-500' : 'bg-purple-500'
                      }`}></div>
                      
                      <div className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${
                        item.color === 'emerald' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-200'
                      }`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${
                                item.color === 'indigo' ? 'text-indigo-600 bg-indigo-50' : 
                                item.color === 'emerald' ? 'text-emerald-700 bg-emerald-100' :
                                item.color === 'blue' ? 'text-blue-700 bg-blue-100' :
                                item.color === 'amber' ? 'text-amber-700 bg-amber-100' : 'text-purple-700 bg-purple-100'
                              }`}>
                                {item.fecha} - {item.tipo}
                              </span>
                              <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                <Clock size={12}/> Hace {Math.floor((new Date().getTime() - new Date(item.fecha).getTime()) / (1000 * 3600 * 24))} días
                              </span>
                            </div>
                            
                            <h4 className="font-bold text-slate-900 mt-2 text-lg">{item.titulo}</h4>
                          </div>
                          
                          {item.responsable && item.responsable !== 'N/A' && (
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 border border-slate-200">
                                <Users size={14} className="text-slate-400" /> {item.responsable}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className={`p-4 rounded-lg border mb-4 ${
                          item.color === 'emerald' ? 'bg-white border-emerald-100' : 'bg-slate-50 border-slate-100'
                        }`}>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            {item.descripcion}
                          </p>
                          {item.trazabilidad && (
                            <div className="mt-2 pt-2 border-t border-emerald-100 text-[10px] font-mono text-emerald-600">
                              Trazabilidad: {item.trazabilidad}
                            </div>
                          )}
                        </div>
                        
                        {item.adjuntos && item.adjuntos.length > 0 && (
                          <div className="border-t border-slate-100 pt-3 mt-3">
                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                              <Paperclip size={14} /> Archivos Adjuntos ({item.adjuntos.length})
                            </h5>
                            <div className="flex flex-wrap gap-3">
                              {item.adjuntos.map(adj => (
                                <a key={adj.id} href={adj.url} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-colors group cursor-pointer">
                                  {adj.type === 'pdf' ? <FileText size={16} className="text-rose-500" /> : <ImageIcon size={16} className="text-indigo-500" />}
                                  <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-700">{adj.name}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ));
                })()}
                {avances.length === 0 && seguimientos.length === 0 && contracts.length === 0 && otrosies.length === 0 && reports.length === 0 && <EmptyState message="No hay eventos en el timeline." />}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'resumen' && activeSubTabResumen === 'radiografia' && (
          <div className="animate-in fade-in">
            <ProjectRadiography project={data} />
          </div>
        )}
        
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'reconstructor' && (
          <div className="animate-in fade-in">
            <ScheduleReconstructor project={data} />
          </div>
        )}
        
        {activeTab === 'documentos' && (
          <div className="flex space-x-2 overflow-x-auto mb-6 border-b border-slate-100">
            <button onClick={() => setActiveSubTabDocumentos('repositorio')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabDocumentos === 'repositorio' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Repositorio Documental</button>
            <button onClick={() => setActiveSubTabDocumentos('analisis')} className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${activeSubTabDocumentos === 'analisis' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Análisis de Informes (IA)</button>
          </div>
        )}

        {activeTab === 'documentos' && activeSubTabDocumentos === 'analisis' && (
          <div className="animate-in fade-in">
            <InformeAnalysisComponent />
          </div>
        )}
        
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'analitica' && (
          <div className="animate-in fade-in">
            <PredictiveAnalytics projectData={data} />
          </div>
        )}

        {activeTab === 'territorio' && activeSubTabTerritorio === 'compromisos' && (
          <div className="animate-in fade-in">
            <CompromisosTab project={project} />
          </div>
        )}
        
        {/* TAB 5: ALERTAS */}
        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'alertas' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h3 className="text-lg font-semibold text-slate-800">Gestión de Riesgos y Alertas ({alerts.length})</h3>
              <button 
                onClick={() => setShowAlerts(!showAlerts)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                {showAlerts ? (
                  <>Ocultar Alertas <ChevronUp size={18} /></>
                ) : (
                  <>Mostrar Alertas <ChevronDown size={18} /></>
                )}
              </button>
            </div>
            
            {showAlerts && (
              <div className="grid grid-cols-1 gap-4">
                {alerts.map(alert => {
                  const isHigh = alert.nivel === 'Alto';
                  const isClosed = alert.estado === 'Cerrada';
                  
                  return (
                    <div key={alert.id} className={`
                      border rounded-xl p-5 flex gap-4
                      ${isClosed ? 'bg-slate-50 border-slate-200 opacity-70' : 
                        isHigh ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}
                    `}>
                      <div className={`mt-1 ${isClosed ? 'text-slate-400' : isHigh ? 'text-rose-500' : 'text-amber-500'}`}>
                        <AlertTriangle size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider
                              ${isClosed ? 'bg-slate-200 text-slate-600' : 
                                isHigh ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}
                            `}>
                              {alert.tipo}
                            </span>
                            <span className="text-xs text-slate-500">{alert.fecha}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border
                            ${isClosed ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-white text-slate-700 border-slate-300'}
                          `}>
                            {alert.estado}
                          </span>
                        </div>
                        <p className={`text-sm mt-2 ${isClosed ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                          {alert.descripcion}
                        </p>
                        {alert.recomendacionIA && (
                          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <h5 className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Sparkles size={14} /> Recomendación IA
                            </h5>
                            <p className="text-sm text-indigo-900 leading-relaxed italic">
                              {alert.recomendacionIA}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {alerts.length === 0 && <EmptyState message="No hay alertas registradas para este proyecto." />}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: AMBIENTAL */}
        {activeTab === 'territorio' && activeSubTabTerritorio === 'ambiental' && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">Cumplimiento Ambiental</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {environmental.map(env => (
                <div key={env.id} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Leaf size={18} className="text-emerald-600" />
                      <h4 className="font-semibold text-slate-800">{env.permiso}</h4>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border
                      ${env.estado === 'Aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                        env.estado === 'En Trámite' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-slate-100 text-slate-600 border-slate-200'}
                    `}>
                      {env.estado}
                    </span>
                  </div>
                  <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InfoItem label="Resolución / Acto Administrativo" value={env.resolucion} />
                    <InfoItem label="Plan de Compensación" value={env.compensaciones} />
                  </div>
                </div>
              ))}
              {environmental.length === 0 && <EmptyState message="No hay registros ambientales." />}
            </div>
          </div>
        )}

        {/* TAB 7: INFORMES DE INTERVENTORÍA */}
        {activeTab === 'territorio' && activeSubTabTerritorio === 'interventoria' && (
          <div className="animate-in fade-in">
            <InterventoriaReportsTab data={data} onUpdateProject={onUpdateProject} />
          </div>
        )}

        {/* TAB 8: COMISIONES A TERRITORIO */}
        {activeTab === 'territorio' && activeSubTabTerritorio === 'comisiones' && (
          <div className="animate-in fade-in space-y-8">
            <ComisionesTerritorio projectId={project.id} />
            <GestionComisiones projectId={project.id} />
          </div>
        )}

        {/* TAB 9: REPOSITORIO DOCUMENTAL */}
        {activeTab === 'documentos' && activeSubTabDocumentos === 'repositorio' && (
          <div className="animate-in fade-in">
            <ProjectDocumentsTab projectId={project.id} />
          </div>
        )}

        {activeTab === 'territorio' && activeSubTabTerritorio === 'ops' && (
          <div className="animate-in fade-in space-y-8">
            <GestionOPS projectId={project.id} />
          </div>
        )}

        {activeTab === 'monitoreo' && activeSubTabMonitoreo === 'seguimiento' && (
          <div className="animate-in fade-in">
            <SmartTimeline project={data} />
          </div>
        )}

        {/* TAB 10: IMPACTO TERRITORIAL */}
        {activeTab === 'resumen' && activeSubTabResumen === 'impacto' && (
          <div className="space-y-8 animate-in fade-in">
            <ImpactoTerritorialDashboard projects={[data]} onSelectProject={() => {}} />
          </div>
        )}

        {/* TAB 10.1: METODOLOGÍA INVERSIÓN-IMPACTO */}
        {activeTab === 'resumen' && activeSubTabResumen === 'impacto' && (
          <div className="animate-in fade-in">
             <FinancialImpactDashboard projectData={data} edanData={{} as any /* EDAN MOCK */} />
          </div>
        )}

        {/* TAB 11: PÓLIZAS Y GARANTÍAS */}
        {activeTab === 'contratos' && activeSubTabContratos === 'polizas' && (
          <div className="animate-in fade-in">
            <GestionPolizas projectId={project.id} />
          </div>
        )}

      </div>

      {/* HIDDEN REPORT TEMPLATE FOR PDF EXPORT */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={reportRef} style={{ width: '800px', backgroundColor: '#ffffff', padding: '40px', fontFamily: 'sans-serif', color: '#1e293b' }}>
          {/* Header Institucional */}
          <div style={{ borderBottom: '4px solid #312e81', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 style={{ fontSize: '30px', fontWeight: 900, color: '#312e81', textTransform: 'uppercase', letterSpacing: '-0.025em', margin: 0 }}>Informe Semanal de Interventoría</h1>
              <p style={{ fontSize: '18px', color: '#64748b', marginTop: '4px', fontWeight: 500, margin: 0 }}>Sistema de Seguimiento SRR</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Fecha de Generación</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{new Date().toLocaleDateString('es-CO')}</p>
            </div>
          </div>

          {/* Datos del Proyecto */}
          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{project.nombre}</h2>
              <span style={{ padding: '4px 12px', backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 700, borderRadius: '9999px', fontSize: '14px' }}>{project.id}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div><span style={{ color: '#64748b', fontWeight: 500 }}>Ubicación:</span> <strong style={{ color: '#0f172a' }}>{project.municipio}, {project.departamento}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: 500 }}>Estado:</span> <strong style={{ color: '#0f172a' }}>{project.estado}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: 500 }}>Contratista Obra:</span> <strong style={{ color: '#0f172a' }}>{contracts.find(c => c.tipo === 'Obra')?.contratista || 'N/A'}</strong></div>
              <div><span style={{ color: '#64748b', fontWeight: 500 }}>Interventoría:</span> <strong style={{ color: '#0f172a' }}>{contracts.find(c => c.tipo === 'Interventoría')?.contratista || 'N/A'}</strong></div>
            </div>
          </div>

          {/* Avances */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>1. Estado de Avances</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Avance Programado</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{project.avanceProgramado}%</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Avance Físico Real</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#4f46e5' }}>{project.avanceFisico}%</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#ffffff' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Avance Financiero</div>
              <div style={{ fontSize: '24px', fontWeight: 900, color: '#059669' }}>{project.avanceFinanciero}%</div>
            </div>
          </div>

          {/* Resumen Financiero Detallado */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>2. Resumen Financiero</h3>
          <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', margin: 0 }}>Inversión Total</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(presupuesto.valorTotal)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', margin: 0 }}>Pagos Realizados</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#059669', margin: 0 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(presupuesto.pagosRealizados)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', margin: 0 }}>Saldo por Ejecutar</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(presupuesto.valorTotal - presupuesto.pagosRealizados)}</p>
              </div>
              <div>
                <p style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px', margin: 0 }}>Vigencia</p>
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{presupuesto.vigencia}</p>
              </div>
            </div>
          </div>

          {/* Últimas Actividades (Trackings) */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>3. Actividades y Observaciones Recientes</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
            {avances.slice(0, 3).map(t => (
              <div key={t.id} style={{ borderLeft: '4px solid #6366f1', paddingLeft: '16px', paddingTop: '8px', paddingBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                  <strong style={{ color: '#1e293b' }}>Fecha: {t.fecha}</strong>
                  <span style={{ color: '#64748b' }}>Reporta: {t.reportadoPor}</span>
                </div>
                <p style={{ fontSize: '14px', color: '#334155', margin: 0 }}>{t.observaciones}</p>
              </div>
            ))}
            {avances.length === 0 && <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No hay actividades reportadas.</p>}
          </div>

          {/* Trazabilidad Institucional */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>4. Trazabilidad Institucional</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {seguimientos.slice(0, 3).map(s => (
              <div key={s.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <strong style={{ color: '#312e81' }}>{s.tipo} - {s.fecha}</strong>
                </div>
                <p style={{ fontSize: '13px', color: '#1e293b', margin: '4px 0' }}>{s.descripcion}</p>
                <p style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>Trazabilidad: {s.trazabilidad}</p>
              </div>
            ))}
            {seguimientos.length === 0 && <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No hay registros de trazabilidad institucional.</p>}
          </div>

          {/* Alertas Activas */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>5. Alertas y Riesgos Activos</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {alerts.filter(a => a.estado === 'Abierta').map(a => (
              <div key={a.id} style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '12px', borderRadius: '8px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <AlertTriangle size={18} color="#e11d48" style={{ marginTop: '2px' }} />
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#881337' }}>{a.tipo} ({a.nivel})</div>
                  <div style={{ fontSize: '14px', color: '#9f1239', marginTop: '4px' }}>{a.descripcion}</div>
                </div>
              </div>
            ))}
            {alerts.filter(a => a.estado === 'Abierta').length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', backgroundColor: '#ecfdf5', padding: '12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span style={{ fontSize: '14px', fontWeight: 500 }}>No hay alertas activas reportadas.</span>
              </div>
            )}
          </div>

          {/* Gestión Ambiental */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>6. Gestión Ambiental</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
            {environmental.map(e => (
              <div key={e.id} style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <strong style={{ color: '#0f172a' }}>{e.permiso}</strong>
                  <span style={{ 
                    padding: '2px 8px', 
                    borderRadius: '9999px', 
                    fontSize: '11px', 
                    fontWeight: 700,
                    backgroundColor: e.estado === 'Aprobado' ? '#ecfdf5' : e.estado === 'En Trámite' ? '#fffbeb' : '#fef2f2',
                    color: e.estado === 'Aprobado' ? '#059669' : e.estado === 'En Trámite' ? '#d97706' : '#dc2626'
                  }}>
                    {e.estado}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Resolución: {e.resolucion || 'Pendiente'}</p>
              </div>
            ))}
            {environmental.length === 0 && <p style={{ fontSize: '14px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>No se registran trámites ambientales.</p>}
          </div>

          {/* Impacto Territorial */}
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#312e81', borderBottom: '2px solid #e0e7ff', paddingBottom: '8px', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>7. Impacto Territorial y Reducción de Riesgo</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#ecfdf5' }}>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Personas Protegidas</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#064e3b' }}>{project.poblacionBeneficiada?.toLocaleString() || 'N/A'}</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#fff1f2' }}>
              <div style={{ fontSize: '12px', color: '#e11d48', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Riesgo Inicial</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#881337' }}>{project.riesgoAntes || 'N/A'}</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#e0e7ff' }}>
              <div style={{ fontSize: '12px', color: '#4f46e5', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Riesgo Actual</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#312e81' }}>{project.riesgoDespues || 'N/A'}</div>
            </div>
            <div style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '8px', textAlign: 'center', backgroundColor: '#eff6ff' }}>
              <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>Costo por Persona</div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#1e3a8a' }}>
                {project.poblacionBeneficiada && project.poblacionBeneficiada > 0 ? 
                  formatCurrency(calculateProjectTotals(project, contracts, otrosies, state.convenios, state.afectaciones, pagos, project.suspensiones || [], undefined, state.proyectos, undefined, state.presupuestos).valorTotal / project.poblacionBeneficiada) 
                  : 'N/A'}
              </div>
            </div>
          </div>

          {/* Firmas */}
          <div style={{ marginTop: '64px', paddingTop: '32px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '100%', marginBottom: '8px', height: '48px' }}></div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Firma Interventoría</p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>{contracts.find(c => c.tipo === 'Interventoría')?.contratista || 'N/A'}</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '1px solid #94a3b8', width: '100%', marginBottom: '8px', height: '48px' }}></div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', margin: 0 }}>Firma Supervisión SRR</p>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Aprobación de Informe</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal for Project */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">¿Borrar Proyecto?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas borrar este proyecto? Esta acción es irreversible y eliminará todos los datos asociados.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteProject(project.id);
                  setShowDeleteModal(false);
                  onBack();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Sí, borrar proyecto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Contract */}
      {contractToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">¿Borrar Contrato?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas borrar este contrato? Esta acción es irreversible y eliminará todos los otrosíes y documentos asociados.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setContractToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteContract(contractToDelete);
                  setContractToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Sí, borrar contrato
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal for Otrosie */}
      {otrosieToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">¿Borrar Otrosí?</h3>
            </div>
            <p className="text-slate-600 mb-6">
              ¿Estás seguro de que deseas borrar este otrosí? Esta acción es irreversible.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOtrosieToDelete(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteOtrosie(otrosieToDelete);
                  setOtrosieToDelete(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
              >
                Sí, borrar otrosí
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Details Modal */}
      {selectedContract && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8 animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center sticky top-0 bg-white/80 backdrop-blur-md z-10 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Contrato {selectedContract.numero}</h3>
                  <p className="text-sm text-slate-500">{selectedContract.tipo} - {selectedContract.contratista}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedContract(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-8">
              {/* Financial & Time Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-emerald-700 mb-2">
                    <DollarSign size={18} />
                    <h4 className="font-bold">Valor del Contrato</h4>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900">{formatCurrency(selectedContract.valor)}</p>
                </div>
                
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-indigo-700 mb-2">
                    <Calendar size={18} />
                    <h4 className="font-bold">Plazo de Ejecución</h4>
                  </div>
                  <p className="text-2xl font-bold text-indigo-900">{selectedContract.plazoMeses} meses</p>
                  <p className="text-sm text-indigo-700 mt-1">
                    {selectedContract.fechaInicio || 'Inicio no definido'} - {selectedContract.fechaFin || 'Fin no definido'}
                  </p>
                </div>
              </div>

              {/* AI Analysis Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <BrainCircuit size={20} className="text-indigo-600" />
                  <h4 className="text-lg font-bold text-slate-800">Análisis del Contrato (IA)</h4>
                </div>
                
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  <h5 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Objeto Contractual</h5>
                  <p className="text-slate-700 leading-relaxed">{selectedContract.objetoContractual}</p>
                </div>

                {selectedContract.obligacionesPrincipales && selectedContract.obligacionesPrincipales.length > 0 && (
                  <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100">
                    <h5 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">Obligaciones Principales</h5>
                    <ul className="list-disc pl-5 space-y-2 text-indigo-800">
                      {selectedContract.obligacionesPrincipales.map((obligacion, index) => (
                        <li key={index} className="leading-relaxed">{obligacion}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {selectedContract.garantias && selectedContract.garantias.length > 0 && (
                  <div className="bg-amber-50 rounded-xl p-5 border border-amber-100">
                    <h5 className="text-sm font-bold text-amber-900 uppercase tracking-wider mb-3">Garantías Exigidas</h5>
                    <ul className="list-disc pl-5 space-y-2 text-amber-800">
                      {selectedContract.garantias.map((garantia, index) => (
                        <li key={index} className="leading-relaxed">{garantia}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Associated Document */}
              {(() => {
                const doc = state.documentos.find(d => d.contractId === selectedContract.id && d.tipo === 'Contrato');
                if (doc && doc.versiones.length > 0) {
                  return (
                    <div className="border-t border-slate-200 pt-6">
                      <h4 className="font-bold text-slate-800 mb-4">Documento Original</h4>
                      <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-3">
                          <FileText className="text-indigo-600" size={24} />
                          <div>
                            <p className="font-medium text-slate-900">{doc.titulo}</p>
                            <p className="text-xs text-slate-500">Subido el {new Date(doc.fechaCreacion).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <button 
                          onClick={async () => {
                            const latestVersion = doc.versiones[doc.versiones.length - 1];
                            await downloadFileWithAutoRepair(latestVersion.url, latestVersion.nombreArchivo);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Eye size={16} />
                          Ver PDF
                        </button>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Financial Documents Manager */}
              <div className="border-t border-slate-200 pt-6">
                <p className="text-sm text-slate-500 italic">Gestione la trazabilidad financiera desde la pestaña "Financiero" del proyecto.</p>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setSelectedContract(null)}
                className="px-6 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Otrosí Details Modal */}
      {selectedOtrosie && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detalles del Otrosí No. {selectedOtrosie.numero}</h3>
                <p className="text-sm text-slate-500 mt-1">Fecha de firma: {selectedOtrosie.fechaFirma}</p>
              </div>
              <button onClick={() => setSelectedOtrosie(null)} className="text-slate-400 hover:text-slate-600">
                <PlusCircle size={24} className="rotate-45" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Objeto del Otrosí</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{selectedOtrosie.objeto}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 p-4 rounded-lg border border-indigo-100">
                  <h4 className="text-sm font-bold text-indigo-800 mb-1">Impacto Financiero</h4>
                  <p className="text-lg font-bold text-indigo-600">
                    {selectedOtrosie.valorAdicional > 0 ? `+${formatCurrency(selectedOtrosie.valorAdicional)}` : 'Sin adición'}
                  </p>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-800 mb-1">Impacto en Plazo</h4>
                  <p className="text-lg font-bold text-emerald-600">
                    {selectedOtrosie.plazoAdicionalMeses > 0 ? `+${selectedOtrosie.plazoAdicionalMeses} meses` : 'Sin prórroga'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BrainCircuit size={16} className="text-indigo-600" />
                  Análisis de Justificación (IA)
                </h4>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Justificación Técnica</h5>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedOtrosie.justificacionTecnica}</p>
                </div>
                
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Justificación Jurídica</h5>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedOtrosie.justificacionJuridica}</p>
                </div>
              </div>

              {selectedOtrosie.clausulasModificadas && selectedOtrosie.clausulasModificadas.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Cláusulas Modificadas</h4>
                  <div className="space-y-3">
                    {selectedOtrosie.clausulasModificadas.map((c, i) => (
                      <div key={i} className="border border-slate-200 rounded-lg overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
                          <span className="text-sm font-bold text-slate-700">Cláusula {c.numero}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                          <div className="p-4 bg-rose-50/30">
                            <span className="text-xs font-bold text-rose-700 block mb-1">Dice:</span>
                            <p className="text-xs text-slate-600">{c.descripcionAnterior}</p>
                          </div>
                          <div className="p-4 bg-emerald-50/30">
                            <span className="text-xs font-bold text-emerald-700 block mb-1">Debe Decir:</span>
                            <p className="text-xs text-slate-600">{c.descripcionNueva}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-8 border-t border-slate-100">
                <p className="text-sm text-slate-500 italic">Gestione la trazabilidad financiera desde la pestaña "Financiero" del proyecto.</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setSelectedOtrosie(null)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Cerrar Detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {editingContract && (
        <EditContractModal 
          contract={editingContract}
          projectId={project.id}
          onClose={() => setEditingContract(null)}
        />
      )}
    </div>
  );
};

// Helper Components
const InfoItem = ({ label, value, icon }: { label: string, value: string | number, icon?: React.ReactNode }) => (
  <div>
    <div className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1.5">
      {icon && <span className="text-slate-400">{icon}</span>}
      {label}
    </div>
    <div className="text-sm font-medium text-slate-900">{value}</div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
    <p className="text-slate-500 text-sm">{message}</p>
  </div>
);
