import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  FileText, 
  AlertOctagon, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  Trash2, 
  Edit3, 
  X, 
  Save, 
  Search, 
  Filter, 
  LayoutDashboard, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  BrainCircuit,
  TrendingUp,
  ArrowUpRight,
  ChevronRight,
  History,
  Activity,
  Zap,
  ShieldCheck,
  MoreVertical,
  Layers,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowDownRight,
  Info
} from 'lucide-react';
import { ActaComite, Otrosie, Suspension, Afectacion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

export const ActasYSuspensionesTab = ({ projectId }: { projectId: string }) => {
  const { state, updateProject } = useProject();
  const project = state.proyectos.find(p => p.id === projectId);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'alert' | 'positive' | 'negative'>('all');
  const [selectedActaId, setSelectedActaId] = useState<string | null>(null);
  const [editingActa, setEditingActa] = useState<ActaComite | null>(null);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!project) return null;

  const actas = useMemo(() => {
    return [...(project.actasComite || [])].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, [project.actasComite]);

  const suspensiones = project.suspensiones || [];
  const afectaciones = state.afectaciones?.filter(a => a.projectId === projectId) || [];
  const otrosies = state.otrosies.filter(o => {
    if (o.contractId) {
      const contract = state.contratos.find(c => c.id === o.contractId);
      return contract?.projectId === projectId;
    }
    if (o.convenioId) {
      const project = state.proyectos.find(p => p.id === projectId);
      return project?.convenioId === o.convenioId;
    }
    return false;
  });

  const filteredActas = useMemo(() => {
    return actas.filter(acta => {
      const matchesSearch = 
        (acta.numero?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (acta.temaCentral?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasAlerts = acta.preocupaciones && acta.preocupaciones.length > 0;
      const matchesFilter = 
        filterType === 'all' || 
        (filterType === 'alert' && hasAlerts) || 
        (filterType === 'positive' && acta.evaluacionImpacto === 'Positivo') ||
        (filterType === 'negative' && acta.evaluacionImpacto === 'Negativo');
      
      return matchesSearch && matchesFilter;
    });
  }, [actas, searchTerm, filterType]);

  const selectedActa = useMemo(() => {
    return actas.find(a => a.id === selectedActaId) || filteredActas[0];
  }, [actas, filteredActas, selectedActaId]);

  useEffect(() => {
    if (filteredActas.length > 0 && !selectedActaId) {
      setSelectedActaId(filteredActas[0].id);
    }
  }, [filteredActas, selectedActaId]);

  const stats = useMemo(() => {
    const totalOtrosiesValue = otrosies.reduce((acc, curr) => acc + (curr.valorAdicional || 0), 0);
    const totalMonthsAdded = otrosies.reduce((acc, curr) => acc + (curr.plazoAdicionalMeses || 0), 0);
    const totalAfectacionesValue = afectaciones.reduce((acc, curr) => acc + (curr.valor || 0), 0);
    
    // Timeline data for charts
    const allEvents = [
      ...actas.map(a => ({ date: a.fecha, type: 'Acta', impact: a.evaluacionImpacto, value: 0 })),
      ...otrosies.map(o => ({ date: o.fechaFirma, type: 'Otrosí', value: o.valorAdicional, impact: null })),
      ...afectaciones.map(a => ({ date: a.fecha, type: 'Afectación', value: a.valor, impact: null }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData = allEvents.reduce((acc: any[], curr) => {
      const month = curr.date.substring(0, 7); // YYYY-MM
      const existing = acc.find(d => d.month === month);
      if (existing) {
        existing[curr.type] = (existing[curr.type] || 0) + 1;
        if (curr.value) existing.value = (existing.value || 0) + curr.value;
      } else {
        acc.push({ month, [curr.type]: 1, value: curr.value || 0 });
      }
      return acc;
    }, []);

    return {
      total: actas.length,
      withAlerts: actas.filter(a => a.preocupaciones && a.preocupaciones.length > 0).length,
      positiveImpact: actas.filter(a => a.evaluacionImpacto === 'Positivo').length,
      negativeImpact: actas.filter(a => a.evaluacionImpacto === 'Negativo').length,
      totalCompromisos: actas.reduce((acc, curr) => acc + (curr.compromisosNuevos?.length || 0), 0),
      totalAfectaciones: afectaciones.length,
      otrosiesCount: otrosies.length,
      totalOtrosiesValue,
      totalMonthsAdded,
      totalAfectacionesValue,
      chartData
    };
  }, [actas, otrosies, afectaciones]);

  const handleDeleteActa = (actaId: string) => {
    if (window.confirm('¿Está seguro de eliminar esta acta de comité?')) {
      const updatedActas = actas.filter(a => a.id !== actaId);
      updateProject({ ...project, actasComite: updatedActas });
    }
  };

  const handleSaveEdit = () => {
    if (editingActa) {
      const updatedActas = actas.map(a => a.id === editingActa.id ? editingActa : a);
      updateProject({ ...project, actasComite: updatedActas });
      setEditingActa(null);
    }
  };

  const handleSummarize = async (actaId: string) => {
    setIsSummarizing(actaId);
    // Simulate AI call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const currentActa = actas.find(a => a.id === actaId);
    if (currentActa) {
      const updatedActa: ActaComite = {
        ...currentActa,
        conclusionesIA: "Análisis Estratégico: El comité abordó de manera efectiva los retrasos en la fase 2. Se observa una mejora en la coordinación interinstitucional. El impacto de las nuevas decisiones es positivo para el cumplimiento del hito de junio. Se recomienda vigilar el compromiso C-04.",
        evaluacionImpacto: Math.random() > 0.5 ? 'Positivo' : 'Neutral',
        mejoroEstado: true
      };
      const updatedActas = actas.map(a => a.id === actaId ? updatedActa : a);
      updateProject({ ...project, actasComite: updatedActas });
    }
    setIsSummarizing(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] overflow-hidden bg-slate-50/50 rounded-[2.5rem] border border-slate-200 shadow-inner">
      {/* Dashboard Top Bar */}
      <div className="bg-white p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Dashboard Integral de Seguimiento Legal y Técnico</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sintetizando Actas, Otrosíes y Afectaciones Contractuales</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adiciones</p>
              <p className="text-sm font-black text-emerald-600">${(stats.totalOtrosiesValue / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prórrogas</p>
              <p className="text-sm font-black text-amber-600">{stats.totalMonthsAdded} Meses</p>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 flex items-center gap-2">
            <Zap size={16} className="text-amber-400" />
            Nueva Acta
          </button>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Timeline & List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white flex flex-col">
          <div className="p-4 space-y-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text"
                placeholder="Filtrar eventos..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button 
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => setFilterType('alert')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filterType === 'alert' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
              >
                Alertas
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
            {/* Unified Timeline: Actas, Otrosíes and Afectaciones */}
            <div className="space-y-6">
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Línea de Tiempo de Gestión</h3>
                <div className="space-y-3">
                  {[
                    ...filteredActas.map(a => ({ ...a, type: 'acta' as const })), 
                    ...otrosies.map(o => ({ ...o, type: 'otrosie' as const })),
                    ...afectaciones.map(a => ({ ...a, type: 'afectacion' as const }))
                  ].sort((a, b) => {
                    const dateA = a.type === 'acta' ? (a as any).fecha : (a.type === 'otrosie' ? (a as any).fechaFirma : (a as any).fecha);
                    const dateB = b.type === 'acta' ? (b as any).fecha : (b.type === 'otrosie' ? (b as any).fechaFirma : (b as any).fecha);
                    return new Date(dateB).getTime() - new Date(dateA).getTime();
                  }).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => item.type === 'acta' && setSelectedActaId(item.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                        item.type === 'acta' && selectedActaId === item.id 
                          ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                          : 'bg-white border-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                          item.type === 'acta' 
                            ? (selectedActaId === item.id ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white')
                            : item.type === 'otrosie' ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                        }`}>
                          {item.type === 'acta' ? `Acta #${(item as any).numero}` : (item.type === 'otrosie' ? `Otrosí #${(item as any).numero}` : `Afectación: ${(item as any).tipo}`)}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400">{item.type === 'acta' ? (item as any).fecha : (item.type === 'otrosie' ? (item as any).fechaFirma : (item as any).fecha)}</span>
                      </div>
                      <h4 className={`text-xs font-black leading-tight mb-2 line-clamp-2 ${
                        item.type === 'acta' && selectedActaId === item.id ? 'text-indigo-900' : 'text-slate-700'
                      }`}>
                        {item.type === 'acta' ? (item as any).temaCentral : (item.type === 'otrosie' ? (item as any).objeto : (item as any).descripcion)}
                      </h4>
                      
                      {item.type === 'acta' ? (
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400">
                            <CheckCircle2 size={10} /> {(item as any).decisiones.length}
                          </div>
                          {(item as any).preocupaciones && (item as any).preocupaciones.length > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-black text-rose-500">
                              <AlertTriangle size={10} /> ALERTA
                            </div>
                          )}
                        </div>
                      ) : item.type === 'otrosie' ? (
                        <div className="flex items-center gap-3">
                          {(item as any).valorAdicional > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                              <DollarSign size={10} /> +${((item as any).valorAdicional / 1000000).toFixed(1)}M
                            </div>
                          )}
                          {(item as any).plazoAdicionalMeses > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600">
                              <Clock size={10} /> +{(item as any).plazoAdicionalMeses}m
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          {(item as any).valor > 0 && (
                            <div className="flex items-center gap-1 text-[9px] font-bold text-slate-600">
                              <DollarSign size={10} /> ${(item as any).valor.toLocaleString()}
                            </div>
                          )}
                          <div className={`flex items-center gap-1 text-[9px] font-black uppercase ${
                            (item as any).impacto === 'Alto' ? 'text-rose-600' : 'text-amber-600'
                          }`}>
                            Impacto {(item as any).impacto}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Detailed Dashboard */}
        <div className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {selectedActa ? (
              <motion.div
                key={selectedActa.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Acta Header Card */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-10">
                    <FileText size={200} />
                  </div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-indigo-500 text-white text-[10px] font-black rounded-full uppercase tracking-widest">
                          Comité de Seguimiento #{selectedActa.numero}
                        </span>
                        <span className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                          <Calendar size={14} /> {selectedActa.fecha}
                        </span>
                      </div>
                      <h1 className="text-3xl font-black leading-tight tracking-tight max-w-2xl">
                        {selectedActa.temaCentral}
                      </h1>
                      <div className="flex flex-wrap gap-4 pt-4">
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                          <CheckCircle2 size={18} className="text-emerald-400" />
                          <div>
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Acuerdos</p>
                            <p className="text-sm font-bold">{selectedActa.decisiones.length} Firmados</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                          <Clock size={18} className="text-amber-400" />
                          <div>
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Compromisos</p>
                            <p className="text-sm font-bold">{selectedActa.compromisosNuevos?.length || 0} Pendientes</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10">
                          <TrendingUp size={18} className="text-blue-400" />
                          <div>
                            <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest">Afectaciones</p>
                            <p className="text-sm font-bold">{selectedActa.afectacionesGeneradas?.length || 0} Registradas</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setEditingActa(selectedActa)}
                        className="w-full px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/10"
                      >
                        <Edit3 size={16} /> Editar Acta
                      </button>
                      <button 
                        onClick={() => handleDeleteActa(selectedActa.id)}
                        className="w-full px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-rose-500/20"
                      >
                        <Trash2 size={16} /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Decisions & Compromisos Column */}
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                        <CheckCircle2 className="text-emerald-500" />
                        Acuerdos y Decisiones Tomadas
                      </h3>
                      <div className="space-y-4">
                        {selectedActa.decisiones.map((decision, idx) => (
                          <div key={idx} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-emerald-200 transition-all">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-black shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-bold text-slate-700 leading-relaxed">{decision}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                        <Clock className="text-amber-500" />
                        Nuevos Compromisos Adquiridos
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedActa.compromisosNuevos?.map((comp, idx) => (
                          <div key={idx} className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100/50">
                            <p className="text-sm font-bold text-slate-800 mb-2">{comp.descripcion}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Vence: {comp.fechaLimite}</span>
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-black rounded uppercase">{comp.estado}</span>
                            </div>
                          </div>
                        ))}
                        {(!selectedActa.compromisosNuevos || selectedActa.compromisosNuevos.length === 0) && (
                          <p className="text-sm text-slate-400 italic">No se registraron nuevos compromisos.</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Impact & AI Column */}
                  <div className="space-y-8">
                    {/* AI Analysis Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                      <div className="absolute -right-4 -bottom-4 opacity-10">
                        <BrainCircuit size={120} />
                      </div>
                      <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                        <BrainCircuit className="text-indigo-300" />
                        Análisis de Impacto IA
                      </h3>
                      
                      {selectedActa.conclusionesIA ? (
                        <div className="space-y-6">
                          <p className="text-sm font-medium leading-relaxed italic text-indigo-50">
                            "{selectedActa.conclusionesIA}"
                          </p>
                          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Evaluación</p>
                              <div className="flex items-center gap-2">
                                {selectedActa.evaluacionImpacto === 'Positivo' ? (
                                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                                    <TrendingUp size={14} /> POSITIVO
                                  </div>
                                ) : selectedActa.evaluacionImpacto === 'Negativo' ? (
                                  <div className="flex items-center gap-1.5 text-rose-400 font-black text-xs">
                                    <AlertTriangle size={14} /> NEGATIVO
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 text-slate-300 font-black text-xs">
                                    <Activity size={14} /> NEUTRAL
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Estado</p>
                              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xs">
                                <ShieldCheck size={14} /> {selectedActa.mejoroEstado ? 'MEJORADO' : 'ESTABLE'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-xs text-indigo-100 font-medium">
                            El sistema puede analizar el contenido del acta para evaluar su impacto real en el proyecto.
                          </p>
                          <button 
                            onClick={() => handleSummarize(selectedActa.id)}
                            disabled={isSummarizing === selectedActa.id}
                            className="w-full py-3 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
                          >
                            {isSummarizing === selectedActa.id ? <Clock className="animate-spin" size={16} /> : <Zap size={16} />}
                            Ejecutar Análisis IA
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Hierarchy & Links Card */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-8 shadow-sm">
                      <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                        <Layers className="text-indigo-600" />
                        Trazabilidad y Vínculos
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Otrosíes Derivados</p>
                          <div className="space-y-3">
                            {otrosies.map(o => (
                              <div key={o.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">
                                <div>
                                  <p className="text-xs font-black text-slate-800">Otrosí No. {o.numero}</p>
                                  <p className="text-[10px] text-slate-500 font-bold">{o.fechaFirma}</p>
                                </div>
                                <ArrowUpRight size={16} className="text-slate-300 group-hover:text-indigo-500" />
                              </div>
                            ))}
                            {otrosies.length === 0 && <p className="text-xs text-slate-400 italic">No hay otrosíes vinculados.</p>}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Afectaciones Generadas</p>
                          <div className="space-y-3">
                            {selectedActa.afectacionesGeneradas.map((af, idx) => (
                              <div key={idx} className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{af.tipo}</span>
                                  {af.valorEstimado && <span className="text-[10px] font-black text-slate-700">${af.valorEstimado.toLocaleString()}</span>}
                                </div>
                                <p className="text-xs font-bold text-slate-700">{af.descripcion}</p>
                              </div>
                            ))}
                            {selectedActa.afectacionesGeneradas.length === 0 && <p className="text-xs text-slate-400 italic">No se registraron afectaciones.</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                {/* Global Summary Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                      <FileText size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Actas</p>
                    <p className="text-2xl font-black text-slate-800">{stats.total}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <TrendingUp size={10} /> {stats.positiveImpact} Positivas
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                      <TrendingUp size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Otrosíes Firmados</p>
                    <p className="text-2xl font-black text-slate-800">{stats.otrosiesCount}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                      <DollarSign size={10} /> +${(stats.totalOtrosiesValue / 1000000).toFixed(1)}M
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
                      <AlertTriangle size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Afectaciones</p>
                    <p className="text-2xl font-black text-slate-800">{stats.totalAfectaciones}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-rose-600">
                      <ArrowDownRight size={10} /> Impacto Crítico
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
                      <Clock size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Compromisos</p>
                    <p className="text-2xl font-black text-slate-800">{stats.totalCompromisos}</p>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-amber-600">
                      <History size={10} /> Seguimiento Activo
                    </div>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                      <h3 className="text-lg font-black text-slate-800 flex items-center gap-3">
                        <Activity className="text-indigo-600" />
                        Evolución de la Gestión
                      </h3>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1 text-[9px] font-black text-indigo-600 uppercase"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Actas</span>
                        <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Otrosíes</span>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.chartData}>
                          <defs>
                            <linearGradient id="colorActa" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOtrosie" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
                          />
                          <Area type="monotone" dataKey="Acta" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorActa)" />
                          <Area type="monotone" dataKey="Otrosí" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorOtrosie)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-3">
                      <BarChart3 className="text-emerald-600" />
                      Impacto Financiero Acumulado
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="month" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                            tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                          />
                          <Tooltip 
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Valor']}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 700 }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {stats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-3">
                      <ShieldCheck className="text-emerald-600" />
                      Estado Legal y Contractual Consolidado
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {otrosies.map(o => (
                        <div key={o.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                              <FileText size={20} />
                            </div>
                            <div>
                              <p className="text-xs font-black text-slate-800">Otrosí No. {o.numero}</p>
                              <p className="text-[10px] text-slate-500 font-bold line-clamp-1">{o.objeto}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-emerald-600">+${(o.valorAdicional / 1000000).toFixed(1)}M</p>
                            <p className="text-[10px] text-slate-400 font-bold">+{o.plazoAdicionalMeses} meses</p>
                          </div>
                        </div>
                      ))}
                      {otrosies.length === 0 && (
                        <div className="col-span-2 text-center py-12">
                          <p className="text-sm text-slate-400 italic">No se registran modificaciones contractuales (Otrosíes).</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Info size={100} />
                    </div>
                    <h3 className="text-lg font-black mb-6 flex items-center gap-3">
                      <Zap className="text-amber-400" />
                      Síntesis de Gestión
                    </h3>
                    <div className="space-y-6 relative z-10">
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Impacto Global</p>
                        <p className="text-sm font-bold leading-relaxed">
                          Se han formalizado {stats.otrosiesCount} otrosíes con una inversión adicional de {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(stats.totalOtrosiesValue)}.
                        </p>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">Alertas Técnicas</p>
                        <p className="text-sm font-bold leading-relaxed">
                          {stats.withAlerts} actas de comité han reportado preocupaciones críticas que requieren seguimiento inmediato.
                        </p>
                      </div>
                      <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-900/40">
                        Generar Reporte Ejecutivo
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Inline Editor (Replacing Modal) */}
      {editingActa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <Edit3 className="text-indigo-600" />
                Editar Acta No. {editingActa.numero}
              </h3>
              <button onClick={() => setEditingActa(null)} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Número de Acta</label>
                  <input
                    type="text"
                    value={editingActa.numero}
                    onChange={(e) => setEditingActa({ ...editingActa, numero: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</label>
                  <input
                    type="date"
                    value={editingActa.fecha}
                    onChange={(e) => setEditingActa({ ...editingActa, fecha: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tema Central</label>
                <input
                  type="text"
                  value={editingActa.temaCentral}
                  onChange={(e) => setEditingActa({ ...editingActa, temaCentral: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decisiones (Una por línea)</label>
                <textarea
                  value={editingActa.decisiones.join('\n')}
                  onChange={(e) => setEditingActa({ ...editingActa, decisiones: e.target.value.split('\n').filter(d => d.trim() !== '') })}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none font-medium text-sm"
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setEditingActa(null)}
                className="px-6 py-3 text-slate-600 hover:bg-slate-200 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                <Save size={18} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
