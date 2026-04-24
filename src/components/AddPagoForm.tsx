import React, { useState } from 'react';
import { Contract, Pago, InterventoriaReport } from '../types';
import { useProject } from '../store/ProjectContext';
import { X, DollarSign, Calendar, Upload, Loader2, ListPlus, FileUp } from 'lucide-react';
import { uploadDocumentToStorage, formatDateForInput } from '../lib/storage';
import { ImportPagosCSV } from './ImportPagosCSV';

interface AddPagoFormProps {
  contracts: Contract[];
  reports?: InterventoriaReport[];
  onClose: () => void;
}

export const AddPagoForm: React.FC<AddPagoFormProps> = ({ contracts, reports = [], onClose }) => {
  const { addPago, addDocument } = useProject();
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [formData, setFormData] = useState<Partial<Pago>>({
    contractId: contracts[0]?.id || '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente',
    valor: 0,
    numero: '',
    observaciones: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.contractId || !formData.valor || !formData.numero) return;

    setIsSubmitting(true);

    try {
      let soporteUrl = formData.soporteUrl;

      if (selectedFile) {
        const folderPath = `Pagos/${formData.contractId}`;
        soporteUrl = await uploadDocumentToStorage(selectedFile, folderPath);
        
        // Add to document repository
        addDocument({
          id: `DOC-PAGO-${Date.now()}`,
          contractId: formData.contractId,
          titulo: `Soporte Pago ${formData.numero}`,
          tipo: 'Soporte Pago',
          fechaCreacion: new Date().toISOString().split('T')[0],
          ultimaActualizacion: new Date().toISOString().split('T')[0],
          estado: 'Aprobado',
          tags: ['Pago', formData.numero],
          folderPath,
          versiones: [{
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: soporteUrl,
            nombreArchivo: selectedFile.name,
            subidoPor: 'Administrador',
            accion: 'Subida',
            estado: 'Aprobado'
          }]
        });
      }

      const newPago: Pago = {
        id: `PAG-${Date.now()}`,
        contractId: formData.contractId!,
        reportId: formData.reportId,
        numero: formData.numero!,
        fecha: formData.fecha!,
        valor: Number(formData.valor),
        estado: formData.estado as any,
        observaciones: formData.observaciones || '',
        soporteUrl,
        cdp: formData.cdp,
        areaEjecutora: formData.areaEjecutora,
        identificacion: formData.identificacion,
        beneficiario: formData.beneficiario,
        banco: formData.banco,
        tipoCuenta: formData.tipoCuenta,
        cuenta: formData.cuenta,
        solicitud: formData.solicitud,
        numeroContratoOriginal: formData.numeroContratoOriginal,
        rc: formData.rc,
        valorDistribuido: formData.valorDistribuido ? Number(formData.valorDistribuido) : undefined,
        resolucion: formData.resolucion,
        fuente: formData.fuente,
        fechaRadicado: formData.fechaRadicado,
        departamento: formData.departamento,
        ciudad: formData.ciudad,
        codigoRubro: formData.codigoRubro,
        rubro: formData.rubro,
        cuentaPago: formData.cuentaPago,
        firma: formData.firma,
        cargo: formData.cargo,
      };

      addPago(newPago);
      onClose();
    } catch (error) {
      console.error("Error saving pago:", error);
      alert("Hubo un error al guardar el pago.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-indigo-600 p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Registrar Pago(s)</h2>
              <p className="text-indigo-100 text-xs">Gestión financiera del contrato y proyectos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="bg-slate-50 p-4 border-b border-slate-200 flex space-x-4">
          <button 
            onClick={() => setActiveTab('single')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'single' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <ListPlus size={16} /> Pago Individual
          </button>
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'bulk' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            <FileUp size={16} /> Carga Masiva (CSV)
          </button>
        </div>

        <div className="p-8 max-h-[70vh] overflow-y-auto">
          {activeTab === 'bulk' ? (
            <ImportPagosCSV contracts={contracts} onComplete={onClose} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contrato en Sistema</label>
                  <select 
                    value={formData.contractId}
                    onChange={e => setFormData({ ...formData, contractId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  >
                    {contracts.map(c => (
                      <option key={c.id} value={c.id}>{c.numero} - {c.contratista}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">No.Pago</label>
                  <input 
                    type="text"
                    value={formData.numero}
                    onChange={e => setFormData({ ...formData, numero: e.target.value })}
                    placeholder="Ej: 83107"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Valor del Pago</label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="number"
                      value={formData.valor}
                      onChange={e => setFormData({ ...formData, valor: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-slate-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</label>
                  <div className="relative">
                    <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="date"
                      value={formatDateForInput(formData.fecha || '')}
                      onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">CDP</label>
                  <input 
                    type="text"
                    value={formData.cdp || ''}
                    onChange={e => setFormData({ ...formData, cdp: e.target.value })}
                    placeholder="Ej: 22-1614"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Área Ejecutora</label>
                  <input 
                    type="text"
                    value={formData.areaEjecutora || ''}
                    onChange={e => setFormData({ ...formData, areaEjecutora: e.target.value })}
                    placeholder="Ej: GAA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identificación</label>
                  <input 
                    type="text"
                    value={formData.identificacion || ''}
                    onChange={e => setFormData({ ...formData, identificacion: e.target.value })}
                    placeholder="Documento Beneficiario"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Beneficiario</label>
                  <input 
                    type="text"
                    value={formData.beneficiario || ''}
                    onChange={e => setFormData({ ...formData, beneficiario: e.target.value })}
                    placeholder="Nombre Completo o Razón Social"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Banco</label>
                  <input 
                    type="text"
                    value={formData.banco || ''}
                    onChange={e => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Ej: BANCO DAVIVIENDA"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tipo Cuenta</label>
                  <input 
                    type="text"
                    value={formData.tipoCuenta || ''}
                    onChange={e => setFormData({ ...formData, tipoCuenta: e.target.value })}
                    placeholder="Ej: AHORROS"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta Número</label>
                  <input 
                    type="text"
                    value={formData.cuenta || ''}
                    onChange={e => setFormData({ ...formData, cuenta: e.target.value })}
                    placeholder="No. de Cuenta"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Solicitud</label>
                  <input 
                    type="text"
                    value={formData.solicitud || ''}
                    onChange={e => setFormData({ ...formData, solicitud: e.target.value })}
                    placeholder="Ej: 9438"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contrato Orig/Texto</label>
                  <input 
                    type="text"
                    value={formData.numeroContratoOriginal || ''}
                    onChange={e => setFormData({ ...formData, numeroContratoOriginal: e.target.value })}
                    placeholder="Ej: 9677-PPAL001..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">RC</label>
                  <input 
                    type="text"
                    value={formData.rc || ''}
                    onChange={e => setFormData({ ...formData, rc: e.target.value })}
                    placeholder="Ej: 20180"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resolución</label>
                  <input 
                    type="text"
                    value={formData.resolucion || ''}
                    onChange={e => setFormData({ ...formData, resolucion: e.target.value })}
                    placeholder="Ej: 012022"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuente</label>
                  <input 
                    type="text"
                    value={formData.fuente || ''}
                    onChange={e => setFormData({ ...formData, fuente: e.target.value })}
                    placeholder="Ej: PRESUPUESTO NACIONAL FUNCIONAMIENTO"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Radicado</label>
                  <input 
                    type="date"
                    value={formatDateForInput(formData.fechaRadicado || '')}
                    onChange={e => setFormData({ ...formData, fechaRadicado: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Departamento</label>
                  <input 
                    type="text"
                    value={formData.departamento || ''}
                    onChange={e => setFormData({ ...formData, departamento: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Ciudad</label>
                  <input 
                    type="text"
                    value={formData.ciudad || ''}
                    onChange={e => setFormData({ ...formData, ciudad: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Código Rubro</label>
                  <input 
                    type="text"
                    value={formData.codigoRubro || ''}
                    onChange={e => setFormData({ ...formData, codigoRubro: e.target.value })}
                    placeholder="Ej: 1AG-1-1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rubro</label>
                  <input 
                    type="text"
                    value={formData.rubro || ''}
                    onChange={e => setFormData({ ...formData, rubro: e.target.value })}
                    placeholder="Ej: PRESTACION DE SERVICIOS..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cuenta Pago (Sys)</label>
                  <input 
                    type="text"
                    value={formData.cuentaPago || ''}
                    onChange={e => setFormData({ ...formData, cuentaPago: e.target.value })}
                    placeholder="Ej: FA-2846"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Firma</label>
                  <input 
                    type="text"
                    value={formData.firma || ''}
                    onChange={e => setFormData({ ...formData, firma: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cargo</label>
                  <input 
                    type="text"
                    value={formData.cargo || ''}
                    onChange={e => setFormData({ ...formData, cargo: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>


              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</label>
                  <select 
                    value={formData.estado}
                    onChange={e => setFormData({ ...formData, estado: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  >
                    <option value="Pendiente">Pendiente</option>
                    <option value="Pagado">Pagado</option>
                    <option value="Rechazado">Rechazado</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Soporte del Pago</label>
                  <div className="relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="soporte-upload"
                    />
                    <label
                      htmlFor="soporte-upload"
                      className="flex items-center justify-center gap-2 w-full bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl px-4 py-3 text-sm hover:bg-slate-100 hover:border-indigo-400 transition-all cursor-pointer"
                    >
                      <Upload size={18} className="text-slate-400" />
                      <span className="text-slate-600 font-medium truncate max-w-[200px]">
                        {selectedFile ? selectedFile.name : 'Subir documento'}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Observaciones</label>
                <textarea 
                  value={formData.observaciones}
                  onChange={e => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  placeholder="Observación del pago..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white border-t border-slate-100 p-4 -mx-8 -mb-8">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-6 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar Pago'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

