import { ProjectData } from '../types';

export interface ComplianceResult {
  score: number; // 0 to 100
  status: 'Alto' | 'Medio' | 'Bajo';
  missingCDP: boolean;
  missingPolizas: boolean;
  incompleteDocs: boolean;
  missingRC: boolean;
  details: string[];
}

export const calculateProjectCompliance = (projectData: ProjectData): ComplianceResult => {
  let score = 100;
  const details: string[] = [];

  // 1. Check CDP (25 points)
  const missingCDP = !projectData.presupuesto?.cdp || projectData.presupuesto.cdp.trim() === '';
  if (missingCDP) {
    score -= 25;
    details.push('Falta CDP (Certificado de Disponibilidad Presupuestal)');
  }

  // 2. Check RC (15 points)
  const missingRC = !projectData.presupuesto?.rc || projectData.presupuesto.rc.trim() === '';
  if (missingRC) {
    score -= 15;
    details.push('Falta RC (Registro Presupuestal)');
  }

  // 3. Check Pólizas/Garantías (30 points)
  let hasPolizas = false;
  
  // Check in contracts
  if (projectData.contracts && projectData.contracts.length > 0) {
    hasPolizas = projectData.contracts.some(c => c.garantias && c.garantias.length > 0);
  }

  // Check in documents if not found in contracts
  if (!hasPolizas && projectData.documents) {
    hasPolizas = projectData.documents.some(d => 
      d.titulo.toLowerCase().includes('póliza') || 
      d.titulo.toLowerCase().includes('poliza') || 
      d.titulo.toLowerCase().includes('garantía') ||
      d.titulo.toLowerCase().includes('garantia')
    );
  }

  const missingPolizas = !hasPolizas && (projectData.contracts && projectData.contracts.length > 0);
  if (missingPolizas) {
    score -= 30;
    details.push('Faltan Pólizas/Garantías de los contratos');
  }

  // 4. Check Incomplete Documents (30 points)
  // Heuristic: A project should have at least an Acta de Inicio, Contrato, etc.
  // We'll just check if there are at least 3 documents, or if specific ones exist.
  let hasActaInicio = false;
  if (projectData.documents) {
    hasActaInicio = projectData.documents.some(d => d.titulo.toLowerCase().includes('acta de inicio'));
  }

  const incompleteDocs = (!projectData.documents || projectData.documents.length < 2) && !hasActaInicio;
  if (incompleteDocs) {
    score -= 30;
    details.push('Documentación incompleta (Faltan actas o soportes mínimos)');
  }

  // Determine status
  let status: 'Alto' | 'Medio' | 'Bajo' = 'Alto';
  if (score < 60) status = 'Bajo';
  else if (score < 90) status = 'Medio';

  return {
    score: Math.max(0, score),
    status,
    missingCDP,
    missingPolizas,
    incompleteDocs,
    missingRC,
    details
  };
};

export const calculateGlobalCompliance = (projects: ProjectData[]) => {
  if (!projects.length) return { avgScore: 0, status: 'Bajo', completeProjectsPct: 0, criticalProjects: [] };

  let totalScore = 0;
  let completeCount = 0;
  const criticalProjects: { project: ProjectData, compliance: ComplianceResult }[] = [];

  projects.forEach(p => {
    const compliance = calculateProjectCompliance(p);
    totalScore += compliance.score;
    
    if (compliance.score === 100) {
      completeCount++;
    }

    if (compliance.status === 'Bajo') {
      criticalProjects.push({ project: p, compliance });
    }
  });

  const avgScore = totalScore / projects.length;
  let status: 'Alto' | 'Medio' | 'Bajo' = 'Alto';
  if (avgScore < 60) status = 'Bajo';
  else if (avgScore < 90) status = 'Medio';

  return {
    avgScore,
    status,
    completeProjectsPct: (completeCount / projects.length) * 100,
    criticalProjects: criticalProjects.sort((a, b) => a.compliance.score - b.compliance.score)
  };
};
