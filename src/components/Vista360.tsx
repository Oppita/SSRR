import React, { useMemo, useState } from 'react';
import { ProjectData, Contract, Otrosie, ProjectDocument } from '../types';
import { useProject } from '../store/ProjectContext';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle2, FileText, 
  Activity, ArrowRight, ShieldAlert, FileWarning, Search,
  DollarSign, Users, Briefcase, FolderOpen, ChevronDown, ChevronUp,
  TrendingDown, TrendingUp, MapPin, Building2, ArrowLeft, Globe,
  ShieldCheck, Shield, Lock, Unlock, Scale, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';

interface Vista360Props {
  project: ProjectData;
  onBack: () => void;
}

export const Vista360: React.FC<Vista360Props> = ({ project: data, onBack }) => {
  const { state } = useProject();
  const { project, contracts, otrosies, avances, alerts, presupuesto, pagos = [], documents = [], riesgos = [], polizas = [] } = data;
  
  const convenio = useMemo(() => {
    return state.convenios.find(c => c.id === project.convenioId);
  }, [state.convenios, project.convenioId]);

  const policyStats = useMemo(() => {
    const projectPolicies = polizas.filter(p => p.id_proyecto === project.id);
    const totalAsegurado = projectPolicies.reduce((sum, p) => sum + (p.valor_asegurado || 0), 0);
    const totalContratado = contracts.reduce((sum, c) => sum + (c.valor || 0), 0);
    const riesgoDescubierto = Math.max(0, totalContratado - totalAsegurado);
    const porcentajeCobertura = totalContratado > 0 ? (totalAsegurado / totalContratado) * 100 : 0;
    
    const activePolicies = projectPolicies.filter(p => p.estado === 'Vigente');
    const expiredPolicies = projectPolicies.filter(p => p.estado === 'Vencida');
    const unapprovedPolicies = projectPolicies.filter(p => !p.interventoria_valida);
    
    const complianceLaw1523 = projectPolicies.every(p => p.validacion_ia?.cumplimiento_ley_1523?.cumple);

    // Histórico de pólizas para timeline
    const history = [...projectPolicies].sort((a, b) => 
      new Date(a.fecha_expedicion).getTime() - new Date(b.fecha_expedicion).getTime()
    );

    // Evolución de cobertura para gráfico
    const evolution = history.map(p => ({
      fecha: p.fecha_expedicion,
      valor: p.valor_asegurado,
      tipo: p.tipo_amparo
    }));

    return {
      totalAsegurado,
      riesgoDescubierto,
      porcentajeCobertura,
      activeCount: activePolicies.length,
      expiredCount: expiredPolicies.length,
      unapprovedCount: unapprovedPolicies.length,
      complianceLaw1523,
      policies: projectPolicies,
      history,
      evolution
    };
  }, [polizas, project.id, contracts]);

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section);
  };

  // 1. Timeline Dinámico & Cronograma (Gantt Real)
  const timelineData = useMemo(() => {
    const events: any[] = [];
    
    // Hitos del proyecto
    events.push({ id: 'inicio', date: project.fechaInicio, type: 'Hito', title: 'Inicio del Proyecto', color: 'bg-emerald-500' });
    events.push({ id: 'fin', date: project.fechaFin, type: 'Hito', title: 'Fin Programado', color: 'bg-indigo-500' });

    // Contratos
    contracts.forEach(c => {
      if (c.fechaInicio) {
        events.push({ id: `c-${c.id}`, date: c.fechaInicio, type: 'Contrato', title: `Firma ${c.tipo}: ${c.numero}`, color: 'bg-blue-500', contract: c });
      }
    });

    // Otrosíes
    otrosies.forEach(o => {
      events.push({ id: `o-${o.id}`, date: o.fechaFirma, type: 'Otrosí', title: `Otrosí ${o.numero} (+${o.plazoAdicionalMeses} meses)`, color: 'bg-amber-500', otrosi: o });
    });

    // Actas de Comité
    if (data.actasComite) {
      data.actasComite.forEach(a => {
        events.push({ id: `a-${a.id}`, date: a.fecha, type: 'Acta Comité', title: `Acta Comité ${a.numero}`, color: 'bg-purple-500', acta: a });
      });
    }

    // Suspensiones
    if (data.suspensiones) {
      data.suspensiones.forEach(s => {
        events.push({ id: `s-${s.id}`, date: s.fechaInicio, type: 'Suspensión', title: `Suspensión: ${s.justificacion.substring(0, 30)}...`, color: 'bg-rose-500', suspension: s });
      });
    }

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [project, contracts, otrosies, data.actasComite, data.suspensiones]);

  // Cálculo dinámico de plazos
  const contratosConPlazoDinamico = useMemo(() => {
    return contracts.map(c => {
      const otrosiesDelContrato = otrosies.filter(o => o.contractId === c.id);
      const mesesAdicionales = otrosiesDelContrato.reduce((sum, o) => sum + (o.plazoAdicionalMeses || 0), 0);
      const valorAdicional = otrosiesDelContrato.reduce((sum, o) => sum + (o.valorAdicional || 0), 0);
      
      return {
        ...c,
        plazoTotalMeses: c.plazoMeses + mesesAdicionales,
        valorTotal: c.valor + valorAdicional,
        otrosies: otrosiesDelContrato
      };
    });
  }, [contracts, otrosies]);

  // 2. Estado Actual
  const estadoActual = useMemo(() => {
    const today = new Date();
    const endDate = new Date(project.fechaFin);
    const isPastEnd = today > endDate;
    const hasSuspensionAlert = alerts.some(a => a.tipo === 'Incumplimiento' && (a.descripcion || '').toLowerCase().includes('suspen'));
    
    let state = 'En ejecución real';
    let color = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    let icon = <Activity className="text-emerald-500" />;

    if (project.avanceFisico === 100) {
      state = 'Finalizado';
      color = 'text-blue-600 bg-blue-50 border-blue-200';
      icon = <CheckCircle2 className="text-blue-500" />;
    } else if (hasSuspensionAlert) {
      state = 'Suspendido';
      color = 'text-rose-600 bg-rose-50 border-rose-200';
      icon = <ShieldAlert className="text-rose-500" />;
    } else if (isPastEnd || project.avanceFisico < project.avanceProgramado - 15) {
      state = 'Retrasado Crítico';
      color = 'text-rose-600 bg-rose-50 border-rose-200';
      icon = <AlertTriangle className="text-rose-500" />;
    } else if (project.avanceFisico < project.avanceProgramado - 5) {
      state = 'Retrasado Leve';
      color = 'text-amber-600 bg-amber-50 border-amber-200';
      icon = <Clock className="text-amber-500" />;
    }

    const desviacion = project.avanceProgramado - project.avanceFisico;

    return { state, color, icon, desviacion };
  }, [project, alerts]);

  // 3. Financiero
  const financiero = useMemo(() => {
    const totalPagado = pagos.reduce((sum, p) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0);
    const totalContratado = contratosConPlazoDinamico.reduce((sum, c) => sum + c.valorTotal, 0);
    const valorConvenio = convenio ? convenio.valorTotal : totalContratado;
    const saldoPorContratar = valorConvenio - totalContratado;
    const saldoPorPagar = totalContratado - totalPagado;
    const porcentajePagado = totalContratado > 0 ? (totalPagado / totalContratado) * 100 : 0;
    const porcentajeContratado = valorConvenio > 0 ? (totalContratado / valorConvenio) * 100 : 0;

    return { totalPagado, totalContratado, valorConvenio, saldoPorContratar, saldoPorPagar, porcentajePagado, porcentajeContratado };
  }, [pagos, contratosConPlazoDinamico, convenio]);

  // 5. Documentos Relacionados
  const documentosAgrupados = useMemo(() => {
    const agrupados: Record<string, ProjectDocument[]> = {
      'Contratos': [],
      'Otrosíes': [],
      'Informes': [],
      'Financieros': [],
      'Otros': []
    };

    documents.forEach(doc => {
      if (doc.tipo === 'Contrato' || doc.tipo === 'Acta') agrupados['Contratos'].push(doc);
      else if (doc.tipo === 'Otrosí') agrupados['Otrosíes'].push(doc);
      else if (doc.tipo === 'Informe') agrupados['Informes'].push(doc);
      else if (doc.tipo === 'CDP' || doc.tipo === 'RC' || doc.tipo === 'Factura' || doc.tipo === 'Soporte de Pago') agrupados['Financieros'].push(doc);
      else agrupados['Otros'].push(doc);
    });

    return agrupados;
  }, [documents]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded uppercase tracking-wider">
                Vista 360°
              </span>
              <span className="text-slate-400 text-sm">•</span>
              <span className="text-slate-500 text-sm">{project.id}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{project.nombre}</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Panel */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="text-indigo-400" size={28} />
                  <h2 className="text-2xl font-bold">Vista 360° del Proyecto</h2>
                </div>
                <p className="text-indigo-200 max-w-2xl">
                  Panel interactivo con análisis cruzado de documentos, estado real, cronograma dinámico y alertas.
                </p>
              </div>
              
              {convenio && (
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 min-w-[300px]">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Convenio Marco Asociado</div>
                  <div className="text-lg font-bold text-white mb-1">{convenio.numero}</div>
                  <div className="text-sm text-indigo-100 mb-3 line-clamp-1">{convenio.nombre}</div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[10px] text-indigo-300 uppercase">Valor Total Convenio</div>
                      <div className="text-xl font-black text-emerald-400">{formatCurrency(convenio.valorTotal)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-indigo-300 uppercase">Estado</div>
                      <div className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/30 uppercase">
                        {convenio.estado}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 2. Estado Actual (Left Column) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-500" />
                  Estado Actual
                </h3>
                
                <div className={`flex items-center gap-4 p-4 rounded-xl border mb-6 ${estadoActual.color}`}>
                  <div className="p-3 bg-white rounded-full shadow-sm">
                    {estadoActual.icon}
                  </div>
                  <div>
                    <div className="text-xs font-bold opacity-80 uppercase tracking-wider">Estado Detectado</div>
                    <div className="text-xl font-black">{estadoActual.state}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Avance Físico Real</span>
                      <span className="font-bold text-slate-900">{project.avanceFisico}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${project.avanceFisico}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Avance Programado</span>
                      <span className="font-bold text-slate-900">{project.avanceProgramado}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-slate-400 h-2 rounded-full" style={{ width: `${project.avanceProgramado}%` }}></div>
                    </div>
                  </div>
                  
                  {estadoActual.desviacion > 0 && (
                    <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-100 mt-2">
                      <TrendingDown size={16} />
                      <span className="font-medium">Desviación del {estadoActual.desviacion.toFixed(1)}% respecto al cronograma.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. Alertas */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-rose-500" />
                  Alertas y Riesgos
                </h3>
                <div className="space-y-3">
                  {policyStats.riesgoDescubierto > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-rose-100 bg-rose-50/50">
                      <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-rose-900">Riesgo No Asegurado</div>
                        <div className="text-xs text-rose-700 mt-0.5">
                          Faltan {formatCurrency(policyStats.riesgoDescubierto)} por asegurar.
                        </div>
                      </div>
                    </div>
                  )}
                  {policyStats.expiredCount > 0 && (
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-100 bg-amber-50/50">
                      <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-sm font-bold text-amber-900">Pólizas Vencidas</div>
                        <div className="text-xs text-amber-700 mt-0.5">
                          Hay {policyStats.expiredCount} pólizas que requieren renovación.
                        </div>
                      </div>
                    </div>
                  )}
                  {alerts.filter(a => a.estado === 'Abierta').length > 0 ? (
                    alerts.filter(a => a.estado === 'Abierta').map(a => (
                      <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl border border-rose-100 bg-rose-50/50">
                        <AlertTriangle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-bold text-rose-900">{a.tipo}</div>
                          <div className="text-xs text-rose-700 mt-0.5">{a.descripcion}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                      <CheckCircle2 size={16} />
                      No hay alertas activas.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Middle & Right Columns */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 3. Financiero */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-500" />
                  Ejecución Financiera
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium mb-1">Valor Convenio</div>
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(financiero.valorConvenio)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="text-xs text-slate-500 font-medium mb-1">Total Contratado</div>
                    <div className="text-sm font-bold text-slate-900">{formatCurrency(financiero.totalContratado)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                    <div className="text-xs text-indigo-600 font-medium mb-1">Saldo por Contratar</div>
                    <div className="text-sm font-bold text-indigo-700">{formatCurrency(financiero.saldoPorContratar)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                    <div className="text-xs text-emerald-600 font-medium mb-1">Pagos Realizados</div>
                    <div className="text-sm font-bold text-emerald-700">{formatCurrency(financiero.totalPagado)}</div>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                    <div className="text-xs text-amber-600 font-medium mb-1">Saldo por Pagar</div>
                    <div className="text-sm font-bold text-amber-700">{formatCurrency(financiero.saldoPorPagar)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Ejecución Presupuestal (Pagos vs Contratado)</span>
                      <span className="font-bold text-slate-900">{financiero.porcentajePagado.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${financiero.porcentajePagado}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Compromiso Presupuestal (Contratado vs Convenio)</span>
                      <span className="font-bold text-slate-900">{financiero.porcentajeContratado.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${financiero.porcentajeContratado}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cobertura y Riesgo Asegurador */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck size={20} className="text-indigo-500" />
                    Cobertura y Riesgo Asegurador
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    policyStats.porcentajeCobertura >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    policyStats.porcentajeCobertura >= 50 ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {policyStats.porcentajeCobertura >= 100 ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    {policyStats.porcentajeCobertura.toFixed(1)}% Cobertura
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="text-xs text-slate-500 font-medium mb-1 uppercase tracking-wider">Valor Total Asegurado</div>
                      <div className="text-xl font-black text-slate-900">{formatCurrency(policyStats.totalAsegurado)}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <div className="text-xs text-rose-600 font-medium mb-1 uppercase tracking-wider">Riesgo Financiero Expuesto</div>
                      <div className="text-xl font-black text-rose-700">{formatCurrency(policyStats.riesgoDescubierto)}</div>
                    </div>
                    
                    {/* Evolución de Cobertura Chart */}
                    <div className="h-48 w-full mt-4">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Evolución de Cobertura</div>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={policyStats.evolution}>
                          <defs>
                            <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="fecha" 
                            hide 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            formatter={(value: number) => [formatCurrency(value), 'Valor Asegurado']}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="valor" 
                            stroke="#6366f1" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#colorValor)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-indigo-600 font-medium uppercase tracking-wider">Cumplimiento Ley 1523</div>
                        {policyStats.complianceLaw1523 ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={16} className="text-rose-500" />
                        )}
                      </div>
                      <div className="text-sm font-bold text-indigo-900">
                        {policyStats.complianceLaw1523 ? 'Cumple Normativa de Gestión del Riesgo' : 'Inconsistencias con Ley 1523 detectadas'}
                      </div>
                      <p className="text-[10px] text-indigo-500 mt-1">
                        Validación automática de amparos obligatorios para proyectos de infraestructura y desastres.
                      </p>
                    </div>
                    
                    {/* Histórico Timeline */}
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Histórico de Pólizas</div>
                      {policyStats.history.map((p, idx) => (
                        <div key={p.id} className="relative pl-6 pb-4 last:pb-0">
                          {idx !== policyStats.history.length - 1 && (
                            <div className="absolute left-[7px] top-4 bottom-0 w-px bg-slate-200" />
                          )}
                          <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                          <div className="text-[10px] font-bold text-indigo-600 mb-0.5">{p.fecha_expedicion}</div>
                          <div className="text-xs font-bold text-slate-900">{p.tipo_amparo}</div>
                          <div className="text-[10px] text-slate-500">Póliza: {p.numero_poliza} - {p.entidad_aseguradora}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Detalle de Garantías por Contrato</h4>
                  {contracts.map(contract => {
                    const contractPolicies = policyStats.policies.filter(p => p.id_contrato === contract.id);
                    const isCovered = contractPolicies.some(p => p.estado === 'Vigente');
                    
                    return (
                      <div key={contract.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isCovered ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                            {isCovered ? <Shield size={18} /> : <ShieldAlert size={18} />}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{contract.numero}</div>
                            <div className="text-[10px] text-slate-500">{contract.contratista}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-700">
                              {contractPolicies.length} Pólizas
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {isCovered ? 'Cobertura Activa' : 'Sin Cobertura Vigente'}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-slate-300" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 1. Timeline Dinámico & 4. Cronograma */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-indigo-500" />
                    Línea de Tiempo y Contratos
                  </h3>
                </div>

                <div className="space-y-6">
                  {/* Contratos con Plazo Dinámico */}
                  <div className="grid grid-cols-1 gap-4">
                    {contratosConPlazoDinamico.map(c => (
                      <div key={c.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-300 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                c.tipo === 'Obra' ? 'bg-indigo-100 text-indigo-700' : 
                                c.tipo === 'Interventoría' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {c.tipo}
                              </span>
                              <span className="text-sm font-bold text-slate-900">{c.numero}</span>
                            </div>
                            <div className="text-xs text-slate-500">{c.contratista}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-indigo-600">{formatCurrency(c.valorTotal)}</div>
                            <div className="text-xs text-slate-500">{c.plazoTotalMeses} meses total</div>
                          </div>
                        </div>
                        
                        {/* Visualización de plazo original vs adiciones */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-indigo-400 h-full" 
                            style={{ width: `${(c.plazoMeses / c.plazoTotalMeses) * 100}%` }}
                            title={`Plazo Inicial: ${c.plazoMeses} meses`}
                          ></div>
                          {c.otrosies.map((o, idx) => (
                            <div 
                              key={o.id}
                              className={`${idx % 2 === 0 ? 'bg-amber-400' : 'bg-amber-500'} h-full border-l border-white/30`}
                              style={{ width: `${(o.plazoAdicionalMeses / c.plazoTotalMeses) * 100}%` }}
                              title={`Otrosí ${o.numero}: +${o.plazoAdicionalMeses} meses`}
                            ></div>
                          ))}
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                          <span>Inicio: {c.fechaInicio || 'Pendiente'}</span>
                          {c.otrosies.length > 0 && <span className="text-amber-600 font-medium">+{c.plazoTotalMeses - c.plazoMeses} meses adicionados</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Timeline Events */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-700 mb-4">Hitos y Eventos</h4>
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                      {timelineData.map((event, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${event.color}`} />
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-sm font-bold text-slate-900">{new Date(event.date).toLocaleDateString('es-CO')}</span>
                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {event.type}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{event.title}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 5. Documentos Organizados */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FolderOpen size={20} className="text-indigo-500" />
              Documentos Relacionados
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(documentosAgrupados).map(([grupo, docs]) => (
                <div key={grupo} className="border border-slate-200 rounded-xl overflow-hidden">
                  <button 
                    onClick={() => toggleSection(`docs-${grupo}`)}
                    className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-slate-500" />
                      <span className="font-bold text-slate-700">{grupo}</span>
                      <span className="text-xs bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-500">
                        {docs.length}
                      </span>
                    </div>
                    {expandedSection === `docs-${grupo}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  
                  {expandedSection === `docs-${grupo}` && (
                    <div className="p-2 space-y-1 bg-white border-t border-slate-100">
                      {docs.length > 0 ? (
                        docs.map(doc => (
                          <a 
                            key={doc.id} 
                            href={doc.versiones[0]?.url || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 hover:bg-indigo-50 rounded-lg text-sm text-slate-600 hover:text-indigo-700 transition-colors group"
                          >
                            <FileText size={14} className="text-slate-400 group-hover:text-indigo-500" />
                            <span className="truncate flex-1">{doc.titulo}</span>
                          </a>
                        ))
                      ) : (
                        <div className="p-4 text-center text-sm text-slate-400 italic">
                          No hay documentos
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
