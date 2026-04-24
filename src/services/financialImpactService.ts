import { ProjectData, MunicipalityInventory, DamageItem } from '../types';

export interface ImpactMetric {
  category: 'Vivienda' | 'Vías' | 'Agricultura' | 'Salud' | 'Educación' | 'Agua/Saneamiento' | 'Otro';
  unit: 'viviendas' | 'km' | 'hectáreas' | 'centros' | 'estudiantes' | 'personas' | 'unidades';
  estimatedNeed: number;
  mitigated: number;
  standardUnitCost: number;
  actualInvestment: number;
}

export interface FinancialImpactAlert {
  id: string;
  type: 'Ineficiencia' | 'Sobrecosto' | 'Desalineación';
  description: string;
  severity: 'Alta' | 'Media' | 'Baja';
  metricCategory: string;
  valueDeviation: number;
}

export interface FinancialImpactAnalysis {
  projectId: string;
  totalInvestment: number;
  metrics: ImpactMetric[];
  indicators: {
    eficienciaFinanciera: number; // (Valor Estándar * Obra mitigada) / Inversión Real (Ideal > 1)
    eficaciaGasto: number; // Obra mitigada / Necesidad estimada (Ideal: 1)
    retornoSocial: number; // Representativo: (Población Afectada Resuelta * Valor Subjetivo) / Inversión
  };
  alerts: FinancialImpactAlert[];
}

/**
 * Metodología para vincular registros financieros con impacto real generado.
 * 
 * Paso 1. Extracción de Necesidades (EDAN)
 * Paso 2. Extracción de Avances Físicos (Reportes de Interventoría / Seguimiento)
 * Paso 3. Agrupación Financiera (Contratos, Pagos, Afectaciones)
 * Paso 4. Cálculo de unitarios funcionales (Ej: Costo / Vivienda, Costo / Km)
 * Paso 5. Detección de Desviaciones (Sobrecostos, Ineficiencias, Desalineaciones)
 */
