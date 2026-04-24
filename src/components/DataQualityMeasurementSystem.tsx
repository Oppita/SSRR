import React, { useState, useMemo } from 'react';
import { ShieldCheck, AlertCircle, BarChart3, Calculator, Info, Target, Zap, Settings, Sliders, CheckCircle2, RefreshCw, Database, Filter, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

interface DataQualityMetric {
  municipio: string;
  registros: number;
  defectos: number;
  oportunidades: number;
  dpmo: number;
  icr: number;
  sigma: number;
}

const MOCK_QUALITY_DATA: DataQualityMetric[] = [
  { municipio: 'Neiva', registros: 450, defectos: 120, oportunidades: 5, dpmo: 53333, icr: 73.3, sigma: 3.1 },
  { municipio: 'Pitalito', registros: 280, defectos: 15, oportunidades: 5, dpmo: 10714, icr: 94.6, sigma: 3.8 },
  { municipio: 'Garzón', registros: 190, defectos: 85, oportunidades: 5, dpmo: 89473, icr: 55.2, sigma: 2.8 },
  { municipio: 'La Plata', registros: 310, defectos: 140, oportunidades: 5, dpmo: 90322, icr: 54.8, sigma: 2.8 },
  { municipio: 'Campoalegre', registros: 120, defectos: 8, oportunidades: 5, dpmo: 13333, icr: 93.3, sigma: 3.7 },
];

export const DataQualityMeasurementSystem: React.FC<{ municipioName?: string }> = ({ municipioName }) => {
  // Prioritization Criteria State
  const [weights, setWeights] = useState({
    riskLevel: 40,
    socialImpact: 35,
    investmentViability: 25
  });

  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

  const totalStats = useMemo(() => {
    const totalReg = MOCK_QUALITY_DATA.reduce((s, d) => s + d.registros, 0);
    const totalDef = MOCK_QUALITY_DATA.reduce((s, d) => s + d.defectos, 0);
    const avgIcr = MOCK_QUALITY_DATA.reduce((s, d) => s + d.icr, 0) / MOCK_QUALITY_DATA.length;
    return { totalReg, totalDef, avgIcr };
  }, []);

  const handleWeightChange = (key: keyof typeof weights, value: number) => {
    setWeights(prev => {
      const newWeights = { ...prev, [key]: value };
      const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
      // Simple normalization to keep sum at 100
      if (sum === 0) return prev;
      return newWeights;
    });
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header: Data Quality Engineering */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Database size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <ShieldCheck size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-300">Data Quality Engineering Framework</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Sistema de Medición de Calidad del Dato EDAN {municipioName ? `- ${municipioName}` : ''}
          </h2>
          <p className="text-slate-400 max-w-3xl font-medium text-lg">
            Cuantificación de defectos, cálculo de DPMO y construcción del Índice de Coherencia de Reportes (ICR) para la priorización técnica de proyectos {municipioName ? `en ${municipioName}` : ''}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Prioritization Configuration */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Settings size={20} className="text-indigo-600" /> Configuración de Priorización
            </h3>
            <div className="space-y-6">
              {[
                { key: 'riskLevel', label: 'Nivel de Riesgo', color: 'accent-rose-500' },
                { key: 'socialImpact', label: 'Impacto Social', color: 'accent-indigo-500' },
                { key: 'investmentViability', label: 'Viabilidad de Inversión', color: 'accent-emerald-500' }
              ].map((item) => (
                <div key={item.key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-400 uppercase">{item.label}</label>
                    <span className="text-xs font-black text-slate-900">{weights[item.key as keyof typeof weights]}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" max="100" 
                    value={weights[item.key as keyof typeof weights]}
                    onChange={(e) => handleWeightChange(item.key as keyof typeof weights, parseInt(e.target.value))}
                    className={`w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer ${item.color}`}
                  />
                </div>
              ))}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Suma Total</span>
                  <span className={`text-xs font-black ${Object.values(weights).reduce((a, b) => a + b, 0) === 100 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Object.values(weights).reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
                <p className="text-[9px] text-slate-500 italic">La ponderación debe sumar 100% para una priorización válida.</p>
              </div>
            </div>
          </div>

          {/* 2. Quality Metrics Definitions */}
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Calculator size={20} className="text-indigo-300" /> Métricas de Ingeniería
            </h3>
            <div className="space-y-6">
              <div className="border-b border-white/10 pb-4">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase mb-1">Unidad de Defecto</h4>
                <p className="text-xs opacity-80 leading-relaxed">Registro EDAN inconsistente (Falta de ID RUNAPE, sobreestimación {'>'} 20%, o nexo causal nulo).</p>
              </div>
              <div className="border-b border-white/10 pb-4">
                <h4 className="text-[10px] font-black text-indigo-300 uppercase mb-1">Oportunidades de Error (5)</h4>
                <ul className="text-[10px] opacity-70 grid grid-cols-2 gap-1 mt-2">
                  <li>• ID Activo</li>
                  <li>• Geocodificación</li>
                  <li>• Magnitud Física</li>
                  <li>• Nexo Causal</li>
                  <li>• Evidencia</li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-black text-indigo-300 uppercase mb-1">Cálculo DPMO</h4>
                <code className="text-[10px] block bg-black/20 p-2 rounded-lg font-mono">
                  (Defectos / (Registros * 5)) * 1,000,000
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Data Quality Dashboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <BarChart3 size={20} className="text-indigo-600" /> Índice de Coherencia de Reportes (ICR)
              </h3>
              <div className="flex gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">ICR Global</p>
                  <p className="text-xl font-black text-indigo-600">{totalStats.avgIcr.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={MOCK_QUALITY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="municipio" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="icr" name="Índice de Coherencia (%)" fill="#4f46e5" radius={[8, 8, 0, 0]} barSize={40}>
                    {MOCK_QUALITY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.icr < 60 ? '#f43f5e' : entry.icr < 85 ? '#fbbf24' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <RefreshCw size={14} className="text-indigo-500" /> Métodos de Validación
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Muestreo Aleatorio Simple', desc: 'Validación del 10% de registros para municipios con ICR > 90%.', icon: <CheckCircle2 className="text-emerald-500" /> },
                  { label: 'Muestreo Estratificado', desc: 'Validación del 100% de registros críticos en zonas de alto EMT.', icon: <AlertCircle className="text-rose-500" /> },
                  { label: 'Validación Cruzada', desc: 'Cruce automático con imágenes satelitales y sensores remotos.', icon: <Zap className="text-amber-500" /> }
                ].map((m, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="mt-0.5">{m.icon}</div>
                    <div>
                      <p className="text-[10px] font-black text-slate-800 uppercase">{m.label}</p>
                      <p className="text-[10px] text-slate-500 leading-tight">{m.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">DPMO por Municipio</h4>
              <div className="space-y-4">
                {[...MOCK_QUALITY_DATA].sort((a, b) => b.dpmo - a.dpmo).map((d) => (
                  <div key={d.municipio} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="uppercase">{d.municipio}</span>
                      <span className={d.dpmo > 50000 ? 'text-rose-400' : 'text-emerald-400'}>{d.dpmo.toLocaleString()} DPMO</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${d.dpmo > 50000 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, (d.dpmo / 100000) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
