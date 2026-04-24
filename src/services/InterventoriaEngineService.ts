import { ProjectData } from '../types';
import { InterventoriaDiagnostic } from '../types/interventoria';

export const analyzeProjectInterventoria = (data: ProjectData): InterventoriaDiagnostic => {
  const { project, seguimientos, interventoriaReports } = data;

  // 1. Coherence Analysis
  const physical = project.avanceFisico || 0;
  const financial = project.avanceFinanciero || 0;
  const schedule = project.avanceProgramado || 0;
  
  const diff = Math.abs(physical - financial);
  const coherenceScore = Math.max(0, 100 - diff * 2);

  // 2. Compliance and Alerts
  const criticalAlerts: InterventoriaDiagnostic['criticalAlerts'] = [];
  if (physical < schedule - 15) {
    criticalAlerts.push({ type: 'Retraso', severity: 'Alta', message: 'Retraso grave en ejecución física' });
  }
  if (financial > physical + 10) {
    criticalAlerts.push({ type: 'Financiero', severity: 'Alta', message: 'Desviación financiera: pagos superan avance físico' });
  }
  if (project.estado === 'En liquidación' && project.matrix?.vencioTerminosLiquidacion === true) {
    criticalAlerts.push({ type: 'Jurídico', severity: 'Alta', message: 'Riesgo jurídico: vencimiento de términos de liquidación' });
  }

  // 3. Cross-reference with real reports
  const technicalObservations: string[] = ['Revisar cronograma actualizado', 'Verificar soportes de pago'];
  const gapsDetected: string[] = [];
  
  if (!interventoriaReports || interventoriaReports.length === 0) {
    gapsDetected.push('No hay informes de interventoría registrados');
  } else {
    interventoriaReports.forEach(report => {
      if ((report.observaciones || '').toLowerCase().includes('atraso') || (report.observaciones || '').toLowerCase().includes('retraso')) {
        technicalObservations.push(`Informe Semana ${report.semana}: Reporta retrasos: ${report.observaciones.substring(0, 50)}...`);
      }
      if ((report.sisoAmbiental || '').toLowerCase().includes('incumplimiento') || (report.sisoAmbiental || '').toLowerCase().includes('alerta')) {
        technicalObservations.push(`Informe Semana ${report.semana}: Alerta ambiental/SISO: ${report.sisoAmbiental.substring(0, 50)}...`);
      }
      if (!report.actividadesEjecutadas || report.actividadesEjecutadas.length < 10) {
        gapsDetected.push(`Informe Semana ${report.semana}: Actividades ejecutadas muy breves`);
      }
    });
  }

  return {
    coherenceScore,
    contractualCompliance: coherenceScore > 80 ? 'Cumple' : (coherenceScore > 50 ? 'Incumplimiento Potencial' : 'Incumplimiento'),
    followUpQuality: (seguimientos?.length || 0) > 5 ? 'Alta' : 'Baja',
    gapsDetected,
    technicalObservations,
    recommendations: ['Actualizar cronograma', 'Solicitar soportes faltantes', 'Atender alertas ambientales registradas'],
    criticalAlerts
  };
};
