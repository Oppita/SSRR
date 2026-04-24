import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { getOfficialDeptName } from '../lib/stringUtils';
import { EmergenciaEvento } from '../types';
import { AlertTriangle, Calendar, MapPin, Activity } from 'lucide-react';

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
  'San Andrés y Providencia': [-78.5, 10.5], // Shifted location
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

interface ColombiaSelectionMapProps {
  selectedDepartments: string[];
  onToggleDepartment: (deptName: string) => void;
  height?: number;
  events?: EmergenciaEvento[];
  mode?: 'declaratoria' | 'inventario';
}

export const ColombiaSelectionMap: React.FC<ColombiaSelectionMapProps> = ({ 
  selectedDepartments, 
  onToggleDepartment,
  height = 400,
  events = [],
  mode = 'declaratoria'
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<EmergenciaEvento | null>(null);
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  const getHelpText = () => {
    if (hoveredDept) return `Departamento: ${hoveredDept}`;
    return mode === 'inventario' 
      ? 'Click para gestionar inventario (EDAN/RUNAPE)' 
      : 'Click para seleccionar departamentos';
  };

  return (
    <div className="w-full bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative" style={{ height }}>
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
              const scaleFactor = 8.0; // Increased scale factor for better visibility
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
              const isSelected = selectedDepartments.includes(officialName);
              const hasEvents = events.some(e => e.departamentosAfectados.includes(officialName));

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isSelected ? "#4f46e5" : (hasEvents ? "#fee2e2" : "#f8fafc")}
                  stroke={isSelected ? "#ffffff" : (hasEvents ? "#fecaca" : "#cbd5e1")}
                  strokeWidth={isSelected ? 1 : 0.5}
                  style={{
                    default: { outline: "none", transition: "all 250ms" },
                    hover: { fill: isSelected ? "#4338ca" : "#e2e8f0", outline: "none", cursor: "pointer" },
                    pressed: { fill: "#3730a3", outline: "none" },
                  }}
                  onMouseEnter={() => setHoveredDept(officialName)}
                  onMouseLeave={() => setHoveredDept(null)}
                  onClick={() => onToggleDepartment(officialName)}
                />
              );
            });
          }}
        </Geographies>

        {/* Event Markers */}
        {events.map(event => {
          // Show marker on the first department listed
          const mainDept = event.departamentosAfectados[0];
          const coords = deptCoords[mainDept];
          if (!coords) return null;

          return (
            <Marker 
              key={event.id} 
              coordinates={coords}
              onMouseEnter={() => setHoveredEvent(event)}
              onMouseLeave={() => setHoveredEvent(null)}
            >
              <g className="cursor-pointer">
                <circle r={6} fill="#ef4444" stroke="#ffffff" strokeWidth={2} className="animate-pulse" />
                <circle r={12} fill="#ef4444" fillOpacity={0.2} />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>
      
      {/* Hover Card for Events */}
      {hoveredEvent && (
        <div className="absolute top-4 right-4 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-3">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              hoveredEvent.estado === 'Activo' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
            }`}>
              {hoveredEvent.estado}
            </span>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {hoveredEvent.tipo}
            </span>
          </div>
          <h4 className="text-sm font-black text-slate-800 mb-2">{hoveredEvent.nombre}</h4>
          <div className="space-y-2 text-[11px] text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar size={12} className="text-slate-400" />
              <span>Inició: {hoveredEvent.fechaInicio}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={12} className="text-slate-400" />
              <span className="line-clamp-1">{hoveredEvent.departamentosAfectados.join(', ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={12} className="text-slate-400" />
              <span>{hoveredEvent.municipiosAfectados.length} Municipios impactados</span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-top border-slate-100">
            <p className="text-[10px] text-slate-400 italic line-clamp-2">{hoveredEvent.descripcion}</p>
          </div>
        </div>
      )}

      {/* Visual indicator for San Andrés shift */}
      <div className="absolute top-4 left-4 pointer-events-none">
        <div className="flex items-center gap-2 px-2 py-1 bg-white/50 backdrop-blur-sm rounded-md border border-slate-200">
          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Archipiélago Integrado</span>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider pointer-events-none">
        {getHelpText()}
      </div>
    </div>
  );
};
