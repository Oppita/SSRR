import React, { useState, useEffect } from 'react';
import { PODDocument, Project, ProjectPODConflict, Threat, ConocimientoTerritorial } from '../types';
import { parsePODDocument, detectPODConflicts } from '../services/podService';
import { uploadDocumentToStorage } from '../lib/storage';
import { FileText, AlertTriangle, Upload, Map, CheckCircle2, Loader2, BrainCircuit, Users, ShieldAlert, FileWarning, Newspaper, Plus, Trash2, Save, Activity, Zap } from 'lucide-react';
import { useProject } from '../store/ProjectContext';
import { colombiaData } from '../data/colombiaData';

interface Props {
  projects: Project[];
  threats: Threat[];
  defaultDepartamento: string;
}

export const IntegracionPOD: React.FC<Props> = ({ projects, threats, defaultDepartamento }) => {
  const { addDocument, state, updateConocimientoTerritorial, addExternalDataset } = useProject();
  const { conocimientoTerritorial, contratistas, professionals } = state;
  const [podDocuments, setPodDocuments] = useState<PODDocument[]>([]);
  const [conflicts, setConflicts] = useState<ProjectPODConflict[]>([]);
  
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  
  const [selectedDepartamento, setSelectedDepartamento] = useState(defaultDepartamento || '');
  const [selectedMunicipio, setSelectedMunicipio] = useState('');
  const [documentType, setDocumentType] = useState<'POD' | 'POT' | 'Noticia' | 'Evento' | 'Directriz' | 'Otro'>('POD');
  const [poblacion, setPoblacion] = useState<number>(1000000);
  const [extension, setExtension] = useState<number>(0);

  // Load from context when department changes
  useEffect(() => {
    const existing = conocimientoTerritorial.find(c => c.departamento === selectedDepartamento);
    if (existing) {
      setPoblacion(existing.poblacionEstimada);
      setExtension(existing.extension || 0);
    }
  }, [selectedDepartamento, conocimientoTerritorial]);

  // Get departments and municipalities from colombiaData
  const departamentos = colombiaData.map(d => d.name);
  const municipios = colombiaData.find(d => d.name === selectedDepartamento)?.municipalities || [];

  useEffect(() => {
    const allConflicts = projects.flatMap(p => detectPODConflicts(p, podDocuments));
    setConflicts(allConflicts);
  }, [podDocuments, projects]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedDepartamento) {
      alert("Por favor seleccione un departamento antes de subir el documento.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(`Aplicando Deep Learning al documento de tipo ${documentType}. Cruzando con ${projects.length} proyectos, ${contratistas.length} contratistas y ${professionals.length} profesionales...`);

    try {
      let fileUrl = '';
      try {
        const folderPath = `territorial/${selectedDepartamento}`;
        fileUrl = await uploadDocumentToStorage(file, folderPath);
      } catch (error) {
        console.error("Error uploading to Supabase:", error);
        throw new Error("No se pudo subir el documento a Supabase. Verifique su conexión o configuración.");
      }

      const existingKnowledge = conocimientoTerritorial.find(c => c.departamento === selectedDepartamento);
      const result = await parsePODDocument(
        file, 
        selectedDepartamento, 
        poblacion, 
        projects, 
        contratistas, 
        professionals, 
        existingKnowledge,
        documentType,
        selectedMunicipio,
        (msg) => setUploadProgress(msg)
      );
      
      // Override the local URL with the Supabase URL
      result.documentUrl = fileUrl;

      setPodDocuments(prev => [...prev.filter(p => p.departamento !== selectedDepartamento), result]);
      
      // Update persistent knowledge with Deep Learning results
      const updatedKnowledge: ConocimientoTerritorial = {
        id: existingKnowledge?.id || `CT-${Date.now()}`,
        departamento: selectedDepartamento,
        poblacionEstimada: poblacion,
        extension: extension,
        documentosAnalizados: [
          ...(existingKnowledge?.documentosAnalizados || []),
          {
            id: `DOC-${documentType}-${Date.now()}`,
            titulo: `${documentType} - ${selectedMunicipio || selectedDepartamento}`,
            tipo: documentType,
            municipio: selectedMunicipio,
            fechaAnalisis: new Date().toISOString(),
            resumen: result.caracterizacionRiesgo.substring(0, 200) + '...',
            url: fileUrl
          }
        ],
        caracterizacionRiesgo: result.caracterizacionRiesgo,
        zonasRiesgo: result.zonasRiesgo.map(z => ({ 
          nivel: z.level, 
          descripcion: z.description,
          municipio: z.municipio || selectedMunicipio
        })),
        analisisEstrategico: result.analisisIA,
        analisisContratistas: result.analisisContratistas || existingKnowledge?.analisisContratistas || 'No disponible',
        analisisProfesionales: result.analisisProfesionales || existingKnowledge?.analisisProfesionales || 'No disponible',
        directricesEntidades: result.directriz ? [
          ...(existingKnowledge?.directricesEntidades || []),
          { ...result.directriz, fecha: new Date().toISOString() }
        ] : (existingKnowledge?.directricesEntidades || []),
        noticiasEventos: result.noticiaEvento ? [
          ...(existingKnowledge?.noticiasEventos || []),
          { ...result.noticiaEvento, fecha: new Date().toISOString() }
        ] : (existingKnowledge?.noticiasEventos || []),
        ultimaActualizacion: new Date().toISOString()
      };

      updateConocimientoTerritorial(updatedKnowledge);

      // Add the document to the central repository
      addDocument({
        id: `DOC-INT-${Date.now()}`,
        projectId: '', 
        contractId: '',
        department: selectedDepartamento,
        municipio: selectedMunicipio,
        titulo: `${documentType} - ${selectedMunicipio || selectedDepartamento}`,
        tipo: documentType as any,
        descripcion: `Documento de inteligencia territorial procesado con Deep Learning.`,
        fechaCreacion: new Date().toISOString(),
        ultimaActualizacion: new Date().toISOString(),
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          url: result.documentUrl,
          fecha: new Date().toISOString(),
          nombreArchivo: file.name,
          subidoPor: 'Sistema (Deep Learning Territorial)',
          comentario: 'Análisis sistémico completado.',
          accion: 'Subida',
          estado: 'Aprobado'
        }],
        tags: [documentType, selectedDepartamento, selectedMunicipio, 'Deep Learning'].filter(Boolean) as string[],
        estado: 'Aprobado'
      });

      // Add as external dataset for risk map integration
      addExternalDataset({
        id: `DS-INT-${Date.now()}`,
        fuente: documentType as any,
        titulo: `${documentType} - ${selectedMunicipio || selectedDepartamento}`,
        fechaPublicacion: new Date().toISOString().split('T')[0],
        departamento: selectedDepartamento,
        municipio: selectedMunicipio,
        hallazgosClave: [result.caracterizacionRiesgo.substring(0, 100) + '...'],
        url: result.documentUrl
      });

      setUploadProgress('');
    } catch (error: any) {
      console.error("Error parsing document:", error);
      alert(error.message || "Error al procesar el documento con Deep Learning.");
      setUploadProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  const activeKnowledge = conocimientoTerritorial.find(c => c.departamento === selectedDepartamento);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <BrainCircuit size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Cerebro Territorial (Deep Learning)</h2>
              <p className="text-slate-500 text-sm">Sistema de aprendizaje continuo que integra POD, POT, noticias y directrices institucionales.</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuración y Carga */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Users size={18} className="text-indigo-600" />
                Configuración de Inteligencia
              </h3>
              
              <div className="space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Departamento</span>
                  <select 
                    value={selectedDepartamento}
                    onChange={(e) => setSelectedDepartamento(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">Seleccione un departamento...</option>
                    {departamentos.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Tipo de Información</span>
                  <select 
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="POD">POD (Departamento)</option>
                    <option value="POT">POT (Municipio)</option>
                    <option value="Noticia">Noticia / Evento</option>
                    <option value="Directriz">Directriz Institucional (IDEAM, etc.)</option>
                    <option value="Otro">Otro Documento</option>
                  </select>
                </label>

                {documentType === 'POT' && (
                  <label className="block">
                    <span className="text-sm font-medium text-slate-700">Municipio</span>
                    <select 
                      value={selectedMunicipio}
                      onChange={(e) => setSelectedMunicipio(e.target.value)}
                      className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="">Seleccione un municipio...</option>
                      {municipios.map((muni, index) => (
                        <option key={`${muni}-${index}`} value={muni}>{muni}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Población Impactada</span>
                  <input 
                    type="number" 
                    value={poblacion}
                    onChange={(e) => setPoblacion(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Extensión (km²)</span>
                  <input 
                    type="number" 
                    value={extension}
                    onChange={(e) => setExtension(Number(e.target.value))}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  />
                </label>

                <div className="pt-4 border-t border-slate-200">
                  <label className="block cursor-pointer">
                    <span className="text-sm font-medium text-slate-700 mb-2 block">Alimentar Cerebro (PDF)</span>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileUpload} 
                      disabled={isUploading || !selectedDepartamento}
                      className="hidden" 
                    />
                    <div className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl transition-colors ${
                      isUploading || !selectedDepartamento 
                        ? 'bg-slate-100 border-slate-300 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-50 border-indigo-300 text-indigo-600 hover:bg-indigo-100 cursor-pointer'
                    }`}>
                      {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                      <span className="font-medium">{isUploading ? 'Analizando...' : 'Sumar Conocimiento'}</span>
                    </div>
                  </label>
                  {isUploading && (
                    <p className="mt-3 text-xs text-indigo-600 font-medium text-center animate-pulse">
                      {uploadProgress}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estadísticas de Deep Learning */}
            <div className="bg-indigo-900 text-white p-6 rounded-xl shadow-lg overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <BrainCircuit size={80} />
              </div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity size={18} />
                Estado del Aprendizaje
              </h3>
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <span className="text-xs opacity-70 uppercase tracking-wider">Documentos Procesados</span>
                  <span className="text-2xl font-black">{activeKnowledge?.documentosAnalizados?.length || 0}</span>
                </div>
                {activeKnowledge?.documentosAnalizados && activeKnowledge.documentosAnalizados.length > 0 && (
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                    {activeKnowledge.documentosAnalizados.map((doc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-white/10 p-2 rounded-lg">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold truncate max-w-[150px]">{doc.titulo}</span>
                          <span className="text-[10px] opacity-70">{new Date(doc.fechaAnalisis).toLocaleDateString()}</span>
                        </div>
                        {doc.url && (
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1.5 bg-white/20 hover:bg-white/30 rounded-md transition-colors"
                            title="Ver documento en Supabase"
                          >
                            <FileText size={14} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-end mt-4">
                  <span className="text-xs opacity-70 uppercase tracking-wider">Zonas de Riesgo</span>
                  <span className="text-2xl font-black">{activeKnowledge?.zonasRiesgo.length || 0}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs opacity-70 uppercase tracking-wider">Directrices Activas</span>
                  <span className="text-2xl font-black">{activeKnowledge?.directricesEntidades.length || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados del Análisis Profundo */}
          <div className="lg:col-span-2 space-y-6">
            {activeKnowledge ? (
              <div className="space-y-6">
                {/* Análisis Estratégico */}
                <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                      <BrainCircuit className="text-indigo-600" />
                      Súper Conocimiento Estratégico
                    </h3>
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold uppercase tracking-widest">
                      Deep Learning v2.5
                    </span>
                  </div>
                  <div className="prose prose-slate max-w-none">
                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap italic">
                      "{activeKnowledge.analisisEstrategico}"
                    </p>
                  </div>
                </div>

                {/* Cruce Sistémico (Contratistas y Profesionales) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 mb-4 flex items-center gap-2">
                      <Users size={18} />
                      Análisis de Capacidad (Contratistas)
                    </h4>
                    <p className="text-sm text-emerald-800 leading-relaxed">{activeKnowledge.analisisContratistas}</p>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <Users size={18} />
                      Análisis de Idoneidad (Profesionales)
                    </h4>
                    <p className="text-sm text-blue-800 leading-relaxed">{activeKnowledge.analisisProfesionales}</p>
                  </div>
                </div>

                {/* Riesgos y Zonas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <ShieldAlert size={18} className="text-rose-500" />
                      Caracterización del Riesgo Acumulada
                    </h4>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{activeKnowledge.caracterizacionRiesgo}</p>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <FileWarning size={18} className="text-amber-500" />
                      Zonas de Riesgo Identificadas
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                      {activeKnowledge.zonasRiesgo.map((zone, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-slate-800 text-sm">
                              {zone.municipio ? `${zone.municipio}: ` : ''} {zone.nombre || `Zona ${idx + 1}`}
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                              zone.nivel === 'Alto' ? 'bg-rose-100 text-rose-700' :
                              zone.nivel === 'Medio' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {zone.nivel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 leading-tight">{zone.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Noticias y Directrices */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Newspaper size={18} className="text-indigo-500" />
                      Noticias y Eventos Recientes
                    </h4>
                    <div className="space-y-4">
                      {activeKnowledge.noticiasEventos.length > 0 ? activeKnowledge.noticiasEventos.map((n, idx) => (
                        <div key={idx} className="border-l-2 border-indigo-200 pl-4 py-1">
                          <div className="flex justify-between items-start">
                            <h5 className="text-sm font-bold text-slate-800">{n.titulo}</h5>
                            <span className="text-[10px] text-slate-400">{new Date(n.fecha).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">{n.descripcion}</p>
                          <p className="text-[10px] font-bold text-indigo-600 mt-1 uppercase tracking-tighter">Impacto: {n.impacto}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400 italic">No hay eventos registrados.</p>}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Zap size={18} className="text-amber-500" />
                      Directrices Institucionales
                    </h4>
                    <div className="space-y-4">
                      {activeKnowledge.directricesEntidades.length > 0 ? activeKnowledge.directricesEntidades.map((d, idx) => (
                        <div key={idx} className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-black text-amber-800 uppercase">{d.entidad}</span>
                            <span className="text-[10px] text-amber-600">{new Date(d.fecha).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-amber-900 leading-relaxed">{d.contenido}</p>
                        </div>
                      )) : <p className="text-xs text-slate-400 italic">No hay directrices registradas.</p>}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center">
                <BrainCircuit size={48} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 mb-2">Sin Contexto de Aprendizaje</h3>
                <p className="text-slate-500 max-w-md">
                  Alimente el sistema con PODs, POTs, noticias o directrices para iniciar el proceso de Deep Learning Territorial.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
