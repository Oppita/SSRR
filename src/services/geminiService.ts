import { Type } from "@google/genai";
import { ProjectData, ConocimientoTerritorial } from "../types";
import { calculateContractorPerformance } from "./performanceService";
import { generateContent, getAIModel, AIProvider } from "./aiProviderService";

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};

export const generateReportAIAnalysis = async (
  project: ProjectData,
  territorialKnowledge: ConocimientoTerritorial[]
) => {
  const model = getAIModel();

  const deptKnowledge = territorialKnowledge.filter(
    k => (k.departamento || '').toLowerCase() === (project.project.departamento || '').toLowerCase()
  );

  // Extract analysis from project documents
  const docAnalyses = project.documents?.filter(d => d.analysis).map(d => ({
    titulo: d.titulo,
    tipo: d.tipo,
    resumen: d.analysis?.summary,
    riesgosMitigados: d.analysis?.riesgosMitigados,
    impactos: d.analysis?.impacts
  })) || [];

  const prompt = `
    Analiza el siguiente proyecto en el contexto del conocimiento territorial (POD, POT, Riesgos) del departamento de ${project.project.departamento} y los documentos técnicos cargados.
    
    Proyecto:
    Nombre: ${project.project.nombre}
    Estado: ${project.project.estado}
    Avance Físico: ${project.project.avanceFisico}%
    Presupuesto: ${project.presupuesto.valorTotal}
    Justificación: ${project.project.justificacion}
    Objetivo: ${project.project.objetivoGeneral}
    
    Análisis de Documentos del Proyecto (Deep Learning):
    ${JSON.stringify(docAnalyses)}
    
    Conocimiento Territorial (Documentos analizados con Deep Learning - POD, POT, Riesgos):
    ${JSON.stringify(deptKnowledge)}
    
    Por favor, genera un análisis detallado de cómo este proyecto está contribuyendo a la disminución del riesgo en el departamento, considerando los hallazgos de los documentos territoriales y la información técnica del proyecto.
    
    Debes responder con un enfoque estratégico, evaluando si el proyecto ataca las causas raíz de los riesgos identificados en el territorio (según POD/POT) y cómo su ejecución impacta la resiliencia departamental.
  `;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analisisRiesgoTerritorial: { type: Type.STRING, description: "Análisis de cómo el proyecto contribuye a la disminución del riesgo basado en el conocimiento territorial y documentos del proyecto." },
          alineacionPOD: { type: Type.STRING, description: "Alineación del proyecto con los Planes de Ordenamiento Departamental (POD) y POT." },
          impactoResiliencia: { type: Type.STRING, description: "Evaluación del impacto del proyecto en la resiliencia del departamento." },
          recomendacionesEstrategicas: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Recomendaciones estratégicas para maximizar el impacto del proyecto en la reducción del riesgo." }
        },
        required: ["analisisRiesgoTerritorial", "alineacionPOD", "impactoResiliencia", "recomendacionesEstrategicas"]
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractEDANData = async (text: string, provider?: AIProvider) => {
  const model = getAIModel();

  const prompt = `
    Analiza el siguiente texto de un reporte EDAN (Evaluación de Daños y Análisis de Necesidades) de la UNGRD con MÁXIMO RIGOR.
    Extrae CADA CIFRA, FECHA y DATO mencionado, mapeándolo al formato JSON solicitado.
    
    Formatos de referencia:
    - FR-1703-SMD-09 (Información General)
    - FR-1900-SMD-04 (Consolidado de Daños y Necesidades)

    INSTRUCCIONES DE RIGOR:
    1. FECHAS Y HORAS: Extrae con exactitud (ej: 21/06/2022 8:00 AM).
    2. POBLACIÓN: Diferencia entre heridos, muertos, desaparecidos, familias y personas.
    3. VIVIENDAS: Diferencia entre averiadas/destruidas y urbano/rural.
    4. COSTOS: Si el texto menciona costos (ej: "Valor total estimado: 175.000.000"), extráelos. Si menciona valores unitarios (ej: "350.000 por hora"), calcúlalos o lístalos.
    5. INFRAESTRUCTURA: Identifica centros de salud, educación, vías (metros), puentes, etc.

    Estructura JSON requerida:
    {
      "generalData": {
        "diligenciador": "Nombre",
        "institucion": "Institución",
        "cargo": "Cargo",
        "fecha": "YYYY-MM-DD",
        "hora": "HH:MM",
        "evento": "Tipo de evento",
        "descripcionEvento": "Descripción breve",
        "magnitud": "Datos de referencia",
        "fechaEvento": "YYYY-MM-DD",
        "horaEvento": "HH:MM",
        "sitioEvento": "Ubicación",
        "sectoresAfectados": "Barrios/veredas",
        "eventosSecundarios": "Riesgos"
      },
      "poblacion": {
        "heridos": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "muertos": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "desaparecidos": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "familiasAfectadas": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "personasAfectadas": { "cantidad": número, "valorUnitario": número, "valorTotal": número }
      },
      "danosVivienda": {
        "averiadasUrbano": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "destruidasUrbano": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "averiadasRural": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "destruidasRural": { "cantidad": número, "valorUnitario": número, "valorTotal": número }
      },
      "infraestructura": {
        "centrosSalud": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "centrosEducativos": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "viasMetros": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "puentesVehiculares": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "puentesPeatonales": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "redesElectricas": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "acueducto": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "alcantarillado": { "cantidad": número, "valorUnitario": número, "valorTotal": número }
      },
      "serviciosPublicos": {
        "acueducto": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "alcantarillado": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "energia": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "gas": { "cantidad": número, "valorUnitario": número, "valorTotal": número }
      },
      "necesidades": {
        "mercados": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "kitsAseo": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "kitsCocina": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "frazadas": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "colchonetas": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "aguaLitros": { "cantidad": número, "valorUnitario": número, "valorTotal": número },
        "maquinariaHoras": { "cantidad": número, "valorUnitario": número, "valorTotal": número }
      },
      "costoTotalEstimado": número
    }

    Texto del reporte:
    ${text}
  `;

  const responseText = await generateContent(prompt, model, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        generalData: {
          type: Type.OBJECT,
          properties: {
            diligenciador: { type: Type.STRING },
            institucion: { type: Type.STRING },
            cargo: { type: Type.STRING },
            fecha: { type: Type.STRING },
            hora: { type: Type.STRING },
            evento: { type: Type.STRING },
            descripcionEvento: { type: Type.STRING },
            magnitud: { type: Type.STRING },
            fechaEvento: { type: Type.STRING },
            horaEvento: { type: Type.STRING },
            sitioEvento: { type: Type.STRING },
            sectoresAfectados: { type: Type.STRING },
            eventosSecundarios: { type: Type.STRING }
          }
        },
        poblacion: {
          type: Type.OBJECT,
          properties: {
            heridos: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            muertos: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            desaparecidos: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            familiasAfectadas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            personasAfectadas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } }
          }
        },
        danosVivienda: {
          type: Type.OBJECT,
          properties: {
            averiadasUrbano: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            destruidasUrbano: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            averiadasRural: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            destruidasRural: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } }
          }
        },
        infraestructura: {
          type: Type.OBJECT,
          properties: {
            centrosSalud: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            centrosEducativos: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            viasMetros: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            puentesVehiculares: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            puentesPeatonales: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            redesElectricas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            acueducto: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            alcantarillado: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } }
          }
        },
        serviciosPublicos: {
          type: Type.OBJECT,
          properties: {
            acueducto: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            alcantarillado: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            energia: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            gas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } }
          }
        },
        necesidades: {
          type: Type.OBJECT,
          properties: {
            mercados: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            kitsAseo: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            kitsCocina: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            frazadas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            colchonetas: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            aguaLitros: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } },
            maquinariaHoras: { type: Type.OBJECT, properties: { cantidad: { type: Type.NUMBER }, valorUnitario: { type: Type.NUMBER }, valorTotal: { type: Type.NUMBER } } }
          }
        },
        costoTotalEstimado: { type: Type.NUMBER }
      }
    }
  }, undefined, provider);

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const parseJSONResponse = (text: string) => {
  if (!text) return null;
  if (typeof text === 'object') return text;
  
  // 1. Basic cleaning
  let cleanText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  
  const tryParse = (str: string) => {
    try {
      return JSON.parse(str);
    } catch (e) {
      // Try to fix common JSON errors like trailing commas
      try {
        const fixedJson = str.replace(/,\s*([\]}])/g, '$1');
        return JSON.parse(fixedJson);
      } catch (e2) {
        // Try to fix truncated JSON by adding missing closing braces/brackets
        try {
          let fixed = str;
          const openBraces = (fixed.match(/\{/g) || []).length;
          const closeBraces = (fixed.match(/\}/g) || []).length;
          const openBrackets = (fixed.match(/\[/g) || []).length;
          const closeBrackets = (fixed.match(/\]/g) || []).length;
          
          if (openBraces > closeBraces) {
            fixed += '}'.repeat(openBraces - closeBraces);
          }
          if (openBrackets > closeBrackets) {
            fixed += ']'.repeat(openBrackets - closeBrackets);
          }
          return JSON.parse(fixed);
        } catch (e3) {
          return null;
        }
      }
    }
  };

  // 2. Try direct parsing
  let result = tryParse(cleanText);
  if (result) return result;

  // 3. Try to extract JSON from markdown code blocks (more aggressive)
  const codeBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/g;
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    result = tryParse(match[1].trim());
    if (result) return result;
  }
  
  // 4. Try finding the first '{' and last '}'
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const jsonCandidate = text.substring(firstBrace, lastBrace + 1);
    result = tryParse(jsonCandidate);
    if (result) return result;
  }
  
  // 5. Try finding the first '[' and last ']'
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    const jsonCandidate = text.substring(firstBracket, lastBracket + 1);
    result = tryParse(jsonCandidate);
    if (result) return result;
  }

  // 6. If still failing, try to find ANY JSON-like structure
  const anyJsonMatch = text.match(/\{[\s\S]*\}/);
  if (anyJsonMatch) {
    result = tryParse(anyJsonMatch[0]);
    if (result) return result;
  }
  
  throw new Error(`La IA no devolvió un formato de datos válido (JSON). Esto suele suceder cuando el documento no contiene la información solicitada o es ilegible. Respuesta recibida: "${text.substring(0, 150)}..."`);
};

