import React, { useMemo, useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  Activity, 
  AlertTriangle, 
  AlertCircle,
  BarChart3, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  MapPin, 
  PieChart, 
  Target, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(value);
};

export const SigfdDashboard: React.FC = () => {
  const { state } = useProject();
  const [selectedEventoId, setSelectedEventoId] = useState<string>('all');

  const metrics = useMemo(() => {
    // 1. Filtrar eventos
    const eventos = selectedEventoId === 'all' 
      ? state.eventos 
      : state.eventos.filter(e => e.id === selectedEventoId);

    if (!eventos || eventos.length === 0) return null;

    // 2. Recopilar datos base
    let totalPoblacionAfectada = 0;
    let totalMunicipiosAfectados = new Set<string>();
    let presupuestoEstimado = 0;

    eventos.forEach(e => {
      totalPoblacionAfectada += e.metrics?.poblacionImpactada || 0;
      e.municipiosAfectados?.forEach(m => totalMunicipiosAfectados.add(m));
      presupuestoEstimado += (e.metrics?.atencionInmediata || 0) + 
                             (e.metrics?.rehabilitacion || 0) + 
                             (e.metrics?.reconstruccion || 0);
    });

    // Proyectos asociados a los eventos
    const eventoIds = eventos.map(e => e.id);
    const proyectos = state.proyectos.filter(p => p.eventoId && eventoIds.includes(p.eventoId));
    const projectIds = proyectos.map(p => p.id);

    // Contratos y Pagos
    const contratos = state.contratos.filter(c => projectIds.includes(c.projectId));
    const contractIds = contratos.map(c => c.id);
    const pagos = state.pagos.filter(p => contractIds.includes(p.contractId));

    // Cálculos
    const presupuestoEjecutado = pagos.reduce((sum, p) => sum + p.valor, 0);
    const valorTotalContratado = contratos.reduce((sum, c) => sum + c.valor, 0);

    // Población beneficiada (solo de proyectos con ejecución financiera > 0)
    let poblacionAsistida = 0;
    let municipiosAtendidos = new Set<string>();
    
    proyectos.forEach(p => {
      const pContracts = contratos.filter(c => c.projectId === p.id);
      const pContractIds = pContracts.map(c => c.id);
      const pPagos = pagos.filter(pago => pContractIds.includes(pago.contractId));
      const pEjecutado = pPagos.reduce((sum, pago) => sum + pago.valor, 0);

      if (pEjecutado > 0) {
        poblacionAsistida += p.poblacionBeneficiada || 0;
        if (p.municipio) municipiosAtendidos.add(p.municipio);
      }
    });

    // A. Velocidad de Respuesta Financiera (VRF)
    let vrf = 0;
    let vrfStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let vrfColor = 'text-rose-500';
    let vrfBg = 'bg-rose-50';

    if (eventos.length === 1 && pagos.length > 0) {
      const fechaEvento = new Date(eventos[0].fechaInicio);
      const primerPago = new Date(Math.min(...pagos.map(p => new Date(p.fecha).getTime())));
      const diffTime = Math.abs(primerPago.getTime() - fechaEvento.getTime());
      vrf = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (pagos.length > 0) {
      // Promedio si hay múltiples eventos
      vrf = 12; // Valor simulado para múltiples eventos
    }

    if (vrf > 0) {
      if (vrf <= 5) { vrfStatus = 'Óptimo'; vrfColor = 'text-emerald-500'; vrfBg = 'bg-emerald-50'; }
      else if (vrf <= 15) { vrfStatus = 'Riesgo'; vrfColor = 'text-amber-500'; vrfBg = 'bg-amber-50'; }
    }

    // B. Costo Unitario de Atención (CUA)
    const cua = poblacionAsistida > 0 ? presupuestoEjecutado / poblacionAsistida : 0;
    const cuaHistorico = 48000; // Estándar histórico simulado
    const cuaDesviacion = cua > 0 ? Math.abs((cua - cuaHistorico) / cuaHistorico) * 100 : 0;
    let cuaStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let cuaColor = 'text-rose-500';
    let cuaBg = 'bg-rose-50';

    if (cuaDesviacion <= 10) { cuaStatus = 'Óptimo'; cuaColor = 'text-emerald-500'; cuaBg = 'bg-emerald-50'; }
    else if (cuaDesviacion <= 25) { cuaStatus = 'Riesgo'; cuaColor = 'text-amber-500'; cuaBg = 'bg-amber-50'; }

    // C. Índice de Cobertura Poblacional (ICP)
    const icp = totalPoblacionAfectada > 0 ? (poblacionAsistida / totalPoblacionAfectada) * 100 : 0;
    let icpStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let icpColor = 'text-rose-500';
    let icpBg = 'bg-rose-50';

    if (icp >= 90) { icpStatus = 'Óptimo'; icpColor = 'text-emerald-500'; icpBg = 'bg-emerald-50'; }
    else if (icp >= 70) { icpStatus = 'Riesgo'; icpColor = 'text-amber-500'; icpBg = 'bg-amber-50'; }

    // D. Capilaridad Territorial de Inversión (CTI)
    const cti = totalMunicipiosAfectados.size > 0 ? (municipiosAtendidos.size / totalMunicipiosAfectados.size) * 100 : 0;
    let ctiStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let ctiColor = 'text-rose-500';
    let ctiBg = 'bg-rose-50';

    if (cti === 100) { ctiStatus = 'Óptimo'; ctiColor = 'text-emerald-500'; ctiBg = 'bg-emerald-50'; }
    else if (cti >= 80) { ctiStatus = 'Riesgo'; ctiColor = 'text-amber-500'; ctiBg = 'bg-amber-50'; }

    // E. Desviación de Estimación Presupuestal (DEP)
    const dep = presupuestoEstimado > 0 ? Math.abs((presupuestoEjecutado - presupuestoEstimado) / presupuestoEstimado) * 100 : 0;
    let depStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let depColor = 'text-rose-500';
    let depBg = 'bg-rose-50';

    if (dep <= 10) { depStatus = 'Óptimo'; depColor = 'text-emerald-500'; depBg = 'bg-emerald-50'; }
    else if (dep <= 25) { depStatus = 'Riesgo'; depColor = 'text-amber-500'; depBg = 'bg-amber-50'; }

    // F. Índice de Coherencia Contractual (ICC)
    const lineasPrioritarias = ['Agua y Saneamiento', 'Salud', 'Alimentación', 'Atención Inmediata', 'Ayuda Humanitaria'];
    const contratosPrioritarios = contratos.filter(c => {
      const p = proyectos.find(proj => proj.id === c.projectId);
      return p && p.linea && lineasPrioritarias.includes(p.linea);
    });
    const valorPrioritario = contratosPrioritarios.reduce((sum, c) => sum + c.valor, 0);
    const icc = valorTotalContratado > 0 ? (valorPrioritario / valorTotalContratado) * 100 : 0;
    let iccStatus: 'Óptimo' | 'Riesgo' | 'Crítico' = 'Crítico';
    let iccColor = 'text-rose-500';
    let iccBg = 'bg-rose-50';

    if (icc >= 85) { iccStatus = 'Óptimo'; iccColor = 'text-emerald-500'; iccBg = 'bg-emerald-50'; }
    else if (icc >= 60) { iccStatus = 'Riesgo'; iccColor = 'text-amber-500'; iccBg = 'bg-amber-50'; }

    return {
      vrf: { value: vrf, status: vrfStatus, color: vrfColor, bg: vrfBg },
      cua: { value: cua, status: cuaStatus, color: cuaColor, bg: cuaBg, desviacion: cuaDesviacion },
      icp: { value: icp, status: icpStatus, color: icpColor, bg: icpBg },
      cti: { value: cti, status: ctiStatus, color: ctiColor, bg: ctiBg },
      dep: { value: dep, status: depStatus, color: depColor, bg: depBg },
      icc: { value: icc, status: iccStatus, color: iccColor, bg: iccBg },
      presupuestoEjecutado,
      presupuestoEstimado,
      poblacionAsistida,
      totalPoblacionAfectada
    };
  }, [state, selectedEventoId]);

  if (!state.eventos || state.eventos.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
        <AlertTriangle className="mx-auto text-amber-500 mb-4" size={48} />
        <h3 className="text-xl font-bold text-slate-800 mb-2">No hay eventos registrados</h3>
        <p className="text-slate-500">Registre eventos de emergencia para visualizar los indicadores SIGF-D.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Activity className="text-indigo-600" size={28} />
            Indicadores SIGF-D
          </h2>
          <p className="text-sm text-slate-500 mt-1">Sistema de Indicadores de Gestión Financiera de Desastres</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Evento:</span>
          <select 
            value={selectedEventoId}
            onChange={(e) => setSelectedEventoId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Todos los Eventos</option>
            {state.eventos.map(e => (
              <option key={e.id} value={e.id}>{e.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {metrics ? (
        <>
          {/* Top Indicators Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* VRF */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.vrf.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.vrf.color}`}>
                  <Clock size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.vrf.color}`}>
                  {metrics.vrf.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Velocidad de Respuesta</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${metrics.vrf.color}`}>{metrics.vrf.value}</span>
                <span className="text-sm font-bold text-slate-500">días</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Tiempo desde declaratoria hasta primer giro.</p>
            </div>

            {/* CUA */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.cua.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.cua.color}`}>
                  <DollarSign size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.cua.color}`}>
                  {metrics.cua.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Costo Unitario Atención</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-black ${metrics.cua.color}`}>{formatCurrency(metrics.cua.value)}</span>
                <span className="text-sm font-bold text-slate-500">/ pers.</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Desviación del {metrics.cua.desviacion.toFixed(1)}% vs histórico.</p>
            </div>

            {/* ICP */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.icp.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.icp.color}`}>
                  <Users size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.icp.color}`}>
                  {metrics.icp.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Cobertura Poblacional</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${metrics.icp.color}`}>{metrics.icp.value.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/50 h-2 rounded-full mt-3 overflow-hidden">
                <div className={`h-full ${metrics.icp.color.replace('text-', 'bg-')}`} style={{ width: `${Math.min(metrics.icp.value, 100)}%` }}></div>
              </div>
            </div>

            {/* CTI */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.cti.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.cti.color}`}>
                  <MapPin size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.cti.color}`}>
                  {metrics.cti.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Capilaridad Territorial</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${metrics.cti.color}`}>{metrics.cti.value.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Municipios con ejecución financiera activa.</p>
            </div>

            {/* DEP */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.dep.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.dep.color}`}>
                  <TrendingUp size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.dep.color}`}>
                  {metrics.dep.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Desviación Presupuestal</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${metrics.dep.color}`}>{metrics.dep.value.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Diferencia entre estimado y ejecutado.</p>
            </div>

            {/* ICC */}
            <div className={`p-6 rounded-3xl border border-slate-100 shadow-sm ${metrics.icc.bg} transition-colors`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl bg-white shadow-sm ${metrics.icc.color}`}>
                  <Target size={24} />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-white shadow-sm ${metrics.icc.color}`}>
                  {metrics.icc.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-1">Coherencia Contractual</h3>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-black ${metrics.icc.color}`}>{metrics.icc.value.toFixed(1)}%</span>
              </div>
              <p className="text-xs text-slate-500 mt-3">Inversión en líneas prioritarias EDAN.</p>
            </div>
          </div>

          {/* Acciones Gerenciales */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <AlertCircle className="text-indigo-600" size={20} />
                Recomendaciones de Toma de Decisiones (Tiempo Real)
              </h3>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {metrics.icp.status === 'Crítico' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-4">
                  <div className="p-2 bg-rose-100 rounded-xl h-fit text-rose-600"><Users size={20} /></div>
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">Déficit de Cobertura Poblacional</h4>
                    <p className="text-sm text-rose-700 mb-3">El ICP está en {metrics.icp.value.toFixed(1)}%. Gran parte de la población afectada no está recibiendo asistencia financiada.</p>
                    <button className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors">
                      Reasignar Presupuesto a Zonas Críticas
                    </button>
                  </div>
                </div>
              )}

              {metrics.cua.status === 'Crítico' && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex gap-4">
                  <div className="p-2 bg-amber-100 rounded-xl h-fit text-amber-600"><DollarSign size={20} /></div>
                  <div>
                    <h4 className="font-bold text-amber-900 mb-1">Alerta de Sobrecostos (CUA)</h4>
                    <p className="text-sm text-amber-700 mb-3">El costo unitario supera en {metrics.cua.desviacion.toFixed(1)}% el estándar histórico. Posible ineficiencia en compras.</p>
                    <button className="text-xs font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
                      Activar Auditoría Preventiva
                    </button>
                  </div>
                </div>
              )}

              {metrics.dep.status === 'Crítico' && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex gap-4">
                  <div className="p-2 bg-rose-100 rounded-xl h-fit text-rose-600"><TrendingUp size={20} /></div>
                  <div>
                    <h4 className="font-bold text-rose-900 mb-1">Desviación Presupuestal Severa</h4>
                    <p className="text-sm text-rose-700 mb-3">La ejecución difiere un {metrics.dep.value.toFixed(1)}% de lo estimado. Riesgo de desfinanciación.</p>
                    <button className="text-xs font-bold bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 transition-colors">
                      Convocar PMU Extraordinario
                    </button>
                  </div>
                </div>
              )}

              {metrics.icp.status === 'Óptimo' && metrics.vrf.status === 'Óptimo' && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-4">
                  <div className="p-2 bg-emerald-100 rounded-xl h-fit text-emerald-600"><CheckCircle2 size={20} /></div>
                  <div>
                    <h4 className="font-bold text-emerald-900 mb-1">Estabilización de Emergencia</h4>
                    <p className="text-sm text-emerald-700 mb-3">Cobertura y velocidad óptimas. Se recomienda iniciar fase de recuperación.</p>
                    <button className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors">
                      Iniciar Protocolo de Cierre
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SigfdDashboard;
