import React, { useState } from 'react';
import { Professional, InformeMensual } from '../types';
import { FileText, Upload, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ProfessionalReportsManagerProps {
  professional: Professional;
  onUpdate: (prof: Professional) => void;
}

export const ProfessionalReportsManager: React.FC<ProfessionalReportsManagerProps> = ({ professional, onUpdate }) => {
  const [informes, setInformes] = useState<InformeMensual[]>(professional.informesMensuales || []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate file upload and storage
    const newInforme: InformeMensual = {
      id: `INF-${Date.now()}`,
      mes: new Date().toLocaleString('es-ES', { month: 'long' }),
      anio: new Date().getFullYear(),
      url: URL.createObjectURL(file), // In a real app, this would be a Firebase Storage URL
      estado: 'Radicado',
      fechaRadicacion: new Date().toISOString(),
    };

    const updatedInformes = [...informes, newInforme];
    setInformes(updatedInformes);
    onUpdate({ ...professional, informesMensuales: updatedInformes });
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <FileText size={20} className="text-indigo-600" />
        Informes Mensuales
      </h3>
      
      <div className="mb-4">
        <label className="block w-full border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition-colors">
          <Upload className="mx-auto text-slate-400 mb-2" size={24} />
          <span className="text-sm font-bold text-slate-600">Subir Informe PDF</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      <div className="space-y-3">
        {informes.map((informe) => (
          <div key={informe.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-800">{informe.mes} {informe.anio}</p>
                <p className="text-xs text-slate-500">{new Date(informe.fechaRadicacion).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                informe.estado === 'Aprobado' ? 'bg-green-100 text-green-700' :
                informe.estado === 'Rechazado' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {informe.estado}
              </span>
              <a href={informe.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-200 rounded">
                <Eye size={16} className="text-slate-600" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
