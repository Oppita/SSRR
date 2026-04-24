import React, { useMemo } from 'react';
import { ProjectData } from '../types';
import { 
  Activity, AlertTriangle, CheckCircle2, FileText, 
  ShieldAlert, TrendingUp, DollarSign, Calendar, FileWarning, Layers
} from 'lucide-react';
import { SmartTimeline } from './SmartTimeline';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ProjectRadiographyProps {
  project: ProjectData;
}

export const ProjectRadiography: React.FC<ProjectRadiographyProps> = ({ project: data }) => {
  const { project, contracts, avances, alerts, riesgos, presupuesto, documents, interventoriaReports, pagos } = data;

  // 1. Calculate Metrics
  const metrics = useMemo(() => {
    const realProgress = (project.avanceFisico + project.avanceFinanciero) / 2;
    const financialStatus = presupuesto ? (presupuesto.pagosRealizados / presupuesto.valorTotal) * 100 : 0;
    const contractualStatus = contracts.every(c => c.estado !== 'En liquidación') ? 'Activo' : 'En liquidación';
    
    return { realProgress, financialStatus, contractualStatus };
  }, [project, presupuesto, contracts]);

  // 2. Executive Summary
  const executiveSummary = useMemo(() => {
    return `El proyecto ${project.nombre} se encuentra en estado ${project.estado}. 
    Presenta un avance físico del ${project.avanceFisico}%. 
    Se han identificado ${alerts.length} alertas activas y ${riesgos.length} riesgos asociados.`;
  }, [project, alerts, riesgos]);

  // 3. Phase Analysis
  const phaseData = useMemo(() => {
    if (!project.fases || project.fases.length === 0) return null;

    return project.fases.map(fase => {
      const phaseContracts = contracts.filter(c => c.faseId === fase.id);
      const valorContratado = phaseContracts.reduce((sum, c) => sum + c.valor, 0);
      
      const phasePayments = pagos.filter(p => phaseContracts.some(c => c.id === p.contractId) && p.estado === 'Pagado');
      const valorPagado = phasePayments.reduce((sum, p) => sum + p.valor, 0);
      
      const avanceFinanciero = valorContratado > 0 ? (valorPagado / valorContratado) * 100 : 0;

      // Avance físico from latest interventoria report for contracts in this phase
      let avanceFisico = 0;
      if (phaseContracts.length > 0) {
        let totalAvance = 0;
        let count = 0;
        phaseContracts.forEach(c => {
          const reports = interventoriaReports?.filter(r => r.contractId === c.id) || [];
          if (reports.length > 0) {
            // Get the latest report
            const latestReport = reports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime())[0];
            totalAvance += latestReport.obraEjecutadaPct;
            count++;
          }
        });
        if (count > 0) {
          avanceFisico = totalAvance / count;
        }
      }

      return {
        name: fase.nombre,
        'Avance Físico (%)': Number(avanceFisico.toFixed(1)),
        'Avance Financiero (%)': Number(avanceFinanciero.toFixed(1)),
        valorContratado,
        valorPagado
      };
    });
  }, [project.fases, contracts, pagos, interventoriaReports]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Radiografía del Proyecto</h2>
        <p className="text-slate-600">{executiveSummary}</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <TrendingUp className="text-indigo-500" size={32} />
          <div>
            <div className="text-sm text-slate-500">Avance Real Estimado</div>
            <div className="text-2xl font-black">{metrics.realProgress.toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <DollarSign className="text-emerald-500" size={32} />
          <div>
            <div className="text-sm text-slate-500">Ejecución Financiera</div>
            <div className="text-2xl font-black">{metrics.financialStatus.toFixed(1)}%</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4">
          <ShieldAlert className="text-amber-500" size={32} />
          <div>
            <div className="text-sm text-slate-500">Estado Contractual</div>
            <div className="text-2xl font-black">{metrics.contractualStatus}</div>
          </div>
        </div>
      </div>

      {/* Phase Analysis Chart */}
      {phaseData && phaseData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Layers className="text-indigo-500" size={20} />
            Análisis por Fases
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={phaseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#6366f1" axisLine={false} tickLine={false} tickFormatter={(val) => `${val}%`} />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" axisLine={false} tickLine={false} tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number, name: string) => {
                    if (name.includes('%')) return [`${value}%`, name];
                    return [formatCurrency(value), name];
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="Avance Físico (%)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="Avance Financiero (%)" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SmartTimeline project={data} />
        
        <div className="space-y-6">
          {/* Alerts & Risks */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="text-rose-500" size={20} />
              Alertas y Riesgos
            </h3>
            <div className="space-y-2">
              {alerts.map(a => <div key={a.id} className="text-sm text-rose-800 bg-rose-50 p-2 rounded">{a.descripcion}</div>)}
              {riesgos.map(r => <div key={r.id} className="text-sm text-amber-800 bg-amber-50 p-2 rounded">{r.descripcion}</div>)}
            </div>
          </div>

          {/* Key Documents */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="text-indigo-500" size={20} />
              Documentos Clave
            </h3>
            <div className="space-y-2">
              {documents.slice(0, 5).map(d => (
                <div key={d.id} className="text-sm text-slate-700 flex justify-between">
                  <span>{d.titulo}</span>
                  <span className="text-xs text-slate-400">{d.tipo}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
