import React from 'react';
import { Contract, Otrosie, ContractEvent, Pago, InterventoriaReport } from '../types';
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, TrendingUp, TrendingDown, Scale, Clock, DollarSign } from 'lucide-react';
import { calculateContractTotals } from '../utils/projectCalculations';

interface ContractRiskScoreProps {
  contract: Contract;
  otrosies: Otrosie[];
  events: ContractEvent[];
  pagos: Pago[];
  reports: InterventoriaReport[];
}

export const ContractRiskScore: React.FC<ContractRiskScoreProps> = ({ contract, otrosies, events, pagos, reports }) => {
  // 1. Calculate Financial Deviation and Current Value using utility
  const { valorTotal: currentValue, valorAdicional, plazoTotalMeses } = calculateContractTotals(contract, otrosies, events);
  const budgetDeviationPct = contract.valor > 0 ? (valorAdicional / contract.valor) * 100 : 0;

  // 2. Calculate Extensions
  const extensionsCount = events.filter(e => e.tipo === 'Prórroga').length + otrosies.filter(o => o.plazoAdicionalMeses > 0).length;

  // 3. Financial Inconsistency
  const totalPaid = pagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.valor, 0);
  const financialExecutionPct = currentValue > 0 ? (totalPaid / currentValue) * 100 : 0;
  const latestReport = [...reports].sort((a, b) => b.semana - a.semana)[0];
  const physicalProgressPct = latestReport ? latestReport.obraEjecutadaPct : 0;
  const progressMismatch = Math.abs(physicalProgressPct - financialExecutionPct);

  // 4. Legal Risk (Suspensions or specific events)
  const suspensionEvents = events.filter(e => e.tipo === 'Suspensión');
  const hasLegalRisk = suspensionEvents.length > 1 || events.some(e => (e.descripcion || '').toLowerCase().includes('legal') || (e.descripcion || '').toLowerCase().includes('demanda'));

  // Risk Score Calculation (0-100)
  let score = 0;
  const risks: { label: string; level: 'Bajo' | 'Medio' | 'Alto'; score: number; icon: React.ReactNode }[] = [];

  // Otrosíes Risk
  const otrosieScore = otrosies.length * 15;
  risks.push({
    label: 'Exceso de Otrosíes',
    level: otrosies.length > 3 ? 'Alto' : otrosies.length > 1 ? 'Medio' : 'Bajo',
    score: Math.min(otrosieScore, 30),
    icon: <Info size={16} />
  });
  score += Math.min(otrosieScore, 30);

  // Extensions Risk
  const extensionScore = extensionsCount * 20;
  risks.push({
    label: 'Múltiples Prórrogas',
    level: extensionsCount > 2 ? 'Alto' : extensionsCount > 0 ? 'Medio' : 'Bajo',
    score: Math.min(extensionScore, 25),
    icon: <Clock size={16} />
  });
  score += Math.min(extensionScore, 25);

  // Budget Risk
  const budgetRiskLevel = budgetDeviationPct > 50 ? 'Alto' : budgetDeviationPct > 20 ? 'Medio' : 'Bajo';
  risks.push({
    label: 'Desviación Presupuestal',
    level: budgetRiskLevel,
    score: budgetRiskLevel === 'Alto' ? 25 : budgetRiskLevel === 'Medio' ? 15 : 5,
    icon: <DollarSign size={16} />
  });
  score += budgetRiskLevel === 'Alto' ? 25 : budgetRiskLevel === 'Medio' ? 15 : 5;

  // Inconsistency Risk
  const inconsistencyRiskLevel = progressMismatch > 20 ? 'Alto' : progressMismatch > 10 ? 'Medio' : 'Bajo';
  risks.push({
    label: 'Inconsistencia Físico-Financiera',
    level: inconsistencyRiskLevel,
    score: inconsistencyRiskLevel === 'Alto' ? 20 : inconsistencyRiskLevel === 'Medio' ? 10 : 0,
    icon: <Scale size={16} />
  });
  score += inconsistencyRiskLevel === 'Alto' ? 20 : inconsistencyRiskLevel === 'Medio' ? 10 : 0;

  // Legal Risk
  risks.push({
    label: 'Riesgo Jurídico',
    level: hasLegalRisk ? 'Alto' : 'Bajo',
    score: hasLegalRisk ? 20 : 0,
    icon: <ShieldAlert size={16} />
  });
  if (hasLegalRisk) score += 20;

  const finalScore = Math.min(score, 100);
  const riskLevel = finalScore > 70 ? 'Crítico' : finalScore > 40 ? 'Moderado' : 'Bajo';

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      <div className={`p-6 flex items-center justify-between ${
        riskLevel === 'Crítico' ? 'bg-rose-50' : riskLevel === 'Moderado' ? 'bg-amber-50' : 'bg-emerald-50'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${
            riskLevel === 'Crítico' ? 'bg-rose-100 text-rose-600' : 
            riskLevel === 'Moderado' ? 'bg-amber-100 text-amber-600' : 
            'bg-emerald-100 text-emerald-600'
          }`}>
            {riskLevel === 'Crítico' ? <ShieldAlert size={24} /> : riskLevel === 'Moderado' ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Score de Riesgo Contractual</h3>
            <p className={`text-sm font-bold ${
              riskLevel === 'Crítico' ? 'text-rose-600' : 
              riskLevel === 'Moderado' ? 'text-amber-600' : 
              'text-emerald-600'
            }`}>
              Nivel de Riesgo: {riskLevel} ({finalScore}/100)
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-slate-900">{finalScore}</div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Puntos de Riesgo</div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {risks.map((risk, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  risk.level === 'Alto' ? 'bg-rose-100 text-rose-600' : 
                  risk.level === 'Medio' ? 'bg-amber-100 text-amber-600' : 
                  'bg-emerald-100 text-emerald-600'
                }`}>
                  {risk.icon}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">{risk.label}</p>
                  <p className={`text-[10px] font-bold uppercase ${
                    risk.level === 'Alto' ? 'text-rose-600' : 
                    risk.level === 'Medio' ? 'text-amber-600' : 
                    'text-emerald-600'
                  }`}>{risk.level}</p>
                </div>
              </div>
              <div className="text-sm font-black text-slate-400">+{risk.score}</div>
            </div>
          ))}
        </div>

        {riskLevel === 'Crítico' && (
          <div className="mt-4 p-4 bg-rose-600 text-white rounded-2xl flex items-start gap-3 shadow-lg shadow-rose-100">
            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">Atención Requerida</p>
              <p className="text-xs opacity-90 leading-relaxed">
                Este contrato presenta múltiples factores de riesgo acumulados. Se recomienda una auditoría técnica y jurídica inmediata para mitigar posibles hallazgos o incumplimientos.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
