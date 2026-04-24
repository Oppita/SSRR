import React, { useState, useRef } from 'react';
import { Project, BancoProyectosWorkflow, Activity, ProjectDocument } from '../types';
import { useProject } from '../store/ProjectContext';
import { CheckCircle2, XCircle, ArrowRight, Save, Clock, AlertTriangle, FileText, Users, Calendar, Plus, Trash2, Upload, Eye, Download, Loader2 } from 'lucide-react';
import { uploadDocumentToStorage, downloadFileWithAutoRepair } from '../lib/storage';

const REQUISITOS_GENERALES = [
  { id: 'carta', label: 'Carta de presentación y solicitud de recursos' },
  { id: 'formulario', label: 'Formulario FR-1702-SRR-01 diligenciado y firmado' },
  { id: 'cofinanciacion', label: 'Certificado de compromiso de cofinanciación (Si aplica)' },
  { id: 'acta', label: 'Acta de reunión del CTGRD que avala el proyecto' },
  { id: 'presupuesto', label: 'Presupuesto detallado (APU, Lista precios, Cantidades, AIU, etc.)' },
  { id: 'no_ejecucion', label: 'Certificado de no ejecución con otras fuentes' },
  { id: 'no_riesgo', label: 'Certificado de no zona de riesgo no mitigable y acorde a POT/PTGRD' },
  { id: 'ambiental', label: 'Pronunciamiento Autoridad Ambiental (POMCA / Permisos)' },
  { id: 'predios', label: 'Certificación de propiedad de terrenos y/o servidumbres' },
  { id: 'fotos', label: 'Registro fotográfico' },
  { id: 'icanh', label: 'Certificado ICANH (Si aplica)' }
];

const REQUISITOS_TECNICOS = [
  { id: 'riesgo', label: 'Análisis de riesgo' },
  { id: 'estudios', label: 'Estudios (Topográfico, Suelos/Geotécnico, Hidrológico/Hidráulico)' },
  { id: 'disenos', label: 'Diseños (Estructurales, Hidráulicos, SbN)' },
  { id: 'planos', label: 'Planos a escalas adecuadas (Localización, Generales y de detalle)' },
  { id: 'especificaciones', label: 'Especificaciones Técnicas' },
  { id: 'cronograma', label: 'Cronograma de actividades, flujo de fondos, plan financiero' }
];

interface FlujoBancoProyectosProps {
  project: Project;
}

const INITIAL_WORKFLOW: BancoProyectosWorkflow = {
  pasoActual: 1,
  estado: 'Pendiente',
  historial: []
};