export const extractConvenioDataFromPDF = async (file: File) => {
  const model = getAIModel();
  const base64 = await fileToBase64(file);

  const prompt = `
    Eres un auditor experto en contratación estatal y un especialista en OCR avanzado. Analiza el CONVENIO adjunto. 
    ADVERTENCIA: El documento puede ser un escaneo de baja calidad, estar torcido, tener sellos sobre el texto, o estar escrito a mano.
    
    TU MISIÓN: Extraer la información con MÁXIMO RIGOR y TOLERANCIA A FALLOS DE OCR.
    
    ESTRATEGIAS DE EXTRACCIÓN:
    1. Busca sinónimos: "N°", "Número", "No.", "Convenio Interadministrativo", "Contrato".
    2. Infiere fechas de sellos de radicación, firmas, o textos introductorios si no hay un campo explícito.
    3. Los valores monetarios pueden tener errores de OCR (ej. "S" por "$", "O" por "0"). Corrige estos errores lógicamente.
    4. Si un campo no está explícitamente etiquetado, infiere su valor por el contexto (ej. el objeto suele estar en las primeras páginas después de "CONSIDERANDO" o "ACUERDAN").
    5. NUNCA devuelvas un campo vacío si hay información que razonablemente podría corresponder a ese campo.
    
    Campos a extraer:
    - numeroConvenio: N° CONVENIO (Busca en encabezados, sellos, o primer párrafo)
    - partesConvenio: PARTES DEL CONVENIO (Quienes firman, ej. UNGRD y Municipio X)
    - objetoConvenio: OBJETO DEL CONVENIO (Suele empezar con "Aunar esfuerzos...")
    - plazoInicialMesesConvenio: PLAZO INICIAL (MESES) CONVENIO (Convierte texto a número si es necesario)
    - tiempoTotalEjecucionMeses: TIEMPO TOTAL DE EJECUCIÓN (MESES)
    - actaInicioConvenio: ACTA DE INICIO CONVENIO (Fecha YYYY-MM-DD)
    - fechaFinalizacionConvenio: FECHA FINALIZACIÓN CONVENIO (YYYY-MM-DD)
    - afectacionPresupuestal: AFECTACIÓN PRESUPUESTAL (CDP, RP, Rubro)
    - cdpConvenio: Numero de CDP CONVENIO
    - fechaCdpConvenio: Fecha de CDP CONVENIO (YYYY-MM-DD)
    - rcConvenio: Número de RC/RP CONVENIO
    - fechaRcConvenio: Fecha de RC/RP CONVENIO (YYYY-MM-DD)
    - cdpObra: Numero de CDP OBRA
    - fechaCdpObra: Fecha de CDP OBRA (YYYY-MM-DD)
    - rcObra: Número de RC/RP OBRA
    - fechaRcObra: Fecha de RC/RP OBRA (YYYY-MM-DD)
    - cdpInterventoria: Numero de CDP INTERVENTORIA
    - fechaCdpInterventoria: Fecha de CDP INTERVENTORIA (YYYY-MM-DD)
    - rcInterventoria: Número de RC/RP INTERVENTORIA
    - fechaRcInterventoria: Fecha de RC/RP INTERVENTORIA (YYYY-MM-DD)
    - afectacionesPresupuestalesAdiciones: AFECTACIONES PRESUPUESTALES ADICIONES
    - aporteMunicipioGobernacionObraInterventoria: APORTE DEL MUNICIPIO O GOBERNACION (Valor numérico)
    - aporteFngrdObraInterventoria: APORTE DEL FNGRD (Valor numérico)
    - valorTotalProyecto: VALOR TOTAL PROYECTO (Valor numérico)
    - personasBeneficiadas: PERSONAS BENEFICIADAS (Número)
    - empleosGenerados: EMPLEOS GENERADOS (Número)

    REGLA DE ORO: Realiza OCR mental profundo. Reconstruye palabras fragmentadas. Si el documento es ilegible en una parte, busca la misma información en otra sección (ej. el valor suele repetirse en letras y números).
  `;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numeroConvenio: { type: Type.STRING },
          partesConvenio: { type: Type.STRING },
          objetoConvenio: { type: Type.STRING },
          plazoInicialMesesConvenio: { type: Type.NUMBER },
          tiempoTotalEjecucionMeses: { type: Type.NUMBER },
          actaInicioConvenio: { type: Type.STRING },
          fechaFinalizacionConvenio: { type: Type.STRING },
          afectacionPresupuestal: { type: Type.STRING },
          cdpConvenio: { type: Type.STRING },
          fechaCdpConvenio: { type: Type.STRING },
          rcConvenio: { type: Type.STRING },
          fechaRcConvenio: { type: Type.STRING },
          cdpObra: { type: Type.STRING },
          fechaCdpObra: { type: Type.STRING },
          rcObra: { type: Type.STRING },
          fechaRcObra: { type: Type.STRING },
          cdpInterventoria: { type: Type.STRING },
          fechaCdpInterventoria: { type: Type.STRING },
          rcInterventoria: { type: Type.STRING },
          fechaRcInterventoria: { type: Type.STRING },
          afectacionesPresupuestalesAdiciones: { type: Type.STRING },
          aporteMunicipioGobernacionObraInterventoria: { type: Type.NUMBER },
          aporteFngrdObraInterventoria: { type: Type.NUMBER },
          valorTotalProyecto: { type: Type.NUMBER },
          personasBeneficiadas: { type: Type.NUMBER },
          empleosGenerados: { type: Type.NUMBER }
        }
      }
    }, [{ inlineData: { mimeType: file.type, data: base64 } }]);

  return parseJSONResponse(responseText);
};

