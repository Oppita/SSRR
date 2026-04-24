import { InterventoriaReport } from '../types';

export interface ProjectAlerts {
  status: 'normal' | 'riesgo' | 'critico';
  alerts: string[];
  trend: 'up' | 'down' | 'flat';
  latestReport?: InterventoriaReport;
}

export function analyzeProjectReports(reports: InterventoriaReport[] | undefined): ProjectAlerts {
  if (!reports || reports.length === 0) {
    return { status: 'normal', alerts: [], trend: 'flat' };
  }

  // Sort reports by week ascending
  const sorted = [...reports].sort((a, b) => a.semana - b.semana);
  const latest = sorted[sorted.length - 1];
  const previous = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const twoWeeksAgo = sorted.length > 2 ? sorted[sorted.length - 3] : null;

  const alerts: string[] = [];
  let status: 'normal' | 'riesgo' | 'critico' = 'normal';
  let trend: 'up' | 'down' | 'flat' = 'flat';

  // 1. Avance ejecutado < programado
  if (latest.obraEjecutadaPct < latest.obraProgramadaPct) {
    const diff = latest.obraProgramadaPct - latest.obraEjecutadaPct;
    if (diff > 10) {
      alerts.push(`Retraso crítico: Avance físico ${diff.toFixed(1)}% por debajo de lo programado.`);
      status = 'critico';
    } else {
      alerts.push(`Retraso moderado: Avance físico ${diff.toFixed(1)}% por debajo de lo programado.`);
      status = 'riesgo';
    }
  }

  // 2. Ejecución financiera anómala
  if (latest.valorEjecutado > latest.valorProgramado) {
    const overspend = latest.valorEjecutado - latest.valorProgramado;
    alerts.push(`Sobrecosto detectado: Ejecución financiera supera lo programado en $${(overspend/1000000).toFixed(1)}M.`);
    if (status !== 'critico') status = 'riesgo';
  }
  
  if (latest.valorProgramado > 0 && latest.obraProgramadaPct > 0) {
    const financialRatio = latest.valorEjecutado / latest.valorProgramado;
    const physicalRatio = latest.obraEjecutadaPct / latest.obraProgramadaPct;
    if (financialRatio > physicalRatio + 0.2) {
      alerts.push(`Ejecución financiera anómala: El gasto avanza más rápido que la obra física.`);
      status = 'critico';
    }
  }

  // 3. Múltiples semanas sin avance
  if (previous && latest.obraEjecutadaPct === previous.obraEjecutadaPct) {
    if (twoWeeksAgo && previous.obraEjecutadaPct === twoWeeksAgo.obraEjecutadaPct) {
      alerts.push(`Alerta: 3 semanas consecutivas sin avance físico reportado.`);
      status = 'critico';
    } else {
      alerts.push(`Advertencia: Sin avance físico respecto a la semana anterior.`);
      if (status !== 'critico') status = 'riesgo';
    }
  }

  // 4. Inconsistencias en reportes
  if (previous && latest.obraEjecutadaPct < previous.obraEjecutadaPct) {
    alerts.push(`Inconsistencia: El avance físico actual (${latest.obraEjecutadaPct}%) es menor al de la semana anterior (${previous.obraEjecutadaPct}%).`);
    status = 'critico';
  }
  if (previous && latest.valorEjecutado < previous.valorEjecutado) {
    alerts.push(`Inconsistencia: El valor ejecutado actual es menor al de la semana anterior.`);
    status = 'critico';
  }

  // Trend
  if (previous) {
    if (latest.obraEjecutadaPct > previous.obraEjecutadaPct) trend = 'up';
    else if (latest.obraEjecutadaPct < previous.obraEjecutadaPct) trend = 'down';
    else trend = 'flat';
  } else {
    if (latest.obraEjecutadaPct > 0) trend = 'up';
  }

  return { status, alerts, trend, latestReport: latest };
}
