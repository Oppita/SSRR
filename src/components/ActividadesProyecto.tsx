import React, { useState } from 'react';
import { Project, Activity } from '../types';
import { useProject } from '../store/ProjectContext';
import { Calendar, Clock, Users, Plus, Trash2 } from 'lucide-react';

interface ActividadesProyectoProps {
  project: Project;
}

export const ActividadesProyecto: React.FC<ActividadesProyectoProps> = ({ project }) => {
  const { updateProject, state } = useProject();
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [newActivity, setNewActivity] = useState<Partial<Activity>>({
    title: '',
    type: 'Reunión',
    date: new Date().toISOString().split('T')[0],
    durationHours: 1,
    description: '',
    participantIds: []
  });

  const workflow = project.lifecycle?.bancoProyectos || { actividades: [] };

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
        bancoProyectos: updatedWorkflow as any
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
        bancoProyectos: updatedWorkflow as any
      }
    };

    updateProject(updatedProject);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Calendar size={24} className="text-indigo-600" />
          Actividades y Reuniones (PMU, Comités)
        </h3>
        <button 
          onClick={() => setShowAddActivity(!showAddActivity)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 flex items-center gap-2 text-sm"
        >
          <Plus size={16} /> Nueva Actividad
        </button>
      </div>

      {showAddActivity && (
        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-6 shadow-sm">
          <h4 className="font-bold text-slate-800 mb-4">Programar Actividad</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
              <input 
                type="text" 
                value={newActivity.title}
                onChange={(e) => setNewActivity({...newActivity, title: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                placeholder="Ej. PMU de Seguimiento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipo</label>
              <select 
                value={newActivity.type}
                onChange={(e) => setNewActivity({...newActivity, type: e.target.value as any})}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              >
                <option value="Reunión">Reunión</option>
                <option value="PMU">PMU</option>
                <option value="Comité">Comité</option>
                <option value="Visita">Visita</option>
                <option value="Otra">Otra</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
              <input 
                type="date" 
                value={newActivity.date}
                onChange={(e) => setNewActivity({...newActivity, date: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duración (Horas)</label>
              <input 
                type="number" 
                min="0.5" step="0.5"
                value={newActivity.durationHours}
                onChange={(e) => setNewActivity({...newActivity, durationHours: parseFloat(e.target.value)})}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Profesionales Participantes</label>
              <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-white">
                {state.professionals.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">No hay profesionales registrados en el sistema.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {state.professionals.map(prof => (
                      <label key={prof.id} className="flex items-center gap-2 text-sm">
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
                          className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="truncate">{prof.nombre} ({prof.profesion})</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Temas a tratar</label>
              <textarea 
                value={newActivity.description}
                onChange={(e) => setNewActivity({...newActivity, description: e.target.value})}
                className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                rows={2}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setShowAddActivity(false)}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddActivity}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Guardar Actividad
            </button>
          </div>
        </div>
      )}

      {(!workflow.actividades || workflow.actividades.length === 0) ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
          <Users className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium text-lg">No hay actividades programadas</p>
          <p className="text-sm text-slate-400 mt-1">Programa reuniones, PMUs o comités para este proyecto.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflow.actividades.map(act => (
            <div key={act.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="inline-block px-2 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded mb-2">
                    {act.type}
                  </span>
                  <h4 className="font-bold text-slate-800 leading-tight">{act.title}</h4>
                </div>
                <button 
                  onClick={() => handleDeleteActivity(act.id)}
                  className="text-slate-400 hover:text-rose-500 transition-colors bg-slate-50 p-1.5 rounded-md hover:bg-rose-50"
                  title="Eliminar actividad"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4 flex-1 line-clamp-3">{act.description}</p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <Calendar size={14} className="text-indigo-500" /> {act.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock size={14} /> {act.durationHours}h
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} /> {act.participantIds.length} part.
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
