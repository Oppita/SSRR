import React, { useMemo } from 'react';
import { ProjectData, MunicipalityInventory } from '../types';
import { calculateFinancialImpact, FinancialImpactAnalysis, ImpactMetric } from '../services/financialImpactService';
import { AlertCircle, Target, DollarSign, Activity, ChevronRight, BarChart3, Wallet, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell, Legend } from 'recharts';

interface FinancialImpactDashboardProps {
  projectData: ProjectData;
  edanData: MunicipalityInventory;
}

export const FinancialImpactDashboard: React.FC<FinancialImpactDashboardProps> = ({ projectData, edanData }) => {
  const analysis: FinancialImpactAnalysis = useMemo(() => {
    return calculateFinancialImpact(projectData, edanData);
  }, [projectData, edanData]);

  const { indicators, metrics, alerts, totalInvestment } = analysis;

  const renderMetricCard = (metric: ImpactMetric, idx: number) => {
    const actualUnitCost = metric.mitigated > 0 ? (metric.actualInvestment / metric.mitigated) : 0;
    const isOverCost = actualUnitCost > metric.standardUnitCost;

    return (
      <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h5 className="font-black text-slate-800 uppercase text-xs">{metric.category}</h5>
            <p className="text-[10px] text-slate-500 font-bold uppercase">{metric.unit}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
            <Target size={16} className="text-indigo-600" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-end border-b border-slate-100 pb-2">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">Impacto Meta (EDAN)</p>
              <p className="text-xl font-black text-slate-800">{metric.estimatedNeed}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-emerald-500 uppercase">Mitigado Real</p>
              <p className="text-xl font-black text-emerald-600">{metric.mitigated}</p>
            </div>
          </div>

          <div className="pt-2">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] font-bold text-slate-500">Costo Unitario Promedio:</span>
              <span className={`text-[10px] font-black ${isOverCost ? 'text-rose-500' : 'text-emerald-500'}`}>
                $ {actualUnitCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between">
               <span className="text-[10px] font-bold text-slate-400">Costo Unitario Estándar:</span>
               <span className="text-[10px] font-bold text-slate-400">
                $ {metric.standardUnitCost.toLocaleString()}
               </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-3 mb-4">
         <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
           <Activity className="text-white" size={20} />
         </div>
         <div>
           <h3 className="text-lg font-black text-slate-800">Trazabilidad de Impacto Financiero</h3>
           <p className="text-xs text-slate-500 font-medium">Metodología de vinculación Inversión vs. Reposición (EDAN)</p>
         </div>
       </div>

       {/* KPIs Principales */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-3xl text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Eficiencia Financiera</p>
               <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black">{(indicators.eficienciaFinanciera * 100).toFixed(0)}%</h4>
               </div>
               <p className="text-xs text-indigo-200 mt-2 font-medium leading-relaxed">
                  Relación entre el costo estándar validado y el costo final de ejecución pagado a contratistas.
               </p>
            </div>
            <Activity className="absolute right-0 bottom-0 text-white opacity-5 w-32 h-32 transform translate-x-4 translate-y-4" />
         </div>

         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Eficacia del Gasto</p>
               <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-slate-800">{(indicators.eficaciaGasto * 100).toFixed(0)}%</h4>
               </div>
               <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Porcentaje de la necesidad crítica territorial (EDAN) que ha sido resuelta mediante la ejecución actual.
               </p>
            </div>
            <Target className="absolute right-0 bottom-0 text-emerald-500 opacity-5 w-32 h-32 transform translate-x-4 translate-y-4" />
         </div>

         <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
            <div className="relative z-10">
               <p className="text-[10px] font-black uppercase tracking-widest text-purple-600 mb-1">Retorno Social (Proxy)</p>
               <div className="flex items-baseline gap-2">
                  <h4 className="text-4xl font-black text-slate-800">{(indicators.retornoSocial).toFixed(2)}x</h4>
               </div>
               <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Estimación de beneficios sociales monetizados multiplicador de la inversión original.
               </p>
            </div>
            <TrendingUp className="absolute right-0 bottom-0 text-purple-500 opacity-5 w-32 h-32 transform translate-x-4 translate-y-4" />
         </div>
       </div>

       {/* Alertas Detectadas */}
       {alerts.length > 0 && (
         <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="text-rose-600" size={20} />
              <h4 className="font-black text-rose-900">Desviaciones y Riesgos Detectados</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
               {alerts.map(alert => (
                 <div key={alert.id} className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm flex gap-4">
                   <div className="mt-1">
                      {alert.type === 'Sobrecosto' ? <Wallet className="text-rose-500" size={18} /> : null}
                      {alert.type === 'Ineficiencia' ? <Activity className="text-orange-500" size={18} /> : null}
                      {alert.type === 'Desalineación' ? <Target className="text-amber-500" size={18} /> : null}
                   </div>
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <span className="text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-100 text-slate-600">
                         {alert.type}
                       </span>
                       <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full 
                         ${alert.severity === 'Alta' ? 'bg-rose-100 text-rose-700' : 
                           alert.severity === 'Media' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'}`}>
                         Riesgo {alert.severity}
                       </span>
                     </div>
                     <p className="text-xs text-slate-600 mt-2 leading-relaxed font-medium">{alert.description}</p>
                   </div>
                 </div>
               ))}
            </div>
         </div>
       )}

       {/* Detalle por Métrica Unitario */}
       <div>
         <h4 className="font-black text-slate-800 mb-4 px-2">Detalle de Costos Unitarios de Impacto</h4>
         {metrics.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
             {metrics.map((m, i) => renderMetricCard(m, i))}
           </div>
         ) : (
           <div className="bg-slate-50 border border-slate-200 border-dashed rounded-3xl p-12 text-center">
             <BarChart3 className="mx-auto text-slate-300 mb-4" size={32} />
             <h5 className="font-black text-slate-700 mb-2">No hay trazabilidad métrica posible</h5>
             <p className="text-sm text-slate-500 max-w-md mx-auto">
                No se ha logrado vincular los registros financieros actuales del proyecto (CDP, RC, Pagos) con métricas específicas de avance físico reportadas en el EDAN.
             </p>
           </div>
         )}
       </div>

    </div>
  );
};
