import React, { useState } from 'react';
import { X, Landmark, Globe, Map, Database, Activity, Target, ShieldCheck, FileText, BarChart3, DollarSign, Layers, ArrowRight, CheckCircle2, Lightbulb, Calculator, Zap, Edit3, Save, TrendingUp, AlertCircle, Shield, HelpCircle, Link2, ShieldAlert, GitMerge, Users, Scale, BookOpen, GitBranch, Building2 } from 'lucide-react';
import { DamageFunctionsDMAIC } from './DamageFunctionsDMAIC';
import { EconomicLossModel } from './EconomicLossModel';
import { FiscalImpactModel } from './FiscalImpactModel';
import { ColdFrontFinancingModel } from './ColdFrontFinancingModel';
import { UncertaintyAnalysisModel } from './UncertaintyAnalysisModel';
import { TotalTraceabilitySystem } from './TotalTraceabilitySystem';
import { ValidationMotor } from './ValidationMotor';
import { NationalPolicyArchitecture } from './NationalPolicyArchitecture';
import { IntegratedArchitectureEMT } from './IntegratedArchitectureEMT';
import { SixSigmaEDANProject } from './SixSigmaEDANProject';
import { DataQualityMeasurementSystem } from './DataQualityMeasurementSystem';
import { RootCauseAnalysisEDAN } from './RootCauseAnalysisEDAN';
import { PermanentControlSystem } from './PermanentControlSystem';
import { DataQualityWeightedRiskModel } from './DataQualityWeightedRiskModel';
import { StatisticalAdjustmentModel } from './StatisticalAdjustmentModel';
import { NationalIntegratedSystemArchitecture } from './NationalIntegratedSystemArchitecture';
import { ICRMathematicalDesign } from './ICRMathematicalDesign';
import { EDANTechnicalStructure } from './EDANTechnicalStructure';
import { MultiSourceValidationAudit } from './MultiSourceValidationAudit';
import { CaseStudySimulation } from './CaseStudySimulation';

interface UnifiedMethodologyModalProps {
  onClose: () => void;
}

type TabType = 'vision' | 'sixsigma' | 'impacto' | 'drf' | 'auditoria' | 'casestudy';

