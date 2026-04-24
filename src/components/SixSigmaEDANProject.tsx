import React from 'react';
import { Target, Users, ShieldCheck, AlertCircle, GitBranch, BarChart3, CheckCircle2, FileText, Scale, Zap, Info } from 'lucide-react';

export const SixSigmaEDANProject: React.FC = () => {
  const clients = [
    { name: 'UNGRD', need: 'Precisión Técnica', impact: 'Garantiza que la respuesta operativa sea proporcional al daño real.' },
    { name: 'MinHacienda (MHCP)', need: 'Sostenibilidad Fiscal', impact: 'Evita la sobreasignación de recursos y protege el presupuesto nacional.' },
    { name: 'Contraloría General', need: 'Transparencia y Auditoría', impact: 'Reduce el riesgo de hallazgos fiscales y detrimento patrimonial.' }
  ];

  const ctqs = [
    { label: 'Exactitud (Accuracy)', spec: 'EMT < 10%', desc: 'Error de Medición Territorial debe ser inferior al 10% respecto a la validación paramétrica.' },
    { label: 'Oportunidad (Timeliness)', spec: '< 72 Horas', desc: 'Tiempo transcurrido desde el reporte municipal hasta la validación nacional.' },
    { label: 'Integridad (Completeness)', spec: '100% RUNAPE', desc: 'Todos los registros deben contar con ID de activo verificado en RUNAPE.' },
    { label: 'Trazabilidad (Traceability)', spec: 'Nexo Causal 1:1', desc: 'Evidencia digital que vincule el daño específicamente con el evento declarado.' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      {/* Project Charter Header */}
      <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Target size={180} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="px-3 py-1 bg-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-full">
              Six Sigma Project Charter • Green/Black Belt Level
            </div>
          </div>
          <h2 className="text-4xl font-black mb-4 leading-tight">
            Optimización de la Calidad del Dato en el Proceso EDAN
          </h2>
          <p className="text-slate-400 max-w-3xl font-medium text-lg">
            Reducción de la variabilidad y eliminación de defectos en la cuantificación de daños para garantizar la eficiencia del gasto público en desastres.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 1. Definición del Problema */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3 uppercase tracking-tight">
              <AlertCircle size={24} className="text-rose-600" /> 1. Definición del Problema (Variabilidad y Defectos)
            </h3>
            <div className="space-y-6">
              <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                <p className="text-sm text-rose-900 leading-relaxed">
                  El proceso actual de reporte EDAN presenta una <strong>variabilidad descontrolada (σ {'>'} 3.0)</strong> debido a la captura manual y el sesgo operativo en los municipios. Esto genera un alto volumen de <strong>defectos</strong>: registros con sobreestimaciones superiores al 50%, falta de georreferenciación y ausencia de nexo causal.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Métrica Base (Baseline)</h4>
                  <p className="text-2xl font-black text-slate-800">42% EMT</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Error de Medición Territorial promedio actual.</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Nivel Sigma Actual</h4>
                  <p className="text-2xl font-black text-rose-600">1.8 σ</p>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">Proceso altamente inestable con alta tasa de defectos.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Alcance del Proceso */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3 uppercase tracking-tight">
              <GitBranch size={24} className="text-indigo-600" /> 5. Alcance del Proceso (SIPAE a MHCP)
            </h3>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
              <div className="space-y-8">
                {[
                  { step: 'Inicio', label: 'Reporte Municipal (SIPAE)', desc: 'Captura de datos EDAN por coordinadores locales de gestión del riesgo.' },
                  { step: 'Proceso', label: 'Validación Nacional (UNGRD)', desc: 'Aplicación de filtros Six Sigma y funciones de daño paramétricas.' },
                  { step: 'Proceso', label: 'Certificación Fiscal', desc: 'Asignación de ID de trazabilidad y validación de nexo causal.' },
                  { step: 'Fin', label: 'Asignación de Recursos (MHCP)', desc: 'Giro de fondos basado en cifras validadas y auditables.' }
                ].map((s, i) => (
                  <div key={i} className="relative pl-12">
                    <div className="absolute left-0 top-1 w-8 h-8 bg-white border-4 border-indigo-600 rounded-full flex items-center justify-center z-10">
                      <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                    </div>
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase">{s.label}</h4>
                        <p className="text-xs text-slate-500 mt-1">{s.desc}</p>
                      </div>
                      <span className="text-[10px] font-black text-slate-300 uppercase">{s.step}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: Clients & CTQs */}
        <div className="space-y-6">
          {/* 2. Identificación de Clientes */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2 uppercase tracking-tight">
              <Users size={20} className="text-indigo-600" /> 2. Clientes del Proceso
            </h3>
            <div className="space-y-4">
              {clients.map((c, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-xs font-black text-slate-800">{c.name}</h4>
                    <span className="px-2 py-0.5 bg-indigo-100 text-[8px] font-black text-indigo-600 rounded-full uppercase tracking-tighter">Voz del Cliente</span>
                  </div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1">{c.need}</p>
                  <p className="text-[11px] text-slate-500 leading-tight">{c.impact}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. CTQs (Critical to Quality) */}
          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-6 flex items-center gap-2 uppercase tracking-tight">
              <ShieldCheck size={20} className="text-emerald-400" /> 3. CTQs del Sistema
            </h3>
            <div className="space-y-4">
              {ctqs.map((q, i) => (
                <div key={i} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-xs font-black text-indigo-200 uppercase">{q.label}</h4>
                    <span className="text-[10px] font-black text-emerald-400 font-mono">{q.spec}</span>
                  </div>
                  <p className="text-[10px] text-white/60 leading-tight">{q.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. Definición de Defecto */}
          <div className="bg-rose-50 p-8 rounded-[2.5rem] border border-rose-100">
            <h3 className="text-lg font-black text-rose-800 mb-4 flex items-center gap-2 uppercase tracking-tight">
              <Zap size={20} /> 4. Definición de "Defecto"
            </h3>
            <p className="text-[11px] text-rose-700 leading-relaxed font-medium mb-4">
              En el contexto EDAN, un <strong>defecto</strong> se define como cualquier registro que no cumpla con al menos uno de los CTQs definidos.
            </p>
            <ul className="space-y-2">
              {[
                'Reporte sin ID de RUNAPE válido.',
                'EMT > 20% (Sobreestimación fuera de rango).',
                'Falta de evidencia fotográfica georreferenciada.',
                'Inconsistencia en el nexo causal (Evento vs Daño).'
              ].map((d, i) => (
                <li key={i} className="flex items-center gap-2 text-[10px] font-bold text-rose-900">
                  <div className="w-1 h-1 bg-rose-400 rounded-full" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
