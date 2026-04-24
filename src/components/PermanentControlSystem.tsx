import React, { useMemo } from 'react';
import { ShieldCheck, Lock, RefreshCw, MessageSquare, CheckCircle2, Activity, ArrowRight } from 'lucide-react';

interface DepartmentData {
  id: string;
  name: string;
  municipiosTotal: number;
  edanCompletados: number;
  calidadPromedio: number;
  alertasCriticas: number;
}

const DEPARTAMENTOS_MOCK: DepartmentData[] = [
  { id: '41', name: 'Huila', municipiosTotal: 37, edanCompletados: 28, calidadPromedio: 88, alertasCriticas: 2 },
  { id: '05', name: 'Antioquia', municipiosTotal: 125, edanCompletados: 95, calidadPromedio: 72, alertasCriticas: 14 },
  { id: '08', name: 'Atlántico', municipiosTotal: 23, edanCompletados: 20, calidadPromedio: 91, alertasCriticas: 1 },
  { id: '11', name: 'Bogotá D.C.', municipiosTotal: 1, edanCompletados: 1, calidadPromedio: 98, alertasCriticas: 0 },
  { id: '13', name: 'Bolívar', municipiosTotal: 46, edanCompletados: 30, calidadPromedio: 65, alertasCriticas: 8 },
];

export const PermanentControlSystem: React.FC = () => {
  const globalStats = useMemo(() => {
    const totalMuni = DEPARTAMENTOS_MOCK.reduce((s, d) => s + d.municipiosTotal, 0);
    const totalEdan = DEPARTAMENTOS_MOCK.reduce((s, d) => s + d.edanCompletados, 0);
    const pct = (totalEdan / totalMuni) * 100;
    return { totalMuni, totalEdan, pct };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* 1. Dashboard de Control Permanente */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldCheck size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-500 rounded-lg">
              <RefreshCw size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-emerald-300">Sistema de Control Permanente y Auditoría Continua</span>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Panel de Control de Integridad EDAN
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Cobertura Nacional EDAN</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-emerald-400">{globalStats.pct.toFixed(1)}%</span>
                <span className="text-xs text-slate-500 mb-1 font-bold">{globalStats.totalEdan} / {globalStats.totalMuni} Mun.</span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${globalStats.pct}%` }} />
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Alertas de Calidad (Umbral {'>'} 20%)</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-rose-400">25</span>
                <span className="text-xs text-slate-500 mb-1 font-bold">Casos Críticos</span>
              </div>
              <div className="flex gap-2 mt-4">
                <div className="px-2 py-1 bg-rose-500/20 text-rose-400 text-[9px] font-black rounded-full border border-rose-500/30">BLOQUEO ACTIVO</div>
                <div className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[9px] font-black rounded-full border border-amber-500/30">REVISIÓN PENDIENTE</div>
              </div>
            </div>
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-md">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Nivel de Regresión</p>
              <div className="flex items-end gap-3">
                <span className="text-4xl font-black text-indigo-400">-4.2%</span>
                <span className="text-xs text-slate-500 mb-1 font-bold">Mejora vs Mes Anterior</span>
              </div>
              <p className="text-[10px] text-indigo-300 mt-4 font-bold flex items-center gap-1">
                <CheckCircle2 size={12} /> Auditoría continua en ejecución
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. Reglas de Bloqueo */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
            <Lock size={20} className="text-rose-600" /> Reglas de Bloqueo
          </h3>
          <div className="space-y-4">
            {[
              { rule: 'EMT > 50%', action: 'Bloqueo Financiero', status: 'Activo', color: 'rose' },
              { rule: 'Falta ID RUNAPE', action: 'Rechazo de Registro', status: 'Activo', color: 'rose' },
              { rule: 'Inconsistencia Causal', action: 'Glosa Técnica', status: 'Alerta', color: 'amber' },
              { rule: 'Sin Evidencia GPS', action: 'Devolución a Municipio', status: 'Activo', color: 'rose' }
            ].map((r, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black text-slate-800">{r.rule}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{r.action}</p>
                </div>
                <div className={`px-2 py-0.5 bg-${r.color}-100 text-${r.color}-600 text-[8px] font-black rounded-full border border-${r.color}-200 uppercase`}>
                  {r.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* 3. Retroalimentación */}
          <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <MessageSquare size={20} className="text-indigo-300" /> Retroalimentación
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Última Notificación</p>
                <p className="text-xs italic leading-relaxed">"Municipio de Garzón: Se ha detectado una regresión del 15% en la calidad de georreferenciación. Favor revisar dispositivos de captura."</p>
                <button className="mt-4 text-[10px] font-black text-white uppercase flex items-center gap-1 hover:gap-2 transition-all">
                  Ver Historial de Glosas <ArrowRight size={12} />
                </button>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Incentivo por Calidad</p>
                <p className="text-[11px] text-emerald-100">Municipios con ICR {'>'} 95% acceden a validación express (24h).</p>
              </div>
            </div>
          </div>

          {/* 4. Auditoría Continua */}
          <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Activity size={14} className="text-indigo-500" /> Auditoría Continua
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-full animate-pulse" />
              </div>
              <span className="text-[10px] font-black text-indigo-600 uppercase">LIVE</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Escaneando 1,250 registros/minuto en búsqueda de anomalías.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
