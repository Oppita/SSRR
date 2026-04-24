import React, { useState, useRef } from 'react';
import { useProject } from '../store/ProjectContext';
import { Activity, Professional } from '../types';
import { Calendar, Clock, Users, Plus, Edit, Trash2, X, Search, FileSearch, Loader2, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { extractActivityData } from '../services/geminiService';
import { AIProviderSelector } from './AIProviderSelector';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();

export const ActivitiesManager: React.FC = () => {
  const { state, addActivity, updateActivity, deleteActivity, updateProfessional } = useProject();
  const [showModal, setShowModal] = useState(false);
  const [profSearchTerm, setProfSearchTerm] = useState('');
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [formData, setFormData] = useState<Partial<Activity>>({
    type: 'Reunión',
    date: new Date().toISOString().split('T')[0],
    durationHours: 1,
    participantIds: [],
    title: '',
    description: '',
    phenomenon: ''
  });

  const [isExtracting, setIsExtracting] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsExtracting(true);
    setExtractionError(null);

    try {
      let text = '';
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else {
        text = await file.text();
      }

      const extracted = await extractActivityData(text);
      
      // Auto-match participants by email if they exist in state
      const matchedParticipantIds: string[] = [];
      if (extracted.participantEmails) {
        extracted.participantEmails.forEach((email: string) => {
          const prof = state.professionals.find(p => (p.email || '').toLowerCase() === (email || '').toLowerCase());
          if (prof) matchedParticipantIds.push(prof.id);
        });
      }

      setFormData(prev => ({
        ...prev,
        title: extracted.title || prev.title,
        type: extracted.type || prev.type,
        date: extracted.date || prev.date,
        durationHours: extracted.durationHours || prev.durationHours,
        phenomenon: extracted.phenomenon || prev.phenomenon,
        description: extracted.description || prev.description,
        participantIds: matchedParticipantIds.length > 0 ? matchedParticipantIds : prev.participantIds
      }));
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractionError('No se pudo extraer la información. Verifique el archivo o el proveedor de IA.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSave = () => {
    if (!formData.title || !formData.date || !formData.durationHours) {
      alert('Por favor complete los campos obligatorios.');
      return;
    }

    const activityData: Activity = {
      id: editingActivity?.id || `ACT-${Date.now()}`,
      title: formData.title || '',
      type: formData.type as Activity['type'],
      date: formData.date || '',
      durationHours: Number(formData.durationHours) || 0,
      phenomenon: formData.phenomenon || '',
      participantIds: formData.participantIds || [],
      description: formData.description || ''
    };

    if (editingActivity) {
      // Revert old hours
      editingActivity.participantIds.forEach(profId => {
        const prof = state.professionals.find(p => p.id === profId);
        if (prof) {
          const hoursField = getHoursField(editingActivity.type);
          updateProfessional({
            ...prof,
            [hoursField]: Math.max(0, (prof[hoursField as keyof Professional] as number || 0) - editingActivity.durationHours)
          });
        }
      });
      updateActivity(activityData);
    } else {
      addActivity(activityData);
    }

    // Apply new hours
    activityData.participantIds.forEach(profId => {
      const prof = state.professionals.find(p => p.id === profId);
      if (prof) {
        const hoursField = getHoursField(activityData.type);
        updateProfessional({
          ...prof,
          [hoursField]: (prof[hoursField as keyof Professional] as number || 0) + activityData.durationHours
        });
      }
    });

    setShowModal(false);
    setEditingActivity(null);
    setFormData({
      type: 'Reunión',
      date: new Date().toISOString().split('T')[0],
      durationHours: 1,
      participantIds: [],
      title: '',
      description: '',
      phenomenon: ''
    });
  };

  const getHoursField = (type: Activity['type']) => {
    switch (type) {
      case 'PMU': return 'horasPMU';
      case 'Reunión': return 'horasReuniones';
      case 'Comité': return 'horasCoordinacion';
      case 'Visita': return 'horasSeguimiento';
      default: return 'horasCoordinacion';
    }
  };

  const handleDelete = (activity: Activity) => {
    setActivityToDelete(activity.id);
  };

  const toggleParticipant = (profId: string) => {
    setFormData(prev => ({
      ...prev,
      participantIds: prev.participantIds?.includes(profId)
        ? prev.participantIds.filter(id => id !== profId)
        : [...(prev.participantIds || []), profId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Registro de Actividades y PMU</h2>
        <button
          onClick={() => {
            setEditingActivity(null);
            setFormData({
              type: 'Reunión',
              date: new Date().toISOString().split('T')[0],
              durationHours: 1,
              participantIds: [],
              title: '',
              description: '',
              phenomenon: ''
            });
            setShowModal(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Nueva Actividad
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-600 text-sm">
            <tr>
              <th className="p-4 font-medium">Fecha</th>
              <th className="p-4 font-medium">Tipo</th>
              <th className="p-4 font-medium">Título</th>
              <th className="p-4 font-medium">Fenómeno</th>
              <th className="p-4 font-medium">Duración</th>
              <th className="p-4 font-medium">Participantes</th>
              <th className="p-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {state.activities?.map(activity => (
              <tr key={activity.id} className="hover:bg-slate-50">
                <td className="p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    {activity.date}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    activity.type === 'PMU' ? 'bg-red-100 text-red-700' :
                    activity.type === 'Reunión' ? 'bg-blue-100 text-blue-700' :
                    activity.type === 'Comité' ? 'bg-purple-100 text-purple-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {activity.type}
                  </span>
                </td>
                <td className="p-4 text-sm font-medium text-slate-800">{activity.title}</td>
                <td className="p-4 text-sm text-slate-600">{activity.phenomenon || '-'}</td>
                <td className="p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-slate-400" />
                    {activity.durationHours}h
                  </div>
                </td>
                <td className="p-4 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    {activity.participantIds.length} prof.
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingActivity(activity);
                        setFormData(activity);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(activity)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!state.activities || state.activities.length === 0) && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">
                  No hay actividades registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Eliminar Actividad */}
      {activityToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
            <div className="bg-rose-600 p-6 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <AlertTriangle size={24} className="text-white" />
                <h3 className="text-xl font-bold">Eliminar Actividad</h3>
              </div>
              <button onClick={() => setActivityToDelete(null)} className="text-rose-200 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 mb-6">
                ¿Está seguro de eliminar esta actividad? Se descontarán las horas de los profesionales asociados.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setActivityToDelete(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    deleteActivity(activityToDelete);
                    setActivityToDelete(null);
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

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">
                {editingActivity ? 'Editar Actividad' : 'Nueva Actividad'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* AI Extraction Section */}
              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSearch className="text-indigo-600" size={20} />
                    <h4 className="font-bold text-slate-800 text-sm">Extracción Inteligente (Actas/PMU)</h4>
                  </div>
                  <AIProviderSelector />
                </div>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isExtracting}
                    className="flex items-center justify-center gap-2 w-full py-3 border-2 border-dashed border-indigo-200 rounded-xl hover:border-indigo-400 hover:bg-white transition-all text-indigo-600 font-bold text-sm disabled:opacity-50"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Analizando documento...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Cargar Acta o Citación para Auto-completar
                      </>
                    )}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept=".pdf,.txt"
                  />
                  {extractionError && (
                    <p className="text-xs text-rose-600 flex items-center gap-1">
                      <AlertCircle size={12} /> {extractionError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Actividad *</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="Reunión">Reunión</option>
                    <option value="PMU">PMU</option>
                    <option value="Comité">Comité</option>
                    <option value="Visita">Visita a Terreno</option>
                    <option value="Otra">Otra</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                <input
                  type="text"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Ej. PMU Nacional Frente Frío"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duración (Horas) *</label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.durationHours}
                    onChange={(e) => setFormData({...formData, durationHours: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fenómeno Asociado</label>
                  <select
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.phenomenon}
                    onChange={(e) => setFormData({...formData, phenomenon: e.target.value})}
                  >
                    <option value="">Ninguno / General</option>
                    <option value="Frente Frío">Frente Frío</option>
                    <option value="La Niña">La Niña</option>
                    <option value="El Niño">El Niño</option>
                    <option value="Sismo">Sismo</option>
                    <option value="Huracán">Huracán</option>
                    <option value="Inundación">Inundación</option>
                    <option value="Deslizamiento">Deslizamiento</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detalles de la actividad..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Profesionales Participantes</label>
                <div className="mb-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input 
                    type="text"
                    placeholder="Buscar profesional..."
                    value={profSearchTerm}
                    onChange={(e) => setProfSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto divide-y divide-slate-100">
                  {state.professionals
                    .filter(p => 
                      (p.nombre || '').toLowerCase().includes((profSearchTerm || '').toLowerCase()) || 
                      (p.profesion || '').toLowerCase().includes((profSearchTerm || '').toLowerCase())
                    )
                    .map(prof => (
                    <label key={prof.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        checked={formData.participantIds?.includes(prof.id)}
                        onChange={() => toggleParticipant(prof.id)}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{prof.nombre}</p>
                        <p className="text-xs text-slate-500">{prof.profesion}</p>
                      </div>
                    </label>
                  ))}
                  {state.professionals.length === 0 && (
                    <div className="p-4 text-center text-sm text-slate-500">
                      No hay profesionales registrados.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Guardar Actividad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