export const extractActaComiteDataFromPDF = async (file: File) => {
  const model = getAIModel();
  const base64 = await fileToBase64(file);

  const prompt = `
    Eres un auditor experto. Analiza el ACTA DE COMITÉ adjunta (puede ser un escaneo de baja calidad) y extrae la información con MÁXIMO RIGOR.
    
    Debes devolver un objeto JSON con esta estructura:
    {
      "numero": "string (Número del acta)",
      "fecha": "string (YYYY-MM-DD)",
      "temaCentral": "string (Resumen del tema principal)",
      "decisiones": ["string (Lista de decisiones tomadas)"],
      "compromisosAnteriores": [
        {
          "descripcion": "string",
          "estadoActual": "string (Pendiente, En Proceso, Cumplido, Atrasado)",
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
      "estadoCronograma": {
        "fechaInicioPrevista": "string (YYYY-MM-DD)",
        "fechaFinPrevista": "string (YYYY-MM-DD)",
        "avanceFisico": number (porcentaje 0-100),
        "observaciones": "string"
      },
      "preocupaciones": ["string (Lista de preocupaciones o riesgos identificados)"],
      "afectacionesGeneradas": [
        {
          "tipo": "Financiera" | "Social" | "Técnica" | "Legal",
          "descripcion": "string",
          "valorEstimado": number
        }
      ]
    }

    REGLA DE ORO: Las actas de comité son cruciales para la contratación derivada. Identifica cualquier mención a adiciones, prórrogas o nuevas obligaciones que afecten el proyecto. Extrae con precisión los compromisos anteriores y su estado, los nuevos compromisos adquiridos, las fechas previstas de inicio y fin, el avance físico reportado, y cualquier preocupación o riesgo mencionado.
  `;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numero: { type: Type.STRING },
          fecha: { type: Type.STRING },
          temaCentral: { type: Type.STRING },
          decisiones: { type: Type.ARRAY, items: { type: Type.STRING } },
          compromisosAnteriores: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                descripcion: { type: Type.STRING },
                estadoActual: { type: Type.STRING },
                observaciones: { type: Type.STRING }
              },
              required: ["descripcion", "estadoActual"]
            }
          },
          compromisosNuevos: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                descripcion: { type: Type.STRING },
                responsable: { type: Type.STRING },
                fechaLimite: { type: Type.STRING },
                estado: { type: Type.STRING }
              },
              required: ["descripcion", "responsable", "estado"]
            }
          },
          estadoCronograma: {
            type: Type.OBJECT,
            properties: {
              fechaInicioPrevista: { type: Type.STRING },
              fechaFinPrevista: { type: Type.STRING },
              avanceFisico: { type: Type.NUMBER },
              observaciones: { type: Type.STRING }
            }
          },
          preocupaciones: { type: Type.ARRAY, items: { type: Type.STRING } },
          afectacionesGeneradas: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tipo: { type: Type.STRING, enum: ["Financiera", "Social", "Técnica", "Legal"] },
                descripcion: { type: Type.STRING },
                valorEstimado: { type: Type.NUMBER }
              },
              required: ["tipo", "descripcion"]
            }
          }
        },
        required: ["numero", "fecha", "temaCentral", "decisiones"]
      }
    }, [{ inlineData: { mimeType: file.type, data: base64 } }]);

  return parseJSONResponse(responseText);
};

