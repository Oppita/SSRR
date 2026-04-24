import { Project, Contract, Otrosie, ContractEvent, Convenio, Afectacion, Pago, Suspension, InterventoriaReport, Presupuesto } from '../types';
import { reconciliationService } from '../services/reconciliationService';

export interface ProjectCalculatedState {
  valorOriginal: number;
  valorAdicional: number;
  valorTotal: number;
  valorContratado: number;
  valorEjecutado: number;
  saldoPorContratar: number;
  saldoPorEjecutar: number;
  plazoOriginalMeses: number;
  plazoAdicionalMeses: number;
  plazoTotalMeses: number;
  fechaFinCalculada: string;
}

export const calculateContractTotals = (contract: Contract, otrosies: Otrosie[], events?: ContractEvent[], pagos?: Pago[]) => {
  const contractOtrosies = otrosies.filter(o => o.contractId === contract.id);
  const contractEvents = events || contract.eventos || [];
  
  const valorAdicionalOtrosies = contractOtrosies.reduce((sum, o) => sum + (o.valorAdicional || 0), 0);
  const valorAdicionalEventos = contractEvents.reduce((sum, e) => sum + (e.impactoValor || 0), 0);
  const valorAdicional = valorAdicionalOtrosies + valorAdicionalEventos;
  
  const plazoAdicionalMesesOtrosies = contractOtrosies.reduce((sum, o) => sum + (o.plazoAdicionalMeses || 0), 0);
  const plazoAdicionalMesesEventos = contractEvents.filter(e => e.tipo === 'Prórroga').reduce((sum, e) => sum + (e.impactoPlazoMeses || 0), 0);
  const plazoAdicionalMeses = plazoAdicionalMesesOtrosies + plazoAdicionalMesesEventos;
  
  const valorTotal = contract.valor + valorAdicional;

  // Calculate valor pagado
  const contractPagos = (pagos || []).filter(p => p.contractId === contract.id && (p.estado?.trim().toLowerCase() === 'pagado' || p.estado === 'Pagado'));
  const valorPagado = contractPagos.reduce((sum, p) => sum + (p.valor || 0), 0);
  
  let fechaFinCalculada = contract.fechaFin || '';
  if (contract.fechaInicio) {
    const startDate = new Date(contract.fechaInicio);
    if (!isNaN(startDate.getTime())) {
      const totalMonths = (contract.plazoMeses || 0) + (plazoAdicionalMeses || 0);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + totalMonths);
      fechaFinCalculada = endDate.toISOString().split('T')[0];
    }
  }
  
  return {
    valorOriginal: contract.valor,
    valorAdicional,
    valorTotal,
    valorPagado,
    plazoOriginalMeses: contract.plazoMeses,
    plazoAdicionalMeses,
    plazoTotalMeses: (contract.plazoMeses || 0) + plazoAdicionalMeses,
    fechaFinCalculada
  };
};