export const UnifiedMethodologyModal: React.FC<UnifiedMethodologyModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<TabType>('vision');
  const [isEditing, setIsEditing] = useState(false);

  // Parameterizable State
  const [content, setContent] = useState({
    nacional: {
      title: 'Modelo Nacional de Cuantificación de Desastres',
      subtitle: 'Arquitectura de Política Pública • Estándar Avanzado',
      intro: 'Este documento establece la arquitectura metodológica definitiva para la cuantificación de desastres en Colombia. Supera los enfoques determinísticos y fragmentados mediante la implementación de cuatro pilares innegociables: Trazabilidad Causal, Separación de Capas, Modelación de Incertidumbre y Replicabilidad Interterritorial.',
      capaFisica: 'Magnitudes físicas (m², km, unidades). Ejemplo: 150 viviendas destruidas.',
      capaEconomica: 'Valor monetario (COP). Ejemplo: $5.000M en lucro cesante.',
      capaFiscal: 'Obligación contingente (COP). Ejemplo: $3.000M (excluyendo bienes privados).',
      capaPresupuestal: 'CDP, RP, Pagos (COP). Ejemplo: $2.500M girados a contratistas.'
    },
    drf: {
      title: 'Disaster Risk Financing (DRF) - Banco Mundial',
      intro: 'Este modelo conceptual aplica los estándares de Disaster Risk Financing (DRF) del Banco Mundial al contexto colombiano. Establece una cadena de valor analítica estricta donde cada eslabón es prerrequisito matemático del siguiente.',
      evento: 'Fenómeno hidrometeorológico que genera alteraciones sistémicas.',
      amenaza: 'Probabilidad de ocurrencia de eventos que superan umbrales críticos.',
      exposicion: 'Inventario de población, infraestructura y medios de vida en la zona de influencia.',
      vulnerabilidad: 'Propensión de los elementos expuestos a sufrir efectos adversos.',
      dano: 'Destrucción total o parcial de activos físicos (impacto directo).',
      perdida: 'Valoración económica del daño físico y lucro cesante.',
      impactoFiscal: 'Obligación contingente materializada asumida por el Estado.',
      necesidadFinanciamiento: 'Brecha de liquidez residual que requiere instrumentos financieros ex-post.'
    },
    riesgo: {
      title: 'Análisis de Riesgo Territorial',
      intro: 'Este modelo permite cuantificar y comparar el riesgo entre diferentes municipios. Descompone el riesgo en sus factores fundamentales (Exposición y Vulnerabilidad), normaliza las variables y construye un Índice de Riesgo Territorial (IRT).',
      poblacion: 'Densidad poblacional en zonas de altitud crítica o zonas expuestas.',
      infraestructura: 'Viviendas con techos ligeros, vías terciarias susceptibles.',
      economia: 'Hectáreas sembradas de cultivos termosensibles.',
      vulSocial: '% de población con NBI y Tasa de dependencia demográfica.',
      vulFisica: '% de viviendas con déficit cualitativo.',
      vulEconomica: 'Dependencia del PIB municipal respecto al sector agropecuario.'
    },
    tecnica: {
      title: 'Metodología Técnica de Caracterización',
      intro: 'Parámetros técnicos para la declaratoria de eventos y su impacto sistémico.',
      varDuracion: 'Persistencia del sistema sobre el territorio nacional (mínimo 48h).',
      varIntensidad: 'Gradiente de presión y velocidad de desplazamiento.',
      varCobertura: 'Extensión geográfica afectada.',
      varAnomalias: 'Desviación estándar respecto a la media histórica.',
      indPrecipitacion: 'mm/24h (Umbral crítico > 50mm en zonas vulnerables).',
      indViento: 'Nudos/km/h (Ráfagas > 40 km/h para alerta).',
      indTemperatura: 'Descenso térmico (> 3°C por debajo de la media local).',
      indOleaje: 'Altura significativa de la ola (m) en zonas costeras.'
    },
    sixsigma: {
      title: 'Control de Calidad Six Sigma (DMAIC)',
      intro: 'Metodología para reducir variaciones y discrepancias entre los reportes de territorio (municipios) y las validaciones de la UNGRD, mitigando hallazgos de la Contraloría.',
      define: 'Definir el estándar único de reporte de daños (EDAN vs RUD) y los diccionarios de datos obligatorios.',
      measure: 'Medir la varianza (DPMO - Defectos por Millón de Oportunidades) entre los reportes iniciales municipales y las validaciones en terreno de la UNGRD.',
      analyze: 'Analizar causas raíz de discrepancias (ej. falta de capacitación local, incentivos perversos para inflar daños, errores de digitación).',
      improve: 'Implementar validación cruzada automatizada con imágenes satelitales (IDEAM/IGAC) y topes paramétricos por municipio.',
      control: 'Monitoreo continuo del Índice de Coherencia de Reportes (ICR). Bloqueo de giros a municipios con ICR < 85%.'
    }
  });

  const handleContentChange = (tab: keyof typeof content, field: string, value: string) => {
    setContent(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [field]: value
      }
    }));
  };

  const renderEditableText = (tab: keyof typeof content, field: string, isTextArea = false) => {
    const val = content[tab][field as keyof typeof content[typeof tab]];
    if (isEditing) {
      return isTextArea ? (
        <textarea 
          className="w-full p-2 bg-white border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          rows={3}
          value={val}
          onChange={(e) => handleContentChange(tab, field, e.target.value)}
        />
      ) : (
        <input 
          type="text"
          className="w-full p-2 bg-white border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          value={val}
          onChange={(e) => handleContentChange(tab, field, e.target.value)}
        />
      );
    }
    return <span>{val}</span>;
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-2xl">
              <Database size={24} className="text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Centro Metodológico Integrado</h3>
              <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold">Modelos, Estándares y Control de Calidad</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 ${isEditing ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
            >
              {isEditing ? <><Save size={16}/> Guardar Parámetros</> : <><Edit3 size={16}/> Parametrizar</>}
            </button>
            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto shrink-0">
          <button 
            onClick={() => setActiveTab('vision')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'vision' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Landmark size={18} /> 1. Visión Nacional (EMT)
          </button>
          <button 
            onClick={() => setActiveTab('impacto')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'impacto' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Activity size={18} /> 2. Análisis de Impacto
          </button>
          <button 
            onClick={() => setActiveTab('drf')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'drf' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <DollarSign size={18} /> 3. Estrategia DRF
          </button>
          <button 
            onClick={() => setActiveTab('auditoria')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'auditoria' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Scale size={18} /> 4. Control y Trazabilidad
          </button>
          <button 
            onClick={() => setActiveTab('casestudy')}
            className={`px-6 py-4 font-bold text-sm whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'casestudy' ? 'border-indigo-600 text-indigo-700 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
          >
            <Building2 size={18} /> 5. Caso de Estudio
          </button>
        </div>

        {/* Content Area */}
        <div className="p-8 overflow-y-auto flex-1 bg-white text-slate-800">
          
          {/* TAB: VISION ESTRATEGICA */}
          {activeTab === 'vision' && (
            <div className="space-y-16 animate-in fade-in">
              <NationalIntegratedSystemArchitecture />
              <div className="border-t border-slate-100 pt-12">
                <NationalPolicyArchitecture />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                    <Zap className="text-indigo-600" /> Arquitectura Real de Datos (EMT)
                  </h3>
                  <p className="text-slate-500 mt-2">Visualización de la brecha entre reportes territoriales y validación técnica.</p>
                </div>
                <IntegratedArchitectureEMT />
              </div>
            </div>
          )}

          {/* TAB: ANALISIS DE IMPACTO */}
          {activeTab === 'impacto' && (
            <div className="space-y-16 animate-in fade-in">
              {/* Riesgo Territorial (Inline) */}
              <div className="space-y-8">
                <div className="border-l-4 border-rose-500 pl-4">
                  <h2 className="text-2xl font-black text-slate-800">{renderEditableText('riesgo', 'title')}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">{renderEditableText('riesgo', 'intro', true)}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Vectores de Exposición</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">Población Expuesta</p>
                      <p className="text-sm text-slate-600 mt-1">{renderEditableText('riesgo', 'poblacion', true)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">Infraestructura</p>
                      <p className="text-sm text-slate-600 mt-1">{renderEditableText('riesgo', 'infraestructura', true)}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 border-b pb-2">Indicadores de Vulnerabilidad</h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">Vulnerabilidad Social</p>
                      <p className="text-sm text-slate-600 mt-1">{renderEditableText('riesgo', 'vulSocial', true)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <p className="text-xs font-bold text-slate-800">Vulnerabilidad Económica</p>
                      <p className="text-sm text-slate-600 mt-1">{renderEditableText('riesgo', 'vulEconomica', true)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-12">
                <DataQualityWeightedRiskModel />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <StatisticalAdjustmentModel />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <FiscalImpactModel />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <UncertaintyAnalysisModel />
              </div>
            </div>
          )}

          {/* TAB: ESTRATEGIA DRF */}
          {activeTab === 'drf' && (
            <div className="space-y-16 animate-in fade-in">
              <div className="space-y-8">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h2 className="text-2xl font-black text-slate-800">{renderEditableText('drf', 'title')}</h2>
                </div>
                <p className="text-slate-600 leading-relaxed">{renderEditableText('drf', 'intro', true)}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'evento', label: '1. Evento' },
                    { key: 'amenaza', label: '2. Amenaza' },
                    { key: 'exposicion', label: '3. Exposición' },
                    { key: 'vulnerabilidad', label: '4. Vulnerabilidad' },
                    { key: 'dano', label: '5. Daño' },
                    { key: 'perdida', label: '6. Pérdida' },
                    { key: 'impactoFiscal', label: '7. Impacto Fiscal' },
                    { key: 'necesidadFinanciamiento', label: '8. Necesidad Financiamiento' }
                  ].map(item => (
                    <div key={item.key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{item.label}</h4>
                      <div className="text-sm text-slate-600">{renderEditableText('drf', item.key, true)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-12">
                <ColdFrontFinancingModel />
              </div>
            </div>
          )}

          {/* TAB: AUDITORIA Y CONTROL */}
          {activeTab === 'auditoria' && (
            <div className="space-y-16 animate-in fade-in">
              <MultiSourceValidationAudit />
              <div className="border-t border-slate-100 pt-12">
                <PermanentControlSystem />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <TotalTraceabilitySystem />
              </div>
              <div className="border-t border-slate-100 pt-12">
                <ValidationMotor />
              </div>
            </div>
          )}

          {/* TAB: CASO DE ESTUDIO */}
          {activeTab === 'casestudy' && (
            <div className="space-y-16 animate-in fade-in">
              <CaseStudySimulation />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
