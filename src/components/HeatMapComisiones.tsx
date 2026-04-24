import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getOfficialDeptName } from '../lib/stringUtils';
import { Comision } from '../types';
import { MapPin, Users, DollarSign, Calendar, Activity, X, Target, TrendingUp, Award } from 'lucide-react';

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

interface HeatMapComisionesProps {
  comisiones: Comision[];
}

export const HeatMapComisiones: React.FC<HeatMapComisionesProps> = ({ comisiones }) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  const departmentStats = useMemo(() => {
    const stats: Record<string, { count: number, cost: number, active: number, comisiones: Comision[] }> = {};
    
    comisiones.forEach(c => {
      if (c.departamento) {
        const officialName = getOfficialDeptName(c.departamento);
        if (!stats[officialName]) {
          stats[officialName] = { count: 0, cost: 0, active: 0, comisiones: [] };
        }
        stats[officialName].count += 1;
        stats[officialName].cost += (c.costoTotal || 0);
        stats[officialName].comisiones.push(c);
        if (c.estado === 'En Curso') {
          stats[officialName].active += 1;
        }
      }
    });
    return stats;
  }, [comisiones]);

  const maxCount = Math.max(...Object.values(departmentStats).map(s => s.count), 1);

  // Ranking de departamentos
  const ranking = useMemo(() => {
    return Object.entries(departmentStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [departmentStats]);

  // Function to get color based on intensity (purple scale)
  const getColor = (count: number) => {
    if (count === 0) return "#f8fafc"; // slate-50
    const intensity = count / maxCount;
    if (intensity > 0.8) return "#6b21a8"; // purple-800
    if (intensity > 0.6) return "#7e22ce"; // purple-700
    if (intensity > 0.4) return "#9333ea"; // purple-600
    if (intensity > 0.2) return "#a855f7"; // purple-500
    return "#d8b4fe"; // purple-300
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative h-[500px]">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 2200, center: [-74, 4.5] }}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) => {
              // Transform San Andrés to be visible and integrated
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
                    return [
                      targetLng + (relLng * scaleFactor),
                      targetLat + (relLat * scaleFactor)
                    ];
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
                
                const stats = departmentStats[officialName] || { count: 0, cost: 0, active: 0, comisiones: [] };
                const fillColor = getColor(stats.count);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={selectedDept === officialName ? "#4c1d95" : fillColor}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none", transition: "all 250ms" },
                      hover: { fill: stats.count > 0 ? "#581c87" : "#e2e8f0", outline: "none", cursor: "pointer" },
                      pressed: { fill: "#3b0764", outline: "none" },
                    }}
                    onMouseEnter={() => setHoveredDept(officialName)}
                    onMouseLeave={() => setHoveredDept(null)}
                    onClick={() => {
                      if (stats.count > 0) {
                        setSelectedDept(officialName);
                      }
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ComposableMap>
        
        {/* Hover Card for Department Stats */}
        {hoveredDept && departmentStats[hoveredDept] && !selectedDept && (
          <div className="absolute top-4 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
              <div className="p-1.5 bg-purple-100 rounded-lg text-purple-600">
                <MapPin size={16} />
              </div>
              <h3 className="font-bold text-slate-800">{hoveredDept}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Calendar size={12} /> Total Comisiones:
                </span>
                <span className="font-bold text-slate-800">{departmentStats[hoveredDept].count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Activity size={12} /> En Curso:
                </span>
                <span className="font-bold text-emerald-600">{departmentStats[hoveredDept].active}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <DollarSign size={12} /> Costo Total:
                </span>
                <span className="font-bold text-slate-800">${(departmentStats[hoveredDept].cost / 1000000).toFixed(1)}M</span>
              </div>
              <p className="text-[10px] text-indigo-600 text-center mt-2 font-medium">Click para ver detalles</p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md border border-slate-200 p-3 rounded-xl z-20 shadow-sm">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Densidad de Comisiones</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">0</span>
            <div className="w-32 h-2 rounded-full bg-gradient-to-r from-purple-100 to-purple-800" />
            <span className="text-xs text-slate-400">{maxCount}</span>
          </div>
        </div>
      </div>

      {/* Side Panel */}
      <div className="flex flex-col gap-6 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {selectedDept ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 animate-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                  <MapPin className="text-purple-600" size={24} />
                  {selectedDept}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {departmentStats[selectedDept]?.count || 0} comisiones registradas
                </p>
              </div>
              <button 
                onClick={() => setSelectedDept(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase mb-1">Inversión Total</p>
                <p className="text-lg font-black text-slate-800">
                  ${((departmentStats[selectedDept]?.cost || 0) / 1000000).toFixed(1)}M
                </p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <p className="text-xs font-bold text-emerald-600 uppercase mb-1">En Curso</p>
                <p className="text-lg font-black text-emerald-700">
                  {departmentStats[selectedDept]?.active || 0}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wider border-b pb-2">Listado de Comisiones</h4>
              {departmentStats[selectedDept]?.comisiones.map(com => (
                <div key={com.id} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-purple-300 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold px-2 py-1 bg-purple-100 text-purple-700 rounded-md">
                      {com.tipoComision || 'General'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      com.estado === 'En Curso' ? 'bg-emerald-100 text-emerald-700' :
                      com.estado === 'Programada' ? 'bg-blue-100 text-blue-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {com.estado}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 mb-1">{com.municipios || 'Varios municipios'}</p>
                  <p className="text-xs text-slate-600 line-clamp-2 mb-2">{com.objeto}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-500">
                    <span className="flex items-center gap-1"><Calendar size={12} /> {com.fechaInicio}</span>
                    <span className="flex items-center gap-1"><DollarSign size={12} /> ${(com.costoTotal || 0).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Ranking de Departamentos */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Award className="text-amber-500" size={18} />
                Top Departamentos
              </h3>
              <div className="space-y-3">
                {ranking.map((dept, idx) => (
                  <div 
                    key={dept.name} 
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-purple-50 cursor-pointer transition-colors border border-transparent hover:border-purple-200"
                    onClick={() => setSelectedDept(dept.name)}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        idx === 0 ? 'bg-amber-100 text-amber-700' :
                        idx === 1 ? 'bg-slate-200 text-slate-700' :
                        idx === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-700 text-sm">{dept.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-800 text-sm">{dept.count}</p>
                      <p className="text-[10px] text-slate-500">comisiones</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Impacto y Objetivos Didácticos */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-sm p-6 text-white relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Target size={100} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2 mb-4 relative z-10">
                <TrendingUp className="text-indigo-200" size={18} />
                Impacto Estratégico
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <h4 className="font-bold text-indigo-100 text-xs mb-1">Objetivo Principal</h4>
                  <p className="text-sm text-white/90 leading-relaxed">
                    Las comisiones en terreno garantizan la supervisión directa, verificación de avances y resolución de cuellos de botella en tiempo real.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <h4 className="font-bold text-indigo-100 text-xs mb-1">Impacto Esperado</h4>
                  <ul className="text-xs text-white/90 space-y-2 mt-2">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span>Reducción del 30% en retrasos de obra por decisiones in situ.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span>Aumento de la calidad de datos reportados en un 45%.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                      <span>Mitigación temprana de riesgos sociales y ambientales.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
