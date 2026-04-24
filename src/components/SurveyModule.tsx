import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  MapPin, 
  BrainCircuit, 
  ChevronRight, 
  FileText, 
  Database, 
  ArrowLeft,
  Save,
  CheckCircle2,
  BarChart3,
  Users,
  AlertTriangle,
  Lightbulb,
  MessageSquare,
  ShieldAlert,
  HelpCircle,
  X,
  Type,
  List,
  CheckSquare,
  LogOut,
  ShieldCheck,
  CalendarDays,
  Target,
  Layers,
  ArrowUpRight,
  Trash2,
  FileSearch,
  Settings2,
  Info,
  Filter,
  Activity,
  Calculator,
  GanttChart,
  BookOpen
} from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { 
  Survey, 
  SurveyQuestion, 
  SurveyResponse, 
  SurveyAnalysis,
  Departamento,
  Municipio,
  TechnicalSheet
} from '../types';
import { colombiaData } from '../data/colombiaData';
import { aiProviderService } from '../services/aiProviderService';
import { showAlert } from '../utils/alert';

// --- Types Fix for components ---
interface Indicator {
  label: string;
  value: number;
  color: string;
}

export const SurveyModule: React.FC<{ onExit?: () => void }> = ({ onExit }) => {
  const { state, addSurvey, addSurveyResponse, addSurveyAnalysis, deleteSurvey, globalTechnicalSheet, updateGlobalTechnicalSheet } = useProject();
  const [view, setView] = useState<'list' | 'create' | 'fill' | 'analysis'>('list');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [isEditingTechnicalSheet, setIsEditingTechnicalSheet] = useState(false);
  const [tempTechnicalSheet, setTempTechnicalSheet] = useState<TechnicalSheet | null>(null);

  const currentSheet = globalTechnicalSheet || {
    operativeName: "SRR-2026 Inteligencia Territorial",
    generalObjective: "Medir el Constructo Social del Riesgo y percepción de vulnerabilidad.",
    specificObjectives: ["Identificar nodos de riesgo social", "Evaluar resiliencia comunitaria"],
    universeDescription: "Comunidades en áreas de influencia bajo estándares OCDE.",
    analysisUnit: ["Hogar", "Individuo"],
    coverage: {
      levels: ["Departamental", "Municipal"],
      classification: ["Urbana", "Rural"],
      prioritizedZones: ["Zonas de alta amenaza"]
    },
    samplingDesign: {
      type: "Muestreo Aleatorio Simple (MAS) Estratificado",
      sampleSize: 1200,
      selectionCriteria: ["Ubicación en zona de riesgo", "Residencia permanente"]
    },
    collectionMethod: ["CAPI (Computer-Assisted Personal Interviewing)"],
    collectionPeriod: "Bimensual",
    conceptualFramework: "Marco de gobernanza del riesgo OCDE 2026",
    limitations: ["Acceso a zonas de orden público", "Conectividad intermitente"],
    expectedResults: ["Mapa de calor social", "Índice de vulnerabilidad percibida"],
    normativity2026: true
  };

  const handleStartEdit = () => {
    setTempTechnicalSheet(currentSheet);
    setIsEditingTechnicalSheet(true);
  };

  const handleSaveTechnicalSheet = () => {
    if (tempTechnicalSheet) {
      updateGlobalTechnicalSheet(tempTechnicalSheet);
    }
    setIsEditingTechnicalSheet(false);
  };

  // Geographic Helpers
  const departments: Departamento[] = colombiaData.map(d => ({ id: d.id, nombre: d.name }));
  const getMunicipalities = (deptId: string): Municipio[] => {
    const dept = colombiaData.find(d => d.id === deptId);
    return dept ? dept.municipalities.map((m, i) => ({ id: `${deptId}-${i}`, nombre: m, departamentoId: deptId })) : [];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <ClipboardList size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">Módulo de Encuestas</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Gestión del Constructo Social y Riesgo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMethodology(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-bold text-xs uppercase tracking-wider h-10"
          >
            <Calculator size={14} className="text-indigo-600" />
            Ficha Técnica
          </button>
          
          {view !== 'list' ? (
          <button 
            onClick={() => { setView('list'); setSelectedSurvey(null); }}
            className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-all font-medium text-sm"
          >
            <ArrowLeft size={18} />
            Volver al Listado
          </button>
        ) : (
          onExit && (
            <button 
              onClick={onExit}
              className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all font-medium text-sm border border-slate-100"
            >
              <LogOut size={18} />
              Cerrar Módulo
            </button>
          )
        )}
      </div>
      </header>

      <main className="p-8 lg:p-12 max-w-[1600px] mx-auto pb-24">
         {/* Main Institutional Header */}
         <div className="flex items-center gap-6 mb-12 border-b border-slate-200 pb-10">
            <div className="w-20 h-20 bg-slate-900 rounded-[30px] flex items-center justify-center text-white shadow-2xl relative overflow-hidden group border-4 border-white">
               <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-transparent opacity-30 group-hover:opacity-60 transition-opacity" />
               <Database size={40} className="relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-100">Inteligencia Territorial</span>
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                  <ShieldCheck size={12} />
                  LEY 1523 / 2026
                </span>
              </div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">Operaciones Estadísticas</h2>
              <p className="text-slate-500 font-medium text-lg italic">Instrumentos de Medición de Pobreza y Constructo Social del Riesgo</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
          {view === 'list' && (
            <SurveyList 
              surveys={state.surveys} 
              responses={state.surveyResponses}
              departments={departments}
              getMunicipalities={getMunicipalities}
              onCreate={() => setView('create')} 
              onFill={(s) => { setSelectedSurvey(s); setView('fill'); }}
              onAnalyze={(s) => { setSelectedSurvey(s); setView('analysis'); }}
              onDelete={(s) => deleteSurvey(s.id)}
            />
          )}

          {view === 'create' && (
            <SurveyBuilder 
              departments={departments} 
              getMunicipalities={getMunicipalities}
              onSave={(s) => { addSurvey(s); setView('list'); }}
            />
          )}

          {view === 'fill' && selectedSurvey && (
            <SurveyTaker 
              survey={selectedSurvey} 
              departments={departments}
              getMunicipalities={getMunicipalities}
              onSave={(r) => { addSurveyResponse(r); setView('list'); }}
            />
          )}

          {view === 'analysis' && selectedSurvey && (
            <SurveyAnalysisEngine 
              survey={selectedSurvey} 
              responses={state.surveyResponses.filter(r => r.surveyId === selectedSurvey.id)}
              analyses={state.surveyAnalyses.filter(a => a.surveyId === selectedSurvey.id)}
              onAddAnalysis={addSurveyAnalysis}
            />
          )}
        </AnimatePresence>

        {/* Methodology Modal */}
        <AnimatePresence>
          {showMethodology && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-4xl max-h-[85vh] rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 flex flex-col"
              >
                <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center">
                      <BookOpen size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black">{isEditingTechnicalSheet ? 'Parametrización de Ficha' : 'Metodología y Ficha Técnica'}</h3>
                      <p className="text-indigo-300 text-xs font-bold uppercase tracking-widest">Protocolo de Operación Estadística SRR-2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!isEditingTechnicalSheet && (
                      <button 
                        onClick={handleStartEdit}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all"
                      >
                        Parametrizar
                      </button>
                    )}
                    <button 
                      onClick={() => { setShowMethodology(false); setIsEditingTechnicalSheet(false); }}
                      className="p-3 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <X size={24} />
                    </button>
                  </div>
                </div>

                <div className="p-10 overflow-y-auto custom-scrollbar space-y-10">
                  {isEditingTechnicalSheet ? (
                    <div className="space-y-8">
                      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre Operativo</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            value={tempTechnicalSheet?.operativeName || ''}
                            onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, operativeName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Periodo de Recolección</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            value={tempTechnicalSheet?.collectionPeriod || ''}
                            onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, collectionPeriod: e.target.value})}
                          />
                        </div>
                      </section>

                      <section className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Objetivo General</label>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm h-24"
                          value={tempTechnicalSheet?.generalObjective || ''}
                          onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, generalObjective: e.target.value})}
                        />
                      </section>

                      <section className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Descripción del Universo</label>
                        <textarea 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-medium text-sm h-24"
                          value={tempTechnicalSheet?.universeDescription || ''}
                          onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, universeDescription: e.target.value})}
                        />
                      </section>

                      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Muestreo</label>
                          <input 
                            type="text" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            value={tempTechnicalSheet?.samplingDesign.type || ''}
                            onChange={(e) => setTempTechnicalSheet({
                              ...tempTechnicalSheet!, 
                              samplingDesign: {...tempTechnicalSheet!.samplingDesign, type: e.target.value}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tamaño Muestra (Meta)</label>
                          <input 
                            type="number" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            value={tempTechnicalSheet?.samplingDesign.sampleSize || 0}
                            onChange={(e) => setTempTechnicalSheet({
                              ...tempTechnicalSheet!, 
                              samplingDesign: {...tempTechnicalSheet!.samplingDesign, sampleSize: parseInt(e.target.value)}
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Absoluto (%)</label>
                          <input 
                            type="number" 
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                            value={tempTechnicalSheet?.marginOfError || 5.0}
                            onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, marginOfError: parseFloat(e.target.value)})}
                          />
                        </div>
                      </section>

                      <section className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marco Conceptual / Estándar</label>
                        <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 font-bold text-sm"
                          value={tempTechnicalSheet?.conceptualFramework || ''}
                          onChange={(e) => setTempTechnicalSheet({...tempTechnicalSheet!, conceptualFramework: e.target.value})}
                        />
                      </section>
                    </div>
                  ) : (
                    <>
                  {/* General Methodology */}
                  <section>
                    <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <Target size={14} /> {currentSheet.operativeName}
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-sm font-medium text-justify">
                      {currentSheet.generalObjective} {currentSheet.universeDescription} 
                      La presente arquitectura estadística ha sido diseñada bajo los estándares de **{currentSheet.conceptualFramework}**. El instrumento de recolección utiliza un {currentSheet.samplingDesign.type}.
                    </p>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2">
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg w-fit">
                             <Users size={16} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Universo</p>
                          <p className="text-xs font-black text-slate-800 leading-tight">Población objetivo bajo marco conceptual: {currentSheet.universeDescription}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2">
                          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg w-fit">
                             <Activity size={16} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Técnica</p>
                          <p className="text-xs font-black text-slate-800 leading-tight">{currentSheet.collectionMethod[0] || 'CAPI Automatizado'}</p>
                       </div>
                       <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-2">
                          <div className="p-2 bg-amber-100 text-amber-600 rounded-lg w-fit">
                             <ShieldCheck size={16} />
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Error Absoluto</p>
                          <p className="text-xs font-black text-slate-800 leading-tight">Margen admitido de +/- {currentSheet.marginOfError || 5.0}% con p=0.5 y q=0.5.</p>
                       </div>
                    </div>
                  </section>

                  {/* The Formula Section */}
                  <section className="bg-slate-50 p-8 rounded-[32px] border border-slate-200 relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-8 text-slate-100">
                      <Calculator size={120} />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Calculator size={14} className="text-indigo-600" /> Formulación del Tamaño de Muestra
                      </h4>
                      <p className="text-slate-500 text-xs mb-8 font-bold leading-relaxed max-w-lg">
                        Para asegurar la validez estadística con una población finita, aplicamos la fórmula de proporción poblacional con ajuste de varianza máxima prevista.
                      </p>
                      
                      <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                        <div className="text-3xl font-serif text-slate-800 tracking-tighter">
                          <span className="italic">n =</span> 
                          <span className="mx-2 inline-block text-center align-middle">
                            <span className="block border-b border-slate-900 pb-1">N · Z² · p · q</span>
                            <span className="block pt-1">e² · (N - 1) + Z² · p · q</span>
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-4 border-l border-slate-100 pl-8">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">n</p>
                            <p className="text-xs font-bold text-slate-700">Tamaño muestral</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Z</p>
                            <p className="text-xs font-bold text-slate-700">Confianza (1.96)</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">p</p>
                            <p className="text-xs font-bold text-slate-700">Probabilidad (0.5)</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">e</p>
                            <p className="text-xs font-bold text-slate-700">Margen de Error (5%)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Technical Specifications */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" /> Rigurosidad Técnica
                      </h4>
                      <ul className="space-y-4">
                        <li className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-slate-600 font-medium">**Margen de Error:** Máximo del {currentSheet.marginOfError || 5.0}% para indicadores principales a nivel departamental.</p>
                        </li>
                        <li className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-slate-600 font-medium">**Nivel de Confianza:** {currentSheet.confidenceLevel || 95}%, asumiendo una distribución normal de las respuestas.</p>
                        </li>
                        <li className="flex gap-4">
                          <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={12} />
                          </div>
                          <p className="text-xs text-slate-600 font-medium">**Marco Muestral:** {currentSheet.conceptualFramework || 'Proyecciones poblacionales DANE 2026'}.</p>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
                      <h4 className="text-xs font-black text-indigo-700 uppercase tracking-widest mb-4">Metodología de Campo</h4>
                      <p className="text-xs text-indigo-900 leading-relaxed font-bold italic mb-4">
                        "La recolección se realiza mediante dispositivos móviles con georreferenciación obligatoria y validación biométrica del encuestador."
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase">
                          <span>Tipo de Muestreo</span>
                          <span className="text-indigo-700">{currentSheet.samplingDesign.type}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase">
                          <span>Unidad Observacional</span>
                          <span className="text-indigo-700">{currentSheet.analysisUnit.join(' / ')}</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-black text-indigo-400 uppercase">
                          <span>Periodicidad</span>
                          <span className="text-indigo-700">{currentSheet.collectionPeriod}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  </>
                  )}
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-end gap-4 shrink-0">
                  {isEditingTechnicalSheet ? (
                    <>
                      <button 
                        onClick={() => setIsEditingTechnicalSheet(false)}
                        className="px-8 py-3 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-colors"
                      >
                        Descartar
                      </button>
                      <button 
                        onClick={handleSaveTechnicalSheet}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                      >
                        Guardar Parámetros
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => setShowMethodology(false)}
                      className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors shadow-xl shadow-slate-200"
                    >
                      Entendido, cerrar ficha
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Legal Footer */}
        <footer className="mt-20 pt-10 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-400">
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-4">Marco Normativo</p>
              <p className="text-xs leading-relaxed font-medium">
                Esta plataforma cumple con los protocolos de recolección de datos de la Ley de Gestión del Riesgo 2026. 
                Los datos son procesados bajo parámetros de confidencialidad estadística.
              </p>
           </div>
           <div>
              <p className="text-[10px] font-black uppercase tracking-widest mb-4">Metodología</p>
              <p className="text-xs leading-relaxed font-medium">
                Dimensionamiento basado en el índice de pobreza multidimensional expuesta (IPME-2026) y teoría de construcción social del riesgo.
              </p>
           </div>
           <div className="flex flex-col items-end pt-4 md:pt-0">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 bg-slate-200 rounded-md" />
                <div className="w-6 h-6 bg-slate-200 rounded-md" />
                <div className="w-6 h-6 bg-slate-200 rounded-md" />
              </div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">SRR Institutional Framework</p>
           </div>
        </footer>
      </main>
    </div>
  );
};

