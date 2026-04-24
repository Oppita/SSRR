import React, { useState } from 'react';
import { Map as MapIcon, CloudRain, Wind, Waves, Thermometer, Info, Layers, Maximize2 } from 'lucide-react';
import { EmergenciaEvento, HeatMapPoint } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface HeatMapEventoProps {
  evento: EmergenciaEvento;
}

export const HeatMapEvento: React.FC<HeatMapEventoProps> = ({ evento }) => {
  const [activeLayer, setActiveLayer] = useState<'all' | 'rain' | 'wind' | 'surge' | 'temp'>('all');
  const [selectedPoint, setSelectedPoint] = useState<HeatMapPoint | null>(null);

  const points = evento.heatmapPoints || [];
  
  const filteredPoints = activeLayer === 'all' 
    ? points 
    : points.filter(p => p.type === activeLayer);

  const getIcon = (type: string) => {
    switch (type) {
      case 'rain': return <CloudRain size={14} className="text-blue-500" />;
      case 'wind': return <Wind size={14} className="text-slate-400" />;
      case 'surge': return <Waves size={14} className="text-cyan-600" />;
      case 'temp': return <Thermometer size={14} className="text-indigo-400" />;
      default: return <Info size={14} />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'rain': return 'Precipitación';
      case 'wind': return 'Vientos';
      case 'surge': return 'Oleaje/Erosión';
      case 'temp': return 'Descenso Térmico';
      default: return 'Impacto';
    }
  };

  return (
    <div className="relative w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl h-[500px]">
      {/* Map Background (Simulated with SVG/CSS for high performance) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 800 600" className="fill-slate-700">
          <path d="M200,100 Q250,50 300,100 T400,150 T500,100 T600,200 T550,300 T450,400 T300,450 T200,400 T150,300 T200,100" />
          <path d="M600,400 Q650,350 700,400 T750,500 T650,550 T550,500 T600,400" />
        </svg>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 pointer-events-none">
        {Array.from({ length: 144 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-800/30" />
        ))}
      </div>

      {/* Heatmap Points */}
      <div className="absolute inset-0">
        {filteredPoints.map((point, idx) => {
          // Simple projection: lat/lng to % (Colombia bounds approx: 12N to 4S, 67W to 79W)
          const top = ((13 - point.lat) / 17) * 100;
          const left = ((point.lng + 80) / 15) * 100;
          
          return (
            <motion.div
              key={idx}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="absolute cursor-pointer group"
              style={{ top: `${top}%`, left: `${left}%` }}
              onClick={() => setSelectedPoint(point)}
            >
              {/* Heat Glow */}
              <div 
                className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl opacity-40 animate-pulse`}
                style={{ 
                  width: `${point.radius * 4}px`, 
                  height: `${point.radius * 4}px`,
                  backgroundColor: point.type === 'rain' ? '#3b82f6' : point.type === 'wind' ? '#94a3b8' : point.type === 'surge' ? '#0891b2' : '#818cf8'
                }}
              />
              {/* Core Point */}
              <div 
                className={`w-3 h-3 rounded-full border-2 border-white shadow-lg -translate-x-1/2 -translate-y-1/2 relative z-10`}
                style={{ 
                  backgroundColor: point.type === 'rain' ? '#2563eb' : point.type === 'wind' ? '#475569' : point.type === 'surge' ? '#0e7490' : '#4f46e5'
                }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-1 rounded-xl flex flex-col gap-1 shadow-xl">
          <button 
            onClick={() => setActiveLayer('all')}
            className={`p-2 rounded-lg transition-all ${activeLayer === 'all' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Ver Todo"
          >
            <Layers size={18} />
          </button>
          <div className="h-px bg-slate-700 mx-2" />
          <button 
            onClick={() => setActiveLayer('rain')}
            className={`p-2 rounded-lg transition-all ${activeLayer === 'rain' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Precipitación"
          >
            <CloudRain size={18} />
          </button>
          <button 
            onClick={() => setActiveLayer('wind')}
            className={`p-2 rounded-lg transition-all ${activeLayer === 'wind' ? 'bg-slate-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Vientos"
          >
            <Wind size={18} />
          </button>
          <button 
            onClick={() => setActiveLayer('surge')}
            className={`p-2 rounded-lg transition-all ${activeLayer === 'surge' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Oleaje"
          >
            <Waves size={18} />
          </button>
          <button 
            onClick={() => setActiveLayer('temp')}
            className={`p-2 rounded-lg transition-all ${activeLayer === 'temp' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:bg-slate-700'}`}
            title="Temperatura"
          >
            <Thermometer size={18} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-xl">
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Leyenda de Impacto</h5>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              <span>Precipitación Extrema</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
              <span>Vientos Sistémicos</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <div className="w-2 h-2 rounded-full bg-cyan-600 shadow-[0_0_8px_rgba(8,145,178,0.5)]" />
              <span>Erosión / Oleaje</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      <AnimatePresence>
        {selectedPoint && (
          <motion.div 
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute top-4 right-4 bottom-4 w-72 bg-slate-800/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl z-30 p-5 flex flex-col"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-slate-700 rounded-lg">
                {getIcon(selectedPoint.type)}
              </div>
              <button 
                onClick={() => setSelectedPoint(null)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <Maximize2 size={16} />
              </button>
            </div>
            
            <h4 className="text-lg font-bold text-white mb-1">{getTypeLabel(selectedPoint.type)}</h4>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500" 
                  style={{ width: `${selectedPoint.intensity * 100}%` }}
                />
              </div>
              <span className="text-[10px] font-bold text-indigo-400">{(selectedPoint.intensity * 100).toFixed(0)}%</span>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {selectedPoint.description}
            </p>

            <div className="mt-auto pt-6 border-t border-slate-700">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Latitud</p>
                  <p className="text-xs text-slate-300">{selectedPoint.lat.toFixed(4)}</p>
                </div>
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Longitud</p>
                  <p className="text-xs text-slate-300">{selectedPoint.lng.toFixed(4)}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Overlay */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-full shadow-xl flex items-center gap-3">
          <MapIcon size={16} className="text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide uppercase">Mapa de Impacto Sistémico</span>
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>
    </div>
  );
};
