import React, { useState } from 'react';
import { EmergenciaEvento } from '../types';
import { GitMerge, Layers, BarChart3, Map, DollarSign, Activity, Target, ShieldCheck, FileText, Landmark, ArrowRight } from 'lucide-react';

interface SimuladorIncertidumbreProps {
  evento: EmergenciaEvento;
}

export const SimuladorIncertidumbre: React.FC<SimuladorIncertidumbreProps> = ({ evento }) => {
  const [escenario, setEscenario] = useState<'optimista' | 'base' | 'pesimista'>('base');

  // Base metrics from event or defaults
  const baseViviendas = evento.metrics?.viviendasDanadas || 150;
  const basePerdida = evento.metrics?.perdidaEconomica || 15000000000; // 15B
  const baseFiscal = evento.metrics?.reconstruccion || 8000000000; // 8B
  const basePresupuestal = (evento.metrics?.atencionInmediata || 0) + (evento.metrics?.rehabilitacion || 0);

  // Multipliers for scenarios
  const multipliers = {
    optimista: { prob: '20%', factor: 0.8, color: 'emerald', label: 'Optimista' },
    base: { prob: '60%', factor: 1.0, color: 'blue', label: 'Base (Esperado)' },
    pesimista: { prob: '20%', factor: 1.4, color: 'rose', label: 'Pesimista' }
  };

  const current = multipliers[escenario];

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. Trazabilidad Causal */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <GitMerge size={20} className="text-indigo-500" />
          1. Trazabilidad Causal del Evento
        </h4>
        <div className="flex flex-wrap md:flex-nowrap gap-2 items-center justify-between overflow-x-auto pb-2">
          {[
            { step: 'Evento', val: evento.tipo, icon: <Activity size={16}/> },
            { step: 'Amenaza', val: evento.caracterizacion?.tipoAmenaza || 'Extrema', icon: <Target size={16}/> },
            { step: 'Exposición', val: `${evento.departamentosAfectados?.length || 1} Depts`, icon: <Map size={16}/> },
            { step: 'Vulnerabilidad', val: 'Alta', icon: <ShieldCheck size={16}/> },
            { step: 'Daño', val: `${Math.round(baseViviendas * current.factor)} Viv.`, icon: <FileText size={16}/> },
            { step: 'Pérdida', val: formatCurrency(basePerdida * current.factor), icon: <BarChart3 size={16}/> },
            { step: 'Costo Fiscal', val: formatCurrency(baseFiscal * current.factor), icon: <DollarSign size={16}/> },
            { step: 'Ejecutado', val: formatCurrency(basePresupuestal), icon: <Landmark size={16}/> }
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <div className="flex flex-col items-center text-center min-w-[90px]">
                <div className="w-10 h-10 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-black mb-2 border border-slate-200 shadow-sm">
                  {item.icon}
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">{item.step}</p>
                <p className="text-xs font-black text-slate-800 mt-1 truncate w-full px-1" title={item.val}>{item.val}</p>
              </div>
              {idx < arr.length - 1 && <ArrowRight className="text-slate-300 shrink-0" size={16} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* 3. Modelación de Incertidumbre (Controls) */}
      <div className="bg-slate-900 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h4 className="text-lg font-bold text-white flex items-center gap-2">
              <BarChart3 size={20} className="text-emerald-400" />
              3. Modelación de Incertidumbre
            </h4>
            <p className="text-sm text-slate-400">Seleccione el escenario probabilístico para recalcular las capas.</p>
          </div>
          <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700">
            {(['optimista', 'base', 'pesimista'] as const).map(esc => (
              <button
                key={esc}
                onClick={() => setEscenario(esc)}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  escenario === esc 
                    ? `bg-${multipliers[esc].color}-500 text-white shadow-lg` 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                {multipliers[esc].label} ({multipliers[esc].prob})
              </button>
            ))}
          </div>
        </div>

        {/* 2. Separación de Capas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-800 p-5 rounded-2xl border-t-4 border-t-blue-500">
            <h5 className="font-black text-blue-400 mb-1 uppercase text-xs">Capa Física</h5>
            <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider">Daño Material</p>
            <p className="text-2xl font-black text-white">{Math.round(baseViviendas * current.factor)}</p>
            <p className="text-xs text-slate-400 mt-1">Viviendas afectadas</p>
            <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-700 pt-2">
              Rango: {Math.round(baseViviendas * 0.8)} - {Math.round(baseViviendas * 1.4)}
            </div>
          </div>
          
          <div className="bg-slate-800 p-5 rounded-2xl border-t-4 border-t-amber-500">
            <h5 className="font-black text-amber-400 mb-1 uppercase text-xs">Capa Económica</h5>
            <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider">Pérdida Total</p>
            <p className="text-xl font-black text-white">{formatCurrency(basePerdida * current.factor)}</p>
            <p className="text-xs text-slate-400 mt-1">Valoración DaLA</p>
            <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-700 pt-2">
              Rango: {formatCurrency(basePerdida * 0.8)} - {formatCurrency(basePerdida * 1.4)}
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border-t-4 border-t-rose-500">
            <h5 className="font-black text-rose-400 mb-1 uppercase text-xs">Capa Fiscal</h5>
            <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider">Impacto Finanzas</p>
            <p className="text-xl font-black text-white">{formatCurrency(baseFiscal * current.factor)}</p>
            <p className="text-xs text-slate-400 mt-1">Necesidad de Gasto</p>
            <div className="mt-4 text-[10px] text-slate-500 border-t border-slate-700 pt-2">
              Rango: {formatCurrency(baseFiscal * 0.8)} - {formatCurrency(baseFiscal * 1.4)}
            </div>
          </div>

          <div className="bg-slate-800 p-5 rounded-2xl border-t-4 border-t-emerald-500">
            <h5 className="font-black text-emerald-400 mb-1 uppercase text-xs">Capa Presupuestal</h5>
            <p className="text-[10px] text-slate-400 mb-3 uppercase tracking-wider">Recursos Ejecutados</p>
            <p className="text-xl font-black text-white">{formatCurrency(basePresupuestal)}</p>
            <p className="text-xs text-slate-400 mt-1">Giro Efectivo (Fijo)</p>
            <div className="mt-4 text-[10px] text-emerald-500/50 border-t border-slate-700 pt-2">
              Déficit: {formatCurrency((baseFiscal * current.factor) - basePresupuestal)}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Replicabilidad Interterritorial */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Map size={20} className="text-indigo-500" />
          4. Replicabilidad Interterritorial
        </h4>
        <p className="text-sm text-slate-600 mb-4">
          El modelo ajusta automáticamente los parámetros de vulnerabilidad y costos logísticos según el territorio afectado.
        </p>
        <div className="flex flex-wrap gap-4">
          {evento.departamentosAfectados?.map(dept => {
            let factor = 1.0;
            let amenaza = 'Estándar';
            if ((dept || '').toLowerCase().includes('guajira')) { factor = 1.4; amenaza = 'Sequía / Ciclones'; }
            if ((dept || '').toLowerCase().includes('chocó')) { factor = 1.6; amenaza = 'Inundación Fluvial'; }
            if ((dept || '').toLowerCase().includes('huila')) { factor = 1.0; amenaza = 'Deslizamientos'; }

            return (
              <div key={dept} className="flex-1 min-w-[200px] bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xs">
                    {dept.substring(0, 2).toUpperCase()}
                  </div>
                  <h5 className="font-bold text-slate-800">{dept}</h5>
                </div>
                <div className="space-y-1 text-xs text-slate-600">
                  <p>• <strong>Amenaza Local:</strong> {amenaza}</p>
                  <p>• <strong>Multiplicador Logístico:</strong> {factor}x</p>
                </div>
              </div>
            );
          })}
          {(!evento.departamentosAfectados || evento.departamentosAfectados.length === 0) && (
            <p className="text-sm text-slate-500 italic">No hay departamentos registrados para este evento.</p>
          )}
        </div>
      </div>

    </div>
  );
};