export const calculateFinancialImpact = (
  projectData: ProjectData,     // Datos financieros y de ejecución del proyecto
  edanData: MunicipalityInventory // Datos base de afectación en territorio
): FinancialImpactAnalysis => {
  
  // 1. Calcular inversión financiera total
  const totalInvestment = projectData.presupuesto?.valorTotal || 0;
  
  const metrics: ImpactMetric[] = [];
  const alerts: FinancialImpactAlert[] = [];

  // MOCK DATA for methodology demonstration if data is incomplete.
  const hasEdanData = edanData && edanData.danosVivienda;

  // Example 1: Vivienda
  const viviendasDestruidas = hasEdanData ? (edanData.danosVivienda?.destruidas?.cantidad || 0) : Math.floor(Math.random() * 200) + 50;
  const viviendasAveriadas = hasEdanData ? (edanData.danosVivienda?.grave?.cantidad || 0) : Math.floor(Math.random() * 300) + 100;
  const necesidadVivienda = viviendasDestruidas + viviendasAveriadas;
  const costoEstandarVivienda = hasEdanData ? (edanData.danosVivienda?.destruidas?.valorUnitario || 120000000) : 120000000;
  
  const hAfectadas = hasEdanData ? (edanData.infraestructuraPorSector?.agricultura?.hectareasPerdidaTotal || 0) : Math.floor(Math.random() * 500) + 50;
  const standardHaCost = 8500000;

  const kmsVias = hasEdanData ? (edanData.infraestructuraPorSector?.transporteVias?.viasSecundarias?.cantidad || 0) : Math.floor(Math.random() * 30) + 5;
  const standardKmCost = 450000000;

  const isVivienda = projectData.project.nombre.toLowerCase().includes('vivienda') || projectData.project.nombre.toLowerCase().includes('casa') || (!projectData.project.nombre.toLowerCase().includes('via') && !projectData.project.nombre.toLowerCase().includes('agri'));
  const isAgri = projectData.project.nombre.toLowerCase().includes('agri') || projectData.project.nombre.toLowerCase().includes('culti');
  const isVias = projectData.project.nombre.toLowerCase().includes('vía') || projectData.project.nombre.toLowerCase().includes('camino') || projectData.project.nombre.toLowerCase().includes('puente');

  const avanceFisico = projectData.avances?.[projectData.avances.length - 1]?.fisicoPct || (Math.random() * 60 + 20); // Default to a random advance if missing
  const actualPaid = projectData.presupuesto?.pagosRealizados || (totalInvestment * (Math.random() * 0.4 + 0.3));

  if (isVivienda || totalInvestment === 0) {
     const mitigadoVivienda = Math.floor(necesidadVivienda * (avanceFisico / 100));
     
     metrics.push({
       category: 'Vivienda',
       unit: 'viviendas',
       estimatedNeed: necesidadVivienda,
       mitigated: mitigadoVivienda,
       standardUnitCost: costoEstandarVivienda,
       actualInvestment: actualPaid > 0 ? actualPaid : totalInvestment || (mitigadoVivienda * costoEstandarVivienda * 1.1)
     });
  }

  if (isAgri) {
     const mitigadoHa = Math.floor(hAfectadas * (avanceFisico / 100));
     metrics.push({
        category: 'Agricultura',
        unit: 'hectáreas',
        estimatedNeed: hAfectadas,
        mitigated: mitigadoHa,
        standardUnitCost: standardHaCost,
        actualInvestment: actualPaid > 0 ? actualPaid : totalInvestment || (mitigadoHa * standardHaCost * 1.3)
      });
  }

  if (isVias) {
    const mitigadoKm = Math.floor(kmsVias * (avanceFisico / 100));
     metrics.push({
        category: 'Vías',
        unit: 'km',
        estimatedNeed: kmsVias,
        mitigated: mitigadoKm,
        standardUnitCost: standardKmCost,
        actualInvestment: actualPaid > 0 ? actualPaid : totalInvestment || (mitigadoKm * standardKmCost * 0.9)
      });
  }

  // Calculate generic aggregate metrics 
  let totalEfficacy = 0;
  let totalEfficiency = 0;

  metrics.forEach(metric => {
    // Eficacia
    const efficacy = metric.estimatedNeed > 0 ? (metric.mitigated / metric.estimatedNeed) : 0;
    totalEfficacy += efficacy;

    // Eficiencia & Sobrecostos
    // Costo Real por Unidad
    const actualUnitCost = metric.mitigated > 0 ? (metric.actualInvestment / metric.mitigated) : 0;
    
    // Si el costo actual es mayor en un 20% al estandar -> Sobrecosto
    if (actualUnitCost > metric.standardUnitCost * 1.2) {
      alerts.push({
        id: Math.random().toString(),
        type: 'Sobrecosto',
        description: `El costo actual por ${metric.unit} es de $${actualUnitCost.toLocaleString()}, superando el estándar de $${metric.standardUnitCost.toLocaleString()}.`,
        severity: actualUnitCost > metric.standardUnitCost * 1.5 ? 'Alta' : 'Media',
        metricCategory: metric.category,
        valueDeviation: (actualUnitCost / metric.standardUnitCost) - 1
      });
    }

    // Desalineación
    // Inversiones altas cuando la necesidad es baja
    if (metric.actualInvestment > 1000000000 && metric.estimatedNeed < 5) {
      alerts.push({
        id: Math.random().toString(),
        type: 'Desalineación',
        description: `Fuerte inversión en ${metric.category} pero baja necesidad registrada en el EDAN (${metric.estimatedNeed} ${metric.unit}).`,
        severity: 'Alta',
        metricCategory: metric.category,
        valueDeviation: 0
      });
    }

    const efficiency = actualUnitCost > 0 ? (metric.standardUnitCost / actualUnitCost) : 1;
    totalEfficiency += efficiency;
  });

  const avgEfficacy = metrics.length > 0 ? totalEfficacy / metrics.length : 0;
  const avgEfficiency = metrics.length > 0 ? totalEfficiency / metrics.length : 1;

  // Si no hay métricas, generamos una alerta de Ineficiencia por falta de trazabilidad
  if (metrics.length === 0 && totalInvestment > 0) {
    alerts.push({
      id: Math.random().toString(),
      type: 'Ineficiencia',
      description: 'Los recursos financieros no están vinculados a ninguna estructura de medición física o meta del EDAN.',
      severity: 'Alta',
      metricCategory: 'General',
      valueDeviation: 0
    });
  }

  return {
    projectId: projectData.project.id,
    totalInvestment,
    metrics,
    indicators: {
      eficienciaFinanciera: avgEfficiency,
      eficaciaGasto: avgEfficacy,
      retornoSocial: avgEfficacy * 1.5, // Dummy proxy calculation
    },
    alerts
  };
};
