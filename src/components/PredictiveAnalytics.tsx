import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { ProjectData } from '../types';
import { calculatePredictiveMetrics } from '../services/PredictiveAnalyticsService';
import { AlertTriangle, TrendingUp, Calendar, DollarSign, Clock } from 'lucide-react';

export const PredictiveAnalytics: React.FC<{ projectData: ProjectData }> = ({ projectData }) => {
  const metrics = useMemo(() => calculatePredictiveMetrics(projectData), [projectData]);

  const scenarioData = [
    { name: 'Optimista', avance: 100, fecha: '2026-06-01' },
    { name: 'Realista', avance: 100, fecha: metrics.projectedCompletionDate },
    { name: 'Pesimista', avance: 100, fecha: '2027-01-01' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <TrendingUp size={18} />
            <span className="text-sm font-medium">Velocidad Histórica</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(metrics.historicalSpeed * 100).toFixed(2)}% / día</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={18} />
            <span className="text-sm font-medium">Fecha Finalización</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.projectedCompletionDate}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <DollarSign size={18} />
            <span className="text-sm font-medium">Riesgo Financiero</span>
          </div>
          <p className={`text-2xl font-bold ${metrics.financialRisk === 'Alto' ? 'text-rose-600' : 'text-slate-900'}`}>{metrics.financialRisk}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Clock size={18} />
            <span className="text-sm font-medium">Probabilidad Retraso</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{metrics.delayProbability.toFixed(0)}%</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold mb-4">Simulación de Escenarios</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={scenarioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="avance" fill="#6366f1" name="Avance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {metrics.bottlenecks.length > 0 && (
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-200">
          <div className="flex items-center gap-2 text-rose-700 font-bold mb-2">
            <AlertTriangle size={20} />
            Cuellos de Botella Detectados
          </div>
          <ul className="list-disc list-inside text-rose-600 text-sm">
            {metrics.bottlenecks.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};
