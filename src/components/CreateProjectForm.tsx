import React, { useState, useMemo } from 'react';
import { FileText, Upload, Loader2, Save, Calendar, Layers, Users, Star, AlertCircle, Clipboard, CheckCircle2, FileSearch, Activity, X } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { Project, ProjectMatrix } from '../types';
import { useProject } from '../store/ProjectContext';
import { getPrioritizedRisks, getMitigationGaps } from '../services/riskService';
import DocumentReader from './DocumentReader';
import { MatrixFormFields } from './MatrixFormFields';
import { ProfessionalCard } from './ProfessionalCard';
import { ConfirmationModal } from './ConfirmationModal';
import { uploadDocumentToStorage } from '../lib/storage';
import { aiProviderService } from '../services/aiProviderService';
import { AIProviderSelector } from './AIProviderSelector';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

import { showAlert } from '../utils/alert';

interface CreateProjectFormProps {
  onSave: (project: Project) => void;
  onCancel?: () => void;
}

export const CreateProjectForm: React.FC<CreateProjectFormProps> = ({ onSave, onCancel }) => {
  const { state, addDocument } = useProject();
  const [project, setProject] = useState<Partial<Project>>({
    nombre: '',
    departamento: '',
    municipio: '',
    linea: '',
    vigencia: '',
    tipoObra: '',
    estado: 'Banco de proyectos',
    avanceFisico: 0,
    avanceProgramado: 0,
    avanceFinanciero: 0,
    fechaInicio: '',
    fechaFin: '',
    justificacion: '',
    objetivoGeneral: '',
    objetivosEspecificos: [],
    alcance: '',
    beneficiarios: '',
    presupuestoDetallado: [],
    actividadesPrincipales: [],
    convenioId: '',
    fases: [],
    matrix: {},
    estadoSNGRD: 'CONOCIMIENTO',
    situacionSNGRD: 'NORMAL',
  });
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rawText, setRawText] = useState('');
  const [showMatrix, setShowMatrix] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; file: File } | null>(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateProjectData, setDuplicateProjectData] = useState<Project | null>(null);

  const municipioId = useMemo(() => {
    return state.municipios.find(m => m.nombre === project.municipio)?.id || '';
  }, [state.municipios, project.municipio]);

  const riskSuggestions = useMemo(() => {
    if (!municipioId) return { prioritized: [], gaps: [] };
    return {
      prioritized: getPrioritizedRisks(municipioId, state.riesgosTerritoriales).slice(0, 3),
      gaps: getMitigationGaps(municipioId, state.riesgosTerritoriales, state.proyectos)
    };
  }, [municipioId, state.riesgosTerritoriales, state.proyectos]);

  const extractDataFromText = async (text: string) => {
    setIsParsing(true);
    try {
      const prompt = `Analiza el siguiente texto y extrae la información del proyecto siguiendo el formato oficial de la matriz institucional de la Subdirección de Reducción del Riesgo (SRR). 
        Texto: ${text}
        
        Debes devolver ÚNICAMENTE un objeto JSON. No incluyas texto explicativo, ni formato markdown (como \`\`\`json).
        El objeto debe mapear los campos a la interfaz ProjectMatrix y Project.
        Campos generales del proyecto:
        - nombre, departamento, municipio, linea, vigencia, tipoObra, justificacion, objetivoGeneral, objetivosEspecificos (array), alcance, beneficiarios.
        
        INSTRUCCIÓN CRÍTICA Y RIGUROSA:
        1. AVANCES: Extrae con precisión milimétrica el 'avanceFisico', 'avanceProgramado', 'avanceFinancieroObra', 'avanceFinancieroInterventoria' y 'avanceFinancieroPonderado'. Si encuentras porcentajes de avance en el texto, asígnalos correctamente.
        2. PAGOS: Extrae con exactitud los valores pagados ('valorPagadoObra', 'valorPagadoInterventoria', 'valorPagadoConvenio'). Si se mencionan pagos de actividades, súmalos o asígnalos al campo correspondiente.
        3. BENEFICIARIOS: Extrae rigurosamente la cantidad y descripción de los 'beneficiarios' (y 'personasBeneficiadas'). Consígnalo de forma clara y completa.
        
        Si detectas que el proyecto ya tiene contrato de obra y acta de inicio, sugiere el estado como 'En ejecución' o 'Ejecución Directa'.`;

      const config = {
        responseMimeType: 'application/json'
      };

      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel(), config);
      let cleanResult = result;
      if (typeof result === 'string') {
        const start = result.indexOf('{');
        const end = result.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
          cleanResult = result.substring(start, end + 1);
        }
      }
      const data = typeof cleanResult === 'string' ? JSON.parse(cleanResult) : cleanResult;
      
      if (data) {
        setProject(prev => {
          const newMatrix = { ...prev.matrix, ...(data.matrix || {}) };
          
          // Sincronizar campos principales si vienen en la matriz
          const avanceFisico = newMatrix.avanceFisico ?? data.avanceFisico ?? prev.avanceFisico ?? 0;
          const avanceFinanciero = newMatrix.avanceFinancieroPonderado ?? newMatrix.avanceFinancieroObra ?? data.avanceFinanciero ?? prev.avanceFinanciero ?? 0;
          const avanceProgramado = newMatrix.avanceProgramado ?? data.avanceProgramado ?? prev.avanceProgramado ?? 0;
          
          // Determinar estado
          let estado = prev.estado || 'Formulación';
          if (newMatrix.estadoProyecto) {
            estado = newMatrix.estadoProyecto;
          } else if (newMatrix.actaInicioConvenio || newMatrix.fechaInicioObra || data.fechaInicio) {
            estado = 'En ejecución';
          }

          return {
            ...prev,
            ...data,
            avanceFisico,
            avanceFinanciero,
            avanceProgramado,
            estado,
            objetivosEspecificos: data.objetivosEspecificos || prev.objetivosEspecificos,
            matrix: newMatrix
          };
        });
        setRawText('');
        showAlert('Datos extraídos correctamente con IA');
      }
    } catch (error) {
      console.error('Error parsing text with AI:', error);
      console.log('Current AI Provider:', aiProviderService.getAIProvider());
      console.log('Current AI Model:', aiProviderService.getAIModel());
      showAlert('No se pudo extraer la información. Intenta con otro modelo o verifica el texto.');
    } finally {
      setIsParsing(false);
    }
  };


  const handleDocumentData = (data: any, type: 'CDP' | 'RC' | 'General') => {
    if (type === 'CDP') {
      setProject(prev => ({
        ...prev,
        matrix: {
          ...prev.matrix,
          cdpConvenio: data.numero,
          fechaCdpConvenio: data.fecha,
          valorTotalProyecto: data.valor,
          objetoConvenio: data.objeto
        }
      }));
    } else if (type === 'RC') {
      setProject(prev => ({
        ...prev,
        matrix: {
          ...prev.matrix,
          rcConvenio: data.numero,
          fechaRcConvenio: data.fecha,
          numeroContratoObra: data.contratoAsociado
        }
      }));
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({ name: file.name, file });
    setIsParsing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }
      await extractDataFromText(text);
    } catch (error) {
      console.error('Error parsing PDF:', error);
      showAlert('Error al extraer datos del PDF.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSuggestTeam = () => {
    if (!project.departamento || !project.tipoObra) {
      showAlert('Por favor, ingrese el departamento y tipo de obra para sugerir un equipo.');
      return;
    }

    const scoreProfessional = (p: any, role: string) => {
      let score = 0;
      // Carga
      if (p.carga === 'Disponible') score += 50;
      if (p.carga === 'Media') score += 20;
      if (p.carga === 'Sobrecargado') score -= 50;
      
      // Experiencia en el departamento
      if (p.departamentosExperiencia.includes(project.departamento!)) score += 30;
      
      // Experiencia en el tipo de obra/línea
      if (p.sectoresTrabajados.includes(project.tipoObra!) || p.sectoresTrabajados.includes(project.linea!)) score += 30;

      // Role specific scoring
      const profLower = (p.profesion || '').toLowerCase();
      if (role === 'responsable' && (profLower.includes('gerente') || profLower.includes('director') || p.experienciaAnios > 10)) score += 40;
      if (role === 'tecnico' && (profLower.includes('ingeniero') || profLower.includes('arquitecto'))) score += 40;
      if (role === 'financiero' && (profLower.includes('contador') || profLower.includes('economista') || profLower.includes('financiero'))) score += 40;
      if (role === 'juridico' && profLower.includes('abogado')) score += 40;

      return score;
    };

    const getBestMatch = (role: string, excludeIds: string[]) => {
      const candidates = state.professionals.filter(p => !excludeIds.includes(p.id));
      if (candidates.length === 0) return '';
      
      const scored = candidates.map(p => ({ id: p.id, score: scoreProfessional(p, role) }));
      scored.sort((a, b) => b.score - a.score);
      return scored[0].score > 0 ? scored[0].id : '';
    };

    const assignedIds: string[] = [];
    
    const responsableId = getBestMatch('responsable', assignedIds);
    if (responsableId) assignedIds.push(responsableId);

    const tecnicoId = getBestMatch('tecnico', assignedIds);
    if (tecnicoId) assignedIds.push(tecnicoId);

    const financieroId = getBestMatch('financiero', assignedIds);
    if (financieroId) assignedIds.push(financieroId);

    const juridicoId = getBestMatch('juridico', assignedIds);
    if (juridicoId) assignedIds.push(juridicoId);

    setProject(prev => ({
      ...prev,
      responsableOpsId: responsableId,
      apoyoTecnicoId: tecnicoId,
      apoyoFinancieroId: financieroId,
      apoyoJuridicoId: juridicoId
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    const isDuplicate = state.proyectos.some(p => 
      p.nombre?.toLowerCase() === project.nombre?.toLowerCase() || 
      (project.matrix?.clave && p.matrix?.clave === project.matrix?.clave)
    );

    if (isDuplicate) {
      setShowDuplicateModal(true);
      return;
    }

    confirmSubmit();
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Si es ejecución directa, aseguramos que tenga un avance inicial y estado correcto
      const isDirectExecution = project.estado === 'Ejecución Directa';
      const estadoFinal = isDirectExecution ? 'En ejecución' : (project.estado || 'Formulación');
      const avanceFisicoFinal = isDirectExecution && (project.avanceFisico || 0) === 0 ? 1 : (project.avanceFisico || 0);
      const avanceFinancieroFinal = project.avanceFinanciero || 0;
      const avanceProgramadoFinal = project.avanceProgramado || 0;
      
      const projectId = Math.random().toString(36).substr(2, 9);
      
      let documentUrl = '';
      if (uploadedFile) {
        const folderPath = `proyectos/${projectId}/documentos_iniciales`;
        documentUrl = await uploadDocumentToStorage(uploadedFile.file, folderPath);
        
        if (documentUrl) {
          addDocument({
            id: Math.random().toString(36).substr(2, 9),
            projectId: projectId,
            titulo: uploadedFile.name,
            tipo: 'Documento Técnico',
            fechaCreacion: new Date().toISOString(),
            ultimaActualizacion: new Date().toISOString(),
            estado: 'Aprobado',
            tags: ['Documento Inicial', 'Creación Proyecto'],
            folderPath,
            versiones: [{
              id: Math.random().toString(36).substr(2, 9),
              version: 1,
              fecha: new Date().toISOString(),
              url: documentUrl,
              nombreArchivo: uploadedFile.name,
              subidoPor: 'Sistema',
              accion: 'Subida',
              estado: 'Aprobado'
            }]
          });
        }
      }
      
      const finalProject = { 
        ...project, 
        id: projectId,
        estado: estadoFinal,
        esEjecucionDirecta: isDirectExecution,
        avanceFisico: avanceFisicoFinal,
        avanceFinanciero: avanceFinancieroFinal,
        avanceProgramado: avanceProgramadoFinal,
        matrix: {
          ...project.matrix,
          nombreProyecto: project.nombre || project.matrix?.nombreProyecto,
          departamento: project.departamento || project.matrix?.departamento,
          municipio: project.municipio || project.matrix?.municipio,
          estadoProyecto: estadoFinal,
          avanceFisico: avanceFisicoFinal,
          avanceFinancieroPonderado: avanceFinancieroFinal,
          avanceProgramado: avanceProgramadoFinal,
          fechaInicioObra: project.fechaInicio || project.matrix?.fechaInicioObra,
          fechaFinalizacionActual: project.fechaFin || project.matrix?.fechaFinalizacionActual,
        }
      } as Project;
      
      onSave(finalProject);
    } catch (error) {
      console.error('Error saving project:', error);
      showAlert('Error al guardar el proyecto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Crear Nuevo Proyecto</h2>
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => setShowMatrix(!showMatrix)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${showMatrix ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {showMatrix ? 'Ocultar Matriz Oficial' : 'Ver Matriz Oficial'}
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DocumentReader onDataExtracted={handleDocumentData} />

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clipboard size={16} />
              Pegar Texto del Proyecto
            </label>
            <textarea 
              className="w-full h-24 bg-white border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Pega aquí el texto del convenio, CDP o descripción..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
            />
            <div className="flex gap-2 mt-2">
              <AIProviderSelector className="flex-1" />
              <button 
                type="button"
                onClick={() => extractDataFromText(rawText)}
                disabled={!rawText || isParsing}
                className="flex-[2] bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-900 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isParsing ? <Loader2 className="animate-spin" size={16} /> : <Star size={16} />}
                Extraer con Inteligencia Artificial
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="md:col-span-2 lg:col-span-3">
              <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Proyecto</label>
              <input 
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                value={project.nombre || ''}
                onChange={(e) => setProject(prev => ({ ...prev, nombre: e.target.value }))}
                placeholder="Ej: Construcción de Muro de Contención..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.departamento || ''}
                onChange={(e) => setProject(prev => ({ ...prev, departamento: e.target.value }))}
              >
                <option value="">Seleccionar Departamento</option>
                {['Antioquia', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Municipio</label>
              <input 
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.municipio || ''}
                onChange={(e) => setProject(prev => ({ ...prev, municipio: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Estado SNGRD</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.estadoSNGRD || 'CONOCIMIENTO'}
                onChange={(e) => setProject(prev => ({ ...prev, estadoSNGRD: e.target.value as any }))}
              >
                <option value="CONOCIMIENTO">CONOCIMIENTO</option>
                <option value="REDUCCIÓN">REDUCCIÓN</option>
                <option value="MANEJO">MANEJO</option>
                <option value="RECONSTRUCCIÓN">RECONSTRUCCIÓN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Situación SNGRD</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.situacionSNGRD || 'NORMAL'}
                onChange={(e) => setProject(prev => ({ ...prev, situacionSNGRD: e.target.value as any }))}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="CRISIS">CRISIS</option>
                <option value="POST-CRISIS">POST-CRISIS</option>
              </select>
            </div>

            {/* Risk Suggestions */}
            {(riskSuggestions.prioritized.length > 0 || riskSuggestions.gaps.length > 0) && (
              <div className="md:col-span-2 lg:col-span-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mt-2">
                <h4 className="text-sm font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Análisis de Riesgos para {project.municipio}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {riskSuggestions.prioritized.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">Riesgos Prioritarios:</p>
                      <ul className="text-xs text-amber-800 list-disc list-inside">
                        {riskSuggestions.prioritized.map(r => <li key={r.id}>{r.tipo_riesgo} (Prob: {r.probabilidad})</li>)}
                      </ul>
                    </div>
                  )}
                  {riskSuggestions.gaps.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-900 mb-1">Brechas de Mitigación (Sin proyectos):</p>
                      <ul className="text-xs text-amber-800 list-disc list-inside">
                        {riskSuggestions.gaps.map(r => <li key={r.id}>{r.tipo_riesgo}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Estado / Fase Inicial</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-bold text-indigo-600"
                value={project.estado || 'Banco de proyectos'}
                onChange={(e) => setProject(prev => ({ ...prev, estado: e.target.value as any }))}
              >
                <option value="Banco de proyectos">Banco de proyectos (Fase Inicial)</option>
                <option value="En viabilidad">En viabilidad</option>
                <option value="En estructuración">En estructuración</option>
                <option value="Aprobado">Aprobado</option>
                <option value="En contratación">En contratación</option>
                <option value="En ejecución">En ejecución</option>
                <option value="Ejecución Directa">🚀 Ejecución Directa (Saltar validación)</option>
                <option value="En seguimiento">En seguimiento</option>
                <option value="En liquidación">En liquidación</option>
                <option value="Liquidado">Liquidado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Línea de Inversión</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.linea || ''}
                onChange={(e) => setProject(prev => ({ ...prev, linea: e.target.value }))}
              >
                <option value="">Seleccionar Línea</option>
                {state.lineasInversion.map(l => (
                  <option key={l.id} value={l.nombre}>{l.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Vigencia</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.vigencia || ''}
                onChange={(e) => setProject(prev => ({ ...prev, vigencia: e.target.value }))}
              >
                <option value="">Seleccionar Vigencia</option>
                {state.vigencias.map(v => (
                  <option key={v.id} value={v.anio}>{v.anio}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Obra</label>
              <input 
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.tipoObra || ''}
                onChange={(e) => setProject(prev => ({ ...prev, tipoObra: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Beneficiarios (Texto)</label>
              <input 
                type="text"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.beneficiarios || ''}
                onChange={(e) => setProject(prev => ({ ...prev, beneficiarios: e.target.value }))}
                placeholder="Ej: 500 familias de la vereda..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">N° Beneficiarios (Numérico)</label>
              <input 
                type="number"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.matrix?.personasBeneficiadas || 0}
                onChange={(e) => setProject(prev => ({ ...prev, matrix: { ...prev.matrix, personasBeneficiadas: Number(e.target.value) } }))}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Convenio (Opcional)</label>
              <select 
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                value={project.convenioId || ''}
                onChange={(e) => setProject(prev => ({ ...prev, convenioId: e.target.value }))}
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
                {(project.fases || []).map((fase, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={fase.nombre}
                      onChange={(e) => {
                        const newFases = [...(project.fases || [])];
                        newFases[index].nombre = e.target.value;
                        setProject(prev => ({ ...prev, fases: newFases }));
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFases = (project.fases || []).filter((_, i) => i !== index);
                        setProject(prev => ({ ...prev, fases: newFases }));
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
                    const newFases = [...(project.fases || []), { id: Math.random().toString(36).substr(2, 9), nombre: '' }];
                    setProject(prev => ({ ...prev, fases: newFases }));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  + Agregar Fase
                </button>
              </div>
            </div>
          </div>

          {(project.estado === 'En ejecución' || project.estado === 'Ejecución Directa') && (
            <div className="mt-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-4">
              <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                <Activity size={16} />
                Estado Actual del Proyecto (En Ejecución)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">Avance Físico (%)</label>
                  <input 
                    type="number"
                    min="0" max="100"
                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={project.avanceFisico || 0}
                    onChange={(e) => setProject(prev => ({ ...prev, avanceFisico: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">Avance Financiero (%)</label>
                  <input 
                    type="number"
                    min="0" max="100"
                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={project.avanceFinanciero || 0}
                    onChange={(e) => setProject(prev => ({ ...prev, avanceFinanciero: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-700 mb-1">Avance Programado (%)</label>
                  <input 
                    type="number"
                    min="0" max="100"
                    className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    value={project.avanceProgramado || 0}
                    onChange={(e) => setProject(prev => ({ ...prev, avanceProgramado: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
            </div>
          )}

          {showMatrix && (
            <div className="animate-in fade-in slide-in-from-top-4">
              <MatrixFormFields 
                matrix={project.matrix || {}} 
                onChange={(field, value) => setProject(prev => {
                  const newMatrix = { ...prev.matrix, [field]: value };
                  const updates: Partial<Project> = { matrix: newMatrix };
                  
                  // Sincronizar campos principales en tiempo real si se editan en la matriz
                  if (field === 'avanceFisico') updates.avanceFisico = Number(value) || 0;
                  if (field === 'avanceProgramado') updates.avanceProgramado = Number(value) || 0;
                  if (field === 'avanceFinancieroPonderado' || field === 'avanceFinancieroObra') {
                    updates.avanceFinanciero = Number(value) || 0;
                  }
                  if (field === 'estadoProyecto') updates.estado = value as any;
                  if (field === 'fechaInicioObra' || field === 'actaInicioConvenio') updates.fechaInicio = value as string;
                  if (field === 'fechaFinalizacionActual' || field === 'fechaFinalizacionConvenio') updates.fechaFin = value as string;
                  if (field === 'departamento') updates.departamento = value as string;
                  if (field === 'municipio') updates.municipio = value as string;
                  if (field === 'nombreProyecto') updates.nombre = value as string;
                  
                  return { ...prev, ...updates };
                })} 
              />
            </div>
          )}
      
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Justificación</label>
        <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={project.justificacion} onChange={(e) => setProject(prev => ({ ...prev, justificacion: e.target.value }))} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Objetivo General</label>
        <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={project.objetivoGeneral} onChange={(e) => setProject(prev => ({ ...prev, objetivoGeneral: e.target.value }))} />
      </div>

      {/* OPS Assignment Section */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-indigo-600" size={20} />
            Asignación de Equipo OPS
          </h3>
          <button 
            type="button"
            onClick={handleSuggestTeam}
            className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-2 text-sm"
          >
            <Star size={16} />
            Sugerir Equipo Inteligente
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Responsable Principal */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Responsable Principal</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
              value={project.responsableOpsId || ''}
              onChange={(e) => setProject(prev => ({ ...prev, responsableOpsId: e.target.value }))}
            >
              <option value="">Seleccionar Responsable</option>
              {state.professionals.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
              ))}
            </select>
            {project.responsableOpsId && (
              <ProfessionalCard professional={state.professionals.find(p => p.id === project.responsableOpsId)!} />
            )}
          </div>

          {/* Apoyo Técnico */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Técnico</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
              value={project.apoyoTecnicoId || ''}
              onChange={(e) => setProject(prev => ({ ...prev, apoyoTecnicoId: e.target.value }))}
            >
              <option value="">Seleccionar Apoyo Técnico</option>
              {state.professionals.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
              ))}
            </select>
            {project.apoyoTecnicoId && (
              <ProfessionalCard professional={state.professionals.find(p => p.id === project.apoyoTecnicoId)!} />
            )}
          </div>

          {/* Apoyo Financiero */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Financiero</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
              value={project.apoyoFinancieroId || ''}
              onChange={(e) => setProject(prev => ({ ...prev, apoyoFinancieroId: e.target.value }))}
            >
              <option value="">Seleccionar Apoyo Financiero</option>
              {state.professionals.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
              ))}
            </select>
            {project.apoyoFinancieroId && (
              <ProfessionalCard professional={state.professionals.find(p => p.id === project.apoyoFinancieroId)!} />
            )}
          </div>

          {/* Apoyo Jurídico */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Jurídico</label>
            <select 
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-3"
              value={project.apoyoJuridicoId || ''}
              onChange={(e) => setProject(prev => ({ ...prev, apoyoJuridicoId: e.target.value }))}
            >
              <option value="">Seleccionar Apoyo Jurídico</option>
              {state.professionals.map(p => (
                <option key={p.id} value={p.id}>{p.nombre} - {p.profesion}</option>
              ))}
            </select>
            {project.apoyoJuridicoId && (
              <ProfessionalCard professional={state.professionals.find(p => p.id === project.apoyoJuridicoId)!} />
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {onCancel && (
          <button 
            type="button" 
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-1/3 bg-slate-100 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            Cancelar
          </button>
        )}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save size={18} />
              Guardar Proyecto
            </>
          )}
        </button>
      </div>
        </form>
      </div>

      <ConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={confirmSubmit}
        title="Proyecto Duplicado Detectado"
        message="Ya existe un proyecto con este nombre o clave. ¿Deseas crearlo de todas formas?"
        confirmLabel="Sí, crear duplicado"
        cancelLabel="No, cancelar"
      />
    </div>
  );
};
