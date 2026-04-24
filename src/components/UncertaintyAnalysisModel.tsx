import React, { useState, useMemo } from 'react';
import { HelpCircle, AlertTriangle, TrendingUp, BarChart3, Calculator, Info, ShieldCheck, GitBranch, RefreshCw, Layers, Target, FileText } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Line, ComposedChart } from 'recharts';

export const UncertaintyAnalysisModel: React.FC = () => {
  const [iterations, setIterations] = useState(1000);
  const [confidenceLevel, setConfidenceLevel] = useState(95);
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulation Logic (Monte Carlo Mock)
  const simulationResults = useMemo(() => {
    const results = [];
    const baseValue = 1250; // Millions COP
    const stdDev = 180;
    
    for (let i = 0; i < 50; i++) {
      // Normal distribution approximation
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      const value = baseValue + z0 * stdDev;
      results.push({
        id: i,
        value: Math.round(value),
        probability: Math.exp(-0.5 * Math.pow(z0, 2)) / (Math.sqrt(2 * Math.PI))
      });
    }
    return results.sort((a, b) => a.value - b.value);
  }, [iterations]);

  const stats = useMemo(() => {
    const values = simulationResults.map(r => r.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const p5 = sorted[Math.floor(sorted.length * 0.05)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    return { mean, p5, p95, range: p95 - p5 };
  }, [simulationResults]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => setIsSimulating(false), 800);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <RefreshCw size={120} className={isSimulating ? 'animate-spin' : ''} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm text-indigo-300">Uncertainty Management Framework</span>
          </div>
          <h2 className="text-3xl font-black mb-2">Modelo de Gestión de Incertidumbre</h2>
          <p className="text-slate-400 max-w-2xl font-medium">
            Cuantificación probabilística de daños para mitigar críticas por imprecisión. De cifras estáticas a intervalos de confianza dinámicos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Simulation Controls & Stats */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Calculator size={20} className="text-indigo-600" />
              Parámetros de Simulación
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Iteraciones Monte Carlo</label>
                <select 
                  value={iterations} 
                  onChange={(e) => setIterations(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={1000}>1,000 Iteraciones</option>
                  <option value={5000}>5,000 Iteraciones</option>
                  <option value={10000}>10,000 Iteraciones</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">Nivel de Confianza (α)</label>
                <div className="flex items-center gap-4">
                  <input 
                    type="range" min="80" max="99" value={confidenceLevel} 
                    onChange={(e) => setConfidenceLevel(Number(e.target.value))}
                    className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="font-black text-indigo-600 w-10">{confidenceLevel}%</span>
                </div>
              </div>

              <button 
                onClick={handleRunSimulation}
                disabled={isSimulating}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
              >
                {isSimulating ? <RefreshCw className="animate-spin" size={20} /> : <GitBranch size={20} />}
                EJECUTAR SIMULACIÓN
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Target size={20} className="text-emerald-500" />
              Intervalos de Confianza
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <p className="text-[10px] font-bold text-emerald-600 uppercase">Valor Medio (Esperado)</p>
                <p className="text-2xl font-black text-emerald-900">${stats.mean.toLocaleString()}M</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Límite Inf (P5)</p>
                  <p className="text-lg font-black text-slate-700">${stats.p5.toLocaleString()}M</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Límite Sup (P95)</p>
                  <p className="text-lg font-black text-slate-700">${stats.p95.toLocaleString()}M</p>
                </div>
              </div>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                <Info size={20} className="text-indigo-600 shrink-0" />
                <p className="text-[10px] text-indigo-800 font-medium leading-tight">
                  Existe un <strong>{confidenceLevel}% de probabilidad</strong> de que el daño real se encuentre en este rango, mitigando el riesgo de "cifras imprecisas".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <TrendingUp size={20} className="text-indigo-600" />
                Distribución Probabilística de Daños
              </h3>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monte Carlo</span>
              </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulationResults}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="value" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    labelFormatter={(val) => `$${val}M`}
                  />
                  <Area type="monotone" dataKey="probability" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                  <ReferenceLine x={stats.mean} stroke="#10b981" strokeDasharray="5 5" label={{ position: 'top', value: 'Media', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} />
                  <ReferenceLine x={stats.p5} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'P5', fill: '#f43f5e', fontSize: 10 }} />
                  <ReferenceLine x={stats.p95} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'top', value: 'P95', fill: '#f43f5e', fontSize: 10 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-500" />
                Fuentes de Incertidumbre
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Calidad del EDAN (Territorio)', value: 45, color: 'bg-rose-500' },
                  { label: 'Variabilidad de Precios Unitarios', value: 25, color: 'bg-amber-500' },
                  { label: 'Incertidumbre en Funciones de Daño', value: 20, color: 'bg-indigo-500' },
                  { label: 'Errores de Geocodificación', value: 10, color: 'bg-slate-400' }
                ].map((source, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold text-slate-600">
                      <span>{source.label}</span>
                      <span>{source.value}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`${source.color} h-full transition-all duration-1000`} style={{ width: `${source.value}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50 p-8 rounded-3xl border border-indigo-100">
              <h4 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                <FileText size={14} />
                Protocolo de Reporte
              </h4>
              <ul className="space-y-3">
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0">1</div>
                  <p className="text-[11px] text-indigo-900 leading-tight"><strong>Evitar el "Número Único":</strong> Reportar siempre como <em>"$1,250M [IC95%: $1,070M - $1,430M]"</em>.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0">2</div>
                  <p className="text-[11px] text-indigo-900 leading-tight"><strong>Declarar Supuestos:</strong> Explicitar qué funciones de daño y qué fuentes de precios se utilizaron.</p>
                </li>
                <li className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex items-center justify-center text-[10px] font-black text-indigo-700 shrink-0">3</div>
                  <p className="text-[11px] text-indigo-900 leading-tight"><strong>Análisis de Sensibilidad:</strong> Identificar qué variable (ej. costo de cemento) impacta más el resultado final.</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
