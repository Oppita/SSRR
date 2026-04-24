import React, { useState, useEffect, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { Comision, Professional, ProjectDocument } from '../types';
import { 
  MapPin, Calendar, Users, DollarSign, PlusCircle, 
  FileText, CheckCircle2, Clock, AlertTriangle, 
  Trash2, Download, Eye, Upload, Save, X, ChevronRight, Loader2, Search
} from 'lucide-react';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';
import { calculateViaticos } from '../utils/viaticos';

interface ComisionesTerritorioProps {
  projectId: string;
}

export const ComisionesTerritorio: React.FC<ComisionesTerritorioProps> = ({ projectId }) => {
  const { state, addComision, updateComision, deleteComision, addDocument, addSeguimiento } = useProject();
  const [showNewModal, setShowNewModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState<Comision | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState<Comision | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTerritory, setFilterTerritory] = useState('');
  const [filterResponsable, setFilterResponsable] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // New Commission Form State
  const [newComision, setNewComision] = useState<Partial<Comision>>({
    projectId,
    professionalIds: [],
    fechaAprobacion: new Date().toISOString().split('T')[0],
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    objeto: '',
    pernocta: true,
    costosAdicionales: {
      transporte: 0,
      viaticos: 0,
      alojamiento: 0
    },
    estado: 'Programada'
  });

  // Report Form State
  const [reportData, setReportData] = useState({
    actividades: '',
    hallazgos: '',
    conclusiones: '',
    recomendaciones: ''
  });

  const projectComisiones = state.comisiones.filter(c => c.projectId === projectId);
  
  const filteredComisiones = useMemo(() => {
    return projectComisiones.filter(c => {
      const matchesQuery = c.objeto.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTerritory = filterTerritory ? c.municipios.toLowerCase().includes(filterTerritory.toLowerCase()) : true;
      const matchesResponsable = filterResponsable ? c.professionalIds.some(id => {
        const prof = state.professionals.find(p => p.id === id);
        return prof?.nombre.toLowerCase().includes(filterResponsable.toLowerCase());
      }) : true;
      const matchesStartDate = filterStartDate ? c.fechaInicio >= filterStartDate : true;
      const matchesEndDate = filterEndDate ? c.fechaFin <= filterEndDate : true;
      return matchesQuery && matchesTerritory && matchesResponsable && matchesStartDate && matchesEndDate;
    });
  }, [projectComisiones, searchQuery, filterTerritory, filterResponsable, filterStartDate, filterEndDate, state.professionals]);

  const project = state.proyectos.find(p => p.id === projectId);

  const calculateDuration = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const calculateTotalCost = (com: Partial<Comision>) => {
    if (!com.fechaInicio || !com.fechaFin || !com.professionalIds) return 0;
    
    const days = calculateDuration(com.fechaInicio, com.fechaFin);
    let totalViaticos = 0;
    
    const profsCost = com.professionalIds.reduce((sum, id) => {
      const prof = state.professionals.find(p => p.id === id);
      if (!prof) return sum;
      const dailyValue = prof.valorHora * 8;
      
      const viaticosCalc = calculateViaticos(
        prof, 
        com.fechaAprobacion || new Date().toISOString().split('T')[0], 
        days, 
        com.pernocta ?? true,
        com.destinoInternacional
      );
      totalViaticos += viaticosCalc.total;
      
      return sum + (dailyValue * days);
    }, 0);

    const additional = (com.costosAdicionales?.transporte || 0) + 
                     totalViaticos + 
                     (com.costosAdicionales?.alojamiento || 0);
    
    return profsCost + additional;
  };

  const handleSaveComision = () => {
    if (!project || !newComision.objeto || newComision.professionalIds?.length === 0) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const days = calculateDuration(newComision.fechaInicio!, newComision.fechaFin!);
    let totalViaticos = 0;
    const viaticosDetalle: any[] = [];

    const profsCost = newComision.professionalIds!.reduce((sum, id) => {
      const prof = state.professionals.find(p => p.id === id);
      if (!prof) return sum;
      const dailyValue = prof.valorHora * 8;
      
      const viaticosCalc = calculateViaticos(
        prof, 
        newComision.fechaAprobacion || new Date().toISOString().split('T')[0], 
        days, 
        newComision.pernocta ?? true,
        newComision.destinoInternacional
      );
      totalViaticos += viaticosCalc.total;
      viaticosDetalle.push({
        professionalId: prof.id,
        dias: days,
        tarifaDiaria: viaticosCalc.tarifaDiaria,
        total: viaticosCalc.total
      });

      return sum + (dailyValue * days);
    }, 0);

    const total = profsCost + (newComision.costosAdicionales?.transporte || 0) + 
                  totalViaticos + 
                  (newComision.costosAdicionales?.alojamiento || 0);

    const comision: Comision = {
      ...newComision as Comision,
      municipios: project.municipio,
      id: `COM-${Date.now()}`,
      costoProfesionales: profsCost,
      costosAdicionales: {
        ...newComision.costosAdicionales!,
        viaticos: totalViaticos
      },
      viaticosDetalle,
      costoTotal: total
    };

    addComision(comision);
    
    // Add to tracking
    addSeguimiento({
      id: `SEG-COM-${Date.now()}`,
      projectId,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Institucional',
      descripcion: `Nueva comisión programada a ${comision.municipios}. Objeto: ${comision.objeto}. Costo total estimado: $${total.toLocaleString('es-CO')}`,
      responsable: 'Sistema (OPS)',
      trazabilidad: `Comisión ID: ${comision.id}`
    });

    setShowNewModal(false);
    setNewComision({
      projectId,
      professionalIds: [],
      fechaAprobacion: new Date().toISOString().split('T')[0],
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      objeto: '',
      pernocta: true,
      costosAdicionales: { transporte: 0, viaticos: 0, alojamiento: 0 },
      estado: 'Programada'
    });
  };

  const handleSaveReport = () => {
    if (!showReportModal) return;

    const updated: Comision = {
      ...showReportModal,
      estado: 'Ejecutada',
      informe: {
        ...reportData,
        fechaGeneracion: new Date().toISOString().split('T')[0]
      }
    };

    updateComision(updated);
    
    // Add to tracking
    addSeguimiento({
      id: `SEG-REP-${Date.now()}`,
      projectId,
      fecha: new Date().toISOString().split('T')[0],
      tipo: 'Institucional',
      descripcion: `Informe de comisión generado para ${updated.municipios}. Estado: Ejecutada.`,
      responsable: 'Sistema (OPS)',
      trazabilidad: `Comisión ID: ${updated.id}`
    });

    setShowReportModal(null);
    setReportData({ actividades: '', hallazgos: '', conclusiones: '', recomendaciones: '' });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, comision: Comision) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const folderPath = `Comisiones/${comision.id}`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);

      const newDoc: ProjectDocument = {
        id: `DOC-COM-${Date.now()}`,
        projectId,
        comisionId: comision.id,
        titulo: `Evidencia Comisión: ${file.name}`,
        tipo: 'Evidencia',
        area: 'OPS',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        tags: ['comision', 'evidencia', comision.municipios || ''],
        estado: 'Borrador',
        folderPath,
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: publicUrl,
          nombreArchivo: file.name,
          subidoPor: 'Admin OPS',
          accion: 'Subida',
          estado: 'Borrador'
        }]
      };

      addDocument(newDoc);
    } catch (error) {
      console.error("Error uploading evidence:", error);
      alert("Hubo un error al subir la evidencia.");
    } finally {
      setIsUploading(false);
    }
  };

  const totalAccumulatedCost = projectComisiones
    .filter(c => c.estado !== 'Cancelada' && c.estado !== 'Rechazada')
    .reduce((sum, c) => sum + c.costoTotal, 0);

  return (
    <div className="space-y-6">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-indigo-600" size={24} />
            Comisiones a Territorio
          </h3>
          <p className="text-slate-500 text-sm">Gestión de desplazamientos, costos y reportes de campo.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-100">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Costo Acumulado</p>
            <p className="text-lg font-black text-indigo-700">${totalAccumulatedCost.toLocaleString('es-CO')}</p>
          </div>
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <PlusCircle size={18} />
            Nueva Comisión
          </button>
        </div>
      </div>

      {/* Commissions List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mb-6">
        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Search size={18} className="text-indigo-600" />
          Búsqueda Avanzada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input 
            type="text" 
            placeholder="Buscar por objeto..." 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Territorio..." 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
            value={filterTerritory}
            onChange={e => setFilterTerritory(e.target.value)}
          />
          <input 
            type="text" 
            placeholder="Responsable..." 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
            value={filterResponsable}
            onChange={e => setFilterResponsable(e.target.value)}
          />
          <input 
            type="date" 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
            value={filterStartDate}
            onChange={e => setFilterStartDate(e.target.value)}
          />
          <input 
            type="date" 
            className="p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
            value={filterEndDate}
            onChange={e => setFilterEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredComisiones.map(comision => {
          const profs = state.professionals.filter(p => comision.professionalIds.includes(p.id));
          const docs = state.documentos.filter(d => d.comisionId === comision.id);
          const duration = calculateDuration(comision.fechaInicio, comision.fechaFin);

          return (
            <div key={comision.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:border-indigo-200 transition-all">
              <div className="p-5 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-lg text-slate-800">{comision.municipios}</h4>
                      <p className="text-sm text-slate-500 line-clamp-1">{comision.objeto}</p>
                    </div>
                    <div className="flex gap-1">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        comision.estado === 'Ejecutada' ? 'bg-emerald-100 text-emerald-700' :
                        comision.estado === 'En Curso' ? 'bg-blue-100 text-blue-700' :
                        comision.estado === 'Programada' ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {comision.estado}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('¿Está seguro de eliminar esta comisión?')) {
                            deleteComision(comision.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar size={14} className="text-slate-400" />
                      <span>{comision.fechaInicio} — {comision.fechaFin} ({duration} días)</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <DollarSign size={14} className="text-slate-400" />
                      <span className="font-bold text-slate-800">${comision.costoTotal.toLocaleString('es-CO')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 col-span-2">
                      <Users size={14} className="text-slate-400" />
                      <span className="truncate">{profs.map(p => p.nombre).join(', ')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  {comision.estado !== 'Ejecutada' ? (
                    <button 
                      onClick={() => {
                        setShowReportModal(comision);
                        setReportData({
                          actividades: comision.informe?.actividades || '',
                          hallazgos: comision.informe?.hallazgos || '',
                          conclusiones: comision.informe?.conclusiones || '',
                          recomendaciones: comision.informe?.recomendaciones || ''
                        });
                      }}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                      title="Generar Informe"
                    >
                      <FileText size={18} />
                      Informe
                    </button>
                  ) : (
                    <button 
                      onClick={() => setShowReportModal(comision)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                    >
                      <CheckCircle2 size={18} />
                      Ver Informe
                    </button>
                  )}
                  <button 
                    onClick={() => setShowEvidenceModal(comision)}
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                    title="Ver Evidencias"
                  >
                    <Eye size={18} />
                    {docs.length} Evidencias
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredComisiones.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No se encontraron comisiones</h3>
            <p className="text-slate-500">Intente ajustar los filtros de búsqueda.</p>
          </div>
        )}
      </div>

      {/* Modal: Nueva Comisión */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Programar Comisión a Territorio</h3>
                <p className="text-indigo-200 text-xs mt-1">Proyecto: {project?.nombre}</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-indigo-200 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Datos Básicos</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Objeto de la Comisión</label>
                  <textarea 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                    placeholder="Describa el propósito del viaje..."
                    value={newComision.objeto}
                    onChange={e => setNewComision({...newComision, objeto: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Inicio</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={formatDateForInput(newComision.fechaInicio)}
                      onChange={e => setNewComision({...newComision, fechaInicio: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Fin</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={formatDateForInput(newComision.fechaFin)}
                      onChange={e => setNewComision({...newComision, fechaFin: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Aprobación</label>
                    <input 
                      type="date" 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={formatDateForInput(newComision.fechaAprobacion)}
                      onChange={e => setNewComision({...newComision, fechaAprobacion: e.target.value})}
                    />
                  </div>
                  <div className="flex flex-col gap-2 mt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={newComision.pernocta}
                        onChange={e => setNewComision({...newComision, pernocta: e.target.checked})}
                      />
                      <span className="text-sm font-bold text-slate-700">Pernocta (Aplica 100% viáticos)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={newComision.destinoInternacional}
                        onChange={e => setNewComision({...newComision, destinoInternacional: e.target.checked})}
                      />
                      <span className="text-sm font-bold text-slate-700">Destino Internacional (USD)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Equipo y Costos</h4>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleccionar Profesionales OPS</label>
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                    {state.professionals.map(prof => (
                      <label key={prof.id} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={newComision.professionalIds?.includes(prof.id)}
                          onChange={e => {
                            const ids = newComision.professionalIds || [];
                            if (e.target.checked) {
                              setNewComision({...newComision, professionalIds: [...ids, prof.id]});
                            } else {
                              setNewComision({...newComision, professionalIds: ids.filter(id => id !== prof.id)});
                            }
                          }}
                          className="rounded text-indigo-600"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-slate-700">{prof.nombre}</p>
                          <p className="text-slate-500">{prof.profesion}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Costos Adicionales</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400">Transporte</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={newComision.costosAdicionales?.transporte}
                        onChange={e => setNewComision({
                          ...newComision, 
                          costosAdicionales: {...newComision.costosAdicionales!, transporte: Number(e.target.value)}
                        })}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Alojamiento</label>
                      <input 
                        type="number" 
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                        value={newComision.costosAdicionales?.alojamiento}
                        onChange={e => setNewComision({
                          ...newComision, 
                          costosAdicionales: {...newComision.costosAdicionales!, alojamiento: Number(e.target.value)}
                        })}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">* Los viáticos se calculan automáticamente según el Decreto Escala de Viáticos vigente.</p>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 mt-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-indigo-600">Costo Total Estimado:</span>
                    <span className="text-lg font-black text-indigo-700">${calculateTotalCost(newComision).toLocaleString('es-CO')}</span>
                  </div>
                  <p className="text-[10px] text-indigo-400 italic">Incluye honorarios diarios de profesionales y costos adicionales.</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => setShowNewModal(false)}
                className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveComision}
                className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
              >
                Programar Comisión
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Informe de Comisión */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-800 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Informe de Comisión Institucional</h3>
                <p className="text-slate-400 text-xs mt-1">{showReportModal.municipios} | {showReportModal.fechaInicio}</p>
              </div>
              <button onClick={() => setShowReportModal(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              {showReportModal.estado === 'Ejecutada' ? (
                <div className="space-y-6">
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex items-center gap-3">
                    <CheckCircle2 className="text-emerald-600" />
                    <div>
                      <p className="text-sm font-bold text-emerald-800">Comisión Finalizada</p>
                      <p className="text-xs text-emerald-600">Informe generado el {showReportModal.informe?.fechaGeneracion}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Actividades Realizadas</h5>
                      <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{showReportModal.informe?.actividades}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hallazgos Clave</h5>
                      <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{showReportModal.informe?.hallazgos}</p>
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conclusiones</h5>
                      <p className="text-sm text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-100">{showReportModal.informe?.conclusiones}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center gap-3 mb-4">
                    <AlertTriangle className="text-amber-600" />
                    <p className="text-xs text-amber-800 font-medium">Complete el informe para cerrar la comisión y registrar los resultados.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Actividades Realizadas</label>
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                      placeholder="Describa las tareas ejecutadas en territorio..."
                      value={reportData.actividades}
                      onChange={e => setReportData({...reportData, actividades: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hallazgos y Observaciones</label>
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                      placeholder="Identifique situaciones relevantes encontradas..."
                      value={reportData.hallazgos}
                      onChange={e => setReportData({...reportData, hallazgos: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conclusiones y Recomendaciones</label>
                    <textarea 
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                      placeholder="Resuma los resultados y pasos a seguir..."
                      value={reportData.conclusiones}
                      onChange={e => setReportData({...reportData, conclusiones: e.target.value})}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button 
                onClick={() => setShowReportModal(null)}
                className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-all"
              >
                {showReportModal.estado === 'Ejecutada' ? 'Cerrar' : 'Cancelar'}
              </button>
              {showReportModal.estado !== 'Ejecutada' && (
                <button 
                  onClick={handleSaveReport}
                  className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 flex items-center gap-2"
                >
                  <Save size={18} />
                  Finalizar y Guardar Informe
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Evidencias */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-slate-100 p-6 text-slate-800 flex justify-between items-center border-b">
              <div>
                <h3 className="text-xl font-bold">Evidencias de Comisión</h3>
                <p className="text-slate-500 text-xs mt-1">{showEvidenceModal.municipios}</p>
              </div>
              <button onClick={() => setShowEvidenceModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-slate-700">Archivos Adjuntos</h4>
                <label className={`cursor-pointer bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 text-sm border border-indigo-200 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                  {isUploading ? 'Subiendo...' : 'Subir Evidencia'}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={e => handleFileUpload(e, showEvidenceModal)}
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {state.documentos.filter(d => d.comisionId === showEvidenceModal.id).map(doc => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-indigo-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                        <FileText className="text-indigo-600" size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{doc.titulo}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-bold">{doc.fechaCreacion} | {doc.versiones[0].nombreArchivo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href={doc.versiones[0].url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Eye size={18} />
                      </a>
                      <a 
                        href={doc.versiones[0].url} 
                        download
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ))}
                {state.documentos.filter(d => d.comisionId === showEvidenceModal.id).length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl">
                    <FileText className="mx-auto text-slate-300 mb-2" size={32} />
                    <p className="text-sm text-slate-500">No hay evidencias cargadas aún.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setShowEvidenceModal(null)}
                className="px-8 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-900 transition-all"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
