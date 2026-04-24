import React, { useState, useEffect } from 'react';
import { ProjectData } from '../types';
import * as analytics from '../services/analyticsService';
import * as ai from '../services/aiIntelligenceService';
import { BarChart3, TrendingUp, AlertTriangle, Brain } from 'lucide-react';

import { handleAiError } from '../utils/aiUtils';

export const AdvancedAnalytics = ({ projects }: { projects: ProjectData[] }) => {
  const [aiResult, setAiResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const avgDept = analytics.getAverageProgressByDepartment(projects);
  const totalExec = analytics.getTotalExecutedInvestment(projects);
  const highRisk = analytics.getHighRiskProjects(projects);

  const runAIAnalysis = async () => {
    setLoading(true);
    try {
      const diagnosis = await ai.detectNonCompliancePatterns(projects);
      setAiResult(diagnosis || 'No se pudo generar el diagnóstico.');
    } catch (error: any) {
      console.error(error);
      const keySelected = await handleAiError(error);
      if (keySelected) {
        setAiResult('Por favor, vuelve a ejecutar el análisis después de seleccionar la clave.');
      } else {
        setAiResult('Error al generar el diagnóstico.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <h2 className="text-2xl font-bold">Analítica Avanzada e Inteligencia</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-2">Inversión Total Ejecutada</h3>
          <p className="text-2xl font-bold text-emerald-600">${totalExec.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="font-bold mb-2">Proyectos en Riesgo Alto</h3>
          <p className="text-2xl font-bold text-rose-600">{highRisk.length}</p>
        </div>
        <button 
          onClick={runAIAnalysis}
          className="bg-indigo-600 text-white p-6 rounded-xl font-bold hover:bg-indigo-700 flex items-center justify-center gap-2"
        >
          <Brain /> Ejecutar Análisis IA
        </button>
      </div>

      {loading && <p>Analizando...</p>}
      {aiResult && (
        <div className="bg-white p-6 rounded-xl border border-indigo-200">
          <h3 className="font-bold mb-4">Diagnóstico de IA</h3>
          <p className="text-slate-700">{aiResult}</p>
        </div>
      )}
    </div>
  );
};
