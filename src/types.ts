export const TIPOS_EVENTO_GENERADOR = [
  'Sismo',
  'Inundación',
  'Deslizamiento',
  'Avalancha',
  'Granizada',
  'Tormenta Eléctrica',
  'Tornado',
  'Vendaval',
  'Erupción Volcánica',
  'Tsunami',
  'Incendio Forestal',
  'Incendio Urbano',
  'Incidente con Materiales Peligrosos',
  'Explosión',
  'Voladura de Poliducto',
  'Atentado Terrorista',
  'Otro'
] as const;

export type TipoEventoGenerador = typeof TIPOS_EVENTO_GENERADOR[number];

export interface LiquidacionChecklist {
  items: {
    id: string;
    nombre: string;
    tipoDocumento: string;
    obligatorio: boolean;
  }[];
}

export interface DamageItem {
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
  asegurado?: boolean;
  porcentajeCobertura?: number;
  valorAsegurado?: number;
}

export interface DetailedDamageItem {
  id: string;
  nombre: string;
  descripcion?: string;
  ubicacion?: 'Urbano' | 'Rural';
  valor: number;
  cantidad?: number;
  unidad?: string;
  asegurado: boolean;
  porcentajeCobertura: number;
  valorAsegurado: number;
  tipoAfectacion?: 'Destruida' | 'Grave' | 'Moderada' | 'Leve';
  // Características detalladas (Individuales)
  materialParedes?: string;
  materialTecho?: string;
  materialPiso?: string;
  areaM2?: number;
  numeroPersonas?: number;
  numeroHogares?: number;
  serviciosPublicosAfectados?: string[];
  uso?: string;
  capacidad?: string;
  estadoEstructural?: string;
}

export interface DemographicDamage {
  total: DamageItem;
  ninos?: DamageItem;
  ninas?: DamageItem;
  adolescentesHombres?: DamageItem;
  adolescentesMujeres?: DamageItem;
  adultosHombres?: DamageItem;
  adultosMujeres?: DamageItem;
  adultosMayoresHombres?: DamageItem;
  adultosMayoresMujeres?: DamageItem;
  mujeresGestantesLactantes?: DamageItem;
  personasDiscapacidad?: DamageItem;
  etniaIndigena?: DamageItem;
  etniaAfro?: DamageItem;
  etniaRom?: DamageItem;
  migrantes?: DamageItem;
  desplazados?: DamageItem;
}

export interface SectorInfraestructura {
  salud?: { 
    [key: string]: any; 
    centrosAfectados?: number; 
    casosHipotermia?: number; 
    casosInfeccionesAgudas?: number; 
    ninosDesnutricion?: number; 
    necesidadesPrioritariasSalud?: string;
    listadoCentros?: DetailedDamageItem[];
  };
  educacionMedia?: { [key: string]: any; institucionesAfectadas?: number; estudiantesSinClases?: number }; 
  educacionSuperior?: { [key: string]: any }; 
  transporteVias?: { [key: string]: any };
  transportePuentes?: { [key: string]: any };
  transporteMuellesPuertos?: { [key: string]: any };
  transporteAeropuertos?: { [key: string]: any };
  turismo?: { [key: string]: any }; 
  deportes?: { [key: string]: any }; 
  cultura?: { [key: string]: any }; 
  agricultura?: { 
    [key: string]: any; 
    hectareasAfectadas?: number; 
    hectareasPerdidaTotal?: number; 
    hectareasPerdidaParcial?: number; 
    cultivosMasAfectados?: string; 
    perdidasAgricolasEstimadas?: number 
  }; 
  pecuario?: {
    [key: string]: any;
    bovinosMuertos?: number;
    ovinosMuertos?: number;
    caprinosMuertos?: number;
    avesMuertas?: number;
    otrosMuertos?: number;
  };
  defensa?: { [key: string]: any }; 
  trabajo?: { 
    [key: string]: any; 
    negociosCerrados?: number; 
    jornalerosSinIngresos?: number; 
    diasActividadEconomicaPerdidos?: number; 
    mujeresJefasHogarPerdidaIngreso?: number 
  }; 
  icbf?: { hogaresCDI?: Record<string, DamageItem>; hogaresAfectados?: number };
  energia?: { [key: string]: any; personasSinServicio?: number; diasEstimadosSinEnergia?: number };
  aguaGas?: { [key: string]: any; personasSinAgua?: number; alcantarilladoStatus?: 'Funcional' | 'Parcial' | 'Falla' };
  comunicaciones?: { [key: string]: any; status?: 'Funcional' | 'Parcial' | 'Falla' }; 
  seguridadAlimentaria?: {
    hogaresSinAccesoAlimentos?: number;
    diasSinAcceso?: number;
    fuentesAguaContaminadaRotas?: number;
    hogaresRecibiendoAyudaAlimentaria?: number;
    estadoSeguridadAlimentaria?: string;
  };
}

export interface IndicadoresTerritorio {
  poblacionTotal?: number;
  totalViviendas?: number;
  nbi?: number; // Indice Necesidades Basicas Insatisfechas
  coeficienteGini?: number;
}

export interface MunicipalityInventory {
  id: string;
  eventId?: string; // Reference to the parent Macro-Event
  name: string;
  edanStatus: 'Completado' | 'Pendiente' | 'En Proceso';
  runapeStatus: 'Configurado' | 'Desactualizado' | 'Sin Datos';
  lastUpdate: string;
  
  indicadores?: IndicadoresTerritorio;

  // FR-1703-SMD-09: Información General
  generalData: {
    diligenciador: string;
    institucion: string;
    cargo: string;
    telefono: string;
    celular: string;
    tipoEvento: string[];
    fecha: string;
    hora: string;
    evento: string;
    descripcionEvento: string;
    magnitud: string;
    fechaEvento: string;
    horaEvento: string;
    sitioEvento: string;
    sectoresAfectados: string;
    eventosSecundarios: string;
    coordinadorCMGRD: string;
    alcaldeMunicipal: string;
    fechaEvaluacion: string;
    horaEvaluacion: string;
  };

  // FR-1900-SMD-04: Daños y Necesidades
  poblacion: {
    heridos: DemographicDamage;
    muertos: DemographicDamage;
    desaparecidos: DemographicDamage;
    familiasAfectadas: DemographicDamage;
    personasAfectadas: DemographicDamage;
    enfermos: DemographicDamage;
    evacuados: DemographicDamage;
    albergados: DemographicDamage;
    personasSinSustento?: DemographicDamage; // "Personas fallecidas que se queden sin transporte/sustento/trabajo"
  };
  
  danosVivienda: {
    destruidas: DamageItem; // perdida total
    grave: DamageItem; // inhabitable
    moderado: DamageItem; 
    leve: DamageItem;
    materialPredominante?: string;
    techosAfectadosClima?: number; // nieve, granizo, vendaval
    hogaresPropietarios?: number;
    hogaresArrendatarios?: number;
    hogaresJefaturaFemenina?: number;
    listadoViviendas?: DetailedDamageItem[];
    // fallbacks legados
    averiadasUrbano?: DamageItem;
    destruidasUrbano?: DamageItem;
    averiadasRural?: DamageItem;
    destruidasRural?: DamageItem;
  };
  infraestructuraPorSector?: SectorInfraestructura;
  
