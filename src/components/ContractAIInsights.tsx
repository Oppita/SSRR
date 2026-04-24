import React, { useState, useEffect } from 'react';
import { Contract, Otrosie, ContractEvent, Pago, InterventoriaReport } from '../types';
import { Brain, Sparkles, AlertTriangle, CheckCircle2, TrendingUp, ShieldAlert, Loader2, MessageSquareText, Lightbulb, Target, RefreshCw } from 'lucide-react';
import { calculateContractTotals } from '../utils/projectCalculations';
import { AIProviderSelector } from './AIProviderSelector';
import { aiProviderService } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';

interface ContractAIInsightsProps {
  contract: Contract;
  otrosies: Otrosie[];
  events: ContractEvent[];
  pagos: Pago[];
  reports: InterventoriaReport[];
}

interface AIInsights {
  resumen: string;
  conclusiones: string[];
  accionesCorrectivas: string[];
  incumplimientosPosibles: string[];
  riesgosFuturos: string[];
}

export const ContractAIInsights: React.FC<ContractAIInsightsProps> = ({ contract, otrosies, events, pagos, reports }) => {
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const totalPaid = pagos.filter(p => p.estado === 'Pagado').reduce((sum, p) => sum + p.valor, 0);
      const { valorTotal: currentValue, valorAdicional, plazoTotalMeses, fechaFinCalculada } = calculateContractTotals(contract, otrosies, events);
      const latestReport = [...reports].sort((a, b) => b.semana - a.semana)[0];
      
      const prompt = `
        Analiza el estado de este contrato estatal y genera insights inteligentes.
        
        DATOS DEL CONTRATO:
        - Número: ${contract.numero}
        - Objeto: ${contract.objetoContractual}
        - Contratista: ${contract.contratista}
        - Valor Inicial: ${contract.valor}
        - Valor Adicional (Otrosíes y Eventos): ${valorAdicional}
        - Valor Total Actualizado: ${currentValue}
        - Plazo Total: ${plazoTotalMeses} meses
        - Fecha Fin Estimada: ${fechaFinCalculada}
        - Total Pagado: ${totalPaid}
        - Avance Financiero: ${((totalPaid / currentValue) * 100).toFixed(1)}%
        - Avance Físico (Interventoría): ${latestReport?.obraEjecutadaPct || 0}%
        - Avance Programado: ${latestReport?.obraProgramadaPct || 0}%
        - Otrosíes: ${otrosies.length}
        - Eventos (Suspensiones/Reinicios/Adiciones): ${events.length}
        
        REPORTE DE INTERVENTORÍA MÁS RECIENTE:
        - Semana: ${latestReport?.semana || 'N/A'}
        - Observaciones: ${latestReport?.observaciones || 'Sin observaciones'}
        
        POR FAVOR GENERA UN JSON CON LA SIGUIENTE ESTRUCTURA:
        {
          "resumen": "Un resumen ejecutivo de 3-4 líneas sobre el estado actual.",
          "conclusiones": ["Lista de 3 conclusiones clave"],
          "accionesCorrectivas": ["Lista de 3-4 acciones sugeridas"],
          "incumplimientosPosibles": ["Lista de posibles incumplimientos detectados"],
          "riesgosFuturos": ["Lista de riesgos identificados a futuro"]
        }
      `;

      const config = {
        responseMimeType: "application/json"
      };

      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel(), config);
      const data = parseJSONResponse(result);
      setInsights(data);
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError('No se pudieron generar los insights en este momento.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateInsights();
  }, [contract.id]);

  if (loading) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
        <p className="text-slate-500 font-medium animate-pulse text-center">
          Analizando datos contractuales con IA...<br/>
          <span className="text-xs">Evaluando riesgos, avances y cumplimiento</span>
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100 flex items-center gap-4 text-rose-700">
        <AlertTriangle size={24} />
        <p className="text-sm font-medium">{error}</p>
        <button onClick={generateInsights} className="ml-auto text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg font-bold">Reintentar</button>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Brain className="text-indigo-600" />
          Análisis de Inteligencia Contractual
        </h3>
        <div className="flex items-center gap-4">
          <AIProviderSelector />
          <button 
            onClick={generateInsights}
            disabled={loading}
            className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all disabled:opacity-50"
            title="Regenerar Análisis"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      
      {/* Resumen Ejecutivo */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Brain size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles size={24} className="text-indigo-200" />
            <h3 className="text-xl font-bold">Resumen Inteligente del Estado</h3>
          </div>
          <p className="text-indigo-50 leading-relaxed text-lg font-medium">
            {insights.resumen}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conclusiones */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Conclusiones Clave</h4>
          </div>
          <ul className="space-y-3">
            {insights.conclusiones.map((c, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                {c}
              </li>
            ))}
          </ul>
        </div>

        {/* Acciones Correctivas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Lightbulb size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Acciones Sugeridas</h4>
          </div>
          <ul className="space-y-3">
            {insights.accionesCorrectivas.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <TrendingUp size={16} className="text-amber-500 shrink-0" />
                {a}
              </li>
            ))}
          </ul>
        </div>

        {/* Posibles Incumplimientos */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
              <ShieldAlert size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Alertas de Incumplimiento</h4>
          </div>
          <ul className="space-y-3">
            {insights.incumplimientosPosibles.map((inc, i) => (
              <li key={i} className="flex gap-3 p-3 bg-rose-50 rounded-xl text-sm text-rose-700 font-medium">
                <AlertTriangle size={16} className="shrink-0" />
                {inc}
              </li>
            ))}
            {insights.incumplimientosPosibles.length === 0 && (
              <li className="text-sm text-slate-400 italic">No se detectan incumplimientos inminentes.</li>
            )}
          </ul>
        </div>

        {/* Riesgos Futuros */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
              <Target size={20} />
            </div>
            <h4 className="font-bold text-slate-800">Riesgos Identificados</h4>
          </div>
          <ul className="space-y-3">
            {insights.riesgosFuturos.map((r, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-600">
                <div className="w-6 h-6 bg-slate-100 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0">{i+1}</div>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
