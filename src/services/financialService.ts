import { Type } from "@google/genai";
import { FinancialDocument } from "../types";
import { generateContent, getAIModel, getAIProvider } from "./aiProviderService";

export const analyzeFinancialDocumentText = async (text: string, contractId: string, projectId: string, convenioId?: string, otrosieId?: string): Promise<FinancialDocument> => {
  const model = getAIModel();
  const provider = getAIProvider();

    const prompt = `
    Actúa como un experto en auditoría financiera y gestión presupuestal pública.
    Tu tarea es extraer información estructurada de un texto que representa un documento financiero (CDP o RC).
    
    CAMPOS A EXTRAER:
    - No CDP: Número del Certificado de Disponibilidad Presupuestal (Ej: 19-1156).
    - Valor CDP: Valor monetario del CDP (Ej: 900000000.00).
    - Fecha CDP: Fecha de emisión del CDP (YYYY-MM-DD).
    - No RC: Número del Registro Compromiso (Ej: 13007.28154).
    - Fecha RC: Fecha del RC (YYYY-MM-DD).
    - Valor RC: Valor monetario del RC.
    - Valor pagado: Monto ya desembolsado de este compromiso (Ej: 553000000.00).
    - Diferencia/Liberación: Es la resta entre Valor CDP - Valor RC.
    - Nombre: Nombre del beneficiario o contratista (Ej: UNIVERSIDAD DE CARTAGENA).
    - Contrato: Número de contrato vinculado (Ej: 9677-PPAL001-907-2019).
    - Convenio: Número de convenio vinculado (Ej: 9677-PPAL001-257-2018).
    - Rubro: Código o nombre del rubro (Ej: 1AG-1-CONTRATACION).
    - Fuente: Origen o tipo (Ej: Convenio Inicial).
    - Descripcion: Objeto o nota (Ej: Otrosi Adición pendiente por formalizar).
    
    REGLAS DE RIGOR:
    1. Si el texto tiene formato tabular (como el ejemplo abajo), extrae basándote en la posición.
    2. El "Valor pagado" es un atributo del compromiso, no genera un nuevo tipo de documento RP.
    3. No inventes IDs, devuelve solo lo que está en el texto.
    4. Limpia los símbolos de peso ($) y puntos de miles.
    
    EJEMPLO DE ESTRUCTURA TABULAR:
    13 | ConvenioRef | ContratoRef | Contratista | Rubro | Fuente | NoCDP | FechaCDP | ValCDP | NoRC | FechaRC | ValRC | Pagos | Saldo...
    
    TEXTO A ANALIZAR:
    ${text}
    
    REGLAS ADICIONALES:
    1. Determina el "tipo" principal (CDP, RC) basándote en la presencia de números de CDP o RC.
    2. Si el texto contiene información de pago (Valor pagado > 0), captúralo en el campo correspondiente.
    3. Los recursos "por liberar" se calculan como ValCDP - ValRC.
    3. Identifica si el texto menciona eventos específicos como "Frente Frío" o desastres naturales en la descripción.
    4. Devuelve SIEMPRE un JSON válido.
    5. Los valores numéricos deben ser puros (sin puntos de miles ni símbolos de moneda).

    Estructura JSON requerida:
    {
      "tipo": "CDP" | "RC" | "Otros",
      "numero": "string (No CDP)",
      "valor": number (Valor CDP),
      "fecha": "YYYY-MM-DD (Fecha CDP)",
      "descripcion": "string",
      "radicado": "string (Radicado CDP)",
      "solicitante": "string",
      "areaEjecutora": "string",
      "resolucion": "string",
      "alias": "string",
      "fuente": "string",
      "linea": "string",
      "nota": "string",
      "rubro": "string",
      "nacionalRegional": "string",
      "identificacion": "string",
      "nombre": "string",
      "numeroRc": "string",
      "fechaRc": "YYYY-MM-DD",
      "valorRc": number,
      "radicadoRc": "string",
      "contrato": "string",
      "areaSolicitante": "string",
      "estado": "string",
      "fechaInicial": "YYYY-MM-DD",
      "fechaFinal": "YYYY-MM-DD",
      "valorPagado": number,
      "valorPorPagar": number,
      "nombreFirma": "string",
      "cargoFirma": "string",
      "usuario": "string"
    }
  `;

  const responseText = await generateContent(prompt, model, {
    responseMimeType: "application/json",
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        tipo: { type: Type.STRING, enum: ["CDP", "RC", "Otros"] },
        numero: { type: Type.STRING },
        valor: { type: Type.NUMBER },
        fecha: { type: Type.STRING },
        descripcion: { type: Type.STRING },
        radicado: { type: Type.STRING },
        solicitante: { type: Type.STRING },
        areaEjecutora: { type: Type.STRING },
        resolucion: { type: Type.STRING },
        alias: { type: Type.STRING },
        fuente: { type: Type.STRING },
        linea: { type: Type.STRING },
        nota: { type: Type.STRING },
        rubro: { type: Type.STRING },
        nacionalRegional: { type: Type.STRING },
        identificacion: { type: Type.STRING },
        nombre: { type: Type.STRING },
        numeroRc: { type: Type.STRING },
        fechaRc: { type: Type.STRING },
        valorRc: { type: Type.NUMBER },
        radicadoRc: { type: Type.STRING },
        contrato: { type: Type.STRING },
        areaSolicitante: { type: Type.STRING },
        estado: { type: Type.STRING },
        fechaInicial: { type: Type.STRING },
        fechaFinal: { type: Type.STRING },
        valorPagado: { type: Type.NUMBER },
        valorPorPagar: { type: Type.NUMBER },
        nombreFirma: { type: Type.STRING },
        cargoFirma: { type: Type.STRING },
        usuario: { type: Type.STRING }
      },
      required: ["tipo", "numero", "valor", "fecha", "descripcion"]
    }
  });

  if (!responseText) {
    throw new Error("El modelo no devolvió ningún contenido.");
  }

  const parsed = JSON.parse(responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
  return {
    id: `FIN-${Date.now()}`,
    contractId: contractId || undefined,
    convenioId: convenioId || undefined,
    otrosieId: otrosieId || undefined,
    projectId,
    ...parsed,
    validacion_ia: {
      coherente: true,
      observaciones: `Analizado automáticamente con ${provider} (${model})`,
      inconsistencias: []
    }
  };
};
