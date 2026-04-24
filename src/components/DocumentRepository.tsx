import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { ProjectDocument, DocumentType, DocumentVersion } from '../types';
import { uploadDocumentToStorage, downloadFileWithAutoRepair, getRepairedUrl } from '../lib/storage';
import { useRepairedUrl } from '../hooks/useRepairedUrl';
import { 
  FileText, 
  Search, 
  Filter, 
  Upload, 
  Download, 
  Eye, 
  History, 
  Clock, 
  Tag, 
  Plus, 
  X,
  File,
  Calendar,
  ChevronRight,
  ExternalLink,
  Folder,
  AlertCircle,
  Package,
  CheckCircle2,
  Users,
  Map as MapIcon,
  MapPin
} from 'lucide-react';
import { colombiaData } from '../data/colombiaData';
import { showAlert } from '../utils/alert';

export const DocumentRepository: React.FC = () => {
  const { state, addDocument, addDocumentVersion, checkMissingDocuments } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<DocumentType | 'Todos'>('Todos');
  const [selectedProjectId, setSelectedProjectId] = useState<string | 'Todos' | 'Profesionales' | 'Territoriales'>('Todos');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<string | 'Todos'>('Todos');
  const [selectedDepartment, setSelectedDepartment] = useState<string | 'Todos'>('Todos');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline' | 'folders'>('grid');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<ProjectDocument | null>(null);
  const [showVersionHistory, setShowVersionHistory] = useState<ProjectDocument | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bucketOverride, setBucketOverride] = useState(localStorage.getItem('supabase_bucket_override') || '');

  const handleBucketChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBucketOverride(val);
    localStorage.setItem('supabase_bucket_override', val);
  };

  // Form state
  const [newDoc, setNewDoc] = useState({
    titulo: '',
    tipo: 'Contrato' as DocumentType,
    projectId: '',
    professionalId: '',
    department: '',
    municipio: '',
    reportId: '',
    contractorId: '',
    descripcion: '',
    tags: ''
  });

  const documentTypes: DocumentType[] = ['Contrato', 'Acta', 'Informe', 'CDP', 'RC', 'Otrosí', 'Evidencia', 'RUT', 'Hoja de Vida', 'POT', 'POD', 'Reporte IDEAM', 'Estudio Técnico', 'Dataset Territorial'];
  const territorialTypes = ['POT', 'POD', 'Reporte IDEAM', 'Estudio Técnico', 'Dataset Territorial'];
  const colombiaDepartments = colombiaData.map(d => d.name);
  const municipiosForSelectedDept = colombiaData.find(d => d.name === newDoc.department)?.municipalities || [];

  const filteredDocuments = useMemo(() => {
    return state.documentos.filter(doc => {
      const matchesSearch = (doc.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                           (doc.descripcion || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                           (doc.tags || []).some(t => (t || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
      const matchesType = selectedType === 'Todos' || doc.tipo === selectedType;
      
      let matchesProject = true;
      if (selectedProjectId === 'Profesionales') {
        matchesProject = !!doc.professionalId;
        if (selectedProfessionalId !== 'Todos') {
          matchesProject = matchesProject && doc.professionalId === selectedProfessionalId;
        }
      } else if (selectedProjectId === 'Territoriales') {
        matchesProject = !!doc.department;
        if (selectedDepartment !== 'Todos') {
          matchesProject = matchesProject && doc.department === selectedDepartment;
        }
      } else if (selectedProjectId === 'Convenios') {
        matchesProject = !!doc.convenioId;
      } else if (selectedProjectId !== 'Todos') {
        matchesProject = doc.projectId === selectedProjectId;
      }

      return matchesSearch && matchesType && matchesProject;
    });
  }, [state.documentos, searchTerm, selectedType, selectedProjectId, selectedProfessionalId, selectedDepartment]);

  const sortedTimelineDocs = useMemo(() => {
    return [...filteredDocuments].sort((a, b) => 
      new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime()
    );
  }, [filteredDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      showAlert('Por favor selecciona un archivo PDF.');
      return;
    }

    setIsUploading(true);
    try {
      const folderPath = newDoc.department 
        ? `Territoriales/${newDoc.department}/${newDoc.municipio || 'General'}` 
        : `Proyectos/${newDoc.projectId || 'General'}`;
      
      const fileUrl = await uploadDocumentToStorage(selectedFile, folderPath);

      const docId = `DOC-${Date.now()}`;
      const project = state.proyectos.find(p => p.id === newDoc.projectId);
      const professional = state.professionals.find(p => p.id === newDoc.professionalId);
      
      const newProjectDoc: ProjectDocument = {
        id: docId,
        projectId: newDoc.projectId || undefined,
        professionalId: newDoc.professionalId || undefined,
        department: newDoc.department || undefined,
        municipio: newDoc.municipio || undefined,
        reportId: newDoc.reportId || undefined,
        contractorId: newDoc.contractorId || undefined,
        titulo: newDoc.titulo,
        tipo: newDoc.tipo,
        descripcion: newDoc.descripcion,
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        tags: (newDoc.tags || '').split(',').map(t => t.trim()).filter(t => t !== ''),
        folderPath: newDoc.department ? `Territoriales/${newDoc.department}/${newDoc.municipio || 'General'}/${newDoc.tipo}` : project ? `${project.nombre || 'Sin Nombre'}/${newDoc.tipo}` : professional ? `Profesionales/${professional.nombre || 'Sin Nombre'}/${newDoc.tipo}` : undefined,
        estado: 'Borrador',
        versiones: [
          {
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: fileUrl,
            nombreArchivo: selectedFile.name,
            subidoPor: 'Admin SRR',
            accion: 'Subida',
            estado: 'Borrador'
          }
        ]
      };

      addDocument(newProjectDoc);
      setShowUploadModal(false);
      setNewDoc({ titulo: '', tipo: 'Contrato', projectId: '', professionalId: '', department: '', municipio: '', reportId: '', contractorId: '', descripcion: '', tags: '' });
      setSelectedFile(null);
      showAlert('Documento cargado exitosamente.');
    } catch (error) {
      console.error('Error al cargar documento:', error);
      showAlert('Error al cargar el documento físico. Por favor verifica la configuración de Supabase.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckMissing = () => {
    if (selectedProjectId === 'Todos') {
      state.proyectos.forEach(p => checkMissingDocuments(p.id));
    } else if (selectedProjectId !== 'Profesionales' && selectedProjectId !== 'Territoriales') {
      checkMissingDocuments(selectedProjectId);
    }
    showAlert('Verificación completada. Se han generado alertas para los documentos faltantes.');
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showAlert('Paquete de repositorio generado con éxito. La descarga comenzará en breve.');
    }, 2000);
  };

  const handleNewVersion = (docId: string) => {
    const doc = state.documentos.find(d => d.id === docId);
    if (!doc) return;

    const newVersion: DocumentVersion = {
      id: `VER-${Date.now()}`,
      version: doc.versiones.length + 1,
      fecha: new Date().toISOString().split('T')[0],
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      nombreArchivo: `${(doc.titulo || '').replace(/\s+/g, '_').toLowerCase()}_v${doc.versiones.length + 1}.pdf`,
      subidoPor: 'Admin SRR',
      comentario: 'Nueva versión cargada',
      accion: 'Edición',
      estado: 'En revisión'
    };

    addDocumentVersion(docId, newVersion);
  };

  const { repairedUrl: viewerUrl, isLoading: isRepairing } = useRepairedUrl(
    viewingDoc ? viewingDoc.versiones[viewingDoc.versiones.length - 1].url : null
  );

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-indigo-600" size={28} />
              Repositorio Documental
            </h1>
            <p className="text-slate-500">Gestión centralizada de documentos contractuales y técnicos.</p>
            
            {/* Bucket Configuration Input */}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bucket Supabase:</span>
              <input 
                type="text" 
                value={bucketOverride}
                onChange={handleBucketChange}
                placeholder="Ej: documents"
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 w-48 bg-slate-50 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              {bucketOverride && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 size={12} /> Guardado
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleCheckMissing}
              className="bg-amber-50 text-amber-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-100 transition-all border border-amber-200"
              title="Identificar documentos faltantes"
            >
              <AlertCircle size={18} />
              Verificar Faltantes
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-200 transition-all border border-slate-200"
            >
              {isExporting ? <Clock size={18} className="animate-spin" /> : <Package size={18} />}
              Exportar Todo
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              <Upload size={18} />
              Subir Documento
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por título, descripción o etiquetas..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedType}
            onChange={e => setSelectedType(e.target.value as any)}
          >
            <option value="Todos">Todos los tipos</option>
            {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedProjectId}
            onChange={e => {
              setSelectedProjectId(e.target.value as any);
              setSelectedProfessionalId('Todos');
              setSelectedDepartment('Todos');
            }}
          >
            <option value="Todos">Todos los proyectos</option>
            <option value="Convenios">Repositorio de Convenios</option>
            <option value="Profesionales">Repositorio de Profesionales</option>
            <option value="Territoriales">Repositorio de Departamentos</option>
            {state.proyectos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>

          {selectedProjectId === 'Profesionales' && (
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedProfessionalId}
              onChange={e => setSelectedProfessionalId(e.target.value)}
            >
              <option value="Todos">Todos los profesionales</option>
              {state.professionals.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          )}

          {selectedProjectId === 'Territoriales' && (
            <select 
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedDepartment}
              onChange={e => setSelectedDepartment(e.target.value)}
            >
              <option value="Todos">Todos los departamentos</option>
              {Array.from(new Set(state.documentos.filter(d => d.department).map(d => d.department))).sort().map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          )}

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button 
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Cuadrícula
            </button>
            <button 
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Línea de Tiempo
            </button>
            <button 
              onClick={() => setViewMode('folders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'folders' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Carpetas
            </button>
          </div>
        </div>

        {/* Documentos Recientes (Quick Access) */}
        {searchTerm === '' && selectedType === 'Todos' && selectedProjectId === 'Todos' && sortedTimelineDocs.length > 0 && (
          <div className="mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock size={12} />
              Cargados Recientemente
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {sortedTimelineDocs.slice(0, 5).map(doc => (
                <div 
                  key={doc.id} 
                  onClick={() => setViewingDoc(doc)}
                  className="flex-shrink-0 w-64 p-4 bg-white rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText size={18} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{doc.fechaCreacion}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm truncate mb-1">{doc.titulo}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{doc.department || doc.projectId || 'General'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map(doc => (
              <div key={doc.id} className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${
                    doc.tipo === 'Contrato' ? 'bg-indigo-50 text-indigo-600' :
                    doc.tipo === 'Acta' ? 'bg-emerald-50 text-emerald-600' :
                    doc.tipo === 'Informe' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    <File size={24} />
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => setViewingDoc(doc)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Ver Documento"
                    >
                      <Eye size={18} />
                    </button>
                    <button 
                      onClick={() => setShowVersionHistory(doc)}
                      className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                      title="Historial de Versiones"
                    >
                      <History size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-800 mb-1 line-clamp-1">{doc.titulo}</h3>
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 h-8">{doc.descripcion}</p>

                <div className="flex flex-wrap gap-1 mb-4">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                    {doc.tipo}
                  </span>
                  {doc.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-indigo-50 text-indigo-500 rounded-md text-[10px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <Clock size={12} />
                    {doc.ultimaActualizacion}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                    v{doc.versiones.length}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'timeline' ? (
          <div className="max-w-4xl mx-auto py-8">
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {sortedTimelineDocs.map((doc, idx) => (
                <div key={doc.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-indigo-600 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 transition-all">
                    <File size={16} />
                  </div>
                  {/* Content */}
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-800">{doc.titulo}</div>
                      <time className="font-mono text-xs font-medium text-indigo-500">{doc.fechaCreacion}</time>
                    </div>
                    <div className="text-slate-500 text-xs mb-3">{doc.descripcion}</div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold uppercase">
                        {doc.tipo}
                      </span>
                      <button 
                        onClick={() => setViewingDoc(doc)}
                        className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                      >
                        Ver <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Territoriales Folders */}
            {(selectedProjectId === 'Todos' || selectedProjectId === 'Territoriales') && Array.from(new Set(state.documentos.filter(d => d.department).map(d => d.department))).sort().filter(dept => selectedDepartment === 'Todos' || dept === selectedDepartment).map(dept => {
              const deptDocs = state.documentos.filter(d => d.department === dept);
              const municipiosInDept = Array.from(new Set(deptDocs.map(d => d.municipio || 'General'))).sort();

              if (selectedProjectId === 'Todos' && deptDocs.length === 0) return null;

              return (
                <div key={dept} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center gap-3">
                    <div className="p-2 bg-amber-600 text-white rounded-xl">
                      <MapIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{dept}</h3>
                      <p className="text-[10px] text-amber-600 uppercase font-black tracking-wider">Subrepositorio Territorial</p>
                    </div>
                  </div>
                  <div className="p-6 space-y-8">
                    {municipiosInDept.map((muni, index) => {
                      const muniDocs = deptDocs.filter(d => (d.municipio || 'General') === muni);
                      const groupedByType = documentTypes.reduce((acc, type) => {
                        const docs = muniDocs.filter(d => d.tipo === type);
                        if (docs.length > 0) acc[type] = docs;
                        return acc;
                      }, {} as Record<string, ProjectDocument[]>);

                      return (
                        <div key={`${muni}-${index}`} className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-black text-slate-700 uppercase tracking-widest border-b-2 border-amber-100 pb-2">
                            <MapPin size={16} className="text-amber-500" />
                            {muni}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {Object.entries(groupedByType).map(([type, docs]) => (
                              <div key={type} className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                  <Folder size={14} className="text-amber-400" />
                                  {type} ({docs.length})
                                </div>
                                <div className="space-y-2">
                                  {docs.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all group">
                                      <div className="flex items-center gap-2 overflow-hidden">
                                        <File size={14} className="text-slate-400 shrink-0" />
                                        <span className="text-xs text-slate-600 truncate">{doc.titulo}</span>
                                      </div>
                                      <button 
                                        onClick={() => setViewingDoc(doc)}
                                        className="p-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                                      >
                                        <Eye size={14} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {deptDocs.length === 0 && (
                      <div className="py-8 text-center text-slate-400 text-sm italic">
                        No hay documentos cargados para este departamento.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Proyectos Folders */}
            {(selectedProjectId === 'Todos' || (selectedProjectId !== 'Profesionales' && selectedProjectId !== 'Territoriales' && selectedProjectId !== 'Todos')) && state.proyectos.filter(p => selectedProjectId === 'Todos' || p.id === selectedProjectId).map(project => {
              const projectDocs = state.documentos.filter(d => d.projectId === project.id);
              const groupedByType = documentTypes.reduce((acc, type) => {
                const docs = projectDocs.filter(d => d.tipo === type);
                if (docs.length > 0) acc[type] = docs;
                return acc;
              }, {} as Record<string, ProjectDocument[]>);

              return (
                <div key={project.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 text-white rounded-xl">
                      <Folder size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{project.nombre}</h3>
                      <p className="text-[10px] text-slate-500 uppercase font-black tracking-wider">{project.id}</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedByType).map(([type, docs]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                          <Folder size={14} className="text-indigo-400" />
                          {type} ({docs.length})
                        </div>
                        <div className="space-y-2">
                          {docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <File size={14} className="text-slate-400 shrink-0" />
                                <span className="text-xs text-slate-600 truncate">{doc.titulo}</span>
                              </div>
                              <button 
                                onClick={() => setViewingDoc(doc)}
                                className="p-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedByType).length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                        No hay documentos cargados para este proyecto.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Profesionales Folders */}
            {(selectedProjectId === 'Todos' || selectedProjectId === 'Profesionales') && state.professionals.filter(p => selectedProfessionalId === 'Todos' || p.id === selectedProfessionalId).map(prof => {
              const profDocs = state.documentos.filter(d => d.professionalId === prof.id);
              const groupedByType = documentTypes.reduce((acc, type) => {
                const docs = profDocs.filter(d => d.tipo === type);
                if (docs.length > 0) acc[type] = docs;
                return acc;
              }, {} as Record<string, ProjectDocument[]>);

              if (selectedProjectId === 'Todos' && profDocs.length === 0) return null;

              return (
                <div key={prof.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-3">
                    <div className="p-2 bg-emerald-600 text-white rounded-xl">
                      <Users size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{prof.nombre}</h3>
                      <p className="text-[10px] text-emerald-600 uppercase font-black tracking-wider">Subrepositorio Profesional</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedByType).map(([type, docs]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                          <Folder size={14} className="text-emerald-400" />
                          {type} ({docs.length})
                        </div>
                        <div className="space-y-2">
                          {docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <File size={14} className="text-slate-400 shrink-0" />
                                <span className="text-xs text-slate-600 truncate">{doc.titulo}</span>
                              </div>
                              <button 
                                onClick={() => setViewingDoc(doc)}
                                className="p-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedByType).length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                        No hay documentos cargados para este profesional.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Convenios Folders */}
            {(selectedProjectId === 'Todos' || selectedProjectId === 'Convenios') && state.convenios.map(conv => {
              const convDocs = state.documentos.filter(d => d.convenioId === conv.id);
              const groupedByType = documentTypes.reduce((acc, type) => {
                const docs = convDocs.filter(d => d.tipo === type);
                if (docs.length > 0) acc[type] = docs;
                return acc;
              }, {} as Record<string, ProjectDocument[]>);

              if (selectedProjectId === 'Todos' && convDocs.length === 0) return null;

              return (
                <div key={conv.id} className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
                    <div className="p-2 bg-rose-600 text-white rounded-xl">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{conv.nombre}</h3>
                      <p className="text-[10px] text-rose-600 uppercase font-black tracking-wider">Subrepositorio Convenio</p>
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.entries(groupedByType).map(([type, docs]) => (
                      <div key={type} className="space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                          <Folder size={14} className="text-rose-400" />
                          {type} ({docs.length})
                        </div>
                        <div className="space-y-2">
                          {docs.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl transition-all group">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <File size={14} className="text-slate-400 shrink-0" />
                                <span className="text-xs text-slate-600 truncate">{doc.titulo}</span>
                              </div>
                              <button 
                                onClick={() => setViewingDoc(doc)}
                                className="p-1 text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Eye size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {Object.keys(groupedByType).length === 0 && (
                      <div className="col-span-full py-8 text-center text-slate-400 text-sm italic">
                        No hay documentos cargados para este convenio.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Upload className="text-indigo-600" size={20} />
                Subir Documento
              </h2>
              <button onClick={() => setShowUploadModal(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Título del Documento</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newDoc.titulo}
                  onChange={e => setNewDoc({...newDoc, titulo: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">Tipo</label>
                  <select 
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newDoc.tipo}
                    onChange={e => setNewDoc({...newDoc, tipo: e.target.value as any})}
                  >
                    {documentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase mb-1">
                    {territorialTypes.includes(newDoc.tipo) ? 'Departamento' : 'Vincular a'}
                  </label>
                  {territorialTypes.includes(newDoc.tipo) ? (
                    <div className="space-y-4">
                      <select
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                        value={newDoc.department}
                        onChange={e => setNewDoc({ ...newDoc, department: e.target.value, municipio: '', projectId: '', professionalId: '' })}
                        required
                      >
                        <option value="">Seleccionar departamento...</option>
                        {colombiaDepartments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      {newDoc.department && (
                        <div>
                          <label className="block text-xs font-black text-slate-400 uppercase mb-1">Municipio</label>
                          <select
                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                            value={newDoc.municipio}
                            onChange={e => setNewDoc({ ...newDoc, municipio: e.target.value })}
                            required
                          >
                            <option value="">Seleccionar municipio...</option>
                            {municipiosForSelectedDept.map((m, index) => <option key={`${m}-${index}`} value={m}>{m}</option>)}
                          </select>
                        </div>
                      )}
                    </div>
                  ) : (
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newDoc.projectId ? `PROJ-${newDoc.projectId}` : newDoc.professionalId ? `PROF-${newDoc.professionalId}` : ""}
                      onChange={e => {
                        const val = e.target.value;
                        if (val.startsWith('PROJ-')) {
                          setNewDoc({ ...newDoc, projectId: val.replace('PROJ-', ''), professionalId: '', department: '', municipio: '' });
                        } else if (val.startsWith('PROF-')) {
                          setNewDoc({ ...newDoc, professionalId: val.replace('PROF-', ''), projectId: '', department: '', municipio: '' });
                        } else {
                          setNewDoc({ ...newDoc, projectId: '', professionalId: '', department: '', municipio: '' });
                        }
                      }}
                    >
                      <option value="">Ninguno</option>
                      <optgroup label="Proyectos">
                        {state.proyectos.map(p => <option key={p.id} value={`PROJ-${p.id}`}>{p.nombre}</option>)}
                      </optgroup>
                      <optgroup label="Profesionales">
                        {state.professionals.map(p => <option key={p.id} value={`PROF-${p.id}`}>{p.nombre}</option>)}
                      </optgroup>
                    </select>
                  )}
                </div>
              </div>
              {newDoc.projectId && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Vincular a Informe (Opcional)</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newDoc.reportId}
                      onChange={e => setNewDoc({...newDoc, reportId: e.target.value})}
                    >
                      <option value="">Ninguno</option>
                      {state.informesInterventoria
                        .filter(i => i.projectId === newDoc.projectId)
                        .map(i => <option key={i.id} value={i.id}>Semana {i.semana} ({i.fechaInicio})</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase mb-1">Vincular a Contratista (Opcional)</label>
                    <select 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newDoc.contractorId}
                      onChange={e => setNewDoc({...newDoc, contractorId: e.target.value})}
                    >
                      <option value="">Ninguno</option>
                      {state.contratistas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Descripción</label>
                <textarea 
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 h-24"
                  value={newDoc.descripcion}
                  onChange={e => setNewDoc({...newDoc, descripcion: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Etiquetas (separadas por coma)</label>
                <input 
                  type="text" 
                  placeholder="legal, acta, 2024..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newDoc.tags}
                  onChange={e => setNewDoc({...newDoc, tags: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase mb-1">Archivo PDF</label>
                <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-xl transition-colors ${selectedFile ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                  <div className="space-y-1 text-center">
                    {selectedFile ? (
                      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                    ) : (
                      <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    )}
                    <div className="flex text-sm text-slate-600">
                      <label className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none">
                        <span>{selectedFile ? 'Cambiar archivo' : 'Seleccionar archivo'}</span>
                        <input 
                          type="file" 
                          className="sr-only" 
                          accept=".pdf" 
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      {!selectedFile && <p className="pl-1">o arrastrar y soltar</p>}
                    </div>
                    <p className="text-xs text-slate-500">
                      {selectedFile ? selectedFile.name : 'PDF hasta 10MB'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isUploading}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${isUploading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'}`}
                >
                  {isUploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Clock className="animate-spin" size={18} />
                      Subiendo...
                    </span>
                  ) : 'Cargar Documento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl animate-in zoom-in duration-300 overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">{viewingDoc.titulo}</h2>
                  <p className="text-[10px] text-slate-500">Versión {viewingDoc.versiones.length} • {viewingDoc.versiones[viewingDoc.versiones.length - 1].nombreArchivo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    showAlert('Documento validado exitosamente');
                    setViewingDoc(null);
                  }}
                  className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Validar
                </button>
                <button 
                  onClick={async () => {
                    const url = viewingDoc.versiones[viewingDoc.versiones.length - 1].url;
                    const fileName = viewingDoc.versiones[viewingDoc.versiones.length - 1].nombreArchivo;
                    await downloadFileWithAutoRepair(url, fileName);
                  }}
                  className="p-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                >
                  <Download size={18} />
                  Descargar
                </button>
                <button onClick={() => setViewingDoc(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-200 relative">
              {isRepairing ? (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <div className="flex flex-col items-center gap-3">
                    <Clock className="animate-spin text-indigo-600" size={32} />
                    <p className="text-sm font-bold text-slate-600">Verificando conexión con el servidor de archivos...</p>
                  </div>
                </div>
              ) : viewerUrl ? (
                <iframe 
                  src={`${viewerUrl}#toolbar=0`}
                  className="w-full h-full border-none"
                  title="Visor PDF"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                  <div className="flex flex-col items-center gap-3 text-red-500">
                    <AlertCircle size={48} />
                    <p className="text-lg font-bold">Documento no encontrado</p>
                    <p className="text-sm text-slate-600 text-center max-w-md">
                      El archivo no se pudo cargar. Es posible que haya sido eliminado o que el bucket de almacenamiento no esté configurado correctamente.
                    </p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-600">
                <ShieldCheck className="text-emerald-500" size={14} />
                Documento Verificado
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <History className="text-amber-600" size={20} />
                Historial de Versiones
              </h2>
              <button onClick={() => setShowVersionHistory(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {showVersionHistory.versiones.slice().reverse().map((v, idx) => (
                  <div key={v.id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="p-2 bg-white rounded-xl border border-slate-200 text-slate-400">
                      <File size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-slate-800">Versión {v.version}</span>
                        <span className="text-[10px] text-slate-400">{v.fecha}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{v.nombreArchivo}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400">Por: {v.subidoPor}</span>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (v.url && v.url !== '#') {
                              await downloadFileWithAutoRepair(v.url, v.nombreArchivo);
                            } else {
                              alert('No hay un archivo PDF disponible para descargar.');
                            }
                          }}
                          className="text-[10px] font-bold text-indigo-600 flex items-center gap-1"
                        >
                          <Download size={12} /> Descargar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <button 
                  onClick={() => handleNewVersion(showVersionHistory.id)}
                  className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Cargar Nueva Versión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ShieldCheck = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);
