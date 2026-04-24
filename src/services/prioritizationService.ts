import { DepartmentRisk, PrioritizationCriteria, PrioritizedDepartment, Project } from '../types';

export const calculateDepartmentPriority = (
  departments: DepartmentRisk[],
  criteria: PrioritizationCriteria
): PrioritizedDepartment[] => {
  // Normalize values to 0-100 scale for fair weighting
  const maxPopulation = Math.max(...departments.map(d => d.population), 1);
  const maxInvestment = Math.max(...departments.map(d => d.investment), 1);

  const scoredDepartments = departments.map(dept => {
    const normalizedPopulation = (dept.population / maxPopulation) * 100;
    // Inverse investment score: lower investment = higher priority
    const normalizedInvestment = 100 - ((dept.investment / maxInvestment) * 100);
    
    const riskScore = dept.riskIndex * (criteria.riskLevelWeight / 100);
    const popScore = normalizedPopulation * (criteria.populationWeight / 100);
    const invScore = normalizedInvestment * (criteria.investmentWeight / 100);
    const histScore = (dept.disasterHistoryScore || 0) * (criteria.disasterHistoryWeight / 100);

    const priorityScore = riskScore + popScore + invScore + histScore;

    return {
      ...dept,
      priorityScore: Number(priorityScore.toFixed(2))
    };
  });

  // Sort by priority score descending
  scoredDepartments.sort((a, b) => b.priorityScore - a.priorityScore);

  // Assign ranks
  return scoredDepartments.map((dept, index) => ({
    ...dept,
    rank: index + 1
  }));
};

export const suggestInvestmentStrategy = (prioritizedDepartments: PrioritizedDepartment[]) => {
  if (prioritizedDepartments.length === 0) return null;
  
  const topPriority = prioritizedDepartments[0];
  const criticalDepts = prioritizedDepartments.filter(d => d.priorityScore > 75);
  
  return {
    primaryTarget: topPriority.name,
    reasoning: `Presenta el mayor índice de prioridad (${topPriority.priorityScore}/100) combinando riesgo, población expuesta y déficit de inversión.`,
    criticalAreas: criticalDepts.map(d => d.name),
    recommendedAction: `Focalizar el 60% del presupuesto de mitigación en ${topPriority.name} y distribuir el 40% restante entre ${criticalDepts.slice(1, 3).map(d=>d.name).join(', ')}.`
  };
};

export const simulateRedistribution = (
  departments: PrioritizedDepartment[],
  totalBudget: number
) => {
  // Distribute budget proportionally to priority score
  const totalScore = departments.reduce((sum, dept) => sum + dept.priorityScore, 0);
  
  return departments.map(dept => {
    const allocationPercentage = dept.priorityScore / totalScore;
    const simulatedAllocation = totalBudget * allocationPercentage;
    const impactOnRisk = (simulatedAllocation / (dept.investment || 1)) * 5; // Simplified impact model
    
    return {
      department: dept.name,
      currentInvestment: dept.investment,
      simulatedAllocation,
      newTotalInvestment: dept.investment + simulatedAllocation,
      projectedRiskReduction: Math.min(impactOnRisk, 30) // Max 30% reduction in one cycle
    };
  });
};

export const generatePrioritizedProjectList = (projects: Project[], prioritizedDepartments: PrioritizedDepartment[]) => {
  // Rank projects based on the priority of their department and their own status
  const deptRankMap = new Map(prioritizedDepartments.map(d => [d.name, d.rank]));
  
  const rankedProjects = projects.map(p => {
    const deptRank = deptRankMap.get(p.departamento) || 999;
    let projectScore = 100 - deptRank; // Base score from department
    
    // Add points for critical states or high physical progress with low financial (needs money)
    if (p.estado === 'En estructuración') projectScore += 10;
    if (p.avanceFisico > p.avanceFinanciero + 20) projectScore += 15;
    
    return {
      project: p,
      priorityScore: projectScore
    };
  });
  
  return rankedProjects.sort((a, b) => b.priorityScore - a.priorityScore);
};
