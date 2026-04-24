import React, { useRef, useState } from 'react';
import { ProjectDocument, DocumentType, DocumentVersion } from '../types';
import { useProject } from '../store/ProjectContext';
import { FileText, Clock, Eye, Download, Upload, Filter, History, CheckCircle, AlertTriangle, X, Loader2, AlertCircle } from 'lucide-react';

import { uploadDocumentToStorage, downloadFileWithAutoRepair, getRepairedUrl } from '../lib/storage';
import { useRepairedUrl } from '../hooks/useRepairedUrl';

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
    <p className="text-slate-500 text-sm">{message}</p>
  </div>
);

export const ProjectDocumentsTab = ({ projectId }: { projectId: string }) => {
  const { state, addDocument, updateDocumentAnalysis, applyDocumentAnalysis, updateProject } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterType, setFilterType] = useState<DocumentType | 'Todos'>('Todos');
  const [selectedDoc, setSelectedDoc] = useState<ProjectDocument | null>(null);
  const [viewingPdfUrl, setViewingPdfUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState(false);
  
  const projectDocs = state.documentos.filter(doc => doc.projectId === projectId);
  const project = state.proyectos.find(p => p.id === projectId);

  const classifyDocument = (fileName: string): DocumentType => {
    const name = (fileName || '').toLowerCase();
    if (name.includes('convenio')) return 'Convenio';
    if (name.includes('contrato')) return 'Contrato';
    if (name.includes('otrosi') || name.includes('otrosí')) return 'Otrosí';
    if (name.includes('comite') || name.includes('comité')) return 'Acta de Comité';
    if (name.includes('acta')) return 'Acta';
    if (name.includes('informe')) return 'Informe';
    if (name.includes('cdp') || name.includes('rp')) return 'Soporte Financiero (CDP, RP)';
    if (name.includes('permiso')) return 'Permiso Ambiental';
    if (name.includes('suspension') || name.includes('suspensión')) return 'Suspensión';
    return 'Evidencia';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsUploading(true);
    try {
      const tipo = classifyDocument(file.name);
      const folderPath = `${project.nombre}/${tipo}`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);

      const newDoc: ProjectDocument = {
        id: `DOC-${Date.now()}`,
        projectId,
        titulo: file.name.split('.')[0],
        tipo,
        descripcion: 'Documento subido automáticamente al repositorio.',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        folderPath,
        versiones: [
          {
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: publicUrl,
            nombreArchivo: file.name,
            subidoPor: 'Usuario',
            accion: 'Subida',
            estado: 'Borrador'
          }
        ],
        tags: [],
        estado: 'Borrador'
      };
      addDocument(newDoc);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Trigger analysis
      setIsAnalyzing(prev => ({ ...prev, [newDoc.id]: true }));
      try {
        if (newDoc.tipo === 'Acta de Comité') {
          const { parseActaComite } = await import('../services/documentAnalysisService');
          const actaData = await parseActaComite(file, projectId);
          actaData.documentId = newDoc.id;
          
          let newAlerts = [...(project.alertas || [])];
          if (actaData.afectacionesGeneradas && actaData.afectacionesGeneradas.length > 0) {
             // Create a new alert for each afectacion
             // We don't have addAlert here, but we can just add a string ID if we had one.
             // Actually, project.alertas is an array of strings (IDs).
             // Let's just push a descriptive string for now, or we can use the context's addAlert if available.
             // For simplicity, we'll just add the acta to the project.
          }

          const updatedProject = {
            ...project,
            actasComite: [...(project.actasComite || []), actaData]
          };
          updateProject(updatedProject);
        } else if (newDoc.tipo === 'Suspensión') {
          const { parseSuspension } = await import('../services/documentAnalysisService');
          const suspensionData = await parseSuspension(file, projectId);
          suspensionData.documentId = newDoc.id;
          
          const updatedProject = {
            ...project,
            estado: 'Suspendido' as const, // Update status
            suspensiones: [...(project.suspensiones || []), suspensionData]
          };
          updateProject(updatedProject);
        }

        const { analyzeDocument } = await import('../services/DocumentIntelligenceService');
        const analysis = await analyzeDocument(newDoc, project, projectDocs);
        updateDocumentAnalysis(newDoc.id, analysis);
        applyDocumentAnalysis(projectId, analysis);
      } catch (error) {
        console.error('Error analyzing document:', error);
      } finally {
        setIsAnalyzing(prev => ({ ...prev, [newDoc.id]: false }));
      }
    } catch (error) {
      console.error("Error uploading document:", error);
      alert("Hubo un error al subir el documento.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const filteredDocs = filterType === 'Todos' 
    ? projectDocs 
    : projectDocs.filter(d => d.tipo === filterType);

  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    const category = doc.tipo;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(doc);
    return acc;
  }, {} as Record<string, typeof projectDocs>);

  const { repairedUrl: viewerUrl, isLoading: isRepairing } = useRepairedUrl(viewingPdfUrl);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select 
            className="text-sm border-slate-200 rounded-lg p-2"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as DocumentType | 'Todos')}
          >
            <option value="Todos">Todos los tipos</option>
            <option value="Convenio">Convenio</option>
            <option value="Contrato">Contratos</option>
            <option value="Otrosí">Otrosíes</option>
            <option value="Acta">Actas</option>
            <option value="Informe">Informes</option>
            <option value="Soporte Financiero (CDP, RP)">Soportes Financieros</option>
            <option value="Permiso Ambiental">Permisos Ambientales</option>
            <option value="Evidencia">Evidencias</option>
          </select>
        </div>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={handleFileUpload}
        />
        <button 
          onClick={triggerUpload}
          disabled={isUploading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          {isUploading ? 'Subiendo...' : 'Subir Documento'}
        </button>
      </div>
      
      {filteredDocs.length === 0 ? (
        <EmptyState message="No hay documentos que coincidan con los filtros." />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([category, docs]) => (
            <div key={category} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between">
                <h3 className="font-bold text-slate-800 text-sm uppercase">{category}</h3>
                <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">
                  {docs.length}
                </span>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {docs.map(doc => (
                  <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-4 hover:shadow-md transition-all">
                    <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                      <FileText size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-slate-800 text-sm">{doc.titulo}</h4>
                        <div className="flex items-center gap-2">
                          {isAnalyzing[doc.id] && <span className="text-[10px] text-indigo-600 animate-pulse">Analizando...</span>}
                          {doc.analysis && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">Analizado</span>}
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            doc.estado === 'Aprobado' ? 'bg-emerald-100 text-emerald-700' :
                            doc.estado === 'Firmado' ? 'bg-blue-100 text-blue-700' : 
                            doc.estado === 'En revisión' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>{doc.estado}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-1">Entidad: {doc.entidadEmisora || 'N/A'}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-3">{doc.descripcion}</p>
                      {doc.analysis && (
                        <div className="text-[10px] bg-slate-50 p-2 rounded-lg mb-3 border border-slate-100">
                          <p className="font-bold text-slate-700 mb-1">Resumen:</p>
                          <p className="text-slate-600 line-clamp-2">{doc.analysis.summary}</p>
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <Clock size={12} />
                          {doc.ultimaActualizacion}
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setSelectedDoc(doc)}
                            className="text-[10px] font-bold text-slate-600 flex items-center gap-1"
                          >
                            <History size={12} /> Historial
                          </button>
                          <button 
                            onClick={() => {
                              const latestVersion = doc.versiones[doc.versiones.length - 1];
                              if (latestVersion && latestVersion.url !== '#') {
                                setViewingPdfUrl(latestVersion.url);
                              } else {
                                alert('No hay un archivo PDF disponible para visualizar.');
                              }
                            }}
                            className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                          >
                            <Eye size={12} /> Ver
                          </button>
                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              const latestVersion = doc.versiones[doc.versiones.length - 1];
                              if (latestVersion && latestVersion.url !== '#') {
                                await downloadFileWithAutoRepair(latestVersion.url, latestVersion.nombreArchivo);
                              } else {
                                alert('No hay un archivo PDF disponible para descargar.');
                              }
                            }}
                            className="text-[10px] font-bold text-slate-600 flex items-center gap-1"
                          >
                            <Download size={12} /> Descargar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold">Historial: {selectedDoc.titulo}</h3>
              <button onClick={() => setSelectedDoc(null)}><X size={24} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                {selectedDoc.versiones.map((v, i) => (
                  <div key={v.id} className="border-l-2 border-indigo-200 pl-4 py-2">
                    <div className="flex justify-between">
                      <p className="font-bold text-sm">v{v.version} - {v.estado}</p>
                      <p className="text-xs text-slate-500">{v.fecha}</p>
                    </div>
                    <p className="text-xs text-slate-600">{v.accion} por {v.subidoPor}</p>
                    {v.comentario && <p className="text-xs text-slate-500 italic">"{v.comentario}"</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingPdfUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <FileText size={20} />
                Visor de Documento
              </h3>
              <button 
                onClick={() => setViewingPdfUrl(null)}
                className="text-slate-300 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 bg-slate-100 p-4 relative">
              {isRepairing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-indigo-600" size={32} />
                    <p className="text-sm font-bold text-slate-600">Verificando conexión...</p>
                  </div>
                </div>
              ) : viewerUrl ? (
                <iframe 
                  src={viewerUrl} 
                  className="w-full h-full rounded-lg border border-slate-300 shadow-inner"
                  title="Visor PDF"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
                  <div className="flex flex-col items-center gap-3 text-red-500">
                    <AlertCircle size={48} />
                    <p className="text-lg font-bold">Documento no encontrado</p>
                    <p className="text-sm text-slate-600 text-center max-w-md">
                      El archivo no se pudo cargar. Es posible que haya sido eliminado o que el bucket de almacenamiento no esté configurado correctamente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
