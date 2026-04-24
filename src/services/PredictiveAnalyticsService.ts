import { ProjectData } from '../types';

export interface PredictiveMetrics {
  historicalSpeed: number; // % per day
  projectedCompletionDate: string;
  delayDays: number;
  financialRisk: 'Bajo' | 'Medio' | 'Alto';
  delayProbability: number; // 0-100
  bottlenecks: string[];
}

export const calculatePredictiveMetrics = (projectData: ProjectData): PredictiveMetrics => {
  const { project } = projectData;
  
  // 1. Historical Speed
  const startDate = new Date(project.fechaInicio || Date.now());
  const now = new Date();
  const elapsedDays = Math.max(1, (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const historicalSpeed = (project.avanceFisico || 0) / elapsedDays; // % per day

  // 2. Projected Completion
  const remainingProgress = 100 - (project.avanceFisico || 0);
  const daysToComplete = historicalSpeed > 0 ? remainingProgress / historicalSpeed : 999;
  const projectedCompletionDate = new Date(now.getTime() + daysToComplete * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 3. Delay Detection
  const plannedEndDate = new Date(project.fechaFin || Date.now());
  const delayDays = Math.max(0, (now.getTime() + daysToComplete * 24 * 60 * 60 * 1000 - plannedEndDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 4. Financial Risk (using budget if available in project.matrix)
  const totalBudget = project.matrix?.valorTotalProyecto || 1;
  const totalPaid = (project.matrix?.valorPagadoObra || 0) + (project.matrix?.valorPagadoInterventoria || 0);
  const financialRiskRatio = totalPaid / totalBudget;
  let financialRisk: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
  if (financialRiskRatio > (project.avanceFisico || 0) / 100 + 0.2) financialRisk = 'Alto';
  else if (financialRiskRatio > (project.avanceFisico || 0) / 100 + 0.1) financialRisk = 'Medio';

  // 5. Delay Probability
  const delayProbability = Math.min(100, delayDays * 2);

  // 6. Bottlenecks
  const bottlenecks = [];
  if (project.matrix?.atrasoEjecucionObra && project.matrix.atrasoEjecucionObra > 10) bottlenecks.push('Retraso significativo en obra');
  if (financialRisk === 'Alto') bottlenecks.push('Desbalance financiero');

  return {
    historicalSpeed,
    projectedCompletionDate,
    delayDays,
    financialRisk,
    delayProbability,
    bottlenecks
  };
};