  // legacy fallbacks
  infraestructura: Record<string, DamageItem>;
  serviciosPublicos: Record<string, DamageItem>;
  necesidades: Record<string, DamageItem>;
  
  costoTotalEstimado: number;
  costosOperativos?: {
    reunionesPMU?: {
      id: string;
      fecha: string;
      tema: string;
      participantes: string[];
      costoEstimado?: number;
    }[];
    comisionesSugeridas?: {
      id: string;
      departamento: string;
      municipios: string;
      objeto: string;
      numeroDias: number;
      perfilesRequeridos: string[];
      costoEstimado?: number;
    }[];
    maquinariaAmarilla?: {
      id: string;
      tipo: string;
      horasSugeridas: number;
      costoEstimado?: number;
    }[];
  };
}

export interface ScheduleTask {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  progress: number;
  status: 'Planificada' | 'Ejecutada' | 'En Progreso' | 'Retrasada';
  isCritical: boolean;
  dependencies: string[];
  sourceDocumentIds: string[];
}

export interface ScheduleSubactivity {
  id: string;
  name: string;
  tasks: ScheduleTask[];
  progress: number;
}

export interface ScheduleActivity {
  id: string;
  name: string;
  phase: 'Estudios' | 'Ejecución' | 'Cierre';
  subactivities: ScheduleSubactivity[];
  progress: number;
}

export type ProjectStatus = 
  | 'Banco de proyectos' 
  | 'En viabilidad' 
  | 'En estructuración' 
  | 'Aprobado' 
  | 'En contratación' 
  | 'En ejecución' 
  | 'En seguimiento' 
  | 'En liquidación' 
  | 'Liquidado'
  | 'Suspendido'
  | 'Ejecución Directa'; // New state for skipping validation

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  documentId?: string;
}

export interface BancoProyectosWorkflow {
  pasoActual: number;
  estado: 'Pendiente' | 'En Revisión' | 'Devuelto' | 'Viabilizado' | 'Archivado';
  asignadoA?: string;
  esSolicitud?: boolean;
  esNuevo?: boolean;
  registradoSNIGRD?: boolean;
  esCompetenciaFNGRD?: boolean;
  documentacionCompleta?: boolean;
  cumpleRequisitosMinimos?: boolean;
  viabilidadTecnica?: boolean;
  recursosAprobados?: boolean;
  observaciones?: string;
  actividades?: Activity[];
  requisitosGenerales?: Record<string, boolean>;
  requisitosTecnicos?: Record<string, boolean>;
  documentosRequisitos?: Record<string, string>;
  historial: { paso: number; fecha: string; accion: string; usuario: string }[];
}

export interface ProjectLifecycle {
  bancoProyectos?: BancoProyectosWorkflow;
  viabilidad?: {
    resultado: 'viable' | 'requiere ajustes' | 'no viable' | 'pendiente';
    observaciones: string;
    fechaEvaluacion?: string;
    evaluador?: string;
  };
  estructuracion?: {
    tecnico: ChecklistItem[];
    financiero: ChecklistItem[];
    juridico: ChecklistItem[];
    tecnicoValidado?: boolean;
    financieroValidado?: boolean;
    juridicoValidado?: boolean;
  };
  liquidacion?: {
    checklist: ChecklistItem[];
    fechaCierre?: string;
  };
}

export interface InformeMensual {
  id: string;
  mes: string;
  anio: number;
  url: string;
  estado: 'Radicado' | 'Aprobado' | 'Rechazado';
  fechaRadicacion: string;
  observaciones?: string;
  valorPagado?: number;
}

export interface Professional {
  id: string;
  projectId?: string;
  nombre: string;
  email?: string;
  telefono?: string;
  profesion: string;
  experienciaAnios: number;
  especialidades: string[];
  sectoresTrabajados: string[];
  proyectosRelevantes: string[];
  salarioMensual: number;
  gastosRepresentacion?: number;
  incrementoAntiguedad?: number;
  valorTotalContrato?: number;
  valorHora: number;
  proyectosActivos: number;
  horasEstimadas: number;
  carga: 'Disponible' | 'Media' | 'Sobrecargado';
  departamentosExperiencia: string[];
  hojaDeVidaUrl?: string;
  rutUrl?: string;
  desempeño?: number; // 0-100
  formacionAcademica?: string[];
  certificaciones?: string[];
  idiomas?: string[];
  habilidadesTecnicas?: string[];
  linkedinUrl?: string;
  fechaNacimiento?: string;
  direccion?: string;
  ciudad?: string;
  numeroContrato?: string;
  cdp?: string;
  rc?: string;
  vigencia?: string;
  horasReuniones?: number;
  horasPMU?: number;
  horasSeguimiento?: number;
  horasCoordinacion?: number;
  objetoContrato?: string;
  supervisor?: string;
  fechaInicio?: string;
  fechaFinalizacion?: string;
  informesMensuales?: InformeMensual[];
}

export interface PublicAsset {
  id: string;
  nombre: string;
  sector: 'Salud' | 'Educación' | 'Transporte' | 'Agua y Saneamiento' | 'Energía' | 'Administrativo' | 'Otros';
  departamento: string;
  municipio: string;
  valorReposicion: number;
  valorAsegurado: number;
  nivelRiesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  tipoSeguro: 'Tradicional' | 'Paramétrico' | 'Ninguno' | 'Todo Riesgo';
  criticidadOperativa: 'Baja' | 'Media' | 'Alta' | 'Esencial';
}

export interface ActuarialParameters {
  periodoRetornoPMP: number; // Años (ej. 100, 250, 500)
  factorDanoPMP: number; // Porcentaje de daño esperado (0-100)
  frecuenciaEventosPAE: number; // Eventos por año
  severidadPromedioPAE: number; // Valor en COP
}

export interface FiscalParameters {
  presupuestoAnual: number;
  icld: number; // Ingresos Corrientes de Libre Destinación
  fondoContingencia: number;
  capacidadEndeudamiento: number;
}

export type InstrumentType = 'Fondo GRD' | 'Reserva Presupuestal' | 'Crédito Contingente' | 'Seguro Paramétrico' | 'Seguro Tradicional' | 'Cat Bond' | 'Pool de Aseguramiento' | 'Respaldo Soberano';

export interface FinancialInstrument {
  id: string;
  layerId: string; // 'l1', 'l2', 'l3', 'l4'
  name: string;
  type: InstrumentType;
  capacity: number; // Valor máximo de cobertura (COP)
  cost: number; // Prima anual, costo de mantenimiento o cupón (COP)
  activationTrigger: string; // Condición de activación
  liquidityTime: string; // Tiempo estimado de desembolso
  status: 'Activo' | 'En Estructuración' | 'Inactivo';
  parameters: {
    triggerType?: string;
    triggerUnit?: string;
    triggerValue?: number;
    payoutStructure?: string;
    interestRate?: number;
    commitmentFee?: number;
    deductible?: number;
    couponRate?: number;
  };
}

export interface TerritoryRiskProfile {
  departamento: string;
  irftScore: number; // 0-100
  exposicionFisica: number;
  exposicionEconomica: number;
  exposicionSocial: number;
  pmp: number; // Pérdida Máxima Probable
  pae: number; // Pérdida Anual Esperada
  parametrosActuariales?: ActuarialParameters;
  parametrosFiscales?: FiscalParameters;
}

