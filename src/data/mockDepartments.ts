import { DepartmentRisk, Threat } from '../types';
import { colombiaData } from './colombiaData';

// Generate a full list of departments with default values
export const mockDepartments: DepartmentRisk[] = colombiaData.map((dept, index) => ({
  id: String(index + 1),
  name: dept.name,
  population: 500000, // Default fallback
  extension: 10000, // Default fallback
  density: 50,
  riskIndex: 50 + Math.floor(Math.random() * 40), // Random risk index between 50 and 90
  threats: ['t1', 't2'],
  investment: 10000000000,
  disasterHistoryScore: 60
}));

// Override specific departments with more realistic data if desired
const specificData: Record<string, Partial<DepartmentRisk>> = {
  'Antioquia': { population: 6677930, extension: 63612, density: 106, riskIndex: 85, threats: ['t1', 't2'], investment: 120000000000, disasterHistoryScore: 90 },
  'Cundinamarca': { population: 3242999, extension: 24210, density: 134, riskIndex: 60, threats: ['t1'], investment: 80000000000, disasterHistoryScore: 50 },
  'Valle del Cauca': { population: 4532152, extension: 22140, density: 204, riskIndex: 75, threats: ['t3'], investment: 95000000000, disasterHistoryScore: 70 },
  'Chocó': { population: 544764, extension: 46530, density: 11, riskIndex: 95, threats: ['t1', 't2', 't5'], investment: 15000000000, disasterHistoryScore: 95 },
  'La Guajira': { population: 965718, extension: 20848, density: 46, riskIndex: 88, threats: ['t4'], investment: 25000000000, disasterHistoryScore: 80 },
  'Nariño': { population: 1627589, extension: 33268, density: 49, riskIndex: 82, threats: ['t1', 't2', 't5'], investment: 35000000000, disasterHistoryScore: 85 },
  'Cauca': { population: 1436916, extension: 29308, density: 49, riskIndex: 78, threats: ['t1', 't2', 't3'], investment: 28000000000, disasterHistoryScore: 75 },
  'Putumayo': { population: 359127, extension: 24885, density: 14, riskIndex: 80, threats: ['t1', 't2'], investment: 18000000000, disasterHistoryScore: 82 },
  'Magdalena': { population: 1427026, extension: 23188, density: 61, riskIndex: 70, threats: ['t1', 't4', 't5'], investment: 22000000000, disasterHistoryScore: 65 },
  'Atlántico': { population: 2722128, extension: 3388, density: 803, riskIndex: 65, threats: ['t1', 't5'], investment: 45000000000, disasterHistoryScore: 60 }
};

mockDepartments.forEach(dept => {
  if (specificData[dept.name]) {
    Object.assign(dept, specificData[dept.name]);
  }
});

export const mockThreats: Threat[] = [
  { id: 't1', name: 'Inundación', description: 'Desbordamiento de ríos' },
  { id: 't2', name: 'Deslizamiento', description: 'Movimiento en masa' },
  { id: 't3', name: 'Sismo', description: 'Actividad sísmica' },
  { id: 't4', name: 'Sequía', description: 'Déficit hídrico' },
  { id: 't5', name: 'Erosión Costera', description: 'Pérdida de costa' }
];