// --- Sub-Components ---

const SurveyList: React.FC<{ 
  surveys: Survey[], 
  responses: SurveyResponse[],
  departments: Departamento[],
  getMunicipalities: (id: string) => Municipio[],
  onCreate: () => void, 
  onFill: (s: Survey) => void,
  onAnalyze: (s: Survey) => void,
  onDelete: (s: Survey) => void
}> = ({ surveys, responses, departments, getMunicipalities, onCreate, onFill, onAnalyze, onDelete }) => {
  const [tab, setTab] = useState<'cards' | 'territory'>('cards');

  const [selectedSurveyId, setSelectedSurveyId] = useState<string>('all');

  // Aggregation Logic
  const territorialData = useMemo(() => {
    const depts: Record<string, { 
      name: string, 
      count: number, 
      munis: Record<string, { 
        name: string, 
        count: number, 
        target?: number 
      }> 
    }> = {};
    
    // Filter responses by selected survey
    const filteredResponses = selectedSurveyId === 'all' 
      ? responses 
      : responses.filter(r => r.surveyId === selectedSurveyId);

    filteredResponses.forEach(r => {
      const dept = departments.find(d => d.id === r.departamentoId);
      const deptName = dept?.nombre || r.departamentoId;
      
      if (!depts[r.departamentoId]) {
        depts[r.departamentoId] = { name: deptName, count: 0, munis: {} };
      }
      depts[r.departamentoId].count++;
      
      if (!depts[r.departamentoId].munis[r.municipioId]) {
        const munis = getMunicipalities(r.departamentoId);
        const muni = munis.find(m => m.id === r.municipioId);
        depts[r.departamentoId].munis[r.municipioId] = { 
          name: muni?.nombre || r.municipioId, 
          count: 0,
          target: r.territorialComplexity?.targetSampleSize
        };
      }
      depts[r.departamentoId].munis[r.municipioId].count++;

      // Update target if current one is smaller or missing
      const currentTarget = depts[r.departamentoId].munis[r.municipioId].target;
      const newTarget = r.territorialComplexity?.targetSampleSize;
      if (newTarget && (!currentTarget || newTarget > currentTarget)) {
        depts[r.departamentoId].munis[r.municipioId].target = newTarget;
      }
    });
    
    return depts;
  }, [responses, departments, getMunicipalities]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Instrumentos y Territorio</h2>
          <p className="text-slate-500 text-sm font-medium">Gestión jerárquica de la operación estadística</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => setTab('cards')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            ENCUESTAS
          </button>
          <button 
            onClick={() => setTab('territory')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tab === 'territory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            DESAGREGACIÓN TERRITORIAL
          </button>
        </div>

        <button 
          onClick={onCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-slate-900 text-white px-5 py-3 rounded-2xl transition-all shadow-xl shadow-indigo-100 font-bold text-sm"
        >
          <Plus size={18} />
          Nueva Operación
        </button>
      </div>

      {tab === 'territory' ? (
        <div className="space-y-6">
           {/* Survey Selector for Disaggregation */}
           <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Filter size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800">Filtrar por Operación</h3>
                    <p className="text-slate-500 text-xs font-medium">Seleccione una encuesta para ver su avance territorial específico</p>
                 </div>
              </div>
              
              <select 
                value={selectedSurveyId}
                onChange={(e) => setSelectedSurveyId(e.target.value)}
                className="w-full md:w-80 p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-slate-700 text-sm appearance-none cursor-pointer"
              >
                 <option value="all">Todas las Operaciones Estadísticas</option>
                 {surveys.map(s => (
                   <option key={s.id} value={s.id}>{s.title}</option>
                 ))}
              </select>
           </div>

           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                 {selectedSurveyId === 'all' ? 'Consolidado Territorial Global' : `Avance: ${surveys.find(s => s.id === selectedSurveyId)?.title || 'Encuesta Seleccionada'}`}
              </h3>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">
                 <Activity size={12} className="text-indigo-500" />
                 Sincronizado en Tiempo Real
              </div>
           </div>

           {Object.keys(territorialData).length === 0 ? (
             <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-100">
                <MapPin size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-medium italic">Aún no hay datos georreferenciados para mostrar desagregación.</p>
             </div>
           ) : (
             Object.entries(territorialData).map(([deptId, data]) => (
               <div key={deptId} className="bg-white rounded-[32px] p-6 border border-slate-200 overflow-hidden group">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                           {data.name.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-black text-slate-900 uppercase tracking-wider">{data.name}</h3>
                           <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{data.count} Total Encuestas</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                     {Object.entries(data.munis).map(([muniId, mData]) => {
                       const target = mData.target || 1; 
                       const progressPct = Math.min(Math.round((mData.count / target) * 100), 100);
                       const missing = Math.max(target - mData.count, 0);

                       return (
                        <div key={muniId} className="bg-slate-50 p-5 rounded-[28px] border border-slate-100 hover:border-indigo-200 transition-all shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Municipio</p>
                                 <p className="font-black text-slate-800 truncate text-sm">{mData.name}</p>
                              </div>
                              <div className="text-right">
                                 <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${progressPct >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-white text-indigo-600 shadow-sm'}`}>
                                    {progressPct}%
                                 </span>
                              </div>
                           </div>
                           
                           <div className="space-y-3">
                              <div className="h-2 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${progressPct}%` }}
                                   className={`h-full transition-all duration-1000 ${
                                     progressPct < 30 ? 'bg-rose-500' : 
                                     progressPct < 70 ? 'bg-amber-500' : 
                                     'bg-emerald-500'
                                   }`}
                                 />
                              </div>
                              
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                 <div className="text-slate-500">
                                    <span className="text-slate-900">{mData.count}</span>
                                    <span className="text-slate-300 mx-1">/</span>
                                    <span className="text-slate-400">{target} <span className="text-[8px] opacity-70">OBJ.</span></span>
                                 </div>
                                 {missing > 0 ? (
                                   <div className="text-rose-500 flex items-center gap-1">
                                      <AlertTriangle size={10} />
                                      Faltan {missing}
                                   </div>
                                 ) : (
                                   <div className="text-emerald-600 font-extrabold flex items-center gap-1">
                                      <CheckCircle2 size={10} />
                                      LISTO
                                   </div>
                                 )}
                              </div>
                           </div>
                        </div>
                       );
                     })}
                  </div>
               </div>
             ))
           )}
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ClipboardList size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-700">No hay encuestas creadas</h3>
          <p className="text-slate-500 max-w-sm mx-auto mt-2 mb-6">Comienza creando tu primera encuesta para medir el constructo social del riesgo.</p>
          <button 
            onClick={onCreate}
            className="text-indigo-600 font-bold hover:underline"
          >
            Crear encuesta ahora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map(survey => (
            <motion.div 
              key={survey.id}
              whileHover={{ scale: 1.02 }}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group relative overflow-hidden"
            >
              {(() => {
                const surveyResponses = responses.filter(r => r.surveyId === survey.id);
                const responseCount = surveyResponses.length;
                
                return (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <FileText size={24} />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-slate-100 text-slate-500 rounded-lg">
                          {survey.questions.length} preguntas
                        </span>
                        {survey.isGroupSurvey && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-indigo-600 text-white rounded-lg shadow-sm">
                            Modo Grupal
                          </span>
                        )}
                        {responseCount > 0 ? (
                          <motion.span 
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="text-[10px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg flex items-center gap-1 shadow-sm border border-emerald-200"
                          >
                            <CheckCircle2 size={10} />
                            {responseCount} {responseCount === 1 ? 'respuesta' : 'respuestas'}
                          </motion.span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">
                            0 recolectadas
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">{survey.title}</h3>
                    <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-4 leading-relaxed">{survey.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Target size={12} className="text-indigo-500" />
                        Operación: {survey.technicalSheet?.operativeName.substring(0, 30)}...
                      </div>
                      <div className="flex items-center gap-2 text-[10px] font-black text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100">
                        <Database size={12} />
                        Aplicación Global / Multinivel
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-6 border-t border-slate-100">
                      <button 
                        onClick={() => onDelete(survey)}
                        className="flex items-center justify-center bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button 
                        onClick={() => onFill(survey)}
                        className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
                      >
                        <MessageSquare size={16} />
                        Responder
                      </button>
                      <button 
                        onClick={() => onAnalyze(survey)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          responseCount > 0 
                          ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-100' 
                          : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed opacity-50'
                        }`}
                        disabled={responseCount === 0}
                      >
                        <BrainCircuit size={16} />
                        Análisis
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

const SurveyBuilder: React.FC<{ 
  departments: Departamento[], 
  getMunicipalities: (id: string) => Municipio[],
  onSave: (s: Survey) => void 
}> = ({ departments, getMunicipalities, onSave }) => {
  const [step, setStep] = useState<'ficha' | 'preguntas'>('ficha');
  const [title, setTitle] = useState('Encuesta Modelo de Ocupación Frente Frío – Construcción Social del Riesgo');
  const [description, setDescription] = useState('Caracterizar las dinámicas de ocupación del territorio, condiciones socioeconómicas y percepción del riesgo.');
  const [isGroupSurvey, setIsGroupSurvey] = useState(false);
  const [defaultGroupSize, setDefaultGroupSize] = useState(20);
  
  // Ficha Técnica default state based on DANE/Expert requirements
  const [techSheet, setTechSheet] = useState<TechnicalSheet>({
    operativeName: 'Encuesta Modelo de Ocupación del Territorio en Escenarios de Inundación – Frente Frío',
    generalObjective: 'Caracterizar las dinámicas de ocupación del territorio, condiciones socioeconómicas y percepción del riesgo en zonas afectadas.',
    specificObjectives: [
      'Identificar patrones de ocupación del suelo en zonas inundables',
      'Caracterizar condiciones socioeconómicas (ingreso, medios de vida, estabilidad)',
      'Analizar procesos de poblamiento (origen, desplazamiento, arraigo)',
      'Evaluar acceso a servicios básicos y equipamientos'
    ],
    universeDescription: 'Población residente en mancha de inundación (179 territorios).',
    universeTotal: 15400,
    marginOfError: 5,
    confidenceLevel: 95,
    formulaUsed: 'Muestreo aleatorio simple para proporciones con corrección por finitud.',
    analysisUnit: ['Hogares', 'Jefes de Hogar'],
    coverage: {
      levels: ['Municipal', 'Local'],
      classification: ['Urbano', 'Rural'],
      prioritizedZones: ['Canalete', 'Sinú', 'Ciénagas', 'San Jorge', 'Tierra Alta']
    },
    samplingDesign: {
      type: 'No probabilística / intencional (estratégica por riesgo)',
      sampleSize: 50,
      selectionCriteria: ['Nivel de afectación', 'Representatividad territorial']
    },
    collectionMethod: ['Encuesta estructurada cara a cara'],
    collectionPeriod: 'Abril - Junio 2026',
    conceptualFramework: 'Enfoque de construcción social del riesgo: el riesgo como resultado de decisiones históricas y exclusión estructural.',
    limitations: ['Muestra no probabilística', 'Subregistro de ingresos'],
    expectedResults: ['Tipologías de ocupación', 'Relación pobreza-exposición'],
    normativity2026: true
  });

  const [questions, setQuestions] = useState<SurveyQuestion[]>([
    { id: 'q-poverty-1', text: '¿Cuál es el ingreso mensual aproximado de su hogar?', type: 'select', options: ['Menos de 1 Salario Mínimo', '1 - 2 Salarios Mínimos', 'Más de 2 Salarios Mínimos'], required: true, category: 'Condiciones Socioeconómicas' },
    { id: 'q-poverty-2', text: '¿En el último mes, han tenido dificultades para acceder a tres comidas diarias?', type: 'boolean', required: true, category: 'Condiciones Socioeconómicas' },
    { id: 'q-occup-1', text: '¿Cuánto tiempo lleva residiendo en este predio?', type: 'number', required: true, category: 'Ocupación del Territorio' },
    { id: 'q-risk-1', text: '¿Su vivienda se ha inundado en los últimos 2 años?', type: 'boolean', required: true, category: 'Exposición al Riesgo' }
  ]);

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  const handleSave = () => {
    if (!title || questions.length === 0) {
      showAlert('Por favor completa los campos obligatorios.');
      return;
    }
    const newSurvey: Survey = {
      id: crypto.randomUUID(),
      title,
      description,
      departamentoId: 'global',
      municipioId: 'nacional',
      questions,
      createdAt: new Date().toISOString(),
      technicalSheet: techSheet,
      isGroupSurvey,
      defaultGroupSize: isGroupSurvey ? defaultGroupSize : undefined
    };
    onSave(newSurvey);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      {/* Step Indicator */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 w-fit mx-auto shadow-sm">
        <button 
          onClick={() => setStep('ficha')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${step === 'ficha' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          1. Ficha Técnica
        </button>
        <div className="w-8 h-px bg-slate-200" />
        <button 
          onClick={() => setStep('preguntas')}
          className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${step === 'preguntas' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          2. Cuestionario
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {step === 'ficha' ? (
          <div className="lg:col-span-12 space-y-6">
            <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-xl max-w-5xl mx-auto">
              <div className="flex items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white">
                  <FileText size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Definición de Operación Estadística</h3>
                  <p className="text-slate-500 font-medium italic">Alineado con estándares SRR / DANE 2026</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Nombre de la Operación</label>
                    <input 
                      type="text" 
                      value={techSheet.operativeName}
                      onChange={(e) => setTechSheet({...techSheet, operativeName: e.target.value})}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Objetivo General</label>
                    <textarea 
                      value={techSheet.generalObjective}
                      onChange={(e) => setTechSheet({...techSheet, generalObjective: e.target.value})}
                      rows={3}
                      className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 text-sm font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Enfoque Conceptual</label>
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                      <p className="text-xs text-indigo-900 leading-relaxed">
                        {techSheet.conceptualFramework}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4">Configuración de Operación</label>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-5 bg-indigo-600 text-white rounded-3xl shadow-xl shadow-indigo-100 mb-4 animate-pulse">
                        <div className="flex items-center gap-3">
                          <Users size={24} className="text-white" />
                          <div>
                            <p className="text-sm font-black uppercase tracking-widest">ACTIVAR MODO GRUPAL (LÍDERES)</p>
                            <p className="text-[10px] text-indigo-100 font-medium tracking-tight">Crucial para encuestas a 20-30 personas simultáneas</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setIsGroupSurvey(!isGroupSurvey)}
                          className={`w-14 h-7 rounded-full relative transition-colors ${isGroupSurvey ? 'bg-white' : 'bg-indigo-400'}`}
                        >
                          <div className={`absolute top-1 w-5 h-5 transition-all ${isGroupSurvey ? 'left-8 bg-indigo-600' : 'left-1 bg-white'}`} />
                        </button>
                      </div>

                      {isGroupSurvey && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3"
                        >
                          <label className="block text-[9px] font-black text-indigo-700 uppercase tracking-widest">Tamaño de Grupo Sugerido</label>
                          <div className="flex items-center gap-4">
                            <input 
                              type="range" 
                              min="2" 
                              max="50" 
                              value={defaultGroupSize}
                              onChange={(e) => setDefaultGroupSize(Number(e.target.value))}
                              className="flex-1 accent-indigo-600"
                            />
                            <span className="text-xl font-black text-indigo-600 w-12 text-center">{defaultGroupSize}</span>
                          </div>
                          <p className="text-[9px] text-indigo-400 font-medium italic">* Se habilitarán {defaultGroupSize} espacios de captura por cada pregunta.</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-2">Unidad de Análisis</label>
                    <div className="flex flex-wrap gap-2">
                      {['Hogares', 'Individuos', 'Comunidad'].map(unit => (
                        <button 
                          key={unit}
                          onClick={() => {
                            const newUnits = techSheet.analysisUnit.includes(unit) 
                              ? techSheet.analysisUnit.filter(u => u !== unit)
                              : [...techSheet.analysisUnit, unit];
                            setTechSheet({...techSheet, analysisUnit: newUnits});
                          }}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${techSheet.analysisUnit.includes(unit) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {unit}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Validado Ley 2026</p>
                          <p className="text-[10px] text-slate-500 font-medium">Cumple con protocolos de integridad estadística</p>
                        </div>
                     </div>
                  </div>
                  </div>
                </div>

                {/* Rigurosidad Estadística */}
                <div className="mt-12 pt-8 border-t border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                    <BarChart3 size={18} className="text-indigo-600" />
                    Rigurosidad y Diseño Muestral
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Población Universo</label>
                      <input 
                        type="number" 
                        value={techSheet.universeTotal}
                        onChange={(e) => setTechSheet({...techSheet, universeTotal: Number(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Margen de Error (%)</label>
                      <input 
                        type="number" 
                        value={techSheet.marginOfError}
                        onChange={(e) => setTechSheet({...techSheet, marginOfError: Number(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nivel de Confianza (%)</label>
                      <input 
                        type="number" 
                        value={techSheet.confidenceLevel}
                        onChange={(e) => setTechSheet({...techSheet, confidenceLevel: Number(e.target.value)})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fórmula Utilizada</label>
                      <input 
                        type="text" 
                        value={techSheet.formulaUsed}
                        onChange={(e) => setTechSheet({...techSheet, formulaUsed: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 font-bold text-slate-800 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-12 flex justify-center">
                <button 
                  onClick={() => setStep('preguntas')}
                  className="bg-indigo-600 hover:bg-slate-900 text-white px-12 py-5 rounded-[24px] font-black text-lg shadow-2xl transition-all flex items-center gap-4"
                >
                  Continuar al Diseño de Preguntas
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Preguntas UI (simplified reuse from previous module but with mandatory categories) */}
            <div className="lg:col-span-12">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="text-2xl font-black text-slate-900">Diseño del Instrumento</h3>
                   <p className="text-slate-500 font-medium">Asegura la trazabilidad de condiciones socioeconómicas (Pobreza)</p>
                 </div>
                 <div className="flex gap-4">
                    <button 
                      onClick={handleSave}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black shadow-lg transition-all flex items-center gap-2"
                    >
                      <Save size={20} />
                      Publicar Encuesta
                    </button>
                 </div>
               </div>

               <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-3xl p-6 border border-slate-200 flex flex-col md:flex-row gap-6 hover:border-indigo-200 transition-all group overflow-hidden relative">
                       <div className="flex gap-4 flex-1 relative z-10">
                          <span className="text-2xl font-black text-slate-200 group-hover:text-indigo-100 transition-colors shrink-0">{String(idx+1).padStart(2,'0')}</span>
                          <div className="flex-1">
                             <div className="flex flex-wrap gap-2 mb-3">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md uppercase border border-indigo-100">{q.category}</span>
                                <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md uppercase border border-slate-200">{q.type}</span>
                                {q.required && <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-md uppercase border border-rose-100">Obligatoria</span>}
                                {q.id.startsWith('q-poverty') && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase border border-amber-100 flex items-center gap-1"><AlertTriangle size={10} /> Variable Crítica</span>}
                             </div>
                             <p className="font-black text-slate-800 text-lg mb-1">{q.text || <span className="text-slate-300 italic">Pregunta sin texto...</span>}</p>
                          </div>
                       </div>

                       <div className="flex md:flex-col gap-2 relative z-10 shrink-0">
                          <button 
                            onClick={() => setEditingQuestionId(q.id)}
                            className="p-3 bg-slate-50 text-slate-400 hover:bg-slate-900 hover:text-white rounded-2xl transition-all shadow-sm"
                            title="Parametrizar Detalle"
                          >
                            <Settings2 size={20} />
                          </button>
                          <button 
                            onClick={() => setQuestions(questions.filter(item => item.id !== q.id))}
                            className="p-3 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-2xl transition-all shadow-sm"
                            title="Eliminar Pregunta"
                          >
                            <Trash2 size={20} />
                          </button>
                       </div>
                    </div>
                  ))}
                  {/* Detalle de Pregunta (Parametrizable a detalle) */}
                  <AnimatePresence>
                    {editingQuestionId && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm"
                      >
                         <motion.div 
                           initial={{ scale: 0.9, y: 20 }}
                           animate={{ scale: 1, y: 0 }}
                           className="bg-white rounded-[40px] w-full max-w-2xl shadow-2xl p-8 md:p-10 relative max-h-[90vh] overflow-y-auto custom-scrollbar"
                         >
                            <button 
                              onClick={() => setEditingQuestionId(null)}
                              className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-full transition-all text-slate-400"
                            >
                              <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                                  <Settings2 size={32} />
                               </div>
                               <div>
                                  <h3 className="text-2xl font-black text-slate-900">Parametrización Detallada</h3>
                                  <p className="text-slate-500 font-medium">Configura el comportamiento lógico de la variable</p>
                               </div>
                            </div>

                            <div className="space-y-6">
                               {(() => {
                                 const q = questions.find(item => item.id === editingQuestionId);
                                 if (!q) return null;
                                 return (
                                   <>
                                     <div>
                                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Texto de la Pregunta</label>
                                        <input 
                                          type="text" 
                                          value={q.text}
                                          onChange={(e) => {
                                            setQuestions(questions.map(item => item.id === q.id ? {...item, text: e.target.value} : item));
                                          }}
                                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 shadow-inner"
                                          placeholder="Ej: ¿Qué tipo de material es el piso?"
                                        />
                                     </div>

                                     <div>
                                        <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Instrucción / Descripción Técnica</label>
                                        <textarea 
                                          value={q.description || ''}
                                          onChange={(e) => {
                                            setQuestions(questions.map(item => item.id === q.id ? {...item, description: e.target.value} : item));
                                          }}
                                          className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-slate-600"
                                          rows={2}
                                          placeholder="Instrucciones para el encuestador..."
                                        />
                                     </div>

                                     <div className="grid grid-cols-2 gap-4">
                                        <div>
                                           <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Tipo de Captura</label>
                                           <select 
                                             value={q.type}
                                             onChange={(e) => {
                                               setQuestions(questions.map(item => item.id === q.id ? {...item, type: e.target.value as any} : item));
                                             }}
                                             className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800"
                                           >
                                              <option value="text">Texto (Abierta)</option>
                                              <option value="number">Numérica (Escala 1-10)</option>
                                              <option value="boolean">Booleana (Sí/No)</option>
                                              <option value="select">Selección Única</option>
                                              <option value="multiple">Selección Múltiple</option>
                                           </select>
                                        </div>
                                        <div>
                                           <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Categoría SRR</label>
                                           <input 
                                             type="text" 
                                             value={q.category}
                                             onChange={(e) => {
                                               setQuestions(questions.map(item => item.id === q.id ? {...item, category: e.target.value} : item));
                                             }}
                                             className="w-full bg-slate-50 border-none rounded-2xl px-5 py-4 font-bold text-slate-800"
                                             placeholder="Ej: Infraestructura"
                                           />
                                        </div>
                                     </div>

                                     {(q.type === 'select' || q.type === 'multiple') && (
                                       <div>
                                          <label className="block text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Opciones de Respuesta (Separadas por Coma)</label>
                                          <input 
                                            type="text" 
                                            value={q.options?.join(', ') || ''}
                                            onChange={(e) => {
                                              const opts = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                                              setQuestions(questions.map(item => item.id === q.id ? {...item, options: opts} : item));
                                            }}
                                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-800"
                                            placeholder="Opcion 1, Opcion 2, Opcion 3"
                                          />
                                          <p className="mt-2 text-[10px] text-slate-400 font-medium">* No olvides separar cada opción con una coma.</p>
                                       </div>
                                     )}

                                     <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[32px]">
                                        <div className="flex items-center gap-3">
                                          <button 
                                            onClick={() => {
                                              setQuestions(questions.map(item => item.id === q.id ? {...item, required: !item.required} : item));
                                            }}
                                            className={`w-12 h-6 rounded-full relative transition-colors ${q.required ? 'bg-indigo-600' : 'bg-slate-200'}`}
                                          >
                                             <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${q.required ? 'left-7' : 'left-1'}`} />
                                          </button>
                                          <span className="text-xs font-black text-slate-900 uppercase tracking-widest">Respuesta Obligatoria</span>
                                        </div>
                                     </div>

                                     <div className="pt-6">
                                        <button 
                                          onClick={() => setEditingQuestionId(null)}
                                          className="w-full bg-slate-900 text-white py-5 rounded-[24px] font-black text-lg shadow-xl hover:bg-black transition-all"
                                        >
                                          Guardar Parámetros
                                        </button>
                                     </div>
                                   </>
                                 );
                               })()}
                            </div>
                         </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button 
                    onClick={() => {
                      const newQId = crypto.randomUUID();
                      const newQ: SurveyQuestion = { id: newQId, text: '', type: 'text', required: true, category: 'General' };
                      setQuestions([...questions, newQ]);
                      setEditingQuestionId(newQId);
                    }}
                    className="w-full border-2 border-dashed border-slate-200 rounded-3xl py-6 flex flex-col items-center gap-2 text-slate-300 hover:text-indigo-600 hover:border-indigo-200 transition-all font-black uppercase text-xs"
                  >
                    <Plus size={32} />
                    Agregar Variable Adicional
                  </button>
               </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

const SurveyTaker: React.FC<{ 
  survey: Survey, 
  departments: Departamento[],
  getMunicipalities: (id: string) => Municipio[],
  onSave: (r: SurveyResponse) => void 
}> = ({ survey, departments, getMunicipalities, onSave }) => {
  const [deptId, setDeptId] = useState('');
  const [muniId, setMuniId] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [zonaAfectacion, setZonaAfectacion] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | null>(null);
  const [capturingCoords, setCapturingCoords] = useState(false);
  const [gridView, setGridView] = useState(false);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [progress, setProgress] = useState(0);

  // Identity States
  const [surveyor, setSurveyor] = useState({ fullName: '', idNumber: '', role: 'Encuestador Regional' });
  const [respondent, setRespondent] = useState({ fullName: '', idNumber: '', contact: '', age: 18, gender: 'Otro' });
  const [groupRespondents, setGroupRespondents] = useState<{ fullName: string, idNumber: string, contact: string }[]>(
    survey.isGroupSurvey ? Array(survey.defaultGroupSize || 5).fill(null).map(() => ({ fullName: '', idNumber: '', contact: '' })) : []
  );

  const municipalities = useMemo(() => getMunicipalities(deptId), [deptId, getMunicipalities]);

  // Territorial Intelligence Metrics (Deterministic Simulation based on Region)
  const territorialMetrics = useMemo(() => {
    if (!muniId) return { nbi: 15.0, gini: 0.45 };
    const hash = Array.from(muniId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return {
      nbi: Number((5 + (hash % 50)).toFixed(1)), // NBI range 5-55%
      gini: Number((0.42 + ((hash % 15) / 100)).toFixed(3)) // Gini range 0.42 - 0.57
    };
  }, [muniId]);

  const deffValue = useMemo(() => {
    // formula: 1 + (NBI weight) + (Gini weight)
    return Number((1 + (territorialMetrics.nbi / 100 * 1.2) + (territorialMetrics.gini * 0.8)).toFixed(2));
  }, [territorialMetrics]);

  // Territorial Sizing logic
  const [localUniverse, setLocalUniverse] = useState(10000);
  const [localMargin, setLocalMargin] = useState(5.0);
  const [localConfidence, setLocalConfidence] = useState(95);
  const [showCalculator, setShowCalculator] = useState(false);

  const sampleSize = useMemo(() => {
    const Z = localConfidence === 95 ? 1.96 : (localConfidence === 99 ? 2.58 : 1.645);
    const P = 0.5;
    const Q = 0.5;
    const E = localMargin / 100;
    const N = localUniverse;
    const DEFF = deffValue;

    const numerator = Math.pow(Z, 2) * P * Q * N;
    const denominator = (Math.pow(E, 2) * (N - 1)) + (Math.pow(Z, 2) * P * Q);
    
    return Math.ceil((numerator / denominator) * DEFF);
  }, [localUniverse, localMargin, localConfidence, deffValue]);

  const handleCaptureCoordinates = () => {
    if (!navigator.geolocation) {
      showAlert("Tu navegador no soporta geolocalización.");
      return;
    }
    setCapturingCoords(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setCapturingCoords(false);
        showAlert(`Coordenadas capturadas: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
      },
      (err) => {
        console.error(err);
        setCapturingCoords(false);
        showAlert("Error al capturar coordenadas. Por favor revisa los permisos.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = () => {
    // Validation
    if (!deptId || !muniId) {
      showAlert('Por favor indica el Departamento y Municipio.');
      return;
    }

    if (!surveyor.fullName) {
      showAlert('La información del encuestador es obligatoria para la validez legal.');
      return;
    }

    if (!survey.isGroupSurvey && !respondent.fullName) {
      showAlert('La información del respondiente es obligatoria para la validez legal.');
      return;
    }

    if (survey.isGroupSurvey) {
      const activeRespondents = groupRespondents.filter(r => r.fullName);
      if (activeRespondents.length === 0) {
        showAlert('Debe registrar al menos un integrante del grupo con nombre.');
        return;
      }
    }

    const missing = survey.questions.filter(q => q.required && !answers[q.id]);
    if (missing.length > 0) {
      showAlert(`Por favor responde las preguntas obligatorias: ${missing.map((_, i) => i + 1).join(', ')}`);
      return;
    }

    const response: SurveyResponse = {
      id: crypto.randomUUID(),
      surveyId: survey.id,
      surveyorInfo: surveyor,
      respondentInfo: respondent,
      groupRespondents: survey.isGroupSurvey ? groupRespondents.filter(r => r.fullName) : undefined,
      departamentoId: deptId,
      municipioId: muniId,
      zonaId: zonaId,
      zonaAfectacion: zonaAfectacion,
      coordinates: coordinates || undefined,
      date: new Date().toISOString(),
      answers,
      territorialComplexity: {
        nbi: territorialMetrics.nbi,
        gini: territorialMetrics.gini,
        deff: deffValue,
        targetSampleSize: sampleSize
      }
    };
    onSave(response);
    showAlert('Operación Estadística completada y sincronizada.');
  };

  const updateAnswer = (qid: string, val: any, respondentIndex?: number) => {
    if (survey.isGroupSurvey && respondentIndex !== undefined) {
      const currentAnswers = (answers[qid] as any[]) || [];
      const newGroupAnswers = [...currentAnswers];
      newGroupAnswers[respondentIndex] = val;
      const newAnswers = { ...answers, [qid]: newGroupAnswers };
      setAnswers(newAnswers);
      const answeredCount = Object.keys(newAnswers).filter(k => 
        Array.isArray(newAnswers[k]) ? newAnswers[k].some((v: any) => v !== undefined && v !== '') : newAnswers[k]
      ).length;
      setProgress(Math.round((answeredCount / survey.questions.length) * 100));
    } else if (survey.isGroupSurvey && respondentIndex === undefined && Array.isArray(val)) {
       // Bulk update for current group
       const newAnswers = { ...answers, [qid]: val };
       setAnswers(newAnswers);
       const answeredCount = Object.keys(newAnswers).filter(k => 
         Array.isArray(newAnswers[k]) ? newAnswers[k].some((v: any) => v !== undefined && v !== '') : newAnswers[k]
       ).length;
       setProgress(Math.round((answeredCount / survey.questions.length) * 100));
    } else {
      const newAnswers = { ...answers, [qid]: val };
      setAnswers(newAnswers);
      const answeredCount = Object.keys(newAnswers).filter(k => 
         Array.isArray(newAnswers[k]) ? newAnswers[k].some((v: any) => v !== undefined && v !== '') : newAnswers[k]
      ).length;
      setProgress(Math.round((answeredCount / survey.questions.length) * 100));
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto bg-white rounded-[40px] shadow-2xl border border-slate-100"
    >
      {/* Visual Header */}
      <div className="h-32 bg-indigo-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
        <div className="absolute inset-0 flex flex-col justify-center px-12">
          <h2 className="text-white text-3xl font-black">{survey.title}</h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold text-white uppercase tracking-widest backdrop-blur-md">
              Encuesta de Territorio
            </span>
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-12 space-y-10">
        {/* Geographic Context (Mandatory for Surveyor) */}
        <div className="space-y-6 bg-slate-50 p-8 rounded-[32px] border border-slate-100">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MapPin size={14} className="text-rose-500" />
            Ubicación del Levantamiento
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Departamento</label>
              <select 
                value={deptId}
                onChange={(e) => setDeptId(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Seleccionar departamento...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 ml-1">Municipio</label>
              <select 
                value={muniId}
                onChange={(e) => {
                  setMuniId(e.target.value);
                  if (e.target.value) setShowCalculator(true);
                }}
                className="w-full bg-white border-2 border-slate-100 rounded-2xl px-4 py-3 font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer"
              >
                <option value="">Seleccionar municipio...</option>
                {municipalities.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-3 ml-1 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target size={14} className="text-rose-500" />
                  Localización: Zona, Polígono o Ámbito de Afectación
                </span>
                {coordinates && (
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                    <MapPin size={8} />
                    GPS Activo: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </span>
                )}
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1 group">
                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors">
                     <Layers size={18} />
                   </div>
                   <input 
                    type="text" 
                    value={zonaAfectacion}
                    onChange={(e) => setZonaAfectacion(e.target.value)}
                    placeholder="Nombre de la zona, vereda o código de polígono..."
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-sm"
                  />
                </div>
                <button 
                  onClick={handleCaptureCoordinates}
                  disabled={capturingCoords}
                  className={`px-6 rounded-2xl flex items-center gap-2 font-black uppercase text-[10px] tracking-widest transition-all shadow-sm border-2 ${
                    coordinates 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                    : capturingCoords 
                      ? 'bg-slate-50 text-slate-400 border-slate-100 animate-pulse'
                      : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200 hover:text-indigo-600'
                  }`}
                  title="Capturar Coordenadas GPS del Polígono"
                >
                  <MapPin size={20} className={capturingCoords ? 'animate-bounce' : ''} />
                  {capturingCoords ? 'Capturando...' : coordinates ? 'Capturado' : 'GPS'}
                </button>
              </div>
              <div className="mt-3 flex gap-4">
                 <p className="text-[9px] text-slate-400 font-medium italic flex items-center gap-1.5 flex-1">
                  <Info size={12} className="text-indigo-400" />
                  El riesgo no es uniforme en el municipio; defina el sector crítico específicamente.
                </p>
                <div className="flex gap-2">
                   {['Urbano', 'Rural', 'Expansión'].map(ambito => (
                     <button 
                      key={ambito}
                      onClick={() => {
                        const current = zonaAfectacion.split(' - ')[0];
                        setZonaAfectacion(`${ambito} - ${current || ''}`);
                      }}
                      className="text-[8px] font-black uppercase tracking-tighter px-2 py-1 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors border border-slate-200/50"
                     >
                       {ambito}
                     </button>
                   ))}
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showCalculator && muniId && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">NBI Territorial</label>
                      <span className="text-xl font-black text-slate-800">{territorialMetrics.nbi}%</span>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">GINI (Inequidad)</label>
                      <span className="text-xl font-black text-slate-800">{territorialMetrics.gini}</span>
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col justify-center border-l-4 border-l-indigo-500">
                      <label className="block text-[9px] font-black text-indigo-600 uppercase mb-1 tracking-tighter">Efecto Diseño (DEFF)</label>
                      <span className="text-xl font-black text-indigo-600">{deffValue}</span>
                   </div>
                   <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 flex flex-col justify-center">
                      <label className="block text-[9px] font-black text-indigo-200 uppercase mb-1">Muestra Requerida (n)</label>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-white">{sampleSize}</span>
                        <span className="text-[10px] font-bold text-indigo-100">Personas</span>
                      </div>
                   </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4">
                   <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Población (N)</label>
                      <input 
                        type="number" 
                        value={localUniverse}
                        onChange={(e) => setLocalUniverse(Number(e.target.value))}
                        className="w-full font-bold text-slate-600 outline-none text-sm bg-transparent"
                      />
                   </div>
                   <div className="bg-white p-4 rounded-2xl border border-slate-100">
                      <label className="block text-[9px] font-black text-slate-400 uppercase mb-1">Error (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={localMargin}
                        onChange={(e) => setLocalMargin(Number(e.target.value))}
                        className="w-full font-bold text-slate-600 outline-none text-sm bg-transparent"
                      />
                   </div>
                </div>
                <p className="mt-4 text-[10px] text-slate-400 font-medium italic text-center">
                  * DEFF dinámico calculado según NBI y Gini institucional 2026.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Users size={14} className="text-indigo-500" />
                 Identificación del Encargador
               </h3>
               <div className="space-y-3">
                  <input 
                    type="text" 
                    value={surveyor.fullName}
                    onChange={(e) => setSurveyor({...surveyor, fullName: e.target.value})}
                    placeholder="Nombres completos del encuestador"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                  <input 
                    type="text" 
                    value={surveyor.idNumber}
                    onChange={(e) => setSurveyor({...surveyor, idNumber: e.target.value})}
                    placeholder="Cédula / ID Institucional"
                    className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
               </div>
            </div>

            <div className="space-y-4">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <Target size={14} className="text-emerald-500" />
                 {survey.isGroupSurvey ? 'Datos del Grupo de Líderes' : 'Datos del Encuestado'}
               </h3>
               {survey.isGroupSurvey ? (
                 <div className="space-y-4 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar bg-white/50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                    {groupRespondents.map((r, i) => (
                      <div key={i} className="grid grid-cols-12 gap-3 pb-3 border-b border-slate-100 last:border-0 pt-3 first:pt-0 group/leader">
                        <div className="col-span-1 flex items-center justify-center font-black text-slate-300 text-xs">
                          {i+1}
                        </div>
                        <div className="col-span-4">
                          <input 
                            type="text" 
                            placeholder="Nombre Completo"
                            value={r.fullName}
                            onChange={(e) => {
                              const newGroup = [...groupRespondents];
                              newGroup[i] = { ...r, fullName: e.target.value };
                              setGroupRespondents(newGroup);
                            }}
                            className="w-full bg-white border-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-3">
                          <input 
                            type="text" 
                            placeholder="Identificación"
                            value={r.idNumber}
                            onChange={(e) => {
                              const newGroup = [...groupRespondents];
                              newGroup[i] = { ...r, idNumber: e.target.value };
                              setGroupRespondents(newGroup);
                            }}
                            className="w-full bg-white border-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-3">
                          <input 
                            type="text" 
                            placeholder="Contacto"
                            value={r.contact}
                            onChange={(e) => {
                              const newGroup = [...groupRespondents];
                              newGroup[i] = { ...r, contact: e.target.value };
                              setGroupRespondents(newGroup);
                            }}
                            className="w-full bg-white border-slate-100 rounded-lg px-3 py-2 text-xs font-bold"
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button 
                            onClick={() => {
                              if (groupRespondents.length <= 1) return;
                              const newGroup = groupRespondents.filter((_, idx) => idx !== i);
                              setGroupRespondents(newGroup);
                              // Sync answers: remove entry i from all answer arrays
                              const newAnswers = { ...answers };
                              Object.keys(newAnswers).forEach(qid => {
                                if (Array.isArray(newAnswers[qid])) {
                                  newAnswers[qid] = (newAnswers[qid] as any[]).filter((_, idx) => idx !== i);
                                }
                              });
                              setAnswers(newAnswers);
                            }}
                            className="text-slate-300 hover:text-rose-500 transition-colors p-1"
                            title="Eliminar Líder"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                       <button 
                        onClick={() => setGroupRespondents([...groupRespondents, { fullName: '', idNumber: '', contact: '' }])}
                        className="flex-1 py-3 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                      >
                        + Agregar Líder
                      </button>
                      <button 
                        onClick={() => {
                          const count = prompt("¿Cuántos líderes desea agregar adicionalmente?", "10");
                          if (count && !isNaN(Number(count))) {
                            const newEntries = Array(Number(count)).fill(null).map(() => ({ fullName: '', idNumber: '', contact: '' }));
                            setGroupRespondents([...groupRespondents, ...newEntries]);
                          }
                        }}
                        className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-100"
                      >
                        + Carga Masiva
                      </button>
                    </div>
                 </div>
               ) : (
                <div className="space-y-3">
                    <input 
                      type="text" 
                      value={respondent.fullName}
                      onChange={(e) => setRespondent({...respondent, fullName: e.target.value})}
                      placeholder="Nombre completo del ciudadano"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                    <input 
                      type="text" 
                      value={respondent.idNumber}
                      onChange={(e) => setRespondent({...respondent, idNumber: e.target.value})}
                      placeholder="Número de identidad"
                      className="w-full bg-slate-50 border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                </div>
               )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progreso de Captura</h3>
              <span className="text-xs font-bold text-indigo-600">{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700"
              />
            </div>
          </div>
        </div>

        <div className="space-y-12">
          {survey.questions.map((q, idx) => (
            <div key={q.id} className="space-y-5 group">
              <div className="flex gap-4">
                <span className="text-4xl font-black text-slate-100 group-focus-within:text-indigo-50 transition-colors">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="pt-2">
                  <h4 className="text-lg font-bold text-slate-800 leading-snug">
                    {q.text} {q.required && <span className="text-rose-500 ml-1 text-base">*</span>}
                  </h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {q.category && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{q.category}</span>}
                    {q.description && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 italic">
                        <Info size={10} />
                        {q.description}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="ml-14 pl-2 space-y-4">
                {survey.isGroupSurvey ? (
                  <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                       <div>
                         <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Respuestas por Líder / Integrante</p>
                         <span className="text-[10px] font-bold text-slate-400">{groupRespondents.filter(r => r.fullName).length} líderes activos</span>
                       </div>
                       <div className="flex gap-2">
                         <button 
                          onClick={() => setGridView(!gridView)}
                          className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 ${gridView ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border-slate-100'}`}
                         >
                           <Layers size={14} />
                           {gridView ? 'Vista Rejilla (Modo Tablet)' : 'Vista Listado'}
                         </button>
                         <button 
                          onClick={() => {
                            const firstVal = (answers[q.id] || [])[0];
                            if (firstVal !== undefined) {
                              const bulk = Array(groupRespondents.length).fill(firstVal);
                              updateAnswer(q.id, bulk);
                            }
                          }}
                          className="text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100 animate-pulse"
                         >
                           <Users size={14} />
                           UNIFICAR (Respuesta General)
                         </button>
                       </div>
                    </div>

                    <div className={gridView ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}>
                      {groupRespondents.map((respondent, rIdx) => {
                        if (!respondent.fullName) return null;
                        const currentAnswer = (answers[q.id] || [])[rIdx];
                        return (
                          <div key={rIdx} className={`p-4 rounded-2xl bg-white border border-slate-100/50 shadow-sm transition-all hover:shadow-md ${gridView ? 'flex flex-col gap-3' : 'flex items-center gap-4'}`}>
                            <div className={`flex items-center gap-2 ${gridView ? 'border-b border-slate-50 pb-2' : 'min-w-[150px]'}`}>
                               <div className="w-5 h-5 bg-indigo-50 text-indigo-600 rounded-md flex items-center justify-center text-[10px] font-black">{rIdx+1}</div>
                               <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{respondent.fullName}</p>
                            </div>
                            
                            <div className="flex-1">
                              {q.type === 'text' && (
                                <input 
                                  type="text" 
                                  value={currentAnswer || ''}
                                  onChange={(e) => updateAnswer(q.id, e.target.value, rIdx)}
                                  className="w-full bg-slate-50 rounded-lg px-3 py-2 outline-none transition-all text-xs"
                                  placeholder="..."
                                />
                              )}

                              {q.type === 'number' && (
                                <div className="flex gap-1.5 flex-wrap">
                                  {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                      key={n}
                                      onClick={() => updateAnswer(q.id, n, rIdx)}
                                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] transition-all ${currentAnswer === n ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400 font-bold'}`}
                                    >
                                      {n}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {q.type === 'boolean' && (
                                <div className="flex gap-2">
                                  {['Sí', 'No'].map(opt => (
                                    <button
                                      key={opt}
                                      onClick={() => updateAnswer(q.id, opt, rIdx)}
                                      className={`px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest transition-all ${currentAnswer === opt ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-400'}`}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              )}

                              {(q.type === 'select' || q.type === 'multiple') && (
                                <div className="flex flex-col gap-1.5">
                                   {q.type === 'select' ? (
                                     <select 
                                      value={currentAnswer || ''}
                                      onChange={(e) => updateAnswer(q.id, e.target.value, rIdx)}
                                      className="w-full bg-slate-50 rounded-lg px-2 py-2 text-[10px] font-bold outline-none"
                                     >
                                       <option value="">Selección...</option>
                                       {q.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                     </select>
                                   ) : (
                                     <div className="flex flex-wrap gap-1">
                                        {q.options?.slice(0, 4).map(opt => (
                                          <button 
                                            key={opt}
                                            onClick={() => {
                                              const current = (currentAnswer as string[]) || [];
                                              const next = current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt];
                                              updateAnswer(q.id, next, rIdx);
                                            }}
                                            className={`px-2 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                                              (currentAnswer as string[] || []).includes(opt) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                            }`}
                                          >
                                            {opt.substring(0, 10)}
                                          </button>
                                        ))}
                                     </div>
                                   )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    {q.type === 'text' && (
                      <input 
                        type="text" 
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        className="w-full bg-slate-50 border-b-2 border-slate-200 focus:border-indigo-600 px-2 py-3 outline-none bg-transparent transition-all text-lg"
                        placeholder="Escribe tu respuesta aquí..."
                      />
                    )}

                    {q.type === 'number' && (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <button
                            key={n}
                            onClick={() => updateAnswer(q.id, n)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg transition-all ${answers[q.id] === n ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110' : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                          >
                            {n}
                          </button>
                        ))}
                      </div>
                    )}

                    {q.type === 'boolean' && (
                      <div className="flex gap-4">
                        {['Sí', 'No'].map(opt => (
                          <button
                            key={opt}
                            onClick={() => updateAnswer(q.id, opt)}
                            className={`px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${answers[q.id] === opt ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {(q.type === 'select' || q.type === 'multiple') && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options?.map(opt => (
                          <button
                            key={opt}
                            onClick={() => {
                              if (q.type === 'multiple') {
                                const current = answers[q.id] || [];
                                const next = current.includes(opt) ? current.filter((i: string) => i !== opt) : [...current, opt];
                                updateAnswer(q.id, next);
                              } else {
                                updateAnswer(q.id, opt);
                              }
                            }}
                            className={`flex items-center gap-4 px-6 py-4 rounded-3xl text-left font-bold transition-all ${
                              (q.type === 'multiple' ? (answers[q.id] || []).includes(opt) : answers[q.id] === opt) 
                              ? 'bg-indigo-50 border-2 border-indigo-200 text-indigo-700 shadow-sm' 
                              : 'bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-200'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                (q.type === 'multiple' ? (answers[q.id] || []).includes(opt) : answers[q.id] === opt) 
                                ? 'bg-indigo-600 border-indigo-600' 
                                : 'border-slate-200'
                            }`}>
                              { (q.type === 'multiple' ? (answers[q.id] || []).includes(opt) : answers[q.id] === opt) && <Plus size={14} className="text-white rotate-45" /> }
                            </div>
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <button 
          onClick={handleSubmit}
          className="w-full bg-slate-900 hover:bg-black text-white py-6 rounded-[32px] font-black text-xl shadow-2xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4"
        >
          Finalizar y Enviar
          <ChevronRight size={24} />
        </button>
      </div>
    </motion.div>
  );
};

const SurveyAnalysisEngine: React.FC<{
  survey: Survey,
  responses: SurveyResponse[],
  analyses: SurveyAnalysis[],
  onAddAnalysis: (a: SurveyAnalysis) => void
}> = ({ survey, responses, analyses, onAddAnalysis }) => {
  const [analyzing, setAnalyzing] = useState(false);

  const performAIAnalysis = async () => {
    if (responses.length === 0) {
      showAlert('Se necesitan al menos algunas respuestas para realizar un análisis.');
      return;
    }

    setAnalyzing(true);
    try {
      const tech = survey.technicalSheet;
      const prompt = `
        Eres el mayor experto en Gestión del Riesgo y Desastres, especializado en la teoría del "Constructo Social del Riesgo" y medición de Pobreza en escenarios de cambio climático y desastres (estándares BM/DANE 2026).
        
        Analiza los resultados de esta operación estadística institucional:
        
        FICHA TÉCNICA:
        - Operación: ${tech?.operativeName || survey.title}
        - Objetivo: ${tech?.generalObjective}
        - Universo: ${tech?.universeDescription} (N=${tech?.universeTotal || 'No especificado'})
        - Rigor: Error: ${tech?.marginOfError}%, Confianza: ${tech?.confidenceLevel}%, Fórmula: ${tech?.formulaUsed}
        - Enfoque: ${tech?.conceptualFramework}
        - Municipio: ${survey.municipioId}
        
        ENCUESTA: ${survey.title}
        CONTEXTO EXPERTO: ${survey.expertContext || 'Ficha Técnica parametrizada'}
        
        ENFOQUE GRUPAL: ¿Es encuesta a líderes? ${survey.isGroupSurvey ? 'SÍ' : 'NO'}
        ${survey.isGroupSurvey ? `Tamaño del grupo entrevistado: ${responses[0]?.groupRespondents?.length} líderes.` : ''}

        RESULTADOS (${responses.length} registros recolectados):
        ${responses.map((r, i) => `
        REGISTRO #${i+1}:
        - Ubicación: ${r.departamentoId} -> ${r.municipioId} | Zona: ${r.zonaAfectacion || 'No especificada'}
        - Coordenadas GPS: ${r.coordinates ? `${r.coordinates.lat}, ${r.coordinates.lng}` : 'No capturadas'}
        - Métricas Territoriales: NBI: ${r.territorialComplexity?.nbi}%, GINI: ${r.territorialComplexity?.gini}, DEFF: ${r.territorialComplexity?.deff}
        - Auditoría: Encuestador: ${r.surveyorInfo?.fullName}
        ${r.groupRespondents ? `- Grupo de Líderes (${r.groupRespondents.length}): ${r.groupRespondents.map(l => l.fullName).join(', ')}` : `- Ciudadano: ${r.respondentInfo?.fullName}`}
        - Datos Capturados: ${JSON.stringify(r.answers)}
        `).join('\n')}
        
        POR FAVOR GENERA UN INFORME DE DECISIÓN CRÍTICO (Markdown). 
        Utiliza lenguaje técnico OCDE/DANE 2026.
        Menciona específicamente la zona o polígono si se reportó.
        
        INDICADOR CLAVE: "Pobreza Expuesta al Riesgo".
        
        DEBES INCLUIR AL FINAL UN BLOQUE JSON CON 5 INDICADORES (0-100):
        {"indicators": [{"label": "Pobreza Expuesta", "value": 85, "color": "red"}, ...]}
      `;

      const text = await aiProviderService.generateContent(prompt, "gemini-3-flash-preview");
      
      let parsedIndicators: Indicator[] = [
        { label: 'Vulnerabilidad Social', value: 75, color: 'red' },
        { label: 'Percepción de Amenaza', value: 60, color: 'yellow' },
        { label: 'Resiliencia Comunitaria', value: 40, color: 'emerald' },
        { label: 'Capacidad de Respuesta', value: 30, color: 'red' },
        { label: 'Confianza Institucional', value: 50, color: 'yellow' }
      ];

      try {
        const jsonMatch = text.match(/\{[\s\S]*"indicators"[\s\S]*\}/);
        if (jsonMatch) {
          const json = JSON.parse(jsonMatch[0]);
          if (json.indicators) parsedIndicators = json.indicators;
        }
      } catch (e) { console.warn("Failed to parse indicators", e); }

      const newAnalysis: SurveyAnalysis = {
        id: crypto.randomUUID(),
        surveyId: survey.id,
        aiAnalysis: text.split('{')[0].trim(), // Remove JSON part from text
        date: new Date().toISOString(),
        indicators: parsedIndicators
      };

      onAddAnalysis(newAnalysis);
      showAlert('Análisis experto completado con éxito.');
    } catch (err) {
      console.error('AI Analysis Error:', err);
      showAlert('Error durante el análisis con IA. Por favor intenta de nuevo.');
    } finally {
      setAnalyzing(false);
    }
  };

  const latestAnalysis = analyses.length > 0 ? analyses[0] : null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
            <BarChart3 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Motor de Análisis Experto</h2>
            <div className="flex items-center gap-2">
              <p className="text-slate-500 font-medium">Procesamiento de resultados IA</p>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                {responses.length} respuestas detectadas
              </span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={performAIAnalysis}
          disabled={analyzing || responses.length === 0}
          className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
        >
          {analyzing ? (
            <>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <BrainCircuit size={20} />
              </motion.div>
              Pensando...
            </>
          ) : (
            <>
              <BrainCircuit size={20} />
              Ejecutar Motor Experto
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Statistics Pillar */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Métrica de Muestreo</h4>
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border-[6px] border-indigo-50 flex items-center justify-center relative">
                 <div className="absolute inset-0 border-[6px] border-indigo-600 rounded-full border-t-transparent -rotate-45" />
                 <span className="text-3xl font-black text-slate-900">{responses.length}</span>
              </div>
              <p className="mt-4 font-bold text-slate-700">Respuestas Recibidas</p>
              <div className="flex items-center gap-1.5 mt-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                <Users size={14} />
                Población territorio
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Alcance Territorial</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <MapPin size={18} className="text-rose-500" />
                <span className="font-bold text-sm">{colombiaData.find(d => d.id === survey.departamentoId)?.name}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex items-center gap-3">
                <ShieldAlert size={18} className="text-amber-500" />
                <span className="font-bold text-xs opacity-80">Gestión de Riesgo Nivel 4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Indicators and Results Analysis */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!latestAnalysis && !analyzing ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200"
              >
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                  <Lightbulb size={40} />
                </div>
                <h3 className="text-xl font-bold text-slate-700">Listo para el Procesamiento</h3>
                <p className="text-slate-500 max-w-lg mx-auto mt-2">
                  El motor de IA está esperando para leer las {responses.length} respuestas y generar una hoja de ruta estratégica basada en la teoría del riesgo social.
                </p>
              </motion.div>
            ) : analyzing ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-3xl p-20 text-center space-y-6"
              >
                <div className="flex justify-center gap-3">
                  {[0, 1, 2].map(i => (
                    <motion.div 
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                      className="w-3 h-3 bg-indigo-600 rounded-full"
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-slate-900">Analizando Constructo Social...</h3>
                  <p className="text-slate-500 font-medium">El experto en gestión del riesgo está procesando las variables territoriales.</p>
                </div>
              </motion.div>
            ) : latestAnalysis && (
              <motion.div 
                key="results"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                {/* Indicators Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {latestAnalysis.indicators.map((ind, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col items-center text-center">
                      <div className={`w-12 h-1.5 rounded-full mb-3 bg-${ind.color === 'red' ? 'rose' : ind.color === 'yellow' ? 'amber' : 'emerald'}-500`} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">{ind.label}</span>
                      <span className="text-xl font-black text-slate-800">{ind.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Analysis Body */}
                <div className="bg-white rounded-[32px] p-8 lg:p-10 border border-slate-200 shadow-xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
                      <BrainCircuit size={200} />
                   </div>
                   
                   <div className="flex items-center gap-2 mb-6">
                     <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                        <ShieldAlert size={18} />
                     </div>
                     <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Informe Estratégico de Riesgos v1.0</span>
                   </div>

                   <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium">
                      <div className="whitespace-pre-wrap">
                        {latestAnalysis.aiAnalysis}
                      </div>
                   </div>

                   <div className="mt-12 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
                      <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-black uppercase">
                        <AlertTriangle size={14} />
                        Prioridad Alta
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-black uppercase">
                        <FileText size={14} />
                        Soporte Técnico
                      </div>
                   </div>
                </div>

                {/* Individual Results Section */}
                <div className="bg-white rounded-[32px] p-8 lg:p-10 border border-slate-200 shadow-xl mt-6">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Registros Individuales</h3>
                      <p className="text-slate-500 font-medium text-sm">Desglose detallado de las {responses.length} encuestas recolectadas</p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                      Mostrando {responses.length} registros
                    </div>
                  </div>

                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] border border-slate-100 rounded-2xl">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr className="border-b border-slate-100 italic">
                          <th className="px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center w-12">#</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Respondiente</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Complejidad</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                          <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {responses.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium italic">
                              No se han recolectado respuestas para esta encuesta aún.
                            </td>
                          </tr>
                        ) : (
                          responses.map((resp, i) => (
                            <motion.tr 
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ delay: (i % 20) * 0.02 }}
                              key={resp.id} 
                              className="group hover:bg-slate-50 border-b border-slate-50 transition-colors"
                            >
                              <td className="px-4 py-4 text-center">
                                <span className="text-[10px] font-black text-slate-300">{(i + 1).toString().padStart(3, '0')}</span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center font-black text-[10px]">
                                    {resp.respondentInfo?.fullName?.substring(0, 2).toUpperCase() || '??'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{resp.respondentInfo?.fullName || 'Anónimo'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Id: {resp.id.substring(0, 8)}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[11px] font-bold text-slate-700">
                                    {colombiaData.find(d => d.id === resp.departamentoId)?.name || resp.departamentoId}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{resp.municipioId}</span>
                                  {resp.zonaAfectacion && (
                                    <span className="text-[9px] text-indigo-500 font-bold border-l-2 border-indigo-500 pl-1 mt-0.5">
                                      {resp.zonaAfectacion}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {resp.territorialComplexity?.nbi && (
                                    <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 rounded text-[9px] font-black uppercase">NBI {resp.territorialComplexity.nbi}%</span>
                                  )}
                                  {resp.territorialComplexity?.gini && (
                                    <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-black uppercase">GINI {resp.territorialComplexity.gini}</span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-500">
                                {resp.date ? new Date(resp.date).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 rounded-xl transition-all">
                                  <FileSearch size={16} />
                                </button>
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
