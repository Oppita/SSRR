import React, { useRef } from 'react';
import { FileText, Download, Printer, X, CheckCircle2 } from 'lucide-react';
import { Project, ProjectMatrix } from '../types';

interface DocumentGeneratorProps {
  project: Project;
  type: 'CDP' | 'Informe' | 'Contrato' | 'RC';
  onClose: () => void;
}

export const DocumentGenerator: React.FC<DocumentGeneratorProps> = ({ project, type, onClose }) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const printWindow = window.open(windowUrl, windowName, 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${type} - ${project.nombre}</title>
            <style>
              body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; line-height: 1.6; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 24px; font-weight: bold; color: #1e40af; }
              .doc-title { font-size: 20px; font-weight: bold; margin-top: 10px; text-transform: uppercase; }
              .section { margin-bottom: 25px; }
              .section-title { font-weight: bold; border-bottom: 1px solid #ccc; margin-bottom: 10px; padding-bottom: 5px; text-transform: uppercase; font-size: 14px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .field { margin-bottom: 8px; }
              .label { font-weight: bold; color: #666; font-size: 12px; }
              .value { font-size: 14px; }
              .footer { margin-top: 100px; display: flex; justify-content: space-around; }
              .signature { border-top: 1px solid #000; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() { window.print(); window.close(); }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const renderCDP = () => (
    <div className="p-8 bg-white text-slate-800" ref={printRef}>
      <div className="header">
        <div className="logo">UNGRD</div>
        <div className="text-sm text-slate-500">Unidad Nacional para la Gestión del Riesgo de Desastres</div>
        <div className="doc-title">Certificado de Disponibilidad Presupuestal (CDP)</div>
        <div className="text-xs mt-2">No. CDP-${project.id.substring(0, 8).toUpperCase()}</div>
      </div>

      <div className="section">
        <div className="section-title">Información General</div>
        <div className="grid">
          <div className="field">
            <div className="label">Proyecto</div>
            <div className="value font-bold">{project.nombre}</div>
          </div>
          <div className="field">
            <div className="label">Fecha de Emisión</div>
            <div className="value">{new Date().toLocaleDateString('es-CO')}</div>
          </div>
          <div className="field">
            <div className="label">Departamento</div>
            <div className="value">{project.departamento}</div>
          </div>
          <div className="field">
            <div className="label">Municipio</div>
            <div className="value">{project.municipio}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Detalles Presupuestales</div>
        <div className="grid">
          <div className="field">
            <div className="label">Valor Solicitado</div>
            <div className="value font-bold text-lg">$${(project.matrix?.valorContratoObra || 0).toLocaleString('es-CO')}</div>
          </div>
          <div className="field">
            <div className="label">Rubro Presupuestal</div>
            <div className="value">{project.matrix?.cdpConvenio || 'POR DEFINIR'}</div>
          </div>
          <div className="field">
            <div className="label">Vigencia</div>
            <div className="value">{new Date().getFullYear()}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Objeto</div>
        <div className="value text-sm text-justify">
          Garantizar la disponibilidad de recursos para la ejecución del proyecto denominado "{project.nombre}", 
          ubicado en el municipio de {project.municipio}, departamento de {project.departamento}. 
          Este certificado respalda el compromiso financiero para la contratación de obra e interventoría según los estudios previos aprobados.
        </div>
      </div>

      <div className="footer">
        <div className="signature">
          <div>Coordinador Financiero</div>
          <div className="mt-1 text-[10px] text-slate-400">Firma Electrónica</div>
        </div>
        <div className="signature">
          <div>Ordenador del Gasto</div>
          <div className="mt-1 text-[10px] text-slate-400">Firma Electrónica</div>
        </div>
      </div>
    </div>
  );

  const renderInforme = () => (
    <div className="p-8 bg-white text-slate-800" ref={printRef}>
      <div className="header">
        <div className="logo">UNGRD</div>
        <div className="text-sm text-slate-500">Unidad Nacional para la Gestión del Riesgo de Desastres</div>
        <div className="doc-title">Informe Ejecutivo de Seguimiento</div>
        <div className="text-xs mt-2">Fecha: {new Date().toLocaleDateString('es-CO')}</div>
      </div>

      <div className="section">
        <div className="section-title">Identificación del Proyecto</div>
        <div className="grid">
          <div className="field">
            <div className="label">Nombre</div>
            <div className="value font-bold">{project.nombre}</div>
          </div>
          <div className="field">
            <div className="label">Estado Actual</div>
            <div className="value">{project.estado}</div>
          </div>
          <div className="field">
            <div className="label">Ubicación</div>
            <div className="value">{project.municipio}, {project.departamento}</div>
          </div>
          <div className="field">
            <div className="label">Responsable OPS</div>
            <div className="value">{project.responsableOpsId || 'No asignado'}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Avances de Ejecución</div>
        <div className="grid">
          <div className="field">
            <div className="label">Avance Físico</div>
            <div className="value font-bold">{project.avanceFisico}%</div>
          </div>
          <div className="field">
            <div className="label">Avance Financiero</div>
            <div className="value font-bold">{project.avanceFinanciero}%</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Detalles de Contratación</div>
        <div className="grid">
          <div className="field">
            <div className="label">Contratista Obra</div>
            <div className="value">{project.matrix?.contratistaObra || 'N/A'}</div>
          </div>
          <div className="field">
            <div className="label">Valor Contrato</div>
            <div className="value">${(project.matrix?.valorContratoObra || 0).toLocaleString('es-CO')}</div>
          </div>
          <div className="field">
            <div className="label">Interventoría</div>
            <div className="value">{project.matrix?.contratistaInterventoria || 'N/A'}</div>
          </div>
          <div className="field">
            <div className="label">Número Contrato</div>
            <div className="value">{project.matrix?.numeroContratoObra || 'N/A'}</div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Observaciones Técnicas</div>
        <div className="value text-sm">
          {project.alcance || 'Sin observaciones adicionales registradas en el sistema.'}
        </div>
      </div>

      <div className="footer">
        <div className="signature">
          <div>Responsable Técnico</div>
        </div>
        <div className="signature">
          <div>Supervisor de Proyecto</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="text-indigo-400" size={24} />
            <div>
              <h3 className="font-bold">Vista Previa de Documento Institucional</h3>
              <p className="text-xs text-slate-400">Generación automática basada en matriz de datos</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-100 p-8">
          <div className="max-w-[210mm] mx-auto shadow-xl">
            {type === 'CDP' && renderCDP()}
            {type === 'Informe' && renderInforme()}
            {/* Add more types as needed */}
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-all"
          >
            Cerrar
          </button>
          <button 
            onClick={handlePrint}
            className="px-6 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <Printer size={18} />
            Imprimir / Guardar PDF
          </button>
          <button 
            className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <CheckCircle2 size={18} />
            Firmar y Radicar
          </button>
        </div>
      </div>
    </div>
  );
};
