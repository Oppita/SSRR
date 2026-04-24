import { ProjectDocument, LiquidacionChecklist } from '../types';

export const LIQUIDACION_CHECKLIST: LiquidacionChecklist = {
  items: [
    { id: '1', nombre: 'Certificados Financieros', tipoDocumento: 'Soporte Financiero (CDP, RP)', obligatorio: true },
    { id: '2', nombre: 'CDPs', tipoDocumento: 'CDP', obligatorio: true },
    { id: '3', nombre: 'Contrato', tipoDocumento: 'Contrato', obligatorio: true },
    { id: '4', nombre: 'Actas', tipoDocumento: 'Acta', obligatorio: true },
    { id: '5', nombre: 'Informes Finales', tipoDocumento: 'Informe', obligatorio: true },
    { id: '6', nombre: 'RUT', tipoDocumento: 'RUT', obligatorio: true },
  ]
};

export const checkLiquidacionProgress = (contractId: string, documents: ProjectDocument[]) => {
  const contractDocs = documents.filter(d => d.contractId === contractId);
  
  const results = LIQUIDACION_CHECKLIST.items.map(item => ({
    ...item,
    cargado: contractDocs.some(d => d.tipo === item.tipoDocumento)
  }));

  const completados = results.filter(r => r.cargado).length;
  const total = results.length;
  const porcentaje = (completados / total) * 100;

  return {
    results,
    porcentaje,
    completo: completados === total
  };
};
