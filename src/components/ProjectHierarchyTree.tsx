import React, { useState, useMemo } from 'react';
import { Project, Contract, ContractEvent, ContractType, Otrosie, Pago, InterventoriaReport } from '../types';
import { useProject } from '../store/ProjectContext';
import { ChevronRight, ChevronDown, FileText, Briefcase, Calendar, Plus, Filter, Search, Activity, History, Clock, DollarSign, ShieldAlert, Layers } from 'lucide-react';
import { ContractEventForm } from './ContractEventForm';
import { ContractAnalysis } from './ContractAnalysis';
import { AddOtrosieForm } from './AddOtrosieForm';
import { AddPagoForm } from './AddPagoForm';
import { ContractAIInsights } from './ContractAIInsights';
import { ContractFullReport } from './ContractFullReport';
import { ContractProgressVisuals } from './ContractProgressVisuals';
import { AttachDocumentModal } from './AttachDocumentModal';
import { Paperclip } from 'lucide-react';

interface ProjectHierarchyTreeProps {
  project: Project;
  contracts: Contract[];
  otrosies: Otrosie[];
  pagos: Pago[];
  reports: InterventoriaReport[];
}

export const ProjectHierarchyTree: React.FC<ProjectHierarchyTreeProps> = ({ project, contracts, otrosies, pagos, reports }) => {
  const { state } = useProject();
  const [expandedContracts, setExpandedContracts] = useState<Set<string>>(new Set());
  const [filterType, setFilterType] = useState<ContractType | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);
  const [showAddOtrosie, setShowAddOtrosie] = useState(false);
  const [selectedContractForOtrosie, setSelectedContractForOtrosie] = useState<Contract | null>(null);
  const [showAddPago, setShowAddPago] = useState(false);
  const [selectedContractForPago, setSelectedContractForPago] = useState<Contract | null>(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [selectedContractForReport, setSelectedContractForReport] = useState<Contract | null>(null);
  const [attachDocConfig, setAttachDocConfig] = useState<{
    type: 'project' | 'convenio' | 'contract' | 'otrosi';
    id: string;
    name: string;
  } | null>(null);

  const convenio = useMemo(() => 
    state.convenios.find(c => c.id === project.convenioId),
    [state.convenios, project.convenioId]
  );

  const projectDocs = useMemo(() => 
    state.documentos.filter(d => d.projectId === project.id),
    [state.documentos, project.id]
  );

  const toggleContract = (id: string) => {
    const newSet = new Set(expandedContracts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedContracts(newSet);
  };

  const filteredContracts = contracts.filter(c => {
    const matchesType = filterType === 'Todos' || c.tipo === filterType;
    const matchesSearch = (c.numero?.toString() || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (c.contratista || '').toLowerCase().includes((searchTerm || '').toLowerCase());
    return matchesType && matchesSearch;
  });

  const contractTypes: (ContractType | 'Todos')[] = ['Todos', 'Convenio', 'Obra', 'Interventoría', 'OPS', 'Interadministrativo', 'Consultoría'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
            {convenio ? <Layers size={24} /> : <Briefcase size={24} />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold text-slate-900">{project.nombre}</h3>
              {convenio && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                  Convenio Marco Activo
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500">
              {convenio ? `Jerarquía: ${convenio.nombre} > Contratación` : 'Estructura Jerárquica de Contratación'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setAttachDocConfig({
              type: convenio ? 'convenio' : 'project',
              id: convenio ? convenio.id : project.id,
              name: convenio ? `Convenio ${convenio.nombre}` : `Proyecto ${project.nombre}`
            })}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-xl font-semibold transition-colors border border-amber-200"
            title="Adjuntar Documento Oficial (CDP, RP, etc.)"
          >
            <Paperclip size={18} />
            <span className="hidden md:inline">Adjuntar Documento</span>
          </button>
          <div className="relative flex-1 md:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar contrato..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-full md:w-64"
            />
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
            <Filter size={16} className="text-slate-400" />
            <select 
              value={filterType} 
              onChange={e => setFilterType(e.target.value as any)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer"
            >
              {contractTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Documentos Adjuntos del Proyecto/Convenio */}
      {projectDocs.filter(d => (!d.contractId && !d.otrosiId && (convenio ? d.convenioId === convenio.id : true))).length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
            <Paperclip size={18} className="text-indigo-600" /> 
            Documentos Oficiales del {convenio ? 'Convenio' : 'Proyecto'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {projectDocs.filter(d => (!d.contractId && !d.otrosiId && (convenio ? d.convenioId === convenio.id : true))).map(doc => (
              <a 
                key={doc.id}
                href={doc.versiones[doc.versiones.length - 1]?.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
              >
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{doc.titulo}</p>
                  <p className="text-xs text-slate-500 truncate">{doc.tipo}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        {filteredContracts.map(contract => (
          <div key={contract.id} className="group">
            <div 
              onClick={() => toggleContract(contract.id)}
              className={`flex items-center gap-4 p-5 rounded-3xl border transition-all cursor-pointer ${
                expandedContracts.has(contract.id) 
                  ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-50' 
                  : 'bg-white border-slate-100 hover:border-indigo-100 hover:shadow-md'
              }`}
            >
              <div className={`p-2 rounded-xl transition-colors ${
                expandedContracts.has(contract.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'
              }`}>
                {expandedContracts.has(contract.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </div>
              
              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                      contract.tipo === 'Obra' ? 'bg-indigo-100 text-indigo-700' : 
                      contract.tipo === 'Interventoría' ? 'bg-amber-100 text-amber-700' : 
                      contract.tipo === 'OPS' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {contract.tipo}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{contract.numero}</span>
                  </div>
                  <div className="font-bold text-slate-900 truncate">{contract.contratista}</div>
                </div>
                
                <div className="hidden md:block">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valor</div>
                  <div className="text-sm font-bold text-slate-700">
                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(contract.valor)}
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plazo</div>
                  <div className="text-sm font-bold text-slate-700">{contract.plazoMeses} meses</div>
                </div>

                <div className="flex justify-end items-center gap-3">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 rounded-xl text-xs font-bold text-slate-500">
                    <Activity size={14} />
                    {contract.eventos?.length || 0} Eventos
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setAttachDocConfig({
                        type: 'contract',
                        id: contract.id,
                        name: `Contrato ${contract.numero}`
                      });
                    }}
                    className="p-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                    title="Adjuntar Documento (CDP, RP, etc.)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractForReport(contract);
                      setShowFullReport(true);
                    }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Generar Informe Integral"
                  >
                    <FileText size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractForPago(contract);
                      setShowAddPago(true);
                    }}
                    className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    title="Registrar Pago"
                  >
                    <DollarSign size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractForOtrosie(contract);
                      setShowAddOtrosie(true);
                    }}
                    className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                    title="Agregar Otrosí"
                  >
                    <History size={18} />
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedContractId(contract.id);
                    }}
                    className="p-2 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-sm"
                    title="Agregar Evento"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            </div>

            {expandedContracts.has(contract.id) && (
              <div className="ml-12 mt-4 space-y-6 border-l-2 border-indigo-100 pl-8 animate-in slide-in-from-left-4 duration-300">
                {/* Contract Analysis Dashboard */}
                <ContractAnalysis 
                  contract={contract} 
                  otrosies={otrosies.filter(o => o.contractId === contract.id)} 
                  events={contract.eventos || []} 
                  pagos={pagos.filter(p => p.contractId === contract.id)}
                  reports={reports.filter(r => r.contractId === contract.id || !r.contractId)}
                  projectId={contract.projectId}
                />

                {/* Visual Progress Metrics */}
                <ContractProgressVisuals 
                  contract={contract}
                  avances={reports.filter(r => r.contractId === contract.id || !r.contractId).map(r => ({
                    id: r.id,
                    projectId: r.projectId,
                    reportId: r.id,
                    fecha: r.fechaFin,
                    fisicoPct: r.obraEjecutadaPct,
                    financieroPct: r.valorProgramado > 0 ? (r.valorEjecutado / r.valorProgramado) * 100 : 0,
                    programadoPct: r.obraProgramadaPct,
                    observaciones: r.observaciones,
                    reportadoPor: r.interventorResponsable
                  }))}
                  pagos={pagos.filter(p => p.contractId === contract.id)}
                  otrosies={otrosies.filter(o => o.contractId === contract.id)}
                />

                {/* AI-Driven Insights */}
                <ContractAIInsights 
                  contract={contract}
                  otrosies={otrosies.filter(o => o.contractId === contract.id)}
                  events={contract.eventos || []}
                  pagos={pagos.filter(p => p.contractId === contract.id)}
                  reports={reports.filter(r => r.contractId === contract.id || !r.contractId)}
                />

                {/* Documentos Adjuntos del Contrato */}
                {projectDocs.filter(d => d.contractId === contract.id && !d.otrosiId).length > 0 && (
                  <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
                      <Paperclip size={14} /> Documentos Adjuntos (CDP, RP, etc.)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {projectDocs.filter(d => d.contractId === contract.id && !d.otrosiId).map(doc => (
                        <a 
                          key={doc.id}
                          href={doc.versiones[doc.versiones.length - 1]?.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
                        >
                          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <FileText size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">{doc.titulo}</p>
                            <p className="text-xs text-slate-500 truncate">{doc.tipo}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Event History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <Calendar size={14} /> Cronología de Eventos
                    </h4>
                    
                    {contract.eventos && contract.eventos.length > 0 ? (
                      <div className="space-y-4">
                        {contract.eventos.map((event, idx) => (
                          <div key={event.id} className="relative group/event">
                            {idx !== contract.eventos.length - 1 && (
                              <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-slate-100 group-hover/event:bg-indigo-100 transition-colors" />
                            )}
                            
                            <div className="flex gap-4 items-start">
                              <div className={`z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                                event.tipo === 'Acta de Inicio' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' :
                                event.tipo === 'Suspensión' ? 'bg-rose-50 border-rose-200 text-rose-600' :
                                event.tipo === 'Otrosí' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                                'bg-slate-50 border-slate-200 text-slate-600'
                              }`}>
                                <div className="w-2 h-2 rounded-full bg-current" />
                              </div>
                              
                              <div className="flex-1 bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-100 hover:shadow-sm transition-all">
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="text-xs font-bold text-slate-400">{event.fecha}</span>
                                    <h5 className="font-bold text-slate-900">{event.tipo}</h5>
                                  </div>
                                  {(event.impactoPlazoMeses !== 0 || event.impactoValor !== 0) && (
                                    <div className="flex gap-2">
                                      {event.impactoPlazoMeses !== 0 && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${event.impactoPlazoMeses > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {event.impactoPlazoMeses > 0 ? '+' : ''}{event.impactoPlazoMeses} meses
                                        </span>
                                      )}
                                      {event.impactoValor !== 0 && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${event.impactoValor > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {event.impactoValor > 0 ? '+' : ''}{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(event.impactoValor)}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{event.descripcion}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-400">Sin eventos registrados.</p>
                      </div>
                    )}
                  </div>

                  {/* Otrosíes History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <History size={14} /> Historial de Otrosíes
                    </h4>

                    {otrosies.filter(o => o.contractId === contract.id).length > 0 ? (
                      <div className="space-y-4">
                        {otrosies.filter(o => o.contractId === contract.id).map(o => (
                          <div key={o.id} className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <span className="text-xs font-bold text-slate-400">{o.fechaFirma}</span>
                                <h5 className="font-bold text-slate-900">Otrosí No. {o.numero}</h5>
                              </div>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAttachDocConfig({
                                      type: 'otrosi',
                                      id: o.id,
                                      name: `Otrosí No. ${o.numero}`
                                    });
                                  }}
                                  className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-600 hover:text-white transition-all shadow-sm"
                                  title="Adjuntar Documento (CDP, RP, etc.)"
                                >
                                  <Paperclip size={14} />
                                </button>
                                {o.plazoAdicionalMeses > 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-indigo-100 text-indigo-700">
                                    +{o.plazoAdicionalMeses} meses
                                  </span>
                                )}
                                {o.valorAdicional > 0 && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-700">
                                    +{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(o.valorAdicional)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2 mb-3">{o.objeto}</p>
                            {o.alcanceModificado && (
                              <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 mb-3">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Modificación de Alcance:</p>
                                <p className="text-[10px] text-slate-600 italic">{o.alcanceModificado}</p>
                              </div>
                            )}
                            
                            {/* Documentos Adjuntos del Otrosí */}
                            {projectDocs.filter(d => d.otrosiId === o.id).length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Documentos Adjuntos:</p>
                                <div className="flex flex-wrap gap-2">
                                  {projectDocs.filter(d => d.otrosiId === o.id).map(doc => (
                                    <a 
                                      key={doc.id}
                                      href={doc.versiones[doc.versiones.length - 1]?.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-colors text-xs text-slate-600"
                                    >
                                      <FileText size={12} />
                                      <span className="truncate max-w-[150px]">{doc.titulo}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-400">Sin otrosíes registrados.</p>
                      </div>
                    )}
                  </div>

                  {/* Payments History */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <DollarSign size={14} /> Historial de Pagos
                    </h4>

                    {pagos.filter(p => p.contractId === contract.id).length > 0 ? (
                      <div className="space-y-4">
                        {pagos.filter(p => p.contractId === contract.id).map(p => (
                          <div key={p.id} className="bg-white border border-slate-100 p-4 rounded-2xl hover:border-indigo-100 transition-all shadow-sm">
                            <div className="flex justify-between items-center mb-2">
                              <div>
                                <span className="text-xs font-bold text-slate-400">{p.fecha}</span>
                                <h5 className="font-bold text-slate-900">{p.numero} {p.cdp && <span className="text-xs ml-2 font-normal text-slate-500">CDP: {p.cdp}</span>}</h5>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg uppercase ${
                                p.estado === 'Pagado' ? 'bg-emerald-100 text-emerald-700' :
                                p.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                              }`}>
                                {p.estado}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-black text-indigo-600">
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(p.valor)}
                              </span>
                              {p.reportId && (
                                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                                  <FileText size={12} />
                                  Relacionado a Informe
                                </div>
                              )}
                            </div>
                            
                            {(p.beneficiario || p.identificacion || p.banco || p.cuenta || p.rubro || p.resolucion || p.fuente) && (
                              <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                                {p.beneficiario && (
                                  <div className="col-span-2">
                                    <span className="text-slate-400 font-medium block">Beneficiario</span>
                                    <span className="text-slate-700 font-bold">{p.identificacion ? `${p.identificacion} - ` : ''}{p.beneficiario}</span>
                                  </div>
                                )}
                                {p.banco && (
                                  <div>
                                    <span className="text-slate-400 font-medium block">Banco ({p.tipoCuenta || 'N/A'})</span>
                                    <span className="text-slate-700">{p.banco} - {p.cuenta}</span>
                                  </div>
                                )}
                                {p.rubro && (
                                  <div>
                                    <span className="text-slate-400 font-medium block">Rubro ({p.codigoRubro || 'N/A'})</span>
                                    <span className="text-slate-700 truncate block" title={p.rubro}>{p.rubro}</span>
                                  </div>
                                )}
                                {p.resolucion && (
                                  <div>
                                    <span className="text-slate-400 font-medium block">Resolución / RC</span>
                                    <span className="text-slate-700">{p.resolucion} / {p.rc || 'N/A'}</span>
                                  </div>
                                )}
                                {p.fuente && (
                                  <div>
                                    <span className="text-slate-400 font-medium block">Fuente</span>
                                    <span className="text-slate-700 truncate block" title={p.fuente}>{p.fuente}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                        <p className="text-xs text-slate-400">Sin pagos registrados.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        {filteredContracts.length === 0 && (
          <div className="p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center">
            <Search size={40} className="mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 font-medium">No se encontraron contratos que coincidan con los filtros.</p>
          </div>
        )}
      </div>

      {selectedContractId && (
        <ContractEventForm 
          contractId={selectedContractId} 
          onClose={() => setSelectedContractId(null)} 
        />
      )}

      {showAddOtrosie && selectedContractForOtrosie && (
        <AddOtrosieForm 
          contracts={[selectedContractForOtrosie]} 
          onClose={() => {
            setShowAddOtrosie(false);
            setSelectedContractForOtrosie(null);
          }} 
        />
      )}
      {showAddPago && selectedContractForPago && (
        <AddPagoForm 
          contracts={[selectedContractForPago]} 
          reports={reports}
          onClose={() => {
            setShowAddPago(false);
            setSelectedContractForPago(null);
          }} 
        />
      )}

      {showFullReport && selectedContractForReport && (
        <ContractFullReport 
          contract={selectedContractForReport}
          otrosies={otrosies.filter(o => o.contractId === selectedContractForReport.id)}
          events={selectedContractForReport.eventos || []}
          pagos={pagos.filter(p => p.contractId === selectedContractForReport.id)}
          reports={reports.filter(r => r.contractId === selectedContractForReport.id || !r.contractId)}
          onClose={() => {
            setShowFullReport(false);
            setSelectedContractForReport(null);
          }}
        />
      )}

      {attachDocConfig && (
        <AttachDocumentModal
          projectId={project.id}
          convenioId={attachDocConfig.type === 'convenio' ? attachDocConfig.id : undefined}
          contractId={attachDocConfig.type === 'contract' ? attachDocConfig.id : undefined}
          otrosiId={attachDocConfig.type === 'otrosi' ? attachDocConfig.id : undefined}
          entityName={attachDocConfig.name}
          onClose={() => setAttachDocConfig(null)}
        />
      )}
    </div>
  );
};
