import { ProjectData } from '../types';
import { calculateProjectCompliance } from './compliance';

export interface PredictiveRisk {
  projectId: string;
  projectName: string;
  delayProbability: number; // 0-100
  costOverrunProbability: number; // 0-100
  legalRisk: number; // 0-100
  overallRisk: number; // 0-100
  riskLevel: 'Alto' | 'Medio' | 'Bajo';
  predictiveAlerts: string[];
  futureSimulation: {
    estimatedDelayMonths: number;
    estimatedCostOverrun: number;
    trend: 'Mejorando' | 'Estable' | 'Empeorando';
  };
}

export const calculatePredictiveRisk = (projectData: ProjectData): PredictiveRisk => {
  const alerts: string[] = [];
  
  // 1. Delay Probability
  let delayProb = 0;
  const physicalDiff = projectData.project.avanceProgramado - projectData.project.avanceFisico;
  if (physicalDiff > 0) {
    delayProb += physicalDiff * 2; // 2% probability for each 1% of delay
  }
  
  // Check if interventoria reports are missing or infrequent
  if (!projectData.interventoriaReports || projectData.interventoriaReports.length === 0) {
    delayProb += 20;
    alerts.push('Falta de informes de interventoría aumenta riesgo de retraso oculto.');
  }

  // 2. Cost Overrun Probability
  let costProb = 0;
  const financialDiff = projectData.project.avanceFinanciero - projectData.project.avanceFisico;
  if (financialDiff > 5) {
    costProb += financialDiff * 2; // Spending faster than building
    alerts.push('Ejecución financiera supera el avance físico. Alto riesgo de desfinanciamiento.');
  }

  const hasAdiciones = projectData.otrosies.some(o => o.valorAdicional && o.valorAdicional > 0);
  if (hasAdiciones) {
    costProb += 30; // History of cost overruns
    alerts.push('Historial de adiciones presupuestales indica tendencia al sobrecosto.');
  }

  // 3. Legal / Juridical Risk
  let legalRisk = 0;
  const compliance = calculateProjectCompliance(projectData);
  
  legalRisk += (100 - compliance.score); // Inverse of compliance score
  
  if (compliance.missingPolizas) {
    legalRisk += 40;
    alerts.push('¡CRÍTICO! Falta de pólizas expone a la entidad a riesgo jurídico inminente.');
  }
  if (compliance.missingCDP || compliance.missingRC) {
    legalRisk += 30;
    alerts.push('Ejecución sin soportes presupuestales completos (CDP/RC). Riesgo disciplinario.');
  }

  // Normalize probabilities
  delayProb = Math.min(100, Math.max(0, delayProb));
  costProb = Math.min(100, Math.max(0, costProb));
  legalRisk = Math.min(100, Math.max(0, legalRisk));

  // Overall Risk (Weighted average)
  const overallRisk = (delayProb * 0.4) + (costProb * 0.3) + (legalRisk * 0.3);
  
  let riskLevel: 'Alto' | 'Medio' | 'Bajo' = 'Bajo';
  if (overallRisk >= 65) riskLevel = 'Alto';
  else if (overallRisk >= 35) riskLevel = 'Medio';

  // Future Simulation
  let estimatedDelayMonths = 0;
  if (delayProb > 50) estimatedDelayMonths = Math.ceil((delayProb - 50) / 10);
  
  let estimatedCostOverrun = 0;
  if (costProb > 50) {
    const baseCost = projectData.presupuesto.valorTotal;
    estimatedCostOverrun = baseCost * ((costProb - 50) / 100) * 0.5; // Up to 25% overrun
  }

  let trend: 'Mejorando' | 'Estable' | 'Empeorando' = 'Estable';
  if (physicalDiff > 10 || financialDiff > 10 || legalRisk > 70) trend = 'Empeorando';
  else if (physicalDiff <= 0 && financialDiff <= 0 && legalRisk < 30) trend = 'Mejorando';

  return {
    projectId: projectData.project.id,
    projectName: projectData.project.nombre,
    delayProbability: Math.round(delayProb),
    costOverrunProbability: Math.round(costProb),
    legalRisk: Math.round(legalRisk),
    overallRisk: Math.round(overallRisk),
    riskLevel,
    predictiveAlerts: alerts,
    futureSimulation: {
      estimatedDelayMonths,
      estimatedCostOverrun,
      trend
    }
  };
};

export const calculateGlobalPredictiveRisks = (projects: ProjectData[]) => {
  const risks = projects.map(calculatePredictiveRisk);
  
  return risks.sort((a, b) => b.overallRisk - a.overallRisk);
};
