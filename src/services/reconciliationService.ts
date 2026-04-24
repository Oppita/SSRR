import { Project, Otrosie, InterventoriaReport, ActaComite, Afectacion } from '../types';

export const reconciliationService = {
  /**
   * Concilia el avance físico del proyecto basándose en múltiples fuentes.
   * Prioriza el dato más reciente y con mayor nivel de detalle.
   */
  reconcilePhysicalProgress: (
    currentProject: Project,
    reports: InterventoriaReport[],
    actas: ActaComite[]
  ): number => {
    let latestProgress = currentProject.avanceFisico || 0;
    
    // 1. Considerar informes de interventoría (suelen ser los más frecuentes)
    if (reports.length > 0) {
      const latestReport = [...reports].sort((a, b) => b.semana - a.semana)[0];
      if (latestReport.obraEjecutadaPct > latestProgress) {
        latestProgress = latestReport.obraEjecutadaPct;
      }
    }
    
    // 2. Considerar actas de comité (suelen ser más autoritativas)
    if (actas && actas.length > 0) {
      const latestActa = [...actas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
      if (latestActa.estadoCronograma?.avanceFisico !== undefined && latestActa.estadoCronograma.avanceFisico > latestProgress) {
        latestProgress = latestActa.estadoCronograma.avanceFisico;
      }
    }
    
    return latestProgress;
  },

  /**
   * Actualiza el historial de avances del proyecto.
   */
  updateProgressHistory: (
    currentProject: Project,
    newValue: number,
    origenId: string,
    origenTipo: 'Informe' | 'ActaComite' | 'Otro'
  ): Project => {
    const newEntry = {
      fecha: new Date().toISOString(),
      valor: newValue,
      origenId,
      origenTipo
    };

    const history = [...(currentProject.historialAvances || [])];
    
    // Evitar duplicados del mismo origen
    const existingIndex = history.findIndex(h => h.origenId === origenId);
    if (existingIndex !== -1) {
      history[existingIndex] = newEntry;
    } else {
      history.push(newEntry);
    }

    return {
      ...currentProject,
      historialAvances: history,
      avanceFisico: Math.max(...history.map(h => h.valor), currentProject.avanceFisico || 0)
    };
  },

  /**
   * Detecta si una afectación ya ha sido formalizada por un otrosí.
   */
  isAfectacionFormalized: (afectacion: Afectacion, otrosies: Otrosie[]): boolean => {
    if (afectacion.documentoReferenciaId) return true;
    
    // Búsqueda heurística por valor y fecha aproximada si no hay ID de referencia
    return otrosies.some(o => 
      o.valorAdicional === afectacion.valor && 
      Math.abs(new Date(o.fechaFirma).getTime() - new Date(afectacion.fecha).getTime()) < 30 * 24 * 60 * 60 * 1000 // 30 días
    );
  },

  /**
   * Concilia las fechas del proyecto.
   */
  reconcileProjectDates: (
    currentProject: Project,
    otrosies: Otrosie[],
    actas: ActaComite[]
  ): { fechaInicio: string; fechaFin: string } => {
    let fechaInicio = currentProject.fechaInicio || '';
    let fechaFin = currentProject.fechaFin || '';

    // Las actas de comité suelen tener la información más actualizada del "terreno"
    if (actas && actas.length > 0) {
      const latestActa = [...actas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
      if (latestActa.estadoCronograma?.fechaInicioPrevista) {
        fechaInicio = latestActa.estadoCronograma.fechaInicioPrevista;
      }
      if (latestActa.estadoCronograma?.fechaFinPrevista) {
        fechaFin = latestActa.estadoCronograma.fechaFinPrevista;
      }
    }

    return { fechaInicio, fechaFin };
  }
};
