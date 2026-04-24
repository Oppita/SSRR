export type ThreatType = 'inundación' | 'deslizamiento' | 'sismo' | 'sequía' | 'erosión costera';

export interface DepartmentRiskData {
  id: string;
  name: string;
  population: number;
  extension?: number;
  density: number;
  riskIndex: number; // 0-100
  predominantThreats: ThreatType[];
  investment: number;
  potContext?: {
    summary: string;
    keyRisks: string[];
    developmentGoals: string[];
  };
}

export interface RiskDiagnostic {
  department: string;
  riskLevel: 'crítico' | 'vulnerable' | 'controlado';
  investmentVsRisk: number;
  attentionLevel: 'Alta' | 'Media' | 'Baja';
}
