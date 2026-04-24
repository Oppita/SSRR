import React, { useState, useMemo } from 'react';
import { Calculator, TrendingDown, ShieldCheck, AlertCircle, Info, Database, Zap, ArrowRight, Activity, Target, BarChart3, LineChart as LineChartIcon, Globe, Layers } from 'lucide-react';
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';

interface StatisticalParams {
  historicalBias: number; // 1.0 = no bias, >1.0 = over-reporting
  riskLevel: number; // 0 to 1
  eventTypeFactor: number; // Correction based on event complexity
  externalDataCorrelation: number; // How much we trust satellite/sensors
  reportedValue: number;
}

export const StatisticalAdjustmentModel: React.FC = () => {
  const [params, setParams] = useState<StatisticalParams>({
    historicalBias: 1.25, // Over-reports by 25% on average
    riskLevel: 0.8,
    eventTypeFactor: 0.9, // Complex event, harder to measure
    externalDataCorrelation: 0.75, // High trust in satellite data
    reportedValue: 2500
  });

  const adjustment = useMemo(() => {
    const { historicalBias, riskLevel, eventTypeFactor, externalDataCorrelation, reportedValue } = params;

    // 1. Factor de Corrección por Sesgo Histórico (B_h)
    const biasCorrection = 1 / historicalBias;

    // 2. Estimación Externa (Proxy Satelital/Sensores)
    // Simulamos que el dato externo sugiere un valor basado en la intensidad
    const externalProxy = reportedValue * 0.72; 

    // 3. Modelo de Fusión Bayesiana (Ponderación de Varianza)
    // El peso del reporte EDAN disminuye si el sesgo es alto o la correlación externa es alta
    const weightEDAN = (1 - (historicalBias - 1)) * (1 - externalDataCorrelation);
    const weightExternal = externalDataCorrelation;
    const weightRisk = riskLevel * 0.1; // Ajuste fino por vulnerabilidad

    // Normalización de pesos
    const totalWeight = weightEDAN + weightExternal + weightRisk;
    const w1 = weightEDAN / totalWeight;
    const w2 = weightExternal / totalWeight;
    const w3 = weightRisk / totalWeight;

    // Dato Ajustado (Y_adj)
    const adjustedValue = (reportedValue * biasCorrection * w1) + (externalProxy * w2) + (reportedValue * eventTypeFactor * w3);

    // Intervalo de Confianza (95%)
    // La amplitud depende de la correlación externa y el sesgo
    const sigma = (historicalBias - 1) * 0.2 + (1 - externalDataCorrelation) * 0.15;
    const margin = adjustedValue * sigma * 1.96;

    return {
      adjustedValue,
      lowerBound: adjustedValue - margin,
      upperBound: adjustedValue + margin,
      totalCorrection: ((adjustedValue - reportedValue) / reportedValue) * 100,
      confidenceScore: externalDataCorrelation * 100,
      biasImpact: (1 - biasCorrection) * 100
    };
  }, [params]);

  const chartData = [
    {
      name: 'Reporte Inicial',
      valor: params.reportedValue,
      tipo: 'Crudo',
      color: '#94a3b8'
    },
    {
      name: 'Dato Ajustado',
      valor: adjustment.adjustedValue,
      min: adjustment.lowerBound,
      max: adjustment.upperBound,
      tipo: 'Estadístico',
      color: '#6366f1'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Calculator size={200} />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Target size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-600">Modelo de Ajuste Estadístico de Datos EDAN</span>
          </div>
          
          <h2 className="text-4xl font-black text-slate-900 mb-4">
            Fusión de Datos y Corrección de Sesgo
          </h2>
          <p className="text-slate-500 max-w-2xl text-lg leading-relaxed">
            Implementación de un modelo de inferencia para reducir la variabilidad del reporte territorial. 
            Cruza el sesgo histórico municipal con proxies externos (satelitales) para producir un dato de alta fidelidad.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-10">
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Sesgo Histórico (B_h)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="1" max="2" step="0.05" 
                  value={params.historicalBias}
                  onChange={(e) => setParams({...params, historicalBias: parseFloat(e.target.value)})}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-sm font-black text-slate-700">{params.historicalBias}x</span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Confianza Externa (ρ)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="0" max="1" step="0.05" 
                  value={params.externalDataCorrelation}
                  onChange={(e) => setParams({...params, externalDataCorrelation: parseFloat(e.target.value)})}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <span className="text-sm font-black text-slate-700">{(params.externalDataCorrelation * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Factor de Evento (C_e)</p>
              <div className="flex items-center gap-4">
                <input 
                  type="range" min="0.5" max="1.5" step="0.05" 
                  value={params.eventTypeFactor}
                  onChange={(e) => setParams({...params, eventTypeFactor: parseFloat(e.target.value)})}
                  className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
                <span className="text-sm font-black text-slate-700">{params.eventTypeFactor}</span>
              </div>
            </div>
            <div className="p-6 bg-indigo-600 rounded-3xl text-white shadow-lg shadow-indigo-100">
              <p className="text-[10px] font-black text-indigo-200 uppercase mb-2">Reporte Inicial</p>
              <input 
                type="number" 
                value={params.reportedValue}
                onChange={(e) => setParams({...params, reportedValue: parseInt(e.target.value) || 0})}
                className="bg-transparent text-2xl font-black w-full outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Adjustment Visualization */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-3 uppercase tracking-tight">
              <BarChart3 className="text-indigo-600" /> Comparativa de Ajuste y Confianza
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-indigo-600 rounded-full" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Intervalo de Confianza 95%</span>
            </div>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="valor" barSize={80} radius={[15, 15, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
                <Line 
                  type="monotone" 
                  dataKey="max" 
                  stroke="#4f46e5" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  activeDot={false}
                />
                <Line 
                  type="monotone" 
                  dataKey="min" 
                  stroke="#4f46e5" 
                  strokeWidth={2} 
                  strokeDasharray="5 5" 
                  dot={false}
                  activeDot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-indigo-600">
                <Zap size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Corrección Aplicada</p>
                <p className="text-2xl font-black text-slate-800">{adjustment.totalCorrection.toFixed(1)}%</p>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-emerald-500">
                <ShieldCheck size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Score de Confiabilidad</p>
                <p className="text-2xl font-black text-slate-800">{adjustment.confidenceScore.toFixed(0)}/100</p>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200" />
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-rose-500">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase">Impacto de Sesgo</p>
                <p className="text-2xl font-black text-slate-800">-{adjustment.biasImpact.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Statistical Insights */}
        <div className="space-y-8">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Globe size={40} />
            </div>
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Layers size={20} className="text-indigo-400" /> Inferencia de Capas
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-indigo-300 uppercase">Capa Territorial (EDAN)</span>
                  <span className="text-xs font-bold">Peso: {((1 - params.externalDataCorrelation) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${(1 - params.externalDataCorrelation) * 100}%` }} />
                </div>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-emerald-400 uppercase">Capa Observada (Proxy)</span>
                  <span className="text-xs font-bold">Peso: {(params.externalDataCorrelation * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${params.externalDataCorrelation * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-[11px] text-slate-400 italic leading-relaxed">
                "El modelo reduce el peso del reporte municipal a medida que la correlación con sensores remotos aumenta, mitigando el riesgo moral de sobre-estimación."
              </p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <AlertCircle size={20} className="text-amber-500" /> Diagnóstico de Varianza
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
                <p className="text-xs font-bold text-slate-700">Divergencia Detectada: {Math.abs(adjustment.totalCorrection).toFixed(1)}%</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-bold text-slate-700">Consistencia Externa: Óptima</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-slate-300" />
                <p className="text-xs font-bold text-slate-700">Riesgo de Sub-estimación: Bajo</p>
              </div>
            </div>
            <button className="w-full mt-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
              Exportar Informe Técnico <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Methodology Footer */}
      <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
            <Info size={20} />
          </div>
          <div>
            <h4 className="text-sm font-black text-indigo-900 uppercase mb-2">Nota Metodológica: Inferencia Bayesiana</h4>
            <p className="text-xs text-indigo-700 leading-relaxed">
              Este ajuste no es una simple resta. Es un proceso de **fusión de información** donde el reporte EDAN actúa como un *prior* subjetivo que es actualizado por la evidencia objetiva (sensores). El intervalo de confianza representa la región de máxima verosimilitud donde se encuentra el daño real, permitiendo al MinHacienda provisionar recursos con base en el límite superior del intervalo para garantizar cobertura, pero auditando con base en la media ajustada.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