export interface ProjectMatrix {
  id?: string;
  departamento?: string;
  codigoDepartamento?: string;
  municipio?: string;
  ubicacion?: string;
  codigoMunicipio?: string;
  clave?: string;
  tipoObra?: string;
  nombreProyecto?: string;
  linea?: string;
  regalias?: string;
  afectacionPresupuestal?: string;
  afectacionesPresupuestalesAdiciones?: string;
  aporteMunicipioGobernacionObraInterventoria?: number;
  aporteFngrdObraInterventoria?: number;
  valorTotalProyecto?: number;
  valorObraInterventoria?: number;
  aporteFondo?: number;
  personasBeneficiadas?: number;
  empleosGenerados?: number;
  
  // Convenio fields
  numeroConvenio?: string;
  objetoConvenio?: string;
  partesConvenio?: string;
  plazoInicialMesesConvenio?: number;
  tiempoTotalEjecucionMeses?: number;
  actaInicioConvenio?: string;
  fechaFinalizacionConvenio?: string;
  cdpConvenio?: string;
  fechaCdpConvenio?: string;
  rcConvenio?: string;
  fechaRcConvenio?: string;
  valorRcConvenio?: number;
  valorPagadoConvenio?: number;
  valorPorPagarConvenio?: number;

  // Obra fields
  numeroContratoObra?: string;
  contratistaObra?: string;
  nitContratistaObra?: string;
  valorContratoObra?: number;
  objetoObra?: string;
  conformacionLegalObra?: string;
  fechaInicioObra?: string;
  fechaFinalizacionActual?: string;
  cdpObra?: string;
  fechaCdpObra?: string;
  rcObra?: string;
  fechaRcObra?: string;
  valorRcObra?: number;
  valorPagadoObra?: number;
  valorPorPagarObra?: number;
  atrasoEjecucionObra?: number;

  // Interventoria fields
  numeroContratoInterventoria?: string;
  contratistaInterventoria?: string;
  nitContratistaInterventoria?: string;
  valorContratoInterventoria?: number;
  objetoInterventoria?: string;
  conformacionLegalInterventoria?: string;
  fechaSuscripcionInterventoria?: string;
  cdpInterventoria?: string;
  fechaCdpInterventoria?: string;
  rcInterventoria?: string;
  fechaRcInterventoria?: string;
  valorRcInterventoria?: number;
  valorPagadoInterventoria?: number;
  valorPorPagarInterventoria?: number;

  // Other fields
  avanceFisico?: number;
  avanceProgramado?: number;
  avanceFinancieroPonderado?: number;
  avanceFinancieroObra?: number;
  estadoProyecto?: string;
  vencioTerminosLiquidacion?: boolean;

  apoyoTecnico?: string;
  apoyoTecnicoAntigüo?: string;
  apoyoTecnico2026?: string;
  apoyoFinanciero?: string;
  apoyoJuridico?: string;
  apoyoJuridico2026?: string;
}

export interface Project {
  id: string;
  codigo?: string;
  convenioId?: string; // Ahora es opcional
  eventoId?: string; // Evento de emergencia asociado
  nombre: string;
  municipio?: string;
  departamento?: string;
  actasComite?: ActaComite[];
  suspensiones?: Suspension[];
  compromisos?: Compromiso[];
  historialAvances?: {
    fecha: string;
    valor: number;
    origenId: string;
    origenTipo: 'Informe' | 'ActaComite' | 'Otro';
  }[];
  fases?: Fase[];
  avanceFisico?: number;
  avanceProgramado?: number;
  avanceFinanciero?: number;
  estado?: ProjectStatus;
  fechaFin?: string;
  fechaInicio?: string;
  riesgosMitigados?: string[];
  objetivoGeneral?: string;
  objetivosEspecificos?: string[];
  necesidad?: string;
  descripcionRiesgo?: string;
  linea?: string;
  tipoObra?: string;
  beneficiarios?: string;
  matrix?: ProjectMatrix;
  lifecycle?: ProjectLifecycle;
  poblacionBeneficiada?: number;
  poblacionObjetivo?: number;
  empleosGenerados?: number;
  riesgoAntes?: number;
  riesgoDespues?: number;
  coherenciaTerritorial?: number;
  responsableOpsId?: string;
  apoyoTecnicoId?: string;
  apoyoFinancieroId?: string;
  apoyoJuridicoId?: string;
  vigencia?: string;
  alcance?: string;
  justificacion?: string;
  solicitudAlcalde?: any;
  alertas?: any[];
  presupuestoDetallado?: any[];
  actividadesPrincipales?: any[];
  esEjecucionDirecta?: boolean;
  estadoSNGRD?: 'CONOCIMIENTO' | 'REDUCCIÓN' | 'MANEJO' | 'RECONSTRUCCIÓN';
  situacionSNGRD?: 'NORMAL' | 'CRISIS' | 'POST-CRISIS';
  // ... resto de campos
}

export type ContractType = 'Convenio' | 'Obra' | 'Interventoría' | 'OPS' | 'Interadministrativo' | 'Consultoría';

export type ContractEventType = 
  | 'Acta de Inicio' 
  | 'Otrosí' 
  | 'Suspensión' 
  | 'Reinicio' 
  | 'Prórroga' 
  | 'Modificación de Valor'
  | 'Acta de Liquidación';

export interface Poliza {
  id: string;
  id_contrato: string;
  id_proyecto?: string;
  id_convenio?: string;
  numero_proyecto?: string;
  tipo_contrato: ContractType;
  numero_contrato: string;
  tipo_amparo: string;
  numero_poliza: string;
  valor_asegurado: number;
  numero_certificado_anexo: string;
  entidad_aseguradora: string;
  tipo_garantia: string;
  fecha_expedicion: string;
  fecha_aprobacion: string;
  fecha_inicio_vigencia: string;
  fecha_finalizacion_vigencia: string;
  estado: 'Vigente' | 'Vencida' | 'En Trámite' | 'Anulada';
  apoyo_supervision: string;
  riesgo_cubierto: string; // cumplimiento, calidad, estabilidad, etc.
  porcentaje_cobertura: number; // calculated: valor_asegurado / valor_contrato
  estado_cobertura: 'Adecuado' | 'Parcial' | 'Insuficiente';
  riesgo_descubierto: number; // $ no cubierto
  impacto_financiero_potencial: string;
  relacion_con_otrosi?: string;
  documento_url?: string;
  aprobada_por?: string;
  fecha_aprobacion_interventoria?: string;
  interventoria_valida?: boolean;
  validacion_ia?: {
    coherente: boolean;
    observaciones: string;
    inconsistencias: string[];
    cumplimiento_ley_1523?: {
      cumple: boolean;
      analisis: string;
      articulos_relacionados: string[];
    };
  };
  historial_modificaciones?: string[];
}

export interface ContractEvent {
  id: string;
  contractId: string;
  tipo: ContractEventType;
  fecha: string;
  descripcion: string;
  impactoPlazoMeses: number;
  impactoValor: number;
  documentoUrl?: string;
  documentoNombre?: string;
}

