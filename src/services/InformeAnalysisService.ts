import { Type } from '@google/genai';
import { InformeAnalysis } from '../types';
import { generateContent } from './aiProviderService';

export const analyzeInforme = async (
  informeText: string, 
  docType: string, 
  fileData?: { mimeType: string; data: string }
): Promise<InformeAnalysis> => {
  const prompt = `Analiza el siguiente documento de tipo ${docType} y extrae las actividades: ${informeText}`;
  
  const responseText = await generateContent(prompt, 'gemini-3.1-pro-preview', {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                name: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['obra', 'interventoría', 'ambiental', 'social'] },
                description: { type: Type.STRING },
                metrics: {
                  type: Type.OBJECT,
                  properties: {
                    unit: { type: Type.STRING, enum: ['metros', 'm²', 'm³', 'km', 'unidad'] },
                    quantityExecuted: { type: Type.NUMBER },
                    totalQuantity: { type: Type.NUMBER },
                    progress: { type: Type.NUMBER }
                  }
                },
                cost: { type: Type.NUMBER },
                status: { type: Type.STRING, enum: ['Reportada', 'Inferida'] },
                inconsistencies: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          },
          summary: { type: Type.STRING },
          inconsistenciesDetected: { type: Type.BOOLEAN }
        }
      }
    }, fileData ? [{ inlineData: fileData }] : undefined);

  return JSON.parse(responseText) as InformeAnalysis;
};
