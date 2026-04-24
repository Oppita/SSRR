import React, { useState } from 'react';
import { Professional } from '../types';
import { BrainCircuit, Save, X, Loader2 } from 'lucide-react';
import { aiProviderService } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';

interface ImportProfessionalsFormProps {
  onSave: (professionals: Professional[]) => void;
  onCancel: () => void;
}

export const ImportProfessionalsForm: React.FC<ImportProfessionalsFormProps> = ({ onSave, onCancel }) => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedProfessionals, setExtractedProfessionals] = useState<Partial<Professional>[]>([]);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const prompt = `
      Analiza el siguiente texto y extrae la información de los contratistas/profesionales mencionados.
      Devuelve un JSON array donde cada objeto represente a un profesional con los siguientes campos:
      - nombre (string)
      - profesion (string, ej. "Ingeniero Civil", "Abogado")
      - experienciaAnios (number)
      - salarioMensual (number, extrae el valor monetario si existe)
      - numeroContrato (string, ej. "OPS-2026-001")
      - objetoContrato (string, descripción del objeto del contrato)
      - supervisor (string, nombre del supervisor)
      - fechaInicio (string, formato YYYY-MM-DD)
      - fechaFinalizacion (string, formato YYYY-MM-DD)
      - especialidades (array de strings)
      - sectoresTrabajados (array de strings)
      
      Si algún dato no está presente en el texto, omítelo o usa un valor por defecto razonable (0 para números, array vacío para arrays).
      
      Texto a analizar:
      """
      ${text}
      """
      `;
      
      const response = await aiProviderService.generateContent(prompt, "gemini-3-flash-preview");
      const parsed = parseJSONResponse(response);
      
      if (Array.isArray(parsed)) {
        setExtractedProfessionals(parsed);
      } else if (parsed && typeof parsed === 'object') {
        // En caso de que devuelva un objeto con una propiedad que sea el array
        const possibleArray = Object.values(parsed).find(v => Array.isArray(v));
        if (possibleArray) {
          setExtractedProfessionals(possibleArray as any[]);
        } else {
          setExtractedProfessionals([parsed]);
        }
      }
    } catch (error: any) {
      console.error("Error analyzing text:", error);
      const errorMessage = error?.message || "";
      if (errorMessage.includes("API_KEY_INVALID") || errorMessage.includes("API key not valid")) {
        alert("Error: La clave API de Gemini no es válida. Por favor, verifica la configuración en las variables de entorno.");
      } else {
        alert(`Error al analizar el texto: ${errorMessage || 'Por favor, intenta de nuevo.'}`);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = () => {
    const finalProfessionals: Professional[] = extractedProfessionals.map(p => ({
      ...p,
      id: `PROF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      nombre: p.nombre || 'Sin Nombre',
      profesion: p.profesion || 'Sin Profesión',
      experienciaAnios: p.experienciaAnios || 0,
      salarioMensual: p.salarioMensual || 0,
      valorHora: (p.salarioMensual || 0) / (22 * 8),
      proyectosActivos: 0,
      horasEstimadas: 0,
      carga: 'Disponible',
      especialidades: p.especialidades || [],
      sectoresTrabajados: p.sectoresTrabajados || [],
      departamentosExperiencia: [],
      numeroContrato: p.numeroContrato || '',
      objetoContrato: p.objetoContrato || '',
      supervisor: p.supervisor || '',
      fechaInicio: p.fechaInicio || '',
      fechaFinalizacion: p.fechaFinalizacion || ''
    } as Professional));
    
    onSave(finalProfessionals);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <BrainCircuit size={24} />
            Importar Contratistas con IA
          </h3>
          <button onClick={onCancel} className="text-indigo-100 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col">
            <label className="block text-sm font-bold text-slate-700 mb-2">Pega el texto con la información de los contratistas</label>
            <textarea 
              className="w-full flex-1 border border-slate-300 rounded-xl p-4 text-sm resize-none focus:ring-2 focus:ring-indigo-500 outline-none min-h-[300px]"
              placeholder="Ej. Se contrata a Juan Pérez, Ingeniero Civil con 5 años de experiencia, para el contrato OPS-2026-001 con un salario de $5,000,000. El objeto del contrato es la supervisión de obras en el departamento de Antioquia. El supervisor será María Gómez. Fecha de inicio: 2026-01-15, fecha de finalización: 2026-12-31..."
              value={text}
              onChange={e => setText(e.target.value)}
            />
            <button 
              onClick={handleAnalyze}
              disabled={isAnalyzing || !text.trim()}
              className="mt-4 px-6 py-3 bg-indigo-100 text-indigo-700 font-bold rounded-xl hover:bg-indigo-200 flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {isAnalyzing ? <><Loader2 size={18} className="animate-spin" /> Analizando...</> : <><BrainCircuit size={18} /> Extraer Datos</>}
            </button>
          </div>
          
          <div className="flex-1 flex flex-col border-l border-slate-200 pl-6">
            <h4 className="font-bold text-slate-800 mb-4">Datos Extraídos ({extractedProfessionals.length})</h4>
            
            {extractedProfessionals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <BrainCircuit size={48} className="mb-4 opacity-20" />
                <p className="text-sm text-center">Los contratistas extraídos aparecerán aquí</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {extractedProfessionals.map((prof, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h5 className="font-bold text-slate-900">{prof.nombre || 'Sin Nombre'}</h5>
                      <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg">{prof.numeroContrato || 'Sin OPS'}</span>
                    </div>
                    <p className="text-xs text-slate-600"><span className="font-bold">Profesión:</span> {prof.profesion}</p>
                    <p className="text-xs text-slate-600"><span className="font-bold">Objeto:</span> {prof.objetoContrato}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <p className="text-xs text-slate-600"><span className="font-bold">Supervisor:</span> {prof.supervisor}</p>
                      <p className="text-xs text-slate-600"><span className="font-bold">Salario:</span> ${prof.salarioMensual?.toLocaleString()}</p>
                      <p className="text-xs text-slate-600"><span className="font-bold">Inicio:</span> {prof.fechaInicio}</p>
                      <p className="text-xs text-slate-600"><span className="font-bold">Fin:</span> {prof.fechaFinalizacion}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-4 shrink-0">
          <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancelar</button>
          <button 
            onClick={handleSave}
            disabled={extractedProfessionals.length === 0}
            className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <Save size={18} /> Guardar {extractedProfessionals.length} Contratistas
          </button>
        </div>
      </div>
    </div>
  );
};
