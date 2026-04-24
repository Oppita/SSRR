import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProject } from '../store/ProjectContext';
import { Contractor, Contract, Project, ContractorEvaluation, ProjectDocument } from '../types';
import { 
  User, 
  Building2, 
  Briefcase, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ShieldCheck,
  Search,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Users,
  Info,
  PlusCircle,
  Star,
  ClipboardCheck,
  Plus,
  FolderOpen,
  ExternalLink,
  Upload,
  ShieldAlert,
  Globe,
  Loader2,
  Zap,
  MoreVertical
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { calculateContractorPerformance } from '../services/performanceService';
import { HeatMapContratistas } from './HeatMapContratistas';

interface ContractorProfileProps {
  onSelectProject?: (projectId: string) => void;
  externalContractorId?: string | null;
}

export const ContractorProfile: React.FC<ContractorProfileProps> = ({ onSelectProject, externalContractorId }) => {
  const { state, addContractorEvaluation, addDocument, updateContractor, addEnteControlRecord } = useProject();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map'>('dashboard');
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  
  const selectedContractorId = externalContractorId !== undefined ? externalContractorId : internalSelectedId;
  const setSelectedContractorId = externalContractorId !== undefined ? () => {} : setInternalSelectedId;
  const [searchTerm, setSearchTerm] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [comparisonIds, setComparisonIds] = useState<string[]>([]);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [showEnteForm, setShowEnteForm] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState<'Todos' | 'Alto' | 'Medio' | 'Bajo'>('Todos');
  const [newEval, setNewEval] = useState({
    periodo: '',
    calidad: 5,
    cumplimiento: 5,
    sst: 5,
    ambiental: 5,
    observaciones: ''
  });
  const [newEnteRecord, setNewEnteRecord] = useState({
    entidad: 'SARLAFT' as any,
    estado: 'Limpio' as any,
    fechaConsulta: new Date().toISOString().split('T')[0],
    descripcion: '',
    documentoUrl: ''
  });
  const [isSearchingPublicData, setIsSearchingPublicData] = useState(false);
  const [publicDataResult, setPublicDataResult] = useState<any>(null);

  const contractorsWithState = useMemo(() => {
    return state.contratistas.map(c => ({
      ...c,
      performance: calculateContractorPerformance(
        c.id,
        state.contratos,
        state.otrosies,
        state.alertas,
        state.evaluacionesContratistas,
        state.proyectos
      )
    }));
  }, [state.contratistas, state.contratos, state.otrosies, state.alertas, state.evaluacionesContratistas, state.proyectos]);

  const filteredContractors = useMemo(() => {
    return contractorsWithState.filter(c => {
      const matchesSearch = (c.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                            (c.nit || '').includes(searchTerm || '');
      const matchesFilter = performanceFilter === 'Todos' || c.performance.clasificacion === performanceFilter;
      return matchesSearch && matchesFilter;
    });
  }, [contractorsWithState, searchTerm, performanceFilter]);

  const contractorStats = useMemo(() => {
    if (!selectedContractorId) return null;
    
    const contractor = state.contratistas.find(c => c.id === selectedContractorId);
    if (!contractor) return null;

    const performance = calculateContractorPerformance(
      selectedContractorId,
      state.contratos,
      state.otrosies,
      state.alertas,
      state.evaluacionesContratistas,
      state.proyectos
    );

    const contracts = state.contratos.filter(c => c.nit === contractor.nit);
    
    const finishedContracts = contracts.filter(c => {
      const project = state.proyectos.find(p => p.id === c.projectId);
      return project?.estado === 'Liquidado' || project?.estado === 'En liquidación';
    });

    const finishedPct = contracts.length > 0 ? (finishedContracts.length / contracts.length) * 100 : 0;

    // Risk Patterns
    const risks = [];
    if (performance.eficiencia < 80) risks.push('Baja eficiencia en ejecución vs programación');
    if (performance.desviaciones > 2) risks.push('Frecuentes modificaciones contractuales (Otrosíes)');
    if (performance.desviacion > 15) risks.push('Alta desviación presupuestal acumulada');
    if (contracts.length > 5 && finishedPct < 50) risks.push('Baja tasa de finalización de proyectos');

    const evaluations = state.evaluacionesContratistas.filter(e => e.contractorId === selectedContractorId);
    const avgEval = evaluations.length > 0 
      ? evaluations.reduce((sum, e) => sum + (e.calificacionCalidad + e.calificacionCumplimiento + e.calificacionSST + e.calificacionAmbiental) / 4, 0) / evaluations.length 
      : 0;

    const entesControl = state.entesControl?.filter(e => e.tipoReferencia === 'Contratista' && e.referenciaId === selectedContractorId) || [];
    
    const hasSanciones = entesControl.some(e => e.estado === 'Sancionado');
    const hasHallazgos = entesControl.some(e => e.estado === 'Con Hallazgos');
    
    if (hasSanciones) risks.push('ALERTA CRÍTICA: Contratista Sancionado / Inhabilitado por Ente de Control');
    else if (hasHallazgos) risks.push('ALERTA: Hallazgos reportados por Entes de Control');

    return {
      contractor,
      contracts,
      totalValue: performance.valorTotal,
      finishedPct,
      delayedPct: 100 - performance.eficiencia,
      avgOtrosies: performance.desviaciones / (contracts.length || 1),
      score: hasSanciones ? 0 : hasHallazgos ? Math.max(0, performance.score - 30) : performance.score,
      risks,
      evaluations,
      avgEval,
      performance,
      entesControl
    };
  }, [selectedContractorId, state]);

  const globalStats = useMemo(() => {
    const totalContractors = state.contratistas.length;
    const totalContracts = state.contratos.length;
    const totalValue = state.contratos.reduce((sum, c) => sum + c.valor, 0);
    const avgScore = state.contratistas.reduce((acc, c) => {
      const perf = calculateContractorPerformance(c.id, state.contratos, state.otrosies, state.alertas, state.evaluacionesContratistas, state.proyectos);
      return acc + perf.score;
    }, 0) / (totalContractors || 1);

    return {
      totalContractors,
      totalContracts,
      totalValue,
      avgScore: Math.round(avgScore)
    };
  }, [state.contratistas, state.contratos, state.otrosies, state.alertas, state.evaluacionesContratistas, state.proyectos]);

  const handleAddEvaluation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractorId) return;

    addContractorEvaluation({
      id: `EVAL-${Date.now()}`,
      contractorId: selectedContractorId,
      fecha: new Date().toISOString().split('T')[0],
      periodo: newEval.periodo,
      calificacionCalidad: newEval.calidad,
      calificacionCumplimiento: newEval.cumplimiento,
      calificacionSST: newEval.sst,
      calificacionAmbiental: newEval.ambiental,
      observaciones: newEval.observaciones,
      evaluador: 'Administrador SRR'
    });

    setShowEvalForm(false);
    setNewEval({ periodo: '', calidad: 5, cumplimiento: 5, sst: 5, ambiental: 5, observaciones: '' });
  };

  const handleAddEnteRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractorId) return;

    addEnteControlRecord({
      id: `ENTE-${Date.now()}`,
      entidad: newEnteRecord.entidad,
      tipoReferencia: 'Contratista',
      referenciaId: selectedContractorId,
      estado: newEnteRecord.estado,
      fechaConsulta: newEnteRecord.fechaConsulta,
      descripcion: newEnteRecord.descripcion,
      documentoUrl: newEnteRecord.documentoUrl || undefined
    });

    setShowEnteForm(false);
    setPublicDataResult(null);
    setNewEnteRecord({
      entidad: 'SARLAFT',
      estado: 'Limpio',
      fechaConsulta: new Date().toISOString().split('T')[0],
      descripcion: '',
      documentoUrl: ''
    });
  };

  const handlePublicDataSearch = () => {
    setIsSearchingPublicData(true);
    setPublicDataResult(null);
    
    // Simulate API call to public databases (RUES, SECOP, Procuraduría, etc.)
    setTimeout(() => {
      setIsSearchingPublicData(false);
      setPublicDataResult({
        rues: 'Matrícula Mercantil Activa. Renovada en 2024.',
        secop: `${Math.floor(Math.random() * 15) + 1} contratos previos encontrados en SECOP II.`,
        procuraduria: 'No registra sanciones disciplinarias vigentes en los últimos 5 años.',
        contraloria: 'Sin fallos con responsabilidad fiscal vigentes.',
        policia: 'Sin antecedentes judiciales requeridos.',
        riskLevel: Math.random() > 0.8 ? 'Medio' : 'Bajo'
      });
    }, 2500);
  };

  const handleUploadRUT = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedContractorId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const contractor = state.contratistas.find(c => c.id === selectedContractorId);
      if (!contractor) return;

      const docId = `DOC-RUT-${Date.now()}`;
      const newDoc: ProjectDocument = {
        id: docId,
        projectId: 'GLOBAL',
        contractorId: selectedContractorId,
        titulo: `RUT - ${contractor.nombre}`,
        tipo: 'RUT',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: url,
          nombreArchivo: file.name,
          subidoPor: 'Administrador',
          comentario: 'Carga manual de RUT',
          accion: 'Subida',
          estado: 'Aprobado'
        }],
        tags: ['RUT', 'Contratista'],
        estado: 'Aprobado'
      };

      addDocument(newDoc);
      updateContractor({ ...contractor, rutUrl: url });
      alert('RUT cargado exitosamente.');
    };
    reader.readAsDataURL(file);
  };

  const handleCompare = (id: string) => {
    if (comparisonIds.includes(id)) {
      setComparisonIds(comparisonIds.filter(i => i !== id));
    } else if (comparisonIds.length < 3) {
      setComparisonIds([...comparisonIds, id]);
    }
  };

  const comparisonData = useMemo(() => {
    return comparisonIds.map(id => {
      const contractor = state.contratistas.find(c => c.id === id);
      const contracts = state.contratos.filter(c => c.nit === contractor?.nit);
      const totalValue = contracts.reduce((sum, c) => sum + (c.valor || 0), 0);
      const finishedContracts = contracts.filter(c => {
        const project = state.proyectos.find(p => p.id === c.projectId);
        return project?.estado === 'Liquidado' || project?.estado === 'En liquidación';
      });
      const finishedPct = contracts.length > 0 ? (finishedContracts.length / contracts.length) * 100 : 0;
      
      return {
        name: (contractor?.nombre || '').substring(0, 15) + '...',
        fullName: contractor?.nombre || '',
        valor: totalValue / 1000000, // In millions
        contratos: contracts.length,
        eficiencia: finishedPct
      };
    });
  }, [comparisonIds, state]);

  const handleSelectProject = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
  };

  return (
    <div className={`${externalContractorId ? 'p-0' : 'p-8'} max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500`}>
      {/* Header Section */}
      {!externalContractorId && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50" />
        <div className="relative">
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter flex items-center gap-4">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
              <Building2 size={32} />
            </div>
            PERFIL DE CONTRATISTAS
          </h1>
          <p className="text-slate-500 font-medium mt-2 max-w-2xl">
            Gestión integral de contratistas, evaluación de desempeño y trazabilidad de proyectos en territorio.
          </p>
        </div>
        
        <div className="flex items-center gap-3 relative">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 ${
              activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BarChart3 size={20} />
            DASHBOARD
          </button>
          <button 
            onClick={() => setActiveTab('map')}
            className={`px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 ${
              activeTab === 'map' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Globe size={20} />
            MAPA DE CALOR
          </button>
        </div>
      </div>)}

      {/* Global Stats Grid */}
      {!externalContractorId && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contratistas</p>
              <p className="text-2xl font-black text-slate-900">{globalStats.totalContractors}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 w-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contratos Activos</p>
              <p className="text-2xl font-black text-slate-900">{globalStats.totalContracts}</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 w-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Total</p>
              <p className="text-xl font-black text-slate-900">${(globalStats.totalValue / 1e9).toFixed(1)}B</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 w-full" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <Star size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Promedio</p>
              <p className="text-2xl font-black text-slate-900">{globalStats.avgScore}%</p>
            </div>
          </div>
          <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${globalStats.avgScore}%` }} />
          </div>
        </div>
      </div>)}

      {activeTab === 'map' && !compareMode && !externalContractorId ? (
        <div className="space-y-6">
          <HeatMapContratistas 
            contractors={state.contratistas}
            contracts={state.contratos}
            projects={state.proyectos}
            onSelectContractor={(id) => {
              setSelectedContractorId(id);
              setActiveTab('dashboard');
            }}
            onSelectProject={(id) => {
              if (onSelectProject) onSelectProject(id);
            }}
          />
        </div>
      ) : compareMode ? (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Comparativa de Desempeño</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-80">
                <p className="text-sm font-bold text-slate-500 uppercase mb-4">Valor Total Contratado (Millones)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="h-80">
                <p className="text-sm font-bold text-slate-500 uppercase mb-4">Eficiencia de Finalización (%)</p>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                    <Tooltip 
                      contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                    />
                    <Bar dataKey="eficiencia" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              {state.contratistas.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleCompare(c.id)}
                  className={`p-4 rounded-2xl border transition-all text-left flex items-center justify-between ${comparisonIds.includes(c.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-indigo-200'}`}
                >
                  <div>
                    <p className="font-bold text-slate-900 text-sm truncate w-40">{c.nombre}</p>
                    <p className="text-xs text-slate-500">{c.nit}</p>
                  </div>
                  {comparisonIds.includes(c.id) ? <CheckCircle2 className="text-indigo-600" size={20} /> : <PlusCircle className="text-slate-300" size={20} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : !selectedContractorId ? (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm w-full max-w-2xl">
              <div className="px-4 flex items-center text-slate-400 border-r border-slate-100">
                <Search size={20} />
              </div>
              <input 
                type="text" 
                placeholder="Buscar contratista por nombre o NIT..."
                className="flex-1 p-3 outline-none text-slate-600 font-medium placeholder-slate-300 bg-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm self-stretch md:self-auto overflow-x-auto shrink-0">
              {(['Todos', 'Alto', 'Medio', 'Bajo'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setPerformanceFilter(filter)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    performanceFilter === filter 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                      : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  {filter === 'Todos' ? 'Todos' : `Aliado ${filter}`}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredContractors.map((c, idx) => {
              const perf = c.performance;
              
              return (
                <motion.div 
                  key={c.id} 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                  onClick={() => setSelectedContractorId(c.id)}
                  className={`bg-white rounded-[32px] border shadow-sm hover:shadow-2xl transition-all p-8 group relative overflow-hidden cursor-pointer h-full flex flex-col ${
                    perf.clasificacion === 'Bajo' ? 'border-rose-200 ring-2 ring-rose-500/10' : 
                    perf.clasificacion === 'Medio' ? 'border-amber-200' : 'border-slate-200'
                  }`}
                >
                  <div className="absolute top-0 right-0 overflow-hidden rounded-bl-3xl">
                    <div className={`px-4 py-1 text-[10px] font-black uppercase tracking-widest text-white ${
                      perf.clasificacion === 'Alto' ? 'bg-emerald-600' :
                      perf.clasificacion === 'Medio' ? 'bg-amber-500' : 
                      'bg-rose-600'
                    }`}>
                      Aliado {perf.clasificacion}
                    </div>
                  </div>

                  <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight pr-12">{c.nombre}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">NIT: {c.nit}</p>
                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                          <p className="text-[11px] text-indigo-500 font-bold uppercase tracking-widest">{c.tipo || 'Aliado Estratégico'}</p>
                        </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Score Global</span>
                      <div className="flex items-end gap-1">
                        <p className="text-2xl font-black text-slate-900 leading-none">{perf.score}</p>
                        <span className="text-[10px] font-black text-slate-400 mb-0.5">/100</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 group-hover:bg-rose-50/30 group-hover:border-rose-100 transition-colors">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alertas</span>
                      <p className={`text-2xl font-black leading-none ${perf.numeroAlertas > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                        {perf.numeroAlertas}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-6 relative mt-auto">
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ejecución Física</span>
                        <span className={`text-sm font-black ${perf.ejecutado >= perf.programado ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {perf.ejecutado.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${perf.ejecutado}%` }}
                          className={`h-full rounded-full shadow-lg ${
                            perf.ejecutado >= perf.programado ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-600/20'
                          }`}
                        ></motion.div>
                        {perf.programado > perf.ejecutado && (
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${perf.programado - perf.ejecutado}%` }}
                            className="h-full bg-slate-200/50 ml-0.5 rounded-full"
                          ></motion.div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Variación</p>
                        <div className="flex items-center gap-1">
                          <TrendingUp size={14} className={perf.desviacion > 10 ? 'text-rose-500' : 'text-emerald-500'} />
                          <p className={`text-sm font-black ${perf.desviacion > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {perf.desviacion > 0 ? '+' : ''}{perf.desviacion.toFixed(1)}%
                            </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Puntos Control</p>
                        <p className="text-sm font-black text-slate-800">{perf.desviaciones} Hitos</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Firma</span>
                      <span className="text-lg font-black text-slate-900">${(perf.valorTotal / 1000000000).toFixed(2)}B</span>
                    </div>
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-lg">
                      <ArrowRight size={18} />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-right duration-500 space-y-6">
          {!externalContractorId && (
            <button
              onClick={() => setSelectedContractorId(null)}
              className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-all font-bold mb-4"
            >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              Volver al listado
            </button>
          )}
          
          <div className="w-full">
            {contractorStats ? (
              <div className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
                    <div className="flex gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-inner">
                        {contractorStats.contractor.tipo === 'Persona Jurídica' ? <Building2 size={40} /> : <User size={40} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-bold text-slate-900">{contractorStats.contractor.nombre}</h2>
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase rounded-full tracking-wider">
                            {contractorStats.contractor.tipo}
                          </span>
                        </div>
                        <p className="text-slate-500 flex items-center gap-2">
                          <span className="font-bold text-slate-700">NIT:</span> {contractorStats.contractor.nit}
                          <span className="text-slate-300">|</span>
                          <span className="font-bold text-slate-700">Registrado:</span> {contractorStats.contractor.fechaRegistro}
                        </p>
                        <div className="flex gap-3 mt-4">
                          {contractorStats.contractor.rutUrl ? (
                            <a 
                              href={contractorStats.contractor.rutUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 transition-all"
                            >
                              <FileText size={14} />
                              Ver RUT
                            </a>
                          ) : (
                            <label className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all cursor-pointer">
                              <Upload size={14} />
                              Subir RUT
                              <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={handleUploadRUT} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Score de Confiabilidad</p>
                      <div className="flex items-end gap-1">
                        <span className={`text-4xl font-black ${contractorStats.score > 80 ? 'text-emerald-500' : contractorStats.score > 60 ? 'text-amber-500' : 'text-rose-500'}`}>
                          {Math.round(contractorStats.score)}
                        </span>
                        <span className="text-slate-400 font-bold mb-1">/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Programado</p>
                      <p className="text-2xl font-black text-slate-900">{contractorStats.performance.programado.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Ejecutado</p>
                      <p className="text-2xl font-black text-indigo-600">{contractorStats.performance.ejecutado.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Eficiencia</p>
                      <p className={`text-2xl font-black ${contractorStats.performance.eficiencia >= 90 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {contractorStats.performance.eficiencia.toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Desviación</p>
                      <p className={`text-2xl font-black ${contractorStats.performance.desviacion > 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                        {contractorStats.performance.desviacion.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detailed Performance Analysis */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        <BarChart3 className="text-indigo-600" size={24} />
                        Análisis de Ejecución y Desviaciones
                      </h3>
                      <p className="text-sm text-slate-500">Impacto consolidado de contratos y otrosíes en el cronograma y presupuesto</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { 
                            name: 'Original', 
                            valor: contractorStats.performance.valorTotal - contractorStats.performance.desviacion * contractorStats.performance.valorTotal / 100,
                            plazo: contractorStats.performance.plazoTotal - (contractorStats.performance.desviacion * contractorStats.performance.plazoTotal / 100)
                          },
                          { 
                            name: 'Actual (con Otrosíes)', 
                            valor: contractorStats.performance.valorTotal, 
                            plazo: contractorStats.performance.plazoTotal 
                          }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Legend />
                          <Bar dataKey="valor" name="Valor Total ($)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4">Métricas de Rigor</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Cumplimiento Plazos</span>
                            <span className="text-sm font-black text-indigo-700">{contractorStats.performance.cumplimientoPlazos.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${contractorStats.performance.cumplimientoPlazos}%` }}></div>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-slate-600">Cumplimiento Financiero</span>
                            <span className="text-sm font-black text-indigo-700">{contractorStats.performance.cumplimientoFinanciero.toFixed(1)}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${contractorStats.performance.cumplimientoFinanciero}%` }}></div>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Justificación de Desviaciones</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Se han identificado {contractorStats.performance.desviaciones} otrosíes que han impactado el presupuesto en un {contractorStats.performance.desviacion.toFixed(1)}%. 
                          La eficiencia de ejecución actual es del {contractorStats.performance.eficiencia.toFixed(1)}% respecto a lo programado originalmente.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk and History Tabs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk Patterns */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <AlertTriangle className="text-rose-500" size={20} />
                        Patrones de Riesgo
                      </h3>
                      {contractorStats.avgEval > 0 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2 py-1 rounded-lg text-xs font-bold">
                          <Star size={14} fill="currentColor" />
                          {contractorStats.avgEval.toFixed(1)} / 5.0
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {contractorStats.risks.length > 0 ? (
                        contractorStats.risks.map((risk, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                            <ShieldCheck className="text-rose-500 mt-0.5" size={16} />
                            <p className="text-sm text-rose-700 font-medium">{risk}</p>
                          </div>
                        ))
                      ) : (
                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <CheckCircle2 className="text-emerald-500" size={20} />
                          <p className="text-sm text-emerald-700 font-medium">No se detectan patrones de riesgo críticos.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Evaluations History */}
                  <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardCheck className="text-indigo-600" size={20} />
                        Evaluaciones de Rigor
                      </h3>
                      <button 
                        onClick={() => setShowEvalForm(true)}
                        className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {showEvalForm && (
                      <div className="mb-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in slide-in-from-top duration-300">
                        <form onSubmit={handleAddEvaluation} className="space-y-3">
                          <input 
                            required
                            type="text" 
                            placeholder="Periodo (Ej: Q1 2024)"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newEval.periodo}
                            onChange={e => setNewEval({...newEval, periodo: e.target.value})}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            {['Calidad', 'Cumplimiento', 'SST', 'Ambiental'].map((label, idx) => (
                              <div key={label}>
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">{label}</label>
                                <select 
                                  className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs outline-none"
                                  value={idx === 0 ? newEval.calidad : idx === 1 ? newEval.cumplimiento : idx === 2 ? newEval.sst : newEval.ambiental}
                                  onChange={e => {
                                    const val = Number(e.target.value);
                                    if (idx === 0) setNewEval({...newEval, calidad: val});
                                    else if (idx === 1) setNewEval({...newEval, cumplimiento: val});
                                    else if (idx === 2) setNewEval({...newEval, sst: val});
                                    else setNewEval({...newEval, ambiental: val});
                                  }}
                                >
                                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                          <textarea 
                            placeholder="Observaciones..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                            value={newEval.observaciones}
                            onChange={e => setNewEval({...newEval, observaciones: e.target.value})}
                          />
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setShowEvalForm(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500">Cancelar</button>
                            <button type="submit" className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold">Guardar</button>
                          </div>
                        </form>
                      </div>
                    )}

                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                      {contractorStats.evaluations.length > 0 ? (
                        contractorStats.evaluations.map(e => (
                          <div key={e.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-slate-700">{e.periodo}</span>
                              <div className="flex items-center gap-1 text-amber-500">
                                <Star size={10} fill="currentColor" />
                                <span className="text-[10px] font-black">{(e.calificacionCalidad + e.calificacionCumplimiento + e.calificacionSST + e.calificacionAmbiental) / 4}</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-2 italic">"{e.observaciones}"</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">Sin evaluaciones registradas.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Entes de Control y Antecedentes */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="text-indigo-600" size={24} />
                        Entes de Control y Antecedentes
                      </h3>
                      <p className="text-sm text-slate-500">SARLAFT, Contraloría, Procuraduría, Policía, etc.</p>
                    </div>
                    <button 
                      onClick={() => setShowEnteForm(true)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all"
                    >
                      <Plus size={16} />
                      Registrar Consulta
                    </button>
                  </div>

                  {showEnteForm && (
                    <div className="mb-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 animate-in slide-in-from-top duration-300">
                      
                      {/* OSINT Search Panel */}
                      <div className="mb-8 p-5 bg-white rounded-xl border border-indigo-100 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                              <Globe className="text-indigo-500" size={18} />
                              Búsqueda en Fuentes Abiertas (OSINT)
                            </h4>
                            <p className="text-xs text-slate-500 mt-1">Consulta preliminar simulada en bases de datos públicas (SECOP, RUES, Procuraduría, etc.)</p>
                          </div>
                          <button 
                            type="button"
                            onClick={handlePublicDataSearch}
                            disabled={isSearchingPublicData}
                            className="shrink-0 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                          >
                            {isSearchingPublicData ? (
                              <><Loader2 size={14} className="animate-spin" /> Consultando...</>
                            ) : (
                              <><Search size={14} /> Ejecutar Consulta Automática</>
                            )}
                          </button>
                        </div>

                        {publicDataResult && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-500">
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">RUES (Cámara de Comercio)</p>
                              <p className="text-xs text-slate-700 font-medium">{publicDataResult.rues}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">SECOP II</p>
                              <p className="text-xs text-slate-700 font-medium">{publicDataResult.secop}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Procuraduría General</p>
                              <p className="text-xs text-slate-700 font-medium">{publicDataResult.procuraduria}</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Contraloría General</p>
                              <p className="text-xs text-slate-700 font-medium">{publicDataResult.contraloria}</p>
                            </div>
                            <div className="md:col-span-2 p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Nivel de Riesgo Preliminar</p>
                                <p className="text-xs text-indigo-900 font-bold">Basado en fuentes públicas</p>
                              </div>
                              <span className={`px-3 py-1 rounded-lg text-xs font-black ${publicDataResult.riskLevel === 'Bajo' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                RIESGO {publicDataResult.riskLevel.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <hr className="border-slate-200 mb-6" />
                      
                      <h4 className="text-sm font-bold text-slate-800 mb-4">Registro Manual de Hallazgo</h4>
                      <form onSubmit={handleAddEnteRecord} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Entidad *</label>
                          <select 
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={newEnteRecord.entidad}
                            onChange={e => setNewEnteRecord({...newEnteRecord, entidad: e.target.value as any})}
                          >
                            <option value="SARLAFT">SARLAFT</option>
                            <option value="Contraloría">Contraloría</option>
                            <option value="Procuraduría">Procuraduría</option>
                            <option value="Policía">Policía</option>
                            <option value="Fiscalía">Fiscalía</option>
                            <option value="RNMC">RNMC (Medidas Correctivas)</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado / Resultado *</label>
                          <select 
                            required
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                            value={newEnteRecord.estado}
                            onChange={e => setNewEnteRecord({...newEnteRecord, estado: e.target.value as any})}
                          >
                            <option value="Limpio">Limpio / Sin Antecedentes</option>
                            <option value="Con Hallazgos">Con Hallazgos</option>
                            <option value="En Investigación">En Investigación</option>
                            <option value="Sancionado">Sancionado / Inhabilitado</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Consulta *</label>
                          <input 
                            required
                            type="date"
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newEnteRecord.fechaConsulta}
                            onChange={e => setNewEnteRecord({...newEnteRecord, fechaConsulta: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL Soporte (Opcional)</label>
                          <input 
                            type="url"
                            placeholder="https://..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newEnteRecord.documentoUrl || ''}
                            onChange={e => setNewEnteRecord({...newEnteRecord, documentoUrl: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción / Detalles *</label>
                          <textarea 
                            required
                            placeholder="Detalles de la consulta o hallazgo..."
                            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-20"
                            value={newEnteRecord.descripcion}
                            onChange={e => setNewEnteRecord({...newEnteRecord, descripcion: e.target.value})}
                          />
                        </div>
                        <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                          <button type="button" onClick={() => { setShowEnteForm(false); setPublicDataResult(null); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors">Guardar Registro</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-3">
                    {contractorStats.entesControl.length > 0 ? (
                      contractorStats.entesControl.map(record => (
                        <div key={record.id} className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          record.estado === 'Limpio' ? 'bg-emerald-50 border-emerald-100' :
                          record.estado === 'Sancionado' ? 'bg-rose-50 border-rose-200' :
                          record.estado === 'Con Hallazgos' ? 'bg-amber-50 border-amber-200' :
                          'bg-indigo-50 border-indigo-100'
                        }`}>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                record.estado === 'Limpio' ? 'bg-emerald-100 text-emerald-700' :
                                record.estado === 'Sancionado' ? 'bg-rose-100 text-rose-700' :
                                record.estado === 'Con Hallazgos' ? 'bg-amber-100 text-amber-700' :
                                'bg-indigo-100 text-indigo-700'
                              }`}>
                                {record.entidad}
                              </span>
                              <span className="text-sm font-bold text-slate-700">{record.estado}</span>
                              <span className="text-xs text-slate-500 ml-2">{record.fechaConsulta}</span>
                            </div>
                            <p className="text-sm text-slate-600">{record.descripcion}</p>
                          </div>
                          {record.documentoUrl && (
                            <a 
                              href={record.documentoUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="shrink-0 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                            >
                              <FileText size={14} /> Ver Soporte
                            </a>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                        <ShieldCheck className="mx-auto text-slate-300 mb-2" size={32} />
                        <p className="text-sm text-slate-500 font-medium">No hay registros de entes de control para este contratista.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-repositorio Documental */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <FolderOpen className="text-indigo-600" size={24} />
                      Sub-repositorio Documental del Contratista
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {state.documentos.filter(d => 
                        d.contractorId === selectedContractorId || 
                        contractorStats.contracts.some(c => c.id === d.contractId)
                      ).length} Documentos
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {state.documentos.filter(d => 
                      d.contractorId === selectedContractorId || 
                      contractorStats.contracts.some(c => c.id === d.contractId)
                    ).map(doc => (
                      <div key={doc.id} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all flex items-center gap-4 group">
                        <div className="p-3 bg-slate-50 rounded-xl text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                          <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-900 text-sm truncate">{doc.titulo}</p>
                          <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{doc.tipo} • {doc.fechaCreacion}</p>
                        </div>
                        <a 
                          href={doc.versiones[doc.versiones.length - 1].url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <ExternalLink size={18} />
                        </a>
                      </div>
                    ))}
                    {state.documentos.filter(d => 
                      d.contractorId === selectedContractorId || 
                      contractorStats.contracts.some(c => c.id === d.contractId)
                    ).length === 0 && (
                      <div className="col-span-2 py-8 text-center text-slate-400 italic text-sm">
                        No se han encontrado documentos vinculados a este contratista.
                      </div>
                    )}
                  </div>
                </div>

                {/* Project History */}
                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <FileText className="text-indigo-600" size={24} />
                    Historial Completo de Proyectos
                  </h3>
                  <div className="space-y-4">
                    {contractorStats.contracts.map(c => {
                      const project = state.proyectos.find(p => p.id === c.projectId);
                      return (
                        <div key={c.id} className="p-6 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-slate-900">{project?.nombre || 'Proyecto Desconocido'}</h4>
                              <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                <span className="font-bold">Contrato:</span> {c.numero}
                                <span className="text-slate-300">|</span>
                                <span className="font-bold">Valor:</span> ${c.valor.toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              project?.estado === 'Liquidado' ? 'bg-emerald-50 text-emerald-600' : 
                              project?.estado === 'En seguimiento' ? 'bg-rose-50 text-rose-600' : 
                              'bg-indigo-50 text-indigo-600'
                            }`}>
                              {project?.estado}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avance Físico</p>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-emerald-500 h-full rounded-full" style={{width: `${project?.avanceFisico || 0}%`}}></div>
                              </div>
                              <p className="text-xs font-bold text-slate-700 mt-1">{project?.avanceFisico || 0}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Avance Financiero</p>
                              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-indigo-500 h-full rounded-full" style={{width: `${project?.avanceFinanciero || 0}%`}}></div>
                              </div>
                              <p className="text-xs font-bold text-slate-700 mt-1">{project?.avanceFinanciero || 0}%</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Otrosíes</p>
                              <p className="text-xs font-bold text-slate-700 mt-1">
                                {state.otrosies.filter(o => o.contractId === c.id).length} registrados
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-slate-400">
                <div className="p-6 bg-slate-50 rounded-full mb-4">
                  <Info size={48} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Selecciona un Contratista</h3>
                <p className="text-center max-w-xs">Elige un contratista del listado lateral para visualizar su ficha técnica, historial y score de desempeño.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
