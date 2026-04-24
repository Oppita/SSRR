import React, { useState } from 'react';
import { Project } from '../types';

export const ProjectForm = ({ project, onSave }: { project: Project, onSave: (p: Project) => void }) => {
  const [formData, setFormData] = useState<Project>(project);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold mb-4">Editar Proyecto: {project.nombre}</h3>
      <div className="grid grid-cols-2 gap-4">
        <input name="nombre" value={formData.nombre} onChange={handleChange} className="border p-2 rounded" placeholder="Nombre" />
        <input name="departamento" value={formData.departamento} onChange={handleChange} className="border p-2 rounded" placeholder="Departamento" />
        <input name="avanceFisico" type="number" value={formData.avanceFisico} onChange={handleChange} className="border p-2 rounded" placeholder="Avance Físico" />
        <input name="avanceFinanciero" type="number" value={formData.avanceFinanciero} onChange={handleChange} className="border p-2 rounded" placeholder="Avance Financiero" />
      </div>
      <button onClick={() => onSave(formData)} className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded">Guardar Cambios</button>
    </div>
  );
};
