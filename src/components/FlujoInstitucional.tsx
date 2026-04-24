import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  FileText, 
  ClipboardCheck, 
  Gavel, 
  Coins, 
  HardHat,
  ArrowRight,
  Download,
  FileWarning,
  CheckSquare,
  Square,
  Upload,
  Activity,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { DocumentGenerator } from './DocumentGenerator';
import { useProject } from '../store/ProjectContext';
import { Project, ProjectStatus, ChecklistItem, ProjectDocument, Contract, ContractType, InterventoriaReport, ContractEvent, ContractEventType } from '../types';
import { showAlert } from '../utils/alert';

interface FlujoInstitucionalProps {
  initialSelectedProjectId?: string | null;
  onGoToProjectDetails?: (projectId: string) => void;
  onCreateProject?: () => void;
}

const FlujoInstitucional: React.FC<FlujoInstitucionalProps> = ({ initialSelectedProjectId, onGoToProjectDetails, onCreateProject }) => {
  const { state, addProject, updateProject, addContract, addDocument, addInterventoriaReport, addContractEvent } = useProject();
  const [activeStage, setActiveStage] = useState<ProjectStatus>('Banco de proyectos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showConvenioModal, setShowConvenioModal] = useState(false);
  const [showContratoModal, setShowContratoModal] = useState(false);
  const [showInformeModal, setShowInformeModal] = useState(false);
  const [showEventoModal, setShowEventoModal] = useState(false);
  const [showDocGenerator, setShowDocGenerator] = useState(false);
  const [docType, setDocType] = useState<'CDP' | 'Informe' | 'Contrato' | 'RC'>('CDP');
  const [newConvenio, setNewConvenio] = useState({ numero: '', objeto: '', partes: '' });
  const [newContrato, setNewContrato] = useState({ numero: '', tipo: 'Obra' as ContractType, contratista: '', nit: '', valor: 0 });
  const [newInforme, setNewInforme] = useState({ avanceFisico: 0, avanceFinanciero: 0, observaciones: '' });
  const [newEvento, setNewEvento] = useState({ tipo: 'Otrosí', descripcion: '' });
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingItem, setUploadingItem] = useState<{ projectId: string, component: 'tecnico' | 'financiero' | 'juridico' | 'liquidacion', itemId: string, label: string } | null>(null);

  useEffect(() => {
    if (initialSelectedProjectId) {
      const proj = state.proyectos.find(p => p.id === initialSelectedProjectId);
      if (proj) {
        setSelectedProject(proj);
        setActiveStage(proj.estado);
      }
    }
  }, [initialSelectedProjectId, state.proyectos]);

  // Form states for new request
  const [newRequest, setNewRequest] = useState({
    nombre: '',
    municipio: '',
    departamento: '',
    necesidad: '',
    tipoIntervencion: '',
    descripcionRiesgo: '',
    linea: 'Infraestructura Vial',
    estado: 'Banco de proyectos',
    responsableOpsId: '',
    apoyoTecnicoId: '',
    apoyoFinancieroId: '',
    apoyoJuridicoId: ''
  });

  const stages: ProjectStatus[] = [
    'Banco de proyectos',
    'En viabilidad',
    'En estructuración',
    'Aprobado',
    'En contratación',
    'En ejecución',
    'En seguimiento',
    'En liquidación',
    'Liquidado'
  ];

  const filteredProjects = useMemo(() => {
    return state.proyectos.filter(p => {
      const matchesSearch = (p.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                           (p.municipio || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      
      if (activeStage === 'En ejecución') {
        return (p.estado === 'En ejecución' || p.estado === 'Ejecución Directa') && matchesSearch;
      }
      
      return p.estado === activeStage && matchesSearch;
    });
  }, [state.proyectos, activeStage, searchTerm]);

  const handleCreateRequest = () => {
    const isDirectExecution = newRequest.estado === 'Ejecución Directa';

    const project: Project = {
      id: `PRJ-${Math.floor(Math.random() * 10000)}`,
      convenioId: '',
      nombre: newRequest.nombre,
      departamento: newRequest.departamento,
      municipio: newRequest.municipio,
      necesidad: newRequest.necesidad,
      descripcionRiesgo: newRequest.descripcionRiesgo,
      linea: newRequest.linea,
      vigencia: '2026',
      tipoObra: newRequest.tipoIntervencion,
      estado: isDirectExecution ? 'En ejecución' : (newRequest.estado as Project['estado']),
      esEjecucionDirecta: isDirectExecution,
      avanceFisico: isDirectExecution ? 1 : 0,
      avanceProgramado: 0,
      avanceFinanciero: 0,
      fechaInicio: '',
      fechaFin: '',
      justificacion: newRequest.necesidad,
      objetivoGeneral: '',
      objetivosEspecificos: [],
      alcance: '',
      beneficiarios: '',
      presupuestoDetallado: [],
      actividadesPrincipales: [],
      solicitudAlcalde: {
        necesidad: newRequest.necesidad,
        tipoIntervencion: newRequest.tipoIntervencion,
        fechaSolicitud: new Date().toISOString().split('T')[0]
      },
      lifecycle: {
        viabilidad: {
          resultado: 'pendiente',
          observaciones: ''
        },
        estructuracion: {
          tecnico: [
            { id: 'T1', label: 'Diagnóstico', completed: false },
            { id: 'T2', label: 'Solución Técnica', completed: false },
            { id: 'T3', label: 'Alcance', completed: false }
          ],
          financiero: [
            { id: 'F1', label: 'Presupuesto', completed: false },
            { id: 'F2', label: 'Fuentes de Financiación', completed: false },
            { id: 'F3', label: 'CDP', completed: false }
          ],
          juridico: [
            { id: 'J1', label: 'Borrador de Contrato', completed: false },
            { id: 'J2', label: 'Estudios Previos', completed: false }
          ]
        }
      },
      responsableOpsId: newRequest.responsableOpsId,
      apoyoTecnicoId: newRequest.apoyoTecnicoId,
      apoyoFinancieroId: newRequest.apoyoFinancieroId,
      apoyoJuridicoId: newRequest.apoyoJuridicoId
    };
    addProject(project);
    setShowNewRequestModal(false);
    setNewRequest({
      nombre: '',
      municipio: '',
      departamento: '',
      necesidad: '',
      tipoIntervencion: '',
      descripcionRiesgo: '',
      linea: 'Infraestructura Vial',
      estado: 'Banco de proyectos',
      responsableOpsId: '',
      apoyoTecnicoId: '',
      apoyoFinancieroId: '',
      apoyoJuridicoId: ''
    });
  };

  const handleCreateConvenio = () => {
    if (!selectedProject) return;
    const contract: Contract = {
      id: `CONV-${Math.floor(Math.random() * 10000)}`,
      projectId: selectedProject.id,
      numero: newConvenio.numero,
      tipo: 'Convenio',
      contratista: newConvenio.partes,
      nit: 'N/A',
      valor: 0,
      plazoMeses: 12,
      objetoContractual: newConvenio.objeto,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      eventos: [],
      estado: 'En ejecución'
    };
    addContract(contract);
    setShowConvenioModal(false);
    setNewConvenio({ numero: '', objeto: '', partes: '' });
  };

  const handleCreateContrato = () => {
    if (!selectedProject) return;
    const contract: Contract = {
      id: `CONT-${Math.floor(Math.random() * 10000)}`,
      projectId: selectedProject.id,
      numero: newContrato.numero,
      tipo: newContrato.tipo,
      contratista: newContrato.contratista,
      nit: newContrato.nit,
      valor: newContrato.valor,
      plazoMeses: 6,
      objetoContractual: `Contrato de ${newContrato.tipo}`,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      eventos: [],
      estado: 'En ejecución'
    };
    addContract(contract);
    setShowContratoModal(false);
    setNewContrato({ numero: '', tipo: 'Obra', contratista: '', nit: '', valor: 0 });
  };

  const handleCreateInforme = () => {
    if (!selectedProject) return;
    const report: InterventoriaReport = {
      id: `REP-${Date.now()}`,
      projectId: selectedProject.id,
      semana: 1,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date().toISOString().split('T')[0],
      interventorResponsable: 'Usuario Actual',
      obraProgramadaPct: newInforme.avanceFisico,
      obraEjecutadaPct: newInforme.avanceFisico,
      valorProgramado: newInforme.avanceFinanciero,
      valorEjecutado: newInforme.avanceFinanciero,
      actividadesEjecutadas: 'Actividades de la semana',
      actividadesProximas: 'Actividades próximas',
      sisoAmbiental: 'Sin novedades',
      observaciones: newInforme.observaciones,
      fotografias: []
    };
    addInterventoriaReport(report);
    setShowInformeModal(false);
    setNewInforme({ avanceFisico: 0, avanceFinanciero: 0, observaciones: '' });
  };

  const handleCreateEvento = () => {
    if (!selectedProject) return;
    const contractId = state.contratos.find(c => c.projectId === selectedProject.id && c.tipo !== 'Convenio')?.id || '';
    if (!contractId) {
      showAlert('No hay contratos asociados a este proyecto para registrar eventos.');
      return;
    }
    const event: ContractEvent = {
      id: `EV-${Date.now()}`,
      contractId,
      tipo: newEvento.tipo as ContractEventType,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: newEvento.descripcion,
      impactoPlazoMeses: 0,
      impactoValor: 0
    };
    addContractEvent(event);
    setShowEventoModal(false);
    setNewEvento({ tipo: 'Otrosí', descripcion: '' });
  };

  const handleUpdateViabilidad = (projectId: string, resultado: 'viable' | 'requiere ajustes' | 'no viable', observaciones: string) => {
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project) return;

    const newState = resultado === 'viable' ? 'En estructuración' : project.estado;

    const updatedProject: Project = {
      ...project,
      lifecycle: {
        ...project.lifecycle,
        viabilidad: {
          resultado,
          observaciones,
          fechaEvaluacion: new Date().toISOString().split('T')[0],
          evaluador: 'Comité Técnico SRR'
        }
      },
      estado: newState
    };
    updateProject(updatedProject);
    setSelectedProject(updatedProject);
    setActiveStage(newState);
  };

  const toggleChecklistItem = (projectId: string, component: 'tecnico' | 'financiero' | 'juridico' | 'liquidacion', itemId: string, label: string) => {
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project) return;

    let isCompleted = false;
    if (component === 'liquidacion') {
      isCompleted = project.lifecycle?.liquidacion?.checklist.find(i => i.id === itemId)?.completed || false;
    } else {
      isCompleted = project.lifecycle?.estructuracion?.[component].find(i => i.id === itemId)?.completed || false;
    }

    if (isCompleted) {
      // Just toggle off
      const updatedProject = { ...project };
      if (component === 'liquidacion') {
        updatedProject.lifecycle!.liquidacion!.checklist = updatedProject.lifecycle!.liquidacion!.checklist.map(item => 
          item.id === itemId ? { ...item, completed: false, documentId: undefined } : item
        );
      } else {
        updatedProject.lifecycle!.estructuracion![component] = updatedProject.lifecycle!.estructuracion![component].map(item => 
          item.id === itemId ? { ...item, completed: false, documentId: undefined } : item
        );
      }
      updateProject(updatedProject);
    } else {
      // Trigger file upload
      setUploadingItem({ projectId, component, itemId, label });
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingItem) return;

    const { projectId, component, itemId, label } = uploadingItem;
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project) return;

    const getArea = (comp: string) => {
      switch (comp) {
        case 'tecnico': return 'Banco de Proyectos';
        case 'financiero': return 'Financiera';
        case 'juridico': return 'Jurídica';
        case 'liquidacion': return 'Interventoría';
        default: return 'General';
      }
    };

    // Create document
    const newDoc: ProjectDocument = {
      id: `DOC-${Date.now()}`,
      projectId,
      titulo: label,
      tipo: 'Evidencia',
      area: getArea(component),
      descripcion: `Documento de soporte para: ${label}`,
      fechaCreacion: new Date().toISOString().split('T')[0],
      ultimaActualizacion: new Date().toISOString().split('T')[0],
      tags: [component, 'checklist'],
      estado: 'Borrador',
      versiones: [
        {
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: '#',
          nombreArchivo: file.name,
          subidoPor: 'Usuario',
          accion: 'Subida',
          estado: 'Borrador'
        }
      ]
    };

    addDocument(newDoc);

    // Update project checklist
    const updatedProject = { ...project };
    if (!updatedProject.lifecycle) {
      updatedProject.lifecycle = {};
    }

    if (component === 'liquidacion') {
      if (!updatedProject.lifecycle.liquidacion) {
        updatedProject.lifecycle.liquidacion = { checklist: [
          { id: 'L1', label: 'Acta de Entrega y Recibo a Satisfacción', completed: false },
          { id: 'L2', label: 'Certificación de Calidad de Materiales', completed: false },
          { id: 'L3', label: 'Paz y Salvo de Prestaciones Sociales', completed: false },
          { id: 'L4', label: 'Informe Final de Interventoría', completed: false }
        ]};
      }
      updatedProject.lifecycle.liquidacion.checklist = updatedProject.lifecycle.liquidacion.checklist.map(item => 
        item.id === itemId ? { ...item, completed: true, documentId: newDoc.id } : item
      );
    } else {
      if (!updatedProject.lifecycle.estructuracion) {
        updatedProject.lifecycle.estructuracion = {
          tecnico: [
            { id: 'T1', label: 'Estudios de Suelos', completed: false },
            { id: 'T2', label: 'Diseño Estructural', completed: false },
            { id: 'T3', label: 'Planos Arquitectónicos', completed: false }
          ],
          financiero: [
            { id: 'F1', label: 'Presupuesto Estimado', completed: false },
            { id: 'F2', label: 'Análisis de Precios Unitarios', completed: false }
          ],
          juridico: [
            { id: 'J1', label: 'Certificado de Tradición y Libertad', completed: false },
            { id: 'J2', label: 'Permiso de Ocupación de Cauce', completed: false }
          ]
        };
      }
      updatedProject.lifecycle.estructuracion[component] = updatedProject.lifecycle.estructuracion[component].map(item => 
        item.id === itemId ? { ...item, completed: true, documentId: newDoc.id } : item
      );
    }
    updateProject(updatedProject);
    setUploadingItem(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleValidateComponent = (projectId: string, component: 'tecnico' | 'financiero' | 'juridico') => {
    const project = state.proyectos.find(p => p.id === projectId);
    if (!project || !project.lifecycle?.estructuracion) return;

    const items = project.lifecycle.estructuracion[component];
    const allCompleted = items.every(i => i.completed);

    if (!allCompleted) {
      showAlert(`Debe completar todos los items del componente ${component} y adjuntar sus documentos antes de validar.`);
      return;
    }

    const updatedProject: Project = {
      ...project,
      lifecycle: {
        ...project.lifecycle,
        estructuracion: {
          ...project.lifecycle.estructuracion,
          [`${component}Validado`]: true
        }
      }
    };
    updateProject(updatedProject);
    setSelectedProject(updatedProject);
  };

  const canAdvanceFromEstructuracion = (project: Project) => {
    if (!project.lifecycle?.estructuracion) return false;
    const { tecnicoValidado, financieroValidado, juridicoValidado } = project.lifecycle.estructuracion;
    return !!(tecnicoValidado && financieroValidado && juridicoValidado);
  };

  const handleAdvanceStage = (project: Project) => {
    const currentIndex = stages.indexOf(project.estado);
    if (currentIndex < stages.length - 1) {
      const nextStage = stages[currentIndex + 1];
      
      // Validation for specific stages
      if (project.estado === 'En estructuración' && !canAdvanceFromEstructuracion(project)) {
        showAlert('Debe completar todas las listas de chequeo de estructuración antes de avanzar.');
        return;
      }

      if (project.estado === 'Aprobado') {
        const projectContracts = state.contratos.filter(c => c.projectId === project.id && c.tipo === 'Convenio');
        if (projectContracts.length === 0) {
          showAlert('Debe crear el convenio inicial antes de pasar a la etapa de contratación.');
          return;
        }
      }

      if (project.estado === 'En contratación') {
        const projectContracts = state.contratos.filter(c => c.projectId === project.id && c.tipo !== 'Convenio');
        if (projectContracts.length === 0) {
          showAlert('Debe registrar al menos un contrato (Obra, Interventoría, etc.) para este proyecto antes de pasar a ejecución.');
          return;
        }
      }

      if (project.estado === 'En liquidación') {
        const allDocsLoaded = state.documentos.filter(d => d.projectId === project.id).length >= 5; // Mock validation
        const checklistComplete = project.lifecycle?.liquidacion?.checklist.every(i => i.completed);
        
        if (!checklistComplete) {
          showAlert('Debe completar la lista de chequeo de liquidación.');
          return;
        }
        if (!allDocsLoaded) {
          showAlert('Validación automática: Faltan documentos obligatorios para proceder con la liquidación.');
          return;
        }
      }

      updateProject({ ...project, estado: nextStage });
      setActiveStage(nextStage);
      setSelectedProject(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      />
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-6 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Flujo Institucional de Proyectos</h1>
            <p className="text-slate-500">Gestión del ciclo de vida desde el banco de proyectos hasta la liquidación.</p>
          </div>
          <button 
            onClick={() => {
              if (onCreateProject) {
                onCreateProject();
              } else {
                setShowNewRequestModal(true);
              }
            }}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            <Plus size={20} />
            Nuevo Proyecto
          </button>
        </div>

        {/* Stage Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {stages.map((stage, idx) => (
            <React.Fragment key={stage}>
              <button
                onClick={() => setActiveStage(stage)}
                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                  activeStage === stage 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {stage === 'En viabilidad' ? 'Evaluación de Viabilidad' : stage}
              </button>
              {idx < stages.length - 1 && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* List Column */}
        <div className="w-1/3 border-r border-slate-200 bg-white overflow-y-auto p-6 space-y-4">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o municipio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            />
          </div>

          {filteredProjects.length > 0 ? (
            filteredProjects.map(p => (
              <div 
                key={p.id}
                onClick={() => setSelectedProject(p)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedProject?.id === p.id 
                    ? 'border-indigo-500 bg-indigo-50 shadow-sm' 
                    : 'border-slate-100 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{p.id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.estado === 'Liquidado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {p.estado}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 line-clamp-2 mb-1">{p.nombre}</h3>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Search size={12} /> {p.municipio}, {p.departamento}
                </p>
                <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400">Solicitado: {p.solicitudAlcalde?.fechaSolicitud || 'N/A'}</span>
                  <ArrowRight size={14} className="text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <FileText size={48} className="text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No hay proyectos en esta etapa.</p>
            </div>
          )}
        </div>

        {/* Detail Column */}
        <div className="flex-1 overflow-y-auto bg-slate-50 p-8">
          {selectedProject ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Project Header */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedProject.nombre}</h2>
                    <p className="text-slate-500">{selectedProject.municipio}, {selectedProject.departamento}</p>
                  </div>
                  {!['Banco de proyectos', 'En viabilidad'].includes(selectedProject.estado) && (
                    <button 
                      onClick={() => handleAdvanceStage(selectedProject)}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200"
                    >
                      Avanzar Etapa <ArrowRight size={18} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Línea de Inversión</p>
                    <p className="text-sm font-bold text-slate-700">{selectedProject.linea}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Tipo de Intervención</p>
                    <p className="text-sm font-bold text-slate-700">{selectedProject.tipoObra}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Vigencia</p>
                    <p className="text-sm font-bold text-slate-700">{selectedProject.vigencia}</p>
                  </div>
                </div>
              </div>

              {/* Stage Specific Content */}
              {selectedProject.estado === 'Banco de proyectos' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <ClipboardCheck size={20} className="text-indigo-500" />
                    Detalle de la Solicitud
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-bold text-slate-700">Necesidad Identificada</p>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-1">
                        {selectedProject.solicitudAlcalde?.necesidad}
                      </p>
                    </div>
                    <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          const updated = { ...selectedProject, estado: 'En viabilidad' as ProjectStatus };
                          updateProject(updated);
                          setSelectedProject(updated);
                          setActiveStage('En viabilidad');
                        }}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700"
                      >
                        Iniciar Evaluación de Viabilidad
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'En viabilidad' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-indigo-500" />
                    Evaluación de Viabilidad
                  </h3>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <p className="text-sm text-slate-500">Genere el informe automático basado en los datos del proyecto para iniciar la evaluación.</p>
                      <button 
                        onClick={() => {
                          const autoText = `INFORME DE VIABILIDAD TÉCNICA\n\nProyecto: ${selectedProject.nombre}\nUbicación: ${selectedProject.municipio}, ${selectedProject.departamento}\nNecesidad: ${selectedProject.solicitudAlcalde?.necesidad || 'No especificada'}\nTipo de Intervención: ${selectedProject.tipoObra}\n\nCONCLUSIONES PRELIMINARES:\nEl proyecto se alinea con la línea de inversión de ${selectedProject.linea}. Se requiere verificar la disponibilidad presupuestal y los estudios topográficos iniciales.`;
                          const updated = { ...selectedProject };
                          if (!updated.lifecycle) updated.lifecycle = {};
                          if (!updated.lifecycle.viabilidad) updated.lifecycle.viabilidad = { resultado: 'pendiente', observaciones: '' };
                          updated.lifecycle.viabilidad.observaciones = autoText;
                          updateProject(updated);
                        }}
                        className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-indigo-200 transition-colors"
                      >
                        <FileText size={16} /> Generar Informe
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones y Conclusiones (Editables)</label>
                      <textarea 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-48 font-mono text-sm"
                        placeholder="Haga clic en 'Generar Informe' o ingrese el análisis de viabilidad..."
                        value={selectedProject.lifecycle?.viabilidad?.observaciones || ''}
                        onChange={(e) => {
                          const updated = { ...selectedProject };
                          if (!updated.lifecycle) updated.lifecycle = {};
                          if (!updated.lifecycle.viabilidad) updated.lifecycle.viabilidad = { resultado: 'pendiente', observaciones: '' };
                          updated.lifecycle.viabilidad.observaciones = e.target.value;
                          updateProject(updated);
                        }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Resultado de la Evaluación</label>
                      <div className="flex gap-4">
                        {['viable', 'requiere ajustes', 'no viable'].map((res) => (
                          <button
                            key={res}
                            onClick={() => {
                              const updated = { ...selectedProject };
                              if (!updated.lifecycle) updated.lifecycle = {};
                              if (!updated.lifecycle.viabilidad) updated.lifecycle.viabilidad = { resultado: 'pendiente', observaciones: '' };
                              updated.lifecycle.viabilidad.resultado = res as any;
                              updateProject(updated);
                            }}
                            className={`flex-1 py-3 rounded-xl border-2 font-bold capitalize transition-all ${
                              selectedProject.lifecycle?.viabilidad?.resultado === res
                                ? res === 'viable' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                                  res === 'requiere ajustes' ? 'border-amber-500 bg-amber-50 text-amber-700' :
                                  'border-rose-500 bg-rose-50 text-rose-700'
                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            {res}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <button className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline">
                        <Download size={16} /> Descargar PDF
                      </button>
                      <button 
                        onClick={() => {
                          if (selectedProject.lifecycle?.viabilidad?.resultado && selectedProject.lifecycle.viabilidad.resultado !== 'pendiente') {
                            handleUpdateViabilidad(
                              selectedProject.id, 
                              selectedProject.lifecycle.viabilidad.resultado as any, 
                              selectedProject.lifecycle.viabilidad.observaciones || ''
                            );
                          } else {
                            showAlert('Debe seleccionar un resultado antes de guardar.');
                          }
                        }}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                        disabled={!selectedProject.lifecycle?.viabilidad?.resultado || selectedProject.lifecycle.viabilidad.resultado === 'pendiente'}
                      >
                        Guardar Evaluación
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'En estructuración' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Técnico */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <HardHat size={18} className="text-indigo-500" /> Técnico
                    </h4>
                    <div className="space-y-3 flex-1">
                      {selectedProject.lifecycle?.estructuracion?.tecnico.map(item => (
                        <div key={item.id} className="flex items-center justify-between group">
                          <button 
                            onClick={() => toggleChecklistItem(selectedProject.id, 'tecnico', item.id, item.label)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            {item.completed ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-300 group-hover:text-indigo-400" />}
                            <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.label}</span>
                          </button>
                          {item.completed && item.documentId && (
                            <div title="Documento adjunto">
                              <FileText size={16} className="text-indigo-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      {selectedProject.lifecycle?.estructuracion?.tecnicoValidado ? (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Validado</span>
                      ) : (
                        <button 
                          onClick={() => handleValidateComponent(selectedProject.id, 'tecnico')}
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                        >
                          Validar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Financiero */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Coins size={18} className="text-emerald-500" /> Financiero
                    </h4>
                    <div className="space-y-3 flex-1">
                      {selectedProject.lifecycle?.estructuracion?.financiero.map(item => (
                        <div key={item.id} className="flex items-center justify-between group">
                          <button 
                            onClick={() => toggleChecklistItem(selectedProject.id, 'financiero', item.id, item.label)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            {item.completed ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-300 group-hover:text-indigo-400" />}
                            <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.label}</span>
                          </button>
                          {item.completed && item.documentId && (
                            <div title="Documento adjunto">
                              <FileText size={16} className="text-indigo-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-2">
                      <button 
                        onClick={() => {
                          setDocType('CDP');
                          setShowDocGenerator(true);
                        }}
                        className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors flex items-center gap-2"
                      >
                        <Printer size={16} />
                        Generar CDP
                      </button>
                      {selectedProject.lifecycle?.estructuracion?.financieroValidado ? (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Validado</span>
                      ) : (
                        <button 
                          onClick={() => handleValidateComponent(selectedProject.id, 'financiero')}
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                        >
                          Validar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Jurídico */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Gavel size={18} className="text-amber-500" /> Jurídico
                    </h4>
                    <div className="space-y-3 flex-1">
                      {selectedProject.lifecycle?.estructuracion?.juridico.map(item => (
                        <div key={item.id} className="flex items-center justify-between group">
                          <button 
                            onClick={() => toggleChecklistItem(selectedProject.id, 'juridico', item.id, item.label)}
                            className="flex-1 flex items-center gap-3 text-left"
                          >
                            {item.completed ? <CheckSquare size={18} className="text-emerald-500" /> : <Square size={18} className="text-slate-300 group-hover:text-indigo-400" />}
                            <span className={`text-sm ${item.completed ? 'text-slate-500 line-through' : 'text-slate-700'}`}>{item.label}</span>
                          </button>
                          {item.completed && item.documentId && (
                            <div title="Documento adjunto">
                              <FileText size={16} className="text-indigo-400" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      {selectedProject.lifecycle?.estructuracion?.juridicoValidado ? (
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={16} /> Validado</span>
                      ) : (
                        <button 
                          onClick={() => handleValidateComponent(selectedProject.id, 'juridico')}
                          className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors"
                        >
                          Validar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'En liquidación' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileWarning size={20} className="text-rose-500" /> Cierre y Liquidación
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Validación Automática de Documentos</h4>
                      <div className="space-y-3">
                        {[
                          { id: 'contrato', label: 'Contrato', keywords: ['contrato'] },
                          { id: 'otrosies', label: 'Otrosíes', keywords: ['otrosí', 'otrosi', 'adición', 'prórroga'] },
                          { id: 'informe_final', label: 'Informe Final de Interventoría', keywords: ['informe final', 'interventoría final'] },
                          { id: 'bitacora', label: 'Bitácora', keywords: ['bitácora', 'bitacora'] },
                          { id: 'rut', label: 'RUT', keywords: ['rut', 'registro único tributario'] },
                          { id: 'paz_salvo', label: 'Paz y Salvo', keywords: ['paz y salvo', 'pazysalvo'] }
                        ].map(item => {
                          const projectDocs = state.documentos.filter(d => d.projectId === selectedProject.id);
                          const isComplete = projectDocs.some(d => 
                            item.keywords.some(kw => d.titulo.toLowerCase().includes(kw) || d.tags?.some(tag => tag.toLowerCase().includes(kw)))
                          );
                          return (
                            <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                {isComplete ? (
                                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                    <CheckCircle2 size={16} />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={16} />
                                  </div>
                                )}
                                <span className={`text-sm font-medium ${isComplete ? 'text-slate-700' : 'text-slate-600'}`}>
                                  {item.label}
                                </span>
                              </div>
                              <div>
                                {isComplete ? (
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">Completo</span>
                                ) : (
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-md">Incompleto</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Validación de Soporte Documental</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Documentos Cargados</span>
                          <span className="text-sm font-bold text-slate-800">{state.documentos.filter(d => d.projectId === selectedProject.id).length} / 5</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min((state.documentos.filter(d => d.projectId === selectedProject.id).length / 5) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">
                          * El sistema requiere al menos 5 documentos clave (Acta de Inicio, Contrato, Informes, Acta de Recibo, etc.) para habilitar el cierre.
                        </p>
                        {onGoToProjectDetails && (
                          <button
                            onClick={() => onGoToProjectDetails(selectedProject.id)}
                            className="w-full mt-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                          >
                            <FileText size={16} />
                            Ir a Repositorio Documental
                          </button>
                        )}
                        
                        {(() => {
                          const checklistItems = [
                            { id: 'contrato', keywords: ['contrato'] },
                            { id: 'otrosies', keywords: ['otrosí', 'otrosi', 'adición', 'prórroga'] },
                            { id: 'informe_final', keywords: ['informe final', 'interventoría final'] },
                            { id: 'bitacora', keywords: ['bitácora', 'bitacora'] },
                            { id: 'rut', keywords: ['rut', 'registro único tributario'] },
                            { id: 'paz_salvo', keywords: ['paz y salvo', 'pazysalvo'] }
                          ];
                          const projectDocs = state.documentos.filter(d => d.projectId === selectedProject.id);
                          const completedCount = checklistItems.filter(item => 
                            projectDocs.some(d => item.keywords.some(kw => d.titulo.toLowerCase().includes(kw) || d.tags?.some(tag => tag.toLowerCase().includes(kw))))
                          ).length;
                          const isFullyComplete = completedCount === checklistItems.length && projectDocs.length >= 5;

                          return (
                            <div className="mt-6 pt-6 border-t border-slate-200">
                              <button
                                disabled={!isFullyComplete}
                                onClick={() => {
                                  updateProject({ ...selectedProject, estado: 'Liquidado' });
                                  showAlert('Acta de Liquidación generada exitosamente. El proyecto ha sido Liquidado.');
                                  setActiveStage('Liquidado');
                                }}
                                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                  isFullyComplete 
                                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200' 
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                              >
                                <ClipboardCheck size={20} />
                                Generar Acta de Liquidación
                              </button>
                              {!isFullyComplete && (
                                <p className="text-[10px] text-amber-600 mt-2 text-center font-medium">
                                  Complete la validación automática de documentos para habilitar la liquidación.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'Liquidado' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" /> Proyecto Liquidado
                  </h3>
                  <div className="bg-emerald-50 p-8 rounded-xl border border-emerald-200 text-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ClipboardCheck size={40} className="text-emerald-600" />
                    </div>
                    <h4 className="text-2xl font-bold text-emerald-900 mb-2">Liquidación Completada</h4>
                    <p className="text-emerald-700 max-w-lg mx-auto mb-8">
                      El proyecto ha cumplido con todos los requisitos legales, técnicos y financieros para su cierre definitivo. El Acta de Liquidación ha sido generada y archivada.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        onClick={() => {
                          import('jspdf').then(({ default: jsPDF }) => {
                            const doc = new jsPDF();
                            doc.setFontSize(18);
                            doc.text('ACTA DE LIQUIDACIÓN DE PROYECTO', 105, 20, { align: 'center' });
                            
                            doc.setFontSize(12);
                            doc.text(`Proyecto: ${selectedProject.nombre}`, 20, 40);
                            doc.text(`Departamento: ${selectedProject.departamento}`, 20, 50);
                            doc.text(`Municipio: ${selectedProject.municipio}`, 20, 60);
                            doc.text(`Fecha de Liquidación: ${new Date().toLocaleDateString('es-CO')}`, 20, 70);
                            
                            doc.setFontSize(14);
                            doc.text('1. RESUMEN FINANCIERO', 20, 90);
                            doc.setFontSize(12);
                            const presupuesto = state.presupuestos.find(p => p.projectId === selectedProject.id);
                            if (presupuesto) {
                              doc.text(`Valor Total: $${presupuesto.valorTotal.toLocaleString('es-CO')}`, 20, 100);
                              doc.text(`Pagos Realizados: $${presupuesto.pagosRealizados.toLocaleString('es-CO')}`, 20, 110);
                            }

                            doc.setFontSize(14);
                            doc.text('2. ESTADO FINAL', 20, 130);
                            doc.setFontSize(12);
                            doc.text(`Avance Físico: ${selectedProject.avanceFisico}%`, 20, 140);
                            doc.text(`Avance Financiero: ${selectedProject.avanceFinanciero}%`, 20, 150);

                            doc.setFontSize(14);
                            doc.text('3. DECLARACIÓN', 20, 170);
                            doc.setFontSize(11);
                            const text = 'Por medio de la presente acta, se declara formalmente liquidado el proyecto en mención, habiendo cumplido a satisfacción con los objetos contractuales, especificaciones técnicas y requerimientos financieros establecidos. Se anexan los soportes correspondientes en el repositorio documental.';
                            const splitText = doc.splitTextToSize(text, 170);
                            doc.text(splitText, 20, 180);

                            doc.text('_______________________', 40, 240);
                            doc.text('Firma Supervisor', 45, 250);

                            doc.text('_______________________', 120, 240);
                            doc.text('Firma Contratista', 125, 250);

                            doc.save(`Acta_Liquidacion_${selectedProject.id}.pdf`);
                          });
                        }}
                        className="bg-white text-emerald-700 border border-emerald-200 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition-colors flex items-center gap-2 shadow-sm"
                      >
                        <Download size={20} />
                        Exportar Acta PDF
                      </button>
                      {onGoToProjectDetails && (
                        <button
                          onClick={() => onGoToProjectDetails(selectedProject.id)}
                          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
                        >
                          <FileText size={20} />
                          Ver Repositorio Documental
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'Aprobado' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" /> Creación de Convenio
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-800">Convenios Asociados: {state.contratos.filter(c => c.projectId === selectedProject.id && c.tipo === 'Convenio').length}</h4>
                    <p className="text-slate-500 mt-2 mb-6">
                      Para avanzar a la etapa de contratación, debe crear el convenio inicial.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        onClick={() => setShowConvenioModal(true)}
                      >
                        Crear Convenio
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'En contratación' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <FileText size={20} className="text-indigo-500" /> Gestión de Contratos
                  </h3>
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                    <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                    <h4 className="text-lg font-bold text-slate-800">Contratos Asociados: {state.contratos.filter(c => c.projectId === selectedProject.id && c.tipo !== 'Convenio').length}</h4>
                    <p className="text-slate-500 mt-2 mb-6">
                      Para avanzar a la etapa de ejecución, el proyecto debe tener al menos un contrato registrado en el sistema.
                    </p>
                    <div className="flex justify-center gap-4">
                      <button 
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        onClick={() => setShowContratoModal(true)}
                      >
                        Agregar Contrato
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedProject.estado === 'En ejecución' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" /> Ejecución e Interventoría
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                      <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-800">Informes de Interventoría</h4>
                      <p className="text-slate-500 mt-2 mb-6 text-sm">
                        Registre el avance físico y financiero del proyecto.
                      </p>
                      <button 
                        className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-colors w-full"
                        onClick={() => setShowInformeModal(true)}
                      >
                        Registrar Informe
                      </button>
                      <button 
                        className="mt-2 bg-white text-indigo-600 border border-indigo-200 px-6 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors w-full flex items-center justify-center gap-2"
                        onClick={() => {
                          setDocType('Informe');
                          setShowDocGenerator(true);
                        }}
                      >
                        <Printer size={18} />
                        Generar Informe Ejecutivo
                      </button>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center">
                      <AlertTriangle size={48} className="text-slate-300 mx-auto mb-4" />
                      <h4 className="text-lg font-bold text-slate-800">Eventos Contractuales</h4>
                      <p className="text-slate-500 mt-2 mb-6 text-sm">
                        Registre modificaciones como otrosí, prórrogas o suspensiones.
                      </p>
                      <button 
                        className="bg-white text-indigo-600 border border-indigo-200 px-6 py-2 rounded-xl font-bold hover:bg-indigo-50 transition-colors w-full"
                        onClick={() => setShowEventoModal(true)}
                      >
                        Registrar Evento
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Default Message for other stages */}
              {!['Banco de proyectos', 'En viabilidad', 'En estructuración', 'Aprobado', 'En contratación', 'En ejecución', 'En liquidación'].includes(selectedProject.estado) && (
                <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
                  <Clock size={48} className="text-indigo-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-800">Proyecto en Etapa de {selectedProject.estado}</h3>
                  <p className="text-slate-500 mt-2">Este módulo se encuentra en seguimiento operativo. Utilice la Matriz Inteligente para ver detalles de ejecución.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <ClipboardCheck size={40} className="text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-400">Seleccione un proyecto</h2>
              <p className="text-slate-400 mt-2">Para ver el detalle del flujo institucional y gestionar sus etapas.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white shrink-0">
              <h3 className="text-xl font-bold">Nuevo Proyecto</h3>
              <p className="text-indigo-100 text-sm">Registro de necesidades territoriales en el Banco de Proyectos.</p>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre del Proyecto</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newRequest.nombre}
                    onChange={(e) => setNewRequest({...newRequest, nombre: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Municipio</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newRequest.municipio}
                    onChange={(e) => setNewRequest({...newRequest, municipio: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Departamento</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newRequest.departamento}
                    onChange={(e) => setNewRequest({...newRequest, departamento: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Intervención</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newRequest.tipoIntervencion}
                    onChange={(e) => setNewRequest({...newRequest, tipoIntervencion: e.target.value})}
                  >
                    <option value="">Seleccione...</option>
                    <option value="Construcción">Construcción</option>
                    <option value="Rehabilitación">Rehabilitación</option>
                    <option value="Mantenimiento">Mantenimiento</option>
                    <option value="Mitigación">Mitigación</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Estado / Fase Inicial</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 font-bold text-indigo-600"
                    value={newRequest.estado}
                    onChange={(e) => setNewRequest({...newRequest, estado: e.target.value})}
                  >
                    <option value="Banco de proyectos">Banco de proyectos (Fase Inicial)</option>
                    <option value="En viabilidad">En viabilidad</option>
                    <option value="En estructuración">En estructuración</option>
                    <option value="Aprobado">Aprobado</option>
                    <option value="En contratación">En contratación</option>
                    <option value="En ejecución">En ejecución</option>
                    <option value="Ejecución Directa">🚀 Ejecución Directa (Saltar validación)</option>
                    <option value="En seguimiento">En seguimiento</option>
                    <option value="En liquidación">En liquidación</option>
                    <option value="Liquidado">Liquidado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Línea de Inversión</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newRequest.linea}
                    onChange={(e) => setNewRequest({...newRequest, linea: e.target.value})}
                  >
                    {state.lineasInversion.map(l => (
                      <option key={l.id} value={l.nombre}>{l.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Necesidad Identificada (ej: protección costera)</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                  value={newRequest.necesidad}
                  onChange={(e) => setNewRequest({...newRequest, necesidad: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción del Riesgo</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                  value={newRequest.descripcionRiesgo}
                  onChange={(e) => setNewRequest({...newRequest, descripcionRiesgo: e.target.value})}
                />
              </div>

              {/* OPS Assignment Section */}
              <div className="border-t border-slate-200 pt-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-slate-800">Asignación de Equipo OPS</h4>
                  <button
                    type="button"
                    onClick={() => {
                      const availableOps = state.professionals.filter(p => p.carga !== 'Sobrecargado');
                      
                      // Suggest based on department experience if possible, otherwise just pick available
                      const suggestByRole = (roleKeywords: string[]) => {
                        const matches = availableOps.filter(p => 
                          roleKeywords.some(kw => p.profesion.toLowerCase().includes(kw) || p.especialidades.some(e => e.toLowerCase().includes(kw)))
                        );
                        // Sort by workload (Disponible first) and then by department match
                        matches.sort((a, b) => {
                          if (a.carga === 'Disponible' && b.carga !== 'Disponible') return -1;
                          if (a.carga !== 'Disponible' && b.carga === 'Disponible') return 1;
                          const aDeptMatch = a.departamentosExperiencia.includes(newRequest.departamento) ? 1 : 0;
                          const bDeptMatch = b.departamentosExperiencia.includes(newRequest.departamento) ? 1 : 0;
                          return bDeptMatch - aDeptMatch;
                        });
                        return matches.length > 0 ? matches[0].id : '';
                      };

                      setNewRequest(prev => ({
                        ...prev,
                        responsableOpsId: suggestByRole(['ingenier', 'arquitect']),
                        apoyoTecnicoId: suggestByRole(['ingenier', 'arquitect', 'técnico']),
                        apoyoFinancieroId: suggestByRole(['econom', 'contador', 'financier']),
                        apoyoJuridicoId: suggestByRole(['abogad', 'derecho', 'jurídic'])
                      }));
                    }}
                    className="text-sm bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-bold hover:bg-indigo-200 transition-colors flex items-center gap-2"
                  >
                    <Activity size={16} />
                    Sugerencia Inteligente
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Responsable Principal (OPS)</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newRequest.responsableOpsId}
                      onChange={(e) => setNewRequest({...newRequest, responsableOpsId: e.target.value})}
                    >
                      <option value="">Seleccione un profesional...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.profesion} ({p.carga})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Técnico</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newRequest.apoyoTecnicoId}
                      onChange={(e) => setNewRequest({...newRequest, apoyoTecnicoId: e.target.value})}
                    >
                      <option value="">Seleccione un profesional...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.profesion} ({p.carga})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Financiero</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newRequest.apoyoFinancieroId}
                      onChange={(e) => setNewRequest({...newRequest, apoyoFinancieroId: e.target.value})}
                    >
                      <option value="">Seleccione un profesional...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.profesion} ({p.carga})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Apoyo Jurídico</label>
                    <select
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                      value={newRequest.apoyoJuridicoId}
                      onChange={(e) => setNewRequest({...newRequest, apoyoJuridicoId: e.target.value})}
                    >
                      <option value="">Seleccione un profesional...</option>
                      {state.professionals.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} - {p.profesion} ({p.carga})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Professional Card Preview (if main responsible is selected) */}
                {newRequest.responsableOpsId && (
                  <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    {(() => {
                      const prof = state.professionals.find(p => p.id === newRequest.responsableOpsId);
                      if (!prof) return null;
                      return (
                        <div>
                          <h5 className="font-bold text-slate-800 mb-2">Ficha del Responsable Principal</h5>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="text-slate-500">Nombre:</span> {prof.nombre}</div>
                            <div><span className="text-slate-500">Profesión:</span> {prof.profesion}</div>
                            <div><span className="text-slate-500">Experiencia:</span> {prof.experienciaAnios} años</div>
                            <div><span className="text-slate-500">Proyectos Históricos:</span> {prof.proyectosRelevantes.length}</div>
                            <div className="col-span-2 flex items-center gap-2">
                              <span className="text-slate-500">Carga Actual:</span> 
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                prof.carga === 'Disponible' ? 'bg-emerald-100 text-emerald-700' :
                                prof.carga === 'Media' ? 'bg-amber-100 text-amber-700' :
                                'bg-rose-100 text-rose-700'
                              }`}>
                                {prof.carga} ({prof.proyectosActivos} proyectos, {prof.horasEstimadas}h)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowNewRequestModal(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateRequest}
                  className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Guardar Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Convenio Modal */}
      {showConvenioModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Crear Convenio</h3>
              <p className="text-indigo-100 text-sm">Registro del convenio inicial para el proyecto.</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Número de Convenio</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                  value={newConvenio.numero}
                  onChange={(e) => setNewConvenio({...newConvenio, numero: e.target.value})}
                  placeholder="Ej: CONV-2024-001"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Objeto del Convenio</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                  value={newConvenio.objeto}
                  onChange={(e) => setNewConvenio({...newConvenio, objeto: e.target.value})}
                  placeholder="Descripción del objeto del convenio..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Partes Involucradas</label>
                <input 
                  type="text" 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                  value={newConvenio.partes}
                  onChange={(e) => setNewConvenio({...newConvenio, partes: e.target.value})}
                  placeholder="Ej: UNGRD, Alcaldía Municipal"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Adjuntar PDF</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <FileText className="mx-auto text-slate-400 mb-2" size={24} />
                  <span className="text-sm text-slate-500">Haga clic para seleccionar archivo</span>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowConvenioModal(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateConvenio}
                  className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Crear Convenio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Contrato Modal */}
      {showContratoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Agregar Contrato</h3>
              <p className="text-indigo-100 text-sm">Registro de contrato de obra o interventoría.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Número</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newContrato.numero}
                    onChange={(e) => setNewContrato({...newContrato, numero: e.target.value})}
                    placeholder="Ej: CONT-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tipo</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newContrato.tipo}
                    onChange={(e) => setNewContrato({...newContrato, tipo: e.target.value as ContractType})}
                  >
                    <option value="Obra">Obra</option>
                    <option value="Interventoría">Interventoría</option>
                    <option value="Consultoría">Consultoría</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Contratista</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newContrato.contratista}
                    onChange={(e) => setNewContrato({...newContrato, contratista: e.target.value})}
                    placeholder="Nombre del contratista"
                  />
                  <button className="px-4 bg-slate-100 text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-200" title="Buscar en Perfil de Contratista">
                    <Search size={20} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">NIT</label>
                  <input 
                    type="text" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newContrato.nit}
                    onChange={(e) => setNewContrato({...newContrato, nit: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Valor</label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newContrato.valor}
                    onChange={(e) => setNewContrato({...newContrato, valor: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowContratoModal(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateContrato}
                  className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Agregar Contrato
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Informe Modal */}
      {showInformeModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Registrar Informe</h3>
              <p className="text-indigo-100 text-sm">Avance físico y financiero del proyecto.</p>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">% Avance Físico</label>
                  <input 
                    type="number" 
                    min="0" max="100"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newInforme.avanceFisico}
                    onChange={(e) => setNewInforme({...newInforme, avanceFisico: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">% Avance Financiero</label>
                  <input 
                    type="number" 
                    min="0" max="100"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                    value={newInforme.avanceFinanciero}
                    onChange={(e) => setNewInforme({...newInforme, avanceFinanciero: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Observaciones</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                  value={newInforme.observaciones}
                  onChange={(e) => setNewInforme({...newInforme, observaciones: e.target.value})}
                  placeholder="Observaciones del informe..."
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowInformeModal(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateInforme}
                  className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Registrar Informe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Evento Modal */}
      {showEventoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Registrar Evento Contractual</h3>
              <p className="text-indigo-100 text-sm">Modificaciones al contrato (Otrosí, Prórroga, Suspensión).</p>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Evento</label>
                <select 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
                  value={newEvento.tipo}
                  onChange={(e) => setNewEvento({...newEvento, tipo: e.target.value})}
                >
                  <option value="Otrosí">Otrosí</option>
                  <option value="Prórroga">Prórroga</option>
                  <option value="Suspensión">Suspensión</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                <textarea 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 h-24"
                  value={newEvento.descripcion}
                  onChange={(e) => setNewEvento({...newEvento, descripcion: e.target.value})}
                  placeholder="Descripción del evento contractual..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Adjuntar PDF de soporte</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                  <FileText className="mx-auto text-slate-400 mb-2" size={24} />
                  <span className="text-sm text-slate-500">Haga clic para seleccionar archivo</span>
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button 
                  onClick={() => setShowEventoModal(false)}
                  className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCreateEvento}
                  className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                >
                  Registrar Evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Document Generator Modal */}
      {showDocGenerator && selectedProject && (
        <DocumentGenerator 
          project={selectedProject}
          type={docType}
          onClose={() => setShowDocGenerator(false)}
        />
      )}
    </div>
  );
};

export default FlujoInstitucional;
