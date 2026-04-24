import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ScatterChart, Scatter, ZAxis, Legend, Line, LineChart, ReferenceLine, BarChart, Bar, Cell, ComposedChart } from 'recharts';
import { Home, Truck, Leaf, Zap, Activity, Target, ShieldCheck, AlertCircle, TrendingUp, BarChart3, Info, Calculator, Settings, Plus, Trash2, ChevronRight, HelpCircle, Lightbulb, CheckCircle2, GitBranch, FileSearch, Download, Printer, ShieldAlert, Landmark, Shield } from 'lucide-react';
import { InventoryItem } from '../types';

// --- Technical Glosa Interface ---
interface TechnicalGlosa {
  id: string;
  fecha: string;
  municipio: string;
  auditor: string;
  hallazgo: {
    tipo: string;
    magnitud: string;
    evidenciaEstadistica: string;
    causaRaiz: string;
  };
  contextoRiesgo: {
    irt: number;
    vulnerabilidad: string;
    exposicion: string;
  };
  objecionTecnica: string;
  accionRequerida: string;
}

// --- Damage Functions Data & Logic ---
interface DamageCurve {
  name: string;
  icon: React.ReactNode;
  formula: string;
  description: string;
  color: string;
  k?: number;
  i0?: number;
  a?: number;
  b?: number;
  c?: number;
  d?: number;
}

const damageCurves: Record<string, DamageCurve> = {
  viviendas: {
    name: 'Viviendas',
    icon: <Home size={20} />,
    formula: 'D(i) = 1 / (1 + e^(-k(i - i0)))',
    description: 'Función logística que modela el colapso estructural. El daño es mínimo hasta superar el umbral de resistencia (i0).',
    k: 0.8,
    i0: 4, 
    color: '#4f46e5'
  },
  vial: {
    name: 'Infraestructura Vial',
    icon: <Truck size={20} />,
    formula: 'D(i) = a * i^b',
    description: 'Modelo de potencia para erosión y remoción en masa. El daño crece exponencialmente con la intensidad de lluvia/viento.',
    a: 0.05,
    b: 1.5,
    color: '#10b981'
  },
  cultivos: {
    name: 'Cultivos',
    icon: <Leaf size={20} />,
    formula: 'D(i) = min(1, c * i)',
    description: 'Modelo lineal con saturación. Los cultivos termosensibles sufren daño total rápidamente ante descensos térmicos.',
    c: 0.25,
    color: '#f59e0b'
  },
  servicios: {
    name: 'Servicios Públicos',
    icon: <Zap size={20} />,
    formula: 'D(i) = d * log(i + 1)',
    description: 'Modelo logarítmico para redes eléctricas y acueductos. Alta sensibilidad inicial a ráfagas de viento.',
    d: 0.4,
    color: '#ef4444'
  }
};

const generateCurveData = (type: string) => {
  const curve = damageCurves[type];
  const data = [];
  if (!curve) return [];
  for (let i = 0; i <= 10; i += 0.5) {
    let damage = 0;
    if (type === 'viviendas' && curve.k !== undefined && curve.i0 !== undefined) {
      damage = 1 / (1 + Math.exp(-curve.k * (i - curve.i0)));
    } else if (type === 'vial' && curve.a !== undefined && curve.b !== undefined) {
      damage = Math.min(1, curve.a * Math.pow(i, curve.b));
    } else if (type === 'cultivos' && curve.c !== undefined) {
      damage = Math.min(1, curve.c * i);
    } else if (type === 'servicios' && curve.d !== undefined) {
      damage = Math.min(1, curve.d * Math.log(i + 1));
    }
    
    data.push({ intensity: i, damage: damage * 100 });
  }
  return data;
};

// --- DMAIC Six Sigma Data ---
const dmaicSteps = [
  { id: 'D', name: 'Define', icon: <Target />, color: 'bg-blue-500', desc: 'Definir el estándar de Verdad Técnica (Ground Truth).' },
  { id: 'M', name: 'Measure', icon: <Activity />, color: 'bg-emerald-500', desc: 'Medir la brecha (Gap) entre Territorio y UNGRD.' },
  { id: 'A', name: 'Analyze', icon: <TrendingUp />, color: 'bg-amber-500', desc: 'Identificar causas raíz de la varianza.' },
  { id: 'I', name: 'Improve', icon: <ShieldCheck />, color: 'bg-indigo-500', desc: 'Optimizar protocolos de validación.' },
  { id: 'C', name: 'Control', icon: <BarChart3 />, color: 'bg-rose-500', desc: 'Monitoreo estadístico de discrepancias.' }
];

const varianceData = [
  { municipio: 'Municipio A', territorio: 450, ungrd: 120, gap: 330, error: 2.75 },
  { municipio: 'Municipio B', territorio: 380, ungrd: 310, gap: 70, error: 0.22 },
  { municipio: 'Municipio C', territorio: 890, ungrd: 840, gap: 50, error: 0.15 },
  { municipio: 'Municipio D', territorio: 150, ungrd: 145, gap: 5, error: 0.03 },
  { municipio: 'Municipio E', territorio: 600, ungrd: 450, gap: 150, error: 1.33 },
  { municipio: 'Municipio F', territorio: 210, ungrd: 190, gap: 20, error: 0.10 },
  { municipio: 'Municipio G', territorio: 750, ungrd: 300, gap: 450, error: 3.50 },
];

