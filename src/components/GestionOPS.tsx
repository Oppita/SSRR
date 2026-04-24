import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Users, Upload, FileText, BrainCircuit, DollarSign, Briefcase, Clock, CheckCircle2, AlertTriangle, X, ExternalLink, FolderOpen, Plus, Eye, Download, MapPin, Star, Edit, Trash2 } from 'lucide-react';
import { Professional, Project, ProjectDocument, Comision } from '../types';
import { ContratistasContratos } from './ContratistasContratos';
import { AddProfessionalForm } from './AddProfessionalForm';
import { ImportProfessionalsForm } from './ImportProfessionalsForm';
import { ActivitiesManager } from './ActivitiesManager';
import { ProfessionalReportsManager } from './ProfessionalReportsManager';
import * as pdfjsLib from 'pdfjs-dist';
import { AIProviderSelector } from './AIProviderSelector';
import { aiProviderService } from '../services/aiProviderService';
import { parseJSONResponse } from '../services/geminiService';
import { uploadDocumentToStorage } from '../lib/storage';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export const GestionOPS: React.FC<{ projectId: string }> = ({ projectId }) => {
  const { state, addProfessional, updateProfessional, deleteProfessional, addDocument } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [professionalToDelete, setProfessionalToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'projects' | 'documents' | 'commissions' | 'contractors' | 'reports'>('info');
  const [mainTab, setMainTab] = useState<'profesionales' | 'actividades'>('profesionales');

  const filteredProfessionals = state.professionals.filter(p => 
    (p.nombre || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (p.profesion || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const isProfessionalInProject = (profId: string) => {
    return state.proyectos.some(proj => proj.id === projectId && (
      proj.responsableOpsId === profId ||
      proj.apoyoTecnicoId === profId ||
      proj.apoyoFinancieroId === profId ||
      proj.apoyoJuridicoId === profId
    ));
  };

  const professionalProjects = selectedProfessional 
    ? state.proyectos.filter(p => 
        p.responsableOpsId === selectedProfessional.id ||
        p.apoyoTecnicoId === selectedProfessional.id ||
        p.apoyoFinancieroId === selectedProfessional.id ||
        p.apoyoJuridicoId === selectedProfessional.id
      )
    : [];

  const professionalDocuments = selectedProfessional
    ? state.documentos.filter(d => d.professionalId === selectedProfessional.id)
    : [];

  const professionalCommissions = selectedProfessional
    ? state.comisiones.filter(c => c.professionalIds.includes(selectedProfessional.id))
    : [];

  const handleProfessionalClick = (prof: Professional) => {
    setSelectedProfessional(prof);
    setShowDetailsModal(true);
    setActiveTab('info');
  };

  const handleUploadProfessionalDoc = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'RUT' | 'Hoja de Vida') => {
    const file = e.target.files?.[0];
    if (!file || !selectedProfessional) return;

    try {
      const folderPath = `Profesionales/${selectedProfessional.nombre}/${tipo}`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);
      
      const docId = `DOC-${tipo === 'RUT' ? 'RUT' : 'HV'}-${Date.now()}`;
      const newDoc: ProjectDocument = {
        id: docId,
        projectId: 'GLOBAL',
        professionalId: selectedProfessional.id,
        titulo: `${tipo} - ${selectedProfessional.nombre}`,
        tipo: (tipo === 'RUT' ? 'RUT' : 'Hoja de Vida') as any,
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: publicUrl,
          nombreArchivo: file.name,
          subidoPor: 'Administrador',
          comentario: `Carga manual de ${tipo}`,
          accion: 'Subida',
          estado: 'Aprobado'
        }],
        tags: [tipo, 'Profesional'],
        folderPath,
        estado: 'Aprobado'
      };

      addDocument(newDoc);
      
      const updatedProf = { ...selectedProfessional };
      if (tipo === 'RUT') updatedProf.rutUrl = publicUrl;
      else updatedProf.hojaDeVidaUrl = publicUrl;
      
      updateProfessional(updatedProf);
      setSelectedProfessional(updatedProf);
      alert(`${tipo} cargado exitosamente.`);
    } catch (error) {
      console.error(`Error uploading ${tipo}:`, error);
      alert(`Error al cargar el ${tipo}.`);
    }
  };

  const totalMonthlyCost = state.professionals.reduce((sum, p) => sum + p.salarioMensual, 0);
  console.log('Professionals data:', state.professionals);
  
  const totalContractValue = state.professionals.reduce((sum, p) => {
    let valor = p.valorTotalContrato || 0;
    if (valor === 0 && p.salarioMensual > 0 && p.fechaInicio && p.fechaFinalizacion) {
      const start = new Date(p.fechaInicio);
      const end = new Date(p.fechaFinalizacion);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        valor = p.salarioMensual * Math.max(1, diffMonths);
      }
    }
    return sum + valor;
  }, 0);

  const totalHours = state.professionals.reduce((sum, p) => {
    let horas = p.horasEstimadas || 0;
    if (horas === 0) {
      horas = (p.horasReuniones || 0) + (p.horasPMU || 0) + (p.horasSeguimiento || 0) + (p.horasCoordinacion || 0);
    }
    return sum + horas;
  }, 0);

  const totalValuePerHour = state.professionals.reduce((sum, p) => sum + (p.valorHora || 0), 0);
  const valuePerMinute = totalValuePerHour / 60;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAnalyzeCV = async () => {
    if (!selectedFile) return;
    
    setIsAnalyzing(true);
    
    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let text = '';
      const pagesToProcess = Math.min(pdf.numPages, 10); // CVs are usually short
      for (let i = 1; i <= pagesToProcess; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map((item: any) => item.str).join(' ');
      }

      const prompt = `Analiza esta hoja de vida y extrae la siguiente información en formato JSON.
      
      Debes devolver un objeto JSON con esta estructura exacta:
      {
        "nombre": "string",
        "profesion": "string",
        "experienciaAnios": number,
        "especialidades": ["string"],
        "sectoresTrabajados": ["string"],
        "proyectosRelevantes": ["string"],
        "departamentosExperiencia": ["string"],
        "formacionAcademica": ["string"],
        "certificaciones": ["string"],
        "idiomas": ["string"],
        "habilidadesTecnicas": ["string"],
        "linkedinUrl": "string",
        "fechaNacimiento": "string",
        "direccion": "string",
        "ciudad": "string"
      }
      
      Información a extraer:
      - nombre: Nombre completo del profesional
      - profesion: Profesión principal
      - experienciaAnios: Años totales de experiencia profesional (número)
      - especialidades: Lista de especialidades (array de strings)
      - sectoresTrabajados: Sectores en los que ha trabajado (array de strings)
      - proyectosRelevantes: Proyectos importantes (array de strings)
      - departamentosExperiencia: Departamentos de Colombia donde ha trabajado (array de strings)
      - formacionAcademica: Formación académica (array de strings)
      - certificaciones: Certificaciones (array de strings)
      - idiomas: Idiomas (array de strings)
      - habilidadesTecnicas: Habilidades técnicas (array de strings)
      - linkedinUrl: URL de LinkedIn
      - fechaNacimiento: Fecha de nacimiento
      - direccion: Dirección de residencia
      - ciudad: Ciudad de residencia
      
      Texto de la hoja de vida: ${text}`;

      const config = {
        responseMimeType: 'application/json'
      };

      const result = await aiProviderService.generateContent(prompt, aiProviderService.getAIModel(), config);
      const extractedData = parseJSONResponse(result);
      const salarioMensual = 7500000;

      const folderPath = `Profesionales/${extractedData.nombre || 'Sin Nombre'}/HojaDeVida`;
      const publicUrl = await uploadDocumentToStorage(selectedFile, folderPath);

      const newProf: Professional = {
        id: `PROF-${Date.now()}`,
        nombre: extractedData.nombre || selectedFile.name.replace('.pdf', '').replace(/_/g, ' '),
        profesion: extractedData.profesion || 'Profesional',
        experienciaAnios: extractedData.experienciaAnios || 0,
        especialidades: extractedData.especialidades || [],
        sectoresTrabajados: extractedData.sectoresTrabajados || [],
        proyectosRelevantes: extractedData.proyectosRelevantes || [],
        salarioMensual: salarioMensual,
        valorHora: salarioMensual / (22 * 8),
        proyectosActivos: 0,
        horasEstimadas: 0,
        carga: 'Disponible',
        departamentosExperiencia: extractedData.departamentosExperiencia || [],
        hojaDeVidaUrl: publicUrl,
        formacionAcademica: extractedData.formacionAcademica || [],
        certificaciones: extractedData.certificaciones || [],
        idiomas: extractedData.idiomas || [],
        habilidadesTecnicas: extractedData.habilidadesTecnicas || [],
        linkedinUrl: extractedData.linkedinUrl || '',
        fechaNacimiento: extractedData.fechaNacimiento || '',
        direccion: extractedData.direccion || '',
        ciudad: extractedData.ciudad || ''
      };
      
      addProfessional(newProf);

      // Store in professional repository
      addDocument({
        id: `DOC-HV-${newProf.id}`,
        professionalId: newProf.id,
        titulo: `Hoja de Vida - ${newProf.nombre}`,
        tipo: 'Hoja de Vida',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        estado: 'Aprobado',
        tags: ['Hoja de Vida', 'Profesional'],
        folderPath,
        versiones: [{
          id: `VER-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: publicUrl,
          nombreArchivo: selectedFile.name,
          subidoPor: 'Administrador',
          accion: 'Subida',
          estado: 'Aprobado'
        }]
      });

      // Store in common repository
      addDocument({
        id: `DOC-HV-COMMON-${newProf.id}`,
        projectId: 'GLOBAL',
        titulo: `Hoja de Vida - ${newProf.nombre}`,
        tipo: 'Hoja de Vida',
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        estado: 'Aprobado',
        tags: ['Hoja de Vida', 'Común'],
        folderPath,
        versiones: [{
          id: `VER-COMMON-${Date.now()}`,
          version: 1,
          fecha: new Date().toISOString().split('T')[0],
          url: publicUrl,
          nombreArchivo: selectedFile.name,
          subidoPor: 'Administrador',
          accion: 'Subida',
          estado: 'Aprobado'
        }]
      });
      setShowUploadModal(false);
      setSelectedFile(null);
      alert('Hoja de vida analizada y profesional registrado exitosamente.');
    } catch (error) {
      console.error('Error analyzing CV:', error);
      alert('Hubo un error al analizar la hoja de vida.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Users className="text-indigo-600" size={32} />
            Gestión de Equipo OPS
          </h1>
          <p className="text-slate-500 mt-2">Administración de profesionales, cargas operativas y costos.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => setShowImportModal(true)}
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <BrainCircuit size={20} />
            Importar con IA
          </button>
          <button 
            onClick={() => setShowManualModal(true)}
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
          >
            <Plus size={20} />
            Crear Manualmente
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Upload size={20} />
            Subir Hoja de Vida (PDF)
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 mb-8">
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            mainTab === 'profesionales'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setMainTab('profesionales')}
        >
          Profesionales
        </button>
        <button
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
            mainTab === 'actividades'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
          onClick={() => setMainTab('actividades')}
        >
          Actividades y PMU
        </button>
      </div>

      {mainTab === 'profesionales' ? (
        <>
          {/* Dashboard Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Users size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Profesionales</p>
                <p className="text-2xl font-black text-slate-800">{state.professionals.length}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Costo Mensual OPS</p>
                <p className="text-2xl font-black text-slate-800">
                  ${totalMonthlyCost.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
                <Briefcase size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Proyectos Atendidos</p>
                <p className="text-2xl font-black text-slate-800">
                  {state.professionals.reduce((sum, p) => sum + p.proyectosActivos, 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
                <DollarSign size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor Total Contratos</p>
                <p className="text-2xl font-black text-slate-800">${totalContractValue.toLocaleString('es-CO')}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center text-sky-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor por Hora</p>
                <p className="text-2xl font-black text-slate-800">${Math.round(totalValuePerHour).toLocaleString('es-CO')}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Valor por Minuto</p>
                <p className="text-2xl font-black text-slate-800">${valuePerMinute.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex gap-4">
            <input 
              type="text" 
              placeholder="Buscar por nombre o profesión..." 
              className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Professionals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProfessionals.map(prof => {
          let diasRestantes = null;
          let estadoContrato = 'normal'; // 'normal', 'warning', 'critical'
          
          if (prof.fechaFinalizacion) {
            const end = new Date(prof.fechaFinalizacion);
            const today = new Date();
            if (!isNaN(end.getTime())) {
              const diffTime = end.getTime() - today.getTime();
              diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diasRestantes <= 30) estadoContrato = 'critical';
              else if (diasRestantes <= 60) estadoContrato = 'warning';
            }
          }

          const cardBorderColor = 
            estadoContrato === 'critical' ? 'border-rose-400 ring-2 ring-rose-500/20' :
            estadoContrato === 'warning' ? 'border-amber-400 ring-2 ring-amber-500/20' :
            isProfessionalInProject(prof.id) ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200';

          return (
          <div 
            key={prof.id} 
            onClick={() => handleProfessionalClick(prof)}
            className={`bg-white rounded-2xl border shadow-sm overflow-hidden hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1 ${cardBorderColor}`}
          >
            <div className="p-6 border-b border-slate-100 relative">
              {isProfessionalInProject(prof.id) && estadoContrato === 'normal' && (
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                  En Proyecto
                </div>
              )}
              {estadoContrato === 'critical' && (
                <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                  <AlertTriangle size={10} /> Vence Pronto
                </div>
              )}
              {estadoContrato === 'warning' && (
                <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} /> Por Vencer
                </div>
              )}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{prof.nombre}</h3>
                  <p className="text-indigo-600 font-medium text-sm">{prof.profesion}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                  prof.carga === 'Disponible' ? 'bg-emerald-100 text-emerald-700' :
                  prof.carga === 'Media' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {prof.carga === 'Disponible' && <CheckCircle2 size={12} />}
                  {prof.carga === 'Media' && <Clock size={12} />}
                  {prof.carga === 'Sobrecargado' && <AlertTriangle size={12} />}
                  {prof.carga}
                </div>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Experiencia:</span>
                  <span className="font-medium text-slate-700">{prof.experienciaAnios} años</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Proyectos Activos:</span>
                  <span className="font-medium text-slate-700">{prof.proyectosActivos}</span>
                </div>
                {diasRestantes !== null && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Días Restantes:</span>
                    <span className={`font-bold ${
                      estadoContrato === 'critical' ? 'text-rose-600' :
                      estadoContrato === 'warning' ? 'text-amber-600' : 'text-slate-700'
                    }`}>
                      {diasRestantes < 0 ? 'Vencido' : `${diasRestantes} días`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 space-y-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-2">
                  {prof.especialidades.map((esp, i) => (
                    <span key={i} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-600">
                      {esp}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-500">Valor Hora</p>
                  <p className="font-bold text-slate-800">${Math.round(prof.valorHora).toLocaleString('es-CO')}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Salario Mensual</p>
                  <p className="font-bold text-slate-800">${prof.salarioMensual.toLocaleString('es-CO')}</p>
                </div>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    </>
  ) : (
    <ActivitiesManager />
  )}

      {/* Modal Eliminar Profesional */}
      {professionalToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="text-xl font-bold">Eliminar Profesional</h3>
              </div>
              <button onClick={() => setProfessionalToDelete(null)} className="text-rose-200 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                ¿Está seguro de eliminar este profesional? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setProfessionalToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteProfessional(professionalToDelete);
                    setProfessionalToDelete(null);
                    setShowDetailsModal(false);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Professional Details Modal */}
      {showDetailsModal && selectedProfessional && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="p-6 bg-indigo-600 text-white flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-2xl font-bold">{selectedProfessional.nombre}</h2>
                <p className="text-indigo-100">{selectedProfessional.profesion}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setProfessionalToDelete(selectedProfessional.id);
                  }}
                  className="p-2 hover:bg-red-600/20 rounded-xl transition-all flex items-center gap-2 text-red-200"
                  title="Eliminar Profesional"
                >
                  <Trash2 size={20} />
                  <span className="text-sm font-medium hidden sm:inline">Eliminar</span>
                </button>
                <button 
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all flex items-center gap-2"
                  title="Editar Profesional"
                >
                  <Edit size={20} />
                  <span className="text-sm font-medium hidden sm:inline">Editar</span>
                </button>
                <button 
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-white shrink-0">
              <button 
                onClick={() => setActiveTab('info')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'info' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Información General
              </button>
              <button 
                onClick={() => setActiveTab('projects')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'projects' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Proyectos ({professionalProjects.length})
              </button>
              <button 
                onClick={() => setActiveTab('commissions')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'commissions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Comisiones ({professionalCommissions.length})
              </button>
              <button 
                onClick={() => setActiveTab('documents')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'documents' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Subrepositorio Documental ({professionalDocuments.length})
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'reports' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Informes Mensuales
              </button>
              <button 
                onClick={() => setActiveTab('contractors')}
                className={`px-6 py-4 font-bold text-sm transition-all border-b-2 ${activeTab === 'contractors' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                Contratistas y Contratos
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50 custom-scrollbar">
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Perfil Profesional</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Experiencia Total:</span>
                          <span className="font-bold text-slate-800">{selectedProfessional.experienciaAnios} años</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Carga Actual:</span>
                          <span className={`font-bold ${
                            selectedProfessional.carga === 'Disponible' ? 'text-emerald-600' :
                            selectedProfessional.carga === 'Media' ? 'text-amber-600' : 'text-rose-600'
                          }`}>{selectedProfessional.carga}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Horas Estimadas:</span>
                          <span className="font-bold text-slate-800">{selectedProfessional.horasEstimadas}h / mes</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                          <span className="text-slate-500">Desempeño:</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  (selectedProfessional.desempeño || 0) >= 80 ? 'bg-emerald-500' :
                                  (selectedProfessional.desempeño || 0) >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                }`}
                                style={{ width: `${selectedProfessional.desempeño || 0}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-800">{selectedProfessional.desempeño || 0}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Datos Contractuales</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Número de Contrato (OPS):</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{selectedProfessional.numeroContrato || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Supervisor:</span>
                          <span className="font-bold text-slate-800">{selectedProfessional.supervisor || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fecha Inicio:</span>
                          <span className="font-bold text-slate-800">{selectedProfessional.fechaInicio || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Fecha Finalización:</span>
                          <span className="font-bold text-slate-800">{selectedProfessional.fechaFinalizacion || 'N/A'}</span>
                        </div>
                        {selectedProfessional.objetoContrato && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-slate-500 block mb-1">Objeto del Contrato:</span>
                            <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">{selectedProfessional.objetoContrato}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Documentos de Identidad y CV</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm">
                              <FileText size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">RUT</p>
                              <p className="text-[10px] text-slate-500">{selectedProfessional.rutUrl ? 'Cargado' : 'Pendiente'}</p>
                            </div>
                          </div>
                          {selectedProfessional.rutUrl ? (
                            <a href={selectedProfessional.rutUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <ExternalLink size={16} />
                            </a>
                          ) : (
                            <label className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer">
                              <Plus size={16} />
                              <input type="file" className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => handleUploadProfessionalDoc(e, 'RUT')} />
                            </label>
                          )}
                        </div>

                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                              <Briefcase size={18} />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-700">Hoja de Vida</p>
                              <p className="text-[10px] text-slate-500">{selectedProfessional.hojaDeVidaUrl ? 'Cargada' : 'Pendiente'}</p>
                            </div>
                          </div>
                          {selectedProfessional.hojaDeVidaUrl ? (
                            <a href={selectedProfessional.hojaDeVidaUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                              <ExternalLink size={16} />
                            </a>
                          ) : (
                            <label className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer">
                              <Plus size={16} />
                              <input type="file" className="hidden" accept=".pdf" onChange={(e) => handleUploadProfessionalDoc(e, 'Hoja de Vida')} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Especialidades</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfessional.especialidades.map((esp, i) => (
                          <span key={i} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">
                            {esp}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Departamentos de Experiencia</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfessional.departamentosExperiencia.map((dept, i) => (
                          <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold">
                            {dept}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Sectores</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProfessional.sectoresTrabajados.map((sec, i) => (
                          <span key={i} className="px-3 py-1.5 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold">
                            {sec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="space-y-4">
                  {professionalProjects.length > 0 ? (
                    professionalProjects.map(project => (
                      <div key={project.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-indigo-200 transition-all group">
                        <div>
                          <h4 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{project.nombre}</h4>
                          <div className="flex gap-4 mt-1">
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Briefcase size={12} /> {project.tipoObra}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock size={12} /> {project.estado}
                            </span>
                            {project.alertas && project.alertas.length > 0 && (
                              <span className="text-xs text-rose-500 font-bold flex items-center gap-1">
                                <AlertTriangle size={12} /> {project.alertas.length} Alertas
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            project.responsableOpsId === selectedProfessional.id ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {project.responsableOpsId === selectedProfessional.id ? 'Responsable' : 'Apoyo'}
                          </span>
                          <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                            <ExternalLink size={18} />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <Briefcase className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500 font-medium">No hay proyectos asignados actualmente.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'commissions' && (
                <div className="space-y-4">
                  {professionalCommissions.length > 0 ? (
                    professionalCommissions.map(comision => (
                      <div key={comision.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-bold text-slate-800">{comision.municipios || 'Sin destino'}</h4>
                            <p className="text-xs text-slate-500">{comision.objeto}</p>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                            comision.estado === 'Ejecutada' ? 'bg-emerald-100 text-emerald-700' :
                            comision.estado === 'En Curso' ? 'bg-blue-100 text-blue-700' : 
                            comision.estado === 'Cancelada' || comision.estado === 'Rechazada' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {comision.estado}
                          </span>
                        </div>
                        <div className="flex gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock size={12} /> {new Date(comision.fechaInicio).toLocaleDateString()} - {new Date(comision.fechaFin).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign size={12} /> ${comision.costoTotal.toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                      <MapPin className="mx-auto text-slate-300 mb-4" size={48} />
                      <p className="text-slate-500 font-medium">No hay comisiones registradas para este profesional.</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-slate-800">Documentos del Profesional</h4>
                    <button 
                      onClick={() => {
                        // This would ideally open the upload modal with professionalId pre-selected
                        alert('Para subir documentos, diríjase al Repositorio y seleccione este profesional.');
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all"
                    >
                      <Plus size={14} />
                      Cargar Documento
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {professionalDocuments.length > 0 ? (
                      professionalDocuments.map(doc => (
                        <div key={doc.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 group">
                          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <FileText size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-slate-800 text-sm truncate">{doc.titulo}</h5>
                            <p className="text-[10px] text-slate-500 uppercase font-black">{doc.tipo}</p>
                          </div>
                          <div className="flex gap-1">
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Eye size={16} />
                            </button>
                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all">
                              <Download size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                        <FolderOpen className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="text-slate-500 font-medium">No hay documentos cargados en el subrepositorio.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'reports' && (
                <ProfessionalReportsManager professional={selectedProfessional} onUpdate={updateProfessional} />
              )}

              {activeTab === 'contractors' && (
                <ContratistasContratos />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload CV Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white">
              <h3 className="text-xl font-bold">Analizar Hoja de Vida</h3>
              <p className="text-indigo-100 text-sm">El sistema IA extraerá el perfil del profesional.</p>
            </div>
            <div className="p-8 space-y-6">
              {!isAnalyzing ? (
                <>
                  <div className="flex justify-end mb-4">
                    <AIProviderSelector />
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                    <input 
                      type="file" 
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="mx-auto text-slate-400 mb-4" size={48} />
                    <p className="font-bold text-slate-700 mb-1">
                      {selectedFile ? selectedFile.name : 'Arrastre o seleccione un PDF'}
                    </p>
                    <p className="text-sm text-slate-500">Solo formato PDF</p>
                  </div>
                  
                  <div className="flex justify-end gap-4 pt-4">
                    <button 
                      onClick={() => {
                        setShowUploadModal(false);
                        setSelectedFile(null);
                      }}
                      className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button 
                      onClick={handleAnalyzeCV}
                      disabled={!selectedFile}
                      className={`px-8 py-2 font-bold rounded-xl transition-all flex items-center gap-2 ${
                        selectedFile 
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200' 
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <BrainCircuit size={20} />
                      Analizar con IA
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6"></div>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">Analizando Perfil...</h4>
                  <p className="text-slate-500">Extrayendo experiencia, especialidades y calculando métricas.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Creation Modal */}
      {showManualModal && (
        <AddProfessionalForm 
          projectId={projectId}
          onSave={(prof) => {
            addProfessional(prof);
            setShowManualModal(false);
          }}
          onCancel={() => setShowManualModal(false)}
        />
      )}

      {/* Import Professionals Modal */}
      {showImportModal && (
        <ImportProfessionalsForm 
          onSave={(professionals) => {
            professionals.forEach(p => addProfessional(p));
            setShowImportModal(false);
          }}
          onCancel={() => setShowImportModal(false)}
        />
      )}

      {/* Edit Professional Modal */}
      {showEditModal && selectedProfessional && (
        <AddProfessionalForm 
          initialData={selectedProfessional}
          onSave={(prof) => {
            updateProfessional(prof);
            setSelectedProfessional(prof);
            setShowEditModal(false);
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
};
