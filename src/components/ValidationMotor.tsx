import React, { useState, useMemo } from 'react';
import { ShieldAlert, CheckCircle2, AlertTriangle, Search, Filter, BarChart3, Calculator, Info, ArrowRight, Database, FileSearch, Zap, Activity, Scale } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ZAxis, ReferenceLine, Cell } from 'recharts';

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  threshold: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
}

interface ValidationCase {
  id: string;
  municipio: string;
  activo: string;
  valorReportado: number;
  valorReferencia: number;
  ejecutado: number;
  alerta: string;
  zScore: number;
  status: 'FAIL' | 'WARN' | 'PASS';
}

const VALIDATION_RULES: ValidationRule[] = [
  { id: 'R1', name: 'Límite de Valor de Reposición', description: 'El daño reportado no puede exceder el 120% del valor registrado en RUNAPE.', threshold: '> 1.2x RUNAPE', severity: 'CRITICAL' },
  { id: 'R2', name: 'Desviación de Costo Unitario', description: 'El costo por m2 o unidad excede el promedio regional en más de 2 desviaciones estándar.', threshold: 'Z-Score > 2.0', severity: 'WARNING' },
  { id: 'R3', name: 'Exceso de Ejecución Presupuestal', description: 'Los pagos registrados en SIIF superan el valor del contrato original.', threshold: 'Pagos > Contrato', severity: 'CRITICAL' },
  { id: 'R4', name: 'Inconsistencia de Nexo Causal', description: 'La intensidad del evento reportada no justifica el colapso total del activo según curvas de fragilidad.', threshold: 'P < 0.05', severity: 'WARNING' },
];

const MOCK_CASES: ValidationCase[] = [
  { id: 'VAL-001', municipio: 'Municipio A', activo: 'Puente Peatonal', valorReportado: 1200, valorReferencia: 450, ejecutado: 1250, alerta: 'Sobreestimación Crítica (2.6x)', zScore: 3.2, status: 'FAIL' },
  { id: 'VAL-002', municipio: 'Municipio B', activo: 'Sede Educativa', valorReportado: 850, valorReferencia: 800, ejecutado: 400, alerta: 'Consistente', zScore: 0.4, status: 'PASS' },
  { id: 'VAL-003', municipio: 'Municipio G', activo: 'Vías Terciarias', valorReportado: 3500, valorReferencia: 1500, ejecutado: 3800, alerta: 'Ejecución excede Contrato', zScore: 2.8, status: 'FAIL' },
  { id: 'VAL-004', municipio: 'Municipio C', activo: 'Red de Acueducto', valorReportado: 600, valorReferencia: 550, ejecutado: 150, alerta: 'Desviación Moderada', zScore: 1.5, status: 'WARN' },
  { id: 'VAL-005', municipio: 'Municipio E', activo: 'Centro de Salud', valorReportado: 2100, valorReferencia: 2000, ejecutado: 2100, alerta: 'Consistente', zScore: 0.2, status: 'PASS' },
];