// Statistical Control Chart Data (X-bar Chart)
const controlChartData = [
  { batch: 1, gap: 12, ucl: 25, lcl: 5, mean: 15 },
  { batch: 2, gap: 18, ucl: 25, lcl: 5, mean: 15 },
  { batch: 3, gap: 28, ucl: 25, lcl: 5, mean: 15 }, // Out of control
  { batch: 4, gap: 14, ucl: 25, lcl: 5, mean: 15 },
  { batch: 5, gap: 8, ucl: 25, lcl: 5, mean: 15 },
  { batch: 6, gap: 4, ucl: 25, lcl: 5, mean: 15 }, // Out of control (below)
  { batch: 7, gap: 16, ucl: 25, lcl: 5, mean: 15 },
  { batch: 8, gap: 15, ucl: 25, lcl: 5, mean: 15 },
];

// Pareto Data
const paretoData = [
  { cause: 'Falta EDAN', count: 450, cumulative: 45 },
  { cause: 'Sobreestimación', count: 300, cumulative: 75 },
  { cause: 'Error Carga', count: 150, cumulative: 90 },
  { cause: 'Duplicidad', count: 60, cumulative: 96 },
  { cause: 'Otros', count: 40, cumulative: 100 },
];

// Ishikawa Data
const ishikawaCategories = [
  { name: 'Métodos', causes: ['Falta de protocolo estandarizado', 'Criterios subjetivos de daño'] },
  { name: 'Medición', causes: ['Instrumentos no calibrados', 'Sesgo del informante local'] },
  { name: 'Mano de Obra', causes: ['Personal sin capacitación técnica', 'Alta rotación de enlaces'] },
  { name: 'Medio Ambiente', causes: ['Dificultad de acceso físico', 'Condiciones climáticas extremas'] },
];

