import React, { useState } from 'react';
import { analyzeInforme } from '../services/InformeAnalysisService';
import { InformeAnalysis } from '../types';
import { Loader2, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { AIProviderSelector } from './AIProviderSelector';

export const InformeAnalysisComponent: React.FC = () => {
  const [text, setText] = useState('');
  const [docType, setDocType] = useState('Informe de Interventoría');
  const [fileData, setFileData] = useState<{ mimeType: string; data: string } | null>(null);
  const [analysis, setAnalysis] = useState<InformeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileData({ mimeType: file.type, data: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeInforme(text, docType, fileData || undefined);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing informe:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Análisis de Documentos</h2>
        <AIProviderSelector />
      </div>
      <select
        className="w-full p-2 border rounded-lg mb-4"
        value={docType}
        onChange={(e) => setDocType(e.target.value)}
      >
        <option>Informe de Interventoría</option>
        <option>Acta de Inicio</option>
        <option>CDP</option>
        <option>RC</option>
        <option>Otro</option>
      </select>
      <input type="file" onChange={handleFileChange} className="mb-4" accept="application/pdf,image/*" />
      <textarea
        className="w-full h-40 p-4 border rounded-lg mb-4"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Pega aquí el contenido del documento o sube un archivo..."
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !text}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-400"
      >
        {loading ? <Loader2 className="animate-spin" /> : 'Analizar Informe'}
      </button>

      {analysis && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Resumen</h3>
          <p className="mb-4">{analysis.summary}</p>
          {analysis.inconsistenciesDetected && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4 flex items-center gap-2">
              <AlertTriangle />
              Inconsistencias detectadas.
            </div>
          )}
          <div className="space-y-4">
            {analysis.activities.map(activity => (
              <div key={activity.id} className="p-4 border rounded-lg">
                <h4 className="font-bold">{activity.name}</h4>
                <p className="text-sm text-slate-600">{activity.description}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span>Tipo: {activity.type}</span>
                  <span>Progreso: {activity.metrics.progress}%</span>
                  <span>Costo: ${activity.cost.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