export const ValidationMotor: React.FC = () => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'FAIL' | 'WARN' | 'PASS'>('ALL');

  const filteredCases = useMemo(() => {
    if (filterStatus === 'ALL') return MOCK_CASES;
    return MOCK_CASES.filter(c => c.status === filterStatus);
  }, [filterStatus]);

  const selectedCase = useMemo(() => 
    MOCK_CASES.find(c => c.id === selectedCaseId), 
  [selectedCaseId]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white border-2 border-slate-900 p-8 rounded-[2.5rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-rose-100 text-rose-600 rounded-2xl border border-rose-200">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900">Motor de Validación y Detección de Anomalías</h2>
            <p className="text-sm text-slate-500 font-bold uppercase tracking-widest">Prevención de Hallazgos Fiscales y Control de Recursos</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Casos Analizados</p>
            <p className="text-xl font-black">1,240</p>
          </div>
          <div className="px-6 py-3 bg-rose-600 text-white rounded-2xl text-center">
            <p className="text-[10px] font-bold text-rose-200 uppercase">Alertas Críticas</p>
            <p className="text-xl font-black">12</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Rules & Logic */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Scale size={20} className="text-indigo-600" /> Reglas de Negocio Fiscal
            </h3>
            <div className="space-y-4">
              {VALIDATION_RULES.map((rule) => (
                <div key={rule.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-xs font-black text-slate-800 uppercase">{rule.name}</h4>
                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full ${
                      rule.severity === 'CRITICAL' ? 'bg-rose-100 text-rose-600' : 
                      rule.severity === 'WARNING' ? 'bg-amber-100 text-amber-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {rule.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">{rule.description}</p>
                  <div className="pt-2 flex justify-between items-center">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Umbral:</span>
                    <span className="text-[10px] font-black text-indigo-600 font-mono">{rule.threshold}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-3xl text-white shadow-lg">
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-300 mb-4 flex items-center gap-2">
              <Zap size={16} /> Detección de Anomalías (IA)
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Análisis de Outliers</p>
                <p className="text-xs leading-relaxed opacity-80">
                  El sistema utiliza <strong>Isolation Forest</strong> para identificar reportes que no siguen el patrón de daño regional, incluso si cumplen las reglas lógicas.
                </p>
              </div>
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                <p className="text-[10px] font-bold text-indigo-200 uppercase mb-1">Ley de Benford</p>
                <p className="text-xs leading-relaxed opacity-80">
                  Validación de la distribución del primer dígito en los montos reportados para detectar manipulación artificial de cifras.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Case Explorer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <FileSearch size={20} className="text-indigo-600" /> Explorador de Inconsistencias
              </h3>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {(['ALL', 'FAIL', 'WARN', 'PASS'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all uppercase ${
                      filterStatus === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {s === 'ALL' ? 'Todos' : s}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <th className="p-4 font-bold">Caso / Activo</th>
                    <th className="p-4 font-bold text-right">Reportado</th>
                    <th className="p-4 font-bold text-right">Referencia</th>
                    <th className="p-4 font-bold text-center">Z-Score</th>
                    <th className="p-4 font-bold">Alerta Detectada</th>
                    <th className="p-4 font-bold text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCases.map((c) => (
                    <tr 
                      key={c.id} 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${selectedCaseId === c.id ? 'bg-indigo-50/50' : ''}`}
                      onClick={() => setSelectedCaseId(c.id)}
                    >
                      <td className="p-4">
                        <p className="font-bold text-slate-800 text-xs">{c.activo}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-medium">{c.municipio}</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-black text-slate-900 text-xs">${c.valorReportado}M</p>
                      </td>
                      <td className="p-4 text-right">
                        <p className="font-bold text-slate-500 text-xs">${c.valorReferencia}M</p>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-[10px] font-black ${c.zScore > 2 ? 'text-rose-600' : 'text-slate-600'}`}>
                          {c.zScore.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            c.status === 'FAIL' ? 'bg-rose-500' : 
                            c.status === 'WARN' ? 'bg-amber-500' : 
                            'bg-emerald-500'
                          }`} />
                          <span className={`text-[10px] font-bold ${
                            c.status === 'FAIL' ? 'text-rose-600' : 
                            c.status === 'WARN' ? 'text-amber-600' : 
                            'text-emerald-600'
                          }`}>{c.alerta}</span>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                          <ArrowRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Anomaly Chart */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2 uppercase tracking-tight">
              <BarChart3 size={20} className="text-indigo-600" /> Distribución de Desviaciones (Z-Score)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" dataKey="valorReferencia" name="Referencia" unit="M" stroke="#94a3b8" tick={{fontSize: 10}} />
                  <YAxis type="number" dataKey="valorReportado" name="Reportado" unit="M" stroke="#94a3b8" tick={{fontSize: 10}} />
                  <ZAxis type="number" dataKey="zScore" range={[50, 400]} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Scatter name="Casos" data={MOCK_CASES}>
                    {MOCK_CASES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.status === 'FAIL' ? '#ef4444' : entry.status === 'WARN' ? '#f59e0b' : '#10b981'} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500" /> Consistente</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500" /> Desviación</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500" /> Anomalía Crítica</div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal / Panel */}
      {selectedCase && (
        <div className="bg-slate-50 border-2 border-indigo-500 p-8 rounded-[2.5rem] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-8">
            <div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Análisis Detallado de Anomalía</span>
              <h3 className="text-2xl font-black text-slate-900">{selectedCase.id}: {selectedCase.activo}</h3>
              <p className="text-slate-500 font-bold uppercase text-xs">{selectedCase.municipio}</p>
            </div>
            <button 
              onClick={() => setSelectedCaseId(null)}
              className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cerrar Análisis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Evidencia Financiera</h4>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Valor Reportado</span>
                  <span className="text-sm font-black text-slate-900">${selectedCase.valorReportado}M</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Valor RUNAPE</span>
                  <span className="text-sm font-black text-slate-900">${selectedCase.valorReferencia}M</span>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-rose-600">Varianza</span>
                  <span className="text-lg font-black text-rose-600">+{((selectedCase.valorReportado / selectedCase.valorReferencia - 1) * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado de Ejecución</h4>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">Recursos Ejecutados</span>
                  <span className="text-sm font-black text-slate-900">${selectedCase.ejecutado}M</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${selectedCase.ejecutado > selectedCase.valorReportado ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(100, (selectedCase.ejecutado / selectedCase.valorReportado) * 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-slate-400 italic leading-tight">
                  {selectedCase.ejecutado > selectedCase.valorReportado 
                    ? 'ALERTA: La ejecución supera el valor reportado del daño. Posible hallazgo fiscal por sobrecostos.' 
                    : 'Ejecución dentro de los límites del reporte inicial.'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diagnóstico de Auditoría</h4>
              <div className={`p-6 rounded-2xl border h-full ${selectedCase.status === 'FAIL' ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {selectedCase.status === 'FAIL' ? <AlertTriangle className="text-rose-600" size={20} /> : <CheckCircle2 className="text-emerald-600" size={20} />}
                  <span className={`text-xs font-black uppercase ${selectedCase.status === 'FAIL' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {selectedCase.status === 'FAIL' ? 'Hallazgo Probable' : 'Validado'}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {selectedCase.status === 'FAIL' 
                    ? `Se recomienda la apertura inmediata de una glosa técnica. La combinación de sobreestimación paramétrica (${selectedCase.zScore} sigmas) y exceso de ejecución presupuestal sugiere un riesgo inminente de detrimento patrimonial.` 
                    : 'Las cifras presentan una consistencia técnica y financiera aceptable dentro de los márgenes de error del modelo paramétrico.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
