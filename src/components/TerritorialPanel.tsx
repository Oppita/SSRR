import React, { useState, useMemo, useRef } from 'react';
import { ProjectData, Threat } from '../types';
import { Download, AlertTriangle, ChevronRight, FileText, CheckCircle2, Loader2, BarChart3, Bot, TrendingUp, Sliders, MapPin, Target, ShieldAlert, Map } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { IntegracionPOD } from './IntegracionPOD';
import { useProject } from '../store/ProjectContext';

interface TerritorialPanelProps {
  dept: string;
  projects: ProjectData[];
  threats: Threat[];
  onClose: () => void;
  onSelectProject?: (project: ProjectData) => void;
}

export const TerritorialPanel: React.FC<TerritorialPanelProps> = ({ dept, projects, threats, onClose, onSelectProject }) => {
  const [activeTab, setActiveTab] = useState<'resumen' | 'pot'>('resumen');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Normalize string for better matching
  const normalizeString = (str: string) => {
    return (str || '')
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  };

  const deptProjects = projects.filter(p => normalizeString(p.project.departamento) === normalizeString(dept));
  const totalInvestment = deptProjects.reduce((sum, p) => sum + p.presupuesto.valorTotal, 0);
  const totalExecuted = deptProjects.reduce((sum, p) => sum + p.presupuesto.pagosRealizados, 0);
  const avgProgress = deptProjects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / (deptProjects.length || 1);
  const avgProgrammed = deptProjects.reduce((sum, p) => sum + p.project.avanceProgramado, 0) / (deptProjects.length || 1);
  
  const { state } = useProject();
  const deptKnowledge = state.conocimientoTerritorial.find(c => normalizeString(c.departamento) === normalizeString(dept));
  const deptData = state.departamentos.find(d => normalizeString(d.name) === normalizeString(dept));
  const population = deptKnowledge?.poblacionEstimada || deptData?.population || 0;
  const extension = deptKnowledge?.extension || deptData?.extension || 0;

  const allAlerts = deptProjects.flatMap(p => p.alerts.map(a => ({ ...a, projectName: p.project.nombre })));
  const activeAlerts = allAlerts.filter(a => a.estado === 'Abierta');
  
  const allEnvironmental = deptProjects.flatMap(p => p.environmental.map(e => ({ ...e, projectName: p.project.nombre })));
  const allTrackings = deptProjects.flatMap(p => p.avances.map(t => ({ ...t, projectName: p.project.nombre }))).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 10);
  const allSeguimientos = deptProjects.flatMap(p => p.seguimientos.map(s => ({ ...s, projectName: p.project.nombre }))).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 10);
  
  // Risk calculation
  const riskLevel = activeAlerts.length > 5 ? 'Alto' : activeAlerts.length > 2 ? 'Medio' : 'Bajo';
  const riskColor = riskLevel === 'Alto' ? 'text-rose-500' : riskLevel === 'Medio' ? 'text-amber-500' : 'text-emerald-500';

  // Dynamic Analysis Generation
  const delayedProjects = deptProjects.filter(p => p.project.avanceFisico < p.project.avanceProgramado - 5);
  const suspendedProjects = deptProjects.filter(p => p.project.estado === 'En seguimiento');
  const highRiskAlerts = activeAlerts.filter(a => a.nivel === 'Alto');
  
  const financialExecutionPct = totalInvestment > 0 ? (totalExecuted / totalInvestment) * 100 : 0;
  const progressDeviation = avgProgress - avgProgrammed;

  const investmentByLine = useMemo(() => {
    const lines: Record<string, number> = {};
    deptProjects.forEach(p => {
      lines[p.project.linea] = (lines[p.project.linea] || 0) + p.presupuesto.valorTotal;
    });
    return Object.entries(lines).map(([name, value]) => ({ name, value }));
  }, [deptProjects]);

  const deptContracts = deptProjects.flatMap(p => p.contracts.map(c => ({ ...c, projectName: p.project.nombre })));
  const totalContractValue = deptContracts.reduce((sum, c) => sum + c.valor, 0);
  const totalOtrosiesValue = deptProjects.flatMap(p => p.otrosies || []).reduce((sum, o) => sum + o.valorAdicional, 0);
  const currentTotalContractValue = totalContractValue + totalOtrosiesValue;

  const generateAnalysis = () => {
    return `El departamento de ${dept} cuenta actualmente con ${deptProjects.length} proyectos de inversión registrados en el sistema, sumando una inversión total de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalInvestment)}. En términos de contratación, el territorio gestiona ${deptContracts.length} contratos activos con un valor total actualizado (incluyendo otrosíes) de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(currentTotalContractValue)}. El avance físico promedio se sitúa en ${avgProgress.toFixed(1)}%, frente a un avance programado del ${avgProgrammed.toFixed(1)}%, lo que representa una desviación promedio de ${progressDeviation > 0 ? '+' : ''}${progressDeviation.toFixed(1)}%. En términos financieros, se ha ejecutado un total de ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalExecuted)}, equivalente al ${financialExecutionPct.toFixed(1)}% de los recursos asignados al territorio.`;
  };

  const generateConclusions = () => {
    const conclusions = [];
    if (delayedProjects.length > 0) {
      conclusions.push(`Se identifica un rezago significativo en ${delayedProjects.length} proyecto(s), los cuales presentan una desviación negativa mayor al 5% respecto a su cronograma programado.`);
    } else {
      conclusions.push(`El portafolio de proyectos en el departamento presenta un buen ritmo de ejecución general, sin rezagos críticos generalizados.`);
    }
    
    if (suspendedProjects.length > 0) {
      conclusions.push(`Existen ${suspendedProjects.length} proyecto(s) en estado "En seguimiento", lo que impacta negativamente la entrega oportuna de infraestructura en el territorio.`);
    }
    
    if (activeAlerts.length > 0) {
      conclusions.push(`Se registran ${activeAlerts.length} alertas activas en el territorio, de las cuales ${highRiskAlerts.length} son de nivel Alto y requieren atención inmediata.`);
    } else {
      conclusions.push(`Actualmente no se registran alertas activas, lo que indica una gestión de riesgos controlada en el territorio.`);
    }
    
    return conclusions;
  };

  const generateRecommendations = () => {
    const recommendations = [];
    if (highRiskAlerts.length > 0) {
      recommendations.push(`Priorizar la resolución inmediata de las ${highRiskAlerts.length} alertas de nivel Alto mediante mesas de trabajo urgentes con contratistas e interventorías.`);
    }
    if (delayedProjects.length > 0) {
      recommendations.push(`Requerir planes de contingencia y aceleración a los contratistas de los ${delayedProjects.length} proyectos que presentan retrasos significativos.`);
    }
    if (suspendedProjects.length > 0) {
      recommendations.push(`Gestionar el levantamiento de las suspensiones de los proyectos paralizados, resolviendo los bloqueos prediales, ambientales o financieros correspondientes.`);
    }
    recommendations.push(`Mantener el monitoreo continuo y las visitas de seguimiento en campo para asegurar la calidad y oportunidad de las obras en el departamento de ${dept}.`);
    
    return recommendations;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const handleExport = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      await generatePDF(reportRef.current, {
        filename: `Informe_Territorial_${dept.replace(/\s+/g, '_')}.pdf`,
        backgroundColor: '#f8fafc'
      });
      
      setIsExporting(false);
      setExportSuccess(true);
      
      setTimeout(() => {
        setExportSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="text-indigo-400" />
              Panel Territorial: {dept}
            </h2>
            <p className="text-slate-400 mt-1">Resumen de inversión y estado de proyectos</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-white px-6 shrink-0">
          <button
            onClick={() => setActiveTab('resumen')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'resumen' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <FileText size={18} />
            Resumen Ejecutivo
          </button>
          <button
            onClick={() => setActiveTab('pot')}
            className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'pot' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
          >
            <Map size={18} />
            Conocimiento del Riesgo (POD)
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-100/50 p-6">
          {activeTab === 'resumen' && (
            <div ref={reportRef} className="bg-white p-10 shadow-sm border border-slate-200 max-w-5xl mx-auto font-serif">
            
            {/* Portada (Cover Page) */}
            <div className="min-h-[900px] flex flex-col justify-center items-center text-center border-b-8 border-slate-800 pb-12 mb-12 relative" style={{ pageBreakAfter: 'always' }}>
              <div className="absolute top-0 left-0 w-full flex justify-between items-start">
                <div className="text-left">
                  <h2 className="text-xl font-bold text-slate-800 tracking-widest uppercase">República de Colombia</h2>
                  <p className="text-sm text-slate-500">Sistema de Seguimiento SRR</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Documento Oficial</p>
                  <p className="text-sm text-slate-500">Uso Institucional</p>
                </div>
              </div>

              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-10 border border-slate-200 shadow-sm mt-20">
                <MapPin size={64} className="text-indigo-600" />
              </div>
              
              <h2 className="text-2xl font-semibold text-slate-500 tracking-widest uppercase mb-6">Informe de Gestión y Avance</h2>
              <h1 className="text-6xl font-black text-slate-900 uppercase tracking-tight mb-8 leading-tight">
                Análisis<br/>Territorial
              </h1>
              
              <div className="w-32 h-2 bg-indigo-600 mb-10 mx-auto rounded-full"></div>
              
              <h3 className="text-4xl font-light text-slate-700 mb-16 bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100">
                Departamento de <span className="font-bold text-slate-900">{dept}</span>
              </h3>
              
              <div className="grid grid-cols-2 gap-x-16 gap-y-8 text-left mt-auto w-full max-w-3xl bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><FileText size={14}/> Fecha de Generación</p>
                  <p className="text-xl font-semibold text-slate-800">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Bot size={14}/> Generado Por</p>
                  <p className="text-xl font-semibold text-slate-800">Sistema Automático SRR</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Target size={14}/> Total Proyectos</p>
                  <p className="text-xl font-semibold text-slate-800">{deptProjects.length} Proyectos Activos</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp size={14}/> Inversión Territorial</p>
                  <p className="text-xl font-semibold text-slate-800">{formatCurrency(totalInvestment)}</p>
                </div>
              </div>
            </div>

            {/* Header Institucional (Para páginas siguientes) */}
            <div className="border-b-2 border-slate-800 pb-4 mb-8 flex justify-between items-end hidden print:flex">
              <div>
                <h2 className="text-sm font-semibold text-slate-600 tracking-widest uppercase mb-1">Sistema de Seguimiento SRR</h2>
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-wide m-0">Informe Territorial: {dept}</h1>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest m-0">Fecha</p>
                <p className="text-sm font-bold text-slate-900 m-0">{new Date().toLocaleDateString('es-CO')}</p>
              </div>
            </div>

            {/* KPIs - Resumen Ejecutivo */}
            <section className="mb-10">
              <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">1</span>
                Resumen Ejecutivo Territorial
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Población</p>
                  <p className="text-2xl font-bold text-slate-800">{population.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Extensión</p>
                  <p className="text-2xl font-bold text-slate-800">{extension.toLocaleString()} <span className="text-sm font-normal text-slate-500">km²</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Proyectos Activos</p>
                  <p className="text-3xl font-bold text-slate-800">{deptProjects.length}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Inversión Total</p>
                  <p className="text-2xl font-bold text-slate-800">{formatCurrency(totalInvestment)}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Avance Promedio</p>
                  <p className="text-3xl font-bold text-slate-800">{avgProgress.toFixed(1)}%</p>
                </div>
                <div className="bg-slate-50 p-4 rounded border border-slate-200 text-center">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nivel de Riesgo</p>
                  <p className={`text-3xl font-bold ${riskColor}`}>{riskLevel}</p>
                </div>
              </div>
            </section>

            {/* Análisis Integral */}
            {deptProjects.length > 0 && (
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">2</span>
                  Análisis Integral del Territorio
                </h2>
                <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Bot size={100} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4 text-indigo-800 font-bold">
                      <Bot size={20} />
                      <span>Análisis Generado por IA</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-lg text-justify">
                      {generateAnalysis()}
                    </p>
                  </div>
                </div>
              </section>
            )}
          
          {/* Subattended Territory Alert */}
          {deptProjects.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-6 rounded-xl mb-6 flex items-start gap-4 shadow-sm">
              <div className="bg-amber-100 p-3 rounded-full shrink-0">
                <AlertTriangle size={24} className="text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1">Territorio Subatendido</h3>
                <p className="text-amber-700">Actualmente no hay proyectos de inversión registrados en el departamento de {dept}. Se recomienda evaluar la asignación de recursos para esta región en la próxima vigencia.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Detalle de Proyectos */}
              <section className="mb-10">
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">3</span>
                  Detalle de Proyectos en Ejecución
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="border border-slate-300 px-3 py-2">Nombre del Proyecto</th>
                        <th className="border border-slate-300 px-3 py-2">Municipio</th>
                        <th className="border border-slate-300 px-3 py-2">Tipo</th>
                        <th className="border border-slate-300 px-3 py-2 text-center">Avance Físico</th>
                        <th className="border border-slate-300 px-3 py-2 text-center">Avance Financiero</th>
                        <th className="border border-slate-300 px-3 py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptProjects.map(p => (
                        <tr key={p.project.id} className="bg-white">
                          <td className="border border-slate-300 px-3 py-2 font-medium">
                            {p.project.nombre}
                            <div className="mt-1">
                              <button 
                                onClick={() => onSelectProject && onSelectProject(p)}
                                data-html2canvas-ignore="true"
                                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                              >
                                Ver Detalles <ChevronRight size={12} />
                              </button>
                            </div>
                          </td>
                          <td className="border border-slate-300 px-3 py-2">{p.project.municipio}</td>
                          <td className="border border-slate-300 px-3 py-2">{p.project.tipoObra}</td>
                          <td className="border border-slate-300 px-3 py-2 text-center">
                            <span className={`font-bold ${p.project.avanceFisico < p.project.avanceProgramado - 10 ? 'text-red-600' : 'text-emerald-600'}`}>
                              {p.project.avanceFisico}%
                            </span>
                          </td>
                          <td className="border border-slate-300 px-3 py-2 text-center font-medium">{p.project.avanceFinanciero}%</td>
                          <td className="border border-slate-300 px-3 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              p.project.estado === 'En ejecución' ? 'bg-emerald-100 text-emerald-700' :
                              p.project.estado === 'En seguimiento' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {p.project.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Estado Financiero y Contratación */}
              <section className="mb-10" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">4</span>
                  Estado Financiero y Contratación
                </h2>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Ejecutado</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(totalExecuted)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Saldo por Ejecutar</p>
                    <p className="text-xl font-bold text-slate-800">{formatCurrency(totalInvestment - totalExecuted)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="border border-slate-300 px-3 py-2">Proyecto</th>
                        <th className="border border-slate-300 px-3 py-2">Contratista Obra</th>
                        <th className="border border-slate-300 px-3 py-2">Interventoría</th>
                        <th className="border border-slate-300 px-3 py-2 text-right">Valor Total</th>
                        <th className="border border-slate-300 px-3 py-2 text-right">Pagos Realizados</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptProjects.map(p => {
                        const obra = p.contracts.find(c => c.tipo === 'Obra');
                        const inter = p.contracts.find(c => c.tipo === 'Interventoría');
                        return (
                          <tr key={p.project.id} className="bg-white">
                            <td className="border border-slate-300 px-3 py-2 font-medium truncate max-w-[200px]" title={p.project.nombre}>{p.project.nombre}</td>
                            <td className="border border-slate-300 px-3 py-2">{obra?.contratista || 'N/A'}</td>
                            <td className="border border-slate-300 px-3 py-2">{inter?.contratista || 'N/A'}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right font-medium">{formatCurrency(p.presupuesto.valorTotal)}</td>
                            <td className="border border-slate-300 px-3 py-2 text-right text-emerald-700">{formatCurrency(p.presupuesto.pagosRealizados)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Resumen de Contratos */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">5</span>
                  Resumen de Contratos en el Territorio
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="border border-slate-300 px-2 py-2">Número</th>
                        <th className="border border-slate-300 px-2 py-2">Tipo</th>
                        <th className="border border-slate-300 px-2 py-2">Contratista</th>
                        <th className="border border-slate-300 px-2 py-2">Valor Actual</th>
                        <th className="border border-slate-300 px-2 py-2">Plazo</th>
                        <th className="border border-slate-300 px-2 py-2">Proyecto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deptProjects.flatMap(p => p.contracts.map(c => {
                        const contractOtrosies = (p.otrosies || []).filter(o => o.contractId === c.id);
                        const totalOtrosies = contractOtrosies.reduce((sum, o) => sum + o.valorAdicional, 0);
                        return { ...c, projectName: p.project.nombre, currentValue: c.valor + totalOtrosies };
                      })).map((c, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="border border-slate-300 px-2 py-2 font-medium">{c.numero}</td>
                          <td className="border border-slate-300 px-2 py-2">{c.tipo}</td>
                          <td className="border border-slate-300 px-2 py-2 truncate max-w-[150px]">{c.contratista}</td>
                          <td className="border border-slate-300 px-2 py-2 text-right">{formatCurrency(c.currentValue)}</td>
                          <td className="border border-slate-300 px-2 py-2 text-center">{c.plazoMeses} m</td>
                          <td className="border border-slate-300 px-2 py-2 truncate max-w-[150px]">{c.projectName}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Análisis por Línea de Inversión */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">6</span>
                  Distribución de la Inversión por Línea
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div className="space-y-4">
                    {investmentByLine.map((line, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">{line.name}</span>
                          <span className="font-bold text-slate-900">{formatCurrency(line.value)}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full" 
                            style={{ width: `${(line.value / totalInvestment) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                    <p className="text-sm text-slate-500 mb-2">Línea Predominante</p>
                    <p className="text-xl font-bold text-indigo-700 uppercase">
                      {[...investmentByLine].sort((a, b) => b.value - a.value)[0]?.name || 'N/A'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-xs text-slate-400">Representa el {(([...investmentByLine].sort((a, b) => b.value - a.value)[0]?.value || 0) / totalInvestment * 100).toFixed(1)}% de la inversión total en el departamento.</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Registro de Alertas Activas */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">7</span>
                  Registro de Alertas Activas
                </h2>
                {activeAlerts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2">Proyecto</th>
                          <th className="border border-slate-300 px-3 py-2">Fecha</th>
                          <th className="border border-slate-300 px-3 py-2">Nivel</th>
                          <th className="border border-slate-300 px-3 py-2">Descripción</th>
                          <th className="border border-slate-300 px-3 py-2">Recomendación IA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAlerts.map((a, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="border border-slate-300 px-3 py-2 font-medium">{a.projectName}</td>
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap">{a.fecha}</td>
                            <td className="border border-slate-300 px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                a.nivel === 'Alto' ? 'bg-red-100 text-red-700' :
                                a.nivel === 'Medio' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {a.nivel}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-3 py-2">{a.descripcion}</td>
                            <td className="border border-slate-300 px-3 py-2 italic text-indigo-700">{a.recomendacionIA || 'Pendiente de análisis'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded border border-emerald-200 text-sm">
                    Excelente: No se registran alertas activas en el departamento.
                  </div>
                )}
              </section>

              {/* Gestión Ambiental */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">8</span>
                  Gestión Ambiental Territorial
                </h2>
                {allEnvironmental.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2">Proyecto</th>
                          <th className="border border-slate-300 px-3 py-2">Permiso</th>
                          <th className="border border-slate-300 px-3 py-2">Estado</th>
                          <th className="border border-slate-300 px-3 py-2">Resolución</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allEnvironmental.map((e, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="border border-slate-300 px-3 py-2 font-medium">{e.projectName}</td>
                            <td className="border border-slate-300 px-3 py-2">{e.permiso}</td>
                            <td className="border border-slate-300 px-3 py-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                e.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' :
                                e.estado === 'En Trámite' ? 'bg-amber-100 text-amber-700' :
                                e.estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {e.estado}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-3 py-2">{e.resolucion || 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 text-slate-600 p-4 rounded border border-slate-200 text-sm">
                    No hay registros de permisos ambientales en el territorio.
                  </div>
                )}
              </section>

              {/* Últimas Actividades de Seguimiento */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">9</span>
                  Últimas Actividades de Seguimiento
                </h2>
                {allTrackings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2">Fecha</th>
                          <th className="border border-slate-300 px-3 py-2">Proyecto</th>
                          <th className="border border-slate-300 px-3 py-2">Observaciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allTrackings.map((t, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap font-medium">{t.fecha}</td>
                            <td className="border border-slate-300 px-3 py-2 font-medium">{t.projectName}</td>
                            <td className="border border-slate-300 px-3 py-2">{t.observaciones}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 text-slate-600 p-4 rounded border border-slate-200 text-sm">
                    No hay registros de seguimiento recientes.
                  </div>
                )}
              </section>

              {/* Trazabilidad Institucional */}
              <section className="mb-10" style={{ pageBreakInside: 'avoid' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">10</span>
                  Trazabilidad Institucional
                </h2>
                {allSeguimientos.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left border-collapse">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="border border-slate-300 px-3 py-2">Fecha</th>
                          <th className="border border-slate-300 px-3 py-2">Tipo</th>
                          <th className="border border-slate-300 px-3 py-2">Proyecto</th>
                          <th className="border border-slate-300 px-3 py-2">Descripción</th>
                          <th className="border border-slate-300 px-3 py-2">Trazabilidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSeguimientos.map((s, idx) => (
                          <tr key={idx} className="bg-white">
                            <td className="border border-slate-300 px-3 py-2 whitespace-nowrap font-medium">{s.fecha}</td>
                            <td className="border border-slate-300 px-3 py-2">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                                {s.tipo}
                              </span>
                            </td>
                            <td className="border border-slate-300 px-3 py-2 font-medium">{s.projectName}</td>
                            <td className="border border-slate-300 px-3 py-2">{s.descripcion}</td>
                            <td className="border border-slate-300 px-3 py-2 italic text-slate-500">{s.trazabilidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="bg-slate-50 text-slate-600 p-4 rounded border border-slate-200 text-sm">
                    No hay registros de trazabilidad institucional recientes.
                  </div>
                )}
              </section>

              {/* Conclusiones y Recomendaciones */}
              <section className="mb-10" style={{ pageBreakBefore: 'always' }}>
                <h2 className="text-xl font-black text-slate-800 uppercase border-b-2 border-slate-300 pb-2 mb-6 flex items-center gap-2">
                  <span className="bg-slate-800 text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm">11</span>
                  Conclusiones y Recomendaciones
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Conclusiones */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Target className="text-indigo-600" size={20} />
                      Conclusiones Principales
                    </h3>
                    <ul className="space-y-3">
                      {generateConclusions().map((conclusion, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-700 text-justify">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                          <span>{conclusion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recomendaciones */}
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShieldAlert className="text-emerald-600" size={20} />
                      Plan de Acción Recomendado
                    </h3>
                    <ul className="space-y-3">
                      {generateRecommendations().map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-slate-700 text-justify">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </section>

              {/* Firmas */}
              <section className="mt-20 pt-10" style={{ pageBreakInside: 'avoid' }}>
                <div className="grid grid-cols-2 gap-16">
                  <div className="text-center">
                    <div className="border-b border-slate-400 w-full mb-2 h-16"></div>
                    <p className="font-bold text-slate-800">Coordinador Territorial</p>
                    <p className="text-sm text-slate-500">Sistema de Seguimiento SRR</p>
                  </div>
                  <div className="text-center">
                    <div className="border-b border-slate-400 w-full mb-2 h-16"></div>
                    <p className="font-bold text-slate-800">Revisor de Calidad</p>
                    <p className="text-sm text-slate-500">Oficina de Control y Seguimiento</p>
                  </div>
                </div>
              </section>
            </>
          )}

            <div className="mt-16 pt-8 border-t border-slate-300 text-center text-xs text-slate-500">
              Documento generado automáticamente por el Sistema de Seguimiento SRR. <br/>
              ID de Generación: {Math.random().toString(36).substring(2, 10).toUpperCase()} - {new Date().toISOString()}
            </div>
          </div>
          )}

          {activeTab === 'pot' && (
            <div className="h-full">
              <IntegracionPOD projects={deptProjects.map(p => p.project)} threats={threats} defaultDepartamento={dept} />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab === 'resumen' && (
        <div className="p-6 bg-white border-t border-slate-200 shrink-0 flex flex-col sm:flex-row gap-3 justify-end items-center">
          {exportSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 font-medium mr-auto animate-in fade-in slide-in-from-left-4">
              <CheckCircle2 size={20} />
              <span>Informe generado exitosamente</span>
            </div>
          )}
          
          <button 
            onClick={handleExport}
            disabled={isExporting || deptProjects.length === 0}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all w-full sm:w-auto
              ${isExporting 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : deptProjects.length === 0 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm hover:shadow-md'
              }`}
          >
            {isExporting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Generando PDF...
              </>
            ) : (
              <>
                <FileText size={20} />
                Generar Informe Territorial
              </>
            )}
          </button>
        </div>
        )}

      </div>
    </div>
  );
};
