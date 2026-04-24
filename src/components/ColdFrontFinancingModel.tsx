import React, { useState } from 'react';
import { Shield, Layers, Zap, TrendingUp, Calculator, Activity, AlertCircle, ArrowRight, Info, Landmark, DollarSign, ThermometerSnowflake, BarChart3, PieChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Line, Bar, Cell } from 'recharts';

export const ColdFrontFinancingModel: React.FC = () => {
  const [severity, setSeverity] = useState(30); // Temperature drop in % or intensity
  const [activeLayer, setActiveLayer] = useState<number | null>(null);

  const layeringData = [
    {
      layer: 'Capa 1: Retención',
      range: 'Frecuencia Alta / Impacto Bajo',
      instrument: 'Fondo de Estabilización / Reservas',
      cost: 'Bajo (Costo de Oportunidad)',
      trigger: 'Temp < 10°C por 48h',
      capacity: 5000, // Millions COP
      color: '#10b981'
    },
    {
      layer: 'Capa 2: Contingente',
      range: 'Frecuencia Media / Impacto Medio',
      instrument: 'Crédito Contingente (CAT DDO)',
      cost: 'Medio (Comisión + Interés)',
      trigger: 'Temp < 5°C por 72h',
      capacity: 15000,
      color: '#3b82f6'
    },
    {
      layer: 'Capa 3: Transferencia',
      range: 'Frecuencia Baja / Impacto Alto',
      instrument: 'Seguro Paramétrico / Cat Bond',
      cost: 'Alto (Prima de Riesgo)',
      trigger: 'Temp < 0°C (Helada Severa)',
      capacity: 45000,
      color: '#8b5cf6'
    }
  ];

  const mathLogic = [
    {
      title: 'Optimización del Costo de Capital (CoC)',
      formula: 'Min Σ (C_i * L_i) + P',
      description: 'Donde C_i es el costo de la capa i, L_i es la liquidez y P es la prima de transferencia. El objetivo es minimizar el costo total de disponibilidad de fondos.'
    },
    {
      title: 'Umbral de Activación Paramétrico (Trigger)',
      formula: 'T_eff = ∫ (T_base - T_obs) dt',
      description: 'Integral de grados-día de frío. El pago se dispara cuando la acumulación de frío supera la resiliencia biológica de los cultivos o infraestructura.'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ThermometerSnowflake size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-md">
              <Shield size={24} />
            </div>
            <span className="font-black uppercase tracking-widest text-sm">DRF Strategy</span>
          </div>
          <h2 className="text-3xl font-black mb-2">Modelo de Financiamiento por Capas: Frentes Fríos</h2>
          <p className="text-blue-100 max-w-2xl font-medium">
            Arquitectura financiera optimizada para la gestión de riesgos climáticos anómalos, alineada con los estándares del Banco Mundial y la OCDE.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Layering Visualization */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Layers size={20} className="text-indigo-600" />
              Estructura de Protección Financiera (Risk Layering)
            </h3>
            
            <div className="space-y-4">
              {layeringData.slice().reverse().map((layer, idx) => (
                <div 
                  key={idx}
                  onMouseEnter={() => setActiveLayer(layeringData.length - 1 - idx)}
                  onMouseLeave={() => setActiveLayer(null)}
                  className={`p-6 rounded-2xl border-2 transition-all cursor-help ${activeLayer === (layeringData.length - 1 - idx) ? 'border-indigo-500 bg-indigo-50 shadow-md scale-[1.02]' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{layer.range}</span>
                      <h4 className="text-lg font-black text-slate-800">{layer.layer}</h4>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: layer.color }}>
                      {layer.instrument}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Capacidad</p>
                      <p className="text-sm font-black text-slate-700">${layer.capacity}M</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Costo</p>
                      <p className="text-sm font-black text-slate-700">{layer.cost}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Trigger</p>
                      <p className="text-sm font-black text-indigo-600">{layer.trigger}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cost Optimization Logic */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mathLogic.map((logic, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator size={18} className="text-indigo-600" />
                  <h4 className="font-black text-slate-800 text-sm uppercase">{logic.title}</h4>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl mb-4 text-center">
                  <code className="text-indigo-400 font-mono text-lg">{logic.formula}</code>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {logic.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Simulation & Insights */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
              <Zap size={20} className="text-amber-500" />
              Simulador de Activación
            </h3>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Severidad del Frente Frío</label>
                  <span className="text-sm font-black text-indigo-600">{severity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-600">Liquidez Requerida</span>
                  <span className="text-sm font-black text-slate-800">${(severity * 600).toLocaleString()}M</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Fondo Retención</span>
                    <span className={severity > 10 ? 'text-emerald-600' : 'text-slate-300'}>{severity > 10 ? 'ACTIVADO' : 'STANDBY'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, severity * 2)}%` }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">CAT DDO (Contingente)</span>
                    <span className={severity > 40 ? 'text-blue-600' : 'text-slate-300'}>{severity > 40 ? 'ACTIVADO' : 'STANDBY'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (severity - 40) * 2.5))}%` }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-400">Seguro Paramétrico</span>
                    <span className={severity > 80 ? 'text-purple-600' : 'text-slate-300'}>{severity > 80 ? 'ACTIVADO' : 'STANDBY'}</span>
                  </div>
                  <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.max(0, Math.min(100, (severity - 80) * 5))}%` }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-lg">
            <h4 className="font-black uppercase tracking-widest text-xs text-indigo-300 mb-4 flex items-center gap-2">
              <Info size={14} />
              Recomendación de Experto
            </h4>
            <p className="text-sm leading-relaxed text-indigo-100 italic">
              "Para eventos anómalos como frentes fríos, la clave no es asegurar el daño físico, sino la <strong>continuidad de la liquidez</strong>. Un trigger basado en temperatura acumulada (Grados-Día) permite inyectar capital antes de que la pérdida económica se vuelva irreversible."
            </p>
            <div className="mt-6 pt-6 border-t border-indigo-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center font-black text-xs">DRF</div>
              <div>
                <p className="text-xs font-bold">Unidad de Riesgo Fiscal</p>
                <p className="text-[10px] text-indigo-400">MinHacienda / Banco Mundial</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
