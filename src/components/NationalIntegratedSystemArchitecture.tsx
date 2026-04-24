import React from 'react';
import { 
  Database, 
  ShieldCheck, 
  Activity, 
  DollarSign, 
  Scale, 
  ArrowRight, 
  Layers, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  GitMerge, 
  Users, 
  Landmark,
  Target
} from 'lucide-react';

export const NationalIntegratedSystemArchitecture: React.FC = () => {
  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* System Vision Header */}
      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Landmark size={240} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-500 rounded-lg">
              <Layers size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-300">Arquitectura del Sistema Nacional de Cuantificación</span>
          </div>
          <h2 className="text-5xl font-black mb-6 leading-tight max-w-3xl">
            Ecosistema Integrado de Gestión de Datos y Recursos
          </h2>
          <p className="text-slate-400 max-w-2xl text-xl leading-relaxed">
            Una infraestructura sistémica que garantiza la trazabilidad absoluta desde el reporte territorial hasta la asignación presupuestal, eliminando la discrecionalidad mediante validación estadística y control de calidad industrial.
          </p>
        </div>
      </div>

      {/* The 5 Pillars of the National Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
        {/* Connection Line (Desktop) */}
        <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -z-10" />

        {[
          {
            step: '01',
            title: 'Captura (EDAN)',
            icon: <Database className="text-blue-500" />,
            desc: 'Alimentación desde territorio. Datos crudos de daños y necesidades.',
            color: 'blue',
            role: 'Municipios'
          },
          {
            step: '02',
            title: 'Validación (Six Sigma)',
            icon: <ShieldCheck className="text-purple-500" />,
            desc: 'Control de calidad DMAIC. Reducción de varianza y detección de defectos.',
            color: 'purple',
            role: 'UNGRD Técnica'
          },
          {
            step: '03',
            title: 'Ajuste (Riesgo)',
            icon: <Activity className="text-amber-500" />,
            desc: 'Modelación bayesiana y ponderación por ICR. Inferencia de dato real.',
            color: 'amber',
            role: 'Expertos Riesgo'
          },
          {
            step: '04',
            title: 'Cuantificación (Finanzas)',
            icon: <DollarSign className="text-emerald-500" />,
            desc: 'Valoración económica y fiscal (DRF). Determinación de brecha financiera.',
            color: 'emerald',
            role: 'MinHacienda'
          },
          {
            step: '05',
            title: 'Trazabilidad (Auditoría)',
            icon: <Scale className="text-rose-500" />,
            desc: 'Control permanente y nexo causal. Validación forense del gasto.',
            color: 'rose',
            role: 'Contraloría / Auditoría'
          }
        ].map((item, i) => (
          <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative">
            <div className={`absolute -top-3 -left-3 w-8 h-8 bg-${item.color}-600 text-white rounded-full flex items-center justify-center text-[10px] font-black z-10 shadow-lg`}>
              {item.step}
            </div>
            <div className="mb-4 p-3 bg-slate-50 rounded-2xl w-fit group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <h4 className="text-lg font-black text-slate-900 mb-2">{item.title}</h4>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">{item.desc}</p>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Responsable</p>
              <p className="text-[11px] font-bold text-slate-700">{item.role}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Governance & Rules Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Governance Model */}
        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Users className="text-indigo-600" /> Gobernanza Institucional
          </h3>
          <div className="space-y-6">
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                <Target className="text-indigo-600" />
              </div>
              <div>
                <h5 className="font-black text-slate-800 uppercase text-sm">Comité de Validación de Datos (CVD)</h5>
                <p className="text-xs text-slate-500 mt-1">Órgano colegiado encargado de aprobar los factores de ajuste estadístico y el ICR nacional.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Landmark className="text-emerald-600" />
              </div>
              <div>
                <h5 className="font-black text-slate-800 uppercase text-sm">Mesa de Coordinación Financiera</h5>
                <p className="text-xs text-slate-500 mt-1">Sincronización entre UNGRD y MinHacienda para la liberación de recursos basada en hitos de calidad.</p>
              </div>
            </div>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center shrink-0">
                <ShieldCheck className="text-rose-600" />
              </div>
              <div>
                <h5 className="font-black text-slate-800 uppercase text-sm">Unidad de Auditoría Forense en Tiempo Real</h5>
                <p className="text-xs text-slate-500 mt-1">Monitoreo permanente de la trazabilidad del dato para prevenir el riesgo moral y la corrupción.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Usage Rules */}
        <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-200">
          <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Zap className="text-amber-500" /> Reglas de Uso del Dato
          </h3>
          <div className="space-y-4">
            {[
              { rule: 'Unicidad de la Fuente', desc: 'Solo el dato validado por Six Sigma es vinculante para efectos presupuestales.' },
              { rule: 'Inmutabilidad de la Trazabilidad', desc: 'Toda modificación al dato original debe dejar huella digital y justificación técnica.' },
              { rule: 'Transparencia Radical', desc: 'Los modelos de ajuste y sus parámetros son públicos para los entes de control.' },
              { rule: 'Condicionalidad de Calidad', desc: 'No se autorizan giros a municipios con ICR por debajo del umbral crítico (60%).' }
            ].map((r, i) => (
              <div key={i} className="p-4 bg-white rounded-2xl border border-slate-200 flex items-start gap-4">
                <div className="mt-1">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800">{r.rule}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interaction Diagram (Conceptual) */}
      <div className="bg-indigo-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-md">
            <h3 className="text-2xl font-black mb-4">Interacción Sistémica</h3>
            <p className="text-indigo-200 text-sm leading-relaxed">
              El sistema no es lineal, es un lazo de retroalimentación. Los hallazgos de auditoría alimentan los modelos de riesgo para ajustar los pesos futuros, y la cuantificación financiera exige niveles de Six Sigma cada vez más altos.
            </p>
            <button className="mt-8 px-6 py-3 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase hover:bg-indigo-50 transition-all flex items-center gap-2">
              Ver Mapa de Interacciones <ArrowRight size={16} />
            </button>
          </div>
          <div className="flex-1 w-full max-w-lg">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="text-3xl font-black text-indigo-400">99.9%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Trazabilidad</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="text-3xl font-black text-emerald-400">0.5%</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Margen de Error</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="text-3xl font-black text-amber-400">Real-Time</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Sincronización</p>
              </div>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10 text-center">
                <p className="text-3xl font-black text-rose-400">Audit-Ready</p>
                <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
