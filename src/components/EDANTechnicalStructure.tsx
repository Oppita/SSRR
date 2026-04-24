import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Activity, 
  Target, 
  Scale, 
  ArrowRight, 
  Database, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Info,
  Layers,
  Landmark,
  BarChart3
} from 'lucide-react';

export const EDANTechnicalStructure: React.FC = () => {
  return (
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* 1. INTRODUCCIÓN */}
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <FileText size={240} />
        </div>
        
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Info size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs text-indigo-600">Estructura Técnica EDAN v2.0</span>
          </div>
          
          <h2 className="text-5xl font-black text-slate-900 mb-8 leading-tight">
            Marco Normativo y Justificación Técnica
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle size={14} className="text-rose-500" /> Justificación del Cambio
              </h4>
              <div className="space-y-4">
                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100">
                  <p className="text-sm font-bold text-rose-900 mb-2">Variabilidad Territorial</p>
                  <p className="text-xs text-rose-700 leading-relaxed">
                    Se ha detectado una varianza inaceptable en los reportes municipales, con desviaciones de hasta el 400% entre el reporte inicial y la validación técnica.
                  </p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                  <p className="text-sm font-bold text-slate-900 mb-2">Observaciones de la CGR</p>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    La Contraloría General de la República exige mecanismos de control que eviten el riesgo moral y garanticen la transparencia en la asignación de recursos.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Target size={14} className="text-emerald-500" /> Objetivo Estratégico
              </h4>
              <p className="text-lg text-slate-600 leading-relaxed font-medium">
                Implementar un sistema de gestión de datos basado en <span className="text-indigo-600 font-black">Six Sigma</span> que garantice:
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Confiabilidad', desc: 'Datos validados estadísticamente.' },
                  { label: 'Trazabilidad', desc: 'Huella digital de cada modificación.' },
                  { label: 'Auditabilidad', desc: 'Preparado para control fiscal inmediato.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-emerald-900 uppercase">{item.label}</p>
                      <p className="text-[10px] text-emerald-700">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEFINICIÓN DEL PROCESO EDAN */}
      <div className="space-y-8 text-center">
        <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Flujo de Proceso Integrado</h3>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-4">
          {[
            { title: 'Captura Municipal', icon: <Database />, color: 'blue' },
            { title: 'Validación Técnica', icon: <ShieldCheck />, color: 'purple' },
            { title: 'Ajuste Estadístico', icon: <Activity />, color: 'amber' },
            { title: 'Consolidación', icon: <Zap />, color: 'indigo' },
            { title: 'Uso Fiscal', icon: <Scale />, color: 'emerald' }
          ].map((step, i) => (
            <React.Fragment key={i}>
              <div className={`w-full lg:w-48 p-6 bg-white rounded-[2rem] border-2 border-slate-100 shadow-sm hover:border-${step.color}-500 transition-all group`}>
                <div className={`mb-4 p-3 bg-${step.color}-50 rounded-2xl w-fit mx-auto text-${step.color}-600 group-hover:scale-110 transition-transform`}>
                  {step.icon}
                </div>
                <p className="text-xs font-black text-slate-800 uppercase leading-tight">{step.title}</p>
              </div>
              {i < 4 && <ArrowRight className="hidden lg:block text-slate-300" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. MÓDULO DE CALIDAD DEL DATO */}
      <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-12 opacity-10 pointer-events-none">
          <Layers size={200} />
        </div>
        
        <div className="relative z-10">
          <h3 className="text-3xl font-black mb-12 flex items-center gap-4">
            <Zap className="text-indigo-400" /> Módulo de Calidad del Dato (ICR)
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Classification Table */}
            <div className="space-y-8">
              <h4 className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em]">3.2 Clasificación de Municipios</h4>
              <div className="space-y-4">
                {[
                  { type: 'Tipo A', range: 'ICR ≥ 0.9', label: 'Alta Confiabilidad', color: 'emerald', rule: 'Uso directo para giros' },
                  { type: 'Tipo B', range: '0.7 – 0.89', label: 'Confiable', color: 'indigo', rule: 'Ajuste leve mediante modelos' },
                  { type: 'Tipo C', range: '0.5 – 0.69', label: 'Baja Confiabilidad', color: 'amber', rule: 'Ajuste obligatorio y auditoría' },
                  { type: 'Tipo D', range: '< 0.5', label: 'No Confiable', color: 'rose', rule: 'Bloqueo. Requiere validación externa' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-6 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                    <div className={`w-16 h-16 rounded-2xl bg-${item.color}-500/20 flex items-center justify-center text-${item.color}-400 font-black text-xl border border-${item.color}-500/30`}>
                      {item.type.split(' ')[1]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-sm font-black">{item.label}</p>
                        <span className={`text-[10px] font-black text-${item.color}-400 uppercase`}>{item.range}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.rule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage Rules & Logic */}
            <div className="space-y-8">
              <h4 className="text-xs font-black text-indigo-300 uppercase tracking-[0.3em]">3.3 Reglas de Uso del Dato</h4>
              <div className="bg-white/5 p-8 rounded-[2.5rem] border border-white/10 h-full">
                <div className="space-y-8">
                  <div className="flex gap-6">
                    <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 h-fit">
                      <BarChart3 size={24} />
                    </div>
                    <div>
                      <h5 className="font-black text-sm uppercase mb-2">Vinculación Presupuestal</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        El ICR actúa como un multiplicador de confianza. Ningún recurso se libera sin una validación de coherencia mínima del 50%.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400 h-fit">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h5 className="font-black text-sm uppercase mb-2">Validación Externa Obligatoria</h5>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Los municipios Tipo D son marcados automáticamente para intervención de la UNGRD Nacional y auditoría de campo.
                      </p>
                    </div>
                  </div>
                  <div className="mt-8 p-6 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/50">
                    <p className="text-[10px] font-black uppercase mb-2">Nota de Gobernanza</p>
                    <p className="text-xs italic text-indigo-100">
                      "Este módulo elimina la discrecionalidad política en la asignación de recursos, supeditando el flujo financiero a la calidad técnica del reporte territorial."
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
