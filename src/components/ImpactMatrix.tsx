import React from 'react';
import { ShieldAlert, Home, Users, TreePine, DollarSign, ArrowRight } from 'lucide-react';

export const ImpactMatrix: React.FC = () => {
  const matrixData = [
    {
      causa: 'Vientos Fuertes / Ráfagas',
      impactos: [
        {
          tipo: 'Infraestructura',
          variable: 'Viviendas con destechamiento',
          indicador: 'Número de viviendas afectadas / Total viviendas en zona',
          ejemplo: 'Frente Frío 2020 (San Andrés): > 90% infraestructura afectada.',
          icon: <Home size={16} className="text-blue-500" />
        },
        {
          tipo: 'Económico',
          variable: 'Interrupción de servicios públicos',
          indicador: 'Horas de desconexión / Usuarios afectados',
          ejemplo: 'Caída de redes eléctricas en Barranquilla (2024).',
          icon: <DollarSign size={16} className="text-emerald-500" />
        }
      ]
    },
    {
      causa: 'Precipitación Intensa',
      impactos: [
        {
          tipo: 'Social',
          variable: 'Población damnificada / Desplazada',
          indicador: 'Número de familias en albergues temporales',
          ejemplo: 'Inundaciones en Chocó (2024): > 5.000 familias afectadas.',
          icon: <Users size={16} className="text-rose-500" />
        },
        {
          tipo: 'Ambiental',
          variable: 'Remoción en masa (Deslizamientos)',
          indicador: 'm3 de material removido / Hectáreas afectadas',
          ejemplo: 'Deslizamientos en vía Medellín-Quibdó.',
          icon: <TreePine size={16} className="text-green-500" />
        }
      ]
    },
    {
      causa: 'Alteración del Estado del Mar',
      impactos: [
        {
          tipo: 'Económico',
          variable: 'Cierre de puertos / Actividad pesquera',
          indicador: 'Días de inactividad / Pérdidas en USD',
          ejemplo: 'Restricción de navegación en Cartagena y Santa Marta.',
          icon: <DollarSign size={16} className="text-emerald-500" />
        },
        {
          tipo: 'Infraestructura',
          variable: 'Erosión costera / Daño en espolones',
          indicador: 'Metros lineales de línea de costa perdidos',
          ejemplo: 'Afectación en playas de Puerto Colombia.',
          icon: <Home size={16} className="text-blue-500" />
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <ShieldAlert className="text-amber-400" size={24} />
          <h3 className="text-xl font-bold">Matriz de Impactos Sistémicos (Frente Frío)</h3>
        </div>
        <p className="text-slate-400 text-sm">
          Herramienta técnica para la identificación rigurosa de daños y nexos causales, diseñada para reportes de control fiscal (Contraloría).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {matrixData.map((section, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-black text-slate-700 uppercase tracking-wider">Causa: {section.causa}</span>
              <ArrowRight size={16} className="text-slate-400" />
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-500">
                    <th className="p-3 border-b border-slate-100">Tipología</th>
                    <th className="p-3 border-b border-slate-100">Variable Observable</th>
                    <th className="p-3 border-b border-slate-100">Indicador de Medición</th>
                    <th className="p-3 border-b border-slate-100">Referencia Real</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {section.impactos.map((imp, iidx) => (
                    <tr key={iidx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {imp.icon}
                          <span className="text-xs font-bold text-slate-700">{imp.tipo}</span>
                        </div>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{imp.variable}</td>
                      <td className="p-3 text-xs text-slate-600 font-medium italic">{imp.indicador}</td>
                      <td className="p-3 text-[10px] text-slate-500 leading-tight max-w-[200px]">{imp.ejemplo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
        <h4 className="text-sm font-bold text-amber-900 mb-2 flex items-center gap-2">
          <ShieldAlert size={16} /> Nota de Rigurosidad Técnica
        </h4>
        <p className="text-xs text-amber-800 leading-relaxed">
          La validación del nexo causal entre el fenómeno hidrometeorológico y el daño reportado es obligatoria para la justificación de gastos ante la Contraloría General de la República. Se recomienda adjuntar registros fotográficos georreferenciados y boletines del IDEAM que coincidan con la ventana temporal del impacto.
        </p>
      </div>
    </div>
  );
};
