import React, { useState, useMemo } from 'react';
import { Database, Search, ShieldCheck, Activity, DollarSign, AlertCircle, ArrowRight, CheckCircle2, Zap, BarChart3, Filter, Scale, Landmark, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell, ComposedChart, Area, AreaChart } from 'recharts';

interface TerritorialData {
  municipio: string;
  valorReportado: number; // EDAN
  valorValidado: number;  // Six Sigma
  ejecutado: number;      // Fiscal
  poblacion: number;
}

const MOCK_TERRITORIAL_DATA: TerritorialData[] = [
  { municipio: 'Neiva', valorReportado: 12500, valorValidado: 8200, ejecutado: 7800, poblacion: 360000 },
  { municipio: 'Pitalito', valorReportado: 4500, valorValidado: 4200, ejecutado: 4100, poblacion: 130000 },
  { municipio: 'Garzón', valorReportado: 3200, valorValidado: 1500, ejecutado: 1450, poblacion: 95000 },
  { municipio: 'La Plata', valorReportado: 5800, valorValidado: 2100, ejecutado: 2000, poblacion: 65000 },
  { municipio: 'Campoalegre', valorReportado: 1800, valorValidado: 1750, ejecutado: 1700, poblacion: 35000 },
  { municipio: 'San Agustín', valorReportado: 2400, valorValidado: 900, ejecutado: 850, poblacion: 34000 },
];

