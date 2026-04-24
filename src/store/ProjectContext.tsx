import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  GlobalState, Project, Presupuesto, Contract, Avance, Seguimiento, Alert, Environmental, 
  InterventoriaReport, OpsContractor, Comision, Riesgo, RiesgoTerritorial, ProjectData, 
  Otrosie, Afectacion, ContractEvent, Pago, Vigencia, LineaInversion, Contractor, 
  ContractorEvaluation, ProjectDocument, DocumentVersion, Professional, Task, SystemReport, 
  Convenio, ConocimientoTerritorial, ExternalDataset, HistoricalEvent, DamageRecord, Poliza, 
  Activity, EnteControlRecord, EmergenciaEvento, MunicipalityInventory, FinancialDocument, 
  FinancialTraceability, FinancialAuditIssue, Survey, SurveyResponse, SurveyAnalysis,
  TechnicalSheet
} from '../types';
import { mockProjects } from '../data/mockData';
import { mockDepartments } from '../data/mockDepartments';
import { colombiaData } from '../data/colombiaData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { encryptData, decryptData } from '../lib/security';
import { calculateProjectTotals, calculateContractTotals } from '../utils/projectCalculations';
import { showAlert } from '../utils/alert';

const STORAGE_KEY = 'srr_app_state';
const ENCRYPTION_SECRET_PREFIX = 'SRR_MILITARY_SEC_'; // Prefix for key derivation

const getHoursField = (type: Activity['type']) => {
  switch (type) {
    case 'PMU': return 'horasPMU';
    case 'Reunión': return 'horasReuniones';
    case 'Comité': return 'horasCoordinacion';
    case 'Visita': return 'horasSeguimiento';
    default: return 'horasCoordinacion';
  }
};

interface ProjectContextType {
  state: GlobalState;
  loading: boolean;
  syncing: boolean;
  error: string | null;
  addInterventoriaReport: (report: InterventoriaReport) => void;
  validateInterventoriaReport: (reportId: string, valid: boolean) => void;
  addProject: (project: Project) => void;
  addContract: (contract: Contract) => void;
  updateContract: (contract: Contract) => void;
  deleteContract: (contractId: string) => void;
  addContractEvent: (event: ContractEvent) => void;
  addOtrosie: (otrosie: Otrosie) => void;
  deleteOtrosie: (otrosieId: string) => void;
  addAfectacion: (afectacion: Afectacion) => void;
  updateAfectacion: (afectacion: Afectacion) => void;
  deleteAfectacion: (id: string) => void;
  addPago: (pago: Pago) => void;
  addPagos: (pagosList: Pago[]) => void;
  updatePago: (pago: Pago) => void;
  deletePago: (pagoId: string) => void;
  clearAllPagos: () => void;
  addVigencia: (vigencia: Vigencia) => void;
  updateVigencia: (vigencia: Vigencia) => void;
  deleteVigencia: (id: string) => void;
  addLineaInversion: (linea: LineaInversion) => void;
  updateLineaInversion: (linea: LineaInversion) => void;
  addConvenio: (convenio: Convenio) => void;
  updateConvenio: (convenio: Convenio) => void;
  deleteConvenio: (id: string) => void;
  addContractor: (contractor: Contractor) => void;
  updateContractor: (contractor: Contractor) => void;
  addContractorEvaluation: (evaluation: ContractorEvaluation) => void;
  addDocument: (doc: ProjectDocument) => void;
  deleteDocument: (docId: string) => void;
  updateDocumentAnalysis: (docId: string, analysis: ProjectDocument['analysis']) => void;
  applyDocumentAnalysis: (projectId: string, analysis: ProjectDocument['analysis']) => void;
  addDocumentVersion: (docId: string, version: DocumentVersion) => void;
  linkDocumentToReport: (docId: string, reportId: string) => void;
  checkMissingDocuments: (projectId: string) => void;
  updateProject: (project: Project) => void;
  updatePresupuesto: (presupuesto: Presupuesto) => void;
  deleteProject: (projectId: string) => void;
  deleteProfessional: (professionalId: string) => void;
  addProfessional: (professional: Professional) => void;
  updateProfessional: (professional: Professional) => void;
  addComision: (comision: Comision) => void;
  updateComision: (comision: Comision) => void;
  deleteComision: (id: string) => void;
  addSeguimiento: (seguimiento: Seguimiento) => void;
  addAvance: (projectId: string, avance: Avance) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  addSystemReport: (report: SystemReport) => void;
  updateSystemReport: (report: SystemReport) => void;
  addActivity: (activity: Activity) => void;
  updateActivity: (activity: Activity) => void;
  deleteActivity: (id: string) => void;
  addEnteControlRecord: (record: EnteControlRecord) => void;
  updateEnteControlRecord: (record: EnteControlRecord) => void;
  deleteEnteControlRecord: (id: string) => void;
  addEvento: (evento: EmergenciaEvento) => void;
  updateEvento: (evento: EmergenciaEvento) => void;
  deleteEvento: (id: string) => void;
  getProjectData: (projectId: string) => ProjectData | undefined;
  updateConocimientoTerritorial: (conocimiento: ConocimientoTerritorial) => void;
  addExternalDataset: (dataset: ExternalDataset) => void;
  addHistoricalEvent: (event: HistoricalEvent) => void;
  updateHistoricalEvent: (event: HistoricalEvent) => void;
  addDamageRecord: (record: DamageRecord) => void;
  updateDamageRecord: (record: DamageRecord) => void;
  addPoliza: (poliza: Poliza) => void;
  updatePoliza: (poliza: Poliza) => void;
  deletePoliza: (id: string) => void;
  addFinancialDocument: (doc: FinancialDocument) => void;
  addFinancialDocuments: (docs: FinancialDocument[]) => void;
  updateFinancialDocument: (doc: FinancialDocument) => void;
  deleteFinancialDocument: (id: string) => void;
  clearFinancialDocuments: () => void;
  clearDuplicatesFinancialDocuments: () => void;
  updateMunicipalityInventory: (inventory: MunicipalityInventory) => void;
  closeEventAndStartReconstruction: (eventId: string) => void;
  saveToSupabase: (isManual?: boolean) => Promise<void>;
  loadFromSupabase: (isManual?: boolean) => Promise<void>;
  repairAllUrls: () => Promise<void>;
  clearAllData: () => Promise<void>;
  importFromJSON: (file: File) => void;
  exportToJSON: () => void;
  addSurvey: (survey: Survey) => void;
  deleteSurvey: (surveyId: string) => void;
  addSurveyResponse: (response: SurveyResponse) => void;
  addSurveyAnalysis: (analysis: SurveyAnalysis) => void;
  globalTechnicalSheet?: TechnicalSheet;
  updateGlobalTechnicalSheet: (sheet: TechnicalSheet) => void;
  isCloudCheckComplete: boolean;
  hasSyncedWithCloud: boolean;
}

export const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

