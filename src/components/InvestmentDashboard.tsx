import React, { useMemo, useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, PieChart, BarChart3, ArrowRight } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

export const InvestmentDashboard: React.FC = () => {
  const { state } = useProject();
  const [view, setView] = useState<'vigencia' | 'convenio' | 'proyecto' | 'contrato'>('vigencia');

  const data = useMemo(() => {
    switch (view) {
      case 'vigencia':
        return state.vigencias.map(v => {
          const budgets = state.presupuestos.filter(p => p.vigencia === v.anio);
          const total = budgets.reduce((sum, b) => sum + b.valorTotal, 0);
          const executed = budgets.reduce((sum, b) => sum + b.pagosRealizados, 0);
          return {
            name: v.anio,
            total,
            executed,
            remaining: total - executed,
          };
        }).sort((a, b) => a.name.localeCompare(b.name));

      case 'convenio':
        return state.convenios.map(c => {
          const projects = state.proyectos.filter(p => p.convenioId === c.id);
          const projectIds = projects.map(p => p.id);
          const budgets = state.presupuestos.filter(p => projectIds.includes(p.projectId));
          const total = c.valorTotal;
          const executed = budgets.reduce((sum, b) => sum + b.pagosRealizados, 0);
          return {
            name: c.numero || c.nombre.substring(0, 15) + '...',
            fullName: c.nombre,
            total,
            executed,
            remaining: total - executed,
          };
        }).sort((a, b) => b.total - a.total).slice(0, 10);

      case 'proyecto':
        return state.proyectos.map(p => {
          const budget = state.presupuestos.find(pr => pr.projectId === p.id);
          const total = budget?.valorTotal || 0;
          const executed = budget?.pagosRealizados || 0;
          return {
            name: p.nombre.substring(0, 15) + '...',
            fullName: p.nombre,
            total,
            executed,
            remaining: total - executed,
          };
        }).sort((a, b) => b.total - a.total).slice(0, 10);

      case 'contrato':
        return state.contratos.map(c => {
          const contractPagos = state.pagos.filter(p => p.contractId === c.id && p.estado === 'Pagado');
          const total = c.valor;
          const executed = contractPagos.reduce((sum, p) => sum + p.valor, 0);
          return {
            name: c.numero || c.id.substring(0, 10),
            fullName: c.objetoContractual || c.numero,
            total,
            executed,
            remaining: total - executed,
          };
        }).sort((a, b) => b.total - a.total).slice(0, 10);

      default:
        return [];
    }
  }, [view, state]);

  const totals = useMemo(() => {
    const totalInvestment = state.presupuestos.reduce((sum, b) => sum + b.valorTotal, 0);
    const totalExecuted = state.presupuestos.reduce((sum, b) => sum + b.pagosRealizados, 0);
    const executionPct = totalInvestment > 0 ? (totalExecuted / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalExecuted,
      totalRemaining: totalInvestment - totalExecuted,
      executionPct
    };
  }, [state]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-slate-100 shadow-xl rounded-2xl">
          <p className="font-bold text-slate-800 mb-2">{payload[0].payload.fullName || label}</p>
          <div className="space-y-1">
            <p className="text-sm flex justify-between gap-4">
              <span className="text-slate-500">Inversión Total:</span>
              <span className="font-bold text-indigo-600">{formatCurrency(payload[0].payload.total)}</span>
            </p>
            <p className="text-sm flex justify-between gap-4">
              <span className="text-slate-500">Ejecutado:</span>
              <span className="font-bold text-emerald-600">{formatCurrency(payload[0].payload.executed)}</span>
            </p>
            <p className="text-sm flex justify-between gap-4">
              <span className="text-slate-500">Pendiente:</span>
              <span className="font-bold text-amber-600">{formatCurrency(payload[0].payload.remaining)}</span>
            </p>
            <div className="mt-2 pt-2 border-t border-slate-50">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Porcentaje de Ejecución</p>
              <p className="text-lg font-black text-slate-800">
                {payload[0].payload.total > 0 ? ((payload[0].payload.executed / payload[0].payload.total) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Inversión Total</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totals.totalInvestment)}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <TrendingUp size={14} className="text-emerald-500" />
            <span>Consolidado histórico</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Ejecutado</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totals.totalExecuted)}</h3>
            </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full" style={{ width: `${totals.executionPct}%` }}></div>
          </div>
          <p className="mt-2 text-xs font-bold text-slate-500">{totals.executionPct.toFixed(1)}% de ejecución global</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <PieChart size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saldo Pendiente</p>
              <h3 className="text-2xl font-black text-slate-800">{formatCurrency(totals.totalRemaining)}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <span>Por ejecutar en proyectos activos</span>
          </div>
        </div>
      </div>

      {/* Main Chart Section */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <BarChart3 size={20} className="text-indigo-600" />
              Visualización de Inversión
            </h3>
            <p className="text-slate-500 text-sm">Analiza la distribución y ejecución del presupuesto por diferentes niveles.</p>
          </div>
          
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            {(['vigencia', 'convenio', 'proyecto', 'contrato'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  view === v 
                    ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {v}s
              </button>
            ))}
          </div>
        </div>

        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              barGap={8}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }}
              />
              <Bar 
                name="Inversión Total" 
                dataKey="total" 
                fill="#6366f1" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
              <Bar 
                name="Ejecutado" 
                dataKey="executed" 
                fill="#10b981" 
                radius={[6, 6, 0, 0]} 
                barSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-indigo-600 rounded-full"></div>
              Top 5 por Inversión
            </h4>
            <div className="space-y-3">
              {data.slice(0, 5).map((item: any, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                      {idx + 1}
                    </span>
                    <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{item.fullName || item.name}</span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">{formatCurrency(item.total)}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
              Mayores Ejecuciones (%)
            </h4>
            <div className="space-y-3">
              {[...data].sort((a: any, b: any) => (b.executed / (b.total || 1)) - (a.executed / (a.total || 1))).slice(0, 5).map((item: any, idx) => {
                const pct = item.total > 0 ? (item.executed / item.total) * 100 : 0;
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-bold text-slate-700 truncate max-w-[180px]">{item.fullName || item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full" style={{ width: `${pct}%` }}></div>
                      </div>
                      <span className="text-xs font-black text-emerald-600">{pct.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestmentDashboard;
