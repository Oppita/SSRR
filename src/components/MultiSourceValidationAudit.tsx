import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Globe, 
  Cloud, 
  FileSearch, 
  History, 
  Fingerprint, 
  Scale, 
  DollarSign, 
  Activity, 
  Search,
  Filter,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Zap
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';

export const MultiSourceValidationAudit: React.FC = () => {
  const [selectedRecord, setSelectedRecord] = useState<string | null>('TR-2026-001');

  const auditData = [
    {
      id: 'TR-2026-001',
      municipio: 'Mocoa',
      fecha: '2026-04-10',
      fuente: 'EDAN Municipal',
      version: 'v2.1',
      icr: 0.82,
      ajuste: -18.5,
      reportado: 1250,
      ajustado: 1018,
      sesgo: 0.12,
      status: 'Validado'
    },
    {
      id: 'TR-2026-002',
      municipio: 'Quibdó',
      fecha: '2026-04-11',
      fuente: 'EDAN Municipal',
      version: 'v1.0',
      icr: 0.45,
      ajuste: -55.0,
      reportado: 3200,
      ajustado: 1440,
      sesgo: 0.25,
      status: 'Alerta'
    }
  ];

  const currentRecord = auditData.find(r => r.id === selectedRecord) || auditData[0];

  const validationSources = [
    { name: 'Satélite (Sentinel-2)', status: 'Consistente', confidence: 94, icon: <Globe size={16} /> },
    { name: 'IDEAM (Pluviometría)', status: 'Consistente', confidence: 88, icon: <Cloud size={16} /> },
    { name: 'Registros Administrativos', status: 'Desviación Leve', confidence: 72, icon: <Database size={16} /> },
    { name: 'Imágenes Geoespaciales', status: 'Consistente', confidence: 91, icon: <FileSearch size={16} /> }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* 4 & 5. VALIDACIÓN MULTIFUENTE Y AJUSTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <ShieldCheck className="text-indigo-600" /> Validación Multifuente y Ajuste
            </h3>
            <div className="px-4 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-500 uppercase">
              Motor de Inferencia v2.0
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fuentes de Contraste</h4>
              <div className="space-y-3">
                {validationSources.map((source, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl text-indigo-600 shadow-sm">
                        {source.icon}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">{source.name}</p>
                        <p className={`text-[10px] font-bold ${source.status === 'Consistente' ? 'text-emerald-500' : 'text-amber-500'}`}>{source.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Confianza</p>
                      <p className="text-sm font-black text-slate-700">{source.confidence}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div className="p-8 bg-indigo-900 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Zap size={40} />
                </div>
                <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-6">Algoritmo de Ajuste</h4>
                <div className="bg-white/10 p-4 rounded-2xl border border-white/10 font-mono text-xs mb-6">
                  X_ajustado = X_rep * (1 - sesgo) * ICR
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-indigo-300 uppercase">Dato Reportado</p>
                      <p className="text-2xl font-black">{currentRecord.reportado}</p>
                    </div>
                    <ArrowRight className="text-indigo-400 mb-1" />
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-300 uppercase">Dato Ajustado</p>
                      <p className="text-2xl font-black text-emerald-400">{currentRecord.ajustado}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-[10px] text-indigo-200 italic">
                      *Ajuste del {currentRecord.ajuste}% basado en ICR {currentRecord.icr} y sesgo histórico {currentRecord.sesgo}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 9. CONTROL SIX SIGMA INDICATORS */}
        <div className="bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl">
          <h3 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
            <BarChart3 className="text-indigo-400" /> Control Six Sigma
          </h3>
          <div className="space-y-8">
            <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">ICR Promedio Nacional</p>
              <p className="text-3xl font-black text-indigo-400">0.78</p>
              <div className="mt-4 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500" style={{ width: '78%' }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">DPMO Evento</p>
                <p className="text-lg font-black text-rose-400">12,450</p>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Sigma Territ.</p>
                <p className="text-lg font-black text-emerald-400">4.2 σ</p>
              </div>
            </div>
            <div className="p-6 bg-indigo-600 rounded-3xl">
              <p className="text-[10px] font-black uppercase mb-2">Variación Intermunicipal</p>
              <p className="text-sm font-bold leading-relaxed">
                Reducción del 22% en la varianza de reportes tras implementación del ICR.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 6 & 10. TRAZABILIDAD Y AUDITORÍA */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div>
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Fingerprint className="text-indigo-600" /> Trazabilidad y Auditoría Forense
            </h3>
            <p className="text-slate-500 text-sm mt-1">Capacidad de reconstrucción de cifras y validación presupuestal.</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar ID o Municipio..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 w-64"
              />
            </div>
            <button className="p-2 bg-slate-100 rounded-xl text-slate-600 hover:bg-slate-200 transition-colors">
              <Filter size={18} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">ID Único</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Municipio</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Fecha</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Fuente / Versión</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">ICR</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Ajuste %</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Estado</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase">Acción</th>
              </tr>
            </thead>
            <tbody>
              {auditData.map((record) => (
                <tr 
                  key={record.id} 
                  className={`border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${selectedRecord === record.id ? 'bg-indigo-50/50' : ''}`}
                  onClick={() => setSelectedRecord(record.id)}
                >
                  <td className="py-6 font-mono text-xs font-bold text-indigo-600">{record.id}</td>
                  <td className="py-6 text-sm font-black text-slate-800">{record.municipio}</td>
                  <td className="py-6 text-xs text-slate-500 font-medium">{record.fecha}</td>
                  <td className="py-6">
                    <p className="text-xs font-bold text-slate-700">{record.fuente}</p>
                    <p className="text-[10px] text-slate-400">{record.version}</p>
                  </td>
                  <td className="py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${record.icr > 0.7 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className="text-sm font-black text-slate-800">{record.icr}</span>
                    </div>
                  </td>
                  <td className="py-6 text-sm font-black text-rose-600">{record.ajuste}%</td>
                  <td className="py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${record.status === 'Validado' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="py-6">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-400 hover:text-indigo-600">
                      <FileSearch size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7 & 8. INTEGRACIÓN RIESGO Y FINANZAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="p-10 bg-emerald-900 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <Activity size={60} />
          </div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tight">
            Integración con Riesgo
          </h3>
          <div className="space-y-6">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-emerald-300 uppercase mb-2">Fórmula de Daño Final</p>
              <p className="text-xl font-mono font-bold">Daño_final = Daño_estimado * ICR</p>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              El modelo de riesgo ajusta la severidad del impacto basándose en la coherencia del dato. Un ICR bajo reduce automáticamente la magnitud del daño estimado para prevenir sobre-estimaciones.
            </p>
          </div>
        </div>

        <div className="p-10 bg-indigo-600 rounded-[3.5rem] text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <DollarSign size={60} />
          </div>
          <h3 className="text-xl font-black mb-6 flex items-center gap-3 uppercase tracking-tight">
            Integración con Finanzas
          </h3>
          <div className="space-y-6">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10">
              <p className="text-[10px] font-black text-indigo-200 uppercase mb-2">Función de Asignación</p>
              <p className="text-xl font-mono font-bold">Recurso = f(Daño_ajustado, ICR, Riesgo)</p>
            </div>
            <p className="text-xs text-indigo-100 leading-relaxed">
              La liberación presupuestal es una función multivariable. El ICR actúa como el principal "gatekeeper" fiscal: a mayor coherencia, mayor celeridad en el giro.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
