import React from 'react';
import { ShieldAlert, Fingerprint, CheckSquare, AlertOctagon, FileSpreadsheet, Link2, MapPin } from 'lucide-react';

export const ControlFiscalMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <ShieldAlert className="text-indigo-600" size={28} />
          Sistema de Control Fiscal y Trazabilidad de Recursos
        </h2>
        <p className="text-slate-500 mt-2">Marco metodológico para la auditoría de recursos públicos en declaratorias de desastre.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. Relación Gasto-Daño (Nexo Causal) */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Link2 size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">1. Relación Obligatoria Gasto-Daño</h3>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <p className="text-xs text-slate-600 leading-relaxed">
              Todo Registro Presupuestal (RP) debe estar vinculado a un <strong>ID de Daño Físico</strong> validado en el EDAN. No se permite la ejecución de recursos sin un nexo causal documentado entre el fenómeno y la necesidad de intervención.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-indigo-600 bg-white p-2 rounded-lg border border-indigo-100">
              <span>Fórmula de Auditoría:</span>
              <code className="bg-slate-100 px-1 rounded">RP_i → ID_Dano_j ∩ ID_Evento_k</code>
            </div>
          </div>
        </div>

        {/* 2. Identificadores Únicos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Fingerprint size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Identificadores Únicos (UIDs)</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs">EV</div>
              <div>
                <p className="text-xs font-bold text-slate-800">ID_EVENTO</p>
                <p className="text-[10px] text-slate-500">Código único de declaratoria nacional/departamental.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs">CT</div>
              <div>
                <p className="text-xs font-bold text-slate-800">ID_CONTRATO</p>
                <p className="text-[10px] text-slate-500">Vínculo directo con SECOP II y Urgencia Manifiesta.</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-bold text-xs">LOC</div>
              <div>
                <p className="text-xs font-bold text-slate-800">ID_UBICACION</p>
                <p className="text-[10px] text-slate-500">Coordenada exacta (Lat/Lon) del activo intervenido.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reglas de Validación */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <CheckSquare size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">3. Reglas de Validación Automática</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="text-xs font-bold text-indigo-900 mb-1">Consistencia Temporal</p>
            <p className="text-[10px] text-indigo-700">La fecha del gasto debe ser posterior a la declaratoria y anterior al cierre del evento.</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="text-xs font-bold text-indigo-900 mb-1">Tope de Valoración</p>
            <p className="text-[10px] text-indigo-700">El valor del contrato no puede exceder el 115% de la Valoración Económica (VED) inicial.</p>
          </div>
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="text-xs font-bold text-indigo-900 mb-1">Geocercas (Geofencing)</p>
            <p className="text-[10px] text-indigo-700">La ubicación de la obra debe estar dentro del polígono de afectación del evento.</p>
          </div>
        </div>
      </div>

      {/* 4. Inconsistencias Detectables */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-rose-600">
          <AlertOctagon size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">4. Tipologías de Inconsistencias (Banderas Rojas)</h3>
        </div>
        <div className="bg-rose-50 border border-rose-100 rounded-2xl overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-rose-100 text-rose-800 font-bold uppercase">
              <tr>
                <th className="p-3 text-left">Inconsistencia</th>
                <th className="p-3 text-left">Descripción del Riesgo</th>
                <th className="p-3 text-left">Acción Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rose-200">
              <tr>
                <td className="p-3 font-bold">Gasto Huérfano</td>
                <td className="p-3">Contrato sin ID de Daño asociado en el sistema.</td>
                <td className="p-3 text-rose-700 font-medium">Suspensión de pago.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold">Ubicuidad Imposible</td>
                <td className="p-3">Mismo equipo/maquinaria reportado en dos eventos simultáneos.</td>
                <td className="p-3 text-rose-700 font-medium">Hallazgo administrativo.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold">Sobre-ejecución</td>
                <td className="p-3">Inversión acumulada &gt; Necesidad de Inversión (Build Back Better).</td>
                <td className="p-3 text-rose-700 font-medium">Auditoría forense.</td>
              </tr>
              <tr>
                <td className="p-3 font-bold">Desvío Geográfico</td>
                <td className="p-3">Obra ejecutada fuera del municipio declarado en calamidad.</td>
                <td className="p-3 text-rose-700 font-medium">Presunto alcance fiscal.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Estructura de Reporte */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-indigo-600">
          <FileSpreadsheet size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">5. Estructura de Reporte para Entidades de Control</h3>
        </div>
        <div className="bg-slate-900 rounded-2xl p-6 text-emerald-400 font-mono text-[10px] overflow-x-auto">
          <p className="mb-2 text-slate-500">// Reporte Consolidado de Transparencia (JSON Standard)</p>
          <p>{"{"}</p>
          <p className="ml-4">"header": {"{ \"entidad\": \"UNGRD\", \"periodo\": \"2024-Q4\", \"normativa\": \"Ley 1523\" }"},</p>
          <p className="ml-4">"trazabilidad": [</p>
          <p className="ml-8">{"{"}</p>
          <p className="ml-12">"id_evento": "EV-2024-001",</p>
          <p className="ml-12">"id_contrato": "CT-998-2024",</p>
          <p className="ml-12">"nexo_causal": "DANO-VIV-042",</p>
          <p className="ml-12">"valor_ejecutado": 450000000,</p>
          <p className="ml-12">"estado_validacion": "APROBADO_CONTRALORIA"</p>
          <p className="ml-8">{"}"}</p>
          <p className="ml-4">]</p>
          <p>{"}"}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-indigo-900 rounded-2xl text-white text-sm">
        <MapPin size={20} className="text-indigo-400 shrink-0" />
        <p>
          <strong>Nota de Control:</strong> Este sistema permite el cruce de información en tiempo real con el SECOP II y el SIA OBSERVA, garantizando que no existan "zonas grises" en la ejecución del presupuesto de emergencia.
        </p>
      </div>
    </div>
  );
};
