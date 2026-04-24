import React, { useState, useMemo } from 'react';
import { useProject } from '../store/ProjectContext';
import { Task, Professional } from '../types';
import { CheckCircle2, Clock, AlertTriangle, Calendar, User, Plus, Search, Filter, Mail } from 'lucide-react';
import { formatDateForInput } from '../lib/storage';

export function TaskBoard() {
  const { state, addTask, updateTask } = useProject();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Media',
    status: 'Pendiente'
  });

  const tasks = state.tasks || [];
  const professionals = state.professionals || [];

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = (task.title || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                            (task.description || '').toLowerCase().includes((searchTerm || '').toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [tasks, searchTerm, statusFilter]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.assignedTo || !newTask.dueDate) return;

    const task: Task = {
      id: `TSK-${Date.now()}`,
      title: newTask.title,
      description: newTask.description || '',
      assignedTo: newTask.assignedTo,
      dueDate: newTask.dueDate,
      priority: newTask.priority as any,
      status: 'Pendiente',
      projectId: newTask.projectId
    };

    addTask(task);
    setIsFormOpen(false);
    setNewTask({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Media', status: 'Pendiente' });
  };

  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    updateTask({ ...task, status: newStatus, completedDate: newStatus === 'Completada' ? new Date().toISOString() : undefined });
  };

  const getProfessionalName = (id: string) => {
    return professionals.find(p => p.id === id)?.nombre || 'Desconocido';
  };

  const getProfessionalEmail = (id: string) => {
    return professionals.find(p => p.id === id)?.email || '';
  };

  const sendEmailNotification = (task: Task) => {
    const email = getProfessionalEmail(task.assignedTo);
    if (!email) {
      alert('El profesional asignado no tiene un correo configurado.');
      return;
    }
    const subject = encodeURIComponent(`Nueva Tarea Asignada: ${task.title}`);
    const body = encodeURIComponent(`Hola ${getProfessionalName(task.assignedTo)},\n\nSe le ha asignado una nueva tarea:\n\nTítulo: ${task.title}\nDescripción: ${task.description}\nFecha de Vencimiento: ${task.dueDate}\nPrioridad: ${task.priority}\n\nPor favor, revise el sistema para más detalles.\n\nSaludos.`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  // Identificar cuellos de botella
  const bottlenecks = useMemo(() => {
    const overdue = tasks.filter(t => t.status === 'Atrasada' || (t.status !== 'Completada' && new Date(t.dueDate) < new Date()));
    const grouped = overdue.reduce((acc, task) => {
      acc[task.assignedTo] = (acc[task.assignedTo] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(grouped)
      .map(([profId, count]) => ({ profId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [tasks]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tareas y Cuellos de Botella</h2>
          <p className="text-slate-500">Gestión de entregables y seguimiento de responsabilidades</p>
        </div>
        <button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>Nueva Tarea</span>
        </button>
      </div>

      {/* Cuellos de Botella */}
      {bottlenecks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={20} />
            Cuellos de Botella Detectados (Tareas Atrasadas)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bottlenecks.map((b, idx) => (
              <div key={idx} className="bg-white p-4 rounded-lg border border-red-100 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                    {getProfessionalName(b.profId).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{getProfessionalName(b.profId)}</p>
                    <p className="text-sm text-red-600">{b.count} tareas atrasadas</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isFormOpen && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Crear Nueva Tarea</h3>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Asignar a</label>
                <select
                  required
                  value={newTask.assignedTo}
                  onChange={e => setNewTask({...newTask, assignedTo: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="" disabled>Seleccione un profesional</option>
                  {professionals.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} ({p.profesion})</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  required
                  value={formatDateForInput(newTask.dueDate)}
                  onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prioridad</label>
                <select
                  value={newTask.priority}
                  onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Baja">Baja</option>
                  <option value="Media">Media</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Guardar Tarea
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Buscar tareas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={20} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="Pendiente">Pendiente</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completada">Completada</option>
              <option value="Atrasada">Atrasada</option>
            </select>
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No se encontraron tareas que coincidan con los filtros.
            </div>
          ) : (
            filteredTasks.map(task => {
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'Completada';
              return (
                <div key={task.id} className={`p-4 hover:bg-slate-50 transition-colors ${isOverdue ? 'bg-red-50/30' : ''}`}>
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="font-semibold text-slate-800">{task.title}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          task.priority === 'Urgente' ? 'bg-red-100 text-red-700' :
                          task.priority === 'Alta' ? 'bg-orange-100 text-orange-700' :
                          task.priority === 'Media' ? 'bg-blue-100 text-blue-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {task.priority}
                        </span>
                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle size={12} /> Atrasada
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-3">{task.description}</p>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          <span>{getProfessionalName(task.assignedTo)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>Vence: {task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end justify-between gap-3 min-w-[150px]">
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task, e.target.value as any)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border outline-none ${
                          task.status === 'Completada' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          task.status === 'En Progreso' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          task.status === 'Atrasada' ? 'bg-red-50 border-red-200 text-red-700' :
                          'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <option value="Pendiente">Pendiente</option>
                        <option value="En Progreso">En Progreso</option>
                        <option value="Completada">Completada</option>
                        <option value="Atrasada">Atrasada</option>
                      </select>

                      <button
                        onClick={() => sendEmailNotification(task)}
                        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <Mail size={16} />
                        Enviar Notificación
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
