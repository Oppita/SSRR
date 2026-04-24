import React, { useState } from 'react';
import { Vigencia, GlobalState } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, BrainCircuit } from 'lucide-react';
import { AIProviderSelector } from './AIProviderSelector';
import { aiProviderService } from '../services/aiProviderService';

interface VigenciaComparisonViewProps {
  vigencias: Vigencia[];
  state: GlobalState;
}

export const VigenciaComparisonView: React.FC<VigenciaComparisonViewProps> = ({ vigencias, state }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const aggregatedData = vigencias.map(v => {
    const vProjects = state.proyectos.filter(p => p.vigencia === v.anio);
    const vContracts = state.contratos.filter(c => c.vigencia === v.anio);
    const vOtrosies = state.otrosies.filter(o => vContracts.some(c => c.id === o.contractId));
    const vRisks = state.riesgos.filter(r => vProjects.some(p => p.id === r.projectId));
    
    return {
      anio: v.anio,
      presupuesto: v.presupuestoAsignado,
      proyectos: vProjects.length,
      contratos: vContracts.length,
      otrosies: vOtrosies.length,
      riesgos: vRisks.length,
    };
  });

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `Analiza rigurosamente estas vigencias: ${JSON.stringify(aggregatedData)}. 
      Proporciona un análisis ejecutivo comparativo, destacando el desempeño presupuestal, 
      densidad de proyectos, complejidad contractual (otrosíes) y exposición al riesgo. 
      Enumera 3 conclusiones críticas y 3 recomendaciones estratégicas.`;
      
      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel());
      setAnalysis(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
    } catch (error) {
      console.error(error);
      setAnalysis("Error al generar el análisis.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 bg-white rounded-2xl border border-indigo-200 shadow-lg space-y-8">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-900">Comparación Rigurosa de Vigencias</h3>
        <div className="flex items-center gap-4">
          <AIProviderSelector />
          <button 
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:bg-slate-400"
          >
            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit />}
            {loading ? 'Analizando...' : 'Ejecutar Análisis IA'}
          </button>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={aggregatedData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="anio" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="presupuesto" fill="#4f46e5" name="Presupuesto" />
            <Bar dataKey="proyectos" fill="#10b981" name="Proyectos" />
            <Bar dataKey="contratos" fill="#f59e0b" name="Contratos" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {analysis && (
        <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-line">
          <h4 className="font-bold text-lg mb-4">Análisis Ejecutivo IA</h4>
          {analysis}
        </div>
      )}
    </div>
  );
};
