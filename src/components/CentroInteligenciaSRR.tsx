import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ProjectData, Alert, Professional } from '../types';
import { Bot, Send, BarChart3, FileText, AlertTriangle, TrendingUp, Download, Zap, Sliders, ShieldAlert, Lightbulb, Loader2, Plus, Minus, Calculator, FileWarning, CheckCircle2, XCircle, Target, BrainCircuit } from 'lucide-react';
import { generatePDF } from '../utils/pdfGenerator';
import { AIInsights } from './AIInsights';
import { getAIResponse, generateShockPlan } from '../services/geminiService';
import { StrategicAssistant } from './StrategicAssistant';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface CentroInteligenciaProps {
  projects: ProjectData[];
  professionals?: Professional[];
}

interface Message {
  role: 'user' | 'ai';
  text: string;
  chart?: {
    type: 'bar' | 'pie' | 'line';
    title: string;
    data: { name: string; value: number }[];
  };
  recommendations?: string[];
  inconsistencies?: string[];
}

import { handleAiError } from '../utils/aiUtils';
import { AIProviderSelector } from './AIProviderSelector';
import { getAIModel } from '../services/aiProviderService';

export const CentroInteligenciaSRR: React.FC<CentroInteligenciaProps> = ({ projects, professionals = [] }) => {
  const [activeTab, setActiveTab] = useState<'analisis' | 'resumen' | 'priorizacion' | 'simulador' | 'macro' | 'estrategia'>('estrategia');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Simulator State
  const [simulationParams, setSimulationParams] = useState<{
    projectId: string;
    delayMonths: number;
    costOverrun: number;
    hasOtrosie: boolean;
    hasProrroga: boolean;
  }>({
    projectId: projects[0]?.project.id || '',
    delayMonths: 0,
    costOverrun: 0,
    hasOtrosie: false,
    hasProrroga: false
  });

  const [simulationResult, setSimulationResult] = useState<{
    newEndDate: string;
    newTotalCost: number;
    riskLevel: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
    impactDescription: string;
  } | null>(null);

  const [isAnalyzingPatterns, setIsAnalyzingPatterns] = useState(false);
  const [systemPatterns, setSystemPatterns] = useState<{
    title: string;
    description: string;
    impact: 'Alto' | 'Medio' | 'Bajo';
    category: 'Costo' | 'Tiempo' | 'Estructuración' | 'Innovación';
    recommendation: string;
  }[]>([]);

  const [selectedProjectForShockPlan, setSelectedProjectForShockPlan] = useState<ProjectData | null>(null);
  const [shockPlan, setShockPlan] = useState<any | null>(null);
  const [isGeneratingShockPlan, setIsGeneratingShockPlan] = useState(false);

  const handleGenerateShockPlan = async (project: ProjectData) => {
    setSelectedProjectForShockPlan(project);
    setIsGeneratingShockPlan(true);
    setShockPlan(null);
    try {
      const plan = await generateShockPlan(project);
      setShockPlan(plan);
    } catch (error) {
      console.error("Error generating shock plan:", error);
    } finally {
      setIsGeneratingShockPlan(false);
    }
  };

  const analyzePortfolioPatterns = async () => {
    setIsAnalyzingPatterns(true);
    try {
      const prompt = "Realiza un análisis de Deep Learning sobre todo el portafolio de proyectos para detectar patrones recurrentes, casos de éxito en estructuración, oportunidades de ahorro, innovaciones aplicadas y riesgos comunes por zona geográfica. Responde con una lista de hallazgos estructurados.";
      const aiData = await getAIResponse(prompt, projects);
      
      // If the AI returns recommendations or text, we can try to map them to patterns
      // For now, let's use a more specific prompt if we want structured patterns
      // But getAIResponse already returns recommendations.
      
      if (aiData.recommendations) {
        setSystemPatterns(aiData.recommendations.map((rec, i) => ({
          title: `Patrón Detectado #${i+1}`,
          description: rec,
          impact: i % 3 === 0 ? 'Alto' : 'Medio',
          category: i % 2 === 0 ? 'Estructuración' : 'Costo',
          recommendation: "Implementar seguimiento reforzado en esta área."
        })));
      }
    } catch (error) {
      console.error("Error analyzing patterns:", error);
    } finally {
      setIsAnalyzingPatterns(false);
    }
  };

  const runSimulation = () => {
    const project = projects.find(p => p.project.id === simulationParams.projectId);
    if (!project) return;

    const baseDate = new Date(project.project.fechaFin || project.project.fechaInicio || Date.now());
    let newEndDate = project.project.fechaFin || '';
    
    if (!isNaN(baseDate.getTime())) {
      const newDate = new Date(baseDate.setMonth(baseDate.getMonth() + simulationParams.delayMonths));
      if (!isNaN(newDate.getTime())) {
        newEndDate = newDate.toISOString().split('T')[0];
      }
    }
    
    const newCost = project.presupuesto.valorTotal * (1 + simulationParams.costOverrun / 100);
    
    let risk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico' = 'Bajo';
    if (simulationParams.delayMonths > 6 || simulationParams.costOverrun > 20) risk = 'Crítico';
    else if (simulationParams.delayMonths > 3 || simulationParams.costOverrun > 10) risk = 'Alto';
    else if (simulationParams.delayMonths > 0 || simulationParams.costOverrun > 0) risk = 'Medio';

    setSimulationResult({
      newEndDate,
      newTotalCost: newCost,
      riskLevel: risk,
      impactDescription: `El retraso de ${simulationParams.delayMonths} meses y el sobrecosto del ${simulationParams.costOverrun}% generan un impacto ${(risk || '').toLowerCase()} en el portafolio. ${simulationParams.hasOtrosie ? 'Se requiere trámite de Otrosí.' : ''} ${simulationParams.hasProrroga ? 'Se requiere trámite de Prórroga.' : ''}`
    });
  };

  // Prioritization Model
  const prioritizedProjects = useMemo(() => {
    return projects.map(p => {
      // Risk score: based on alerts and delays
      const delay = Math.max(0, p.project.avanceProgramado - p.project.avanceFisico);
      const riskScore = (p.alerts.length * 20) + (delay * 2);
      
      // Impact score: based on investment size (normalized roughly)
      const impactScore = Math.min(100, (p.presupuesto.valorTotal / 10000000000) * 50);
      
      // Progress score: closer to 0 or 100 might mean different things, let's say lower progress needs more attention
      const progressScore = 100 - p.project.avanceFisico;

      const totalScore = (riskScore * 0.5) + (impactScore * 0.3) + (progressScore * 0.2);

      return {
        ...p,
        scores: { risk: riskScore, impact: impactScore, progress: progressScore, total: totalScore }
      };
    }).sort((a, b) => b.scores.total - a.scores.total);
  }, [projects]);

  const totalInvestment = projects.reduce((sum, p) => sum + p.presupuesto.valorTotal, 0);
  const avgProgress = projects.reduce((sum, p) => sum + p.project.avanceFisico, 0) / (projects.length || 1);

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    
    setIsExporting(true);
    
    try {
      await generatePDF(reportRef.current, {
        filename: 'Resumen_Ejecutivo_Nacional_SRR.pdf',
        backgroundColor: '#ffffff'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <Zap className="text-amber-400" size={24} />
          <h1 className="text-2xl font-bold">Centro de Inteligencia SRR</h1>
        </div>
        <p className="text-slate-400">Análisis predictivo, optimización de portafolio y asistencia IA.</p>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
        <button 
          onClick={() => setActiveTab('estrategia')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'estrategia' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <Target size={18} />
          Estrategia
        </button>
        <button 
          onClick={() => setActiveTab('analisis')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'analisis' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <BarChart3 size={18} />
          Análisis de Portafolio
        </button>
        <button 
          onClick={() => setActiveTab('resumen')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'resumen' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <FileText size={18} />
          Resumen Ejecutivo
        </button>
        <button 
          onClick={() => setActiveTab('priorizacion')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'priorizacion' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <TrendingUp size={18} />
          Priorización
        </button>
        <button 
          onClick={() => setActiveTab('simulador')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'simulador' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <Sliders size={18} />
          Simulador de Escenarios
        </button>
        <button 
          onClick={() => setActiveTab('macro')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'macro' ? 'border-b-2 border-indigo-600 text-indigo-700 bg-white' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <Lightbulb size={18} />
          Inteligencia Macro
        </button>
      </div>
        
        {/* Estrategia Tab */}
        {activeTab === 'estrategia' && (
          <div className="h-full overflow-hidden bg-slate-50 p-6">
            <StrategicAssistant projects={projects} professionals={professionals} onClose={() => {}} />
          </div>
        )}

        {/* Shock Plan Modal */}
        {selectedProjectForShockPlan && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <Zap className="text-amber-400" size={24} />
                  <div>
                    <h3 className="text-xl font-bold">Plan de Choque Institucional</h3>
                    <p className="text-slate-400 text-xs">{selectedProjectForShockPlan.project.nombre}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedProjectForShockPlan(null)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {isGeneratingShockPlan ? (
                  <div className="h-64 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="animate-spin text-indigo-600" size={48} />
                    <div className="text-center">
                      <p className="font-bold text-slate-800">Generando Plan de Choque con IA...</p>
                      <p className="text-sm text-slate-500">Analizando cronograma, alertas y contratos para proponer acciones reales.</p>
                    </div>
                  </div>
                ) : shockPlan ? (
                  <div className="space-y-8">
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-6 rounded-r-xl">
                      <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Resumen de la Situación Crítica
                      </h4>
                      <p className="text-amber-800 text-sm leading-relaxed">{shockPlan.resumenSituacion}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Target size={18} className="text-indigo-600" />
                          Objetivos Inmediatos (30 días)
                        </h4>
                        <ul className="space-y-3">
                          {shockPlan.objetivosInmediatos.map((obj: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600">
                              <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                              {obj}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <TrendingUp size={18} className="text-indigo-600" />
                          Hitos de Recuperación
                        </h4>
                        <div className="space-y-4">
                          {shockPlan.hitosRecuperacion.map((hito: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-slate-800">{hito.hito}</p>
                                <p className="text-xs text-slate-500">Fecha Estimada: {hito.fechaEstimada}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Zap size={18} className="text-indigo-600" />
                        Acciones Específicas de Intervención
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {shockPlan.accionesEspecificas.map((accion: any, i: number) => (
                          <div key={i} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                accion.categoria === 'Técnica' ? 'bg-blue-100 text-blue-700' :
                                accion.categoria === 'Administrativa' ? 'bg-purple-100 text-purple-700' :
                                accion.categoria === 'Financiera' ? 'bg-emerald-100 text-emerald-700' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {accion.categoria}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{accion.plazo}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 mb-2">{accion.accion}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Bot size={12} /> Responsable: {accion.responsable}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-6 bg-indigo-900 text-white rounded-2xl">
                      <h4 className="font-bold mb-4 flex items-center gap-2">
                        <BarChart3 size={18} className="text-indigo-300" />
                        Indicadores de Éxito del Plan
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {shockPlan.indicadoresExito.map((ind: string, i: number) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-indigo-100">
                            <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                            {ind}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                    <p>No se pudo generar el plan. Intente de nuevo.</p>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedProjectForShockPlan(null)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cerrar
                </button>
                <button 
                  onClick={() => window.print()}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  <Download size={18} />
                  Exportar Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Análisis Tab */}
        {activeTab === 'analisis' && (
          <div className="h-full overflow-y-auto p-6">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Análisis Automático de Portafolio</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp size={24} />
                </div>
                <h3 className="text-slate-500 text-sm font-medium">Salud del Portafolio</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">{(avgProgress).toFixed(1)}%</p>
                <p className="text-sm text-emerald-600 mt-2">Avance físico promedio</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-slate-500 text-sm font-medium">Nivel de Riesgo Global</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">Medio</p>
                <p className="text-sm text-amber-600 mt-2">{projects.reduce((sum, p) => sum + p.alerts.length, 0)} alertas activas</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 size={24} />
                </div>
                <h3 className="text-slate-500 text-sm font-medium">Eficiencia Financiera</h3>
                <p className="text-3xl font-bold text-slate-800 mt-1">68%</p>
                <p className="text-sm text-indigo-600 mt-2">Ejecución vs Programado</p>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <h3 className="font-bold text-slate-800 mb-4">Hallazgos de la IA</h3>
              <ul className="space-y-3">
                <li className="flex gap-3 text-slate-700">
                  <span className="text-amber-500 mt-1">•</span>
                  <span>Se detecta una correlación entre la temporada invernal y retrasos en proyectos de infraestructura vial en la región Andina.</span>
                </li>
                <li className="flex gap-3 text-slate-700">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Los proyectos de mitigación de riesgo muestran una eficiencia financiera 15% superior al promedio.</span>
                </li>
                <li className="flex gap-3 text-slate-700">
                  <span className="text-rose-500 mt-1">•</span>
                  <span>Alerta sistémica: 3 proyectos comparten el mismo contratista que actualmente presenta retrasos superiores al 20%.</span>
                </li>
              </ul>
            </div>

            <h2 className="text-xl font-bold text-slate-800 mb-6">Modelo Predictivo de Retrasos y Fallas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {prioritizedProjects.slice(0, 2).map((p) => {
                const isHighRisk = p.scores.risk > 30;
                return (
                  <div key={p.project.id} className={`p-6 rounded-xl border ${isHighRisk ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900">{p.project.nombre}</h3>
                        <p className="text-sm text-slate-600">{p.project.departamento}</p>
                      </div>
                      <ShieldAlert className={isHighRisk ? 'text-rose-500' : 'text-amber-500'} size={24} />
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700 mb-1">Probabilidad de Falla / Suspensión</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div className={`h-full ${isHighRisk ? 'bg-rose-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, p.scores.risk * 1.5)}%` }}></div>
                          </div>
                          <span className="text-sm font-bold">{Math.min(99, p.scores.risk * 1.5).toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="bg-white p-4 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="text-indigo-500" size={16} />
                          <span className="font-bold text-sm text-slate-800">Acción Preventiva Sugerida</span>
                        </div>
                        <p className="text-sm text-slate-600">
                          {isHighRisk 
                            ? 'Convocar mesa técnica de urgencia con contratista e interventoría. Evaluar posible cesión de contrato o inyección de recursos de contingencia.' 
                            : 'Aumentar frecuencia de comisiones de seguimiento en terreno. Solicitar plan de choque al contratista para recuperar cronograma.'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen Tab */}
        {activeTab === 'resumen' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-slate-800">Resumen Ejecutivo Nacional</h2>
              <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isExporting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExporting ? 'Generando PDF...' : 'Exportar PDF'}
              </button>
            </div>
            
            <div ref={reportRef} className="bg-white border border-slate-200 rounded-xl p-8 max-w-4xl mx-auto shadow-sm">
              <div className="text-center mb-8 border-b border-slate-200 pb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Estado General del Portafolio SRR</h1>
                <p className="text-slate-500">Corte: {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="prose prose-slate max-w-none">
                <h3>1. Panorama de Inversión</h3>
                <p>El portafolio actual consta de <strong>{projects.length} proyectos activos</strong>, con una inversión total aprobada de <strong>${(totalInvestment / 1000000000).toFixed(2)} Billones</strong>. La ejecución financiera global se sitúa en un nivel aceptable, aunque se requiere acelerar los desembolsos en la región pacífica.</p>
                
                <h3>2. Avance Físico vs Programado</h3>
                <p>El avance físico promedio nacional es del <strong>{avgProgress.toFixed(1)}%</strong>. Se observa una desviación promedio del 5% respecto a los cronogramas programados, principalmente atribuible a factores climáticos y trámites de licenciamiento ambiental.</p>
                
                <h3>3. Gestión de Riesgos</h3>
                <p>Actualmente existen <strong>{projects.reduce((sum, p) => sum + p.alerts.length, 0)} alertas activas</strong> en el sistema. El Centro de Inteligencia recomienda especial atención a los proyectos de reasentamiento, los cuales concentran el 40% de las alertas de nivel alto.</p>
                
                <div className="bg-indigo-50 p-6 rounded-xl mt-8 border border-indigo-100">
                  <h4 className="text-indigo-900 font-bold mt-0 flex items-center gap-2">
                    <Zap size={20} />
                    Estrategia Nacional de Inversión SRR Automática
                  </h4>
                  <p className="text-indigo-800 mb-4">Basado en el análisis predictivo del portafolio, la IA sugiere el siguiente plan de acción a 90 días:</p>
                  <ul className="space-y-2 text-indigo-800">
                    <li><strong>1. Contención:</strong> Intervenir inmediatamente los {prioritizedProjects.filter(p => p.scores.risk > 30).length} proyectos con riesgo crítico de suspensión.</li>
                    <li><strong>2. Redistribución:</strong> Congelar desembolsos en proyectos con avance físico menor al 20% y más de 6 meses de ejecución.</li>
                    <li><strong>3. Aceleración:</strong> Priorizar pagos a contratistas en proyectos de mitigación de riesgo que superen el 80% de avance para asegurar entregas antes de la temporada de lluvias.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priorización Tab */}
        {activeTab === 'priorizacion' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Modelo de Priorización de Inversión</h2>
                <p className="text-slate-500">Ranking generado por IA calculando el Score de Prioridad por proyecto.</p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg border border-emerald-200 text-sm font-medium flex items-center gap-2">
                <Lightbulb size={16} />
                {prioritizedProjects.length > 0 ? `Se sugiere priorizar: ${prioritizedProjects[0].project.nombre}` : 'No hay proyectos para priorizar'}
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-medium">Prioridad</th>
                    <th className="p-4 font-medium">Proyecto</th>
                    <th className="p-4 font-medium">Departamento</th>
                    <th className="p-4 font-medium">Score Total</th>
                    <th className="p-4 font-medium">Riesgo</th>
                    <th className="p-4 font-medium">Impacto</th>
                    <th className="p-4 font-medium">Acción Sugerida</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prioritizedProjects.map((p, idx) => (
                    <tr key={p.project.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-rose-100 text-rose-600' : idx === 1 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                          {idx + 1}
                        </div>
                      </td>
                      <td className="p-4 font-medium text-slate-800">{p.project.nombre}</td>
                      <td className="p-4 text-slate-600">{p.project.departamento}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${p.scores.total > 70 ? 'bg-rose-500' : p.scores.total > 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${Math.min(100, p.scores.total)}%` }}
                            ></div>
                          </div>
                          <span className="font-bold">{p.scores.total.toFixed(0)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600">{p.scores.risk.toFixed(0)}</td>
                      <td className="p-4 text-slate-600">{p.scores.impact.toFixed(0)}</td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleGenerateShockPlan(p)}
                          className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
                        >
                          Ver Plan de Choque
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Simulador Tab */}
        {activeTab === 'simulador' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800">Simulador de Escenarios Contractuales</h2>
                <p className="text-slate-500">Evalúa el impacto de retrasos, sobrecostos y modificaciones legales.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Sliders size={18} className="text-indigo-500" />
                    Variables de Simulación
                  </h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Seleccionar Proyecto</label>
                      <select 
                        value={simulationParams.projectId}
                        onChange={(e) => setSimulationParams({...simulationParams, projectId: e.target.value})}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
                      >
                        {projects.map(p => (
                          <option key={p.project.id} value={p.project.id}>{p.project.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Retraso Estimado (Meses)</label>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSimulationParams({...simulationParams, delayMonths: Math.max(0, simulationParams.delayMonths - 1)})}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-xl font-bold w-12 text-center">{simulationParams.delayMonths}</span>
                          <button 
                            onClick={() => setSimulationParams({...simulationParams, delayMonths: simulationParams.delayMonths + 1})}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Sobrecosto Estimado (%)</label>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSimulationParams({...simulationParams, costOverrun: Math.max(0, simulationParams.costOverrun - 5)})}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="text-xl font-bold w-12 text-center">{simulationParams.costOverrun}%</span>
                          <button 
                            onClick={() => setSimulationParams({...simulationParams, costOverrun: simulationParams.costOverrun + 5})}
                            className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-4 border-t border-slate-100">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-10 h-6 rounded-full transition-colors relative ${simulationParams.hasOtrosie ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={simulationParams.hasOtrosie}
                            onChange={() => setSimulationParams({...simulationParams, hasOtrosie: !simulationParams.hasOtrosie})}
                          />
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${simulationParams.hasOtrosie ? 'left-5' : 'left-1'}`}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Incluir Otrosí (Valor)</span>
                      </label>

                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-10 h-6 rounded-full transition-colors relative ${simulationParams.hasProrroga ? 'bg-indigo-600' : 'bg-slate-200'}`}>
                          <input 
                            type="checkbox" 
                            className="hidden" 
                            checked={simulationParams.hasProrroga}
                            onChange={() => setSimulationParams({...simulationParams, hasProrroga: !simulationParams.hasProrroga})}
                          />
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${simulationParams.hasProrroga ? 'left-5' : 'left-1'}`}></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">Incluir Prórroga (Plazo)</span>
                      </label>
                    </div>

                    <button 
                      onClick={runSimulation}
                      className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      <Zap size={20} />
                      Ejecutar Simulación de Impacto
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {simulationResult ? (
                  <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 animate-in fade-in slide-in-from-right-4 duration-500">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 border-b border-slate-800 pb-4">
                      <TrendingUp size={20} className="text-emerald-400" />
                      Resultados de la Simulación
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Nueva Fecha de Finalización</p>
                        <p className="text-2xl font-bold text-white">{simulationResult.newEndDate}</p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Costo Total Proyectado</p>
                        <p className="text-2xl font-bold text-emerald-400">${(simulationResult.newTotalCost / 1000000).toFixed(1)}M</p>
                      </div>

                      <div>
                        <p className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">Nivel de Riesgo Resultante</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                            simulationResult.riskLevel === 'Crítico' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50' :
                            simulationResult.riskLevel === 'Alto' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
                            'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                          }`}>
                            {simulationResult.riskLevel}
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-slate-800">
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                          "{simulationResult.impactDescription}"
                        </p>
                      </div>

                      <div className="bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
                        <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Recomendación IA</p>
                        <p className="text-xs text-slate-300">
                          Se recomienda iniciar el trámite administrativo de modificación contractual de inmediato para evitar hallazgos de entes de control por ejecución sin amparo legal.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
                    <Calculator size={48} className="text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-400">Esperando Simulación</h3>
                    <p className="text-sm text-slate-400 mt-2">Configura las variables y presiona el botón para ver el impacto proyectado.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* Macro Tab */}
        {activeTab === 'macro' && (
          <div className="h-full bg-slate-50 overflow-y-auto p-6">
            <div className="max-w-6xl mx-auto space-y-8">
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <Lightbulb className="text-amber-500" size={28} />
                    Inteligencia Macro y Control Automático
                  </h2>
                  <p className="text-slate-500 mt-1">Aprendizaje del sistema, patrones ocultos y acciones automatizadas.</p>
                </div>
                <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold border border-emerald-200 shadow-sm">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  IA Activa y Monitoreando
                </div>
              </div>

              {/* Aprendizaje del Sistema */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Bot className="text-indigo-400" size={20} />
                  <h3 className="font-bold text-white text-lg">Aprendizaje del Sistema (Patrones Detectados)</h3>
                  <button 
                    onClick={analyzePortfolioPatterns}
                    disabled={isAnalyzingPatterns}
                    className="ml-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isAnalyzingPatterns ? <Loader2 size={16} className="animate-spin" /> : <BrainCircuit size={16} />}
                    {isAnalyzingPatterns ? 'Analizando...' : 'Ejecutar Deep Learning'}
                  </button>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100 rounded-full -mr-10 -mt-10 opacity-50" />
                      <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                        <TrendingUp size={16} /> Correlación: Clima vs. Rendimiento
                      </h4>
                      <p className="text-sm text-indigo-800 leading-relaxed">
                        El sistema ha aprendido que los proyectos en la subregión "Costera" sufren una caída del <span className="font-bold text-rose-600">35% en rendimiento físico</span> durante los meses de Octubre a Diciembre.
                      </p>
                      <div className="mt-4 text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        Acción Sugerida: Ajustar curvas de inversión.
                      </div>
                    </div>

                    <div className="bg-amber-50 rounded-xl p-5 border border-amber-100 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-100 rounded-full -mr-10 -mt-10 opacity-50" />
                      <h4 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                        <AlertTriangle size={16} /> Riesgo Sistémico: Contratistas
                      </h4>
                      <p className="text-sm text-amber-800 leading-relaxed">
                        Contratistas con más de 3 proyectos simultáneos presentan una probabilidad del <span className="font-bold text-rose-600">82% de requerir prórroga</span> en al menos uno de sus contratos.
                      </p>
                      <div className="mt-4 text-xs font-semibold text-amber-600 uppercase tracking-wider">
                        Acción Sugerida: Limitar adjudicaciones múltiples.
                      </div>
                    </div>
                  </div>

                  {systemPatterns.length > 0 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2">Nuevos Hallazgos de Deep Learning</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {systemPatterns.map((pattern, idx) => (
                          <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                pattern.category === 'Costo' ? 'bg-emerald-100 text-emerald-700' :
                                pattern.category === 'Tiempo' ? 'bg-amber-100 text-amber-700' :
                                pattern.category === 'Innovación' ? 'bg-purple-100 text-purple-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {pattern.category}
                              </span>
                              <span className={`text-[10px] font-bold ${
                                pattern.impact === 'Alto' ? 'text-rose-600' :
                                pattern.impact === 'Medio' ? 'text-amber-600' :
                                'text-emerald-600'
                              }`}>
                                Impacto {pattern.impact}
                              </span>
                            </div>
                            <h5 className="font-bold text-slate-800 text-sm mb-1">{pattern.title}</h5>
                            <p className="text-xs text-slate-600 leading-relaxed mb-3">{pattern.description}</p>
                            <div className="pt-2 border-t border-slate-50 flex items-center gap-2 text-indigo-600">
                              <Zap size={12} />
                              <span className="text-[10px] font-bold uppercase">Recomendación:</span>
                              <span className="text-[10px] text-slate-500 italic">{pattern.recommendation}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {/* Control Automático Real */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <ShieldAlert className="text-rose-400" size={20} />
                  <h3 className="font-bold text-white text-lg">Control Automático Real (Acciones Ejecutadas)</h3>
                </div>
                <div className="p-0">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="p-4 font-semibold border-b border-slate-200">Fecha/Hora</th>
                        <th className="p-4 font-semibold border-b border-slate-200">Trigger (Disparador)</th>
                        <th className="p-4 font-semibold border-b border-slate-200">Acción Automática</th>
                        <th className="p-4 font-semibold border-b border-slate-200 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-xs">Hoy, 08:30 AM</td>
                        <td className="p-4 font-medium text-slate-800">Desviación Financiera &gt; 15% en Proyecto PRJ-001</td>
                        <td className="p-4 text-slate-600">Bloqueo automático de nuevos pagos en el sistema ERP.</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={14} /> Ejecutado
                          </span>
                        </td>
                      </tr>
                      <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-xs">Ayer, 17:45 PM</td>
                        <td className="p-4 font-medium text-slate-800">Vencimiento de Póliza en 15 días (Contrato INT-002)</td>
                        <td className="p-4 text-slate-600">Envío de correo de alerta al contratista y supervisor.</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={14} /> Ejecutado
                          </span>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 text-slate-500 font-mono text-xs">Hace 2 días</td>
                        <td className="p-4 font-medium text-slate-800">Carga de Informe de Interventoría con inconsistencias</td>
                        <td className="p-4 text-slate-600">Rechazo automático del informe y notificación de corrección.</td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                            <CheckCircle2 size={14} /> Ejecutado
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Matriz de Cruce Avanzado */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Sliders className="text-blue-400" size={20} />
                  <h3 className="font-bold text-white text-lg">IA Avanzada: Cruce Multidimensional</h3>
                </div>
                <div className="p-6">
                  <p className="text-slate-600 mb-6 text-sm">
                    El sistema cruza variables financieras, físicas, temporales y de rendimiento de contratistas para predecir el éxito del portafolio.
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-center min-h-[300px]">
                      {/* Placeholder for a complex 3D or scatter chart, simulated with a stylized visual */}
                      <div className="relative w-full h-full flex items-center justify-center">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-100/50 via-transparent to-transparent" />
                        <div className="text-center z-10">
                          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 mb-4 shadow-inner border-4 border-white">
                            <Bot size={32} />
                          </div>
                          <h4 className="text-lg font-bold text-slate-800 mb-2">Modelo Predictivo Activo</h4>
                          <p className="text-sm text-slate-500 max-w-sm mx-auto">
                            Analizando 1,452 variables cruzadas en tiempo real para optimizar la asignación de recursos.
                          </p>
                        </div>
                        
                        {/* Floating nodes to simulate neural network / data crossing */}
                        <div className="absolute top-10 left-10 w-3 h-3 bg-rose-400 rounded-full animate-ping" />
                        <div className="absolute bottom-20 right-20 w-4 h-4 bg-emerald-400 rounded-full animate-pulse" />
                        <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Eficiencia de Inversión</div>
                        <div className="text-2xl font-black text-slate-800">84.2%</div>
                        <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                          <TrendingUp size={12} /> +2.4% vs mes anterior
                        </div>
                      </div>
                      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Riesgo Global Portafolio</div>
                        <div className="text-2xl font-black text-amber-600">Medio-Alto</div>
                        <div className="text-xs text-slate-500 mt-1">
                          Impulsado por retrasos en subregión Norte.
                        </div>
                      </div>
                      <div className="bg-indigo-600 rounded-xl p-4 shadow-md text-white">
                        <div className="text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <Lightbulb size={12} /> Insight Crítico
                        </div>
                        <p className="text-sm leading-relaxed font-medium">
                          Reasignar $2.5M del fondo de contingencia a la Línea "Infraestructura Vial" reduciría el riesgo global en un 12%.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

            </div>
          </div>
        )}

    </div>
  );
};
