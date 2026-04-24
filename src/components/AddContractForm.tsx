import React, { useState } from 'react';
import { Type } from '@google/genai';
import { extractDataFromPDF, extractDataFromText } from '../services/pdfExtractorService';
import { Contract } from '../types';
import { useProject } from '../store/ProjectContext';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, X, Type as TypeIcon } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { uploadDocumentToStorage } from '../lib/storage';
import { AIProviderSelector } from './AIProviderSelector';

interface AddContractFormProps {
  projectId: string;
  onClose: () => void;
}

export const AddContractForm: React.FC<AddContractFormProps> = ({ projectId, onClose }) => {
  const { state, addContract, addDocument } = useProject();
  const [contract, setContract] = useState<Partial<Contract>>({
    projectId,
    numero: '',
    tipo: 'Obra',
    contratista: '',
    nit: '',
    valor: 0,
    objetoContractual: '',
    plazoMeses: 0,
    fechaInicio: '',
    fechaFin: '',
    supervisor: '',
    formaPago: '',
    garantias: [],
    obligacionesPrincipales: [],
    vigencia: '',
    lineaInversion: '',
  });
  
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; file: File } | null>(null);
  const [manualText, setManualText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleTextAnalysis = async () => {
    if (!manualText) return;
    setIsParsing(true);
    setParsingStep('Analizando texto con IA de alto rigor...');
    setProgress(50);
    try {
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          numero: { type: Type.STRING },
          contratista: { type: Type.STRING },
          valor: { type: Type.NUMBER },
          objetoContractual: { type: Type.STRING },
          fechaInicio: { type: Type.STRING },
          fechaFin: { type: Type.STRING },
          obligacionesPrincipales: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['numero', 'contratista', 'valor', 'objetoContractual', 'fechaInicio', 'fechaFin', 'obligacionesPrincipales'],
      };
      
      const prompt = `Analiza este contrato con máximo rigor. Extrae los detalles clave, incluyendo todas las obligaciones principales.`;
      
      const extractedData = await extractDataFromText(manualText, prompt, responseSchema);
      setContract(prev => ({ ...prev, ...extractedData }));
      setProgress(100);
      setParsingStep('Análisis completado');
      setTimeout(() => setIsParsing(false), 1000);
    } catch (error) {
      console.error("Error parsing text:", error);
      setParsingStep('Error en el análisis');
      setTimeout(() => setIsParsing(false), 2000);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({ name: file.name, file });
    setIsParsing(true);
    setParsingStep('Analizando documento con IA...');
    setProgress(50);
    
    try {
      const prompt = "Extract contract details, including all main obligations, from this PDF with maximum rigor.";
      const responseSchema = {
          type: Type.OBJECT,
          properties: {
            numero: { type: Type.STRING },
            contratista: { type: Type.STRING },
            valor: { type: Type.NUMBER },
            objetoContractual: { type: Type.STRING },
            fechaInicio: { type: Type.STRING },
            fechaFin: { type: Type.STRING },
            obligacionesPrincipales: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['numero', 'contratista', 'valor', 'objetoContractual', 'fechaInicio', 'fechaFin', 'obligacionesPrincipales'],
        };
      
      const extractedData = await extractDataFromPDF(file, prompt, responseSchema);
      setProgress(90);
      
      setContract(prev => ({ ...prev, ...extractedData }));
      setProgress(100);
      setParsingStep('Análisis completado con éxito');
      
      setTimeout(() => {
        setIsParsing(false);
        setProgress(0);
        setParsingStep('');
      }, 1500);
    } catch (error) {
      console.error("Error parsing PDF:", error);
      setParsingStep('Error en el análisis del documento');
      setTimeout(() => setIsParsing(false), 3000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    const isDuplicate = state.contratos.some(c => c.numero === contract.numero);
    if (isDuplicate) {
      setShowDuplicateModal(true);
      return;
    }

    confirmSubmit();
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const contractId = `CTR-${Date.now()}`;
      const newContract = { ...contract, id: contractId } as Contract;
      addContract(newContract);

      // If a file was uploaded, add it to the repository
      if (uploadedFile) {
        const project = state.proyectos.find(p => p.id === projectId);
        const projectName = project?.nombre || 'Proyecto';
        const folderPath = `${projectName}/Contratos`;
        
        // Upload to Supabase
        const publicUrl = await uploadDocumentToStorage(uploadedFile.file, folderPath);
        
        // Find contractor by NIT if they exist
        const contractor = state.contratistas.find(c => c.nit === newContract.nit);

        addDocument({
          id: `DOC-${Date.now()}`,
          projectId,
          contractId,
          contractorId: contractor?.id,
          titulo: `Contrato ${newContract.numero} - ${newContract.contratista}`,
          tipo: 'Contrato',
          descripcion: `Documento original del contrato ${newContract.numero}`,
          fechaCreacion: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
          versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString(),
            url: publicUrl,
            nombreArchivo: uploadedFile.name,
            subidoPor: 'Sistema (Extracción IA)',
            accion: 'Subida',
            estado: 'Borrador'
          }],
          tags: ['Contrato', newContract.tipo],
          folderPath,
          estado: 'Borrador'
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving contract:", error);
      alert("Hubo un error al guardar el contrato y el documento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Configuración de Contrato</h2>
              <p className="text-sm text-slate-500">Carga el PDF para extracción automática de alto rigor</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-6 flex items-center justify-between bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Cerebro de Análisis:</span>
            </div>
            <AIProviderSelector />
          </div>

          <div className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4">Carga o Análisis de Contrato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <label className="group relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isParsing ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-700">{parsingStep}</p>
                        <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-indigo-100 rounded-full text-indigo-600 mb-3 group-hover:scale-110 transition-transform">
                        <Upload size={24} />
                      </div>
                      <p className="mb-2 text-sm text-slate-700 font-semibold">Haz clic para cargar el Contrato (PDF)</p>
                      <p className="text-xs text-slate-400">Análisis IA de alto rigor</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} disabled={isParsing} />
              </label>
              
              <div className="flex flex-col gap-2">
                <textarea 
                  rows={6} 
                  value={manualText} 
                  onChange={e => setManualText(e.target.value)} 
                  className="w-full h-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="O pegue aquí el texto del contrato para análisis manual..."
                />
                <button 
                  type="button" 
                  onClick={handleTextAnalysis}
                  disabled={isParsing || !manualText}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  Analizar Texto
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Número de Contrato</label>
                <input 
                  required
                  value={contract.numero} 
                  onChange={e => setContract(prev => ({...prev, numero: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ej: 2024-001"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fase</label>
                <select 
                  value={contract.faseId || ''} 
                  onChange={e => setContract(prev => ({...prev, faseId: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Seleccionar Fase</option>
                  {state.proyectos.find(p => p.id === projectId)?.fases?.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Contrato</label>
                <select 
                  value={contract.tipo} 
                  onChange={e => setContract(prev => ({...prev, tipo: e.target.value as any}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="Convenio">Convenio</option>
                  <option value="Obra">Obra</option>
                  <option value="Interventoría">Interventoría</option>
                  <option value="OPS">OPS</option>
                  <option value="Interadministrativo">Interadministrativo</option>
                  <option value="Consultoría">Consultoría</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Total</label>
                <input 
                  type="number"
                  required
                  value={contract.valor} 
                  onChange={e => setContract(prev => ({...prev, valor: Number(e.target.value)}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-indigo-600 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vigencia</label>
                <select 
                  value={contract.vigencia} 
                  onChange={e => setContract(prev => ({...prev, vigencia: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Seleccionar Vigencia</option>
                  {state.vigencias.map(v => (
                    <option key={v.id} value={v.anio}>{v.anio}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Línea de Inversión</label>
                <select 
                  value={contract.lineaInversion} 
                  onChange={e => setContract(prev => ({...prev, lineaInversion: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                >
                  <option value="">Seleccionar Línea</option>
                  {state.lineasInversion.map(l => (
                    <option key={l.id} value={l.nombre}>{l.nombre}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Contratista</label>
                <input 
                  required
                  value={contract.contratista} 
                  onChange={e => setContract(prev => ({...prev, contratista: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">NIT / Identificación</label>
                <input 
                  required
                  value={contract.nit} 
                  onChange={e => setContract(prev => ({...prev, nit: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Objeto Contractual Detallado</label>
              <textarea 
                required
                rows={4}
                value={contract.objetoContractual} 
                onChange={e => setContract(prev => ({...prev, objetoContractual: e.target.value}))}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Plazo (Meses)</label>
                <input 
                  type="number"
                  value={contract.plazoMeses} 
                  onChange={e => setContract(prev => ({...prev, plazoMeses: Number(e.target.value)}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Fecha Inicio</label>
                <input 
                  type="date"
                  value={contract.fechaInicio} 
                  onChange={e => setContract(prev => ({...prev, fechaInicio: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Supervisor</label>
                <input 
                  value={contract.supervisor} 
                  onChange={e => setContract(prev => ({...prev, supervisor: e.target.value}))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            {contract.obligacionesPrincipales && contract.obligacionesPrincipales.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-500" />
                  Obligaciones Principales Extraídas
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {contract.obligacionesPrincipales.map((ob, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 flex gap-3">
                      <span className="font-bold text-indigo-600">{idx + 1}.</span>
                      {ob}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 flex justify-end gap-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={onClose}
                className="px-6 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar Contrato'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={confirmSubmit}
        title="Contrato Duplicado Detectado"
        message="Ya existe un contrato con este número. ¿Deseas crearlo de todas formas?"
        confirmLabel="Sí, crear duplicado"
        cancelLabel="No, cancelar"
      />
    </div>
  );
};
