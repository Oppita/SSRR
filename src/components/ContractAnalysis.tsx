import React from 'react';
import { Contract, Otrosie, ContractEvent, Pago, InterventoriaReport } from '../types';
import { Clock, DollarSign, Calendar, AlertCircle, CheckCircle2, Activity, History, TrendingUp, TrendingDown } from 'lucide-react';
import { ContractRiskScore } from './ContractRiskScore';
import { calculateContractTotals } from '../utils/projectCalculations';

interface ContractAnalysisProps {
  contract: Contract;
  otrosies: Otrosie[];
  events: ContractEvent[];
  pagos: Pago[];
  reports: InterventoriaReport[];
  projectId: string;
}

export const ContractAnalysis: React.FC<ContractAnalysisProps> = ({ contract, otrosies, events, pagos, reports, projectId }) => {
  // 1. Calculate Current Value and Timeline using utility
  const { 
    valorTotal: currentValue, 
    plazoTotalMeses: totalDurationMonths,
    fechaFinCalculada: currentEndDate,
    valorAdicional,
    plazoAdicionalMeses
  } = calculateContractTotals(contract, otrosies, events);

  // 2. Financial Execution
  const totalPaid = pagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.valor, 0);
  const financialExecutionPct = currentValue > 0 ? (totalPaid / currentValue) * 100 : 0;

  // 3. Physical Progress (from latest report)
  const latestReport = [...reports].sort((a, b) => b.semana - a.semana)[0];
  const physicalProgressPct = latestReport ? latestReport.obraEjecutadaPct : 0;
  const scheduledProgressPct = latestReport ? latestReport.obraProgramadaPct : 0;

  // 4. Inconsistency Detection
  const progressMismatch = Math.abs(physicalProgressPct - financialExecutionPct);
  const isInconsistent = progressMismatch > 15; // Threshold for inconsistency
  const isBehindSchedule = physicalProgressPct < scheduledProgressPct;

  const originalEndDate = contract.fechaInicio ? (() => {
    const date = new Date(contract.fechaInicio);
    if (isNaN(date.getTime())) return 'N/A';
    date.setMonth(date.getMonth() + contract.plazoMeses);
    return date.toISOString().split('T')[0];
  })() : 'N/A';

  // 3. Detect Active Suspensions
  const sortedEvents = [...events].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  let isSuspended = false;
  let lastSuspensionDate: string | null = null;
  let totalSuspensionDays = 0;

  sortedEvents.forEach(e => {
    if (e.tipo === 'Suspensión') {
      isSuspended = true;
      lastSuspensionDate = e.fecha;
    } else if (e.tipo === 'Reinicio' && isSuspended && lastSuspensionDate) {
      isSuspended = false;
      const start = new Date(lastSuspensionDate);
      const end = new Date(e.fecha);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalSuspensionDays += diffDays;
      lastSuspensionDate = null;
    }
  });

  // If still suspended, add days until today
  let currentSuspensionDays = 0;
  if (isSuspended && lastSuspensionDate) {
    const start = new Date(lastSuspensionDate);
    const end = new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    currentSuspensionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  // 4. Calculate Effective Execution Days
  const calculateEffectiveDays = () => {
    if (!contract.fechaInicio) return 0;
    const start = new Date(contract.fechaInicio);
    const end = new Date() < new Date(currentEndDate) ? new Date() : new Date(currentEndDate);
    
    if (end < start) return 0;

    const totalDiffTime = Math.abs(end.getTime() - start.getTime());
    const totalElapsedDays = Math.ceil(totalDiffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, totalElapsedDays - totalSuspensionDays - currentSuspensionDays);
  };

  const effectiveDays = calculateEffectiveDays();

  // 5. Detect Delays
  const isDelayed = new Date() > new Date(currentEndDate) && contract.plazoMeses > 0;

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="space-y-6">
      <ContractRiskScore 
        contract={contract} 
        otrosies={otrosies} 
        events={events} 
        pagos={pagos} 
        reports={reports} 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-500">
      {/* Financial Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
            <DollarSign size={20} />
          </div>
          <h4 className="font-bold text-slate-800">Financiero</h4>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor Actualizado</p>
            <p className="text-lg font-black text-indigo-600">{formatCurrency(currentValue)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pagado</p>
            <p className="text-sm font-semibold text-slate-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="pt-2">
            <div className="flex justify-between items-center mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ejecución Financiera</p>
              <span className="text-xs font-bold text-indigo-600">{financialExecutionPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${financialExecutionPct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Time Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
            <Clock size={20} />
          </div>
          <h4 className="font-bold text-slate-800">Tiempo</h4>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plazo Total</p>
              <p className="text-sm font-bold text-slate-700">{totalDurationMonths} meses</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original</p>
              <p className="text-sm text-slate-500">{contract.plazoMeses} m</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha Fin Estimada</p>
            <p className={`text-sm font-bold ${isDelayed ? 'text-rose-600' : 'text-slate-700'}`}>
              {currentEndDate}
            </p>
          </div>
          {effectiveDays > 0 && (
            <div className="pt-2 border-t border-slate-50">
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                {effectiveDays} días efectivos de ejecución
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
            <Activity size={20} />
          </div>
          <h4 className="font-bold text-slate-800">Estado</h4>
        </div>
        <div className="space-y-4">
          {isSuspended ? (
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <AlertCircle size={20} className="text-rose-600" />
              <div>
                <p className="text-xs font-bold text-rose-700">SUSPENSIÓN ACTIVA</p>
                <p className="text-[10px] text-rose-600">Desde: {lastSuspensionDate}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-emerald-700">EN EJECUCIÓN</p>
                <p className="text-[10px] text-emerald-600">Sin suspensiones vigentes</p>
              </div>
            </div>
          )}

          {isDelayed && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <AlertCircle size={20} className="text-amber-600" />
              <div>
                <p className="text-xs font-bold text-amber-700">RETRASO DETECTADO</p>
                <p className="text-[10px] text-amber-600">Superó fecha fin original</p>
              </div>
            </div>
          )}

          {isInconsistent && (
            <div className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl">
              <AlertCircle size={20} className="text-rose-600" />
              <div>
                <p className="text-xs font-bold text-rose-700">INCONSISTENCIA</p>
                <p className="text-[10px] text-rose-600">Desfase Físico vs Financiero: {progressMismatch.toFixed(1)}%</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Summary */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
            <History size={20} />
          </div>
          <h4 className="font-bold text-slate-800">Avance Cruce</h4>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Físico (Interventoría)</span>
              <span className="text-slate-700">{physicalProgressPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${physicalProgressPct}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Programado</span>
              <span className="text-slate-700">{scheduledProgressPct.toFixed(1)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${scheduledProgressPct}%` }} />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2">
              {isBehindSchedule ? (
                <>
                  <TrendingDown size={14} className="text-rose-500" />
                  <span className="text-[10px] font-bold text-rose-600 uppercase">Retraso en Obra: {(scheduledProgressPct - physicalProgressPct).toFixed(1)}%</span>
                </>
              ) : (
                <>
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Obra al día</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};