export interface Convenio {
  id: string;
  numero: string;
  nombre: string;
  objeto: string;
  partes: string;
  valorTotal: number;
  valorAportadoFondo: number;
  valorAportadoContrapartida: number;
  fechaInicio: string; // Cambiado de fechaFirma
  fechaFin: string;
  estado: 'Activo' | 'Liquidado' | 'En liquidación';
  tipo: 'marco' | 'específico' | 'interadministrativo';
  documentoUrl?: string;
  metadata: {
    juridica?: Record<string, any>;
    financiera?: Record<string, any>;
  };
  cdp?: string;
  rp?: string;
  riesgosImpactadosIds?: string[];
  
  // Mandatory fields for effective tracking
  plazoInicialMesesConvenio?: number;
  tiempoTotalEjecucionMeses?: number;
  actaInicioConvenio?: string;
  fechaFinalizacionConvenio?: string;
  afectacionPresupuestal?: string;
  cdpConvenio?: string;
  fechaCdpConvenio?: string;
  rcConvenio?: string;
  fechaRcConvenio?: string;
  cdpObra?: string;
  fechaCdpObra?: string;
  rcObra?: string;
  fechaRcObra?: string;
  cdpInterventoria?: string;
  fechaCdpInterventoria?: string;
  rcInterventoria?: string;
  fechaRcInterventoria?: string;
  afectacionesPresupuestalesAdiciones?: string;
  aporteMunicipioGobernacionObraInterventoria?: number;
  aporteFngrdObraInterventoria?: number;
  valorTotalProyecto?: number;
  personasBeneficiadas?: number;
  empleosGenerados?: number;
  estadoSNGRD?: 'CONOCIMIENTO' | 'REDUCCIÓN' | 'MANEJO' | 'RECONSTRUCCIÓN';
  situacionSNGRD?: 'NORMAL' | 'CRISIS' | 'POST-CRISIS';
}

export interface Fase {
  id: string;
  nombre: string;
}

export interface ActaInicioData {
  numero: string;
  fechaSuscripcion: string;
  fechaInicio: string;
  fechaFinPrevista: string;
  plazoMeses: number;
  valorContrato: number;
  valorAnticipo: number;
  supervisor: string;
  interventor: string;
  objeto: string;
  observaciones: string;
}

export interface Compromiso {
  id: string;
  descripcion: string;
  responsable: string;
  fechaLimite?: string;
  estado: 'Pendiente' | 'En Proceso' | 'Cumplido' | 'Atrasado';
  trazabilidad?: string;
  fechaRegistro: string;
  actaId?: string;
}

export interface ActaComite {
  id: string;
  projectId: string;
  eventId?: string;
  numero: string;
  fecha: string;
  temaCentral: string;
  decisiones: string[];
  compromisosAnteriores?: {
    descripcion: string;
    estadoActual: string;
    observaciones?: string;
  }[];
  compromisosNuevos?: Compromiso[];
  preocupaciones?: string[];
  estadoCronograma?: {
    fechaInicioPrevista?: string;
    fechaFinPrevista?: string;
    avanceFisico?: number;
    observaciones?: string;
  };
  afectacionesGeneradas: {
    tipo: 'Financiera' | 'Social' | 'Técnica' | 'Legal';
    descripcion: string;
    valorEstimado?: number;
  }[];
  documentId?: string;
  evaluacionImpacto?: 'Positivo' | 'Neutral' | 'Negativo';
  conclusionesIA?: string;
  contextoPrevio?: string;
  mejoroEstado?: boolean;
}

export interface Suspension {
  id: string;
  contractId: string;
  numero: string;
  fechaInicio: string;
  fechaFin?: string;
  plazoMeses?: number;
  motivo: string;
  justificacion: string;
  documentId?: string;
}

export interface Contract {
  id: string;
  projectId: string;
  numero: string;
  tipo: ContractType;
  contratista: string;
  nit: string;
  valor: number;
  objetoContractual: string;
  plazoMeses: number;
  fechaInicio?: string;
  fechaFin?: string;
  supervisor?: string;
  formaPago?: string;
  garantias?: string[];
  obligacionesPrincipales?: string[];
  eventos: ContractEvent[];
  interventoriaId?: string;
  vigencia?: string;
  lineaInversion?: string;
  contractorId?: string;
  actaInicio?: string;
  actaInicioData?: ActaInicioData;
  actaLiquidacion?: string;
  suspensiones?: { fechaInicio: string; fechaFin?: string; motivo: string; }[];
  reinicios?: { fecha: string; motivo: string; }[];
  estado: 'En ejecución' | 'En liquidación' | 'Liquidado';
  faseId?: string;
  responsibleId?: string; // New field
  valorPagado?: number;
  analysis?: {
    summary: string;
    type: string;
    importance: string;
    risks: string[];
    impacts: {
      schedule: string;
      budget: string;
      progress: string;
    };
    inconsistencies: string[];
    highlightedData: { key: string; value: string; context: string }[];
    riesgosMitigados?: string[];
    poblacionObjetivo?: number;
    deepLearningInsights?: {
      patronesDetectados: string[];
      casosExitoEstructuracion: string[];
      oportunidadesAhorro: string[];
      innovacionesDetectadas: string[];
      leccionesAprendidas: string[];
    };
  };
}

export interface Pago {
  id: string;
  contractId: string;
  rcId?: string; // Nuevo: Link al RC para trazabilidad financiera directa
  reportId?: string; // Link to the supervision report that justifies this payment
  numero: string;
  fecha: string;
  valor: number;
  estado: 'Pendiente' | 'Pagado' | 'Rechazado';
  observaciones: string;
  soporteUrl?: string;

  // Nuevos campos masivos (CSV)
  cdp?: string;
  areaEjecutora?: string;
  identificacion?: string;
  banco?: string;
  tipoCuenta?: string;
  cuenta?: string;
  solicitud?: string;
  numeroContratoOriginal?: string;
  rc?: string;
  valorDistribuido?: number;
  resolucion?: string;
  fuente?: string;
  fechaRadicado?: string;
  departamento?: string;
  ciudad?: string;
  codigoRubro?: string;
  rubro?: string;
  cuentaPago?: string;
  firma?: string;
  cargo?: string;

  // Nuevos campos para detalle ampliado del requerimiento funcional
  numeroFactura?: string;
  beneficiario?: string;
  nitBeneficiario?: string;
  entidadBancaria?: string;
  cuentaBancaria?: string;
  comprobanteEgreso?: string;
  fechaPagoReal?: string;
}

export interface Financial {
  id: string;
  projectId: string;
  cdp: string;
  rc: string;
  valorTotal: number;
  aportesFngrd: number;
  aportesMunicipio: number;
  pagosRealizados: number;
}

export interface Tracking {
  id: string;
  projectId: string;
  fechaSeguimiento: string;
  avanceReportado: number;
  observaciones: string;
  reportadoPor: string;
  adjuntos?: { id: string; name: string; type: string; url: string; }[];
}

export interface Alert {
  id: string;
  projectId: string;
  tipo: 'SARLAFT' | 'Incumplimiento' | 'Alerta Temprana' | 'Ente de Control';
  descripcion: string;
  nivel: 'Alto' | 'Medio' | 'Bajo';
  fecha: string;
  estado: 'Abierta' | 'Cerrada';
  recomendacionIA?: string;
}

