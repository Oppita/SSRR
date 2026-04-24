import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getOfficialDeptName } from '../lib/stringUtils';
import { Poliza, Contract, Project } from '../types';
import { Shield, ShieldAlert, ShieldCheck, MapPin, TrendingUp, AlertTriangle, X, Award, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const geoUrl = "https://code.highcharts.com/mapdata/countries/co/co-all.topo.json";

const deptMapping: Record<string, string> = {
  "co-sa": "San Andrés y Providencia",
  "co-ca": "Cauca",
  "co-na": "Nariño",
  "co-ch": "Chocó",
  "co-to": "Tolima",
  "co-cq": "Caquetá",
  "co-hu": "Huila",
  "co-pu": "Putumayo",
  "co-am": "Amazonas",
  "co-bl": "Bolívar",
  "co-vc": "Valle del Cauca",
  "co-su": "Sucre",
  "co-at": "Atlántico",
  "co-ce": "Cesar",
  "co-lg": "La Guajira",
  "co-ma": "Magdalena",
  "co-ar": "Arauca",
  "co-ns": "Norte de Santander",
  "co-cs": "Casanare",
  "co-gv": "Guaviare",
  "co-me": "Meta",
  "co-vp": "Vaupés",
  "co-vd": "Vichada",
  "co-an": "Antioquia",
  "co-co": "Córdoba",
  "co-by": "Boyacá",
  "co-st": "Santander",
  "co-cl": "Caldas",
  "co-cu": "Cundinamarca",
  "co-1136": "Bogotá D.C.",
  "co-ri": "Risaralda",
  "co-qd": "Quindío",
  "co-gn": "Guainía"
};

interface HeatMapPolizasProps {
  polizas: Poliza[];
  contracts: Contract[];
  projects: Project[];
}

export const HeatMapPolizas: React.FC<HeatMapPolizasProps> = ({ polizas, contracts, projects }) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
  };

  const departmentStats = useMemo(() => {
    const stats: Record<string, { 
      totalPolizas: number,
      totalVigentes: number,
      totalValorAsegurado: number,
      totalValorContratado: number,
      coberturaPromedio: number,
      contratosSinCobertura: number,
      polizas: Poliza[],
      proyectos: Project[]
    }> = {};

    projects.forEach(p => {
      if (p.departamento) {
        const officialName = getOfficialDeptName(p.departamento);
        if (!stats[officialName]) {
          stats[officialName] = {
            totalPolizas: 0,
            totalVigentes: 0,
            totalValorAsegurado: 0,
            totalValorContratado: 0,
            coberturaPromedio: 0,
            contratosSinCobertura: 0,
            polizas: [],
            proyectos: []
          };
        }
        
        stats[officialName].proyectos.push(p);
        
        const projectPolizas = polizas.filter(pol => pol.id_proyecto === p.id);
        const projectContracts = contracts.filter(c => c.projectId === p.id);
        
        stats[officialName].totalPolizas += projectPolizas.length;
        stats[officialName].totalVigentes += projectPolizas.filter(pol => pol.estado === 'Vigente').length;
        stats[officialName].totalValorAsegurado += projectPolizas.reduce((sum, pol) => sum + (pol.valor_asegurado || 0), 0);
        stats[officialName].totalValorContratado += projectContracts.reduce((sum, c) => sum + (c.valor || 0), 0);
        stats[officialName].polizas.push(...projectPolizas);
        
        // Contratos del proyecto que no tienen póliza vigente
        const contractsWithoutActivePolicy = projectContracts.filter(c => {
          const cPolicies = projectPolizas.filter(pol => pol.id_contrato === c.id);
          const hasVigente = cPolicies.some(pol => pol.estado === 'Vigente' && new Date(pol.fecha_finalizacion_vigencia) > new Date());
          return !hasVigente;
        });
        
        stats[officialName].contratosSinCobertura += contractsWithoutActivePolicy.length;
      }
    });

    // Calculate averages
    Object.keys(stats).forEach(dept => {
      const s = stats[dept];
      s.coberturaPromedio = s.totalValorContratado > 0 
        ? Math.min(100, (s.totalValorAsegurado / s.totalValorContratado) * 100) 
        : (s.totalPolizas > 0 ? 100 : 0);
    });

    return stats;
  }, [polizas, contracts, projects]);

  const getColor = (coverage: number) => {
    if (coverage === 0) return "#f8fafc"; // slate-50
    if (coverage >= 95) return "#065f46"; // emerald-800
    if (coverage >= 80) return "#10b981"; // emerald-500
    if (coverage >= 60) return "#fbbf24"; // amber-400
    if (coverage >= 40) return "#f59e0b"; // amber-500
    return "#ef4444"; // red-500
  };

  const bestDepts = useMemo(() => {
    return Object.entries(departmentStats)
      .map(([name, stats]) => ({ name, coverage: stats.coberturaPromedio }))
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 5);
  }, [departmentStats]);

  const worstDepts = useMemo(() => {
    return Object.entries(departmentStats)
      .map(([name, stats]) => ({ name, coverage: stats.coberturaPromedio }))
      .sort((a, b) => a.coverage - b.coverage)
      .slice(0, 5);
  }, [departmentStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-white rounded-[40px] border border-slate-200 shadow-sm overflow-hidden relative min-h-[600px] flex flex-col">
        <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <ShieldCheck className="text-emerald-600" size={28} />
              Nivel de Cobertura Aseguradora por Territorio
            </h3>
            <p className="text-sm text-slate-500 font-medium">Análisis de respaldo financiero vs valor contratado</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protección Alta</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Riesgo Parcial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Desprotegido</span>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-slate-50/30">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 2800, center: [-74, 4.5] }}
            style={{ width: "100%", height: "100%" }}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) => {
                // Shift San Andres
                const transformedGeographies = geographies.map(geo => {
                  if (geo.properties["hc-key"] !== "co-sa") return geo;
                  const shiftedGeo = JSON.parse(JSON.stringify(geo));
                  const centerLng = -81.7;
                  const centerLat = 12.5;
                  const scaleFactor = 8.0;
                  const targetLng = -78.5;
                  const targetLat = 10.5;
                  const transform = (coords: any): any => {
                    if (typeof coords[0] === 'number') {
                      const relLng = coords[0] - centerLng;
                      const relLat = coords[1] - centerLat;
                      return [targetLng + (relLng * scaleFactor), targetLat + (relLat * scaleFactor)];
                    }
                    return coords.map(transform);
                  };
                  shiftedGeo.geometry.coordinates = transform(shiftedGeo.geometry.coordinates);
                  return shiftedGeo;
                });

                return transformedGeographies.map(geo => {
                  const hcKey = geo.properties["hc-key"];
                  const deptName = deptMapping[hcKey] || geo.properties.name;
                  const officialName = getOfficialDeptName(deptName);
                  const stats = departmentStats[officialName];
                  const coverage = stats ? stats.coberturaPromedio : 0;
                  const fillColor = getColor(coverage);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={selectedDept === officialName ? "#064e3b" : fillColor}
                      stroke="#ffffff"
                      strokeWidth={0.7}
                      style={{
                        default: { outline: "none", transition: "all 300ms ease" },
                        hover: { fill: stats ? "#064e3b" : "#e2e8f0", outline: "none", cursor: "pointer" },
                        pressed: { fill: "#064e3b", outline: "none" },
                      }}
                      onMouseEnter={() => setHoveredDept(officialName)}
                      onMouseLeave={() => setHoveredDept(null)}
                      onClick={() => {
                        if (stats) setSelectedDept(officialName);
                      }}
                    />
                  );
                });
              }}
            </Geographies>
          </ComposableMap>

          {/* Hover Info Tooltip */}
          <AnimatePresence>
            {hoveredDept && departmentStats[hoveredDept] && !selectedDept && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 bg-slate-900 shadow-2xl rounded-3xl p-6 z-50 pointer-events-none border border-white/10 backdrop-blur-xl"
              >
                <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-4">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg leading-tight">{hoveredDept}</h3>
                    <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Territorio Asegurado</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nivel Cobertura</span>
                    <span className="text-2xl font-black text-white">{departmentStats[hoveredDept].coberturaPromedio.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${departmentStats[hoveredDept].coberturaPromedio}%` }} 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pólizas</p>
                      <p className="text-lg font-black text-white">{departmentStats[hoveredDept].totalPolizas}</p>
                    </div>
                    <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Sin Cobertura</p>
                      <p className={`text-lg font-black ${departmentStats[hoveredDept].contratosSinCobertura > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {departmentStats[hoveredDept].contratosSinCobertura}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="lg:col-span-4 flex flex-col gap-6 h-[600px]">
        {selectedDept ? (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 bg-white rounded-[40px] border border-slate-200 shadow-sm p-8 overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <MapPin className="text-indigo-600" size={28} />
                  {selectedDept}
                </h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detalle Geográfico de Cobertura</p>
              </div>
              <button 
                onClick={() => setSelectedDept(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
               <div className="bg-indigo-900 rounded-3xl p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <Shield className="text-indigo-400" size={32} />
                    <span className="text-2xl font-black">{departmentStats[selectedDept].coberturaPromedio.toFixed(1)}%</span>
                  </div>
                  <p className="text-xs font-medium text-indigo-300 leading-relaxed">
                    Este territorio presenta una cobertura financiera robusta del {departmentStats[selectedDept].coberturaPromedio.toFixed(1)}% contra el total contratado.
                  </p>
               </div>

               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Award size={14} className="text-emerald-500" />
                    Principales Pólizas
                  </h4>
                  {departmentStats[selectedDept].polizas.slice(0, 5).map(pol => (
                    <div key={pol.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-indigo-200 transition-all cursor-pointer">
                      <div>
                        <p className="font-bold text-slate-800 text-sm">{pol.numero_poliza}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{pol.entidad_aseguradora}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-900">{formatCurrency(pol.valor_asegurado)}</p>
                        <p className="text-[9px] font-bold text-indigo-600">{pol.tipo_amparo}</p>
                      </div>
                    </div>
                  ))}
               </div>

               {departmentStats[selectedDept].contratosSinCobertura > 0 && (
                 <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                   <AlertTriangle className="text-rose-600 shrink-0" size={20} />
                   <div>
                     <p className="text-sm font-bold text-rose-900">Alerta de Riesgo</p>
                     <p className="text-xs text-rose-700 mt-1">
                       Se detectaron {departmentStats[selectedDept].contratosSinCobertura} contratos sin respaldo vigente en este departamento.
                     </p>
                   </div>
                 </div>
               )}
            </div>
          </motion.div>
        ) : (
          <>
            <div className="bg-white rounded-[40px] border border-slate-200 shadow-sm p-8">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Award className="text-emerald-500" size={18} />
                Mejores Casos de Cobertura
              </h3>
              <div className="space-y-4">
                {bestDepts.map((dept, idx) => (
                  <div 
                    key={dept.name} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-emerald-50 cursor-pointer transition-all border border-transparent hover:border-emerald-200 group"
                    onClick={() => setSelectedDept(dept.name)}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 group-hover:text-emerald-800 transition-colors text-sm">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-emerald-600">{dept.coverage.toFixed(1)}%</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Asegurado</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded-[40px] shadow-xl p-8 text-white flex-1 flex flex-col justify-center relative overflow-hidden">
               <div className="absolute -right-10 -bottom-10 opacity-10">
                 <ShieldCheck size={180} />
               </div>
               <div className="relative z-10">
                 <h3 className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2 mb-4">
                   <TrendingUp size={18} />
                   Análisis Estratégico
                 </h3>
                 <p className="text-xl font-bold leading-tight mb-4">
                   La gestión territorial enfocada en riesgos asegura la continuidad de los proyectos.
                 </p>
                 <div className="space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-slate-400 font-medium">Validación automática de Ley 1523 activa.</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <p className="text-xs text-slate-400 font-medium">Alertas tempranas de vencimiento sincronizadas.</p>
                   </div>
                 </div>
               </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
