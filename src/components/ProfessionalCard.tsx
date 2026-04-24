import React from 'react';
import { User, Briefcase, Clock, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfessionalCard = ({ professional }: { professional: any }) => {
  if (!professional) return null;

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all p-4 group cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <p className="font-black text-slate-900 leading-tight">{professional.nombre}</p>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-0.5">{professional.profesion}</p>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ${
          professional.carga === 'Disponible' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          professional.carga === 'Media' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
          'bg-rose-50 text-rose-700 border border-rose-100'
        }`}>
          {professional.carga === 'Disponible' ? <CheckCircle2 size={10} /> :
           professional.carga === 'Media' ? <Clock size={10} /> :
           <AlertTriangle size={10} />}
          {professional.carga}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Briefcase size={10} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Exp.</span>
          </div>
          <p className="text-xs font-bold text-slate-700">{professional.experienciaAnios} años</p>
        </div>
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-400 mb-1">
            <Clock size={10} />
            <span className="text-[9px] font-black uppercase tracking-tighter">Proyectos</span>
          </div>
          <p className="text-xs font-bold text-slate-700">{professional.proyectosActivos} activos</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
        <div className="flex flex-col">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Hora</span>
          <span className="text-xs font-black text-indigo-600">${Math.round(professional.valorHora || 0).toLocaleString('es-CO')}</span>
        </div>
        <div className="p-2 bg-slate-50 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 rounded-lg transition-all">
          <ExternalLink size={14} />
        </div>
      </div>
    </motion.div>
  );
};
