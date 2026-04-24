import React from 'react';
import { Contract, ProjectDocument } from '../types';
import { checkLiquidacionProgress } from '../services/checklistService';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const ChecklistLiquidacion = ({ contract, documents }: { contract: Contract, documents: ProjectDocument[] }) => {
  const { results, porcentaje, completo } = checkLiquidacionProgress(contract.id, documents);

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">Checklist de Liquidación</h3>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${completo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
          {completo ? 'Completo' : 'Incompleto'}
        </div>
      </div>

      <div className="w-full bg-slate-100 rounded-full h-2.5">
        <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${porcentaje}%` }}></div>
      </div>
      <p className="text-sm text-slate-600 font-bold">{porcentaje.toFixed(0)}% completado</p>

      <div className="space-y-3">
        {results.map(item => (
          <div key={item.id} className="flex items-center gap-3 text-sm">
            {item.cargado ? (
              <CheckCircle2 className="text-emerald-500" size={20} />
            ) : (
              <XCircle className="text-rose-500" size={20} />
            )}
            <span className={item.cargado ? 'text-slate-800' : 'text-slate-500'}>{item.nombre}</span>
          </div>
        ))}
      </div>

      {!completo && (
        <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl text-xs font-bold">
          <AlertTriangle size={16} />
          <span>La liquidación está bloqueada hasta completar todos los documentos.</span>
        </div>
      )}
    </div>
  );
};