export const extractConvenioData = async (text: string) => {
  const model = getAIModel();

  const prompt = `
    Eres un auditor experto en contratación estatal y un especialista en análisis de texto. Analiza el siguiente texto de un CONVENIO de la UNGRD.
    ADVERTENCIA: El texto puede provenir de un OCR imperfecto, tener errores tipográficos, palabras unidas o caracteres extraños.
    
    TU MISIÓN: Extraer la información con MÁXIMO RIGOR y TOLERANCIA A FALLOS DE OCR.
    
    ESTRATEGIAS DE EXTRACCIÓN:
    1. Busca sinónimos: "N°", "Número", "No.", "Convenio Interadministrativo", "Contrato".
    2. Infiere fechas de sellos de radicación, firmas, o textos introductorios si no hay un campo explícito.
    3. Los valores monetarios pueden tener errores de OCR (ej. "S" por "$", "O" por "0"). Corrige estos errores lógicamente.
    4. Si un campo no está explícitamente etiquetado, infiere su valor por el contexto (ej. el objeto suele estar en las primeras páginas después de "CONSIDERANDO" o "ACUERDAN").
    5. NUNCA devuelvas un campo vacío si hay información que razonablemente podría corresponder a ese campo.
    
    Campos a extraer:
    - numeroConvenio: N° CONVENIO (Busca en encabezados, sellos, o primer párrafo)
    - partesConvenio: PARTES DEL CONVENIO (Quienes firman, ej. UNGRD y Municipio X)
    - objetoConvenio: OBJETO DEL CONVENIO (Suele empezar con "Aunar esfuerzos...")
    - plazoInicialMesesConvenio: PLAZO INICIAL (MESES) CONVENIO (Convierte texto a número si es necesario)
    - tiempoTotalEjecucionMeses: TIEMPO TOTAL DE EJECUCIÓN (MESES)
    - actaInicioConvenio: ACTA DE INICIO CONVENIO (Fecha YYYY-MM-DD)
    - fechaFinalizacionConvenio: FECHA FINALIZACIÓN CONVENIO (YYYY-MM-DD)
    - afectacionPresupuestal: AFECTACIÓN PRESUPUESTAL (CDP, RP, Rubro)
    - cdpConvenio: Numero de CDP CONVENIO
    - fechaCdpConvenio: Fecha de CDP CONVENIO (YYYY-MM-DD)
    - rcConvenio: Número de RC/RP CONVENIO
    - fechaRcConvenio: Fecha de RC/RP CONVENIO (YYYY-MM-DD)
    - cdpObra: Numero de CDP OBRA
    - fechaCdpObra: Fecha de CDP OBRA (YYYY-MM-DD)
    - rcObra: Número de RC/RP OBRA
    - fechaRcObra: Fecha de RC/RP OBRA (YYYY-MM-DD)
    - cdpInterventoria: Numero de CDP INTERVENTORIA
    - fechaCdpInterventoria: Fecha de CDP INTERVENTORIA (YYYY-MM-DD)
    - rcInterventoria: Número de RC/RP INTERVENTORIA
    - fechaRcInterventoria: Fecha de RC/RP INTERVENTORIA (YYYY-MM-DD)
    - afectacionesPresupuestalesAdiciones: AFECTACIONES PRESUPUESTALES ADICIONES
    - aporteMunicipioGobernacionObraInterventoria: APORTE DEL MUNICIPIO O GOBERNACION (Valor numérico)
    - aporteFngrdObraInterventoria: APORTE DEL FNGRD (Valor numérico)
    - valorTotalProyecto: VALOR TOTAL PROYECTO (Valor numérico)
    - personasBeneficiadas: PERSONAS BENEFICIADAS (Número)
    - empleosGenerados: EMPLEOS GENERADOS (Número)

    Texto del convenio:
    ${text}
  `;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numeroConvenio: { type: Type.STRING },
          partesConvenio: { type: Type.STRING },
          objetoConvenio: { type: Type.STRING },
          plazoInicialMesesConvenio: { type: Type.NUMBER },
          tiempoTotalEjecucionMeses: { type: Type.NUMBER },
          actaInicioConvenio: { type: Type.STRING },
          fechaFinalizacionConvenio: { type: Type.STRING },
          afectacionPresupuestal: { type: Type.STRING },
          cdpConvenio: { type: Type.STRING },
          fechaCdpConvenio: { type: Type.STRING },
          rcConvenio: { type: Type.STRING },
          fechaRcConvenio: { type: Type.STRING },
          cdpObra: { type: Type.STRING },
          fechaCdpObra: { type: Type.STRING },
          rcObra: { type: Type.STRING },
          fechaRcObra: { type: Type.STRING },
          cdpInterventoria: { type: Type.STRING },
          fechaCdpInterventoria: { type: Type.STRING },
          rcInterventoria: { type: Type.STRING },
          fechaRcInterventoria: { type: Type.STRING },
          afectacionesPresupuestalesAdiciones: { type: Type.STRING },
          aporteMunicipioGobernacionObraInterventoria: { type: Type.NUMBER },
          aporteFngrdObraInterventoria: { type: Type.NUMBER },
          valorTotalProyecto: { type: Type.NUMBER },
          personasBeneficiadas: { type: Type.NUMBER },
          empleosGenerados: { type: Type.NUMBER }
        }
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractActivityData = async (text: string) => {
  const model = getAIModel();

  const prompt = `
    Analiza el siguiente texto (puede ser un acta de PMU, una citación a reunión, o un informe técnico) y extrae los datos de la actividad.
    
    Campos a extraer:
    - title: Título o nombre de la actividad.
    - type: Tipo de actividad (PMU, Reunión, Comité, Visita, Otra).
    - date: Fecha de la actividad (YYYY-MM-DD).
    - durationHours: Duración estimada en horas (número).
    - phenomenon: Fenómeno asociado (ej: Frente Frío, Inundación).
    - description: Resumen de lo tratado o el objetivo.
    - participantEmails: Lista de correos electrónicos de los participantes mencionados.
    
    Texto:
    ${text}
  `;

  const responseText = await generateContent(prompt, model, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        type: { type: Type.STRING, enum: ['PMU', 'Reunión', 'Comité', 'Visita', 'Otra'] },
        date: { type: Type.STRING },
        durationHours: { type: Type.NUMBER },
        phenomenon: { type: Type.STRING },
        description: { type: Type.STRING },
        participantEmails: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ['title', 'type', 'date', 'durationHours', 'description']
    }
  });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractCommissionData = async (text: string) => {
  const model = getAIModel();

  const prompt = `
    Analiza el siguiente texto (resolución de comisión, solicitud de viáticos, plan de viaje o texto copiado de una tabla) y extrae los datos de la comisión de acuerdo al formato institucional.
    
    Campos a extraer con alta precisión:
    - tipoVinculacion: 'CONTRATISTA' | 'FUNCIONARIO' | 'OTRO'
    - responsableNombre: Nombre completo del responsable.
    - tipoComision: Tipo de comisión (ej. INVITACION, TECNICA, etc).
    - proyectoNombre: Nombre del proyecto asociado (ej. PNUD, SRR, etc).
    - departamento: Departamento de la comisión.
    - municipios: Municipios de la comisión.
    - objeto: Objeto de la comisión o desplazamiento.
    - fechaInicio: Fecha de inicio (YYYY-MM-DD).
    - fechaFin: Fecha de terminación (YYYY-MM-DD).
    - anio: Año de la comisión (number).
    - numeroDias: Número de días (number, puede ser decimal ej 14.5).
    - requiereViaticos: ¿Requiere pago de viáticos? (boolean).
    - transporteTerrestre: ¿Usa transporte terrestre? (boolean).
    - rutaAerea: Ruta aérea si aplica (ej. N.A o BOG-CTG).
    - autorizadoVB: Estado de autorización (ej. CANCELADA, AUTORIZADA, V.°B°).
    - planTrabajo1: Detalle del plan de trabajo 1.
    - planTrabajo2: Detalle del plan de trabajo 2.
    - planTrabajo3: Detalle del plan de trabajo 3.
    - linkSoporte: Link de soporte si existe.
    - fechaSolicitudFuncionario: Fecha en que el funcionario realizó la solicitud (YYYY-MM-DD).
    - fechaSolicitud: Día de solicitud oficial (YYYY-MM-DD).
    - fechaAprobacionSG: Día de aprobación por SG o emisión de tiquete (YYYY-MM-DD).
    - diasGestionHabiles: Días que tardó la gestión en días hábiles (number).
    
    Texto:
    ${text}
  `;

  const responseText = await generateContent(prompt, model, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        tipoVinculacion: { type: Type.STRING },
        responsableNombre: { type: Type.STRING },
        tipoComision: { type: Type.STRING },
        proyectoNombre: { type: Type.STRING },
        departamento: { type: Type.STRING },
        municipios: { type: Type.STRING },
        objeto: { type: Type.STRING },
        fechaInicio: { type: Type.STRING },
        fechaFin: { type: Type.STRING },
        anio: { type: Type.NUMBER },
        numeroDias: { type: Type.NUMBER },
        requiereViaticos: { type: Type.BOOLEAN },
        transporteTerrestre: { type: Type.BOOLEAN },
        rutaAerea: { type: Type.STRING },
        autorizadoVB: { type: Type.STRING },
        planTrabajo1: { type: Type.STRING },
        planTrabajo2: { type: Type.STRING },
        planTrabajo3: { type: Type.STRING },
        linkSoporte: { type: Type.STRING },
        fechaSolicitudFuncionario: { type: Type.STRING },
        fechaSolicitud: { type: Type.STRING },
        fechaAprobacionSG: { type: Type.STRING },
        diasGestionHabiles: { type: Type.NUMBER }
      },
      required: ['tipoVinculacion', 'responsableNombre', 'objeto', 'fechaInicio', 'fechaFin']
    }
  });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractProjectData = async (text: string) => {
  const model = getAIModel();

  const prompt = `Analiza el siguiente texto y extrae la información del proyecto siguiendo el formato oficial de la matriz institucional de la Subdirección de Reducción del Riesgo (SRR). 
        Texto: ${text}
        
        Debes devolver un objeto JSON que mapee los campos a la interfaz ProjectMatrix y Project.
        Campos clave a extraer para la matriz oficial:
        - codigoDepartamento, codigoMunicipio, clave (si aparecen)
        - numeroConvenio, partesConvenio, objetoConvenio
        - plazoInicialMesesConvenio, tiempoTotalEjecucionMeses
        - actaInicioConvenio, fechaFinalizacionConvenio
        - afectacionPresupuestal, cdpConvenio, fechaCdpConvenio, rcConvenio, fechaRcConvenio
        - cdpObra, fechaCdpObra, rcObra, fechaRcObra
        - cdpInterventoria, fechaCdpInterventoria, rcInterventoria, fechaRcInterventoria
        - valorTotalProyecto, personasBeneficiadas, empleosGenerados
        - numeroContratoObra, objetoObra, valorContratoObra, contratistaObra, nitContratistaObra, valorPagadoObra
        - numeroContratoInterventoria, objetoInterventoria, valorContratoInterventoria, contratistaInterventoria, nitContratistaInterventoria, valorPagadoInterventoria
        - Y todos los demás campos de la matriz oficial (fechas, avances, estados, permisos, seguimientos, valorPagadoConvenio, etc.)
        
        Campos generales del proyecto:
        - nombre, departamento, municipio, linea, vigencia, tipoObra, justificacion, objetivoGeneral, objetivosEspecificos (array), alcance, beneficiarios.
        
        INSTRUCCIÓN CRÍTICA Y RIGUROSA:
        1. AVANCES: Extrae con precisión milimétrica el 'avanceFisico', 'avanceProgramado', 'avanceFinancieroObra', 'avanceFinancieroInterventoria' y 'avanceFinancieroPonderado'. Si encuentras porcentajes de avance en el texto, asígnalos correctamente.
        2. PAGOS: Extrae con exactitud los valores pagados ('valorPagadoObra', 'valorPagadoInterventoria', 'valorPagadoConvenio'). Si se mencionan pagos de actividades, súmalos o asígnalos al campo correspondiente.
        3. BENEFICIARIOS: Extrae rigurosamente la cantidad y descripción de los 'beneficiarios' (y 'personasBeneficiadas'). Consígnalo de forma clara y completa.
        
        Si detectas que el proyecto ya tiene contrato de obra y acta de inicio, sugiere el estado como 'En ejecución' o 'Ejecución Directa'.`;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          departamento: { type: Type.STRING },
          municipio: { type: Type.STRING },
          linea: { type: Type.STRING },
          vigencia: { type: Type.STRING },
          tipoObra: { type: Type.STRING },
          fechaInicio: { type: Type.STRING },
          fechaFin: { type: Type.STRING },
          justificacion: { type: Type.STRING },
          objetivoGeneral: { type: Type.STRING },
          objetivosEspecificos: { type: Type.ARRAY, items: { type: Type.STRING } },
          alcance: { type: Type.STRING },
          beneficiarios: { type: Type.STRING },
          matrix: {
            type: Type.OBJECT,
            properties: {
              codigoDepartamento: { type: Type.STRING },
              codigoMunicipio: { type: Type.STRING },
              clave: { type: Type.STRING },
              numeroConvenio: { type: Type.STRING },
              partesConvenio: { type: Type.STRING },
              objetoConvenio: { type: Type.STRING },
              plazoInicialMesesConvenio: { type: Type.NUMBER },
              tiempoTotalEjecucionMeses: { type: Type.NUMBER },
              actaInicioConvenio: { type: Type.STRING },
              fechaFinalizacionConvenio: { type: Type.STRING },
              afectacionPresupuestal: { type: Type.STRING },
              cdpConvenio: { type: Type.STRING },
              fechaCdpConvenio: { type: Type.STRING },
              rcConvenio: { type: Type.STRING },
              fechaRcConvenio: { type: Type.STRING },
              cdpObra: { type: Type.STRING },
              fechaCdpObra: { type: Type.STRING },
              rcObra: { type: Type.STRING },
              fechaRcObra: { type: Type.STRING },
              cdpInterventoria: { type: Type.STRING },
              fechaCdpInterventoria: { type: Type.STRING },
              rcInterventoria: { type: Type.STRING },
              fechaRcInterventoria: { type: Type.STRING },
              afectacionesPresupuestalesAdiciones: { type: Type.STRING },
              aporteMunicipioGobernacionObraInterventoria: { type: Type.NUMBER },
              aporteFngrdObraInterventoria: { type: Type.NUMBER },
              valorTotalProyecto: { type: Type.NUMBER },
              personasBeneficiadas: { type: Type.NUMBER },
              empleosGenerados: { type: Type.NUMBER },
              numeroContratoObra: { type: Type.STRING },
              objetoObra: { type: Type.STRING },
              valorContratoObra: { type: Type.NUMBER },
              contratistaObra: { type: Type.STRING },
              conformacionLegalObra: { type: Type.STRING },
              nitContratistaObra: { type: Type.STRING },
              numeroContratoInterventoria: { type: Type.STRING },
              objetoInterventoria: { type: Type.STRING },
              valorContratoInterventoria: { type: Type.NUMBER },
              contratistaInterventoria: { type: Type.STRING },
              conformacionLegalInterventoria: { type: Type.STRING },
              nitContratistaInterventoria: { type: Type.STRING },
              valorObraInterventoria: { type: Type.NUMBER },
              aporteFondo: { type: Type.NUMBER },
              fechaSuscripcionInterventoria: { type: Type.STRING },
              fechaInicioObra: { type: Type.STRING },
              fechaFinalizacionInicial: { type: Type.STRING },
              fechaFinalizacionActual: { type: Type.STRING },
              mesFinalizacionActual: { type: Type.STRING },
              anioFinalizacionActual: { type: Type.STRING },
              fechaPerdidaCompetenciaLiquidacion: { type: Type.STRING },
              anioPerdidaCompetencia: { type: Type.STRING },
              mesPerdidaCompetencia: { type: Type.STRING },
              valorContraLiquidacionObra: { type: Type.NUMBER },
              valorContraLiquidacionInterventoria: { type: Type.NUMBER },
              avanceProgramado: { type: Type.NUMBER },
              avanceFisico: { type: Type.NUMBER },
              avanceFinancieroObra: { type: Type.NUMBER },
              avanceFinancieroInterventoria: { type: Type.NUMBER },
              avanceFinancieroPonderado: { type: Type.NUMBER },
              valorPagadoConvenio: { type: Type.NUMBER },
              valorPagadoObra: { type: Type.NUMBER },
              valorPagadoInterventoria: { type: Type.NUMBER },
              estadoObra: { type: Type.STRING },
              estadoInterventoria: { type: Type.STRING },
              estadoProyecto: { type: Type.STRING },
              apoyoTecnicoAntigüo: { type: Type.STRING },
              apoyoFinanciero: { type: Type.STRING },
              apoyoJuridico: { type: Type.STRING },
              apoyoJuridico2026: { type: Type.STRING },
              apoyoTecnico: { type: Type.STRING },
              apoyoTecnico2026: { type: Type.STRING },
              atrasoEjecucionObra: { type: Type.NUMBER },
              diasRestantesFinalizacion: { type: Type.NUMBER },
              entregaMunicipio: { type: Type.STRING },
              fechaEntregaMunicipio: { type: Type.STRING },
              detalleEstado: { type: Type.STRING },
              anioVencimientoLiquidacion: { type: Type.STRING },
              mesVencimiento: { type: Type.STRING },
              regalias: { type: Type.STRING },
              vencioTerminosLiquidacion: { type: Type.STRING },
              afectaciones: { type: Type.STRING },
              ejecucionAl100: { type: Type.STRING },
              liquidacionJudicialObra: { type: Type.STRING },
              liquidacionJudicialInterventoria: { type: Type.STRING },
              inhabilidadObra: { type: Type.STRING },
              inhabilidadInterventoria: { type: Type.STRING },
              seguimientoEntesControl: { type: Type.STRING },
              pendienteFidu: { type: Type.STRING },
              detalleSeguimientoEntesControl: { type: Type.STRING },
              alertaSarlaft: { type: Type.STRING },
              detalleAlerta: { type: Type.STRING },
              detalleIncumplimiento: { type: Type.STRING },
              detalleConciliacionPrejudicial: { type: Type.STRING },
              autoridadAmbientalCompetente: { type: Type.STRING },
              requierePermisoOcupacionCauce: { type: Type.STRING },
              tramitoPermisoOcupacionCauce: { type: Type.STRING },
              numeroResolucionOcupacionCauce: { type: Type.STRING },
              fechaSolicitudOcupacionCauce: { type: Type.STRING },
              fechaResolucionOcupacionCauce: { type: Type.STRING },
              alcanceResolucion: { type: Type.STRING },
              alcanceRealObra: { type: Type.STRING },
              brechaIdentificada: { type: Type.STRING },
              requierePermisoAprovechamientoForestal: { type: Type.STRING },
              tramitePermisoAprovechamientoForestal: { type: Type.STRING },
              numeroResolucionAprovechamientoForestal: { type: Type.STRING },
              fechaTramiteAprovechamientoForestal: { type: Type.STRING },
              fechaPermisoAprovechamientoForestal: { type: Type.STRING },
              especificacionPermiso: { type: Type.STRING },
              analisisMultitemporalAdjunto: { type: Type.STRING },
              evidenciaFotografica: { type: Type.STRING },
              compensacionesExigidas: { type: Type.STRING },
              inversion1Pct: { type: Type.STRING },
              estadoCumplimiento1Pct: { type: Type.STRING },
              observacionesGenerales: { type: Type.STRING },
              avancesReportadosInterventoria: { type: Type.STRING },
              avancesReportadosEnteTerritorial: { type: Type.STRING },
              avancesReportadosAutoridadAmbiental: { type: Type.STRING },
              seguimientoSubdirectoraSept2025: { type: Type.STRING },
              seguimientoSubdirectoraOct2025: { type: Type.STRING },
              seguimientoNov11_2025: { type: Type.STRING },
              seguimientoNov20_2025: { type: Type.STRING },
              seguimientoDic05_2025: { type: Type.STRING },
              seguimientoDic12_2025: { type: Type.STRING },
              seguimientoDic13_2025: { type: Type.STRING },
              seguimientoEne08_2026: { type: Type.STRING },
              seguimientoEne22_2026: { type: Type.STRING },
              seguimientoFeb06_2026: { type: Type.STRING },
              seguimientoFeb16_2026: { type: Type.STRING },
              seguimientoFeb24_2026: { type: Type.STRING },
              seguimientoMar02_2026: { type: Type.STRING },
              seguimientoMar16_2026: { type: Type.STRING },
            }
          }
        }
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const analyzeCommissionReport = async (file: File) => {
  const model = getAIModel();
  
  const reader = new FileReader();
  const base64Data = await new Promise<string>((resolve) => {
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  const base64Content = base64Data.split(',')[1];

  const prompt = `
    Eres un experto en gestión del riesgo de desastres en Colombia. Tu tarea es analizar un informe de comisión de la UNGRD (Unidad Nacional para la Gestión del Riesgo de Desastres).
    Extrae la información clave siguiendo la estructura oficial de informes técnicos de la entidad.
    
    Debes devolver un objeto JSON con los siguientes campos:
    - actividades: string (Resumen detallado de las actividades técnicas y de supervisión realizadas)
    - hallazgos: string (Hallazgos técnicos, situaciones detectadas en terreno y estado de las obras/procesos)
    - conclusiones: string (Conclusiones técnicas sobre el cumplimiento de los objetivos de la comisión)
    - recomendaciones: string (Recomendaciones técnicas y acciones a seguir para la mitigación del riesgo o avance del proyecto)
    - fechaGeneracion: string (Fecha de generación del informe en formato YYYY-MM-DD)
  `;

  const extraParts = [
    { inlineData: { data: base64Content, mimeType: file.type } }
  ];

  const responseText = await generateContent(
    prompt,
    model,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actividades: { type: Type.STRING },
          hallazgos: { type: Type.STRING },
          conclusiones: { type: Type.STRING },
          recomendaciones: { type: Type.STRING },
          fechaGeneracion: { type: Type.STRING }
        },
        required: ["actividades", "hallazgos", "conclusiones", "recomendaciones", "fechaGeneracion"]
      }
    },
    extraParts
  );

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const analyzePolicyText = async (text: string, modelName: string = "gemini-3-flash-preview", contractContext?: any) => {
  const prompt = `Analiza el siguiente texto que contiene información de una póliza o garantía.
  Extrae la información detallada según los campos requeridos.
  
  ${contractContext ? `CONTEXTO DEL CONTRATO:
  - Número: ${contractContext.numero}
  - Valor: ${contractContext.valorActual}
  - Fecha Inicio: ${contractContext.fechaInicio}
  - Fecha Fin: ${contractContext.fechaFin}
  ` : ''}

  Texto: ${text}
  
  Campos a extraer:
  - tipo_amparo: El tipo de amparo (ej: Buen manejo del anticipo, Cumplimiento, Salarios, Estabilidad, Calidad).
  - numero_poliza: El número identificador de la póliza.
  - valor_asegurado: El valor total asegurado (número).
  - numero_certificado_anexo: El número de certificado o anexo si aplica.
  - entidad_aseguradora: Nombre de la compañía de seguros.
  - tipo_garantia: Tipo de garantía (ej: Contrato de seguro, Garantía bancaria).
  - fecha_expedicion: Fecha en que se expidió la póliza (YYYY-MM-DD).
  - fecha_aprobacion: Fecha en que fue aprobada por la entidad (YYYY-MM-DD).
  - fecha_inicio_vigencia: Fecha de inicio de la cobertura (YYYY-MM-DD).
  - fecha_finalizacion_vigencia: Fecha de fin de la cobertura (YYYY-MM-DD).
  - apoyo_supervision: Nombre de la persona de apoyo a la supervisión mencionada.
  - riesgo_cubierto: Descripción del riesgo que cubre.
  - estado: Estado actual mencionado (ej: VIGENTE, LIQUIDADO).
  
  VALIDACIÓN ADICIONAL:
  - Compara las fechas de la póliza con las del contrato.
  - Compara el valor asegurado con el valor del contrato.
  - Detecta inconsistencias legales.
  - Valida el cumplimiento de la Ley 1523 de 2012 (Sistema Nacional de Gestión del Riesgo de Desastres) en el contexto de la gestión del riesgo y aseguramiento.
  - Devuelve un campo 'validacion_ia' con:
    { 
      "coherente": boolean, 
      "observaciones": string, 
      "inconsistencias": string[],
      "cumplimiento_ley_1523": {
        "cumple": boolean,
        "analisis": string,
        "articulos_relacionados": string[]
      }
    }`;

  const responseText = await generateContent(
    prompt,
    modelName,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tipo_amparo: { type: Type.STRING },
          numero_poliza: { type: Type.STRING },
          valor_asegurado: { type: Type.NUMBER },
          numero_certificado_anexo: { type: Type.STRING },
          entidad_aseguradora: { type: Type.STRING },
          tipo_garantia: { type: Type.STRING },
          fecha_expedicion: { type: Type.STRING },
          fecha_aprobacion: { type: Type.STRING },
          fecha_inicio_vigencia: { type: Type.STRING },
          fecha_finalizacion_vigencia: { type: Type.STRING },
          apoyo_supervision: { type: Type.STRING },
          riesgo_cubierto: { type: Type.STRING },
          estado: { type: Type.STRING },
          validacion_ia: {
            type: Type.OBJECT,
            properties: {
              coherente: { type: Type.BOOLEAN },
              observaciones: { type: Type.STRING },
              inconsistencias: { type: Type.ARRAY, items: { type: Type.STRING } },
              cumplimiento_ley_1523: {
                type: Type.OBJECT,
                properties: {
                  cumple: { type: Type.BOOLEAN },
                  analisis: { type: Type.STRING },
                  articulos_relacionados: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    }
  );

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const analyzePolicyDocument = async (file: File, modelName: string = "gemini-3-flash-preview", contractContext?: any) => {
  const base64Content = await fileToBase64(file);
  
  const prompt = `Analiza el siguiente documento de póliza o garantía de cumplimiento.
  Extrae la información detallada según los campos requeridos para la gestión de contratos en Colombia.
  
  ${contractContext ? `CONTEXTO DEL CONTRATO:
  - Número: ${contractContext.numero}
  - Valor: ${contractContext.valorActual}
  - Fecha Inicio: ${contractContext.fechaInicio}
  - Fecha Fin: ${contractContext.fechaFin}
  ` : ''}

  Campos a extraer:
  - tipo_amparo: El tipo de amparo (ej: Buen manejo del anticipo, Cumplimiento, Salarios, Estabilidad, Calidad).
  - numero_poliza: El número identificador de la póliza.
  - valor_asegurado: El valor total asegurado (número).
  - numero_certificado_anexo: El número de certificado o anexo si aplica.
  - entidad_aseguradora: Nombre de la compañía de seguros.
  - tipo_garantia: Tipo de garantía (ej: Contrato de seguro, Garantía bancaria).
  - fecha_expedicion: Fecha en que se expidió la póliza (YYYY-MM-DD).
  - fecha_aprobacion: Fecha en que fue aprobada por la entidad (YYYY-MM-DD).
  - fecha_inicio_vigencia: Fecha de inicio de la cobertura (YYYY-MM-DD).
  - fecha_finalizacion_vigencia: Fecha de fin de la cobertura (YYYY-MM-DD).
  - apoyo_supervision: Nombre de la persona de apoyo a la supervisión mencionada.
  - riesgo_cubierto: Descripción del riesgo que cubre.
  - estado: Estado actual mencionado (ej: VIGENTE, LIQUIDADO).
  
  VALIDACIÓN ADICIONAL:
  - Compara las fechas de la póliza con las del contrato.
  - Compara el valor asegurado con el valor del contrato.
  - Detecta inconsistencias legales.
  - Valida el cumplimiento de la Ley 1523 de 2012 (Sistema Nacional de Gestión del Riesgo de Desastres) en el contexto de la gestión del riesgo y aseguramiento.
  - Devuelve un campo 'validacion_ia' con:
    { 
      "coherente": boolean, 
      "observaciones": string, 
      "inconsistencias": string[],
      "cumplimiento_ley_1523": {
        "cumple": boolean,
        "analisis": string,
        "articulos_relacionados": string[]
      }
    }`;

  const extraParts = [
    { inlineData: { data: base64Content, mimeType: file.type } }
  ];

  const responseText = await generateContent(
    prompt,
    modelName,
    {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tipo_amparo: { type: Type.STRING },
          numero_poliza: { type: Type.STRING },
          valor_asegurado: { type: Type.NUMBER },
          numero_certificado_anexo: { type: Type.STRING },
          entidad_aseguradora: { type: Type.STRING },
          tipo_garantia: { type: Type.STRING },
          fecha_expedicion: { type: Type.STRING },
          fecha_aprobacion: { type: Type.STRING },
          fecha_inicio_vigencia: { type: Type.STRING },
          fecha_finalizacion_vigencia: { type: Type.STRING },
          apoyo_supervision: { type: Type.STRING },
          riesgo_cubierto: { type: Type.STRING },
          estado: { type: Type.STRING },
          validacion_ia: {
            type: Type.OBJECT,
            properties: {
              coherente: { type: Type.BOOLEAN },
              observaciones: { type: Type.STRING },
              inconsistencias: { type: Type.ARRAY, items: { type: Type.STRING } },
              cumplimiento_ley_1523: {
                type: Type.OBJECT,
                properties: {
                  cumple: { type: Type.BOOLEAN },
                  analisis: { type: Type.STRING },
                  articulos_relacionados: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
              }
            }
          }
        }
      }
    },
    extraParts
  );

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractContractData = async (text: string) => {
  const model = getAIModel();

  const prompt = `Analiza el siguiente texto y extrae la información de un contrato de obra, interventoría o consultoría.
        Texto: ${text}
        
        Debes devolver un objeto JSON que mapee los campos a la interfaz Contract.
        Campos a extraer:
        - numero, objetoContractual, valor, plazoMeses, contratista, nit, fechaInicio, fechaFin, estado, tipo.`;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          numero: { type: Type.STRING },
          objetoContractual: { type: Type.STRING },
          valor: { type: Type.NUMBER },
          plazoMeses: { type: Type.NUMBER },
          contratista: { type: Type.STRING },
          nit: { type: Type.STRING },
          fechaInicio: { type: Type.STRING },
          fechaFin: { type: Type.STRING },
          estado: { type: Type.STRING },
          tipo: { type: Type.STRING }
        }
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const extractProfessionalData = async (text: string) => {
  const model = getAIModel();
  console.log('Raw text to extract:', text);

  // Intentar parseo manual primero (TSV)
  const lines = text.split('\n').filter(line => line.trim() !== '');
  
  // Buscar una línea que no sea encabezado
  const dataLine = lines.find(line => 
    !line.toUpperCase().includes('CONTRATISTA') && 
    !line.toUpperCase().includes('NUMERO DE CONTRATO') &&
    line.split('\t').length >= 15 // Mínimo de campos esperados
  );

  if (dataLine) {
    const parts = dataLine.split('\t');
    console.log('Manual TSV parsing successful. Parts:', parts);
    
    const parsed: any = {
      nombre: parts[2]?.trim() || '',
      numeroContrato: parts[3]?.trim() || '',
      profesion: parts[13]?.trim() || '',
      salarioMensual: parseFloat(parts[18]?.replace(/[^0-9]/g, '') || '0'),
      valorTotalContrato: parseFloat(parts[19]?.replace(/[^0-9]/g, '') || '0'),
      supervisor: parts[9]?.trim() || '',
      fechaInicio: parts[10]?.trim() || '',
      fechaFinalizacion: parts[11]?.trim() || '',
      ciudad: parts[12]?.trim() || '',
      objetoContrato: parts[17]?.trim() || '',
      formacionAcademica: [parts[13], parts[14], parts[15], parts[16]].filter(Boolean).map(s => s.trim()),
      especialidades: [parts[6], parts[7]].filter(Boolean).map(s => s.trim()),
      departamentosExperiencia: [parts[1]].filter(Boolean).map(s => s.trim()),
      experienciaAnios: 0
    };
    console.log('Manually extracted professional data:', parsed);
    return parsed;
  }

  // Fallback a IA si el parseo manual falla
  console.log('Manual parsing failed, falling back to AI');
  const prompt = `Analiza el siguiente texto, que contiene datos separados por tabulaciones (TSV), y extrae la información del profesional siguiendo estrictamente esta estructura de matriz:
        N° | AREA | CONTRATISTA | NUMERO DE CONTRATO | PLANTA | CONTRATISTA | MODALIDAD DE TRABAJO | Grupo al que pertenece | Lider | Supervisor contrato | Fecha de Inicio de Contrato | Fecha de Finalización de Contrato | Lugar de ejecución del contrato | Pregrado | Posgrado 1 | Posgrado 2 | Posgrado 3 | Objeto Contrato | HONORARIOS MES | VALOR CONTRATO
        
        Texto (datos separados por tabulaciones):
        ${text}
        
        Devuelve el JSON con esta estructura:
        {
          "nombre": "string",
          "profesion": "string",
          "experienciaAnios": number,
          "salarioMensual": number,
          "gastosRepresentacion": number,
          "incrementoAntiguedad": number,
          "valorTotalContrato": number,
          "numeroContrato": "string",
          "objetoContrato": "string",
          "supervisor": "string",
          "fechaInicio": "string",
          "fechaFinalizacion": "string",
          "ciudad": "string",
          "especialidades": ["string"],
          "departamentosExperiencia": ["string"],
          "formacionAcademica": ["string"]
        }`;

  const responseText = await generateContent(prompt, model, {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          nombre: { type: Type.STRING },
          profesion: { type: Type.STRING },
          experienciaAnios: { type: Type.NUMBER },
          salarioMensual: { type: Type.NUMBER },
          gastosRepresentacion: { type: Type.NUMBER },
          incrementoAntiguedad: { type: Type.NUMBER },
          valorTotalContrato: { type: Type.NUMBER },
          numeroContrato: { type: Type.STRING },
          objetoContrato: { type: Type.STRING },
          supervisor: { type: Type.STRING },
          fechaInicio: { type: Type.STRING },
          fechaFinalizacion: { type: Type.STRING },
          ciudad: { type: Type.STRING },
          especialidades: { type: Type.ARRAY, items: { type: Type.STRING } },
          departamentosExperiencia: { type: Type.ARRAY, items: { type: Type.STRING } },
          formacionAcademica: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  const parsed = parseJSONResponse(responseText);
  console.log('Extracted professional data via AI:', parsed);
  return parsed;
};

export const generateShockPlan = async (project: ProjectData) => {
  const model = getAIModel();

  const prompt = `
    Como experto en gestión de proyectos de infraestructura y reducción del riesgo de la UNGRD, genera un "Plan de Choque" real y detallado para el siguiente proyecto que presenta desviaciones o riesgos.
    
    Información del Proyecto:
    Nombre: ${project.project.nombre}
    Ubicación: ${project.project.municipio}, ${project.project.departamento}
    Avance Físico: ${project.project.avanceFisico}%
    Avance Programado: ${project.project.avanceProgramado}%
    Retraso Estimado: ${Math.max(0, project.project.avanceProgramado - project.project.avanceFisico)}%
    Presupuesto Total: ${project.presupuesto.valorTotal}
    Estado: ${project.project.estado}
    
    Alertas Activas:
    ${JSON.stringify(project.alerts.map(a => ({ tipo: a.tipo, nivel: a.nivel, descripcion: a.descripcion })))}
    
    Contratos:
    ${JSON.stringify(project.contracts.map(c => ({ numero: c.numero, tipo: c.tipo, contratista: c.contractorId, valor: c.valor })))}

    El Plan de Choque debe ser una estrategia agresiva para recuperar el cronograma y mitigar riesgos críticos.
    Debe incluir:
    1. Un resumen ejecutivo de la situación.
    2. Objetivos inmediatos (próximos 30 días).
    3. Acciones específicas categorizadas (Técnicas, Administrativas, Financieras, Sociales/Ambientales).
    4. Cronograma de hitos críticos de recuperación.
    5. Indicadores de éxito del plan.

    Responde estrictamente en formato JSON.
  `;

  const responseText = await generateContent(prompt, model, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        resumenSituacion: { type: Type.STRING },
        objetivosInmediatos: { type: Type.ARRAY, items: { type: Type.STRING } },
        accionesEspecificas: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              categoria: { type: Type.STRING, description: "Técnica, Administrativa, Financiera, Social, Ambiental" },
              accion: { type: Type.STRING },
              responsable: { type: Type.STRING },
              plazo: { type: Type.STRING }
            },
            required: ["categoria", "accion", "responsable", "plazo"]
          }
        },
        hitosRecuperacion: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              hito: { type: Type.STRING },
              fechaEstimada: { type: Type.STRING }
            },
            required: ["hito", "fechaEstimada"]
          }
        },
        indicadoresExito: { type: Type.ARRAY, items: { type: Type.STRING } }
      },
      required: ["resumenSituacion", "objetivosInmediatos", "accionesEspecificas", "hitosRecuperacion", "indicadoresExito"]
    }
  });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};

