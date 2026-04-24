import React from 'react';
import { Compromiso, Project } from '../types';
import { CheckCircle2, Clock, AlertCircle, User, Calendar, FileText } from 'lucide-react';

interface CompromisosTabProps {
  project: Project;
}

export const CompromisosTab: React.FC<CompromisosTabProps> = ({ project }) => {
  const compromisos = project.compromisos || [];
  
  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'Cumplido': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'En Proceso': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Pendiente': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Atrasado': return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'Cumplido': return <CheckCircle2 className="w-4 h-4" />;
      case 'En Proceso': return <Clock className="w-4 h-4" />;
      case 'Pendiente': return <AlertCircle className="w-4 h-4" />;
      case 'Atrasado': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  // Ordenar compromisos: pendientes primero, luego por fecha de registro descendente
  const sortedCompromisos = [...compromisos].sort((a, b) => {
    if (a.estado !== 'Cumplido' && b.estado === 'Cumplido') return -1;
    if (a.estado === 'Cumplido' && b.estado !== 'Cumplido') return 1;
    return new Date(b.fechaRegistro).getTime() - new Date(a.fechaRegistro).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Seguimiento de Compromisos</h3>
          <p className="text-sm text-slate-500">Consolidado de acuerdos y tareas extraídas de las Actas de Comité</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold shadow-sm">
            {compromisos.filter(c => c.estado === 'Cumplido').length} Cumplidos
          </div>
          <div className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold shadow-sm">
            {compromisos.filter(c => c.estado === 'Pendiente' || c.estado === 'En Proceso').length} Activos
          </div>
        </div>
      </div>

      {sortedCompromisos.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No hay compromisos registrados para este proyecto.</p>
          <p className="text-slate-400 text-sm mt-1">Los compromisos se extraen automáticamente al cargar Actas de Comité mediante IA.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {sortedCompromisos.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shadow-sm ${getStatusColor(c.estado)}`}>
                      {getStatusIcon(c.estado)}
                      {c.estado}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md">
                      <Calendar className="w-3 h-3" />
                      Registrado: {new Date(c.fechaRegistro).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-slate-800 font-bold text-lg leading-tight group-hover:text-indigo-600 transition-colors">{c.descripcion}</h4>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Responsable</span>
                        <span className="font-semibold">{c.responsable}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                      <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                        <Calendar className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Fecha Límite</span>
                        <span className="font-semibold">{c.fechaLimite || 'Sin definir'}</span>
                      </div>
                    </div>
                    {c.actaId && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
                        <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md">
                          <FileText className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Acta Origen</span>
                          <span className="font-semibold">Acta No. {project.actasComite?.find(a => a.id === c.actaId)?.numero || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {c.trazabilidad && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-200"></div>
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Historial de Trazabilidad</h5>
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{c.trazabilidad}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
