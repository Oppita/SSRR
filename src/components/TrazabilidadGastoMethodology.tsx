import React from 'react';
import { ShieldCheck, BarChart4, ListChecks, Calculator, AlertCircle, FileText, Landmark } from 'lucide-react';

export const TrazabilidadGastoMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <ShieldCheck className="text-rose-600" size={28} />
          Metodología de Auditoría y Trazabilidad del Gasto
        </h2>
        <p className="text-slate-500 mt-2">Protocolo de cuantificación exacta de recursos invertidos en emergencias (Ley 1523 de 2012).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Tipologías de Gasto */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <BarChart4 size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">1. Tipologías de Gasto</h3>
          </div>
          <div className="space-y-2">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold text-rose-800">Gasto Directo</p>
              <p className="text-[10px] text-rose-700">Ayuda Humanitaria de Emergencia (AHE), kits, materiales de construcción inmediata y subsidios de arrendamiento.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-800">Gasto Operativo</p>
              <p className="text-[10px] text-blue-700">Horas hombre (OPS/Planta), viáticos, combustible, lubricantes y mantenimiento de maquinaria amarilla.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-800">Gasto Indirecto</p>
              <p className="text-[10px] text-slate-700">Costos administrativos prorrateados, seguros de activos, y depreciación de equipos propios utilizados.</p>
            </div>
          </div>
        </div>

        {/* 2. Estructura de Costos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <ListChecks size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Estructura de Costos</h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-[10px]">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-2 text-left">Categoría</th>
                  <th className="p-2 text-left">Componentes Clave</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2 font-bold">Personal</td>
                  <td className="p-2">Honorarios OPS + Horas Extra Planta + Seguridad Social.</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Maquinaria</td>
                  <td className="p-2">Alquiler (m3/hora) o Operación (ACPM + Operador).</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Contratos</td>
                  <td className="p-2">Urgencia Manifiesta (Suministros y Obra).</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold">Logística</td>
                  <td className="p-2">Bodegaje + Transporte de carga + Comunicaciones.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Fórmula de Inversión */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <Calculator size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Fórmula de Inversión Total</h3>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 text-white font-mono text-xs">
            <p className="text-rose-400 mb-2">// Cálculo Consolidado</p>
            <p>Inv_Total = Σ(CDP_Directo) +</p>
            <p className="ml-4">Σ(HH * Tarifa) +</p>
            <p className="ml-4">Σ(Viáticos + Log) +</p>
            <p className="ml-4">Σ(Costos_Indirectos)</p>
            <div className="mt-4 pt-4 border-t border-white/10 text-[10px] text-slate-400">
              * CDP: Certificado de Disponibilidad Presupuestal efectivamente obligado (RP).
            </div>
          </div>
        </div>
      </div>

      {/* 4. Reglas Anti-Doble Contabilización */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          4. Reglas de Oro para Evitar Doble Contabilización
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <p className="text-xs text-amber-800"><strong>Sueldos de Planta:</strong> No contabilizar el salario base de funcionarios de planta, solo las horas extra o viáticos adicionales generados por la emergencia.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <p className="text-xs text-amber-800"><strong>Fuentes de Financiación:</strong> Separar estrictamente recursos del Fondo Nacional (UNGRD) de recursos territoriales (Fondo Departamental/Municipal).</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <p className="text-xs text-amber-800"><strong>CDP vs RP:</strong> La inversión real se mide por el Registro Presupuestal (RP), no por la disponibilidad (CDP), para evitar inflar cifras con recursos no ejecutados.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-bold shrink-0">!</div>
            <p className="text-xs text-amber-800"><strong>Donaciones:</strong> Los bienes recibidos en donación se valoran a precio de mercado pero se reportan en una cuenta de orden separada de la inversión monetaria.</p>
          </div>
        </div>
      </div>

      {/* 5. Ejemplos Aplicados */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-rose-600">
          <Landmark size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">5. Ejemplos para Entidades Territoriales</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold text-slate-800 mb-2">Escenario: Municipio Categoría 6</p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Uso de maquinaria propia. La inversión no es el valor de la retroexcavadora, sino el <strong>costo operativo marginal</strong>: Galones de ACPM + Horas extra del operario + Kit de filtros para mantenimiento preventivo post-operación.
            </p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold text-slate-800 mb-2">Escenario: Gobernación (Nivel Central)</p>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Despliegue de equipo técnico OPS. La inversión se calcula multiplicando el <strong>valor hora del contrato</strong> por las horas efectivamente reportadas en el acta de PMU, sumando los viáticos aprobados por resolución.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-rose-900 rounded-2xl text-white text-sm">
        <FileText size={20} className="text-rose-400 shrink-0" />
        <p>
          <strong>Nota de Auditoría:</strong> Este modelo garantiza que cada peso reportado tenga un soporte documental (Acta, Factura, Resolución) y un nexo causal directo con la declaratoria de calamidad pública.
        </p>
      </div>
    </div>
  );
};
