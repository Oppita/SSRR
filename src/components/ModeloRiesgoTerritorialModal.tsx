import React from 'react';
import { X, Map, Users, Home, TrendingDown, Calculator, ShieldAlert, Layers, ArrowRight, BarChart2 } from 'lucide-react';

interface ModeloRiesgoTerritorialModalProps {
  onClose: () => void;
}

export const ModeloRiesgoTerritorialModal: React.FC<ModeloRiesgoTerritorialModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-rose-500/20 rounded-2xl">
              <Map size={24} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Análisis de Riesgo Territorial</h3>
              <p className="text-xs text-rose-300 uppercase tracking-widest font-bold">Cuantificación de Exposición y Vulnerabilidad • Frente Frío</p>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-rose-500 flex items-start gap-4">
            <ShieldAlert className="text-rose-500 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Metodología de Cuantificación de Riesgo Territorial</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Este modelo permite cuantificar y comparar el riesgo entre diferentes municipios ante un evento de frente frío. Descompone el riesgo en sus factores fundamentales (Exposición y Vulnerabilidad), normaliza las variables heterogéneas y construye un <strong>Índice de Riesgo Territorial (IRT)</strong> que facilita la priorización en la asignación de recursos.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Tipos de Exposición */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Layers size={20} className="text-rose-600" />
                1. Vectores de Exposición (E)
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Inventario de elementos situados en la huella espacial de la amenaza térmica/eólica.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Users className="text-blue-500 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Población Expuesta (E_pob)</p>
                    <p className="text-[11px] text-slate-600">Densidad poblacional en zonas de altitud crítica (&gt;2500 msnm para heladas) o zonas costeras expuestas a vendavales.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <Home className="text-amber-500 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Infraestructura (E_inf)</p>
                    <p className="text-[11px] text-slate-600">Viviendas con techos ligeros (vulnerables a vientos), km de vías terciarias susceptibles a movimientos en masa por lluvias asociadas.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <TrendingDown className="text-emerald-500 shrink-0" size={18} />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Economía Agropecuaria (E_eco)</p>
                    <p className="text-[11px] text-slate-600">Hectáreas sembradas de cultivos termosensibles (flores, papa, cebolla, pastos lecheros) en la isoterma de la anomalía.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Indicadores de Vulnerabilidad */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <ShieldAlert size={20} className="text-rose-600" />
                2. Indicadores de Vulnerabilidad (V)
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Propensión intrínseca de los elementos expuestos a sufrir daños, independiente de la severidad del frente frío.
              </p>
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-1">Vulnerabilidad Social (V_soc)</p>
                  <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                    <li>% de población con Necesidades Básicas Insatisfechas (NBI).</li>
                    <li>Tasa de dependencia demográfica (niños &lt;5 y adultos &gt;65 años, más susceptibles a hipotermia/IRAs).</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-1">Vulnerabilidad Física (V_fis)</p>
                  <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                    <li>% de viviendas con déficit cualitativo (materiales precarios en paredes/techos sin aislamiento térmico).</li>
                  </ul>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-800 mb-1">Vulnerabilidad Económica (V_eco)</p>
                  <ul className="text-[11px] text-slate-600 space-y-1 pl-4 list-disc">
                    <li>Dependencia del PIB municipal respecto al sector agropecuario.</li>
                    <li>% de informalidad laboral rural (falta de redes de seguridad financiera).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3 & 4. Normalización e Índices Compuestos */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Calculator size={20} className="text-rose-600" />
                3 & 4. Normalización e Índices Compuestos
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Para sumar "peras con manzanas" (ej. hectáreas con tasas demográficas), todas las variables se normalizan en una escala de [0, 1] mediante escalamiento Min-Max.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Fórmula de Normalización (Min-Max)</p>
                  <div className="bg-slate-900 text-rose-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    X_norm = (X_obs - X_min) / (X_max - X_min)
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 text-center">* Si la variable reduce el riesgo (ej. capacidad hospitalaria), se invierte: (X_max - X_obs) / (X_max - X_min)</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Índice Compuesto de Vulnerabilidad (ICV)</p>
                  <div className="bg-slate-900 text-rose-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    ICV = w₁·V_soc + w₂·V_fis + w₃·V_eco
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 text-center">Donde Σw_i = 1. Los pesos (w) se definen por Análisis de Componentes Principales (PCA) o criterio experto.</p>
                </div>
              </div>
            </div>

            {/* 5. Modelo Cuantitativo de Riesgo */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <BarChart2 size={20} className="text-rose-600" />
                5. Integración: Índice de Riesgo Territorial (IRT)
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                El riesgo es el producto convolucional de la Amenaza (A), la Exposición (E) y la Vulnerabilidad (V). Este índice permite rankear los municipios.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-inner">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2 text-center">Ecuación Fundamental del Riesgo</p>
                  <div className="text-white font-mono text-lg p-3 text-center flex items-center justify-center gap-3">
                    <span>IRT_k</span>
                    <span className="text-rose-500">=</span>
                    <span className="text-cyan-400" title="Amenaza">A_k</span>
                    <span className="text-slate-500">×</span>
                    <span className="text-amber-400" title="Exposición">E_k</span>
                    <span className="text-slate-500">×</span>
                    <span className="text-rose-400" title="Vulnerabilidad">V_k</span>
                  </div>
                  <p className="mt-3 text-[10px] text-slate-400 text-center">Para el municipio 'k'. Todos los factores normalizados [0, 1].</p>
                </div>

                <div className="mt-4">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="py-2 font-bold text-slate-700">Rango IRT</th>
                        <th className="py-2 font-bold text-slate-700">Nivel de Riesgo</th>
                        <th className="py-2 font-bold text-slate-700">Prioridad Fiscal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2 font-mono text-slate-600">0.00 - 0.25</td>
                        <td className="py-2 font-medium text-slate-600">Bajo</td>
                        <td className="py-2 text-slate-500">Monitoreo ordinario.</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-amber-600">0.26 - 0.60</td>
                        <td className="py-2 font-medium text-amber-600">Medio</td>
                        <td className="py-2 text-slate-500">Cofinanciación preventiva.</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-orange-600">0.61 - 0.80</td>
                        <td className="py-2 font-medium text-orange-600">Alto</td>
                        <td className="py-2 text-slate-500">Asignación prioritaria.</td>
                      </tr>
                      <tr className="bg-rose-50">
                        <td className="py-2 font-mono text-rose-600 font-bold">0.81 - 1.00</td>
                        <td className="py-2 font-bold text-rose-700">Extremo</td>
                        <td className="py-2 text-rose-700 font-medium">Giro inmediato (Fondo Contingencias).</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
