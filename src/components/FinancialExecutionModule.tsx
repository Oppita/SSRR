import React, { useState, useMemo, useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { FinancialDocument } from '../types';
import { 
  FileText, Plus, Search, Filter, Download, Trash2, 
  DollarSign, Activity, Calendar, Hash, Building2, User,
  AlertTriangle, CheckCircle2, ChevronDown, ChevronUp, Upload, Loader2, X, Edit,
  FileSpreadsheet, History, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { analyzeFinancialDocumentText } from '../services/financialService';
import { showAlert } from '../utils/alert';

import { ImportPagosCSV } from './ImportPagosCSV';

const CDPListItem = ({ 
  doc, 
  linkedRCs, 
  totalComprometido, 
  executionPercentage, 
  formatCurrency, 
  onEdit, 
  onDelete,
  onAddPago,
  state 
}: any) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-white rounded-[2rem] border-2 transition-all duration-500 overflow-hidden ${
        expanded ? 'border-indigo-300 shadow-2xl ring-4 ring-indigo-500/5 translate-y-[-4px]' : 'border-slate-100 shadow-sm hover:border-indigo-200 hover:shadow-xl hover:translate-y-[-2px]'
      } mb-6 group`}
    >
      <div className="p-8 cursor-pointer select-none" onClick={() => setExpanded(!expanded)}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-5">
             <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black transition-all transform group-hover:scale-105 shadow-lg ${
               expanded ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'
             }`}>
                <FileText size={32} />
                <span className="text-[10px] uppercase tracking-widest mt-0.5">CDP</span>
             </div>
             <div>
                <div className="flex items-center gap-3 mb-1.5">
                   <h4 className="font-black text-2xl text-slate-800 tracking-tight">No. {doc.numero}</h4>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                     executionPercentage >= 100 ? 'bg-rose-100 text-rose-700 border-rose-200' : 
                     executionPercentage > 90 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                     'bg-emerald-100 text-emerald-700 border-emerald-200'
                   }`}>
                      {executionPercentage >= 100 ? 'Comprometido Total' : executionPercentage > 90 ? 'Casi Agotado' : 'En Ejecución'}
                   </span>
                </div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-3">{doc.nombre || 'Certificado de Disponibilidad'}</p>
                <div className="flex flex-wrap items-center gap-4">
                   <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                      <Calendar size={12} className="text-indigo-500" /> {doc.fecha}
                   </div>
                   {doc.rubro && (
                     <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-500 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                        <Hash size={12} className="text-indigo-500" /> {doc.rubro}
                     </div>
                   )}
                </div>
             </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Presupuesto Asignado</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{formatCurrency(doc.valor)}</p>
            <div className="flex items-center justify-end gap-2 mt-2">
               <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{linkedRCs.length} Compromisos (RC)</span>
               <div className={`w-2 h-2 rounded-full animate-pulse ${executionPercentage > 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
               <span className={`text-[10px] font-black uppercase tracking-widest ${executionPercentage > 100 ? 'text-rose-600' : 'text-emerald-600'}`}>{executionPercentage.toFixed(1)}% Comprometido</span>
            </div>
          </div>
        </div>

        <div className="relative pt-4">
          <div className="flex justify-between items-end mb-3">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Barra de Ejecución Trazable</p>
                <p className="text-sm font-bold text-slate-500">
                  Registros: <span className="text-indigo-600 font-black">{formatCurrency(totalComprometido)}</span> / <span className="text-slate-800 font-black">{formatCurrency(doc.valor)}</span>
                </p>
             </div>
             <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${expanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                <span className="text-[10px] font-black uppercase tracking-widest">{expanded ? 'Cerrar Detalles' : 'Ver Compromisos'}</span>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </div>
          </div>
          
          <div className="h-6 bg-slate-100 rounded-full overflow-hidden border-2 border-slate-200 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]">
            <div 
              className={`h-full transition-all duration-1000 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.1)] ${executionPercentage > 100 ? 'bg-gradient-to-r from-rose-400 to-rose-600' : 'bg-gradient-to-r from-indigo-400 to-indigo-600'}`}
              style={{ width: `${Math.min(100, executionPercentage)}%` }}
            />
            {executionPercentage > 100 && (
               <div className="absolute right-0 top-0 h-full w-8 bg-rose-600 animate-pulse flex items-center justify-center border-l border-rose-400 shadow-xl">
                  <AlertTriangle size={12} className="text-white" />
               </div>
            )}
          </div>
          
          <div className="flex justify-between mt-4 px-1">
             <div className="flex gap-8">
                <div className="flex flex-col">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Disponible</span>
                   <span className="text-sm font-black text-slate-700 tracking-tight">{formatCurrency(Math.max(0, doc.valor - totalComprometido))}</span>
                </div>
                {linkedRCs.reduce((sum: number, rc: any) => sum + (rc.valorPagado || 0), 0) > 0 && (
                  <div className="flex flex-col border-l border-slate-100 pl-8">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pagado Liquidado</span>
                     <span className="text-sm font-black text-blue-600 tracking-tight">{formatCurrency(linkedRCs.reduce((sum: number, rc: any) => sum + (rc.valorPagado || 0), 0))}</span>
                  </div>
                )}
             </div>
             <button className="text-[10px] font-black text-indigo-500 uppercase hover:underline tracking-widest underline-offset-4 decoration-2">Ver Trazabilidad Completa</button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="bg-slate-50 border-t border-slate-100 p-8 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <h5 className="text-xs font-black text-slate-600 uppercase tracking-[0.2em] flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> Trazabilidad de Compromisos (RC)
            </h5>
            <div className="flex gap-2">
               <span className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 shadow-sm">
                 {linkedRCs.length} RCs Vinculados
               </span>
               <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(); }}
                  className="flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-[10px] font-black hover:bg-slate-800 transition-colors shadow-lg shadow-indigo-200"
                >
                  <Edit size={12} /> Gestionar
                </button>
            </div>
          </div>
          
          {linkedRCs.length === 0 ? (
            <div className="text-center py-12 bg-white border-2 border-slate-100 border-dashed rounded-3xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <FileText size={24} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No hay Registros de Compromiso vinculados a este CDP</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1">Vincule un RC usando el número de CDP {doc.numero}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {linkedRCs.map((rc: any) => {
                const pagosForRC = state.pagos ? state.pagos.filter((p: any) => p.rcId === rc.id) : [];
                const rcPagado = pagosForRC.length > 0 
                  ? pagosForRC.reduce((sum: number, p: any) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0)
                  : (rc.valorPagado || 0);
                const isPaidFull = rcPagado >= rc.valor;

                return (
                 <div key={rc.id} className="relative group/rc bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-300 hover:shadow-xl transition-all duration-300">
                  <div className="absolute -top-2 -left-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex flex-col items-center justify-center shadow-lg transform -rotate-12 group-hover/rc:rotate-0 transition-transform">
                    <span className="text-[10px] font-black leading-none">RC</span>
                    <Activity size={12} className="mt-0.5" />
                  </div>
                  
                  <div className="flex justify-between items-start mb-4 pl-6">
                    <div>
                      <h6 className="font-black text-slate-800 text-xl tracking-tight">No. {rc.numero}</h6>
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mt-1">
                        <Calendar size={12} className="text-indigo-400" /> {rc.fecha}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600 tracking-tighter">{formatCurrency(rc.valor)}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compromiso Total</p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-xl mb-4 border border-slate-100">
                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2 leading-relaxed">
                      {rc.descripcion || 'Sin descripción detallada del objeto contractual.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center bg-white">
                    <div className="grid grid-cols-2 gap-4 flex-1">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ejecutado (Pagado)</span>
                          <span className={`text-sm font-black tracking-tight ${rcPagado > 0 ? 'text-indigo-600' : 'text-slate-300'}`}>
                            {formatCurrency(rcPagado)}
                          </span>
                       </div>
                       <div className="flex flex-col border-l border-slate-100 pl-4">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">Por Pagar</span>
                          <span className={`text-sm font-black tracking-tight ${rc.valor - rcPagado <= 0 ? 'text-emerald-500' : 'text-rose-600'}`}>
                            {formatCurrency(Math.max(0, rc.valor - rcPagado))}
                          </span>
                       </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => onAddPago(rc)}
                        disabled={isPaidFull}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md ${
                          isPaidFull 
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                          : 'bg-emerald-600 text-white hover:bg-slate-800 shadow-emerald-100'
                        }`}
                      >
                        <DollarSign size={14} />
                        {isPaidFull ? 'Liquidado' : 'Registrar'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Minilínea de progreso y recuento de pagos */}
                  <div className="mt-5 space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
                       <span>Trazabilidad: {pagosForRC.length} Pagos Registrados</span>
                       <span className={isPaidFull ? 'text-emerald-600' : 'text-indigo-600'}>{( (rcPagado / rc.valor) * 100 ).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[1px]">
                       <div 
                          className={`h-full rounded-full transition-all duration-1000 ${isPaidFull ? 'bg-emerald-500' : 'bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]'}`} 
                          style={{ width: `${Math.min(100, (rcPagado / rc.valor) * 100)}%` }}
                       />
                    </div>

                    {/* Desglose de pagos del RC */}
                    {pagosForRC.length > 0 && (
                      <div className="mt-4 bg-slate-50/50 rounded-xl border border-slate-200/50 overflow-hidden">
                        <div className="p-2 bg-slate-100/50 flex justify-between items-center border-b border-slate-200/50">
                          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">Historial de Desembolsos</span>
                        </div>
                        <div className="max-h-32 overflow-y-auto custom-scrollbar">
                           {pagosForRC.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(p => (
                             <div key={p.id} className="p-2 border-b border-white hover:bg-white transition-colors flex justify-between items-center text-[10px]">
                               <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                  <div>
                                    <span className="font-bold text-slate-700">No. {p.numero}</span>
                                    <span className="text-slate-400 ml-2">{p.fecha}</span>
                                  </div>
                               </div>
                               <span className="font-black text-slate-900">{formatCurrency(p.valor)}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                  </div>
                 </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-200/60">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer" onClick={(e) => { e.stopPropagation(); onDelete(); }}>
                   <Trash2 size={18} />
                </div>
                <div className="hidden md:block">
                   <p className="text-[10px] font-black text-slate-400 uppercase italic">Zona de Seguridad</p>
                   <p className="text-[10px] text-slate-400 leading-none">Los cambios en CDPs afectan la trazabilidad de los RCs vinculados.</p>
                </div>
             </div>
             <div className="flex gap-3">
                <button className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-black hover:bg-black transition-colors shadow-lg">Descargar Reporte</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FinancialExecutionModuleProps {
  projectId?: string;
}

export const FinancialExecutionModule: React.FC<FinancialExecutionModuleProps> = ({ projectId }) => {
  const { state, addPago, updatePago, deletePago, clearAllPagos, addFinancialDocument, addFinancialDocuments, updateFinancialDocument, deleteFinancialDocument, clearFinancialDocuments, clearDuplicatesFinancialDocuments } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pagosFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'CDP' | 'RC' | 'Pagos'>('CDP');
  const [showModal, setShowModal] = useState(false);
  const [showImportPagosModal, setShowImportPagosModal] = useState(false);
  const [showAddPagoModal, setShowAddPagoModal] = useState(false);
  const [selectedRCForPago, setSelectedRCForPago] = useState<any>(null);
  const [selectedPagoToEdit, setSelectedPagoToEdit] = useState<any>(null);
  const [selectedRCToViewPagos, setSelectedRCToViewPagos] = useState<any>(null);
  const [filterRcId, setFilterRcId] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [selectedContractId, setSelectedContractId] = useState('');
  const [selectedConvenioId, setSelectedConvenioId] = useState('');
  const [selectedOtrosieId, setSelectedOtrosieId] = useState('');
  const [selectedEventoId, setSelectedEventoId] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FinancialDocument | null>(null);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [convenioSearch, setConvenioSearch] = useState('');
  const [contractSearch, setContractSearch] = useState('');

  const projectDocs = useMemo(() => {
    let docs = state.financialDocuments || [];
    if (projectId) {
      docs = docs.filter(d => d.projectId === projectId);
    }
    return docs;
  }, [state.financialDocuments, projectId]);

  const [showAllPagos, setShowAllPagos] = useState(false);

  const projectPagos = useMemo(() => {
    let pagos = state.pagos || [];
    if (projectId && !showAllPagos) {
      const contractIds = state.contratos.filter(c => c.projectId === projectId).map(c => c.id);
      pagos = pagos.filter(p => contractIds.includes(p.contractId));
    }
    return pagos;
  }, [state.pagos, state.contratos, projectId, showAllPagos]);

  const filteredDocs = projectDocs.filter(d => (d.tipo === activeTab || (activeTab === 'RC' && d.tipo === 'RC')) && (d.numero.includes(searchQuery) || d.descripcion.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredPagos = projectPagos.filter(p => {
    const matchesSearch = p.numero.includes(searchQuery) || p.numeroFactura?.includes(searchQuery) || p.beneficiario?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRc = filterRcId ? p.rcId === filterRcId : true;
    return matchesSearch && matchesRc;
  });

  const availableProjects = state.proyectos;
  const projectContracts = state.contratos.filter(c => 
    (!selectedProjectId || c.projectId === selectedProjectId) &&
    (c.numero.toLowerCase().includes(contractSearch.toLowerCase()))
  );
  const projectConvenios = state.convenios.filter(c => {
    const matchesSearch = c.numero.toLowerCase().includes(convenioSearch.toLowerCase()) || 
                          c.nombre.toLowerCase().includes(convenioSearch.toLowerCase());
    if (!selectedProjectId) return matchesSearch;
    const p = state.proyectos.find(proj => proj.id === selectedProjectId);
    return c.id === p?.convenioId && matchesSearch;
  });
  const projectOtrosies = state.otrosies.filter(o => 
    projectContracts.some(c => c.id === o.contractId) || 
    projectConvenios.some(c => c.id === o.convenioId)
  );

  const totals = useMemo(() => {
    return projectDocs.reduce((acc, doc) => {
      acc[doc.tipo] = (acc[doc.tipo] || 0) + doc.valor;
      return acc;
    }, { CDP: 0, RC: 0, Otros: 0 } as Record<string, number>);
  }, [projectDocs]);

  const difference = useMemo(() => {
    return totals.CDP - totals.RC;
  }, [totals.CDP, totals.RC]);

  const projectTotal = useMemo(() => {
    if (projectId) {
      const p = state.proyectos.find(p => p.id === projectId);
      if (!p) return 0;
      const convenio = state.convenios.find(c => c.id === p.convenioId);
      return convenio?.valorTotal || p.matrix?.valorTotalProyecto || 0;
    }
    // Global total
    return state.convenios.reduce((sum, c) => sum + (Number(c.valorTotal) || 0), 0);
  }, [state.proyectos, state.convenios, projectId]);

  const handleAnalyzeText = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const doc = await analyzeFinancialDocumentText(
        pastedText, 
        selectedContractId, 
        selectedProjectId || projectId || '', 
        selectedConvenioId, 
        selectedOtrosieId
      );
      // Add event ID if selected
      if (selectedEventoId) {
        doc.eventoId = selectedEventoId;
      }
      setPreviewDoc(doc);
    } catch (error) {
      console.error(error);
      showAlert('Error al analizar el documento.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    if (!previewDoc) return;

    const docsToSave: FinancialDocument[] = [];
    
    // Ensure we have a contractId if possible
    let finalDoc = { ...previewDoc };
    if (!finalDoc.contractId && finalDoc.contrato) {
      const matchingContract = state.contratos.find(c => 
        c.numero.toLowerCase().includes(finalDoc.contrato!.toLowerCase()) ||
        finalDoc.contrato!.toLowerCase().includes(c.numero.toLowerCase())
      );
      if (matchingContract) {
        finalDoc.contractId = matchingContract.id;
      }
    }

    // Add the main document
    docsToSave.push(finalDoc);

    // If it's a CDP and contains RC information, create the RC document automatically
    if (finalDoc.tipo === 'CDP' && finalDoc.numeroRc && finalDoc.valorRc) {
      const rcDoc: FinancialDocument = {
        ...finalDoc,
        id: `FIN-RC-${Date.now()}`,
        tipo: 'RC',
        numero: finalDoc.numeroRc,
        numeroCdp: finalDoc.numero,
        valor: finalDoc.valorRc,
        fecha: finalDoc.fechaRc || finalDoc.fecha,
        descripcion: `Registro Compromiso derivado del CDP No. ${finalDoc.numero}. ${finalDoc.descripcion}`,
        valorPagado: finalDoc.valorPagado,
        // Clear RC specific fields in the RC document itself to avoid recursion
        numeroRc: undefined,
        valorRc: undefined,
        fechaRc: undefined,
        validacion_ia: {
          ...finalDoc.validacion_ia!,
          observaciones: `Generado automáticamente desde CDP No. ${finalDoc.numero}`
        }
      };
      docsToSave.push(rcDoc);
    }

    // Use the new batch add method
    if (editingDocId) {
      updateFinancialDocument(finalDoc);
      showAlert('Documento financiero actualizado exitosamente.');
    } else {
      addFinancialDocuments(docsToSave);
      if (docsToSave.length > 1) {
        showAlert('CDP y RC creados exitosamente.');
      } else {
        showAlert('Documento financiero guardado exitosamente.');
      }
    }

    setPreviewDoc(null);
    setEditingDocId(null);
    setPastedText('');
    setShowModal(false);
    if (!projectId) setSelectedProjectId('');
    setSelectedContractId('');
    setSelectedConvenioId('');
    setSelectedOtrosieId('');
    setSelectedEventoId('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;
      
      const lines = content.split('\n');
      const docsToSave: FinancialDocument[] = [];
      const pagosToSave: any[] = [];
      
      lines.forEach((line, index) => {
        // Skip header if it looks like one
        if (index === 0 && (line.toLowerCase().includes('n°') || line.toLowerCase().includes('vincular'))) return;
        if (!line.trim()) return;
        
        // Flexible split: attempts tab first, then semicolon, then comma
        let parts = line.split('\t');
        if (parts.length < 5) parts = line.split(';');
        if (parts.length < 5) parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        if (parts.length >= 10) {
          const cleanAmount = (s: string) => {
            if (!s) return 0;
            // Remove symbols but keep numbers and decimal separators
            let val = s.replace(/[$\s]/g, '');
            // Handle European/Latin American format: 1.000,00 -> 1000.00
            if (val.includes(',') && val.includes('.')) {
              if (val.lastIndexOf(',') > val.lastIndexOf('.')) {
                val = val.replace(/\./g, '').replace(',', '.');
              } else {
                val = val.replace(/,/g, '');
              }
            } else if (val.includes(',')) {
              val = val.replace(',', '.');
            }
            return parseFloat(val) || 0;
          };

          const parseSpanishDate = (d: string) => {
            if (!d) return new Date().toISOString().split('T')[0];
            const clean = d.trim();
            if (clean.includes('/')) {
              const [day, month, year] = clean.split('/');
              if (year && year.length === 2) {
                return `20${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
              }
              return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            return clean;
          };

          // Mapping based on Header:
          // 0: N°, 1: ConvenioRef, 2: ContractRef, 3: Beneficiary, 4: Rubro, 5: Fuente, 
          // 6: NoCDP, 7: FechaCDP, 8: ValCDP, 9: NoRC, 10: FechaRC, 11: ValRC, 12: Pagos Realizados
          // Additional Pago Fields: 13: PagoFactura, 14: PagoFecha, 15: EntidadBancaria, 16: ComprobanteEgreso
          const convenioRef = parts[1]?.trim();
          const contractRef = parts[2]?.trim();
          const beneficiary = parts[3]?.trim();
          const rubro = parts[4]?.trim();
          const fuente = parts[5]?.trim();
          const description = parts[17]?.trim() || `${fuente}: ${rubro}`;

          const cdpNum = parts[6]?.trim();
          const cdpDate = parseSpanishDate(parts[7]);
          const cdpVal = cleanAmount(parts[8]);

          const rcNum = parts[9]?.trim();
          const rcDate = parseSpanishDate(parts[10]);
          const rcVal = cleanAmount(parts[11]);
          
          const rpVal = cleanAmount(parts[12]);
          const pagoFactura = parts[13]?.trim() || `FAC-CSV-${index}`;
          const pagoFecha = parts[14]?.trim() ? parseSpanishDate(parts[14]) : (rcDate || cdpDate);
          const entidadBancaria = parts[15]?.trim() || 'Banco Matriz';
          const comprobanteEgreso = parts[16]?.trim() || `CE-${Date.now()}-${index}`;

          if (cdpNum) {
            // Attempt to resolve IDs
            let convenioId = selectedConvenioId || undefined;
            if (!convenioId && convenioRef) {
              const matched = state.convenios.find(c => 
                c.numero.toLowerCase().includes(convenioRef.toLowerCase()) || 
                convenioRef.toLowerCase().includes(c.numero.toLowerCase())
              );
              if (matched) convenioId = matched.id;
            }

            let contractId = selectedContractId || undefined;
            if (!contractId && contractRef) {
              const matched = state.contratos.find(c => 
                c.numero.toLowerCase().includes(contractRef.toLowerCase()) || 
                contractRef.toLowerCase().includes(c.numero.toLowerCase())
              );
              if (matched) contractId = matched.id;
            }

            const baseDoc = {
              projectId: selectedProjectId || projectId || '',
              convenioId,
              contractId,
              nombre: beneficiary,
              rubro,
              fuente,
              descripcion: description,
              validacion_ia: { coherente: true, observaciones: 'Importado vía Carga Masiva', inconsistencias: [] }
            };

            // 1. Create CDP
            const cdpId = `FIN-CDP-CSV-${Date.now()}-${index}`;
            const cdpDoc: FinancialDocument = {
              ...baseDoc,
              id: cdpId,
              tipo: 'CDP',
              numero: cdpNum,
              valor: cdpVal,
              fecha: cdpDate,
            };
            docsToSave.push(cdpDoc);

            // 2. Create RC if exists
            if (rcNum && rcVal > 0) {
              const rcId = `FIN-RC-CSV-${Date.now()}-${index}`;
              const rcDoc: FinancialDocument = {
                ...baseDoc,
                id: rcId,
                tipo: 'RC',
                numero: rcNum,
                numeroCdp: cdpNum,
                valor: rcVal,
                fecha: rcDate || cdpDate,
                valorPagado: 0 // Will be calculated dynamically based on Pagos
              };
              docsToSave.push(rcDoc);

              // 3. Create Pago if RP (Pagos Realizados) > 0
              if (rpVal > 0) {
                pagosToSave.push({
                  id: `PAGO-CSV-${Date.now()}-${index}`,
                  contractId: contractId || `TEMP-CONT-${Date.now()}`,
                  rcId: rcId,
                  numero: cdpNum + '-' + rcNum + '-P1',
                  numeroFactura: pagoFactura,
                  beneficiario: beneficiary || 'Beneficiario Importado',
                  entidadBancaria: entidadBancaria,
                  comprobanteEgreso: comprobanteEgreso,
                  fecha: pagoFecha,
                  fechaPagoReal: pagoFecha,
                  valor: rpVal,
                  estado: 'Pagado',
                  observaciones: 'Pago importado masivamente vía CSV. Atado a RC y CDP.'
                });
              }
            }
          }
        }
      });
      
      if (docsToSave.length > 0) {
        addFinancialDocuments(docsToSave);
        pagosToSave.forEach(p => addPago(p));
        showAlert(`Éxito: Se procesaron ${docsToSave.length} registros y ${pagosToSave.length} pagos.`);
      } else {
        showAlert('Error: Formato no reconocido o sin datos procesables.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };



  const handleDeleteAll = () => {
    if (window.confirm('¿Está seguro de que desea eliminar TODOS los documentos financieros? Esta acción no se puede deshacer.')) {
      clearFinancialDocuments();
      showAlert('Todos los registros financieros han sido eliminados.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Módulo de Ejecución Financiera</h3>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              clearDuplicatesFinancialDocuments();
              showAlert('Se han eliminado los registros duplicados.');
            }}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-colors"
          >
            <History size={18} />
            Limpiar Duplicados
          </button>
          <button 
            onClick={handleDeleteAll}
            className="flex items-center gap-2 bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold hover:bg-rose-100 transition-colors"
          >
            <Trash2 size={18} />
            Borrar Todo
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            <FileSpreadsheet size={18} />
            Carga Masiva (CSV)
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept=".csv,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
          >
            <Plus size={18} />
            Nuevo Documento
          </button>
        </div>
      </div>

      {/* Visual Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'CDP Registrados', value: totals.CDP, color: 'indigo' },
          { label: 'RC Registrados (Compromisos)', value: totals.RC, color: 'emerald' },
          { label: 'Total Pagado (Consolidado)', value: state.globalTotalPagado || 0, color: 'blue' },
          { label: 'Recursos por Liberar', value: difference, color: 'amber' }
        ].map(stat => {
          const percentage = projectTotal > 0 ? (stat.value / projectTotal) * 100 : 0;
          return (
            <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                <p className={`text-sm font-black text-${stat.color}-600`}>{percentage.toFixed(1)}%</p>
              </div>
              <p className="text-xl font-black text-slate-800 mb-3">{formatCurrency(stat.value)}</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div 
                  className={`h-full bg-${stat.color}-500 rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.min(100, Math.abs(percentage))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {['CDP', 'RC', 'Pagos'].map(tab => (
          <button
            key={tab}
            onClick={() => {
              setActiveTab(tab as any);
              if (tab !== 'Pagos') setFilterRcId(null);
            }}
            className={`pb-3 px-4 font-bold text-sm transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === tab 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'CDP' ? 'CDPs' : tab === 'RC' ? 'RCs' : 'Pagos'} 
            {tab === 'CDP' && <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px]">{projectDocs.filter(d => d.tipo === 'CDP').length}</span>}
            {tab === 'RC' && <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px]">{projectDocs.filter(d => d.tipo === 'RC').length}</span>}
            {tab === 'Pagos' && <span className="bg-slate-100 text-slate-500 py-0.5 px-2 rounded-full text-[10px]">{projectPagos.length}</span>}
          </button>
        ))}
      </div>

      <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder={`Buscar ${activeTab} por número o descripción...`}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {activeTab === 'Pagos' && (
            <>
              <button
                onClick={() => setShowAllPagos(!showAllPagos)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-black border transition-colors shadow-sm ${
                  showAllPagos 
                    ? 'bg-indigo-600 text-white border-indigo-700' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter size={14} /> {showAllPagos ? 'Mostrando Todos' : 'Filtrar por Proyecto'}
              </button>
              <button
                onClick={() => setShowImportPagosModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-black border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
              >
                <FileSpreadsheet size={14} /> Carga Masiva de Pagos
              </button>
              <button
                onClick={() => {
                  if (window.confirm('¿Desea eliminar todos los pagos masivos? Esta acción no se puede deshacer.')) {
                    clearAllPagos();
                    showAlert('Todos los pagos han sido eliminados.');
                  }
                }}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-black border border-rose-100 hover:bg-rose-100 transition-colors shadow-sm"
              >
                <Trash2 size={14} /> Eliminar Pagos
              </button>
            </>
          )}
          <button
            onClick={() => {
              if (window.confirm('¿Desea eliminar los documentos (CDP/RC) con números duplicados? Se conservará solo el primer registro.')) {
                clearDuplicatesFinancialDocuments();
                showAlert('Duplicados eliminados exitosamente.');
              }
            }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-lg text-xs font-black border border-rose-100 hover:bg-rose-100 transition-colors"
          >
            <Trash2 size={14} /> Eliminar Duplicados
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {activeTab === 'Pagos' && filterRcId && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700">
               <Filter size={16} />
               <span className="font-bold text-sm">Mostrando pagos integrados del RC seleccionado.</span>
            </div>
            <button 
              onClick={() => setFilterRcId(null)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-white px-3 py-1.5 rounded-lg shadow-sm"
            >
              Quitar Filtro
            </button>
          </div>
        )}
        {(activeTab === 'CDP' || activeTab === 'RC') && filteredDocs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <FileText className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No hay {activeTab}s registrados</h3>
            <p className="text-slate-500">Agregue un nuevo documento para comenzar el seguimiento.</p>
          </div>
        ) : activeTab === 'Pagos' && filteredPagos.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <DollarSign className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No hay Pagos registrados</h3>
            <p className="text-slate-500">Use el botón de Carga Masiva (CSV) para cargar sus pagos al sistema o regístrelos directamente en los RCs.</p>
          </div>
        ) : activeTab === 'CDP' ? (
          <div className="space-y-4">
            {filteredDocs.map(doc => {
              const linkedRCs = projectDocs.filter(d => d.tipo === 'RC' && d.numeroCdp === doc.numero);
              const totalComprometido = linkedRCs.reduce((sum, rc) => sum + rc.valor, 0);
              const executionPercentage = doc.valor > 0 ? (totalComprometido / doc.valor) * 100 : 0;
              
              return <CDPListItem 
                key={doc.id} 
                doc={doc} 
                linkedRCs={linkedRCs} 
                totalComprometido={totalComprometido} 
                executionPercentage={executionPercentage}
                formatCurrency={formatCurrency}
                onEdit={() => {
                  setEditingDocId(doc.id);
                  setPreviewDoc(doc);
                  setShowModal(true);
                }}
                onDelete={() => deleteFinancialDocument(doc.id)}
                onAddPago={(rc: any) => {
                  setSelectedRCForPago(rc);
                  setShowAddPagoModal(true);
                }}
                state={state}
              />;
            })}
          </div>
        ) : activeTab === 'RC' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocs.map(doc => {
              const pagosForRC = state.pagos ? state.pagos.filter((p: any) => p.rcId === doc.id) : [];
              const rcPagado = pagosForRC.length > 0 
                ? pagosForRC.reduce((sum: number, p: any) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0)
                : (doc.valorPagado || 0);
              const isPaidFull = rcPagado >= doc.valor;
              
              const executionPercentage = (rcPagado / doc.valor) * 100;
              const statusColor = isPaidFull ? 'emerald' : executionPercentage > 80 ? 'blue' : 'amber';

              return (
                <div 
                  key={doc.id} 
                  onClick={() => {
                    setEditingDocId(doc.id);
                    setPreviewDoc(doc);
                    setShowModal(true);
                  }}
                  className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden hover:shadow-2xl transition-all cursor-pointer group transform hover:-translate-y-1 ${
                    isPaidFull ? 'border-emerald-100' : 'border-slate-100'
                  } hover:border-indigo-300`}
                >
                  <div className="p-6 border-b border-slate-100 relative">
                    <div className={`absolute top-0 right-0 ${
                      statusColor === 'emerald' ? 'bg-emerald-600' : 
                      statusColor === 'blue' ? 'bg-indigo-600' : 'bg-amber-500'
                    } text-white text-[10px] font-black px-4 py-1.5 rounded-bl-xl uppercase tracking-widest flex items-center gap-1 shadow-sm`}>
                      <Activity size={10} /> RC
                    </div>
                    
                    <div className="flex justify-between items-start mb-4 pr-16 text-left">
                      <div>
                        <h3 className="font-black text-xl text-slate-800 tracking-tight">No. {doc.numero}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mt-1 bg-slate-50 w-fit px-2 py-0.5 rounded-md">
                          <Calendar size={12} className="text-indigo-400" /> {doc.fecha}
                        </p>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium mb-5 line-clamp-2 leading-relaxed min-h-[32px] text-left">
                      {doc.descripcion || 'Sin descripción detallada.'}
                    </p>

                    <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-100/50">
                        <div className="flex justify-between items-center text-slate-600">
                           <span className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400">Compromiso</span>
                           <span className="font-black text-slate-800 tracking-tight text-lg">{formatCurrency(doc.valor)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                           <span className="text-[10px] uppercase tracking-[0.1em] font-black text-slate-400">Asociado a CDP</span>
                           <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs">{doc.numeroCdp || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px]">
                           <span className="font-black uppercase text-slate-500 tracking-wider">Ejecución de Pagos ({pagosForRC.length})</span>
                           <span className={`font-black ${isPaidFull ? 'text-emerald-500' : 'text-indigo-600'}`}>{executionPercentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                           <div 
                              className={`h-full transition-all duration-1000 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.05)] ${
                                isPaidFull ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 
                                executionPercentage > 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                'bg-gradient-to-r from-indigo-400 to-indigo-600'
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, executionPercentage))}%` }}
                           />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                       <button 
                         onClick={(e) => {
                            e.stopPropagation();
                            setFilterRcId(doc.id);
                            setActiveTab('Pagos');
                         }}
                         className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors shadow-sm"
                       >
                         <Search size={14} /> Ver Pagos Integrados
                       </button>
                    </div>

                  </div>
                  
                  <div className="p-4 bg-slate-50 flex justify-between items-center border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-left mb-1">Pagado Acumulado</p>
                      <p className="font-black text-blue-600 tracking-tight text-lg leading-none">{formatCurrency(rcPagado)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo x Pagar</p>
                      <p className={`font-black tracking-tight text-lg leading-none ${doc.valor - rcPagado <= 0 ? 'text-emerald-500' : 'text-slate-800'}`}>{formatCurrency(Math.max(0, doc.valor - rcPagado))}</p>
                    </div>
                  </div>

                  <div className="px-6 py-3 bg-white flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ver Detalles y Pagos</span>
                    <ChevronRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPagos.map(pago => {
              const isPaid = pago.estado === 'Pagado';
              const matchedRC = state.financialDocuments.find((d: any) => d.id === pago.rcId);
              
              return (
                <div key={pago.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl transition-all group flex flex-col h-full border-l-4 border-l-indigo-500">
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isPaid ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Comprobante Egreso</span>
                          </div>
                          <p className="font-black text-slate-800 tracking-tight">{pago.comprobanteEgreso || 'Pendiente'}</p>
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-tighter ${isPaid ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {pago.estado}
                      </div>
                      <div className="flex items-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPagoToEdit(pago);
                          }}
                          className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all ml-2"
                          title="Editar Pago"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('¿Está seguro de que desea eliminar este pago?')) {
                              deletePago(pago.id);
                            }
                          }}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all ml-1"
                          title="Eliminar Pago"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-black text-slate-800 text-sm line-clamp-1">{pago.beneficiario}</h3>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        <Building2 size={12} className="text-slate-400" />
                        {pago.entidadBancaria || 'Sin entidad registrada'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3 border-y border-slate-50">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Carga / Factura</p>
                        <p className="font-bold text-slate-700 text-xs">{pago.numeroFactura || pago.numero || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha Pago</p>
                        <div className="flex items-center gap-1 font-bold text-slate-700 text-xs">
                          <Calendar size={12} className="text-indigo-400" />
                          {pago.fechaPagoReal || pago.fecha}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 text-[10px] text-slate-600">
                       {pago.identificacion && (
                         <div className="flex justify-between">
                            <span className="font-bold">Identificación:</span>
                            <span>{pago.identificacion}</span>
                         </div>
                       )}
                       {pago.rc && (
                         <div className="flex justify-between">
                            <span className="font-bold">RC / CDP:</span>
                            <span>{pago.rc} / {pago.cdp}</span>
                         </div>
                       )}
                       {pago.numeroContratoOriginal && (
                         <div className="flex justify-between">
                            <span className="font-bold">Contrato Base:</span>
                            <span className="text-right truncate max-w-[120px]">{pago.numeroContratoOriginal}</span>
                         </div>
                       )}
                       {pago.fuente && (
                         <div className="flex justify-between">
                            <span className="font-bold">Fuente / Área:</span>
                            <span className="truncate max-w-[150px]">{pago.fuente} ({pago.areaEjecutora})</span>
                         </div>
                       )}
                       {pago.observaciones && (
                         <div className="mt-2 border-t border-slate-200 pt-2 text-[9px] text-slate-500 italic line-clamp-2">
                            "{pago.observaciones}"
                         </div>
                       )}
                    </div>

                    <div className="pt-2 flex items-end justify-between">
                       <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Transferido</p>
                         <p className="text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(pago.valor)}</p>
                       </div>
                       {pago.valorDistribuido && pago.valorDistribuido !== pago.valor && (
                         <div className="text-right">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Disp.</p>
                           <p className="text-xs font-bold text-slate-500">{formatCurrency(pago.valorDistribuido)}</p>
                         </div>
                       )}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center group-hover:bg-indigo-50 transition-colors">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RC Asociado:</span>
                       <span className="font-black text-indigo-600 text-xs">{matchedRC?.numero || 'S/V'}</span>
                    </div>
                    <ChevronRight size={14} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddPagoModal && selectedRCForPago && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><DollarSign /> Registrar Pago a RC No. {selectedRCForPago.numero}</h3>
                <p className="text-emerald-100 text-sm mt-1">Presupuesto del RC: {formatCurrency(selectedRCForPago.valor)}</p>
              </div>
              <button onClick={() => setShowAddPagoModal(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const fd = new FormData(form);
              const valorStr = fd.get('valor') as string;
              const valor = parseFloat(valorStr.replace(/[^0-9.-]+/g,""));
              
              addPago({
                id: crypto.randomUUID(),
                contractId: selectedRCForPago.contractId || '',
                rcId: selectedRCForPago.id,
                fecha: fd.get('fecha') as string,
                valor,
                observaciones: fd.get('concepto') as string || '',
                estado: 'Pagado',
                numero: fd.get('numeroFactura') as string,
                numeroFactura: fd.get('numeroFactura') as string,
                beneficiario: fd.get('beneficiario') as string,
                nitBeneficiario: '',
                entidadBancaria: fd.get('entidadBancaria') as string,
                cuentaBancaria: fd.get('cuentaBancaria') as string,
                comprobanteEgreso: fd.get('comprobanteEgreso') as string,
                fechaPagoReal: fd.get('fechaPagoReal') as string,
              });
              showAlert('Pago registrado de forma exitosa. El saldo del RC se ha actualizado.');
              setShowAddPagoModal(false);
            }}>
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Valor Pagado (Requerido)</label>
                    <input name="valor" type="number" required placeholder="Ej. 15000000" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-bold" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha de Solicitud</label>
                    <input name="fecha" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Concepto / Motivo de Pago</label>
                  <input name="concepto" type="text" required placeholder="Ej. Anticipo contrato, Acta #1..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Beneficiario</label>
                    <input name="beneficiario" type="text" placeholder="Razón social o nombre" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Factura / Cuenta de Cobro</label>
                    <input name="numeroFactura" type="text" placeholder="No. Documento" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Entidad Bancaria</label>
                    <input name="entidadBancaria" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Cuenta Bancaria</label>
                    <input name="cuentaBancaria" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Comprobante Egreso (Opcional)</label>
                    <input name="comprobanteEgreso" type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Fecha Real de Desembolso</label>
                    <input name="fechaPagoReal" type="date" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Observaciones</label>
                  <textarea name="observaciones" rows={2} className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm"></textarea>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 rounded-b-3xl">
                <button type="button" onClick={() => setShowAddPagoModal(false)} className="px-6 py-2.5 bg-white text-slate-600 font-bold border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200">
                  <CheckCircle2 size={18} />
                  Guardar Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingDocId ? 'Editar' : 'Registrar'} Documento Financiero</h3>
              <button onClick={() => {
                setShowModal(false);
                setEditingDocId(null);
                setPreviewDoc(null);
              }} className="text-indigo-200 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {previewDoc ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600" size={24} />
                    <div>
                      <p className="text-sm font-bold text-emerald-900">Extracción Exitosa</p>
                      <p className="text-xs text-emerald-700">Revisa los campos extraídos antes de confirmar el guardado.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular a Convenio</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                        value={selectedConvenioId}
                        onChange={e => {
                          setSelectedConvenioId(e.target.value);
                          if (previewDoc) setPreviewDoc({...previewDoc, convenioId: e.target.value});
                        }}
                      >
                        <option value="">Ninguno</option>
                        {state.convenios.map(c => (
                          <option key={c.id} value={c.id}>{c.numero}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vincular a Contrato</label>
                      <select 
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold"
                        value={selectedContractId}
                        onChange={e => {
                          setSelectedContractId(e.target.value);
                          if (previewDoc) setPreviewDoc({...previewDoc, contractId: e.target.value});
                        }}
                      >
                        <option value="">Ninguno</option>
                        {state.contratos.map(c => (
                          <option key={c.id} value={c.id}>{c.numero}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Información del CDP</h4>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo de Documento</label>
                        <select 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold"
                          value={previewDoc.tipo}
                          onChange={e => setPreviewDoc({...previewDoc, tipo: e.target.value as any})}
                        >
                          <option value="CDP">CDP (Disponibilidad)</option>
                          <option value="RC">RC (Registro Compromiso)</option>
                          <option value="Otros">Otros</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Número {previewDoc.tipo === 'CDP' ? 'CDP' : 'RC'}
                          </label>
                          <input 
                            type="text" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={previewDoc.numero}
                            onChange={e => setPreviewDoc({...previewDoc, numero: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Valor {previewDoc.tipo === 'CDP' ? 'CDP' : 'RC'}
                          </label>
                          <input 
                            type="number" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-indigo-600"
                            value={previewDoc.valor}
                            onChange={e => setPreviewDoc({...previewDoc, valor: Number(e.target.value)})}
                          />
                        </div>
                      </div>
                      {previewDoc.tipo === 'RC' && (
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vincular a Número de CDP</label>
                          <select 
                            className="w-full p-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-black"
                            value={previewDoc.numeroCdp || ''}
                            onChange={e => setPreviewDoc({...previewDoc, numeroCdp: e.target.value})}
                          >
                            <option value="">Seleccione CDP...</option>
                            {projectDocs.filter(d => d.tipo === 'CDP').map(cdp => (
                              <option key={cdp.id} value={cdp.numero}>
                                CDP {cdp.numero} - {formatCurrency(cdp.valor)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Descripción / Objeto</label>
                        <textarea 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm h-20"
                          value={previewDoc.descripcion}
                          onChange={e => setPreviewDoc({...previewDoc, descripcion: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Información del RC (Si aplica)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Número RC</label>
                          <input 
                            type="text" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={previewDoc.numeroRc || ''}
                            onChange={e => setPreviewDoc({...previewDoc, numeroRc: e.target.value})}
                            placeholder="Ej: 1255"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor RC</label>
                          <input 
                            type="number" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-emerald-600"
                            value={previewDoc.valorRc || ''}
                            onChange={e => setPreviewDoc({...previewDoc, valorRc: Number(e.target.value)})}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha RC</label>
                          <input 
                            type="date" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={previewDoc.fechaRc || ''}
                            onChange={e => setPreviewDoc({...previewDoc, fechaRc: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Estado</label>
                          <input 
                            type="text" 
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                            value={previewDoc.estado || ''}
                            onChange={e => setPreviewDoc({...previewDoc, estado: e.target.value})}
                            placeholder="Asignado"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Beneficiario / Nombre</label>
                        <input 
                          type="text" 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={previewDoc.nombre || ''}
                          onChange={e => setPreviewDoc({...previewDoc, nombre: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Rubro</label>
                      <input 
                        type="text" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={previewDoc.rubro || ''}
                        onChange={e => setPreviewDoc({...previewDoc, rubro: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fuente</label>
                      <input 
                        type="text" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={previewDoc.fuente || ''}
                        onChange={e => setPreviewDoc({...previewDoc, fuente: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Usuario</label>
                      <input 
                        type="text" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={previewDoc.usuario || ''}
                        onChange={e => setPreviewDoc({...previewDoc, usuario: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {!projectId && (
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Proyecto Destino</label>
                      <select 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                        value={selectedProjectId}
                        onChange={e => setSelectedProjectId(e.target.value)}
                      >
                        <option value="">-- Seleccione un Proyecto --</option>
                        {availableProjects.map(p => (
                          <option key={p.id} value={p.id}>{p.id} - {p.nombre}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Convenio</label>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="Buscar por número..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          value={convenioSearch}
                          onChange={e => setConvenioSearch(e.target.value)}
                        />
                        <select 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={selectedConvenioId}
                          onChange={e => setSelectedConvenioId(e.target.value)}
                        >
                          <option value="">Ninguno</option>
                          {projectConvenios.map(c => (
                            <option key={c.id} value={c.id}>{c.numero} - {c.nombre}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Contrato</label>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          placeholder="Buscar por número..."
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                          value={contractSearch}
                          onChange={e => setContractSearch(e.target.value)}
                        />
                        <select 
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                          value={selectedContractId}
                          onChange={e => setSelectedContractId(e.target.value)}
                        >
                          <option value="">Ninguno</option>
                          {projectContracts.map(c => (
                            <option key={c.id} value={c.id}>{c.numero} ({c.tipo})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Otrosí</label>
                      <select 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={selectedOtrosieId}
                        onChange={e => setSelectedOtrosieId(e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {projectOtrosies.map(o => (
                          <option key={o.id} value={o.id}>{o.numero}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vincular a Evento</label>
                      <select 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={selectedEventoId}
                        onChange={e => setSelectedEventoId(e.target.value)}
                      >
                        <option value="">Ninguno</option>
                        {state.eventos.map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                      <Activity size={18} />
                      Extracción Automática con IA
                    </h4>
                    <p className="text-sm text-indigo-700 mb-4">
                      Pega el texto del CDP o RC extraído de la matriz o documento oficial. La IA extraerá todos los campos automáticamente.
                    </p>
                    <textarea
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                      placeholder="Ejemplo: 15-0001 13.000.000,00 124 SUBDIRECC DE REDUCCION..."
                      className="w-full h-32 p-4 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => {
                  if (previewDoc) setPreviewDoc(null);
                  else setShowModal(false);
                }}
                className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all"
              >
                {previewDoc ? 'Volver' : 'Cancelar'}
              </button>
              
              {previewDoc ? (
                <button 
                  onClick={handleSave}
                  className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Confirmar y Guardar
                </button>
              ) : (
                <button 
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Upload size={18} />}
                  Analizar Documento
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showImportPagosModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <FileSpreadsheet size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Importar Pagos (CSV)</h2>
                  <p className="text-emerald-100 text-xs">Carga masiva de pagos vinculados a contratos</p>
                </div>
              </div>
              <button onClick={() => setShowImportPagosModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 max-h-[80vh] overflow-y-auto">
              <ImportPagosCSV 
                contracts={state.contratos} 
                onComplete={() => setShowImportPagosModal(false)} 
              />
            </div>
          </div>
        </div>
      )}

      {selectedPagoToEdit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2"><Edit /> Editar Pago No. {selectedPagoToEdit.numero}</h3>
                <p className="text-indigo-100 text-sm mt-1">Asociado a: {selectedPagoToEdit.beneficiario}</p>
              </div>
              <button onClick={() => setSelectedPagoToEdit(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Número de Pago / Comprobante</label>
                  <input 
                    type="text" 
                    value={selectedPagoToEdit.numero}
                    onChange={(e) => setSelectedPagoToEdit({...selectedPagoToEdit, numero: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Fecha de Pago</label>
                  <input 
                    type="date" 
                    value={selectedPagoToEdit.fecha}
                    onChange={(e) => setSelectedPagoToEdit({...selectedPagoToEdit, fecha: e.target.value})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Valor Pagado</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                      type="number" 
                      value={selectedPagoToEdit.valor}
                      onChange={(e) => setSelectedPagoToEdit({...selectedPagoToEdit, valor: parseFloat(e.target.value) || 0})}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Estado</label>
                  <select 
                    value={selectedPagoToEdit.estado}
                    onChange={(e) => setSelectedPagoToEdit({...selectedPagoToEdit, estado: e.target.value as any})}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Asociar a RC (Documento Financiero)</label>
                <select 
                  value={selectedPagoToEdit.rcId || ''}
                  onChange={(e) => {
                    const rcId = e.target.value;
                    const matchedRC = state.financialDocuments.find((d: any) => d.id === rcId);
                    setSelectedPagoToEdit({
                      ...selectedPagoToEdit, 
                      rcId,
                      rc: matchedRC?.numero || '',
                      cdp: matchedRC?.numeroCdp || ''
                    });
                  }}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Sin asociación (S/V) --</option>
                  {state.financialDocuments.filter((d: any) => d.tipo === 'RC').sort((a: any, b: any) => a.numero.localeCompare(b.numero)).map((rc: any) => (
                    <option key={rc.id} value={rc.id}>
                      RC No. {rc.numero} - {rc.nombre || rc.descripcion?.substring(0, 50)} ({formatCurrency(rc.valor)})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 italic">Asociar el pago a un RC permite rastrear la ejecución presupuestaria del contrato.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Observaciones</label>
                <textarea 
                  value={selectedPagoToEdit.observaciones}
                  onChange={(e) => setSelectedPagoToEdit({...selectedPagoToEdit, observaciones: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  placeholder="Detalles adicionales del pago..."
                />
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedPagoToEdit(null)}
                className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={() => {
                  updatePago(selectedPagoToEdit);
                  setSelectedPagoToEdit(null);
                  showAlert('Pago actualizado exitosamente');
                }}
                className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};