import { PODDocument, Project, ProjectPODConflict, Threat, ConocimientoTerritorial, Contractor, Professional } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import { aiProviderService } from './aiProviderService';
import { parseJSONResponse } from './geminiService';

// Ensure worker is configured if used in browser context
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
  ).toString();
}

export const parsePODDocument = async (
  file: File, 
  departamento: string, 
  poblacion: number, 
  projects: Project[],
  contractors: Contractor[],
  professionals: Professional[],
  existingKnowledge?: ConocimientoTerritorial,
  documentType: 'POD' | 'POT' | 'Noticia' | 'Evento' | 'Directriz' | 'Otro' = 'POD',
  municipio?: string,
  onProgress?: (msg: string) => void
): Promise<PODDocument> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    
    const parts: any[] = [];
    let fullText = "";
    
    // Extract text and images from the PDF (sampling or full depending on size, but we'll try to get as much as possible)
    const maxPagesToProcess = Math.min(pdf.numPages, 30); 
    const maxImagesToExtract = 5;
    
    for (let i = 1; i <= maxPagesToProcess; i++) {
      if (onProgress) onProgress(`Procesando página ${i} de ${maxPagesToProcess}...`);
      const page = await pdf.getPage(i);
      
      // Extract text
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- PÁGINA ${i} ---\n${pageText}\n\n`;

      // Extract image only for the first few pages to avoid payload size issues
      if (i <= maxImagesToExtract) {
        const viewport = page.getViewport({ scale: 0.8 }); 
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: context, viewport }).promise;
          const base64 = canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64,
            },
          });
        }
      }
    }

    const projectContext = projects.map(p => `- ${p.nombre} (${p.tipoObra}): ${p.avanceFisico}% avance. Municipio: ${p.municipio || 'N/A'}`).join('\n');
    const contractorContext = contractors.map(c => `- ${c.nombre} (NIT: ${c.nit})`).join('\n');
    const professionalContext = professionals.map(p => `- ${p.nombre} (${p.profesion}): ${p.experienciaAnios} años exp, especialidades: ${p.especialidades.join(', ')}`).join('\n');

    const previousKnowledgeContext = existingKnowledge ? `
      CONOCIMIENTO PREVIO ACUMULADO (SISTEMA DE DEEP LEARNING):
      - Caracterización anterior: ${existingKnowledge.caracterizacionRiesgo}
      - Zonas identificadas anteriormente: ${existingKnowledge.zonasRiesgo.map(z => `${z.nivel}: ${z.descripcion} (Municipio: ${z.municipio || 'N/A'})`).join('; ')}
      - Análisis estratégico anterior: ${existingKnowledge.analisisEstrategico}
      - Directrices previas: ${existingKnowledge.directricesEntidades.map(d => `${d.entidad}: ${d.contenido}`).join('; ')}
      - Noticias/Eventos previos: ${existingKnowledge.noticiasEventos.map(n => `${n.titulo} (${n.fecha})`).join('; ')}
      
      Tu misión es realizar un proceso de DEEP LEARNING INTEGRAL. Debes sumar este nuevo documento (${documentType}${municipio ? ` para el municipio ${municipio}` : ''}) al conocimiento existente, REFINANDO las conexiones entre riesgos, proyectos, contratistas y profesionales.
    ` : 'Este es el primer documento de inteligencia para este departamento. Inicia la base del sistema de Deep Learning.';

    const prompt = `
      Eres el analista de riesgos territoriales más riguroso y avanzado del mundo, especializado en Deep Learning y análisis sistémico.
      Tu tarea es analizar un nuevo documento de inteligencia de tipo "${documentType}" del departamento de ${departamento}${municipio ? `, específicamente para el municipio de ${municipio}` : ''}.
      
      ${previousKnowledgeContext}

      CONTEXTO OPERATIVO ACTUAL:
      PROYECTOS:
      ${projectContext}

      CONTRATISTAS DISPONIBLES:
      ${contractorContext}

      PROFESIONALES DISPONIBLES:
      ${professionalContext}

      Población configurada: ${poblacion} habitantes.

      INSTRUCCIONES DE ANÁLISIS (DEEP LEARNING):
      1. INTEGRACIÓN TOTAL: Cruza la información del nuevo documento con todo el conocimiento previo. No olvides nada, solo aumenta y refina.
      2. CARACTERIZACIÓN DEL RIESGO: Actualiza la caracterización profunda, considerando el impacto en la población y la infraestructura.
      3. ZONAS DE RIESGO: Identifica o actualiza zonas de riesgo específicas. Si es un POT, sé extremadamente preciso con el municipio.
      4. CRUCE CON CONTRATISTAS: Analiza si los contratistas actuales tienen la capacidad o antecedentes para manejar los riesgos identificados en este nuevo contexto.
      5. CRUCE CON PROFESIONALES: Determina si el equipo de profesionales cuenta con las especialidades necesarias para las nuevas directrices o riesgos detectados.
      6. ANÁLISIS ESTRATÉGICO: Genera un "Súper Conocimiento" consolidado que sirva como hoja de ruta crítica.

      IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido que siga esta estructura:
      {
        "caracterizacionRiesgo": "string",
        "zonasRiesgo": [{"name": "string", "level": "Alto"|"Medio"|"Bajo", "description": "string", "municipio": "string"}],
        "normativas": ["string"],
        "analisisIA": "string",
        "analisisContratistas": "string",
        "analisisProfesionales": "string",
        "noticiaEvento": {"titulo": "string", "descripcion": "string", "impacto": "string"},
        "directriz": {"entidad": "string", "contenido": "string"}
      }
    `;

    const response = await aiProviderService.generateContent(
      prompt,
      aiProviderService.getAIModel(),
      {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
      [
        { text: `CONTENIDO DEL DOCUMENTO (TEXTO EXTRAÍDO):\n${fullText}` },
        ...parts
      ]
    );

    let result;
    try {
      result = parseJSONResponse(response);
    } catch (e) {
      console.error("Error parsing AI JSON response:", e, response);
      throw new Error("La IA generó una respuesta que no pudo ser procesada. Por favor, intente de nuevo.");
    }

    return {
      id: `${documentType}-${Date.now()}`,
      departamento,
      poblacion,
      caracterizacionRiesgo: result.caracterizacionRiesgo || 'No se pudo extraer la caracterización.',
      zonasRiesgo: result.zonasRiesgo || [],
      normativas: result.normativas || [],
      analisisIA: result.analisisIA || 'No se pudo generar el análisis.',
      analisisContratistas: result.analisisContratistas,
      analisisProfesionales: result.analisisProfesionales,
      noticiaEvento: result.noticiaEvento,
      directriz: result.directriz,
      documentUrl: ''
    };

  } catch (error: any) {
    console.error("Error parsing document:", error);
    const errorMsg = error.message || String(error);
    throw new Error(`Error en el Deep Learning Territorial: ${errorMsg}`);
  }
};

export const detectPODConflicts = (project: Project, podDocuments: PODDocument[]): ProjectPODConflict[] => {
  const conflicts: ProjectPODConflict[] = [];
  
  if (!project.departamento) return conflicts;

  const relevantPOD = podDocuments.find(pod => 
    (pod.departamento || '').toLowerCase() === (project.departamento || '').toLowerCase()
  );

  if (!relevantPOD) return conflicts;

  // Simulate conflict detection based on the super knowledge
  relevantPOD.zonasRiesgo.forEach(zone => {
    if ((project.nombre || '').toLowerCase().includes((zone.name || '').toLowerCase()) || 
        (project.municipio && (zone.description || '').toLowerCase().includes((project.municipio || '').toLowerCase()))) {
      conflicts.push({
        projectId: project.id,
        conflictType: 'Zona de Riesgo',
        severity: zone.level === 'Alto' ? 'Crítico' : zone.level === 'Medio' ? 'Alto' : 'Medio',
        description: `El proyecto se encuentra en o cerca de una zona de riesgo identificada en el POD: ${zone.name} (Nivel ${zone.level}). ${zone.description}`
      });
    }
  });

  return conflicts;
};
