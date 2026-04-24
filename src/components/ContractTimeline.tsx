import React from 'react';
import { Contract, ContractEvent, Otrosie, Convenio } from '../types';
import { Calendar, Clock, AlertCircle, FileText, Activity } from 'lucide-react';

interface ContractTimelineProps {
  contracts: Contract[];
  otrosies: Otrosie[];
  convenio?: Convenio;
}

export const ContractTimeline: React.FC<ContractTimelineProps> = ({ contracts, otrosies, convenio }) => {
  // Flatten all events from all contracts and sort them by date
  const allEvents = [
    ...contracts.flatMap(c => 
      (c.eventos || []).map(e => ({ ...e, contractNumero: c.numero, contractTipo: c.tipo }))
    ),
    ...otrosies.map(o => {
      const contract = contracts.find(c => c.id === o.contractId);
      return {
        id: o.id,
        fecha: o.fechaFirma,
        tipo: 'Otrosí',
        descripcion: o.objeto,
        impactoPlazoMeses: o.plazoAdicionalMeses,
        impactoValor: o.valorAdicional,
        contractNumero: contract?.numero || (o.convenioId ? (convenio?.numero || 'Convenio') : 'N/A'),
        contractTipo: contract?.tipo || 'Convenio',
        documentoUrl: o.documentoUrl,
        documentoNombre: o.documentoNombre
      };
    })
  ].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  if (allEvents.length === 0) {
    return (
      <div className="p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-center animate-in fade-in duration-500">
        <Clock size={40} className="mx-auto text-slate-300 mb-4" />
        <p className="text-slate-500 font-medium">No hay eventos registrados para visualizar en la línea de tiempo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Línea de Tiempo Contractual</h3>
          <p className="text-sm text-slate-500">Hitos y eventos en orden cronológico</p>
        </div>
      </div>

      <div className="relative pl-8 md:pl-12 space-y-12">
        {/* Main timeline line */}
        <div className="absolute left-4 md:left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 via-indigo-300 to-indigo-100 rounded-full" />

        {allEvents.map((event, idx) => (
          <div key={event.id} className="relative group">
            {/* Timeline dot */}
            <div className={`absolute -left-8 md:-left-10 top-1.5 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-md transition-all group-hover:scale-110 ${
              event.tipo === 'Acta de Inicio' ? 'bg-emerald-500' :
              event.tipo === 'Suspensión' ? 'bg-rose-500' :
              event.tipo === 'Otrosí' ? 'bg-indigo-500' :
              'bg-slate-500'
            }`} />
            
            <div className="flex flex-col md:flex-row gap-4 md:gap-8">
              <div className="md:w-32 pt-2">
                <span className="text-sm font-bold text-slate-400">{event.fecha}</span>
                <div className={`text-[10px] font-bold px-2 py-0.5 rounded-lg mt-1 inline-block ${
                  event.contractTipo === 'Obra' ? 'bg-indigo-100 text-indigo-700' : 
                  event.contractTipo === 'Interventoría' ? 'bg-amber-100 text-amber-700' : 
                  'bg-slate-100 text-slate-700'
                }`}>
                  {event.contractNumero}
                </div>
              </div>

              <div className="flex-1 bg-white border border-slate-100 p-6 rounded-3xl hover:border-indigo-100 hover:shadow-lg transition-all">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">{event.tipo}</h4>
                    <p className="text-sm text-slate-500 italic">{event.descripcion}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {event.impactoPlazoMeses !== 0 && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${event.impactoPlazoMeses > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <Calendar size={14} />
                        {event.impactoPlazoMeses > 0 ? '+' : ''}{event.impactoPlazoMeses} meses
                      </div>
                    )}
                    {event.impactoValor !== 0 && (
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${event.impactoValor > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        <Activity size={14} />
                        {event.impactoValor > 0 ? '+' : ''}{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(event.impactoValor)}
                      </div>
                    )}
                  </div>
                </div>

                {event.documentoUrl && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <FileText size={18} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-600">Documento de Soporte: {event.documentoNombre || 'Acta_Firmada.pdf'}</span>
                    <button className="ml-auto text-xs font-bold text-indigo-600 hover:underline">Descargar</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