export const FlujoBancoProyectos: React.FC<FlujoBancoProyectosProps> = ({ project }) => {
  const { updateProject, state, addDocument } = useProject();
  const workflow = project.lifecycle?.bancoProyectos || INITIAL_WORKFLOW;
  const [currentPaso, setCurrentPaso] = useState(workflow.pasoActual);
  const [observaciones, setObservaciones] = useState(workflow.observaciones || '');
  
  const [uploadingReqId, setUploadingReqId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeReqId, setActiveReqId] = useState<string | null>(null);
  const [activeReqType, setActiveReqType] = useState<'generales' | 'tecnicos' | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeReqId || !activeReqType) return;

    setUploadingReqId(activeReqId);
    try {
      const folderPath = `proyectos/${project.id}/banco_proyectos`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);

      const newDoc: ProjectDocument = {
        id: `DOC-${Date.now()}`,
        projectId: project.id,
        titulo: file.name,
        tipo: 'Documento Técnico',
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
        estado: 'Aprobado',
        tags: ['Banco de Proyectos'],
        versiones: [{
          id: `V-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString(),
          url: publicUrl,
          nombreArchivo: file.name,
          subidoPor: 'Usuario Actual',
          accion: 'Subida',
          estado: 'Aprobado'
        }]
      };

      addDocument(newDoc);

      // Update workflow state
      const reqField = activeReqType === 'generales' ? 'requisitosGenerales' : 'requisitosTecnicos';
      const currentReqs = workflow[reqField] || {};
      const currentDocs = workflow.documentosRequisitos || {};

      handleUpdateWorkflow({
        [reqField]: { ...currentReqs, [activeReqId]: true },
        documentosRequisitos: { ...currentDocs, [activeReqId]: newDoc.id }
      }, currentPaso, `Documento cargado para requisito: ${activeReqId}`);

    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento. Por favor intente nuevamente.');
    } finally {
      setUploadingReqId(null);
      setActiveReqId(null);
      setActiveReqType(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = (reqId: string, type: 'generales' | 'tecnicos') => {
    setActiveReqId(reqId);
    setActiveReqType(type);
    fileInputRef.current?.click();
  };

  const handlePreviewDocument = (docId: string) => {
    const doc = state.documentos.find(d => d.id === docId);
    if (doc && doc.versiones && doc.versiones.length > 0) {
      window.open(doc.versiones[doc.versiones.length - 1].url, '_blank');
    }
  };

  const handleDownloadDocument = async (docId: string) => {
    const doc = state.documentos.find(d => d.id === docId);
    if (doc && doc.versiones && doc.versiones.length > 0) {
      const latestVersion = doc.versiones[doc.versiones.length - 1];
      await downloadFileWithAutoRepair(latestVersion.url, latestVersion.nombreArchivo);
    }
  };

  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: '',
    type: 'Reunión',
    date: new Date().toISOString().split('T')[0],
    durationHours: 1,
    description: '',
    participantIds: []
  });

  const handleAddActivity = () => {
    if (!newActivity.title || !newActivity.description) return;
    
    const activity: Activity = {
      id: `ACT-${Date.now()}`,
      title: newActivity.title || 'Nueva Actividad',
      type: newActivity.type as any,
      date: newActivity.date || new Date().toISOString().split('T')[0],
      durationHours: newActivity.durationHours || 1,
      description: newActivity.description || '',
      participantIds: newActivity.participantIds || [],
      projectId: project.id
    };

    const updatedWorkflow = {
      ...workflow,
      actividades: [...(workflow.actividades || []), activity]
    };

    const updatedProject: Project = {
      ...project,
      lifecycle: {
        ...project.lifecycle,
        bancoProyectos: updatedWorkflow
      }
    };

    updateProject(updatedProject);
    setShowAddActivity(false);
    setNewActivity({
      title: '',
      type: 'Reunión',
      date: new Date().toISOString().split('T')[0],
      durationHours: 1,
      description: '',
      participantIds: []
    });
  };

  const handleDeleteActivity = (id: string) => {
    const updatedWorkflow = {
      ...workflow,
      actividades: (workflow.actividades || []).filter(a => a.id !== id)
    };

    const updatedProject: Project = {
      ...project,
      lifecycle: {
        ...project.lifecycle,
        bancoProyectos: updatedWorkflow
      }
    };

    updateProject(updatedProject);
  };

  const handleUpdateWorkflow = (updates: Partial<BancoProyectosWorkflow>, nextPaso: number, accion: string, newEstado?: BancoProyectosWorkflow['estado']) => {
    const newWorkflow: BancoProyectosWorkflow = {
      ...workflow,
      ...updates,
      pasoActual: nextPaso,
      estado: newEstado || 'En Revisión',
      observaciones,
      historial: [
        ...workflow.historial,
        {
          paso: currentPaso,
          fecha: new Date().toISOString(),
          accion,
          usuario: 'Usuario Actual' // In a real app, get from auth
        }
      ]
    };

    const updatedProject: Project = {
      ...project,
      lifecycle: {
        ...project.lifecycle,
        bancoProyectos: newWorkflow
      }
    };

    // If viabilizado, change project status
    if (newEstado === 'Viabilizado') {
      updatedProject.estado = 'En viabilidad';
    } else if (newEstado === 'Devuelto' || newEstado === 'Archivado') {
      // Keep in Banco de proyectos but maybe mark as inactive? Or just leave it.
    }

    updateProject(updatedProject);
    setCurrentPaso(nextPaso);
  };

  const renderStepContent = () => {
    switch (currentPaso) {
      case 1:
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">1 & 2. Recepción y Asignación</h3>
            <p className="text-slate-600">1. Recibir y Asignar el proyecto para revisión (Se recibe por SIGOB).</p>
            <p className="text-slate-600">2. Distribuir y verificar la asignación de los proyectos.</p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mt-4">
              <p className="font-medium text-slate-700 mb-3">¿El SIGOB se transfirió correctamente?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({}, 3, 'SIGOB transferido correctamente')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí, continuar
                </button>
                <button 
                  className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle size={18} /> No (Reintentar)
                </button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">3. Verificar objetivo de la solicitud</h3>
            <p className="text-sm text-slate-600">
              <strong>Proyecto:</strong> Radicado con 1 o más documentos requeridos en la lista de chequeo.<br/>
              <strong>Solicitud:</strong> Radicado que no tiene anexos o documentos requeridos.
            </p>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿La documentación presentada corresponde a una solicitud?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ esSolicitud: true }, 4, 'Es una solicitud')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí, es solicitud
                </button>
                <button 
                  onClick={() => handleUpdateWorkflow({ esSolicitud: false }, 5, 'No es solicitud (Es Proyecto)')}
                  className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 flex items-center gap-2"
                >
                  <XCircle size={18} /> No (Es Proyecto)
                </button>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">4. Dar respuesta a la solicitud</h3>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Fin del Procedimiento</p>
                <p className="text-sm mt-1">Se da respuesta a la solicitud mediante comunicación oficial. Se envía al ente territorial y se archiva la documentación.</p>
              </div>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({}, 16, 'Respuesta enviada', 'Archivado')}
              className="bg-slate-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-900"
            >
              Finalizar y Archivar
            </button>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">5. Verificar la trazabilidad del proyecto</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿El proyecto es nuevo?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ esNuevo: true }, 6, 'Proyecto nuevo')}
                  className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50"
                >
                  Sí, es nuevo
                </button>
                <button 
                  onClick={() => handleUpdateWorkflow({ esNuevo: false }, 9, 'Proyecto existente (SIGOB)')}
                  className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-50"
                >
                  No (Verificar SIGOB)
                </button>
              </div>
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">6. Registrar en SNIGRD</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿Se registró correctamente en el aplicativo SNIGRD?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ registradoSNIGRD: true }, 7, 'Registrado en SNIGRD')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí, registrado
                </button>
                <button 
                  className="bg-slate-100 text-slate-400 px-4 py-2 rounded-lg font-medium cursor-not-allowed flex items-center gap-2"
                >
                  <XCircle size={18} /> No (Reintentar)
                </button>
              </div>
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">7. Revisar la competencia del proyecto</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿El objeto del proyecto es competencia del FNGRD?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ esCompetenciaFNGRD: true }, 9, 'Es competencia del FNGRD')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí
                </button>
                <button 
                  onClick={() => handleUpdateWorkflow({ esCompetenciaFNGRD: false }, 8, 'No es competencia')}
                  className="bg-white border border-rose-200 text-rose-700 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 flex items-center gap-2"
                >
                  <XCircle size={18} /> No
                </button>
              </div>
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">8. Devolver el proyecto</h3>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Fin del Procedimiento</p>
                <p className="text-sm mt-1">El proyecto no es competencia del FNGRD. Se debe devolver a las entidades territoriales.</p>
              </div>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({}, 16, 'Devuelto por competencia', 'Devuelto')}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700"
            >
              Registrar Devolución y Archivar
            </button>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">9. Revisar la documentación técnica</h3>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3">Requisitos Generales</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {REQUISITOS_GENERALES.map(req => {
                  const isChecked = workflow.requisitosGenerales?.[req.id] || false;
                  const docId = workflow.documentosRequisitos?.[req.id];
                  const isUploading = uploadingReqId === req.id;

                  return (
                    <div key={req.id} className="flex flex-col gap-2 p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                          checked={isChecked}
                          onChange={(e) => {
                            const newReqs = { ...(workflow.requisitosGenerales || {}), [req.id]: e.target.checked };
                            handleUpdateWorkflow({ requisitosGenerales: newReqs }, currentPaso, `Actualizó requisito general: ${req.label}`);
                          }}
                        />
                        <span className="text-sm font-medium text-slate-700">{req.label}</span>
                      </label>
                      
                      <div className="ml-7 flex items-center gap-2">
                        {docId ? (
                          <>
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle2 size={12} /> Documento cargado
                            </span>
                            <button 
                              onClick={() => handlePreviewDocument(docId)}
                              className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Ver documento"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleDownloadDocument(docId)}
                              className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Descargar documento"
                            >
                              <Download size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => triggerFileInput(req.id, 'generales')}
                            disabled={isUploading}
                            className="text-xs flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {isUploading ? 'Subiendo...' : 'Subir archivo'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿La información se encuentra completa?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ documentacionCompleta: true }, 11, 'Documentación completa')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí, completa
                </button>
                <button 
                  onClick={() => handleUpdateWorkflow({ documentacionCompleta: false }, 10, 'Documentación incompleta')}
                  className="bg-white border border-rose-200 text-rose-700 px-4 py-2 rounded-lg font-medium hover:bg-rose-50 flex items-center gap-2"
                >
                  <XCircle size={18} /> No
                </button>
              </div>
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">10. Devolver el proyecto por metodología</h3>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-800 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Fin del Procedimiento</p>
                <p className="text-sm mt-1">La información está incompleta. Se debe devolver a la entidad territorial.</p>
              </div>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({}, 16, 'Devuelto por metodología', 'Devuelto')}
              className="bg-rose-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-rose-700"
            >
              Registrar Devolución y Archivar
            </button>
          </div>
        );
      case 11:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">11. Verificar que la información cumpla</h3>
            
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-700 mb-3">Requisitos Técnicos</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {REQUISITOS_TECNICOS.map(req => {
                  const isChecked = workflow.requisitosTecnicos?.[req.id] || false;
                  const docId = workflow.documentosRequisitos?.[req.id];
                  const isUploading = uploadingReqId === req.id;

                  return (
                    <div key={req.id} className="flex flex-col gap-2 p-3 hover:bg-slate-50 rounded-lg border border-slate-100">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="mt-1 rounded text-indigo-600 focus:ring-indigo-500"
                          checked={isChecked}
                          onChange={(e) => {
                            const newReqs = { ...(workflow.requisitosTecnicos || {}), [req.id]: e.target.checked };
                            handleUpdateWorkflow({ requisitosTecnicos: newReqs }, currentPaso, `Actualizó requisito técnico: ${req.label}`);
                          }}
                        />
                        <span className="text-sm font-medium text-slate-700">{req.label}</span>
                      </label>
                      
                      <div className="ml-7 flex items-center gap-2">
                        {docId ? (
                          <>
                            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded">
                              <CheckCircle2 size={12} /> Documento cargado
                            </span>
                            <button 
                              onClick={() => handlePreviewDocument(docId)}
                              className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Ver documento"
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={() => handleDownloadDocument(docId)}
                              className="text-slate-500 hover:text-indigo-600 p-1 rounded hover:bg-indigo-50 transition-colors"
                              title="Descargar documento"
                            >
                              <Download size={16} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => triggerFileInput(req.id, 'tecnicos')}
                            disabled={isUploading}
                            className="text-xs flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 transition-colors disabled:opacity-50"
                          >
                            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                            {isUploading ? 'Subiendo...' : 'Subir archivo'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="font-medium text-slate-700 mb-3">¿La documentación del proyecto cumple con los requisitos mínimos?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdateWorkflow({ cumpleRequisitosMinimos: true }, 13, 'Cumple requisitos')}
                  className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg font-medium hover:bg-emerald-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={18} /> Sí, cumple
                </button>
                <button 
                  onClick={() => handleUpdateWorkflow({ cumpleRequisitosMinimos: false }, 12, 'No cumple requisitos')}
                  className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 flex items-center gap-2"
                >
                  <XCircle size={18} /> No (Solicitar ajuste)
                </button>
              </div>
            </div>
          </div>
        );
      case 12:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">12. Solicitar información faltante y/o ajuste</h3>
            <p className="text-slate-600">Se ha solicitado a la entidad territorial que realice los ajustes necesarios.</p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 flex items-start gap-3">
              <AlertTriangle className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Fin del Procedimiento (Temporal)</p>
                <p className="text-sm mt-1">El proyecto queda en estado Incompleto hasta que la entidad territorial subsane.</p>
              </div>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({}, 11, 'Ajustes recibidos')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              Volver a Verificar (Paso 11) <ArrowRight size={18} />
            </button>
          </div>
        );
      case 13:
      case 14:
      case 15:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">13-15. Viabilización Técnica</h3>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-emerald-800">
              <p className="font-bold mb-2">Acciones a realizar:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>13. Viabilizar técnicamente el proyecto</li>
                <li>14. Informar a la entidad territorial sobre el estado</li>
                <li>15. Informar a la OAPI sobre la viabilidad</li>
              </ul>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({ viabilidadTecnica: true }, 17, 'Proyecto viabilizado', 'Viabilizado')}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700 flex items-center gap-2"
            >
              <CheckCircle2 size={18} /> Confirmar Viabilización
            </button>
          </div>
        );
      case 16:
        return (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={32} className="text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">16. Archivar la información del proyecto</h3>
            <p className="text-slate-600">El procedimiento ha finalizado y el proyecto se encuentra archivado en el Archivo de Gestión de la SRR.</p>
            <p className="text-sm font-bold text-slate-500 mt-4">FIN DEL PROCEDIMIENTO</p>
          </div>
        );
      case 17:
      case 18:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-800">17-18. Aprobación de Recursos</h3>
            <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-xl text-indigo-800">
              <p className="font-bold mb-2">Acciones finales:</p>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                <li>17. Recibir Aprobación de los recursos de los proyectos (OAPI)</li>
                <li>18. Dar respuesta a la OAPI y trasladar al Grupo de Infraestructura</li>
              </ul>
            </div>
            <button 
              onClick={() => handleUpdateWorkflow({ recursosAprobados: true }, 19, 'Recursos aprobados y respuesta enviada a OAPI')}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2"
            >
              Confirmar Aprobación y Finalizar <ArrowRight size={18} />
            </button>
          </div>
        );
      case 19:
        return (
          <div className="space-y-4 text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} className="text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Procedimiento Completado</h3>
            <p className="text-slate-600">El proyecto ha superado exitosamente el flujo del Banco de Proyectos y ha sido trasladado a Infraestructura.</p>
            <p className="text-sm font-bold text-emerald-600 mt-4">FIN DEL PROCEDIMIENTO</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileUpload}
        accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
      />
      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Flujo: Banco de Proyectos</h2>
          <p className="text-sm text-slate-500 mt-1">Paso actual: {currentPaso} | Estado: <span className="font-medium text-indigo-600">{workflow.estado}</span></p>
        </div>
        {workflow.estado === 'Viabilizado' && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold flex items-center gap-1">
            <CheckCircle2 size={16} /> Viabilizado
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Left Column: Current Step Action */}
        <div className="col-span-2 p-6">
          {renderStepContent()}

          <div className="mt-8 pt-6 border-t border-slate-100">
            <label className="block text-sm font-medium text-slate-700 mb-2">Observaciones del paso actual</label>
            <textarea
              className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Agregue notas u observaciones sobre la decisión tomada..."
            />
          </div>
        </div>

        {/* Right Column: History */}
        <div className="p-6 bg-slate-50">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock size={18} className="text-slate-400" />
            Historial del Flujo
          </h3>
          <div className="space-y-4">
            {workflow.historial.length === 0 ? (
              <p className="text-sm text-slate-500 italic">No hay historial registrado.</p>
            ) : (
              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                {workflow.historial.map((h, idx) => (
                  <div key={idx} className="relative pl-4">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full"></div>
                    <p className="text-xs text-slate-500 font-medium">{new Date(h.fecha).toLocaleString()}</p>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">Paso {h.paso}: {h.accion}</p>
                    <p className="text-xs text-slate-500 mt-1">Por: {h.usuario}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
