import { ProjectData } from '../types';

export interface AlertResult {
  projectId: string;
  projectName: string;
  type: 'FisicoFinanciero' | 'FinancieroFisico' | 'SinContratos' | 'InconsistenciaPresupuestal' | 'SinAvancesRecientes' | 'RiesgoContractual';
  message: string;
  level: 'Alto' | 'Medio' | 'Bajo';
}

export const detectAlerts = (projects: ProjectData[]): AlertResult[] => {
  const alerts: AlertResult[] = [];

  projects.forEach(p => {
    // 221: avance físico > financiero
    if (p.project.avanceFisico > p.project.avanceFinanciero + 5) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'FisicoFinanciero',
        message: `Avance físico (${p.project.avanceFisico}%) supera al financiero (${p.project.avanceFinanciero}%).`,
        level: 'Medio'
      });
    }

    // 222: avance financiero > físico (riesgo crítico)
    if (p.project.avanceFinanciero > p.project.avanceFisico + 5) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'FinancieroFisico',
        message: `Avance financiero (${p.project.avanceFinanciero}%) supera al físico (${p.project.avanceFisico}%). Riesgo crítico.`,
        level: 'Alto'
      });
    }

    // 223: proyectos sin contratos registrados
    if (p.contracts.length === 0) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'SinContratos',
        message: 'El proyecto no tiene contratos registrados.',
        level: 'Alto'
      });
    }

    // 224: inconsistencias en CDP / RC
    if (p.presupuesto.pagosRealizados > p.presupuesto.valorTotal) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'InconsistenciaPresupuestal',
        message: 'Pagos realizados superan el valor total del presupuesto.',
        level: 'Alto'
      });
    }

    // 225: no hay avances recientes (asumiendo que los avances están ordenados por fecha)
    if (p.avances.length === 0) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'SinAvancesRecientes',
        message: 'No hay reportes de avance recientes.',
        level: 'Medio'
      });
    }

    // 226: riesgo de incumplimiento contractual (ej. plazo vencido o cerca de vencer)
    // Simplificación: si el avance físico es bajo y el tiempo transcurrido es alto
    const fechaInicio = new Date(p.project.fechaInicio);
    const fechaFin = new Date(p.project.fechaFin);
    const hoy = new Date();
    const totalDias = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24);
    const diasTranscurridos = (hoy.getTime() - fechaInicio.getTime()) / (1000 * 3600 * 24);
    const porcentajeTiempo = (diasTranscurridos / totalDias) * 100;

    if (porcentajeTiempo > 80 && p.project.avanceFisico < 70) {
      alerts.push({
        projectId: p.project.id,
        projectName: p.project.nombre,
        type: 'RiesgoContractual',
        message: 'Alto riesgo de incumplimiento: tiempo transcurrido > 80% y avance físico < 70%.',
        level: 'Alto'
      });
    }
  });

  return alerts;
};
