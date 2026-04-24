import React from 'react';
import { Search, AlertTriangle, ShieldAlert, CheckCircle, Zap, Info, BarChart } from 'lucide-react';

export const RiesgoFiscalMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Search className="text-rose-600" size={28} />
          Modelo de Detección de Inconsistencias y Riesgo Fiscal
        </h2>
        <p className="text-slate-500 mt-2">Herramienta preventiva para la auditoría de cuantificación de daños y ejecución de recursos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Tipos de Errores */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">1. Tipos de Errores Críticos</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100">
              <p className="text-xs font-bold text-rose-800">Duplicidad</p>
              <p className="text-[10px] text-rose-700">Mismo activo reportado en múltiples eventos o por diferentes entidades (ej. Municipio y Departamento).</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs font-bold text-amber-800">Sobreestimación</p>
              <p className="text-[10px] text-amber-700">Inflado de cantidades (Q) o uso de costos unitarios (CU) por encima de los precios de mercado regional.</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-800">Subestimación</p>
              <p className="text-[10px] text-blue-700">Omisión de daños para minimizar el impacto político o falta de capacidad técnica en la evaluación inicial.</p>
            </div>
          </div>
        </div>

        {/* 2. Reglas Lógicas */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Reglas Lógicas de Detección</h3>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 text-white font-mono text-[10px] space-y-3">
            <div>
              <p className="text-emerald-400">// Regla de Coherencia Física</p>
              <p>IF (Dano_Reportado &gt; Capacidad_Activo) THEN FLAG_SOBREESTIMACION;</p>
            </div>
            <div>
              <p className="text-emerald-400">// Regla de Unicidad Espacial</p>
              <p>IF (Count(ID_Activo) &gt; 1 AND Evento_Diff) THEN FLAG_DUPLICIDAD;</p>
            </div>
            <div>
              <p className="text-emerald-400">// Regla de Mercado</p>
              <p>IF (CU_Reportado &gt; (CU_Promedio_Region * 1.25)) THEN FLAG_SOBRECOSTO;</p>
            </div>
          </div>
        </div>

        {/* 3. Indicadores de Alerta */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-rose-600">
            <BarChart size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Indicadores de Alerta (KPIs)</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-600">Índice de Variación CU</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">&gt; 20%</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-600">Ratio Inversión/Daño</span>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">&gt; 1.5x</span>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-600">Densidad de Daños/Km2</span>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold">Atípico</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Ejemplos Reales */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Info size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">4. Escenarios de Riesgo Identificados</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <p className="text-xs font-bold text-slate-800">Caso: "Puentes Fantasma"</p>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Reporte de colapso total de un puente que, según catastro vial, era un pontón de madera. La cuantificación se hizo sobre un puente de concreto reforzado, generando una sobreestimación del 400% en la necesidad de inversión.
            </p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <p className="text-xs font-bold text-slate-800">Caso: "Doble Cobro Logístico"</p>
            </div>
            <p className="text-[10px] text-slate-600 leading-relaxed">
              Facturación de transporte de ayudas humanitarias por parte de la UNGRD y, simultáneamente, reporte de gasto de combustible por el municipio para el mismo traslado. Inconsistencia detectada por cruce de placas y fechas.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Recomendaciones de Mitigación */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-indigo-300 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
            <CheckCircle size={16} />
            5. Recomendaciones para la Mitigación del Riesgo
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">1</div>
                <p className="text-xs text-indigo-100"><strong>Validación Cruzada:</strong> Implementar interoperabilidad entre el EDAN, el Registro Único de Damnificados (RUD) y el SECOP II.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">2</div>
                <p className="text-xs text-indigo-100"><strong>Evidencia Digital:</strong> Exigir fotos georreferenciadas con metadatos (fecha/hora) para cada daño reportado antes de asignar presupuesto.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">3</div>
                <p className="text-xs text-indigo-100"><strong>Precios de Referencia:</strong> Publicar una tabla semestral de costos unitarios de emergencia por región para evitar sobrecostos.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">4</div>
                <p className="text-xs text-indigo-100"><strong>Auditoría en Tiempo Real:</strong> Desplegar equipos de supervisión técnica durante la fase de rehabilitación, no solo al finalizar la reconstrucción.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
