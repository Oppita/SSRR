import React from 'react';
import { X, CloudSnow, Wind, ThermometerSnowflake, BarChart, FunctionSquare, ArrowRight, Activity, Database, Sigma } from 'lucide-react';

interface ModeloDinamicoFrenteFrioModalProps {
  onClose: () => void;
}

export const ModeloDinamicoFrenteFrioModal: React.FC<ModeloDinamicoFrenteFrioModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 print:p-0 print:bg-white print:block">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:rounded-none">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0 print:hidden">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/20 rounded-2xl">
              <CloudSnow size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Modelo Dinámico de Frente Frío</h3>
              <p className="text-xs text-cyan-300 uppercase tracking-widest font-bold">Dinámica Atmosférica Tropical • Criterios Determinísticos</p>
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm border-l-4 border-l-cyan-500 flex items-start gap-4">
            <ThermometerSnowflake className="text-cyan-500 shrink-0 mt-1" size={24} />
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Caracterización Objetiva del Sistema Dinámico</h4>
              <p className="text-slate-600 leading-relaxed text-sm">
                Este modelo elimina la subjetividad en la declaratoria de emergencias por frentes fríos (empujes polares modificados que alcanzan el trópico colombiano). Define el evento como un sistema dinámico no lineal, parametrizando su termodinámica, evolución temporal y rareza estadística mediante ecuaciones de estado y probabilidad conjunta.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. Variables Interdependientes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Wind size={20} className="text-cyan-600" />
                1. Variables Interdependientes
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                El frente no es solo "frío", es una perturbación baroclínica. Sus variables están acopladas mediante la ecuación del viento térmico.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ecuación de Viento Térmico (Aproximación)</p>
                  <div className="bg-slate-900 text-cyan-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    V_T = (R / f) · ln(P₀ / P₁) · (∇T × k)
                  </div>
                  <ul className="mt-3 text-xs text-slate-600 space-y-1">
                    <li>• <strong>V_T:</strong> Cizalladura vertical del viento.</li>
                    <li>• <strong>∇T:</strong> Gradiente horizontal de temperatura (Severidad del frente).</li>
                    <li>• <strong>f:</strong> Parámetro de Coriolis (Crítico en latitudes bajas como Colombia).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. Modelación Temporal */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Activity size={20} className="text-cyan-600" />
                2. Modelación Temporal (Ciclo de Vida)
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                La evolución térmica del evento se modela mediante una función Gaussiana invertida, definiendo objetivamente el inicio, pico y disipación.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Función de Descenso Térmico</p>
                  <div className="bg-slate-900 text-cyan-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    T(t) = T_base - ΔT_max · exp( -(t - t_pico)² / 2τ² )
                  </div>
                  <ul className="mt-3 text-xs text-slate-600 space-y-1">
                    <li>• <strong>ΔT_max:</strong> Caída máxima de temperatura (Amplitud).</li>
                    <li>• <strong>τ (Tau):</strong> Constante de disipación (Duración de la anomalía).</li>
                    <li>• <strong>Fases:</strong> Inicio (t = t_pico - 2τ), Disipación (t = t_pico + 2τ).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. Indicadores de Anomalía */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <FunctionSquare size={20} className="text-cyan-600" />
                3. Indicadores de Anomalía Climática
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Para evitar sesgos locales, se estandarizan las variables respecto a su climatología histórica usando el Z-Score.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Índice Compuesto de Severidad (ICS)</p>
                  <div className="bg-slate-900 text-cyan-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    Z_x = (X_obs - μ_x) / σ_x <br/><br/>
                    ICS = w₁·|Z_T| + w₂·Z_V + w₃·Z_P
                  </div>
                  <ul className="mt-3 text-xs text-slate-600 space-y-1">
                    <li>• <strong>Z_T:</strong> Anomalía de Temperatura (Negativa).</li>
                    <li>• <strong>Z_V:</strong> Anomalía de Viento.</li>
                    <li>• <strong>w_i:</strong> Pesos de ponderación regional (Ej. w₁ es mayor en el altiplano cundiboyacense por riesgo de heladas).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Integración Histórica */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Database size={20} className="text-cyan-600" />
                4. Integración con Datos Históricos
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                Se modelan los valores extremos utilizando la Distribución de Gumbel para calcular el Período de Retorno (Tr), justificando la "atipicidad" del evento.
              </p>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Período de Retorno (Tr)</p>
                  <div className="bg-slate-900 text-cyan-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    F(x) = exp( -exp( -(x - μ) / β ) ) <br/><br/>
                    Tr = 1 / (1 - F(x))
                  </div>
                  <ul className="mt-3 text-xs text-slate-600 space-y-1">
                    <li>• <strong>F(x):</strong> Función de distribución acumulada de Gumbel.</li>
                    <li>• <strong>Tr:</strong> Años esperados para que el evento se repita. (Tr &gt; 10 años justifica declaratoria extraordinaria).</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Clasificación Probabilística */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="text-lg font-black uppercase text-slate-800 mb-4 flex items-center gap-2">
                <Sigma size={20} className="text-cyan-600" />
                5. Clasificación Probabilística del Evento
              </h4>
              <p className="text-sm text-slate-600 mb-4">
                La declaratoria final no depende del juicio de un funcionario, sino de la probabilidad conjunta de que las anomalías superen los umbrales críticos simultáneamente (Teorema de Bayes).
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Probabilidad Conjunta de Severidad</p>
                  <div className="bg-slate-900 text-cyan-400 font-mono text-sm p-3 rounded-lg overflow-x-auto text-center">
                    P(Severo | ΔT, V) = [ P(ΔT, V | Severo) · P(Severo) ] / P(ΔT, V)
                  </div>
                  <p className="mt-3 text-xs text-slate-600">
                    Calcula la probabilidad real de que el sistema cause daño sistémico dado el gradiente térmico y la velocidad del viento observada.
                  </p>
                </div>
                
                <div className="flex flex-col justify-center">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-300">
                        <th className="py-2 font-bold text-slate-700">P(Severo)</th>
                        <th className="py-2 font-bold text-slate-700">Clasificación</th>
                        <th className="py-2 font-bold text-slate-700">Acción Fiscal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="py-2 font-mono text-emerald-600">&lt; 0.40</td>
                        <td className="py-2 font-medium">Ordinario</td>
                        <td className="py-2 text-slate-500">Atención con presupuesto local.</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-amber-600">0.40 - 0.75</td>
                        <td className="py-2 font-medium">Anómalo</td>
                        <td className="py-2 text-slate-500">Cofinanciación subsidiaria (UNGRD).</td>
                      </tr>
                      <tr className="bg-rose-50">
                        <td className="py-2 font-mono text-rose-600 font-bold">&gt; 0.75</td>
                        <td className="py-2 font-bold text-rose-700">Extremo</td>
                        <td className="py-2 text-rose-700 font-medium">Activación Fondo de Contingencias.</td>
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
