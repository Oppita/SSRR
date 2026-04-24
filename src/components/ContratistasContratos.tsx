import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  Briefcase, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ExternalLink, 
  TrendingUp, 
  Award, 
  Search, 
  DollarSign, 
  Zap, 
  Shield, 
  Activity, 
  BarChart3, 
  User,
  Building2,
  MoreVertical
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Contractor, Contract } from '../types';
import { calculateContractorPerformance } from '../services/performanceService';

import { ContractorProfile } from './ContractorProfile';

export const ContratistasContratos: React.FC = () => {
  const { state } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContractorId, setSelectedContractorId] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [performanceFilter, setPerformanceFilter] = useState<'Todos' | 'Alto' | 'Medio' | 'Bajo'>('Todos');

  const handleContractorClick = (id: string) => {
    setSelectedContractorId(id);
    setShowProfileModal(true);
  };

  const contractorsWithState = state.contratistas.map(c => ({
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

  const filteredContractors = contractorsWithState.filter(c => {
    const matchesSearch = (c.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (c.nit || '').includes(searchTerm);
    const matchesFilter = performanceFilter === 'Todos' || c.performance.clasificacion === performanceFilter;
    return matchesSearch && matchesFilter;
  });

  const calculateTotalValue = () => {
    return state.contratos.reduce((sum, c) => sum + (c.valor || 0), 0);
  };

  const avgPerformance = state.contratistas.length > 0
    ? state.contratistas.reduce((sum, c) => {
        const p = calculateContractorPerformance(c.id, state.contratos, state.otrosies, state.alertas, state.evaluacionesContratistas, state.proyectos);
        return sum + p.score;
      }, 0) / state.contratistas.length
    : 0;

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header & Main Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Ecosistema de Contratistas</h2>
          <p className="text-slate-500 font-medium">Gestión avanzada de desempeño y cumplimiento contractual</p>
        </div>
        <button className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-[20px] font-bold flex items-center gap-2 shadow-xl shadow-slate-200 transition-all active:scale-95 text-sm">
          <Plus size={18} />
          Registrar Aliado
        </button>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
            <Building2 size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Contratistas</p>
            <p className="text-3xl font-black text-slate-900">{state.contratistas.length}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
            <Award size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Desempeño Promedio</p>
            <p className="text-3xl font-black text-slate-900">{avgPerformance.toFixed(1)}%</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Vigente</p>
            <p className="text-3xl font-black text-slate-900">${(calculateTotalValue() / 1000000000).toFixed(1)}B</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-4">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Alertas Críticas</p>
            <p className="text-3xl font-black text-slate-900">{state.alertas.filter(a => a.nivel === 'Alto').length}</p>
          </div>
        </div>
      </div>

      {/* Search Bar & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="flex bg-white p-2 rounded-[24px] border border-slate-200 shadow-sm w-full max-w-2xl">
          <div className="px-4 flex items-center text-slate-400 border-r border-slate-100">
            <Search size={20} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar contratista por nombre, NIT o sector..."
            className="flex-1 p-3 outline-none text-slate-600 font-medium placeholder-slate-300"
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

      {/* Contractor Grid */}
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
              onClick={() => handleContractorClick(c.id)}
              className={`bg-white rounded-[32px] border shadow-sm hover:shadow-2xl transition-all p-8 group relative overflow-hidden cursor-pointer ${
                perf.clasificacion === 'Bajo' ? 'border-rose-200 ring-2 ring-rose-500/10' : 
                perf.clasificacion === 'Medio' ? 'border-amber-200' : 'border-slate-200'
              }`}
            >
              {/* Status Badge Overlays - Parity with OPS */}
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

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Score Global</span>
                  <div className="flex items-end gap-1">
                    <p className="text-2xl font-black text-slate-900 leading-none">{perf.score}</p>
                    <span className="text-[10px] font-black text-slate-400 mb-0.5">/100</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-[24px] border border-slate-100 group-hover:bg-rose-50/30 group-hover:border-rose-100 transition-colors">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Alertas Activas</span>
                  <p className={`text-2xl font-black leading-none ${perf.numeroAlertas > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {perf.numeroAlertas}
                  </p>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-4 mb-6 relative">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ejecución Física Acumulada</span>
                    <span className={`text-sm font-black ${perf.ejecutado >= perf.programado ? 'text-emerald-600' : 'text-amber-600'}`}>
                       {perf.ejecutado.toFixed(1)}% Real
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
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">Esperado: {perf.programado.toFixed(1)}%</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase italic">Eficiencia: {perf.eficiencia.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Variación Presupuestal</p>
                    <div className="flex items-center gap-1">
                       <TrendingUp size={14} className={perf.desviacion > 10 ? 'text-rose-500' : 'text-emerald-500'} />
                       <p className={`text-md font-black ${perf.desviacion > 10 ? 'text-rose-600' : 'text-emerald-600'}`}>
                         {perf.desviacion > 0 ? '+' : ''}{perf.desviacion.toFixed(1)}%
                        </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Puntos de Control</p>
                    <p className="text-md font-black text-slate-800">{perf.desviaciones} Hitos</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Compromiso Total</span>
                   <span className="text-lg font-black text-slate-900">${(perf.valorTotal / 1000000000).toFixed(2)}B</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-2xl transition-all border border-transparent hover:border-slate-100"
                    onClick={(e) => { e.stopPropagation(); /* Menu handling could go here */ }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-indigo-100 group-hover:shadow-lg">
                    <ExternalLink size={18} />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Contractor Profile Modal */}
      {showProfileModal && selectedContractorId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setShowProfileModal(false)}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-slate-50 w-full max-w-6xl max-h-[90vh] rounded-[40px] shadow-2xl overflow-hidden flex flex-col relative z-10"
          >
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                 <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Building2 size={24} />
                 </div>
                 <div>
                    <h3 className="font-black text-slate-800 tracking-tight">Expediente del Contratista</h3>
                    <p className="text-xs text-slate-500 font-medium tracking-tight">Hoja de vida corporativa y métricas de desempeño</p>
                 </div>
              </div>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
               <ContractorProfile 
                  externalContractorId={selectedContractorId} 
                  onSelectProject={() => setShowProfileModal(false)}
               />
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-end">
               <button 
                 onClick={() => setShowProfileModal(false)}
                 className="px-6 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 transition-all hover:bg-black active:scale-95"
               >
                 Cerrar Expediente
               </button>
            </div>
          </motion.div>
        </div>
      )}

      {filteredContractors.length === 0 && (
         <div className="bg-white rounded-[40px] p-20 text-center border border-dashed border-slate-200">
            <User size={64} className="mx-auto text-slate-200 mb-6" />
            <h3 className="text-xl font-black text-slate-700">No se encontraron contratistas</h3>
            <p className="text-slate-400 font-medium">Refine su búsqueda o registre un nuevo contratista en el sistema.</p>
         </div>
      )}
    </div>
  );
};
