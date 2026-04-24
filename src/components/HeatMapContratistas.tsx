import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { getOfficialDeptName } from '../lib/stringUtils';
import { Contractor, Contract, Project } from '../types';
import { MapPin, Users, Briefcase, Award, TrendingUp, Target, X, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

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

interface HeatMapContratistasProps {
  contractors: Contractor[];
  contracts: Contract[];
  projects: Project[];
  onSelectContractor: (id: string) => void;
  onSelectProject: (id: string) => void;
}

export const HeatMapContratistas: React.FC<HeatMapContratistasProps> = ({ 
  contractors, 
  contracts, 
  projects,
  onSelectContractor,
  onSelectProject
}) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const departmentStats = useMemo(() => {
    const stats: Record<string, { 
      contractorIds: Set<string>, 
      projectCount: number, 
      totalValue: number, 
      contractors: Contractor[],
      proyectos: Project[],
      avgExecution: number
    }> = {};
    
    // We need to associate contractors with departments. 
    // Usually, this is done via the projects they are working on.
    projects.forEach(p => {
      if (p.departamento) {
        const officialName = getOfficialDeptName(p.departamento);
        if (!stats[officialName]) {
          stats[officialName] = { 
            contractorIds: new Set(), 
            projectCount: 0, 
            totalValue: 0,
            contractors: [],
            proyectos: [],
            avgExecution: 0
          };
        }
        
        stats[officialName].projectCount += 1;
        stats[officialName].proyectos.push(p);
        
        // Find contracts for this project to find contractors
        const projectContracts = contracts.filter(c => c.projectId === p.id);
        projectContracts.forEach(c => {
          const contractor = contractors.find(cont => cont.nit === c.nit);
          if (contractor) {
            if (!stats[officialName].contractorIds.has(contractor.id)) {
              stats[officialName].contractorIds.add(contractor.id);
              stats[officialName].contractors.push(contractor);
            }
          }
          stats[officialName].totalValue += c.valor;
        });
      }
    });

    // Calculate average execution for success analysis
    Object.keys(stats).forEach(dept => {
      const s = stats[dept];
      const executionSum = s.proyectos.reduce((sum, p) => sum + (p.avanceFisico || 0), 0);
      s.avgExecution = s.proyectos.length > 0 ? executionSum / s.proyectos.length : 0;
    });

    return stats;
  }, [contractors, contracts, projects]);

  const maxContractors = Math.max(...Object.values(departmentStats).map(s => s.contractorIds.size), 1);

  const successCases = useMemo(() => {
    return Object.entries(departmentStats)
      .filter(([_, stats]) => stats.proyectos.length >= 1) 
      .map(([name, stats]) => ({ name, avgExecution: stats.avgExecution, projectCount: stats.proyectos.length }))
      .sort((a, b) => b.avgExecution - a.avgExecution)
      .slice(0, 5);
  }, [departmentStats]);

  const getColor = (count: number) => {
    if (count === 0) return "#f8fafc"; // slate-50
    const intensity = count / maxContractors;
    if (intensity > 0.8) return "#1e3a8a"; // blue-900
    if (intensity > 0.6) return "#1e40af"; // blue-800
    if (intensity > 0.4) return "#2563eb"; // blue-600
    if (intensity > 0.2) return "#60a5fa"; // blue-400
    return "#bfdbfe"; // blue-200
  };

  const ranking = useMemo(() => {
    return Object.entries(departmentStats)
      .map(([name, stats]) => ({ name, count: stats.contractorIds.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [departmentStats]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 w-full bg-slate-50 rounded-3xl border border-slate-200 overflow-hidden relative h-[600px] shadow-inner">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 2600, center: [-74, 4.5] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) => {
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
                const stats = departmentStats[officialName] || { contractorIds: new Set(), projectCount: 0, totalValue: 0, contractors: [] };
                const fillColor = getColor(stats.contractorIds.size);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={selectedDept === officialName ? "#1e3a8a" : fillColor}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "all 250ms" },
                      hover: { fill: stats.contractorIds.size > 0 ? "#1d4ed8" : "#e2e8f0", outline: "none", cursor: "pointer" },
                      pressed: { fill: "#1e3a8a", outline: "none" },
                    }}
                    onMouseEnter={() => setHoveredDept(officialName)}
                    onMouseLeave={() => setHoveredDept(null)}
                    onClick={() => {
                      if (stats.contractorIds.size > 0) {
                        setSelectedDept(officialName);
                      }
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ComposableMap>

        {/* Hover Info */}
        {hoveredDept && departmentStats[hoveredDept] && !selectedDept && (
          <div className="absolute top-6 right-6 w-72 bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-5 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                <MapPin size={20} />
              </div>
              <h3 className="font-bold text-slate-800 text-lg">{hoveredDept}</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                  <Users size={14} /> Contratistas:
                </span>
                <span className="font-black text-slate-800 text-lg">{departmentStats[hoveredDept].contractorIds.size}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                  <Briefcase size={14} /> Proyectos:
                </span>
                <span className="font-black text-blue-600 text-lg">{departmentStats[hoveredDept].projectCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-2 uppercase tracking-wider">
                  <TrendingUp size={14} /> Inversión:
                </span>
                <span className="font-black text-slate-800">${(departmentStats[hoveredDept].totalValue / 1000000).toFixed(1)}M</span>
              </div>
              <p className="text-[10px] text-blue-600 text-center mt-2 font-bold bg-blue-50 py-1 rounded-lg">CLICK PARA EXPLORAR TERRITORIO</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md border border-slate-200 p-4 rounded-2xl z-20 shadow-sm">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Densidad de Contratistas</h4>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">0</span>
            <div className="w-40 h-3 rounded-full bg-gradient-to-r from-blue-50 to-blue-900 shadow-inner" />
            <span className="text-xs font-bold text-slate-400">{maxContractors}</span>
          </div>
        </div>
      </div>

      {/* Side Exploration Panel */}
      <div className="flex flex-col gap-6 h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {selectedDept ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <MapPin className="text-blue-600" size={28} />
                  {selectedDept}
                </h3>
                <p className="text-sm text-slate-500 mt-1 font-medium">
                  {departmentStats[selectedDept]?.contractorIds.size || 0} contratistas operando en la zona
                </p>
              </div>
              <button 
                onClick={() => setSelectedDept(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-2 flex justify-between items-center">
                <span>Aliados Territoriales</span>
                <span className="text-blue-600 font-black">{departmentStats[selectedDept]?.contractors.length}</span>
              </h4>
              <div className="flex flex-col gap-4">
                {departmentStats[selectedDept]?.contractors.map(cont => {
                  const contProjects = projects.filter(p => {
                    const pContracts = contracts.filter(c => c.projectId === p.id);
                    return pContracts.some(c => c.nit === cont.nit) && getOfficialDeptName(p.departamento || '') === selectedDept;
                  });

                  return (
                    <motion.div 
                      key={cont.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 cursor-pointer hover:border-blue-300 hover:shadow-xl transition-all"
                      onClick={() => onSelectContractor(cont.id)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xs">
                             {cont.nombre.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-black text-slate-900 text-sm leading-tight">{cont.nombre}</h4>
                            <p className="text-[10px] text-slate-500 font-bold">NIT: {cont.nit}</p>
                          </div>
                        </div>
                        <div className="px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[9px] font-black uppercase tracking-tighter">
                          {contProjects.length} Proy.
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Score Dept.</p>
                          <p className="text-sm font-black text-emerald-600">Aliado Alto</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ejecución</p>
                          <p className="text-sm font-black text-slate-900">{(contProjects.reduce((sum, p) => sum + (p.avanceFisico || 0), 0) / (contProjects.length || 1)).toFixed(1)}%</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                         {contProjects.slice(0, 2).map(proj => (
                           <button
                             key={proj.id}
                             onClick={(e) => {
                               e.stopPropagation();
                               onSelectProject(proj.id);
                             }}
                             className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-colors group"
                           >
                             <span className="text-[10px] font-bold text-slate-600 truncate flex-1 text-left">{proj.nombre}</span>
                             <Briefcase className="text-slate-300 group-hover:text-blue-500" size={12} />
                           </button>
                         ))}
                         {contProjects.length > 2 && (
                           <p className="text-[9px] text-slate-400 font-medium text-center italic">+ {contProjects.length - 2} proyectos adicionales</p>
                         )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Success Cases Panel */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col justify-center relative overflow-hidden mb-6">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                < Award size={180} />
              </div>
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  Casos de Éxito Territorial
                </h3>
                <div className="space-y-4">
                  {successCases.map((dept, idx) => (
                    <div 
                      key={dept.name} 
                      className="group cursor-pointer"
                      onClick={() => setSelectedDept(dept.name)}
                    >
                      <div className="flex justify-between items-end mb-1">
                        <span className="text-sm font-bold text-white/90 group-hover:text-blue-300 transition-colors">{dept.name}</span>
                        <span className="text-xs font-black text-blue-400">{dept.avgExecution.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${dept.avgExecution}%` }}
                          className="h-full bg-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ranking Panel */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <Award className="text-amber-500" size={18} />
                Top Presencia Territorial
              </h3>
              <div className="space-y-4">
                {ranking.map((dept, idx) => (
                  <div 
                    key={dept.name} 
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 cursor-pointer transition-all border border-transparent hover:border-blue-200 group"
                    onClick={() => setSelectedDept(dept.name)}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 group-hover:text-blue-800 transition-colors">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800">{dept.count}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Aliados</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strategic Info */}
            <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl shadow-lg p-8 text-white relative overflow-hidden">
              <div className="absolute -right-6 -top-6 opacity-10">
                <Target size={140} />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-6 relative z-10">
                <TrendingUp className="text-blue-300" size={20} />
                Estrategia de Aliados
              </h3>
              <div className="space-y-6 relative z-10">
                <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20">
                  <h4 className="font-black text-blue-200 text-[10px] uppercase tracking-widest mb-2">Visión Territorial</h4>
                  <p className="text-sm text-white/90 leading-relaxed font-medium">
                    La distribución geográfica de los contratistas permite identificar la capacidad de respuesta inmediata y la especialización regional de nuestros aliados.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-2xl font-black text-white">{contractors.length}</p>
                    <p className="text-[10px] font-bold text-blue-200 uppercase">Total Aliados</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                    <p className="text-2xl font-black text-white">{projects.length}</p>
                    <p className="text-[10px] font-bold text-blue-200 uppercase">Proyectos</p>
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
