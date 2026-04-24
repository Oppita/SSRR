import React, { useState } from 'react';
import { Briefcase, Save, X, Upload, Loader2, BrainCircuit, FileText } from 'lucide-react';
import { Convenio } from '../types';
import { useProject } from '../store/ProjectContext';
import { showAlert } from '../utils/alert';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';
import { AIProviderSelector } from './AIProviderSelector';
import { extractConvenioData, extractConvenioDataFromPDF } from '../services/geminiService';

interface CreateConvenioFormProps {
  onSave: (convenio: Convenio) => void;
  onCancel: () => void;
}

export const CreateConvenioForm: React.FC<CreateConvenioFormProps> = ({ onSave, onCancel }) => {
  const { addDocument } = useProject();
  const [convenio, setConvenio] = useState<Partial<Convenio>>({
    numero: '',
    nombre: '',
    objeto: '',
    partes: '',
    valorTotal: 0,
    valorAportadoFondo: 0,
    valorAportadoContrapartida: 0,
    fechaInicio: '',
    fechaFin: '',
    estado: 'Activo',
    tipo: 'específico',
    metadata: {}
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [showTextModal, setShowTextModal] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const handleTextExtraction = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const extracted = await extractConvenioData(pastedText);
      console.log('Extracted data:', extracted);
      if (extracted) {
        setConvenio(prev => ({
          ...prev,
          numero: extracted.numeroConvenio || prev.numero,
          nombre: extracted.partesConvenio || prev.nombre,
          objeto: extracted.objetoConvenio || prev.objeto,
          partes: extracted.partesConvenio || prev.partes,
          valorTotal: extracted.valorTotalProyecto || prev.valorTotal,
          valorAportadoFondo: extracted.aporteFngrdObraInterventoria || prev.valorAportadoFondo,
          valorAportadoContrapartida: extracted.aporteMunicipioGobernacionObraInterventoria || prev.valorAportadoContrapartida,
          fechaInicio: extracted.actaInicioConvenio || prev.fechaInicio,
          fechaFin: extracted.fechaFinalizacionConvenio || prev.fechaFin,
        }));
        showAlert('Datos extraídos del texto correctamente.');
        setShowTextModal(false);
        setPastedText('');
      } else {
        console.warn('Extraction returned null or empty');
        showAlert('La IA no pudo extraer datos del texto proporcionado.');
      }
    } catch (error) {
      console.error('Error extracting convenio data:', error);
      showAlert('Error al extraer datos del texto.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);

    if (selectedFile.type === 'application/pdf') {
      setIsAnalyzing(true);
      setAnalysisProgress('Analizando PDF con IA de alto rigor...');
      try {
        console.log('Iniciando extracción de datos de convenio desde PDF...');
        const extracted = await extractConvenioDataFromPDF(selectedFile);
        console.log('Datos extraídos del convenio:', extracted);

        if (extracted) {
          // Mapeo robusto para convenio
          const robustExtracted = { ...extracted };
          if (extracted.numeroConvenio && !robustExtracted.numero) robustExtracted.numero = extracted.numeroConvenio;
          if (extracted.partesConvenio && !robustExtracted.nombre) robustExtracted.nombre = extracted.partesConvenio;
          if (extracted.partesConvenio && !robustExtracted.partes) robustExtracted.partes = extracted.partesConvenio;
          if (extracted.objetoConvenio && !robustExtracted.objeto) robustExtracted.objeto = extracted.objetoConvenio;
          if (extracted.valorTotalProyecto && !robustExtracted.valorTotal) robustExtracted.valorTotal = extracted.valorTotalProyecto;
          if (extracted.actaInicioConvenio && !robustExtracted.fechaInicio) robustExtracted.fechaInicio = extracted.actaInicioConvenio;
          if (extracted.fechaFinalizacionConvenio && !robustExtracted.fechaFin) robustExtracted.fechaFin = extracted.fechaFinalizacionConvenio;

          setConvenio(prev => ({
            ...prev,
            numero: robustExtracted.numero || prev.numero,
            nombre: robustExtracted.nombre || prev.nombre,
            objeto: robustExtracted.objeto || prev.objeto,
            partes: robustExtracted.partes || prev.partes,
            valorTotal: robustExtracted.valorTotal || prev.valorTotal,
            valorAportadoFondo: extracted.aporteFngrdObraInterventoria || prev.valorAportadoFondo,
            valorAportadoContrapartida: extracted.aporteMunicipioGobernacionObraInterventoria || prev.valorAportadoContrapartida,
            fechaInicio: robustExtracted.fechaInicio || prev.fechaInicio,
            fechaFin: robustExtracted.fechaFin || prev.fechaFin,
            metadata: {
              ...prev.metadata,
              ...extracted
            }
          }));
          showAlert('Datos extraídos del PDF correctamente. Por favor, verifícalos.');
          setAnalysisProgress('Análisis completado.');
        } else {
          throw new Error('No se recibió respuesta válida de la IA.');
        }
      } catch (error: any) {
        console.error('Error en extracción de PDF:', error);
        showAlert(`Error al analizar el PDF: ${error.message || 'Error desconocido'}. Intente pegar el texto manualmente.`);
        setAnalysisProgress('Error en el análisis.');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!convenio.numero || !convenio.nombre || !convenio.valorTotal) {
      showAlert('Por favor complete los campos obligatorios (Número, Nombre, Valor Total).');
      return;
    }

    setIsSubmitting(true);
    try {
      const convenioId = `CONV-${Date.now()}`;
      let documentUrl = '';

      if (file) {
        const folderPath = `convenios/${convenioId}`;
        documentUrl = await uploadDocumentToStorage(file, folderPath);

        if (documentUrl) {
          addDocument({
            id: Math.random().toString(36).substr(2, 9),
            convenioId: convenioId,
            titulo: file.name,
            tipo: 'Convenio',
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            estado: 'Aprobado',
            tags: ['Convenio', 'Soporte'],
            folderPath,
            versiones: [{
              id: Math.random().toString(36).substr(2, 9),
              version: 1,
              fecha: new Date().toISOString(),
              url: documentUrl,
              nombreArchivo: file.name,
              subidoPor: 'Sistema',
              accion: 'Subida',
              estado: 'Aprobado'
            }]
          });
        }
      }

      const newConvenio: Convenio = {
        id: convenioId,
        numero: convenio.numero!,
        nombre: convenio.nombre!,
        objeto: convenio.objeto || '',
        partes: convenio.partes || '',
        valorTotal: Number(convenio.valorTotal),
        valorAportadoFondo: Number(convenio.valorAportadoFondo || 0),
        valorAportadoContrapartida: Number(convenio.valorAportadoContrapartida || 0),
        fechaInicio: convenio.fechaInicio || '',
        fechaFin: convenio.fechaFin || '',
        estado: convenio.estado as any || 'Activo',
        tipo: convenio.tipo as any || 'específico',
        documentoUrl: documentUrl || undefined,
        metadata: {
          ...convenio.metadata
        }
      };

      onSave(newConvenio);
    } catch (error) {
      console.error('Error creating convenio:', error);
      showAlert('Error al crear el convenio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-900 rounded-xl text-white">
            <Briefcase size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Crear Nuevo Convenio</h2>
            <p className="text-slate-500">Nodo principal de la jerarquía del sistema</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={onCancel} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="mb-8 flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-inner">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Cerebro de Análisis SRR:</span>
          </div>
          <button
            type="button"
            onClick={() => setShowTextModal(true)}
            className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm text-sm font-bold"
          >
            <FileText size={18} />
            Pegar Texto
          </button>
        </div>
        <AIProviderSelector />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Número de Convenio *</label>
            <input 
              type="text" 
              value={convenio.numero} 
              onChange={e => setConvenio({...convenio, numero: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="Ej. 9677-PPAL001-2023"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Nombre / Título *</label>
            <input 
              type="text" 
              value={convenio.nombre} 
              onChange={e => setConvenio({...convenio, nombre: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="Nombre descriptivo del convenio"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Objeto del Convenio</label>
            <textarea 
              value={convenio.objeto} 
              onChange={e => setConvenio({...convenio, objeto: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none min-h-[100px]"
              placeholder="Descripción detallada del objeto..."
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Partes Involucradas</label>
            <input 
              type="text" 
              value={convenio.partes} 
              onChange={e => setConvenio({...convenio, partes: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
              placeholder="Ej. UNGRD, Municipio de Cartagena"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Convenio</label>
            <select 
              value={convenio.tipo} 
              onChange={e => setConvenio({...convenio, tipo: e.target.value as any})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
            >
              <option value="marco">Marco</option>
              <option value="específico">Específico</option>
              <option value="interadministrativo">Interadministrativo</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
            <select 
              value={convenio.estado} 
              onChange={e => setConvenio({...convenio, estado: e.target.value as any})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
            >
              <option value="Activo">Activo</option>
              <option value="En liquidación">En liquidación</option>
              <option value="Liquidado">Liquidado</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Valor Total *</label>
            <input 
              type="number" 
              value={convenio.valorTotal || ''} 
              onChange={e => setConvenio({...convenio, valorTotal: Number(e.target.value)})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Valor Aportado Fondo</label>
            <input 
              type="number" 
              value={convenio.valorAportadoFondo || ''} 
              onChange={e => setConvenio({...convenio, valorAportadoFondo: Number(e.target.value)})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Inicio</label>
            <input 
              type="date" 
              value={formatDateForInput(convenio.fechaInicio)} 
              onChange={e => setConvenio({...convenio, fechaInicio: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">Fecha de Finalización</label>
            <input 
              type="date" 
              value={formatDateForInput(convenio.fechaFin)} 
              onChange={e => setConvenio({...convenio, fechaFin: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-bold text-slate-700 mb-1">Documento Soporte (Opcional)</label>
            <div className="flex items-center gap-4">
              <label className="flex-1 flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                  <p className="mb-2 text-sm text-slate-500">
                    <span className="font-semibold">Click para subir</span> o arrastra y suelta
                  </p>
                  <p className="text-xs text-slate-500">PDF, DOCX, XLSX (MAX. 10MB)</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleFileUpload}
                />
              </label>
              {file && (
                <div className="flex-1 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-sm font-medium text-indigo-900 truncate">{file.name}</p>
                  <p className="text-xs text-indigo-700 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {isAnalyzing && (
                    <div className="mt-2 flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-indigo-600" />
                      <span className="text-xs text-indigo-600 font-medium">{analysisProgress}</span>
                    </div>
                  )}
                  {!isAnalyzing && analysisProgress && (
                    <p className="mt-1 text-xs text-emerald-600 font-medium">{analysisProgress}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setAnalysisProgress('');
                    }}
                    className="mt-2 text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Eliminar archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save size={20} />
                Guardar Convenio
              </>
            )}
          </button>
        </div>
      </form>

      {/* Text Extraction Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={24} />
                Extraer Datos de Convenio
              </h3>
              <button onClick={() => setShowTextModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pegue aquí el texto del convenio para que la IA extraiga los campos automáticamente.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm"
                placeholder="Pegue el contenido aquí..."
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTextModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTextExtraction}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} />
                      Extraer Datos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
