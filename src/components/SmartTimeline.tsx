import React, { useState, useMemo } from 'react';
import { ProjectData } from '../types';
import { 
  Calendar, Clock, AlertTriangle, CheckCircle2, FileText, 
  Activity, ArrowRight, ShieldAlert, FileWarning, Search, BrainCircuit, Filter, X, Layers
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend
} from 'recharts';

interface SmartTimelineProps {
  project: ProjectData;
}

export const SmartTimeline: React.FC<SmartTimelineProps> = ({ project: data }) => {
  const { project, contracts, otrosies, avances, alerts, interventoriaReports, seguimientos, actasComite, suspensiones } = data;
  const [filter, setFilter] = useState<string>('Todos');
  const [phaseFilter, setPhaseFilter] = useState<string>('Todas');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

  // 1. Aggregate all events
  const allEvents = useMemo(() => {
    const events: any[] = [];
    
    // Project start/end
    events.push({ id: 'proj-start', date: project.fechaInicio, type: 'Inicio', desc: 'Firma de Contrato / Acta de Inicio', status: 'completed', docId: null, details: 'Inicio oficial del proyecto según el acta de inicio.', faseId: null });
    events.push({ id: 'proj-end', date: project.fechaFin, type: 'Fin Programado', desc: 'Fecha de terminación actual', status: 'pending', docId: null, details: 'Fecha estimada de finalización del proyecto.', faseId: null });

    // Contracts events
    contracts.forEach(c => {
      events.push({ id: c.id, date: c.fechaInicio || project.fechaInicio, type: 'Contrato', desc: `Contrato ${c.numero}`, status: 'completed', docId: null, critical: false, details: `Objeto: ${c.objetoContractual}\nContratista: ${c.contratista}\nValor: $${c.valor.toLocaleString()}`, faseId: c.faseId });
      c.eventos.forEach(e => {
        events.push({ id: e.id, date: e.fecha, type: e.tipo, desc: e.descripcion, status: 'completed', docId: e.documentoUrl, critical: e.impactoPlazoMeses > 1 || e.impactoValor > 100000000, details: `Impacto en plazo: ${e.impactoPlazoMeses} meses\nImpacto en valor: $${e.impactoValor.toLocaleString()}`, faseId: c.faseId });
      });
    });

    // Otrosíes
    otrosies.forEach(o => {
      const contract = contracts.find(c => c.id === o.contractId);
      events.push({ id: o.id, date: o.fechaFirma, type: 'Otrosí', desc: `Otrosí No. ${o.numero}: ${o.objeto}`, status: 'warning', docId: o.documentoUrl, critical: o.plazoAdicionalMeses > 0 || o.valorAdicional > 0, details: `Justificación Técnica: ${o.justificacionTecnica}\nValor Adicional: $${o.valorAdicional.toLocaleString()}\nPlazo Adicional: ${o.plazoAdicionalMeses} meses`, faseId: contract?.faseId });
    });

    // Reports
    interventoriaReports?.forEach(r => {
      const contract = contracts.find(c => c.id === r.contractId);
      events.push({ id: r.id, date: r.fechaFin, type: 'Informe', desc: `Informe Interventoría Semana ${r.semana}`, status: 'completed', docId: null, critical: false, details: `Observaciones: ${r.observaciones}\nAvance Físico: ${r.obraEjecutadaPct}%`, faseId: contract?.faseId });
    });

    // Seguimientos
    seguimientos.forEach(s => {
      events.push({ id: s.id, date: s.fecha, type: 'Seguimiento', desc: s.descripcion, status: 'completed', docId: null, critical: s.tipo === 'Técnico', details: `Trazabilidad: ${s.trazabilidad || 'N/A'}\nResponsable: ${s.responsable}` });
    });

    // Actas de Comité
    actasComite?.forEach(a => {
      events.push({ 
        id: a.id, 
        date: a.fecha, 
        type: 'Acta Comité', 
        desc: `Acta No. ${a.numero}: ${a.temaCentral}`, 
        status: 'completed', 
        docId: a.documentId, 
        critical: (a.preocupaciones?.length || 0) > 0 || (a.afectacionesGeneradas?.length || 0) > 0,
        details: `Decisiones: ${a.decisiones.join(', ')}\n\nCompromisos: ${a.compromisosNuevos?.map(c => c.descripcion).join(', ') || 'Ninguno'}`,
        faseId: null 
      });
    });

    // Suspensiones
    suspensiones?.forEach(s => {
      events.push({ 
        id: s.id, 
        date: s.fechaInicio, 
        type: 'Suspensión', 
        desc: `Suspensión No. ${s.numero}: ${s.motivo}`, 
        status: 'error', 
        docId: s.documentId, 
        critical: true,
        details: `Justificación: ${s.justificacion}\nPlazo: ${s.plazoMeses || 'N/A'} meses\nFecha Fin: ${s.fechaFin || 'N/A'}`,
        faseId: null 
      });
    });

    // Pólizas
    data.polizas?.forEach(p => {
      const contract = contracts.find(c => c.id === p.id_contrato);
      events.push({ 
        id: `pol-exp-${p.id}`, 
        date: p.fecha_expedicion, 
        type: 'Póliza', 
        desc: `Expedición Póliza ${p.numero_poliza}`, 
        status: 'completed', 
        details: `Aseguradora: ${p.entidad_aseguradora}\nAmparo: ${p.tipo_amparo}\nValor Asegurado: $${p.valor_asegurado.toLocaleString()}\nContrato: ${p.numero_contrato}`,
        faseId: contract?.faseId
      });
      events.push({ 
        id: `pol-end-${p.id}`, 
        date: p.fecha_finalizacion_vigencia, 
        type: 'Póliza', 
        desc: `Vencimiento Póliza ${p.numero_poliza}`, 
        status: new Date(p.fecha_finalizacion_vigencia) < new Date() ? 'error' : 'pending', 
        details: `Fin de vigencia de la garantía de ${p.tipo_amparo}.\nAseguradora: ${p.entidad_aseguradora}`,
        faseId: contract?.faseId
      });
    });

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    let result = allEvents;
    if (filter !== 'Todos') {
      result = result.filter(e => e.type === filter);
    }
    if (phaseFilter !== 'Todas') {
      result = result.filter(e => e.faseId === phaseFilter || e.faseId === null);
    }
    return result;
  }, [allEvents, filter, phaseFilter]);

  // 3. Inactivity detection (simple: > 30 days between events)
  const inactivityPeriods = useMemo(() => {
    const periods = [];
    for (let i = 0; i < allEvents.length - 1; i++) {
      const diff = new Date(allEvents[i+1].date).getTime() - new Date(allEvents[i].date).getTime();
      if (diff > 30 * 24 * 60 * 60 * 1000) {
        periods.push({ start: allEvents[i].date, end: allEvents[i+1].date, duration: Math.floor(diff / (24 * 60 * 60 * 1000)) });
      }
    }
    return periods;
  }, [allEvents]);

  const hasPhases = project.fases && project.fases.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-slate-400" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="text-sm border-none focus:ring-0 bg-transparent">
            <option>Todos</option>
            <option>Inicio</option>
            <option>Contrato</option>
            <option>Otrosí</option>
            <option>Informe</option>
            <option>Seguimiento</option>
            <option>Acta Comité</option>
            <option>Suspensión</option>
            <option>Póliza</option>
          </select>
        </div>
        
        {hasPhases && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <Layers size={18} className="text-slate-400" />
            <select value={phaseFilter} onChange={(e) => setPhaseFilter(e.target.value)} className="text-sm border-none focus:ring-0 bg-transparent">
              <option value="Todas">Todas las Fases</option>
              {project.fases?.map(f => (
                <option key={f.id} value={f.id}>{f.nombre}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Línea de Tiempo Interactiva</h3>
          <div className="relative border-l-2 border-indigo-100 ml-3 space-y-8">
            {filteredEvents.map((event, idx) => {
              const phaseName = hasPhases && event.faseId ? project.fases?.find(f => f.id === event.faseId)?.nombre : null;
              
              return (
                <div 
                  key={idx} 
                  className={`relative pl-6 cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors ${event.critical ? 'border-l-2 border-rose-500' : ''} ${selectedEvent?.id === event.id ? 'bg-indigo-50 border-indigo-200' : ''}`} 
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className={`absolute -left-[11px] top-4 w-5 h-5 rounded-full border-4 border-white ${
                    event.status === 'completed' ? 'bg-emerald-500' :
                    event.status === 'warning' ? 'bg-amber-500' : 'bg-indigo-300'
                  }`} />
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-slate-900">{new Date(event.date).toLocaleDateString()}</span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{event.type}</span>
                    {phaseName && (
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium border border-indigo-100">
                        {phaseName}
                      </span>
                    )}
                    {event.critical && <AlertTriangle size={14} className="text-rose-500" />}
                  </div>
                  <p className="text-sm text-slate-600 font-medium">{event.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Event Details Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={20} className="text-indigo-600" />
              Detalles del Evento
            </h3>
            
            {selectedEvent ? (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                      {selectedEvent.type}
                    </span>
                    <h4 className="font-bold text-slate-900 mt-2">{selectedEvent.desc}</h4>
                  </div>
                  <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar size={16} />
                  <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Información Detallada</h5>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {selectedEvent.details}
                  </p>
                </div>
                
                {selectedEvent.docId && (
                  <button 
                    onClick={() => window.open(selectedEvent.docId, '_blank')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    <FileText size={18} />
                    Ver Documento Original
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Activity size={48} className="mx-auto text-slate-200 mb-4" />
                <p>Selecciona un evento en la línea de tiempo para ver sus detalles.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Inactivity Periods */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Periodos de Inactividad Detectados</h3>
        {inactivityPeriods.length > 0 ? (
          <div className="space-y-2">
            {inactivityPeriods.map((p, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-amber-800 bg-amber-50 p-3 rounded-lg border border-amber-100">
                <AlertTriangle size={16} />
                <span>Inactividad de {p.duration} días entre {new Date(p.start).toLocaleDateString()} y {new Date(p.end).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No se detectaron periodos de inactividad significativos.</p>
        )}
      </div>

      {/* Duration Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-6">Duración: Real vs Planeada</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[{ name: 'Duración (meses)', Planeada: project.matrix?.plazoInicialMesesConvenio || 12, Real: 15 }]} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Planeada" fill="#94a3b8" />
              <Bar dataKey="Real" fill="#f43f5e" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
