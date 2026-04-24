import React, { useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { getRiskRanking, calculateEficiencia, calculateImpactoProyecto } from '../services/riskService';
import { Contract, Otrosie, Pago, InterventoriaReport, ProjectData } from '../types';
import { InvestmentSimulator } from './InvestmentSimulator';
import { DisasterSimulator } from './DisasterSimulator';
import { AlertSystem } from './AlertSystem';

interface RiskDashboardProps {
  contracts: Contract[];
  otrosies: Otrosie[];
  pagos: Pago[];
  reports: InterventoriaReport[];
  projects: ProjectData[];
}

export const RiskDashboard: React.FC<RiskDashboardProps> = ({ contracts, otrosies, pagos, reports, projects }) => {
  console.log('RiskDashboard: Rendering');
  const { state } = useProject();
  const { riesgosTerritoriales, municipios } = state;
  
  const ranking = getRiskRanking(riesgosTerritoriales || [], municipios || []);

  const totalEjecutado = useMemo(() => {
    // Use the calculated pagosRealizados from each project, which includes matrix fallbacks
    return projects.reduce((sum, p) => sum + (p.presupuesto.pagosRealizados || 0), 0);
  }, [projects]);

  const efficiencyRanking = useMemo(() => {
    const efficiencies = projects.map(p => {
      const impacto = calculateImpactoProyecto(p.project.poblacionBeneficiada || 0, 0); // Assuming 0 as 'after' population for now
      const costo = p.presupuesto.valorTotal || 0;
      return {
        nombre: p.project.nombre,
        eficiencia: calculateEficiencia(impacto, costo)
      };
    });
    return efficiencies.sort((a, b) => b.eficiencia - a.eficiencia);
  }, [projects]);

  if (!ranking || ranking.length === 0) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard de Riesgos Territoriales</h2>
        <p className="text-slate-500">No hay datos de riesgos para mostrar.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Dashboard de Riesgos Territoriales</h2>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-10">
        <h3 className="text-lg font-semibold text-slate-800">Inversión Total Ejecutada</h3>
        <p className="text-4xl font-bold text-indigo-600">${totalEjecutado.toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <InvestmentSimulator />
        <DisasterSimulator />
      </div>
      
      <div className="mb-10">
        <AlertSystem />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ranking.map((item, index) => (
          <div key={`${item.municipio}-${index}`} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-slate-800">{item.municipio}</h3>
              <span className="text-sm font-bold text-slate-400">#{index + 1}</span>
            </div>
            <p className="text-3xl font-bold text-indigo-600">
              {item.riesgoTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-slate-500">Índice de Riesgo Total</p>
          </div>
        ))}
      </div>
      
      <div className="mt-10">
        <h3 className="text-xl font-bold text-slate-900 mb-4">Ranking de Eficiencia de Proyectos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-lg font-semibold text-emerald-600 mb-4">Mejores Proyectos (Más Eficientes)</h4>
            {efficiencyRanking.slice(0, 5).map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{p.nombre}</span>
                <span className="text-sm font-bold text-emerald-600">{p.eficiencia.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h4 className="text-lg font-semibold text-red-600 mb-4">Peores Inversiones (Menos Eficientes)</h4>
            {efficiencyRanking.slice(-5).reverse().map((p, i) => (
              <div key={i} className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-sm text-slate-700">{p.nombre}</span>
                <span className="text-sm font-bold text-red-600">{p.eficiencia.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
