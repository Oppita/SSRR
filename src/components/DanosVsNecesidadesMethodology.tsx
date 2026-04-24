import React from 'react';
import { Target, ArrowRight, Layers, AlertTriangle, CheckCircle2, TrendingUp, DollarSign } from 'lucide-react';

export const DanosVsNecesidadesMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Target className="text-indigo-600" size={28} />
          Metodología: Daños vs. Necesidades de Inversión
        </h2>
        <p className="text-slate-500 mt-2">Marco conceptual para la planeación financiera post-desastre y recuperación resiliente.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. Definiciones Técnicas */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Layers size={20} className="text-indigo-500" />
            1. Definición Técnica
          </h3>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
              <p className="text-sm font-bold text-red-800 mb-1">Daños (Impacto Físico)</p>
              <p className="text-xs text-red-700 leading-relaxed">
                Alteración física de los activos existentes. Se mide por el costo de reposición a su estado original (pre-desastre). Es una variable retrospectiva.
              </p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <p className="text-sm font-bold text-emerald-800 mb-1">Necesidades (Requerimiento Financiero)</p>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Monto necesario para recuperar la funcionalidad incorporando estándares de resiliencia (Build Back Better). Es una variable prospectiva.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Relación Daño-Solución */}
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp size={20} className="text-indigo-500" />
            2. Relación Daño y Solución
          </h3>
          <div className="relative p-6 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center gap-4">
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 p-3 bg-white rounded-xl border border-slate-200 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Daño Identificado</p>
                <p className="text-xs font-bold text-slate-700">Puente Colapsado</p>
              </div>
              <ArrowRight className="text-slate-300" />
              <div className="flex-1 p-3 bg-indigo-600 rounded-xl text-white text-center">
                <p className="text-[10px] font-bold text-indigo-200 uppercase">Necesidad</p>
                <p className="text-xs font-bold">Puente con mayor luz y cimentación profunda</p>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic text-center">
              "La necesidad no es solo reponer el daño, sino eliminar la vulnerabilidad que lo causó."
            </p>
          </div>
        </div>
      </div>

      {/* 3. Ejemplos de Brecha */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <AlertTriangle size={20} className="text-amber-500" />
          3. Casos donde la Necesidad supera al Daño
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold text-slate-800 mb-2">Reasentamiento</p>
            <p className="text-[10px] text-slate-600">
              <strong>Daño:</strong> Vivienda de $40M destruida.<br/>
              <strong>Necesidad:</strong> Compra de lote seguro + Urbanismo + Vivienda nueva = $120M.
            </p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold text-slate-800 mb-2">Infraestructura Vial</p>
            <p className="text-[10px] text-slate-600">
              <strong>Daño:</strong> Pérdida de banca en 100m.<br/>
              <strong>Necesidad:</strong> Variante de 500m para evitar zona de falla geológica activa.
            </p>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl">
            <p className="text-xs font-bold text-slate-800 mb-2">Sistemas de Agua</p>
            <p className="text-[10px] text-slate-600">
              <strong>Daño:</strong> Tubería rota.<br/>
              <strong>Necesidad:</strong> Rediseño de bocatoma y planta de tratamiento con filtros para alta turbiedad.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Fases de Aplicación */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-500" />
          4. Aplicación por Fases
        </h3>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-4 bg-slate-900 text-white rounded-2xl">
            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Atención</p>
            <p className="text-[10px] text-slate-400">Enfoque en <strong>Necesidades Humanas Inmediatas</strong> (Techo, comida, salud). No se valoran daños definitivos.</p>
          </div>
          <div className="flex-1 p-4 bg-slate-800 text-white rounded-2xl">
            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Rehabilitación</p>
            <p className="text-[10px] text-slate-400">Restablecimiento de <strong>Servicios Básicos</strong>. Soluciones temporales o reparaciones rápidas.</p>
          </div>
          <div className="flex-1 p-4 bg-slate-700 text-white rounded-2xl">
            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Reconstrucción</p>
            <p className="text-[10px] text-slate-400">Inversión en <strong>Resiliencia Estructural</strong>. Aquí la brecha entre Daño y Necesidad es máxima.</p>
          </div>
        </div>
      </div>

      {/* 5. Criterios de Priorización */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <DollarSign size={20} />
          5. Criterios de Priorización Financiera
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <li className="flex items-start gap-2 text-xs text-indigo-800">
            <span className="font-bold">1.</span> Riesgo de Vida: Proyectos que mitigan amenazas inminentes.
          </li>
          <li className="flex items-start gap-2 text-xs text-indigo-800">
            <span className="font-bold">2.</span> Conectividad Crítica: Vías que garantizan abastecimiento.
          </li>
          <li className="flex items-start gap-2 text-xs text-indigo-800">
            <span className="font-bold">3.</span> Costo-Beneficio Social: Mayor número de beneficiarios por peso invertido.
          </li>
          <li className="flex items-start gap-2 text-xs text-indigo-800">
            <span className="font-bold">4.</span> Sostenibilidad: Proyectos con mantenimiento garantizado.
          </li>
        </ul>
      </div>
    </div>
  );
};