export interface Environmental {
  id: string;
  projectId: string;
  permiso: string;
  resolucion: string;
  estado: 'Aprobado' | 'En Trámite' | 'Rechazado' | 'No Aplica';
  compensaciones: string;
}

export interface InterventoriaReport {
  id: string;
  projectId: string;
  contractId?: string; // Link to the specific contract being supervised
  semana: number;
  fechaInicio: string;
  fechaFin: string;
  interventorResponsable: string;
  obraProgramadaPct: number;
  obraEjecutadaPct: number;
  valorProgramado: number;
  valorEjecutado: number;
  valorPagado?: number;
  actividadesEjecutadas: string;
  actividadesProximas: string;
  sisoAmbiental: string;
  observaciones: string;
  fotografias: { id: string; url: string; descripcion: string }[];
  documentIds?: string[]; // IDs of documents linked to this report
  validado?: boolean; // Progress validation status
}

export interface OpsContractor {
  id: string;
  projectId: string;
  nombre: string;
  cedula: string;
  rol: string;
  honorariosMensuales: number;
  fechaInicio: string;
  fechaFin: string;
  estado: 'Activo' | 'Inactivo';
}

export interface HeatMapPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1
  type: 'rain' | 'wind' | 'flood' | 'temp' | 'surge';
  radius: number;
  description?: string;
}

export interface InventoryItem {
  id: string;
  tipo: 'vivienda' | 'vial' | 'cultivo' | 'servicio';
  subtipo: string; // Ej: 'Papa', 'Red Eléctrica', 'Vía Terciaria'
  cantidad: number;
  unidad: string; // Ej: 'Hectáreas', 'Unidades', 'Kilómetros'
  valorUnitarioReposicion: number;
  municipio: string;
  departamento: string;
}

export interface EmergenciaEvento {
  id: string;
  nombre: string;
  tipo: 'Inundación' | 'Deslizamiento' | 'Sismo' | 'Incendio Forestal' | 'Sequía' | 'Frente Frío' | 'Otro';
  departamentosAfectados: string[];
  municipiosAfectados: string[];
  fechaInicio: string;
  fechaFin?: string;
  descripcion: string;
  estado: 'Activo' | 'Controlado' | 'Cerrado';
  // Caracterización Técnica (IDEAM / Metodología)
  caracterizacion?: {
    duracionDias?: number;
    intensidad?: number; // Escala 1-10 para funciones de daño
    intensidadDesc?: string; // Ej: "150mm/24h"
    coberturaGeografica?: string; // Ej: "Regional - 15 municipios"
    anomaliaClimatica?: number; // % vs histórico
    tipoAmenaza?: string;
  };
  heatmapPoints?: HeatMapPoint[];
  inventory?: InventoryItem[]; // Inventario parametrizado para este evento
  metrics?: {
    // CAPA 1: Cuantificación Física
    hectareasAfectadas?: number;
    viviendasDanadas?: number;
    infraestructuraAfectada?: number;
    poblacionImpactada?: number;
    activosPublicos?: number;
    
    // Cuantificación Detallada (Solicitada)
    acueductosAfectados?: {
      cantidad: number;
      tipo: 'Rural' | 'Urbano' | 'Municipal';
    }[];
    puentesAfectados?: {
      cantidad: number;
      longitudTotal: number;
    };
    usuariosSinServicioPublico?: number;
    
    // CAPA 2: Valoración Económica (VCRA)
    costoReposicion?: number;
    costoReparacion?: number;
    perdidaEconomica?: number;
    
    // Factores VCRA (Metodología Auditable)
    vcra?: {
      costoUnitarioVivienda?: number;
      factorDanoVivienda?: number; // 0.3, 0.6, 0.8, 1.0
      factorTerritorial?: number; // 1.0 (urbano), 1.2 (rural), 1.3 (difícil acceso)
    };

    // CAPA 3: Cuantificación de Necesidades
    atencionInmediata?: number;
    maquinariaHoras?: number;
    rehabilitacion?: number;
    reconstruccion?: number;
    tipoEventoComposition?: Record<string, number>;
    
    // Seguimiento Financiero del Evento
    financiero?: {
      presupuestoAsignado: number;
      valorComprometido: number;
      valorPagado: number;
      valorPorPagar: number;
      cdps: string[];
      rcs: string[];
    };
  };
  solicitudesMaquinaria?: SolicitudMaquinaria[];
  comisionesIds?: string[];
  costosOperativos?: {
    reunionesPMU?: {
      id: string;
      fecha: string;
      tema: string;
      participantes: string[];
      costoEstimado?: number;
    }[];
    comisionesSugeridas?: {
      id: string;
      departamento: string;
      municipios: string;
      objeto: string;
      numeroDias: number;
      perfilesRequeridos: string[];
      costoEstimado?: number;
    }[];
    presupuestoEstimado?: number;
  };
}

export interface SolicitudMaquinaria {
  id: string;
  municipio: string;
  departamento: string;
  horasSolicitadas: number;
  tipoMaquinaria: string;
  estado: 'Pendiente' | 'Aprobada' | 'En Operación' | 'Finalizada';
  fechaSolicitud: string;
  descripcion?: string;
}

export interface Comision {
  id: string;
  projectId?: string; 
  projectIds?: string[];
  professionalIds: string[];
  tipoVinculacion: 'CONTRATISTA' | 'FUNCIONARIO' | 'OTRO';
  responsableNombre: string;
  tipoComision: string;
  proyectoNombre: string;
  departamento: string;
  municipios: string;
  objeto: string;
  fechaInicio: string;
  fechaFin: string;
  anio: number;
  numeroDias: number;
  requiereViaticos: boolean;
  transporteTerrestre: boolean;
  rutaAerea: string;
  autorizadoVB: string;
  planTrabajo1: string;
  planTrabajo2: string;
  planTrabajo3: string;
  linkSoporte: string;
  fechaSolicitudFuncionario: string;
  fechaSolicitud: string;
  fechaAprobacionSG: string;
  diasGestionHabiles: number;
  destinoInternacional?: boolean;
  
  // Campos técnicos existentes/necesarios para cálculos
  fechaAprobacion?: string; 
  eventoId?: string;
  pernocta: boolean;
  costoProfesionales: number;
  costosAdicionales: {
    transporte: number;
    viaticos: number;
    alojamiento: number;
  };
  viaticosDetalle?: {
    professionalId: string;
    dias: number;
    tarifaDiaria: number;
    total: number;
  }[];
  costoTotal: number;
  estado: 'Programada' | 'En Curso' | 'Ejecutada' | 'Cancelada' | 'Rechazada';
  informe?: {
    actividades: string;
    hallazgos: string;
    conclusiones: string;
    recomendaciones: string;
    fechaGeneracion: string;
  };
}

export interface Riesgo {
  id: string;
  projectId: string;
  descripcion: string;
  probabilidad: 'Alta' | 'Media' | 'Baja';
  impacto: 'Alto' | 'Medio' | 'Bajo';
  estado: 'Activo' | 'Mitigado' | 'Materializado';
  planMitigacion: string;
}

