import { ProjectData } from '../types';
import { DepartmentRiskData, RiskDiagnostic } from '../types/risk';
import { mockDepartments, mockThreats } from '../data/mockDepartments';
import { ThreatType } from '../types/risk';

import { getOfficialDeptName } from '../lib/stringUtils';

// Map mockDepartments to DepartmentRiskData
const departments: DepartmentRiskData[] = mockDepartments.map(d => ({
  id: d.id,
  name: d.name,
  population: d.population,
  extension: d.extension,
  density: d.density,
  riskIndex: d.riskIndex,
  predominantThreats: d.threats.map(tId => {
    const threat = mockThreats.find(t => t.id === tId);
    return ((threat?.name || '').toLowerCase() as ThreatType) || 'inundación';
  }),
  investment: d.investment
}));

export const calculateRiskMetrics = (projects: ProjectData[]) => {
  return departments.map(dept => {
    const deptProjects = projects.filter(p => getOfficialDeptName(p.project.departamento) === getOfficialDeptName(dept.name));
    const totalInvestment = deptProjects.reduce((sum, p) => sum + (p.project.matrix?.valorTotalProyecto || 0), 0);
    
    const investmentVsRisk = dept.riskIndex > 0 ? totalInvestment / dept.riskIndex : 0;
    
    let riskLevel: 'crítico' | 'vulnerable' | 'controlado' = 'controlado';
    if (dept.riskIndex > 80) riskLevel = 'crítico';
    else if (dept.riskIndex > 50) riskLevel = 'vulnerable';
    
    let attentionLevel: 'Alta' | 'Media' | 'Baja' = 'Baja';
    if (dept.riskIndex > 70 && totalInvestment < 100000000) attentionLevel = 'Alta';
    else if (dept.riskIndex > 50) attentionLevel = 'Media';

    return {
      ...dept,
      riskLevel,
      investmentVsRisk,
      attentionLevel,
      potContext: dept.potContext
    };
  });
};

export const updateDepartmentPOTContext = (deptId: string, context: DepartmentRiskData['potContext']) => {
  const dept = departments.find(d => d.id === deptId);
  if (dept) {
    dept.potContext = context;
  }
};
