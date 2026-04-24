import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, X, Layers, CloudRain, Map as MapIcon, BrainCircuit, Calendar, Send, Loader2, FileSearch, ShieldCheck, Calculator, FileText, Zap, Waves, Thermometer, ClipboardList } from 'lucide-react';
import { AgendaPMU } from './AgendaPMU';
import { AIProviderSelector } from './AIProviderSelector';
import { generateContent, getAIModel } from '../services/aiProviderService';
import ReactMarkdown from 'react-markdown';
import { useProject } from '../store/ProjectContext';
import { EmergenciaEvento, HeatMapPoint, MunicipalityInventory } from '../types';
import { HeatMapEvento } from './HeatMapEvento';
import { EDANConsolidator } from './EDANConsolidator';

interface MicRModuleProps {
  initialEventId?: string;
  onClose?: () => void;
}

export const MicRModule: React.FC<MicRModuleProps> = ({ initialEventId, onClose }) => {
  const { state, updateEvento, updateMunicipalityInventory } = useProject();
  const [activeTab, setActiveTab] = useState<'edan' | 'pmu' | 'ia' | 'eficiencia'>('edan');
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(initialEventId || '');
  
  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);
  
  const selectedEvent = state.eventos?.find(e => e.id === selectedEventId);

  const handleSaveEDAN = (data: MunicipalityInventory) => {
    updateMunicipalityInventory(data);
    
    // Update event metrics based on consolidated data
    if (selectedEvent) {
      const updatedEvento = {
        ...selectedEvent,
        metrics: {
          ...selectedEvent.metrics,
          costoReposicion: (selectedEvent.metrics?.costoReposicion || 0) + (data.costoTotalEstimado || 0),
          viviendasDanadas: (selectedEvent.metrics?.viviendasDanadas || 0) + 
            (data.danosVivienda?.destruidasUrbano?.cantidad || 0) + 
            (data.danosVivienda?.destruidasRural?.cantidad || 0)
        }
      };
      updateEvento(updatedEvento);
    }
    alert('Consolidado EDAN guardado y métricas de evento actualizadas.');
  };

  const handleGenerateHeatmap = () => {
    if (!selectedEvent) return;
    
    const points: HeatMapPoint[] = [];
    const depts = selectedEvent.departamentosAfectados || [];
    
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
      'Norte de Santander': [-72.8, 8.0]
    };

    depts.forEach(dept => {
      const coords = deptCoords[dept] || [-74.0, 4.5];
      points.push({
        lat: coords[1],
        lng: coords[0],
        intensity: 0.8 + Math.random() * 0.2,
        type: 'rain',
        radius: 15,
        description: `Precipitaciones extremas en ${dept}`
      });
    });

    const updatedEvento = { ...selectedEvent, heatmapPoints: points };
    updateEvento(updatedEvento);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <Database className="text-indigo-600" size={28} />
            {selectedEvent ? `Análisis Técnico: ${selectedEvent.nombre}` : 'MIC-R & PMU'}
          </h1>
          <p className="text-slate-500 mt-1">Sistema Nacional Inteligente de Cuantificación del Riesgo y Gasto Público</p>
        </div>
        <div className="flex items-center gap-4">
          <AIProviderSelector />
          {onClose && (
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex px-8 bg-white border-b border-slate-200 shrink-0">
        <button 
          onClick={() => setActiveTab('edan')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'edan' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <ClipboardList size={18} />
          Consolidado EDAN
        </button>
        <button 
          onClick={() => setActiveTab('pmu')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'pmu' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Calendar size={18} />
          Agendas PMU
        </button>
        <button 
          onClick={() => setActiveTab('eficiencia')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'eficiencia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <FileSearch size={18} />
          Eficiencia del Gasto
        </button>
        <button 
          onClick={() => setActiveTab('ia')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'ia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <BrainCircuit size={18} />
          Analítica IA
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'edan' && (
          <div className="h-full overflow-y-auto">
            <EDANConsolidator 
              municipioName={selectedEvent?.municipiosAfectados?.[0]} 
              onSave={handleSaveEDAN} 
            />
          </div>
        )}

        {activeTab === 'pmu' && (
          <div className="p-8 h-full overflow-y-auto">
            <AgendaPMU eventId={selectedEventId} />
          </div>
        )}

        {activeTab === 'eficiencia' && (
          <div className="p-8 h-full overflow-y-auto space-y-8">
             <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm">
                <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Calculator className="text-indigo-600" /> Cruce Daño vs Inversión
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Daño Estimado (EDAN)</p>
                    <p className="text-4xl font-black text-rose-600">$ {selectedEvent?.metrics?.costoReposicion?.toLocaleString() || 0}</p>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Inversión Programada</p>
                    <p className="text-4xl font-black text-emerald-600">$ {selectedEvent?.metrics?.costoReparacion?.toLocaleString() || 0}</p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="p-8 h-full overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl">
                <h3 className="text-2xl font-black mb-4 flex items-center gap-3">
                  <BrainCircuit size={32} className="text-indigo-400" />
                  Asistente de Análisis Técnico
                </h3>
                <p className="text-indigo-200 font-medium">Ejecute análisis avanzados sobre los datos consolidados del evento.</p>
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left border border-white/10">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Análisis de Riesgo</p>
                    <p className="text-[10px] text-indigo-300">Calcula severidad y áreas afectadas validadas.</p>
                  </button>
                  <button className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-left border border-white/10">
                    <p className="text-xs font-black uppercase tracking-widest mb-1">Valoración Económica</p>
                    <p className="text-[10px] text-indigo-300">Aplica metodología VCRA a los daños físicos.</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
