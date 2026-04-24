import React, { useState, useMemo } from 'react';
import { GitBranch, AlertCircle, Users, Settings, Landmark, ShieldAlert, BarChart3, Filter, CheckCircle2, Zap, HelpCircle, ArrowRight, Database, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface ErrorTypology {
  category: string;
  weight: number;
  examples: string[];
  icon: React.ReactNode;
  color: string;
}

const ERROR_TYPOLOGIES: ErrorTypology[] = [
  { 
    category: 'Político', 
    weight: 45, 
    examples: ['Inflación de daños para mayor presupuesto', 'Presión electoral', 'Reporte de activos no afectados'],
    icon: <Landmark size={20} />,
    color: '#f43f5e'
  },
  { 
    category: 'Metodológico', 
    weight: 25, 
    examples: ['Uso de precios no actualizados', 'Error en funciones de daño', 'Falta de nexo causal'],
    icon: <Settings size={20} />,
    color: '#4f46e5'
  },
  { 
    category: 'Humano', 
    weight: 20, 
    examples: ['Error en digitación', 'Falta de capacitación técnica', 'Fatiga operativa en campo'],
    icon: <Users size={20} />,
    color: '#fbbf24'
  },
  { 
    category: 'Instrumental', 
    weight: 10, 
    examples: ['Fallas en conectividad', 'Dispositivos sin GPS', 'Plataforma SIPAE lenta'],
    icon: <Zap size={20} />,
    color: '#10b981'
  }
];

const MUNICIPALITY_SEGMENTATION = [
  { level: 'Alta Confiabilidad', count: 120, color: '#10b981', desc: 'EMT < 10%. Procesos técnicos robustos.' },
  { level: 'Confiabilidad Media', count: 450, color: '#fbbf24', desc: 'EMT 10-30%. Errores metodológicos leves.' },
  { level: 'Baja Confiabilidad', count: 380, color: '#f59e0b', desc: 'EMT 30-50%. Inconsistencias recurrentes.' },
  { level: 'Crítico / Alerta', count: 150, color: '#f43f5e', desc: 'EMT > 50%. Posible sesgo político o fraude.' },
];

export const RootCauseAnalysisEDAN: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const radarData = useMemo(() => {
    return ERROR_TYPOLOGIES.map(t => ({
      subject: t.category,
      A: t.weight,
      fullMark: 100,
    }));
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Header: Causal Analysis */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <GitBranch size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-500 rounded-lg">
              <ShieldAlert size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-rose-300">Análisis Causal y Patrones Estructurales</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Metodología de Identificación de Causas Raíz
          </h2>
          <p className="text-slate-400 max-w-3xl font-medium text-lg">
            Descomposición de inconsistencias en el EDAN mediante el Árbol de Ishikawa adaptado y segmentación de confiabilidad territorial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Ishikawa Adapted (Fishbone) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <GitBranch size={20} className="text-indigo-600" /> Árbol de Causas (Ishikawa Adaptado)
            </h3>
            
            <div className="relative p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
              {/* Central Spine */}
              <div className="absolute top-1/2 left-4 right-20 h-1 bg-slate-900 -translate-y-1/2" />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg z-10">
                <AlertCircle size={32} />
              </div>
              <div className="absolute right-4 top-[calc(50%+45px)] text-[10px] font-black text-rose-600 uppercase">Inconsistencia EDAN</div>

              <div className="grid grid-cols-2 gap-x-20 gap-y-32 relative z-0">
                {/* Top Causes */}
                <div className="relative">
                  <div className="absolute -bottom-16 left-1/2 w-0.5 h-16 bg-slate-300 -rotate-45 origin-bottom" />
                  <div className="p-4 bg-white rounded-2xl border-2 border-rose-500 shadow-sm">
                    <h4 className="text-xs font-black text-rose-600 uppercase mb-2 flex items-center gap-2">
                      <Landmark size={14} /> Político
                    </h4>
                    <ul className="text-[9px] text-slate-500 space-y-1">
                      <li>• Sesgo de asignación</li>
                      <li>• Presión electoral</li>
                      <li>• Inflación de censos</li>
                    </ul>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -bottom-16 left-1/2 w-0.5 h-16 bg-slate-300 -rotate-45 origin-bottom" />
                  <div className="p-4 bg-white rounded-2xl border-2 border-indigo-500 shadow-sm">
                    <h4 className="text-xs font-black text-indigo-600 uppercase mb-2 flex items-center gap-2">
                      <Settings size={14} /> Metodológico
                    </h4>
                    <ul className="text-[9px] text-slate-500 space-y-1">
                      <li>• Error en precios</li>
                      <li>• Funciones de daño</li>
                      <li>• Falta de nexo causal</li>
                    </ul>
                  </div>
                </div>

                {/* Bottom Causes */}
                <div className="relative">
                  <div className="absolute -top-16 left-1/2 w-0.5 h-16 bg-slate-300 rotate-45 origin-top" />
                  <div className="p-4 bg-white rounded-2xl border-2 border-amber-500 shadow-sm">
                    <h4 className="text-xs font-black text-amber-600 uppercase mb-2 flex items-center gap-2">
                      <Users size={14} /> Humano
                    </h4>
                    <ul className="text-[9px] text-slate-500 space-y-1">
                      <li>• Error de digitación</li>
                      <li>• Falta capacitación</li>
                      <li>• Fatiga en campo</li>
                    </ul>
                  </div>
                </div>
                <div className="relative">
                  <div className="absolute -top-16 left-1/2 w-0.5 h-16 bg-slate-300 rotate-45 origin-top" />
                  <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm">
                    <h4 className="text-xs font-black text-emerald-600 uppercase mb-2 flex items-center gap-2">
                      <Zap size={14} /> Instrumental
                    </h4>
                    <ul className="text-[9px] text-slate-500 space-y-1">
                      <li>• Fallas conectividad</li>
                      <li>• GPS impreciso</li>
                      <li>• Plataforma SIPAE</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Territorial Analysis & Variables */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <Activity size={20} className="text-indigo-600" /> Variables de Mayor Desviación
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 'bold', fill: '#64748b'}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar name="Impacto" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Variable Crítica #1</h4>
                  <p className="text-sm font-black text-slate-800">Sobreestimación de Vivienda</p>
                  <p className="text-[10px] text-slate-500 mt-1">Explica el 65% de la desviación fiscal total en eventos de inundación.</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Variable Crítica #2</h4>
                  <p className="text-sm font-black text-slate-800">Precios Unitarios Locales</p>
                  <p className="text-[10px] text-slate-500 mt-1">Variación del 40% respecto al estándar nacional de construcción.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Typologies & Segmentation */}
        <div className="space-y-6">
          {/* 2. Tipologías de Error */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Filter size={20} className="text-indigo-600" /> Tipologías de Error
            </h3>
            <div className="space-y-4">
              {ERROR_TYPOLOGIES.map((t) => (
                <div 
                  key={t.category}
                  onClick={() => setActiveCategory(activeCategory === t.category ? null : t.category)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${activeCategory === t.category ? 'bg-slate-900 text-white border-slate-800' : 'bg-slate-50 border-slate-100 hover:border-slate-200'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${activeCategory === t.category ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-sm'}`}>
                        {t.icon}
                      </div>
                      <h4 className="text-xs font-black uppercase">{t.category}</h4>
                    </div>
                    <span className={`text-[10px] font-black ${activeCategory === t.category ? 'text-indigo-400' : 'text-slate-400'}`}>{t.weight}%</span>
                  </div>
                  {activeCategory === t.category && (
                    <div className="mt-3 space-y-2 animate-in slide-in-from-top-2">
                      {t.examples.map((ex, i) => (
                        <div key={i} className="flex items-center gap-2 text-[10px] opacity-80">
                          <div className="w-1 h-1 bg-indigo-400 rounded-full" />
                          {ex}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Segmentación de Municipios */}
          <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Database size={20} className="text-indigo-300" /> Segmentación de Confiabilidad
            </h3>
            <div className="space-y-4">
              {MUNICIPALITY_SEGMENTATION.map((s, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-indigo-200">{s.level}</span>
                    <span className="text-xs font-black text-white">{s.count} Mun.</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full" style={{ width: `${(s.count / 1100) * 100}%`, backgroundColor: s.color }} />
                  </div>
                  <p className="text-[9px] text-white/50 leading-tight">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50 p-8 rounded-[3rem] border border-emerald-100">
            <h4 className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} /> Objetivo Estructural
            </h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
              Identificar patrones de error para transitar de una <strong>auditoría reactiva</strong> a una <strong>prevención sistémica</strong> mediante el rediseño de incentivos territoriales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
