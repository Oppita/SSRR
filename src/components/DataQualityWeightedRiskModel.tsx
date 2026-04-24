import React, { useState, useMemo } from 'react';
import { ShieldCheck, AlertTriangle, BarChart3, Calculator, Info, Target, Zap, Settings, Sliders, CheckCircle2, RefreshCw, Database, Filter, ArrowRight, Activity, Scale, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';

interface ModelParams {
  icr: number; // 0 to 1
  edanDamage: number;
  modelDamage: number;
  alpha: number; // Penalty factor for resource allocation
}

export const DataQualityWeightedRiskModel: React.FC = () => {
  const [params, setParams] = useState<ModelParams>({
    icr: 0.65,
    edanDamage: 1200,
    modelDamage: 850,
    alpha: 1.5
  });

  const results = useMemo(() => {
    const { icr, edanDamage, modelDamage, alpha } = params;
    
    // 1. Cálculo de Daños Ponderado (Bayesiano Simple)
    // Damage_Final = (Dato_EDAN * ICR) + (Dato_Parametrico * (1 - ICR))
    const weightedDamage = (edanDamage * icr) + (modelDamage * (1 - icr));
    
    // 2. Estimación de Pérdidas (Asumiendo factor de costo unitario)
    const unitCost = 1500000; // COP per unit
    const rawLoss = edanDamage * unitCost;
    const weightedLoss = weightedDamage * unitCost;
    
    // 3. Asignación de Recursos (Penalización por baja calidad)
    // Resource_Alloc = Base_Resource * (ICR^alpha)
    const baseResource = weightedLoss * 0.8; // 80% coverage base
    const resourceAllocation = baseResource * Math.pow(icr, alpha);
    
    // 4. Nivel de Incertidumbre
    const uncertainty = (1 - icr) * 100;
    
    return {
      weightedDamage,
      rawLoss,
      weightedLoss,
      resourceAllocation,
      uncertainty,
      gap: Math.abs(edanDamage - modelDamage) / modelDamage * 100
    };
  }, [params]);

  const chartData = useMemo(() => {
    return [
      { name: 'Reporte EDAN (Crudo)', valor: params.edanDamage, color: '#f43f5e' },
      { name: 'Modelo Paramétrico', valor: params.modelDamage, color: '#6366f1' },
      { name: 'Dato Validado (ICR)', valor: results.weightedDamage, color: '#10b981' }
    ];
  }, [params, results]);

  const sensitivityData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 10; i++) {
      const currentIcr = i / 10;
      const wDamage = (params.edanDamage * currentIcr) + (params.modelDamage * (1 - currentIcr));
      const rAlloc = (wDamage * 1500000 * 0.8) * Math.pow(currentIcr, params.alpha);
      data.push({
        icr: currentIcr * 100,
        daño: wDamage,
        recursos: rAlloc / 1000000, // In Millions
        incertidumbre: (1 - currentIcr) * 100
      });
    }
    return data;
  }, [params]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header & Logic Explanation */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Scale size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-300">Modelo de Ponderación por Calidad del Dato</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Motor de Ajuste de Riesgo (ICR-Weighted)
          </h2>
          <p className="text-slate-400 max-w-2xl text-lg leading-relaxed">
            Este modelo matemático neutraliza la distorsión de datos territoriales poco confiables. 
            A mayor incertidumbre (bajo ICR), el sistema resta peso al reporte EDAN y prioriza el modelo paramétrico nacional.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-10">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Lógica de Validación</h4>
              <div className="space-y-3 font-mono text-sm">
                <p className="flex justify-between border-b border-white/5 pb-2">
                  <span>Dato Validado:</span>
                  <span className="text-emerald-400">(EDAN × ICR) + (Model × (1-ICR))</span>
                </p>
                <p className="flex justify-between border-b border-white/5 pb-2">
                  <span>Incertidumbre:</span>
                  <span className="text-rose-400">1 - ICR</span>
                </p>
                <p className="flex justify-between">
                  <span>Asignación:</span>
                  <span className="text-amber-400">Base × ICR<sup>α</sup></span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Ajuste de Confianza (ICR)</p>
                <input 
                  type="range" 
                  min="0" max="1" step="0.01"
                  value={params.icr}
                  onChange={(e) => setParams({...params, icr: parseFloat(e.target.value)})}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500">
                  <span>0% (Nulo)</span>
                  <span className="text-indigo-400 text-sm font-black">{(params.icr * 100).toFixed(0)}%</span>
                  <span>100% (Total)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Comparison Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <BarChart3 className="text-indigo-600" /> Impacto en el Cálculo de Daños
            </h3>
            <div className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500">
              UNIDADES DE DAÑO (M²)
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="valor" radius={[10, 10, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-[10px] font-black text-rose-400 uppercase mb-1">Sesgo Territorial</p>
              <p className="text-xl font-black text-rose-700">+{results.gap.toFixed(1)}%</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Dato Corregido</p>
              <p className="text-xl font-black text-emerald-700">{results.weightedDamage.toFixed(0)}</p>
            </div>
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-[10px] font-black text-amber-400 uppercase mb-1">Incertidumbre</p>
              <p className="text-xl font-black text-amber-700">{results.uncertainty.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        {/* Resource Allocation & Uncertainty */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <TrendingUp size={20} className="text-emerald-600" /> Asignación de Recursos
            </h3>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pérdida Estimada (Ponderada)</p>
                <p className="text-3xl font-black text-slate-900">${(results.weightedLoss / 1000000).toFixed(1)}M</p>
              </div>
              
              <div className="p-6 bg-emerald-900 rounded-[2rem] text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-20">
                  <ShieldCheck size={40} />
                </div>
                <p className="text-[10px] font-black text-emerald-300 uppercase mb-1">Recurso Autorizado</p>
                <p className="text-2xl font-black">${(results.resourceAllocation / 1000000).toFixed(1)}M</p>
                <p className="text-[10px] text-emerald-200 mt-4 leading-relaxed italic">
                  *Ajustado por factor de confianza ICR. El recurso se libera proporcionalmente a la calidad del dato.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Factor de Penalidad (α)</span>
                  <span className="text-xs font-black text-indigo-600">{params.alpha}</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="3" step="0.1"
                  value={params.alpha}
                  onChange={(e) => setParams({...params, alpha: parseFloat(e.target.value)})}
                  className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Zap size={20} className="text-indigo-300" /> Análisis de Sensibilidad
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sensitivityData}>
                  <defs>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="recursos" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" />
                  <Tooltip 
                    contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff'}}
                    itemStyle={{color: '#10b981'}}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-[10px] text-indigo-300 mt-4 text-center font-bold uppercase tracking-widest">
              Relación ICR vs Recursos Asignados
            </p>
          </div>
        </div>
      </div>

      {/* Decision Support Matrix */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
          <Settings className="text-indigo-600" /> Matriz de Acción por Nivel de Confianza
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { range: '0% - 30%', label: 'CRÍTICO', action: 'Bloqueo Total', color: 'rose', desc: 'Incertidumbre extrema. No se autorizan giros.' },
            { range: '31% - 60%', label: 'ALERTA', action: 'Validación Manual', color: 'amber', desc: 'Discrepancia alta. Requiere auditoría en terreno.' },
            { range: '61% - 85%', label: 'ACEPTABLE', action: 'Giro Parcial', color: 'indigo', desc: 'Calidad estándar. Se libera el 70% del recurso.' },
            { range: '86% - 100%', label: 'ÓPTIMO', action: 'Giro Express', color: 'emerald', desc: 'Alta confiabilidad. Validación automática.' }
          ].map((item, i) => (
            <div key={i} className={`p-6 rounded-[2rem] border-2 ${params.icr * 100 >= parseInt(item.range.split('%')[0]) && params.icr * 100 <= parseInt(item.range.split('-')[1]) ? `bg-${item.color}-50 border-${item.color}-500 shadow-lg` : 'bg-slate-50 border-transparent opacity-50'}`}>
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{item.range}</p>
              <h4 className={`text-xl font-black text-${item.color}-700 mb-2`}>{item.label}</h4>
              <p className="text-xs font-bold text-slate-800 mb-4">{item.action}</p>
              <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
