import React from 'react';
import { Landmark, GitMerge, ShieldCheck, FileText, Users, Zap, ArrowRight, CheckCircle2, Globe, Database, Activity, Scale, AlertTriangle, BookOpen } from 'lucide-react';

export const NationalPolicyArchitecture: React.FC = () => {
  const institutionalRoles = [
    { entity: 'MinHacienda', role: 'Rectoría Financiera', task: 'Gestión de la Estrategia DRF, activación de CAT DDO y Seguros Soberanos.' },
    { entity: 'UNGRD', role: 'Rectoría Técnica', task: 'Validación de daños (DMAIC), gestión del RUD y coordinación operativa.' },
    { entity: 'DNP', role: 'Planeación Nacional', task: 'Inversión pública resiliente y seguimiento a metas CONPES.' },
    { entity: 'Contraloría', role: 'Vigilancia Fiscal', task: 'Auditoría en tiempo real mediante el Sistema de Trazabilidad Total.' },
    { entity: 'Territorios', role: 'Ejecución y Reporte', task: 'Carga de datos EDAN/RUNAPE y ejecución de recursos locales.' }
  ];

  const technicalPillars = [
    { title: 'Cuantificación Paramétrica', desc: 'Funciones de daño logísticas y Six Sigma para eliminar la subjetividad en el reporte.' },
    { title: 'Gestión de Incertidumbre', desc: 'Modelación Monte Carlo para reportar rangos de confianza (P5-P95) en lugar de cifras únicas.' },
    { title: 'Risk Layering', desc: 'Estrategia de 4 capas: Retención, Contingente, Transferencia y Respaldo Soberano.' },
    { title: 'Trazabilidad Causal', desc: 'Cadena de custodia digital desde el evento climático hasta el pago al contratista.' }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      {/* CONPES Style Header */}
      <div className="bg-white border-4 border-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
          <Landmark size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <div className="px-4 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
              Documento de Política Pública • 2024-2030
            </div>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-yellow-400 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 leading-tight">
            Modelo Nacional de Cuantificación y Gestión Financiera del Riesgo de Desastres
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl font-medium leading-relaxed">
            Lineamiento estratégico para la estandarización técnica, transparencia fiscal y resiliencia económica del Estado Colombiano ante eventos climáticos extremos.
          </p>
        </div>
      </div>

      {/* 1. Arquitectura del Sistema (Flujo Integrado) */}
      <section className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 text-white rounded-lg">
            <GitMerge size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">I. Arquitectura del Ecosistema Integrado</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Flow Connectors (Visual) */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 -z-10" />
          
          {[
            { step: '01', title: 'Detección Técnica', icon: <Zap />, color: 'bg-amber-500', desc: 'Evento Climático + Funciones de Daño DMAIC' },
            { step: '02', title: 'Análisis Fiscal', icon: <Activity />, color: 'bg-indigo-500', desc: 'Impacto Económico + Incertidumbre Monte Carlo' },
            { step: '03', title: 'Activación DRF', icon: <ShieldCheck />, color: 'bg-emerald-500', desc: 'Risk Layering + Seguros Paramétricos' },
            { step: '04', title: 'Cierre y Auditoría', icon: <Scale />, color: 'bg-slate-900', desc: 'Trazabilidad Total + Validación de Anomalías' }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-center space-y-4">
              <div className={`w-12 h-12 ${item.color} text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                {item.icon}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Paso {item.step}</p>
                <h4 className="font-black text-slate-800 text-sm uppercase mb-2">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-tight">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Matriz de Roles Institucionales */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" /> Gobernanza e Institucionalidad
          </h3>
          <div className="space-y-4">
            {institutionalRoles.map((role, i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-400 text-xs shrink-0">
                  {role.entity}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">{role.role}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{role.task}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
              <BookOpen size={24} className="text-emerald-600" /> Pilares Técnicos del Modelo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {technicalPillars.map((pillar, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-black text-slate-800 uppercase mb-2">{pillar.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-tight">{pillar.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-900 p-8 rounded-[2.5rem] text-white shadow-xl">
            <h3 className="text-lg font-black mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" /> Estándar de Adopción Nacional
            </h3>
            <p className="text-sm text-indigo-100 leading-relaxed mb-6">
              Este modelo se establece como el <strong>Estándar Único de Cuantificación (EUC)</strong>. Ninguna solicitud de recursos ante el FNG o MinHacienda será procesada si no cumple con la validación paramétrica y el nexo causal certificado por el sistema.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 w-3/4" />
              </div>
              <span className="text-[10px] font-black uppercase text-indigo-300">Fase de Implementación: 75%</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Flujo de Información y Mecanismos de Adopción */}
      <section className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-3">
              <Database size={28} className="text-indigo-600" /> Flujo de Información Soberana
            </h3>
            <div className="relative pl-8 space-y-8">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-100" />
              
              {[
                { title: 'Captura en Territorio', desc: 'Carga de datos EDAN georreferenciados y sincronizados con RUNAPE.' },
                { title: 'Validación Centralizada', desc: 'Cruce automático con funciones de daño y detección de anomalías por IA.' },
                { title: 'Certificación Fiscal', desc: 'Emisión de Glosa Técnica y asignación de ID de Trazabilidad Total.' },
                { title: 'Desembolso y Auditoría', desc: 'Giro de recursos vía SIIF y monitoreo satelital de avance de obra.' }
              ].map((step, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-10 top-1 w-5 h-5 bg-white border-4 border-indigo-600 rounded-full" />
                  <h4 className="font-black text-slate-800 uppercase text-sm mb-1">{step.title}</h4>
                  <p className="text-sm text-slate-500">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900">Mecanismos de Adopción</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <p className="text-xs text-slate-600"><strong>Decreto Reglamentario:</strong> Obligatoriedad del uso del modelo para entes territoriales.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <p className="text-xs text-slate-600"><strong>Incentivo Fiscal:</strong> Acceso preferencial a líneas de crédito para municipios con 100% de RUNAPE actualizado.</p>
              </div>
              <div className="flex gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <p className="text-xs text-slate-600"><strong>Capacitación Nacional:</strong> Programa de certificación para auditores y gestores de riesgo locales.</p>
              </div>
            </div>
            
            <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 mt-8">
              <FileText size={20} /> DESCARGAR LINEAMIENTO COMPLETO (PDF)
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
