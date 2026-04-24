import React, { useState } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, X, Activity, Type as TypeIcon } from 'lucide-react';
import { Otrosie, Contract, Afectacion, ActaInicioData, ActaComite, Suspension, Project } from '../types';
import { reconciliationService } from '../services/reconciliationService';
import { useProject } from '../store/ProjectContext';
import { ConfirmationModal } from './ConfirmationModal';
import { AIProviderSelector } from './AIProviderSelector';
import { aiProviderService } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';
import { showAlert } from '../utils/alert';
import { extractDataFromText } from '../services/pdfExtractorService';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface AddOtrosieFormProps {
  contracts: Contract[];
  onClose: () => void;
}

export const AddOtrosieForm: React.FC<AddOtrosieFormProps> = ({ contracts, onClose }) => {
  const { state, addOtrosie, addAfectacion, updateAfectacion, updateContract, addDocument, updateProject } = useProject();
  const [formType, setFormType] = useState<'otrosie' | 'afectacion' | 'actaInicio' | 'actaComite' | 'suspension'>('otrosie');
  
  const [otrosie, setOtrosie] = useState<Partial<Otrosie>>({
    contractId: contracts[0]?.id || '',
    numero: '',
    fechaFirma: '',
    objeto: '',
    justificacionTecnica: '',
    justificacionJuridica: '',
    valorAdicional: 0,
    plazoAdicionalMeses: 0,
    nitEntidad: '',
    nitContratista: '',
    clausulasModificadas: [],
    impactoPresupuestal: [],
    nuevasObligaciones: [],
    riesgosIdentificados: [],
    analisisOptimización: '',
  });

  const [afectacion, setAfectacion] = useState<Partial<Afectacion>>({
    projectId: contracts[0]?.projectId || '',
    contractId: contracts[0]?.id || '',
    numero: '',
    tipo: 'Adición',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    valor: 0,
  });

  const [actaInicio, setActaInicio] = useState<Partial<ActaInicioData>>({
    numero: '',
    fechaSuscripcion: '',
    fechaInicio: '',
    fechaFinPrevista: '',
    plazoMeses: 0,
    valorContrato: 0,
    valorAnticipo: 0,
    supervisor: '',
    interventor: '',
    objeto: '',
    observaciones: '',
  });

  const [actaComite, setActaComite] = useState<Partial<ActaComite>>({
    projectId: contracts[0]?.projectId || '',
    numero: '',
    fecha: new Date().toISOString().split('T')[0],
    temaCentral: '',
    decisiones: [],
    compromisosAnteriores: [],
    compromisosNuevos: [],
    preocupaciones: [],
    estadoCronograma: {
      fechaInicioPrevista: '',
      fechaFinPrevista: '',
      avanceFisico: 0,
      observaciones: ''
    },
    afectacionesGeneradas: [],
  });

  const [suspension, setSuspension] = useState<Partial<Suspension>>({
    contractId: contracts[0]?.id || '',
    numero: '',
    fechaInicio: new Date().toISOString().split('T')[0],
    motivo: '',
    justificacion: '',
  });

  const [manualText, setManualText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; file: File } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile({ name: file.name, file });
    setIsParsing(true);
    setParseProgress('Leyendo documento (esto puede tardar para documentos extensos)...');
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log('Iniciando carga de PDF con pdfjs-dist...');
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      console.log(`PDF cargado con éxito. Total páginas: ${pdf.numPages}`);
      
      const parts: any[] = [];
      // Extract up to 20 pages for analysis to ensure full coverage
      const pagesToProcess = Math.min(pdf.numPages, 15);
      console.log(`Procesando ${pagesToProcess} páginas...`);
      
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
        
        if (i % 5 === 0) setParseProgress(`Procesando página ${i} de ${pdf.numPages}...`);
      }

      setParseProgress('Analizando contenido con IA de alto rigor...');
      
      let systemInstruction = '';
      let promptText = '';

      if (formType === 'otrosie') {
        systemInstruction = `Eres un auditor experto en contratación estatal y gestión de proyectos de infraestructura. 
        Tu tarea es realizar una auditoría exhaustiva de documentos de Otrosí y extraer una estructura JSON con el máximo rigor.
        
        REGLA DE ORO: Si el documento es un escaneo de baja calidad, realiza un esfuerzo extra de OCR mental. No inventes datos, pero busca en sellos y notas al margen.
        
        IMPORTANTE: Debes responder ÚNICAMENTE con el objeto JSON. No incluyas explicaciones, disculpas ni texto adicional. Si no encuentras información, devuelve los campos vacíos o en cero, pero SIEMPRE en el formato JSON solicitado.
        
        Debes devolver un objeto JSON con esta estructura EXACTA:
        {
          "numero": "string (Número del Otrosí)",
          "fechaFirma": "string (YYYY-MM-DD)",
          "objeto": "string (Objeto del Otrosí)",
          "justificacionTecnica": "string",
          "justificacionJuridica": "string",
          "valorAdicional": number,
          "plazoAdicionalMeses": number,
          "nitEntidad": "string",
          "nitContratista": "string",
          "clausulasModificadas": [
            {
              "numero": "string",
              "descripcionAnterior": "string",
              "descripcionNueva": "string"
            }
          ],
          "impactoPresupuestal": [
            {
              "rubro": "string",
              "valorAnterior": number,
              "valorNuevo": number,
              "variacion": number
            }
          ],
          "nuevasObligaciones": ["string"],
          "riesgosIdentificados": ["string"],
          "analisisOptimización": "string",
          "tipoModificacion": "Adición" | "Prórroga" | "Adición y Prórroga" | "Aclaración" | "Modificación de Cláusulas",
          "supervisorResponsable": "string"
        }`;
        
        promptText = `Analiza este documento de Otrosí con RIGOR EXTREMO. Si no es un Otrosí, intenta extraer lo que sea relevante en el formato JSON.`;
      } else if (formType === 'afectacion') {
        systemInstruction = `Eres un experto financiero en proyectos de infraestructura. Tu tarea es extraer información sobre afectaciones presupuestales, pagos o adiciones/reducciones de presupuesto.
        
        REGLA DE ORO: Si el documento es un escaneo de baja calidad, realiza un esfuerzo extra de OCR mental.
        
        IMPORTANTE: Debes responder ÚNICAMENTE con el objeto JSON. No incluyas texto adicional.
        
        Debes devolver un objeto JSON con esta estructura:
        {
          "numero": "string",
          "tipo": "Adición" | "Reducción" | "Liberación" | "Pago" | "Otro",
          "valor": number,
          "fecha": "string (YYYY-MM-DD)",
          "cdp": "string",
          "rp": "string",
          "descripcion": "string",
          "fuenteFinanciacion": "string"
        }`;
        promptText = `Analiza este documento de afectación presupuestal o pago y extrae los datos financieros clave.`;
      } else if (formType === 'actaInicio') {
        systemInstruction = `Eres un auditor experto. Tu tarea es extraer toda la información relevante de un Acta de Inicio de contrato.
        
        REGLA DE ORO: Si el documento es un escaneo de baja calidad, realiza un esfuerzo extra de OCR mental.
        
        IMPORTANTE: Debes responder ÚNICAMENTE con el objeto JSON. No incluyas texto adicional.
        
        Debes devolver un objeto JSON con esta estructura:
        {
          "numero": "string",
          "fechaSuscripcion": "string (YYYY-MM-DD)",
          "fechaInicio": "string (YYYY-MM-DD)",
          "fechaFinPrevista": "string (YYYY-MM-DD)",
          "plazoMeses": number,
          "valorContrato": number,
          "valorAnticipo": number,
          "supervisor": "string",
          "interventor": "string",
          "objeto": "string",
          "observaciones": "string"
        }`;
        promptText = `Analiza esta Acta de Inicio y extrae todos los hitos, valores y responsables mencionados.`;
      } else if (formType === 'actaComite') {
        systemInstruction = `Eres un auditor experto. Tu tarea es extraer toda la información relevante de un Acta de Comité. 
        Las actas de comité son críticas para la trazabilidad del proyecto.
        
        REGLA DE ORO: Si el documento es un escaneo de baja calidad, realiza un esfuerzo extra de OCR mental. No inventes datos, pero busca en sellos y notas al margen.
        
        IMPORTANTE: Debes responder ÚNICAMENTE con el objeto JSON. No incluyas explicaciones, disculpas ni texto adicional como "Lo siento, no encuentro el acta". Si el documento no parece ser un Acta de Comité, intenta extraer cualquier dato que encaje en la estructura o devuelve campos vacíos, pero SIEMPRE JSON.
        
        Debes devolver un objeto JSON con esta estructura EXACTA que coincida con la interfaz ActaComite:
        {
          "numero": "string (Número del acta)",
          "fecha": "string (YYYY-MM-DD)",
          "temaCentral": "string (Resumen del tema principal)",
          "decisiones": ["string (Lista de decisiones tomadas)"],
          "compromisosAnteriores": [
            {
              "descripcion": "string",
              "estadoActual": "string (ej: Pendiente, En proceso, Cumplido)",
              "observaciones": "string"
            }
          ],
          "compromisosNuevos": [
            {
              "descripcion": "string",
              "responsable": "string",
              "fechaLimite": "string (YYYY-MM-DD)",
              "estado": "Pendiente"
            }
          ],
          "preocupaciones": ["string (Riesgos o preocupaciones mencionadas)"],
          "estadoCronograma": {
            "fechaInicioPrevista": "string (YYYY-MM-DD)",
            "fechaFinPrevista": "string (YYYY-MM-DD)",
            "avanceFisico": number,
            "observaciones": "string"
          },
          "afectacionesGeneradas": [
            {
              "tipo": "Financiera" | "Social" | "Técnica" | "Legal",
              "descripcion": "string",
              "valorEstimado": number
            }
          ]
        }`;
        promptText = `Analiza esta Acta de Comité y extrae los temas, decisiones, compromisos (anteriores y nuevos), preocupaciones y estado del cronograma con MÁXIMO RIGOR.`;
      } else if (formType === 'suspension') {
        systemInstruction = `Eres un auditor experto. Tu tarea es extraer toda la información relevante de un Acta de Suspensión.
        
        IMPORTANTE: Debes responder ÚNICAMENTE con el objeto JSON. No incluyas texto adicional.
        
        Debes devolver un objeto JSON con esta estructura:
        {
          "numero": "string",
          "fechaInicio": "string (YYYY-MM-DD)",
          "fechaFin": "string (YYYY-MM-DD)",
          "plazoMeses": number,
          "motivo": "string",
          "justificacion": "string"
        }`;
        promptText = `Analiza esta Acta de Suspensión y extrae las fechas, motivos y justificaciones.`;
      }

      const prompt = `${systemInstruction}\n\n${promptText}`;
      const config = {
        responseMimeType: 'application/json'
      };

      console.log(`Iniciando análisis de IA para ${formType}...`);
      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel(), config, parts);
      console.log('Resultado bruto de IA:', result);
      
      const extractedData = parseJSONResponse(result);
      console.log('Datos extraídos y parseados:', extractedData);

      if (!extractedData || Object.keys(extractedData).length === 0) {
        throw new Error('La IA no pudo extraer datos válidos del documento.');
      }

      // Mapeo robusto para asegurar que los campos se llenen incluso si la IA usa nombres ligeramente diferentes
      const robustData = { ...extractedData };
      if (extractedData.numeroOtrosie && !robustData.numero) robustData.numero = extractedData.numeroOtrosie;
      if (extractedData.numeroActa && !robustData.numero) robustData.numero = extractedData.numeroActa;
      if (extractedData.fechaComite && !robustData.fecha) robustData.fecha = extractedData.fechaComite;
      if (extractedData.temasTratados && !robustData.temaCentral) {
        robustData.temaCentral = Array.isArray(extractedData.temasTratados) 
          ? extractedData.temasTratados.join(', ') 
          : extractedData.temasTratados;
      }

      if (formType === 'otrosie') setOtrosie(prev => ({ ...prev, ...robustData }));
      else if (formType === 'afectacion') setAfectacion(prev => ({ ...prev, ...robustData }));
      else if (formType === 'actaInicio') setActaInicio(prev => ({ ...prev, ...robustData }));
      else if (formType === 'actaComite') setActaComite(prev => ({ ...prev, ...robustData }));
      else if (formType === 'suspension') setSuspension(prev => ({ ...prev, ...robustData }));
      
      setParseProgress('Análisis completado con éxito.');
      showAlert('Datos extraídos correctamente. Por favor, verifícalos antes de guardar.');
    } catch (error: any) {
      console.error('Error parsing PDF:', error);
      const msg = error?.message || 'Error desconocido';
      alert(`Error al extraer datos del PDF: ${msg}`);
      setParseProgress(`Error: ${msg}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleTextAnalysis = async () => {
    if (!manualText) return;
    setIsParsing(true);
    setParseProgress('Analizando texto con IA de alto rigor...');
    try {
      let prompt = '';

      if (formType === 'otrosie') {
        prompt = `Analiza este texto de Otrosí y extrae la información con rigor técnico, jurídico y financiero en formato JSON:
        {
          "numero": "string",
          "fechaFirma": "string (YYYY-MM-DD)",
          "objeto": "string",
          "justificacionTecnica": "string",
          "justificacionJuridica": "string",
          "valorAdicional": number,
          "plazoAdicionalMeses": number,
          "clausulasModificadas": [{ "numero": "string", "descripcionAnterior": "string", "descripcionNueva": "string" }],
          "impactoPresupuestal": [{ "rubro": "string", "valorAnterior": number, "valorNuevo": number, "variacion": number }],
          "nuevasObligaciones": ["string"],
          "riesgosIdentificados": ["string"],
          "analisisOptimización": "string"
        }`;
      } else if (formType === 'afectacion') {
        prompt = `Analiza este texto de afectación presupuestal o pago y extrae los datos financieros en formato JSON:
        {
          "numero": "string",
          "tipo": "Adición" | "Reducción" | "Liberación" | "Pago" | "Otro",
          "descripcion": "string",
          "fecha": "string (YYYY-MM-DD)",
          "valor": number
        }`;
      } else if (formType === 'actaInicio') {
        prompt = `Analiza este texto de Acta de Inicio y extrae hitos, valores y responsables en formato JSON:
        {
          "numero": "string",
          "fechaSuscripcion": "string (YYYY-MM-DD)",
          "fechaInicio": "string (YYYY-MM-DD)",
          "fechaFinPrevista": "string (YYYY-MM-DD)",
          "plazoMeses": number,
          "valorContrato": number,
          "valorAnticipo": number,
          "supervisor": "string",
          "interventor": "string",
          "objeto": "string",
          "observaciones": "string"
        }`;
      } else if (formType === 'actaComite') {
        prompt = `Analiza este texto de Acta de Comité y extrae los temas, decisiones y afectaciones generadas en formato JSON:
        {
          "numero": "string",
          "fecha": "string (YYYY-MM-DD)",
          "temaCentral": "string",
          "decisiones": ["string"],
          "compromisosAnteriores": [
            {
              "descripcion": "string",
              "estadoActual": "string (ej: Pendiente, En proceso, Cumplido)",
              "observaciones": "string"
            }
          ],
          "compromisosNuevos": [
            {
              "descripcion": "string",
              "responsable": "string",
              "fechaLimite": "string (YYYY-MM-DD)",
              "estado": "Pendiente"
            }
          ],
          "preocupaciones": ["string (Riesgos o preocupaciones mencionadas)"],
          "estadoCronograma": {
            "fechaInicioPrevista": "string (YYYY-MM-DD)",
            "fechaFinPrevista": "string (YYYY-MM-DD)",
            "avanceFisico": number,
            "observaciones": "string"
          },
          "afectacionesGeneradas": [{ "tipo": "Financiera" | "Social" | "Técnica" | "Legal", "descripcion": "string", "valorEstimado": number }]
        }`;
      } else if (formType === 'suspension') {
        prompt = `Analiza este texto de Acta de Suspensión y extrae las fechas, motivos y justificaciones en formato JSON:
        {
          "numero": "string",
          "fechaInicio": "string (YYYY-MM-DD)",
          "fechaFin": "string (YYYY-MM-DD)",
          "plazoMeses": number,
          "motivo": "string",
          "justificacion": "string"
        }`;
      }

      const extractedData = await extractDataFromText(manualText, prompt);
      if (formType === 'otrosie') setOtrosie(prev => ({ ...prev, ...extractedData }));
      else if (formType === 'afectacion') setAfectacion(prev => ({ ...prev, ...extractedData }));
      else if (formType === 'actaInicio') setActaInicio(prev => ({ ...prev, ...extractedData }));
      else if (formType === 'actaComite') setActaComite(prev => ({ ...prev, ...extractedData }));
      else if (formType === 'suspension') setSuspension(prev => ({ ...prev, ...extractedData }));
      
      setParseProgress('Análisis completado con éxito.');
    } catch (error) {
      console.error('Error parsing text:', error);
      alert('Error al extraer datos del texto.');
      setParseProgress('Error en el análisis.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicate
    if (formType === 'otrosie') {
      const isDuplicate = state.otrosies.some(o => o.contractId === otrosie.contractId && o.numero === otrosie.numero);
      if (isDuplicate) {
        setShowDuplicateModal(true);
        return;
      }
    } else if (formType === 'afectacion') {
      const isDuplicate = state.afectaciones.some(a => a.contractId === afectacion.contractId && a.numero === afectacion.numero);
      if (isDuplicate) {
        setShowDuplicateModal(true);
        return;
      }
    }

    confirmSubmit();
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (formType === 'otrosie') {
        const otsId = `OTS-${Date.now()}`;
        const newOts = { ...otrosie, id: otsId } as Otrosie;
        addOtrosie(newOts);

        // Conciliación: Buscar afectaciones abiertas que coincidan con este otrosí para cerrarlas
        const matchingAfectaciones = state.afectaciones.filter(af => 
          af.estado === 'Abierta' && 
          reconciliationService.isAfectacionFormalized(af, [newOts])
        );
        
        matchingAfectaciones.forEach(af => {
          updateAfectacion({
            ...af,
            estado: 'Cerrada',
            documentoReferenciaId: otsId
          });
        });

        // Actualizar fechas del proyecto si el otrosí afecta el plazo
        const contract = state.contratos.find(c => c.id === newOts.contractId);
        const project = state.proyectos.find(p => p.id === contract?.projectId);
        if (project && newOts.plazoAdicionalMeses) {
          const reconciledDates = reconciliationService.reconcileProjectDates(project, [...state.otrosies, newOts], project.actasComite || []);
          updateProject({
            ...project,
            fechaFin: reconciledDates.fechaFin
          });
        }
      } else if (formType === 'afectacion') {
        const afId = `AF-${Date.now()}`;
        const newAf = { ...afectacion, id: afId } as Afectacion;
        addAfectacion(newAf);
      } else if (formType === 'actaInicio') {
        const contract = contracts.find(c => c.id === otrosie.contractId); // Use selected contract
        if (contract) {
          updateContract({
            ...contract,
            actaInicioData: actaInicio as ActaInicioData,
            fechaInicio: actaInicio.fechaInicio,
            fechaFin: actaInicio.fechaFinPrevista
          });

          // Conciliación de fechas del proyecto
          const project = state.proyectos.find(p => p.id === contract.projectId);
          if (project) {
            updateProject({
              ...project,
              fechaInicio: actaInicio.fechaInicio || project.fechaInicio,
              fechaFin: actaInicio.fechaFinPrevista || project.fechaFin
            });
          }
        }
      } else if (formType === 'actaComite') {
        const project = state.proyectos.find(p => p.id === actaComite.projectId);
        if (project) {
          const actaId = `AC-${Date.now()}`;
          const newActa = { ...actaComite, id: actaId } as ActaComite;
          
          // Refactorización de la lógica de afectación
          let updatedCompromisos = [...(project.compromisos || [])];
          
          // 1. Procesar compromisos nuevos
          if (newActa.compromisosNuevos && newActa.compromisosNuevos.length > 0) {
            const nuevos = newActa.compromisosNuevos.map(c => ({
              ...c,
              id: `COMP-${Math.random().toString(36).substr(2, 9)}`,
              actaId: actaId,
              fechaRegistro: new Date().toISOString()
            }));
            updatedCompromisos = [...updatedCompromisos, ...nuevos];
          }
          
          // 2. Procesar actualizaciones de compromisos anteriores
          if (newActa.compromisosAnteriores && newActa.compromisosAnteriores.length > 0) {
            newActa.compromisosAnteriores.forEach(ca => {
              const index = updatedCompromisos.findIndex(c => 
                (c.descripcion || '').toLowerCase().includes((ca.descripcion || '').toLowerCase()) ||
                (ca.descripcion || '').toLowerCase().includes((c.descripcion || '').toLowerCase())
              );
              
              if (index !== -1) {
                updatedCompromisos[index] = {
                  ...updatedCompromisos[index],
                  estado: ca.estadoActual as any,
                  trazabilidad: (updatedCompromisos[index].trazabilidad || '') + `\nActualización Acta ${newActa.numero}: ${ca.observaciones || ca.estadoActual}`
                };
              }
            });
          }
          
          // 3. Afectar cronograma y estado del proyecto usando lógica de conciliación
          const reconciledDates = reconciliationService.reconcileProjectDates(project, state.otrosies, [...(project.actasComite || []), newActa]);
          
          let updatedProject: Project = {
            ...project,
            actasComite: [...(project.actasComite || []), newActa],
            compromisos: updatedCompromisos,
            fechaInicio: reconciledDates.fechaInicio,
            fechaFin: reconciledDates.fechaFin
          };

          // Actualizar historial de avances si hay un dato válido
          if (newActa.estadoCronograma?.avanceFisico !== undefined) {
            updatedProject = reconciliationService.updateProgressHistory(
              updatedProject,
              newActa.estadoCronograma.avanceFisico,
              actaId,
              'ActaComite'
            );
          }
          
          updateProject(updatedProject);

          // 4. Crear registros de afectación si existen
          if (newActa.afectacionesGeneradas && newActa.afectacionesGeneradas.length > 0) {
            newActa.afectacionesGeneradas.forEach(af => {
              const afId = `AF-AC-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const newAfectacion: Afectacion = {
                id: afId,
                projectId: project.id,
                numero: `AC-${newActa.numero}`,
                tipo: af.tipo === 'Financiera' ? 'Adición' : 'Otro',
                descripcion: `Generada por Acta de Comité ${newActa.numero}: ${af.descripcion}`,
                fecha: newActa.fecha,
                valor: af.valorEstimado || 0,
                estado: 'Abierta',
                origenId: actaId
              };
              addAfectacion(newAfectacion);
            });
          }
        }
      } else if (formType === 'suspension') {
        const contract = contracts.find(c => c.id === suspension.contractId);
        const project = state.proyectos.find(p => p.id === contract?.projectId);
        if (project) {
          const newSuspension = { ...suspension, id: `SUS-${Date.now()}` } as Suspension;
          const updatedProject = {
            ...project,
            estado: 'Suspendido' as any,
            suspensiones: [...(project.suspensiones || []), newSuspension]
          };
          updateProject(updatedProject);
        }
      }

      if (uploadedFile) {
        const contractId = formType === 'otrosie' ? otrosie.contractId : afectacion.contractId;
        const contract = contracts.find(c => c.id === contractId);
        const project = state.proyectos.find(p => p.id === contract?.projectId);
        const projectName = project?.nombre || 'Proyecto';
        const folderPath = `${projectName}/${formType === 'otrosie' ? 'Otrosíes' : 'Documentos'}`;

        const publicUrl = await uploadDocumentToStorage(uploadedFile.file, folderPath);

        addDocument({
          id: `DOC-${Date.now()}`,
          projectId: project?.id || '',
          contractId: contractId,
          titulo: `${formType === 'otrosie' ? 'Otrosí' : formType === 'afectacion' ? 'Afectación' : 'Acta de Inicio'} ${formType === 'otrosie' ? otrosie.numero : formType === 'afectacion' ? afectacion.numero : actaInicio.numero}`,
          tipo: formType === 'otrosie' ? 'Otrosí' : 'Documento Contractual',
          descripcion: `Documento de ${formType}`,
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
          tags: [formType, 'Contrato'],
          folderPath,
          estado: 'Borrador'
        });
      }

      onClose();
    } catch (error) {
      console.error("Error saving form:", error);
      alert("Hubo un error al guardar el documento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-600 text-white rounded-t-2xl">
          <div className="flex items-center gap-4">
            <h3 className="font-bold text-xl">Gestión de Documentos Contractuales</h3>
            <div className="flex bg-indigo-700/50 p-1 rounded-lg">
              <button 
                type="button"
                onClick={() => setFormType('otrosie')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${formType === 'otrosie' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
              >
                Otrosí
              </button>
              <button 
                type="button"
                onClick={() => setFormType('afectacion')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${formType === 'afectacion' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
              >
                Afectación
              </button>
              <button 
                type="button"
                onClick={() => setFormType('actaInicio')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${formType === 'actaInicio' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
              >
                Acta Inicio
              </button>
              <button 
                type="button"
                onClick={() => setFormType('actaComite')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${formType === 'actaComite' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
              >
                Acta Comité
              </button>
              <button 
                type="button"
                onClick={() => setFormType('suspension')}
                className={`px-4 py-1 rounded-md text-sm font-bold transition-all ${formType === 'suspension' ? 'bg-white text-indigo-600 shadow-sm' : 'text-white/70 hover:text-white'}`}
              >
                Suspensión
              </button>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white">✕</button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 flex-1">
          {/* Carga de Documento */}
          <div className="bg-indigo-50 p-6 rounded-xl border-2 border-dashed border-indigo-200 text-center space-y-4">
            <div className="flex justify-end">
              <AIProviderSelector />
            </div>
            <label className="block cursor-pointer">
              <span className="text-indigo-700 font-semibold mb-2 block">Cargar {formType === 'otrosie' ? 'Otrosí' : formType === 'afectacion' ? 'Afectación' : formType === 'actaInicio' ? 'Acta de Inicio' : formType === 'actaComite' ? 'Acta de Comité' : 'Suspensión'} (PDF)</span>
              <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              <div className="bg-white px-6 py-3 rounded-lg border border-indigo-200 inline-block shadow-sm hover:bg-indigo-100 transition-colors">
                Seleccionar Archivo
              </div>
            </label>
            <div className="mt-4">
              <span className="text-indigo-700 font-semibold mb-2 block">O ingresar texto manualmente</span>
              <textarea 
                rows={4} 
                value={manualText} 
                onChange={e => setManualText(e.target.value)} 
                className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder={`Pegue aquí el texto del ${formType}...`}
              />
              <button 
                type="button" 
                onClick={handleTextAnalysis}
                className="mt-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
              >
                Analizar Texto con IA
              </button>
            </div>
            {isParsing && (
              <div className="mt-4 flex flex-col items-center gap-2">
                <div className="w-full bg-slate-200 rounded-full h-2 max-w-md">
                  <div className="bg-indigo-600 h-2 rounded-full animate-pulse w-full"></div>
                </div>
                <p className="text-sm font-medium text-indigo-600">{parseProgress}</p>
              </div>
            )}
            {!isParsing && parseProgress && <p className="mt-2 text-sm text-emerald-600 font-medium">{parseProgress}</p>}
          </div>

          {formType === 'otrosie' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Contrato Asociado</span>
                    <select value={otrosie.contractId} onChange={e => setOtrosie(prev => ({...prev, contractId: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      {contracts.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.contratista}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Número de Otrosí</span>
                    <input value={otrosie.numero} onChange={e => setOtrosie(prev => ({...prev, numero: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha de Firma</span>
                    <input type="date" value={formatDateForInput(otrosie.fechaFirma)} onChange={e => setOtrosie(prev => ({...prev, fechaFirma: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Valor Adicional (COP)</span>
                    <input type="number" value={otrosie.valorAdicional} onChange={e => setOtrosie(prev => ({...prev, valorAdicional: Number(e.target.value)}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Prórroga (Meses)</span>
                    <input type="number" value={otrosie.plazoAdicionalMeses} onChange={e => setOtrosie(prev => ({...prev, plazoAdicionalMeses: Number(e.target.value)}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">NIT Entidad</span>
                    <input value={otrosie.nitEntidad} onChange={e => setOtrosie(prev => ({...prev, nitEntidad: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">NIT Contratista</span>
                    <input value={otrosie.nitContratista} onChange={e => setOtrosie(prev => ({...prev, nitContratista: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Objeto de la Modificación</span>
                <textarea rows={3} value={otrosie.objeto} onChange={e => setOtrosie(prev => ({...prev, objeto: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>
            </div>
          )}

          {formType === 'afectacion' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Contrato Asociado</span>
                    <select value={afectacion.contractId} onChange={e => setAfectacion(prev => ({...prev, contractId: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      {contracts.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.contratista}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Número de Documento</span>
                    <input value={afectacion.numero} onChange={e => setAfectacion(prev => ({...prev, numero: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Tipo de Afectación</span>
                    <select value={afectacion.tipo} onChange={e => setAfectacion(prev => ({...prev, tipo: e.target.value as any}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="Adición">Adición</option>
                      <option value="Reducción">Reducción</option>
                      <option value="Liberación">Liberación</option>
                      <option value="Pago">Pago</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Valor (COP)</span>
                    <input type="number" value={afectacion.valor} onChange={e => setAfectacion(prev => ({...prev, valor: Number(e.target.value)}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha</span>
                    <input type="date" value={formatDateForInput(afectacion.fecha)} onChange={e => setAfectacion(prev => ({...prev, fecha: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Descripción / Justificación</span>
                <textarea rows={3} value={afectacion.descripcion} onChange={e => setAfectacion(prev => ({...prev, descripcion: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>
            </div>
          )}

          {formType === 'actaInicio' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Contrato Asociado</span>
                    <select value={otrosie.contractId} onChange={e => setOtrosie(prev => ({...prev, contractId: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      {contracts.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.contratista}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Número de Acta</span>
                    <input value={actaInicio.numero} onChange={e => setActaInicio(prev => ({...prev, numero: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha Suscripción</span>
                    <input type="date" value={formatDateForInput(actaInicio.fechaSuscripcion)} onChange={e => setActaInicio(prev => ({...prev, fechaSuscripcion: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha Inicio</span>
                    <input type="date" value={formatDateForInput(actaInicio.fechaInicio)} onChange={e => setActaInicio(prev => ({...prev, fechaInicio: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha Fin Prevista</span>
                    <input type="date" value={formatDateForInput(actaInicio.fechaFinPrevista)} onChange={e => setActaInicio(prev => ({...prev, fechaFinPrevista: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Valor Contrato</span>
                  <input type="number" value={actaInicio.valorContrato} onChange={e => setActaInicio(prev => ({...prev, valorContrato: Number(e.target.value)}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </label>
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700">Valor Anticipo</span>
                  <input type="number" value={actaInicio.valorAnticipo} onChange={e => setActaInicio(prev => ({...prev, valorAnticipo: Number(e.target.value)}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Objeto</span>
                <textarea rows={2} value={actaInicio.objeto} onChange={e => setActaInicio(prev => ({...prev, objeto: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>
            </div>
          )}
          {formType === 'actaComite' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Proyecto Asociado</span>
                    <select value={actaComite.projectId} onChange={e => setActaComite(prev => ({...prev, projectId: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      {state.proyectos.filter(p => p.id === contracts[0]?.projectId).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Número de Acta</span>
                    <input value={actaComite.numero} onChange={e => setActaComite(prev => ({...prev, numero: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha</span>
                    <input type="date" value={formatDateForInput(actaComite.fecha)} onChange={e => setActaComite(prev => ({...prev, fecha: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Tema Central</span>
                    <input value={actaComite.temaCentral} onChange={e => setActaComite(prev => ({...prev, temaCentral: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Decisiones (separadas por nueva línea)</span>
                <textarea rows={3} value={actaComite.decisiones?.join('\n') || ''} onChange={e => setActaComite(prev => ({...prev, decisiones: e.target.value.split('\n').filter(d => d.trim())}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Compromisos Anteriores</h4>
                  {actaComite.compromisosAnteriores?.map((ca, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                      <p className="font-semibold">{ca.descripcion}</p>
                      <p className="text-slate-600">Estado: {ca.estadoActual}</p>
                      {ca.observaciones && <p className="text-xs italic">{ca.observaciones}</p>}
                    </div>
                  ))}
                  {(!actaComite.compromisosAnteriores || actaComite.compromisosAnteriores.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No se detectaron compromisos anteriores.</p>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Compromisos Nuevos</h4>
                  {actaComite.compromisosNuevos?.map((cn, idx) => (
                    <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 text-sm">
                      <p className="font-semibold">{cn.descripcion}</p>
                      <div className="flex justify-between text-xs text-indigo-700 mt-1">
                        <span>Resp: {cn.responsable}</span>
                        <span>Límite: {cn.fechaLimite || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                  {(!actaComite.compromisosNuevos || actaComite.compromisosNuevos.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No se detectaron compromisos nuevos.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Preocupaciones / Riesgos</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {actaComite.preocupaciones?.map((p, idx) => (
                      <li key={idx} className="text-sm text-red-600">{p}</li>
                    ))}
                  </ul>
                  {(!actaComite.preocupaciones || actaComite.preocupaciones.length === 0) && (
                    <p className="text-xs text-slate-500 italic">No se detectaron preocupaciones.</p>
                  )}
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-800 border-b pb-2">Estado del Cronograma</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Inicio Previsto</span>
                      <p className="font-semibold">{actaComite.estadoCronograma?.fechaInicioPrevista || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Fin Previsto</span>
                      <p className="font-semibold">{actaComite.estadoCronograma?.fechaFinPrevista || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Avance Físico</span>
                      <p className="font-semibold">{actaComite.estadoCronograma?.avanceFisico || 0}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {formType === 'suspension' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Contrato Asociado</span>
                    <select value={suspension.contractId} onChange={e => setSuspension(prev => ({...prev, contractId: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none">
                      {contracts.map(c => <option key={c.id} value={c.id}>{c.numero} - {c.contratista}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Número de Suspensión</span>
                    <input value={suspension.numero} onChange={e => setSuspension(prev => ({...prev, numero: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha Inicio</span>
                    <input type="date" value={formatDateForInput(suspension.fechaInicio)} onChange={e => setSuspension(prev => ({...prev, fechaInicio: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Fecha Fin (Opcional)</span>
                    <input type="date" value={formatDateForInput(suspension.fechaFin || '')} onChange={e => setSuspension(prev => ({...prev, fechaFin: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </label>
                </div>
              </div>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Motivo</span>
                <input value={suspension.motivo} onChange={e => setSuspension(prev => ({...prev, motivo: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700">Justificación</span>
                <textarea rows={4} value={suspension.justificacion} onChange={e => setSuspension(prev => ({...prev, justificacion: e.target.value}))} className="w-full mt-1 border border-slate-200 p-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </label>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-4 bg-slate-50 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-6 py-2.5 font-semibold text-slate-600 hover:text-slate-800">Cancelar</button>
          <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            {isSubmitting ? 'Guardando...' : `Guardar ${formType === 'otrosie' ? 'Otrosí' : formType === 'afectacion' ? 'Afectación' : formType === 'actaInicio' ? 'Acta de Inicio' : formType === 'actaComite' ? 'Acta de Comité' : 'Suspensión'}`}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onConfirm={confirmSubmit}
        title="Duplicado Detectado"
        message={`Ya existe ${formType === 'otrosie' ? 'un Otrosí' : 'una Afectación'} con este número para este contrato. ¿Deseas crearlo de todas formas?`}
        confirmLabel="Sí, crear duplicado"
        cancelLabel="No, cancelar"
      />
    </div>
  );
};
