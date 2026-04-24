import React, { useState } from 'react';
import { ContractEvent, ContractEventType } from '../types';
import { useProject } from '../store/ProjectContext';
import { Calendar, FileText, Plus, X, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';

interface ContractEventFormProps {
  contractId: string;
  onClose: () => void;
}

export const ContractEventForm: React.FC<ContractEventFormProps> = ({ contractId, onClose }) => {
  const { addContractEvent, addDocument } = useProject();
  const [event, setEvent] = useState<Partial<ContractEvent>>({
    contractId,
    tipo: 'Acta de Inicio',
    fecha: new Date().toISOString().split('T')[0],
    descripcion: '',
    impactoPlazoMeses: 0,
    impactoValor: 0,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const eventTypes: ContractEventType[] = [
    'Acta de Inicio',
    'Otrosí',
    'Suspensión',
    'Reinicio',
    'Prórroga',
    'Modificación de Valor',
    'Acta de Liquidación'
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.descripcion || !event.fecha) return;

    setIsSubmitting(true);

    try {
      let documentUrl = '';

      if (selectedFile) {
        const folderPath = `Contratos/${contractId}/Eventos`;
        documentUrl = await uploadDocumentToStorage(selectedFile, folderPath);
        
        // Add to document repository
        addDocument({
          id: `DOC-EVT-${Date.now()}`,
          contractId,
          titulo: `Soporte ${event.tipo}`,
          tipo: 'Soporte Evento',
          fechaCreacion: new Date().toISOString().split('T')[0],
          ultimaActualizacion: new Date().toISOString().split('T')[0],
          estado: 'Aprobado',
          tags: ['Evento', event.tipo!],
          folderPath,
          versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: documentUrl,
            nombreArchivo: selectedFile.name,
            subidoPor: 'Administrador',
            accion: 'Subida',
            estado: 'Aprobado'
          }]
        });
      }

      const newEvent: ContractEvent = {
        ...event,
        id: `EVT-${Date.now()}`,
        documentUrl
      } as ContractEvent;

      addContractEvent(newEvent);
      onClose();
    } catch (error) {
      console.error("Error saving contract event:", error);
      alert("Hubo un error al guardar el evento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <Plus size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Nuevo Evento Contractual</h2>
              <p className="text-sm text-slate-500">Registra un hito o modificación al contrato</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Evento</label>
            <select 
              value={event.tipo} 
              onChange={e => setEvent(prev => ({...prev, tipo: e.target.value as ContractEventType}))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
            >
              {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha</label>
              <div className="relative">
                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="date"
                  required
                  value={formatDateForInput(event.fecha)} 
                  onChange={e => setEvent(prev => ({...prev, fecha: e.target.value}))}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impacto Plazo (Meses)</label>
              <input 
                type="number"
                value={event.impactoPlazoMeses} 
                onChange={e => setEvent(prev => ({...prev, impactoPlazoMeses: Number(e.target.value)}))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Impacto Valor ($)</label>
            <input 
              type="number"
              value={event.impactoValor} 
              onChange={e => setEvent(prev => ({...prev, impactoValor: Number(e.target.value)}))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono text-indigo-600 font-bold"
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Descripción / Observaciones</label>
            <textarea 
              required
              rows={3}
              value={event.descripcion} 
              onChange={e => setEvent(prev => ({...prev, descripcion: e.target.value}))}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
              placeholder="Detalles del evento..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Documento de Soporte</label>
            <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <FileText size={20} className="text-slate-400" />
              <span className="text-sm text-slate-500">
                {selectedFile ? selectedFile.name : 'Cargar acta o resolución (PDF)'}
              </span>
              <input 
                type="file" 
                className="hidden" 
                id="event-doc" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
              />
              <label htmlFor="event-doc" className="ml-auto text-xs font-bold text-indigo-600 cursor-pointer hover:underline">Subir</label>
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                'Registrar Evento'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
