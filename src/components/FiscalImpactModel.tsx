import React, { useState, useMemo } from 'react';
import { Landmark, TrendingDown, TrendingUp, AlertCircle, Calculator, FileText, ArrowRight, ShieldCheck, DollarSign, PieChart as PieChartIcon, Activity, BarChart3, Info } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ComposedChart, Line } from 'recharts';

interface FiscalScenario {
  id: 'base' | 'stress';
  label: string;
  taxRevenueDrop: number; // %
  reconstructionCost: number; // Millions
  emergencyCost: number; // Millions
  debtInterestRate: number; // %
}

const FISCAL_SCENARIOS: FiscalScenario[] = [
  { id: 'base', label: 'Escenario Base', taxRevenueDrop: 5, reconstructionCost: 12000, emergencyCost: 3500, debtInterestRate: 8.5 },
  { id: 'stress', label: 'Escenario de Estrés', taxRevenueDrop: 15, reconstructionCost: 28000, emergencyCost: 9000, debtInterestRate: 11.2 },
];

export const FiscalImpactModel: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<FiscalScenario>(FISCAL_SCENARIOS[0]);
  const [showFormula, setShowFormula] = useState<string | null>(null);

  const fiscalData = useMemo(() => {
    const years = ['T+0', 'T+1', 'T+2', 'T+3', 'T+4'];
    const baseRevenue = 100000; // 100B base
    
    return years.map((year, index) => {
      const revenueImpact = index === 0 ? activeScenario.taxRevenueDrop : Math.max(0, activeScenario.taxRevenueDrop - (index * 3));
      const revenue = baseRevenue * (1 - revenueImpact / 100);
      const emergency = index === 0 ? activeScenario.emergencyCost : 0;
      const reconstruction = index > 0 ? activeScenario.reconstructionCost / 4 : 0; // Spread over 4 years
      const totalSpending = 80000 + emergency + reconstruction; // 80B base spending
      
      return {
        year,
        ingresos: Math.round(revenue),
        gastos: Math.round(totalSpending),
        deficit: Math.round(revenue - totalSpending),
        reconstruccion: Math.round(reconstruction),
        emergencia: Math.round(emergency)
      };
    });
  }, [activeScenario]);

  const indicators = useMemo(() => {
    const totalFiscalCost = activeScenario.emergencyCost + activeScenario.reconstructionCost;
    const revenueLoss = fiscalData.reduce((acc, curr) => acc + (100000 - curr.ingresos), 0);
    const totalImpact = totalFiscalCost + revenueLoss;
    
    return {
      totalImpact,
      costoDirecto: totalFiscalCost,
      lucroCesanteFiscal: revenueLoss,
      presionDeuda: (totalImpact / 1000000) * 100 // Simplificado como % del PIB
    };
  }, [activeScenario, fiscalData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header & Scenario Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-500/20 rounded-2xl border border-indigo-500/30">
            <Landmark size={32} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Modelo de Cuantificación de Impacto Fiscal</h2>
            <p className="text-sm text-indigo-300 font-bold uppercase tracking-widest">Herramienta de Política Fiscal y Riesgos Contingentes</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          {FISCAL_SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${
                activeScenario.id === s.id 
                  ? 'bg-indigo-500 text-white shadow-lg' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Methodology Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Impact */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <TrendingDown size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Impacto en Ingresos</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Erosión de la base gravable (IVA, Renta) debido a la interrupción de la actividad económica regional.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-2xl font-black text-slate-800">-{activeScenario.taxRevenueDrop}%</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Caída Recaudación T+0</p>
          </div>
        </div>

        {/* Emergency Spending */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <Activity size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Gasto de Emergencia</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Atención inmediata, ayuda humanitaria y rehabilitación básica de servicios. Gasto primario no programado.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-2xl font-black text-slate-800">${activeScenario.emergencyCost.toLocaleString()}M</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Presión Fiscal Inmediata</p>
          </div>
        </div>

        {/* Reconstruction */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-indigo-600">
            <ShieldCheck size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Reconstrucción</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Inversión pública para reposición de activos. Impacta el déficit fiscal en el mediano plazo (T+1 a T+4).
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-2xl font-black text-slate-800">${activeScenario.reconstructionCost.toLocaleString()}M</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Inversión Contingente</p>
          </div>
        </div>

        {/* Debt Pressure */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-slate-800">
            <DollarSign size={20} />
            <h3 className="font-black text-xs uppercase tracking-widest">Presión de Deuda</h3>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Incremento en el costo de financiamiento debido al aumento del riesgo país y necesidades de liquidez.
          </p>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-2xl font-black text-slate-800">{activeScenario.debtInterestRate}%</span>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Tasa de Interés Proyectada</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fiscal Balance Chart */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
              <BarChart3 className="text-indigo-600" /> Balance Fiscal Proyectado (T+0 a T+4)
            </h4>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={fiscalData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{fontSize: 10}} />
                <YAxis stroke="#94a3b8" tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar dataKey="ingresos" name="Ingresos Fiscales" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="gastos" name="Gastos Totales" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="deficit" name="Déficit/Superávit" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Methodology & Formulas */}
        <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
          <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 flex items-center gap-3">
            <Calculator className="text-indigo-600" /> Metodología de Cálculo Fiscal
          </h4>
          
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">1. Diferencia Económica vs Fiscal</h5>
                <button onClick={() => setShowFormula(showFormula === 'diff' ? null : 'diff')} className="text-indigo-600 hover:text-indigo-700">
                  <Info size={16} />
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Mientras la pérdida económica mide la destrucción de riqueza total (pública + privada), el <strong>Impacto Fiscal</strong> se limita a las obligaciones del Estado y la pérdida de recaudación.
              </p>
              {showFormula === 'diff' && (
                <div className="mt-3 p-3 bg-slate-900 text-indigo-300 rounded-xl text-[10px] font-mono animate-in slide-in-from-top-2">
                  Impacto_Fiscal = ΔG_emergencia + ΔG_reconstrucción + (Pérdida_PIB * Tasa_Impositiva_Efectiva)
                </div>
              )}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">2. Indicadores de Sostenibilidad</h5>
                <button onClick={() => setShowFormula(showFormula === 'sust' ? null : 'sust')} className="text-indigo-600 hover:text-indigo-700">
                  <Info size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Costo Fiscal Total</p>
                  <p className="text-sm font-black text-slate-800">${indicators.totalImpact.toLocaleString()}M</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Presión s/ Deuda</p>
                  <p className="text-sm font-black text-rose-600">+{indicators.presionDeuda.toFixed(2)} bps</p>
                </div>
              </div>
              {showFormula === 'sust' && (
                <div className="mt-3 p-3 bg-slate-900 text-indigo-300 rounded-xl text-[10px] font-mono animate-in slide-in-from-top-2">
                  ΔDeuda/PIB = (Déficit_Primario + (r - g) * Deuda_t-1) / PIB
                  <br />r: tasa interés real | g: crecimiento real
                </div>
              )}
            </div>

            <div className="p-6 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200">
              <h5 className="text-xs font-black uppercase tracking-widest mb-2">Recomendación para MinHacienda</h5>
              <p className="text-[11px] text-indigo-100 leading-relaxed italic">
                "Se recomienda la activación inmediata de la <strong>Línea de Crédito Contingente (CAT DDO)</strong> y la reasignación de partidas de inversión no ejecutadas para cubrir el gap de liquidez en T+0 sin comprometer la Regla Fiscal."
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Alert */}
      <div className="bg-white border-2 border-slate-900 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8">
        <div className="p-5 bg-slate-900 text-white rounded-3xl">
          <FileText size={40} />
        </div>
        <div className="flex-1">
          <h4 className="text-xl font-black uppercase mb-2 text-slate-900">Resumen Ejecutivo de Riesgo Fiscal</h4>
          <p className="text-slate-600 text-sm leading-relaxed">
            Bajo el <strong>{activeScenario.label}</strong>, el evento climático genera una presión fiscal de <strong>${indicators.totalImpact.toLocaleString()}M</strong>. 
            El <strong>{((indicators.lucroCesanteFiscal / indicators.totalImpact) * 100).toFixed(1)}%</strong> del impacto corresponde a ingresos no percibidos, lo que sugiere que la recuperación económica es tan vital como la reconstrucción física para la estabilidad de las finanzas públicas.
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">Impacto Fiscal Neto</span>
          <span className="text-4xl font-black text-slate-900">${indicators.totalImpact.toLocaleString()}M</span>
        </div>
      </div>
    </div>
  );
};
