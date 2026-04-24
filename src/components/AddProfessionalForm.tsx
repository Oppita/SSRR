import React, { useState } from 'react';
import { Professional } from '../types';
import { Briefcase, User, Save, X, FileText, BrainCircuit, Loader2 } from 'lucide-react';
import { extractProfessionalData } from '../services/geminiService';
import { showAlert } from '../utils/alert';

interface AddProfessionalFormProps {
  onSave: (prof: Professional) => void;
  onCancel: () => void;
  initialData?: Professional;
  projectId?: string;
}

export const AddProfessionalForm: React.FC<AddProfessionalFormProps> = ({ onSave, onCancel, initialData, projectId }) => {
  const [prof, setProf] = useState<Partial<Professional>>(initialData || {
    nombre: '',
    projectId: projectId,
    profesion: '',
    experienciaAnios: 0,
    salarioMensual: 0,
    gastosRepresentacion: 0,
    incrementoAntiguedad: 0,
    carga: 'Disponible',
    especialidades: [],
    sectoresTrabajados: [],
    proyectosRelevantes: [],
    departamentosExperiencia: [],
    numeroContrato: '',
    horasReuniones: 0,
    horasPMU: 0,
    horasSeguimiento: 0,
    horasCoordinacion: 0,
  });

  const [especialidadesStr, setEspecialidadesStr] = useState(initialData?.especialidades?.join(', ') || '');
  const [sectoresStr, setSectoresStr] = useState(initialData?.sectoresTrabajados?.join(', ') || '');
  const [departamentosStr, setDepartamentosStr] = useState(initialData?.departamentosExperiencia?.join(', ') || '');
  const [showTextModal, setShowTextModal] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleTextExtraction = async () => {
    if (!pastedText.trim()) return;
    setIsAnalyzing(true);
    try {
      const extracted = await extractProfessionalData(pastedText);
      console.log('Extracted data received in form:', extracted);
      
      if (extracted) {
        setProf(prev => {
          const newState = {
            ...prev,
            nombre: extracted.nombre || prev.nombre,
            profesion: extracted.profesion || prev.profesion,
            experienciaAnios: extracted.experienciaAnios ?? prev.experienciaAnios,
            salarioMensual: extracted.salarioMensual ?? prev.salarioMensual,
            gastosRepresentacion: extracted.gastosRepresentacion ?? prev.gastosRepresentacion,
            incrementoAntiguedad: extracted.incrementoAntiguedad ?? prev.incrementoAntiguedad,
            valorTotalContrato: extracted.valorTotalContrato ?? prev.valorTotalContrato,
            numeroContrato: extracted.numeroContrato || prev.numeroContrato,
            objetoContrato: extracted.objetoContrato || prev.objetoContrato,
            supervisor: extracted.supervisor || prev.supervisor,
            fechaInicio: extracted.fechaInicio || prev.fechaInicio,
            fechaFinalizacion: extracted.fechaFinalizacion || prev.fechaFinalizacion,
            ciudad: extracted.ciudad || prev.ciudad,
          };
          console.log('New state after extraction:', newState);
          return newState;
        });
        
        if (extracted.especialidades) setEspecialidadesStr(extracted.especialidades.join(', '));
        if (extracted.departamentosExperiencia) setDepartamentosStr(extracted.departamentosExperiencia.join(', '));
        
        showAlert('Datos extraídos correctamente.');
        setShowTextModal(false);
        setPastedText('');
      } else {
        showAlert('No se pudieron extraer datos.');
      }
    } catch (error) {
      console.error('Error extracting professional data:', error);
      showAlert('Error al extraer datos.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalHoras = (prof.horasReuniones || 0) + (prof.horasPMU || 0) + (prof.horasSeguimiento || 0) + (prof.horasCoordinacion || 0);
    const horasParaCalculo = totalHoras > 0 ? totalHoras : 160;
    
    onSave({
      ...prof as Professional,
      id: initialData?.id || `PROF-${Date.now()}`,
      valorHora: (prof.salarioMensual || 0) / horasParaCalculo,
      proyectosActivos: initialData?.proyectosActivos || 0,
      horasEstimadas: totalHoras,
      especialidades: especialidadesStr.split(',').map(s => s.trim()).filter(Boolean),
      sectoresTrabajados: sectoresStr.split(',').map(s => s.trim()).filter(Boolean),
      departamentosExperiencia: departamentosStr.split(',').map(s => s.trim()).filter(Boolean),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
          <h3 className="text-xl font-bold">{initialData ? 'Editar Profesional' : 'Crear Profesional Manualmente'}</h3>
          <button onClick={onCancel} className="text-indigo-100 hover:text-white"><X size={20} /></button>
        </div>
        
        <div className="p-4 bg-slate-50 border-b border-slate-100">
          <button
            type="button"
            onClick={() => setShowTextModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors shadow-sm text-sm font-bold"
          >
            <FileText size={18} />
            Pegar Texto (Extraer con IA)
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... form fields ... */}
            <div>
              <label className="block text-sm font-bold text-slate-700">Nombre</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.nombre} onChange={e => setProf({...prof, nombre: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700">Profesión</label>
              <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.profesion} onChange={e => setProf({...prof, profesion: e.target.value})} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700">Años de Experiencia</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.experienciaAnios} onChange={e => setProf({...prof, experienciaAnios: Number(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Salario Mensual</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.salarioMensual} onChange={e => setProf({...prof, salarioMensual: Number(e.target.value)})} required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Gastos Repr.</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.gastosRepresentacion || 0} onChange={e => setProf({...prof, gastosRepresentacion: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Incr. Antigüedad</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.incrementoAntiguedad || 0} onChange={e => setProf({...prof, incrementoAntiguedad: Number(e.target.value)})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700">Valor Total Contrato</label>
                <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.valorTotalContrato || 0} onChange={e => setProf({...prof, valorTotalContrato: Number(e.target.value)})} />
              </div>
            </div>

            {/* ... rest of the form ... */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h4 className="font-bold text-slate-800 mb-3">Datos Contractuales y Dedicación</h4>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700">CDP</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.cdp || ''} onChange={e => setProf({...prof, cdp: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">RC</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.rc || ''} onChange={e => setProf({...prof, rc: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Vigencia</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.vigencia || ''} onChange={e => setProf({...prof, vigencia: e.target.value})} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-bold text-slate-700">Número de Contrato (OPS)</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.numeroContrato || ''} onChange={e => setProf({...prof, numeroContrato: e.target.value})} placeholder="Ej. OPS-2026-001" />
              </div>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Horas Reuniones (mes)</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.horasReuniones || 0} onChange={e => setProf({...prof, horasReuniones: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Horas PMU (mes)</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.horasPMU || 0} onChange={e => setProf({...prof, horasPMU: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Horas Seguimiento (mes)</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.horasSeguimiento || 0} onChange={e => setProf({...prof, horasSeguimiento: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Horas Coordinación (mes)</label>
                  <input type="number" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.horasCoordinacion || 0} onChange={e => setProf({...prof, horasCoordinacion: Number(e.target.value)})} />
                </div>
              </div>
              <div className="mt-3">
                <label className="block text-sm font-bold text-slate-700">Objeto del Contrato</label>
                <textarea className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm h-20 resize-none" value={prof.objetoContrato || ''} onChange={e => setProf({...prof, objetoContrato: e.target.value})} placeholder="Descripción detallada del objeto contractual..." />
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <label className="block text-sm font-bold text-slate-700">Supervisor</label>
                  <input type="text" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.supervisor || ''} onChange={e => setProf({...prof, supervisor: e.target.value})} placeholder="Nombre del supervisor" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Fecha Inicio</label>
                  <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.fechaInicio || ''} onChange={e => setProf({...prof, fechaInicio: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700">Fecha Finalización</label>
                  <input type="date" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" value={prof.fechaFinalizacion || ''} onChange={e => setProf({...prof, fechaFinalizacion: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-4 mt-4">
              <div>
                <label className="block text-sm font-bold text-slate-700">Especializaciones (separadas por coma)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" 
                  value={especialidadesStr} 
                  onChange={e => setEspecialidadesStr(e.target.value)} 
                  placeholder="Ej. Ingeniería Civil, Gestión de Proyectos"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-bold text-slate-700">Sectores Trabajados (separados por coma)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" 
                  value={sectoresStr} 
                  onChange={e => setSectoresStr(e.target.value)} 
                  placeholder="Ej. Infraestructura, Salud"
                />
              </div>
              <div className="mt-3">
                <label className="block text-sm font-bold text-slate-700">Departamentos de Experiencia (separados por coma)</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" 
                  value={departamentosStr} 
                  onChange={e => setDepartamentosStr(e.target.value)} 
                  placeholder="Ej. Cundinamarca, Antioquia"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4 sticky bottom-0 bg-white pb-2">
              <button type="button" onClick={onCancel} className="px-6 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl">Cancelar</button>
              <button type="submit" className="px-8 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 flex items-center gap-2">
                <Save size={18} /> Guardar Profesional
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Text Extraction Modal */}
      {showTextModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <FileText size={24} />
                Extraer Datos de Hoja de Vida
              </h3>
              <button onClick={() => setShowTextModal(false)} className="hover:bg-white/20 p-1 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Pegue aquí el texto de la hoja de vida para que la IA extraiga los campos automáticamente.
              </p>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                className="w-full h-64 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono text-sm"
                placeholder="Pegue el contenido aquí..."
              />
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTextModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleTextExtraction}
                  disabled={isAnalyzing || !pastedText.trim()}
                  className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analizando...
                    </>
                  ) : (
                    <>
                      <BrainCircuit size={18} />
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
