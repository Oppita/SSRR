import React from 'react';
import { X, Landmark, ArrowRight, Layers, ShieldCheck, Activity, FileText, DollarSign, Map, BarChart3, Target, GitMerge } from 'lucide-react';

interface ModeloNacionalModalProps {
  onClose: () => void;
}

export const ModeloNacionalModal: React.FC<ModeloNacionalModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-emerald-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-2xl">
              <Landmark size={24} className="text-emerald-300" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Modelo Nacional de Cuantificación de Desastres</h3>
              <p className="text-xs text-emerald-300 uppercase tracking-widest font-bold">Arquitectura de Política Pública • Estándar Avanzado</p>
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
        <div className="p-8 overflow-y-auto flex-1 bg-slate-50 print:p-8 text-slate-800 space-y-10">
          
          {/* Intro */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-emerald-500">
            <p className="text-slate-700 leading-relaxed font-medium">
              Este documento establece la arquitectura metodológica definitiva para la cuantificación de desastres en Colombia. Supera los enfoques determinísticos y fragmentados mediante la implementación de cuatro pilares innegociables: <strong>Trazabilidad Causal, Separación de Capas, Modelación de Incertidumbre y Replicabilidad Interterritorial</strong>.
            </p>
          </div>

          {/* 1. Trazabilidad Causal Completa */}
          <section>
            <h3 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
              <GitMerge size={20} className="text-emerald-600" />
              1. Trazabilidad Causal Completa
            </h3>
            <p className="text-sm text-slate-600 mb-4">La cadena de valor de la información no puede tener saltos lógicos. Cada eslabón es prerrequisito matemático del siguiente.</p>
            
            <div className="flex flex-wrap md:flex-nowrap gap-2 items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              {[
                { step: 'Evento', icon: <Activity size={16}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                { step: 'Amenaza', icon: <Target size={16}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
                { step: 'Exposición', icon: <Map size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                { step: 'Vulnerabilidad', icon: <ShieldCheck size={16}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
                { step: 'Daño', icon: <FileText size={16}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                { step: 'Pérdida', icon: <BarChart3 size={16}/>, color: 'text-rose-600', bg: 'bg-rose-50' },
                { step: 'Costo', icon: <DollarSign size={16}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { step: 'Financiamiento', icon: <Landmark size={16}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' }
              ].map((item, idx, arr) => (
                <React.Fragment key={item.step}>
                  <div className="flex flex-col items-center text-center min-w-[80px]">
                    <div className={`w-10 h-10 rounded-full ${item.bg} ${item.color} flex items-center justify-center font-black mb-2 border border-slate-100 shadow-sm`}>
                      {item.icon}
                    </div>
                    <p className="text-[10px] font-bold text-slate-700 uppercase">{item.step}</p>
                  </div>
                  {idx < arr.length - 1 && <ArrowRight className="text-slate-300 shrink-0" size={16} />}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* 2. Separación de Capas */}
          <section>
            <h3 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              2. Separación de Capas (No Mezclar)
            </h3>
            <p className="text-sm text-slate-600 mb-4">Prohibición metodológica de sumar magnitudes de diferente naturaleza. Cada capa tiene su propia unidad de medida y responsable institucional.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-blue-500">
                <h4 className="font-black text-blue-900 mb-1 uppercase text-sm">Capa Física</h4>
                <p className="text-xs font-bold text-blue-600 mb-3">El Daño</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• <strong>Unidad:</strong> Magnitudes físicas (m², km, unidades).</li>
                  <li>• <strong>Ejemplo:</strong> 150 viviendas destruidas, 2 puentes colapsados.</li>
                  <li>• <strong>Fuente:</strong> EDAN, RUD, Imágenes satelitales.</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-amber-500">
                <h4 className="font-black text-amber-900 mb-1 uppercase text-sm">Capa Económica</h4>
                <p className="text-xs font-bold text-amber-600 mb-3">La Pérdida</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• <strong>Unidad:</strong> Valor monetario (COP).</li>
                  <li>• <strong>Ejemplo:</strong> $5.000M en lucro cesante, $10.000M en destrucción de capital.</li>
                  <li>• <strong>Fuente:</strong> Metodología DaLA, DNP.</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-rose-500">
                <h4 className="font-black text-rose-900 mb-1 uppercase text-sm">Capa Fiscal</h4>
                <p className="text-xs font-bold text-rose-600 mb-3">Impacto Finanzas Públicas</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• <strong>Unidad:</strong> Obligación contingente (COP).</li>
                  <li>• <strong>Ejemplo:</strong> $3.000M (excluyendo bienes privados asegurados).</li>
                  <li>• <strong>Fuente:</strong> MinHacienda, MFMP.</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500">
                <h4 className="font-black text-emerald-900 mb-1 uppercase text-sm">Capa Presupuestal</h4>
                <p className="text-xs font-bold text-emerald-600 mb-3">Recursos Ejecutados</p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li>• <strong>Unidad:</strong> CDP, RP, Pagos (COP).</li>
                  <li>• <strong>Ejemplo:</strong> $2.500M girados a contratistas.</li>
                  <li>• <strong>Fuente:</strong> SIIF, SECOP, SIGF-D.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Modelación de Incertidumbre */}
          <section>
            <h3 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-600" />
              3. Modelación de Incertidumbre
            </h3>
            <p className="text-sm text-slate-600 mb-4"><strong>Regla de oro:</strong> Nada puede ser una cifra única. Las estimaciones determinísticas generan descalces fiscales. Todo debe expresarse en rangos, escenarios y probabilidades.</p>
            
            <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-inner">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-400 uppercase">Escenario Optimista</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded">Prob: 20%</span>
                  </div>
                  <p className="text-2xl font-black text-white">$12.500M</p>
                  <p className="text-xs text-slate-400">Recuperación rápida, baja inflación de materiales.</p>
                </div>
                <div className="space-y-2 border-l border-slate-700 pl-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-400 uppercase">Escenario Base (Esperado)</span>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Prob: 60%</span>
                  </div>
                  <p className="text-3xl font-black text-white">$18.200M</p>
                  <p className="text-xs text-slate-400">Condiciones macroeconómicas y logísticas estándar.</p>
                </div>
                <div className="space-y-2 border-l border-slate-700 pl-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-rose-400 uppercase">Escenario Pesimista</span>
                    <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-1 rounded">Prob: 20%</span>
                  </div>
                  <p className="text-2xl font-black text-white">$27.800M</p>
                  <p className="text-xs text-slate-400">Cuellos de botella, sobrecostos logísticos, fallas geológicas secundarias.</p>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-slate-700 flex items-center gap-4">
                <span className="text-sm font-bold text-slate-300">Rango de Incertidumbre Fiscal:</span>
                <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-emerald-500" style={{ width: '20%' }}></div>
                  <div className="h-full bg-blue-500" style={{ width: '60%' }}></div>
                  <div className="h-full bg-rose-500" style={{ width: '20%' }}></div>
                </div>
                <span className="text-sm font-mono text-slate-400">[ $12.5B - $27.8B ]</span>
              </div>
            </div>
          </section>

          {/* 4. Replicabilidad Interterritorial */}
          <section>
            <h3 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
              <Map size={20} className="text-emerald-600" />
              4. Replicabilidad Interterritorial
            </h3>
            <p className="text-sm text-slate-600 mb-4">El modelo matemático es agnóstico al territorio, pero los parámetros (curvas de vulnerabilidad, costos unitarios) se ajustan localmente. El mismo motor de cálculo sirve para cualquier departamento.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">HU</div>
                  <h4 className="font-bold text-slate-800">Huila</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• <strong>Amenaza:</strong> Deslizamientos / Sequía</li>
                  <li>• <strong>Exposición:</strong> Cultivos de café, vías terciarias.</li>
                  <li>• <strong>Factor Costo:</strong> Base (1.0x)</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">LG</div>
                  <h4 className="font-bold text-slate-800">La Guajira</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• <strong>Amenaza:</strong> Sequía extrema / Ciclones</li>
                  <li>• <strong>Exposición:</strong> Comunidades dispersas, déficit hídrico.</li>
                  <li>• <strong>Factor Costo:</strong> Logística compleja (1.4x)</li>
                </ul>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">CH</div>
                  <h4 className="font-bold text-slate-800">Chocó</h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-1">
                  <li>• <strong>Amenaza:</strong> Inundaciones fluviales</li>
                  <li>• <strong>Exposición:</strong> Vivienda palafítica, transporte fluvial.</li>
                  <li>• <strong>Factor Costo:</strong> Acceso restringido (1.6x)</li>
                </ul>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
