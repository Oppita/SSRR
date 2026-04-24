import React, { useState, useRef } from 'react';
import { FileText, Upload, Loader2, CheckCircle2, AlertCircle, FileSearch } from 'lucide-react';
import { Type } from "@google/genai";
import * as pdfjsLib from 'pdfjs-dist';
import { generateContent } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';
import { AIProviderSelector } from './AIProviderSelector';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

interface DocumentReaderProps {
  onDataExtracted: (data: any, type: 'CDP' | 'RC' | 'General') => void;
  onTextExtracted?: (text: string) => void;
}

const DocumentReader: React.FC<DocumentReaderProps> = ({ onDataExtracted, onTextExtracted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    if (onTextExtracted) {
      onTextExtracted(fullText);
    }
    return fullText;
  };

  const processWithAI = async (text: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const prompt = `
        Analiza el siguiente texto extraído de un documento oficial (CDP, RC, Acta, Contrato, etc.) y extrae la información estructurada.
        Identifica el tipo de documento y extrae los campos relevantes.
        
        Si es CDP (Certificado de Disponibilidad Presupuestal), extrae: numero, fecha, valor, objeto, rubro, fuente.
        Si es RC (Registro Presupuestal/Compromiso), extrae: numero, fecha, valor, contratoAsociado, cdpAsociado, objeto.
        Si es un Contrato u otro documento, extrae cualquier campo que parezca relevante para un proyecto de infraestructura (nombres, valores, fechas, contratistas).
        
        IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
        {
          "tipo": "CDP" | "RC" | "General",
          "data": { ... campos extraídos ... }
        }
        
        Texto del documento:
        ${text.substring(0, 15000)}
      `;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          tipo: { type: Type.STRING, enum: ['CDP', 'RC', 'General'] },
          data: {
            type: Type.OBJECT,
            properties: {
              numero: { type: Type.STRING },
              fecha: { type: Type.STRING },
              valor: { type: Type.NUMBER },
              objeto: { type: Type.STRING },
              rubro: { type: Type.STRING },
              fuente: { type: Type.STRING },
              contratoAsociado: { type: Type.STRING },
              cdpAsociado: { type: Type.STRING },
              nombre: { type: Type.STRING },
              contratista: { type: Type.STRING },
              nit: { type: Type.STRING }
            }
          }
        },
        required: ['tipo', 'data']
      };

      const resultText = await generateContent(prompt, (window as any).selectedAIModel || "gemini-3-flash-preview", {
        responseMimeType: "application/json",
        responseSchema: responseSchema
      });
      const result = parseJSONResponse(resultText);
      onDataExtracted(result.data, result.tipo);
      setSuccess(true);
    } catch (err: any) {
      console.error('AI Extraction Error:', err);
      setError('No se pudo extraer la información del documento. Intente de nuevo o verifique el archivo.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }
      await processWithAI(text);
    } catch (err) {
      setError('Error al leer el archivo.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <FileSearch size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Lector Inteligente de Documentos</h3>
            <p className="text-xs text-slate-500">Extrae datos de CDPs, RCs y otros documentos oficiales.</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-indigo-50/50 p-4 rounded-2xl border-2 border-indigo-100 shadow-sm gap-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-indigo-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]" />
          <span className="text-sm font-black text-slate-700 uppercase tracking-tighter">Cerebro de Análisis Activo:</span>
        </div>
        <AIProviderSelector />
      </div>

      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          loading ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
        }`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept=".pdf,.txt"
        />
        
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-sm font-medium text-slate-600">Analizando documento con IA...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="text-slate-400" size={32} />
            <p className="text-sm font-medium text-slate-600">Haga clic para subir PDF o TXT</p>
            <p className="text-xs text-slate-400">CDPs, RCs, Actas, etc.</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2">
          <CheckCircle2 size={16} />
          Información extraída exitosamente.
        </div>
      )}
    </div>
  );
};

export default DocumentReader;
