import React, { useMemo } from 'react';
import { Poliza, Contract } from '../types';
import { Calendar, ShieldCheck, AlertTriangle, CheckCircle2, Clock, Info, TrendingUp, History } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PolicyTimelineProps {
  polizas: Poliza[];
  contratos: Contract[];
}

export const PolicyTimeline: React.FC<PolicyTimelineProps> = ({ polizas, contratos }) => {
  const sortedPolizas = useMemo(() => {
    return [...polizas].sort((a, b) => new Date(a.fecha_inicio_vigencia).getTime() - new Date(b.fecha_inicio_vigencia).getTime());
  }, [polizas]);

  const polizasPorContrato = useMemo(() => {
    const groups: { [key: string]: Poliza[] } = {};
    polizas.forEach(p => {
      if (!groups[p.id_contrato]) groups[p.id_contrato] = [];
      groups[p.id_contrato].push(p);
    });
    // Sort each group by date
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(a.fecha_inicio_vigencia).getTime() - new Date(b.fecha_inicio_vigencia).getTime());
    });
    return groups;
  }, [polizas]);

  const coverageEvolutionData = useMemo(() => {
    if (polizas.length === 0) return [];
    
    // Create a timeline of coverage changes
    const events: { date: string, coverage: number }[] = [];
    const sorted = [...polizas].sort((a, b) => new Date(a.fecha_inicio_vigencia).getTime() - new Date(b.fecha_inicio_vigencia).getTime());
    
    sorted.forEach(p => {
      events.push({
        date: p.fecha_inicio_vigencia,
        coverage: p.porcentaje_cobertura
      });
    });

    return events;
  }, [polizas]);

  const getCoverageLevel = (pct: number) => {
    if (pct >= 100) return { label: 'Adecuado', color: 'bg-emerald-500', text: 'text-emerald-700' };
    if (pct >= 50) return { label: 'Parcial', color: 'bg-amber-500', text: 'text-amber-700' };
    return { label: 'Insuficiente', color: 'bg-rose-500', text: 'text-rose-700' };
  };

  if (polizas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" />
        <p className="text-slate-500">No hay pólizas registradas para visualizar en la línea de tiempo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Evolución de Cobertura */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
          <TrendingUp className="text-indigo-600" size={20} />
          Evolución de Cobertura en el Tiempo
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={coverageEvolutionData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 10 }} 
                tickFormatter={(val) => new Date(val).toLocaleDateString()}
                stroke="#94a3b8"
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                stroke="#94a3b8"
                unit="%"
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                labelFormatter={(val) => `Fecha: ${new Date(val).toLocaleDateString()}`}
              />
              <Line 
                type="monotone" 
                dataKey="coverage" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
                name="Porcentaje de Cobertura"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Histórico por Contrato */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <History className="text-indigo-600" size={20} />
          Histórico de Pólizas por Contrato
        </h3>
        
        {Object.entries(polizasPorContrato).map(([contractId, contractPolizas]) => {
          const contrato = contratos.find(c => c.id === contractId);
          return (
            <div key={contractId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">Contrato: {contrato?.numero || contractId}</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">{contrato?.contratista}</span>
                </div>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full border border-indigo-100">
                  {contractPolizas.length} Pólizas
                </span>
              </div>
              <div className="p-6 space-y-8 relative">
                {/* Vertical Line */}
                <div className="absolute left-[31px] top-8 bottom-8 w-0.5 bg-slate-100" />
                
                {contractPolizas.map((poliza, idx) => {
                  const level = getCoverageLevel(poliza.porcentaje_cobertura);
                  const isExpired = new Date(poliza.fecha_finalizacion_vigencia) < new Date();
                  
                  return (
                    <div key={poliza.id} className="relative pl-12">
                      {/* Timeline Dot */}
                      <div className={`absolute left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-sm z-10 ${level.color}`} />
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">{poliza.tipo_amparo}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${level.color.replace('bg-', 'bg-opacity-10 text-').replace('500', '700')} border-opacity-20`}>
                              {level.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                            {poliza.entidad_aseguradora} | Póliza {poliza.numero_poliza}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Vigencia</span>
                            <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                              <Calendar size={12} className="text-slate-400" />
                              <span>{new Date(poliza.fecha_inicio_vigencia).toLocaleDateString()} - {new Date(poliza.fecha_finalizacion_vigencia).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Estado</span>
                            <span className={`text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {isExpired ? 'VENCIDA' : 'VIGENTE'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Info size={16} className="text-indigo-600" />
            Análisis de Cobertura Temporal
          </h4>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              La línea de tiempo muestra la vigencia de cada amparo. Es crítico asegurar que la fecha de 
              finalización de la póliza cubra la totalidad del plazo contractual más los términos de 
              liquidación y estabilidad requeridos por ley.
            </p>
            <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <Clock size={16} className="text-indigo-600" />
              <span className="text-xs text-indigo-700 font-medium">
                Se recomienda renovar o prorrogar pólizas con menos de 30 días para su vencimiento.
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-indigo-600" />
            Resumen de Garantías
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Total Pólizas</span>
              <span className="text-xl font-bold text-slate-900">{polizas.length}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Vigentes</span>
              <span className="text-xl font-bold text-emerald-600">
                {polizas.filter(p => new Date(p.fecha_finalizacion_vigencia) >= new Date()).length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Vencidas</span>
              <span className="text-xl font-bold text-rose-600">
                {polizas.filter(p => new Date(p.fecha_finalizacion_vigencia) < new Date()).length}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Cobertura Promedio</span>
              <span className="text-xl font-bold text-indigo-600">
                {(polizas.reduce((acc, p) => acc + p.porcentaje_cobertura, 0) / (polizas.length || 1)).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

