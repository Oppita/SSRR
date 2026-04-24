import React, { useState } from 'react';
import { ProjectData } from '../types';
import { analyzeProject, detectPendingTasks, detectUnfulfilledObligations, detectMissingDocuments, generatePrioritizedActions } from '../services/aiAnalysisService';
import { BrainCircuit, Loader2 } from 'lucide-react';

interface AIInsightsProps {
  data: ProjectData;
}

import { handleAiError } from '../utils/aiUtils';

export const AIInsights: React.FC<AIInsightsProps> = ({ data }) => {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async (analysisFn: Function) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await analysisFn(data.project, data.contracts, data.otrosies, data.documents || []);
      setResult(res);
    } catch (error: any) {
      console.error(error);
      const keySelected = await handleAiError(error);
      if (keySelected) {
        setResult('Por favor, vuelve a intentar después de seleccionar la clave de API.');
      } else {
        setResult('Error al realizar el análisis.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
        <BrainCircuit className="text-indigo-600" />
        Centro de Inteligencia Artificial
      </h3>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button onClick={() => runAnalysis(analyzeProject)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Resumen del Proyecto</button>
        <button onClick={() => runAnalysis(detectPendingTasks)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Tareas Pendientes</button>
        <button onClick={() => runAnalysis(detectUnfulfilledObligations)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Obligaciones No Cumplidas</button>
        <button onClick={() => runAnalysis(detectMissingDocuments)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700">Documentos Faltantes</button>
        <button onClick={() => runAnalysis(generatePrioritizedActions)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm col-span-2 hover:bg-indigo-700">Acciones Priorizadas</button>
      </div>
      {loading && <div className="flex justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>}
      {result && <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">{result}</div>}
    </div>
  );
};