export interface Presupuesto {
  id: string;
  projectId: string;
  cdp: string;
  rc: string;
  valorTotal: number;
  aportesFngrd: number;
  aportesMunicipio: number;
  pagosRealizados: number;
  valorComprometidoProfesionales?: number;
  valorComprometidoComisiones?: number;
  valorDisponible?: number;
  vigencia: string;
  lineaInversion: string;
}

export interface Avance {
  id: string;
  projectId: string;
  reportId?: string; // Relación con informe de interventoría
  fecha: string;
  fisicoPct: number;
  financieroPct: number;
  programadoPct: number;
  observaciones: string;
  reportadoPor: string;
  adjuntos?: { id: string; name: string; type: string; url: string; }[];
}

export interface Seguimiento {
  id: string;
  projectId: string;
  fecha: string;
  tipo: 'Institucional' | 'Técnico' | 'Financiero' | 'Legal';
  descripcion: string;
  responsable: string;
  trazabilidad: string;
}

export interface Otrosie {
  id: string;
  contractId?: string;
  convenioId?: string;
  numero: string;
  fechaFirma: string;
  objeto: string;
  justificacionTecnica: string;
  justificacionJuridica: string;
  valorAdicional: number;
  plazoAdicionalMeses: number;
  alcanceModificado?: string;
  documentoUrl?: string;
  documentoNombre?: string;
  clausulasModificadas: {
    numero: string;
    descripcionAnterior: string;
    descripcionNueva: string;
  }[];
  impactoPresupuestal: {
    rubro: string;
    valorAnterior: number;
    valorNuevo: number;
    variacion: number;
  }[];
  nuevasObligaciones: string[];
  riesgosIdentificados: string[];
  analisisOptimización?: string;
  tipoModificacion?: 'Adición' | 'Prórroga' | 'Adición y Prórroga' | 'Aclaración' | 'Modificación de Cláusulas';
  supervisorResponsable?: string;
  nitEntidad?: string;
  nitContratista?: string;
  estado?: 'Borrador' | 'En revisión' | 'Aprobado' | 'Firmado';
}

export interface Afectacion {
  id: string;
  projectId: string;
  contractId?: string;
  numero: string;
  tipo: 'Adición' | 'Reducción' | 'Liberación' | 'Pago' | 'Otro';
  descripcion: string;
  fecha: string;
  valor: number;
  impacto?: 'Alto' | 'Medio' | 'Bajo';
  estado?: 'Abierta' | 'Cerrada';
  documentoUrl?: string;
  documentoNombre?: string;
  documentoReferenciaId?: string; // ID of the document that formalized this (e.g. Otrosí ID)
  origenId?: string; // ID of the document that generated this (e.g. Acta de Comité ID)
}

export interface Activity {
  id: string;
  title: string;
  type: 'PMU' | 'Reunión' | 'Comité' | 'Visita' | 'Otra';
  date: string;
  durationHours: number;
  phenomenon?: string;
  eventoId?: string;
  participantIds: string[];
  description: string;
  projectId?: string;
}

export interface FinancialDocument {
  id: string;
  contractId?: string;
  convenioId?: string;
  otrosieId?: string;
  projectId?: string;
  eventoId?: string;
  
  // Basic fields
  tipo: 'CDP' | 'RC' | 'Otros';
  numero: string;
  valor: number;
  fecha: string;
  descripcion: string;
  
  // Extended matrix fields
  radicado?: string;
  solicitante?: string;
  areaEjecutora?: string;
  resolucion?: string;
  alias?: string;
  fuente?: string;
  linea?: string;
  nota?: string;
  rubro?: string;
  nacionalRegional?: string;
  identificacion?: string;
  nombre?: string;
  
  // RC specific fields
  numeroCdp?: string;
  numeroRc?: string;
  fechaRc?: string;
  valorRc?: number;
  radicadoRc?: string;
  contrato?: string; // Extracted contract number/name
  areaSolicitante?: string;
  
  // Execution fields
  estado?: string;
  fechaInicial?: string;
  fechaFinal?: string;
  valorPagado?: number;
  valorPorPagar?: number;
  nombreFirma?: string;
  cargoFirma?: string;
  usuario?: string;

  documento_url?: string;
  validacion_ia?: {
    coherente: boolean;
    observaciones: string;
    inconsistencias: string[];
  };
}

export interface FinancialTraceability {
  id: string;
  cdpId?: string;
  rcId?: string;
  rpIds: string[];
  contractId?: string;
  convenioId?: string;
  otrosieId?: string;
  projectId?: string;
  eventoId?: string;
  
  // Lifecycle status
  status: 'Disponibilidad' | 'Compromiso' | 'Contratación' | 'Ejecución' | 'Cerrado';
  
  // Totals
  valorCDP: number;
  valorRC: number;
  valorRP: number; // Sum of RPs
  valorPagado: number;
  saldoPorComprometer: number; // CDP - RC
  saldoPorContratar: number; // RC - Contract
  saldoPorPagar: number; // RC - Pagado
  
  // Audit
  lastAuditDate: string;
  hasInconsistencies: boolean;
  inconsistencyCount: number;
  icf: number; // Índice de Coherencia Financiera (0-100)
  semaforo: 'Verde' | 'Amarillo' | 'Rojo';
}

export interface FinancialAuditIssue {
  id: string;
  severity: 'Alta' | 'Media' | 'Baja';
  type: 'Exceso' | 'FaltaVinculo' | 'InconsistenciaTemporal' | 'Duplicidad';
  entityId: string;
  entityType: 'CDP' | 'RC' | 'RP' | 'Contrato' | 'Proyecto';
  description: string;
  suggestedFix: string;
  date: string;
}

export interface ProjectData {
  project: Project;
  contracts: Contract[];
  otrosies: Otrosie[];
  afectaciones: Afectacion[];
  presupuesto: Presupuesto;
  avances: Avance[];
  seguimientos: Seguimiento[];
  alerts: Alert[];
  environmental: Environmental[];
  interventoriaReports?: InterventoriaReport[];
  pagos?: Pago[];
  ops?: OpsContractor[];
  comisiones?: Comision[];
  riesgos?: Riesgo[];
  polizas?: Poliza[];
  documents?: ProjectDocument[];
  actasComite?: ActaComite[];
  suspensiones?: Suspension[];
  financialDocuments?: FinancialDocument[];
}

export interface Vigencia {
  id: string;
  anio: string;
  presupuestoAsignado: number;
  estado: 'Abierta' | 'Cerrada';
  descripcion?: string;
}

export interface LineaInversion {
  id: string;
  nombre: string;
  codigo: string;
  descripcion?: string;
  color?: string;
  presupuestosPorVigencia?: Record<string, number>; // Record<vigenciaId, presupuesto>
}

export interface Contractor {
  id: string;
  nombre: string;
  nit: string;
  tipo: 'Persona Natural' | 'Persona Jurídica' | 'Consorcio / Unión Temporal';
  representanteLegal?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  fechaRegistro: string;
  rutUrl?: string;
}

export interface ContractorEvaluation {
  id: string;
  contractorId: string;
  fecha: string;
  periodo: string;
  calificacionCalidad: number; // 1-5
  calificacionCumplimiento: number; // 1-5
  calificacionSST: number; // 1-5
  calificacionAmbiental: number; // 1-5
  observaciones: string;
  evaluador: string;
}

