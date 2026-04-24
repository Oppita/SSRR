import { Professional } from '../types';

// Escala Decreto 0314 de 2026
const ESCALA_2026 = [
  { min: 0, max: 1917184, tarifa: 173886 },
  { min: 1917185, max: 3012670, tarifa: 237646 },
  { min: 3012671, max: 4022982, tarifa: 288347 },
  { min: 4022983, max: 5102609, tarifa: 335520 },
  { min: 5102610, max: 6162456, tarifa: 385283 },
  { min: 6162457, max: 9293915, tarifa: 434866 },
  { min: 9293916, max: 12989690, tarifa: 528210 },
  { min: 12989691, max: 15423452, tarifa: 712557 },
  { min: 15423453, max: 18986843, tarifa: 926311 },
  { min: 18986844, max: 22958733, tarifa: 1120464 },
  { min: 22958734, max: Infinity, tarifa: 1319516 },
];

// Escala Decreto 0613 de 2025 (Aproximada dividiendo por 1.07 según el decreto)
const ESCALA_2025 = ESCALA_2026.map(r => ({
  min: Math.round(r.min / 1.07),
  max: r.max === Infinity ? Infinity : Math.round(r.max / 1.07),
  tarifa: Math.round(r.tarifa / 1.07)
}));

export const calculateViaticos = (
  professional: Professional,
  fechaAprobacion: string,
  dias: number,
  pernocta: boolean,
  esInternacional: boolean = false
) => {
  if (!professional.salarioMensual) return { tarifaDiaria: 0, total: 0 };

  // 1. Base de Liquidación
  const baseLiquidacion = 
    (professional.salarioMensual || 0) + 
    (professional.gastosRepresentacion || 0) + 
    (professional.incrementoAntiguedad || 0);
  
  // 2. Determinar qué decreto aplica (Interior)
  const fechaAprob = new Date(fechaAprobacion);
  const fechaCorte = new Date('2026-03-27T00:00:00');
  const escala = fechaAprob >= fechaCorte ? ESCALA_2026 : ESCALA_2025;

  let tarifaDiaria = 0;

  if (esInternacional) {
    // Placeholder para exterior según categorías del decreto
    // Categoría 1: Centroamérica, Suramérica (excepto Chile, Brasil, Argentina)
    // Categoría 2: EE.UU, Canadá, Chile, Brasil, África
    // Categoría 3: Europa, Asia, Oceanía, México, Argentina
    // Por ahora usamos una tarifa base en USD (ejemplo 200 USD)
    tarifaDiaria = 250; // USD
  } else {
    for (const rango of escala) {
      if (baseLiquidacion >= rango.min && baseLiquidacion <= rango.max) {
        tarifaDiaria = rango.tarifa;
        break;
      }
    }
  }

  // 3. Condiciones de Pernoctación
  // Sin pernoctación: Solo se reconocerá hasta el 50% del valor diario.
  if (!pernocta) {
    tarifaDiaria = tarifaDiaria * 0.5;
  }

  // 4. Duración de la Comisión (Reducción por días)
  // Días 1 a 15: 100%
  // Días 16 a 30: 75%
  // Día 31 en adelante: 50%
  let total = 0;
  for (let i = 1; i <= dias; i++) {
    let factorDuracion = 1.0;
    if (i > 30) {
      factorDuracion = 0.5;
    } else if (i > 15) {
      factorDuracion = 0.75;
    }
    total += tarifaDiaria * factorDuracion;
  }

  return {
    tarifaDiaria,
    total: Math.round(total)
  };
};
