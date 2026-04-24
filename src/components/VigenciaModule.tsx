import React, { useState, useMemo } from 'react';
import { VigenciaDetailView } from './VigenciaDetailView';
import { VigenciaComparisonView } from './VigenciaComparisonView';
import { InvestmentDashboard } from './InvestmentDashboard';
import { SigfdDashboard } from './SigfdDashboard';
import { ConfirmationModal } from './ConfirmationModal';
import { ConvenioDocumentManager } from './ConvenioDocumentManager';
import { AIProviderSelector } from './AIProviderSelector';
import { LineaInversionDetailView } from './LineaInversionDetailView';
import { useProject } from '../store/ProjectContext';
import { Vigencia, LineaInversion, Project, Contract, Convenio, Acta } from '../types';
import { formatDateForInput } from '../lib/storage';
import { 
  Calendar, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  ChevronRight, 
  Settings, 
  Layers, 
  PieChart,
  FileText,
  Target,
  Zap,
  Edit2,
  Trash2,
  X,
  Save,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

import { Type } from '@google/genai';
import * as pdfjsLib from 'pdfjs-dist';
import { extractConvenioData } from '../services/geminiService';
import { uploadDocumentToStorage } from '../lib/storage';
import DocumentReader from './DocumentReader';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export const VigenciaModule: React.FC = () => {
  const { state, addVigencia, updateVigencia, deleteVigencia, addLineaInversion, addConvenio, updateConvenio, deleteConvenio, addDocument } = useProject();
  const [activeTab, setActiveTab] = useState<'vigencias' | 'lineas' | 'ejecucion' | 'convenios' | 'dashboard' | 'sigfd'>('vigencias');
  const [selectedVigencia, setSelectedVigencia] = useState<string>(state.vigencias[0]?.id || '');
  const [showAddVigencia, setShowAddVigencia] = useState(false);
  const [editingVigencia, setEditingVigencia] = useState<string | null>(null);
  const [editVigenciaData, setEditVigenciaData] = useState<Vigencia | null>(null);
  const [showAddLinea, setShowAddLinea] = useState(false);
  const [showAddConvenio, setShowAddConvenio] = useState(false);
  const [editingConvenio, setEditingConvenio] = useState<string | null>(null);
  const [editConvenioData, setEditConvenioData] = useState<Convenio | null>(null);
  const [isParsingEdit, setIsParsingEdit] = useState(false);
  const [parsingStepEdit, setParsingStepEdit] = useState('');
  const [editChanges, setEditChanges] = useState<{ field: string; old: any; new: any }[]>([]);
  const [showEditChanges, setShowEditChanges] = useState(false);
  const [expandedVigenciaId, setExpandedVigenciaId] = useState<string | null>(null);
  const [comparisonVigenciaIds, setComparisonVigenciaIds] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; file: File } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsingStep, setParsingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [pasteText, setPasteText] = useState('');
  const [editPasteText, setEditPasteText] = useState('');
  const [managingConvenioDocs, setManagingConvenioDocs] = useState<string | null>(null);
  const [newConvenio, setNewConvenio] = useState({ 
    numero: '', 
    nombre: '', 
    valorTotal: '', 
    valorAportadoFondo: '', 
    valorAportadoContrapartida: '', 
    objeto: '', 
    fechaInicio: '', 
    fechaFin: '', 
    partes: '', 
    cdp: '', 
    rp: '', 
    estado: 'Activo' as const,
    tipo: 'específico' as 'marco' | 'específico' | 'interadministrativo',
    plazoInicialMesesConvenio: 0,
    tiempoTotalEjecucionMeses: 0,
    actaInicioConvenio: '',
    fechaFinalizacionConvenio: '',
    afectacionPresupuestal: '',
    cdpConvenio: '',
    fechaCdpConvenio: '',
    rcConvenio: '',
    fechaRcConvenio: '',
    cdpObra: '',
    fechaCdpObra: '',
    rcObra: '',
    fechaRcObra: '',
    cdpInterventoria: '',
    fechaCdpInterventoria: '',
    rcInterventoria: '',
    fechaRcInterventoria: '',
    afectacionesPresupuestalesAdiciones: '',
    aporteMunicipioGobernacionObraInterventoria: 0,
    aporteFngrdObraInterventoria: 0,
    valorTotalProyecto: 0,
    personasBeneficiadas: 0,
    empleosGenerados: 0,
    estadoSNGRD: 'CONOCIMIENTO',
    situacionSNGRD: 'NORMAL',
    metadata: {}
  });

  const [newVigencia, setNewVigencia] = useState({ anio: '', presupuesto: '', descripcion: '' });
  const [newLinea, setNewLinea] = useState({ nombre: '', codigo: '', descripcion: '', color: 'indigo' });
  const [selectedLinea, setSelectedLinea] = useState<LineaInversion | null>(null);
  const [vigenciaToDelete, setVigenciaToDelete] = useState<string | null>(null);

  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<{ type: 'vigencia' | 'convenio'; data: any }>({ type: 'vigencia', data: null });

  const handleAddVigencia = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    const isDuplicate = state.vigencias.some(v => v.anio === newVigencia.anio);
    if (isDuplicate) {
      setDuplicateInfo({ type: 'vigencia', data: newVigencia });
      setShowDuplicateModal(true);
      return;
    }

    confirmAddVigencia(newVigencia);
  };

  const confirmAddVigencia = (data: typeof newVigencia) => {
    addVigencia({
      id: `VIG-${Date.now()}`,
      anio: data.anio,
      presupuestoAsignado: Number(data.presupuesto),
      estado: 'Abierta',
      descripcion: data.descripcion
    });
    setShowAddVigencia(false);
    setNewVigencia({ anio: '', presupuesto: '', descripcion: '' });
  };

  const startEditVigencia = (vigencia: Vigencia) => {
    setEditingVigencia(vigencia.id);
    setEditVigenciaData({ ...vigencia });
  };

  const startEditConvenio = (convenio: Convenio) => {
    setEditingConvenio(convenio.id);
    setEditConvenioData({ ...convenio });
    setEditChanges([]);
    setShowEditChanges(false);
  };

  const handleEditAIExtraction = async (text: string) => {
    if (!editConvenioData) return;
    setIsParsingEdit(true);
    setParsingStepEdit('Analizando con IA...');
    try {
      const extracted = await extractConvenioData(text);
      const newChanges: { field: string; old: any; new: any }[] = [];
      const updatedData = { ...editConvenioData };

      const compareAndUpdate = (field: string, newValue: any, isNumeric = false) => {
        const oldValue = (editConvenioData as any)[field];
        const val = isNumeric ? Number(newValue) : newValue;
        if (val !== undefined && val !== null && val !== oldValue) {
          newChanges.push({ field, old: oldValue, new: val });
          (updatedData as any)[field] = val;
        }
      };

      if (extracted.numeroConvenio) compareAndUpdate('numero', extracted.numeroConvenio);
      if (extracted.objetoConvenio) {
        compareAndUpdate('nombre', extracted.objetoConvenio);
        compareAndUpdate('objeto', extracted.objetoConvenio);
      }
      if (extracted.partesConvenio) compareAndUpdate('partes', extracted.partesConvenio);
      if (extracted.valorTotalProyecto) compareAndUpdate('valorTotal', extracted.valorTotalProyecto, true);
      if (extracted.aporteFngrdObraInterventoria) compareAndUpdate('valorAportadoFondo', extracted.aporteFngrdObraInterventoria, true);
      if (extracted.aporteMunicipioGobernacionObraInterventoria) compareAndUpdate('valorAportadoContrapartida', extracted.aporteMunicipioGobernacionObraInterventoria, true);
      if (extracted.actaInicioConvenio) compareAndUpdate('fechaInicio', extracted.actaInicioConvenio);
      if (extracted.fechaFinalizacionConvenio) compareAndUpdate('fechaFin', extracted.fechaFinalizacionConvenio);
      if (extracted.cdpConvenio) compareAndUpdate('cdp', extracted.cdpConvenio);
      if (extracted.rcConvenio) compareAndUpdate('rp', extracted.rcConvenio);

      setEditConvenioData(updatedData);
      setEditChanges(newChanges);
      setShowEditChanges(true);
      setParsingStepEdit('Análisis completado');
    } catch (error: any) {
      console.error('Error in AI extraction:', error);
      let errMsg = error?.message || 'Error en el análisis';
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error) errMsg = parsed.error;
      } catch (e) {
        // Not JSON, use as is
      }
      setParsingStepEdit(`Error: ${errMsg}`);
    } finally {
      setTimeout(() => setIsParsingEdit(false), 5000);
    }
  };

  const handleUpdateConvenio = (e: React.FormEvent) => {
    e.preventDefault();
    if (editConvenioData) {
      const updatedConvenio: Convenio = {
        ...editConvenioData,
        estadoSNGRD: editConvenioData.estadoSNGRD as any,
        situacionSNGRD: editConvenioData.situacionSNGRD as any
      };
      updateConvenio(updatedConvenio);
      setEditingConvenio(null);
      setEditConvenioData(null);
    }
  };

  const handleUpdateVigencia = (e: React.FormEvent) => {
    e.preventDefault();
    if (editVigenciaData) {
      updateVigencia(editVigenciaData);
      setEditingVigencia(null);
      setEditVigenciaData(null);
    }
  };

  const handleDeleteVigencia = (id: string) => {
    // window.confirm no funciona en el iframe, usamos eliminación directa o un estado
    deleteVigencia(id);
  };

  const handleAddLinea = (e: React.FormEvent) => {
    e.preventDefault();
    addLineaInversion({
      id: `LIN-${Date.now()}`,
      nombre: newLinea.nombre,
      codigo: newLinea.codigo,
      descripcion: newLinea.descripcion,
      color: newLinea.color as any
    });
    setShowAddLinea(false);
    setNewLinea({ nombre: '', codigo: '', descripcion: '', color: 'indigo' });
  };

  const handleAddConvenio = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    const isDuplicate = state.convenios.some(c => c.numero === newConvenio.numero);
    if (isDuplicate) {
      setDuplicateInfo({ type: 'convenio', data: newConvenio });
      setShowDuplicateModal(true);
      return;
    }

    confirmAddConvenio(newConvenio);
  };

  const confirmAddConvenio = async (data: typeof newConvenio) => {
    setIsSubmitting(true);
    try {
      const convenioId = `CON-${Date.now()}`;
      const convenioData: Convenio = {
        id: convenioId,
        ...data,
        valorTotal: Number(data.valorTotal) || data.valorTotalProyecto,
        valorAportadoFondo: Number(data.valorAportadoFondo) || data.aporteFngrdObraInterventoria,
        valorAportadoContrapartida: Number(data.valorAportadoContrapartida) || data.aporteMunicipioGobernacionObraInterventoria,
        estado: data.estado as any,
        estadoSNGRD: data.estadoSNGRD as any,
        situacionSNGRD: data.situacionSNGRD as any
      };
      
      addConvenio(convenioData);

      // If a file was uploaded, add it to the repository
      if (uploadedFile) {
        const folderPath = `Convenios/${convenioData.numero}`;
        const publicUrl = await uploadDocumentToStorage(uploadedFile.file, folderPath);

        addDocument({
          id: `DOC-${Date.now()}-CONV`,
          convenioId: convenioData.id,
          titulo: `Convenio ${convenioData.numero} - ${convenioData.nombre}`,
          tipo: 'Convenio',
          descripcion: `Documento original del convenio ${convenioData.numero}`,
          fechaCreacion: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
          versiones: [{
            id: `VER-${Date.now()}-CONV`,
            version: 1,
            fecha: new Date().toISOString(),
            url: publicUrl,
            nombreArchivo: uploadedFile.name,
            subidoPor: 'Sistema (Módulo Vigencias)',
            accion: 'Subida',
            estado: 'Borrador'
          }],
          tags: ['Convenio', convenioData.numero],
          folderPath,
          estado: 'Borrador'
        });

        // Also link to any existing associated projects
        const associatedProjects = state.proyectos.filter(p => p.matrix?.numeroConvenio === convenioData.numero || p.convenioId === convenioData.id);
        
        associatedProjects.forEach(project => {
          addDocument({
            id: `DOC-${Date.now()}-${project.id}`,
            projectId: project.id,
            convenioId: convenioData.id,
            titulo: `Convenio ${convenioData.numero} - ${convenioData.nombre}`,
            tipo: 'Convenio',
            descripcion: `Documento original del convenio ${convenioData.numero}`,
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            versiones: [{
              id: `VER-${Date.now()}-${project.id}`,
              version: 1,
              fecha: new Date().toISOString(),
              url: publicUrl,
              nombreArchivo: uploadedFile.name,
              subidoPor: 'Sistema (Módulo Vigencias)',
              accion: 'Subida',
              estado: 'Borrador'
            }],
            tags: ['Convenio', convenioData.numero],
            folderPath: `${project.nombre}/Convenios`,
            estado: 'Borrador'
          });
        });
      }

      setShowAddConvenio(false);
      setUploadedFile(null);
      setIsUploading(false);
      setNewConvenio({ 
        numero: '', 
        nombre: '', 
        valorTotal: '', 
        valorAportadoFondo: '', 
        valorAportadoContrapartida: '', 
        objeto: '', 
        fechaInicio: '', 
        fechaFin: '', 
        partes: '', 
        cdp: '', 
        rp: '', 
        estado: 'Activo' as const,
        tipo: 'específico' as 'marco' | 'específico' | 'interadministrativo',
        plazoInicialMesesConvenio: 0,
        tiempoTotalEjecucionMeses: 0,
        actaInicioConvenio: '',
        fechaFinalizacionConvenio: '',
        afectacionPresupuestal: '',
        cdpConvenio: '',
        fechaCdpConvenio: '',
        rcConvenio: '',
        fechaRcConvenio: '',
        cdpObra: '',
        fechaCdpObra: '',
        rcObra: '',
        fechaRcObra: '',
        cdpInterventoria: '',
        fechaCdpInterventoria: '',
        rcInterventoria: '',
        fechaRcInterventoria: '',
        afectacionesPresupuestalesAdiciones: '',
        aporteMunicipioGobernacionObraInterventoria: 0,
        aporteFngrdObraInterventoria: 0,
        valorTotalProyecto: 0,
        personasBeneficiadas: 0,
        empleosGenerados: 0,
        estadoSNGRD: 'CONOCIMIENTO',
        situacionSNGRD: 'NORMAL',
        metadata: {}
      });
    } catch (error) {
      console.error("Error uploading convenio document:", error);
      alert("Hubo un error al guardar el documento del convenio.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!pasteText || pasteText.length < 50) return;
    
    setIsParsing(true);
    setParsingStep('Analizando texto con IA...');
    setProgress(50);
    try {
      const extractedData = await extractConvenioData(pasteText);
      setNewConvenio(prev => {
        const merged = { ...prev };
        
        // Map extracted fields to our state, ensuring we don't set nulls
        const mapField = (key: keyof typeof prev, extractedValue: any) => {
          if (extractedValue !== null && extractedValue !== undefined) {
            if (typeof prev[key] === 'number') {
              (merged as any)[key] = Number(extractedValue) || 0;
            } else {
              (merged as any)[key] = String(extractedValue);
            }
          }
        };

        mapField('numero', extractedData.numeroConvenio);
        mapField('nombre', extractedData.objetoConvenio);
        mapField('objeto', extractedData.objetoConvenio);
        mapField('partes', extractedData.partesConvenio);
        mapField('valorTotal', extractedData.valorTotalProyecto);
        mapField('valorAportadoFondo', extractedData.aporteFngrdObraInterventoria);
        mapField('valorAportadoContrapartida', extractedData.aporteMunicipioGobernacionObraInterventoria);
        mapField('fechaInicio', extractedData.actaInicioConvenio);
        mapField('fechaFin', extractedData.fechaFinalizacionConvenio);
        mapField('cdp', extractedData.cdpConvenio);
        mapField('rp', extractedData.rcConvenio);
        
        // Map any other fields that match exactly, avoiding nulls
        Object.entries(extractedData).forEach(([key, value]) => {
          if (key in merged && value !== null && value !== undefined) {
            if (typeof (merged as any)[key] === 'number') {
              (merged as any)[key] = Number(value) || 0;
            } else {
              (merged as any)[key] = String(value);
            }
          }
        });

        return merged;
      });
      setProgress(100);
      setParsingStep('Análisis completado');
    } catch (error: any) {
      console.error('Error extracting from text:', error);
      let errMsg = error?.message || 'Error en el análisis';
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error) errMsg = parsed.error;
      } catch (e) {
        // Not JSON, use as is
      }
      setParsingStep(`Error: ${errMsg}`);
    } finally {
      setTimeout(() => setIsParsing(false), 5000); // Wait longer so user can read the error
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setIsParsing(true);
    setParsingStep('Subiendo documento...');
    setProgress(20);

    try {
      setUploadedFile({ name: file.name, file });
      
      setParsingStep('Extrayendo texto del PDF...');
      setProgress(40);
      
      // We need a way to extract text from PDF. 
      // Since DocumentReader has extractTextFromPDF, we can use a similar approach or just pass the file to a service.
      // For now, let's assume we have a helper to get text from PDF.
      const reader = new FileReader();
      const textPromise = new Promise<string>((resolve) => {
        reader.onload = async () => {
          const typedarray = new Uint8Array(reader.result as ArrayBuffer);
          const pdf = await pdfjsLib.getDocument(typedarray).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
          resolve(fullText);
        };
        reader.readAsArrayBuffer(file);
      });

      const text = await textPromise;
      
      setParsingStep('Analizando con IA SRR...');
      setProgress(70);

      const extractedData = await extractConvenioData(text);
      setProgress(90);

      setNewConvenio(prev => {
        const merged = { ...prev };
        
        // Map extracted fields to our state, ensuring we don't set nulls
        const mapField = (key: keyof typeof prev, extractedValue: any) => {
          if (extractedValue !== null && extractedValue !== undefined) {
            if (typeof prev[key] === 'number') {
              (merged as any)[key] = Number(extractedValue) || 0;
            } else {
              (merged as any)[key] = String(extractedValue);
            }
          }
        };

        mapField('numero', extractedData.numeroConvenio);
        mapField('nombre', extractedData.objetoConvenio);
        mapField('objeto', extractedData.objetoConvenio);
        mapField('partes', extractedData.partesConvenio);
        mapField('valorTotal', extractedData.valorTotalProyecto);
        mapField('valorAportadoFondo', extractedData.aporteFngrdObraInterventoria);
        mapField('valorAportadoContrapartida', extractedData.aporteMunicipioGobernacionObraInterventoria);
        mapField('fechaInicio', extractedData.actaInicioConvenio);
        mapField('fechaFin', extractedData.fechaFinalizacionConvenio);
        mapField('cdp', extractedData.cdpConvenio);
        mapField('rp', extractedData.rcConvenio);
        
        // Map any other fields that match exactly, avoiding nulls
        Object.entries(extractedData).forEach(([key, value]) => {
          if (key in merged && value !== null && value !== undefined) {
            if (typeof (merged as any)[key] === 'number') {
              (merged as any)[key] = Number(value) || 0;
            } else {
              (merged as any)[key] = String(value);
            }
          }
        });

        return merged;
      });
      setProgress(100);
      setParsingStep('Análisis completado con éxito');
    } catch (error: any) {
      console.error('Error extracting data from PDF:', error);
      let errMsg = error?.message || 'Error al analizar el documento';
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed.error) errMsg = parsed.error;
      } catch (e) {
        // Not JSON, use as is
      }
      setParsingStep(`Error: ${errMsg}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => {
        setIsParsing(false);
        setProgress(0);
        setParsingStep('');
      }, 5000);
    }
  };

  const vigenciaStats = useMemo(() => {
    if (!selectedVigencia) return null;
    const vigencia = state.vigencias.find(v => v.id === selectedVigencia);
    if (!vigencia) return null;

    const projects = state.proyectos.filter(p => p.vigencia === vigencia.anio);
    const budgets = state.presupuestos.filter(p => p.vigencia === vigencia.anio);
    
    const totalInvestment = budgets.reduce((sum, b) => sum + b.valorTotal, 0);
    const totalExecuted = budgets.reduce((sum, b) => sum + b.pagosRealizados, 0);
    const avgPhysical = projects.reduce((sum, p) => sum + p.avanceFisico, 0) / (projects.length || 1);
    
    return {
      vigencia,
      projects,
      totalInvestment,
      totalExecuted,
      avgPhysical,
      executionPct: totalInvestment > 0 ? (totalExecuted / totalInvestment) * 100 : 0
    };
  }, [selectedVigencia, state]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gestión de Vigencias e Inversión</h1>
          <p className="text-slate-500 mt-1">Configuración y seguimiento de presupuestos anuales y líneas estratégicas.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('vigencias')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'vigencias' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Vigencias
          </button>
          <button 
            onClick={() => setActiveTab('lineas')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'lineas' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Líneas de Inversión
          </button>
          <button 
            onClick={() => setActiveTab('ejecucion')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'ejecucion' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Ejecución Anual
          </button>
          <button 
            onClick={() => setActiveTab('convenios')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'convenios' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Convenios
          </button>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Dashboard de Inversión
          </button>
          <button 
            onClick={() => setActiveTab('sigfd')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'sigfd' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Indicadores SIGF-D
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && <InvestmentDashboard />}
      {activeTab === 'sigfd' && <SigfdDashboard />}

      {activeTab === 'vigencias' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={20} />
                  Vigencias Fiscales Registradas
                </h3>
                <button 
                  onClick={() => setShowAddVigencia(true)}
                  className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={18} />
                </button>
              </div>
              
              {showAddVigencia && (
                <div className="p-6 bg-slate-50 border-b border-slate-100 animate-in slide-in-from-top duration-300">
                  <form onSubmit={handleAddVigencia} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label>
                        <input 
                          required
                          type="text" 
                          placeholder="Ej: 2025"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={newVigencia.anio ?? ''}
                          onChange={e => setNewVigencia({...newVigencia, anio: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto</label>
                        <input 
                          required
                          type="number" 
                          placeholder="Valor total"
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                          value={newVigencia.presupuesto ?? ''}
                          onChange={e => setNewVigencia({...newVigencia, presupuesto: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                      <input 
                        type="text" 
                        placeholder="Ej: Vigencia Fiscal 2025"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={newVigencia.descripcion ?? ''}
                        onChange={e => setNewVigencia({...newVigencia, descripcion: e.target.value})}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => setShowAddVigencia(false)}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                      >
                        Guardar Vigencia
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {comparisonVigenciaIds.length > 0 && (
                <VigenciaComparisonView 
                  vigencias={state.vigencias.filter(v => comparisonVigenciaIds.includes(v.id))}
                  state={state}
                />
              )}
              <div className="divide-y divide-slate-50">
                {state.vigencias.map(v => (
                  <div key={v.id} className={`p-6 transition-colors ${expandedVigenciaId === v.id ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}>
                    {editingVigencia === v.id && editVigenciaData ? (
                      <form onSubmit={handleUpdateVigencia} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Año</label>
                            <input 
                              required
                              type="text" 
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={editVigenciaData.anio ?? ''}
                              onChange={e => setEditVigenciaData({...editVigenciaData, anio: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Presupuesto</label>
                            <input 
                              required
                              type="number" 
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={editVigenciaData.presupuestoAsignado ?? ''}
                              onChange={e => setEditVigenciaData({...editVigenciaData, presupuestoAsignado: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                            <input 
                              type="text" 
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={editVigenciaData.descripcion || ''}
                              onChange={e => setEditVigenciaData({...editVigenciaData, descripcion: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                            <select
                              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={editVigenciaData.estado ?? ''}
                              onChange={e => setEditVigenciaData({...editVigenciaData, estado: e.target.value as 'Abierta' | 'Cerrada'})}
                            >
                              <option value="Abierta">Abierta</option>
                              <option value="Cerrada">Cerrada</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button"
                            onClick={() => {
                              setEditingVigencia(null);
                              setEditVigenciaData(null);
                            }}
                            className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="submit"
                            className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                          >
                            <Save size={16} />
                            Guardar
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setExpandedVigenciaId(expandedVigenciaId === v.id ? null : v.id)}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${v.estado === 'Abierta' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                              {v.anio}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900">{v.descripcion || `Vigencia ${v.anio}`}</h4>
                              <p className="text-xs text-slate-500">Presupuesto Asignado: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v.presupuestoAsignado)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={comparisonVigenciaIds.includes(v.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (comparisonVigenciaIds.length < 4) setComparisonVigenciaIds([...comparisonVigenciaIds, v.id]);
                                } else {
                                  setComparisonVigenciaIds(comparisonVigenciaIds.filter(id => id !== v.id));
                                }
                              }}
                              className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                            />
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${v.estado === 'Abierta' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {v.estado}
                            </span>
                            <div className="flex items-center gap-1">
                              <button onClick={() => startEditVigencia(v)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Editar"><Edit2 size={18} /></button>
                              <button onClick={() => setVigenciaToDelete(v.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Eliminar"><Trash2 size={18} /></button>
                            </div>
                          </div>
                        </div>
                        {expandedVigenciaId === v.id && (
                          <VigenciaDetailView 
                            vigencia={v} 
                            projects={state.proyectos} 
                            documents={state.documentos} 
                            contracts={state.contratos}
                            otrosies={state.otrosies}
                            actas={state.actas}
                            risks={state.riesgos}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <TrendingUp size={120} />
              </div>
              <h3 className="text-xl font-bold mb-2 relative z-10">Resumen Consolidado</h3>
              <p className="text-indigo-200 text-sm mb-8 relative z-10">Total acumulado de todas las vigencias registradas.</p>
              
              <div className="space-y-6 relative z-10">
                <div>
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Inversión Total</p>
                  <p className="text-3xl font-black">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(state.vigencias.reduce((sum, v) => sum + v.presupuestoAsignado, 0))}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-1">Vigencias Activas</p>
                  <p className="text-3xl font-black">{state.vigencias.filter(v => v.estado === 'Abierta').length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lineas' && (
        selectedLinea ? (
          <LineaInversionDetailView 
            linea={selectedLinea} 
            onClose={() => setSelectedLinea(null)} 
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showAddLinea && (
              <div className="bg-white rounded-3xl border border-indigo-200 p-6 shadow-lg animate-in zoom-in duration-300">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Nueva Línea de Inversión</h3>
                <form onSubmit={handleAddLinea} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newLinea.nombre ?? ''}
                      onChange={e => setNewLinea({...newLinea, nombre: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Código</label>
                    <input 
                      required
                      type="text" 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newLinea.codigo ?? ''}
                      onChange={e => setNewLinea({...newLinea, codigo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción</label>
                    <textarea 
                      className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      value={newLinea.descripcion ?? ''}
                      onChange={e => setNewLinea({...newLinea, descripcion: e.target.value})}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button 
                      type="button"
                      onClick={() => setShowAddLinea(false)}
                      className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
                    >
                      Guardar Línea
                    </button>
                  </div>
                </form>
              </div>
            )}
            {state.lineasInversion.map(l => (
              <div 
                key={l.id} 
                className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all group cursor-pointer"
                onClick={() => setSelectedLinea(l)}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`p-4 rounded-2xl bg-${l.color || 'indigo'}-50 text-${l.color || 'indigo'}-600 group-hover:scale-110 transition-transform`}>
                    <Layers size={24} />
                  </div>
                  <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded uppercase tracking-widest">{l.codigo}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{l.nombre}</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed">{l.descripcion || 'Sin descripción detallada.'}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase">Proyectos: {state.proyectos.filter(p => p.linea === l.nombre).length}</span>
                  <button className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-1">
                    Configurar <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
            <button 
              onClick={() => setShowAddLinea(true)}
              className="bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-300 hover:text-indigo-600 transition-all group"
            >
              <Plus size={32} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Nueva Línea</span>
            </button>
          </div>
        )
      )}

      {activeTab === 'convenios' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-indigo-600" size={20} />
              Convenios Registrados
            </h3>
            <button 
              onClick={() => setShowAddConvenio(true)}
              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          {showAddConvenio && (
            <div className="p-6 bg-slate-50 border-b border-slate-100 max-h-[80vh] overflow-y-auto">
              <form onSubmit={handleAddConvenio} className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-2">Información General del Convenio</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° Convenio</label>
                      <input required type="text" placeholder="Número" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.numero ?? ''} onChange={e => setNewConvenio({...newConvenio, numero: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre / Título</label>
                      <input required type="text" placeholder="Nombre" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.nombre ?? ''} onChange={e => setNewConvenio({...newConvenio, nombre: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tipo de Convenio</label>
                      <select className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.tipo ?? ''} onChange={e => setNewConvenio({...newConvenio, tipo: e.target.value as any})}>
                        <option value="específico">Específico</option>
                        <option value="marco">Marco</option>
                        <option value="interadministrativo">Interadministrativo</option>
                      </select>
                    </div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Partes del Convenio</label>
                      <input required type="text" placeholder="Ej: UNGRD - Gobernación de..." className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.partes ?? ''} onChange={e => setNewConvenio({...newConvenio, partes: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Objeto del Convenio</label>
                      <textarea required placeholder="Objeto" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.objeto ?? ''} onChange={e => setNewConvenio({...newConvenio, objeto: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Plazo Inicial (Meses)</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.plazoInicialMesesConvenio ?? ''} onChange={e => setNewConvenio({...newConvenio, plazoInicialMesesConvenio: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Tiempo Total Ejecución (Meses)</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.tiempoTotalEjecucionMeses ?? ''} onChange={e => setNewConvenio({...newConvenio, tiempoTotalEjecucionMeses: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Acta de Inicio (Fecha)</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.actaInicioConvenio)} onChange={e => setNewConvenio({...newConvenio, actaInicioConvenio: e.target.value, fechaInicio: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha Finalización</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaFinalizacionConvenio)} onChange={e => setNewConvenio({...newConvenio, fechaFinalizacionConvenio: e.target.value, fechaFin: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado</label>
                      <select className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.estado ?? ''} onChange={e => setNewConvenio({...newConvenio, estado: e.target.value as any})}>
                        <option value="Activo">Activo</option>
                        <option value="En liquidación">En liquidación</option>
                        <option value="Liquidado">Liquidado</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-2">Afectación Presupuestal y Financiera</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1 md:col-span-2 lg:col-span-3">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Afectación Presupuestal</label>
                      <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.afectacionPresupuestal ?? ''} onChange={e => setNewConvenio({...newConvenio, afectacionPresupuestal: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° CDP Convenio</label>
                      <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.cdpConvenio ?? ''} onChange={e => setNewConvenio({...newConvenio, cdpConvenio: e.target.value, cdp: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha CDP Convenio</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaCdpConvenio)} onChange={e => setNewConvenio({...newConvenio, fechaCdpConvenio: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° RC Convenio</label>
                      <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.rcConvenio ?? ''} onChange={e => setNewConvenio({...newConvenio, rcConvenio: e.target.value, rp: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha RC Convenio</label>
                      <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaRcConvenio)} onChange={e => setNewConvenio({...newConvenio, fechaRcConvenio: e.target.value})} />
                    </div>
                    <div className="space-y-1 md:col-span-2 lg:col-span-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Afectaciones Presupuestales Adiciones</label>
                      <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.afectacionesPresupuestalesAdiciones ?? ''} onChange={e => setNewConvenio({...newConvenio, afectacionesPresupuestalesAdiciones: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Aporte Municipio/Gobernación</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.aporteMunicipioGobernacionObraInterventoria ?? ''} onChange={e => setNewConvenio({...newConvenio, aporteMunicipioGobernacionObraInterventoria: Number(e.target.value), valorAportadoContrapartida: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Aporte FNGRD</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.aporteFngrdObraInterventoria ?? ''} onChange={e => setNewConvenio({...newConvenio, aporteFngrdObraInterventoria: Number(e.target.value), valorAportadoFondo: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Total Proyecto</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.valorTotalProyecto ?? ''} onChange={e => setNewConvenio({...newConvenio, valorTotalProyecto: Number(e.target.value), valorTotal: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Personas Beneficiadas</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.personasBeneficiadas ?? ''} onChange={e => setNewConvenio({...newConvenio, personasBeneficiadas: Number(e.target.value)})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Empleos Generados</label>
                      <input type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.empleosGenerados ?? ''} onChange={e => setNewConvenio({...newConvenio, empleosGenerados: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-2">Información de Obra</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° CDP Obra</label>
                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.cdpObra ?? ''} onChange={e => setNewConvenio({...newConvenio, cdpObra: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha CDP Obra</label>
                        <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaCdpObra)} onChange={e => setNewConvenio({...newConvenio, fechaCdpObra: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° RC Obra</label>
                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.rcObra ?? ''} onChange={e => setNewConvenio({...newConvenio, rcObra: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha RC Obra</label>
                        <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaRcObra)} onChange={e => setNewConvenio({...newConvenio, fechaRcObra: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-2">Información de Interventoría</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° CDP Interv.</label>
                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.cdpInterventoria ?? ''} onChange={e => setNewConvenio({...newConvenio, cdpInterventoria: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha CDP Interv.</label>
                        <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaCdpInterventoria)} onChange={e => setNewConvenio({...newConvenio, fechaCdpInterventoria: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">N° RC Interv.</label>
                        <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newConvenio.rcInterventoria ?? ''} onChange={e => setNewConvenio({...newConvenio, rcInterventoria: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha RC Interv.</label>
                        <input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={formatDateForInput(newConvenio.fechaRcInterventoria)} onChange={e => setNewConvenio({...newConvenio, fechaRcInterventoria: e.target.value})} />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-slate-200 pt-4">
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motor de IA para Extracción:</label>
                    <AIProviderSelector />
                  </div>
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/30 transition-all">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploading ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                          <span className="text-sm text-indigo-600 font-medium">{parsingStep}</span>
                        </div>
                      ) : uploadedFile ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <FileText size={20} />
                          <span>{uploadedFile.name} (Cargado)</span>
                        </div>
                      ) : (
                        <>
                          <Upload size={24} className="text-slate-400 mb-2" />
                          <p className="text-sm text-slate-500 font-semibold">Cargar PDF del Convenio (Autocompletado IA)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="application/pdf" onChange={handlePdfUpload} disabled={isUploading} />
                  </label>
                  
                  <div className="mt-4">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">O pega el texto del convenio aquí:</label>
                    <div className="relative">
                      <textarea
                        className="w-full h-32 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none"
                        placeholder="Pega aquí el texto del convenio para extraer los campos automáticamente..."
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                      />
                      {isParsing && (
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center animate-in fade-in duration-300">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                          <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{parsingStep}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        type="button"
                        onClick={handleTextAnalysis}
                        disabled={isParsing || pasteText.length < 50}
                        className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isParsing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                        Analizar y Extraer Datos
                      </button>
                    </div>
                  </div>

                  {isParsing && (
                    <div className="mt-4 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => { setShowAddConvenio(false); setUploadedFile(null); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {isSubmitting ? 'Guardando...' : 'Guardar Convenio'}
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="divide-y divide-slate-50">
            {state.convenios.map(c => (
              <div key={c.id} className="p-6 hover:bg-slate-50 transition-colors">
                {editingConvenio === c.id && editConvenioData ? (
                  <div className="space-y-6">
                    {/* AI Extraction for Edit */}
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-indigo-600 text-white rounded-lg">
                          <Upload size={16} />
                        </div>
                        <div>
                          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Actualización Inteligente (IA)</h3>
                          <p className="text-[10px] text-slate-500">Pega texto para actualizar campos automáticamente.</p>
                        </div>
                      </div>
                      <div className="mb-4">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2">Motor de IA:</label>
                        <AIProviderSelector />
                      </div>
                      <div className="relative">
                        <textarea
                          className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium resize-none bg-white"
                          placeholder="Pega aquí el texto del convenio..."
                          value={editPasteText}
                          onChange={(e) => setEditPasteText(e.target.value)}
                        />
                        {isParsingEdit && (
                          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center">
                            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-1" />
                            <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{parsingStepEdit}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleEditAIExtraction(editPasteText)}
                          disabled={isParsingEdit || editPasteText.length < 50}
                          className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isParsingEdit ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Analizar y Actualizar Campos
                        </button>
                      </div>

                      {showEditChanges && editChanges.length > 0 && (
                        <div className="mt-3 p-3 bg-white rounded-xl border border-indigo-100">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-1.5">
                              <AlertCircle size={12} />
                              Cambios detectados ({editChanges.length})
                            </h4>
                            <button onClick={() => setShowEditChanges(false)} className="text-[9px] font-bold text-slate-400 uppercase">Ocultar</button>
                          </div>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {editChanges.map((change, i) => (
                              <div key={i} className="text-[10px] p-1.5 bg-slate-50 rounded-lg border border-slate-100">
                                <span className="font-bold text-slate-700 uppercase mr-1.5">{change.field}:</span>
                                <span className="text-rose-500 line-through mr-1.5">{String(change.old || 'Vacío')}</span>
                                <span className="text-emerald-600 font-bold">→ {String(change.new)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <form onSubmit={handleUpdateConvenio} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Número de Convenio</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.numero ?? ''} onChange={e => setEditConvenioData({...editConvenioData, numero: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nombre del Convenio</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.nombre ?? ''} onChange={e => setEditConvenioData({...editConvenioData, nombre: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Valor Total</label>
                          <input required type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.valorTotal ?? ''} onChange={e => setEditConvenioData({...editConvenioData, valorTotal: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Aporte Fondo</label>
                          <input required type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.valorAportadoFondo ?? ''} onChange={e => setEditConvenioData({...editConvenioData, valorAportadoFondo: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Aporte Contrapartida</label>
                          <input required type="number" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.valorAportadoContrapartida ?? ''} onChange={e => setEditConvenioData({...editConvenioData, valorAportadoContrapartida: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Partes</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.partes ?? ''} onChange={e => setEditConvenioData({...editConvenioData, partes: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">CDP</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.cdp ?? ''} onChange={e => setEditConvenioData({...editConvenioData, cdp: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">RP</label>
                          <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={editConvenioData.rp ?? ''} onChange={e => setEditConvenioData({...editConvenioData, rp: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Estado</label>
                          <select className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white" value={editConvenioData.estado ?? ''} onChange={e => setEditConvenioData({...editConvenioData, estado: e.target.value as any})}>
                            <option value="Activo">Activo</option>
                            <option value="En liquidación">En liquidación</option>
                            <option value="Liquidado">Liquidado</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha Inicio</label>
                          <input required type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={formatDateForInput(editConvenioData.fechaInicio)} onChange={e => setEditConvenioData({...editConvenioData, fechaInicio: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Fecha Fin</label>
                          <input required type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={formatDateForInput(editConvenioData.fechaFin)} onChange={e => setEditConvenioData({...editConvenioData, fechaFin: e.target.value})} />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Objeto</label>
                          <textarea required rows={3} className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" value={editConvenioData.objeto ?? ''} onChange={e => setEditConvenioData({...editConvenioData, objeto: e.target.value})} />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditingConvenio(null); setEditConvenioData(null); }} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
                        <button type="submit" className="px-6 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                          <Save size={16} /> 
                          Guardar Cambios
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-900">{c.numero} - {c.nombre}</h4>
                      <p className="text-xs text-slate-500 mb-1">{c.objeto}</p>
                      <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <span>Fondo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.valorAportadoFondo)}</span>
                        <span>Contrapartida: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.valorAportadoContrapartida)}</span>
                        <span className="text-indigo-600">Total: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(c.valorTotal)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' :
                        c.estado === 'En liquidación' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {c.estado}
                      </span>
                      <button 
                        onClick={() => setManagingConvenioDocs(managingConvenioDocs === c.id ? null : c.id)} 
                        className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                          managingConvenioDocs === c.id 
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                        }`}
                        title="Gestionar Otrosíes y Documentos"
                      >
                        <FileText size={18} />
                        {managingConvenioDocs === c.id && <span className="text-[10px] font-bold uppercase tracking-widest">Cerrar</span>}
                      </button>
                      <button onClick={() => startEditConvenio(c)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={18} /></button>
                      <button onClick={() => deleteConvenio(c.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={18} /></button>
                    </div>
                  </div>
                )}
                {managingConvenioDocs === c.id && <ConvenioDocumentManager convenio={c} />}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ejecucion' && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <span className="text-sm font-bold text-slate-500 uppercase ml-2">Seleccionar Vigencia:</span>
            <select 
              value={selectedVigencia}
              onChange={(e) => setSelectedVigencia(e.target.value)}
              className="bg-slate-50 border-none rounded-xl px-4 py-2 font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {state.vigencias.map(v => (
                <option key={v.id} value={v.id}>{v.anio} - {v.estado}</option>
              ))}
            </select>
          </div>

          {vigenciaStats && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Inversión Programada</p>
                    <p className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(vigenciaStats.totalInvestment)}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-emerald-600">
                      <TrendingUp size={14} />
                      <span>{vigenciaStats.projects.length} Proyectos</span>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ejecución Financiera</p>
                    <p className="text-2xl font-black text-slate-800">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(vigenciaStats.totalExecuted)}</p>
                    <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500" style={{ width: `${vigenciaStats.executionPct}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Avance Físico Promedio</p>
                    <p className="text-2xl font-black text-slate-800">{vigenciaStats.avgPhysical.toFixed(1)}%</p>
                    <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600" style={{ width: `${vigenciaStats.avgPhysical}%` }}></div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <FileText className="text-indigo-600" size={20} />
                      Detalle de Ejecución por Proyecto
                    </h3>
                    <button className="text-xs font-bold text-indigo-600 hover:underline">Exportar Informe</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="p-6">Proyecto</th>
                          <th className="p-6">Línea</th>
                          <th className="p-6">Presupuesto</th>
                          <th className="p-6">Ejecutado</th>
                          <th className="p-6">Avance</th>
                          <th className="p-6 text-right">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {vigenciaStats.projects.map(p => {
                          const budget = state.presupuestos.find(b => b.projectId === p.id);
                          return (
                            <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-6">
                                <p className="font-bold text-slate-900 text-sm">{p.nombre}</p>
                                <p className="text-[10px] text-slate-400">{p.id}</p>
                              </td>
                              <td className="p-6">
                                <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600 uppercase">{p.linea}</span>
                              </td>
                              <td className="p-6 font-bold text-slate-700 text-sm">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(budget?.valorTotal || 0)}</td>
                              <td className="p-6 font-bold text-emerald-600 text-sm">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(budget?.pagosRealizados || 0)}</td>
                              <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-600" style={{ width: `${p.avanceFisico}%` }}></div>
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{p.avanceFisico}%</span>
                                </div>
                              </td>
                              <td className="p-6 text-right">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                  p.estado === 'En ejecución' ? 'bg-indigo-100 text-indigo-700' :
                                  p.estado === 'En seguimiento' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {p.estado}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <PieChart className="text-indigo-600" size={18} />
                    Inversión por Línea
                  </h3>
                  <div className="space-y-4">
                    {state.lineasInversion.map(l => {
                      const lineProjects = vigenciaStats.projects.filter(p => p.linea === l.nombre);
                      const lineInvestment = lineProjects.reduce((sum, p) => {
                        const b = state.presupuestos.find(budget => budget.projectId === p.id);
                        return sum + (b?.valorTotal || 0);
                      }, 0);
                      const pct = vigenciaStats.totalInvestment > 0 ? (lineInvestment / vigenciaStats.totalInvestment) * 100 : 0;
                      
                      return (
                        <div key={l.id}>
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase mb-1">
                            <span>{l.nombre}</span>
                            <span>{pct.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                            <div className={`h-full bg-${l.color || 'indigo'}-500`} style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                  <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
                    <Zap className="text-indigo-600" size={18} />
                    Eficiencia de Vigencia
                  </h3>
                  <div className="text-center py-4">
                    <span className="text-5xl font-black text-indigo-600">{(vigenciaStats.avgPhysical / (vigenciaStats.executionPct || 1)).toFixed(2)}</span>
                    <p className="text-xs font-bold text-indigo-400 uppercase mt-2">Índice de Rendimiento</p>
                  </div>
                  <p className="text-[10px] text-indigo-700 text-center leading-relaxed">
                    Relación entre el avance físico promedio y la ejecución presupuestal de la vigencia {vigenciaStats.vigencia.anio}.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={() => {
          if (duplicateInfo.type === 'vigencia') {
            confirmAddVigencia(duplicateInfo.data);
          } else if (duplicateInfo.type === 'convenio') {
            confirmAddConvenio(duplicateInfo.data);
          }
        }}
        title="Detección de Duplicado"
        message={`Ya existe ${duplicateInfo.type === 'vigencia' ? 'una vigencia' : 'un convenio'} con este ${duplicateInfo.type === 'vigencia' ? 'año' : 'número'}. ¿Deseas crearlo de todas formas?`}
        confirmLabel="Sí, crear duplicado"
        cancelLabel="No, cancelar"
      />

      {/* Modal Eliminar Vigencia */}
      {vigenciaToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="text-xl font-bold">Eliminar Vigencia</h3>
              </div>
              <button onClick={() => setVigenciaToDelete(null)} className="text-rose-200 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                ¿Está seguro de eliminar esta vigencia? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setVigenciaToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    handleDeleteVigencia(vigenciaToDelete);
                    setVigenciaToDelete(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
