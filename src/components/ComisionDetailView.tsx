import React, { useState } from 'react';
import { Comision, Professional } from '../types';
import { useProject } from '../store/ProjectContext';
import { FileText, Upload, CheckCircle2, X, Trash2 } from 'lucide-react';
import { analyzeCommissionReport } from '../services/geminiService';

interface ComisionDetailViewProps {
  comision: Comision;
  professionals: Professional[];
  onClose: () => void;
}

export const ComisionDetailView: React.FC<ComisionDetailViewProps> = ({ comision, professionals, onClose }) => {
  const { state, updateComision, deleteComision } = useProject();
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // In a real app, you'd upload the file to storage first
      // For now, we'll assume we can pass the file content to the AI service
      const extractedData = await analyzeCommissionReport(file);
      
      const updatedComision = {
        ...comision,
        informe: extractedData
      };
      
      updateComision(updatedComision);
    } catch (error) {
      console.error('Error extracting report data:', error);
      alert('Error al extraer datos del informe.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold">Detalle de Comisión: {comision.municipios || 'Sin destino'}</h3>
            <button 
              onClick={() => {
                if (confirm('¿Está seguro de eliminar esta comisión?')) {
                  deleteComision(comision.id);
                  onClose();
                }
              }}
              className="px-3 py-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
          <button onClick={onClose} className="text-indigo-200 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
          <div className="flex justify-between items-start">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Responsable</p>
                <p className="text-slate-800 font-bold">{comision.responsableNombre}</p>
                <p className="text-xs text-slate-500">{comision.tipoVinculacion}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Ubicación</p>
                <p className="text-slate-800">{comision.municipios}</p>
                <p className="text-xs text-slate-500">{comision.departamento}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Fechas</p>
                <p className="text-slate-800">{comision.fechaInicio} al {comision.fechaFin}</p>
                <p className="text-xs text-slate-500">{comision.numeroDias} días ({comision.anio})</p>
              </div>
            </div>
            <div className="ml-6">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Estado de Comisión</p>
              <select 
                value={comision.estado}
                onChange={(e) => updateComision({ ...comision, estado: e.target.value as any })}
                className={`text-xs font-bold px-3 py-2 rounded-lg border outline-none transition-all ${
                  comision.estado === 'Ejecutada' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  comision.estado === 'Cancelada' || comision.estado === 'Rechazada' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  comision.estado === 'En Curso' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                  'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <option value="Programada">Programada</option>
                <option value="En Curso">En Curso</option>
                <option value="Ejecutada">Ejecutada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Rechazada">Rechazada</option>
              </select>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase">Objeto de la Comisión</p>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 mt-1">{comision.objeto}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">Plan de Trabajo</h4>
              <ul className="space-y-2">
                {comision.planTrabajo1 && <li className="text-sm text-slate-600 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" /> {comision.planTrabajo1}</li>}
                {comision.planTrabajo2 && <li className="text-sm text-slate-600 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" /> {comision.planTrabajo2}</li>}
                {comision.planTrabajo3 && <li className="text-sm text-slate-600 flex gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" /> {comision.planTrabajo3}</li>}
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 border-b pb-2">Gestión y Soporte</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Autorización</p>
                  <p className="font-bold text-slate-700">{comision.autorizadoVB}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Días Gestión</p>
                  <p className="font-bold text-slate-700">{comision.diasGestionHabiles} días hábiles</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Transporte</p>
                  <p className="font-bold text-slate-700">{comision.transporteTerrestre ? 'Terrestre' : 'Aéreo'}</p>
                  {comision.rutaAerea !== 'N.A' && <p className="text-xs text-slate-500">{comision.rutaAerea}</p>}
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Soporte</p>
                  {comision.linkSoporte ? (
                    <a href={comision.linkSoporte} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline font-bold">Ver Soporte</a>
                  ) : (
                    <p className="text-slate-400">Sin link</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-bold text-slate-800 mb-4">Costos y Viáticos</h4>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-slate-500 uppercase">Costo Profesionales</p>
                <p className="text-lg font-bold text-slate-800">${comision.costoProfesionales?.toLocaleString('es-CO')}</p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-xl">
                <p className="text-xs font-bold text-indigo-500 uppercase">Costo Total</p>
                <p className="text-lg font-bold text-indigo-700">${comision.costoTotal?.toLocaleString('es-CO')}</p>
              </div>
            </div>
            
            {comision.viaticosDetalle && comision.viaticosDetalle.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Profesional</th>
                      <th className="p-3">Días</th>
                      <th className="p-3">Tarifa Diaria</th>
                      <th className="p-3">Total Viáticos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comision.viaticosDetalle.map((detalle, idx) => {
                      const prof = professionals.find(p => p.id === detalle.professionalId);
                      return (
                        <tr key={idx}>
                          <td className="p-3">{prof?.nombre || 'Desconocido'}</td>
                          <td className="p-3">{detalle.dias}</td>
                          <td className="p-3">${detalle.tarifaDiaria.toLocaleString('es-CO')}</td>
                          <td className="p-3 font-bold">${detalle.total.toLocaleString('es-CO')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-6">
            <h4 className="font-bold text-slate-800 mb-4">Informe de Comisión</h4>
            {comision.informe ? (
              <div className="bg-slate-50 p-4 rounded-xl space-y-2">
                <p><strong>Actividades:</strong> {comision.informe.actividades}</p>
                <p><strong>Hallazgos:</strong> {comision.informe.hallazgos}</p>
                <p><strong>Conclusiones:</strong> {comision.informe.conclusiones}</p>
                <p><strong>Recomendaciones:</strong> {comision.informe.recomendaciones}</p>
                <p className="text-xs text-slate-400 mt-4">Fecha de generación: {comision.informe.fechaGeneracion}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
                <Upload className="mx-auto text-slate-400 mb-2" size={32} />
                <p className="text-slate-500 mb-4">No hay informe cargado. Sube el documento oficial.</p>
                <input 
                  type="file" 
                  accept=".pdf,.docx" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  id="report-upload"
                />
                <label 
                  htmlFor="report-upload" 
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-indigo-700"
                >
                  {isUploading ? 'Analizando...' : 'Subir Informe'}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
