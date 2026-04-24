import React, { useState, useRef, useEffect } from 'react';
import { Shield, Activity, Database, Layers, BrainCircuit, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, DollarSign, Map as MapIcon, Info, Download, Send, Loader2, Edit2, Save, X, Plus, Settings, Trash2, ArrowLeft, CloudRain, Waves, Sun, Flame, Mountain, Zap, Truck } from 'lucide-react';
import { PublicAsset, TerritoryRiskProfile, FinancialInstrument, InstrumentType } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { generateContent, getAIModel } from '../services/aiProviderService';
import ReactMarkdown from 'react-markdown';
import { FinancialMap } from './FinancialMap';
import { AIProviderSelector } from './AIProviderSelector';

// --- MOCK DATA ---
const initialAssets: PublicAsset[] = [
  { id: 'A001', nombre: 'Hospital Universitario Hernando Moncaleano Perdomo', sector: 'Salud', departamento: 'Huila', municipio: 'Neiva', valorReposicion: 120000000000, valorAsegurado: 80000000000, nivelRiesgo: 'Crítico', tipoSeguro: 'Tradicional', criticidadOperativa: 'Esencial' },
  { id: 'A002', nombre: 'Acueducto Municipal Pitalito', sector: 'Agua y Saneamiento', departamento: 'Huila', municipio: 'Pitalito', valorReposicion: 45000000000, valorAsegurado: 45000000000, nivelRiesgo: 'Alto', tipoSeguro: 'Todo Riesgo', criticidadOperativa: 'Esencial' },
  { id: 'A003', nombre: 'Institución Educativa Nacional Dante Alighieri', sector: 'Educación', departamento: 'Huila', municipio: 'San Vicente del Caguán', valorReposicion: 15000000000, valorAsegurado: 5000000000, nivelRiesgo: 'Medio', tipoSeguro: 'Tradicional', criticidadOperativa: 'Alta' },
  { id: 'A004', nombre: 'Puente Paso del Colegio', sector: 'Transporte', departamento: 'Huila', municipio: 'La Plata', valorReposicion: 85000000000, valorAsegurado: 0, nivelRiesgo: 'Crítico', tipoSeguro: 'Ninguno', criticidadOperativa: 'Esencial' },
  { id: 'A005', nombre: 'Subestación Eléctrica Altamira', sector: 'Energía', departamento: 'Huila', municipio: 'Altamira', valorReposicion: 30000000000, valorAsegurado: 30000000000, nivelRiesgo: 'Medio', tipoSeguro: 'Paramétrico', criticidadOperativa: 'Alta' },
  { id: 'A006', nombre: 'Gobernación del Huila (Sede Central)', sector: 'Administrativo', departamento: 'Huila', municipio: 'Neiva', valorReposicion: 60000000000, valorAsegurado: 55000000000, nivelRiesgo: 'Bajo', tipoSeguro: 'Tradicional', criticidadOperativa: 'Media' },
];

const initialRiskProfiles: TerritoryRiskProfile[] = [
  { 
    departamento: 'Huila', irftScore: 72, exposicionFisica: 85, exposicionEconomica: 68, exposicionSocial: 75, pmp: 250000000000, pae: 45000000000,
    parametrosFiscales: { presupuestoAnual: 1200000000000, icld: 300000000000, fondoContingencia: 10000000000, capacidadEndeudamiento: 50000000000 }
  },
  { 
    departamento: 'Cundinamarca', irftScore: 45, exposicionFisica: 50, exposicionEconomica: 80, exposicionSocial: 40, pmp: 500000000000, pae: 80000000000,
    parametrosFiscales: { presupuestoAnual: 4500000000000, icld: 1200000000000, fondoContingencia: 50000000000, capacidadEndeudamiento: 200000000000 }
  },
  { departamento: 'Antioquia', irftScore: 65, exposicionFisica: 70, exposicionEconomica: 75, exposicionSocial: 60, pmp: 400000000000, pae: 70000000000 },
  { departamento: 'Chocó', irftScore: 85, exposicionFisica: 90, exposicionEconomica: 40, exposicionSocial: 95, pmp: 150000000000, pae: 30000000000 },
];

const baseLayers = [
  { id: 'l1', name: 'Capa 1: Retención', color: '#10b981', type: 'Frecuente / Baja Severidad' },
  { id: 'l2', name: 'Capa 2: Financiación Contingente', color: '#3b82f6', type: 'Eventos Medios' },
  { id: 'l3', name: 'Capa 3: Transferencia de Riesgo', color: '#8b5cf6', type: 'Eventos Severos' },
  { id: 'l4', name: 'Capa 4: Transferencia Alternativa', color: '#ef4444', type: 'Eventos Catastróficos' }
];

const initialInstruments: FinancialInstrument[] = [
  {
    id: 'inst1', layerId: 'l1', name: 'Fondo Departamental GRD', type: 'Fondo GRD',
    capacity: 20000000000, cost: 0, activationTrigger: 'Declaratoria Calamidad Pública',
    liquidityTime: '1-5 días', status: 'Activo', parameters: {}
  },
  {
    id: 'inst2', layerId: 'l1', name: 'Reserva Presupuestal', type: 'Reserva Presupuestal',
    capacity: 30000000000, cost: 0, activationTrigger: 'Agotamiento Fondo GRD',
    liquidityTime: '15 días', status: 'Activo', parameters: {}
  },
  {
    id: 'inst3', layerId: 'l2', name: 'Crédito Contingente CAT DDO', type: 'Crédito Contingente',
    capacity: 100000000000, cost: 500000000, activationTrigger: 'Declaratoria Desastre',
    liquidityTime: '30 días', status: 'Activo', parameters: { commitmentFee: 0.5, interestRate: 7.5 }
  },
  {
    id: 'inst4', layerId: 'l3', name: 'Seguro Paramétrico Terremoto', type: 'Seguro Paramétrico',
    capacity: 150000000000, cost: 4500000000, activationTrigger: 'Sismo > 7.0 Mw (USGS)',
    liquidityTime: '14 días', status: 'Activo', parameters: { triggerType: 'Magnitud Sísmica', triggerValue: 7.0, payoutStructure: 'Step' }
  },
  {
    id: 'inst5', layerId: 'l3', name: 'Póliza Todo Riesgo Daño Material', type: 'Seguro Tradicional',
    capacity: 100000000000, cost: 3000000000, activationTrigger: 'Daño físico comprobado',
    liquidityTime: '90-180 días', status: 'Activo', parameters: { deductible: 10 }
  },
  {
    id: 'inst6', layerId: 'l4', name: 'Bono Catastrófico (CAT Bond) Andino', type: 'Cat Bond',
    capacity: 600000000000, cost: 12000000000, activationTrigger: 'Sismo > 7.5 Mw o Lluvia > 500mm',
    liquidityTime: '30 días', status: 'En Estructuración', parameters: { triggerType: 'Multi-peril', couponRate: 8.5 }
  }
];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
};

const formatBillions = (value: number) => {
  return `$${(value / 1000000000).toFixed(1)}B`;
};

const layeringStrategyData = [
  {
    id: 1,
    title: "CAPA 1 — Eventos Frecuentes / Bajo Impacto",
    subtitle: "Retención de Riesgo",
    color: "emerald",
    bgClass: "bg-emerald-50",
    borderClass: "border-emerald-200",
    textClass: "text-emerald-800",
    iconClass: "text-emerald-600",
    instruments: [
      {
        name: "Fondo Territorial de GRD",
        reason: "Primera línea de defensa para emergencias recurrentes (inundaciones menores, deslizamientos locales). Es ineficiente pagar primas de seguro por eventos que ocurren casi todos los años.",
        costBenefit: "Alto beneficio. El costo es el costo de oportunidad del capital inmovilizado.",
        liquidity: "Inmediata (1-5 días)",
        pros: ["Control total local", "Ejecución inmediata sin intermediarios"],
        cons: ["Capacidad muy limitada", "Riesgo de desfinanciamiento rápido"]
      },
      {
        name: "Reserva Presupuestal y Reasignación",
        reason: "Flexibilidad para reorientar recursos de proyectos no prioritarios ante una emergencia que supera levemente el Fondo de GRD.",
        costBenefit: "Cero costo financiero directo, pero alto costo de oportunidad y político.",
        liquidity: "Rápida (1-3 semanas)",
        pros: ["No requiere instrumentos financieros externos ni pago de primas"],
        cons: ["Retrasa el plan de desarrollo", "Requiere trámites administrativos (Asamblea/Concejo)"]
      }
    ]
  },
  {
    id: 2,
    title: "CAPA 2 — Eventos Moderados / Impacto Medio",
    subtitle: "Financiación Contingente",
    color: "blue",
    bgClass: "bg-blue-50",
    borderClass: "border-blue-200",
    textClass: "text-blue-800",
    iconClass: "text-blue-600",
    instruments: [
      {
        name: "Créditos Contingentes",
        reason: "Eventos que superan la capacidad de retención pero no son lo suficientemente catastróficos para justificar el alto costo de transferencia de riesgo. Actúan como un 'descubierto' preaprobado.",
        costBenefit: "Costo de estructuración y comisión de disponibilidad bajo. Solo se pagan intereses si se utiliza.",
        liquidity: "Rápida (1-3 meses)",
        pros: ["Liquidez garantizada post-desastre", "Más barato que el seguro para esta capa"],
        cons: ["Aumenta la deuda pública", "Requiere espacio fiscal y calificación crediticia"]
      }
    ]
  },
  {
    id: 3,
    title: "CAPA 3 — Eventos Severos / Alto Impacto",
    subtitle: "Transferencia de Riesgo",
    color: "purple",
    bgClass: "bg-purple-50",
    borderClass: "border-purple-200",
    textClass: "text-purple-800",
    iconClass: "text-purple-600",
    instruments: [
      {
        name: "Seguros Paramétricos",
        reason: "Ideales para inyección rápida de liquidez basada en la intensidad del evento (ej. magnitud de sismo, mm de lluvia), sin esperar evaluación de daños.",
        costBenefit: "Prima moderada/alta. Excelente beneficio por la velocidad de pago.",
        liquidity: "Muy Rápida (2-4 semanas)",
        pros: ["Pago transparente y rápido", "Libre destinación de los recursos"],
        cons: ["Riesgo de base (puede haber daño y que no se active el parámetro)"]
      },
      {
        name: "Seguros Indemnizatorios (Tradicionales)",
        reason: "Protección del patrimonio (infraestructura crítica del RUNAPE). Cubren el valor real de reconstrucción de los activos.",
        costBenefit: "Prima basada en el riesgo del activo. Alto beneficio para recuperación a largo plazo.",
        liquidity: "Lenta (3-12 meses)",
        pros: ["Cubre el daño real exacto", "Protege el balance del territorio"],
        cons: ["Ajuste de siniestros lento", "Deducibles altos", "Posibles disputas"]
      },
      {
        name: "Pool de Aseguramiento Territorial",
        reason: "Agrupación de varios municipios/departamentos para comprar seguros conjuntos, diluyendo el riesgo y ganando poder de negociación.",
        costBenefit: "Reduce el costo de las primas por economías de escala y diversificación geográfica.",
        liquidity: "Variable (según el seguro subyacente)",
        pros: ["Primas más baratas", "Acceso a mejores reaseguradores"],
        cons: ["Alta complejidad institucional y jurídica para crearlo"]
      }
    ]
  },
  {
    id: 4,
    title: "CAPA 4 — Eventos Catastróficos / Extremos",
    subtitle: "Transferencia Alternativa y Respaldo Soberano",
    color: "rose",
    bgClass: "bg-rose-50",
    borderClass: "border-rose-200",
    textClass: "text-rose-800",
    iconClass: "text-rose-600",
    instruments: [
      {
        name: "Bonos Catastróficos (CAT Bonds)",
        reason: "Para eventos de cola (ej. sismo > 7.5). El mercado asegurador tradicional puede no tener capacidad; se transfiere el riesgo al mercado de capitales.",
        costBenefit: "Alto costo de estructuración. Solo se justifica para exposiciones masivas.",
        liquidity: "Rápida (1-2 meses si se activa el trigger)",
        pros: ["Gran capacidad financiera", "Cero riesgo de crédito (colateralizado)"],
        cons: ["Estructuración muy costosa y compleja", "Pérdida total del principal para el inversor"]
      },
      {
        name: "Instrumentos Soberanos Compartidos",
        reason: "El territorio no puede soportar este nivel de riesgo solo. Requiere el respaldo de la Nación (ej. FNG, declaratoria de desastre nacional).",
        costBenefit: "Costo transferido a la Nación. Beneficio de supervivencia institucional.",
        liquidity: "Variable (depende de la agilidad del Gobierno Central)",
        pros: ["Respaldo del gobierno central", "Capacidad casi ilimitada"],
        cons: ["Pérdida de autonomía", "Riesgo moral (esperar que la Nación siempre pague)"]
      }
    ]
  }
];