export const getAIResponse = async (prompt: string, projects: ProjectData[]) => {
  const model = getAIModel();
  
  // Calculate performance for all contractors
  const allContractors = Array.from(new Set(projects.flatMap(p => p.contracts.map(c => c.contractorId))));
  const contractorPerformance = allContractors.map(contractorId => ({
    contractorId,
    metrics: calculateContractorPerformance(
      contractorId,
      projects.flatMap(p => p.contracts),
      projects.flatMap(p => p.otrosies),
      projects.flatMap(p => p.alerts),
      [], // Need to pass evaluations, but I don't have them in ProjectData directly.
      projects.map(p => p.project)
    )
  }));

  const systemInstruction = `
    Eres el Asistente de Inteligencia SRR (Seguimiento, Reporte y Riesgos) de la Unidad Nacional para la Gestión del Riesgo de Desastres (UNGRD).
    Tu objetivo es ayudar a los coordinadores a analizar el portafolio de proyectos, contratistas y documentos.
    
    Capacidades:
    1. Consultar contratistas: historial de contratos, desempeño y alertas.
    2. Analizar desempeño: identificar contratistas con más retrasos.
    3. Consultar documentos: buscar contratos de obra, interventoría, etc.
    4. Generar gráficos: puedes sugerir visualizaciones de datos.
    5. Detectar inconsistencias: entre documentos, avances y contratos.
    6. Sugerir acciones correctivas en tiempo real.
    7. Analizar desempeño histórico de contratistas para sugerir contratistas en nuevos proyectos.
    8. Deep Learning de Documentos: Analizar informes, contratos y proyectos para detectar patrones, casos exitosos en estructuración, costos, ahorros, ejecuciones e innovaciones.
    
    ¡IMPORTANTE SOBRE BENEFICIARIOS!: La información sobre el número y descripción de beneficiarios SÍ está disponible en la propiedad "beneficiarios" de cada proyecto. Debes usar esta información directa y explícitamente cuando se te pregunte por impacto social, población protegida o cantidad de beneficiarios. NO digas que la información no está consolidada.

    Información del Portafolio:
    ${JSON.stringify(projects.map(p => ({
      id: p.project.id,
      nombre: p.project.nombre,
      departamento: p.project.departamento,
      municipio: p.project.municipio,
      estado: p.project.estado,
      avanceFisico: p.project.avanceFisico,
      avanceProgramado: p.project.avanceProgramado,
      presupuesto: p.presupuesto.valorTotal,
      beneficiarios: p.project.beneficiarios,
      contratos: p.contracts.map(c => ({
        id: c.id,
        numero: c.numero,
        tipo: c.tipo,
        contractorId: c.contractorId,
        valor: c.valor,
        fechaFin: c.fechaFin,
        analisis: c.analysis // Incluir análisis de deep learning si existe
      })),
      ops: p.ops?.map(o => ({
        nombre: o.nombre,
        rol: o.rol,
        honorariosMensuales: o.honorariosMensuales,
        estado: o.estado
      })),
      comisiones: p.comisiones?.map(c => ({
        fechaInicio: c.fechaInicio,
        fechaFin: c.fechaFin,
        municipios: c.municipios,
        objeto: c.objeto,
        costoTotal: c.costoTotal,
        estado: c.estado
      })),
      alertas: p.alerts.map(a => ({ tipo: a.tipo, nivel: a.nivel, descripcion: a.descripcion })),
      documentos: p.documents?.map(d => ({ 
        titulo: d.titulo, 
        tipo: d.tipo, 
        fecha: d.fechaCreacion,
        estado: d.estado,
        analisis: d.analysis, // Incluir análisis de deep learning
        versiones: d.versiones.map(v => ({
          version: v.version,
          fecha: v.fecha,
          accion: v.accion,
          estado: v.estado
        }))
      }))
    })))}

    Desempeño de Contratistas:
    ${JSON.stringify(contractorPerformance)}
    
    Capacidades adicionales:
    9. Analizar datos de OPS: costo total, carga de trabajo y desempeño por profesional.
    10. Analizar datos de comisiones: número de visitas, costo operativo y resultados de campo.
    11. Responder consultas sobre desempeño de profesionales OPS, costos de seguimiento y proyectos que requieren visitas de campo.
    12. Sugerir contratistas para nuevos proyectos basados en desempeño histórico.
    13. Detección de Patrones: Identificar correlaciones entre tipos de proyectos, contratistas y resultados (ej: "los proyectos de puentes en Chocó suelen tener retrasos del 20% por clima").

    Si el usuario pide un gráfico o si consideras que la información se visualiza mejor gráficamente, DEBES incluir en tu respuesta un objeto JSON en la propiedad "chart" que contenga "type" (bar, pie, line), "title" y "data" (un array estricto de objetos con "name" (string) y "value" (number)).
    Si el usuario pide un documento, menciona el nombre del documento y su tipo.
    Si detectas inconsistencias (ej: avance físico alto pero sin informe de interventoría), menciónalo explícitamente.
    
    En tus respuestas, prioriza hallazgos de "Deep Learning" como:
    - Patrones de éxito en la estructuración de proyectos similares.
    - Oportunidades de ahorro detectadas en contratos comparables.
    - Innovaciones aplicadas en ejecuciones previas que podrían replicarse.
    - Riesgos recurrentes por zona geográfica o tipo de obra.
  `;

  const responseText = await generateContent(prompt, model, {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Respuesta textual del asistente" },
          chart: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["bar", "pie", "line"] },
              title: { type: Type.STRING },
              data: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    value: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          recommendations: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          inconsistencies: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["text"]
      }
    });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }
  
  return parseJSONResponse(responseText);
};
