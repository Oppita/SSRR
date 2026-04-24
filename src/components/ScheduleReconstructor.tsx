import React, { useState, useMemo } from 'react';
import { ProjectData, ScheduleActivity } from '../types';
import { Calendar, BrainCircuit, AlertTriangle, CheckCircle2, Edit2, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ScheduleReconstructorProps {
  project: ProjectData;
}

export const ScheduleReconstructor: React.FC<ScheduleReconstructorProps> = ({ project: data }) => {
  const activities = useMemo(() => {
    // Derive activities from real project data
    const derivedActivities: ScheduleActivity[] = [];

    // 1. Add activities from contracts
    data.contracts.forEach(contract => {
      derivedActivities.push({
        id: contract.id,
        name: contract.objetoContractual,
        phase: 'Ejecución', // Simplified
        progress: 0, // Needs calculation
        subactivities: [{
          id: `sub-${contract.id}`,
          name: 'Ejecución Contractual',
          progress: 0,
          tasks: [{ 
            id: `task-${contract.id}`, 
            name: contract.objetoContractual, 
            startDate: contract.fechaInicio, 
            endDate: contract.fechaFin, 
            durationMonths: 1, // Simplified
            progress: 0, 
            status: 'En Progreso', 
            isCritical: true, 
            dependencies: [], 
            sourceDocumentIds: [contract.id] 
          }]
        }]
      });
    });

    // 2. Add activities from otrosies (as modifications)
    data.otrosies.forEach(o => {
      // Find the contract and update it
      const contractActivity = derivedActivities.find(a => a.id === o.contractId);
      if (contractActivity) {
        contractActivity.subactivities.push({
          id: `sub-${o.id}`,
          name: `Otrosí: ${o.objeto}`,
          progress: 0,
          tasks: [{ 
            id: `task-${o.id}`, 
            name: o.objeto, 
            startDate: o.fechaFirma, 
            endDate: o.fechaFirma, // Simplified
            durationMonths: o.plazoAdicionalMeses || 0, 
            progress: 0, 
            status: 'En Progreso', 
            isCritical: true, 
            dependencies: [], 
            sourceDocumentIds: [o.id] 
          }]
        });
      }
    });

    return derivedActivities;
  }, [data]);

  const ganttData = useMemo(() => {
    return activities.flatMap(act => act.subactivities.flatMap(sub => sub.tasks.map(task => ({
      name: task.name,
      start: new Date(task.startDate).getTime() / (1000 * 60 * 60 * 24 * 30),
      duration: task.durationMonths,
      progress: task.progress,
      status: task.status
    }))));
  }, [activities]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <BrainCircuit className="text-indigo-600" />
          Reconstructor Automático de Cronograma (IA)
        </h2>
        <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
          <Save size={18} /> Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Cronograma (Gantt)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ganttData} layout="vertical" margin={{ top: 20, right: 30, left: 120, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} fontSize={10} />
                <Tooltip />
                <Bar dataKey="duration" stackId="a" radius={[0, 4, 4, 0]}>
                  {ganttData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.status === 'Ejecutada' ? '#10b981' : entry.status === 'En Progreso' ? '#6366f1' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Actividades Críticas</h3>
          <div className="space-y-3">
            {activities.flatMap(a => a.subactivities.flatMap(s => s.tasks)).filter(t => t.isCritical).map(t => (
              <div key={t.id} className="flex items-center gap-3 text-sm text-rose-800 bg-rose-50 p-3 rounded-lg border border-rose-100">
                <AlertTriangle size={16} />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Estructura de Actividades</h3>
        {activities.map(act => (
          <div key={act.id} className="mb-6">
            <h4 className="font-bold text-indigo-700 bg-indigo-50 p-2 rounded">{act.phase}: {act.name}</h4>
            {act.subactivities.map(sub => (
              <div key={sub.id} className="ml-6 mt-2">
                <h5 className="font-semibold text-slate-800">{sub.name}</h5>
                {sub.tasks.map(task => (
                  <div key={task.id} className="ml-6 mt-1 flex items-center justify-between p-2 hover:bg-slate-50 rounded">
                    <span className="text-sm text-slate-600">{task.name}</span>
                    <button className="text-indigo-600 hover:text-indigo-800"><Edit2 size={14} /></button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
