import React, { useState, useMemo } from 'react';
import { X, MapPin, FileText, Database, Upload, CheckCircle2, AlertTriangle, Settings, Plus, Search, ArrowRight, Loader2, ShieldCheck, Activity, Save, Edit3, RefreshCw, DollarSign, Trash2, Home, Users, Package, Truck, HardHat, Droplets, Zap, Phone, Stethoscope, GraduationCap, Construction, ClipboardList, Cpu, Brain, Sparkles, Info } from 'lucide-react';
import { extractEDANData } from '../services/geminiService';
import { AIProvider } from '../services/aiProviderService';
import { useProject } from '../store/ProjectContext';
import { MunicipalityInventory, DamageItem, TIPOS_EVENTO_GENERADOR, Comision } from '../types';
import { EDANConsolidator } from './EDANConsolidator';

interface EDANInventoryManagerProps {
  deptName: string;
  eventId: string;
  onClose: () => void;
}

export const EDANInventoryManager: React.FC<EDANInventoryManagerProps> = ({ deptName, eventId, onClose }) => {
  const { state, updateEvento, updateMunicipalityInventory, updateComision } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuni, setSelectedMuni] = useState<MunicipalityInventory | null>(null);
  const [isAddingMuni, setIsAddingMuni] = useState(false);
  const [newMuniName, setNewMuniName] = useState('');

  const filteredMunicipios = useMemo(() => {
    return (state.municipalityInventories || []).filter(m => 
      (m.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [state.municipalityInventories, searchQuery]);

  const handleSaveConsolidado = (data: MunicipalityInventory) => {
    updateMunicipalityInventory(data);
    
    // Update event metrics
    const eventToUpdate = state.eventos.find(e => e.id === eventId);
    if (eventToUpdate) {
      const updatedEvent = {
        ...eventToUpdate,
        metrics: {
          ...eventToUpdate.metrics,
          costoReparacion: (eventToUpdate.metrics?.costoReparacion || 0) + (data.costoTotalEstimado || 0)
        }
      };
      updateEvento(updatedEvent);
    }
    
    alert(`Consolidado de ${data.name} guardado correctamente.`);
    setSelectedMuni(null);
  };

  const handleAddMuni = () => {
    if (!newMuniName.trim()) return;
    const newMuni: MunicipalityInventory = {
      id: Math.random().toString(36).substr(2, 5),
      eventId: eventId,
      name: newMuniName,
      edanStatus: 'Pendiente',
      runapeStatus: 'Sin Datos',
      lastUpdate: new Date().toISOString().split('T')[0],
      generalData: { diligenciador: '', institucion: '', cargo: '', telefono: '', celular: '', tipoEvento: [], coordinadorCMGRD: '', alcaldeMunicipal: '', fechaEvaluacion: '', horaEvaluacion: '', fecha: '', hora: '', evento: '', descripcionEvento: '', magnitud: '', fechaEvento: '', horaEvento: '', sitioEvento: '', sectoresAfectados: '', eventosSecundarios: '' },
      poblacion: { 
        heridos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        muertos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        desaparecidos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        familiasAfectadas: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        personasAfectadas: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        enfermos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        evacuados: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        albergados: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } } 
      },
      danosVivienda: { 
        destruidas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
        grave: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
        moderado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
        leve: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
        materialPredominante: '',
        techosAfectadosClima: 0,
        hogaresPropietarios: 0,
        hogaresArrendatarios: 0,
        hogaresJefaturaFemenina: 0
      },
      infraestructuraPorSector: {
        salud: { hospitales: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, puestosSalud: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, laboratorios: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, centrosAfectados: 0 },
        educacionMedia: { colegios: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, institucionesAfectadas: 0, estudiantesSinClases: 0 },
        educacionSuperior: { universidades: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
        transporteVias: { viasPrimarias: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, viasSecundarias: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
        energia: { torres: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, subestaciones: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, personasSinServicio: 0, diasEstimadosSinEnergia: 0 },
        aguaGas: { acueducto: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, alcantarillado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, personasSinAgua: 0, alcantarilladoStatus: 'Funcional' },
        comunicaciones: { antenas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, status: 'Funcional' },
        icbf: { hogaresCDI: {}, hogaresAfectados: 0 }
      },
      infraestructura: { centrosSalud: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, centrosEducativos: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, viasMetros: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, puentesVehiculares: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, puentesPeatonales: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, redesElectricas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, acueducto: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, alcantarillado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
      serviciosPublicos: { acueducto: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, alcantarillado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, energia: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, gas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
      necesidades: { mercados: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, kitsAseo: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, kitsCocina: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, frazadas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, colchonetas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, aguaLitros: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, maquinariaHoras: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
      costoTotalEstimado: 0
    };
    updateMunicipalityInventory(newMuni);
    setNewMuniName('');
    setIsAddingMuni(false);
    setSelectedMuni(newMuni);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-6xl overflow-hidden animate-in zoom-in duration-300 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-indigo-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-2xl">
              <MapPin size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black">Gestión Territorial: {deptName}</h3>
              <p className="text-xs text-indigo-300 uppercase tracking-[0.2em] font-bold">Consolidación Unificada de Daños y Necesidades</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar: Municipality List */}
          <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
            <div className="p-6 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar municipio..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredMunicipios.map(muni => (
                <button
                  key={muni.id}
                  onClick={() => setSelectedMuni(muni)}
                  className={`w-full p-4 rounded-2xl text-left transition-all border ${selectedMuni?.id === muni.id ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-800 hover:border-indigo-300'}`}
                >
                  <p className="font-black text-sm">{muni.name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${selectedMuni?.id === muni.id ? 'bg-white/20 text-white' : muni.edanStatus === 'Completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {muni.edanStatus}
                    </span>
                    <span className="text-[9px] font-bold opacity-60">{muni.lastUpdate}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
              {isAddingMuni ? (
                <div className="space-y-2 animate-in slide-in-from-bottom-2">
                  <input 
                    type="text" 
                    placeholder="Nombre del municipio..." 
                    autoFocus
                    value={newMuniName}
                    onChange={(e) => setNewMuniName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMuni()}
                    className="w-full px-3 py-2 bg-slate-50 border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddMuni}
                      className="flex-1 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 transition-all"
                    >
                      Confirmar
                    </button>
                    <button 
                      onClick={() => setIsAddingMuni(false)}
                      className="px-3 py-2 bg-slate-100 text-slate-500 rounded-xl text-xs font-black uppercase hover:bg-slate-200 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => setIsAddingMuni(true)}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-black text-xs uppercase hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Agregar Municipio
                </button>
              )}
            </div>
          </div>

          {/* Main Content: EDAN Consolidator */}
          <div className="flex-1 overflow-hidden bg-white">
            {selectedMuni ? (
              <EDANConsolidator 
                initialData={selectedMuni} 
                onSave={handleSaveConsolidado} 
                municipioName={selectedMuni.name}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center">
                  <Database size={48} className="text-slate-200" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-800">Seleccione un Municipio</h4>
                  <p className="text-slate-500 max-w-sm mx-auto mt-2">
                    Para iniciar la consolidación técnica del EDAN, seleccione un municipio del listado lateral o agregue uno nuevo.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