export type DocumentType = 
  | 'Convenio'
  | 'Contrato' 
  | 'Acta' 
  | 'Acta de Comité'
  | 'Informe' 
  | 'Soporte Financiero (CDP, RP)'
  | 'Permiso Ambiental'
  | 'CDP' 
  | 'RC' 
  | 'Otrosí' 
  | 'Suspensión'
  | 'Evidencia' 
  | 'RUT' 
  | 'Cédula' 
  | 'Certificación' 
  | 'Póliza' 
  | 'Garantía'
  | 'Factura'
  | 'Soporte de Pago'
  | 'Soporte Pago'
  | 'Soporte Evento'
  | 'Hoja de Vida'
  | 'Documento Contractual'
  | 'Documento Técnico'
  | 'POT'
  | 'POD'
  | 'Reporte IDEAM'
  | 'Estudio Técnico'
  | 'Dataset Territorial';

export interface DocumentVersion {
  id: string;
  version: number;
  fecha: string;
  url: string;
  nombreArchivo: string;
  subidoPor: string;
  comentario?: string;
  accion: 'Subida' | 'Edición' | 'Aprobación' | 'Firma';
  estado: 'Borrador' | 'En revisión' | 'Aprobado' | 'Firmado';
  responsablesRevision?: {
    tecnico?: string;
    juridico?: string;
    financiero?: string;
  };
  firmas?: {
    nombre: string;
    fecha: string;
  }[];
}

export interface ProjectDocument {
  id: string;
  projectId?: string;
  convenioId?: string;
  professionalId?: string;
  comisionId?: string;
  contractId?: string;
  otrosiId?: string;
  contractorId?: string;
  eventId?: string;
  reportId?: string;
  department?: string;
  municipio?: string;
  titulo: string;
  tipo: DocumentType;
  area?: string;
  descripcion?: string;
  fechaCreacion: string;
  ultimaActualizacion: string;
  versiones: DocumentVersion[];
  tags: string[];
  folderPath?: string;
  esObligatorio?: boolean;
  entidadEmisora?: string;
  estado: 'Borrador' | 'En revisión' | 'Aprobado' | 'Firmado';
  responsable?: string;
  linkedDocumentIds?: string[];
  analysis?: {
    summary: string;
    type: 'modificación de plazo' | 'adición presupuestal' | 'suspensión' | 'reinicio' | 'otro';
    importance: 'crítica' | 'media' | 'informativa';
    risks: string[];
    impacts: {
      schedule: string;
      budget: string;
      progress: string;
    };
    inconsistencies: string[];
    highlightedData: { key: string; value: string; context: string }[];
    riesgosMitigados?: string[];
    poblacionObjetivo?: number;
    deepLearningInsights?: {
      patronesDetectados: string[];
      casosExitoEstructuracion: string[];
      oportunidadesAhorro: string[];
      innovacionesDetectadas: string[];
      leccionesAprendidas: string[];
    };
  };
}

export interface RequiredDocument {
  id: string;
  projectId: string;
  tipo: DocumentType;
  nombre: string;
  descripcion?: string;
}

export interface Task {
  id: string;
  projectId?: string;
  title: string;
  description: string;
  assignedTo: string; // Professional ID
  dueDate: string;
  status: 'Pendiente' | 'En Progreso' | 'Completada' | 'Atrasada';
  deliverableUrl?: string;
  completedDate?: string;
  priority: 'Baja' | 'Media' | 'Alta' | 'Urgente';
}

export type ReportType = 'Proyecto' | 'Territorio' | 'Riesgo' | 'LineaInversion' | 'Contratista' | 'General';

export interface SystemReport {
  id: string;
  titulo: string;
  tipo: ReportType;
  referenciaId?: string; // ID of the project, linea, contractor, etc. Or string for territory name
  fecha: string;
  autor: string;
  contenido: string;
  hallazgos: string[];
  recomendaciones: string[];
  estado: 'Borrador' | 'Publicado' | 'Archivado';
  documentosAdjuntos?: string[]; // URLs or IDs
}

export interface DamageRecord {
  id: string;
  eventId: string;
  municipio: string;
  departamento: string;
  projectId?: string; // If a specific project was damaged
  tipo: 'infraestructura' | 'social' | 'ambiental';
  severidad: 'Leve' | 'Moderada' | 'Grave' | 'Total';
  descripcion: string;
  costoEstimado: number;
  poblacionAfectada: number;
  estado: 'Registrado' | 'Priorizado' | 'En Reconstrucción' | 'Recuperado';
}

export interface HistoricalEvent {
  id: string;
  municipio: string;
  departamento: string;
  fecha: string;
  tipoAmenaza: string;
  descripcion: string;
  poblacionAfectada: number;
  magnitud: 'Leve' | 'Moderada' | 'Grave' | 'Catastrófica';
  estado?: 'Activo' | 'Cerrado';
  faseReconstruccion?: boolean;
}

export interface ExternalDataset {
  id: string;
  fuente: 'IDEAM' | 'POT' | 'POD' | 'Estudio Técnico' | 'Otro';
  titulo: string;
  fechaPublicacion: string;
  departamento: string;
  municipio?: string;
  hallazgosClave: string[];
  url?: string;
}

export interface ConocimientoTerritorial {
  id: string;
  departamento: string;
  poblacionEstimada?: number;
  extension?: number;
  historialDesastres?: any[];
  recomendaciones?: string[];
  nivelRiesgoGeneral?: string;
  factoresRiesgo?: string[];
  fechaActualizacion?: string;
  documentosAnalizados?: {
    id: string;
    titulo: string;
    tipo: 'POD' | 'POT' | 'Noticia' | 'Evento' | 'Directriz' | 'Otro';
    municipio?: string;
    fechaAnalisis: string;
    resumen: string;
    url?: string;
  }[];
  caracterizacionRiesgo?: string;
  zonasRiesgo?: {
    nombre?: string;
    nivel: 'Alto' | 'Medio' | 'Bajo';
    descripcion: string;
    municipio?: string;
  }[];
  analisisEstrategico?: string;
  analisisContratistas?: string;
  analisisProfesionales?: string;
  directricesEntidades?: {
    entidad: string;
    contenido: string;
    fecha: string;
  }[];
  noticiasEventos?: {
    titulo: string;
    fecha: string;
    descripcion: string;
    impacto: string;
  }[];
  ultimaActualizacion?: string;
}

export interface RiesgoTerritorial {
  id: string;
  municipioId: string; // Relación con el municipio
  tipo_riesgo: 'inundación' | 'deslizamiento' | 'sequía' | 'incendio' | 'sismo' | 'otro';
  probabilidad: number; // 0-1
  impacto: 'alto' | 'medio' | 'bajo';
  poblacion_expuesta: number;
  fecha_actualizacion: string;
  fuente: 'IDEAM' | 'SGC' | 'histórico' | 'IA';
}

export interface EnteControlRecord {
  id: string;
  entidad: 'SARLAFT' | 'Contraloría' | 'Procuraduría' | 'Policía' | 'Fiscalía' | 'RNMC' | 'Otro';
  tipoReferencia: 'Contratista' | 'Contrato';
  referenciaId: string;
  estado: 'Limpio' | 'Con Hallazgos' | 'En Investigación' | 'Sancionado';
  fechaConsulta: string;
  descripcion: string;
  documentoUrl?: string;
}

