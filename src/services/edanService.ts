import { generateContent, getAIModel } from './aiProviderService';
import { EmergenciaEvento, SolicitudMaquinaria } from '../types';
import { analyzeLargePDF } from './pdfExtractorService';

export const analyzeEDANDocument = async (fileOrText: File | string): Promise<Partial<EmergenciaEvento>> => {
  const prompt = `
    Eres un experto en análisis de Evaluación de Daños y Análisis de Necesidades (EDAN) de la UNGRD.
    Analiza el siguiente documento EDAN y extrae la información estructurada.
    
    Extrae la siguiente información en formato JSON estricto:
    {
      "nombre": "Nombre del evento o emergencia",
      "tipo": "Inundación | Deslizamiento | Sismo | Incendio Forestal | Sequía | Frente Frío | Otro",
      "departamentosAfectados": ["Lista de departamentos"],
      "municipiosAfectados": ["Lista de municipios"],
      "fechaInicio": "YYYY-MM-DD",
      "descripcion": "Descripción detallada del evento",
      "metrics": {
        "hectareasAfectadas": 0,
        "viviendasDanadas": 0,
        "infraestructuraAfectada": 0,
        "poblacionImpactada": 0,
        "acueductosAfectados": [{"cantidad": 0, "tipo": "Rural|Urbano|Municipal"}],
        "puentesAfectados": {"cantidad": 0, "longitudTotal": 0},
        "usuariosSinServicioPublico": 0,
        "atencionInmediata": 0,
        "maquinariaHoras": 0,
        "rehabilitacion": 0,
        "reconstruccion": 0
      },
      "solicitudesMaquinaria": [
        {
          "municipio": "Nombre municipio",
          "departamento": "Nombre departamento",
          "horasSolicitadas": 0,
          "tipoMaquinaria": "Retroexcavadora, Pajarita, etc.",
          "descripcion": "Descripción de la necesidad"
        }
      ],
      "costosOperativos": {
        "reunionesPMU": [
          {
            "fecha": "YYYY-MM-DD",
            "tema": "Tema de la reunión",
            "participantes": ["Entidad 1", "Entidad 2"]
          }
        ],
        "comisionesSugeridas": [
          {
            "departamento": "Departamento",
            "municipios": "Municipios a visitar",
            "objeto": "Objeto de la comisión",
            "numeroDias": 0,
            "perfilesRequeridos": ["Ingeniero Civil", "Geólogo", "etc."]
          }
        ],
        "maquinariaAmarilla": [
          {
            "tipo": "Retroexcavadora, Pajarita, etc.",
            "horasSugeridas": 0,
            "costoEstimado": 0
          }
        ]
      }
    }
    
    Asegúrate de que la respuesta sea un JSON válido y no incluya texto adicional antes o después.
  `;

  try {
    const currentModel = getAIModel();
    if (typeof fileOrText === 'string') {
      const fullPrompt = `${prompt}\n\nTexto del documento:\n"""\n${fileOrText}\n"""`;
      const response = await generateContent(fullPrompt, currentModel);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer JSON de la respuesta de IA');
      }
      return JSON.parse(jsonMatch[0]);
    } else {
      // It's a File
      const data = await analyzeLargePDF(fileOrText, prompt);
      return data;
    }
  } catch (error) {
    console.error('Error analyzing EDAN document:', error);
    throw error;
  }
};
