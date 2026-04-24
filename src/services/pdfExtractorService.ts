import * as pdfjsLib from 'pdfjs-dist';
import { InterventoriaReport } from '../types';
import { generateContent, getAIModel } from './aiProviderService';

// Configure the worker for pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractDataFromText(text: string, prompt: string, responseSchema?: any): Promise<any> {
  try {
    const model = getAIModel(); // Use the model selected by the user
    
    const responseText = await generateContent(`${prompt}\n\nTexto:\n${text}`, model, {
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {})
      });

    const jsonStr = responseText.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error extracting data from text:", error);
    throw new Error("No se pudo extraer la información del texto. Verifique el contenido y vuelva a intentarlo.");
  }
}

export async function analyzeLargePDF(file: File, prompt: string, responseSchema?: any): Promise<any> {
  try {
    // Check file size (20MB limit for inlineData)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    const model = getAIModel(); // Use the model selected by the user
    
    if (file.size <= MAX_FILE_SIZE) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const responseText = await generateContent(prompt, model, {
            responseMimeType: "application/json",
            ...(responseSchema ? { responseSchema } : {})
          }, [{ inlineData: { mimeType: file.type || 'application/pdf', data: base64 } }]);

        const jsonStr = responseText.trim() || "{}";
        return JSON.parse(jsonStr);
      } catch (inlineError) {
        console.warn("Error using inlineData, falling back to text extraction:", inlineError);
        // Fall through to text extraction
      }
    }
    
    // Fallback for files > 20MB or if inlineData fails: Extract text using pdfjs-dist
    console.log("Extracting text from PDF...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Página ${i} ---\n${pageText}\n\n`;
    }

    const responseText = await generateContent(`${prompt}\n\nEl documento era demasiado grande para procesar sus imágenes, por lo que se extrajo el siguiente texto:\n\n${fullText}`, model, {
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {})
      });

    const jsonStr = responseText.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error analyzing large PDF:", error);
    throw new Error("No se pudo analizar el documento PDF. Es posible que sea demasiado grande o complejo.");
  }
}
export async function extractDataFromPDF(file: File, prompt: string, responseSchema?: any): Promise<any> {
  try {
    // Check file size (20MB limit for inlineData)
    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    const model = getAIModel(); // Use the model selected by the user
    
    if (file.size <= MAX_FILE_SIZE) {
      try {
        // Convert file to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64String = result.split(',')[1];
            resolve(base64String);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const responseText = await generateContent(`${prompt}\n\nAnaliza el documento adjunto con máximo rigor. Identifica explícitamente campos sensibles como el NIT del contratista, fechas, valores, y todas las obligaciones. Si el documento es un escaneo, realiza un esfuerzo extra para leer caracteres pequeños o borrosos.`, model, {
            responseMimeType: "application/json",
            ...(responseSchema ? { responseSchema } : {})
          }, [{ inlineData: { mimeType: file.type || 'application/pdf', data: base64 } }]);

        const jsonStr = responseText.trim() || "{}";
        return JSON.parse(jsonStr);
      } catch (inlineError) {
        console.warn("Error using inlineData, falling back to text extraction:", inlineError);
        // Fall through to text extraction
      }
    }
    
    // Fallback for files > 20MB or if inlineData fails: Extract text using pdfjs-dist
    console.log("Extracting text from PDF...");
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Página ${i} ---\n${pageText}\n\n`;
    }

    const responseText = await generateContent(`${prompt}\n\nEl documento era demasiado grande para procesar sus imágenes, por lo que se extrajo el siguiente texto:\n\n${fullText}`, model, {
        responseMimeType: "application/json",
        ...(responseSchema ? { responseSchema } : {})
      });

    const jsonStr = responseText.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error extracting data from PDF:", error);
    throw new Error("No se pudo extraer la información del PDF. Verifique el archivo y vuelva a intentarlo.");
  }
}
