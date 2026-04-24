import React, { useState, useMemo } from 'react';
import { LineaInversion, ProjectData, Vigencia, Convenio, Contract } from '../types';
import { useProject } from '../store/ProjectContext';
import { ArrowLeft, Edit2, Save, X, TrendingUp, DollarSign, Briefcase, FileText, Layers, Target, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  linea: LineaInversion;
  onClose: () => void;
}

export const LineaInversionDetailView: React.FC<Props> = ({ linea, onClose }) => {
  const { state, updateLineaInversion } = useProject();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedLinea, setEditedLinea] = useState<LineaInversion>(linea);
  
  // Calculate KPIs
  const projects = state.proyectos.filter(p => p.linea === linea.nombre);
  const convenios = state.convenios.filter(c => projects.some(p => p.convenioId === c.id));
  const contracts = state.contratos.filter(c => projects.some(p => p.id === c.projectId));
  
  const totalInvestment = projects.reduce((sum, p) => sum + (p.matrix?.valorTotalProyecto || 0), 0);
  const totalContractsValue = contracts.reduce((sum, c) => sum + c.valor, 0);

  const handleSave = () => {
    if (updateLineaInversion) {
      updateLineaInversion(editedLinea);
    }
    setIsEditing(false);
  };

  const handleBudgetChange = (vigenciaId: string, value: string) => {
    setEditedLinea(prev => ({
      ...prev,
      presupuestosPorVigencia: {
        ...(prev.presupuestosPorVigencia || {}),
        [vigenciaId]: Number(value) || 0
      }
    }));
  };
  
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 bg-white text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-600 transition-all shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-xs font-black text-indigo-400 uppercase tracking-widest">{linea.codigo}</span>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Layers className="text-indigo-600" size={24} />
              {linea.nombre}
            </h2>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button 
                onClick={() => { setIsEditing(false); setEditedLinea(linea); }}
                className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2"
              >
                <X size={16} /> Cancelar
              </button>
              <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Save size={16} /> Guardar Cambios
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-bold bg-white border border-slate-200 text-slate-600 rounded-xl shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Edit2 size={16} /> Editar Configuración
            </button>
          )}
        </div>
      </div>
      
      <div className="p-6 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border border-indigo-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
                <DollarSign size={24} />
              </div>
            </div>
            <h4 className="text-3xl font-black text-slate-800 mb-1">
              ${(totalInvestment / 1000000000).toFixed(1)}B
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Inversión Total Proyectos</p>
          </div>
          
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-emerald-600">
                <Briefcase size={24} />
              </div>
            </div>
            <h4 className="text-3xl font-black text-slate-800 mb-1">
              {projects.length}
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Proyectos Asociados</p>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-amber-600">
                <FileText size={24} />
              </div>
            </div>
            <h4 className="text-3xl font-black text-slate-800 mb-1">
              {convenios.length}
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Convenios Vinculados</p>
          </div>
          
          <div className="bg-gradient-to-br from-rose-50 to-pink-50 p-6 rounded-2xl border border-rose-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white rounded-xl shadow-sm text-rose-600">
                <Target size={24} />
              </div>
            </div>
            <h4 className="text-3xl font-black text-slate-800 mb-1">
              {contracts.length}
            </h4>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Contratos Ejecutados</p>
          </div>
        </div>
        
        {/* Presupuestos por Vigencia */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} />
            Presupuesto Asignado por Vigencia
          </h3>
          <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6">
            {state.vigencias.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay vigencias registradas en el sistema.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {state.vigencias.map(v => {
                  const presupuesto = editedLinea.presupuestosPorVigencia?.[v.id] || 0;
                  // Calculate how much of this budget is used by projects in this vigencia
                  // Assuming projects have a way to link to vigencia, or we just show total
                  return (
                    <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-slate-700">Vigencia {v.anio}</span>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg">
                          {((presupuesto / v.presupuestoAsignado) * 100 || 0).toFixed(1)}% del total
                        </span>
                      </div>
                      
                      {isEditing ? (
                        <div className="mt-2">
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto Asignado</label>
                          <input 
                            type="number"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={presupuesto || ''}
                            onChange={(e) => handleBudgetChange(v.id, e.target.value)}
                            placeholder="Valor en COP"
                          />
                        </div>
                      ) : (
                        <>
                          <div className="text-xl font-black text-slate-900 mb-2">
                            ${presupuesto.toLocaleString()}
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full" 
                              style={{ width: `${Math.min((presupuesto / v.presupuestoAsignado) * 100 || 0, 100)}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Listado de Proyectos */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Briefcase className="text-indigo-600" size={20} />
            Proyectos Asociados
          </h3>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proyecto</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {projects.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      No hay proyectos asociados a esta línea de inversión.
                    </td>
                  </tr>
                ) : (
                  projects.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{p.nombre}</div>
                        <div className="text-xs text-slate-500">{p.id}</div>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {p.municipio}, {p.departamento}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold rounded-lg ${
                          p.estado === 'En ejecución' ? 'bg-emerald-100 text-emerald-700' :
                          p.estado === 'Suspendido' ? 'bg-rose-100 text-rose-700' :
                          p.estado === 'Liquidado' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {p.estado || 'Sin Estado'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold text-slate-700">
                        ${(p.matrix?.valorTotalProyecto || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};
