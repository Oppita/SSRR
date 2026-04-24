import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { TerritoryRiskProfile } from '../types';

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

interface FinancialMapProps {
  riskProfiles: TerritoryRiskProfile[];
  onSelectTerritory: (dept: string) => void;
  selectedDept: string | null;
}

export const FinancialMap: React.FC<FinancialMapProps> = ({ riskProfiles, onSelectTerritory, selectedDept }) => {
  const [tooltipContent, setTooltipContent] = useState("");

  const getColor = (irftScore: number) => {
    // Green (low risk) to Red (high risk)
    if (irftScore < 30) return '#10b981'; // emerald-500
    if (irftScore < 50) return '#f59e0b'; // amber-500
    if (irftScore < 70) return '#f97316'; // orange-500
    return '#ef4444'; // rose-500
  };

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1800,
          center: [-74, 4.5]
        }}
        width={800}
        height={600}
        style={{ width: "100%", height: "100%" }}
      >
        <ZoomableGroup center={[-74, 4.5]} zoom={1} minZoom={1} maxZoom={8}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const hcKey = geo.properties["hc-key"];
                const deptName = deptMapping[hcKey];
                const profile = riskProfiles.find(p => p.departamento === deptName);
                
                // Default color if no data
                let fillColor = "#e2e8f0"; // slate-200
                if (profile) {
                  fillColor = getColor(profile.irftScore);
                }

                const isSelected = selectedDept === deptName;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        fill: fillColor,
                        outline: "none",
                        stroke: isSelected ? "#1e293b" : "#ffffff",
                        strokeWidth: isSelected ? 2 : 0.5,
                      },
                      hover: {
                        fill: profile ? "#334155" : "#cbd5e1",
                        outline: "none",
                        cursor: "pointer"
                      },
                      pressed: {
                        fill: "#1e293b",
                        outline: "none",
                      },
                    }}
                    onMouseEnter={() => {
                      if (deptName) {
                        setTooltipContent(`${deptName}${profile ? ` - IRFT: ${profile.irftScore}` : ' - Sin datos'}`);
                      }
                    }}
                    onMouseLeave={() => {
                      setTooltipContent("");
                    }}
                    onClick={() => {
                      if (deptName) {
                        onSelectTerritory(deptName);
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {tooltipContent && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-xl pointer-events-none z-10">
          {tooltipContent}
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-slate-200 shadow-lg text-xs">
        <p className="font-bold text-slate-700 mb-2">Índice de Riesgo (IRFT)</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span>Bajo (&lt;30)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span>Medio (30-50)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500"></div><span>Alto (50-70)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span>Crítico (&gt;70)</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-200"></div><span>Sin datos</span></div>
        </div>
      </div>
    </div>
  );
};
