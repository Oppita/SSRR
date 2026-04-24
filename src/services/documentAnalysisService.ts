import { ActaComite, Suspension } from '../types';
import { extractDataFromPDF } from './pdfExtractorService';
import { Type } from '@google/genai';

export const parseActaComite = async (file: File, projectId: string): Promise<ActaComite> => {
  try {
    const prompt = `Analiza con MÁXIMO RIGOR la siguiente Acta de Comité.
    Extrae la información clave como el número del acta, la fecha, el tema central, las decisiones tomadas y las posibles afectaciones generadas al proyecto (Financiera, Social, Técnica o Legal).
    
    Devuelve un objeto JSON con la siguiente estructura:
    {
      "numero": "Número del acta (ej. 2)",
      "fecha": "Fecha del acta en formato YYYY-MM-DD",
      "temaCentral": "Tema principal tratado en el comité",
      "decisiones": ["Decisión 1", "Decisión 2"],
      "afectacionesGeneradas": [
        {
          "tipo": "Financiera" | "Social" | "Técnica" | "Legal",
          "descripcion": "Descripción de la afectación",
          "valorEstimado": 1000000 (opcional, si hay un valor financiero)
        }
      ]
    }`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        numero: { type: Type.STRING },
        fecha: { type: Type.STRING },
        temaCentral: { type: Type.STRING },
        decisiones: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        afectacionesGeneradas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              tipo: { type: Type.STRING, enum: ['Financiera', 'Social', 'Técnica', 'Legal'] },
              descripcion: { type: Type.STRING },
              valorEstimado: { type: Type.NUMBER }
            },
            required: ['tipo', 'descripcion']
          }
        }
      },
      required: ['numero', 'fecha', 'temaCentral', 'decisiones']
    };

    const data = await extractDataFromPDF(file, prompt, responseSchema);

    return {
      id: Math.random().toString(36).substring(7),
      projectId,
      numero: data.numero || 'S/N',
      fecha: data.fecha || new Date().toISOString().split('T')[0],
      temaCentral: data.temaCentral || 'Sin tema',
      decisiones: data.decisiones || [],
      afectacionesGeneradas: data.afectacionesGeneradas || [],
    };
  } catch (error) {
    console.error("Error parsing Acta de Comité:", error);
    throw new Error("No se pudo procesar el Acta de Comité. Verifique el archivo e intente nuevamente.");
  }
};

export const parseSuspension = async (file: File, projectId: string): Promise<Suspension> => {
  try {
    const prompt = `Analiza con MÁXIMO RIGOR el siguiente documento de Suspensión de contrato.
    Extrae la información clave como el número de la suspensión, la fecha de inicio, la fecha de fin (si se especifica), el plazo en meses (si aplica), el motivo principal y la justificación detallada.
    
    Devuelve un objeto JSON con la siguiente estructura:
    {
      "numero": "Número de la suspensión (ej. 1)",
      "fechaInicio": "Fecha de inicio de la suspensión en formato YYYY-MM-DD",
      "fechaFin": "Fecha de fin de la suspensión en formato YYYY-MM-DD (opcional)",
      "plazoMeses": 2 (opcional, plazo en meses si se especifica en lugar de fecha fin),
      "motivo": "Motivo principal de la suspensión",
      "justificacion": "Justificación detallada de la suspensión",
      "contractId": "Número del contrato o ID si se menciona (opcional)"
    }`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        numero: { type: Type.STRING },
        fechaInicio: { type: Type.STRING },
        fechaFin: { type: Type.STRING },
        plazoMeses: { type: Type.NUMBER },
        motivo: { type: Type.STRING },
        justificacion: { type: Type.STRING },
        contractId: { type: Type.STRING }
      },
      required: ['numero', 'fechaInicio', 'motivo', 'justificacion']
    };

    const data = await extractDataFromPDF(file, prompt, responseSchema);

    return {
      id: Math.random().toString(36).substring(7),
      contractId: data.contractId || 'Desconocido',
      numero: data.numero || 'S/N',
      fechaInicio: data.fechaInicio || new Date().toISOString().split('T')[0],
      fechaFin: data.fechaFin,
      plazoMeses: data.plazoMeses,
      motivo: data.motivo || 'Sin motivo',
      justificacion: data.justificacion || 'Sin justificación',
    };
  } catch (error) {
    console.error("Error parsing Suspensión:", error);
    throw new Error("No se pudo procesar el documento de Suspensión. Verifique el archivo e intente nuevamente.");
  }
};
