import React from 'react';
import { ProjectData } from '../types';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, AreaChart, Area } from 'recharts';
import { Camera, Calendar, Activity } from 'lucide-react';

interface AvancesGraficosProps {
  data: ProjectData;
}

export const AvancesGraficos: React.FC<AvancesGraficosProps> = ({ data }) => {
  const { project, avances } = data;

  const chartData = avances.map(a => ({
    semana: a.fecha,
    fisico: a.fisicoPct,
    programado: a.programadoPct,
    financiero: a.financieroPct
  }));

  // Filter avances that have image attachments
  const avancesConFotos = avances.filter(a => a.adjuntos && a.adjuntos.some(adj => adj.type === 'image')).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

  return (
    <div className="space-y-8">
      <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-4">Avances y Evolución</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Avance Físico vs Programado */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4">Avance Físico vs Programado</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="fisico" name="Real" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.2} />
                <Area type="monotone" dataKey="programado" name="Programado" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Avance Financiero */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="font-bold text-slate-800 mb-4">Evolución Financiera</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="semana" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="financiero" name="% Financiero" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Evidencias Fotográficas vs Avance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Camera className="text-indigo-500" />
          Evidencias Fotográficas por Avance
        </h4>
        
        {avancesConFotos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avancesConFotos.map(avance => {
              const fotos = avance.adjuntos?.filter(adj => adj.type === 'image') || [];
              if (fotos.length === 0) return null;
              
              return (
                <div key={avance.id} className="border border-slate-200 rounded-xl overflow-hidden group">
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img 
                      src={fotos[0].url} 
                      alt={`Evidencia ${avance.fecha}`} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <div className="text-white">
                        <div className="flex items-center gap-1 text-xs font-medium mb-1 opacity-90">
                          <Calendar size={12} />
                          {avance.fecha}
                        </div>
                        <div className="font-bold text-sm line-clamp-1">{avance.observaciones}</div>
                      </div>
                      <div className="bg-indigo-600 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                        <Activity size={12} />
                        {avance.fisicoPct}%
                      </div>
                    </div>
                  </div>
                  {fotos.length > 1 && (
                    <div className="bg-slate-50 p-2 border-t border-slate-200 flex gap-2 overflow-x-auto">
                      {fotos.slice(1).map((foto, idx) => (
                        <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200">
                          <img src={foto.url} alt="Miniatura" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
            <Camera className="mx-auto text-slate-400 mb-3" size={32} />
            <p className="text-slate-500 text-sm font-medium">No hay evidencias fotográficas registradas en los avances.</p>
          </div>
        )}
      </div>
    </div>
  );
};
