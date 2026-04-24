import React from 'react';
import { BarChart3, Target, Zap, Activity, AlertCircle, CheckCircle2, TrendingUp, Gauge, ShieldAlert } from 'lucide-react';

export const GestionPublicaIndicators: React.FC = () => {
  return (
    <div className="space-y-8 p-6 bg-white rounded-3xl border border-slate-200">
      <div className="border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
          <Gauge className="text-indigo-600" size={28} />
          Sistema de Indicadores de Gestión Pública (SIGP-Desastres)
        </h2>
        <p className="text-slate-500 mt-2">Métricas de eficiencia, cobertura y precisión para el monitoreo financiero en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Indicadores de Eficiencia */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Zap size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">1. Eficiencia Operativa</h3>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-800 mb-1">Costo Unitario de Atención (CUA)</p>
              <div className="bg-white p-2 rounded-lg border border-slate-100 font-mono text-[10px] text-indigo-600 mb-2">
                CUA = Inversión_Total / Beneficiarios_Atendidos
              </div>
              <p className="text-[10px] text-slate-500">Mide la optimización de recursos por cada persona impactada positivamente.</p>
            </div>
            <div className="pt-2 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-800 mb-1">Velocidad de Respuesta (VR)</p>
              <div className="bg-white p-2 rounded-lg border border-slate-100 font-mono text-[10px] text-indigo-600 mb-2">
                VR = Fecha_Primer_Gasto - Fecha_Declaratoria
              </div>
              <p className="text-[10px] text-slate-500">Días transcurridos hasta la movilización efectiva de recursos.</p>
            </div>
          </div>
        </div>

        {/* 2. Indicadores de Cobertura */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-emerald-600">
            <Target size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">2. Cobertura y Alcance</h3>
          </div>
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
            <div>
              <p className="text-xs font-bold text-emerald-800 mb-1">Índice de Cobertura (IC)</p>
              <div className="bg-white p-2 rounded-lg border border-emerald-200 font-mono text-[10px] text-emerald-600 mb-2">
                IC = (Atendidos / Damnificados_Censados) * 100
              </div>
              <p className="text-[10px] text-emerald-700">Porcentaje de la población afectada que ha recibido asistencia efectiva.</p>
            </div>
            <div className="pt-2 border-t border-emerald-200">
              <p className="text-xs font-bold text-emerald-800 mb-1">Capilaridad Territorial (CT)</p>
              <div className="bg-white p-2 rounded-lg border border-emerald-200 font-mono text-[10px] text-emerald-600 mb-2">
                CT = Municipios_Atendidos / Municipios_Afectados
              </div>
              <p className="text-[10px] text-emerald-700">Mide la equidad en la distribución geográfica de la ayuda.</p>
            </div>
          </div>
        </div>

        {/* 3. Indicadores de Precisión */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-amber-600">
            <Activity size={20} />
            <h3 className="font-bold uppercase tracking-wider text-sm">3. Precisión Presupuestal</h3>
          </div>
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 space-y-4">
            <div>
              <p className="text-xs font-bold text-amber-800 mb-1">Desviación de Estimación (DE)</p>
              <div className="bg-white p-2 rounded-lg border border-amber-200 font-mono text-[10px] text-amber-600 mb-2">
                DE = |(Ejecutado - Estimado) / Estimado|
              </div>
              <p className="text-[10px] text-amber-700">Mide la calidad de la planeación financiera inicial (EDAN vs Real).</p>
            </div>
            <div className="pt-2 border-t border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-1">Eficiencia en Contratación (EC)</p>
              <div className="bg-white p-2 rounded-lg border border-amber-200 font-mono text-[10px] text-amber-600 mb-2">
                EC = (Contratos_Cerrados / Contratos_Abiertos)
              </div>
              <p className="text-[10px] text-amber-700">Capacidad de cierre administrativo y liquidación de recursos.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rangos de Interpretación (Semáforo) */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 size={20} className="text-indigo-500" />
          Rangos de Interpretación y Alerta
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center gap-4">
            <CheckCircle2 size={32} className="opacity-50" />
            <div>
              <p className="text-xs font-bold uppercase">Óptimo (Verde)</p>
              <p className="text-[10px]">IC &gt; 90% | DE &lt; 10%</p>
              <p className="text-[9px] opacity-80">Gestión altamente eficiente.</p>
            </div>
          </div>
          <div className="p-4 bg-amber-500 text-white rounded-2xl flex items-center gap-4">
            <AlertCircle size={32} className="opacity-50" />
            <div>
              <p className="text-xs font-bold uppercase">En Riesgo (Amarillo)</p>
              <p className="text-[10px]">IC 70-89% | DE 11-25%</p>
              <p className="text-[9px] opacity-80">Requiere ajustes en planeación.</p>
            </div>
          </div>
          <div className="p-4 bg-rose-500 text-white rounded-2xl flex items-center gap-4">
            <ShieldAlert size={32} className="opacity-50" />
            <div>
              <p className="text-xs font-bold uppercase">Crítico (Rojo)</p>
              <p className="text-[10px]">IC &lt; 70% | DE &gt; 25%</p>
              <p className="text-[9px] opacity-80">Intervención inmediata necesaria.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Uso en Toma de Decisiones */}
      <div className="bg-slate-900 rounded-3xl p-8 text-white">
        <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
          <TrendingUp size={16} />
          Uso en la Toma de Decisiones Estratégicas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">A</div>
              <p className="text-xs text-indigo-100"><strong>Reasignación Presupuestal:</strong> Si el IC es bajo en una región específica, se prioriza el traslado de recursos de zonas con IC óptimo.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">B</div>
              <p className="text-xs text-indigo-100"><strong>Ajuste de Proveedores:</strong> Un CUA atípico (muy alto) dispara una auditoría inmediata a los contratos de suministro locales.</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">C</div>
              <p className="text-xs text-indigo-100"><strong>Cierre de Evento:</strong> Un EC cercano a 1.0 permite declarar el cierre administrativo del evento y liberar saldos para nuevas emergencias.</p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-indigo-500/30 flex items-center justify-center text-xs font-bold shrink-0">D</div>
              <p className="text-xs text-indigo-100"><strong>Mejora Continua:</strong> La DE histórica alimenta los modelos de IA para mejorar las estimaciones en futuros eventos similares.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
