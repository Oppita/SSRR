import { ProjectData } from '../types';
import { calculateProjectTotals } from '../utils/projectCalculations';

export const getAverageProgressByDepartment = (projects: ProjectData[]) => {
  const deptProgress: Record<string, { totalFisico: number, totalFinanciero: number, count: number }> = {};
  
  projects.forEach(p => {
    const dept = p.project.departamento;
    if (!deptProgress[dept]) {
      deptProgress[dept] = { totalFisico: 0, totalFinanciero: 0, count: 0 };
    }
    deptProgress[dept].totalFisico += p.project.avanceFisico;
    deptProgress[dept].totalFinanciero += p.project.avanceFinanciero;
    deptProgress[dept].count += 1;
  });

  return Object.entries(deptProgress).map(([dept, data]) => ({
    departamento: dept,
    avgFisico: data.totalFisico / data.count,
    avgFinanciero: data.totalFinanciero / data.count
  }));
};

export const getTotalExecutedInvestment = (projects: ProjectData[]) => {
  return projects.reduce((sum, p) => {
    const { valorEjecutado } = calculateProjectTotals(p.project, p.contracts, p.otrosies, [], p.afectaciones, undefined, p.project.suspensiones || [], undefined, projects.map(p => p.project), undefined, [p.presupuesto]);
    return sum + valorEjecutado;
  }, 0);
};

export const getEfficiencyByContractor = (projects: ProjectData[]) => {
  const contractorEfficiency: Record<string, { totalAvance: number, count: number }> = {};
  
  projects.forEach(p => {
    p.contracts.forEach(c => {
      if (c.tipo === 'Obra') {
        if (!contractorEfficiency[c.contratista]) {
          contractorEfficiency[c.contratista] = { totalAvance: 0, count: 0 };
        }
        contractorEfficiency[c.contratista].totalAvance += p.project.avanceFisico;
        contractorEfficiency[c.contratista].count += 1;
      }
    });
  });

  return Object.entries(contractorEfficiency).map(([contratista, data]) => ({
    contratista,
    avgAvance: data.totalAvance / data.count
  }));
};

export const getLowPerformanceContractors = (projects: ProjectData[]) => {
  const efficiency = getEfficiencyByContractor(projects);
  return efficiency.filter(e => e.avgAvance < 50); // Threshold 50%
};

export const analyzeDeadlineCompliance = (projects: ProjectData[]) => {
  return projects.map(p => {
    const fechaFin = new Date(p.project.fechaFin);
    const hoy = new Date();
    const isVencido = hoy > fechaFin;
    return {
      projectId: p.project.id,
      nombre: p.project.nombre,
      isVencido,
      diasRestantes: Math.ceil((fechaFin.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
    };
  });
};

export const getHighRiskProjects = (projects: ProjectData[]) => {
  return projects.filter(p => {
    const riesgoAlto = p.riesgos?.some(r => r.impacto === 'Alto' && r.probabilidad === 'Alta');
    const bajoRendimiento = p.project.avanceFisico < p.project.avanceProgramado - 20;
    return riesgoAlto || bajoRendimiento;
  });
};