export interface GlobalState {
  proyectos: Project[];
  convenios: Convenio[];
  presupuestos: Presupuesto[];
  contratos: Contract[];
  otrosies: Otrosie[];
  afectaciones: Afectacion[];
  avances: Avance[];
  seguimientos: Seguimiento[];
  alertas: Alert[];
  ambiental: Environmental[];
  informesInterventoria: InterventoriaReport[];
  pagos: Pago[];
  ops: OpsContractor[];
  comisiones: Comision[];
  riesgos: Riesgo[];
  polizas: Poliza[];
  riesgosTerritoriales: RiesgoTerritorial[];
  suspensiones: Suspension[];
  vigencias: Vigencia[];
  lineasInversion: LineaInversion[];
  contratistas: Contractor[];
  evaluacionesContratistas: ContractorEvaluation[];
  documentos: ProjectDocument[];
  actas: Acta[];
  documentosSoporte: Documento[];
  municipios: Municipio[];
  departamentos: DepartmentRisk[];
  documentosRequeridos: RequiredDocument[];
  professionals: Professional[];
  tasks: Task[];
  systemReports: SystemReport[];
  conocimientoTerritorial: ConocimientoTerritorial[];
  externalDatasets: ExternalDataset[];
  historicalEvents: HistoricalEvent[];
  damageRecords: DamageRecord[];
  activities: Activity[];
  entesControl: EnteControlRecord[];
  eventos: EmergenciaEvento[];
  municipalityInventories: MunicipalityInventory[];
  financialDocuments: FinancialDocument[];
  financialAuditIssues: FinancialAuditIssue[];
  financialTraceability: FinancialTraceability[];
  globalICF: number;
  globalTechnicalSheet?: TechnicalSheet;
  surveys: Survey[];
  surveyResponses: SurveyResponse[];
  surveyAnalyses: SurveyAnalysis[];
  globalTotalPagado?: number;
}

export type ActivityType = 'obra' | 'interventoría' | 'ambiental' | 'social';

export interface ActivityMetric {
  unit: 'metros' | 'm²' | 'm³' | 'km' | 'unidad';
  quantityExecuted: number;
  totalQuantity: number;
  progress: number; // 0-100
}

export interface ExtractedActivity {
  id: string;
  name: string;
  type: ActivityType;
  description: string;
  metrics: ActivityMetric;
  cost: number;
  status: 'Reportada' | 'Inferida';
  inconsistencies?: string[];
}

export interface InformeAnalysis {
  activities: ExtractedActivity[];
  summary: string;
  inconsistenciesDetected: boolean;
}

export interface Threat {
  id: string;
  name: 'Inundación' | 'Deslizamiento' | 'Sismo' | 'Sequía' | 'Erosión Costera';
  description: string;
}

export interface DepartmentRisk {
  id: string;
  name: string;
  population: number;
  extension?: number; // km2
  density: number;
  riskIndex: number; // 0-100
  threats: string[]; // Threat IDs
  investment: number;
  disasterHistoryScore: number; // 0-100
}

export interface RiskModelData {
  departments: DepartmentRisk[];
  threats: Threat[];
}

export interface PrioritizationCriteria {
  riskLevelWeight: number;
  populationWeight: number;
  investmentWeight: number;
  disasterHistoryWeight: number;
}

export interface PrioritizedDepartment extends DepartmentRisk {
  priorityScore: number;
  rank: number;
}

export interface PODDocument {
  id: string;
  departamento: string;
  poblacion: number;
  caracterizacionRiesgo: string;
  zonasRiesgo: { name: string; level: 'Alto' | 'Medio' | 'Bajo'; description: string; municipio?: string }[];
  normativas: string[];
  analisisIA: string;
  analisisContratistas?: string;
  analisisProfesionales?: string;
  noticiaEvento?: {
    titulo: string;
    descripcion: string;
    impacto: string;
  };
  directriz?: {
    entidad: string;
    contenido: string;
  };
  documentUrl: string;
}

export interface ProjectPODConflict {
  projectId: string;
  conflictType: 'Zona de Riesgo' | 'Incumplimiento Normativo' | 'Alineación Estratégica';
  description: string;
  severity: 'Crítico' | 'Alto' | 'Medio' | 'Bajo';
}

export type ActaTipo = 'inicio' | 'suspensión' | 'reinicio' | 'liquidación';

export interface Acta {
  id: string;
  tipo: ActaTipo;
  fecha: string;
  contratoId?: string;
  projectId?: string;
  documentoId?: string;
}

export interface Documento {
  id: string;
  tipo: 'contrato' | 'cdp' | 'rc' | 'informe' | 'interventoría' | 'bitácora' | 'evidencia';
  nombre: string;
  url: string;
  soportaId: string;
  soportaTipo: 'Convenio' | 'Proyecto' | 'Contrato' | 'Otrosie' | 'Acta';
}

export interface Contratista {
  id: string;
  nombre: string;
  nit: string;
  tipo: 'Persona Jurídica' | 'Persona Natural';
}

export interface Municipio {
  id: string;
  nombre: string;
  departamentoId: string;
}

export interface Departamento {
  id: string;
  nombre: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  description?: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'multiple';
  options?: string[];
  required: boolean;
  category: string;
  placeholder?: string;
}

export interface TechnicalSheet {
  operativeName: string;
  generalObjective: string;
  specificObjectives: string[];
  universeDescription: string;
  universeTotal?: number;
  marginOfError?: number;
  confidenceLevel?: number;
  formulaUsed?: string;
  analysisUnit: string[];
  coverage: {
    levels: string[];
    classification: string[];
    prioritizedZones: string[];
  };
  samplingDesign: {
    type: string;
    sampleSize: number;
    selectionCriteria: string[];
  };
  collectionMethod: string[];
  collectionPeriod: string;
  conceptualFramework: string;
  limitations: string[];
  expectedResults: string[];
  normativity2026: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  departamentoId: string;
  municipioId: string;
  questions: SurveyQuestion[];
  createdAt: string;
  expertContext?: string;
  technicalSheet?: TechnicalSheet;
  isGroupSurvey?: boolean;
  defaultGroupSize?: number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  surveyorInfo: {
    fullName: string;
    idNumber: string;
    role: string;
  };
  respondentInfo: {
    fullName: string;
    idNumber: string;
    contact?: string;
    age?: number;
    gender?: string;
  };
  groupRespondents?: {
    fullName: string;
    idNumber: string;
    contact?: string;
  }[];
  departamentoId: string;
  municipioId: string;
  zonaId?: string;
  zonaAfectacion?: string;
  coordinates?: { lat: number, lng: number };
  date: string;
  answers: Record<string, any | any[]>;
  territorialComplexity?: {
    nbi: number;
    gini: number;
    deff: number;
    targetSampleSize?: number;
  };
}

export interface SurveyAnalysis {
  id: string;
  surveyId: string;
  aiAnalysis: string;
  date: string;
  indicators: {
    label: string;
    value: number;
    color: string;
  }[];
}
