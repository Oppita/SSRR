import React, { useState, useMemo } from 'react';
import { Calculator, Info, Target, ShieldCheck, AlertTriangle, CheckCircle2, ArrowRight, Activity, Scale, TrendingUp, BookOpen, Layers, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface CTQVariable {
  code: string;
  name: string;
  type: string;
  impact: number;
  criticality: number;
  weight: number;
  reported: number;
  validated: number;
}

export const ICRMathematicalDesign: React.FC = () => {
  const [ctqs, setCtqs] = useState<CTQVariable[]>([
    { code: 'VIV', name: 'Viviendas afectadas', type: 'Física', impact: 0.9, criticality: 0.8, weight: 0, reported: 120, validated: 100 },
    { code: 'PER', name: 'Personas afectadas', type: 'Social', impact: 1.0, criticality: 1.0, weight: 0, reported: 550, validated: 500 },
    { code: 'HEC', name: 'Hectáreas afectadas', type: 'Territorial', impact: 0.7, criticality: 0.6, weight: 0, reported: 45, validated: 40 },
    { code: 'INF', name: 'Infraestructura dañada', type: 'Económica', impact: 0.8, criticality: 0.9, weight: 0, reported: 12, validated: 10 },
    { code: 'SER', name: 'Servicios afectados', type: 'Funcional', impact: 0.6, criticality: 0.7, weight: 0, reported: 5, validated: 4 },
  ]);

  const [uncertaintyParams, setUncertaintyParams] = useState({
    alpha: 0.4,
    beta: 0.3,
    gamma: 0.3,
    sigmaHist: 0.15,
    varEvent: 0.10,
    freqError: 0.20
  });

  const calculation = useMemo(() => {
    const epsilon = 0.01;
    
    // 1. Calculate Non-Arbitrary Weights
    // w_i = (Impacto_i * Criticidad_i) / Σ(Impacto * Criticidad)
    const totalImpCrit = ctqs.reduce((acc, v) => acc + (v.impact * v.criticality), 0);
    const ctqsWithWeights = ctqs.map(v => ({
      ...v,
      weight: (v.impact * v.criticality) / totalImpCrit
    }));

    // 2. Calculate Relative Error (E_i)
    const variablesWithErrors = ctqsWithWeights.map(v => {
      const error = Math.abs(v.reported - v.validated) / (v.validated + epsilon);
      return { ...v, error };
    });

    // 3. Calculate WED (Weighted Error Deviation)
    const wed = variablesWithErrors.reduce((acc, v) => acc + (v.weight * v.error), 0);
    
    // 4. Calculate Base ICR
    const icrBase = Math.max(0, 1 - wed);

    // 5. Calculate Municipal Uncertainty (U_m)
    // U_m = α(σ_histórica) + β(variabilidad_evento) + γ(frecuencia_errores)
    const um = (uncertaintyParams.alpha * uncertaintyParams.sigmaHist) + 
               (uncertaintyParams.beta * uncertaintyParams.varEvent) + 
               (uncertaintyParams.gamma * uncertaintyParams.freqError);

    // 6. Calculate Adjusted ICR
    const icrAdjusted = icrBase * (1 - um);

    // 7. Sigma Level Approximation
    // 0.99 -> 6, 0.93 -> 5, 0.84 -> 4, 0.69 -> 3
    let sigmaLevel = 0;
    if (icrAdjusted >= 0.99) sigmaLevel = 6;
    else if (icrAdjusted >= 0.93) sigmaLevel = 5 + (icrAdjusted - 0.93) / (0.99 - 0.93);
    else if (icrAdjusted >= 0.84) sigmaLevel = 4 + (icrAdjusted - 0.84) / (0.93 - 0.84);
    else if (icrAdjusted >= 0.69) sigmaLevel = 3 + (icrAdjusted - 0.69) / (0.84 - 0.69);
    else sigmaLevel = (icrAdjusted / 0.69) * 3;

    // 8. DPMO Calculation
    // defect = inconsistency detected (error > 5%)
    const defects = variablesWithErrors.filter(v => v.error > 0.05).length;
    const opportunities = ctqs.length;
    const dpmo = (defects / opportunities) * 1000000;

    let status = '';
    let color = '';
    if (icrAdjusted >= 0.9) { status = 'Alta confiabilidad'; color = 'emerald'; }
    else if (icrAdjusted >= 0.7) { status = 'Confiable con ajustes'; color = 'indigo'; }
    else if (icrAdjusted >= 0.5) { status = 'Baja confiabilidad'; color = 'amber'; }
    else { status = 'No confiable'; color = 'rose'; }

    return { 
      wed, 
      icrBase, 
      icrAdjusted, 
      um, 
      sigmaLevel, 
      dpmo, 
      status, 
      color, 
      variablesWithErrors 
    };
  }, [ctqs, uncertaintyParams]);

  const barData = useMemo(() => {
    return calculation.variablesWithErrors.map(v => ({
      name: v.code,
      error: v.error * 100,
      impact: v.error * v.weight * 100
    }));
  }, [calculation]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Formal Definition Header */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <BookOpen size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Target size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-300">Diseño Matemático del ICR — Parte 1</span>
          </div>
          
          <h2 className="text-4xl font-black mb-6 leading-tight">
            Definición Formal del Índice de Coherencia
          </h2>
          
          <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-md inline-block">
            <p className="text-3xl font-mono font-black text-indigo-400">
              ICR<sub>m,e</sub> = 1 - WED<sub>m,e</sub>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Nomenclatura</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-3"><span className="font-black text-indigo-400">ICR<sub>m,e</sub></span> <span className="text-slate-400">Índice de coherencia del municipio <span className="italic">m</span> en el evento <span className="italic">e</span></span></li>
                <li className="flex gap-3"><span className="font-black text-rose-400">WED<sub>m,e</sub></span> <span className="text-slate-400">Error ponderado total (Weighted Error Deviation)</span></li>
              </ul>
            </div>
            <div className="bg-indigo-600/20 p-6 rounded-2xl border border-indigo-500/30">
              <p className="text-xs italic text-indigo-200 leading-relaxed">
                "El ICR es una medida de proximidad a la verdad técnica. Representa el complemento del error ponderado detectado por el sistema de auditoría continua."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* WED Decomposition & Simulation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CTQ Variables & Relative Error */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <Calculator size={20} className="text-indigo-600" /> Variables Críticas (CTQs)
          </h3>
          
          <div className="space-y-6">
            {ctqs.map((v, i) => (
              <div key={v.code} className="space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase">{v.name} ({v.code})</p>
                    <div className="flex gap-2">
                      <p className="text-[9px] font-bold text-indigo-500 uppercase">{v.type}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Imp: {v.impact} | Crit: {v.criticality}</p>
                    </div>
                  </div>
                  <span className="text-xs font-black text-slate-700">Peso: {v.weight.toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Reportado</p>
                    <input 
                      type="number" 
                      value={v.reported}
                      onChange={(e) => {
                        const newCtqs = [...ctqs];
                        newCtqs[i].reported = parseFloat(e.target.value) || 0;
                        setCtqs(newCtqs);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase">Validado</p>
                    <input 
                      type="number" 
                      value={v.validated}
                      onChange={(e) => {
                        const newCtqs = [...ctqs];
                        newCtqs[i].validated = parseFloat(e.target.value) || 0;
                        setCtqs(newCtqs);
                      }}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg text-xs font-black outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <p className="text-[9px] font-black text-rose-400 uppercase">Error Relativo (E_i)</p>
                  <p className="text-[10px] font-black text-rose-600">{(calculation.variablesWithErrors[i].error * 100).toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>

          {/* Uncertainty Parameters */}
          <div className="mt-8 pt-8 border-t border-slate-100 space-y-6">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <AlertTriangle size={14} className="text-amber-500" /> Incertidumbre Municipal (U_m)
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className="text-slate-400">σ Histórica</span>
                  <span className="text-indigo-600">{(uncertaintyParams.sigmaHist * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01"
                  value={uncertaintyParams.sigmaHist}
                  onChange={(e) => setUncertaintyParams({...uncertaintyParams, sigmaHist: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className="text-slate-400">Variabilidad Evento</span>
                  <span className="text-indigo-600">{(uncertaintyParams.varEvent * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01"
                  value={uncertaintyParams.varEvent}
                  onChange={(e) => setUncertaintyParams({...uncertaintyParams, varEvent: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black uppercase">
                  <span className="text-slate-400">Frecuencia Errores</span>
                  <span className="text-indigo-600">{(uncertaintyParams.freqError * 100).toFixed(0)}%</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01"
                  value={uncertaintyParams.freqError}
                  onChange={(e) => setUncertaintyParams({...uncertaintyParams, freqError: parseFloat(e.target.value)})}
                  className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Visual Result */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <Activity className="text-indigo-600" /> Análisis de Error Ponderado (WED)
            </h3>
            <div className={`px-4 py-1 bg-${calculation.color}-100 text-${calculation.color}-700 rounded-full text-[10px] font-black uppercase border border-${calculation.color}-200`}>
              {calculation.status}
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                  />
                  <Bar dataKey="error" name="Error Relativo %" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="impact" name="Impacto en WED %" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full md:w-80 space-y-6">
              <div className="p-6 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <Zap size={40} className="text-indigo-400" />
                </div>
                <p className="text-[10px] font-black text-indigo-300 uppercase mb-1">ICR Ajustado Final</p>
                <p className="text-5xl font-black">{calculation.icrAdjusted.toFixed(3)}</p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full bg-${calculation.color}-500 transition-all duration-500`} style={{ width: `${calculation.icrAdjusted * 100}%` }} />
                  </div>
                  <span className="text-xs font-black">{(calculation.icrAdjusted * 100).toFixed(1)}%</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-300 uppercase">ICR Base (1-WED)</span>
                  <span className="text-xs font-black">{calculation.icrBase.toFixed(3)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Incertidumbre (U_m)</p>
                  <p className="text-xl font-black text-slate-800">{calculation.um.toFixed(3)}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Nivel Sigma</p>
                  <p className={`text-xl font-black text-${calculation.color}-600`}>{calculation.sigmaLevel.toFixed(1)} σ</p>
                </div>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-indigo-400 uppercase">DPMO (Defectos)</p>
                  <p className="text-lg font-black text-indigo-900">{calculation.dpmo.toLocaleString()}</p>
                </div>
                <p className="text-[8px] text-indigo-400 mt-1 italic">Defectos por millón de oportunidades</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interpretation Table */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Scale className="text-indigo-600" /> Escala de Interpretación del ICR
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { range: '0.90 – 1.00', label: 'ALTA CONFIABILIDAD', color: 'emerald', desc: 'Dato validado. Procede a giro express.' },
            { range: '0.70 – 0.89', label: 'CONFIABLE CON AJUSTES', color: 'indigo', desc: 'Dato aceptable. Requiere aplicación de modelos de ajuste.' },
            { range: '0.50 – 0.69', label: 'BAJA CONFIABILIDAD', color: 'amber', desc: 'Alerta técnica. Requiere validación manual en terreno.' },
            { range: '< 0.50', label: 'NO CONFIABLE', color: 'rose', desc: 'Bloqueo automático. El reporte no tiene sustento técnico.' }
          ].map((item, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border-2 ${calculation.icrAdjusted >= parseFloat(item.range.split(' ')[0]) || (item.range.startsWith('<') && calculation.icrAdjusted < 0.5) ? `bg-${item.color}-50 border-${item.color}-500 shadow-lg` : 'bg-slate-50 border-transparent opacity-50'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{item.range}</p>
              <h4 className={`text-lg font-black text-${item.color}-700 mb-2`}>{item.label}</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
