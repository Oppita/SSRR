import React, { useRef, useState } from 'react';
import { ProjectDocument, DocumentType } from '../types';
import { useProject } from '../store/ProjectContext';
import { X, Upload, FileText, Loader2 } from 'lucide-react';
import { uploadDocumentToStorage } from '../lib/storage';

interface AttachDocumentModalProps {
  projectId: string;
  convenioId?: string;
  contractId?: string;
  otrosiId?: string;
  onClose: () => void;
  entityName: string;
}

export const AttachDocumentModal: React.FC<AttachDocumentModalProps> = ({
  projectId,
  convenioId,
  contractId,
  otrosiId,
  onClose,
  entityName
}) => {
  const { state, addDocument } = useProject();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('Soporte Financiero (CDP, RP)');
  const [description, setDescription] = useState('');

  const project = state.proyectos.find(p => p.id === projectId);

  const documentTypes: DocumentType[] = [
    'Soporte Financiero (CDP, RP)',
    'CDP',
    'RC',
    'RP',
    'Convenio',
    'Contrato',
    'Otrosí',
    'Acta',
    'Acta de Comité',
    'Informe',
    'Permiso Ambiental',
    'Suspensión',
    'Evidencia',
    'Póliza',
    'Garantía',
    'Factura',
    'Soporte de Pago'
  ] as DocumentType[];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !project) return;

    setIsUploading(true);
    try {
      const folderPath = `${project.nombre}/${selectedType}`;
      const publicUrl = await uploadDocumentToStorage(file, folderPath);

      const newDoc: ProjectDocument = {
        id: `DOC-${Date.now()}`,
        projectId,
        convenioId,
        contractId,
        otrosiId,
        titulo: file.name.split('.')[0],
        tipo: selectedType,
        descripcion: description || `Documento adjunto a ${entityName}`,
        fechaCreacion: new Date().toISOString().split('T')[0],
        ultimaActualizacion: new Date().toISOString().split('T')[0],
        folderPath,
        versiones: [
          {
            id: `VER-${Date.now()}`,
            version: 1,
            fecha: new Date().toISOString().split('T')[0],
            url: publicUrl,
            nombreArchivo: file.name,
            subidoPor: 'Usuario',
            accion: 'Subida',
            estado: 'Borrador'
          }
        ],
        tags: [],
        estado: 'Borrador'
      };
      
      addDocument(newDoc);
      onClose();
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Error al subir el documento. Por favor, intente de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Adjuntar Documento</h3>
              <p className="text-xs text-slate-500">A: {entityName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Documento</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as DocumentType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {documentTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Descripción (Opcional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
              rows={3}
              placeholder="Breve descripción del documento..."
            />
          </div>

          <div className="pt-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload size={18} />
                  Seleccionar Archivo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
