import React, { useState } from 'react';
import { X, Save, Loader2, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Contract } from '../types';
import { useProject } from '../store/ProjectContext';
import { extractContractData } from '../services/geminiService';
import DocumentReader from './DocumentReader';
import { formatDateForInput } from '../lib/storage';

interface EditContractModalProps {
  contract: Contract;
  projectId: string;
  onClose: () => void;
}

export const EditContractModal: React.FC<EditContractModalProps> = ({ contract, projectId, onClose }) => {
  const { updateContract, state } = useProject();
  const [formData, setFormData] = useState<Contract>({ ...contract });
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [changes, setChanges] = useState<{ field: string; old: any; new: any }[]>([]);
  const [showChanges, setShowChanges] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculatePlazo = (inicio: string, fin: string) => {
    if (!inicio || !fin) return formData.plazoMeses;
    const start = new Date(inicio);
    const end = new Date(fin);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return formData.plazoMeses;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.round(diffDays / 30.44); // Average days in a month
  };

  const handleDateChange = (field: 'fechaInicio' | 'fechaFin', value: string) => {
    const newData = { ...formData, [field]: value };
    const newPlazo = calculatePlazo(
      field === 'fechaInicio' ? value : newData.fechaInicio || '',
      field === 'fechaFin' ? value : newData.fechaFin || ''
    );
    setFormData({ ...newData, plazoMeses: newPlazo });
  };

  const handleAIExtraction = async (text: string) => {
    setIsParsing(true);
    setParsingStep('Analizando contrato con IA...');
    try {
      const extracted = await extractContractData(text);
      
      const newChanges: { field: string; old: any; new: any }[] = [];
      const updatedData = { ...formData };

      const compareAndUpdate = (field: keyof Contract, newValue: any) => {
        const oldValue = formData[field];
        if (newValue !== undefined && newValue !== null && newValue !== oldValue) {
          newChanges.push({ 
            field, 
            old: oldValue || 'Vacío', 
            new: newValue 
          });
          (updatedData as any)[field] = newValue;
        }
      };

      if (extracted.numero) compareAndUpdate('numero', extracted.numero);
      if (extracted.objetoContractual) compareAndUpdate('objetoContractual', extracted.objetoContractual);
      if (extracted.valor) compareAndUpdate('valor', extracted.valor);
      if (extracted.plazoMeses) compareAndUpdate('plazoMeses', extracted.plazoMeses);
      if (extracted.contratista) compareAndUpdate('contratista', extracted.contratista);
      if (extracted.nit) compareAndUpdate('nit', extracted.nit);
      if (extracted.fechaInicio) compareAndUpdate('fechaInicio', extracted.fechaInicio);
      if (extracted.fechaFin) compareAndUpdate('fechaFin', extracted.fechaFin);
      if (extracted.estado) compareAndUpdate('estado', extracted.estado);
      if (extracted.tipo) compareAndUpdate('tipo', extracted.tipo);

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
    updateContract(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Editar Contrato</h2>
            <p className="text-sm text-slate-500 mt-1">Modifica los detalles del contrato o usa la IA para autocompletar.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* AI Extraction Section */}
          <div className="mb-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-600 text-white rounded-lg">
                <Upload size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Actualización Inteligente (IA SRR)</h3>
                <p className="text-xs text-slate-500">Carga el contrato o pega el texto para autocompletar.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DocumentReader 
                onDataExtracted={() => {}}
                onTextExtracted={handleAIExtraction}
              />
              
              <div className="relative">
                <textarea
                  className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none bg-white"
                  placeholder="Pega aquí el texto del contrato..."
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
                    <CheckCircle2 size={14} className="text-emerald-500" />
                    Cambios detectados ({changes.length})
                  </h4>
                  <button onClick={() => setShowChanges(false)} className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase">Ocultar</button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                  {changes.map((change, i) => (
                    <div key={i} className="text-[11px] p-2 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700 uppercase mr-2">{change.field}:</span>
                      <span className="text-rose-500 line-through mr-2">{String(change.old)}</span>
                      <span className="text-emerald-600 font-bold">→ {String(change.new)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form id="edit-contract-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Número de Contrato</label>
              <input type="text" value={formData.numero} onChange={e => setFormData({...formData, numero: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">Objeto Contractual</label>
              <textarea value={formData.objetoContractual} onChange={e => setFormData({...formData, objetoContractual: e.target.value})} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Valor</label>
              <input type="number" value={formData.valor} onChange={e => setFormData({...formData, valor: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Plazo (Meses)</label>
              <input type="number" value={formData.plazoMeses} onChange={e => setFormData({...formData, plazoMeses: Number(e.target.value)})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Contratista</label>
              <input type="text" value={formData.contratista} onChange={e => setFormData({...formData, contratista: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">NIT Contratista</label>
              <input type="text" value={formData.nit} onChange={e => setFormData({...formData, nit: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" required />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
              <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value as any})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="En ejecución">En ejecución</option>
                <option value="En liquidación">En liquidación</option>
                <option value="Liquidado">Liquidado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo</label>
              <select value={formData.tipo} onChange={e => setFormData({...formData, tipo: e.target.value as any})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="Obra">Obra</option>
                <option value="Interventoría">Interventoría</option>
                <option value="Consultoría">Consultoría</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Responsable (OPS)</label>
              <select value={formData.responsibleId || ''} onChange={e => setFormData({...formData, responsibleId: e.target.value})} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
                <option value="">Seleccionar responsable...</option>
                {state.professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Inicio</label>
              <input type="date" value={formatDateForInput(formData.fechaInicio || '')} onChange={e => handleDateChange('fechaInicio', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Fecha Fin</label>
              <input type="date" value={formatDateForInput(formData.fechaFin || '')} onChange={e => handleDateChange('fechaFin', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
          <button type="submit" form="edit-contract-form" className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2">
            <Save size={16} />
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  );
};
