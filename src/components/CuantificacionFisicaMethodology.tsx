import React from 'react';
import { Ruler, Camera, CheckCircle, MapPin, ShieldCheck, Info } from 'lucide-react';

export const CuantificacionFisicaMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Ruler className="text-indigo-600" size={28} />
          Metodología de Cuantificación Física de Daños
        </h2>
        <p className="text-slate-500 mt-2">Protocolo estandarizado para la evaluación de impactos por Frente Frío en Colombia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 1. Unidades de Medida */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <ShieldCheck size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">1. Unidades de Medida por Activo</h3>
          </div>
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <table className="w-full text-sm">
              <thead className="text-slate-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="text-left pb-2">Tipo de Activo</th>
                  <th className="text-left pb-2">Unidad</th>
                  <th className="text-left pb-2">Variable Crítica</th>
                </tr>
              </thead>
              <tbody className="text-slate-700 divide-y divide-slate-200">
                <tr>
                  <td className="py-2 font-medium">Viviendas</td>
                  <td className="py-2">Unidad (Und)</td>
                  <td className="py-2">Colapso parcial/total</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Vías</td>
                  <td className="py-2">Kilómetros (Km)</td>
                  <td className="py-2">Pérdida de banca / Lodo</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Cultivos</td>
                  <td className="py-2">Hectáreas (Ha)</td>
                  <td className="py-2">Inundación / Helada</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Acueductos</td>
                  <td className="py-2">Metros (m)</td>
                  <td className="py-2">Tubería expuesta / Daño</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Puentes</td>
                  <td className="py-2">Unidad (Und)</td>
                  <td className="py-2">Socavación de estribos</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Métodos de Captura */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Camera size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Métodos de Captura de Datos</h3>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg h-fit">
                <MapPin size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Levantamiento en Campo (EDAN)</p>
                <p className="text-xs text-slate-500">Uso de formularios KoboToolbox con georreferenciación obligatoria y registro fotográfico.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg h-fit">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Drones (Fotogrametría)</p>
                <p className="text-xs text-slate-500">Generación de Ortomosaicos y Modelos Digitales de Elevación (DEM) para áreas de difícil acceso.</p>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-white border border-slate-200 rounded-xl">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
                <Info size={16} />
              </div>
              <div>
                <p className="font-bold text-slate-800 text-sm">Análisis Satelital (Sentinel/Planet)</p>
                <p className="text-xs text-slate-500">Detección de áreas inundadas mediante índices de agua (NDWI) y cambios en la cobertura.</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Protocolos de Validación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <CheckCircle size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Protocolos de Validación</h3>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">1</div>
              <span><strong>Triangulación:</strong> Cruce obligatorio entre reporte municipal (EDAN), reporte de organismos de socorro y análisis técnico UNGRD.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">2</div>
              <span><strong>Verificación en Sitio:</strong> Auditoría aleatoria del 10% de los puntos georreferenciados por personal técnico de la SRR.</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">3</div>
              <span><strong>Consistencia Temporal:</strong> Validación de que el daño reportado coincide con la ventana temporal del evento meteorológico.</span>
            </li>
          </ul>
        </div>

        {/* 4. Estructura de Georreferenciación */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <MapPin size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">4. Estructura de Georreferenciación</h3>
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 text-emerald-400 font-mono text-xs overflow-x-auto">
            <p className="mb-2 text-slate-500">// Estándar de Datos SIG</p>
            <p>{"{"}</p>
            <p className="ml-4">"sistema_referencia": "MAGNA-SIRGAS (EPSG:4686)",</p>
            <p className="ml-4">"precision_minima": "± 5 metros",</p>
            <p className="ml-4">"atributos_obligatorios": [</p>
            <p className="ml-8">"ID_EVENTO", "FECHA_CAPTURA", "LAT", "LON",</p>
            <p className="ml-8">"TIPO_ACTIVO", "NIVEL_DANO", "FOTO_URL"</p>
            <p className="ml-4">]</p>
            <p>{"}"}</p>
          </div>
        </div>
      </div>

      {/* 5. Control de Calidad */}
      <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
        <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
          <ShieldCheck size={20} />
          5. Control de Calidad y Auditoría
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Integridad</p>
            <p className="text-sm text-slate-700">Validación de campos nulos y formatos de fecha/coordenadas en tiempo real.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Trazabilidad</p>
            <p className="text-sm text-slate-700">Registro de auditoría (logs) de quién capturó, quién validó y quién aprobó el dato.</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Comparabilidad</p>
            <p className="text-sm text-slate-700">Uso de catálogos de objetos estandarizados según normas IGAC.</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-amber-800 text-sm">
        <Info size={20} className="shrink-0" />
        <p>
          <strong>Nota para Entes de Control:</strong> Esta metodología garantiza el nexo causal entre el fenómeno hidrometeorológico y el daño físico, permitiendo una valoración económica auditable y libre de subjetividades.
        </p>
      </div>
    </div>
  );
};
