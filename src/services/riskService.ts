import { RiesgoTerritorial, Municipio } from '../types';

const IMPACT_MAP = {
  'alto': 1.0,
  'medio': 0.5,
  'bajo': 0.25
};

export const calculateRiesgo = (riesgo: RiesgoTerritorial): number => {
  const impactoNumerico = IMPACT_MAP[riesgo.impacto];
  return riesgo.probabilidad * impactoNumerico * riesgo.poblacion_expuesta;
};

export const calculateMunicipioRisk = (municipioId: string, riesgos: RiesgoTerritorial[]): number => {
  if (!riesgos) return 0;
  return riesgos
    .filter(r => r.municipioId === municipioId)
    .reduce((total, r) => total + calculateRiesgo(r), 0);
};

export const getRiskRanking = (riesgos: RiesgoTerritorial[], municipios: Municipio[]): { municipio: string, riesgoTotal: number }[] => {
  if (!municipios) return [];
  const ranking = municipios.map(m => ({
    municipio: m.nombre,
    riesgoTotal: calculateMunicipioRisk(m.id, riesgos)
  }));

  return ranking.sort((a, b) => b.riesgoTotal - a.riesgoTotal);
};

export const getPrioritizedRisks = (municipioId: string, riesgos: RiesgoTerritorial[]): RiesgoTerritorial[] => {
  return riesgos
    .filter(r => r.municipioId === municipioId)
    .sort((a, b) => calculateRiesgo(b) - calculateRiesgo(a));
};

export const getMitigationGaps = (municipioId: string, riesgos: RiesgoTerritorial[], proyectos: any[]): RiesgoTerritorial[] => {
  const riesgosMunicipio = riesgos.filter(r => r.municipioId === municipioId);
  const riesgosMitigadosIds = new Set(
    proyectos.flatMap(p => p.riesgosMitigados || [])
  );
  
  return riesgosMunicipio.filter(r => !riesgosMitigadosIds.has(r.id));
};

export const calculateImpactoProyecto = (poblacionAntes: number, poblacionDespues: number): number => {
  return Math.max(0, poblacionAntes - poblacionDespues);
};

export const calculateEficiencia = (impacto: number, costo: number): number => {
  if (costo === 0) return 0;
  return impacto / costo;
};

// Simulation functions
export const simularInversion = (monto: number, municipioId: string, tipoObra: string, riesgos: RiesgoTerritorial[]) => {
  const riesgoActual = calculateMunicipioRisk(municipioId, riesgos);
  
  // Factores de impacto por tipo de obra (simplificado)
  const factores: Record<string, number> = {
    'infraestructura': 0.5,
    'educacion': 0.2,
    'salud': 0.3,
    'ambiental': 0.4
  };
  
  const factorObra = factores[(tipoObra || '').toLowerCase()] || 0.1;
  const reduccionRiesgo = riesgoActual * factorObra * (monto / 1000000000); // Simplificado
  const personasProtegidas = Math.floor(monto / 5000000); // Simplificado: 5M por persona
  const eficiencia = calculateEficiencia(personasProtegidas, monto);
  
  return {
    reduccionRiesgo: Math.min(reduccionRiesgo, riesgoActual),
    personasProtegidas,
    eficiencia
  };
};

export const simularInversionInversa = (porcentajeReduccion: number, municipioId: string, tipoObra: string, riesgos: RiesgoTerritorial[]) => {
  const riesgoActual = calculateMunicipioRisk(municipioId, riesgos);
  const targetReduccion = riesgoActual * (porcentajeReduccion / 100);
  
  const factores: Record<string, number> = {
    'infraestructura': 0.5,
    'educacion': 0.2,
    'salud': 0.3,
    'ambiental': 0.4
  };
  
  const factorObra = factores[(tipoObra || '').toLowerCase()] || 0.1;
  
  // Inversa: monto = targetReduccion / (factorObra * (1 / 1000000000))
  const montoRequerido = targetReduccion / (factorObra * (1 / 1000000000));
  
  return {
    montoRequerido
  };
};

// Disaster simulation function
export const simularDesastre = (tipoDesastre: string, riesgos: RiesgoTerritorial[], proyectos: any[]) => {
  // 1. Identify affected municipalities (those with high risk of the disaster type)
  const affectedRisks = riesgos.filter(r => 
    (r.tipo_riesgo || '').toLowerCase() === (tipoDesastre || '').toLowerCase() && r.impacto === 'alto'
  );
  
  const affectedMunicipios = Array.from(new Set(affectedRisks.map(r => r.municipioId)));
  
  // 2. Identify projects that help (mitigate these risks)
  const projectsThatHelp = proyectos.filter(p => 
    p.riesgosMitigados?.some((id: string) => affectedRisks.some(r => r.id === id))
  );
  
  // 3. Estimate impact avoided (simplified)
  const impactAvoided = affectedRisks.reduce((total, r) => total + r.poblacion_expuesta, 0);
  
  return {
    affectedMunicipios,
    projectsThatHelp,
    impactAvoided
  };
};