const PARAMETRIC_TEMPLATES = [
  {
    id: 'tp_lluvia',
    amenaza: 'Lluvia Extrema / Deslizamientos',
    triggerType: 'Lluvia Acumulada',
    triggerUnit: 'mm',
    triggerValue: 150,
    payoutStructure: 'Step',
    source: 'IDEAM / Satélite GPM'
  },
  {
    id: 'tp_inundacion',
    amenaza: 'Inundación Fluvial',
    triggerType: 'Nivel del Río',
    triggerUnit: 'm',
    triggerValue: 5.5,
    payoutStructure: 'Linear',
    source: 'IDEAM (Sensores limnimétricos)'
  },
  {
    id: 'tp_sismo',
    amenaza: 'Sismo (Terremoto)',
    triggerType: 'Magnitud Sísmica',
    triggerUnit: 'Mw',
    triggerValue: 7.0,
    payoutStructure: 'Step',
    source: 'SGC / USGS'
  },
  {
    id: 'tp_sequia',
    amenaza: 'Sequía (Déficit Hídrico)',
    triggerType: 'Índice de Precipitación (SPI)',
    triggerUnit: 'SPI',
    triggerValue: -1.5,
    payoutStructure: 'Linear',
    source: 'IDEAM / Satélite CHIRPS'
  },
  {
    id: 'tp_incendio',
    amenaza: 'Incendio Forestal',
    triggerType: 'Área Quemada',
    triggerUnit: 'Hectáreas',
    triggerValue: 500,
    payoutStructure: 'Linear',
    source: 'Satélite FIRMS/MODIS'
  },
  {
    id: 'tp_volcan',
    amenaza: 'Erupción Volcánica',
    triggerType: 'Altura Columna Ceniza',
    triggerUnit: 'km',
    triggerValue: 10,
    payoutStructure: 'Binary',
    source: 'SGC / VAAC'
  },
  {
    id: 'tp_frio',
    amenaza: 'Evento Anómalo (Frente Frío)',
    triggerType: 'Temperatura Mínima',
    triggerUnit: '°C',
    triggerValue: 5,
    payoutStructure: 'Step',
    source: 'IDEAM / Estaciones Automáticas'
  }
];

