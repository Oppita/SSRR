import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getOfficialDeptName } from '../lib/stringUtils';
import { EmergenciaEvento } from '../types';
import { Calendar, MapPin, Activity } from 'lucide-react';

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

const deptCoords: Record<string, [number, number]> = {
  'Antioquia': [-75.5, 7.0],
  'Chocó': [-76.8, 6.0],
  'Bolívar': [-74.5, 9.0],
  'Magdalena': [-74.2, 10.0],
  'Atlántico': [-74.9, 10.7],
  'La Guajira': [-72.5, 11.5],
  'Cundinamarca': [-74.2, 4.8],
  'Valle del Cauca': [-76.5, 3.8],
  'Cauca': [-76.8, 2.5],
  'Nariño': [-77.5, 1.5],
  'Huila': [-75.7, 2.5],
  'Meta': [-73.0, 3.5],
  'Santander': [-73.5, 7.0],
  'Norte de Santander': [-72.8, 8.0],
  'San Andrés y Providencia': [-78.5, 10.5],
  'Amazonas': [-71.5, -1.0],
  'Arauca': [-71.0, 7.0],
  'Boyacá': [-73.0, 5.5],
  'Caldas': [-75.5, 5.3],
  'Caquetá': [-74.0, 1.0],
  'Casanare': [-71.5, 5.5],
  'Cesar': [-73.5, 9.5],
  'Córdoba': [-75.8, 8.5],
  'Guainía': [-69.0, 3.0],
  'Guaviare': [-72.5, 2.5],
  'Putumayo': [-76.0, 0.5],
  'Quindío': [-75.7, 4.5],
  'Risaralda': [-75.9, 5.0],
  'Sucre': [-75.2, 9.0],
  'Tolima': [-75.2, 4.0],
  'Vaupés': [-70.5, 0.5],
  'Vichada': [-69.5, 4.5],
  'Bogotá D.C.': [-74.08, 4.6]
};

interface EventColombiaMapProps {
  evento: EmergenciaEvento;
  height?: number;
  onDepartmentClick?: (deptName: string) => void;
}

export const EventColombiaMap: React.FC<EventColombiaMapProps> = ({ 
  evento,
  height = 500,
  onDepartmentClick
}) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  const affectedDepartments = evento.departamentosAfectados.map(d => getOfficialDeptName(d));

  return (
    <div className="w-full bg-slate-50 rounded-[2.2rem] overflow-hidden relative" style={{ height }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 2400, center: [-74, 4.5] }}
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
              const isAffected = affectedDepartments.includes(officialName);

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isAffected ? "#3b82f6" : "#f8fafc"} // blue-500 for affected
                  stroke={isAffected ? "#ffffff" : "#cbd5e1"}
                  strokeWidth={isAffected ? 1 : 0.5}
                  style={{
                    default: { outline: "none", transition: "all 250ms" },
                    hover: { fill: isAffected ? "#2563eb" : "#e2e8f0", outline: "none", cursor: "pointer" }, // blue-600 on hover
                    pressed: { fill: "#1d4ed8", outline: "none" }, // blue-700
                  }}
                  onMouseEnter={() => setHoveredDept(officialName)}
                  onMouseLeave={() => setHoveredDept(null)}
                  onClick={() => {
                    if (isAffected && onDepartmentClick) {
                      onDepartmentClick(officialName);
                    }
                  }}
                />
              );
            });
          }}
        </Geographies>

        {/* Event Markers for affected departments */}
        {affectedDepartments.map(dept => {
          const coords = deptCoords[dept];
          if (!coords) return null;

          return (
            <Marker 
              key={dept} 
              coordinates={coords}
            >
              <g className="cursor-pointer">
                <circle r={6} fill="#1e3a8a" stroke="#ffffff" strokeWidth={2} className="animate-pulse" />
                <circle r={12} fill="#1e3a8a" fillOpacity={0.2} />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>
      
      {/* Visual indicator for San Andrés shift */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 px-2 py-1 bg-white/50 backdrop-blur-sm rounded-md border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Archipiélago Integrado</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
        {hoveredDept ? `Departamento: ${hoveredDept}` : 'Mapa de Impacto Territorial'}
      </div>
    </div>
  );
};
