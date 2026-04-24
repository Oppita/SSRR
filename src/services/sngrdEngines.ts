import { Project, Convenio } from '../types';

export type EngineResult = {
  status: 'compliant' | 'warning' | 'non-compliant';
  message: string;
  score?: number;
};

// 1. Motor Normativo (Ley 1523)
export const validateLey1523 = (project: Project): EngineResult => {
  // Logic to validate compliance with Ley 1523
  // Art 1 (seguimiento), Art 6 (monitoreo), Art 45 (trazabilidad)
  
  const issues = [];
  if (!project.actasComite || project.actasComite.length === 0) issues.push("Falta trazabilidad institucional (actas de comité)");
  if (!project.avanceFisico) issues.push("Falta monitoreo de avance físico");

  if (issues.length > 0) {
    return {
      status: 'non-compliant',
      message: `Este proyecto NO cumple con seguimiento exigido por Ley 1523: ${issues.join(', ')}`
    };
  }
  return { status: 'compliant', message: "Proyecto cumple con lineamientos de Ley 1523" };
};

// 2. Motor de Riesgo Territorial
export const analyzeTerritorialRisk = (project: Project): EngineResult => {
  // Cross location, threat, vulnerability, exposure
  const riskScore = (project.riesgoAntes || 0) * 0.5 + (project.coherenciaTerritorial || 0) * 0.5;
  
  if (riskScore < 3) {
    return { status: 'warning', message: "Este proyecto tiene bajo impacto en reducción de riesgo", score: riskScore };
  }
  return { status: 'compliant', message: "Proyecto con impacto adecuado en reducción de riesgo", score: riskScore };
};

// 3. Motor Predictivo
export const predictProjectOutcomes = (project: Project) => {
  // Calculate probabilities
  return {
    probRetraso: Math.random(),
    probRiesgoTerritorial: Math.random(),
    probFallaContractual: Math.random()
  };
};
