import React from 'react';
import { TrendingUp, Calculator, Table, FileText, AlertCircle, Info, DollarSign } from 'lucide-react';

export const ValoracionEconomicaMethodology: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <TrendingUp className="text-emerald-600" size={28} />
          Metodología de Valoración Económica de Daños
        </h2>
        <p className="text-slate-500 mt-2">Modelo de Costo de Reposición Ajustado (CRA) para auditorías fiscales y finanzas públicas.</p>
      </div>

      {/* 1. Fórmula General */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Calculator size={120} />
        </div>
        <div className="relative z-10">
          <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">1. Fórmula General de Cálculo</h3>
          <div className="text-3xl font-mono font-bold mb-4">
            VED = Σ (Q × CU × FD × FT)
          </div>
          <p className="text-slate-400 text-sm max-w-xl">
            Donde <strong>VED</strong> es la Valoración Económica del Daño, calculada como la sumatoria del producto de la cantidad, el costo unitario, el factor de daño y el factor territorial.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Definición de Variables */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Info size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Definición de Variables</h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800">Q (Cantidad)</p>
              <p className="text-xs text-slate-500">Magnitud física del daño (m2, km, unidades) derivada de la cuantificación física.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800">CU (Costo Unitario)</p>
              <p className="text-xs text-slate-500">Valor de reposición a precios de mercado actual (incluye materiales, mano de obra y transporte).</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800">FD (Factor de Daño)</p>
              <p className="text-xs text-slate-500">Coeficiente entre 0 y 1 que representa el nivel de afectación estructural o funcional.</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-sm font-bold text-slate-800">FT (Factor Territorial)</p>
              <p className="text-xs text-slate-500">Ajuste por dispersión geográfica, costos logísticos regionales y accesibilidad (1.0 a 1.4).</p>
            </div>
          </div>
        </div>

        {/* 3. Tabla de Factores de Daño */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Table size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Factores de Daño Estandarizados</h3>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3 text-left">Nivel</th>
                  <th className="p-3 text-left">Rango FD</th>
                  <th className="p-3 text-left">Descripción Técnica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-3 font-bold text-emerald-600">Leve</td>
                  <td className="p-3">0.1 - 0.3</td>
                  <td className="p-3 text-slate-600">Daños estéticos o funcionales menores. No compromete estructura.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-amber-600">Moderado</td>
                  <td className="p-3">0.4 - 0.6</td>
                  <td className="p-3 text-slate-600">Afectación parcial. Requiere reparaciones estructurales localizadas.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-orange-600">Severo</td>
                  <td className="p-3">0.7 - 0.9</td>
                  <td className="p-3 text-slate-600">Compromiso estructural grave. Habitabilidad restringida.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-red-600">Colapso</td>
                  <td className="p-3">1.0</td>
                  <td className="p-3 text-slate-600">Pérdida total del activo. Requiere reconstrucción completa.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. Ejemplos Prácticos */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <FileText size={20} />
          <h3 className="font-bold uppercase tracking-wider text-sm">4. Ejemplos de Aplicación Sectorial</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="font-bold text-slate-800 text-sm mb-2">Viviendas (Urbano)</p>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>Q: 50 viviendas</p>
              <p>CU: $85,000,000 (VIS)</p>
              <p>FD: 0.6 (Severo)</p>
              <p>FT: 1.05 (Cabecera)</p>
              <p className="pt-2 font-bold text-emerald-600 text-xs">VED: $2,677,500,000</p>
            </div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="font-bold text-slate-800 text-sm mb-2">Infraestructura Vial</p>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>Q: 4.2 km (Vía Terciaria)</p>
              <p>CU: $1,200,000,000 / km</p>
              <p>FD: 0.4 (Moderado)</p>
              <p>FT: 1.25 (Zona Remota)</p>
              <p className="pt-2 font-bold text-emerald-600 text-xs">VED: $2,520,000,000</p>
            </div>
          </div>
          <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <p className="font-bold text-slate-800 text-sm mb-2">Sector Agropecuario</p>
            <div className="text-[10px] text-slate-500 space-y-1">
              <p>Q: 120 Ha (Arroz)</p>
              <p>CU: $6,500,000 (Costo Inv.)</p>
              <p>FD: 1.0 (Pérdida Total)</p>
              <p>FT: 1.10 (Logística Insumos)</p>
              <p className="pt-2 font-bold text-emerald-600 text-xs">VED: $858,000,000</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Manejo de Incertidumbre */}
      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
        <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
          <AlertCircle size={20} />
          5. Manejo de Incertidumbre y Auditoría
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <p className="text-sm font-bold text-amber-800">Margen de Error Aceptable</p>
            <p className="text-xs text-amber-700">
              Se establece un margen de ±15% en la valoración preliminar. Para auditorías finales, la desviación no debe superar el 5% respecto a los contratos de obra ejecutados.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-amber-800">Defensa ante Auditoría</p>
            <p className="text-xs text-amber-700">
              Cada variable debe estar respaldada por: (1) Registro fotográfico georreferenciado, (2) Cotizaciones de mercado regional, (3) Concepto técnico firmado por ingeniero/especialista.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-slate-900 rounded-2xl text-white text-sm">
        <DollarSign size={20} className="text-emerald-400 shrink-0" />
        <p>
          <strong>Nota Fiscal:</strong> Este modelo cumple con los principios de economía, eficiencia y eficacia de la Ley 42 de 1993, proporcionando una base técnica sólida para la gestión de recursos públicos en emergencias.
        </p>
      </div>
    </div>
  );
};
