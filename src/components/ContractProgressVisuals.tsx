import React from 'react';
import { Contract, Avance, Pago, Otrosie } from '../types';
import { TrendingUp, DollarSign, BarChart3, Target, AlertCircle } from 'lucide-react';

interface ContractProgressVisualsProps {
  contract: Contract;
  avances: Avance[];
  pagos: Pago[];
  otrosies: Otrosie[];
}

export const ContractProgressVisuals: React.FC<ContractProgressVisualsProps> = ({ 
  contract, 
  avances, 
  pagos, 
  otrosies 
}) => {
  const totalOtrosies = otrosies.reduce((sum, o) => sum + o.valorAdicional, 0);
  const valorActual = contract.valor + totalOtrosies;
  const totalPagado = pagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.valor, 0);
  
  const fisicoPct = avances.length > 0 ? avances[avances.length - 1].fisicoPct : 0;
  const programadoPct = avances.length > 0 ? avances[avances.length - 1].programadoPct : 0;
  const financieroPct = valorActual > 0 ? (totalPagado / valorActual) * 100 : 0;
  
  const desviacion = fisicoPct - programadoPct;
  const eficiencia = fisicoPct > 0 ? (financieroPct / fisicoPct) : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-indigo-600" size={20} />
          Métricas de Avance Visual
        </h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          desviacion >= 0 ? 'bg-emerald-100 text-emerald-700' : 
          desviacion > -10 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
        }`}>
          {desviacion >= 0 ? 'Al día' : `Retraso: ${Math.abs(desviacion).toFixed(1)}%`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Physical Progress Gauge */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * fisicoPct) / 100}
                className="text-indigo-600 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{fisicoPct.toFixed(1)}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Físico</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Programado: {programadoPct}%</p>
            <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden mx-auto">
              <div 
                className="h-full bg-slate-300" 
                style={{ width: `${programadoPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Financial Progress Gauge */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="64"
                cy="64"
                r="58"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * financieroPct) / 100}
                className="text-emerald-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800">{financieroPct.toFixed(1)}%</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Financiero</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ejecutado: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(totalPagado)}</p>
            <p className="text-[10px] text-slate-400">de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(valorActual)}</p>
          </div>
        </div>

        {/* Efficiency & Deviation Stats */}
        <div className="flex flex-col justify-center space-y-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <TrendingUp size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Eficiencia</p>
                <p className="text-lg font-black text-slate-800">{(eficiencia * 100).toFixed(1)}%</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Relación entre avance financiero y físico real.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${desviacion >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                <Target size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Desviación</p>
                <p className={`text-lg font-black ${desviacion >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {desviacion > 0 ? '+' : ''}{desviacion.toFixed(1)}%
                </p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">Diferencia entre avance físico real y programado.</p>
          </div>
        </div>
      </div>

      {/* Comparative Bar */}
      <div className="pt-4 border-t border-slate-50">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase mb-2">
          <span>Comparativa de Ejecución</span>
          <span>Meta: 100%</span>
        </div>
        <div className="relative h-4 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-600/20 border-r border-indigo-400 z-10" 
            style={{ width: `${programadoPct}%` }}
            title="Programado"
          ></div>
          <div 
            className="absolute top-0 left-0 h-full bg-indigo-600 z-20" 
            style={{ width: `${fisicoPct}%` }}
            title="Físico Real"
          ></div>
          <div 
            className="absolute top-0 left-0 h-full bg-emerald-500/40 z-0" 
            style={{ width: `${financieroPct}%` }}
            title="Financiero"
          ></div>
        </div>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
            <span className="text-[10px] font-bold text-slate-600">Físico Real</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-200 border border-indigo-400"></div>
            <span className="text-[10px] font-bold text-slate-600">Programado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-200"></div>
            <span className="text-[10px] font-bold text-slate-600">Financiero</span>
          </div>
        </div>
      </div>
    </div>
  );
};
