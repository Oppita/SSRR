export interface InterventoriaDiagnostic {
  coherenceScore: number; // 0-100
  contractualCompliance: 'Cumple' | 'Incumplimiento Potencial' | 'Incumplimiento';
  followUpQuality: 'Alta' | 'Media' | 'Baja';
  gapsDetected: string[];
  technicalObservations: string[];
  recommendations: string[];
  criticalAlerts: {
    type: 'Retraso' | 'Financiero' | 'Jurídico';
    severity: 'Alta' | 'Media';
    message: string;
  }[];
}
