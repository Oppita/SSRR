import React, { useRef, useState } from 'react';
import { Contract, Otrosie, ContractEvent, Pago, InterventoriaReport } from '../types';
import { X, FileText, Download, Printer, Calendar, DollarSign, Activity, History, AlertCircle, CheckCircle2, Clock, TrendingUp, TrendingDown, Scale, Info } from 'lucide-react';
import { ContractTimeline } from './ContractTimeline';
import { ContractAnalysis } from './ContractAnalysis';
import { ContractRiskScore } from './ContractRiskScore';
import { generatePDF } from '../utils/pdfGenerator';
import { calculateContractTotals } from '../utils/projectCalculations';

interface ContractFullReportProps {
  contract: Contract;
  otrosies: Otrosie[];
  events: ContractEvent[];
  pagos: Pago[];
  reports: InterventoriaReport[];
  onClose: () => void;
}

export const ContractFullReport: React.FC<ContractFullReportProps> = ({ contract, otrosies, events, pagos, reports, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      await generatePDF(reportRef.current, {
        filename: `Informe_Contractual_${contract.numero}.pdf`,
        backgroundColor: '#ffffff'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const { valorTotal: currentValue } = calculateContractTotals(contract, otrosies, events);
  const totalPaid = pagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.valor, 0);
  const financialExecutionPct = currentValue > 0 ? (totalPaid / currentValue) * 100 : 0;
  const latestReport = [...reports].sort((a, b) => b.semana - a.semana)[0];
  const physicalProgressPct = latestReport ? latestReport.obraEjecutadaPct : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Informe Integral Contractual</h2>
              <p className="text-slate-400 text-xs uppercase tracking-widest font-bold">Contrato No. {contract.numero}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-900/20"
            >
              {isGenerating ? <Clock className="animate-spin" size={18} /> : <Download size={18} />}
              {isGenerating ? 'Generando...' : 'Descargar PDF'}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50" ref={reportRef}>
          <div className="max-w-4xl mx-auto space-y-12 bg-white p-12 rounded-3xl shadow-sm border border-slate-100">
            {/* 1. Basic Info */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Info size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">1. Información General</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contratista</p>
                    <p className="text-sm font-bold text-slate-800">{contract.contratista}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Objeto</p>
                    <p className="text-xs text-slate-600 leading-relaxed">{contract.objetoContractual}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fecha Inicio</p>
                      <p className="text-sm font-bold text-slate-800">{contract.fechaInicio}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Plazo Original</p>
                      <p className="text-sm font-bold text-slate-800">{contract.plazoMeses} meses</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supervisor / Interventor</p>
                    <p className="text-sm font-bold text-slate-800">{contract.supervisor || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Risk Score */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <AlertCircle size={20} className="text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">2. Análisis de Riesgo Contractual</h3>
              </div>
              <ContractRiskScore 
                contract={contract} 
                otrosies={otrosies} 
                events={events} 
                pagos={pagos} 
                reports={reports} 
              />
            </section>

            {/* 3. Financial Analysis */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <DollarSign size={20} className="text-emerald-600" />
                <h3 className="text-lg font-bold text-slate-900">3. Análisis Financiero</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valor Original</p>
                  <p className="text-lg font-black text-slate-800">{formatCurrency(contract.valor)}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Valor Actualizado</p>
                  <p className="text-lg font-black text-indigo-600">{formatCurrency(currentValue)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Pagos Realizados</p>
                  <p className="text-lg font-black text-emerald-600">{formatCurrency(totalPaid)}</p>
                </div>
              </div>
              <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-bold text-slate-800">Ejecución Financiera vs Física</h4>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Financiero: {financialExecutionPct.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Físico: {physicalProgressPct.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-indigo-500" style={{ width: `${financialExecutionPct}%` }} />
                  </div>
                  <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500" style={{ width: `${physicalProgressPct}%` }} />
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Otrosíes History */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <History size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">4. Historial de Otrosíes</h3>
              </div>
              {otrosies.length > 0 ? (
                <div className="space-y-4">
                  {otrosies.map(o => (
                    <div key={o.id} className="p-4 bg-white border border-slate-100 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs font-bold text-slate-400">{o.fechaFirma}</p>
                          <h5 className="font-bold text-slate-800">Otrosí No. {o.numero}</h5>
                        </div>
                        <div className="flex gap-2">
                          {o.valorAdicional > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-lg">
                              +{formatCurrency(o.valorAdicional)}
                            </span>
                          )}
                          {o.plazoAdicionalMeses > 0 && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg">
                              +{o.plazoAdicionalMeses} meses
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 italic">{o.objeto}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic text-center py-4">No se registran otrosíes para este contrato.</p>
              )}
            </section>

            {/* 5. Timeline */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <Activity size={20} className="text-indigo-600" />
                <h3 className="text-lg font-bold text-slate-900">5. Línea de Tiempo de Ejecución</h3>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-slate-100">
                <ContractTimeline contracts={[contract]} otrosies={otrosies} />
              </div>
            </section>

            {/* 6. Alerts */}
            <section className="space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <AlertCircle size={20} className="text-rose-600" />
                <h3 className="text-lg font-bold text-slate-900">6. Alertas Detectadas Automáticamente</h3>
              </div>
              <div className="space-y-4">
                {financialExecutionPct > physicalProgressPct + 10 && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                    <AlertCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-700">Desfase Físico-Financiero</p>
                      <p className="text-xs text-rose-600">La ejecución financiera ({financialExecutionPct.toFixed(1)}%) supera significativamente el avance físico ({physicalProgressPct.toFixed(1)}%).</p>
                    </div>
                  </div>
                )}
                {otrosies.length > 3 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-700">Exceso de Otrosíes</p>
                      <p className="text-xs text-amber-600">Se han registrado {otrosies.length} otrosíes, lo que indica una alta inestabilidad en la planeación original.</p>
                    </div>
                  </div>
                )}
                {events.filter(e => e.tipo === 'Prórroga').length > 2 && (
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
                    <AlertCircle size={20} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-700">Múltiples Prórrogas</p>
                      <p className="text-xs text-amber-600">El contrato ha sido prorrogado en {events.filter(e => e.tipo === 'Prórroga').length} ocasiones.</p>
                    </div>
                  </div>
                )}
                {currentValue > contract.valor * 1.5 && (
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3">
                    <AlertCircle size={20} className="text-rose-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-rose-700">Adición Presupuestal Crítica</p>
                      <p className="text-xs text-rose-600">El valor actual supera en más del 50% el valor original del contrato.</p>
                    </div>
                  </div>
                )}
                {/* Default message if no alerts */}
                {!(financialExecutionPct > physicalProgressPct + 10) && !(otrosies.length > 3) && !(events.filter(e => e.tipo === 'Prórroga').length > 2) && !(currentValue > contract.valor * 1.5) && (
                  <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex gap-3">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-emerald-700">Sin Alertas Críticas</p>
                      <p className="text-xs text-emerald-600">No se detectaron inconsistencias graves en los parámetros analizados.</p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Footer for PDF */}
            <div className="pt-12 border-t border-slate-100 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Generado por Sistema de Gestión Contractual AIS</p>
              <p className="text-[10px] text-slate-400 mt-1">Fecha de Generación: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
