import { ProjectDocument, Project } from "../types";
import { aiProviderService } from "./aiProviderService";
import { parseJSONResponse } from "./geminiService";

export async function analyzeDocument(
  document: ProjectDocument,
  project: Project,
  allDocuments: ProjectDocument[]
): Promise<ProjectDocument['analysis']> {
  const prompt = `
    Analiza el siguiente documento de proyecto:
    Título: ${document.titulo}
    Descripción: ${document.descripcion}
    
    Proyecto: ${project.nombre}
    Estado actual del proyecto: ${project.estado}
    
    Otros documentos existentes: ${allDocuments.map(d => d.titulo).join(', ')}

    Por favor, realiza un análisis de "Deep Learning" sobre este documento para detectar patrones, casos exitosos en estructuración, costos, ahorros, ejecuciones e innovaciones. Responde en formato JSON con la siguiente estructura:
    {
      "summary": "string",
      "type": "modificación de plazo" | "adición presupuestal" | "suspensión" | "reinicio" | "otro",
      "importance": "crítica" | "media" | "informativa",
      "risks": ["string"],
      "impacts": {
        "schedule": "string",
        "budget": "string",
        "progress": "string"
      },
      "inconsistencies": ["string"],
      "highlightedData": [
        {
          "key": "string",
          "value": "string",
          "context": "string"
        }
      ],
      "riesgosMitigados": ["string"],
      "poblacionObjetivo": number,
      "deepLearningInsights": {
        "patronesDetectados": ["string"],
        "casosExitoEstructuracion": ["string"],
        "oportunidadesAhorro": ["string"],
        "innovacionesDetectadas": ["string"],
        "leccionesAprendidas": ["string"]
      }
    }
  `;

  const response = await aiProviderService.generateContent(
    prompt,
    aiProviderService.getAIModel(),
    {
      responseMimeType: "application/json",
    }
  );

  if (!response) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }

  return parseJSONResponse(response);
}
