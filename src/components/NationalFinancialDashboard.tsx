import React, { useMemo, useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { 
  Building2, DollarSign, Activity, AlertTriangle, 
  MapPin, TrendingUp, TrendingDown, Clock, Search, Filter, 
  ChevronDown, ChevronRight, FileText, Anchor, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts';
import { formatCurrency } from '../utils/formatters';

export const NationalFinancialDashboard: React.FC = () => {
  const { state } = useProject();
  const [selectedRegion, setSelectedRegion] = useState<string | 'Todos'>('Todos');
  const [selectedSector, setSelectedSector] = useState<string | 'Todos'>('Todos');
  const [selectedVigencia, setSelectedVigencia] = useState<string | 'Todos'>('Todos');
  const [viewMode, setViewMode] = useState<'macro' | 'trazabilidad'>('macro');

  // Derive unique options for filters
  const filterOptions = useMemo(() => {
    const regions = new Set<string>();
    const sectors = new Set<string>();
    const vigencias = new Set<string>();

    state.proyectos.forEach(p => {
      if (p.departamento) regions.add(p.departamento);
      if (p.linea) sectors.add(p.linea);
      if (p.vigencia) vigencias.add(p.vigencia.toString());
      // fallback
      if (!p.vigencia && p.fechaInicio) {
         vigencias.add(p.fechaInicio.split('-')[0]);
      }
    });

    return {
      regions: Array.from(regions).sort(),
      sectors: Array.from(sectors).sort(),
      vigencias: Array.from(vigencias).sort((a,b) => b.localeCompare(a)) // Descending
    };
  }, [state.proyectos]);

  // Helper to check if a project passes current filters
  const projectPassesFilters = (projectId: string) => {
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project) return false;
    
    let year = project.vigencia || (project.fechaInicio ? project.fechaInicio.split('-')[0] : '2024');

    const passesRegion = selectedRegion === 'Todos' || project.departamento === selectedRegion;
    const passesSector = selectedSector === 'Todos' || project.linea === selectedSector;
    const passesVigencia = selectedVigencia === 'Todos' || year === selectedVigencia;

    return passesRegion && passesSector && passesVigencia;
  };

  // --- MOCK DATA PARA MAPEO Y AGREGACIONES NACIONALES ---
  const macroMetrics = useMemo(() => {
    let totalCdp = 0;
    let totalRc = 0;
    let totalRp = 0;
    let ejecutadoPagos = 0;

    state.financialDocuments?.forEach(doc => {
      if (projectPassesFilters(doc.projectId)) {
        if (doc.tipo === 'CDP') totalCdp += doc.valor;
        if (doc.tipo === 'RC') {
          totalRc += doc.valor;
          ejecutadoPagos += (doc.valorPagado || 0);
        }
      }
    });

    state.pagos.forEach(p => {
      const contract = state.contratos.find(c => c.id === p.contractId);
      if (contract && projectPassesFilters(contract.projectId)) {
        ejecutadoPagos += (p.valor || 0);
      }
    });

    // Simulando pagos si no hay, basado en el RP, solo para Demo Visual
    if (ejecutadoPagos === 0 && totalRp > 0) {
      ejecutadoPagos = totalRp * 0.45; 
    }

    const pendientePorComprometer = totalCdp - totalRc;
    const pendientePorEjecutar = totalRc - ejecutadoPagos;
    const porcentajeEjecucion = totalRc > 0 ? (ejecutadoPagos / totalRc) * 100 : 0;
    
    // Velocidad: asumiendo tiempo transcurrido del año (mocked mid-year)
    const mesesTranscurridos = new Date().getMonth() + 1;
    const velocidadEjecucion = ejecutadoPagos / mesesTranscurridos; // pagos por mes
    const desviacionPresupuestal = (ejecutadoPagos / (totalRc * (mesesTranscurridos/12))) - 1;

    return {
      totalCdp,
      totalRc,
      totalRp: 0,
      ejecutadoPagos,
      pendientePorComprometer,
      pendientePorEjecutar,
      porcentajeEjecucion,
      velocidadEjecucion,
      desviacionPresupuestal
    };
  }, [state]);

  const regionalData = useMemo(() => {
    const regionMap: Record<string, { region: string, cdp: number, rc: number, pagos: number }> = {};
    
    state.proyectos.forEach(p => {
      if (!projectPassesFilters(p.id)) return;

      const reg = p.departamento || 'Nacional';
      if (!regionMap[reg]) {
        regionMap[reg] = { region: reg, cdp: 0, rc: 0, pagos: 0 };
      }
      
      const pDocs = state.financialDocuments?.filter(d => d.projectId === p.id) || [];
      pDocs.forEach(d => {
        if (d.tipo === 'CDP') regionMap[reg].cdp += d.valor;
        if (d.tipo === 'RC') regionMap[reg].rc += d.valor;
      });

      // Pagos
      const pContracts = state.contratos.filter(c => c.projectId === p.id);
      pContracts.forEach(c => {
         const cp = state.pagos.filter(pa => pa.contractId === c.id);
         cp.forEach(pa => regionMap[reg].pagos += pa.valor);
      });
    });

    return Object.values(regionMap).sort((a,b) => b.cdp - a.cdp).slice(0, 5); // top 5 regions
  }, [state, selectedRegion, selectedSector, selectedVigencia]);

  const sectoralData = useMemo(() => {
    const sectorMap: Record<string, { sector: string, asignado: number, ejecutado: number }> = {};
    
    state.proyectos.forEach(p => {
      if (!projectPassesFilters(p.id)) return;

      const sec = p.linea || 'Gestión del Riesgo';
      if (!sectorMap[sec]) sectorMap[sec] = { sector: sec, asignado: 0, ejecutado: 0 };
      
      const pDocs = state.financialDocuments?.filter(d => d.projectId === p.id && d.tipo === 'CDP') || [];
      sectorMap[sec].asignado += pDocs.reduce((acc, d) => acc + d.valor, 0);
      
      const pContracts = state.contratos.filter(c => c.projectId === p.id);
      pContracts.forEach(c => {
         const cp = state.pagos.filter(pa => pa.contractId === c.id);
         sectorMap[sec].ejecutado += cp.reduce((acc, pa) => acc + pa.valor, 0);
      });
    });

    return Object.values(sectorMap);
  }, [state, selectedRegion, selectedSector, selectedVigencia]);

  // Alertas
  const alerts = useMemo(() => {
    const newAlerts: { tipo: string, msg: string, severidad: string }[] = [];
    if (macroMetrics.desviacionPresupuestal < -0.2) {
       newAlerts.push({ tipo: 'Sub-ejecución', msg: 'La ejecución financiera está un 20% por debajo de la meta lineal del año.', severidad: 'Alta' });
    } else if (macroMetrics.desviacionPresupuestal > 0.3) {
       newAlerts.push({ tipo: 'Sobre-ejecución', msg: 'Ritmo de gasto superior al 30% esperado, posible desfinanciamiento en Q4.', severidad: 'Media' });
    }

    if (macroMetrics.pendientePorComprometer > macroMetrics.totalCdp * 0.4) {
       newAlerts.push({ tipo: 'Recursos Libres', msg: `Más del 40% del CDP (${formatCurrency(macroMetrics.pendientePorComprometer)}) sin compromiso (RC).`, severidad: 'Media' });
    }

    return newAlerts;
  }, [macroMetrics]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Building2 className="text-indigo-600" /> Dashboard Financiero Nacional
          </h2>
          <p className="text-sm text-slate-500">Unidad Nacional de Gestión del Riesgo - Trazabilidad y Ejecución</p>
        </div>
        <div className="flex gap-2">
          <button 
            className={`px-4 py-2 rounded-lg font-bold text-sm ${viewMode === 'macro' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            onClick={() => setViewMode('macro')}
          >
            Vista Macro
          </button>
          <button 
            className={`px-4 py-2 rounded-lg font-bold text-sm ${viewMode === 'trazabilidad' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            onClick={() => setViewMode('trazabilidad')}
          >
            Trazabilidad Drill-Down
          </button>
        </div>
      </div>

      {/* FILTROS GLOBALES */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 animate-in fade-in">
         <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Región / Departamento</label>
            <select 
              value={selectedRegion} 
              onChange={e => setSelectedRegion(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500"
            >
              <option value="Todos">Todas las Regiones</option>
              {filterOptions.regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
         </div>
         <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Línea de Inversión / Sector</label>
            <select 
              value={selectedSector} 
              onChange={e => setSelectedSector(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500"
            >
              <option value="Todos">Todos los Sectores</option>
              {filterOptions.sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>
         <div className="flex-1">
            <label className="text-xs font-bold text-slate-500 mb-1 block">Vigencia Fiscal</label>
            <select 
              value={selectedVigencia} 
              onChange={e => setSelectedVigencia(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-indigo-500"
            >
              <option value="Todos">Histórico Completo</option>
              {filterOptions.vigencias.map(v => <option key={v} value={v}>Vigencia {v}</option>)}
            </select>
         </div>
      </div>

      {viewMode === 'macro' && (
        <div className="space-y-6 animate-in fade-in">
          {/* TOP METRICS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="text-xs font-black text-slate-400 uppercase mb-1">Total CDP (Apropiación)</div>
               <div className="text-2xl font-black text-slate-800">{formatCurrency(macroMetrics.totalCdp)}</div>
               <DollarSign className="absolute right-0 bottom-0 w-24 h-24 text-slate-100 transform translate-x-4 translate-y-4" />
             </div>
             <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm relative overflow-hidden">
               <div className="text-xs font-black text-indigo-500 uppercase mb-1">Compromisos (RC/RP)</div>
               <div className="text-2xl font-black text-indigo-700">{formatCurrency(macroMetrics.totalRc)}</div>
               <div className="text-[10px] font-bold text-indigo-400 mt-2">
                 Pendiente comprometer: {formatCurrency(macroMetrics.pendientePorComprometer)}
               </div>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden">
               <div className="text-xs font-black text-emerald-500 uppercase mb-1">Ejecutado (Pagos)</div>
               <div className="text-2xl font-black text-emerald-700">{formatCurrency(macroMetrics.ejecutadoPagos)}</div>
               <div className="text-[10px] font-bold text-emerald-400 mt-2">
                 {macroMetrics.porcentajeEjecucion.toFixed(1)}% de lo comprometido
               </div>
             </div>
             <div className="bg-white p-5 rounded-2xl border border-amber-100 shadow-sm relative overflow-hidden">
               <div className="text-xs font-black text-amber-500 uppercase mb-1">Pendiente de Pago</div>
               <div className="text-2xl font-black text-amber-700">{formatCurrency(macroMetrics.pendientePorEjecutar)}</div>
               <div className="text-[10px] font-bold text-amber-400 mt-2">
                 Obligaciones causadas sin giro
               </div>
             </div>
          </div>

          {/* INDICATORS & ALERTS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
               <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><MapPin size={18} className="text-indigo-500" /> Distribución Regional (Top 5)</h4>
               <div className="h-64">
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={regionalData} layout="vertical" margin={{ left: 40 }}>
                       <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E2E8F0" />
                       <XAxis type="number" tickFormatter={(val) => `$${(val/1000000000).toFixed(1)}B`} />
                       <YAxis dataKey="region" type="category" tick={{ fontSize: 12, fontWeight: 'bold' }} width={80} />
                       <Tooltip formatter={(val: number) => formatCurrency(val)} />
                       <Legend />
                       <Bar dataKey="cdp" name="Apropiación (CDP)" fill="#cbd5e1" radius={[0,4,4,0]} barSize={12} />
                       <Bar dataKey="rc" name="Comprometido (RC)" fill="#6366f1" radius={[0,4,4,0]} barSize={16} />
                       <Bar dataKey="pagos" name="Pagado" fill="#10b981" radius={[0,4,4,0]} barSize={12} />
                    </ComposedChart>
                 </ResponsiveContainer>
               </div>
            </div>

            <div className="space-y-4">
              <div className="bg-indigo-900 border border-indigo-800 rounded-3xl p-6 shadow-xl shadow-indigo-900/20 text-white">
                 <h4 className="text-[10px] font-black uppercase text-indigo-300 tracking-widest mb-4">Métricas de Velocidad</h4>
                 <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-indigo-200 uppercase mb-1">Velocidad de Ejecución Promedio</p>
                      <div className="text-2xl font-black">{formatCurrency(macroMetrics.velocidadEjecucion)} <span className="text-xs text-indigo-300">/ mes</span></div>
                    </div>
                    <div>
                      <p className="text-[10px] text-indigo-200 uppercase mb-1">Desviación Presupuestal Anual</p>
                      <div className="flex items-center gap-2">
                        {macroMetrics.desviacionPresupuestal > 0 ? <TrendingUp className="text-emerald-400" /> : <TrendingDown className="text-rose-400" />}
                        <span className={`text-xl font-bold ${macroMetrics.desviacionPresupuestal > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {(macroMetrics.desviacionPresupuestal * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                 </div>
              </div>

              {alerts.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5">
                   <h4 className="text-[10px] font-black uppercase text-rose-800 tracking-widest mb-3 flex items-center gap-2">
                     <AlertTriangle size={14} /> Alertas Nacionales
                   </h4>
                   <div className="space-y-3">
                     {alerts.map((a, i) => (
                       <div key={i} className="flex gap-3 items-start bg-white p-3 rounded-xl border border-rose-100">
                         <div className={`w-2 h-2 mt-1.5 rounded-full ${a.severidad === 'Alta' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                         <div>
                           <p className="text-xs font-bold text-slate-800">{a.tipo}</p>
                           <p className="text-[10px] text-slate-600 mt-1">{a.msg}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* SPREAD POR SECTOR E HISTÓRICO LÍNEA DE TIEMPO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><PieChartIcon size={18} className="text-indigo-500" /> Distribución por Sector</h4>
                <div className="h-64">
                   <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sectoralData}>
                        <defs>
                          <linearGradient id="colorAsignado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEjecutado" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="sector" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis tickFormatter={(val) => `$${(val/1000000000).toFixed(0)}B`} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(val: number) => formatCurrency(val)} />
                        <Area type="monotone" dataKey="asignado" stroke="#6366f1" fillOpacity={1} fill="url(#colorAsignado)" name="CDP Asignado" />
                        <Area type="monotone" dataKey="ejecutado" stroke="#10b981" fillOpacity={1} fill="url(#colorEjecutado)" name="Pago Real" />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
             
             <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                 <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Anchor size={18} className="text-indigo-500" /> Flujo Financiero Histórico</h4>
                 <p className="text-xs text-slate-500 mb-4">Línea de tiempo de viabilidad a pagos efectivos</p>
                 <div className="relative pl-8 space-y-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100"></div>
                    
                    <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fase 1: Asignación (CDP)</p>
                      <h5 className="text-lg font-black text-slate-800">{formatCurrency(macroMetrics.totalCdp)}</h5>
                    </div>
                    
                    <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fase 2: Compromiso (RC/RP)</p>
                      <h5 className="text-lg font-black text-blue-800">{formatCurrency(macroMetrics.totalRc)}</h5>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <div className="w-2 h-2 bg-amber-500 rounded-full" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fase 3: Obligaciones Causadas</p>
                      <h5 className="text-lg font-black text-amber-800">{formatCurrency(macroMetrics.totalRp * 0.8)} <span className="text-xs text-slate-400 font-normal">(Est.)</span></h5>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-8 w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fase 4: Tesorería (Pagos)</p>
                      <h5 className="text-lg font-black text-emerald-700">{formatCurrency(macroMetrics.ejecutadoPagos)}</h5>
                    </div>
                 </div>
             </div>
          </div>
        </div>
      )}

      {viewMode === 'trazabilidad' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm animate-in fade-in">
           <h4 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Search size={18} className="text-indigo-500" /> Trazabilidad Presupuestal Drill-Down</h4>
           <p className="text-sm text-slate-500 mb-6">Explore la cadena completa de asignación de recursos, desde el CDP macro hasta el pago al contratista final en el territorio.</p>
           
            <div className="space-y-4">
              {/* CDP ITEM */}
              {state.financialDocuments?.filter(d => d.tipo === 'CDP' && projectPassesFilters(d.projectId)).slice(0, 20).map((cdp, idx) => (
                <div key={idx} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 p-4 shrink-0 border-b border-slate-200 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xs">CDP</div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{cdp.numero}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{cdp.fecha}</p>
                        </div>
                     </div>
                     <div className="text-right">
                       <p className="text-lg font-black text-slate-900">{formatCurrency(cdp.valor)}</p>
                       <p className="text-[10px] font-bold text-slate-400">Total Apropiado</p>
                     </div>
                  </div>
                  
                  {/* RC ITEMS UNDER CDP (Mock logic grouping) */}
                  <div className="p-4 bg-white border-l-4 border-indigo-200 pl-8 space-y-4">
                     {state.financialDocuments?.filter(d => d.tipo === 'RC' && d.projectId === cdp.projectId).map((rc, ridx) => (
                        <div key={ridx} className="border border-slate-100 rounded-xl p-3 bg-slate-50 relative">
                           <div className="absolute -left-[35px] top-6 w-8 h-px bg-slate-300"></div>
                           <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2">
                               <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded">RC: {rc.numero}</span>
                               <span className="text-xs text-slate-500">{rc.fecha}</span>
                             </div>
                             <span className="text-sm font-black text-blue-800">{formatCurrency(rc.valor)}</span>
                           </div>

                           {/* RP / CONTRACTS UNDER RC */}
                           <div className="mt-4 pl-4 space-y-2 border-l border-dashed border-slate-300">
                             {state.contratos.filter(c => c.projectId === rc.projectId).slice(0, 2).map((contrato, cidx) => (
                               <div key={cidx} className="bg-white p-3 border border-slate-100 rounded-lg flex justify-between items-center relative">
                                  <div className="absolute -left-[17px] top-6 w-4 h-px bg-slate-300"></div>
                                  <div>
                                    <p className="text-[11px] font-black text-slate-800">{contrato.numero} - {contrato.tipo}</p>
                                    <p className="text-[10px] text-slate-500">{contrato.contratista} (NIT: {contrato.nit})</p>
                                  </div>
                                  <div className="text-right">
                                     <p className="text-xs font-black text-slate-700">{formatCurrency(contrato.valor)}</p>
                                     <p className="text-[9px] text-emerald-500 font-bold uppercase py-0.5 px-1 bg-emerald-50 rounded">
                                       Pagos Reg: {state.pagos.filter(p => p.contractId === contrato.id).length}
                                     </p>
                                  </div>
                               </div>
                             ))}
                             {state.contratos.filter(c => c.projectId === rc.projectId).length === 0 && (
                               <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-center gap-2">
                                 <AlertTriangle size={14} /> Sin contratos vinculados a este RC / Proyecto
                               </div>
                             )}
                           </div>
                        </div>
                     ))}
                     {state.financialDocuments?.filter(d => d.tipo === 'RC' && d.projectId === cdp.projectId).length === 0 && (
                       <p className="text-xs text-slate-400 italic">No hay Registros de Compromiso vinculados a este CDP.</p>
                     )}
                  </div>
                </div>
              ))}
              {state.financialDocuments?.filter(d => d.tipo === 'CDP').length === 0 && (
                <div className="text-center p-8 bg-slate-50 border border-slate-200 rounded-2xl">
                   <p className="text-slate-500 text-sm">No existen documentos CDP registrados en el sistema.</p>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
};
