import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Upload, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Clock,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Activity,
  Save,
  Download
} from 'lucide-react';
import { Convenio, Otrosie, ProjectDocument, DocumentType } from '../types';
import { useProject } from '../store/ProjectContext';
import { AIProviderSelector } from './AIProviderSelector';
import { aiProviderService } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import { uploadDocumentToStorage, downloadFileWithAutoRepair, formatDateForInput } from '../lib/storage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface ConvenioDocumentManagerProps {
  convenio: Convenio;
}

export const ConvenioDocumentManager: React.FC<ConvenioDocumentManagerProps> = ({ convenio }) => {
  const { state, addOtrosie, deleteOtrosie, addDocument, deleteDocument } = useProject();
  const [showAddOtrosie, setShowAddOtrosie] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  
  const [newOtrosie, setNewOtrosie] = useState<Partial<Otrosie>>({
    convenioId: convenio.id,
    numero: '',
    fechaFirma: '',
    objeto: '',
    justificacionTecnica: '',
    justificacionJuridica: '',
    valorAdicional: 0,
    plazoAdicionalMeses: 0,
    clausulasModificadas: [],
    impactoPresupuestal: [],
    nuevasObligaciones: [],
    riesgosIdentificados: [],
    analisisOptimización: '',
    tipoModificacion: 'Adición y Prórroga',
    supervisorResponsable: '',
    nitEntidad: '',
    nitContratista: '',
    estado: 'Firmado'
  });

  const [newDoc, setNewDoc] = useState({
    titulo: '',
    tipo: 'Otrosí' as DocumentType,
    descripcion: '',
  });

  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const convenioOtrosies = state.otrosies.filter(o => o.convenioId === convenio.id);
  const convenioDocs = state.documentos.filter(d => d.convenioId === convenio.id);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setIsParsing(true);
    setParsingStep('Leyendo documento...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('PDF arrayBuffer loaded, size:', arrayBuffer.byteLength);
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const parts: any[] = [];
      
      // Extract up to 20 pages for analysis to ensure full coverage of clauses
      const pagesToProcess = Math.min(pdf.numPages, 10);
      console.log('Processing pages:', pagesToProcess);
      
      for (let i = 1; i <= pagesToProcess; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({ canvasContext: context!, viewport }).promise;
        const base64 = canvas.toDataURL('image/jpeg').split(',')[1];
        
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64,
          },
        });
        
        setParsingStep(`Procesando página ${i} de ${pagesToProcess}...`);
      }

      setParsingStep('Analizando con IA de alto rigor...');
      console.log('Sending to AI, parts:', parts.length);
      
      const prompt = `Eres un auditor experto en contratación estatal y gestión de proyectos de infraestructura de alto nivel. 
      Tu tarea es realizar una auditoría exhaustiva de documentos de Otrosí de un Convenio Marco y extraer una estructura JSON con el máximo rigor.
      
      Debes devolver un objeto JSON con la siguiente estructura exacta:
      {
        "numeroOtrosie": "string",
        "fechaFirma": "string",
        "valorAdicional": number,
        "plazoAdicionalMeses": number,
        "clausulasModificadas": ["string"],
        "impactoPresupuestal": ["string"],
        "nuevasObligaciones": ["string"],
        "riesgosIdentificados": ["string"],
        "analisisOptimización": "string",
        "tipoModificacion": "string",
        "supervisorResponsable": "string",
        "nitEntidad": "string",
        "nitContratista": "string"
      }
      
      REGLAS CRÍTICAS:
      1. EXTRACCIÓN DE CLÁUSULAS: Debes identificar y extraer TODAS las cláusulas modificadas sin excepción. No omitas ninguna por ser extensa.
      2. CIFRAS: Extrae los valores numéricos exactos. Verifica puntos y comas de miles y decimales.
      3. FECHAS: Extrae todas las fechas en formato YYYY-MM-DD.
      4. IDENTIFICACIÓN: Extrae NITS, Cédulas y nombres completos de responsables mencionados.
      5. RIGOR TÉCNICO: Si el documento menciona un impacto presupuestal detallado por rubros, lístalos todos.`;

      const config = {
        responseMimeType: 'application/json'
      };

      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel(), config, parts);
      const extractedData = parseJSONResponse(result);

      if (extractedData) {
        setNewOtrosie(prev => ({ 
          ...prev, 
          ...extractedData,
          clausulasModificadas: Array.isArray(extractedData.clausulasModificadas) ? extractedData.clausulasModificadas : (extractedData.clausulasModificadas ? [extractedData.clausulasModificadas] : prev.clausulasModificadas),
          impactoPresupuestal: Array.isArray(extractedData.impactoPresupuestal) ? extractedData.impactoPresupuestal : (extractedData.impactoPresupuestal ? [extractedData.impactoPresupuestal] : prev.impactoPresupuestal),
          nuevasObligaciones: Array.isArray(extractedData.nuevasObligaciones) ? extractedData.nuevasObligaciones : (extractedData.nuevasObligaciones ? [extractedData.nuevasObligaciones] : prev.nuevasObligaciones),
          riesgosIdentificados: Array.isArray(extractedData.riesgosIdentificados) ? extractedData.riesgosIdentificados : (extractedData.riesgosIdentificados ? [extractedData.riesgosIdentificados] : prev.riesgosIdentificados)
        }));
      }
      setParsingStep('Análisis completado.');
    } catch (error) {
      console.error('Error parsing PDF:', error);
      setParsingStep('Error en el análisis: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddOtrosie = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const id = `OTS-${Date.now()}`;
      let documentUrl = '';
      
      if (uploadedFile) {
        documentUrl = await uploadDocumentToStorage(uploadedFile, `Convenios/${convenio.numero}/Otrosies`);
      }

      const finalOtrosie = {
        ...newOtrosie,
        id,
        documentoUrl: documentUrl,
        documentoNombre: uploadedFile?.name
      } as Otrosie;

      addOtrosie(finalOtrosie);

      // Also add as a document
      if (uploadedFile) {
        addDocument({
          id: `DOC-${Date.now()}`,
          convenioId: convenio.id,
          titulo: `Otrosí No. ${finalOtrosie.numero}`,
          tipo: 'Otrosí',
          descripcion: finalOtrosie.objeto,
          fechaCreacion: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
          versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString(),
            url: documentUrl,
            nombreArchivo: uploadedFile.name,
            subidoPor: 'Sistema',
            accion: 'Subida',
            estado: 'Aprobado'
          }],
          tags: ['Otrosí', 'Convenio'],
          estado: 'Aprobado',
          otrosiId: id
        });
      }

      setShowAddOtrosie(false);
      setNewOtrosie({
        convenioId: convenio.id,
        numero: '',
        fechaFirma: '',
        objeto: '',
        justificacionTecnica: '',
        justificacionJuridica: '',
        valorAdicional: 0,
        plazoAdicionalMeses: 0,
        analisisOptimización: '',
        tipoModificacion: 'Adición y Prórroga',
        supervisorResponsable: '',
        nitEntidad: '',
        nitContratista: '',
        estado: 'Firmado',
        clausulasModificadas: [],
        impactoPresupuestal: [],
        nuevasObligaciones: [],
        riesgosIdentificados: [],
      });
      setUploadedFile(null);
    } catch (error) {
      console.error('Error adding otrosie:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;
    
    setIsSubmitting(true);
    try {
      const url = await uploadDocumentToStorage(uploadedFile, `Convenios/${convenio.numero}/Documentos`);
      
      addDocument({
        id: `DOC-${Date.now()}`,
        convenioId: convenio.id,
        titulo: newDoc.titulo,
        tipo: newDoc.tipo,
        descripcion: newDoc.descripcion,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString(),
          url: url,
          nombreArchivo: uploadedFile.name,
          subidoPor: 'Sistema',
          accion: 'Subida',
          estado: 'Aprobado'
        }],
        tags: ['Documento', 'Convenio'],
        estado: 'Aprobado'
      });

      setShowAddDoc(false);
      setNewDoc({ titulo: '', tipo: 'Convenio', descripcion: '' });
      setUploadedFile(null);
    } catch (error) {
      console.error('Error adding document:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
          <FileText className="text-indigo-600" size={16} />
          Gestión de Documentos y Otrosíes
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowAddOtrosie(!showAddOtrosie)}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            Nuevo Otrosí
          </button>
          <button 
            onClick={() => setShowAddDoc(!showAddDoc)}
            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors flex items-center gap-1.5"
          >
            <Upload size={14} />
            Cargar Documento
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Formulario Nuevo Otrosí */}
        {showAddOtrosie && (
          <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Nuevo Otrosí para Convenio</h4>
              <button onClick={() => setShowAddOtrosie(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="mb-4 space-y-4">
              <div className="flex justify-end">
                <AIProviderSelector />
              </div>
              <label className="block p-4 bg-white rounded-xl border-2 border-dashed border-indigo-200 text-center cursor-pointer hover:bg-indigo-50/50 transition-colors">
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
                <Upload className="mx-auto text-indigo-400 mb-2" size={24} />
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Cargar PDF para Extracción con IA</span>
                {uploadedFile && <p className="text-[10px] text-emerald-600 mt-1 font-bold">{uploadedFile.name}</p>}
              </label>
              {isParsing && (
                <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  <Loader2 size={12} className="animate-spin" />
                  {parsingStep}
                </div>
              )}
            </div>

            <form onSubmit={handleAddOtrosie} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Número de Otrosí</label>
                <input 
                  required 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.numero} 
                  onChange={e => setNewOtrosie({...newOtrosie, numero: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Fecha de Firma</label>
                <input 
                  required 
                  type="date" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={formatDateForInput(newOtrosie.fechaFirma || '')} 
                  onChange={e => setNewOtrosie({...newOtrosie, fechaFirma: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Tipo de Modificación</label>
                <select 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                  value={newOtrosie.tipoModificacion}
                  onChange={e => setNewOtrosie({...newOtrosie, tipoModificacion: e.target.value as any})}
                >
                  <option value="Adición">Adición</option>
                  <option value="Prórroga">Prórroga</option>
                  <option value="Adición y Prórroga">Adición y Prórroga</option>
                  <option value="Aclaración">Aclaración</option>
                  <option value="Modificación de Cláusulas">Modificación de Cláusulas</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Supervisor Responsable</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.supervisorResponsable} 
                  onChange={e => setNewOtrosie({...newOtrosie, supervisorResponsable: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">NIT Entidad</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.nitEntidad} 
                  onChange={e => setNewOtrosie({...newOtrosie, nitEntidad: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">NIT Contratista</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.nitContratista} 
                  onChange={e => setNewOtrosie({...newOtrosie, nitContratista: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Valor Adicional (COP)</label>
                <input 
                  required 
                  type="number" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.valorAdicional} 
                  onChange={e => setNewOtrosie({...newOtrosie, valorAdicional: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Prórroga (Meses)</label>
                <input 
                  required 
                  type="number" 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm" 
                  value={newOtrosie.plazoAdicionalMeses} 
                  onChange={e => setNewOtrosie({...newOtrosie, plazoAdicionalMeses: Number(e.target.value)})} 
                />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Objeto de la Modificación</label>
                <textarea 
                  required 
                  rows={2} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                  value={newOtrosie.objeto} 
                  onChange={e => setNewOtrosie({...newOtrosie, objeto: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Justificación Técnica</label>
                <textarea 
                  rows={2} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                  value={newOtrosie.justificacionTecnica} 
                  onChange={e => setNewOtrosie({...newOtrosie, justificacionTecnica: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Justificación Jurídica</label>
                <textarea 
                  rows={2} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                  value={newOtrosie.justificacionJuridica} 
                  onChange={e => setNewOtrosie({...newOtrosie, justificacionJuridica: e.target.value})} 
                />
              </div>
              
              {/* Secciones Rigurosas */}
              <div className="md:col-span-2 space-y-4 mt-2">
                <div className="p-4 bg-white rounded-xl border border-indigo-100">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={14} />
                    Cláusulas Modificadas
                  </h5>
                  <div className="space-y-3">
                    {newOtrosie.clausulasModificadas?.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg relative group">
                        <input 
                          placeholder="No. Cláusula" 
                          className="px-2 py-1 text-xs border rounded" 
                          value={c.numero} 
                          onChange={e => {
                            const updated = [...(newOtrosie.clausulasModificadas || [])];
                            updated[idx].numero = e.target.value;
                            setNewOtrosie({...newOtrosie, clausulasModificadas: updated});
                          }}
                        />
                        <textarea 
                          placeholder="Descripción Anterior" 
                          className="px-2 py-1 text-xs border rounded resize-none" 
                          value={c.descripcionAnterior}
                          onChange={e => {
                            const updated = [...(newOtrosie.clausulasModificadas || [])];
                            updated[idx].descripcionAnterior = e.target.value;
                            setNewOtrosie({...newOtrosie, clausulasModificadas: updated});
                          }}
                        />
                        <textarea 
                          placeholder="Descripción Nueva" 
                          className="px-2 py-1 text-xs border rounded resize-none" 
                          value={c.descripcionNueva}
                          onChange={e => {
                            const updated = [...(newOtrosie.clausulasModificadas || [])];
                            updated[idx].descripcionNueva = e.target.value;
                            setNewOtrosie({...newOtrosie, clausulasModificadas: updated});
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newOtrosie.clausulasModificadas?.filter((_, i) => i !== idx);
                            setNewOtrosie({...newOtrosie, clausulasModificadas: updated});
                          }}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewOtrosie({...newOtrosie, clausulasModificadas: [...(newOtrosie.clausulasModificadas || []), {numero: '', descripcionAnterior: '', descripcionNueva: ''}]})}
                      className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800"
                    >
                      <Plus size={12} /> Agregar Cláusula
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-indigo-100">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <DollarSign size={14} />
                    Impacto Presupuestal
                  </h5>
                  <div className="space-y-3">
                    {newOtrosie.impactoPresupuestal?.map((imp, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-2 bg-slate-50 rounded-lg relative group">
                        <input 
                          placeholder="Rubro" 
                          className="px-2 py-1 text-xs border rounded" 
                          value={imp.rubro} 
                          onChange={e => {
                            const updated = [...(newOtrosie.impactoPresupuestal || [])];
                            updated[idx].rubro = e.target.value;
                            setNewOtrosie({...newOtrosie, impactoPresupuestal: updated});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="V. Anterior" 
                          className="px-2 py-1 text-xs border rounded" 
                          value={imp.valorAnterior}
                          onChange={e => {
                            const updated = [...(newOtrosie.impactoPresupuestal || [])];
                            updated[idx].valorAnterior = Number(e.target.value);
                            updated[idx].variacion = updated[idx].valorNuevo - updated[idx].valorAnterior;
                            setNewOtrosie({...newOtrosie, impactoPresupuestal: updated});
                          }}
                        />
                        <input 
                          type="number"
                          placeholder="V. Nuevo" 
                          className="px-2 py-1 text-xs border rounded" 
                          value={imp.valorNuevo}
                          onChange={e => {
                            const updated = [...(newOtrosie.impactoPresupuestal || [])];
                            updated[idx].valorNuevo = Number(e.target.value);
                            updated[idx].variacion = updated[idx].valorNuevo - updated[idx].valorAnterior;
                            setNewOtrosie({...newOtrosie, impactoPresupuestal: updated});
                          }}
                        />
                        <div className="px-2 py-1 text-xs font-bold text-slate-500 flex items-center">
                          Var: {new Intl.NumberFormat('es-CO').format(imp.variacion)}
                        </div>
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newOtrosie.impactoPresupuestal?.filter((_, i) => i !== idx);
                            setNewOtrosie({...newOtrosie, impactoPresupuestal: updated});
                          }}
                          className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewOtrosie({...newOtrosie, impactoPresupuestal: [...(newOtrosie.impactoPresupuestal || []), {rubro: '', valorAnterior: 0, valorNuevo: 0, variacion: 0}]})}
                      className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800"
                    >
                      <Plus size={12} /> Agregar Rubro
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-indigo-100">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Riesgos Identificados
                  </h5>
                  <div className="space-y-2">
                    {newOtrosie.riesgosIdentificados?.map((r, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          className="flex-1 px-3 py-1.5 text-xs border rounded-lg" 
                          value={r} 
                          onChange={e => {
                            const updated = [...(newOtrosie.riesgosIdentificados || [])];
                            updated[idx] = e.target.value;
                            setNewOtrosie({...newOtrosie, riesgosIdentificados: updated});
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newOtrosie.riesgosIdentificados?.filter((_, i) => i !== idx);
                            setNewOtrosie({...newOtrosie, riesgosIdentificados: updated});
                          }}
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewOtrosie({...newOtrosie, riesgosIdentificados: [...(newOtrosie.riesgosIdentificados || []), '']})}
                      className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800"
                    >
                      <Plus size={12} /> Agregar Riesgo
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-indigo-100">
                  <h5 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Nuevas Obligaciones</h5>
                  <div className="space-y-2">
                    {newOtrosie.nuevasObligaciones?.map((ob, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          className="flex-1 px-3 py-1.5 text-xs border rounded-lg" 
                          value={ob} 
                          onChange={e => {
                            const updated = [...(newOtrosie.nuevasObligaciones || [])];
                            updated[idx] = e.target.value;
                            setNewOtrosie({...newOtrosie, nuevasObligaciones: updated});
                          }}
                        />
                        <button 
                          type="button"
                          onClick={() => {
                            const updated = newOtrosie.nuevasObligaciones?.filter((_, i) => i !== idx);
                            setNewOtrosie({...newOtrosie, nuevasObligaciones: updated});
                          }}
                          className="text-rose-500 hover:bg-rose-50 p-1 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => setNewOtrosie({...newOtrosie, nuevasObligaciones: [...(newOtrosie.nuevasObligaciones || []), '']})}
                      className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800"
                    >
                      <Plus size={12} /> Agregar Obligación
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Análisis de Optimización / Seguimiento Riguroso</label>
                  <textarea 
                    rows={3} 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none" 
                    value={newOtrosie.analisisOptimización} 
                    onChange={e => setNewOtrosie({...newOtrosie, analisisOptimización: e.target.value})} 
                    placeholder="Describa el impacto técnico y financiero detallado..."
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAddOtrosie(false)} className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Guardar Otrosí
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulario Nuevo Documento */}
        {showAddDoc && (
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Cargar Documento de Convenio</h4>
              <button onClick={() => setShowAddDoc(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Título del Documento</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm" 
                    value={newDoc.titulo} 
                    onChange={e => setNewDoc({...newDoc, titulo: e.target.value})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Tipo de Documento</label>
                  <select 
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                    value={newDoc.tipo}
                    onChange={e => setNewDoc({...newDoc, tipo: e.target.value as DocumentType})}
                  >
                    <option value="Convenio">Convenio</option>
                    <option value="Acta">Acta</option>
                    <option value="Informe">Informe</option>
                    <option value="Otrosí">Otrosí</option>
                    <option value="Soporte Financiero (CDP, RP)">Soporte Financiero</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Descripción</label>
                <textarea 
                  rows={2} 
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none" 
                  value={newDoc.descripcion} 
                  onChange={e => setNewDoc({...newDoc, descripcion: e.target.value})} 
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Archivo (PDF)</label>
                <label className="block p-4 bg-white rounded-xl border-2 border-dashed border-emerald-200 text-center cursor-pointer hover:bg-emerald-50/50 transition-colors">
                  <input type="file" accept=".pdf" onChange={e => setUploadedFile(e.target.files?.[0] || null)} className="hidden" />
                  <Upload className="mx-auto text-emerald-400 mb-2" size={24} />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Seleccionar Archivo</span>
                  {uploadedFile && <p className="text-[10px] text-emerald-600 mt-1 font-bold">{uploadedFile.name}</p>}
                </label>
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-[10px] font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors uppercase tracking-widest">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isSubmitting || !uploadedFile}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                  Subir Documento
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listado de Otrosíes */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Otrosíes Registrados ({convenioOtrosies.length})</h4>
          {convenioOtrosies.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic py-2">No hay otrosíes registrados para este convenio.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {convenioOtrosies.map(o => (
                <div key={o.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800">Otrosí No. {o.numero}</h5>
                      <div className="flex gap-3 text-[9px] font-bold text-slate-500 uppercase">
                        <span className="flex items-center gap-1"><Calendar size={10} /> {o.fechaFirma}</span>
                        <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={10} /> +{new Intl.NumberFormat('es-CO').format(o.valorAdicional)}</span>
                        <span className="flex items-center gap-1 text-amber-600"><Clock size={10} /> +{o.plazoAdicionalMeses} meses</span>
                        {o.nitContratista && <span className="flex items-center gap-1">NIT: {o.nitContratista}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.documentoUrl && (
                      <button 
                        onClick={() => downloadFileWithAutoRepair(o.documentoUrl!, o.documentoNombre || `Otrosí_${o.numero}.pdf`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Descargar Otrosí"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteOtrosie(o.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Listado de Documentos */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Documentos de Soporte ({convenioDocs.length})</h4>
          {convenioDocs.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic py-2">No hay documentos cargados para este convenio.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {convenioDocs.map(d => (
                <div key={d.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Upload size={16} />
                    </div>
                    <div>
                      <h5 className="text-[11px] font-bold text-slate-800 truncate max-w-[150px]">{d.titulo}</h5>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{d.tipo} • {new Date(d.fechaCreacion).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.versiones[0]?.url && (
                      <button 
                        onClick={() => downloadFileWithAutoRepair(d.versiones[0].url, d.versiones[0].nombreArchivo || `${d.titulo}.pdf`)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Descargar Documento"
                      >
                        <Download size={16} />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteDocument(d.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="mt-8 pt-8 border-t border-slate-100">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-xs mb-1">Trazabilidad Financiera</h5>
                <p className="text-sm text-slate-500">Gestione los CDP, RC y RP desde el Módulo Financiero en la vista del proyecto.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