export const DamageFunctionsDMAIC: React.FC = () => {
  const [selectedCurve, setSelectedCurve] = useState<string>('viviendas');
  const [activeDmaic, setActiveDmaic] = useState('M');
  const [showInventory, setShowInventory] = useState(false);
  const [showAnovaDetail, setShowAnovaDetail] = useState(false);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [generatedGlosa, setGeneratedGlosa] = useState<TechnicalGlosa | null>(null);
  
  // Inventory State
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', tipo: 'cultivo', subtipo: 'Papa', cantidad: 120, unidad: 'Hectáreas', valorUnitarioReposicion: 15000000, municipio: 'Tunja', departamento: 'Boyacá' },
    { id: '2', tipo: 'vivienda', subtipo: 'Vivienda Rural', cantidad: 45, unidad: 'Unidades', valorUnitarioReposicion: 65000000, municipio: 'Tunja', departamento: 'Boyacá' },
    { id: '3', tipo: 'servicio', subtipo: 'Red Eléctrica', cantidad: 12, unidad: 'Kilómetros', valorUnitarioReposicion: 120000000, municipio: 'Tunja', departamento: 'Boyacá' },
  ]);

  const curveData = useMemo(() => generateCurveData(selectedCurve), [selectedCurve]);

  const addInventoryItem = () => {
    const newItem: InventoryItem = {
      id: Math.random().toString(36).substr(2, 9),
      tipo: 'vivienda',
      subtipo: 'Nuevo Item',
      cantidad: 0,
      unidad: 'Unidades',
      valorUnitarioReposicion: 0,
      municipio: '',
      departamento: ''
    };
    setInventory([...inventory, newItem]);
  };

  const removeInventoryItem = (id: string) => {
    setInventory(inventory.filter(item => item.id !== id));
  };

  const updateInventoryItem = (id: string, field: keyof InventoryItem, value: any) => {
    setInventory(inventory.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  // Helper to handle chart clicks
  const handleChartClick = (data: any) => {
    if (data && data.activePayload) {
      setSelectedCase(data.activePayload[0].payload);
    } else if (data && data.payload) {
      setSelectedCase(data.payload);
    }
  };

  const handleGenerateGlosa = () => {
    if (!selectedCase) return;

    const municipio = selectedCase.municipio || `Lote ${selectedCase.batch}`;
    const gapPercent = selectedCase.gap ? ((selectedCase.gap / (selectedCase.ungrd || 1)) * 100).toFixed(1) : 'N/A';
    
    // Traceability: Tracking IRT from the Risk Index configuration
    const irtMap: Record<string, { irt: number, vul: string, exp: string }> = { 
      'Municipio A': { irt: 0.84, vul: "Alta (Vivienda precaria y NBI > 60%)", exp: "Zona de Alta Montaña - Remoción en masa" }, 
      'Municipio B': { irt: 0.52, vul: "Media (Déficit cualitativo de vivienda)", exp: "Zona Costera - Inundación por oleaje" }, 
      'Municipio C': { irt: 0.21, vul: "Baja (Infraestructura resiliente)", exp: "Valle Interandino - Bajo riesgo sistémico" }, 
      'Municipio G': { irt: 0.89, vul: "Extrema (Asentamientos informales)", exp: "Riberas de río - Inundación recurrente" }
    };
    
    const context = irtMap[municipio] || { irt: 0.55, vul: "Media-Baja", exp: "Infraestructura crítica estándar" };

    const newGlosa: TechnicalGlosa = {
      id: `GLO-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      fecha: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }),
      municipio: municipio,
      auditor: "Sistema de Control Six Sigma - UNGRD",
      hallazgo: {
        tipo: selectedCase.gap > 100 ? "Sobreestimación Crítica" : "Discrepancia Técnica",
        magnitud: `${gapPercent}% de varianza respecto a validación`,
        evidenciaEstadistica: `Desviación de ${selectedCase.error || '2.4'} sigmas. P-Value: 0.004 (Significativo).`,
        causaRaiz: paretoData[0].cause 
      },
      contextoRiesgo: {
        irt: context.irt,
        vulnerabilidad: context.vul,
        exposicion: context.exp
      },
      objecionTecnica: `Se objeta el reporte EDAN por inconsistencia paramétrica. El valor reportado ($${selectedCase.territorio || selectedCase.gap}M) excede el límite superior de la función de daño logística calculada para la intensidad del evento. El IRT de ${context.irt} confirma que la vulnerabilidad física no justifica la magnitud del daño reportado en los activos de vivienda e infraestructura vial.`,
      accionRequerida: "Re-inspección técnica en terreno por parte del equipo UNGRD y ajuste del RUD municipal bajo supervisión de la Contraloría."
    };

    setGeneratedGlosa(newGlosa);
  };

  const financialCoverage = useMemo(() => {
    if (!selectedCase) return null;
    // Mock financial coverage logic based on municipality and damage
    const coverageMap: Record<string, { fondo: number, seguro: number, catDdo: number }> = {
      'Municipio A': { fondo: 2000, seguro: 50000, catDdo: 100000 },
      'Municipio B': { fondo: 1500, seguro: 25000, catDdo: 50000 },
      'Municipio G': { fondo: 500, seguro: 0, catDdo: 20000 }
    };
    return coverageMap[selectedCase.municipio] || { fondo: 1000, seguro: 10000, catDdo: 30000 };
  }, [selectedCase]);

  return (
    <div className="space-y-12 pb-12">
      
      {/* CASE DETAIL MODAL / PANEL */}
      {selectedCase && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500 rounded-xl">
                  <Target size={20} />
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-tight">Inspección de Caso: {selectedCase.municipio || `Lote ${selectedCase.batch}`}</h3>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Auditoría Six Sigma Real-Time</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCase(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <Trash2 size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Diagnóstico de Varianza</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Reporte Territorio</p>
                      <p className="text-xl font-black text-slate-800">${selectedCase.territorio || selectedCase.gap}M</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Validación UNGRD</p>
                      <p className="text-xl font-black text-emerald-600">${selectedCase.ungrd || selectedCase.mean}M</p>
                    </div>
                  </div>
                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                    <div className="flex items-center gap-2 text-rose-600 mb-1">
                      <AlertCircle size={16} />
                      <span className="text-[10px] font-black uppercase">Varianza Crítica</span>
                    </div>
                    <p className="text-sm font-bold text-rose-900">Desviación de {selectedCase.error || '2.4'} sigmas detectada.</p>
                    <p className="text-xs text-rose-700 mt-1">El reporte supera el límite paramétrico de la función de daño para este activo.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Protección Financiera Vinculada</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Shield size={16} /></div>
                        <span className="text-xs font-bold text-slate-700">Capa 1: Fondo GRD</span>
                      </div>
                      <span className="text-xs font-black text-emerald-600">${financialCoverage?.fondo || 0}M</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Landmark size={16} /></div>
                        <span className="text-xs font-bold text-slate-700">Capa 2: CAT DDO</span>
                      </div>
                      <span className="text-xs font-black text-blue-600">${financialCoverage?.catDdo || 0}M</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-xl opacity-50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Zap size={16} /></div>
                        <span className="text-xs font-bold text-slate-700">Capa 3: Paramétrico</span>
                      </div>
                      <span className="text-xs font-black text-slate-400">No Activado</span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                    <p className="text-[10px] font-black text-indigo-600 uppercase mb-1">Impacto en Respuesta</p>
                    <p className="text-xs text-indigo-800 leading-relaxed">
                      La sobreestimación en este caso compromete el <strong>{((selectedCase.gap / (financialCoverage?.fondo || 1)) * 100).toFixed(0)}%</strong> del Fondo Territorial, limitando la respuesta a otros eventos anómalos como frentes fríos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  onClick={() => setSelectedCase(null)}
                  className="px-6 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
                <button 
                  onClick={handleGenerateGlosa}
                  className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 flex items-center gap-2"
                >
                  <FileSearch size={16} /> Generar Glosa Técnica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TECHNICAL GLOSA DOCUMENT MODAL */}
      {generatedGlosa && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 flex flex-col animate-in zoom-in-95 duration-300">
            {/* Header / Toolbar */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-rose-500 rounded-2xl shadow-lg shadow-rose-500/20">
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Glosa Técnica de Auditoría</h3>
                  <p className="text-xs text-rose-300 font-bold uppercase tracking-widest">Documento Oficial de Objeción • {generatedGlosa.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300" title="Imprimir">
                  <Printer size={20} />
                </button>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-300" title="Descargar PDF">
                  <Download size={20} />
                </button>
                <button 
                  onClick={() => setGeneratedGlosa(null)}
                  className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full hover:bg-white/20 transition-colors ml-4"
                >
                  <Trash2 size={20} className="rotate-45" />
                </button>
              </div>
            </div>

            {/* Document Content */}
            <div className="p-12 overflow-y-auto bg-slate-50/50 flex-1 font-serif">
              <div className="max-w-3xl mx-auto bg-white shadow-sm border border-slate-200 p-16 space-y-10 relative overflow-hidden">
                {/* Watermark */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] pointer-events-none rotate-[-35deg] whitespace-nowrap text-[8rem] font-black select-none">
                  UNGRD AUDIT
                </div>

                {/* Header Info */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entidad Auditada</p>
                    <p className="text-lg font-black text-slate-900 uppercase">Municipio de {generatedGlosa.municipio}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Emisión</p>
                    <p className="text-sm font-bold text-slate-700">{generatedGlosa.fecha}</p>
                  </div>
                </div>

                {/* Section 1: Contexto de Riesgo Territorial */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] border-b border-indigo-100 pb-2">I. Contexto de Riesgo Territorial (IRT)</h4>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Índice de Riesgo (IRT)</p>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-black text-slate-900">{generatedGlosa.contextoRiesgo.irt}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${generatedGlosa.contextoRiesgo.irt * 100}%` }}></div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Vulnerabilidad Detectada</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{generatedGlosa.contextoRiesgo.vulnerabilidad}</p>
                    </div>
                  </div>
                </div>

                {/* Section 2: Hallazgo de Auditoría Six Sigma */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-rose-600 uppercase tracking-[0.2em] border-b border-rose-100 pb-2">II. Hallazgo de Auditoría Six Sigma</h4>
                  <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase">Tipo de Hallazgo</p>
                        <p className="text-sm font-black text-rose-900">{generatedGlosa.hallazgo.tipo}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-rose-400 uppercase">Magnitud de Varianza</p>
                        <p className="text-sm font-black text-rose-900">{generatedGlosa.hallazgo.magnitud}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-rose-400 uppercase mb-1">Evidencia Estadística (ANOVA/DPMO)</p>
                      <p className="text-xs text-rose-800 leading-relaxed italic">"{generatedGlosa.hallazgo.evidenciaEstadistica}"</p>
                    </div>
                    <div className="pt-3 border-t border-rose-100">
                      <p className="text-[10px] font-bold text-rose-400 uppercase">Causa Raíz Identificada (Ishikawa)</p>
                      <p className="text-xs font-bold text-rose-900">{generatedGlosa.hallazgo.causaRaiz}</p>
                    </div>
                  </div>
                </div>

                {/* Section 3: Objeción Técnica */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] border-b border-slate-200 pb-2">III. Objeción Técnica y Sustento</h4>
                  <p className="text-sm text-slate-700 leading-relaxed text-justify first-letter:text-3xl first-letter:font-black first-letter:mr-1 first-letter:float-left">
                    {generatedGlosa.objecionTecnica}
                  </p>
                </div>

                {/* Section 4: Acción Requerida */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-emerald-600 uppercase tracking-[0.2em] border-b border-emerald-100 pb-2">IV. Acción Requerida e Instrucción</h4>
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex gap-4">
                    <div className="p-2 bg-emerald-500 text-white rounded-lg shrink-0 h-fit">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm text-emerald-900 font-medium leading-relaxed">
                      {generatedGlosa.accionRequerida}
                    </p>
                  </div>
                </div>

                {/* Section 5: Interconexión con Protección Financiera */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black text-amber-600 uppercase tracking-[0.2em] border-b border-amber-100 pb-2">V. Análisis de Cobertura Financiera (Complemento)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Fondo Territorial</p>
                      <p className="text-sm font-black text-slate-800">$1,200M</p>
                      <p className="text-[8px] text-emerald-600 font-bold">Disponible</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Seguro Paramétrico</p>
                      <p className="text-sm font-black text-slate-800">$45,000M</p>
                      <p className="text-[8px] text-rose-600 font-bold">No Activado (Trigger)</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">CAT DDO (Hacienda)</p>
                      <p className="text-sm font-black text-slate-800">$120,000M</p>
                      <p className="text-[8px] text-indigo-600 font-bold">En Trámite</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    * La objeción técnica en la Fase Improve bloquea el desembolso de la Capa 2 (Financiación Contingente) hasta que se resuelva la discrepancia del RUD.
                  </p>
                </div>

                {/* Signatures */}
                <div className="pt-16 grid grid-cols-2 gap-16">
                  <div className="text-center space-y-2">
                    <div className="h-[1px] bg-slate-400 w-full mb-4"></div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Firma Auditor Técnico</p>
                    <p className="text-[9px] text-slate-500 uppercase">Unidad Nacional para la Gestión del Riesgo de Desastres</p>
                  </div>
                  <div className="text-center space-y-2">
                    <div className="h-[1px] bg-slate-400 w-full mb-4"></div>
                    <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Firma Supervisor de Control</p>
                    <p className="text-[9px] text-slate-500 uppercase">Oficina de Control Interno UNGRD</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
              <p className="text-[10px] text-slate-400 font-medium italic">Este documento ha sido generado automáticamente mediante el motor de auditoría Six Sigma v2.4. Traceability ID: {generatedGlosa.id}</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setGeneratedGlosa(null)}
                  className="px-8 py-3 text-xs font-black text-slate-500 hover:bg-slate-50 rounded-2xl transition-colors uppercase tracking-widest"
                >
                  Cerrar
                </button>
                <button className="px-8 py-3 bg-slate-900 text-white text-xs font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 uppercase tracking-widest">
                  Notificar a Territorio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 0: INVENTORY PARAMETERIZATION */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
              <Settings size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inventario de Activos Expuestos</h2>
              <p className="text-slate-500 text-sm">Parametrización base para el cálculo de pérdidas</p>
            </div>
          </div>
          <button 
            onClick={() => setShowInventory(!showInventory)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all"
          >
            {showInventory ? 'Ocultar Inventario' : 'Gestionar Inventario'}
          </button>
        </div>

        {showInventory && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-top duration-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-600">Tipo</th>
                    <th className="p-4 font-bold text-slate-600">Subtipo / Activo</th>
                    <th className="p-4 font-bold text-slate-600">Cantidad</th>
                    <th className="p-4 font-bold text-slate-600">Unidad</th>
                    <th className="p-4 font-bold text-slate-600">Valor Reposición (Unit)</th>
                    <th className="p-4 font-bold text-slate-600">Municipio</th>
                    <th className="p-4 font-bold text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <select 
                          className="bg-transparent border-none font-bold text-indigo-600 outline-none"
                          value={item.tipo}
                          onChange={(e) => updateInventoryItem(item.id, 'tipo', e.target.value as any)}
                        >
                          <option value="vivienda">Vivienda</option>
                          <option value="vial">Vial</option>
                          <option value="cultivo">Cultivo</option>
                          <option value="servicio">Servicio</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none w-full"
                          value={item.subtipo}
                          onChange={(e) => updateInventoryItem(item.id, 'subtipo', e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none w-20"
                          value={item.cantidad}
                          onChange={(e) => updateInventoryItem(item.id, 'cantidad', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="p-4 text-slate-500">{item.unidad}</td>
                      <td className="p-4">
                        <input 
                          type="number" 
                          className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none w-32 font-mono"
                          value={item.valorUnitarioReposicion}
                          onChange={(e) => updateInventoryItem(item.id, 'valorUnitarioReposicion', parseFloat(e.target.value))}
                        />
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          className="bg-transparent border-b border-slate-200 focus:border-indigo-500 outline-none w-full"
                          value={item.municipio}
                          onChange={(e) => updateInventoryItem(item.id, 'municipio', e.target.value)}
                        />
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => removeInventoryItem(item.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <button 
                onClick={addInventoryItem}
                className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700"
              >
                <Plus size={16} /> Agregar Activo al Inventario
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 1: DAMAGE FUNCTIONS */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Modelación de Funciones de Daño</h2>
            <p className="text-slate-500 text-sm">Cuantificación técnica vs. Estimaciones arbitrarias</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-4">
            {Object.entries(damageCurves).map(([key, curve]) => (
              <button
                key={key}
                onClick={() => setSelectedCurve(key)}
                className={`w-full p-4 rounded-2xl border transition-all text-left flex items-center gap-4 ${
                  selectedCurve === key 
                    ? 'bg-white border-indigo-500 shadow-lg ring-2 ring-indigo-500/20' 
                    : 'bg-slate-50 border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div className={`p-3 rounded-xl ${selectedCurve === key ? 'bg-indigo-500 text-white' : 'bg-white text-slate-400'}`}>
                  {curve.icon}
                </div>
                <div className="flex-1">
                  <h4 className={`font-bold ${selectedCurve === key ? 'text-indigo-900' : 'text-slate-700'}`}>{curve.name}</h4>
                  <code className="text-[10px] font-mono text-slate-500">{curve.formula}</code>
                </div>
              </button>
            ))}

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-4">
              <h5 className="font-bold flex items-center gap-2 text-indigo-400">
                <Info size={16} /> Ajuste Territorial
              </h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                Las curvas se ajustan mediante el factor <strong>&alpha;</strong> (Vulnerabilidad Intrínseca):
                <br /><br />
                <code>D_adj = D(i) * (1 + &alpha;_social + &alpha;_fisica)</code>
              </p>
              <div className="pt-2 border-t border-white/10">
                <p className="text-[10px] text-slate-500 italic">Ejemplo: Un municipio con 80% NBI desplaza la curva de vivienda un 25% hacia la izquierda (mayor daño a menor intensidad).</p>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Curva de Fragilidad: {damageCurves[selectedCurve]?.name}</h3>
              <p className="text-sm text-slate-500">{damageCurves[selectedCurve]?.description}</p>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={curveData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDamage" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={damageCurves[selectedCurve]?.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={damageCurves[selectedCurve]?.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="intensity" 
                    label={{ value: 'Intensidad del Evento (1-10)', position: 'insideBottom', offset: -5 }} 
                    tick={{fontSize: 12}}
                  />
                  <YAxis 
                    label={{ value: '% Daño Estimado', angle: -90, position: 'insideLeft' }} 
                    tick={{fontSize: 12}}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, 'Daño']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="damage" 
                    stroke={damageCurves[selectedCurve]?.color} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorDamage)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-6">
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Intensidad 3 (Baja)</p>
                <p className="text-lg font-black text-slate-800">{(curveData.find(d => d.intensity === 3)?.damage || 0).toFixed(1)}%</p>
              </div>
              <div className="text-center border-x border-slate-100">
                <p className="text-[10px] uppercase font-bold text-slate-400">Intensidad 6 (Media)</p>
                <p className="text-lg font-black text-slate-800">{(curveData.find(d => d.intensity === 6)?.damage || 0).toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-400">Intensidad 9 (Alta)</p>
                <p className="text-lg font-black text-slate-800">{(curveData.find(d => d.intensity === 9)?.damage || 0).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: DMAIC RIGOROUS VARIANCE CONTROL */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Control de Varianza Six Sigma (DMAIC)</h2>
            <p className="text-slate-500 text-sm">Mitigación de hallazgos de Contraloría mediante rigor estadístico</p>
          </div>
        </div>

        {/* DMAIC Steps Selector */}
        <div className="grid grid-cols-5 gap-2">
          {dmaicSteps.map(step => (
            <button
              key={step.id}
              onClick={() => setActiveDmaic(step.id)}
              className={`flex flex-col items-center p-4 rounded-2xl transition-all border-2 ${
                activeDmaic === step.id 
                  ? `${step.color.replace('bg-', 'border-')} bg-white shadow-md` 
                  : 'border-transparent bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <div className={`p-2 rounded-lg mb-2 ${activeDmaic === step.id ? step.color + ' text-white' : 'bg-slate-200 text-slate-400'}`}>
                {step.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{step.name}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h4 className="font-black text-slate-800 flex items-center gap-2">
                Fase {activeDmaic}: {dmaicSteps.find(s => s.id === activeDmaic)?.desc}
              </h4>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
              <AlertCircle size={14} /> Punto Crítico Contraloría
            </div>
          </div>

          <div className="p-8">
            {/* PHASE: MEASURE (M) - Scatter + X-bar */}
            {activeDmaic === 'M' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <h5 className="text-sm font-bold text-slate-700">1. Dispersión: Territorio vs. UNGRD (Dumbbell)</h5>
                    <div className="flex gap-4 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Territorio</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> UNGRD</div>
                    </div>
                  </div>
                  <div className="h-[300px] bg-slate-50/50 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart 
                        data={varianceData} 
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="municipio" tick={{fontSize: 10}} />
                        <YAxis unit="M" tick={{fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        {/* The "Dumbbell" line connecting the two points */}
                        <Bar dataKey="gap" fill="#cbd5e1" barSize={2} /> 
                        <Scatter 
                          name="Reporte Territorio" 
                          dataKey="territorio" 
                          fill="#4f46e5" 
                          onClick={(data: any) => setSelectedCase(data)}
                          className="cursor-pointer"
                        />
                        <Scatter 
                          name="Validación UNGRD" 
                          dataKey="ungrd" 
                          fill="#10b981" 
                          onClick={(data: any) => setSelectedCase(data)}
                          className="cursor-pointer"
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <HelpCircle size={14} className="inline mr-1 text-indigo-500" /> 
                    <strong>Visualización de Brecha:</strong> Cada línea gris representa la distancia entre lo reportado (Azul) y lo verificado (Verde). Haga clic en cualquier punto para auditar el caso específico.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <h5 className="text-sm font-bold text-slate-700">2. Gráfico de Control X-bar (Estabilidad)</h5>
                    <div className="flex gap-4 text-[10px] font-bold uppercase">
                      <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-rose-500"></div> UCL</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-emerald-500"></div> LCL</div>
                    </div>
                  </div>
                  <div className="h-[300px] bg-slate-50/50 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={controlChartData} 
                        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="batch" tick={{fontSize: 10}} />
                        <YAxis tick={{fontSize: 10}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <ReferenceLine y={25} stroke="#ef4444" strokeDasharray="3 3" />
                        <ReferenceLine y={15} stroke="#64748b" strokeDasharray="3 3" />
                        <ReferenceLine y={5} stroke="#10b981" strokeDasharray="3 3" />
                        <Line 
                          type="monotone" 
                          dataKey="gap" 
                          stroke="#4f46e5" 
                          strokeWidth={3} 
                          onClick={(data: any) => setSelectedCase(data.payload)}
                          className="cursor-pointer"
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const isOut = payload.gap > payload.ucl || payload.gap < payload.lcl;
                            return <circle cx={cx} cy={cy} r={6} fill={isOut ? '#ef4444' : '#4f46e5'} stroke="white" strokeWidth={2} className="cursor-pointer" />;
                          }} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed bg-rose-50 p-3 rounded-xl border border-rose-100">
                    <AlertCircle size={14} className="inline mr-1 text-rose-500" />
                    <strong>Auditoría por Lote:</strong> Los puntos fuera de los límites (Rojos) indican procesos de reporte inestables. Haga clic para ver el desglose del lote.
                  </p>
                </div>
              </div>
            )}

            {/* PHASE: ANALYZE (A) - Pareto + Ishikawa + Deep ANOVA */}
            {activeDmaic === 'A' && (
              <div className="space-y-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Pareto */}
                  <div className="space-y-6">
                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <BarChart3 size={16} className="text-amber-500" /> Diagrama de Pareto (Regla 80/20)
                    </h5>
                    <div className="h-[300px] bg-slate-50/50 rounded-2xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart 
                          data={paretoData}
                          onClick={handleChartClick}
                          className="cursor-pointer"
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="cause" tick={{fontSize: 10}} />
                          <YAxis yAxisId="left" tick={{fontSize: 10}} />
                          <YAxis yAxisId="right" orientation="right" tick={{fontSize: 10}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar yAxisId="left" dataKey="count" fill="#fbbf24" radius={[4, 4, 0, 0]}>
                            {paretoData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index < 2 ? '#fbbf24' : '#d1d5db'} />
                            ))}
                          </Bar>
                          <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      El <strong>75% de las discrepancias</strong> se concentran en solo dos causas: <strong>Falta de EDAN</strong> y <strong>Sobreestimación</strong>. Haga clic en las barras para ver el plan de acción por causa.
                    </p>
                  </div>

                  {/* Ishikawa */}
                  <div className="space-y-6">
                    <h5 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <GitBranch size={16} className="text-indigo-500" /> Diagrama de Ishikawa (Causa-Raíz)
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      {ishikawaCategories.map((cat, i) => (
                        <div key={i} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all">
                          <h6 className="text-[10px] font-black uppercase text-indigo-600 mb-2">{cat.name}</h6>
                          <ul className="space-y-2">
                            {cat.causes.map((cause, j) => (
                              <li key={j} className="text-[10px] text-slate-600 flex items-start gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-300 mt-1.5 shrink-0" />
                                {cause}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                    <div className="p-4 bg-slate-900 text-white rounded-2xl text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Efecto / Problema</p>
                      <p className="text-xs font-black">Discrepancia {'>'} 15% en Reportes de Daño</p>
                    </div>
                  </div>
                </div>

                {/* Deep ANOVA Section */}
                <div className="bg-slate-50 rounded-3xl p-8 border border-slate-200 space-y-6">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp size={18} className="text-emerald-500" /> Análisis de Varianza (ANOVA) en Profundidad
                    </h5>
                    <button 
                      onClick={() => setShowAnovaDetail(!showAnovaDetail)}
                      className="text-xs font-bold text-indigo-600 hover:underline"
                    >
                      {showAnovaDetail ? 'Cerrar Detalles' : 'Ver Análisis Técnico'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full"><Calculator size={20} /></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">R-Cuadrado (R²)</p>
                      <p className="text-3xl font-black text-indigo-900">0.68</p>
                      <p className="text-[10px] text-slate-500">El 68% de la varianza es explicada por el modelo. El resto es ineficiencia operativa.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full"><Activity size={20} /></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">P-Value</p>
                      <p className="text-3xl font-black text-emerald-900">0.004</p>
                      <p className="text-[10px] text-slate-500">Altamente significativo. La diferencia entre Territorio y UNGRD no es azar.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center space-y-2">
                      <div className="p-3 bg-rose-50 text-rose-600 rounded-full"><BarChart3 size={20} /></div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Varianza Actual</p>
                      <p className="text-3xl font-black text-rose-900">18.5%</p>
                      <p className="text-[10px] text-slate-500">Desviación promedio de los reportes vs. Verdad Técnica.</p>
                    </div>
                  </div>

                  {showAnovaDetail && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                      <h6 className="text-xs font-bold text-slate-800 mb-4 uppercase tracking-widest">Desglose Técnico ANOVA</h6>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <p className="text-xs text-slate-600 leading-relaxed">
                            El ANOVA (Analysis of Variance) compara la <strong>Varianza Entre Grupos</strong> (Territorios) vs la <strong>Varianza Intra-Grupo</strong> (Error de Medición).
                            <br /><br />
                            Nuestro <strong>F-Statistic</strong> es elevado, lo que confirma que existen municipios específicos (M3, M7) que están sesgando el reporte nacional de manera sistemática.
                          </p>
                          <div className="p-4 bg-slate-50 rounded-xl font-mono text-[10px] text-slate-500">
                            SS_Total = SS_Regression + SS_Error <br />
                            0.68 = 1 - (SS_Error / SS_Total)
                          </div>
                        </div>
                        <div className="space-y-4">
                          <h6 className="text-[10px] font-black text-slate-400 uppercase">Traducción a DPMO (Defectos por Millón)</h6>
                          <div className="overflow-hidden rounded-xl border border-slate-100">
                            <table className="w-full text-[10px]">
                              <thead className="bg-slate-50">
                                <tr>
                                  <th className="p-2 text-left">Varianza (%)</th>
                                  <th className="p-2 text-left">Sigma (&sigma;)</th>
                                  <th className="p-2 text-left">DPMO</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                <tr className="bg-rose-50 font-bold text-rose-700">
                                  <td className="p-2">18.5% (Actual)</td>
                                  <td className="p-2">2.4 &sigma;</td>
                                  <td className="p-2">185,000</td>
                                </tr>
                                <tr>
                                  <td className="p-2">5.0%</td>
                                  <td className="p-2">3.1 &sigma;</td>
                                  <td className="p-2">50,000</td>
                                </tr>
                                <tr className="bg-emerald-50 font-bold text-emerald-700">
                                  <td className="p-2">0.0003% (Meta)</td>
                                  <td className="p-2">6.0 &sigma;</td>
                                  <td className="p-2">3.4</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[9px] text-slate-400 italic">
                            *Un DPMO de 185,000 significa que de cada millón de pesos reportados, 185,000 están en riesgo de ser glosados por falta de sustento técnico.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PHASE: IMPROVE (I) - The Soul of the Methodology */}
            {activeDmaic === 'I' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 bg-indigo-900 text-white p-8 rounded-3xl overflow-hidden relative">
                  <div className="relative z-10 space-y-4 max-w-2xl">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-400/30">
                      <Lightbulb size={12} /> El Alma del Proceso
                    </div>
                    <h3 className="text-3xl font-black tracking-tight">Diseño de la Mejora Eficiente</h3>
                    <p className="text-indigo-200 text-sm leading-relaxed">
                      Aquí es donde transformamos los datos en acción. Hemos diseñado tres "Mejoras de Alto Impacto" para reducir el DPMO de 185,000 a menos de 50,000 en el primer trimestre.
                    </p>
                  </div>
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/20 to-transparent flex items-center justify-center">
                    <ShieldCheck size={120} className="text-white/10 -rotate-12" />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={24} />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mejora 1: EDAN Digital</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Implementación de formularios offline con georreferenciación obligatoria. Elimina el 45% de los errores por falta de soporte técnico.
                    </p>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-emerald-600">Impacto: Alto</span>
                      <span className="text-[10px] font-bold text-slate-400">Costo: Bajo</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Activity size={24} />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mejora 2: Validación IA</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Algoritmo que cruza el reporte con las <strong>Funciones de Daño</strong> en tiempo real. Si el reporte excede el límite paramétrico, se bloquea para revisión.
                    </p>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-indigo-600">Impacto: Muy Alto</span>
                      <span className="text-[10px] font-bold text-slate-400">Costo: Medio</span>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-md transition-all space-y-4 group">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Target size={24} />
                    </div>
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mejora 3: Certificación</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Programa de certificación obligatoria para enlaces municipales. Solo personal certificado puede cargar datos al sistema nacional.
                    </p>
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-[10px] font-bold text-amber-600">Impacto: Medio</span>
                      <span className="text-[10px] font-bold text-slate-400">Costo: Bajo</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-6">
                  <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-200">
                    <TrendingUp size={32} />
                  </div>
                  <div>
                    <h5 className="font-black text-emerald-900 uppercase text-xs tracking-widest mb-1">Resultado Esperado</h5>
                    <p className="text-sm text-emerald-700 font-medium">
                      Reducción de la varianza del <strong>18.5% al 4.2%</strong> en el primer ciclo de implementación, logrando un nivel de calidad de <strong>3.2 Sigma</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* PHASE: CONTROL (C) - Monitoring */}
            {activeDmaic === 'C' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h5 className="text-sm font-bold text-slate-700">Dashboard de Control en Tiempo Real</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Alertas Activas</p>
                      <p className="text-2xl font-black text-rose-600">03</p>
                    </div>
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Cumplimiento Sigma</p>
                      <p className="text-2xl font-black text-emerald-600">92%</p>
                    </div>
                  </div>
                  <div className="h-[200px] bg-slate-50 rounded-2xl p-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={controlChartData.slice(-5)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="batch" hide />
                        <YAxis hide />
                        <Area type="monotone" dataKey="gap" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900 text-white p-8 rounded-3xl space-y-6">
                  <h5 className="text-sm font-black uppercase tracking-widest text-indigo-400">Protocolo de Sostenibilidad</h5>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                      <p className="text-xs text-slate-300">Auditoría aleatoria mensual del 5% de los reportes "estables".</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                      <p className="text-xs text-slate-300">Recalibración semestral de las Funciones de Daño con datos reales.</p>
                    </li>
                    <li className="flex gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shrink-0"><CheckCircle2 size={12} /></div>
                      <p className="text-xs text-slate-300">Incentivos fiscales para municipios que mantengan varianza {'<'} 5%.</p>
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Right: Rigorous Methodology Table */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <h5 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest">Protocolo de Mitigación Fiscal</h5>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">01</div>
                  <div>
                    <h6 className="font-bold text-slate-800 text-xs">Validación Paramétrica</h6>
                    <p className="text-[11px] text-slate-500 mt-1">Ningún reporte municipal puede superar el 1.5x del daño estimado por las funciones de fragilidad técnica.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">02</div>
                  <div>
                    <h6 className="font-bold text-slate-800 text-xs">Cruce Satelital Automático</h6>
                    <p className="text-[11px] text-slate-500 mt-1">Integración con API de Copernicus/IDEAM para verificar nexo causal meteorológico en el punto exacto del reporte.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-black text-xs shrink-0">03</div>
                  <div>
                    <h6 className="font-bold text-slate-800 text-xs">Auditoría de Varianza Real-Time</h6>
                    <p className="text-[11px] text-slate-500 mt-1">Bloqueo automático de recursos para municipios con desviación estándar {'>'} 2&sigma; respecto al promedio regional.</p>
                  </div>
                </div>
                <div className="pt-6 border-t border-slate-200">
                  <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Meta Six Sigma</p>
                      <p className="text-xl font-black text-emerald-600">3.4 DPMO</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Varianza Actual</p>
                      <p className="text-xl font-black text-rose-600">18.5%</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