export const calculateProjectTotals = (
  project: Project, 
  contracts: Contract[], 
  otrosies: Otrosie[],
  convenios: Convenio[],
  afectaciones: Afectacion[],
  pagos?: Pago[],
  suspensiones?: Suspension[],
  events?: ContractEvent[],
  allProjects?: Project[],
  reports?: InterventoriaReport[],
  presupuestos?: Presupuesto[]
): ProjectCalculatedState => {
  // Si el proyecto pertenece a un convenio, agregamos todos los proyectos de ese convenio
  const isConvenio = !!project.convenioId;
  const convenio = isConvenio ? convenios.find(c => c.id === project.convenioId) : null;
  
  let relevantProjects = [project];
  if (isConvenio && allProjects) {
    relevantProjects = allProjects.filter(p => p.convenioId === project.convenioId);
  }

  const relevantProjectIds = relevantProjects.map(p => p.id);
  
  const relevantContracts = contracts.filter(c => relevantProjectIds.includes(c.projectId));
  const relevantAfectaciones = afectaciones.filter(a => relevantProjectIds.includes(a.projectId || ''));
  const convenioOtrosies = isConvenio ? otrosies.filter(o => o.convenioId === project.convenioId) : [];
  
  const projectPresupuesto = presupuestos?.find(p => p.projectId === project.id);

  // 1. Presupuesto Base: Convenio > Presupuesto > Matrix > Suma Contratos
  const valorOriginal = convenio ? (Number(convenio.valorTotal) || 0) : (Number(projectPresupuesto?.valorTotal) || Number(project.matrix?.valorTotalProyecto) || relevantContracts.reduce((sum, c) => sum + (Number(c.valor) || 0), 0));
  
  // 2. Afectaciones Dinámicas y Otrosíes
  // Conciliación: Solo sumamos afectaciones que NO han sido formalizadas por otrosíes
  const adiciones = relevantAfectaciones
    .filter(a => a.tipo === 'Adición' && !reconciliationService.isAfectacionFormalized(a, otrosies))
    .reduce((sum, a) => sum + (Number(a.valor) || 0), 0);
    
  const reducciones = relevantAfectaciones
    .filter(a => a.tipo === 'Reducción' || a.tipo === 'Liberación')
    .reduce((sum, a) => sum + (Number(a.valor) || 0), 0);
  const valorAdicionalConvenioOtrosies = convenioOtrosies.reduce((sum, o) => sum + (Number(o.valorAdicional) || 0), 0);
  
  // 4. Valor Contratado (Contratos + Otrosíes)
  const valorContratado = relevantContracts.reduce((sum, c) => {
    const totals = calculateContractTotals(c, otrosies, events?.filter(e => e.contractId === c.id));
    return sum + (Number(totals.valorTotal) || 0);
  }, 0);

  const valorAdicionalOtrosies = relevantContracts.reduce((sum, c) => {
    const totals = calculateContractTotals(c, otrosies, events?.filter(e => e.contractId === c.id));
    return sum + (Number(totals.valorAdicional) || 0);
  }, 0);

  // 3. Valor Total = Base (Convenio) + Otrosíes (Convenio)
  // Nota: Las afectaciones/actas ya no afectan el valor total.
  const valorTotal = valorOriginal + valorAdicionalConvenioOtrosies;
  
  // 5. Valor Ejecutado (Pagos o Informes)
  const relevantPagos = (pagos || []).filter(p => relevantContracts.some(c => c.id === p.contractId));
  
  let valorEjecutado = relevantPagos
    .reduce((sum, p) => {
      const isPagado = p.estado?.trim().toLowerCase() === 'pagado';
      return sum + (isPagado ? p.valor : 0);
    }, 0);
  
  // Si no hay pagos registrados, intentar sumar valorEjecutado de los informes de interventoría
  if (valorEjecutado === 0 && reports) {
    const relevantReports = reports.filter(r => relevantProjectIds.includes(r.projectId));
    valorEjecutado = relevantReports.reduce((sum, r) => sum + (r.valorEjecutado || 0), 0);
  }

  // Si sigue siendo 0 y hay datos en la matriz, usar esos
  if (valorEjecutado === 0 && project.matrix) {
    valorEjecutado = (project.matrix.valorPagadoConvenio || 0) + (project.matrix.valorPagadoObra || 0) + (project.matrix.valorPagadoInterventoria || 0);
  }

  // 6. Plazo (considerando suspensiones)
  const plazoOriginalMeses = relevantContracts.reduce((sum, c) => sum + (c.plazoMeses || 0), 0);
  const plazoAdicionalMeses = relevantContracts.reduce((sum, c) => {
    const totals = calculateContractTotals(c, otrosies, events?.filter(e => e.contractId === c.id));
    return sum + totals.plazoAdicionalMeses;
  }, 0);
  
  // Ajuste por suspensiones
  const tiempoSuspension = (suspensiones || [])
    .filter(s => relevantContracts.some(c => c.id === s.contractId))
    .reduce((sum, s) => sum + (s.plazoMeses || 0), 0);

  return {
    valorOriginal,
    valorAdicional: valorAdicionalConvenioOtrosies,
    valorTotal,
    valorContratado,
    valorEjecutado,
    saldoPorContratar: valorTotal - valorContratado,
    saldoPorEjecutar: valorContratado - valorEjecutado,
    plazoOriginalMeses,
    plazoAdicionalMeses,
    plazoTotalMeses: plazoOriginalMeses + plazoAdicionalMeses + tiempoSuspension,
    fechaFinCalculada: project.fechaFin || ''
  };
};
