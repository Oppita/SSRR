import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  Users, 
  Home, 
  Construction, 
  ShoppingBag, 
  AlertTriangle, 
  Calculator, 
  Save, 
  ChevronRight, 
  ChevronLeft,
  Activity,
  ShieldCheck,
  ClipboardList,
  Info,
  DollarSign,
  Upload,
  Loader2,
  X,
  Plus,
  Trash2,
  Search,
  Filter,
  FileUp,
  ChevronDown,
  ChevronUp,
  MapPin,
  Printer,
  Heart,
  Utensils,
  Navigation,
  History
} from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { MunicipalityInventory, ProjectDocument, DemographicDamage, IndicadoresTerritorio, DetailedDamageItem } from '../types';
import { analyzeEDANDocument } from '../services/edanService';
import { showAlert } from '../utils/alert';
import { AIProviderSelector } from './AIProviderSelector';

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(val);
};
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LabelList,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';

const DemographicRow = ({ 
  label, 
  item, 
  section, 
  field, 
  unitLabel = 'Cantidad', 
  handleUpdate 
}: { 
  label: string; 
  item: any; 
  section: string; 
  field: string; 
  unitLabel?: string; 
  handleUpdate: (paths: string[], value: any) => void; 
}) => {
  const [expanded, setExpanded] = useState(false);
  
  const totalItem = item?.total || { cantidad: 0, valorUnitario: 0, valorTotal: 0 };
  
  const renderSubField = (subLabel: string, subFieldKey: string) => {
    const subItem = item?.[subFieldKey] || { cantidad: 0, valorUnitario: 0, valorTotal: 0 };
    return (
      <div className="flex gap-2 items-center">
        <label className="text-[10px] w-32 font-bold text-slate-500 uppercase">{subLabel}</label>
        <input 
          type="number"
          placeholder="Cant."
          value={subItem.cantidad || ''}
          onChange={(e) => handleUpdate([section, field, subFieldKey, 'cantidad'], Number(e.target.value))}
          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="relative">
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[9px]">$</span>
          <input 
            type="number"
            placeholder="Costo U."
            value={subItem.valorUnitario || ''}
            onChange={(e) => handleUpdate([section, field, subFieldKey, 'valorUnitario'], Number(e.target.value))}
            className="w-20 pl-5 pr-2 py-1 bg-white border border-slate-200 rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <input 
          type="number"
          min="0"
          max="100"
          placeholder="% Cob."
          title="Porcentaje de Cobertura Asegurada (%)"
          value={subItem.porcentajeCobertura || ''}
          onChange={(e) => {
            let val = Number(e.target.value);
            if (val > 100) val = 100;
            if (val < 0) val = 0;
            handleUpdate([section, field, subFieldKey, 'porcentajeCobertura'], val);
          }}
          className="w-16 px-2 py-1 bg-amber-50/50 border border-amber-200 text-amber-700 rounded text-xs outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group overflow-hidden shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4">
        <div className="md:col-span-3 flex items-center gap-2">
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-indigo-600 transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <p className="text-sm font-black text-slate-800">{label}</p>
        </div>
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{unitLabel} Total</label>
          <input 
            type="number"
            value={totalItem.cantidad || ''}
            onChange={(e) => handleUpdate([section, field, 'total', 'cantidad'], Number(e.target.value))}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Costo U. Prom.</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">$</span>
            <input 
              type="number"
              value={totalItem.valorUnitario || ''}
              onChange={(e) => handleUpdate([section, field, 'total', 'valorUnitario'], Number(e.target.value))}
              className="w-full pl-5 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="text-[9px] font-black text-amber-500 uppercase mb-1 block flex items-center gap-1">Cobertura (%)</label>
          <input 
            type="number"
            min="0"
            max="100"
            value={totalItem.porcentajeCobertura ? Math.round(totalItem.porcentajeCobertura) : ''}
            onChange={(e) => {
              let val = Number(e.target.value);
              if (val > 100) val = 100;
              if (val < 0) val = 0;
              handleUpdate([section, field, 'total', 'porcentajeCobertura'], val);
            }}
            className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="%"
          />
        </div>
        <div className="md:col-span-3 text-right flex flex-col justify-end">
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Total / Traslado Poliza</label>
          <p className="text-sm font-black text-indigo-600">$ {totalItem.valorTotal?.toLocaleString() || 0}</p>
          {totalItem.valorAsegurado > 0 && (
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">
              Poliza: $ {totalItem.valorAsegurado.toLocaleString()}
            </p>
          )}
        </div>
      </div>
      
      {expanded && (
        <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-3">Ciclo Vital y Género</h5>
              <div className="space-y-2">
                {renderSubField('Niños', 'ninos')}
                {renderSubField('Niñas', 'ninas')}
                {renderSubField('Adolescentes (H)', 'adolescentesHombres')}
                {renderSubField('Adolescentes (M)', 'adolescentesMujeres')}
                {renderSubField('Adultos (H)', 'adultosHombres')}
                {renderSubField('Adultos (M)', 'adultosMujeres')}
                {renderSubField('Adultos Mayores (H)', 'adultosMayoresHombres')}
                {renderSubField('Adultos Mayores (M)', 'adultosMayoresMujeres')}
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-3">Condición Especial</h5>
              <div className="space-y-2">
                {renderSubField('Mujeres Gest/Lact', 'mujeresGestantesLactantes')}
                {renderSubField('Personas Discap.', 'personasDiscapacidad')}
                {renderSubField('Migrantes', 'migrantes')}
                {renderSubField('Desplazados', 'desplazados')}
              </div>
            </div>
            <div>
              <h5 className="text-[10px] font-black text-slate-400 uppercase border-b border-slate-200 pb-1 mb-3">Etnia y Otros</h5>
              <div className="space-y-2">
                {renderSubField('Indígenas', 'etniaIndigena')}
                {renderSubField('Afrodescendientes', 'etniaAfro')}
                {renderSubField('Comunidad ROM', 'etniaRom')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MOCK_MAQUINARIA = [
  { id: 'maq1', tipo: 'Retroexcavadora de Llantas', costoEstimado: 120000 },
  { id: 'maq2', tipo: 'Retroexcavadora de Orugas', costoEstimado: 150000 },
  { id: 'maq3', tipo: 'Motoniveladora', costoEstimado: 180000 },
  { id: 'maq4', tipo: 'Vibrocompactador', costoEstimado: 110000 },
  { id: 'maq5', tipo: 'Volqueta Sencilla', costoEstimado: 80000 },
  { id: 'maq6', tipo: 'Volqueta Dobletroque', costoEstimado: 130000 },
  { id: 'maq7', tipo: 'Bulldozer D6', costoEstimado: 200000 },
  { id: 'maq8', tipo: 'Bulldozer D8', costoEstimado: 300000 },
  { id: 'maq9', tipo: 'Cargador Frontal', costoEstimado: 140000 },
  { id: 'maq10', tipo: 'Pajarita (RetroCargador)', costoEstimado: 95000 },
  { id: 'maq11', tipo: 'Minicargador (Bobcat)', costoEstimado: 60000 },
  { id: 'maq12', tipo: 'Tractor de Orugas', costoEstimado: 220000 },
  { id: 'maq13', tipo: 'Excavadora Hidráulica', costoEstimado: 175000 },
  { id: 'maq14', tipo: 'Camión Cisterna', costoEstimado: 90000 },
  { id: 'maq15', tipo: 'Grúa Planchón', costoEstimado: 150000 },
];

interface EDANConsolidatorProps {
  initialData?: MunicipalityInventory;
  onSave: (data: MunicipalityInventory) => void;
  municipioName?: string;
}

export const EDANConsolidator: React.FC<EDANConsolidatorProps> = ({ initialData, onSave, municipioName }) => {
  const { state, addDocument } = useProject();
  const [activeStep, setActiveStep] = useState(0);
  const [showExtractionModal, setShowExtractionModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reunionSearch, setReunionSearch] = useState('');
  const [comisionSearch, setComisionSearch] = useState('');
  const [maquinariaSearch, setMaquinariaSearch] = useState('');

  const validateDemographicDamage = (item?: any): any => {
    if (!item) return { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } };
    if ('cantidad' in item) {
      return { total: item };
    }
    return item;
  };

  const [formData, setFormData] = useState<MunicipalityInventory>(() => {
    const baseVivienda = {
      destruidas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
      grave: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
      moderado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
      leve: { cantidad: 0, valorUnitario: 0, valorTotal: 0 },
      materialPredominante: '',
      techosAfectadosClima: 0,
      hogaresPropietarios: 0,
      hogaresArrendatarios: 0,
      hogaresJefaturaFemenina: 0
    };

    if (initialData) {
      return {
        ...initialData,
        poblacion: {
          heridos: validateDemographicDamage(initialData.poblacion?.heridos),
          muertos: validateDemographicDamage(initialData.poblacion?.muertos),
          desaparecidos: validateDemographicDamage(initialData.poblacion?.desaparecidos),
          familiasAfectadas: validateDemographicDamage(initialData.poblacion?.familiasAfectadas),
          personasAfectadas: validateDemographicDamage(initialData.poblacion?.personasAfectadas),
          enfermos: validateDemographicDamage(initialData.poblacion?.enfermos),
          evacuados: validateDemographicDamage(initialData.poblacion?.evacuados),
          albergados: validateDemographicDamage(initialData.poblacion?.albergados),
          personasSinSustento: validateDemographicDamage((initialData.poblacion as any)?.personasSinSustento),
        },
        danosVivienda: { ...baseVivienda, ...initialData.danosVivienda },
        infraestructuraPorSector: {
          salud: {}, educacionMedia: {}, educacionSuperior: {}, transporteVias: {},
          transportePuentes: {}, transporteMuellesPuertos: {}, transporteAeropuertos: {},
          turismo: {}, deportes: {}, cultura: {}, agricultura: {}, pecuario: {}, defensa: {}, trabajo: {},
          energia: {}, aguaGas: {}, comunicaciones: {}, icbf: {}, seguridadAlimentaria: {},
          ...initialData.infraestructuraPorSector
        },
        indicadores: initialData.indicadores || { poblacionTotal: 0, totalViviendas: 0, nbi: 0, coeficienteGini: 0 }
      } as MunicipalityInventory;
    }

    return {
      id: Math.random().toString(36).substr(2, 5),
      name: municipioName || '',
      edanStatus: 'Pendiente',
      runapeStatus: 'Sin Datos',
      lastUpdate: new Date().toISOString().split('T')[0],
      indicadores: { poblacionTotal: 0, totalViviendas: 0, nbi: 0, coeficienteGini: 0 },
      generalData: { 
        diligenciador: '', institucion: '', cargo: '', telefono: '', celular: '', 
        tipoEvento: [], coordinadorCMGRD: '', alcaldeMunicipal: '', 
        fechaEvaluacion: '', horaEvaluacion: '', fecha: '', hora: '', 
        evento: '', descripcionEvento: '', magnitud: '', 
        fechaEvento: '', horaEvento: '', sitioEvento: '', 
        sectoresAfectados: '', eventosSecundarios: '' 
      },
      poblacion: { 
        heridos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        muertos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        desaparecidos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        familiasAfectadas: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        personasAfectadas: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        enfermos: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        evacuados: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }, 
        albergados: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
        personasSinSustento: { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }
      },
      danosVivienda: baseVivienda,
      infraestructura: {},
      infraestructuraPorSector: {
        salud: {}, educacionMedia: {}, educacionSuperior: {}, transporteVias: {},
        transportePuentes: {}, transporteMuellesPuertos: {}, transporteAeropuertos: {},
        turismo: {}, deportes: {}, cultura: {}, agricultura: {}, pecuario: {}, defensa: {}, trabajo: {},
        energia: {}, aguaGas: {}, comunicaciones: {}, icbf: {}, seguridadAlimentaria: {}
      },
      serviciosPublicos: { acueducto: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, alcantarillado: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, energia: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, gas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
      necesidades: { markets: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, kitsAseo: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, kitsCocina: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, frazadas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, colchonetas: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, aguaLitros: { cantidad: 0, valorUnitario: 0, valorTotal: 0 }, maquinariaHoras: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } },
      costosOperativos: { reunionesPMU: [], comisionesSugeridas: [], maquinariaAmarilla: [] },
      costoTotalEstimado: 0
    } as MunicipalityInventory;
  });

  const filteredReuniones = useMemo(() => {
    const search = (reunionSearch || '').toLowerCase();
    const alreadyLinkedIds = new Set((formData.costosOperativos?.reunionesPMU || []).map(p => p.id));
    let results = (state.activities || []).filter(a => (a.type === 'PMU' || a.type === 'Reunión') && !alreadyLinkedIds.has(a.id));
    if (search) {
      results = results.filter(a => 
        (a.title || '').toLowerCase().includes(search) || 
        (a.description || '').toLowerCase().includes(search)
      );
    }
    return results.slice(0, 10);
  }, [state.activities, reunionSearch, formData.costosOperativos?.reunionesPMU]);

  const filteredComisiones = useMemo(() => {
    const search = (comisionSearch || '').toLowerCase();
    const alreadyLinkedIds = new Set((formData.costosOperativos?.comisionesSugeridas || []).map(c => c.id));
    let results = (state.comisiones || []).filter(c => !alreadyLinkedIds.has(c.id));
    if (search) {
      results = results.filter(c => 
        (c.objeto || '').toLowerCase().includes(search) || 
        (c.municipios || '').toLowerCase().includes(search) ||
        (c.departamento || '').toLowerCase().includes(search)
      );
    }
    return results.slice(0, 10);
  }, [state.comisiones, comisionSearch, formData.costosOperativos?.comisionesSugeridas]);

  const filteredMaquinaria = useMemo(() => {
    const search = (maquinariaSearch || '').toLowerCase();
    const alreadyLinkedIds = new Set((formData.costosOperativos?.maquinariaAmarilla || []).map(m => m.id));
    let results = MOCK_MAQUINARIA.filter(m => !alreadyLinkedIds.has(m.id));
    if (search) {
      results = results.filter(m => m.tipo.toLowerCase().includes(search));
    }
    return results.slice(0, 10);
  }, [maquinariaSearch, formData.costosOperativos?.maquinariaAmarilla]);

  const addedReuniones = useMemo(() => {
    const search = (reunionSearch || '').toLowerCase();
    return (formData.costosOperativos?.reunionesPMU || []).filter(p => 
      !search || p.tema.toLowerCase().includes(search) || p.fecha.toLowerCase().includes(search)
    );
  }, [formData.costosOperativos?.reunionesPMU, reunionSearch]);

  const addedComisiones = useMemo(() => {
    const search = (comisionSearch || '').toLowerCase();
    return (formData.costosOperativos?.comisionesSugeridas || []).filter(c => 
      !search || c.objeto.toLowerCase().includes(search) || c.municipios.toLowerCase().includes(search)
    );
  }, [formData.costosOperativos?.comisionesSugeridas, comisionSearch]);

  const addedMaquinaria = useMemo(() => {
    const search = (maquinariaSearch || '').toLowerCase();
    return (formData.costosOperativos?.maquinariaAmarilla || []).filter(m => 
      !search || m.tipo.toLowerCase().includes(search)
    );
  }, [formData.costosOperativos?.maquinariaAmarilla, maquinariaSearch]);

  const steps = [
    { id: 'general', title: 'Infraestructura General', icon: <FileText size={20} />, description: 'Datos y Ubicación' },
    { id: 'poblacion', title: 'Demografía', icon: <Users size={20} />, description: 'Segregación poblacional' },
    { id: 'habitat', title: 'Vivienda', icon: <Home size={20} />, description: 'Daños en edificaciones' },
    { id: 'infraestructura', title: 'Sectores', icon: <Construction size={20} />, description: 'Infraestructura Social y de Redes' },
    { id: 'necesidades', title: 'Necesidades', icon: <ShoppingBag size={20} />, description: 'Requerimientos (Capa 3)' },
    { id: 'operativos', title: 'Operatividad', icon: <Activity size={20} />, description: 'Costos operativos' },
    { id: 'resumen', title: 'Reporte EDANPRI', icon: <Calculator size={20} />, description: 'Informe Técnico Profesional' }
  ];

  const handleUpdateDeepField = (paths: (string | number)[], value: any) => {
    setFormData((prev: any) => {
      const clone = JSON.parse(JSON.stringify(prev));
      let current = clone;
      for (let i = 0; i < paths.length - 1; i++) {
        if (current[paths[i]] === undefined || current[paths[i]] === null) {
          current[paths[i]] = {};
        }
        current = current[paths[i]];
      }
      const lastKey = paths[paths.length - 1];
      current[lastKey] = value;
      
      // Auto-calculate for DamageItem pattern
      const isDamageItemField = ['cantidad', 'valorUnitario', 'porcentajeCobertura', 'valorTotal', 'valorAsegurado'].includes(lastKey as string);
      if (isDamageItemField) {
        // Ensure the current object has the expected structure
        if (current.cantidad === undefined) current.cantidad = 0;
        if (current.valorUnitario === undefined) current.valorUnitario = 0;
        if (current.valorTotal === undefined) current.valorTotal = 0;
        if (current.porcentajeCobertura === undefined) current.porcentajeCobertura = 0;
        if (current.valorAsegurado === undefined) current.valorAsegurado = 0;

        if (lastKey === 'cantidad' || lastKey === 'valorUnitario') {
          const val = (current.cantidad || 0) * (current.valorUnitario || 0);
          current.valorTotal = isNaN(val) ? 0 : val;
          const insured = (current.valorTotal || 0) * ((current.porcentajeCobertura || 0) / 100);
          current.valorAsegurado = isNaN(insured) ? 0 : insured;
          current.asegurado = current.valorAsegurado > 0;
        } else if (lastKey === 'porcentajeCobertura') {
          const pct = Math.min(100, Math.max(0, value));
          current.porcentajeCobertura = isNaN(pct) ? 0 : pct;
          const insured = (current.valorTotal || 0) * (current.porcentajeCobertura / 100);
          current.valorAsegurado = isNaN(insured) ? 0 : insured;
          current.asegurado = current.valorAsegurado > 0;
        } else if (lastKey === 'valorTotal') {
          const insured = (current.valorTotal || 0) * ((current.porcentajeCobertura || 0) / 100);
          current.valorAsegurado = isNaN(insured) ? 0 : insured;
          current.asegurado = current.valorAsegurado > 0;
          if ((current.cantidad || 0) > 0) {
            const unit = current.valorTotal / current.cantidad;
            current.valorUnitario = isNaN(unit) ? 0 : unit;
          }
        }
      }
      
      // Dynamic Aggregation
      if (paths.length >= 2) {
        const rootSection = paths[0]; // 'poblacion', 'danosVivienda', etc.
        
        // Handle DemographicDamage (Poblacion)
        if (rootSection === 'poblacion') {
           const groupName = paths[1];
           const group = clone.poblacion[groupName];
           const editingTotal = paths[2] === 'total';

           // We only aggregate if NOT editing the total directly, allowing for manual total overrides
           if (group && typeof group === 'object' && !editingTotal) {
             let sumCantidad = 0, sumValorTotal = 0, sumValorAsegurado = 0;
             for (const subKey in group) {
               if (subKey !== 'total' && typeof group[subKey] === 'object') {
                 sumCantidad += group[subKey].cantidad || 0;
                 sumValorTotal += group[subKey].valorTotal || 0;
                 sumValorAsegurado += group[subKey].valorAsegurado || 0;
               }
             }
             if (!group.total) group.total = { cantidad: 0, valorUnitario: 0, valorTotal: 0 };
             group.total.cantidad = sumCantidad;
             group.total.valorTotal = sumValorTotal;
             group.total.valorUnitario = sumCantidad > 0 ? sumValorTotal / sumCantidad : 0;
             group.total.valorAsegurado = sumValorAsegurado;
             group.total.porcentajeCobertura = sumValorTotal > 0 ? (sumValorAsegurado / sumValorTotal) * 100 : 0;
             group.total.asegurado = sumValorAsegurado > 0;
           }
        }
      }

      return clone as MunicipalityInventory;
    });
  };

  const handleUpdateField = (section: keyof MunicipalityInventory, field: string, value: any, subField?: string) => {
    const fieldParts = field.split('.');
    const paths = [section as string, ...fieldParts];
    if (subField) paths.push(subField);
    handleUpdateDeepField(paths, value);
  };

  const extractCosts = (root: any, path: string = ''): number => {
    if (!root || typeof root !== 'object') return 0;
    let t = 0;
    
    for (const key in root) {
      if (key === 'materialPredominante' || key === 'techosAfectadosClima' || 
          key === 'hogaresPropietarios' || key === 'hogaresArrendatarios' || 
          key === 'hogaresJefaturaFemenina' || key === 'id') continue;

      const item = root[key];
      if (item && typeof item === 'object') {
        const currentPath = path ? `${path}.${key}` : key;
        
        // DetailedDamageItem support (valor)
        if (typeof item.valor === 'number' && !isNaN(item.valor)) {
          t += item.valor;
        }
        // Priority to 'total' object for aggregated sections
        else if (item.total && typeof item.total.valorTotal === 'number' && !isNaN(item.total.valorTotal)) {
          t += item.total.valorTotal;
        } 
        else if (typeof item.valorTotal === 'number' && !isNaN(item.valorTotal)) {
          t += item.valorTotal;
        }
        else {
          const subTotal = extractCosts(item, currentPath);
          if (!isNaN(subTotal)) t += subTotal;
        }
      }
    }
    return t;
  };

  const extractInsuredCosts = (root: any, path: string = ''): number => {
    if (!root || typeof root !== 'object') return 0;
    let t = 0;
    
    for (const key in root) {
      if (key === 'materialPredominante' || key === 'techosAfectadosClima' || 
          key === 'hogaresPropietarios' || key === 'hogaresArrendatarios' || 
          key === 'hogaresJefaturaFemenina' || key === 'id') continue;

      const item = root[key];
      if (item && typeof item === 'object') {
        const currentPath = path ? `${path}.${key}` : key;

        // DetailedDamageItem support (valorAsegurado)
        if (typeof item.valorAsegurado === 'number' && !isNaN(item.valorAsegurado)) {
          t += item.valorAsegurado;
        }
        else if (item.total && typeof item.total.valorAsegurado === 'number' && !isNaN(item.total.valorAsegurado)) {
          t += item.total.valorAsegurado;
        } 
        else if (typeof item.valorAsegurado === 'number' && !isNaN(item.valorAsegurado)) {
          t += item.valorAsegurado;
        }
        else {
          const subTotal = extractInsuredCosts(item, currentPath);
          if (!isNaN(subTotal)) t += subTotal;
        }
      }
    }
    return t;
  };

  const totalCosto = useMemo(() => {
    let total = 0;
    
    total += extractCosts(formData.poblacion);
    total += extractCosts(formData.danosVivienda);
    total += extractCosts(formData.infraestructuraPorSector);
    total += extractCosts(formData.serviciosPublicos);
    total += extractCosts(formData.necesidades);

    if (formData.costosOperativos) {
      if (formData.costosOperativos.reunionesPMU) {
        total += formData.costosOperativos.reunionesPMU.reduce((sum, r) => sum + (r.costoEstimado || 0), 0);
      }
      if (formData.costosOperativos.comisionesSugeridas) {
        total += formData.costosOperativos.comisionesSugeridas.reduce((sum, c) => sum + (c.costoEstimado || 0), 0);
      }
      if (formData.costosOperativos.maquinariaAmarilla) {
        total += formData.costosOperativos.maquinariaAmarilla.reduce((sum, m) => sum + (m.costoEstimado || 0), 0);
      }
    }

    return total;
  }, [formData]);

  const totalPolizas = useMemo(() => {
    let total = 0;
    
    total += extractInsuredCosts(formData.poblacion);
    total += extractInsuredCosts(formData.danosVivienda);
    total += extractInsuredCosts(formData.infraestructuraPorSector);
    total += extractInsuredCosts(formData.serviciosPublicos);
    total += extractInsuredCosts(formData.necesidades);

    return total;
  }, [formData]);

  const renderDetailedList = (section: keyof MunicipalityInventory, listField: string, title: string) => {
    const listFields = listField.split('.');
    
    // Helper to get nested value
    const getNestedValue = (obj: any, path: string[]) => {
      return path.reduce((acc, part) => acc && acc[part], obj);
    };

    const list: DetailedDamageItem[] = getNestedValue(formData[section], listFields) || [];
    
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    const fullPathArray = [section, ...listFields];

    const handleAdd = () => {
      const newItem: DetailedDamageItem = {
        id: crypto.randomUUID(),
        nombre: '',
        ubicacion: 'Urbano',
        valor: 0,
        cantidad: 1,
        unidad: 'Und',
        asegurado: false,
        porcentajeCobertura: 0,
        valorAsegurado: 0,
        tipoAfectacion: 'Moderada',
        materialParedes: '',
        materialTecho: '',
        materialPiso: '',
        areaM2: 0,
        numeroPersonas: 0,
        numeroHogares: 1,
        serviciosPublicosAfectados: [],
        uso: '',
        capacidad: '',
        estadoEstructural: 'Inestable'
      };
      handleUpdateDeepField(fullPathArray, [...list, newItem]);
      setExpandedItem(newItem.id);
    };

    const handleUpdate = (id: string, updates: Partial<DetailedDamageItem>) => {
      const newList = list.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates };
          // Auto calculate insured value
          if ('valor' in updates || 'porcentajeCobertura' in updates) {
            updated.valorAsegurado = (updated.valor || 0) * ((updated.porcentajeCobertura || 0) / 100);
          }
          return updated;
        }
        return item;
      });
      handleUpdateDeepField(fullPathArray, newList);
    };

    const handleDelete = (id: string) => {
      handleUpdateDeepField(fullPathArray, list.filter(i => i.id !== id));
    };

    return (
      <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-200/60 mt-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h5 className="text-sm font-black text-slate-800 uppercase tracking-tight">{title}</h5>
            <p className="text-[10px] text-slate-500 font-bold">Registro individualizado por cada activo afectado</p>
          </div>
          <button 
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={14} />
            Agregar Registro
          </button>
        </div>
        
      <div className="space-y-4">
        {list.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
            <p className="text-xs text-slate-400 font-bold">No hay registros detallados aún</p>
          </div>
        ) : (
          list.map((item) => (
            <div key={item.id} className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-indigo-200 transition-all overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end p-5">
                <div className="lg:col-span-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
                      className="text-indigo-600 hover:bg-indigo-50 p-1 rounded-lg transition"
                    >
                      {expandedItem === item.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <label className="text-[9px] font-black text-slate-400 uppercase">Nombre / Descripción</label>
                  </div>
                  <input 
                    type="text"
                    value={item.nombre}
                    onChange={e => handleUpdate(item.id, { nombre: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                    placeholder="Ej: Casa Lote 5 / Hospital Regional"
                  />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Ubicación</label>
                  <select 
                    value={item.ubicacion}
                    onChange={e => handleUpdate(item.id, { ubicacion: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  >
                    <option value="Urbano">Urbano</option>
                    <option value="Rural">Rural</option>
                  </select>
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Cant. / U.Medida</label>
                  <div className="flex gap-1">
                    <input 
                      type="number"
                      value={item.cantidad || ''}
                      onChange={e => handleUpdate(item.id, { cantidad: Number(e.target.value) })}
                      className="w-16 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                      placeholder="1"
                    />
                    <input 
                      type="text"
                      value={item.unidad || ''}
                      onChange={e => handleUpdate(item.id, { unidad: e.target.value })}
                      className="flex-1 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold outline-none"
                      placeholder="Und/Ha/m"
                    />
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Estado del Daño</label>
                  <select 
                    value={item.tipoAfectacion}
                    onChange={e => handleUpdate(item.id, { tipoAfectacion: e.target.value as any })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  >
                    <option value="Destruida">Destrucción Total</option>
                    <option value="Grave">Daño Grave / Inhabitable</option>
                    <option value="Moderada">Daño Moderado</option>
                    <option value="Leve">Daño Leve / Habitable</option>
                  </select>
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase">Costo Estimado ($)</label>
                  <input 
                    type="number"
                    value={item.valor}
                    onChange={e => handleUpdate(item.id, { valor: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[9px] font-black text-amber-500 uppercase">Cobertura Seguros (%)</label>
                  <input 
                    type="number"
                    max="100"
                    value={item.porcentajeCobertura}
                    onChange={e => handleUpdate(item.id, { porcentajeCobertura: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-bold outline-none"
                  />
                </div>
                <div className="lg:col-span-1 flex justify-end pb-1">
                  <button onClick={() => handleDelete(item.id)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedItem === item.id && (
                <div className="bg-slate-50 p-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-2">
                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Materiales Predominantes</h6>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Material Paredes</label>
                        <input 
                          type="text"
                          value={item.materialParedes}
                          onChange={e => handleUpdate(item.id, { materialParedes: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                          placeholder="Ej: Ladrillo, Adobe..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Material Techo</label>
                        <input 
                          type="text"
                          value={item.materialTecho}
                          onChange={e => handleUpdate(item.id, { materialTecho: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                          placeholder="Ej: Teja, Zinc, Concreto..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Material Piso</label>
                        <input 
                          type="text"
                          value={item.materialPiso}
                          onChange={e => handleUpdate(item.id, { materialPiso: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                          placeholder="Ej: Cemento, Baldosa..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Dimensiones y Uso</h6>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Área Aprox (m²)</label>
                        <input 
                          type="number"
                          value={item.areaM2}
                          onChange={e => handleUpdate(item.id, { areaM2: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Uso del Bien</label>
                        <select 
                          value={item.uso}
                          onChange={e => handleUpdate(item.id, { uso: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        >
                          <option value="">Seleccione...</option>
                          <option value="Residencial">Residencial</option>
                          <option value="Comercial">Comercial</option>
                          <option value="Institucional">Institucional</option>
                          <option value="Industrial">Industrial</option>
                          <option value="Agigola">Agrícola / Pecuario</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Estado Estructural</label>
                        <select 
                          value={item.estadoEstructural}
                          onChange={e => handleUpdate(item.id, { estadoEstructural: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        >
                          <option value="Estable">Estable / Seguro</option>
                          <option value="Inestable">Inestable / Riesgo de colapso</option>
                          <option value="Colapsado">Colapsado</option>
                          <option value="Sin Evaluar">Pendiente Evaluación</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Ocupación / Servicios</h6>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">N° Hogares en el Bien</label>
                        <input 
                          type="number"
                          value={item.numeroHogares}
                          onChange={e => handleUpdate(item.id, { numeroHogares: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Personas Afectadas (Capa 1)</label>
                        <input 
                          type="number"
                          value={item.numeroPersonas}
                          onChange={e => handleUpdate(item.id, { numeroPersonas: Number(e.target.value) })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase italic">Capacidad / Info Extra</label>
                        <input 
                          type="text"
                          value={item.capacidad}
                          onChange={e => handleUpdate(item.id, { capacidad: e.target.value })}
                          className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none"
                          placeholder="Ej: 4 dormitorios, 50 Camas..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Servicios Públicos Afectados</h6>
                    <div className="flex flex-wrap gap-2">
                      {['Agua', 'Energía', 'Alcantarillado', 'Gas', 'Internet'].map(servicio => (
                        <button
                          key={servicio}
                          type="button"
                          onClick={() => {
                            const current = item.serviciosPublicosAfectados || [];
                            const next = current.includes(servicio) 
                              ? current.filter(s => s !== servicio)
                              : [...current, servicio];
                            handleUpdate(item.id, { serviciosPublicosAfectados: next });
                          }}
                          className={`px-2 py-1 rounded-full text-[9px] font-bold transition-colors ${
                            item.serviciosPublicosAfectados?.includes(servicio)
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-white text-slate-400 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {servicio}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </div>
    );
  };

  const handleAnalyzeText = async () => {
    if (!pastedText.trim() && !selectedFile) return;
    setIsAnalyzing(true);
    try {
      const extractedData = await analyzeEDANDocument(selectedFile || pastedText);
      
      // Save document to repository if it's a file
      if (selectedFile) {
        const newDoc: ProjectDocument = {
          id: Math.random().toString(36).substr(2, 9),
          titulo: `EDAN - ${municipioName || 'Municipio'}`,
          tipo: 'EDAN' as any,
          fechaCreacion: new Date().toISOString(),
          ultimaActualizacion: new Date().toISOString(),
          versiones: [{
            id: Math.random().toString(36).substr(2, 9),
            version: 1,
            fecha: new Date().toISOString(),
            url: URL.createObjectURL(selectedFile),
            nombreArchivo: selectedFile.name,
            subidoPor: 'Sistema EDAN',
            accion: 'Subida',
            estado: 'Aprobado',
            comentario: 'Documento original'
          }],
          responsable: 'Sistema EDAN',
          municipio: municipioName,
          eventId: initialData?.eventId,
          estado: 'Aprobado',
          tags: ['EDAN', 'Evaluación', 'Daños', 'Necesidades'],
          analysis: {
            summary: extractedData.descripcion || 'Documento EDAN extraído automáticamente.',
            type: 'otro',
            importance: 'crítica',
            impacts: {
              schedule: 'N/A',
              budget: 'N/A',
              progress: 'N/A'
            },
            highlightedData: [
              { key: 'Evento', value: extractedData.nombre || 'N/A', context: 'Identificación' },
              { key: 'Afectados', value: String(extractedData.metrics?.poblacionImpactada || 0), context: 'Población' }
            ],
            risks: [],
            inconsistencies: []
          }
        };
        addDocument(newDoc);
      }
      
      setFormData(prev => {
        const newData = { ...prev };
        
        // Update general data
        if (extractedData.nombre) newData.generalData.evento = extractedData.nombre;
        if (extractedData.descripcion) newData.generalData.descripcionEvento = extractedData.descripcion;
        if (extractedData.fechaInicio) newData.generalData.fechaEvento = extractedData.fechaInicio;
        if (extractedData.tipo) newData.generalData.tipoEvento = [extractedData.tipo];

        // Update metrics
        if (extractedData.metrics) {
          if (extractedData.metrics.viviendasDanadas) {
            newData.danosVivienda.averiadasUrbano.cantidad = extractedData.metrics.viviendasDanadas;
          }
          if (extractedData.metrics.poblacionImpactada) {
            newData.poblacion.personasAfectadas.total.cantidad = extractedData.metrics.poblacionImpactada;
          }
          if (extractedData.metrics.maquinariaHoras) {
            newData.necesidades.maquinariaHoras.cantidad = extractedData.metrics.maquinariaHoras;
          }
        }

        // Update operational costs
        if (extractedData.costosOperativos) {
          newData.costosOperativos = {
            ...newData.costosOperativos,
            ...extractedData.costosOperativos
          };
        }

        return newData;
      });
      
      showAlert('Documento EDAN analizado y campos rellenados exitosamente.');
      setShowExtractionModal(false);
      setPastedText('');
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      showAlert('Error al analizar el documento EDAN.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderField = (label: string, section: keyof MunicipalityInventory, field: string, type: 'number' | 'text' | 'date' | 'time' = 'number', isCurrency = false) => (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="relative">
        {isCurrency && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>}
        <input 
          type={type}
          value={(formData[section] as any)[field] || ''}
          onChange={(e) => handleUpdateField(section, field, type === 'number' ? Number(e.target.value) : e.target.value)}
          className={`w-full ${isCurrency ? 'pl-7' : 'px-4'} py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
        />
      </div>
    </div>
  );

  const renderFieldIndicador = (label: string, field: keyof IndicadoresTerritorio, type: 'number' | 'text' = 'number') => (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        value={formData.indicadores?.[field] || ''}
        onChange={(e) => handleUpdateDeepField(['indicadores', field], type === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
      />
    </div>
  );

  const renderMetricRow = (label: string, section: keyof MunicipalityInventory, fieldPath: string, unitLabel = 'Cantidad') => {
    // Correctly resolve deep item for nested sectors (e.g., salud.hospitales)
    const fieldParts = fieldPath.split('.');
    let item: any = formData[section];
    for (const part of fieldParts) {
      if (item) item = item[part];
    }

    let isDemographic = false;
    if (section === 'poblacion' && item && 'total' in item) {
       item = item.total;
       isDemographic = true;
    } else {
       item = item || { cantidad: 0, valorUnitario: 0, valorTotal: 0 };
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end p-4 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 transition-all group">
        <div className="md:col-span-2">
          <p className="text-sm font-black text-slate-800">{label}</p>
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">{unitLabel}</label>
          <input 
            type="number"
            value={item.cantidad || ''}
            onChange={(e) => isDemographic ? handleUpdateDeepField([section, fieldPath, 'total', 'cantidad'], Number(e.target.value)) : handleUpdateField(section, fieldPath, Number(e.target.value), 'cantidad')}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Costo U.</label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">$</span>
            <input 
              type="number"
              value={item.valorUnitario || ''}
              onChange={(e) => isDemographic ? handleUpdateDeepField([section, fieldPath, 'total', 'valorUnitario'], Number(e.target.value)) : handleUpdateField(section, fieldPath, Number(e.target.value), 'valorUnitario')}
              className="w-full pl-5 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="text-[9px] font-black text-amber-500 uppercase mb-1 block flex items-center gap-1">Cobertura (%)</label>
          <input 
            type="number"
            min="0"
            max="100"
            value={item.porcentajeCobertura ? Math.round(item.porcentajeCobertura) : ''}
            onChange={(e) => {
               let val = Number(e.target.value);
               if (val > 100) val = 100;
               if (val < 0) val = 0;
               isDemographic ? handleUpdateDeepField([section, fieldPath, 'total', 'porcentajeCobertura'], val) : handleUpdateField(section, fieldPath, val, 'porcentajeCobertura');
            }}
            className="w-full px-3 py-2 bg-amber-50/50 border border-amber-200 rounded-lg text-xs font-bold text-amber-700 outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="%"
          />
        </div>
        <div className="text-right flex flex-col justify-end">
          <label className="text-[9px] font-black text-slate-400 uppercase mb-1 block">Total / Traslado Poliza</label>
          <p className="text-sm font-black text-indigo-600">$ {item.valorTotal?.toLocaleString() || 0}</p>
          {item.valorAsegurado > 0 && (
            <p className="text-[10px] font-bold text-amber-600 mt-0.5">
              Poliza: $ {item.valorAsegurado.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[85vh]">
      {/* Header */}
      <div className="bg-slate-900 p-8 text-white shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-2xl shadow-lg shadow-indigo-500/20">
              <ClipboardList size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Consolidador Técnico EDAN</h2>
              <p className="text-xs text-indigo-300 uppercase tracking-widest font-bold">FR– 1900- SMD - 04 • Versión 01</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Afectación Bruta (Daño Total)</p>
            <p className="text-2xl font-black text-slate-300">$ {totalCosto.toLocaleString()}</p>
            {totalPolizas > 0 && (
              <div className="mt-2 text-right">
                <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">- Traslado de Riesgo (Pólizas)</p>
                <p className="text-sm font-bold text-amber-400 border-b border-white/10 pb-1 mb-1">$ {totalPolizas.toLocaleString()}</p>
              </div>
            )}
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-2 mb-1">Inversión Nación (Desagregada)</p>
            <p className="text-3xl font-black text-emerald-400">$ {(totalCosto - totalPolizas).toLocaleString()}</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex justify-between mt-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-white/10 -z-0" />
          {steps.map((step, idx) => (
            <button 
              key={step.id}
              onClick={() => setActiveStep(idx)}
              className="relative z-10 flex flex-col items-center gap-2 group"
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border-2 ${
                activeStep === idx 
                  ? 'bg-indigo-500 border-indigo-400 text-white scale-110 shadow-lg shadow-indigo-500/40' 
                  : idx < activeStep 
                    ? 'bg-emerald-500 border-emerald-400 text-white' 
                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
              }`}>
                {idx < activeStep ? <ShieldCheck size={20} /> : step.icon}
              </div>
              <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${
                activeStep === idx ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
              }`}>
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {steps[activeStep].icon}
                {steps[activeStep].title}
              </h3>
              <p className="text-slate-500 font-medium">{steps[activeStep].description}</p>
            </div>
            {activeStep === 0 && (
              <button 
                onClick={() => setShowExtractionModal(true)}
                className="flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-200 transition-colors"
              >
                <Activity size={18} />
                Extraer con IA
              </button>
            )}
          </div>

          {activeStep === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                  <Activity size={18} className="text-indigo-600" /> Indicadores Territoriales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {renderFieldIndicador('Población Total del Territorio', 'poblacionTotal')}
                  {renderFieldIndicador('Total de Viviendas', 'totalViviendas')}
                  {renderFieldIndicador('Índice NBI (%)', 'nbi')}
                  {renderFieldIndicador('Coeficiente de Gini', 'coeficienteGini')}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" /> Detalle del Evento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {renderField('Evento Generador', 'generalData', 'evento', 'text')}
                  {renderField('Magnitud / Referencia', 'generalData', 'magnitud', 'text')}
                  {renderField('Fecha del Evento', 'generalData', 'fechaEvento', 'date')}
                  {renderField('Hora del Evento', 'generalData', 'horaEvento', 'time')}
                </div>
                <div className="space-y-2 mb-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Descripción Detallada</label>
                  <textarea 
                    value={formData.generalData?.descripcionEvento || ''}
                    onChange={(e) => handleUpdateField('generalData', 'descripcionEvento', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 h-32 resize-none"
                    placeholder="Describa el evento, zonas afectadas y contexto inicial..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {renderField('Sitio del Evento', 'generalData', 'sitioEvento', 'text')}
                  {renderField('Sectores Afectados', 'generalData', 'sectoresAfectados', 'text')}
                </div>
              </div>
            </div>
          )}

          {activeStep === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4 flex items-start gap-4">
                <Info size={24} className="text-indigo-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 mb-1">Registro Segregado de Población</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Puede registrar los totales de forma directa en cada categoría. Si dispone de la información, expanda cada fila para registrar los datos disgregados por ciclo vital, condición especial y enfoque diferencial.
                  </p>
                </div>
              </div>
              <DemographicRow label="Familias Afectadas" item={formData.poblacion.familiasAfectadas} section="poblacion" field="familiasAfectadas" unitLabel="Familias" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Personas Afectadas" item={formData.poblacion.personasAfectadas} section="poblacion" field="personasAfectadas" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Heridos" item={formData.poblacion.heridos} section="poblacion" field="heridos" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Muertos" item={formData.poblacion.muertos} section="poblacion" field="muertos" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Desaparecidos" item={formData.poblacion.desaparecidos} section="poblacion" field="desaparecidos" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Evacuados" item={formData.poblacion.evacuados} section="poblacion" field="evacuados" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Albergados" item={formData.poblacion.albergados} section="poblacion" field="albergados" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
              <DemographicRow label="Sustento Afectado (Sin trabajo/transporte)" item={formData.poblacion.personasSinSustento || { total: { cantidad: 0, valorUnitario: 0, valorTotal: 0 } }} section="poblacion" field="personasSinSustento" unitLabel="Personas" handleUpdate={handleUpdateDeepField} />
            </div>
          )}

          {/* Step 2: Vivienda */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 mb-6 shadow-xl shadow-slate-200/50">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="text-lg font-black text-slate-800 uppercase flex items-center gap-3">
                      <Home size={24} className="text-indigo-600" /> Censo Detallado de Viviendas Afectadas
                    </h4>
                    <p className="text-slate-500 font-medium text-sm">Registre cada inmueble de manera individual para garantizar la precisión del reporte.</p>
                  </div>
                </div>

                {/* Resumen dinámico */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {[
                    { label: 'Total Viviendas', value: formData.danosVivienda.listadoViviendas?.length || 0, icon: <Home size={16}/>, color: 'indigo' },
                    { label: 'Total Hogares', value: formData.danosVivienda.listadoViviendas?.reduce((sum, item) => sum + (item.numeroHogares || 0), 0) || 0, icon: <Users size={16}/>, color: 'purple' },
                    { label: 'Costo Estimado', value: formatCurrency(formData.danosVivienda.listadoViviendas?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0), icon: <DollarSign size={16}/>, color: 'emerald' },
                    { label: 'Urbano/Rural', value: `${formData.danosVivienda.listadoViviendas?.filter(v => v.ubicacion === 'Urbano').length || 0} / ${formData.danosVivienda.listadoViviendas?.filter(v => v.ubicacion === 'Rural').length || 0}`, icon: <MapPin size={16}/>, color: 'amber' },
                    { label: 'Traslado Riesgo', value: formatCurrency(formData.danosVivienda.listadoViviendas?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0), icon: <ShieldCheck size={16}/>, color: 'blue' }
                  ].map(stat => (
                    <div key={stat.label} className={`bg-${stat.color}-50 p-4 rounded-2xl border border-${stat.color}-100`}>
                      <div className={`flex items-center gap-2 text-${stat.color}-600 mb-1`}>
                        {stat.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider">{stat.label}</span>
                      </div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  {renderDetailedList('danosVivienda', 'listadoViviendas', 'Listado Maestro de Inmuebles')}
                </div>
              </div>

              <div className="bg-white p-6 rounded-[3xl] border border-slate-200 mb-6 shadow-sm">
                <h4 className="text-sm font-black text-slate-800 uppercase mb-4 flex items-center gap-2">
                  <Calculator size={18} className="text-indigo-600" /> Otros Indicadores Sociales de Vivienda
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hogares con Jefatura Femenina</label>
                    <input 
                      type="number"
                      value={formData.danosVivienda.hogaresJefaturaFemenina || ''}
                      onChange={(e) => handleUpdateDeepField(['danosVivienda', 'hogaresJefaturaFemenina'], Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Hogares que Requieren Reubicación</label>
                    <input 
                      type="number"
                      placeholder="Cantidad de hogares"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Viviendas en Zona de Alto Riesgo</label>
                    <input 
                      type="number"
                      placeholder="Cantidad de viviendas"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
               <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex items-start gap-4">
                <Info size={24} className="text-indigo-600 shrink-0 mt-1" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-900 mb-1">Impacto a la Infraestructura por Sectores</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    Registre los daños en instalaciones y bienes públicos/privados categorizados por cada sector del país. Haga clic en cada sector para expandir los formularios detallados.
                  </p>
                </div>
              </div>

                 <div className="space-y-4">
                   {/* Salud */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <Activity className="text-rose-500" size={20} />
                       <h5 className="font-bold text-slate-800">Sector Salud</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-rose-800 uppercase">Resumen de Daños en Salud</h6>
                          <span className="text-[10px] font-bold text-rose-600 bg-white px-2 py-0.5 rounded-full border border-rose-200">
                            {formData.infraestructuraPorSector.salud.listadoCentros?.length || 0} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-rose-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-rose-900 font-mono italic tracking-tighter">{formatCurrency(formData.infraestructuraPorSector.salud.listadoCentros?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-rose-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-rose-900 font-mono italic tracking-tighter">{formatCurrency(formData.infraestructuraPorSector.salud.listadoCentros?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {renderDetailedList('infraestructuraPorSector', 'salud.listadoCentros', 'Seguimiento Detallado de Centros de Salud')}
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                         <h6 className="text-[10px] font-black text-rose-600 uppercase mb-4 tracking-widest">Indicadores de Salud Pública</h6>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Hipotermia</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.salud?.casosHipotermia || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'salud', 'casosHipotermia'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Infec. Agudas</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.salud?.casosInfeccionesAgudas || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'salud', 'casosInfeccionesAgudas'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Desnutrición &lt;5a</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.salud?.ninosDesnutricion || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'salud', 'ninosDesnutricion'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                         </div>
                         <div className="mt-4 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Necesidades Prioritarias de Salud</label>
                            <textarea 
                               value={formData.infraestructuraPorSector?.salud?.necesidadesPrioritariasSalud || ''}
                               onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'salud', 'necesidadesPrioritariasSalud'], e.target.value)}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none h-20"
                               placeholder="Medicamentos, equipos..."
                            />
                         </div>
                      </div>
                   </div>
                 </details>

                 {/* Educacion */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <FileText className="text-blue-500" size={20} />
                       <h5 className="font-bold text-slate-800">Sector Educación</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-blue-800 uppercase">Resumen de Daños en Educación</h6>
                          <span className="text-[10px] font-bold text-blue-600 bg-white px-2 py-0.5 rounded-full border border-blue-200">
                            {(formData.infraestructuraPorSector.educacionMedia.listadoInstituciones?.length || 0) + (formData.infraestructuraPorSector.educacionSuperior.listadoInstituciones?.length || 0)} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-blue-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-blue-900 font-mono italic tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.educacionMedia.listadoInstituciones?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.educacionSuperior.listadoInstituciones?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-blue-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-blue-900 font-mono italic tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.educacionMedia.listadoInstituciones?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.educacionSuperior.listadoInstituciones?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {renderDetailedList('infraestructuraPorSector', 'educacionMedia.listadoInstituciones', 'Seguimiento Detallado de Colegios y Escuelas')}
                        {renderDetailedList('infraestructuraPorSector', 'educacionSuperior.listadoInstituciones', 'Seguimiento Detallado de Universidades e Institutos')}
                      </div>
                      <div className="pt-4 border-t border-slate-100">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Estudiantes sin clases presenciales</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.educacionMedia?.estudiantesSinClases || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'educacionMedia', 'estudiantesSinClases'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                 </details>

                 {/* Sector Social e ICBF */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <Users className="text-pink-500" size={20} />
                       <h5 className="font-bold text-slate-800">Sector Social e ICBF</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      {renderMetricRow('Hogares CDI / Comunitarios', 'infraestructuraPorSector', 'icbf.hogaresCDI')}
                      <div className="pt-4 border-t border-slate-100">
                      </div>
                   </div>
                 </details>

                 {/* Transporte */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden open [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <Construction className="text-amber-500" size={20} />
                       <h5 className="font-bold text-slate-800">Infraestructura de Transporte</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-amber-800 uppercase">Resumen Vial y Transporte</h6>
                          <span className="text-[10px] font-bold text-amber-600 bg-white px-2 py-0.5 rounded-full border border-amber-200">
                            {(formData.infraestructuraPorSector.transporteVias.listadoVias?.length || 0) + (formData.infraestructuraPorSector.transportePuentes.listadoPuentes?.length || 0)} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-amber-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-amber-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.transporteVias.listadoVias?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.transportePuentes.listadoPuentes?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.transporteMuellesPuertos.listadoMuelles?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-amber-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-amber-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.transporteVias.listadoVias?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.transportePuentes.listadoPuentes?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2">
                        {renderDetailedList('infraestructuraPorSector', 'transporteVias.listadoVias', 'Inventario de Vías Afectadas (Metros/Km)')}
                        {renderDetailedList('infraestructuraPorSector', 'transportePuentes.listadoPuentes', 'Inventario de Puentes y Transversales')}
                        {renderDetailedList('infraestructuraPorSector', 'transporteMuellesPuertos.listadoMuelles', 'Inventario de Muelles, Puertos y Aeropuertos')}
                      </div>
                   </div>
                 </details>

                 {/* Turismo */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <MapPin className="text-orange-500" size={20} />
                       <h5 className="font-bold text-slate-800">Sector Turismo</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-orange-800 uppercase">Resumen Sector Turismo</h6>
                          <span className="text-[10px] font-bold text-orange-600 bg-white px-2 py-0.5 rounded-full border border-orange-200">
                            {formData.infraestructuraPorSector.turismo.listadoAtractivos?.length || 0} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-orange-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-orange-900 tracking-tighter">
                              {formatCurrency(formData.infraestructuraPorSector.turismo.listadoAtractivos?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-orange-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-orange-900 tracking-tighter">
                              {formatCurrency(formData.infraestructuraPorSector.turismo.listadoAtractivos?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {renderDetailedList('infraestructuraPorSector', 'turismo.listadoAtractivos', 'Seguimiento Detallado de Atractivos e Infraestructura Turística')}
                   </div>
                 </details>

                 {/* Deportes y Cultura */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <Users className="text-purple-500" size={20} />
                       <h5 className="font-bold text-slate-800">Deportes y Cultura</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-purple-800 uppercase">Resumen Deportes y Cultura</h6>
                          <span className="text-[10px] font-bold text-purple-600 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                            {(formData.infraestructuraPorSector.deportes.listadoEscenarios?.length || 0) + (formData.infraestructuraPorSector.cultura.listadoBienes?.length || 0)} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-purple-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-purple-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.deportes.listadoEscenarios?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.cultura.listadoBienes?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-purple-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-purple-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.deportes.listadoEscenarios?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.cultura.listadoBienes?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {renderDetailedList('infraestructuraPorSector', 'deportes.listadoEscenarios', 'Seguimiento Detallado de Escenarios Deportivos')}
                      {renderDetailedList('infraestructuraPorSector', 'cultura.listadoBienes', 'Seguimiento Detallado de Bienes de Interés Cultural')}
                   </div>
                 </details>

                 {/* Agricultura */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <ShoppingBag className="text-emerald-600" size={20} />
                       <h5 className="font-bold text-slate-800">Sector Agropecuario</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-emerald-800 uppercase">Resumen Sector Agropecuario</h6>
                          <span className="text-[10px] font-bold text-emerald-600 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                            {formData.infraestructuraPorSector.agricultura.listadoPredios?.length || 0} Predios Registrados
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-emerald-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-emerald-900 tracking-tighter">
                              {formatCurrency(formData.infraestructuraPorSector.agricultura.listadoPredios?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-emerald-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-emerald-900 tracking-tighter">
                              {formatCurrency(formData.infraestructuraPorSector.agricultura.listadoPredios?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                      {renderDetailedList('infraestructuraPorSector', 'agricultura.listadoPredios', 'Seguimiento Detallado de Predios y Cultivos')}
                      
                      <div className="pt-4 border-t border-slate-100">
                         <h6 className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-widest">Producción Agrícola Detallada</h6>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Hectáreas Pérdida Total</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.agricultura?.hectareasPerdidaTotal || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'agricultura', 'hectareasPerdidaTotal'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Hectáreas Pérdida Parcial</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.agricultura?.hectareasPerdidaParcial || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'agricultura', 'hectareasPerdidaParcial'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Pérdidas Agrícolas Est. ($)</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.agricultura?.perdidasAgricolasEstimadas || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'agricultura', 'perdidasAgricolasEstimadas'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                         </div>
                         <div className="mt-4 space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase">Cultivos más afectados</label>
                            <input 
                               type="text"
                               value={formData.infraestructuraPorSector?.agricultura?.cultivosMasAfectados || ''}
                               onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'agricultura', 'cultivosMasAfectados'], e.target.value)}
                               className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               placeholder="Ej: Arroz, Maíz..."
                            />
                         </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                         <h6 className="text-[10px] font-black text-emerald-600 uppercase mb-4 tracking-widest">Sector Pecuario (Especies Muertas)</h6>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {[
                              { label: 'Bovinos', key: 'bovinosMuertos' },
                              { label: 'Ovinos', key: 'ovinosMuertos' },
                              { label: 'Caprinos', key: 'caprinosMuertos' },
                              { label: 'Aves', key: 'avesMuertas' },
                              { label: 'Otros', key: 'otrosMuertos' }
                            ].map((item: any) => (
                              <div key={item.key} className="space-y-1">
                                 <label className="text-[9px] font-black text-slate-400 uppercase">{item.label}</label>
                                 <input 
                                   type="number"
                                   value={(formData.infraestructuraPorSector?.pecuario as any)?.[item.key] || ''}
                                   onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'pecuario', item.key], Number(e.target.value))}
                                   className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                 />
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                 </details>

                 {/* Defensa, Trabajo y Gobierno */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <ShieldCheck className="text-slate-600" size={20} />
                       <h5 className="font-bold text-slate-800">Defensa, Trabajo y Gobierno</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 mb-2">
                        <div className="flex justify-between items-center mb-2">
                          <h6 className="text-xs font-black text-slate-800 uppercase">Resumen Sector Gobierno y Otros</h6>
                          <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                            {(formData.infraestructuraPorSector.defensa.listadoInstituciones?.length || 0) + (formData.infraestructuraPorSector.trabajo.listadoEmpresas?.length || 0)} Registros
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Costo Estimado</p>
                            <p className="text-sm font-black text-slate-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.defensa.listadoInstituciones?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.trabajo.listadoEmpresas?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Total Asegurado</p>
                            <p className="text-sm font-black text-slate-900 tracking-tighter">
                              {formatCurrency(
                                (formData.infraestructuraPorSector.defensa.listadoInstituciones?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0) +
                                (formData.infraestructuraPorSector.trabajo.listadoEmpresas?.reduce((sum, item) => sum + (item.valorAsegurado || 0), 0) || 0)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      {renderDetailedList('infraestructuraPorSector', 'defensa.listadoInstituciones', 'Seguimiento Detallado de Instituciones de Gobierno y Seguridad')}
                      {renderDetailedList('infraestructuraPorSector', 'trabajo.listadoEmpresas', 'Seguimiento Detallado de Negocios, Fábricas y Centrales')}
                      
                      <div className="pt-4 border-t border-slate-100">
                         <h6 className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest">Economía Local e Ingresos</h6>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Negocios Cerrados</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.trabajo?.negociosCerrados || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'trabajo', 'negociosCerrados'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Jornaleros s/ Ingresos</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.trabajo?.jornalerosSinIngresos || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'trabajo', 'jornalerosSinIngresos'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Días Activ. Perdidos</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.trabajo?.diasActividadEconomicaPerdidos || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'trabajo', 'diasActividadEconomicaPerdidos'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[10px] font-black text-slate-400 uppercase">Mujeres Jefas c/ Pérdida</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.trabajo?.mujeresJefasHogarPerdidaIngreso || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'trabajo', 'mujeresJefasHogarPerdidaIngreso'], Number(e.target.value))}
                                 className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                 </details>

                 {/* Servicios Publicos */}
                 <details className="group bg-white border border-slate-200 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                   <summary className="flex items-center justify-between p-5 cursor-pointer select-none bg-slate-50 group-open:bg-indigo-50 group-open:border-b group-open:border-indigo-100 transition-colors">
                     <div className="flex items-center gap-3">
                       <Activity className="text-cyan-500" size={20} />
                       <h5 className="font-bold text-slate-800">Servicios Públicos (Redes e Interrupciones)</h5>
                     </div>
                     <ChevronDown className="text-slate-400 group-open:-rotate-180 transition-transform" size={20} />
                   </summary>
                   <div className="p-5 space-y-4 bg-white grid grid-cols-1 gap-4">
                      {renderMetricRow('Torres, Postes y Redes Eléctricas', 'infraestructuraPorSector', 'energia.torres')}
                      {renderMetricRow('Subestaciones y Trasnmisores', 'infraestructuraPorSector', 'energia.subestaciones')}
                      {renderMetricRow('Redes de Acueducto (Metros)', 'infraestructuraPorSector', 'aguaGas.acueducto', 'Metros')}
                      {renderMetricRow('Sistemas de Alcantarillado', 'infraestructuraPorSector', 'aguaGas.alcantarillado', 'Metros')}
                      {renderMetricRow('Líneas de Gas y Distribución', 'infraestructuraPorSector', 'aguaGas.gas', 'Metros')}
                      {renderMetricRow('Torres de Comunicaciones y Antenas', 'infraestructuraPorSector', 'comunicaciones.antenas')}
                      {renderMetricRow('Nodos e Internet Fibra Óptica', 'infraestructuraPorSector', 'comunicaciones.fibraOptica', 'Metros')}
                      <div className="pt-6 border-t border-slate-100 space-y-4">
                         <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado Vital de Servicios</h6>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Personas sin agua</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.aguaGas?.personasSinAgua || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'aguaGas', 'personasSinAgua'], Number(e.target.value))}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Personas sin Energía</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.energia?.personasSinServicio || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'energia', 'personasSinServicio'], Number(e.target.value))}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Días Estimados sin energía</label>
                               <input 
                                 type="number"
                                 value={formData.infraestructuraPorSector?.energia?.diasEstimadosSinEnergia || ''}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'energia', 'diasEstimadosSinEnergia'], Number(e.target.value))}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               />
                            </div>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Alcohol./Saneamiento Status</label>
                               <select 
                                 value={formData.infraestructuraPorSector?.aguaGas?.alcantarilladoStatus || 'Funcional'}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'aguaGas', 'alcantarilladoStatus'], e.target.value)}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               >
                                  <option value="Funcional">No (Funcional)</option>
                                  <option value="Parcial">Parcial</option>
                                  <option value="Falla">Si (Fuera de Servicio)</option>
                               </select>
                            </div>
                            <div className="space-y-1">
                               <label className="text-[9px] font-black text-slate-500 uppercase">Interrupción Telcos</label>
                               <select 
                                 value={formData.infraestructuraPorSector?.comunicaciones?.status || 'Funcional'}
                                 onChange={(e) => handleUpdateDeepField(['infraestructuraPorSector', 'comunicaciones', 'status'], e.target.value)}
                                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                               >
                                  <option value="Funcional">No (Funcional)</option>
                                  <option value="Parcial">Parcial</option>
                                  <option value="Falla">Si (Interrumpido)</option>
                               </select>
                            </div>
                         </div>
                      </div>
                   </div>
                 </details>

              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-200 mb-6">
                <h4 className="text-sm font-black text-amber-800 uppercase mb-2 flex items-center gap-2">
                  <AlertTriangle size={18} /> Necesidades Prioritarias (Capa 3)
                </h4>
                <p className="text-xs text-amber-700 font-medium mb-4">Recursos requeridos para la atención inmediata de la emergencia.</p>
                <div className="space-y-4">
                  {renderMetricRow('Asistencia Alimentaria (Mercados)', 'necesidades', 'mercados', 'Kits')}
                  {renderMetricRow('Kits de Aseo', 'necesidades', 'kitsAseo', 'Kits')}
                  {renderMetricRow('Kits de Cocina', 'necesidades', 'kitsCocina', 'Kits')}
                  {renderMetricRow('Frazadas / Cobijas', 'necesidades', 'frazadas', 'Unidades')}
                  {renderMetricRow('Colchonetas', 'necesidades', 'colchonetas', 'Unidades')}
                  {renderMetricRow('Agua Potable', 'necesidades', 'aguaLitros', 'Litros')}
                  {renderMetricRow('Maquinaria Amarilla', 'necesidades', 'maquinariaHoras', 'Horas')}
                </div>
              </div>
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Reuniones PMU / Técnicas
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {addedReuniones.length} vinculadas {reunionSearch && `(filtradas de ${formData.costosOperativos?.reunionesPMU?.length})`}
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar reunión existente..." 
                        value={reunionSearch}
                        onChange={e => setReunionSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newPmu = { id: Math.random().toString(), fecha: '', tema: '', participantes: [], costoEstimado: 0 };
                        setFormData(prev => ({
                          ...prev,
                          costosOperativos: {
                            ...prev.costosOperativos,
                            reunionesPMU: [...(prev.costosOperativos?.reunionesPMU || []), newPmu]
                          }
                        }));
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                    >
                      <Plus size={16} /> Nueva
                    </button>
                  </div>
                </div>

                {filteredReuniones.length > 0 && (
                  <div className="mb-4 max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    {filteredReuniones.map(reunion => (
                      <div key={reunion.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{reunion.title}</p>
                          <p className="text-xs text-slate-500">{reunion.date} • {reunion.type}</p>
                        </div>
                        <button
                          onClick={() => {
                            const newPmu = { 
                              id: reunion.id, 
                              fecha: reunion.date, 
                              tema: reunion.title, 
                              participantes: [], 
                              costoEstimado: reunion.durationHours * 50000 // Estimación básica
                            };
                            setFormData(prev => ({
                              ...prev,
                              costosOperativos: {
                                ...prev.costosOperativos,
                                reunionesPMU: [...(prev.costosOperativos?.reunionesPMU || []), newPmu]
                              }
                            }));
                            setReunionSearch('');
                          }}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200"
                        >
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {addedReuniones.map((pmu) => {
                    const idx = (formData.costosOperativos?.reunionesPMU || []).findIndex(r => r.id === pmu.id);
                    return (
                      <div key={pmu.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-slate-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Fecha</label>
                          <input type="date" value={pmu.fecha} onChange={(e) => {
                            setFormData(prev => {
                              const newPmus = [...(prev.costosOperativos?.reunionesPMU || [])];
                              if (idx !== -1) {
                                newPmus[idx].fecha = e.target.value;
                              }
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, reunionesPMU: newPmus } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Tema / Agenda</label>
                          <input type="text" value={pmu.tema} onChange={(e) => {
                            setFormData(prev => {
                              const newPmus = [...(prev.costosOperativos?.reunionesPMU || [])];
                              if (idx !== -1) {
                                newPmus[idx].tema = e.target.value;
                              }
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, reunionesPMU: newPmus } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Costo Estimado</label>
                            <input type="number" value={pmu.costoEstimado || 0} onChange={(e) => {
                              setFormData(prev => {
                                const newPmus = [...(prev.costosOperativos?.reunionesPMU || [])];
                                if (idx !== -1) {
                                  newPmus[idx].costoEstimado = Number(e.target.value);
                                }
                                return { ...prev, costosOperativos: { ...prev.costosOperativos, reunionesPMU: newPmus } };
                              });
                            }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                          </div>
                          <button onClick={() => {
                            setFormData(prev => {
                              const newPmus = (prev.costosOperativos?.reunionesPMU || []).filter(r => r.id !== pmu.id);
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, reunionesPMU: newPmus } };
                            });
                          }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mb-0.5 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {addedReuniones.length === 0 && reunionSearch && (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <Search className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-sm text-slate-500 font-medium">No se encontraron reuniones que coincidan con "{reunionSearch}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users size={20} className="text-indigo-500" />
                    Comisiones en Territorio
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {addedComisiones.length} vinculadas {comisionSearch && `(filtradas de ${formData.costosOperativos?.comisionesSugeridas?.length})`}
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar comisión existente..." 
                        value={comisionSearch}
                        onChange={e => setComisionSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newCom = { id: Math.random().toString(), departamento: '', municipios: '', objeto: '', numeroDias: 1, perfilesRequeridos: [], costoEstimado: 0 };
                        setFormData(prev => ({
                          ...prev,
                          costosOperativos: {
                            ...prev.costosOperativos,
                            comisionesSugeridas: [...(prev.costosOperativos?.comisionesSugeridas || []), newCom]
                          }
                        }));
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                    >
                      <Plus size={16} /> Nueva
                    </button>
                  </div>
                </div>

                {filteredComisiones.length > 0 && (
                  <div className="mb-4 max-h-60 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    {filteredComisiones.map(comision => (
                      <div key={comision.id} className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex justify-between items-center transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider">
                              {comision.tipoComision}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{comision.departamento} - {comision.municipios}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-800 line-clamp-1">{comision.objeto}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {comision.numeroDias} días • {comision.fechaInicio} al {comision.fechaFin} • Costo: ${comision.costoTotal?.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            const newCom = { 
                              id: comision.id, 
                              departamento: comision.departamento, 
                              municipios: comision.municipios, 
                              objeto: comision.objeto, 
                              numeroDias: comision.numeroDias, 
                              perfilesRequeridos: [], 
                              costoEstimado: comision.costoTotal 
                            };
                            setFormData(prev => ({
                              ...prev,
                              costosOperativos: {
                                ...prev.costosOperativos,
                                comisionesSugeridas: [...(prev.costosOperativos?.comisionesSugeridas || []), newCom]
                              }
                            }));
                            setComisionSearch('');
                          }}
                          className="ml-4 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-200 transition-opacity"
                        >
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {addedComisiones.map((com) => {
                    const idx = (formData.costosOperativos?.comisionesSugeridas || []).findIndex(c => c.id === com.id);
                    return (
                      <div key={com.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end p-4 bg-slate-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Objeto / Municipios</label>
                          <input type="text" value={com.objeto} placeholder="Objeto de la comisión" onChange={(e) => {
                            setFormData(prev => {
                              const newComs = [...(prev.costosOperativos?.comisionesSugeridas || [])];
                              if (idx !== -1) newComs[idx].objeto = e.target.value;
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, comisionesSugeridas: newComs } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold mb-2" />
                          <input type="text" value={com.municipios} placeholder="Municipios a visitar" onChange={(e) => {
                            setFormData(prev => {
                              const newComs = [...(prev.costosOperativos?.comisionesSugeridas || [])];
                              if (idx !== -1) newComs[idx].municipios = e.target.value;
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, comisionesSugeridas: newComs } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Días</label>
                          <input type="number" value={com.numeroDias} onChange={(e) => {
                            setFormData(prev => {
                              const newComs = [...(prev.costosOperativos?.comisionesSugeridas || [])];
                              if (idx !== -1) newComs[idx].numeroDias = Number(e.target.value);
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, comisionesSugeridas: newComs } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div className="flex gap-2 items-end md:col-span-2">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Costo Estimado</label>
                            <input type="number" value={com.costoEstimado || 0} onChange={(e) => {
                              setFormData(prev => {
                                const newComs = [...(prev.costosOperativos?.comisionesSugeridas || [])];
                                if (idx !== -1) newComs[idx].costoEstimado = Number(e.target.value);
                                return { ...prev, costosOperativos: { ...prev.costosOperativos, comisionesSugeridas: newComs } };
                              });
                            }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                          </div>
                          <button onClick={() => {
                            setFormData(prev => {
                              const newComs = (prev.costosOperativos?.comisionesSugeridas || []).filter(c => c.id !== com.id);
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, comisionesSugeridas: newComs } };
                            });
                          }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mb-0.5 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {addedComisiones.length === 0 && comisionSearch && (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <Search className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-sm text-slate-500 font-medium">No se encontraron comisiones que coincidan con "{comisionSearch}"</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Construction size={20} className="text-indigo-500" />
                    Maquinaria Amarilla
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                      {addedMaquinaria.length} vinculadas {maquinariaSearch && `(filtradas de ${formData.costosOperativos?.maquinariaAmarilla?.length})`}
                    </span>
                  </h4>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Buscar tipo de maquinaria..." 
                        value={maquinariaSearch}
                        onChange={e => setMaquinariaSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <button 
                      onClick={() => {
                        const newMaq = { id: Math.random().toString(), tipo: '', horasSugeridas: 0, costoEstimado: 0 };
                        setFormData(prev => ({
                          ...prev,
                          costosOperativos: {
                            ...prev.costosOperativos,
                            maquinariaAmarilla: [...(prev.costosOperativos?.maquinariaAmarilla || []), newMaq]
                          }
                        }));
                      }}
                      className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg flex items-center gap-1 text-xs font-bold"
                    >
                      <Plus size={16} /> Nueva
                    </button>
                  </div>
                </div>

                {filteredMaquinaria.length > 0 && (
                  <div className="mb-4 max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    {filteredMaquinaria.map(maq => (
                      <div key={maq.id} className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 flex justify-between items-center transition-colors">
                        <div>
                          <p className="text-sm font-bold text-slate-800">{maq.tipo}</p>
                          <p className="text-xs text-slate-500">Costo base est.: ${maq.costoEstimado.toLocaleString()}/hora</p>
                        </div>
                        <button
                          onClick={() => {
                            const newMaq = { 
                              id: Math.random().toString(), 
                              tipo: maq.tipo, 
                              horasSugeridas: 100, 
                              costoEstimado: maq.costoEstimado * 100
                            };
                            setFormData(prev => ({
                              ...prev,
                              costosOperativos: {
                                ...prev.costosOperativos,
                                maquinariaAmarilla: [...(prev.costosOperativos?.maquinariaAmarilla || []), newMaq]
                              }
                            }));
                            setMaquinariaSearch('');
                          }}
                          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-200"
                        >
                          Vincular
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="space-y-4">
                  {addedMaquinaria.map((maq) => {
                    const idx = (formData.costosOperativos?.maquinariaAmarilla || []).findIndex(m => m.id === maq.id);
                    return (
                      <div key={maq.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 bg-slate-50 rounded-xl border border-transparent hover:border-indigo-100 transition-all">
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Tipo de Maquinaria</label>
                          <input type="text" value={maq.tipo} placeholder="Ej: Retroexcavadora, Pajarita" onChange={(e) => {
                            setFormData(prev => {
                              const newMaqs = [...(prev.costosOperativos?.maquinariaAmarilla || [])];
                              if (idx !== -1) newMaqs[idx].tipo = e.target.value;
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, maquinariaAmarilla: newMaqs } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Horas</label>
                          <input type="number" value={maq.horasSugeridas} onChange={(e) => {
                            setFormData(prev => {
                              const newMaqs = [...(prev.costosOperativos?.maquinariaAmarilla || [])];
                              if (idx !== -1) newMaqs[idx].horasSugeridas = Number(e.target.value);
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, maquinariaAmarilla: newMaqs } };
                            });
                          }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                        </div>
                        <div className="flex gap-2 items-end">
                          <div className="flex-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Costo Estimado</label>
                            <input type="number" value={maq.costoEstimado || 0} onChange={(e) => {
                              setFormData(prev => {
                                const newMaqs = [...(prev.costosOperativos?.maquinariaAmarilla || [])];
                                if (idx !== -1) newMaqs[idx].costoEstimado = Number(e.target.value);
                                return { ...prev, costosOperativos: { ...prev.costosOperativos, maquinariaAmarilla: newMaqs } };
                              });
                            }} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold" />
                          </div>
                          <button onClick={() => {
                            setFormData(prev => {
                              const newMaqs = (prev.costosOperativos?.maquinariaAmarilla || []).filter(m => m.id !== maq.id);
                              return { ...prev, costosOperativos: { ...prev.costosOperativos, maquinariaAmarilla: newMaqs } };
                            });
                          }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg mb-0.5 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {addedMaquinaria.length === 0 && maquinariaSearch && (
                    <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      <Search className="mx-auto text-slate-300 mb-2" size={24} />
                      <p className="text-sm text-slate-500 font-medium">No se encontró maquinaria que coincida con "{maquinariaSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 pb-20">
              {/* Header Reporte EDANPRI - Estilo Corporativo Gobierno */}
              <div className="bg-white p-12 rounded-[4rem] border-t-8 border-indigo-600 shadow-2xl relative overflow-hidden print:shadow-none print:border-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50/50 rounded-bl-full -z-0" />
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative z-10">
                  <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-slate-900 rounded-3xl flex items-center justify-center shadow-2xl shadow-slate-900/30 transform -rotate-3">
                        <FileText className="text-white" size={48} />
                      </div>
                      <div>
                        <h2 className="text-5xl font-black text-slate-900 leading-none tracking-tighter">REPORTE EDANPRI</h2>
                        <p className="text-indigo-600 font-extrabold uppercase tracking-[0.3em] text-[10px] mt-2 ml-1">Consolidador Técnico Nacional de Emergencias</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                      <span className="px-4 py-1.5 bg-rose-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-200">DOCUMENTO OFICIAL</span>
                      <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">VERSIÓN 1.0.4</span>
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-2xl text-[9px] font-black uppercase tracking-widest">{new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 p-8 rounded-[3rem] text-right min-w-[280px] shadow-2xl shadow-indigo-200">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Afectación Bruta Consolidada</p>
                    <p className="text-5xl font-black text-white tabular-nums tracking-tighter">$ {totalCosto.toLocaleString()}</p>
                    <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-1 items-end">
                      <p className="text-[10px] font-black text-amber-500 uppercase">Transferencia de Riesgo: $ {totalPolizas.toLocaleString()}</p>
                      <p className="text-xs font-black text-emerald-400 uppercase">Inversión Neta Nación: $ {(totalCosto - totalPolizas).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Grid de KPIs Visuales */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 relative z-10">
                  {[
                    { label: 'Personas Afectadas', val: formData.poblacion?.personasAfectadas?.total?.cantidad || 0, icon: <Users className="text-indigo-500" />, sub: 'Registro Civil' },
                    { label: 'Viviendas Colapsadas', val: formData.danosVivienda?.destruidas?.cantidad || 0, icon: <Home className="text-rose-500" />, sub: 'Pérdida Total' },
                    { label: 'Sector Productivo', val: `$ ${(extractCosts(formData.infraestructuraPorSector?.agricultura) / 1e6).toFixed(1)}M`, icon: <Activity className="text-emerald-500" />, sub: 'Costo Impacto' },
                    { label: 'Indice de Gravedad', val: (totalCosto > 1000e6 ? 'CRÍTICA' : 'MODERADA'), icon: <AlertTriangle className="text-amber-500" />, sub: 'Nivel Alerta' }
                  ].map((kpi, i) => (
                    <div key={i} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] flex flex-col items-center text-center hover:bg-white hover:shadow-xl transition-all cursor-default">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-md flex items-center justify-center mb-3">
                        {kpi.icon}
                      </div>
                      <p className="text-2xl font-black text-slate-900">{kpi.val}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-wider">{kpi.label}</p>
                      <p className="text-[8px] font-bold text-slate-300 mt-1">{kpi.sub}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Análisis de Disgregación Poblacional - "El Corazón del Desastre" */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden relative">
                   <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                     <Users size={28} className="text-indigo-600" /> 
                     Disgregación Detallada de la Población Expuesta
                   </h4>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div className="h-[280px] w-full">
                           <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                { subject: 'Niños', A: formData.poblacion?.personasAfectadas?.ninos?.cantidad || 0, fullMark: 100 },
                                { subject: 'Niñas', A: formData.poblacion?.personasAfectadas?.ninas?.cantidad || 0, fullMark: 100 },
                                { subject: 'Adole. H', A: formData.poblacion?.personasAfectadas?.adolescentesHombres?.cantidad || 0, fullMark: 100 },
                                { subject: 'Adole. M', A: formData.poblacion?.personasAfectadas?.adolescentesMujeres?.cantidad || 0, fullMark: 100 },
                                { subject: 'Adult. H', A: formData.poblacion?.personasAfectadas?.adultosHombres?.cantidad || 0, fullMark: 100 },
                                { subject: 'Adult. M', A: formData.poblacion?.personasAfectadas?.adultosMujeres?.cantidad || 0, fullMark: 100 },
                              ]}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} />
                                <Radar name="Población" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                                <Tooltip />
                              </RadarChart>
                           </ResponsiveContainer>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl italic">
                          * Este gráfico radial permite identificar desviaciones demográficas críticas, notando una mayor vulnerabilidad en grupos etarios específicos para dirigir la ayuda humanitaria.
                        </p>
                      </div>

                      <div className="flex flex-col justify-center">
                        <div className="space-y-4">
                           {[
                             { label: 'Niñez y Adolescencia', m: (formData.poblacion?.personasAfectadas?.ninos?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.ninas?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adolescentesHombres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adolescentesMujeres?.cantidad || 0), total: formData.poblacion?.personasAfectadas?.total?.cantidad || 1, color: 'bg-indigo-500' },
                             { label: 'Adultos (H/M)', m: (formData.poblacion?.personasAfectadas?.adultosHombres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosMujeres?.cantidad || 0), total: formData.poblacion?.personasAfectadas?.total?.cantidad || 1, color: 'bg-emerald-500' },
                             { label: 'Adultos Mayores', m: (formData.poblacion?.personasAfectadas?.adultosMayoresHombres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosMayoresMujeres?.cantidad || 0), total: formData.poblacion?.personasAfectadas?.total?.cantidad || 1, color: 'bg-amber-500' }
                           ].map((bar, i) => (
                             <div key={i} className="space-y-2">
                               <div className="flex justify-between items-end">
                                 <p className="text-[10px] font-black text-slate-700 uppercase">{bar.label}</p>
                                 <p className="text-xs font-black text-slate-900">{((bar.m / bar.total) * 100).toFixed(1)}%</p>
                               </div>
                               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className={`h-full ${bar.color} transition-all duration-1000`} style={{ width: `${(bar.m / bar.total) * 100}%` }} />
                               </div>
                             </div>
                           ))}
                        </div>
                        
                        <div className="mt-10 p-6 bg-indigo-900 rounded-3xl text-white shadow-xl">
                          <p className="text-[10px] font-black text-indigo-300 uppercase mb-2">Composición Genérica</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 text-center">
                              <p className="text-3xl font-black">
                                {((((formData.poblacion?.personasAfectadas?.ninas?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adolescentesMujeres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosMujeres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosMayoresMujeres?.cantidad || 0)) / (formData.poblacion?.personasAfectadas?.total?.cantidad || 1)) * 100).toFixed(0)}%
                              </p>
                              <p className="text-[9px] font-bold text-indigo-300 uppercase">Femenino</p>
                            </div>
                            <div className="w-px h-10 bg-white/20" />
                            <div className="flex-1 text-center">
                              <p className="text-3xl font-black">
                                {((((formData.poblacion?.personasAfectadas?.ninos?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adolescentesHombres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosHombres?.cantidad || 0) + (formData.poblacion?.personasAfectadas?.adultosMayoresHombres?.cantidad || 0)) / (formData.poblacion?.personasAfectadas?.total?.cantidad || 1)) * 100).toFixed(0)}%
                              </p>
                              <p className="text-[9px] font-bold text-indigo-300 uppercase">Masculino</p>
                            </div>
                          </div>
                        </div>
                      </div>
                   </div>
                </div>

                {/* Análisis Financiero y de Pólizas */}
                <div className="lg:col-span-2 bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden">
                   <h4 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                     <ShieldCheck size={28} className="text-amber-500" /> 
                     Análisis de Transferencia
                   </h4>

                   <div className="space-y-8">
                     <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                   { name: 'Nación', value: totalCosto - totalPolizas },
                                   { name: 'Asegurado', value: totalPolizas },
                                 ]}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={65}
                                 outerRadius={90}
                                 paddingAngle={10}
                                 dataKey="value"
                              >
                                 <Cell fill="#0f172a" />
                                 <Cell fill="#f59e0b" />
                              </Pie>
                              <Tooltip formatter={(value: number) => `$ ${value.toLocaleString()}`} />
                              <Legend verticalAlign="bottom" height={36} iconType="diamond" />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>

                     <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100">
                        <div className="flex items-center gap-3 mb-4">
                           <Info size={20} className="text-amber-600" />
                           <p className="font-black text-amber-900 text-xs uppercase">Hallazgo de Auditoría Financiera</p>
                        </div>
                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                          Se ha identificado un traslado de riesgo equivalente al <strong>{((totalPolizas / (totalCosto || 1)) * 100).toFixed(1)}%</strong> de la afectación total bruta.
                          Este capital debe ser activado mediante reclamos de pólizas municipales y sectoriales para evitar sobre-ejecución del Fondo Nacional de Gestión del Riesgo.
                        </p>
                     </div>

                     <div className="p-6 bg-slate-900 rounded-[3rem] text-white space-y-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                           <span>Afectación Bruta</span>
                           <span>100%</span>
                        </div>
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black">Costo de Reconstrucción</span>
                           <span className="text-xl font-black">$ {totalCosto.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full" />
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-black text-emerald-400">Recurso Nación Requerido</span>
                           <span className="text-xl font-black text-emerald-400">$ {(totalCosto - totalPolizas).toLocaleString()}</span>
                        </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Análisis Sectorial y de Infraestructura */}
              <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl overflow-hidden relative">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-50/50 rounded-br-[100px] -z-0" />
                 
                 <div className="flex flex-col md:flex-row justify-between items-end mb-12 relative z-10 gap-6">
                    <div>
                      <h4 className="text-2xl font-black text-slate-900 flex items-center gap-4">
                        <Construction size={32} className="text-indigo-600" /> 
                        Deep-Dive: Impacto en Infraestructura y Sistemas
                      </h4>
                      <p className="text-slate-500 font-bold text-sm mt-2">Distribución paramétrica de daños por sector vital y red de servicios.</p>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Daño Infraest.</p>
                        <p className="text-xl font-black text-slate-800">$ {extractCosts(formData.infraestructuraPorSector).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase">Daño Vivienda</p>
                        <p className="text-xl font-black text-indigo-600">$ {extractCosts(formData.danosVivienda).toLocaleString()}</p>
                      </div>
                    </div>
                 </div>

                 <div className="h-[400px] w-full mb-12 relative z-10">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart 
                        layout="vertical"
                        data={[
                         { name: 'Educación', total: extractCosts(formData.infraestructuraPorSector?.educacionMedia) + extractCosts(formData.infraestructuraPorSector?.educacionSuperior), insured: extractInsuredCosts(formData.infraestructuraPorSector?.educacionMedia) + extractInsuredCosts(formData.infraestructuraPorSector?.educacionSuperior) },
                         { name: 'Salud', total: extractCosts(formData.infraestructuraPorSector?.salud), insured: extractInsuredCosts(formData.infraestructuraPorSector?.salud) },
                         { name: 'Vías y Transporte', total: extractCosts(formData.infraestructuraPorSector?.transporteVias) + extractCosts(formData.infraestructuraPorSector?.transportePuentes), insured: extractInsuredCosts(formData.infraestructuraPorSector?.transporteVias) + extractInsuredCosts(formData.infraestructuraPorSector?.transportePuentes) },
                         { name: 'Servicios Públicos', total: extractCosts(formData.serviciosPublicos), insured: extractInsuredCosts(formData.serviciosPublicos) },
                         { name: 'Vivienda', total: extractCosts(formData.danosVivienda), insured: extractInsuredCosts(formData.danosVivienda) },
                         { name: 'Desarrollo Productivo', total: extractCosts(formData.infraestructuraPorSector?.agricultura) + extractCosts(formData.infraestructuraPorSector?.pecuario), insured: extractInsuredCosts(formData.infraestructuraPorSector?.agricultura) + extractInsuredCosts(formData.infraestructuraPorSector?.pecuario) },
                        ].sort((a, b) => b.total - a.total)}
                        margin={{ left: 50, right: 30 }}
                       >
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#1e293b' }} width={120} />
                          <Tooltip formatter={(value: number) => `$ ${value.toLocaleString()}`} cursor={{ fill: '#f8fafc' }} />
                          <Legend iconType="circle" />
                          <Bar dataKey="total" name="Inversión Bruta" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} />
                          <Bar dataKey="insured" name="Cubierto por Póliza" fill="#f59e0b" radius={[0, 8, 8, 0]} barSize={12} />
                       </BarChart>
                    </ResponsiveContainer>
                 </div>

                 {/* Desglose Tipo Tabla Profesional */}
                 <div className="overflow-hidden rounded-3xl border border-slate-100 shadow-sm mb-8">
                    <table className="w-full text-left text-sm">
                       <thead>
                          <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                             <th className="px-8 py-6">Sector / Activo</th>
                             <th className="px-8 py-6">Situación de Operatividad</th>
                             <th className="px-8 py-6 text-right">Monto Estimado</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {[
                            { name: 'Acueducto y Saneamiento', status: formData.infraestructuraPorSector?.aguaGas?.alcantarilladoStatus || 'Sin Reporte', cost: extractCosts(formData.serviciosPublicos?.acueducto) + extractCosts(formData.serviciosPublicos?.alcantarillado) },
                            { name: 'Red de Energía', status: formData.infraestructuraPorSector?.energia?.personasSinServicio > 0 ? 'Interrumpido' : 'Normal', cost: extractCosts(formData.serviciosPublicos?.energia) },
                            { name: 'Infraestructura Educativa', status: `${formData.infraestructuraPorSector?.educacionMedia?.institucionesAfectadas || 0} Sedes Afectadas`, cost: extractCosts(formData.infraestructuraPorSector?.educacionMedia) },
                            { name: 'Infraestructura de Salud', status: `${formData.infraestructuraPorSector?.salud?.centrosAfectados || 0} Sedes Afectadas`, cost: extractCosts(formData.infraestructuraPorSector?.salud) },
                            { name: 'Malla Vial Municipal', status: `${formData.infraestructuraPorSector?.transporteVias?.viasPrimarias?.cantidad || 0} m Impactados`, cost: extractCosts(formData.infraestructuraPorSector?.transporteVias) },
                            { name: 'Vivienda Habitacional', status: `${formData.danosVivienda?.destruidas?.cantidad || 0} Destruidas / ${(formData.danosVivienda?.grave?.cantidad || 0) + (formData.danosVivienda?.moderado?.cantidad || 0) + (formData.danosVivienda?.leve?.cantidad || 0)} Averiadas`, cost: extractCosts(formData.danosVivienda) }
                          ].map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                               <td className="px-8 py-5">
                                  <p className="font-black text-slate-800 text-xs uppercase">{row.name}</p>
                               </td>
                               <td className="px-8 py-5">
                                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${row.status.includes('Inter') || row.status.includes('Falla') || row.status.includes('Afectada') || Number(row.status.split(' ')[0]) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                    {row.status}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right font-black text-slate-900">$ {row.cost.toLocaleString()}</td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>

                 <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 mt-12">
                   <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-200">
                        <Activity className="text-indigo-600" size={32} />
                      </div>
                      <div>
                        <p className="text-xl font-black text-indigo-900">Capacidad Operativa de Respuesta</p>
                        <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-1">Gestión Local y Territorial</p>
                      </div>
                   </div>
                   <div className="flex gap-4">
                      <div className="text-center bg-white px-8 py-4 rounded-2xl shadow-sm border border-indigo-100">
                        <p className="text-[9px] font-black text-indigo-300 uppercase">Esfuerzo PMU</p>
                        <p className="text-xl font-black text-indigo-900">{formData.costosOperativos?.reunionesPMU?.length || 0}</p>
                        <p className="text-[8px] font-bold text-slate-400">Sesiones</p>
                      </div>
                      <div className="text-center bg-white px-8 py-4 rounded-2xl shadow-sm border border-indigo-100">
                        <p className="text-[9px] font-black text-indigo-300 uppercase">Despliegue</p>
                        <p className="text-xl font-black text-indigo-900">{formData.costosOperativos?.comisionesSugeridas?.length || 0}</p>
                        <p className="text-[8px] font-bold text-slate-400">Comisiones</p>
                      </div>
                   </div>
                 </div>

                 <div className="mt-12 flex justify-end gap-4 relative z-10 print:hidden">
                    <button 
                      onClick={() => window.print()}
                      className="px-8 py-4 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center gap-3 shadow-2xl shadow-slate-200"
                    >
                      <Printer size={20} /> Generar Expediente PDF Professional
                    </button>
                 </div>
              </div>

              {/* Boton de Guardado Final - Rediseñado */}
              <div className="bg-gradient-to-r from-indigo-900 to-slate-900 p-12 rounded-[5rem] text-white flex flex-col lg:flex-row items-center justify-between gap-10 shadow-3xl shadow-indigo-300">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/20">
                    <Save className="text-indigo-300" size={36} />
                  </div>
                  <div className="text-center md:text-left">
                    <h3 className="text-3xl font-black tracking-tight mb-2">Finalizar Consolidación Técnica</h3>
                    <p className="text-indigo-300 font-bold text-sm max-w-xl">
                      Al proceder, los datos serán indexados en el Repositorio Nacional de Gestión del Riesgo para la activación inmediata de recursos y fondos de recuperación.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => onSave(formData)}
                  className="w-full lg:w-auto px-12 py-6 bg-white text-indigo-900 rounded-[2.5rem] font-black uppercase tracking-[0.2em] hover:bg-indigo-50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shrink-0"
                >
                  <Save size={24} /> Guardar EDANPRI Final
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Nav */}
      <div className="p-6 bg-white border-t border-slate-200 flex justify-between items-center shrink-0">
        <button 
          onClick={() => setActiveStep(prev => Math.max(0, prev - 1))}
          disabled={activeStep === 0}
          className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center gap-2 disabled:opacity-30"
        >
          <ChevronLeft size={18} /> Anterior
        </button>
        
        <div className="flex gap-2">
          {steps.map((_, idx) => (
            <div key={idx} className={`w-2 h-2 rounded-full transition-all ${activeStep === idx ? 'w-8 bg-indigo-600' : 'bg-slate-200'}`} />
          ))}
        </div>

        {activeStep < steps.length - 1 ? (
          <button 
            onClick={() => setActiveStep(prev => Math.min(steps.length - 1, prev + 1))}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2"
          >
            Siguiente <ChevronRight size={18} />
          </button>
        ) : (
          <button 
            onClick={() => onSave(formData)}
            className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
          >
            <Save size={18} /> Guardar Todo
          </button>
        )}
      </div>
      {/* Modal de Extracción IA */}
      {showExtractionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Activity size={24} />
                Extracción Inteligente de EDAN
              </h3>
              <button onClick={() => setShowExtractionModal(false)} className="text-indigo-200 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4">
                Suba el documento EDAN en formato PDF o pegue el texto. El sistema extraerá automáticamente la información de población, infraestructura, necesidades, maquinaria y costos operativos, y guardará el documento en el repositorio.
              </p>
              
              <div className="mb-4">
                <AIProviderSelector />
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Subir Documento (PDF)</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setSelectedFile(e.target.files[0]);
                        setPastedText(''); // Clear text if file is selected
                      }
                    }}
                    className="hidden" 
                    id="edan-file-upload" 
                  />
                  <label 
                    htmlFor="edan-file-upload"
                    className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${selectedFile ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <FileUp size={24} />
                    <span className="font-medium">
                      {selectedFile ? selectedFile.name : 'Seleccionar archivo PDF'}
                    </span>
                  </label>
                  {selectedFile && (
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-medium">O pegar texto</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => {
                  setPastedText(e.target.value);
                  if (e.target.value) setSelectedFile(null); // Clear file if text is pasted
                }}
                disabled={!!selectedFile}
                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none mb-4 disabled:opacity-50"
                placeholder="Pegue el contenido del documento EDAN aquí..."
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowExtractionModal(false);
                    setSelectedFile(null);
                    setPastedText('');
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnalyzeText}
                  disabled={isAnalyzing || (!pastedText.trim() && !selectedFile)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Extraer Datos
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
