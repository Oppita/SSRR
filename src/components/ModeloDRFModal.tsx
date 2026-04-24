import React from 'react';
import { X, Globe, ArrowRight, Activity, Target, Map, ShieldCheck, FileText, BarChart3, Landmark, DollarSign, Calculator } from 'lucide-react';

interface ModeloDRFModalProps {
  onClose: () => void;
}

export const ModeloDRFModal: React.FC<ModeloDRFModalProps> = ({ onClose }) => {
  const chain = [
    {
      step: '1. Evento',
      icon: <Activity size={24} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      def: 'Fenómeno hidrometeorológico de origen polar que genera un descenso térmico abrupto y alteraciones atmosféricas sistémicas.',
      vars: 'Duración (horas), Extensión territorial (km²).',
      methods: 'Monitoreo satelital, teledetección.',
      sources: 'IDEAM, NOAA.',
      math: 'Evento × Condiciones Atmosféricas Locales = Amenaza (A)'
    },
    {
      step: '2. Amenaza',
      icon: <Target size={24} className="text-blue-600" />,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      def: 'Probabilidad de ocurrencia de heladas, vientos fuertes o lluvias intensas derivadas del frente frío que superan umbrales críticos.',
      vars: 'Anomalía térmica negativa (°C), Velocidad del viento (km/h), Precipitación acumulada (mm).',
      methods: 'Modelación probabilística, curvas de excedencia.',
      sources: 'IDEAM (Alertas y Boletines).',
      math: 'A × Elementos en el territorio = Exposición (Exp)'
    },
    {
      step: '3. Exposición',
      icon: <Map size={24} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      def: 'Inventario de población, infraestructura y medios de vida (ej. cultivos, ganado) ubicados en la zona de influencia de la amenaza.',
      vars: 'Hectáreas de cultivos sensibles (ej. flores, papa), Número de viviendas precarias, Población vulnerable.',
      methods: 'Sistemas de Información Geográfica (SIG), superposición de capas espaciales.',
      sources: 'IGAC, DANE, MinAgricultura (EVA).',
      math: 'Exp × Susceptibilidad intrínseca = Vulnerabilidad (V)'
    },
    {
      step: '4. Vulnerabilidad',
      icon: <ShieldCheck size={24} className="text-amber-600" />,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      def: 'Propensión de los elementos expuestos a sufrir efectos adversos debido a su fragilidad física, económica o social frente al frío extremo.',
      vars: 'Índice de fragilidad de cultivos (0 a 1), Calidad constructiva de viviendas, Nivel de pobreza multidimensional.',
      methods: 'Funciones de daño, curvas de vulnerabilidad empíricas o analíticas.',
      sources: 'DNP (Sisbén), Estudios sectoriales, Gremios agrícolas.',
      math: 'Exp × V × A = Daño Físico (D)'
    },
    {
      step: '5. Daño',
      icon: <FileText size={24} className="text-rose-600" />,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      def: 'Destrucción total o parcial de activos físicos en el momento exacto del evento (impacto directo).',
      vars: 'Hectáreas de cultivos destruidas, Viviendas con techos colapsados, Infraestructura afectada.',
      methods: 'Evaluación de Daños y Análisis de Necesidades (EDAN), inspección in situ, drones.',
      sources: 'UNGRD, Registro Único de Damnificados (RUD).',
      math: '(D × Costo de Reposición) + Lucro Cesante = Pérdida (P)'
    },
    {
      step: '6. Pérdida',
      icon: <BarChart3 size={24} className="text-rose-600" />,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      def: 'Valoración económica del daño físico y los flujos económicos interrumpidos (lucro cesante) durante el periodo de recuperación.',
      vars: 'Valor monetario de cultivos perdidos (COP), Costo de reconstrucción (COP), Ingresos no percibidos (COP).',
      methods: 'Metodología DaLA (Damage and Loss Assessment).',
      sources: 'DNP, MinHacienda, CEPAL, Banco Mundial.',
      math: 'P - Transferencia de Riesgo (Seguros) - Absorción Privada = Impacto Fiscal (IF)'
    },
    {
      step: '7. Impacto Fiscal',
      icon: <Landmark size={24} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      def: 'Obligación contingente materializada que debe ser asumida por el Estado como pasivo no fondeado.',
      vars: 'Déficit presupuestal generado (COP), Desviación del Marco Fiscal de Mediano Plazo (MFMP).',
      methods: 'Análisis de brecha fiscal, modelación macroeconómica de choques exógenos.',
      sources: 'MinHacienda (Dirección General de Política Macroeconómica).',
      math: 'IF - Reasignaciones Presupuestales Ordinarias = Necesidad de Financiamiento (NF)'
    },
    {
      step: '8. Necesidad de Financiamiento',
      icon: <DollarSign size={24} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      def: 'Brecha de liquidez residual que requiere la activación de instrumentos financieros ex-post (créditos contingentes, bonos catastróficos, cooperación).',
      vars: 'Monto de crédito contingente a desembolsar (COP), Recursos del Fondo Nacional de Gestión de Riesgo (FNGRD).',
      methods: 'Estrategia de Protección Financiera ante Desastres (Disaster Risk Financing Strategy).',
      sources: 'MinHacienda (Crédito Público), Banco Mundial, BID.',
      math: 'NF = Activación de Instrumentos DRF'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-2xl">
              <Globe size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Disaster Risk Financing (DRF) - Banco Mundial</h3>
              <p className="text-xs text-blue-300 uppercase tracking-widest font-bold">Modelo Conceptual de Cuantificación • Frente Frío (Colombia)</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:p-8 text-slate-800 space-y-8">
          
          {/* Intro */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-blue-500 flex items-start gap-4">
            <Globe className="text-blue-500 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Marco de Referencia Internacional</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Este modelo conceptual aplica los estándares de <strong>Disaster Risk Financing (DRF)</strong> del Banco Mundial al contexto colombiano para eventos climáticos tipo <em>Frente Frío</em>. Establece una cadena de valor analítica estricta donde cada eslabón es prerrequisito matemático del siguiente, garantizando que la necesidad de financiamiento final sea una derivación objetiva del evento físico, eliminando la discrecionalidad en la cuantificación fiscal.
              </p>
            </div>
          </div>

          {/* Chain Visualizer */}
          <div className="flex flex-wrap md:flex-nowrap gap-2 items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            {chain.map((item, idx, arr) => (
              <React.Fragment key={item.step}>
                <div className="flex flex-col items-center text-center min-w-[80px]">
                  <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center font-black mb-2 border ${item.border} shadow-sm`}>
                    {item.icon}
                  </div>
                  <p className="text-[10px] font-bold text-slate-700 uppercase">{item.step.split('. ')[1]}</p>
                </div>
                {idx < arr.length - 1 && <ArrowRight className="text-slate-300 shrink-0" size={16} />}
              </React.Fragment>
            ))}
          </div>

          {/* Detailed Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {chain.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className={`${item.bg} border-b ${item.border} p-4 flex items-center gap-3`}>
                  <div className="bg-white p-2 rounded-xl shadow-sm">
                    {item.icon}
                  </div>
                  <h4 className="font-black text-slate-800 text-lg">{item.step}</h4>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-4">
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">1. Definición Técnica</h5>
                    <p className="text-sm text-slate-700">{item.def}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">2. Variables</h5>
                      <p className="text-sm text-slate-700 font-medium">{item.vars}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">3. Métodos</h5>
                      <p className="text-sm text-slate-700">{item.methods}</p>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">4. Fuentes de Información</h5>
                    <p className="text-sm text-slate-700">{item.sources}</p>
                  </div>
                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Calculator size={14} />
                      5. Relación Matemática
                    </h5>
                    <div className="bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-xl overflow-x-auto">
                      {item.math}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
