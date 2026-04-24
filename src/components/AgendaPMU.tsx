import React, { useState } from 'react';
import { useProject } from '../store/ProjectContext';
import { Activity, Professional } from '../types';
import { Calendar, Clock, Users, Plus, Trash2, Search, Filter, MapPin, AlertTriangle, Save } from 'lucide-react';

export const AgendaPMU: React.FC<{ eventId?: string; projectId?: string }> = ({ eventId, projectId }) => {
  const { state, addActivity, deleteActivity, updateProfessional } = useProject();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('Todos');
  const [profSearchTerm, setProfSearchTerm] = useState('');
  const [activityToDelete, setActivityToDelete] = useState<string | null>(null);
  
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: '',
    type: 'PMU',
    date: new Date().toISOString().split('T')[0],
    durationHours: 1,
    description: '',
    participantIds: [],
    phenomenon: '',
    projectId: projectId || '',
    eventoId: eventId || ''
  });

  const getHoursField = (type: Activity['type']) => {
    switch (type) {
      case 'PMU': return 'horasPMU';
      case 'Reunión': return 'horasReuniones';
      case 'Comité': return 'horasCoordinacion';
      case 'Visita': return 'horasSeguimiento';
      default: return 'horasCoordinacion';
    }
  };

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
      phenomenon: newActivity.phenomenon || undefined,
      eventoId: newActivity.eventoId || undefined,
      projectId: newActivity.projectId || undefined
    };

    addActivity(activity);

    // Update professional hours
    activity.participantIds.forEach(profId => {
      const prof = state.professionals.find(p => p.id === profId);
      if (prof) {
        const hoursField = getHoursField(activity.type);
        updateProfessional({
          ...prof,
          [hoursField]: (prof[hoursField as keyof Professional] as number || 0) + activity.durationHours
        });
      }
    });

    setShowAddActivity(false);
    setNewActivity({
      title: '',
      type: 'PMU',
      date: new Date().toISOString().split('T')[0],
      durationHours: 1,
      description: '',
      participantIds: [],
      phenomenon: '',
      projectId: ''
    });
  };

  // Combine global activities and project-specific activities (if any are stored in project.lifecycle.bancoProyectos.actividades)
  // Actually, we should migrate or just use global activities. Let's assume global activities is the source of truth now.
  const allActivities = state.activities || [];

  const filteredActivities = allActivities.filter(act => {
    const matchesSearch = (act.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                          (act.description || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                          (act.phenomenon && (act.phenomenon || '').toLowerCase().includes((searchTerm || '').toLowerCase()));
    const matchesType = filterType === 'Todos' || act.type === filterType;
    
    // Filter by props if provided
    const matchesEvent = !eventId || act.eventoId === eventId;
    const matchesProject = !projectId || act.projectId === projectId;
    
    return matchesSearch && matchesType && matchesEvent && matchesProject;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Agenda y PMU</h1>
          <p className="text-slate-600">Gestione reuniones, Puestos de Mando Unificado (PMU) y actividades relacionadas a proyectos o fenómenos naturales.</p>
        </div>
        <button 
          onClick={() => setShowAddActivity(!showAddActivity)}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={20} /> Nueva Actividad
        </button>
      </div>

      {showAddActivity && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="text-indigo-600" /> Programar Nueva Actividad
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Título de la Actividad *</label>
              <input 
                type="text" 
                value={newActivity.title}
                onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Ej. PMU Seguimiento Frente Frío"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo *</label>
              <select 
                value={newActivity.type}
                onChange={(e) => setNewActivity({...newActivity, type: e.target.value as any})}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="PMU">PMU</option>
                <option value="Reunión">Reunión</option>
                <option value="Comité">Comité</option>
                <option value="Visita">Visita</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha *</label>
              <input 
                type="date" 
                value={newActivity.date}
                onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración (Horas) *</label>
              <input 
                type="number" 
                min="0.5" step="0.5"
                value={newActivity.durationHours}
                onChange={(e) => setNewActivity({...newActivity, durationHours: parseFloat(e.target.value)})}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-500" /> Relacionar con Evento
                </label>
                <select 
                  value={newActivity.eventoId || ''}
                  onChange={(e) => setNewActivity({...newActivity, eventoId: e.target.value, projectId: ''})}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={!!newActivity.projectId}
                >
                  <option value="">Seleccione un evento...</option>
                  {(state.eventos || []).map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Use esto si la actividad está ligada a un evento de emergencia.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                  <MapPin size={16} className="text-emerald-500" /> Relacionar con Proyecto
                </label>
                <select 
                  value={newActivity.projectId || ''}
                  onChange={(e) => setNewActivity({...newActivity, projectId: e.target.value, phenomenon: ''})}
                  className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                  disabled={!!newActivity.phenomenon}
                >
                  <option value="">-- Seleccionar Proyecto (Opcional) --</option>
                  {state.proyectos.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Seleccione un proyecto si la actividad es específica de uno.</p>
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Profesionales Participantes</label>
              <div className="mb-3 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="Buscar profesional por nombre o profesión..."
                  value={profSearchTerm}
                  onChange={(e) => setProfSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="border border-slate-300 rounded-xl p-4 max-h-48 overflow-y-auto bg-white">
                {state.professionals.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay profesionales registrados en el sistema.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {state.professionals
                      .filter(p => 
                        (p.nombre || '').toLowerCase().includes((profSearchTerm || '').toLowerCase()) || 
                        (p.profesion || '').toLowerCase().includes((profSearchTerm || '').toLowerCase())
                      )
                      .map(prof => (
                      <label key={prof.id} className="flex items-center gap-3 text-sm p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200 transition-colors">
                        <input 
                          type="checkbox"
                          checked={(newActivity.participantIds || []).includes(prof.id)}
                          onChange={(e) => {
                            const currentIds = newActivity.participantIds || [];
                            if (e.target.checked) {
                              setNewActivity({...newActivity, participantIds: [...currentIds, prof.id]});
                            } else {
                              setNewActivity({...newActivity, participantIds: currentIds.filter(id => id !== prof.id)});
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700 truncate">{prof.nombre}</span>
                          <span className="text-xs text-slate-500 truncate">{prof.profesion}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-3">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Temas a tratar *</label>
              <textarea 
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                rows={3}
                placeholder="Detalle los puntos principales de la agenda..."
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              onClick={() => setShowAddActivity(false)}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddActivity}
              disabled={!newActivity.title || !newActivity.description}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} /> Guardar Actividad
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text"
            placeholder="Buscar actividades, fenómenos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter size={20} className="text-slate-400" />
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white min-w-[150px]"
          >
            <option value="Todos">Todos los tipos</option>
            <option value="PMU">PMU</option>
            <option value="Reunión">Reunión</option>
            <option value="Comité">Comité</option>
            <option value="Visita">Visita</option>
            <option value="Otra">Otra</option>
          </select>
        </div>
      </div>

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="text-slate-300" size={40} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">No hay actividades programadas</h3>
          <p className="text-slate-500 max-w-md mx-auto">
            No se encontraron actividades que coincidan con los filtros actuales. Puede crear una nueva actividad usando el botón superior.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredActivities.map(act => {
            const project = act.projectId ? state.proyectos.find(p => p.id === act.projectId) : null;
            
            return (
              <div key={act.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                      act.type === 'PMU' ? 'bg-rose-100 text-rose-700' :
                      act.type === 'Comité' ? 'bg-amber-100 text-amber-700' :
                      act.type === 'Visita' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {act.type}
                    </span>
                    <button 
                      onClick={() => {
                        setActivityToDelete(act.id);
                      }}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-1.5 rounded-lg hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                      title="Eliminar actividad"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 mb-2 leading-tight">{act.title}</h3>
                  
                  {act.phenomenon && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-amber-600 mb-3 bg-amber-50 w-fit px-2.5 py-1 rounded-lg">
                      <AlertTriangle size={14} /> {act.phenomenon}
                    </div>
                  )}
                  
                  {project && (
                    <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 mb-3 bg-emerald-50 w-fit px-2.5 py-1 rounded-lg truncate max-w-full">
                      <MapPin size={14} className="shrink-0" /> <span className="truncate">{project.nombre}</span>
                    </div>
                  )}
                  
                  <p className="text-slate-600 text-sm mb-6 line-clamp-3 flex-1">{act.description}</p>
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm text-slate-500 pt-4 border-t border-slate-100 mt-auto">
                    <div className="flex items-center gap-2 font-medium text-slate-700">
                      <Calendar size={16} className="text-indigo-500" /> {act.date}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} /> {act.durationHours} horas
                    </div>
                    <div className="flex items-center gap-2 col-span-2">
                      <Users size={16} /> {act.participantIds.length} profesionales asignados
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                ✕
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
    </div>
  );
};
