import React, { useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  Activity, AlertTriangle, ShieldAlert, CheckCircle2, 
  BarChart3, PieChart as PieChartIcon, Target, TrendingUp, TrendingDown,
  Layers, Search, FileX
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Defect {
  id: string;
  type: string;
  entityId: string;
  entityType: string;
  description: string;
  severity: 'High' | 'Medium' | 'Low';
}

export const FinancialSixSigmaQuality: React.FC = () => {
  const { state } = useProject();

  const { defects, sigmaLevel, dpmo, ottyStats, defectBreakdown } = useMemo(() => {
    const list: Defect[] = [];
    let totalOpportunities = 0;

    // We define categories for Six Sigma defects
    const CATEGORIES = {
      CDP_RC_MISMATCH: 'Inconsistencias CDP-RC',
      PAYMENT_NO_SUPPORT: 'Pagos sin soporte',
      INCOMPLETE_DATA: 'Datos incompletos',
      OVER_BUDGET: 'Sobrecosto Contractual'
    };

    // 1. Analyze Projects (Opportunity: 4 traits per project)
    state.proyectos.forEach(p => {
      totalOpportunities += 4; // name, region, value, timeline
      if (!p.departamento) {
        list.push({ id: `P-${p.id}-1`, type: CATEGORIES.INCOMPLETE_DATA, entityId: p.id, entityType: 'Proyecto', description: 'Departamento faltante', severity: 'Medium' });
      }
      if (!p.linea) {
        list.push({ id: `P-${p.id}-2`, type: CATEGORIES.INCOMPLETE_DATA, entityId: p.id, entityType: 'Proyecto', description: 'Línea de inversión o sector omitido', severity: 'Medium' });
      }
      if (!p.matrix?.valorTotalProyecto || p.matrix.valorTotalProyecto === 0) {
        list.push({ id: `P-${p.id}-3`, type: CATEGORIES.INCOMPLETE_DATA, entityId: p.id, entityType: 'Proyecto', description: 'Valor total del proyecto en cero', severity: 'High' });
      }
    });

    // 2. Analyze Financial Documents (Opportunity: 4 traits per document)
    // We also aggregate RC and RP per project to compare with CDP
    const cdpMap = new Map<string, number>();
    const rcMap = new Map<string, number>();

    state.financialDocuments?.forEach(doc => {
      totalOpportunities += 4; // number, type, value, date
      if (!doc.numero || doc.numero.trim() === '') {
        list.push({ id: `DOC-${doc.id}-1`, type: CATEGORIES.INCOMPLETE_DATA, entityId: doc.id, entityType: 'Documento Financiero', description: 'Número de radicado faltante', severity: 'High' });
      }
      if (doc.valor <= 0) {
         list.push({ id: `DOC-${doc.id}-2`, type: CATEGORIES.INCOMPLETE_DATA, entityId: doc.id, entityType: 'Documento Financiero', description: 'Atributo de valor nulo o negativo', severity: 'High' });
      }

      if (doc.tipo === 'CDP') cdpMap.set(doc.projectId, (cdpMap.get(doc.projectId) || 0) + doc.valor);
      if (doc.tipo === 'RC') rcMap.set(doc.projectId, (rcMap.get(doc.projectId) || 0) + doc.valor);
    });

    // Cross-check CDP vs RC
    state.proyectos.forEach(p => {
      totalOpportunities += 1; // 1 opportunity per project for financial congruence
      const cdp = cdpMap.get(p.id) || 0;
      const rc = rcMap.get(p.id) || 0;
      
      if (rc > cdp) {
         list.push({ id: `CROSS-${p.id}`, type: CATEGORIES.CDP_RC_MISMATCH, entityId: p.id, entityType: 'Presupuestal', description: `RC ($${rc.toLocaleString()}) excede el CDP ($${cdp.toLocaleString()}).`, severity: 'High' });
      }
    });

    // 3. Analyze Contracts and Payments (Opportunity: 3 per contract, 2 per payment)
    state.contratos.forEach(c => {
      totalOpportunities += 3;
      if (c.valor <= 0) {
         list.push({ id: `C-${c.id}-1`, type: CATEGORIES.INCOMPLETE_DATA, entityId: c.id, entityType: 'Contrato', description: 'Valor del contrato en cero', severity: 'High' });
      }
      
      // Compare payments to contract value
      const pagos = state.pagos.filter(p => p.contractId === c.id);
      const totalPagado = pagos.reduce((sum, p) => sum + (p.valor || 0), 0);
      
      if (totalPagado > c.valor) {
         list.push({ id: `C-${c.id}-2`, type: CATEGORIES.OVER_BUDGET, entityId: c.id, entityType: 'Contrato', description: `Suma de pagos excede valor contractual.`, severity: 'High' });
      }
    });

    state.pagos.forEach(p => {
      totalOpportunities += 2;
      // Missing support assumes payment without an ID of support document or missing invoice
      if (!p.valor || p.valor <= 0) {
        list.push({ id: `PAGO-${p.id}-1`, type: CATEGORIES.PAYMENT_NO_SUPPORT, entityId: p.id, entityType: 'Pago', description: 'Registro de pago vacío', severity: 'Medium' });
      }
    });

    totalOpportunities = totalOpportunities === 0 ? 1 : totalOpportunities;
    const dpmoVal = (list.length / totalOpportunities) * 1000000;
    
    // Approximate Sigma Level (0 to 6)
    // Lookup/approx formula for Sigma: 0.8406 + Math.sqrt(29.37 - 2.221 * Math.log(dpmoVal))
    // We'll use a simpler bounded approach based on DPMO
    let sigma = 0;
    if (dpmoVal <= 3.4) sigma = 6.0;
    else if (dpmoVal <= 233) sigma = 5.0;
    else if (dpmoVal <= 6210) sigma = 4.0;
    else if (dpmoVal <= 66807) sigma = 3.0;
    else if (dpmoVal <= 308537) sigma = 2.0;
    else if (dpmoVal <= 690000) sigma = 1.0;
    else sigma = 0.5;

    // Linear interpolation for more granularity if needed, but let's just use standard
    if (sigma > 1 && sigma < 6) {
        // rough interpolation
        const upperDPMO = sigma === 5 ? 233 : sigma === 4 ? 6210 : sigma === 3 ? 66807 : 308537;
        const lowerDPMO = sigma === 5 ? 3.4 : sigma === 4 ? 233 : sigma === 3 ? 6210 : 66807;
        const fraction = 1 - ((dpmoVal - lowerDPMO) / (upperDPMO - lowerDPMO));
        sigma = sigma + fraction - 1; // e.g. if sigma was 4.0, it spans to 4.99
    }

    // Defect breakdown for charts
    const breakdown = Object.values(CATEGORIES).map(cat => ({
      name: cat,
      value: list.filter(d => d.type === cat).length
    }));

    return { 
      defects: list, 
      sigmaLevel: Math.max(0, parseFloat((sigma + 1).toFixed(2))), // Adjusted slightly for display relative to ICQ scale
      dpmo: dpmoVal, 
      ottyStats: totalOpportunities,
      defectBreakdown: breakdown.filter(b => b.value > 0)
    };
  }, [state]);

  const icfSigma = useMemo(() => {
    // ICF-Sigma (0-100 score)
    // 6 sigma = 100%, 1 sigma = 10%
    return Math.min(100, Math.max(0, (sigmaLevel / 6) * 100));
  }, [sigmaLevel]);

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="text-indigo-600" /> Control de Calidad: Six Sigma
          </h2>
          <p className="text-sm text-slate-500">Monitoreo de variabilidad, defectos y consistencia en metadatos financieros.</p>
        </div>
      </div>

      {/* TOP KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <div className="bg-indigo-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-900/20 relative overflow-hidden">
           <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Nivel Sigma Actual</p>
           <h3 className="text-4xl font-black">{sigmaLevel.toFixed(1)}σ</h3>
           <p className="text-xs text-indigo-200 mt-2 font-medium">Objetivo: &gt; 4.0σ</p>
           <TrendingUp className="absolute right-0 bottom-0 text-white opacity-5 w-32 h-32 transform translate-x-4 translate-y-4" />
         </div>

         <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">DPMO</p>
           <h3 className="text-3xl font-black text-slate-800">{Math.round(dpmo).toLocaleString()}</h3>
           <p className="text-xs text-slate-500 mt-2">Defectos por Millón de Oportunidades</p>
         </div>

         <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Densidad de Defectos</p>
           <h3 className="text-3xl font-black text-rose-600">{defects.length}</h3>
           <p className="text-xs text-slate-500 mt-2">de {ottyStats.toLocaleString()} oportunidades medibles</p>
         </div>

         <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-3xl shadow-sm relative overflow-hidden">
           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">ICF-Sigma</p>
           <h3 className="text-3xl font-black text-emerald-700">{icfSigma.toFixed(1)}%</h3>
           <p className="text-xs text-emerald-600 mt-2">Índice de Calidad Financiera</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pareto de Defectos */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
           <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-indigo-500" /> Pareto de Defectos (Causas Raíz)</h4>
           {defectBreakdown.length > 0 ? (
             <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={defectBreakdown.sort((a,b) => b.value - a.value)} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                   <YAxis tick={{ fontSize: 10 }} />
                   <Tooltip cursor={{fill: '#f1f5f9'}} />
                   <Bar dataKey="value" name="Cantidad de Registros Erróneos" fill="#ef4444" radius={[4,4,0,0]}>
                      {defectBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
           ) : (
             <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                <CheckCircle2 size={48} className="text-emerald-400 mb-4" />
                <p className="font-bold">Cero defectos detectados</p>
             </div>
           )}
        </div>

        {/* Listado de Detecciones */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col h-[340px]">
           <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Target size={18} className="text-rose-500" /> Registro de Inconsistencias ({defects.length})</h4>
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
             {defects.length > 0 ? defects.map(d => (
               <div key={d.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-start gap-3">
                 <div className="mt-0.5">
                   {d.severity === 'High' ? <ShieldAlert size={16} className="text-rose-500" /> : <AlertTriangle size={16} className="text-amber-500" />}
                 </div>
                 <div>
                   <p className="text-xs font-black text-slate-800">{d.type}</p>
                   <p className="text-[10px] text-slate-500">{d.description}</p>
                   <div className="flex gap-2 mt-2">
                     <span className="text-[9px] font-bold uppercase py-0.5 px-2 rounded-md bg-indigo-100 text-indigo-700">Ref: {d.entityType}</span>
                     <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-md ${d.severity === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>Sev: {d.severity}</span>
                   </div>
                 </div>
               </div>
             )) : (
                <div className="h-full flex items-center justify-center text-slate-400">
                  <p className="text-sm font-medium">Libre de inconsistencias.</p>
                </div>
             )}
           </div>
        </div>
      </div>

    </div>
  );
};
