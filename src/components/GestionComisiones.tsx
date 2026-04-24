import React, { useState, useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { MapPin, Calendar, Users, DollarSign, PlusCircle, FileText, CheckCircle2, Clock, AlertTriangle, Search, FileSearch, Loader2, AlertCircle, Trash2, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Comision } from '../types';
import { formatDateForInput } from '../lib/storage';
import { ComisionDetailView } from './ComisionDetailView';
import { calculateViaticos } from '../utils/viaticos';
import { extractCommissionData } from '../services/geminiService';
import { AIProviderSelector } from './AIProviderSelector';
import { HeatMapComisiones } from './HeatMapComisiones';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export const GestionComisiones: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { state, addComision, updateComision, deleteComision, addSeguimiento } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [profSearchTerm, setProfSearchTerm] = useState('');
  const [projSearchTerm, setProjSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingComision, setEditingComision] = useState<Comision | null>(null);
  const [selectedComision, setSelectedComision] = useState<Comision | null>(null);
  
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24) + 1;
    return Math.max(1, diffDays);
  };

  const [newComision, setNewComision] = useState<Partial<Comision>>({
    projectId: projectId || undefined,
    projectIds: projectId ? [projectId] : [],
    professionalIds: [],
    tipoVinculacion: 'CONTRATISTA',
    responsableNombre: '',
    tipoComision: '',
    proyectoNombre: '',
    departamento: '',
    municipios: '',
    objeto: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date().toISOString().split('T')[0],
    anio: new Date().getFullYear(),
    numeroDias: 1,
    requiereViaticos: true,
    transporteTerrestre: true,
    rutaAerea: 'N.A',
    autorizadoVB: 'V.°B°',
    planTrabajo1: '',
    planTrabajo2: '',
    planTrabajo3: '',
    linkSoporte: '',
    fechaSolicitudFuncionario: new Date().toISOString().split('T')[0],
    fechaSolicitud: new Date().toISOString().split('T')[0],
    fechaAprobacionSG: new Date().toISOString().split('T')[0],
    diasGestionHabiles: 0,
    pernocta: true,
    eventoId: '',
    costosAdicionales: {
      transporte: 0,
      viaticos: 0,
      alojamiento: 0
    },
    estado: 'Programada'
  });

  React.useEffect(() => {
    if (editingComision) {
      setNewComision(editingComision);
    } else {
      setNewComision({
        projectId: projectId || undefined,
        projectIds: projectId ? [projectId] : [],
        professionalIds: [],
        tipoVinculacion: 'CONTRATISTA',
        responsableNombre: '',
        tipoComision: '',
        proyectoNombre: '',
        departamento: '',
        municipios: '',
        objeto: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        fechaFin: new Date().toISOString().split('T')[0],
        anio: new Date().getFullYear(),
        numeroDias: 1,
        requiereViaticos: true,
        transporteTerrestre: true,
        rutaAerea: 'N.A',
        autorizadoVB: 'V.°B°',
        planTrabajo1: '',
        planTrabajo2: '',
        planTrabajo3: '',
        linkSoporte: '',
        fechaSolicitudFuncionario: new Date().toISOString().split('T')[0],
        fechaSolicitud: new Date().toISOString().split('T')[0],
        fechaAprobacionSG: new Date().toISOString().split('T')[0],
        diasGestionHabiles: 0,
        pernocta: true,
        eventoId: '',
        costosAdicionales: {
          transporte: 0,
          viaticos: 0,
          alojamiento: 0
        },
        estado: 'Programada'
      });
    }
  }, [editingComision, projectId]);

  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleProcessText = async (text: string) => {
    setIsExtracting(true);
    setExtractionError(null);

    try {
      const extracted = await extractCommissionData(text);
      
      // Auto-match participants by name if they exist in state
      const matchedParticipantIds: string[] = [];
      if (extracted.responsableNombre) {
        const prof = state.professionals.find(p => 
          (p.nombre || '').toLowerCase().includes((extracted.responsableNombre || '').toLowerCase()) ||
          (extracted.responsableNombre || '').toLowerCase().includes((p.nombre || '').toLowerCase())
        );
        if (prof) matchedParticipantIds.push(prof.id);
      }

      setNewComision(prev => ({
        ...prev,
        ...extracted,
        professionalIds: matchedParticipantIds.length > 0 ? matchedParticipantIds : prev.professionalIds,
      }));
      setShowPasteArea(false);
      setPastedText('');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionError('No se pudo extraer la información. Verifique el contenido o el proveedor de IA.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      await handleProcessText(text);
    } catch (err) {
      setExtractionError('Error al leer el archivo.');
    }
  };

  const calculatedCost = React.useMemo(() => {
    const days = newComision.numeroDias || 1;
    let totalViaticos = 0;
    
    const profsCost = (newComision.professionalIds || []).reduce((sum, id) => {
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
      
      return sum + (dailyValue * days);
    }, 0);
    const additional = (newComision.costosAdicionales?.transporte || 0) + 
                       totalViaticos + 
                       (newComision.costosAdicionales?.alojamiento || 0);
    return profsCost + additional;
  }, [newComision, state.professionals]);

  const handleSaveComision = () => {
    if (!newComision.objeto) {
      alert('Por favor complete todos los campos obligatorios.');
      return;
    }

    const days = newComision.numeroDias || 1;
    let totalViaticos = 0;
    const viaticosDetalle: any[] = [];

    const profsCost = (newComision.professionalIds || []).reduce((sum, id) => {
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

    const additional = (newComision.costosAdicionales?.transporte || 0) + 
                       totalViaticos + 
                       (newComision.costosAdicionales?.alojamiento || 0);
    
    const total = profsCost + additional;

    if (editingComision) {
      const updatedComision: Comision = {
        ...newComision as Comision,
        id: editingComision.id,
        costoProfesionales: profsCost,
        costosAdicionales: {
          ...newComision.costosAdicionales!,
          viaticos: totalViaticos
        },
        viaticosDetalle,
        costoTotal: total
      };
      updateComision(updatedComision);
    } else {
      const comision: Comision = {
        ...newComision as Comision,
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
      
      if (newComision.projectIds && newComision.projectIds.length > 0) {
        newComision.projectIds.forEach(pid => {
          const project = state.proyectos.find(p => p.id === pid);
          if (project) {
            addSeguimiento({
              id: `SEG-COM-${Date.now()}-${pid}`,
              projectId: pid,
              fecha: new Date().toISOString().split('T')[0],
              tipo: 'Técnico',
              responsable: 'Sistema',
              descripcion: `Se programó nueva comisión a ${comision.municipios || project.municipio} con objeto: ${comision.objeto}`,
              trazabilidad: 'Comisión creada desde Gestión de Comisiones'
            });
          }
        });
      }
    }

    setShowNewModal(false);
    setEditingComision(null);
    setNewComision({
      projectId: projectId || undefined,
      projectIds: projectId ? [projectId] : [],
      professionalIds: [],
      tipoVinculacion: 'CONTRATISTA',
      responsableNombre: '',
      tipoComision: '',
      proyectoNombre: '',
      departamento: '',
      municipios: '',
      objeto: '',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      anio: new Date().getFullYear(),
      numeroDias: 1,
      requiereViaticos: true,
      transporteTerrestre: true,
      rutaAerea: 'N.A',
      autorizadoVB: 'V.°B°',
      planTrabajo1: '',
      planTrabajo2: '',
      planTrabajo3: '',
      linkSoporte: '',
      fechaSolicitudFuncionario: new Date().toISOString().split('T')[0],
      fechaSolicitud: new Date().toISOString().split('T')[0],
      fechaAprobacionSG: new Date().toISOString().split('T')[0],
      diasGestionHabiles: 0,
      pernocta: true,
      eventoId: '',
      costosAdicionales: { transporte: 0, viaticos: 0, alojamiento: 0 },
      estado: 'Programada'
    });
  };

  const filteredComisiones = state.comisiones.filter(c => 
    (!projectId || c.projectIds?.includes(projectId) || c.projectId === projectId) &&
    ((c.municipios || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (c.objeto || '').toLowerCase().includes((searchTerm || '').toLowerCase()))
  );

  const projectComisiones = state.comisiones.filter(c => !projectId || c.projectIds?.includes(projectId) || c.projectId === projectId);
  const totalComisionesCost = projectComisiones
    .filter(c => c.estado !== 'Cancelada' && c.estado !== 'Rechazada')
    .reduce((sum, c) => sum + (c.costoTotal || 0), 0);
  const activeComisiones = projectComisiones.filter(c => c.estado === 'En Curso').length;
  
  const profesionalesEnTerreno = new Set(
    projectComisiones
      .filter(c => c.estado === 'En Curso')
      .flatMap(c => c.professionalIds || [])
  ).size;

  const validComisionesForDays = projectComisiones.filter(c => c.numeroDias && c.numeroDias > 0);
  const avgDias = validComisionesForDays.length > 0 
    ? (validComisionesForDays.reduce((sum, c) => sum + (c.numeroDias || 0), 0) / validComisionesForDays.length).toFixed(1)
    : '0.0';

  const deptRanking = React.useMemo(() => {
    const counts: Record<string, number> = {};
    projectComisiones.forEach(c => {
      const dept = c.departamento || 'No Definido';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [projectComisiones]);

  const totalViaticosCost = projectComisiones.reduce((sum, c) => sum + (c.costosAdicionales?.viaticos || 0), 0);
  const totalTransporteCost = projectComisiones.reduce((sum, c) => sum + (c.costosAdicionales?.transporte || 0), 0);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <MapPin className="text-indigo-600" size={32} />
            Gestión de Comisiones
          </h1>
          <p className="text-slate-500 mt-2">Rastreo y medición de comisiones en terreno, personal y costos operativos.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowNewModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <PlusCircle size={20} />
            Programar Comisión
          </button>
        </div>
      </div>

      {/* Didactic Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Users size={160} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black mb-4">Objetivos de las Comisiones</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-lg shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Verificación Técnica</p>
                    <p className="text-xs text-indigo-100">Validación en sitio de los reportes de avance físico y calidad de obra.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-lg shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Acompañamiento Social</p>
                    <p className="text-xs text-indigo-100">Gestión con comunidades y autoridades locales para asegurar la viabilidad.</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-lg shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Control de Riesgos</p>
                    <p className="text-xs text-indigo-100">Identificación temprana de alertas que puedan comprometer el cronograma.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white/20 rounded-lg shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Impacto Territorial</p>
                    <p className="text-xs text-indigo-100">Fortalecimiento de la presencia institucional en las regiones afectadas.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-indigo-600" />
            Ranking por Departamento
          </h3>
          <div className="space-y-4">
            {deptRanking.map(([dept, count], index) => (
              <div key={dept} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 flex items-center justify-center bg-slate-100 rounded-full text-[10px] font-bold text-slate-500">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{dept}</span>
                </div>
                <span className="text-sm font-black text-indigo-600">{count}</span>
              </div>
            ))}
            {deptRanking.length === 0 && (
              <p className="text-center py-8 text-slate-400 text-sm">No hay datos suficientes</p>
            )}
          </div>
        </div>
      </div>

      {/* Dashboard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
              <MapPin size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Comisiones</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{projectComisiones.length}</p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <DollarSign size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Costo Total</p>
          </div>
          <p className="text-xl font-black text-slate-800">
            ${totalComisionesCost.toLocaleString('es-CO')}
          </p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <DollarSign size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Viáticos</p>
          </div>
          <p className="text-xl font-black text-slate-800">
            ${totalViaticosCost.toLocaleString('es-CO')}
          </p>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">En Curso</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{activeComisiones}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Users size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prof. Terreno</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{profesionalesEnTerreno}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <Calendar size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prom. Días</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{avgDias}</p>
        </div>
      </div>

      {/* Heatmap de Comisiones */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MapPin className="text-purple-600" size={24} />
          Mapa de Calor de Comisiones por Departamento
        </h2>
        <HeatMapComisiones comisiones={projectComisiones} />
      </div>

      {/* Search and Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-4">
        <input 
          type="text" 
          placeholder="Buscar por destino u objetivo..." 
          className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Comisiones List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComisiones.map(comision => {
          const associatedProjects = state.proyectos.filter(p => comision.projectIds?.includes(p.id) || comision.projectId === p.id);
          const associatedProfessionals = state.professionals.filter(p => comision.professionalIds.includes(p.id));

          const cardBorderColor = 
            comision.estado === 'En Curso' ? 'border-blue-300 ring-2 ring-blue-500/10' :
            comision.estado === 'Ejecutada' ? 'border-emerald-200' :
            comision.estado === 'Programada' ? 'border-amber-200' : 'border-slate-200';

          return (
            <div 
              key={comision.id} 
              onClick={() => setSelectedComision(comision)}
              className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 ${cardBorderColor}`}
            >
              <div className="p-6 border-b border-slate-100 relative">
                <div className={`absolute top-0 right-0 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
                  comision.estado === 'Ejecutada' ? 'bg-emerald-600 text-white' :
                  comision.estado === 'En Curso' ? 'bg-blue-600 text-white' :
                  comision.estado === 'Programada' ? 'bg-amber-500 text-white' :
                  'bg-rose-600 text-white'
                }`}>
                  {comision.estado === 'Ejecutada' ? <CheckCircle2 size={10} /> :
                   comision.estado === 'En Curso' ? <Clock size={10} /> :
                   comision.estado === 'Programada' ? <Calendar size={10} /> :
                   <AlertTriangle size={10} />}
                  {comision.estado}
                </div>

                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <MapPin size={20} />
                  </div>
                  <div className="pr-16 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{comision.municipios || 'Sin destino'}</h3>
                      <div className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        comision.tipoVinculacion === 'CONTRATISTA' ? 'bg-indigo-100 text-indigo-700' :
                        comision.tipoVinculacion === 'FUNCIONARIO' ? 'bg-purple-100 text-purple-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {comision.tipoVinculacion}
                      </div>
                    </div>
                    <p className="text-indigo-600 font-medium text-xs uppercase tracking-wider">{comision.tipoComision || 'Comisión Técnica'}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fechas:</span>
                    <span className="font-medium text-slate-700">{comision.fechaInicio} / {comision.fechaFin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Duración:</span>
                    <span className="font-medium text-slate-700">{comision.numeroDias} días</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Participantes:</span>
                    <span className="font-medium text-slate-700">{associatedProfessionals.length}</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 space-y-4">
                <div className="bg-white p-3 rounded-xl border border-slate-200 min-h-[64px]">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Objeto</p>
                  <p className="text-xs text-slate-600 line-clamp-2 italic leading-relaxed">"{comision.objeto}"</p>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-between items-end">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Costo Total</p>
                    <p className="font-black text-slate-900">${comision.costoTotal.toLocaleString('es-CO')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingComision(comision);
                        setShowNewModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-indigo-100 shadow-sm"
                      title="Editar Comisión"
                    >
                      <FileText size={18} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('¿Está seguro de eliminar esta comisión?')) {
                          deleteComision(comision.id);
                        }
                      }}
                      className="p-2 text-rose-400 hover:text-rose-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-rose-100 shadow-sm"
                      title="Eliminar Comisión"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
        {filteredComisiones.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 border-dashed">
            <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-700 mb-1">No hay comisiones</h3>
            <p className="text-slate-500">No se encontraron comisiones que coincidan con la búsqueda.</p>
          </div>
        )}
      
      {/* Modal Programar Comisión (Placeholder) */}
      {showNewModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">{editingComision ? 'Editar Comisión' : 'Programar Nueva Comisión'}</h3>
              <button onClick={() => { setShowNewModal(false); setEditingComision(null); }} className="text-indigo-200 hover:text-white">
                ✕
              </button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              {/* AI Extraction Section */}
              <div className="md:col-span-2 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSearch className="text-indigo-600" size={20} />
                    <h4 className="font-bold text-slate-800 text-sm">Extracción Inteligente (PDF o Texto)</h4>
                  </div>
                  <AIProviderSelector />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-white transition-all text-indigo-600 font-bold text-sm disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Analizando...
                      </>
                    ) : (
                      <>
                        <PlusCircle size={18} />
                        Cargar PDF/TXT
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPasteArea(!showPasteArea)}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-indigo-200 rounded-xl hover:bg-indigo-100 transition-all text-indigo-600 font-bold text-sm"
                  >
                    <FileText size={18} />
                    {showPasteArea ? 'Ocultar área de texto' : 'Pegar texto copiado'}
                  </button>
                </div>

                {showPasteArea && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <textarea
                      placeholder="Pegue aquí el texto de la comisión (ej. desde Excel o correo)..."
                      className="w-full p-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-300 h-32 text-sm"
                      value={pastedText}
                      onChange={(e) => setPastedText(e.target.value)}
                    />
                    <button
                      onClick={() => handleProcessText(pastedText)}
                      disabled={!pastedText.trim() || isExtracting}
                      className="w-full py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm hover:bg-indigo-700 disabled:opacity-50"
                    >
                      Procesar Texto Pegado
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".pdf,.txt"
                />
                {extractionError && (
                  <p className="text-xs text-rose-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {extractionError}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Datos de la Comisión</h4>
                
                {/* Event Selection */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Evento Relacionado (Opcional)</label>
                  <select 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newComision.eventoId || ''}
                    onChange={(e) => setNewComision({ ...newComision, eventoId: e.target.value })}
                  >
                    <option value="">Seleccione un evento...</option>
                    {state.eventos.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.nombre} ({ev.municipiosAfectados.join(', ')})</option>
                    ))}
                  </select>
                </div>

                {/* Project Selection with Search */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Proyectos Asociados (Opcional)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Buscar proyecto por nombre o municipio..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 mb-2"
                      value={projSearchTerm}
                      onChange={(e) => setProjSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg bg-slate-50 p-2">
                    {state.proyectos
                      .filter(p => 
                        (p.nombre || '').toLowerCase().includes((projSearchTerm || '').toLowerCase()) || 
                        (p.municipio || '').toLowerCase().includes((projSearchTerm || '').toLowerCase()) ||
                        (p.id || '').toLowerCase().includes((projSearchTerm || '').toLowerCase())
                      )
                      .map(p => {
                        const isSelected = newComision.projectIds?.includes(p.id);
                        return (
                          <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-slate-100 rounded cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={isSelected || false}
                              onChange={(e) => {
                                const currentIds = newComision.projectIds || [];
                                const newIds = e.target.checked 
                                  ? [...currentIds, p.id]
                                  : currentIds.filter(id => id !== p.id);
                                
                                setNewComision({ 
                                  ...newComision, 
                                  projectIds: newIds,
                                  projectId: newIds.length > 0 ? newIds[0] : undefined,
                                  proyectoNombre: newIds.length > 0 ? 'Múltiples Proyectos' : ''
                                });
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-xs text-slate-700">{p.id} - {p.nombre} ({p.municipio})</span>
                          </label>
                        );
                      })
                    }
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Vinculación</label>
                    <select 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newComision.tipoVinculacion}
                      onChange={(e) => setNewComision({ ...newComision, tipoVinculacion: e.target.value as any })}
                    >
                      <option value="CONTRATISTA">Contratista</option>
                      <option value="FUNCIONARIO">Funcionario</option>
                      <option value="OTRO">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tipo Comisión</label>
                    <select 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.tipoComision || ''}
                      onChange={(e) => setNewComision({ ...newComision, tipoComision: e.target.value })}
                    >
                      <option value="">Seleccionar tipo...</option>
                      <option value="INVITACION">INVITACION</option>
                      <option value="VISITA TECNICA">VISITA TECNICA</option>
                      <option value="SEGUIMIENTO DE OBRAS">SEGUIMIENTO DE OBRAS</option>
                      <option value="SEGUIMIENTO DE PROYECTOS">SEGUIMIENTO DE PROYECTOS</option>
                      <option value="ASISTENCIA TECNICA">ASISTENCIA TECNICA</option>
                      <option value="REALIZACION DE EVENTO">REALIZACION DE EVENTO</option>
                      <option value="SEGUIMIENTO A SENTENCIAS">SEGUIMIENTO A SENTENCIAS</option>
                      <option value="ENTES DE CONTROL">ENTES DE CONTROL</option>
                      <option value="APOYO JURIDICO">APOYO JURIDICO</option>
                      <option value="SEGUIMENTO (CTA) FIC SRR">SEGUIMENTO (CTA) FIC SRR</option>
                      <option value="SEGUIMIENTO FIC´s">SEGUIMIENTO FIC´s</option>
                      <option value="OTRO">OTRO</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Responsable</label>
                  <input 
                    type="text"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={newComision.responsableNombre || ''}
                    onChange={(e) => setNewComision({ ...newComision, responsableNombre: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Departamento</label>
                    <input 
                      type="text"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.departamento || ''}
                      onChange={(e) => setNewComision({ ...newComision, departamento: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Municipios</label>
                    <input 
                      type="text"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.municipios || ''}
                      onChange={(e) => setNewComision({ ...newComision, municipios: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Objeto de la Comisión</label>
                  <textarea 
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm h-20"
                    value={newComision.objeto || ''}
                    onChange={(e) => setNewComision({ ...newComision, objeto: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Inicio</label>
                    <input 
                      type="date" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={formatDateForInput(newComision.fechaInicio || '')}
                      onChange={(e) => setNewComision({ ...newComision, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Fecha Fin</label>
                    <input 
                      type="date" 
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={formatDateForInput(newComision.fechaFin || '')}
                      onChange={(e) => setNewComision({ ...newComision, fechaFin: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Año</label>
                    <input 
                      type="number"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.anio || 2026}
                      onChange={(e) => setNewComision({ ...newComision, anio: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Días</label>
                    <input 
                      type="number"
                      step="0.5"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.numeroDias || 0}
                      onChange={(e) => setNewComision({ ...newComision, numeroDias: Number(e.target.value) })}
                    />
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newComision.requiereViaticos}
                        onChange={(e) => setNewComision({ ...newComision, requiereViaticos: e.target.checked })}
                      />
                      <span className="text-[10px] font-bold">Viáticos</span>
                    </label>
                  </div>
                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newComision.destinoInternacional}
                        onChange={(e) => setNewComision({ ...newComision, destinoInternacional: e.target.checked })}
                      />
                      <span className="text-[10px] font-bold">Internacional</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-slate-800 border-b pb-2">Plan de Trabajo y Gestión</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center pt-2">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={newComision.transporteTerrestre}
                        onChange={(e) => setNewComision({ ...newComision, transporteTerrestre: e.target.checked })}
                      />
                      <span className="text-[10px] font-bold">Transp. Terrestre</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ruta Aérea</label>
                    <input 
                      type="text"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.rutaAerea || ''}
                      onChange={(e) => setNewComision({ ...newComision, rutaAerea: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Autorizado V.°B°</label>
                  <input 
                    type="text"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                    value={newComision.autorizadoVB || ''}
                    onChange={(e) => setNewComision({ ...newComision, autorizadoVB: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase">Plan de Trabajo</label>
                  <input 
                    type="text"
                    placeholder="Plan 1"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    value={newComision.planTrabajo1 || ''}
                    onChange={(e) => setNewComision({ ...newComision, planTrabajo1: e.target.value })}
                  />
                  <input 
                    type="text"
                    placeholder="Plan 2"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    value={newComision.planTrabajo2 || ''}
                    onChange={(e) => setNewComision({ ...newComision, planTrabajo2: e.target.value })}
                  />
                  <input 
                    type="text"
                    placeholder="Plan 3"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    value={newComision.planTrabajo3 || ''}
                    onChange={(e) => setNewComision({ ...newComision, planTrabajo3: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Días Gestión</label>
                    <input 
                      type="number"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.diasGestionHabiles || 0}
                      onChange={(e) => setNewComision({ ...newComision, diasGestionHabiles: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Link Soporte</label>
                    <input 
                      type="text"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                      value={newComision.linkSoporte || ''}
                      onChange={(e) => setNewComision({ ...newComision, linkSoporte: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Seleccionar Profesionales OPS</label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text"
                      placeholder="Buscar profesional..."
                      className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-200"
                      value={profSearchTerm}
                      onChange={(e) => setProfSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                    {state.professionals
                      .filter(p => 
                        (p.nombre || '').toLowerCase().includes((profSearchTerm || '').toLowerCase()) || 
                        (p.profesion || '').toLowerCase().includes((profSearchTerm || '').toLowerCase())
                      )
                      .map(prof => (
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
                        <div className="text-[10px]">
                          <p className="font-bold text-slate-700">{prof.nombre}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-100 px-8 pb-8">
                <div className="text-lg font-bold text-slate-800">
                  Total Estimado: <span className="text-indigo-600">${calculatedCost.toLocaleString()}</span>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => { setShowNewModal(false); setEditingComision(null); }}
                    className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                  >
                    Cerrar
                  </button>
                  <button 
                    onClick={handleSaveComision}
                    className="px-6 py-2 bg-indigo-600 text-white font-bold hover:bg-indigo-700 rounded-xl transition-all"
                  >
                    {editingComision ? 'Actualizar Comisión' : 'Guardar Comisión'}
                  </button>
                </div>
              </div>
          </div>
        </div>
      )}

      {selectedComision && (
        <ComisionDetailView 
          comision={selectedComision} 
          professionals={state.professionals}
          onClose={() => setSelectedComision(null)}
        />
      )}
    </div>
  );
};