const EMPTY_STATE: GlobalState = {
  proyectos: [],
  convenios: [],
  presupuestos: [],
  contratos: [],
  otrosies: [],
  afectaciones: [],
  avances: [],
  seguimientos: [],
  alertas: [],
  ambiental: [],
  informesInterventoria: [],
  pagos: [],
  ops: [],
  comisiones: [],
  riesgos: [],
  polizas: [],
  riesgosTerritoriales: [],
  suspensiones: [],
  vigencias: [
    { id: 'VIG-2024', anio: '2024', presupuestoAsignado: 0, estado: 'Abierta', descripcion: 'Vigencia Fiscal 2024' },
    { id: 'VIG-2025', anio: '2025', presupuestoAsignado: 0, estado: 'Abierta', descripcion: 'Vigencia Fiscal 2025' },
    { id: 'VIG-2026', anio: '2026', presupuestoAsignado: 0, estado: 'Abierta', descripcion: 'Vigencia Fiscal 2026' },
  ],
  lineasInversion: [
    { id: 'LIN-INF', nombre: 'Infraestructura Vial', codigo: 'INF', color: 'indigo' },
    { id: 'LIN-SOC', nombre: 'Infraestructura Social', codigo: 'SOC', color: 'emerald' },
    { id: 'LIN-AMB', nombre: 'Mitigación de Riesgos', codigo: 'AMB', color: 'teal' },
    { id: 'LIN-REA', nombre: 'Reasentamiento', codigo: 'REA', color: 'amber' },
  ],
  contratistas: [],
  evaluacionesContratistas: [],
  documentos: [],
  actas: [],
  documentosSoporte: [],
  municipios: [],
  departamentos: mockDepartments,
  documentosRequeridos: [],
  professionals: [],
  tasks: [],
  systemReports: [],
  conocimientoTerritorial: [],
  externalDatasets: [
    { id: 'd1', fuente: 'IDEAM', titulo: 'Alerta Roja por Lluvias', fechaPublicacion: '2025-10-01', departamento: 'Chocó', hallazgosClave: ['Precipitaciones sobre lo normal', 'Riesgo inminente de inundación'] },
    { id: 'd2', fuente: 'POT', titulo: 'POT Quibdó 2024-2036', fechaPublicacion: '2024-01-15', departamento: 'Chocó', municipio: 'Quibdó', hallazgosClave: ['Prohibición de construcción en ronda del río', 'Reubicación de 500 familias'] },
  ],
  historicalEvents: [],
  damageRecords: [],
  activities: [],
  entesControl: [],
  eventos: [
    {
      id: 'EV-QUIBDO-2026',
      nombre: 'Frente Frío Sistémico - Chocó',
      tipo: 'Frente Frío',
      departamentosAfectados: ['Chocó'],
      municipiosAfectados: ['Quibdó'],
      fechaInicio: '2026-04-10',
      descripcion: 'Evento de frente frío con precipitaciones extremas que afectan la cuenca del río Atrato.',
      estado: 'Activo'
    }
  ],
  municipalityInventories: [
    {
      id: '27001',
      name: 'Quibdó',
      edanStatus: 'Completado',
      runapeStatus: 'Configurado',
      lastUpdate: '2026-04-12',
      generalData: {
        diligenciador: 'Andrés Felipe Gómez Sánchez',
        institucion: 'Alcaldía Quibdó',
        cargo: 'Secretario Planeación',
        telefono: '6041234567',
        celular: '3101234567',
        tipoEvento: ['Frente Frío'],
        fecha: '2026-04-12',
        hora: '10:00',
        evento: 'Frente Frío Sistémico - Chocó',
        descripcionEvento: 'Precipitaciones intensas causan desbordamiento del río Atrato.',
        magnitud: '150mm/24h',
        fechaEvento: '2026-04-10',
        horaEvento: '02:00',
        sitioEvento: 'Barrios aledaños al río Atrato',
        sectoresAfectados: 'Barrio La Playita, Barrio Porvenir',
        eventosSecundarios: 'Deslizamientos en zona rural',
        coordinadorCMGRD: 'María Elena Ruiz',
        alcaldeMunicipal: 'Juan Carlos Palacios',
        fechaEvaluacion: '2026-04-12',
        horaEvaluacion: '09:00'
      },
      poblacion: {
        heridos: { total: { cantidad: 5, valorUnitario: 1000000, valorTotal: 5000000 } },
        muertos: { total: { cantidad: 1, valorUnitario: 0, valorTotal: 0 } },
        desaparecidos: { total: { cantidad: 2, valorUnitario: 0, valorTotal: 0 } },
        familiasAfectadas: { total: { cantidad: 120, valorUnitario: 500000, valorTotal: 60000000 } },
        personasAfectadas: { total: { cantidad: 450, valorUnitario: 0, valorTotal: 0 } },
        enfermos: { total: { cantidad: 30, valorUnitario: 200000, valorTotal: 6000000 } },
        evacuados: { total: { cantidad: 200, valorUnitario: 100000, valorTotal: 20000000 } },
        albergados: { total: { cantidad: 150, valorUnitario: 150000, valorTotal: 22500000 } }
      },
      danosVivienda: {
        destruidas: { cantidad: 20, valorUnitario: 45000000, valorTotal: 900000000 },
        grave: { cantidad: 100, valorUnitario: 14000000, valorTotal: 1400000000 },
        moderado: { cantidad: 50, valorUnitario: 5000000, valorTotal: 250000000 },
        leve: { cantidad: 30, valorUnitario: 2000000, valorTotal: 60000000 },
        materialPredominante: 'Ladrillo y Madera',
        techosAfectadosClima: 15,
        hogaresPropietarios: 80,
        hogaresArrendatarios: 40,
        hogaresJefaturaFemenina: 65
      },
      infraestructuraPorSector: {
        salud: { hospitales: { cantidad: 1, valorUnitario: 500000000, valorTotal: 500000000 }, centrosAfectados: 1 },
        educacionMedia: { colegios: { cantidad: 2, valorUnitario: 300000000, valorTotal: 600000000 }, institucionesAfectadas: 2, estudiantesSinClases: 1200 },
        transporteVias: { viasPrimarias: { cantidad: 500, valorUnitario: 2000000, valorTotal: 1000000000 } },
        transportePuentes: { puentes: { cantidad: 1, valorUnitario: 2000000000, valorTotal: 2000000000 } },
        energia: { torres: { cantidad: 10, valorUnitario: 10000000, valorTotal: 100000000 }, personasSinServicio: 450, diasEstimadosSinEnergia: 3 },
        aguaGas: { acueducto: { cantidad: 1, valorUnitario: 500000000, valorTotal: 500000000 }, personasSinAgua: 450, alcantarilladoStatus: 'Parcial' },
        comunicaciones: { antenas: { cantidad: 5, valorUnitario: 20000000, valorTotal: 100000000 }, status: 'Parcial' }
      },
      infraestructura: {
        centrosSalud: { cantidad: 1, valorUnitario: 500000000, valorTotal: 500000000 },
        centrosEducativos: { cantidad: 2, valorUnitario: 300000000, valorTotal: 600000000 },
        viasMetros: { cantidad: 500, valorUnitario: 2000000, valorTotal: 1000000000 },
        puentesVehiculares: { cantidad: 1, valorUnitario: 2000000000, valorTotal: 2000000000 },
        puentesPeatonales: { cantidad: 3, valorUnitario: 50000000, valorTotal: 150000000 },
        redesElectricas: { cantidad: 10, valorUnitario: 10000000, valorTotal: 100000000 },
        acueducto: { cantidad: 1, valorUnitario: 500000000, valorTotal: 500000000 },
        alcantarillado: { cantidad: 1, valorUnitario: 500000000, valorTotal: 500000000 }
      },
      serviciosPublicos: {
        acueducto: { cantidad: 1, valorUnitario: 100000000, valorTotal: 100000000 },
        alcantarillado: { cantidad: 1, valorUnitario: 100000000, valorTotal: 100000000 },
        energia: { cantidad: 1, valorUnitario: 50000000, valorTotal: 50000000 },
        gas: { cantidad: 1, valorUnitario: 20000000, valorTotal: 20000000 }
      },
      necesidades: {
        mercados: { cantidad: 500, valorUnitario: 150000, valorTotal: 75000000 },
        kitsAseo: { cantidad: 500, valorUnitario: 80000, valorTotal: 40000000 },
        kitsCocina: { cantidad: 200, valorUnitario: 120000, valorTotal: 24000000 },
        frazadas: { cantidad: 600, valorUnitario: 40000, valorTotal: 24000000 },
        colchonetas: { cantidad: 600, valorUnitario: 60000, valorTotal: 36000000 },
        aguaLitros: { cantidad: 5000, valorUnitario: 2000, valorTotal: 10000000 },
        maquinariaHoras: { cantidad: 100, valorUnitario: 300000, valorTotal: 30000000 }
      },
      costoTotalEstimado: 7787500000
    }
  ],
  financialDocuments: [],
  financialAuditIssues: [],
  financialTraceability: [],
  globalICF: 100,
  globalTechnicalSheet: {
    operativeName: "SRR-2026 Inteligencia Territorial",
    generalObjective: "Medir el Constructo Social del Riesgo y percepción de vulnerabilidad.",
    specificObjectives: ["Identificar nodos de riesgo social", "Evaluar resiliencia comunitaria"],
    universeDescription: "Comunidades en áreas de influencia bajo estándares OCDE.",
    analysisUnit: ["Hogar", "Individuo"],
    coverage: {
      levels: ["Departamental", "Municipal"],
      classification: ["Urbana", "Rural"],
      prioritizedZones: ["Zonas de alta amenaza"]
    },
    samplingDesign: {
      type: "Muestreo Aleatorio Simple (MAS) Estratificado",
      sampleSize: 1200,
      selectionCriteria: ["Ubicación en zona de riesgo", "Residencia permanente"]
    },
    collectionMethod: ["CAPI (Computer-Assisted Personal Interviewing)"],
    collectionPeriod: "Bimensual",
    conceptualFramework: "Marco de gobernanza del riesgo OCDE 2026",
    limitations: ["Acceso a zonas de orden público", "Conectividad intermitente"],
    expectedResults: ["Mapa de calor social", "Índice de vulnerabilidad percibida"],
    normativity2026: true
  },
  surveys: [],
  surveyResponses: [],
  surveyAnalyses: []
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(() => {
    try {
      return !localStorage.getItem('srr_app_state');
    } catch (e) {
      return true;
    }
  });
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<GlobalState>(() => {
    try {
      const saved = localStorage.getItem('srr_app_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure critical arrays exist even in sync load
        return {
          ...EMPTY_STATE,
          ...parsed
        };
      }
    } catch (e) {}
    return EMPTY_STATE;
  });
  const [hasSyncedWithCloud, setHasSyncedWithCloud] = useState(false);
  const [isCloudCheckComplete, setIsCloudCheckComplete] = useState(false);
  const isSyncingRef = useRef(false);

  const repairAllUrls = useCallback(async () => {
    setSyncing(true);
    try {
      const { getRepairedUrl } = await import('../lib/storage');
      
      const repairUrls = async (obj: any): Promise<any> => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
          return Promise.all(obj.map(item => repairUrls(item)));
        }
        
        const newObj = { ...obj };
        let changed = false;
        
        for (const key in newObj) {
          const value = newObj[key];
          if (typeof value === 'string' && value.includes('/storage/v1/object/public/')) {
            const repaired = await getRepairedUrl(value);
            if (repaired && repaired !== value) {
              newObj[key] = repaired;
              changed = true;
            }
          } else if (typeof value === 'object' && value !== null) {
            const repairedSub = await repairUrls(value);
            if (repairedSub !== value) {
              newObj[key] = repairedSub;
              changed = true;
            }
          }
        }
        return changed ? newObj : obj;
      };

      const newState = await repairUrls(state);
      if (newState !== state) {
        setState(newState);
        showAlert('Reparación de URLs completada. Se encontraron y corrigieron enlaces rotos.');
      } else {
        showAlert('No se encontraron URLs rotas que requieran reparación.');
      }
    } catch (err) {
      console.error('Error repairing URLs:', err);
      showAlert('Error al intentar reparar las URLs.');
    } finally {
      setSyncing(false);
    }
  }, [state]);

  const clearAllData = useCallback(async () => {
    setState(EMPTY_STATE);
    localStorage.removeItem(STORAGE_KEY);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('app_state').delete().eq('user_id', user.id);
      }
    } catch (err) {
      console.error('Error clearing data from Supabase:', err);
    }
  }, []);

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `copia_seguridad_srr_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    showAlert('Copia de seguridad local (JSON) descargada con éxito.');
  };

  const importFromJSON = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const importedData = JSON.parse(json);
        if (importedData && typeof importedData === 'object') {
          const recalculated = recalculateAll({ ...EMPTY_STATE, ...importedData });
          setState(recalculated);
          showAlert('Datos importados correctamente desde el archivo JSON.');
        }
      } catch (err) {
        console.error('Error importing JSON:', err);
        showAlert('Error al leer el archivo JSON. El formato no es válido.');
      }
    };
    reader.readAsText(file);
  };

  const recalculateAll = useCallback((inputState: GlobalState): GlobalState => {
    try {
      // Normalizar proyectos (algunos usuarios pueden tener ProjectData en lugar de Project en el array)
      const rawProyectos = Array.isArray(inputState.proyectos) ? inputState.proyectos : [];
      const normalizedProyectos = rawProyectos.map((p: any) => {
        // Si p tiene una propiedad 'project', es un ProjectData anidado por error
        if (p && p.project && p.project.id) return p.project;
        return p;
      });

      // Garantizar que todas las colecciones existan para evitar errores de .map()
      const currentState: GlobalState = { 
        ...EMPTY_STATE, 
        ...inputState,
        proyectos: normalizedProyectos,
        contratos: Array.isArray(inputState.contratos) ? inputState.contratos : [],
        otrosies: Array.isArray(inputState.otrosies) ? inputState.otrosies : [],
        convenios: Array.isArray(inputState.convenios) ? inputState.convenios : [],
        afectaciones: Array.isArray(inputState.afectaciones) ? inputState.afectaciones : [],
        pagos: Array.isArray(inputState.pagos) ? inputState.pagos : [],
        avances: Array.isArray(inputState.avances) ? inputState.avances : [],
        informesInterventoria: Array.isArray(inputState.informesInterventoria) ? inputState.informesInterventoria : [],
        presupuestos: Array.isArray(inputState.presupuestos) ? inputState.presupuestos : [],
        professionals: Array.isArray(inputState.professionals) ? inputState.professionals : [],
        comisiones: Array.isArray(inputState.comisiones) ? inputState.comisiones : [],
        financialDocuments: Array.isArray(inputState.financialDocuments) ? inputState.financialDocuments : [],
        eventos: Array.isArray(inputState.eventos) ? inputState.eventos : []
      };

    // Optimization: Index relations for O(N) performance
    const contractsByProject = new Map<string, Contract[]>();
    currentState.contratos.forEach(c => {
      const list = contractsByProject.get(c.projectId) || [];
      list.push(c);
      contractsByProject.set(c.projectId, list);
    });

    const projectsByConvenio = new Map<string, Project[]>();
    currentState.proyectos.forEach(p => {
      if (p.convenioId) {
        const list = projectsByConvenio.get(p.convenioId) || [];
        list.push(p);
        projectsByConvenio.set(p.convenioId, list);
      }
    });

    const otrosiesByContract = new Map<string, Otrosie[]>();
    const otrosiesByConvenio = new Map<string, Otrosie[]>();
    currentState.otrosies.forEach(o => {
      if (o.contractId) {
        const list = otrosiesByContract.get(o.contractId) || [];
        list.push(o);
        otrosiesByContract.set(o.contractId, list);
      }
      if (o.convenioId) {
        const list = otrosiesByConvenio.get(o.convenioId) || [];
        list.push(o);
        otrosiesByConvenio.set(o.convenioId, list);
      }
    });

    const afectacionesByProject = new Map<string, Afectacion[]>();
    currentState.afectaciones.forEach(a => {
      if (a.projectId) {
        const list = afectacionesByProject.get(a.projectId) || [];
        list.push(a);
        afectacionesByProject.set(a.projectId, list);
      }
    });

    const pagosByContract = new Map<string, Pago[]>();
    currentState.pagos.forEach(p => {
      const list = pagosByContract.get(p.contractId) || [];
      list.push(p);
      pagosByContract.set(p.contractId, list);
    });

    const reportsByProject = new Map<string, typeof currentState.informesInterventoria>();
    currentState.informesInterventoria.forEach(r => {
      const list = reportsByProject.get(r.projectId) || [];
      list.push(r);
      reportsByProject.set(r.projectId, list);
    });

    const avancesByProject = new Map<string, typeof currentState.avances>();
    currentState.avances.forEach(a => {
      const list = avancesByProject.get(a.projectId) || [];
      list.push(a);
      avancesByProject.set(a.projectId, list);
    });

    const conveniosById = new Map<string, Convenio>();
    currentState.convenios.forEach(c => conveniosById.set(c.id, c));

    // 1. Update Contracts
    const updatedContratos = currentState.contratos.map(contract => {
      const contractOtrosies = otrosiesByContract.get(contract.id) || [];
      const contractPagos = pagosByContract.get(contract.id) || [];
      const totals = calculateContractTotals(contract, contractOtrosies, [], currentState.pagos);
      return {
        ...contract,
        fechaFin: totals.fechaFinCalculada,
        valorPagado: totals.valorPagado
      };
    });

    // Index updated contracts
    const updatedContractsByProject = new Map<string, Contract[]>();
    updatedContratos.forEach(c => {
      const list = updatedContractsByProject.get(c.projectId) || [];
      list.push(c);
      updatedContractsByProject.set(c.projectId, list);
    });

    // 2. Update Projects
    const updatedProyectos = currentState.proyectos.map(project => {
      // If project has a convenio, we need contracts for all projects in that convenio
      let relatedProjectIds = [project.id];
      if (project.convenioId) {
        const convenioProjects = projectsByConvenio.get(project.convenioId) || [];
        relatedProjectIds = [...new Set([...relatedProjectIds, ...convenioProjects.map(p => p.id)])];
      }

      const projectContracts = relatedProjectIds.flatMap(id => updatedContractsByProject.get(id) || []);
      const projectAfectaciones = relatedProjectIds.flatMap(id => afectacionesByProject.get(id) || []);
      
      const projectOtrosies = projectContracts.flatMap(c => otrosiesByContract.get(c.id) || []);
      if (project.convenioId) {
        const convenioOtrosies = otrosiesByConvenio.get(project.convenioId) || [];
        projectOtrosies.push(...convenioOtrosies);
      }
      
      const uniqueOtrosies = [...new Map(projectOtrosies.map(o => [o.id, o])).values()];

      const projectPagos = projectContracts.flatMap(c => pagosByContract.get(c.id) || []);

      const totals = calculateProjectTotals(
        project, 
        projectContracts, 
        uniqueOtrosies, 
        currentState.convenios, 
        projectAfectaciones, 
        projectPagos, 
        project.suspensiones || [], 
        undefined, 
        currentState.proyectos,
        currentState.informesInterventoria,
        currentState.presupuestos
      );
      
      const totalPagado = totals.valorEjecutado;
      const avanceFinanciero = totals.valorTotal > 0 ? (totalPagado / totals.valorTotal) * 100 : (project.avanceFinanciero || 0);

      // Calculate physical progress based on indexed data
      const projectReports = reportsByProject.get(project.id) || [];
      const projectAvances = avancesByProject.get(project.id) || [];
      
      let avanceFisico = project.avanceFisico || 0;
      
      if (projectReports.length > 0) {
        // Use the latest report's physical progress
        const latestReport = projectReports.sort((a, b) => new Date(b.fechaFin).getTime() - new Date(a.fechaFin).getTime())[0];
        avanceFisico = latestReport.obraEjecutadaPct;
      } else if (projectAvances.length > 0) {
        // Fallback to latest advance
        const latestAvance = projectAvances.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];
        avanceFisico = latestAvance.fisicoPct;
      }

      // Populate impact metrics based on department or matrix if missing
      const deptData = mockDepartments.find(d => d.name === project.departamento);
      
      let poblacionBeneficiada = project.poblacionBeneficiada || project.matrix?.personasBeneficiadas;
      if (!poblacionBeneficiada) {
        poblacionBeneficiada = deptData ? Math.floor(deptData.population * 0.05) : ((project.id.length * 1000) + 5000); // 5% of dept population or fallback
      }

      let riesgoAntes = project.riesgoAntes;
      if (!riesgoAntes) {
        riesgoAntes = deptData ? deptData.riskIndex : 85; // Use dept risk or default high risk
      }

      let riesgoDespues = project.riesgoDespues;
      if (!riesgoDespues) {
        riesgoDespues = Math.max(10, riesgoAntes - (avanceFisico * 0.75)); // Decreases as physical progress increases
      }

      let coherenciaTerritorial = project.coherenciaTerritorial;
      if (!coherenciaTerritorial) {
        coherenciaTerritorial = deptData ? Math.min(100, deptData.disasterHistoryScore + 10) : (80 + (project.id.length % 20));
      }

      return {
        ...project,
        fechaFin: totals.fechaFinCalculada,
        avanceFinanciero: Number(avanceFinanciero.toFixed(2)),
        avanceFisico: Number(avanceFisico.toFixed(2)),
        poblacionBeneficiada,
        riesgoAntes,
        riesgoDespues,
        coherenciaTerritorial
      };
    });

    // 3. Update Budgets
    const updatedPresupuestos = updatedProyectos.map(project => {
      const existingPresupuesto = currentState.presupuestos.find(p => p.projectId === project.id);
      const totals = calculateProjectTotals(
        project, 
        updatedContratos, 
        currentState.otrosies, 
        currentState.convenios, 
        currentState.afectaciones, 
        currentState.pagos, 
        project.suspensiones || [], 
        undefined, 
        updatedProyectos,
        currentState.informesInterventoria,
        currentState.presupuestos
      );
      
      const totalPagado = totals.valorEjecutado;
      const profsInProject = currentState.professionals.filter(p => p.projectId === project.id);
      const valorComprometido = profsInProject.reduce((sum, p) => sum + (p.valorTotalContrato || 0), 0);
      
      const comisionesInProject = currentState.comisiones.filter(c => c.projectId === project.id);
      const valorComprometidoComisiones = comisionesInProject.reduce((sum, c) => sum + (c.costoTotal || 0), 0);

      if (existingPresupuesto) {
        // Reconcile contributions (assuming Fngrd covers additions)
        const diff = totals.valorTotal - existingPresupuesto.valorTotal;
        
        return {
          ...existingPresupuesto,
          valorTotal: totals.valorTotal,
          aportesFngrd: (existingPresupuesto.aportesFngrd || 0) + diff,
          pagosRealizados: totalPagado,
          valorComprometidoProfesionales: valorComprometido,
          valorComprometidoComisiones: valorComprometidoComisiones,
          valorDisponible: totals.valorTotal - valorComprometido - valorComprometidoComisiones
        };
      } else {
        // Create a new presupuesto if it doesn't exist
        return {
          id: `PRE-DEF-${project.id}`,
          projectId: project.id,
          cdp: project.matrix?.cdpConvenio || project.matrix?.cdpObra || 'N/A',
          rc: project.matrix?.rcConvenio || project.matrix?.rcObra || 'N/A',
          valorTotal: totals.valorTotal,
          aportesFngrd: project.matrix?.aporteFngrdObraInterventoria || totals.valorTotal,
          aportesMunicipio: project.matrix?.aporteMunicipioGobernacionObraInterventoria || 0,
          pagosRealizados: totalPagado,
          valorComprometidoProfesionales: valorComprometido,
          valorComprometidoComisiones: valorComprometidoComisiones,
          valorDisponible: totals.valorTotal - valorComprometido - valorComprometidoComisiones,
          vigencia: project.vigencia || '2026',
          lineaInversion: project.linea || 'N/A'
        };
      }
    });

    // 4. Update Professionals
    const updatedProfessionals = currentState.professionals.map(prof => {
      const totalHoras = (prof.horasReuniones || 0) + (prof.horasPMU || 0) + (prof.horasSeguimiento || 0) + (prof.horasCoordinacion || 0);
      
      // Use 160 hours (20 days * 8 hours) as default if no individual hours are provided
      const horasParaCalculo = (totalHoras > 0) ? totalHoras : 160;
      
      // Only recalculate if current values are 0 or undefined, to preserve existing data
      const newHorasEstimadas = (prof.horasEstimadas && prof.horasEstimadas > 0) ? prof.horasEstimadas : totalHoras;
      const newValorHora = (prof.valorHora && prof.valorHora > 0) ? prof.valorHora : (prof.salarioMensual || 0) / horasParaCalculo;

      const updatedProf = {
        ...prof,
        horasEstimadas: newHorasEstimadas,
        valorHora: newValorHora
      };
      return updatedProf;
    });

    // 5. Update Events Financial Tracking
    const updatedEventos = currentState.eventos.map(evento => {
      const eventDocs = currentState.financialDocuments.filter(d => d.eventoId === evento.id);
      
      const presupuestoAsignado = eventDocs
        .filter(d => d.tipo === 'CDP')
        .reduce((sum, d) => sum + (d.valor || 0), 0);
        
      const valorComprometido = eventDocs
        .filter(d => d.tipo === 'RC')
        .reduce((sum, d) => sum + (d.valor || 0), 0);
        
      const valorPagado = eventDocs
        .filter(d => (d.valorPagado && d.valorPagado > 0))
        .reduce((sum, d) => sum + (d.valorPagado || 0), 0);
        
      const cdps = Array.from(new Set(eventDocs.filter(d => d.tipo === 'CDP').map(d => d.numero)));
      const rcs = Array.from(new Set(eventDocs.filter(d => d.tipo === 'RC').map(d => d.numero)));

      return {
        ...evento,
        metrics: {
          ...evento.metrics,
          financiero: {
            presupuestoAsignado,
            valorComprometido,
            valorPagado,
            valorPorPagar: valorComprometido - valorPagado,
            cdps,
            rcs
          }
        }
      };
    });

    // 6. Global Total Paid KPI
    // Separate calculation for performance if needed, but for now direct sum
    const globalTotalPagado = currentState.pagos.reduce((sum, p) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0);

    // 7. Financial Traceability and Audit
    const auditIssues: FinancialAuditIssue[] = [];
    const traceability: FinancialTraceability[] = [];

    // Group financial documents by their "logical chain"
    const cdps = currentState.financialDocuments.filter(d => d.tipo === 'CDP');
    
    cdps.forEach(cdp => {
      // Find related RC
      // Logic: RC links to CDP via numeroCdp or numeroRc (if numeroRc was used as a cross-ref)
      const relatedDocs = currentState.financialDocuments.filter(d => 
        d.id === cdp.id || 
        (d.tipo === 'RC' && (d.numeroCdp === cdp.numero || d.numeroRc === cdp.numero))
      );

      const rc = relatedDocs.find(d => d.tipo === 'RC');

      // Calcular valor pagado (priorizando pagos detallados enlazados al RC, si no existen usa el campo antiguo)
      const pagosForRC = rc ? currentState.pagos.filter(p => p.rcId === rc.id || (p.contractId && p.contractId === rc.contractId)) : [];
      
      const valorPagado = pagosForRC.reduce((sum, p) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0) > 0 
        ? pagosForRC.reduce((sum, p) => sum + (p.estado === 'Pagado' ? p.valor : 0), 0)
        : relatedDocs.reduce((sum, r) => sum + (r.valorPagado || 0), 0);

      let icf = 100;

      const trace: FinancialTraceability = {
        id: `TRC-${cdp.id}`,
        cdpId: cdp.id,
        rcId: rc?.id,
        rpIds: [],
        contractId: cdp.contractId || rc?.contractId,
        convenioId: cdp.convenioId || rc?.convenioId,
        projectId: cdp.projectId || rc?.projectId,
        eventoId: cdp.eventoId || rc?.eventoId,
        status: valorPagado >= (rc?.valor || cdp.valor) ? 'Cerrado' : (valorPagado > 0 ? 'Ejecución' : (rc ? 'Compromiso' : 'Disponibilidad')),
        valorCDP: cdp.valor,
        valorRC: rc?.valor || 0,
        valorRP: 0,
        valorPagado,
        saldoPorComprometer: cdp.valor - (rc?.valor || 0),
        saldoPorContratar: (rc?.valor || 0) - (cdp.contractId ? (currentState.contratos.find(c => c.id === cdp.contractId)?.valor || 0) : 0),
        saldoPorPagar: (rc?.valor || 0) - valorPagado,
        lastAuditDate: new Date().toISOString(),
        hasInconsistencies: false,
        inconsistencyCount: 0,
        icf: 100,
        semaforo: 'Verde'
      };

      // Rule 1: RC <= CDP
      if (trace.valorRC > trace.valorCDP) {
        auditIssues.push({
          id: `AUD-EXC-RC-${cdp.id}`,
          severity: 'Alta',
          type: 'Exceso',
          entityId: rc!.id,
          entityType: 'RC',
          description: `El valor del RC (${rc!.valor}) excede el valor del CDP (${cdp.valor}).`,
          suggestedFix: 'Ajustar el valor del RC o adicionar el CDP.',
          date: new Date().toISOString()
        });
        trace.hasInconsistencies = true;
        trace.inconsistencyCount++;
        icf -= 40;
      }

      // Rule 2: Pagado <= RC
      if (trace.valorPagado > trace.valorRC && trace.valorRC > 0) {
        auditIssues.push({
          id: `AUD-EXC-RP-${cdp.id}`,
          severity: 'Alta',
          type: 'Exceso',
          entityId: cdp.id,
          entityType: 'CDP',
          description: `El valor pagado (${trace.valorPagado}) excede el compromiso (RC: ${trace.valorRC}).`,
          suggestedFix: 'Verificar los pagos registrados.',
          date: new Date().toISOString()
        });
        trace.hasInconsistencies = true;
        trace.inconsistencyCount++;
        icf -= 40;
      }

      // Rule 3: Date Coherence (CDP <= RC)
      if (rc && new Date(rc.fecha) < new Date(cdp.fecha)) {
        auditIssues.push({
          id: `AUD-DATE-RC-${cdp.id}`,
          severity: 'Media',
          type: 'InconsistenciaTemporal',
          entityId: rc.id,
          entityType: 'RC',
          description: `La fecha del RC (${rc.fecha}) es anterior a la del CDP (${cdp.fecha}).`,
          suggestedFix: 'Corregir la fecha del documento.',
          date: new Date().toISOString()
        });
        trace.hasInconsistencies = true;
        trace.inconsistencyCount++;
        icf -= 20;
      }

      // Rule 4: Orphan Resources
      if (!trace.projectId && !trace.convenioId && !trace.eventoId) {
        auditIssues.push({
          id: `AUD-ORP-${cdp.id}`,
          severity: 'Media',
          type: 'FaltaVinculo',
          entityId: cdp.id,
          entityType: 'CDP',
          description: `El CDP No. ${cdp.numero} no está vinculado a ningún proyecto, convenio o evento (Recurso Huérfano).`,
          suggestedFix: 'Vincular el documento a una entidad ejecutora.',
          date: new Date().toISOString()
        });
        trace.hasInconsistencies = true;
        trace.inconsistencyCount++;
        icf -= 15;
      }

      // Rule 5: Double Imputation Detection
      const duplicates = currentState.financialDocuments.filter(d => 
        d.id !== cdp.id && d.tipo === cdp.tipo && d.numero === cdp.numero && d.valor === cdp.valor
      );
      if (duplicates.length > 0) {
        auditIssues.push({
          id: `AUD-DUP-${cdp.id}`,
          severity: 'Alta',
          type: 'Duplicidad',
          entityId: cdp.id,
          entityType: 'CDP',
          description: `Se detectó una posible doble imputación para el CDP No. ${cdp.numero}.`,
          suggestedFix: 'Eliminar el registro duplicado.',
          date: new Date().toISOString()
        });
        trace.hasInconsistencies = true;
        trace.inconsistencyCount++;
        icf -= 50;
      }

      trace.icf = Math.max(0, icf);
      trace.semaforo = trace.icf >= 80 ? 'Verde' : (trace.icf >= 50 ? 'Amarillo' : 'Rojo');
      traceability.push(trace);
    });

    const globalICF = traceability.length > 0 
      ? traceability.reduce((sum, t) => sum + t.icf, 0) / traceability.length 
      : 100;

    // 7. Update Project Executions based on Financial Traceability
    const updatedProyectosWithFinance = updatedProyectos.map(p => {
      const projectTraceability = traceability.filter(t => t.projectId === p.id);
      const totalCDP = projectTraceability.reduce((sum, t) => sum + t.valorCDP, 0);
      const totalRC = projectTraceability.reduce((sum, t) => sum + t.valorRC, 0);
      const totalRP = projectTraceability.reduce((sum, t) => sum + t.valorRP, 0);
      const totalPagado = projectTraceability.reduce((sum, t) => sum + t.valorPagado, 0);

      if (projectTraceability.length === 0) return p;

      return {
        ...p,
        matrix: {
          ...p.matrix,
          valorTotalProyecto: p.matrix?.valorTotalProyecto || totalCDP,
          valorComprometido: totalRC,
          valorPagado: totalPagado,
          valorPorPagar: totalRC - totalPagado,
          ejecucionFinanciera: totalRC > 0 ? (totalPagado / totalRC) * 100 : 0
        }
      };
    });

    return {
      ...currentState,
      contratos: updatedContratos,
      proyectos: updatedProyectosWithFinance,
      presupuestos: updatedPresupuestos,
      professionals: updatedProfessionals,
      eventos: updatedEventos,
      financialAuditIssues: auditIssues,
      financialTraceability: traceability,
      globalICF,
      globalTotalPagado
    };
  } catch (err) {
    console.error('CRITICAL ERROR in recalculateAll:', err);
    return inputState;
  }
}, []);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      // If we already have state from sync load, don't set loading to true
      // This prevents the flickering splash screen
      const alreadyLoaded = state.proyectos.length > 0 || state.contratos.length > 0;
      if (!alreadyLoaded) setLoading(true);

      try {
        // 1. Try LocalStorage
        const savedState = localStorage.getItem(STORAGE_KEY);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          const recalculated = recalculateAll({ 
            ...EMPTY_STATE, 
            ...parsedState, 
            convenios: parsedState.convenios || [],
            historicalEvents: parsedState.historicalEvents || [] 
          });
          setState(recalculated);
          setLoading(false);
          return;
        }

        // 2. Fallback to Empty Data (Clean Slate)
        const municipios = colombiaData.flatMap((dept, deptIndex) => 
          dept.municipalities.map((m, mIndex) => ({
            id: `${dept.id}-${mIndex}`,
            nombre: m,
            departamentoId: dept.id
          }))
        );
        const riesgosTerritoriales: RiesgoTerritorial[] = municipios.map((m, index) => ({
          id: `riesgo-${index}`,
          municipioId: m.id,
          tipo_riesgo: 'inundación',
          probabilidad: Math.random(),
          impacto: 'alto',
          poblacion_expuesta: Math.floor(Math.random() * 10000),
          fecha_actualizacion: '2026-03-26',
          fuente: 'IA'
        }));
        setState(recalculateAll({ 
          ...EMPTY_STATE,
          municipios,
          riesgosTerritoriales
        }));
        setLoading(false);
      } catch (err: any) {
        setLoading(false);
        console.error('Error loading initial state:', err);
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialState();
  }, [clearAllData, recalculateAll]);

  // Optimized Save to LocalStorage with Debounce
  useEffect(() => {
    if (loading || !isCloudCheckComplete) return;

    const timer = setTimeout(() => {
      try {
        if (!state || typeof state !== 'object') return;
        
        // Optimize: Exclude large/static data from LocalStorage proactively
        // 1. Static geographic data (municipios, departamentos)
        const { municipios, departamentos, ...restState } = state;
        
        // 2. Prune heavy objects that can be re-calculated or aren't critical for initial load
        const stateToSave = {
          ...restState,
          // Remove AI analysis from documents and contracts as they are very large
          documentos: state.documentos.map(d => ({ 
            ...d, 
            analysis: undefined,
            // Prune versions as they might contain large URLs/content
            versiones: d.versiones?.map(v => ({
              ...v,
              // Remove base64 from version URLs
              url: v.url?.startsWith('data:') ? '' : v.url
            })) || []
          })),
          documentosSoporte: state.documentosSoporte?.map(d => ({
            ...d,
            // Remove base64 from support document URLs
            url: d.url?.startsWith('data:') ? '' : d.url
          })) || [],
          contratos: state.contratos.map(c => ({ ...c, analysis: undefined })),
          // Truncate non-critical historical arrays
          historicalEvents: state.historicalEvents?.slice(-100) || [],
          systemReports: state.systemReports?.slice(-20) || [],
          alertas: state.alertas?.slice(-50) || [],
          seguimientos: state.seguimientos?.slice(-100) || []
        };
        
        // Final size check
        const serialized = JSON.stringify(stateToSave);
        
        // If still too large (approx), do even more aggressive pruning
        if (serialized.length > 4000000) { // > 4MB approx
          console.warn('State still too large for LocalStorage. Pruning documents for cache efficiency.');
          const efficientState = {
            ...stateToSave,
            documentos: [], // Documents are usually re-fetched or synced from Cloud anyway
            historicalEvents: stateToSave.historicalEvents.slice(-20)
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(efficientState));
        } else {
          localStorage.setItem(STORAGE_KEY, serialized);
        }
        
        console.log(`LocalStorage sync completed (${(serialized.length / 1024).toFixed(1)} KB)`);
      } catch (err: any) {
        // Fallback for extreme cases
        if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
          console.warn('LocalStorage quota exceeded despite pruning. Using minimal cache.');
          try {
            const minimalState = {
              ...EMPTY_STATE,
              proyectos: state.proyectos,
              contratos: state.contratos.map(c => ({ id: c.id, numero: c.numero })) // Just IDs and numbers
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(minimalState));
          } catch (minimalErr) {
            console.error('Failed to save even minimal state to LocalStorage');
          }
        } else {
          console.error('Error saving to LocalStorage:', err);
        }
      }
    }, 3000); 

    return () => clearTimeout(timer);
  }, [state, loading, isCloudCheckComplete]);

  // Debounced Save to Supabase
  useEffect(() => {
    if (loading || !isCloudCheckComplete) return;

    const timer = setTimeout(() => {
      // Bloquear auto-guardado si:
      // 1. No hemos sincronizado con la nube aún.
      // 2. El estado está vacío (0 proyectos) Y la nube tenía datos (prevenir sobrescritura accidental).
      if (!isSupabaseConfigured) return;
      
      if (!hasSyncedWithCloud) {
        console.log('Postponing auto-save until cloud sync check is complete');
        return;
      }

      // Si el estado actual está vacío pero creemos que debería haber datos, NO guardar.
      // Esto protege contra errores de carga o parseo que devuelven un estado vacío.
      const hasRecentData = state.proyectos.length > 0 || state.contratos.length > 0;
      if (!hasRecentData) {
        console.log('Blocking auto-save of empty state to protect cloud consistency');
        return;
      }

      saveToSupabase(false);
    }, 15000); // 15 seconds of inactivity

    return () => clearTimeout(timer);
  }, [state, loading, hasSyncedWithCloud, isCloudCheckComplete]);

  // Carga automática al detectar usuario (para sincronización multi-PC)
  useEffect(() => {
    if (!isSupabaseConfigured || hasSyncedWithCloud) {
       if (!isSupabaseConfigured) setIsCloudCheckComplete(true);
       return;
    }

    const checkAndAutoLoad = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('Usuario detectado al iniciar, cargando datos de la nube...');
          await loadFromSupabase(false);
        } else {
          setIsCloudCheckComplete(true);
        }
      } catch (e) {
        setIsCloudCheckComplete(true);
      }
    };

    checkAndAutoLoad();

    // Suscribirse a cambios de auth para cargar datos al iniciar sesión en caliente
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user && !hasSyncedWithCloud) {
        console.log('Evento de sesión:', event, '- Sincronizando datos...');
        await loadFromSupabase(false);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [hasSyncedWithCloud]);

  const saveToSupabase = async (isManual: boolean = false) => {
    if (!isSupabaseConfigured) {
      if (isManual) setError('Supabase no está configurado. No se puede guardar en la nube.');
      return;
    }
    
    setSyncing(true);
    if (isManual) setError(null);
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (authError.message.includes('Refresh Token Not Found') || authError.message.includes('Invalid Refresh Token')) {
          console.warn('Sesión de Supabase expirada o inválida.');
          await supabase.auth.signOut();
          if (isManual) throw new Error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          return;
        }
        if (isManual) throw new Error(`Error de autenticación: ${authError.message}`);
        return;
      }
      if (!user) {
        if (isManual) {
          throw new Error('Debes iniciar sesión para guardar en la nube.');
        }
        // Silently skip auto-save if not logged in
        return;
      }

      // Military-Grade Encryption (AES-256 GCM)
      const stateString = JSON.stringify(state);
      const encryptedState = await encryptData(stateString, ENCRYPTION_SECRET_PREFIX + user.id);

      const { error: upsertError } = await supabase
        .from('app_state')
        .upsert({ 
          user_id: user.id, 
          state: { encrypted: encryptedState }, // Store as an object with encrypted field
          updated_at: new Date().toISOString()
        });

      if (upsertError) throw upsertError;
      
      console.log('Sincronización segura con Supabase exitosa (AES-256)');
    } catch (err: any) {
      console.error('Error saving to Supabase:', err);
      // Only set error state if it was a manual save attempt
      if (isManual) {
        let errorMsg = err.message || 'Error al sincronizar con la nube.';
        if (errorMsg === 'Failed to fetch' || errorMsg.includes('fetch')) {
          errorMsg = 'Error de conexión. Verifica tu internet o si el proyecto de Supabase está activo.';
        }
        setError(errorMsg);
      }
    } finally {
      setSyncing(false);
    }
  };

  const loadFromSupabase = async (isManual: boolean = false) => {
    if (!isSupabaseConfigured) {
      if (isManual) setError('Supabase no está configurado. No se puede cargar desde la nube.');
      return;
    }
    
    if (isSyncingRef.current) {
      console.log('Sincronización en curso, ignorando solicitud duplicada');
      return;
    }

    isSyncingRef.current = true;
    setSyncing(true);
    if (isManual) setError(null);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (authError.message.includes('Refresh Token Not Found') || authError.message.includes('Invalid Refresh Token')) {
          console.warn('Sesión de Supabase expirada o inválida durante la carga.');
          await supabase.auth.signOut();
          if (isManual) throw new Error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          isSyncingRef.current = false;
          setSyncing(false);
          setIsCloudCheckComplete(true);
          return;
        }
        if (isManual) throw new Error(`Error de autenticación: ${authError.message}`);
        return;
      }
      if (!user) {
        if (isManual) {
          throw new Error('Debes iniciar sesión para cargar desde la nube.');
        }
        return;
      }

      console.log('Solicitando datos de Supabase para usuario:', user.id);
      const { data, error: fetchError } = await supabase
        .from('app_state')
        .select('state')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data?.state) {
        let stateToLoad: any = null;
        
        try {
          if (data.state && typeof data.state === 'object' && data.state.encrypted) {
            // Caso 1: Datos encriptados (Formato Nuevo)
            const decryptedString = await decryptData(data.state.encrypted, ENCRYPTION_SECRET_PREFIX + user.id);
            stateToLoad = JSON.parse(decryptedString);
            console.log('Datos desencriptados exitosamente');
          } else if (typeof data.state === 'string') {
            // Caso 2: Datos legacy guardados como string JSON
            stateToLoad = JSON.parse(data.state);
            console.log('Datos legacy (string) cargados y parseados');
          } else if (data.state && typeof data.state === 'object') {
            // Caso 3: Datos legacy guardados como objeto JSON directo
            stateToLoad = data.state;
            console.log('Datos legacy (object) cargados directamente');
          }
        } catch (parseOrDecryptErr) {
          console.error('Error procesando datos de Supabase:', parseOrDecryptErr);
          if (isManual) showAlert('Error al procesar los datos descargados.');
          setIsCloudCheckComplete(true); // Permitir flujo aunque falle para no bloquear UI
          return;
        }

        if (stateToLoad && typeof stateToLoad === 'object') {
          // Normalizar datos (asegurar que son arrays y que los campos críticos existen)
          const normalizedState: GlobalState = {
            ...EMPTY_STATE,
            ...stateToLoad,
            proyectos: Array.isArray(stateToLoad.proyectos) ? stateToLoad.proyectos : [],
            contratos: Array.isArray(stateToLoad.contratos) ? stateToLoad.contratos : [],
            presupuestos: Array.isArray(stateToLoad.presupuestos) ? stateToLoad.presupuestos : [],
            otrosies: Array.isArray(stateToLoad.otrosies) ? stateToLoad.otrosies : [],
            convenios: Array.isArray(stateToLoad.convenios) ? stateToLoad.convenios : [],
            afectaciones: Array.isArray(stateToLoad.afectaciones) ? stateToLoad.afectaciones : [],
            pagos: Array.isArray(stateToLoad.pagos) ? stateToLoad.pagos : [],
            ops: Array.isArray(stateToLoad.ops) ? stateToLoad.ops : [],
            comisiones: Array.isArray(stateToLoad.comisiones) ? stateToLoad.comisiones : [],
            eventos: Array.isArray(stateToLoad.eventos) ? stateToLoad.eventos : [],
            historicalEvents: Array.isArray(stateToLoad.historicalEvents) ? stateToLoad.historicalEvents : [],
            damageRecords: Array.isArray(stateToLoad.damageRecords) ? stateToLoad.damageRecords : [],
            surveys: Array.isArray(stateToLoad.surveys) ? stateToLoad.surveys : [],
            surveyResponses: Array.isArray(stateToLoad.surveyResponses) ? stateToLoad.surveyResponses : [],
            surveyAnalyses: Array.isArray(stateToLoad.surveyAnalyses) ? stateToLoad.surveyAnalyses : []
          };

          const projectCount = normalizedState.proyectos.length;
          const contractCount = normalizedState.contratos.length;
          
          console.log(`--- DIAGNÓSTICO DE CARGA ---`);
          console.log(`Proyectos encontrados: ${projectCount}`);
          console.log(`Contratos encontrados: ${contractCount}`);
          console.log(`Llaves principales en State:`, Object.keys(normalizedState));
          
          if (projectCount === 0 && contractCount > 0) {
            console.error('ERROR ESTRUCTURAL: Se encontraron contratos pero 0 proyectos. Verificando integridad de IDs...');
          }

          // Aplicar recalculado para asegurar consistencia
          const recalculated = recalculateAll(normalizedState);
          
          // --- PROTECCIÓN CRÍTICA CONTRA SOBRESCRITURA ---
          // Si el estado local tiene MÁS datos que la nube, y la nube está sospechosamente vacía,
          // no sobrescribir sin preguntar o al menos loguear el conflicto.
          const localProjectCount = state.proyectos.length;
          if (projectCount === 0 && localProjectCount > 0) {
            console.warn('PROTECCIÓN ACTIVA: Se detectó una nube vacía mientras que el local tiene datos. Ignorando sincronización para evitar pérdida de datos.');
            setHasSyncedWithCloud(true);
            return;
          }

          setState(recalculated);
          setHasSyncedWithCloud(true);
          console.log('Estado de la aplicación actualizado con datos de la nube');
          
          if (isManual) {
            showAlert(`Sincronización exitosa: ${projectCount} proyectos y ${contractCount} contratos cargados.`);
          }
        } else {
          console.warn('El estado cargado no es un objeto válido:', stateToLoad);
          setHasSyncedWithCloud(true); // Evitar bucle
        }
      } else {
        console.log('No se encontraron datos en Supabase para este usuario');
        setHasSyncedWithCloud(true);
        if (isManual) {
          showAlert('No se encontraron datos guardados en la nube para tu cuenta.');
        }
      }
    } catch (err: any) {
      console.error('Error loading from Supabase:', err);
    } finally {
      setSyncing(false);
      setIsCloudCheckComplete(true);
      isSyncingRef.current = false;
    }
  };

  const addInterventoriaReport = (report: InterventoriaReport) => {
    // Prompt 210: Cada informe genera automáticamente un registro en avances
    const newAvance: Avance = {
      id: `AVN-${Date.now()}`,
      projectId: report.projectId,
      reportId: report.id,
      fecha: report.fechaFin,
      fisicoPct: report.obraEjecutadaPct,
      financieroPct: report.valorProgramado > 0 ? (report.valorEjecutado / report.valorProgramado) * 100 : 0, // Simplificación
      programadoPct: report.obraProgramadaPct,
      observaciones: `Avance generado desde informe de interventoría semana ${report.semana}. ${report.observaciones}`,
      reportadoPor: report.interventorResponsable
    };

    let newPago: Pago | null = null;
    if (report.valorPagado && report.valorPagado > 0 && report.contractId) {
      newPago = {
        id: `PAG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        contractId: report.contractId,
        reportId: report.id,
        numero: `PAG-INF-SEM${report.semana}`,
        fecha: report.fechaFin,
        valor: report.valorPagado,
        estado: 'Pagado',
        observaciones: `Pago extraído automáticamente del informe de interventoría semana ${report.semana}.`
      };
    }

    setState(prevState => {
      const newState = {
        ...prevState,
        informesInterventoria: [...prevState.informesInterventoria, report],
        avances: [...prevState.avances, newAvance],
        ...(newPago ? { pagos: [...prevState.pagos, newPago] } : {})
      };
      return recalculateAll(newState);
    });
  };

  const validateInterventoriaReport = (reportId: string, valid: boolean) => {
    setState(prevState => ({
      ...prevState,
      informesInterventoria: prevState.informesInterventoria.map(r => 
        r.id === reportId ? { ...r, validado: valid } : r
      )
    }));
  };

  const addContract = (contract: Contract) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        contratos: [...prevState.contratos, { ...contract, eventos: contract.eventos || [] }]
      };
      return recalculateAll(newState);
    });
  };

  const updateContract = (updatedContract: Contract) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        contratos: prevState.contratos.map(c => c.id === updatedContract.id ? updatedContract : c)
      };
      return recalculateAll(newState);
    });
  };

  const deleteContract = (contractId: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        contratos: prevState.contratos.filter(c => c.id !== contractId)
      };
      return recalculateAll(newState);
    });
  };

  const addContractEvent = (event: ContractEvent) => {
    setState(prevState => {
      const contract = prevState.contratos.find(c => c.id === event.contractId);
      const updatedContratos = prevState.contratos.map(c => 
        c.id === event.contractId 
          ? { ...c, eventos: [...(c.eventos || []), event].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()) }
          : c
      );

      let updatedSeguimientos = prevState.seguimientos;

      if (event.impactoValor !== 0 && contract) {
        const newSeguimiento: Seguimiento = {
          id: `SEG-EVT-${Date.now()}`,
          projectId: contract.projectId,
          fecha: event.fecha,
          tipo: 'Financiero',
          descripcion: `Adición presupuestal detectada en evento contractual: ${event.tipo}. Valor: ${event.impactoValor}. Motivo: ${event.descripcion}`,
          responsable: 'Sistema (Automático)',
          trazabilidad: `Evento ID: ${event.id}`
        };
        updatedSeguimientos = [...prevState.seguimientos, newSeguimiento];
      }

      const newState = {
        ...prevState,
        contratos: updatedContratos,
        seguimientos: updatedSeguimientos
      };
      
      return recalculateAll(newState);
    });
  };

  const addOtrosie = (otrosie: Otrosie) => {
    setState(prevState => {
      const contract = prevState.contratos.find(c => c.id === otrosie.contractId);
      const convenio = prevState.convenios.find(c => c.id === otrosie.convenioId);
      
      let updatedSeguimientos = [...prevState.seguimientos];

      if (otrosie.valorAdicional > 0) {
        if (contract) {
          const newSeguimiento: Seguimiento = {
            id: `SEG-OTS-${Date.now()}`,
            projectId: contract.projectId,
            fecha: otrosie.fechaFirma,
            tipo: 'Financiero',
            descripcion: `Adición presupuestal detectada en Otrosí No. ${otrosie.numero}. Valor: ${otrosie.valorAdicional}. Objeto: ${otrosie.objeto}`,
            responsable: 'Sistema (Automático)',
            trazabilidad: `Otrosí ID: ${otrosie.id}`
          };
          updatedSeguimientos.push(newSeguimiento);
        } else if (convenio) {
          // Si es un otrosí de convenio, agregar seguimiento a todos los proyectos vinculados
          const relevantProjects = prevState.proyectos.filter(p => p.convenioId === convenio.id);
          relevantProjects.forEach(p => {
            const newSeguimiento: Seguimiento = {
              id: `SEG-OTS-CONV-${Date.now()}-${p.id}`,
              projectId: p.id,
              fecha: otrosie.fechaFirma,
              tipo: 'Financiero',
              descripcion: `Adición presupuestal al CONVENIO No. ${convenio.numero} detectada en Otrosí No. ${otrosie.numero}. Valor: ${otrosie.valorAdicional}. Objeto: ${otrosie.objeto}`,
              responsable: 'Sistema (Automático)',
              trazabilidad: `Otrosí Convenio ID: ${otrosie.id}`
            };
            updatedSeguimientos.push(newSeguimiento);
          });
        }
      }

      const newState = {
        ...prevState,
        otrosies: [...prevState.otrosies, otrosie],
        seguimientos: updatedSeguimientos
      };

      return recalculateAll(newState);
    });
  };

  const deleteOtrosie = (otrosieId: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        otrosies: prevState.otrosies.filter(o => o.id !== otrosieId),
        seguimientos: prevState.seguimientos.filter(s => 
          s.trazabilidad !== `Otrosí ID: ${otrosieId}` && 
          s.trazabilidad !== `Otrosí Convenio ID: ${otrosieId}`
        )
      };
      return recalculateAll(newState);
    });
  };

  const addAfectacion = (afectacion: Afectacion) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        afectaciones: [...prevState.afectaciones, afectacion]
      };
      return recalculateAll(newState);
    });
  };

  const updateAfectacion = (afectacion: Afectacion) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        afectaciones: prevState.afectaciones.map(a => a.id === afectacion.id ? afectacion : a)
      };
      return recalculateAll(newState);
    });
  };

  const deleteAfectacion = (id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        afectaciones: prevState.afectaciones.filter(a => a.id !== id)
      };
      return recalculateAll(newState);
    });
  };

  const addPago = (pago: Pago) => {
    setState(prevState => {
      const contract = prevState.contratos.find(c => c.id === pago.contractId);
      
      let updatedSeguimientos = [...prevState.seguimientos];

      if (contract) {
        const newSeguimiento: Seguimiento = {
          id: `SEG-PAG-${Date.now()}`,
          projectId: contract.projectId,
          fecha: pago.fecha,
          tipo: 'Financiero',
          descripcion: `Registro de pago No. ${pago.numero} para contrato ${contract.numero}. Valor: ${pago.valor}. Estado: ${pago.estado}`,
          responsable: 'Sistema (Automático)',
          trazabilidad: `Pago ID: ${pago.id}`
        };
        updatedSeguimientos.push(newSeguimiento);
      }

      const newState = {
        ...prevState,
        pagos: [...prevState.pagos, pago],
        seguimientos: updatedSeguimientos
      };

      return recalculateAll(newState);
    });
  };

  const addPagos = (pagosList: Pago[]) => {
    setState(prevState => {
      // For massive bulk uploads, we skip creating individual Seguimientos 
      // to avoid LocalStorage quota limits and speed up rendering.
      
      const newState = {
        ...prevState,
        pagos: [...prevState.pagos, ...pagosList]
      };

      return recalculateAll(newState);
    });
  };

  const deletePago = (pagoId: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        pagos: prevState.pagos.filter(p => p.id !== pagoId)
      };
      return recalculateAll(newState);
    });
  };

  const updatePago = (pago: Pago) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        pagos: prevState.pagos.map(p => p.id === pago.id ? pago : p)
      };
      return recalculateAll(newState);
    });
  };

  const clearAllPagos = () => {
    setState(prevState => {
      const newState = {
        ...prevState,
        pagos: []
      };
      return recalculateAll(newState);
    });
  };

  const addVigencia = (vigencia: Vigencia) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        vigencias: [...prevState.vigencias, vigencia]
      };
      return recalculateAll(newState);
    });
  };

  const updateVigencia = (updatedVigencia: Vigencia) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        vigencias: prevState.vigencias.map(v => v.id === updatedVigencia.id ? updatedVigencia : v)
      };
      return recalculateAll(newState);
    });
  };

  const deleteVigencia = (id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        vigencias: prevState.vigencias.filter(v => v.id !== id)
      };
      return recalculateAll(newState);
    });
  };

  const addLineaInversion = (linea: LineaInversion) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        lineasInversion: [...prevState.lineasInversion, linea]
      };
      return recalculateAll(newState);
    });
  };

  const updateLineaInversion = (linea: LineaInversion) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        lineasInversion: prevState.lineasInversion.map(l => l.id === linea.id ? linea : l)
      };
      return recalculateAll(newState);
    });
  };

  const addConvenio = (convenio: Convenio) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        convenios: [...prevState.convenios, convenio]
      };
      return recalculateAll(newState);
    });
  };

  const updateConvenio = (updatedConvenio: Convenio) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        convenios: prevState.convenios.map(c => c.id === updatedConvenio.id ? updatedConvenio : c)
      };
      return recalculateAll(newState);
    });
  };

  const addSurvey = (survey: Survey) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        surveys: [...prevState.surveys, survey]
      };
      return recalculateAll(newState);
    });
  };

  const addSurveyResponse = (response: SurveyResponse) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        surveyResponses: [...prevState.surveyResponses, response]
      };
      return recalculateAll(newState);
    });
  };

  const addSurveyAnalysis = (analysis: SurveyAnalysis) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        surveyAnalyses: [...prevState.surveyAnalyses, analysis]
      };
      return recalculateAll(newState);
    });
  };

  const updateGlobalTechnicalSheet = (sheet: TechnicalSheet) => {
    setState(prevState => ({
      ...prevState,
      globalTechnicalSheet: sheet
    }));
    saveToSupabase();
  };

  const deleteSurvey = (surveyId: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        surveys: prevState.surveys.filter(s => s.id !== surveyId),
        surveyResponses: prevState.surveyResponses.filter(r => r.surveyId !== surveyId),
        surveyAnalyses: prevState.surveyAnalyses.filter(a => a.surveyId !== surveyId)
      };
      return recalculateAll(newState);
    });
  };

  const deleteConvenio = (id: string) => {
    setState(prevState => {
      const newState = {
        ...prevState,
        convenios: prevState.convenios.filter(c => c.id !== id)
      };
      return recalculateAll(newState);
    });
  };

  const addFinancialDocument = (doc: FinancialDocument) => {
    addFinancialDocuments([doc]);
  };

  const addFinancialDocuments = (docs: FinancialDocument[]) => {
    setState(prevState => {
      let newPagos = [...prevState.pagos];
      let newSeguimientos = [...prevState.seguimientos];
      let newAfectaciones = [...prevState.afectaciones];
      let newProyectos = [...prevState.proyectos];
      let newConvenios = [...prevState.convenios];
      let newEventos = [...prevState.eventos];

      // Deduplicate: No permitir CDP o RC duplicados (mismo tipo y número)
      const existingDocs = [...prevState.financialDocuments];
      const docsToAdd = docs.filter(newDoc => 
        !existingDocs.some(oldDoc => 
          oldDoc.tipo === newDoc.tipo && 
          oldDoc.numero === newDoc.numero && 
          oldDoc.projectId === newDoc.projectId
        )
      );

      if (docsToAdd.length === 0) return prevState;

      docsToAdd.forEach(doc => {
        // 1. Create Payment if it has paid value
        if ((doc.valorPagado && doc.valorPagado > 0) && doc.contractId) {
          const contract = prevState.contratos.find(c => c.id === doc.contractId);
          const pagoId = `PAG-FIN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          
          const newPago: Pago = {
            id: pagoId,
            contractId: doc.contractId,
            numero: doc.numero,
            fecha: doc.fecha,
            valor: doc.valorPagado,
            estado: 'Pagado',
            observaciones: `Pago registrado automáticamente desde documento financiero ${doc.tipo} No. ${doc.numero}.`
          };
          newPagos.push(newPago);

          if (contract) {
            newSeguimientos.push({
              id: `SEG-PAG-AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              projectId: contract.projectId,
              fecha: doc.fecha,
              tipo: 'Financiero',
              descripcion: `Pago automático registrado desde ${doc.tipo} No. ${doc.numero}. Valor: ${newPago.valor}`,
              responsable: 'Sistema (IA)',
              trazabilidad: `Doc ID: ${doc.id}`
            });
          }
        }

        // 2. Create Afectacion for CDP/RC to ensure they appear in financial calculations
        if (doc.projectId && (doc.tipo === 'CDP' || doc.tipo === 'RC')) {
          const newAfectacion: Afectacion = {
            id: `AFE-FIN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            projectId: doc.projectId,
            contractId: doc.contractId,
            numero: doc.numero,
            tipo: doc.tipo === 'CDP' ? 'Adición' : 'Otro',
            descripcion: `${doc.tipo} No. ${doc.numero}: ${doc.descripcion}`,
            fecha: doc.fecha,
            valor: doc.valor,
            estado: 'Cerrada',
            origenId: doc.id
          };
          newAfectaciones.push(newAfectacion);
        }

        // 3. Update Project Matrix fields if linked to a project
        if (doc.projectId) {
          newProyectos = newProyectos.map(p => {
            if (p.id === doc.projectId) {
              const matrix = { ...(p.matrix || {}) };
              const isInterventoria = doc.descripcion.toLowerCase().includes('interventoria');
              const isConvenio = doc.descripcion.toLowerCase().includes('convenio');

              if (doc.tipo === 'CDP') {
                if (isInterventoria) {
                  matrix.cdpInterventoria = doc.numero;
                  matrix.fechaCdpInterventoria = doc.fecha;
                } else if (isConvenio) {
                  matrix.cdpConvenio = doc.numero;
                  matrix.fechaCdpConvenio = doc.fecha;
                } else {
                  matrix.cdpObra = doc.numero;
                  matrix.fechaCdpObra = doc.fecha;
                }
              } else if (doc.tipo === 'RC') {
                if (isInterventoria) {
                  matrix.rcInterventoria = doc.numero;
                  matrix.fechaRcInterventoria = doc.fecha;
                  matrix.valorRcInterventoria = doc.valor;
                } else if (isConvenio) {
                  matrix.rcConvenio = doc.numero;
                  matrix.fechaRcConvenio = doc.fecha;
                  matrix.valorRcConvenio = doc.valor;
                } else {
                  matrix.rcObra = doc.numero;
                  matrix.fechaRcObra = doc.fecha;
                  matrix.valorRcObra = doc.valor;
                }
              } else if (doc.valorPagado && doc.valorPagado > 0) {
                const pagado = doc.valorPagado || doc.valor;
                const porPagar = doc.valorPorPagar || 0;
                
                if (isInterventoria) {
                  matrix.valorPagadoInterventoria = (matrix.valorPagadoInterventoria || 0) + pagado;
                  matrix.valorPorPagarInterventoria = porPagar;
                } else if (isConvenio) {
                  matrix.valorPagadoConvenio = (matrix.valorPagadoConvenio || 0) + pagado;
                  matrix.valorPorPagarConvenio = porPagar;
                } else {
                  matrix.valorPagadoObra = (matrix.valorPagadoObra || 0) + pagado;
                  matrix.valorPorPagarObra = porPagar;
                }
              }
              return { ...p, matrix };
            }
            return p;
          });
        }

        // 4. Update Evento if linked
        if (doc.eventoId) {
          newEventos = newEventos.map(e => {
            if (e.id === doc.eventoId) {
              const financiero = e.metrics?.financiero || {
                presupuestoAsignado: 0,
                valorComprometido: 0,
                valorPagado: 0,
                valorPorPagar: 0,
                cdps: [],
                rcs: []
              };

              if (doc.tipo === 'CDP') {
                financiero.presupuestoAsignado += doc.valor;
                if (!financiero.cdps.includes(doc.numero)) financiero.cdps.push(doc.numero);
              } else if (doc.tipo === 'RC') {
                financiero.valorComprometido += doc.valor;
                if (!financiero.rcs.includes(doc.numero)) financiero.rcs.push(doc.numero);
              } else if (doc.valorPagado && doc.valorPagado > 0) {
                financiero.valorPagado += (doc.valorPagado || doc.valor);
                financiero.valorPorPagar = doc.valorPorPagar || 0;
              }

              return {
                ...e,
                metrics: {
                  ...e.metrics,
                  financiero
                }
              };
            }
            return e;
          });
        }

        // 5. Update Convenio if linked
        if (doc.convenioId) {
          newConvenios = newConvenios.map(c => {
            if (c.id === doc.convenioId) {
              if (doc.tipo === 'CDP') {
                return { ...c, numero: doc.numero };
              }
              return c;
            }
            return c;
          });
        }
      });

      const newState = {
        ...prevState,
        financialDocuments: [...prevState.financialDocuments, ...docsToAdd],
        pagos: newPagos,
        seguimientos: newSeguimientos,
        afectaciones: newAfectaciones,
        proyectos: newProyectos,
        convenios: newConvenios,
        eventos: newEventos
      };

      return recalculateAll(newState);
    });
  };

  const updateFinancialDocument = (updatedDoc: FinancialDocument) => {
    setState(prevState => ({
      ...prevState,
      financialDocuments: prevState.financialDocuments.map(d => d.id === updatedDoc.id ? updatedDoc : d)
    }));
  };

  const deleteFinancialDocument = (id: string) => {
    setState(prevState => ({
      ...prevState,
      financialDocuments: prevState.financialDocuments.filter(d => d.id !== id)
    }));
  };

  const clearDuplicatesFinancialDocuments = () => {
    setState(prevState => {
      const uniqueDocsMap = new Map();
      prevState.financialDocuments.forEach(d => {
        const key = `${d.tipo}-${d.numero}-${d.projectId || 'none'}`;
        if (!uniqueDocsMap.has(key)) {
          uniqueDocsMap.set(key, d);
        }
      });
      return {
        ...prevState,
        financialDocuments: Array.from(uniqueDocsMap.values())
      };
    });
  };

  const clearFinancialDocuments = () => {
    setState(prevState => ({
      ...prevState,
      financialDocuments: []
    }));
  };

  const addContractor = (contractor: Contractor) => {
    setState(prevState => ({
      ...prevState,
      contratistas: [...prevState.contratistas, contractor]
    }));
  };

  const updateContractor = (contractor: Contractor) => {
    setState(prevState => ({
      ...prevState,
      contratistas: prevState.contratistas.map(c => c.id === contractor.id ? contractor : c)
    }));
  };

  const addContractorEvaluation = (evaluation: ContractorEvaluation) => {
    setState(prevState => ({
      ...prevState,
      evaluacionesContratistas: [...prevState.evaluacionesContratistas, evaluation]
    }));
  };

  const addDocument = (doc: ProjectDocument) => {
    setState(prevState => ({
      ...prevState,
      documentos: [...prevState.documentos, doc]
    }));
    saveToSupabase();
  };

  const deleteDocument = (docId: string) => {
    setState(prevState => ({
      ...prevState,
      documentos: prevState.documentos.filter(d => d.id !== docId)
    }));
    saveToSupabase();
  };

  const updateDocumentAnalysis = (docId: string, analysis: ProjectDocument['analysis']) => {
    setState(prevState => ({
      ...prevState,
      documentos: prevState.documentos.map(d => 
        d.id === docId ? { ...d, analysis } : d
      )
    }));
  };

  const applyDocumentAnalysis = (projectId: string, analysis: ProjectDocument['analysis']) => {
    if (!analysis) return;
    
    setState(prevState => {
      const project = prevState.proyectos.find(p => p.id === projectId);
      if (!project) return prevState;

      let updatedProject = { ...project };

      // Simple logic to update project based on analysis
      if (analysis.type === 'modificación de plazo') {
        const baseDate = new Date(project.fechaFin || project.fechaInicio || Date.now());
        if (!isNaN(baseDate.getTime())) {
          updatedProject.fechaFin = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        }
      } else if (analysis.type === 'adición presupuestal') {
        // This would ideally update the budget, but for now just log it
        console.log('Adición presupuestal detectada, actualizar presupuesto manualmente.');
      }

      if (analysis.riesgosMitigados && analysis.riesgosMitigados.length > 0) {
        updatedProject.riesgosMitigados = Array.from(new Set([...(updatedProject.riesgosMitigados || []), ...analysis.riesgosMitigados]));
      }
      
      if (analysis.poblacionObjetivo) {
        // If there's already a population, maybe keep the max or just update it. We'll update it.
        updatedProject.poblacionObjetivo = Math.max(updatedProject.poblacionObjetivo || 0, analysis.poblacionObjetivo);
      }

      return {
        ...prevState,
        proyectos: prevState.proyectos.map(p => p.id === projectId ? updatedProject : p)
      };
    });
  };

  const addDocumentVersion = (docId: string, version: DocumentVersion) => {
    setState(prevState => ({
      ...prevState,
      documentos: prevState.documentos.map(d => 
        d.id === docId 
          ? { 
              ...d, 
              versiones: [...d.versiones, version],
              ultimaActualizacion: version.fecha 
            } 
          : d
      )
    }));
  };

  const linkDocumentToReport = (docId: string, reportId: string) => {
    setState(prevState => ({
      ...prevState,
      documentos: prevState.documentos.map(doc => 
        doc.id === docId ? { ...doc, reportId } : doc
      ),
      informesInterventoria: prevState.informesInterventoria.map(report => 
        report.id === reportId 
          ? { ...report, documentIds: [...(report.documentIds || []), docId] }
          : report
      )
    }));
  };

  const checkMissingDocuments = (projectId: string) => {
    setState(prevState => {
      const projectDocs = prevState.documentos.filter(d => d.projectId === projectId);
      const requiredDocs = prevState.documentosRequeridos.filter(r => r.projectId === projectId);
      
      const missingDocs = requiredDocs.filter(req => 
        !projectDocs.some(doc => doc.tipo === req.tipo)
      );

      if (missingDocs.length === 0) return prevState;

      const newAlerts: Alert[] = missingDocs.map(missing => ({
        id: `ALR-DOC-${Date.now()}-${missing.id}`,
        projectId,
        tipo: 'Incumplimiento',
        nivel: 'Alto',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'Abierta',
        descripcion: `Documento obligatorio faltante: ${missing.nombre} (${missing.tipo})`
      }));

      // Filter out duplicate alerts for the same missing doc
      const existingAlertDescriptions = prevState.alertas.map(a => a.descripcion);
      const uniqueNewAlerts = newAlerts.filter(a => !existingAlertDescriptions.includes(a.descripcion));

      if (uniqueNewAlerts.length === 0) return prevState;

      return {
        ...prevState,
        alertas: [...prevState.alertas, ...uniqueNewAlerts]
      };
    });
  };

  const updateProfessionalsWorkload = (proyectos: Project[], professionals: Professional[]): Professional[] => {
    return professionals.map(prof => {
      const activeProjects = proyectos.filter(p => 
        (p.estado !== 'Liquidado' && p.estado !== 'Banco de proyectos') && 
        (p.responsableOpsId === prof.id || p.apoyoTecnicoId === prof.id || p.apoyoFinancieroId === prof.id || p.apoyoJuridicoId === prof.id)
      );
      
      const count = activeProjects.length;
      // Estimate 20 hours per month per active project
      const hours = count * 20;
      
      let carga: 'Disponible' | 'Media' | 'Sobrecargado' = 'Disponible';
      if (count > 2 && count <= 5) carga = 'Media';
      if (count > 5) carga = 'Sobrecargado';

      return {
        ...prof,
        proyectosActivos: count,
        horasEstimadas: hours,
        carga
      };
    });
  };

  const updateProject = (updatedProject: Project) => {
    setState(prev => {
      const newProyectos = prev.proyectos.map(p => p.id === updatedProject.id ? updatedProject : p);
      const newState = {
        ...prev,
        proyectos: newProyectos,
        professionals: updateProfessionalsWorkload(newProyectos, prev.professionals)
      };
      return recalculateAll(newState);
    });
  };

  const updatePresupuesto = (updatedPresupuesto: Presupuesto) => {
    setState(prev => {
      const exists = prev.presupuestos.some(p => p.id === updatedPresupuesto.id);
      const newPresupuestos = exists 
        ? prev.presupuestos.map(p => p.id === updatedPresupuesto.id ? updatedPresupuesto : p)
        : [...prev.presupuestos, { ...updatedPresupuesto, id: `PRE-${updatedPresupuesto.projectId}` }];
        
      const newState = {
        ...prev,
        presupuestos: newPresupuestos
      };
      return recalculateAll(newState);
    });
  };

  const deleteProject = async (projectId: string) => {
    setState(prev => {
      const newProyectos = prev.proyectos.filter(p => p.id !== projectId);
      const projectContracts = prev.contratos.filter(c => c.projectId === projectId).map(c => c.id);
      
      const newState = {
        ...prev,
        proyectos: newProyectos,
        contratos: prev.contratos.filter(c => c.projectId !== projectId),
        avances: prev.avances.filter(a => a.projectId !== projectId),
        presupuestos: prev.presupuestos.filter(p => p.projectId !== projectId),
        alertas: prev.alertas.filter(a => a.projectId !== projectId),
        seguimientos: prev.seguimientos.filter(s => s.projectId !== projectId),
        otrosies: prev.otrosies.filter(o => !projectContracts.includes(o.contractId)),
        afectaciones: prev.afectaciones.filter(a => a.projectId !== projectId),
        pagos: prev.pagos.filter(p => !projectContracts.includes(p.contractId)),
        informesInterventoria: prev.informesInterventoria.filter(r => r.projectId !== projectId),
        documentos: prev.documentos.filter(d => d.projectId !== projectId),
        professionals: updateProfessionalsWorkload(newProyectos, prev.professionals)
      };
      return recalculateAll(newState);
    });
    await saveToSupabase();
  };

  const deleteProfessional = (professionalId: string) => {
    setState(prev => {
      const newState = {
        ...prev,
        professionals: prev.professionals.filter(p => p.id !== professionalId)
      };
      return recalculateAll(newState);
    });
    saveToSupabase();
  };

  const addProfessional = (professional: Professional) => {
    setState(prev => {
      const newState = {
        ...prev,
        professionals: [...prev.professionals, professional]
      };
      return recalculateAll(newState);
    });
  };

  const updateProfessional = (professional: Professional) => {
    setState(prev => {
      const newState = {
        ...prev,
        professionals: prev.professionals.map(p => p.id === professional.id ? professional : p)
      };
      return recalculateAll(newState);
    });
  };

  const addComision = (comision: Comision) => {
    setState(prev => ({
      ...prev,
      comisiones: [...prev.comisiones, comision]
    }));
  };

  const updateComision = (comision: Comision) => {
    setState(prev => ({
      ...prev,
      comisiones: prev.comisiones.map(c => c.id === comision.id ? comision : c)
    }));
  };

  const deleteComision = (id: string) => {
    setState(prev => ({
      ...prev,
      comisiones: prev.comisiones.filter(c => c.id !== id)
    }));
  };

  const addSeguimiento = (seguimiento: Seguimiento) => {
    setState(prev => ({
      ...prev,
      seguimientos: [...prev.seguimientos, seguimiento]
    }));
  };

  const addAvance = (projectId: string, avance: Avance) => {
    setState(prev => {
      const newState = {
        ...prev,
        avances: [...prev.avances, avance]
      };
      return recalculateAll(newState);
    });
  };

  const addTask = (task: Task) => {
    setState(prev => ({
      ...prev,
      tasks: [...(prev.tasks || []), task]
    }));
  };

  const updateTask = (task: Task) => {
    setState(prev => ({
      ...prev,
      tasks: (prev.tasks || []).map(t => t.id === task.id ? task : t)
    }));
  };

  const addSystemReport = (report: SystemReport) => {
    setState(prev => ({
      ...prev,
      systemReports: [...(prev.systemReports || []), report]
    }));
  };

  const updateSystemReport = (report: SystemReport) => {
    setState(prev => ({
      ...prev,
      systemReports: (prev.systemReports || []).map(r => r.id === report.id ? report : r)
    }));
  };

  const getProjectData = (projectId: string): ProjectData | undefined => {
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project) return undefined;

    const projectContracts = state.contratos.filter(c => c.projectId === projectId);
    
    // Calculate dynamic totals
    const calculated = calculateProjectTotals(
      project,
      state.contratos,
      state.otrosies,
      state.convenios,
      state.afectaciones,
      state.pagos,
      state.suspensiones,
      state.contratos.flatMap(c => c.eventos || []),
      state.proyectos,
      state.informesInterventoria,
      state.presupuestos
    );

    const actualPresupuesto = state.presupuestos.find(p => p.projectId === projectId);

    const presupuesto: Presupuesto = actualPresupuesto ? {
      ...actualPresupuesto,
      valorTotal: calculated.valorTotal, // Ensure it reflects dynamic additions
      pagosRealizados: calculated.valorEjecutado
    } : {
      id: `PRE-CALC-${projectId}`,
      projectId,
      cdp: 'N/A',
      rc: 'N/A',
      valorTotal: calculated.valorTotal,
      aportesFngrd: 0,
      aportesMunicipio: 0,
      pagosRealizados: calculated.valorEjecutado,
      vigencia: project.vigencia,
      lineaInversion: project.linea,
    };

    return {
      project,
      contracts: projectContracts,
      otrosies: state.otrosies.filter(o => projectContracts.some(c => c.id === o.contractId)),
      afectaciones: state.afectaciones.filter(a => a.projectId === projectId),
      presupuesto,
      avances: state.avances.filter(a => a.projectId === projectId),
      seguimientos: state.seguimientos.filter(s => s.projectId === projectId),
      alerts: state.alertas.filter(a => a.projectId === projectId),
      environmental: state.ambiental.filter(e => e.projectId === projectId),
      interventoriaReports: state.informesInterventoria.filter(r => r.projectId === projectId),
      pagos: state.pagos.filter(p => projectContracts.some(c => c.id === p.contractId)),
      ops: state.ops.filter(o => o.projectId === projectId),
      comisiones: state.comisiones.filter(c => c.projectId === projectId),
      riesgos: state.riesgos.filter(r => r.projectId === projectId),
      polizas: (state.polizas || []).filter(p => p.id_proyecto === projectId),
      documents: state.documentos.filter(d => d.projectId === projectId),
    };
  };

  const addProject = (project: Project) => {
    setState(prevState => {
      const newProyectos = [...prevState.proyectos];
      const newContratos = [...prevState.contratos];
      const newPagos = [...prevState.pagos];
      const newPresupuestos = [...prevState.presupuestos];
      const newAvances = [...prevState.avances];
      const newContratistas = [...prevState.contratistas];
      const newProfessionals = [...prevState.professionals];
      const newDocumentos = [...prevState.documentos];

      const getOrCreateContractor = (nombre: string, nit: string, tipo: 'Persona Natural' | 'Persona Jurídica' | 'Consorcio / Unión Temporal') => {
        if (!nombre || nombre === 'Por definir' || nombre === 'N/A') return undefined;
        let contractor = newContratistas.find(c => (c.nombre || '').toLowerCase() === (nombre || '').toLowerCase() || (c.nit === nit && nit !== 'N/A' && nit !== ''));
        if (!contractor) {
          contractor = {
            id: `CONT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nombre,
            nit: nit || 'N/A',
            tipo,
            fechaRegistro: new Date().toISOString().split('T')[0]
          };
          newContratistas.push(contractor);
        }
        return contractor.id;
      };

      const getOrCreateProfessional = (nombre: string, profesion: string) => {
        if (!nombre || nombre === 'Por definir' || nombre === 'N/A') return undefined;
        let prof = newProfessionals.find(p => (p.nombre || '').toLowerCase() === (nombre || '').toLowerCase());
        if (!prof) {
          prof = {
            id: `PROF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            nombre,
            profesion,
            experienciaAnios: 5,
            especialidades: [profesion],
            sectoresTrabajados: ['Público'],
            proyectosRelevantes: [],
            salarioMensual: 5000000,
            valorHora: 31250,
            proyectosActivos: 0,
            horasEstimadas: 0,
            carga: 'Disponible',
            departamentosExperiencia: []
          };
          newProfessionals.push(prof);
        }
        return prof.id;
      };

      const createDocument = (tipo: any, numero: string, fecha: string, titulo: string) => {
        if (!numero || numero === 'N/A') return;
        newDocumentos.push({
          id: `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          projectId: project.id,
          titulo: `${titulo} - ${numero}`,
          tipo,
          fechaCreacion: fecha || new Date().toISOString().split('T')[0],
          ultimaActualizacion: new Date().toISOString().split('T')[0],
          versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: '#',
            nombreArchivo: `${titulo.replace(/ /g, '_')}.pdf`,
            subidoPor: 'Sistema',
            comentario: 'Documento inicial extraído de matriz',
            accion: 'Subida',
            estado: 'Aprobado'
          }],
          tags: ['Matriz', tipo],
          estado: 'Aprobado'
        });
      };

      let contratistaObraId, contratistaIntId, contratistaConvId;
      if (project.matrix) {
        contratistaObraId = getOrCreateContractor(project.matrix.contratistaObra || '', project.matrix.nitContratistaObra || '', 'Persona Jurídica');
        contratistaIntId = getOrCreateContractor(project.matrix.contratistaInterventoria || '', project.matrix.nitContratistaInterventoria || '', 'Persona Jurídica');
        contratistaConvId = getOrCreateContractor(project.matrix.partesConvenio || '', '', 'Persona Jurídica');

        project.apoyoTecnicoId = getOrCreateProfessional(project.matrix.apoyoTecnico || project.matrix.apoyoTecnicoAntigüo || project.matrix.apoyoTecnico2026 || '', 'Especialista Técnico');
        project.apoyoFinancieroId = getOrCreateProfessional(project.matrix.apoyoFinanciero || '', 'Especialista Financiero');
        project.apoyoJuridicoId = getOrCreateProfessional(project.matrix.apoyoJuridico || project.matrix.apoyoJuridico2026 || '', 'Especialista Jurídico');

        createDocument('CDP', project.matrix.cdpConvenio || '', project.matrix.fechaCdpConvenio || '', 'CDP Convenio');
        createDocument('RC', project.matrix.rcConvenio || '', project.matrix.fechaRcConvenio || '', 'RC Convenio');
        createDocument('CDP', project.matrix.cdpObra || '', project.matrix.fechaCdpObra || '', 'CDP Obra');
        createDocument('RC', project.matrix.rcObra || '', project.matrix.fechaRcObra || '', 'RC Obra');
        createDocument('CDP', project.matrix.cdpInterventoria || '', project.matrix.fechaCdpInterventoria || '', 'CDP Interventoría');
        createDocument('RC', project.matrix.rcInterventoria || '', project.matrix.fechaRcInterventoria || '', 'RC Interventoría');
      }

      const newPresupuesto: Presupuesto = {
        id: `PRE-${Date.now()}`,
        projectId: project.id,
        cdp: project.matrix?.cdpConvenio || project.matrix?.cdpObra || 'N/A',
        rc: project.matrix?.rcConvenio || project.matrix?.rcObra || 'N/A',
        valorTotal: project.matrix?.valorTotalProyecto || 0,
        aportesFngrd: project.matrix?.aporteFngrdObraInterventoria || 0,
        aportesMunicipio: project.matrix?.aporteMunicipioGobernacionObraInterventoria || 0,
        pagosRealizados: project.matrix?.valorPagadoConvenio || project.matrix?.valorPagadoObra || 0,
        vigencia: project.vigencia,
        lineaInversion: project.linea,
      };
      newPresupuestos.push(newPresupuesto);

      if (project.matrix) {
        if (project.matrix.numeroContratoObra) {
          const obraId = `CON-OBRA-${Date.now()}`;
          newContratos.push({
            id: obraId,
            projectId: project.id,
            numero: project.matrix.numeroContratoObra,
            tipo: 'Obra',
            contratista: project.matrix.contratistaObra || 'Por definir',
            contractorId: contratistaObraId,
            nit: project.matrix.nitContratistaObra || 'N/A',
            valor: project.matrix.valorContratoObra || 0,
            objetoContractual: project.matrix.objetoObra || project.nombre,
            plazoMeses: project.matrix.tiempoTotalEjecucionMeses || 0,
            fechaInicio: project.matrix.fechaInicioObra || project.fechaInicio,
            fechaFin: project.matrix.fechaFinalizacionActual || project.fechaFin,
            eventos: [],
            estado: 'En ejecución',
          });

          if (project.matrix.valorPagadoObra && project.matrix.valorPagadoObra > 0) {
            newPagos.push({
              id: `PAGO-OBRA-${Date.now()}`,
              contractId: obraId,
              numero: 'Pago Inicial (Matriz)',
              fecha: new Date().toISOString().split('T')[0],
              valor: project.matrix.valorPagadoObra,
              estado: 'Pagado',
              observaciones: 'Pago extraído de la matriz oficial inicial.'
            });
          }
        }
        
        if (project.matrix.numeroContratoInterventoria) {
          const intId = `CON-INT-${Date.now()}`;
          newContratos.push({
            id: intId,
            projectId: project.id,
            numero: project.matrix.numeroContratoInterventoria,
            tipo: 'Interventoría',
            contratista: project.matrix.contratistaInterventoria || 'Por definir',
            contractorId: contratistaIntId,
            nit: project.matrix.nitContratistaInterventoria || 'N/A',
            valor: project.matrix.valorContratoInterventoria || 0,
            objetoContractual: project.matrix.objetoInterventoria || `Interventoría para: ${project.nombre}`,
            plazoMeses: project.matrix.tiempoTotalEjecucionMeses || 0,
            fechaInicio: project.matrix.fechaSuscripcionInterventoria || project.fechaInicio,
            fechaFin: project.matrix.fechaFinalizacionActual || project.fechaFin,
            eventos: [],
            estado: 'En ejecución',
          });

          if (project.matrix.valorPagadoInterventoria && project.matrix.valorPagadoInterventoria > 0) {
            newPagos.push({
              id: `PAGO-INT-${Date.now()}`,
              contractId: intId,
              numero: 'Pago Inicial (Matriz)',
              fecha: new Date().toISOString().split('T')[0],
              valor: project.matrix.valorPagadoInterventoria,
              estado: 'Pagado',
              observaciones: 'Pago extraído de la matriz oficial inicial.'
            });
          }
        }
        
        if (project.matrix.numeroConvenio) {
          const convId = `CON-CONV-${Date.now()}`;
          newContratos.push({
            id: convId,
            projectId: project.id,
            numero: project.matrix.numeroConvenio,
            tipo: 'Convenio',
            contratista: project.matrix.partesConvenio || 'Por definir',
            contractorId: contratistaConvId,
            nit: 'N/A',
            valor: project.matrix.valorTotalProyecto || 0,
            objetoContractual: project.matrix.objetoConvenio || project.nombre,
            plazoMeses: project.matrix.plazoInicialMesesConvenio || 0,
            fechaInicio: project.matrix.actaInicioConvenio || project.fechaInicio,
            fechaFin: project.matrix.fechaFinalizacionConvenio || project.fechaFin,
            eventos: [],
            estado: 'En ejecución',
          });

          if (project.matrix.valorPagadoConvenio && project.matrix.valorPagadoConvenio > 0) {
            newPagos.push({
              id: `PAGO-CONV-${Date.now()}`,
              contractId: convId,
              numero: 'Pago Inicial (Matriz)',
              fecha: new Date().toISOString().split('T')[0],
              valor: project.matrix.valorPagadoConvenio,
              estado: 'Pagado',
              observaciones: 'Pago extraído de la matriz oficial inicial.'
            });
          }
        }
      }

      const initialAvance: Avance | null = (project.estado === 'En ejecución' || project.estado === 'Ejecución Directa') && 
        (project.avanceFisico > 0 || project.avanceFinanciero > 0 || project.avanceProgramado > 0) 
        ? {
            id: `AV-${Date.now()}`,
            projectId: project.id,
            fecha: new Date().toISOString().split('T')[0],
            fisicoPct: project.avanceFisico || 0,
            financieroPct: project.avanceFinanciero || 0,
            programadoPct: project.avanceProgramado || 0,
            observaciones: 'Avance inicial registrado al crear el proyecto en etapa de ejecución.',
            reportadoPor: 'Sistema'
          } 
        : null;
      
      if (initialAvance) {
        newAvances.push(initialAvance);
      }

      newProyectos.push(project);

      return {
        ...prevState,
        proyectos: newProyectos,
        contratos: newContratos,
        pagos: newPagos,
        presupuestos: newPresupuestos,
        avances: newAvances,
        contratistas: newContratistas,
        professionals: updateProfessionalsWorkload(newProyectos, newProfessionals),
        documentos: newDocumentos
      };
    });
    saveToSupabase();
  };

  const updateConocimientoTerritorial = (conocimiento: ConocimientoTerritorial) => {
    setState(prev => {
      const exists = prev.conocimientoTerritorial.find(c => c.departamento === conocimiento.departamento);
      const updated = exists 
        ? prev.conocimientoTerritorial.map(c => c.departamento === conocimiento.departamento ? conocimiento : c)
        : [...prev.conocimientoTerritorial, conocimiento];
      
      return { ...prev, conocimientoTerritorial: updated };
    });
  };

  const addExternalDataset = (dataset: ExternalDataset) => {
    setState(prev => ({
      ...prev,
      externalDatasets: [...prev.externalDatasets, dataset]
    }));
  };

  const addHistoricalEvent = (event: HistoricalEvent) => {
    setState(prev => ({
      ...prev,
      historicalEvents: [...prev.historicalEvents, event]
    }));
  };

  const updateHistoricalEvent = (event: HistoricalEvent) => {
    setState(prev => ({
      ...prev,
      historicalEvents: prev.historicalEvents.map(e => e.id === event.id ? event : e)
    }));
  };

  const addDamageRecord = (record: DamageRecord) => {
    setState(prev => ({
      ...prev,
      damageRecords: [...prev.damageRecords, record]
    }));
  };

  const updateDamageRecord = (record: DamageRecord) => {
    setState(prev => ({
      ...prev,
      damageRecords: prev.damageRecords.map(r => r.id === record.id ? record : r)
    }));
  };

  const addPoliza = (poliza: Poliza) => {
    const polizaWithHistory = {
      ...poliza,
      historial_modificaciones: [
        ...(poliza.historial_modificaciones || []),
        `[${new Date().toISOString()}] Póliza creada.`
      ]
    };
    setState(prev => ({
      ...prev,
      polizas: [...(prev.polizas || []), polizaWithHistory]
    }));
  };

  const updatePoliza = (poliza: Poliza) => {
    const polizaWithHistory = {
      ...poliza,
      historial_modificaciones: [
        ...(poliza.historial_modificaciones || []),
        `[${new Date().toISOString()}] Póliza actualizada.`
      ]
    };
    setState(prev => ({
      ...prev,
      polizas: (prev.polizas || []).map(p => p.id === poliza.id ? polizaWithHistory : p)
    }));
  };

  const deletePoliza = (id: string) => {
    setState(prev => ({
      ...prev,
      polizas: (prev.polizas || []).filter(p => p.id !== id)
    }));
  };

  const addActivity = (activity: Activity) => {
    setState(prev => ({
      ...prev,
      activities: [...(prev.activities || []), activity]
    }));
  };

  const updateActivity = (activity: Activity) => {
    setState(prev => ({
      ...prev,
      activities: (prev.activities || []).map(a => a.id === activity.id ? activity : a)
    }));
  };

  const deleteActivity = (id: string) => {
    setState(prev => {
      const activity = (prev.activities || []).find(a => a.id === id);
      if (!activity) return prev;

      // Revert hours for participants
      const updatedProfessionals = prev.professionals.map(prof => {
        if (activity.participantIds.includes(prof.id)) {
          const hoursField = getHoursField(activity.type);
          return {
            ...prof,
            [hoursField]: Math.max(0, (prof[hoursField as keyof Professional] as number || 0) - activity.durationHours)
          };
        }
        return prof;
      });

      return {
        ...prev,
        activities: (prev.activities || []).filter(a => a.id !== id),
        professionals: updatedProfessionals
      };
    });
  };

  const addEnteControlRecord = (record: EnteControlRecord) => {
    setState(prev => ({
      ...prev,
      entesControl: [...(prev.entesControl || []), record]
    }));
  };

  const updateEnteControlRecord = (record: EnteControlRecord) => {
    setState(prev => ({
      ...prev,
      entesControl: (prev.entesControl || []).map(r => r.id === record.id ? record : r)
    }));
  };

  const deleteEnteControlRecord = (id: string) => {
    setState(prev => ({
      ...prev,
      entesControl: (prev.entesControl || []).filter(r => r.id !== id)
    }));
  };

  const addEvento = (evento: EmergenciaEvento) => {
    setState(prev => ({
      ...prev,
      eventos: [...(prev.eventos || []), evento]
    }));
  };

  const updateEvento = (evento: EmergenciaEvento) => {
    setState(prev => ({
      ...prev,
      eventos: (prev.eventos || []).map(e => e.id === evento.id ? evento : e)
    }));
  };

  const deleteEvento = (id: string) => {
    setState(prev => {
      // 1. Find all activities associated with this event
      const eventActivities = (prev.activities || []).filter(a => a.eventoId === id);
      
      // 2. Revert hours for all professionals involved in these activities
      let updatedProfessionals = [...prev.professionals];
      eventActivities.forEach(act => {
        updatedProfessionals = updatedProfessionals.map(prof => {
          if (act.participantIds.includes(prof.id)) {
            const hoursField = getHoursField(act.type);
            return {
              ...prof,
              [hoursField]: Math.max(0, (prof[hoursField as keyof Professional] as number || 0) - act.durationHours)
            };
          }
          return prof;
        });
      });

      // 3. Filter out activities and commissions associated with this event
      return {
        ...prev,
        eventos: (prev.eventos || []).filter(e => e.id !== id),
        activities: (prev.activities || []).filter(a => a.eventoId !== id),
        comisiones: (prev.comisiones || []).filter(c => c.eventoId !== id),
        professionals: updatedProfessionals
      };
    });
  };

  const closeEventAndStartReconstruction = (eventId: string) => {
    setState(prev => {
      const event = prev.historicalEvents.find(e => e.id === eventId);
      if (!event) return prev;

      const updatedEvent = { ...event, estado: 'Cerrado' as const, faseReconstruccion: true };
      
      // Alimentar módulo de conocimiento del riesgo
      const damages = prev.damageRecords.filter(d => d.eventId === eventId);
      const totalDamage = damages.reduce((sum, d) => sum + d.costoEstimado, 0);
      const affectedPop = damages.reduce((sum, d) => sum + d.poblacionAfectada, 0);
      
      const newConocimiento: ConocimientoTerritorial = {
        id: `CT-${Date.now()}`,
        departamento: event.departamento,
        fechaActualizacion: new Date().toISOString(),
        nivelRiesgoGeneral: event.magnitud === 'Catastrófica' ? 'Crítico' : 'Alto',
        factoresRiesgo: [event.tipoAmenaza],
        recomendaciones: [
          `Iniciar proyectos de reconstrucción para ${damages.length} daños registrados.`,
          `Priorizar atención a ${affectedPop} personas afectadas.`
        ],
        historialDesastres: [
          {
            fecha: event.fecha,
            tipo: event.tipoAmenaza,
            impacto: `Costo estimado: $${totalDamage.toLocaleString()} COP. Población afectada: ${affectedPop}.`
          }
        ]
      };

      const existsCT = prev.conocimientoTerritorial.find(c => c.departamento === event.departamento);
      const updatedCT = existsCT 
        ? prev.conocimientoTerritorial.map(c => c.departamento === event.departamento ? {
            ...c,
            historialDesastres: [...(c.historialDesastres || []), ...newConocimiento.historialDesastres!],
            recomendaciones: [...(c.recomendaciones || []), ...newConocimiento.recomendaciones]
          } : c)
        : [...prev.conocimientoTerritorial, newConocimiento];

      return {
        ...prev,
        historicalEvents: prev.historicalEvents.map(e => e.id === eventId ? updatedEvent : e),
        conocimientoTerritorial: updatedCT
      };
    });
  };

  const updateMunicipalityInventory = (inventory: MunicipalityInventory) => {
    setState(prev => {
      const exists = prev.municipalityInventories?.find(m => m.id === inventory.id);
      const updatedInventories = exists
        ? prev.municipalityInventories.map(m => m.id === inventory.id ? inventory : m)
        : [...(prev.municipalityInventories || []), inventory];

      // Aggregate metrics to parent event if eventId is present
      let updatedEventos = prev.eventos;
      if (inventory.eventId) {
        const parentEvent = prev.eventos.find(e => e.id === inventory.eventId);
        if (parentEvent) {
          // Get all inventories for this event
          const eventInventories = updatedInventories.filter(inv => inv.eventId === inventory.eventId);
          
          // Calculate aggregated metrics
          let totalPersonasAfectadas = 0;
          let totalViviendasDanadas = 0;
          let totalInfraestructuraAfectada = 0;
          let totalCostoEstimado = 0;
          let totalMaquinariaHoras = 0;
          const tipoEventoComposition: Record<string, number> = {};
          
          let minDate: Date | null = null;
          let maxDate: Date | null = null;

          eventInventories.forEach(inv => {
            totalPersonasAfectadas += (inv.poblacion?.personasAfectadas?.total?.cantidad || 0);
            
            // Sum all viviendas
            Object.values(inv.danosVivienda || {}).forEach(item => {
              if (item && typeof item === 'object' && 'cantidad' in item) {
                totalViviendasDanadas += (item.cantidad || 0);
              }
            });
            
            // Sum all infraestructura
            Object.values(inv.infraestructura || {}).forEach(item => {
              totalInfraestructuraAfectada += (item.cantidad || 0);
            });
            
            totalCostoEstimado += (inv.costoTotalEstimado || 0);
            totalMaquinariaHoras += (inv.necesidades?.maquinariaHoras?.cantidad || 0);
            
            // Aggregate tipoEvento
            inv.generalData?.tipoEvento?.forEach(tipo => {
              tipoEventoComposition[tipo] = (tipoEventoComposition[tipo] || 0) + 1;
            });
            
            if (inv.generalData?.fechaEvento) {
              const eventDate = new Date(inv.generalData.fechaEvento);
              if (!isNaN(eventDate.getTime())) {
                if (!minDate || eventDate < minDate) minDate = eventDate;
                if (!maxDate || eventDate > maxDate) maxDate = eventDate;
              }
            }
          });

          const updatedEvent = {
            ...parentEvent,
            fechaInicio: minDate ? minDate.toISOString().split('T')[0] : parentEvent.fechaInicio,
            fechaFin: maxDate ? maxDate.toISOString().split('T')[0] : parentEvent.fechaFin,
            metrics: {
              ...parentEvent.metrics,
              poblacionImpactada: totalPersonasAfectadas,
              viviendasDanadas: totalViviendasDanadas,
              infraestructuraAfectada: totalInfraestructuraAfectada,
              costoReparacion: totalCostoEstimado,
              maquinariaHoras: totalMaquinariaHoras,
              tipoEventoComposition
            }
          };

          updatedEventos = prev.eventos.map(e => e.id === updatedEvent.id ? updatedEvent : e);
        }
      }

      return {
        ...prev,
        municipalityInventories: updatedInventories,
        eventos: updatedEventos
      };
    });
  };

  return (
    <ProjectContext.Provider value={{ 
      state, 
      loading,
      syncing,
      error,
      addInterventoriaReport, 
      validateInterventoriaReport,
      addProject, 
      addContract, 
      updateContract,
      deleteContract,
      addContractEvent,
      addOtrosie,
      deleteOtrosie,
      addAfectacion,
      updateAfectacion,
      deleteAfectacion,
      addPago,
      addPagos,
      updatePago,
      deletePago,
      clearAllPagos,
      addVigencia,
      updateVigencia,
      deleteVigencia,
      addLineaInversion,
      updateLineaInversion,
      addConvenio,
      updateConvenio,
      deleteConvenio,
      addContractor,
      updateContractor,
      addContractorEvaluation,
      addDocument,
      deleteDocument,
      updateDocumentAnalysis,
      applyDocumentAnalysis,
      addDocumentVersion,
      linkDocumentToReport,
      checkMissingDocuments,
      updateProject,
      updatePresupuesto,
      deleteProject,
      deleteProfessional,
      addProfessional,
      updateProfessional,
      addComision,
      updateComision,
      deleteComision,
      addSeguimiento,
      addAvance,
      addTask,
      updateTask,
      addSystemReport,
      updateSystemReport,
      addActivity,
      updateActivity,
      deleteActivity,
      addEnteControlRecord,
      updateEnteControlRecord,
      deleteEnteControlRecord,
      addEvento,
      updateEvento,
      deleteEvento,
      getProjectData,
      updateConocimientoTerritorial,
      addExternalDataset,
      addHistoricalEvent,
      updateHistoricalEvent,
      addDamageRecord,
      updateDamageRecord,
      addPoliza,
      updatePoliza,
      deletePoliza,
      addFinancialDocument,
      addFinancialDocuments,
      updateFinancialDocument,
      deleteFinancialDocument,
      clearFinancialDocuments,
      clearDuplicatesFinancialDocuments,
      updateMunicipalityInventory,
      closeEventAndStartReconstruction,
      saveToSupabase,
      loadFromSupabase,
      repairAllUrls,
      clearAllData,
      importFromJSON,
      exportToJSON,
      addSurvey,
      deleteSurvey,
      addSurveyResponse,
      addSurveyAnalysis,
      globalTechnicalSheet: state.globalTechnicalSheet,
      updateGlobalTechnicalSheet,
      isCloudCheckComplete,
      hasSyncedWithCloud
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
