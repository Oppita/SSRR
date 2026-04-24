import React, { useState } from 'react';
import { X, Save, Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Project, Presupuesto } from '../types';
import { useProject } from '../store/ProjectContext';
import { extractProjectData } from '../services/geminiService';
import DocumentReader from './DocumentReader';
import { AIProviderSelector } from './AIProviderSelector';

interface EditProjectModalProps {
  project: Project;
  presupuesto?: Presupuesto;
  onClose: () => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({ project, presupuesto, onClose }) => {
  const { updateProject, updatePresupuesto, state } = useProject();
  const [formData, setFormData] = useState<Project>({ ...project });
  const [presupuestoData, setPresupuestoData] = useState<Presupuesto | undefined>(presupuesto ? { ...presupuesto } : undefined);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [changes, setChanges] = useState<{ field: string; old: any; new: any }[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePresupuestoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPresupuestoData(prev => prev ? { ...prev, [name]: Number(value) } : prev);
  };

  const handleAIExtraction = async (text: string) => {
    setIsParsing(true);
    setParsingStep('Analizando con IA SRR...');
    try {
      const extracted = await extractProjectData(text);
      
      const newChanges: { field: string; old: any; new: any }[] = [];
      const updatedData = { ...formData };

      // Compare and track changes
      const compareAndUpdate = (field: string, newValue: any, isMatrix = false) => {
        const oldValue = isMatrix ? (formData.matrix as any)?.[field] : (formData as any)[field];
        if (newValue !== undefined && newValue !== null && newValue !== oldValue) {
          newChanges.push({ field, old: oldValue, new: newValue });
          if (isMatrix) {
            if (!updatedData.matrix) updatedData.matrix = {} as any;
            (updatedData.matrix as any)[field] = newValue;
          } else {
            (updatedData as any)[field] = newValue;
          }
        }
      };

      // General fields
      if (extracted.nombre) compareAndUpdate('nombre', extracted.nombre);
      if (extracted.departamento) compareAndUpdate('departamento', extracted.departamento);
      if (extracted.municipio) compareAndUpdate('municipio', extracted.municipio);
      if (extracted.linea) compareAndUpdate('linea', extracted.linea);
      if (extracted.vigencia) compareAndUpdate('vigencia', extracted.vigencia);
      if (extracted.justificacion) compareAndUpdate('justificacion', extracted.justificacion);
      if (extracted.objetivoGeneral) compareAndUpdate('objetivoGeneral', extracted.objetivoGeneral);
      if (extracted.alcance) compareAndUpdate('alcance', extracted.alcance);
      if (extracted.beneficiarios) compareAndUpdate('beneficiarios', extracted.beneficiarios);

      // Matrix fields
      if (extracted.matrix) {
        Object.keys(extracted.matrix).forEach(key => {
          compareAndUpdate(key, (extracted.matrix as any)[key], true);
        });
      }

      setFormData(updatedData);
      setChanges(newChanges);
      setShowChanges(true);
      setParsingStep('Análisis completado');
    } catch (error) {
      console.error('Error in AI extraction:', error);
      setParsingStep('Error en el análisis');
    } finally {
      setTimeout(() => setIsParsing(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add traceability: update date and type
    const updatedProject = {
      ...formData,
      matrix: {
        ...formData.matrix,
        valorTotalProyecto: presupuestoData?.valorTotal || formData.matrix?.valorTotalProyecto,
        aporteFngrdObraInterventoria: presupuestoData?.aportesFngrd || formData.matrix?.aporteFngrdObraInterventoria,
        aporteMunicipioGobernacionObraInterventoria: presupuestoData?.aportesMunicipio || formData.matrix?.aporteMunicipioGobernacionObraInterventoria,
      },
      ultimaActualizacion: new Date().toISOString(),
      tipoActualizacion: 'Edición Manual de Datos',
    };
    updateProject(updatedProject);
    if (presupuestoData) {
      updatePresupuesto(presupuestoData);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Editar Proyecto</h2>
            <p className="text-sm text-slate-500 mt-1">Modifica los datos generales y específicos del proyecto.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* AI Extraction Section */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 text-white rounded-lg">
                  <Upload size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Actualización Inteligente (IA SRR)</h3>
                  <p className="text-xs text-slate-500">Carga un documento o pega texto para actualizar campos automáticamente.</p>
                </div>
              </div>
              <AIProviderSelector />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentReader 
                onDataExtracted={(data) => {
                  // DocumentReader might return specific document data, 
                  // but here we want to use the general extraction for the whole project
                  // If DocumentReader provides text, we can use it.
                  // For now, let's assume we use the text extraction logic.
                }}
                onTextExtracted={handleAIExtraction}
              />
              
              <div className="relative">
                <textarea
                  className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none bg-white"
                  placeholder="O pega aquí el texto del proyecto/contrato..."
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                />
                {isParsing && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{parsingStep}</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleAIExtraction(pasteText)}
                  disabled={isParsing || pasteText.length < 50}
                  className="mt-2 w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isParsing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  Analizar y Extraer Datos
                </button>
              </div>
            </div>

            {showChanges && changes.length > 0 && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-indigo-100 animate-in slide-in-from-top duration-300">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} />
                    Cambios detectados por la IA ({changes.length})
                  </h4>
                  <button 
                    onClick={() => setShowChanges(false)}
                    className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase"
                  >
                    Ocultar
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {changes.map((change, i) => (
                    <div key={i} className="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700 uppercase mr-2">{change.field}:</span>
                      <span className="text-rose-500 line-through mr-2">{String(change.old || 'Vacío')}</span>
                      <span className="text-emerald-600 font-bold">→ {String(change.new)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-600 font-bold">
                  <CheckCircle2 size={12} />
                  <span>Los campos han sido actualizados en el formulario. Revisa y guarda para confirmar.</span>
                </div>
              </div>
            )}
          </div>

          <form id="edit-project-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Proyecto</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
                <input 
                  type="text" 
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Municipio</label>
                <input 
                  type="text" 
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Obra</label>
                <input 
                  type="text" 
                  name="tipoObra"
                  value={formData.tipoObra}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Convenio</label>
                <select 
                  name="convenioId"
                  value={formData.convenioId || ''}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">Sin Convenio</option>
                  {state.convenios.map(c => (
                    <option key={c.id} value={c.id}>{c.numero} - {c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Fases</label>
                <div className="space-y-2">
                  {(formData.fases || []).map((fase, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={fase.nombre}
                        onChange={(e) => {
                          const newFases = [...(formData.fases || [])];
                          newFases[index].nombre = e.target.value;
                          setFormData(prev => ({ ...prev, fases: newFases }));
                        }}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newFases = (formData.fases || []).filter((_, i) => i !== index);
                          setFormData(prev => ({ ...prev, fases: newFases }));
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newFases = [...(formData.fases || []), { id: Math.random().toString(36).substr(2, 9), nombre: '' }];
                      setFormData(prev => ({ ...prev, fases: newFases }));
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-bold"
                  >
                    + Agregar Fase
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Beneficiarios</label>
                <input 
                  type="text" 
                  name="beneficiarios"
                  value={formData.beneficiarios}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: 1500 familias"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Empleos Generados</label>
                <input 
                  type="number" 
                  name="empleosGenerados"
                  value={formData.empleosGenerados || ''}
                  onChange={handleChange}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej: 150"
                />
              </div>

              {presupuestoData && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Valor Total del Proyecto</label>
                    <input 
                      type="number" 
                      name="valorTotal"
                      value={presupuestoData.valorTotal || ''}
                      onChange={handlePresupuestoChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej: 150000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Aportes FNGRD</label>
                    <input 
                      type="number" 
                      name="aportesFngrd"
                      value={presupuestoData.aportesFngrd || ''}
                      onChange={handlePresupuestoChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej: 100000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Aportes Municipio</label>
                    <input 
                      type="number" 
                      name="aportesMunicipio"
                      value={presupuestoData.aportesMunicipio || ''}
                      onChange={handlePresupuestoChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej: 50000000"
                    />
                  </div>
                </>
              )}

              {/* Profesionales Asignados */}
              <div className="col-span-2 border-t border-slate-200 pt-4 mt-2">
                <h3 className="text-md font-bold text-slate-800 mb-4">Responsables Asignados (Planta OPS)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Responsable OPS</label>
                    <select
                      name="responsableOpsId"
                      value={formData.responsableOpsId || ''}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar responsable...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Apoyo Técnico</label>
                    <select
                      name="apoyoTecnicoId"
                      value={formData.apoyoTecnicoId || ''}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar apoyo técnico...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Apoyo Financiero</label>
                    <select
                      name="apoyoFinancieroId"
                      value={formData.apoyoFinancieroId || ''}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar apoyo financiero...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Apoyo Jurídico</label>
                    <select
                      name="apoyoJuridicoId"
                      value={formData.apoyoJuridicoId || ''}
                      onChange={handleChange}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    >
                      <option value="">Seleccionar apoyo jurídico...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Objetivo General</label>
                <textarea 
                  name="objetivoGeneral"
                  value={formData.objetivoGeneral}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Alcance</label>
                <textarea 
                  name="alcance"
                  value={formData.alcance}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">Justificación</label>
                <textarea 
                  name="justificacion"
                  value={formData.justificacion}
                  onChange={handleChange}
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            form="edit-project-form"
            className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