export const IntegratedArchitectureEMT: React.FC = () => {
  const [selectedMunicipio, setSelectedMunicipio] = useState<string | null>(null);

  const stats = useMemo(() => {
    const totalReportado = MOCK_TERRITORIAL_DATA.reduce((sum, d) => sum + d.valorReportado, 0);
    const totalValidado = MOCK_TERRITORIAL_DATA.reduce((sum, d) => sum + d.valorValidado, 0);
    const totalEjecutado = MOCK_TERRITORIAL_DATA.reduce((sum, d) => sum + d.ejecutado, 0);
    const emtGlobal = (Math.abs(totalReportado - totalValidado) / totalValidado) * 100;
    
    return { totalReportado, totalValidado, totalEjecutado, emtGlobal };
  }, []);

  const chartData = useMemo(() => {
    return MOCK_TERRITORIAL_DATA.map(d => ({
      ...d,
      emt: ((Math.abs(d.valorReportado - d.valorValidado) / d.valorValidado) * 100).toFixed(1),
      eficiencia: ((d.ejecutado / d.valorValidado) * 100).toFixed(1)
    })).sort((a, b) => parseFloat(b.emt) - parseFloat(a.emt));
  }, []);

  const selectedData = useMemo(() => 
    chartData.find(d => d.municipio === selectedMunicipio), 
  [selectedMunicipio]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header: The Core Problem */}
      <div className="bg-rose-600 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <AlertCircle size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Scale size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs">Variable Crítica del Sistema</span>
          </div>
          <h2 className="text-5xl font-black mb-4 leading-tight">
            Error de Medición Territorial (EMT)
          </h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="bg-black/20 p-6 rounded-3xl backdrop-blur-md border border-white/10">
              <code className="text-3xl font-mono font-black">
                EMT = |V_rep - V_val| / V_val
              </code>
            </div>
            <p className="text-rose-100 max-w-xl font-medium text-lg leading-relaxed">
              Detectamos y corregimos sistemáticamente la brecha entre el reporte político (EDAN) y la realidad técnica (Six Sigma) para prevenir el detrimento patrimonial.
            </p>
          </div>
        </div>
      </div>

      {/* The 4 Layers Architecture */}
      <section className="space-y-6">
        <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
          <Database size={24} className="text-indigo-600" /> Arquitectura de 4 Capas Integradas
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              layer: '01', 
              name: 'Capa Origen', 
              sub: 'EDAN Territorial', 
              icon: <Database />, 
              color: 'bg-slate-100 text-slate-600',
              desc: 'Datos crudos reportados por municipios. Alta incertidumbre y sesgo operativo.',
              tags: ['Incertidumbre', 'Sesgo Político']
            },
            { 
              layer: '02', 
              name: 'Capa Validación', 
              sub: 'Six Sigma', 
              icon: <ShieldCheck />, 
              color: 'bg-amber-100 text-amber-600',
              desc: 'Control de calidad del dato. Detección de variaciones y corrección sistemática.',
              tags: ['Calidad', 'Corrección']
            },
            { 
              layer: '03', 
              name: 'Capa Analítica', 
              sub: 'Modelación', 
              icon: <Activity />, 
              color: 'bg-indigo-100 text-indigo-600',
              desc: 'Funciones de daño, modelos económicos e índices de riesgo territorial.',
              tags: ['Daño', 'Impacto']
            },
            { 
              layer: '04', 
              name: 'Capa Fiscal', 
              sub: 'Trazabilidad', 
              icon: <DollarSign />, 
              color: 'bg-emerald-100 text-emerald-600',
              desc: 'Recursos ejecutados, auditoría y cadena de custodia del recurso público.',
              tags: ['Auditoría', 'SIIF']
            }
          ].map((l, i) => (
            <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-slate-50 font-black text-8xl group-hover:text-slate-100 transition-colors">
                {l.layer}
              </div>
              <div className={`w-12 h-12 ${l.color} rounded-2xl flex items-center justify-center relative z-10 shadow-sm`}>
                {l.icon}
              </div>
              <div className="relative z-10">
                <h4 className="font-black text-slate-900 uppercase text-sm">{l.name}</h4>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{l.sub}</p>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">{l.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {l.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 bg-slate-50 text-[9px] font-black text-slate-400 rounded-full border border-slate-100 uppercase">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* EMT Analysis Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <BarChart3 size={20} className="text-rose-600" /> Ranking de Error (EMT) por Municipio
              </h3>
              <div className="px-4 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase border border-rose-100">
                EMT Global: {stats.emtGlobal.toFixed(1)}%
              </div>
            </div>
            
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="municipio" type="category" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: any) => [`${value}%`, 'Error (EMT)']}
                  />
                  <Bar dataKey="emt" radius={[0, 10, 10, 0]} barSize={24}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={parseFloat(entry.emt) > 50 ? '#f43f5e' : parseFloat(entry.emt) > 20 ? '#fbbf24' : '#10b981'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-8">Comparativa de Capas: Origen vs. Validación</h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="municipio" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: 20, fontSize: 10, fontWeight: 'bold'}} />
                  <Bar dataKey="valorReportado" name="Capa 1: Reportado (EDAN)" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="valorValidado" name="Capa 2: Validado (Six Sigma)" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="ejecutado" name="Capa 4: Ejecutado (Fiscal)" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detail Sidebar */}
        <div className="space-y-6">
          <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-6">Explorador de Inconsistencias</h4>
            <div className="space-y-3">
              {chartData.map((d) => (
                <button
                  key={d.municipio}
                  onClick={() => setSelectedMunicipio(d.municipio)}
                  className={`w-full p-4 rounded-2xl border transition-all flex justify-between items-center ${selectedMunicipio === d.municipio ? 'bg-indigo-600 border-indigo-500 shadow-lg' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                >
                  <div className="text-left">
                    <p className="text-xs font-black uppercase">{d.municipio}</p>
                    <p className={`text-[10px] font-bold ${selectedMunicipio === d.municipio ? 'text-indigo-200' : 'text-slate-500'}`}>EMT: {d.emt}%</p>
                  </div>
                  {parseFloat(d.emt) > 50 ? <TrendingUp size={16} className="text-rose-400" /> : <CheckCircle2 size={16} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {selectedData ? (
            <div className="bg-white p-8 rounded-[3rem] border-2 border-indigo-500 shadow-xl animate-in slide-in-from-right-4 duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Análisis Forense</span>
                  <h3 className="text-2xl font-black text-slate-900">{selectedData.municipio}</h3>
                </div>
                <div className={`p-3 rounded-2xl ${parseFloat(selectedData.emt) > 50 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <Zap size={24} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Brecha de Reporte</span>
                    <span className="text-xs font-black text-rose-600">+{selectedData.emt}%</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Reportado</p>
                      <p className="text-lg font-black text-slate-400">${selectedData.valorReportado}M</p>
                    </div>
                    <ArrowRight size={16} className="text-slate-300 mb-1" />
                    <div className="text-right">
                      <p className="text-[9px] text-indigo-600 font-bold uppercase">Validado</p>
                      <p className="text-lg font-black text-indigo-600">${selectedData.valorValidado}M</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Eficiencia Fiscal</span>
                    <span className="text-xs font-black text-emerald-700">{selectedData.eficiencia}%</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed">
                    Se han ejecutado <strong>${selectedData.ejecutado}M</strong> de los <strong>${selectedData.valorValidado}M</strong> autorizados técnicamente.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase mb-3">Acción Recomendada</h5>
                  {parseFloat(selectedData.emt) > 50 ? (
                    <div className="p-3 bg-rose-50 text-rose-700 rounded-xl border border-rose-100 text-[10px] font-bold flex gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      BLOQUEO PREVENTIVO: Iniciar glosa técnica por sobreestimación crítica.
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-[10px] font-bold flex gap-2">
                      <CheckCircle2 size={14} className="shrink-0" />
                      FLUJO LIBRE: Continuar con el desembolso programado.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-indigo-50 p-10 rounded-[3rem] border-2 border-dashed border-indigo-200 flex flex-col items-center justify-center text-center">
              <Activity size={48} className="text-indigo-300 mb-4" />
              <p className="text-sm font-bold text-indigo-400">Selecciona un municipio para ver el análisis de capas y EMT</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
