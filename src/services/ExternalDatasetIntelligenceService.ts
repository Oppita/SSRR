import { ExternalDataset } from "../types";
import { aiProviderService } from "./aiProviderService";

export async function analyzeExternalDataset(file: File): Promise<Omit<ExternalDataset, 'id' | 'url'>> {
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const prompt = `
    Analiza este documento técnico (puede ser un POT, reporte del IDEAM, estudio técnico de riesgos, etc.).
    El documento puede contener gráficos, tablas, mapas o texto mal escaneado.
    Extrae la siguiente información estructurada en formato JSON:
    {
      "fuente": "IDEAM" | "POT" | "POD" | "Estudio Técnico" | "Otro",
      "titulo": "string",
      "fechaPublicacion": "string (YYYY-MM-DD)",
      "departamento": "string",
      "municipio": "string (opcional)",
      "hallazgosClave": ["string"]
    }
  `;

  console.log(`Analyzing file: ${file.name}, size: ${file.size}, type: ${file.type}`);

  try {
    const response = await aiProviderService.generateContent(
      prompt,
      aiProviderService.getAIModel(),
      {
        responseMimeType: "application/json",
      },
      [
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type || "application/pdf",
          }
        }
      ]
    );

    console.log("AI Analysis complete");
    return typeof response === 'string' ? JSON.parse(response) : response;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    // Fallback analysis if AI fails
    return {
      fuente: 'Otro',
      titulo: file.name,
      fechaPublicacion: new Date().toISOString().split('T')[0],
      departamento: 'No detectado',
      municipio: '',
      hallazgosClave: ['Error en análisis automático. Se requiere revisión manual.']
    };
  }
}
