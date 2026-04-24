import { Contract, Contractor, Otrosie, Alert, ContractorEvaluation, Project } from '../types';

export interface PerformanceMetrics {
  cumplimientoPlazos: number;
  cumplimientoFinanciero: number;
  desviaciones: number;
  numeroAlertas: number;
  score: number;
  clasificacion: 'Alto' | 'Medio' | 'Bajo';
  programado: number;
  ejecutado: number;
  eficiencia: number;
  desviacion: number;
  valorTotal: number;
  plazoTotal: number;
}

export const calculateContractorPerformance = (
  contractorId: string,
  contracts: Contract[],
  otrosies: Otrosie[],
  alerts: Alert[],
  evaluations: ContractorEvaluation[],
  projects: Project[]
): PerformanceMetrics => {
  const contractorContracts = contracts.filter(c => c.contractorId === contractorId);
  const contractorProjects = projects.filter(p => contractorContracts.some(c => c.projectId === p.id));
  const contractorAlerts = alerts.filter(a => 
    contractorContracts.some(c => c.projectId === a.projectId)
  );
  const contractorEvaluations = evaluations.filter(e => e.contractorId === contractorId);

  // 1. Cumplimiento de plazos (basado en evaluaciones y retrasos de proyectos)
  const avgEvalPlazos = contractorEvaluations.length > 0
    ? (contractorEvaluations.reduce((sum, e) => sum + e.calificacionCumplimiento, 0) / contractorEvaluations.length) * 20
    : 100;
  
  const avgRetraso = contractorProjects.length > 0
    ? contractorProjects.reduce((sum, p) => sum + Math.max(0, p.avanceProgramado - p.avanceFisico), 0) / contractorProjects.length
    : 0;
  
  const cumplimientoPlazos = Math.max(0, avgEvalPlazos - (avgRetraso * 2));

  // 2. Cumplimiento financiero (basado en otrosies de valor, eventos y evaluaciones)
  const totalValorOriginal = contractorContracts.reduce((sum, c) => sum + c.valor, 0);
  
  const totalAdicionalOtrosies = otrosies
    .filter(o => contractorContracts.some(c => c.id === o.contractId))
    .reduce((sum, o) => sum + o.valorAdicional, 0);
    
  const totalAdicionalEventos = contractorContracts.reduce((sum, c) => 
    sum + (c.eventos || []).reduce((eSum, e) => eSum + (e.impactoValor || 0), 0), 0);
    
  const totalAdicional = totalAdicionalOtrosies + totalAdicionalEventos;
  
  const desviacionFinanciera = totalValorOriginal > 0 
    ? (totalAdicional / totalValorOriginal * 100)
    : 0;
  
  const cumplimientoFinanciero = Math.max(0, 100 - (desviacionFinanciera * 1.5));

  // 3. Desviaciones (número de otrosíes, eventos y plazo adicional)
  const contractorOtrosies = otrosies.filter(o => contractorContracts.some(c => c.id === o.contractId));
  const contractorEvents = contractorContracts.flatMap(c => c.eventos || []);
  
  const desviaciones = contractorOtrosies.length + contractorEvents.length;
  const totalPlazoOriginal = contractorContracts.reduce((sum, c) => sum + c.plazoMeses, 0);
  
  const totalPlazoAdicionalOtrosies = contractorOtrosies.reduce((sum, o) => sum + o.plazoAdicionalMeses, 0);
  const totalPlazoAdicionalEventos = contractorEvents
    .filter(e => e.tipo === 'Prórroga')
    .reduce((sum, e) => sum + (e.impactoPlazoMeses || 0), 0);
    
  const totalPlazoAdicional = totalPlazoAdicionalOtrosies + totalPlazoAdicionalEventos;
  
  const desviacionCronograma = totalPlazoOriginal > 0 
    ? (totalPlazoAdicional / totalPlazoOriginal * 100)
    : 0;

  // 4. Número de alertas
  const numeroAlertas = contractorAlerts.length;

  // 5. Programado vs Ejecutado
  const programado = contractorProjects.length > 0
    ? contractorProjects.reduce((sum, p) => sum + p.avanceProgramado, 0) / contractorProjects.length
    : 0;
  
  const ejecutado = contractorProjects.length > 0
    ? contractorProjects.reduce((sum, p) => sum + p.avanceFisico, 0) / contractorProjects.length
    : 0;
  
  const eficiencia = programado > 0 ? (ejecutado / programado) * 100 : 100;

  const valorTotal = totalValorOriginal + totalAdicional;
  const plazoTotal = totalPlazoOriginal + totalPlazoAdicional;

  // Score (0-100)
  const score = Math.round(
    (cumplimientoPlazos * 0.3) + 
    (cumplimientoFinanciero * 0.3) + 
    (Math.min(100, eficiencia) * 0.2) +
    (Math.max(0, 100 - (desviaciones * 5)) * 0.1) +
    (Math.max(0, 100 - (numeroAlertas * 5)) * 0.1)
  );

  const clasificacion = score >= 80 ? 'Alto' : score >= 60 ? 'Medio' : 'Bajo';

  return {
    cumplimientoPlazos,
    cumplimientoFinanciero,
    desviaciones,
    numeroAlertas,
    score,
    clasificacion,
    programado,
    ejecutado,
    eficiencia,
    desviacion: desviacionFinanciera,
    valorTotal,
    plazoTotal
  };
};
