import React, { useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  ShieldAlert, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Filter,
  History,
  FileText,
  DollarSign,
  Activity,
  ChevronRight,
  ChevronDown,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const FinancialTraceabilityDashboard: React.FC = () => {
  const { state } = useProject();
  const { financialTraceability, financialAuditIssues, financialDocuments } = state;

  const stats = useMemo(() => {
    const highSeverity = financialAuditIssues.filter(i => i.severity === 'Alta').length;
    const totalTraced = financialTraceability.length;
    const withIssues = financialTraceability.filter(t => t.hasInconsistencies).length;
    const totalCDP = financialTraceability.reduce((sum, t) => sum + t.valorCDP, 0);
    const totalPagado = financialTraceability.reduce((sum, t) => sum + t.valorPagado, 0);

    return { highSeverity, totalTraced, withIssues, totalCDP, totalPagado };
  }, [financialTraceability, financialAuditIssues]);

  return (
    <div className="space-y-8">
      {/* Header & Audit Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <ShieldAlert className="text-indigo-600" size={28} />
            Laboratorio de Trazabilidad y Control Fiscal
          </h2>
          <p className="text-slate-500 font-medium">Arquitectura de Trazabilidad Total del Recurso Público</p>
        </div>
        
        <div className="flex gap-3">
          <div className="bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="bg-indigo-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">
              {Math.round(state.globalICF)}%
            </div>
            <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">ICF Global</p>
              <p className="text-sm font-black text-indigo-700">Coherencia Financiera</p>
            </div>
          </div>

          <div className="bg-rose-50 border border-rose-100 px-4 py-2 rounded-xl flex items-center gap-3">
            <div className="bg-rose-500 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black">
              {stats.highSeverity}
            </div>
            <div>
              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Alertas Críticas</p>
              <p className="text-sm font-black text-rose-700">Riesgo Fiscal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Total CDPs Trazados</p>
          <p className="text-2xl font-black text-slate-800">{stats.totalTraced}</p>
          <div className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-600">
            <CheckCircle2 size={14} />
            100% Cobertura
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Total CDP</p>
          <p className="text-2xl font-black text-slate-800">{formatCurrency(stats.totalCDP)}</p>
          <p className="text-xs text-slate-400 mt-1">Disponibilidad Inicial</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Ejecución Real (Pagos)</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(stats.totalPagado)}</p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full" 
              style={{ width: `${(stats.totalPagado / stats.totalCDP) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-400 uppercase mb-1">Cadenas con Hallazgos</p>
          <p className={`text-2xl font-black ${stats.withIssues > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
            {stats.withIssues}
          </p>
          <p className="text-xs text-slate-400 mt-1">Requieren Acción Inmediata</p>
        </div>
      </div>

      {/* Main Content: Traceability Chains */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <History size={20} className="text-indigo-600" />
            Ciclo de Vida del Recurso
          </h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">
              <Filter size={14} />
              Filtrar por Estado
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {financialTraceability.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
              <FileText className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-bold">No hay cadenas de trazabilidad generadas.</p>
              <p className="text-sm text-slate-400">Registre CDPs y RCs para iniciar el seguimiento fiscal.</p>
            </div>
          ) : (
            financialTraceability.map(trace => {
              const cdp = financialDocuments.find(d => d.id === trace.cdpId);
              const rc = financialDocuments.find(d => d.id === trace.rcId);
              const project = state.proyectos.find(p => p.id === trace.projectId);
              const evento = state.eventos.find(e => e.id === trace.eventoId);
              const issues = financialAuditIssues.filter(i => i.entityId === trace.cdpId || i.entityId === trace.rcId);

              return (
                <div key={trace.id} className={`bg-white rounded-3xl border-2 transition-all overflow-hidden ${trace.hasInconsistencies ? 'border-rose-100 shadow-rose-50' : 'border-slate-100 hover:border-indigo-100'}`}>
                  {/* Chain Header */}
                  <div className="p-6 border-b border-slate-50 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${trace.hasInconsistencies ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800">Cadena CDP No. {cdp?.numero}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                            trace.status === 'Cerrado' ? 'bg-emerald-100 text-emerald-700' :
                            trace.status === 'Ejecución' ? 'bg-blue-100 text-blue-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {trace.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            trace.semaforo === 'Verde' ? 'bg-emerald-50 text-emerald-600' :
                            trace.semaforo === 'Amarillo' ? 'bg-amber-50 text-amber-600' :
                            'bg-rose-50 text-rose-600'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              trace.semaforo === 'Verde' ? 'bg-emerald-500' :
                              trace.semaforo === 'Amarillo' ? 'bg-amber-500' :
                              'bg-rose-500'
                            }`} />
                            ICF: {trace.icf}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium truncate max-w-md">{cdp?.descripcion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor CDP</p>
                        <p className="text-lg font-black text-slate-800">{formatCurrency(trace.valorCDP)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ejecutado</p>
                        <p className="text-lg font-black text-emerald-600">{formatCurrency(trace.valorPagado)}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <ChevronDown size={20} />
                      </button>
                    </div>
                  </div>

                  {/* Lifecycle Flow Visualization */}
                  <div className="p-6 bg-slate-50/50">
                    <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                      {/* Connector Line */}
                      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2 z-0" />
                      
                      {/* Step 1: CDP */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
                          <CheckCircle2 size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">CDP</p>
                        <p className="text-xs font-bold text-slate-800">{cdp?.numero}</p>
                      </div>

                      <ArrowRight className="text-slate-300 z-10" size={16} />

                      {/* Step 2: RC */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${rc ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                          {rc ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">RC</p>
                        <p className="text-xs font-bold text-slate-800">{rc?.numero || 'Pendiente'}</p>
                      </div>

                      <ArrowRight className="text-slate-300 z-10" size={16} />

                      {/* Step 3: Contrato/Convenio */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${trace.contractId || trace.convenioId ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                          {trace.contractId || trace.convenioId ? <CheckCircle2 size={20} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Vínculo</p>
                        <p className="text-xs font-bold text-slate-800 truncate max-w-[80px]">
                          {project?.id || evento?.id || 'Sin Vínculo'}
                        </p>
                      </div>

                      <ArrowRight className="text-slate-300 z-10" size={16} />

                      {/* Step 4: Pagos (RP) */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${trace.valorPagado > 0 ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                          {trace.valorPagado > 0 ? <DollarSign size={20} /> : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Pagos</p>
                        <p className="text-xs font-bold text-emerald-600">{trace.rpIds.length} RPs</p>
                      </div>

                      <ArrowRight className="text-slate-300 z-10" size={16} />

                      {/* Step 5: Impacto */}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${trace.status === 'Cerrado' ? 'bg-indigo-600 text-white shadow-indigo-200' : 'bg-white border-2 border-slate-200 text-slate-300'}`}>
                          <Activity size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 uppercase">Impacto</p>
                        <p className="text-xs font-bold text-slate-800">Auditado</p>
                      </div>
                    </div>
                  </div>

                  {/* Audit Issues Section */}
                  {trace.hasInconsistencies && (
                    <div className="bg-rose-50/50 p-6 border-t border-rose-100">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-rose-600" size={18} />
                        <h5 className="text-sm font-black text-rose-800 uppercase tracking-wider">Hallazgos de Auditoría Fiscal ({trace.inconsistencyCount})</h5>
                      </div>
                      <div className="space-y-3">
                        {issues.map(issue => (
                          <div key={issue.id} className="bg-white p-4 rounded-2xl border border-rose-100 flex items-start gap-4">
                            <div className={`mt-1 w-2 h-2 rounded-full ${issue.severity === 'Alta' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-slate-800">{issue.description}</p>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                                  issue.severity === 'Alta' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                }`}>
                                  {issue.severity}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                <Info size={12} />
                                <span className="font-bold">Acción sugerida:</span> {issue.suggestedFix}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Logic Explained (Architectural View) */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white">
        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
          <Activity className="text-indigo-400" size={24} />
          Arquitectura Lógica de Trazabilidad
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">1</div>
              <div>
                <h4 className="font-bold text-indigo-300 mb-1">Llaves de Conexión (Keys)</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  El sistema utiliza llaves compuestas basadas en el <span className="text-white font-bold">Número de Documento</span> y <span className="text-white font-bold">Vigencia</span>. 
                  La conexión CDP ↔ RC se garantiza mediante el campo <span className="font-mono text-xs text-indigo-400">numeroRc</span> capturado por IA.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0">2</div>
              <div>
                <h4 className="font-bold text-indigo-300 mb-1">Flujo de Vida del Recurso</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  <span className="text-white">Disponibilidad (CDP)</span> → 
                  <span className="text-white">Compromiso (RC)</span> → 
                  <span className="text-white">Obligación (Contrato)</span> → 
                  <span className="text-white">Pago (RP)</span> → 
                  <span className="text-white">Impacto (Métricas)</span>.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Reglas de Negocio Fiscal</h4>
            <ul className="space-y-3">
              {[
                'RC no puede exceder el valor del CDP asociado.',
                'RP no puede exceder el valor del RC (Compromiso).',
                'Todo pago debe tener trazabilidad hasta el CDP origen.',
                'Alertas automáticas por falta de vínculo a Proyecto/Evento.'
              ].map((rule, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