export const ProteccionFinanciera: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mapa' | 'irft' | 'runape' | 'layering' | 'parametricos' | 'modelo-fiscal' | 'mic-r' | 'ia'>('mapa');
  const [eventSeverity, setEventSeverity] = useState<number>(100); // in Billions COP
  
  // Data States
  const [assets, setAssets] = useState<PublicAsset[]>(initialAssets);
  const [riskProfiles, setRiskProfiles] = useState<TerritoryRiskProfile[]>(initialRiskProfiles);
  const [instruments, setInstruments] = useState<FinancialInstrument[]>(initialInstruments);
  
  // Selection States
  const [selectedDept, setSelectedDept] = useState<string>('Huila');
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>('');
  
  // Municipal Risk Characterization State
  const [municipalRisk, setMunicipalRisk] = useState({
    poblacionExpuesta: '',
    infraestructuraExpuesta: '',
    valorExpuesto: '',
    historicoEventos: '',
    analisisContraloria: ''
  });
  const [isEstimatingRisk, setIsEstimatingRisk] = useState(false);
  
  // Edit States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editingProfileData, setEditingProfileData] = useState<TerritoryRiskProfile | null>(null);
  
  const [isInstrumentModalOpen, setIsInstrumentModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState<FinancialInstrument | null>(null);

  const [isEditingAsset, setIsEditingAsset] = useState(false);
  const [editingAssetData, setEditingAssetData] = useState<Partial<PublicAsset> | null>(null);
  const [showInsuranceStrategy, setShowInsuranceStrategy] = useState(false);

  // Chat State
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: 'Hola. Soy el Motor IA de Protección Financiera. He analizado el RUNAPE y el perfil de riesgo del territorio. ¿En qué puedo ayudarte? Por ejemplo, puedes preguntarme sobre brechas de aseguramiento o recomendaciones de cobertura.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const currentProfile = riskProfiles.find(p => p.departamento === selectedDept);
  const currentAssets = assets.filter(a => a.departamento === selectedDept);

  const handleCreateProfile = () => {
    const newProfile: TerritoryRiskProfile = {
      departamento: selectedDept,
      irftScore: 0,
      exposicionFisica: 0,
      exposicionEconomica: 0,
      exposicionSocial: 0,
      pmp: 0,
      pae: 0
    };
    setRiskProfiles([...riskProfiles, newProfile]);
    setEditingProfileData(newProfile);
    setIsEditingProfile(true);
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isTyping) return;
    
    const userMsg = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const prompt = `
        Actúa como un experto nacional e internacional en Protección Financiera para la Gestión del Riesgo de Desastres, especializado en:
        - Ley 1523 de 2012 y Estrategia Nacional de GFRD de Colombia
        - Modelos del Banco Mundial / MHCP / SECO / GFDRR
        - Seguros soberanos y territoriales, Gestión fiscal territorial y Riesgo catastrófico.

        Tu función es analizar la información del territorio y estructurar una Estrategia Integral de Protección Financiera Territorial con enfoque técnico, fiscal, actuarial, institucional y operativo.
        Responde como consultor senior del Banco Mundial, estructurador de política pública y experto en riesgo fiscal territorial.
        NO des respuestas genéricas. Construye modelos técnicos accionables, metodologías, matrices y propuestas implementables.
        
        Tienes acceso al Registro Único Nacional de Activos Públicos Expuestos (RUNAPE) del departamento de ${selectedDept}:
        ${JSON.stringify(currentAssets)}

        Y al Perfil de Riesgo del Territorio (${selectedDept}):
        ${JSON.stringify(currentProfile || 'Sin datos estructurados aún')}
        
        Instrumentos Financieros Actuales:
        ${JSON.stringify(instruments)}

        Consulta del usuario: "${userMsg}"
        
        Instrucciones adicionales:
        1. Basa tus respuestas en los datos proporcionados, pero aplica tu conocimiento experto para llenar vacíos metodológicos.
        2. Si el usuario pregunta por brechas, identifica los activos donde valorAsegurado < valorReposicion.
        3. Recomienda instrumentos financieros adecuados (Fondos GRD, Créditos contingentes, Seguros paramétricos, Bonos catastróficos).
        4. Usa formato Markdown para estructurar tu respuesta (listas, negritas, tablas si es necesario).
      `;

      const response = await generateContent(prompt, getAIModel());
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud financiera. Por favor, verifica tu conexión o la configuración de la API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSpecializedAnalysis = async (type: 'marco_experto' | 'diagnostico_madurez' | 'riesgo_fiscal' | 'estrategia_capas' | 'aseguramiento_activos' | 'parametricos' | 'fondo_territorial' | 'auditoria' | 'roadmap' | 'benchmarking' | 'conpes') => {
    if (isTyping) return;
    
    let userMsg = '';
    let systemPrompt = '';

    const baseContext = `
      Contexto del territorio (${selectedDept}):
      RUNAPE: ${JSON.stringify(currentAssets)}
      Perfil de Riesgo: ${JSON.stringify(currentProfile || 'Sin datos estructurados aún')}
      Instrumentos Financieros Actuales: ${JSON.stringify(instruments)}
    `;

    switch (type) {
      case 'marco_experto':
        userMsg = '621 → Marco experto base';
        systemPrompt = `Actúa como experto base en Protección Financiera para la Gestión del Riesgo de Desastres. Define el marco conceptual, normativo (Ley 1523) y los principios rectores para la estrategia de protección financiera del departamento de ${selectedDept}. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'diagnostico_madurez':
        userMsg = '622 → Diagnóstico madurez';
        systemPrompt = `Realiza un diagnóstico de madurez institucional y financiera de la gestión del riesgo en el departamento de ${selectedDept}. Evalúa capacidad institucional, calidad de datos históricos, gobernanza y cultura de aseguramiento. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'riesgo_fiscal':
        userMsg = '623 → Riesgo fiscal';
        systemPrompt = `Analiza el riesgo fiscal del departamento de ${selectedDept}. Identifica pasivos contingentes por desastres naturales, brechas de financiamiento histórico y exposición del presupuesto territorial. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'estrategia_capas':
        userMsg = '624 → Estrategia por capas';
        systemPrompt = `Diseña una estrategia de retención y transferencia de riesgo por capas (Risk Layering) adaptada al perfil de riesgo del departamento de ${selectedDept}. Define instrumentos específicos para eventos de alta, media y baja frecuencia. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'aseguramiento_activos':
        userMsg = '625 → Aseguramiento activos';
        systemPrompt = `Evalúa el estado de aseguramiento de los activos públicos (RUNAPE) del departamento de ${selectedDept}. Identifica subaseguramiento, propone esquemas de aseguramiento masivo, optimización de pólizas y estrategias de retención. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'parametricos':
        userMsg = '626 → Paramétricos';
        systemPrompt = `Estructura opciones de seguros paramétricos y/o bonos catastróficos para el departamento de ${selectedDept}. Define posibles triggers (lluvia extrema, sismo, sequía), umbrales, poblaciones/sectores objetivo y mecanismos de pago rápido. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'fondo_territorial':
        userMsg = '627 → Fondo territorial';
        systemPrompt = `Diseña la arquitectura financiera, institucional y operativa de un Fondo Territorial de Gestión del Riesgo (Fondo GRD) o subcuenta específica para el departamento de ${selectedDept}. Incluye fuentes de fondeo y reglas de uso. Usa formato Markdown.\n${baseContext}`;
        break;
      case 'auditoria':
        userMsg = '628 → Auditoría/control';
        systemPrompt = `Actúa como auditor de control fiscal especializado en protección financiera pública para el departamento de ${selectedDept}.
        Evalúa:
        - Cumplimiento de aseguramiento obligatorio de bienes públicos
        - Riesgos de responsabilidad fiscal
        - Omisiones en protección financiera
        - Subaseguramiento crítico
        - Ineficiencias contractuales en pólizas
        - Posibles hallazgos disciplinarios/fiscales

        Entrega: matriz de hallazgos, nivel de riesgo, impacto probable, recomendación correctiva.
        Usa formato Markdown.\n${baseContext}`;
        break;
      case 'roadmap':
        userMsg = '629 → Roadmap';
        systemPrompt = `Construye un roadmap de implementación de la Estrategia de Protección Financiera Territorial a 4 años para el departamento de ${selectedDept}.
        Organiza por: FASE 1 — Fundacional, FASE 2 — Fortalecimiento, FASE 3 — Instrumentación, FASE 4 — Optimización.
        Incluye: actividades, responsables, dependencias, quick wins, hitos regulatorios, cronograma, KPIs.
        Usa formato Markdown.\n${baseContext}`;
        break;
      case 'benchmarking':
        userMsg = '630 → Benchmark internacional';
        systemPrompt = `Compara la estrategia territorial propuesta para el departamento de ${selectedDept} con mejores prácticas internacionales de protección financiera (México FONDEN, CCRIF Caribe, Chile Cat Bonds, Perú Protección Fiscal, Estrategias Banco Mundial, Colombia MHCP GFRD).
        Identifica: brechas frente a estándar internacional, innovaciones aplicables, oportunidades de mejora, recomendaciones de adaptación territorial.
        Usa formato Markdown.\n${baseContext}`;
        break;
      case 'conpes':
        userMsg = 'Generar Documento CONPES Territorial';
        systemPrompt = `Actúa como el DNP y el MHCP. Redacta un Documento tipo CONPES (Política Pública Territorial) que consolide la Estrategia Integral de Protección Financiera para el departamento de ${selectedDept}. 
        Integra de forma ejecutiva y estructurada: Diagnóstico de vulnerabilidad fiscal, Arquitectura de seguros públicos, Estrategia de Risk Layering, Plan operativo de implementación y Sistema de recomendación financiera.
        Este es el RESULTADO FINAL de la cadena de valor. Usa formato Markdown formal de política pública.\n${baseContext}`;
        break;
    }

    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await generateContent(systemPrompt, getAIModel());
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lo siento, ha ocurrido un error al procesar tu solicitud financiera. Por favor, verifica tu conexión o la configuración de la API.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEstimateMunicipalRisk = async () => {
    if (!selectedDept || !selectedMunicipio) {
      alert("Por favor, selecciona un departamento y escribe el nombre del municipio.");
      return;
    }
    
    setIsEstimatingRisk(true);
    try {
      const prompt = `
        Actúa como un experto en gestión de riesgo de desastres y finanzas públicas territoriales en Colombia.
        Necesito caracterizar el riesgo y la exposición financiera para el municipio de ${selectedMunicipio} en el departamento de ${selectedDept}.
        
        Ten en cuenta el contexto reciente donde la Contraloría cuestionó los cálculos del Gobierno para decretar emergencia económica por crisis climática, señalando inconsistencias en las cifras, vacíos metodológicos e incertidumbre en el análisis de recursos y hectáreas afectadas. 
        
        Para evitar estos vacíos metodológicos, proporciona estimaciones realistas, fundamentadas y estructuradas para este municipio específico.
        
        Devuelve un objeto JSON con la siguiente estructura exacta:
        {
          "poblacionExpuesta": "Estimación de personas expuestas a amenazas principales (ej. 15,000 habitantes en zonas de inundación).",
          "infraestructuraExpuesta": "Lista de infraestructura crítica expuesta (ej. 3 colegios, 1 hospital nivel 1, 45km de vías terciarias).",
          "valorExpuesto": "Estimación del valor expuesto en COP (ej. $50,000,000,000 COP).",
          "historicoEventos": "Resumen de la frecuencia histórica de eventos (ej. Inundaciones recurrentes cada 3-5 años durante La Niña).",
          "analisisContraloria": "Breve análisis de cómo esta caracterización ayuda a mitigar las observaciones de la Contraloría sobre vacíos metodológicos."
        }
      `;

      const responseText = await generateContent(prompt, getAIModel(), {
        responseMimeType: "application/json",
      });
      
      try {
        const data = JSON.parse(responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
        setMunicipalRisk(data);
      } catch (e) {
        console.error("Failed to parse JSON response:", e);
        alert("Error al procesar la respuesta de la IA. Por favor, intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error estimating municipal risk:", error);
      alert("Error al estimar el riesgo municipal. Verifica tu conexión o API key.");
    } finally {
      setIsEstimatingRisk(false);
    }
  };

  // Calculate RUNAPE metrics
  const totalReposicion = currentAssets.reduce((sum, asset) => sum + asset.valorReposicion, 0);
  const totalAsegurado = currentAssets.reduce((sum, asset) => sum + asset.valorAsegurado, 0);
  const brechaAseguramiento = totalReposicion - totalAsegurado;
  const porcentajeCobertura = totalReposicion > 0 ? (totalAsegurado / totalReposicion) * 100 : 0;

  const getLayerActivation = (severityBillions: number) => {
    let remaining = severityBillions * 1000000000;
    
    return baseLayers.map(layer => {
      const layerInstruments = instruments.filter(i => i.layerId === layer.id && i.status === 'Activo');
      const capacityCOP = layerInstruments.reduce((sum, i) => sum + i.capacity, 0);
      const capacityBillions = capacityCOP / 1000000000;
      
      let activatedCOP = 0;
      if (remaining > 0) {
        activatedCOP = Math.min(remaining, capacityCOP);
        remaining -= activatedCOP;
      }
      
      return {
        ...layer,
        capacity: capacityBillions,
        activated: activatedCOP / 1000000000,
        isFullyExhausted: activatedCOP === capacityCOP && capacityCOP > 0 && remaining > 0,
        instruments: layerInstruments
      };
    });
  };

  const activeLayers = getLayerActivation(eventSeverity);

  const handleSaveProfile = () => {
    if (editingProfileData) {
      setRiskProfiles(prev => prev.map(p => p.departamento === editingProfileData.departamento ? editingProfileData : p));
      setIsEditingProfile(false);
    }
  };

  const handleSaveInstrument = () => {
    if (editingInstrument) {
      if (instruments.find(i => i.id === editingInstrument.id)) {
        setInstruments(prev => prev.map(i => i.id === editingInstrument.id ? editingInstrument : i));
      } else {
        setInstruments(prev => [...prev, editingInstrument]);
      }
      setIsInstrumentModalOpen(false);
    }
  };

  const handleDeleteInstrument = (id: string) => {
    setInstruments(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Protección Financiera Territorial</h1>
            <p className="text-slate-500">Sistema Nacional de Protección Financiera Territorial (SNPFT)</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <AIProviderSelector />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-8 shrink-0">
        <button 
          onClick={() => setActiveTab('mapa')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'mapa' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <MapIcon size={18} />
          Mapa Nacional
        </button>
        <button 
          onClick={() => setActiveTab('irft')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'irft' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Activity size={18} />
          Dashboard IRFT
        </button>
        <button 
          onClick={() => setActiveTab('runape')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'runape' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Database size={18} />
          RUNAPE (Activos)
        </button>
        <button 
          onClick={() => setActiveTab('layering')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'layering' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Layers size={18} />
          Simulador Risk Layering
        </button>
        <button 
          onClick={() => setActiveTab('parametricos')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'parametricos' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <Zap size={18} />
          Seguros Paramétricos
        </button>
        <button 
          onClick={() => setActiveTab('modelo-fiscal')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'modelo-fiscal' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <DollarSign size={18} />
          Modelo Fiscal
        </button>
        <button 
          onClick={() => setActiveTab('ia')}
          className={`flex items-center gap-2 px-6 py-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'ia' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
          <BrainCircuit size={18} />
          Motor IA Financiero
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        
        {/* TAB 0: Mapa Nacional */}
        {activeTab === 'mapa' && (
          <div className="max-w-7xl mx-auto h-full flex flex-col animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Mapa Nacional de Vulnerabilidad Fiscal</h2>
                <p className="text-slate-500">Selecciona un territorio para ver su perfil de riesgo y parametrizar su inventario.</p>
              </div>
              {selectedDept && (
                <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-sm font-medium text-slate-500">Territorio Seleccionado:</span>
                  <span className="font-bold text-indigo-700">{selectedDept}</span>
                  <button 
                    onClick={() => setActiveTab('irft')}
                    className="ml-2 px-3 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors"
                  >
                    Ver Dashboard
                  </button>
                </div>
              )}
            </div>
            <div className="flex-1 min-h-[500px]">
              <FinancialMap 
                riskProfiles={riskProfiles} 
                onSelectTerritory={(dept) => {
                  setSelectedDept(dept);
                  // Optional: setActiveTab('irft');
                }} 
                selectedDept={selectedDept} 
              />
            </div>
          </div>
        )}

        {/* TAB 1: IRFT Dashboard */}
        {activeTab === 'irft' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Dashboard IRFT: {selectedDept}</h2>
                <p className="text-slate-500">Índice de Riesgo Fiscal Territorial y métricas clave.</p>
              </div>
              {currentProfile && (
                <button 
                  onClick={() => {
                    setEditingProfileData(currentProfile);
                    setIsEditingProfile(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                >
                  <Edit2 size={16} />
                  Parametrizar Riesgo
                </button>
              )}
            </div>

            {!currentProfile ? (
              <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 border-dashed">
                <AlertTriangle size={48} className="text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Territorio sin datos fiscales</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">No existe un perfil de riesgo cuantificado para {selectedDept}. Es necesario establecer la línea base actuarial.</p>
                <button 
                  onClick={handleCreateProfile} 
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Estructurar Perfil de Riesgo
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-center items-center text-center">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Índice de Riesgo (IRFT)</p>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                        <path className={`${currentProfile.irftScore > 70 ? 'text-rose-500' : currentProfile.irftScore > 50 ? 'text-orange-500' : currentProfile.irftScore > 30 ? 'text-amber-500' : 'text-emerald-500'}`} strokeDasharray={`${currentProfile.irftScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      </svg>
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-4xl font-black text-slate-800">{currentProfile.irftScore}</span>
                        <span className="text-xs text-slate-500">/ 100</span>
                      </div>
                    </div>
                    <p className={`mt-4 text-sm font-bold px-3 py-1 rounded-full ${currentProfile.irftScore > 70 ? 'text-rose-600 bg-rose-50' : currentProfile.irftScore > 50 ? 'text-orange-600 bg-orange-50' : currentProfile.irftScore > 30 ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>
                      {currentProfile.irftScore > 70 ? 'Nivel Crítico' : currentProfile.irftScore > 50 ? 'Nivel Alto' : currentProfile.irftScore > 30 ? 'Nivel Medio' : 'Nivel Bajo'}
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pérdida Máxima Probable (PMP)</p>
                      <p className="text-3xl font-black text-slate-800">{formatBillions(currentProfile.pmp)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                      <AlertTriangle size={16} className="text-amber-500" />
                      <span>Escenario 1 en 100 años</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pérdida Anual Esperada (PAE)</p>
                      <p className="text-3xl font-black text-slate-800">{formatBillions(currentProfile.pae)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mt-4">
                      <TrendingUp size={16} className="text-indigo-500" />
                      <span>Promedio histórico anual</span>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Brecha de Aseguramiento</p>
                      <p className="text-3xl font-black text-rose-600">{formatBillions(brechaAseguramiento)}</p>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
                      <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${porcentajeCobertura}%` }}></div>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 text-right">{porcentajeCobertura.toFixed(1)}% Cubierto</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Descomposición del Riesgo</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: 'Exposición Física', A: currentProfile.exposicionFisica, fullMark: 100 },
                          { subject: 'Exposición Económica', A: currentProfile.exposicionEconomica, fullMark: 100 },
                          { subject: 'Exposición Social', A: currentProfile.exposicionSocial, fullMark: 100 },
                          { subject: 'Históricos Desastre', A: 80, fullMark: 100 },
                          { subject: 'Proyección Climática', A: 90, fullMark: 100 },
                        ]}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                          <Radar name={selectedDept} dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.5} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Madurez de Protección Financiera</h3>
                    <div className="space-y-6">
                      <div className="relative">
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                        
                        <div className="relative pl-10 pb-6">
                          <div className="absolute left-2.5 top-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-4 ring-emerald-50"></div>
                          <h4 className="font-bold text-slate-800">Nivel 1 — Reactivo</h4>
                          <p className="text-sm text-slate-500">Superado. Se cuenta con estrategia y cuantificación básica.</p>
                        </div>
                        
                        <div className="relative pl-10 pb-6">
                          <div className="absolute left-2.5 top-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white ring-4 ring-emerald-50"></div>
                          <h4 className="font-bold text-slate-800">Nivel 2 — Básico</h4>
                          <p className="text-sm text-slate-500">Superado. Fondos GRD y seguros tradicionales activos.</p>
                        </div>
                        
                        <div className="relative pl-10 pb-6">
                          <div className="absolute left-2.5 top-1 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-white ring-4 ring-indigo-50 animate-pulse"></div>
                          <h4 className="font-bold text-indigo-700">Nivel 3 — Intermedio (Actual)</h4>
                          <p className="text-sm text-indigo-600/80">Inventario asegurado (RUNAPE) y modelo de riesgo fiscal en implementación.</p>
                        </div>
                        
                        <div className="relative pl-10 pb-6">
                          <div className="absolute left-2.5 top-1 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white"></div>
                          <h4 className="font-bold text-slate-400">Nivel 4 — Avanzado</h4>
                          <p className="text-sm text-slate-400">Capas financieras estructuradas y seguros paramétricos.</p>
                        </div>
                        
                        <div className="relative pl-10">
                          <div className="absolute left-2.5 top-1 w-3.5 h-3.5 bg-slate-300 rounded-full border-2 border-white"></div>
                          <h4 className="font-bold text-slate-400">Nivel 5 — Resiliente Inteligente</h4>
                          <p className="text-sm text-slate-400">IA predictiva, optimización dinámica y cobertura integral.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: RUNAPE */}
        {activeTab === 'runape' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            {showInsuranceStrategy ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setShowInsuranceStrategy(false)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                      <ArrowLeft size={20} className="text-slate-600" />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-slate-800">Estrategia Óptima de Aseguramiento Catastrófico</h2>
                      <p className="text-slate-500">Análisis de brechas, priorización y recomendaciones de pólizas por activo en {selectedDept}.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                        <AlertTriangle size={20} />
                      </div>
                      <h3 className="font-bold text-slate-700">Activos en Riesgo Fiscal</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">
                      {currentAssets.filter(a => a.valorReposicion > a.valorAsegurado && (a.criticidadOperativa === 'Esencial' || a.criticidadOperativa === 'Alta')).length}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">Activos críticos subasegurados</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                        <TrendingDown size={20} />
                      </div>
                      <h3 className="font-bold text-slate-700">Brecha Total de Aseguramiento</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{formatBillions(brechaAseguramiento)}</p>
                    <p className="text-sm text-slate-500 mt-1">Déficit de cobertura actual</p>
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <Shield size={20} />
                      </div>
                      <h3 className="font-bold text-slate-700">Cobertura Actual</h3>
                    </div>
                    <p className="text-3xl font-black text-slate-800">{porcentajeCobertura.toFixed(1)}%</p>
                    <p className="text-sm text-slate-500 mt-1">Del valor total de reposición</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="font-bold text-slate-800">Ranking de Priorización de Aseguramiento</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold text-center w-16">Rank</th>
                          <th className="p-4 font-bold">Activo / Criticidad</th>
                          <th className="p-4 font-bold">Exposición / Brecha</th>
                          <th className="p-4 font-bold">Póliza Sugerida</th>
                          <th className="p-4 font-bold text-center">Deducible Rec.</th>
                          <th className="p-4 font-bold text-center">Alerta Fiscal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[...currentAssets].sort((a, b) => {
                          const getScore = (asset: PublicAsset) => {
                            const critScore = { 'Esencial': 4, 'Alta': 3, 'Media': 2, 'Baja': 1 }[asset.criticidadOperativa] || 0;
                            const riskScore = { 'Crítico': 4, 'Alto': 3, 'Medio': 2, 'Bajo': 1 }[asset.nivelRiesgo] || 0;
                            const hasBrecha = asset.valorReposicion > asset.valorAsegurado ? 1 : 0;
                            return (critScore * 10) + (riskScore * 5) + (hasBrecha * 20);
                          };
                          return getScore(b) - getScore(a);
                        }).map((asset, index) => {
                          const isUnderinsured = asset.valorReposicion > asset.valorAsegurado;
                          
                          let polizaSugerida = "Incendio y Terremoto (Básica)";
                          if (asset.criticidadOperativa === 'Esencial' && asset.nivelRiesgo === 'Crítico') {
                            polizaSugerida = "Todo Riesgo + Paramétrico";
                          } else if (asset.nivelRiesgo === 'Alto' || asset.nivelRiesgo === 'Crítico') {
                            polizaSugerida = "Todo Riesgo Daño Material";
                          }

                          let deducible = "2% - 5%";
                          if (asset.nivelRiesgo === 'Crítico') deducible = "10% - 15%";
                          else if (asset.nivelRiesgo === 'Alto') deducible = "5% - 10%";

                          let alertaFiscal = "Cumple";
                          let alertaClass = "bg-emerald-100 text-emerald-700";
                          if (isUnderinsured) {
                            if (asset.criticidadOperativa === 'Esencial' || asset.criticidadOperativa === 'Alta') {
                              alertaFiscal = "Riesgo Alto (Ley 1523)";
                              alertaClass = "bg-rose-100 text-rose-700";
                            } else {
                              alertaFiscal = "Riesgo Medio";
                              alertaClass = "bg-amber-100 text-amber-700";
                            }
                          }

                          return (
                            <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4 text-center font-black text-slate-400">#{index + 1}</td>
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{asset.nombre}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                  Criticidad: <span className="font-bold text-slate-700">{asset.criticidadOperativa}</span>
                                </p>
                              </td>
                              <td className="p-4">
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${
                                  asset.nivelRiesgo === 'Crítico' ? 'bg-rose-100 text-rose-700' :
                                  asset.nivelRiesgo === 'Alto' ? 'bg-orange-100 text-orange-700' :
                                  'bg-slate-100 text-slate-600'
                                }`}>
                                  Riesgo {asset.nivelRiesgo}
                                </span>
                                {isUnderinsured && (
                                  <p className="text-xs font-bold text-rose-600 mt-1">
                                    Brecha: {formatCurrency(asset.valorReposicion - asset.valorAsegurado)}
                                  </p>
                                )}
                              </td>
                              <td className="p-4">
                                <p className="text-sm font-medium text-slate-700">{polizaSugerida}</p>
                              </td>
                              <td className="p-4 text-center font-medium text-slate-600">
                                {deducible}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${alertaClass}`}>
                                  {alertaFiscal}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Registro Único Nacional de Activos Públicos Expuestos</h2>
                    <p className="text-slate-500">Inventario de infraestructura crítica y estado de aseguramiento en {selectedDept}.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setShowInsuranceStrategy(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
                    >
                      <Shield size={16} />
                      Estrategia de Aseguramiento
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium text-sm">
                      <Download size={16} />
                      Exportar RUNAPE
                    </button>
                    <button 
                      onClick={() => {
                        setEditingAssetData({
                          id: `A${Date.now()}`,
                          nombre: '',
                          sector: 'Salud',
                          departamento: selectedDept,
                          municipio: '',
                          valorReposicion: 0,
                          valorAsegurado: 0,
                          nivelRiesgo: 'Medio',
                          tipoSeguro: 'Ninguno',
                          criticidadOperativa: 'Media'
                        });
                        setIsEditingAsset(true);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm"
                    >
                      <Plus size={16} />
                      Añadir Activo
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold">Activo / Ubicación</th>
                          <th className="p-4 font-bold">Sector / Criticidad</th>
                          <th className="p-4 font-bold text-right">Valor Reposición</th>
                          <th className="p-4 font-bold text-right">Valor Asegurado</th>
                          <th className="p-4 font-bold text-right">Brecha (Infraseguro)</th>
                          <th className="p-4 font-bold text-center">Estado</th>
                          <th className="p-4 font-bold text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentAssets.map(asset => {
                          const brecha = asset.valorReposicion - asset.valorAsegurado;
                          const isUnderinsured = brecha > 0;
                          const isUninsured = asset.valorAsegurado === 0;

                          return (
                            <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{asset.nombre}</p>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                  <MapIcon size={12} /> {asset.municipio}, {asset.departamento}
                                </p>
                              </td>
                              <td className="p-4">
                                <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium mb-1">
                                  {asset.sector}
                                </span>
                                <p className="text-xs text-slate-500">
                                  Criticidad: <span className="font-bold text-slate-700">{asset.criticidadOperativa}</span>
                                </p>
                              </td>
                              <td className="p-4 text-right font-medium text-slate-700">
                                {formatCurrency(asset.valorReposicion)}
                              </td>
                              <td className="p-4 text-right font-medium text-slate-700">
                                {formatCurrency(asset.valorAsegurado)}
                              </td>
                              <td className="p-4 text-right">
                                {isUnderinsured ? (
                                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded">
                                    {formatCurrency(brecha)}
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 flex items-center justify-end gap-1 text-sm">
                                    <CheckCircle2 size={14} /> Sin brecha
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                {isUninsured ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                                    <AlertTriangle size={12} /> Sin Seguro
                                  </span>
                                ) : isUnderinsured ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                                    <Info size={12} /> Infraseguro
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                                    <CheckCircle2 size={12} /> Óptimo
                                  </span>
                                )}
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => {
                                    setEditingAssetData(asset);
                                    setIsEditingAsset(true);
                                  }}
                                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                  <Edit2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: Risk Layering */}
        {activeTab === 'layering' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-8">
                <div className="max-w-3xl">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Simulador de Capas Financieras (Risk Layering)</h2>
                  <p className="text-slate-500">
                    Ajusta la severidad del evento (Pérdida estimada en miles de millones) para visualizar cómo respondería la arquitectura financiera del territorio activando diferentes instrumentos.
                  </p>
                </div>
              </div>

              <div className="mb-12">
                <div className="flex justify-between items-end mb-4">
                  <label className="font-bold text-slate-700">Severidad del Evento Simulado</label>
                  <span className="text-3xl font-black text-indigo-600">{formatBillions(eventSeverity * 1000000000)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1000" 
                  step="10"
                  value={eventSeverity}
                  onChange={(e) => setEventSeverity(Number(e.target.value))}
                  className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>0</span>
                  <span>Eventos Frecuentes</span>
                  <span>Eventos Medios</span>
                  <span>Eventos Severos</span>
                  <span>Catástrofe ($1B+)</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Stack Visualization */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6">Activación de Instrumentos</h3>
                  <div className="space-y-3 flex flex-col-reverse">
                    {activeLayers.map((layer, idx) => (
                      <div key={idx} className="relative">
                        <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                          <span>{layer.name}</span>
                          <span>{formatBillions(layer.activated * 1000000000)} / {formatBillions(layer.capacity * 1000000000)}</span>
                        </div>
                        <div className="h-12 w-full bg-slate-100 rounded-lg overflow-hidden relative border border-slate-200">
                          <div 
                            className="absolute top-0 left-0 bottom-0 transition-all duration-500 ease-out flex items-center justify-end pr-4"
                            style={{ 
                              width: layer.capacity > 0 ? `${(layer.activated / layer.capacity) * 100}%` : '0%',
                              backgroundColor: layer.color,
                              opacity: layer.activated > 0 ? 1 : 0.2
                            }}
                          >
                            {layer.activated > 0 && layer.capacity > 0 && (
                              <span className="text-white font-bold text-sm drop-shadow-md">
                                {((layer.activated / layer.capacity) * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {layer.isFullyExhausted && (
                            <div className="absolute inset-0 flex items-center justify-center bg-rose-500/20 backdrop-blur-[1px]">
                              <span className="text-rose-700 font-black text-xs uppercase tracking-widest bg-white/80 px-2 py-1 rounded">Agotado</span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 text-right">{layer.type}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis Panel */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-600" />
                    Análisis del Escenario
                  </h3>
                  
                  <div className="space-y-4">
                    {eventSeverity <= 50 && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg">
                        <p className="text-sm text-emerald-800 font-medium">
                          <strong>Escenario Controlado:</strong> El evento puede ser cubierto en su totalidad por los fondos de retención municipal y departamental (GRD). No se requiere activar líneas de crédito ni seguros.
                        </p>
                      </div>
                    )}
                    {eventSeverity > 50 && eventSeverity <= 200 && (
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">
                          <strong>Tensión de Liquidez:</strong> Los fondos propios se agotan. Es necesario activar líneas de crédito contingente e instrumentos de tesorería de emergencia para cubrir el déficit de {formatBillions((eventSeverity - 50) * 1000000000)}.
                        </p>
                      </div>
                    )}
                    {eventSeverity > 200 && eventSeverity <= 600 && (
                      <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                        <p className="text-sm text-purple-800 font-medium">
                          <strong>Evento Severo:</strong> Capacidad de endeudamiento superada. Se requiere la activación de pólizas de seguros tradicionales y paramétricos para infraestructura crítica.
                        </p>
                      </div>
                    )}
                    {eventSeverity > 600 && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
                        <p className="text-sm text-rose-800 font-medium">
                          <strong>Catástrofe Mayor:</strong> Impacto fiscal extremo. Se requiere la activación de Bonos Catastróficos (CAT Bonds) o reaseguro soberano para evitar el colapso financiero del territorio.
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                      <h4 className="text-xs font-black text-indigo-600 uppercase mb-2">Impacto Fiscal Proyectado (MinHacienda)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Erosión Ingresos</p>
                          <p className="text-sm font-black text-rose-600">-${(eventSeverity * 0.15).toFixed(1)}M</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">Presión Deuda</p>
                          <p className="text-sm font-black text-indigo-600">+{(eventSeverity * 0.05).toFixed(2)}% PIB</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-indigo-400 mt-2 italic">
                        * Datos sincronizados con el Modelo de Impacto Fiscal Territorial.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resumen de Financiación</h4>
                      <ul className="space-y-2">
                        {activeLayers.filter(l => l.activated > 0).map((layer, i) => (
                          <li key={i} className="flex justify-between text-sm">
                            <span className="text-slate-600 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full" style={{backgroundColor: layer.color}}></span>
                              {layer.name}
                            </span>
                            <span className="font-bold text-slate-800">{formatBillions(layer.activated * 1000000000)}</span>
                          </li>
                        ))}
                      </ul>
                      {eventSeverity > 1000 && (
                        <div className="mt-3 p-2 bg-rose-100 text-rose-700 text-xs font-bold rounded flex items-center gap-2">
                          <AlertTriangle size={14} />
                          Déficit no cubierto: {formatBillions((eventSeverity - 1000) * 1000000000)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Portafolio de Instrumentos */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800 mb-2">Portafolio de Instrumentos Financieros</h2>
                  <p className="text-slate-500">
                    Parametriza los instrumentos específicos que componen cada capa de protección.
                  </p>
                </div>
                <button 
                  onClick={() => {
                    setEditingInstrument({
                      id: `inst_${Date.now()}`,
                      layerId: 'l1',
                      name: '',
                      type: 'Fondo GRD',
                      capacity: 0,
                      cost: 0,
                      activationTrigger: '',
                      liquidityTime: '',
                      status: 'En Estructuración',
                      parameters: {}
                    });
                    setIsInstrumentModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm shrink-0"
                >
                  <Plus size={16} />
                  Añadir Instrumento
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                      <th className="p-4 font-bold">Instrumento</th>
                      <th className="p-4 font-bold">Capa</th>
                      <th className="p-4 font-bold">Tipo</th>
                      <th className="p-4 font-bold text-right">Capacidad (Max)</th>
                      <th className="p-4 font-bold text-right">Costo/Prima</th>
                      <th className="p-4 font-bold text-center">Estado</th>
                      <th className="p-4 font-bold text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {instruments.map(inst => (
                      <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4">
                          <p className="font-bold text-slate-800">{inst.name}</p>
                          <p className="text-xs text-slate-500">Trigger: {inst.activationTrigger}</p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium">
                            {baseLayers.find(l => l.id === inst.layerId)?.name.split(':')[0]}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-600">{inst.type}</td>
                        <td className="p-4 text-right font-bold text-slate-700">{formatCurrency(inst.capacity)}</td>
                        <td className="p-4 text-right text-slate-600">{formatCurrency(inst.cost)}</td>
                        <td className="p-4 text-center">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            inst.status === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 
                            inst.status === 'En Estructuración' ? 'bg-amber-100 text-amber-700' : 
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {inst.status}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingInstrument(inst);
                                setIsInstrumentModalOpen(true);
                              }}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Settings size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteInstrument(inst.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Strategy Breakdown */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Estrategia de Protección Financiera por Capas</h2>
              <p className="text-slate-500 mb-8">
                Asignación óptima de instrumentos financieros según la severidad y frecuencia del riesgo, optimizando el costo-beneficio y los tiempos de liquidez.
              </p>

              <div className="space-y-8">
                {layeringStrategyData.map((layer) => (
                  <div key={layer.id} className={`border rounded-2xl overflow-hidden ${layer.borderClass}`}>
                    <div className={`p-4 border-b ${layer.bgClass} ${layer.borderClass} flex items-center gap-3`}>
                      <div className={`p-2 bg-white rounded-lg shadow-sm ${layer.textClass}`}>
                        <Layers size={20} />
                      </div>
                      <div>
                        <h3 className={`font-bold text-lg ${layer.textClass}`}>{layer.title}</h3>
                        <p className={`text-sm font-medium opacity-80 ${layer.textClass}`}>{layer.subtitle}</p>
                      </div>
                    </div>
                    <div className="p-6 bg-white">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {layer.instruments.map((inst, idx) => (
                          <div key={idx} className="bg-slate-50 p-5 rounded-xl border border-slate-100">
                            <h4 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                              <CheckCircle2 size={18} className={layer.iconClass} />
                              {inst.name}
                            </h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <strong className="text-slate-700 block mb-1">Justificación:</strong>
                                <p className="text-slate-600">{inst.reason}</p>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                                <div>
                                  <strong className="text-slate-700 block mb-1">Costo-Beneficio:</strong>
                                  <p className="text-slate-600">{inst.costBenefit}</p>
                                </div>
                                <div>
                                  <strong className="text-slate-700 block mb-1">Liquidez:</strong>
                                  <p className="text-slate-600 font-medium">{inst.liquidity}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                                <div>
                                  <strong className="text-emerald-700 block mb-1">Ventajas:</strong>
                                  <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    {inst.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                                  </ul>
                                </div>
                                <div>
                                  <strong className="text-rose-700 block mb-1">Desventajas:</strong>
                                  <ul className="list-disc pl-4 text-slate-600 space-y-1">
                                    {inst.cons.map((con, i) => <li key={i}>{con}</li>)}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Seguros Paramétricos */}
        {activeTab === 'parametricos' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Estructuración de Seguros Paramétricos</h2>
                <p className="text-slate-500">Diseño conceptual y evaluación de viabilidad para coberturas indexadas en {selectedDept}.</p>
              </div>
            </div>

            {/* Caracterización de Riesgo Municipal */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <MapIcon size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Caracterización de Riesgo Municipal</h3>
                  <p className="text-sm text-slate-500">Parametrización local para evitar inconsistencias metodológicas (Observaciones Contraloría).</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Departamento</label>
                  <input 
                    type="text" 
                    value={selectedDept} 
                    disabled 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Municipio</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={selectedMunicipio} 
                      onChange={(e) => setSelectedMunicipio(e.target.value)}
                      placeholder="Ej. Mocoa, Quibdó, Piojó..."
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                    <button 
                      onClick={handleEstimateMunicipalRisk}
                      disabled={isEstimatingRisk || !selectedMunicipio}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    >
                      {isEstimatingRisk ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Zap size={16} />}
                      Estimar Riesgo (IA)
                    </button>
                  </div>
                </div>
              </div>

              {municipalRisk.valorExpuesto && (
                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 animate-in fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 mb-1">Población Expuesta</h4>
                      <p className="text-slate-800 font-medium">{municipalRisk.poblacionExpuesta}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-500 mb-1">Valor Estimado Expuesto</h4>
                      <p className="text-slate-800 font-medium">{municipalRisk.valorExpuesto}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-500 mb-1">Infraestructura Crítica Expuesta</h4>
                      <p className="text-slate-800 font-medium">{municipalRisk.infraestructuraExpuesta}</p>
                    </div>
                    <div className="md:col-span-2">
                      <h4 className="text-sm font-bold text-slate-500 mb-1">Histórico de Eventos</h4>
                      <p className="text-slate-800 font-medium">{municipalRisk.historicoEventos}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                      <div>
                        <h4 className="text-sm font-bold text-amber-800 mb-1">Mitigación de Observaciones de la Contraloría</h4>
                        <p className="text-sm text-amber-700">{municipalRisk.analisisContraloria}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button 
                      onClick={() => {
                        setEditingInstrument({
                          id: Date.now().toString(),
                          type: 'Seguro Paramétrico',
                          name: `Seguro Paramétrico - ${selectedMunicipio}`,
                          layerId: 'layer-3',
                          capacity: 0,
                          cost: 0,
                          status: 'En Estructuración',
                          liquidityTime: '15-30 días',
                          activationTrigger: '',
                          parameters: {
                            triggerType: '',
                            triggerUnit: '',
                            triggerValue: 0,
                            payoutStructure: ''
                          }
                        });
                        setIsInstrumentModalOpen(true);
                      }}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Estructurar Instrumento para {selectedMunicipio}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Caso de Uso Crítico: Vías */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Truck size={120} />
              </div>
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs font-bold mb-4 border border-indigo-500/50">
                  <Zap size={14} /> Caso de Uso Prioritario
                </div>
                <h3 className="text-3xl font-black mb-4">Aseguramiento Paramétrico de Infraestructura Vial</h3>
                <p className="text-indigo-100 text-lg mb-6 leading-relaxed">
                  En departamentos con alta pluviosidad y topografía compleja (ej. Chocó), los cierres viales por deslizamientos generan un efecto cascada: escasez de alimentos, encarecimiento de combustibles y aislamiento. Un seguro tradicional tarda meses en ajustar el siniestro. Un <strong>seguro paramétrico basado en lluvia acumulada</strong> inyecta liquidez en días para remoción de escombros y puentes provisionales.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-indigo-300 mb-1"><CloudRain size={20} /></div>
                    <div className="font-bold text-sm">Trigger (Gatillo)</div>
                    <div className="text-xs text-indigo-100 mt-1">Lluvia acumulada &gt; 150mm en 72h (Percentil 95)</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-indigo-300 mb-1"><Database size={20} /></div>
                    <div className="font-bold text-sm">Fuente de Datos (Oráculo)</div>
                    <div className="text-xs text-indigo-100 mt-1">Satélite GPM (NASA) o Red Estaciones IDEAM</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                    <div className="text-indigo-300 mb-1"><DollarSign size={20} /></div>
                    <div className="font-bold text-sm">Payout (Pago)</div>
                    <div className="text-xs text-indigo-100 mt-1">Escalonado: 30% al superar umbral, 100% en evento extremo.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Viabilidad por Amenaza */}
            <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">Evaluación de Viabilidad por Amenaza</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Lluvia Extrema */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                  <div className="p-2 bg-blue-500 text-white rounded-lg"><CloudRain size={20} /></div>
                  <h4 className="font-bold text-blue-900">Lluvia Extrema (Deslizamientos)</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Lluvia acumulada (mm) en 72h/96h.</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> IDEAM (Estaciones pluviométricas), Satélite (CHIRPS, GPM).</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> &gt; 150 mm en 72h (depende de la línea base local).</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Escalonado (Step). Ej: 150mm=30%, 200mm=60%, 250mm=100%.</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-amber-600 font-medium">Moderado/Alto.</span> Lluvia intensa no siempre garantiza un deslizamiento que cierre la vía.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Técnica: Alta</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Financiera: Media</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Inundación */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-cyan-50 border-b border-cyan-100 flex items-center gap-3">
                  <div className="p-2 bg-cyan-500 text-white rounded-lg"><Waves size={20} /></div>
                  <h4 className="font-bold text-cyan-900">Inundación Fluvial</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Nivel del río (m) o Huella de inundación (m²).</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> Sensores limnimétricos (IDEAM), Satélite SAR (Sentinel-1).</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> Nivel &gt; Cota de desbordamiento histórica.</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Lineal desde el umbral hasta el nivel máximo histórico.</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-amber-600 font-medium">Moderado.</span> Las obras de mitigación locales pueden contener el agua aunque el nivel suba.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Técnica: Alta</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Financiera: Alta</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sismo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-slate-100 border-b border-slate-200 flex items-center gap-3">
                  <div className="p-2 bg-slate-600 text-white rounded-lg"><Activity size={20} /></div>
                  <h4 className="font-bold text-slate-800">Sismo (Terremoto)</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Magnitud (Mw) o Aceleración Pico (PGA).</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> Servicio Geológico Colombiano (SGC), USGS.</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> Mw &gt; 6.5 o PGA &gt; 0.2g en polígono definido ("Cat in a Box").</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Binario (100% si ocurre) o Escalonado por intensidad.</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-emerald-600 font-medium">Bajo.</span> Especialmente si se usa PGA, correlaciona muy bien con el daño estructural.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Técnica: Muy Alta</span>
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Financiera: Alta</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequía */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                  <div className="p-2 bg-amber-500 text-white rounded-lg"><Sun size={20} /></div>
                  <h4 className="font-bold text-amber-900">Sequía (Déficit Hídrico)</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Índice de Precipitación Estandarizado (SPI) o VHI.</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> Satélites (MODIS, CHIRPS), IDEAM.</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> SPI &lt; -1.5 (Sequía severa) por 3 meses consecutivos.</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Proporcional a los meses acumulados de déficit.</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-rose-600 font-medium">Alto.</span> El riego artificial o pozos profundos pueden mitigar el impacto real aunque el índice marque sequía.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-bold">Técnica: Alta</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Financiera: Media</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Incendio Forestal */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
                  <div className="p-2 bg-orange-500 text-white rounded-lg"><Flame size={20} /></div>
                  <h4 className="font-bold text-orange-900">Incendio Forestal</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Área quemada (Hectáreas) o FWI.</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> Satélite (FIRMS, MODIS, VIIRS).</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> &gt; 500 hectáreas quemadas en polígonos protegidos.</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Monto fijo por hectárea quemada (Lineal).</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-emerald-600 font-medium">Bajo.</span> El satélite detecta con precisión las cicatrices de quema reales.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Técnica: Media</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold">Financiera: Media</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Volcanismo */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 bg-stone-100 border-b border-stone-200 flex items-center gap-3">
                  <div className="p-2 bg-stone-600 text-white rounded-lg"><Mountain size={20} /></div>
                  <h4 className="font-bold text-stone-800">Erupción Volcánica</h4>
                </div>
                <div className="p-5 flex-1 space-y-4 text-sm">
                  <div><span className="font-bold text-slate-700">Variable Índice:</span> Altura columna ceniza o Emisión SO2.</div>
                  <div><span className="font-bold text-slate-700">Fuente de Datos:</span> SGC (Observatorios), VAAC.</div>
                  <div><span className="font-bold text-slate-700">Umbral:</span> Erupción VEI &gt; 3 o Alerta Roja SGC sostenida.</div>
                  <div><span className="font-bold text-slate-700">Fórmula Payout:</span> Binario (Pago rápido para evacuación y limpieza).</div>
                  <div>
                    <span className="font-bold text-slate-700">Riesgo Base:</span> <span className="text-rose-600 font-medium">Alto.</span> La dirección del viento determina quién sufre el impacto de la ceniza, difícil de modelar en el trigger.
                  </div>
                  <div className="pt-3 border-t border-slate-100">
                    <span className="font-bold text-slate-700 block mb-1">Factibilidad:</span>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold">Técnica: Baja</span>
                      <span className="px-2 py-1 bg-rose-100 text-rose-700 rounded text-xs font-bold">Financiera: Baja</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* TAB 5: Modelo Fiscal */}
        {activeTab === 'modelo-fiscal' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Modelo de Riesgo Fiscal Territorial: {selectedDept}</h2>
                <p className="text-slate-500">Estimación actuarial de impacto fiscal y brechas financieras por escenario.</p>
              </div>
              <button 
                onClick={() => {
                  setEditingProfileData(currentProfile || {
                    departamento: selectedDept, irftScore: 0, exposicionFisica: 0, exposicionEconomica: 0, exposicionSocial: 0, pmp: 0, pae: 0
                  });
                  setIsEditingProfile(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors font-medium text-sm"
              >
                <Edit2 size={16} />
                Parametrizar Variables Fiscales
              </button>
            </div>

            {!currentProfile?.parametrosFiscales ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-slate-200 border-dashed">
                <DollarSign size={48} className="text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Faltan Parámetros Fiscales</h3>
                <p className="text-slate-500 mb-6 text-center max-w-md">Para generar el modelo, debes parametrizar el presupuesto anual, ICLD, fondo de contingencia y capacidad de endeudamiento.</p>
                <button 
                  onClick={() => {
                    setEditingProfileData(currentProfile || {
                      departamento: selectedDept, irftScore: 0, exposicionFisica: 0, exposicionEconomica: 0, exposicionSocial: 0, pmp: 0, pae: 0
                    });
                    setIsEditingProfile(true);
                  }} 
                  className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                >
                  Configurar Parámetros
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Metodología */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BrainCircuit className="text-indigo-600" size={20} />
                    Metodología Actuarial Simplificada
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-slate-600">
                    <div>
                      <p className="mb-2"><strong>1. Pérdida Anual Esperada (AAL/PAE):</strong> Representa el costo promedio anual de los desastres a largo plazo. Se utiliza para dimensionar el Fondo de Contingencia.</p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs mb-4">
                        AAL = Frecuencia_Eventos × Severidad_Promedio
                      </div>
                      <p className="mb-2"><strong>2. Pérdida Máxima Probable (PML/PMP):</strong> Estima la pérdida máxima para un periodo de retorno (Tr) específico. Define el tamaño de las capas de transferencia (seguros/bonos).</p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs">
                        PML(Tr) = Exposición_Total × Factor_Daño(Tr)
                      </div>
                    </div>
                    <div>
                      <p className="mb-2"><strong>3. Impacto Fiscal:</strong> Mide el estrés sobre las finanzas públicas comparando la pérdida contra los Ingresos Corrientes de Libre Destinación (ICLD) y el Presupuesto Anual.</p>
                      <p className="mb-2"><strong>4. Brecha Financiera:</strong> Es el déficit no cubierto tras agotar los instrumentos financieros disponibles en el territorio.</p>
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs">
                        Brecha = Pérdida - (Fondo_Contingencia + Seguros + Endeudamiento)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Escenarios */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800">Escenarios de Pérdida e Impacto Fiscal</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                          <th className="p-4 font-bold">Escenario (Tr)</th>
                          <th className="p-4 font-bold text-right">Pérdida Estimada (PML)</th>
                          <th className="p-4 font-bold text-center">Impacto ICLD</th>
                          <th className="p-4 font-bold text-right">Fondo Cont.</th>
                          <th className="p-4 font-bold text-right">Seguros</th>
                          <th className="p-4 font-bold text-right">Deuda</th>
                          <th className="p-4 font-bold text-right text-rose-600">Brecha Financiera</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {[
                          { name: 'Frecuente', tr: '20 años', factor: 0.05 },
                          { name: 'Severo', tr: '100 años', factor: 0.15 },
                          { name: 'Catastrófico', tr: '500 años', factor: 0.35 }
                        ].map((escenario, idx) => {
                          const pml = totalReposicion * escenario.factor;
                          const impactoIcld = (pml / currentProfile.parametrosFiscales!.icld) * 100;
                          
                          let remainingLoss = pml;
                          
                          // Cascada de absorción
                          const fondoUsado = Math.min(remainingLoss, currentProfile.parametrosFiscales!.fondoContingencia);
                          remainingLoss -= fondoUsado;
                          
                          const segurosUsado = Math.min(remainingLoss, totalAsegurado);
                          remainingLoss -= segurosUsado;
                          
                          const deudaUsada = Math.min(remainingLoss, currentProfile.parametrosFiscales!.capacidadEndeudamiento);
                          remainingLoss -= deudaUsada;
                          
                          const brecha = remainingLoss;

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-4">
                                <p className="font-bold text-slate-800">{escenario.name}</p>
                                <p className="text-xs text-slate-500">Tr: {escenario.tr}</p>
                              </td>
                              <td className="p-4 text-right font-bold text-slate-700">
                                {formatCurrency(pml)}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${impactoIcld > 100 ? 'bg-rose-100 text-rose-700' : impactoIcld > 50 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {impactoIcld.toFixed(1)}%
                                </span>
                              </td>
                              <td className="p-4 text-right text-emerald-600">
                                -{formatCurrency(fondoUsado)}
                              </td>
                              <td className="p-4 text-right text-blue-600">
                                -{formatCurrency(segurosUsado)}
                              </td>
                              <td className="p-4 text-right text-purple-600">
                                -{formatCurrency(deudaUsada)}
                              </td>
                              <td className="p-4 text-right font-bold text-rose-600 bg-rose-50/50">
                                {brecha > 0 ? formatCurrency(brecha) : '$0'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: IA Assistant */}
        {activeTab === 'ia' && (
          <div className="max-w-5xl mx-auto h-[calc(100vh-16rem)] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-4 bg-slate-900 text-white flex items-center gap-3 shrink-0">
              <BrainCircuit className="text-indigo-400" size={24} />
              <div>
                <h3 className="font-bold">Motor IA de Protección Financiera</h3>
                <p className="text-xs text-slate-400">Analítica predictiva y recomendación de coberturas</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
              {/* Quick Actions / Cadena de Valor */}
              {messages.length === 1 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Layers className="text-indigo-600" size={20} />
                    <h3 className="text-lg font-bold text-slate-800">Cadena de Valor: Estrategia de Protección Financiera</h3>
                  </div>
                  <p className="text-sm text-slate-500 mb-6">Ejecuta esta cadena paso a paso para construir la política pública territorial.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    <button onClick={() => handleSpecializedAnalysis('marco_experto')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">621</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Marco Experto Base</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Ley 1523 y principios rectores</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('diagnostico_madurez')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">622</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Diagnóstico Madurez</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Capacidad institucional y datos</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('riesgo_fiscal')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">623</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Riesgo Fiscal</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Pasivos contingentes y brechas</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('estrategia_capas')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">624</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Estrategia por Capas</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Risk Layering y retención</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('aseguramiento_activos')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">625</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Aseguramiento Activos</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Análisis RUNAPE y pólizas</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('parametricos')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">626</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Paramétricos</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Triggers y bonos catastróficos</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('fondo_territorial')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">627</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Fondo Territorial</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Arquitectura Fondo GRD</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('auditoria')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">628</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Auditoría / Control</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Responsabilidad fiscal</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('roadmap')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">629</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Roadmap 4 Años</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">Plan de implementación</p>
                      </div>
                    </button>
                    <button onClick={() => handleSpecializedAnalysis('benchmarking')} className="bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-left flex items-start gap-3">
                      <div className="bg-indigo-50 text-indigo-600 font-bold text-xs px-2 py-1 rounded">630</div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-800">Benchmark Int.</h4>
                        <p className="text-xs text-slate-500 line-clamp-1">FONDEN, CCRIF, Cat Bonds</p>
                      </div>
                    </button>
                  </div>

                  <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <BrainCircuit size={100} />
                    </div>
                    <div className="relative z-10">
                      <h3 className="text-xl font-bold mb-2">Resultado Final: Política Pública</h3>
                      <p className="text-indigo-100 text-sm mb-4 max-w-2xl">
                        Genera automáticamente el Documento tipo CONPES consolidando: Estrategia Territorial, Modelo Replicable, Plan Operativo, Diagnóstico y Arquitectura de Seguros.
                      </p>
                      <button 
                        onClick={() => handleSpecializedAnalysis('conpes')}
                        className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold shadow-md hover:bg-indigo-50 transition-colors flex items-center gap-2"
                      >
                        <CheckCircle2 size={20} />
                        Generar Documento CONPES Territorial
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                        <BrainCircuit size={14} /> Motor IA
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-800 prose-pre:text-slate-100">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-600" />
                    <span className="text-sm text-slate-500">Analizando RUNAPE y calculando coberturas...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="relative flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ej: Detecta brechas de aseguramiento en infraestructura de transporte..."
                  className="w-full pl-4 pr-12 py-4 bg-slate-100 border-transparent rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all font-medium text-slate-800"
                  disabled={isTyping}
                />
                <button 
                  onClick={handleSendChat}
                  disabled={isTyping || !chatInput.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 group"
                >
                  {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && editingProfileData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">Parametrizar Riesgo: {editingProfileData.departamento}</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Índice IRFT (0-100)</label>
                  <input 
                    type="number" 
                    value={editingProfileData.irftScore} 
                    onChange={e => setEditingProfileData({...editingProfileData, irftScore: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exposición Física (0-100)</label>
                  <input 
                    type="number" 
                    value={editingProfileData.exposicionFisica} 
                    onChange={e => setEditingProfileData({...editingProfileData, exposicionFisica: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exposición Económica (0-100)</label>
                  <input 
                    type="number" 
                    value={editingProfileData.exposicionEconomica} 
                    onChange={e => setEditingProfileData({...editingProfileData, exposicionEconomica: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Exposición Social (0-100)</label>
                  <input 
                    type="number" 
                    value={editingProfileData.exposicionSocial} 
                    onChange={e => setEditingProfileData({...editingProfileData, exposicionSocial: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <DollarSign size={20} className="text-indigo-600" />
                  Parámetros Fiscales
                </h4>
                <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Presupuesto Anual (COP)</label>
                    <input 
                      type="number" 
                      value={editingProfileData.parametrosFiscales?.presupuestoAnual || 0} 
                      onChange={e => setEditingProfileData({
                        ...editingProfileData, 
                        parametrosFiscales: { ...(editingProfileData.parametrosFiscales || { presupuestoAnual: 0, icld: 0, fondoContingencia: 0, capacidadEndeudamiento: 0 }), presupuestoAnual: Number(e.target.value) }
                      })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">ICLD (COP)</label>
                    <input 
                      type="number" 
                      value={editingProfileData.parametrosFiscales?.icld || 0} 
                      onChange={e => setEditingProfileData({
                        ...editingProfileData, 
                        parametrosFiscales: { ...(editingProfileData.parametrosFiscales || { presupuestoAnual: 0, icld: 0, fondoContingencia: 0, capacidadEndeudamiento: 0 }), icld: Number(e.target.value) }
                      })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Fondo de Contingencia (COP)</label>
                    <input 
                      type="number" 
                      value={editingProfileData.parametrosFiscales?.fondoContingencia || 0} 
                      onChange={e => setEditingProfileData({
                        ...editingProfileData, 
                        parametrosFiscales: { ...(editingProfileData.parametrosFiscales || { presupuestoAnual: 0, icld: 0, fondoContingencia: 0, capacidadEndeudamiento: 0 }), fondoContingencia: Number(e.target.value) }
                      })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Capacidad Endeudamiento (COP)</label>
                    <input 
                      type="number" 
                      value={editingProfileData.parametrosFiscales?.capacidadEndeudamiento || 0} 
                      onChange={e => setEditingProfileData({
                        ...editingProfileData, 
                        parametrosFiscales: { ...(editingProfileData.parametrosFiscales || { presupuestoAnual: 0, icld: 0, fondoContingencia: 0, capacidadEndeudamiento: 0 }), capacidadEndeudamiento: Number(e.target.value) }
                      })}
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h4 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Database size={20} className="text-indigo-600" />
                  Modelación Actuarial (PMP y PAE)
                </h4>
                <p className="text-sm text-slate-500 mb-4">
                  Parametriza las variables actuariales para calcular la Pérdida Máxima Probable y la Pérdida Anual Esperada basándose en la exposición total del RUNAPE ({formatCurrency(totalReposicion)}).
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-700">Parámetros PMP</h5>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Periodo de Retorno (Años)</label>
                      <select 
                        value={editingProfileData.parametrosActuariales?.periodoRetornoPMP || 100}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setEditingProfileData({
                            ...editingProfileData,
                            parametrosActuariales: { ...editingProfileData.parametrosActuariales!, periodoRetornoPMP: val }
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value={50}>50 años</option>
                        <option value={100}>100 años</option>
                        <option value={250}>250 años</option>
                        <option value={500}>500 años</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Factor de Daño Esperado (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingProfileData.parametrosActuariales?.factorDanoPMP || 0} 
                        onChange={e => {
                          const factor = Number(e.target.value);
                          const newPmp = totalReposicion * (factor / 100);
                          setEditingProfileData({
                            ...editingProfileData,
                            pmp: newPmp,
                            parametrosActuariales: { 
                              ...(editingProfileData.parametrosActuariales || { periodoRetornoPMP: 100, frecuenciaEventosPAE: 0, severidadPromedioPAE: 0, factorDanoPMP: 0 }),
                              factorDanoPMP: factor 
                            }
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">PMP Calculada (COP)</label>
                      <input 
                        type="number" 
                        value={editingProfileData.pmp} 
                        onChange={e => setEditingProfileData({...editingProfileData, pmp: Number(e.target.value)})}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-rose-600"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h5 className="font-bold text-slate-700">Parámetros PAE</h5>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Frecuencia (Eventos/Año)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingProfileData.parametrosActuariales?.frecuenciaEventosPAE || 0} 
                        onChange={e => {
                          const freq = Number(e.target.value);
                          const sev = editingProfileData.parametrosActuariales?.severidadPromedioPAE || 0;
                          setEditingProfileData({
                            ...editingProfileData,
                            pae: freq * sev,
                            parametrosActuariales: { 
                              ...(editingProfileData.parametrosActuariales || { periodoRetornoPMP: 100, frecuenciaEventosPAE: 0, severidadPromedioPAE: 0, factorDanoPMP: 0 }),
                              frecuenciaEventosPAE: freq 
                            }
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1">Severidad Promedio (COP)</label>
                      <input 
                        type="number" 
                        value={editingProfileData.parametrosActuariales?.severidadPromedioPAE || 0} 
                        onChange={e => {
                          const sev = Number(e.target.value);
                          const freq = editingProfileData.parametrosActuariales?.frecuenciaEventosPAE || 0;
                          setEditingProfileData({
                            ...editingProfileData,
                            pae: freq * sev,
                            parametrosActuariales: { 
                              ...(editingProfileData.parametrosActuariales || { periodoRetornoPMP: 100, frecuenciaEventosPAE: 0, severidadPromedioPAE: 0, factorDanoPMP: 0 }),
                              severidadPromedioPAE: sev 
                            }
                          });
                        }}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-500 mb-1">PAE Calculada (COP)</label>
                      <input 
                        type="number" 
                        value={editingProfileData.pae} 
                        onChange={e => setEditingProfileData({...editingProfileData, pae: Number(e.target.value)})}
                        className="w-full p-2 border border-slate-300 rounded-lg bg-white font-bold text-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditingProfile(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleSaveProfile} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2">
                <Save size={18} /> Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Asset Modal */}
      {isEditingAsset && editingAssetData && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {assets.some(a => a.id === editingAssetData.id) ? 'Editar Activo' : 'Añadir Nuevo Activo'}
              </h3>
              <button onClick={() => setIsEditingAsset(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Activo</label>
                <input 
                  type="text" 
                  value={editingAssetData.nombre || ''} 
                  onChange={e => setEditingAssetData({...editingAssetData, nombre: e.target.value})}
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ej. Hospital Departamental..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Sector</label>
                  <select 
                    value={editingAssetData.sector || 'Otros'} 
                    onChange={e => setEditingAssetData({...editingAssetData, sector: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Salud">Salud</option>
                    <option value="Educación">Educación</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Agua y Saneamiento">Agua y Saneamiento</option>
                    <option value="Energía">Energía</option>
                    <option value="Administrativo">Administrativo</option>
                    <option value="Otros">Otros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Municipio</label>
                  <input 
                    type="text" 
                    value={editingAssetData.municipio || ''} 
                    onChange={e => setEditingAssetData({...editingAssetData, municipio: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor Reposición (COP)</label>
                  <input 
                    type="number" 
                    value={editingAssetData.valorReposicion || 0} 
                    onChange={e => setEditingAssetData({...editingAssetData, valorReposicion: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Valor Asegurado (COP)</label>
                  <input 
                    type="number" 
                    value={editingAssetData.valorAsegurado || 0} 
                    onChange={e => setEditingAssetData({...editingAssetData, valorAsegurado: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nivel de Riesgo</label>
                  <select 
                    value={editingAssetData.nivelRiesgo || 'Medio'} 
                    onChange={e => setEditingAssetData({...editingAssetData, nivelRiesgo: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Bajo">Bajo</option>
                    <option value="Medio">Medio</option>
                    <option value="Alto">Alto</option>
                    <option value="Crítico">Crítico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo Seguro</label>
                  <select 
                    value={editingAssetData.tipoSeguro || 'Ninguno'} 
                    onChange={e => setEditingAssetData({...editingAssetData, tipoSeguro: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Ninguno">Ninguno</option>
                    <option value="Tradicional">Tradicional</option>
                    <option value="Paramétrico">Paramétrico</option>
                    <option value="Todo Riesgo">Todo Riesgo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Criticidad</label>
                  <select 
                    value={editingAssetData.criticidadOperativa || 'Media'} 
                    onChange={e => setEditingAssetData({...editingAssetData, criticidadOperativa: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                    <option value="Esencial">Esencial</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsEditingAsset(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={() => {
                  if (editingAssetData.id && assets.some(a => a.id === editingAssetData.id)) {
                    setAssets(assets.map(a => a.id === editingAssetData.id ? editingAssetData as PublicAsset : a));
                  } else {
                    setAssets([...assets, editingAssetData as PublicAsset]);
                  }
                  setIsEditingAsset(false);
                }} 
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Guardar Activo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Instrument Modal */}
      {isInstrumentModalOpen && editingInstrument && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">
                {editingInstrument.id.startsWith('inst_') ? 'Nuevo Instrumento Financiero' : 'Editar Instrumento'}
              </h3>
              <button onClick={() => setIsInstrumentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Nombre del Instrumento</label>
                  <input 
                    type="text" 
                    value={editingInstrument.name} 
                    onChange={e => setEditingInstrument({...editingInstrument, name: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej. Seguro Paramétrico Terremoto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tipo de Instrumento</label>
                  <select 
                    value={editingInstrument.type} 
                    onChange={e => setEditingInstrument({...editingInstrument, type: e.target.value as InstrumentType})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Fondo GRD">Fondo GRD</option>
                    <option value="Reserva Presupuestal">Reserva Presupuestal</option>
                    <option value="Crédito Contingente">Crédito Contingente</option>
                    <option value="Seguro Paramétrico">Seguro Paramétrico</option>
                    <option value="Seguro Tradicional">Seguro Tradicional</option>
                    <option value="Cat Bond">Bono Catastrófico (Cat Bond)</option>
                    <option value="Pool de Aseguramiento">Pool de Aseguramiento</option>
                    <option value="Respaldo Soberano">Respaldo Soberano</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Capa Asignada</label>
                  <select 
                    value={editingInstrument.layerId} 
                    onChange={e => setEditingInstrument({...editingInstrument, layerId: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {baseLayers.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Estado</label>
                  <select 
                    value={editingInstrument.status} 
                    onChange={e => setEditingInstrument({...editingInstrument, status: e.target.value as any})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="En Estructuración">En Estructuración</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Capacidad Máxima (COP)</label>
                  <input 
                    type="number" 
                    value={editingInstrument.capacity} 
                    onChange={e => setEditingInstrument({...editingInstrument, capacity: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Costo / Prima Anual (COP)</label>
                  <input 
                    type="number" 
                    value={editingInstrument.cost} 
                    onChange={e => setEditingInstrument({...editingInstrument, cost: Number(e.target.value)})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                
                {/* TRIGGER SECTION - RESTRUCTURED */}
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Zap size={16} className="text-amber-500" />
                    Trigger / Condición de Activación
                  </label>
                  
                  {(editingInstrument.type === 'Seguro Paramétrico' || editingInstrument.type === 'Cat Bond') ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CAMPO 1: AMENAZA / TRIGGER */}
                      <div>
                        <label className="block text-xs font-bold text-indigo-900 mb-1">1. Seleccionar Amenaza (Trigger)</label>
                        <select 
                          value={editingInstrument.parameters.triggerType || ''} 
                          onChange={e => {
                            const selectedType = e.target.value;
                            const template = PARAMETRIC_TEMPLATES.find(t => t.triggerType === selectedType);
                            
                            if (template) {
                              setEditingInstrument({
                                ...editingInstrument, 
                                activationTrigger: `${template.triggerType} > ${template.triggerValue} ${template.triggerUnit}`,
                                parameters: {
                                  ...editingInstrument.parameters, 
                                  triggerType: template.triggerType,
                                  triggerUnit: template.triggerUnit,
                                  triggerValue: template.triggerValue,
                                  payoutStructure: template.payoutStructure
                                }
                              });
                            } else {
                              setEditingInstrument({
                                ...editingInstrument,
                                parameters: {
                                  ...editingInstrument.parameters,
                                  triggerType: selectedType
                                }
                              });
                            }
                          }}
                          className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-medium shadow-sm"
                        >
                          <option value="">-- Seleccionar Amenaza --</option>
                          {PARAMETRIC_TEMPLATES.map(t => (
                            <option key={t.id} value={t.triggerType}>{t.amenaza} ({t.triggerType})</option>
                          ))}
                        </select>
                      </div>
                      
                      {/* CAMPO 2: UNIDAD DE MEDIDA */}
                      <div>
                        <label className="block text-xs font-bold text-indigo-900 mb-1">2. Unidad de Medida</label>
                        <select 
                          value={editingInstrument.parameters.triggerUnit || ''} 
                          onChange={e => {
                            const newUnit = e.target.value;
                            const tType = editingInstrument.parameters.triggerType || '';
                            const tVal = editingInstrument.parameters.triggerValue || 0;
                            setEditingInstrument({
                              ...editingInstrument, 
                              activationTrigger: `${tType} > ${tVal} ${newUnit}`,
                              parameters: {...editingInstrument.parameters, triggerUnit: newUnit}
                            });
                          }}
                          className="w-full p-3 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white font-medium shadow-sm"
                          disabled={!editingInstrument.parameters.triggerType}
                        >
                          <option value="">-- Seleccionar Unidad --</option>
                          {editingInstrument.parameters.triggerType === 'Lluvia Acumulada' && (
                            <><option value="mm">Milímetros (mm)</option><option value="cm">Centímetros (cm)</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Nivel del Río' && (
                            <><option value="m">Metros (m)</option><option value="cm">Centímetros (cm)</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Magnitud Sísmica' && (
                            <><option value="Mw">Mw (Magnitud Momento)</option><option value="Richter">Escala Richter</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Aceleración Pico (PGA)' && (
                            <><option value="g">Fuerza g (g)</option><option value="%g">Porcentaje de g (%g)</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Índice de Precipitación (SPI)' && (
                            <><option value="SPI">Valor SPI</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Área Quemada' && (
                            <><option value="Hectáreas">Hectáreas (ha)</option><option value="km2">Kilómetros Cuadrados (km²)</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Temperatura Mínima' && (
                            <><option value="°C">Grados Celsius (°C)</option><option value="°F">Grados Fahrenheit (°F)</option></>
                          )}
                          {editingInstrument.parameters.triggerType === 'Altura Columna Ceniza' && (
                            <><option value="km">Kilómetros (km)</option><option value="m">Metros (m)</option></>
                          )}
                        </select>
                      </div>

                      {/* VALOR DEL UMBRAL (Auto-llenado pero configurable) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Valor del Umbral (Configurable)</label>
                        <div className="flex items-center">
                          <span className="bg-slate-200 px-3 py-2 rounded-l-lg border border-r-0 border-slate-300 font-bold text-slate-600">&gt;</span>
                          <input 
                            type="number" 
                            step="0.1"
                            value={editingInstrument.parameters.triggerValue || ''} 
                            onChange={e => {
                              const newVal = Number(e.target.value);
                              const tType = editingInstrument.parameters.triggerType || '';
                              const tUnit = editingInstrument.parameters.triggerUnit || '';
                              setEditingInstrument({
                                ...editingInstrument, 
                                activationTrigger: `${tType} > ${newVal} ${tUnit}`,
                                parameters: {...editingInstrument.parameters, triggerValue: newVal}
                              });
                            }}
                            className="w-full p-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>

                      {/* PAYOUT STRUCTURE */}
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Estructura de Pago (Payout)</label>
                        <select 
                          value={editingInstrument.parameters.payoutStructure || ''} 
                          onChange={e => setEditingInstrument({...editingInstrument, parameters: {...editingInstrument.parameters, payoutStructure: e.target.value}})}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="Step">Escalonado (Step)</option>
                          <option value="Linear">Lineal</option>
                          <option value="Binary">Binario (100% o 0%)</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      value={editingInstrument.activationTrigger} 
                      onChange={e => setEditingInstrument({...editingInstrument, activationTrigger: e.target.value})}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="Ej. Declaratoria de Calamidad"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Tiempo de Liquidez</label>
                  <input 
                    type="text" 
                    value={editingInstrument.liquidityTime} 
                    onChange={e => setEditingInstrument({...editingInstrument, liquidityTime: e.target.value})}
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Ej. 14 días"
                  />
                </div>
              </div>

              {/* Dynamic Parameters based on Type */}
              <div className="pt-6 border-t border-slate-200">
                <h4 className="font-bold text-slate-800 mb-4">Parámetros Específicos del Instrumento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">

                  {editingInstrument.type === 'Cat Bond' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Tasa de Cupón (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingInstrument.parameters.couponRate || ''} 
                        onChange={e => setEditingInstrument({...editingInstrument, parameters: {...editingInstrument.parameters, couponRate: Number(e.target.value)}})}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {editingInstrument.type === 'Crédito Contingente' && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tasa de Interés (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={editingInstrument.parameters.interestRate || ''} 
                          onChange={e => setEditingInstrument({...editingInstrument, parameters: {...editingInstrument.parameters, interestRate: Number(e.target.value)}})}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Comisión de Disponibilidad (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          value={editingInstrument.parameters.commitmentFee || ''} 
                          onChange={e => setEditingInstrument({...editingInstrument, parameters: {...editingInstrument.parameters, commitmentFee: Number(e.target.value)}})}
                          className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </>
                  )}

                  {editingInstrument.type === 'Seguro Tradicional' && (
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Deducible (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        value={editingInstrument.parameters.deductible || ''} 
                        onChange={e => setEditingInstrument({...editingInstrument, parameters: {...editingInstrument.parameters, deductible: Number(e.target.value)}})}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  )}

                  {['Fondo GRD', 'Reserva Presupuestal', 'Pool de Aseguramiento', 'Respaldo Soberano'].includes(editingInstrument.type) && (
                    <div className="col-span-2">
                      <p className="text-sm text-slate-500 italic">No hay parámetros específicos adicionales requeridos para este tipo de instrumento.</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsInstrumentModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button 
                onClick={handleSaveInstrument} 
                className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} /> Guardar Instrumento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
